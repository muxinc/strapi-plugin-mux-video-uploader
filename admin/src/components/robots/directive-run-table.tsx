import React from 'react';
import { Flex, IconButton, Td, Tr, Typography } from '@strapi/design-system';
import { ChevronDown, ChevronUp } from '@strapi/icons';

import { workflowLabel } from '../../../../types/robots-catalog';
import { isPlaceholderRow, RobotsJobRow, RobotsNodeState } from '../../../../types/robots';
import { EM_DASH } from './format';
import { Translate, useRobotsIntl } from './intl';
import StatusBadge from './status-badge';
import RobotsTable, { PlaceholderCell, StartedCell, StatusCell } from './table';

interface DirectiveRunTableProps {
  /** Newest first, placeholders included. */
  rows: RobotsJobRow[];
  /** So a dispatched step can show its job's status. */
  jobs: RobotsJobRow[];
  directiveNames: Record<string, string>;
  nowMs: number;
  canRun: boolean;
  /** "Nothing is running — let me try again" on a placeholder Mux never confirmed. */
  onDismiss: (row: RobotsJobRow) => void;
}

function nodeDetail(t: Translate, node: RobotsNodeState, jobs: RobotsJobRow[]) {
  if (node.reason) return node.reason;
  if (node.source_workflows?.length) {
    return t('Robots.runs.waiting-on', 'Waiting on {workflows}', { workflows: node.source_workflows.join(', ') });
  }
  if (node.job_id) {
    const job = jobs.find((candidate) => candidate.mux_id === node.job_id);
    return job
      ? t('Robots.runs.job-status', 'Job {status}', { status: job.status })
      : t('Robots.runs.job-dispatched', 'Job dispatched');
  }
  return EM_DASH;
}

function Steps({ nodes, jobs }: { nodes: RobotsNodeState[]; jobs: RobotsJobRow[] }) {
  const { t } = useRobotsIntl();

  const columns = [
    t('Robots.runs.column.workflow', 'Workflow'),
    t('Robots.runs.column.status', 'Status'),
    t('Robots.runs.column.detail', 'Detail'),
  ];

  return (
    <RobotsTable columns={columns} rowCount={nodes.length}>
      {nodes.map((node, index) => (
        <Tr key={node.job_id ?? node.reference_id ?? index}>
          <Td>
            <Typography variant="omega">
              {node.workflow_name ? workflowLabel(node.workflow_name) : (node.reference_id ?? `#${index + 1}`)}
            </Typography>
          </Td>
          <Td>
            <StatusBadge status={node.status} />
          </Td>
          <Td style={{ whiteSpace: 'normal' }}>
            <Typography variant="omega">{nodeDetail(t, node, jobs)}</Typography>
          </Td>
        </Tr>
      ))}
    </RobotsTable>
  );
}

export default function DirectiveRunTable({
  rows,
  jobs,
  directiveNames,
  nowMs,
  canRun,
  onDismiss,
}: DirectiveRunTableProps) {
  const { t } = useRobotsIntl();
  const [expandedId, setExpandedId] = React.useState<number>();

  if (rows.length === 0) {
    return (
      <Typography variant="omega" textColor="neutral600">
        {t('Robots.runs.empty', 'No directive runs on this video yet.')}
      </Typography>
    );
  }

  const columns = [
    t('Robots.runs.column.directive', 'Directive'),
    t('Robots.runs.column.status', 'Status'),
    t('Robots.runs.column.started', 'Started'),
    t('Robots.runs.column.steps', 'Steps'),
  ];

  return (
    <RobotsTable columns={columns} rowCount={rows.length}>
      {rows.flatMap((row) => {
        const nodes = row.run_data?.node_states ?? [];
        const isExpanded = expandedId === row.id;
        const name = row.directive_id ? (directiveNames[row.directive_id] ?? row.directive_id) : EM_DASH;

        const main = (
          <Tr key={row.id}>
            <Td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
              <Typography variant="omega" textColor="neutral800">
                {name}
              </Typography>
            </Td>
            <StatusCell row={row} nowMs={nowMs}>
              {row.status === 'partial' && (
                <Typography variant="pi" textColor="warning700" tag="p" style={{ maxWidth: '20rem' }}>
                  {t('Robots.runs.partial', "Some steps didn't finish. Open the steps to see which and why.")}
                </Typography>
              )}
            </StatusCell>
            <StartedCell row={row} />
            <Td>
              {isPlaceholderRow(row) ? (
                <PlaceholderCell row={row} nowMs={nowMs} canRun={canRun} onDismiss={onDismiss} />
              ) : (
                <Flex gap={1} alignItems="center">
                  <IconButton
                    label={
                      isExpanded ? t('Robots.runs.hide-steps', 'Hide steps') : t('Robots.runs.show-steps', 'Show steps')
                    }
                    variant="ghost"
                    disabled={nodes.length === 0}
                    onClick={() => setExpandedId(isExpanded ? undefined : row.id)}
                  >
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </IconButton>
                  <Typography variant="omega">{nodes.length}</Typography>
                </Flex>
              )}
            </Td>
          </Tr>
        );

        if (!isExpanded) return [main];

        return [
          main,
          <Tr key={`${row.id}-steps`}>
            <Td colSpan={columns.length} style={{ whiteSpace: 'normal' }}>
              <Steps nodes={nodes} jobs={jobs} />
            </Td>
          </Tr>,
        ];
      })}
    </RobotsTable>
  );
}
