import React from 'react';
import { Button, Flex, Table, Tbody, Td, Th, Thead, Tooltip, Tr, Typography } from '@strapi/design-system';

import { isPlaceholderRow, placeholderPhase, RobotsJobRow } from '../../../../types/robots';
import { exactTime, relativeTime } from './format';
import { useRobotsIntl } from './intl';
import StatusBadge from './status-badge';

export default function RobotsTable({
  columns,
  rowCount,
  children,
}: React.PropsWithChildren<{
  columns: string[];
  /** Body rows; the header row is added. */
  rowCount: number;
}>) {
  return (
    <Table colCount={columns.length} rowCount={rowCount + 1}>
      <Thead>
        <Tr>
          {columns.map((column) => (
            <Th key={column}>
              <Typography variant="sigma">{column}</Typography>
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>{children}</Tbody>
    </Table>
  );
}

export function Started({ iso }: { iso: string | null | undefined }) {
  return (
    <Tooltip label={exactTime(iso)}>
      <Typography variant="omega" textColor="neutral800">
        {relativeTime(iso)}
      </Typography>
    </Tooltip>
  );
}

export function StartedCell({ row }: { row: RobotsJobRow }) {
  return (
    <Td>
      <Started iso={row.mux_created_at ?? row.requested_at} />
    </Td>
  );
}

export function StatusCell({ row, nowMs, children }: React.PropsWithChildren<{ row: RobotsJobRow; nowMs: number }>) {
  return (
    <Td style={{ whiteSpace: 'normal' }}>
      <StatusBadge status={isPlaceholderRow(row) ? placeholderPhase(row, nowMs) : row.status} />
      {children}
    </Td>
  );
}

/** Only people who can run Robots get the way out of a run Mux never confirmed; everyone else waits. */
export function PlaceholderCell({
  row,
  nowMs,
  canRun,
  onDismiss,
}: {
  row: RobotsJobRow;
  nowMs: number;
  canRun: boolean;
  onDismiss: (row: RobotsJobRow) => void;
}) {
  const { t } = useRobotsIntl();

  if (!canRun || placeholderPhase(row, nowMs) !== 'unconfirmed') {
    return (
      <Typography variant="pi" textColor="neutral600">
        {t('Robots.jobs.waiting-for-mux', 'Waiting for Mux')}
      </Typography>
    );
  }

  return (
    <Flex direction="column" alignItems="start" gap={2} style={{ maxWidth: '28rem' }}>
      <Typography variant="pi" textColor="neutral700">
        {t(
          'Robots.unconfirmed.body',
          "Mux hasn't confirmed this run yet. It may still start. If nothing is running, you can try again."
        )}
      </Typography>
      <Button variant="secondary" size="S" onClick={() => onDismiss(row)}>
        {t('Robots.unconfirmed.dismiss', 'Nothing is running — let me try again')}
      </Button>
    </Flex>
  );
}
