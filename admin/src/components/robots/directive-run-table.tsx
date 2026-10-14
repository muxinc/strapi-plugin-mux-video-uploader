import React from 'react';
import { Td, TextButton, Tr, Typography } from '@strapi/design-system';
import { ChevronDown, ChevronUp } from '@strapi/icons';

import { workflowLabel } from '../../../../types/robots-catalog';
import { firstErrorMessage, isPlaceholderRow, RobotsJobRow, RobotsNodeState } from '../../../../types/robots';
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

interface Step {
  key: string;
  workflow: string;
  status?: string;
  detail: string;
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

/**
 * Mux fills `node_states` only once a run completes. Until then, and for any job they don't cover,
 * the steps are the jobs the run dispatched, with their live status.
 */
function stepsOf(t: Translate, run: RobotsJobRow, jobs: RobotsJobRow[]): Step[] {
  const nodes = run.run_data?.node_states ?? [];
  const covered = new Set(nodes.flatMap((node) => (node.job_id ? [node.job_id] : [])));

  const nodeSteps = nodes.map((node, index) => ({
    key: node.job_id ?? node.reference_id ?? `node-${index}`,
    workflow: node.workflow_name ? workflowLabel(node.workflow_name) : (node.reference_id ?? `#${index + 1}`),
    status: node.status,
    detail: nodeDetail(t, node, jobs),
  }));

  // The jobs come newest first; a run's steps read oldest first.
  const jobSteps = jobs
    .filter((job) => !!run.mux_id && job.directive_run_id === run.mux_id && !covered.has(job.mux_id ?? ''))
    .reverse()
    .map((job) => ({
      key: `job-${job.id}`,
      workflow: workflowLabel(job.workflow),
      status: job.status,
      detail: (job.status === 'errored' && firstErrorMessage(job.errors)) || EM_DASH,
    }));

  return [...nodeSteps, ...jobSteps];
}

function Steps({ steps }: { steps: Step[] }) {
  const { t } = useRobotsIntl();

  const columns = [
    { label: t('Robots.runs.column.workflow', 'Workflow'), width: '32%' },
    { label: t('Robots.runs.column.status', 'Status'), width: '28%' },
    { label: t('Robots.runs.column.detail', 'Detail'), width: '40%' },
  ];

  return (
    <RobotsTable columns={columns} rowCount={steps.length}>
      {steps.map((step) => (
        <Tr key={step.key}>
          <Td>
            <Typography variant="omega">{step.workflow}</Typography>
          </Td>
          <Td>
            <StatusBadge status={step.status} />
          </Td>
          <Td>
            <Typography variant="omega" style={{ overflowWrap: 'anywhere' }}>
              {step.detail}
            </Typography>
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
    { label: t('Robots.runs.column.directive', 'Directive'), width: '32%' },
    { label: t('Robots.runs.column.status', 'Status'), width: '26%' },
    { label: t('Robots.runs.column.started', 'Started'), width: '20%' },
    { label: t('Robots.runs.column.steps', 'Steps'), width: '22%' },
  ];

  return (
    <RobotsTable columns={columns} rowCount={rows.length}>
      {rows.flatMap((row) => {
        const steps = stepsOf(t, row, jobs);
        const isExpanded = expandedId === row.id;
        const name = row.directive_id ? (directiveNames[row.directive_id] ?? row.directive_id) : EM_DASH;

        const main = (
          <Tr key={row.id}>
            <Td>
              <Typography variant="omega" textColor="neutral800" style={{ overflowWrap: 'anywhere' }}>
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
                <TextButton
                  aria-expanded={isExpanded}
                  title={
                    isExpanded ? t('Robots.runs.hide-steps', 'Hide steps') : t('Robots.runs.show-steps', 'Show steps')
                  }
                  disabled={steps.length === 0}
                  endIcon={isExpanded ? <ChevronUp /> : <ChevronDown />}
                  onClick={() => setExpandedId(isExpanded ? undefined : row.id)}
                >
                  <Typography variant="omega">
                    {t('Robots.runs.step-count', '{count, plural, one {# step} other {# steps}}', {
                      count: steps.length,
                    })}
                  </Typography>
                </TextButton>
              )}
            </Td>
          </Tr>
        );

        if (!isExpanded) return [main];

        return [
          main,
          <Tr key={`${row.id}-steps`}>
            <Td colSpan={columns.length}>
              <Steps steps={steps} />
            </Td>
          </Tr>,
        ];
      })}
    </RobotsTable>
  );
}
