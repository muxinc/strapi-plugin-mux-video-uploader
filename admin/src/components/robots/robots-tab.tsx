import React from 'react';
import { Box, Button, Flex, Loader, Typography } from '@strapi/design-system';
import { ArrowClockwise, Play } from '@strapi/icons';
import { useNotification } from '@strapi/strapi/admin';

import type { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
import { assetContextFrom, readyCaptionTracks, RobotsWorkflow } from '../../../../types/robots-catalog';
import {
  isPlaceholderRow,
  isUnfinishedRow,
  RobotsCapability,
  RobotsDirectiveSummary,
  RobotsErrorBody,
  RobotsJobRow,
  RobotsRowResponse,
} from '../../../../types/robots';
import { robotsErrorOf, useRobotsApi } from './api';
import { UnavailableNote, UnitsExhaustedNote } from './capability-note';
import DirectiveModal from './directive-modal';
import DirectiveRunTable from './directive-run-table';
import { useRobotsIntl } from './intl';
import JobTable from './job-table';
import Note from './note';
import OutputViewer from './output-viewer';
import RunModal, { RunOutcome } from './run-modal';

/** Polls read the plugin's own table, never Mux. */
const ROBOTS_POLL_INTERVAL_MS = 4000;

/** How many polls a placeholder keeps the loop alive for, so its job can be found. */
const PLACEHOLDER_CHECKS = 15;

/**
 * How many polls read the video again after the read when a job completes: Strapi's own read from Mux
 * may still be running, and Mux can add a track (captions, chapters) a little later.
 */
const ASSET_REREADS = 2;

/** A sync slower than this shows the stored rows while it finishes. */
const SLOW_SYNC_MS = 1000;

interface RobotsTabProps {
  muxAsset: MuxAsset;
  canRun: boolean;
  /** Called after a job completes: it may have added tracks, chapters, a description or tags. */
  onAssetMayHaveChanged: () => void;
}

export default function RobotsTab({ muxAsset, canRun, onAssetMayHaveChanged }: RobotsTabProps) {
  const api = useRobotsApi();
  const { t } = useRobotsIntl();
  const { toggleNotification } = useNotification();

  // Polls call the latest callback, not the one from when they were scheduled: the parent's decides
  // from the Details form's current state.
  const onAssetMayHaveChangedRef = React.useRef(onAssetMayHaveChanged);
  onAssetMayHaveChangedRef.current = onAssetMayHaveChanged;

  const ready = !!muxAsset.isReady && !!muxAsset.asset_id;
  const videoTitle = muxAsset.title || muxAsset.asset_id || '';
  const assetData = muxAsset.asset_data as Parameters<typeof assetContextFrom>[0];
  const context = React.useMemo(() => assetContextFrom(assetData), [assetData]);
  const captions = React.useMemo(
    () =>
      readyCaptionTracks(
        assetData as { tracks?: Array<{ id?: string; name?: string; language_code?: string }> }
      ).flatMap((track) => (track.id ? [{ id: track.id, name: track.name, language_code: track.language_code }] : [])),
    [assetData]
  );

  const [loading, setLoading] = React.useState(ready);
  const [capability, setCapability] = React.useState<RobotsCapability>('ok');
  const [termsUrl, setTermsUrl] = React.useState<string>();
  const [rows, setRows] = React.useState<RobotsJobRow[]>([]);
  const [readError, setReadError] = React.useState<RobotsErrorBody['error']>();
  const [unitsExhausted, setUnitsExhausted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [runOpen, setRunOpen] = React.useState(false);
  const [directiveOpen, setDirectiveOpen] = React.useState(false);
  const [directives, setDirectives] = React.useState<RobotsDirectiveSummary[]>();
  const [directivesError, setDirectivesError] = React.useState<string>();
  const [viewing, setViewing] = React.useState<RobotsJobRow>();
  const [cancellingIds, setCancellingIds] = React.useState<number[]>([]);
  const [loadingDetailIds, setLoadingDetailIds] = React.useState<number[]>([]);
  const [nowMs, setNowMs] = React.useState(() => Date.now());

  const rowsRef = React.useRef<RobotsJobRow[]>([]);
  const rereadsLeft = React.useRef(0);
  const placeholderChecksLeft = React.useRef(PLACEHOLDER_CHECKS);
  const directivesRequested = React.useRef(false);

  const showRows = React.useCallback((next: RobotsJobRow[]) => {
    rowsRef.current = next;
    setRows(next);
    setNowMs(Date.now());
  }, []);

  const replaceRow = React.useCallback(
    (row: RobotsJobRow) => {
      const current = rowsRef.current;
      showRows(
        current.some((existing) => existing.id === row.id)
          ? current.map((existing) => (existing.id === row.id ? row : existing))
          : [row, ...current]
      );
    },
    [showRows]
  );

  const reloadRows = React.useCallback(async () => {
    try {
      showRows((await api.listJobs(muxAsset.id)).rows);
    } catch {
      // The next poll or Refresh tries again.
    }
  }, [api, muxAsset.id, showRows]);

  /** The only Mux read: when the tab opens, and on Refresh. */
  const sync = React.useCallback(async () => {
    setLoading(true);
    let synced = false;

    // While a slow Mux read is pending, show what Strapi already has stored.
    const storedRowsTimer = setTimeout(async () => {
      try {
        const { rows: stored } = await api.listJobs(muxAsset.id);
        if (!synced) showRows(stored);
      } catch {
        // The sync answers with the same rows.
      }
    }, SLOW_SYNC_MS);

    try {
      const result = await api.sync(muxAsset.id);
      synced = true;
      setCapability(result.capability);
      setTermsUrl(result.termsUrl);
      setReadError(result.error);
      placeholderChecksLeft.current = PLACEHOLDER_CHECKS;
      showRows(result.rows);
    } catch (error) {
      setReadError(robotsErrorOf(error));
    } finally {
      synced = true;
      clearTimeout(storedRowsTimer);
      setLoading(false);
    }
  }, [api, muxAsset.id, showRows]);

  React.useEffect(() => {
    if (ready) sync();
    else setLoading(false);
  }, [ready, muxAsset.id]);

  const jobs = rows.filter((row) => !row.is_directive_run);
  const runs = rows.filter((row) => row.is_directive_run);
  const placeholders = rows.filter(isPlaceholderRow);

  const shouldPoll =
    ready &&
    !loading &&
    capability === 'ok' &&
    (rows.some((row) => isUnfinishedRow(row, nowMs)) ||
      (placeholders.length > 0 && placeholderChecksLeft.current > 0) ||
      rereadsLeft.current > 0);

  // A timeout rather than an interval: each poll re-renders, which schedules the next while `shouldPoll` holds.
  React.useEffect(() => {
    if (!shouldPoll) return;

    const timer = setTimeout(async () => {
      if (rereadsLeft.current > 0) {
        rereadsLeft.current -= 1;
        onAssetMayHaveChangedRef.current();
      }
      if (rowsRef.current.some(isPlaceholderRow)) placeholderChecksLeft.current -= 1;

      try {
        const { rows: fresh } = await api.listJobs(muxAsset.id);
        const previous = rowsRef.current;
        const completedNow = fresh.some(
          (row) =>
            !row.is_directive_run &&
            row.status === 'completed' &&
            previous.find((before) => before.id === row.id)?.status !== 'completed'
        );
        showRows(fresh);
        // The player shows what the job changed without waiting for the next poll.
        if (completedNow) {
          rereadsLeft.current = ASSET_REREADS;
          onAssetMayHaveChangedRef.current();
        }
      } catch {
        setNowMs(Date.now());
      }
    }, ROBOTS_POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [shouldPoll, rows, nowMs]);

  // A failed listing is asked again the next time it's needed: opening "Run a directive", or a poll.
  const loadDirectives = React.useCallback(async () => {
    if (directivesRequested.current) return;
    directivesRequested.current = true;
    setDirectivesError(undefined);
    try {
      const result = await api.listDirectives();
      if (result.error) {
        directivesRequested.current = false;
        setDirectivesError(result.error.message);
      } else setDirectives(result.directives);
    } catch (error) {
      directivesRequested.current = false;
      setDirectivesError(robotsErrorOf(error).message);
    }
  }, [api]);

  // Directive names, fetched only once Mux is known to answer for Robots.
  React.useEffect(() => {
    if (!loading && capability === 'ok' && rows.some((row) => row.directive_id)) loadDirectives();
  }, [rows, loading, capability, loadDirectives]);

  const directiveNames = React.useMemo(
    () => Object.fromEntries((directives ?? []).map((directive) => [directive.id, directive.name])),
    [directives]
  );

  const handleCreateError = (error: RobotsErrorBody['error']) => {
    switch (error.reason) {
      case 'scope-missing':
      case 'not-enabled':
        setCapability(error.reason);
        setTermsUrl(error.termsUrl);
        break;
      case 'units-exhausted':
        setUnitsExhausted(true);
        break;
      case 'invalid-parameters':
        // The run form shows it: under the form, or as a toast if the form has gone.
        break;
      default:
        toggleNotification({ type: error.reason === 'create-pending' ? 'warning' : 'danger', message: error.message });
    }
  };

  const afterCreate = (result: RobotsRowResponse) => {
    setUnitsExhausted(false);
    placeholderChecksLeft.current = PLACEHOLDER_CHECKS;
    replaceRow(result.row);
    if (result.unconfirmed) {
      toggleNotification({
        type: 'warning',
        message: t(
          'Robots.unconfirmed.toast',
          "Mux didn't confirm the run. It may still start; the tab will show it if it does."
        ),
      });
    }
  };

  const createRun = async (
    create: () => Promise<RobotsRowResponse>,
    showError: (error: RobotsErrorBody['error']) => void
  ): Promise<RunOutcome> => {
    setBusy(true);
    try {
      afterCreate(await create());
      return { ok: true };
    } catch (thrown) {
      const error = robotsErrorOf(thrown);
      showError(error);
      if (error.reason === 'create-pending') reloadRows();
      return { ok: false, reason: error.reason, message: error.message };
    } finally {
      setBusy(false);
    }
  };

  const runWorkflow = (workflow: RobotsWorkflow, values: Record<string, unknown>) =>
    createRun(() => api.createJob(muxAsset.id, workflow, values), handleCreateError);

  // The directive modal has no form to show `invalid-parameters` under, so it's reported like any other refusal.
  const runDirective = (directiveId: string) =>
    createRun(
      () => api.runDirective(muxAsset.id, directiveId),
      (error) => handleCreateError(error.reason === 'invalid-parameters' ? { ...error, reason: 'mux-error' } : error)
    );

  const notifyError = (error: unknown) => toggleNotification({ type: 'danger', message: robotsErrorOf(error).message });

  const replaceRowFrom = async (
    row: RobotsJobRow,
    setBusyIds: React.Dispatch<React.SetStateAction<number[]>>,
    request: (rowId: number) => Promise<RobotsRowResponse>
  ) => {
    setBusyIds((ids) => [...ids, row.id]);
    try {
      replaceRow((await request(row.id)).row);
    } catch (error) {
      notifyError(error);
    } finally {
      setBusyIds((ids) => ids.filter((id) => id !== row.id));
    }
  };

  const cancel = (row: RobotsJobRow) => replaceRowFrom(row, setCancellingIds, api.cancelJob);
  const loadDetail = (row: RobotsJobRow) => replaceRowFrom(row, setLoadingDetailIds, api.loadJob);

  const dismiss = async (row: RobotsJobRow) => {
    try {
      await api.dismissPending(row.id);
    } catch (error) {
      notifyError(error);
    }
    reloadRows();
  };

  if (!ready) {
    return <Note>{t('Robots.not-ready', 'Robots can run once the video is ready.')}</Note>;
  }

  if (capability !== 'ok') {
    return <UnavailableNote capability={capability} termsUrl={termsUrl} />;
  }

  const waitingReason = t(
    'Robots.blocked.pending',
    "Mux hasn't confirmed an earlier run on this video yet. Wait for it, or tell the plugin nothing is running."
  );
  const workflowWaiting = placeholders.some((row) => !row.is_directive_run) ? waitingReason : undefined;
  const directiveWaiting = placeholders.length > 0 ? waitingReason : undefined;
  const busyReason = t('Robots.blocked.busy', 'Starting a run…');
  const workflowBlocked = busy ? busyReason : workflowWaiting;
  const directiveBlocked = busy ? busyReason : directiveWaiting;

  return (
    <Flex direction="column" alignItems="stretch" gap={4}>
      {readError && (
        <Note variant={readError.reason === 'unconfirmed' ? 'warning' : 'danger'}>
          {readError.reason === 'unconfirmed'
            ? t(
                'Robots.read.unreachable',
                "Couldn't reach Mux. This shows what Strapi has stored; Refresh to try again."
              )
            : readError.message}
        </Note>
      )}

      {unitsExhausted && <UnitsExhaustedNote />}

      <Flex gap={2} wrap="wrap" alignItems="center">
        {canRun && (
          <>
            <Button
              startIcon={<Play />}
              disabled={!!workflowBlocked}
              title={workflowBlocked}
              onClick={() => setRunOpen(true)}
            >
              {t('Robots.actions.run-workflow', 'Run a workflow')}
            </Button>
            <Button
              variant="secondary"
              disabled={!!directiveBlocked}
              title={directiveBlocked}
              onClick={() => {
                loadDirectives();
                setDirectiveOpen(true);
              }}
            >
              {t('Robots.actions.run-directive', 'Run a directive')}
            </Button>
          </>
        )}
        <Button variant="tertiary" startIcon={<ArrowClockwise />} loading={loading} onClick={() => sync()}>
          {t('Robots.actions.refresh', 'Refresh')}
        </Button>
      </Flex>

      {!canRun && (
        <Note>
          {t(
            'Robots.permission.note',
            'You can see Robots results here. Running workflows needs the Run Robots permission. A Super Admin can add it to your role in Settings → Roles.'
          )}
        </Note>
      )}

      {loading && rows.length === 0 ? (
        <Loader small>{t('Robots.loading', 'Loading…')}</Loader>
      ) : (
        <>
          <Section title={t('Robots.jobs.title', 'Jobs')}>
            <JobTable
              rows={jobs}
              directiveNames={directiveNames}
              canRun={canRun}
              nowMs={nowMs}
              cancellingIds={cancellingIds}
              loadingDetailIds={loadingDetailIds}
              onCancel={cancel}
              onViewOutput={setViewing}
              onLoadDetail={loadDetail}
              onDismiss={dismiss}
            />
          </Section>
          <Section title={t('Robots.runs.title', 'Directive runs')}>
            <DirectiveRunTable
              rows={runs}
              jobs={jobs}
              directiveNames={directiveNames}
              nowMs={nowMs}
              canRun={canRun}
              onDismiss={dismiss}
            />
          </Section>
        </>
      )}

      <RunModal
        isOpen={runOpen}
        onClose={() => setRunOpen(false)}
        onRun={runWorkflow}
        videoTitle={videoTitle}
        context={context}
        captions={captions}
        blockedReason={workflowWaiting}
      />

      <DirectiveModal
        isOpen={directiveOpen}
        onClose={() => setDirectiveOpen(false)}
        onRun={runDirective}
        videoTitle={videoTitle}
        directives={directives}
        loadError={directivesError}
        blockedReason={directiveWaiting}
      />

      <OutputViewer row={viewing} api={api} onRowLoaded={replaceRow} onClose={() => setViewing(undefined)} />
    </Flex>
  );
}

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <Box>
      <Box paddingBottom={2}>
        <Typography variant="delta" tag="h3">
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}
