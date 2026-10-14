import React from 'react';
import { Box, Button, Flex, Td, TextButton, Tr, Typography } from '@strapi/design-system';

import { workflowLabel } from '../../../../types/robots-catalog';
import {
  firstErrorMessage,
  isPlaceholderRow,
  RobotsJobRow,
  RobotsUnitsState,
  unitsState,
} from '../../../../types/robots';
import { Translate, useRobotsIntl } from './intl';
import RobotsTable, { PlaceholderCell, StartedCell, StatusCell } from './table';

interface JobTableProps {
  /** Newest first, placeholders included. */
  rows: RobotsJobRow[];
  directiveNames: Record<string, string>;
  canRun: boolean;
  nowMs: number;
  cancellingIds: number[];
  loadingDetailIds: number[];
  onCancel: (row: RobotsJobRow) => void;
  onViewOutput: (row: RobotsJobRow) => void;
  onLoadDetail: (row: RobotsJobRow) => void;
  /** "Nothing is running — let me try again" on a placeholder Mux never confirmed. */
  onDismiss: (row: RobotsJobRow) => void;
}

function unitsLabel(t: Translate, units: RobotsUnitsState) {
  switch (units.kind) {
    case 'count':
      return String(units.units);
    case 'not-charged':
      return t('Robots.units.not-charged', 'Not charged');
    case 'not-counted-yet':
      return t('Robots.units.not-counted-yet', 'Not counted yet');
    case 'not-loaded':
      return t('Robots.units.not-loaded', 'Not loaded');
    default:
      return t('Robots.units.not-reported', 'Not reported');
  }
}

export default function JobTable(props: JobTableProps) {
  const { rows, directiveNames, nowMs, cancellingIds, loadingDetailIds } = props;
  const { t } = useRobotsIntl();

  if (rows.length === 0) {
    return (
      <Typography variant="omega" textColor="neutral600">
        {t('Robots.jobs.empty', 'No Robots jobs have run on this video yet.')}
      </Typography>
    );
  }

  const columns = [
    t('Robots.jobs.column.workflow', 'Workflow'),
    t('Robots.jobs.column.status', 'Status'),
    t('Robots.jobs.column.started', 'Started'),
    t('Robots.jobs.column.units', 'Units'),
    t('Robots.jobs.column.actions', 'Actions'),
  ];

  return (
    <RobotsTable columns={columns} rowCount={rows.length}>
      {rows.map((row) => {
        const directiveName = row.directive_id ? (directiveNames[row.directive_id] ?? row.directive_id) : undefined;
        const error = row.status === 'errored' ? firstErrorMessage(row.errors) : undefined;
        const units = unitsState(row);
        const isLoadingDetail = loadingDetailIds.includes(row.id);

        return (
          <Tr key={row.id}>
            <Td style={{ whiteSpace: 'normal' }}>
              <Typography variant="omega" textColor="neutral800">
                {workflowLabel(row.workflow)}
              </Typography>
              {directiveName && (
                <Typography variant="pi" textColor="neutral600" tag="p">
                  {t('Robots.jobs.from-directive', 'From directive {name}', { name: directiveName })}
                </Typography>
              )}
            </Td>
            <StatusCell row={row} nowMs={nowMs}>
              {error && (
                <Typography variant="pi" textColor="danger600" tag="p" style={{ maxWidth: '24rem' }}>
                  {error}
                </Typography>
              )}
            </StatusCell>
            <StartedCell row={row} />
            <Td>
              {units.kind === 'not-loaded' ? (
                <TextButton disabled={isLoadingDetail} onClick={() => props.onLoadDetail(row)}>
                  {isLoadingDetail ? t('Robots.loading', 'Loading…') : unitsLabel(t, units)}
                </TextButton>
              ) : (
                <Typography variant="omega" textColor="neutral800">
                  {unitsLabel(t, units)}
                </Typography>
              )}
            </Td>
            <Td style={{ whiteSpace: 'normal' }}>
              <JobActions {...props} row={row} isCancelling={cancellingIds.includes(row.id)} />
            </Td>
          </Tr>
        );
      })}
    </RobotsTable>
  );
}

function JobActions({
  row,
  isCancelling,
  canRun,
  nowMs,
  onCancel,
  onViewOutput,
  onDismiss,
}: JobTableProps & { row: RobotsJobRow; isCancelling: boolean }) {
  const { t } = useRobotsIntl();

  if (isPlaceholderRow(row)) {
    return <PlaceholderCell row={row} nowMs={nowMs} canRun={canRun} onDismiss={onDismiss} />;
  }

  if (row.status === 'pending' || row.status === 'processing') {
    if (!canRun) {
      return (
        <Typography variant="pi" textColor="neutral600">
          {t('Robots.jobs.output-when-finished', 'Output appears when it finishes')}
        </Typography>
      );
    }

    return (
      <Button
        size="S"
        variant="danger-light"
        loading={isCancelling}
        disabled={isCancelling}
        onClick={() => onCancel(row)}
      >
        {t('Robots.jobs.cancel', 'Cancel')}
      </Button>
    );
  }

  if (row.status === 'cancelled') {
    return (
      <Typography variant="pi" textColor="neutral600">
        {t('Robots.jobs.nothing-to-view', 'Nothing to view — cancelled before it produced output')}
      </Typography>
    );
  }

  return (
    <Flex>
      <Box>
        <Button size="S" variant="secondary" onClick={() => onViewOutput(row)}>
          {t('Robots.jobs.view-output', 'View output')}
        </Button>
      </Box>
    </Flex>
  );
}
