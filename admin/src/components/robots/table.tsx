import React from 'react';
import { Flex, Table, Tbody, Td, TextButton, Th, Thead, Tooltip, Tr, Typography } from '@strapi/design-system';
import styled from 'styled-components';

import { isPlaceholderRow, placeholderPhase, RobotsJobRow } from '../../../../types/robots';
import { exactTime, relativeTime } from './format';
import { useRobotsIntl } from './intl';
import StatusBadge from './status-badge';

/** A header, or a header with its share of the table's width. */
export type RobotsColumn = string | { label: string; width: string };

/**
 * The design system's table never wraps, so a narrow panel scrolls sideways, and its first cell has
 * no vertical padding, which lifts it above the rest of a top-aligned row. Cells line up on the
 * baseline of their first line, whatever each one holds.
 */
const TableFrame = styled.div`
  & table {
    white-space: normal;
    overflow-wrap: break-word;
  }

  & th:not(:first-of-type),
  & td:not(:first-of-type) {
    padding-inline: 0.8rem;
  }

  & tbody td,
  & tbody td:first-of-type {
    padding-block: 1.6rem;
    vertical-align: baseline;
  }

  /* A button centres a label that wraps. */
  & tbody button {
    text-align: start;
  }
`;

export default function RobotsTable({
  columns,
  rowCount,
  children,
}: React.PropsWithChildren<{
  columns: RobotsColumn[];
  /** Body rows; the header row is added. */
  rowCount: number;
}>) {
  return (
    <TableFrame>
      <Table colCount={columns.length} rowCount={rowCount + 1}>
        <Thead>
          <Tr>
            {columns.map((column) => {
              const { label, width } = typeof column === 'string' ? { label: column, width: undefined } : column;
              return (
                <Th key={label} style={width ? { width } : undefined}>
                  <Typography variant="sigma">{label}</Typography>
                </Th>
              );
            })}
          </Tr>
        </Thead>
        <Tbody>{children}</Tbody>
      </Table>
    </TableFrame>
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
    <Td>
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
      <Typography variant="omega" textColor="neutral600">
        {t('Robots.jobs.waiting-for-mux', 'Waiting for Mux')}
      </Typography>
    );
  }

  // A text button, so its label can wrap in a narrow column.
  return (
    <Flex direction="column" alignItems="start" gap={2}>
      <Typography variant="omega" textColor="neutral700">
        {t(
          'Robots.unconfirmed.body',
          "Mux hasn't confirmed this run yet. It may still start. If nothing is running, you can try again."
        )}
      </Typography>
      <TextButton onClick={() => onDismiss(row)}>
        {t('Robots.unconfirmed.dismiss', 'Nothing is running — let me try again')}
      </TextButton>
    </Flex>
  );
}
