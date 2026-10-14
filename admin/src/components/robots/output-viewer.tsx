import React from 'react';
import copy from 'copy-to-clipboard';
import { Box, Button, Flex, IconButton, Loader, Modal, Tabs, Typography } from '@strapi/design-system';
import { Duplicate } from '@strapi/icons';
import { useNotification } from '@strapi/strapi/admin';

import { workflowLabel } from '../../../../types/robots-catalog';
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
  /** The row read in full from Mux, so the table stops saying "Not loaded". */
  onRowLoaded: (row: RobotsJobRow) => void;
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

function useCopy() {
  const { t } = useRobotsIntl();
  const { toggleNotification } = useNotification();

  return (text: string) => {
    copy(text);
    toggleNotification({ type: 'success', message: t('Robots.output.copied', 'Copied to clipboard') });
  };
}

function JsonBlock({ value }: { value: unknown }) {
  const { t } = useRobotsIntl();
  const copyText = useCopy();
  const text = prettyJson(value);

  if (!text)
    return <Note variant="warning">{t('Robots.output.no-json', 'There is nothing here to show as JSON.')}</Note>;

  return (
    <Box position="relative">
      <Box position="absolute" top={2} right={2}>
        <IconButton label={t('Robots.output.copy-json', 'Copy JSON')} variant="tertiary" onClick={() => copyText(text)}>
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

function Result({ row }: { row: RobotsJobRow }) {
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

  return <>{view.render(outputs, row, t)}</>;
}

export default function OutputViewer({ row, api, onRowLoaded, onClose }: OutputViewerProps) {
  const { t } = useRobotsIntl();
  const copyText = useCopy();
  const [loaded, setLoaded] = React.useState<RobotsJobRow>();
  const [loadError, setLoadError] = React.useState<string>();

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
  const jobId = shown.mux_id;

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
              {t('Robots.output.units', 'Mux AI units')}:{' '}
              {units.kind === 'count' ? units.units : isLoading ? t('Robots.loading', 'Loading…') : EM_DASH}
            </Typography>
            <Started iso={shown.mux_created_at} />
            {jobId && (
              <Flex gap={1} alignItems="center">
                <Typography variant="pi" textColor="neutral600" style={{ wordBreak: 'break-all' }}>
                  {t('Robots.output.job-id', 'Job ID: {id}', { id: jobId })}
                </Typography>
                <IconButton
                  label={t('Robots.output.copy-job-id', 'Copy job ID')}
                  variant="ghost"
                  size="S"
                  onClick={() => copyText(jobId)}
                >
                  <Duplicate />
                </IconButton>
              </Flex>
            )}
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
                  <Result row={shown} />
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
    </Modal.Root>
  );
}
