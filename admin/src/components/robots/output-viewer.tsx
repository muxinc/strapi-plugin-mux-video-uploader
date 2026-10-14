import React from 'react';
import copy from 'copy-to-clipboard';
import { Box, Button, Dialog, Flex, IconButton, Loader, Modal, Tabs, Typography } from '@strapi/design-system';
import { Duplicate } from '@strapi/icons';
import { useNotification } from '@strapi/strapi/admin';

import type { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
import { workflowLabel } from '../../../../types/robots-catalog';
import { toAssetTitle } from '../../../../types/robots-format';
import { firstErrorMessage, isTerminalRow, RobotsJobRow, unitsState } from '../../../../types/robots';
import { RobotsApi, robotsErrorOf } from './api';
import { EM_DASH, prettyJson, withoutTemporaryUrls } from './format';
import { useRobotsIntl } from './intl';
import Note from './note';
import { OUTPUT_VIEWS } from './output-views';
import StatusBadge from './status-badge';
import { Started } from './table';

interface OutputViewerProps {
  row?: RobotsJobRow;
  api: RobotsApi;
  assetRowId: number;
  canUpdate: boolean;
  /** The row read in full from Mux, so the table stops saying "Not loaded". */
  onRowLoaded: (row: RobotsJobRow) => void;
  onTitleApplied: (asset: MuxAsset) => void;
  onClose: () => void;
}

/** The job in Mux's own shape, for the Raw JSON tab. */
const rawJob = (row: RobotsJobRow) =>
  withoutTemporaryUrls({
    id: row.mux_id,
    workflow: row.workflow,
    status: row.status,
    created_at: row.mux_created_at,
    updated_at: row.mux_updated_at,
    units_consumed: row.units_consumed,
    directive: row.directive_id ? { id: row.directive_id, run_id: row.directive_run_id } : undefined,
    parameters: row.parameters,
    outputs: row.outputs,
    errors: row.errors,
  });

function JsonBlock({ value }: { value: unknown }) {
  const { t } = useRobotsIntl();
  const { toggleNotification } = useNotification();
  const text = prettyJson(value);

  if (!text)
    return <Note variant="warning">{t('Robots.output.no-json', 'There is nothing here to show as JSON.')}</Note>;

  return (
    <Box position="relative">
      <Box position="absolute" top={2} right={2}>
        <IconButton
          label={t('Robots.output.copy-json', 'Copy JSON')}
          variant="tertiary"
          onClick={() => {
            copy(text);
            toggleNotification({ type: 'success', message: t('Robots.output.copied', 'Copied to clipboard') });
          }}
        >
          <Duplicate />
        </IconButton>
      </Box>
      <Box
        tag="pre"
        background="neutral100"
        hasRadius
        padding={4}
        style={{ overflow: 'auto', maxHeight: '50vh', fontFamily: 'monospace', fontSize: '1.2rem', margin: 0 }}
      >
        {text}
      </Box>
    </Box>
  );
}

function Result({
  row,
  canUpdate,
  onUseAsTitle,
}: {
  row: RobotsJobRow;
  canUpdate: boolean;
  onUseAsTitle: (title: string) => void;
}) {
  const { t } = useRobotsIntl();

  if (row.status === 'errored') {
    return (
      <Note variant="danger">
        {firstErrorMessage(row.errors) ?? t('Robots.output.failed', 'This job failed without a message.')}
      </Note>
    );
  }
  if (row.status === 'cancelled') return <Note>{t('Robots.output.cancelled', 'This job was cancelled.')}</Note>;
  if (row.status !== 'completed') {
    return <Note>{t('Robots.output.still-running', 'This job is still {status}.', { status: row.status })}</Note>;
  }

  const outputs = withoutTemporaryUrls(row.outputs ?? {}) as Record<string, unknown>;
  const view = OUTPUT_VIEWS[row.workflow ?? ''];

  if (!view) return <JsonBlock value={outputs} />;

  if (!view.hasContent(outputs, row)) {
    const isEmpty = Object.keys(outputs).length === 0;
    return (
      <Flex direction="column" alignItems="stretch" gap={3}>
        <Note variant="warning">
          {isEmpty
            ? t('Robots.output.empty', 'Mux reports this job as completed but returned no output for it.')
            : t(
                'Robots.output.unknown-shape',
                "This job's output isn't in a shape this view can draw. Here is what it returned."
              )}
        </Note>
        {!isEmpty && <JsonBlock value={outputs} />}
      </Flex>
    );
  }

  const generatedTitle = row.workflow === 'summarize' && typeof outputs.title === 'string' ? outputs.title : undefined;
  const title = toAssetTitle(generatedTitle);

  return (
    <>
      {view.render(outputs, row, t)}
      {generatedTitle !== undefined && canUpdate && (
        <Flex gap={3} alignItems="center">
          <Button variant="secondary" disabled={!title} onClick={() => title && onUseAsTitle(title)}>
            {t('Robots.output.use-as-title', 'Use as video title')}
          </Button>
          {!title && (
            <Typography variant="pi" textColor="neutral600">
              {t('Robots.output.title-too-short', 'The generated title is shorter than 3 characters.')}
            </Typography>
          )}
        </Flex>
      )}
    </>
  );
}

export default function OutputViewer({
  row,
  api,
  assetRowId,
  canUpdate,
  onRowLoaded,
  onTitleApplied,
  onClose,
}: OutputViewerProps) {
  const { t } = useRobotsIntl();
  const { toggleNotification } = useNotification();
  const [loaded, setLoaded] = React.useState<RobotsJobRow>();
  const [loadError, setLoadError] = React.useState<string>();
  const [pendingTitle, setPendingTitle] = React.useState<string>();
  const [savingTitle, setSavingTitle] = React.useState(false);

  const rowId = row?.id;
  const needsDetail = !!row && isTerminalRow(row) && !row.detail_loaded && row.status !== 'cancelled';

  // Keyed on the row's id, not on the object the table rebuilds on every poll, so Mux is read once.
  React.useEffect(() => {
    setLoaded(undefined);
    setLoadError(undefined);
    if (!rowId || !needsDetail) return;

    let cancelled = false;
    api
      .loadJob(rowId)
      .then(({ row: fresh }) => {
        if (cancelled) return;
        setLoaded(fresh);
        onRowLoaded(fresh);
      })
      .catch((error) => !cancelled && setLoadError(robotsErrorOf(error).message));

    return () => {
      cancelled = true;
    };
  }, [rowId, needsDetail]);

  if (!row) return null;

  const shown = loaded?.id === row.id ? loaded : row;
  const isLoading = needsDetail && !loaded && !loadError;
  const units = unitsState(shown);

  const applyTitle = async () => {
    if (!pendingTitle || !shown.mux_id) return;
    setSavingTitle(true);
    try {
      const { asset } = await api.applyTitle(assetRowId, shown.mux_id);
      onTitleApplied(asset);
      toggleNotification({ type: 'success', message: t('Robots.output.title-saved', 'Video title updated') });
      setPendingTitle(undefined);
    } catch (error) {
      toggleNotification({ type: 'danger', message: robotsErrorOf(error).message });
    } finally {
      setSavingTitle(false);
    }
  };

  return (
    <Modal.Root open onOpenChange={(open: boolean) => !open && onClose()}>
      <Modal.Content style={{ width: 'min(90vw, 80rem)', maxWidth: 'unset' }}>
        <Modal.Header>
          <Modal.Title>{workflowLabel(shown.workflow)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Flex gap={6} paddingBottom={4} wrap="wrap" alignItems="center">
            <StatusBadge status={shown.status} />
            <Typography variant="omega" textColor="neutral600">
              {t('Robots.output.units', 'AI units')}:{' '}
              {units.kind === 'count' ? units.units : isLoading ? t('Robots.loading', 'Loading…') : EM_DASH}
            </Typography>
            <Started iso={shown.mux_created_at} />
            <Typography variant="pi" textColor="neutral600" style={{ wordBreak: 'break-all' }}>
              {shown.mux_id}
            </Typography>
          </Flex>
          {isLoading ? (
            <Flex gap={2} alignItems="center">
              <Loader small>{t('Robots.loading', 'Loading…')}</Loader>
              <Typography variant="omega">{t('Robots.output.loading', 'Loading the result from Mux…')}</Typography>
            </Flex>
          ) : loadError ? (
            <Note variant="danger">{loadError}</Note>
          ) : (
            <Tabs.Root defaultValue="result">
              <Tabs.List aria-label={t('Robots.output.views', 'Output views')}>
                <Tabs.Trigger value="result">{t('Robots.output.result', 'Result')}</Tabs.Trigger>
                <Tabs.Trigger value="raw">{t('Robots.output.raw', 'Raw JSON')}</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="result">
                <Box paddingTop={4}>
                  <Result row={shown} canUpdate={canUpdate} onUseAsTitle={setPendingTitle} />
                </Box>
              </Tabs.Content>
              <Tabs.Content value="raw">
                <Box paddingTop={4}>
                  <JsonBlock value={rawJob(shown)} />
                </Box>
              </Tabs.Content>
            </Tabs.Root>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Box />
          <Button variant="tertiary" onClick={onClose}>
            {t('Robots.close', 'Close')}
          </Button>
        </Modal.Footer>
      </Modal.Content>

      <Dialog.Root open={!!pendingTitle} onOpenChange={(open: boolean) => !open && setPendingTitle(undefined)}>
        <Dialog.Content>
          <Dialog.Header>{t('Robots.output.use-as-title-confirm', 'Use as video title?')}</Dialog.Header>
          <Dialog.Body>
            <Flex direction="column" alignItems="stretch" gap={2}>
              <Typography variant="omega">
                {t('Robots.output.use-as-title-body', "The video's title in Strapi becomes:")}
              </Typography>
              <Typography variant="omega" fontWeight="bold">
                {pendingTitle}
              </Typography>
            </Flex>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Cancel>
              <Button variant="tertiary" disabled={savingTitle}>
                {t('Common.cancel-button', 'Cancel')}
              </Button>
            </Dialog.Cancel>
            <Button onClick={applyTitle} loading={savingTitle}>
              {t('Robots.output.use-as-title', 'Use as video title')}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </Modal.Root>
  );
}
