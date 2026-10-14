import React from 'react';
import { Badge } from '@strapi/design-system';

import { useRobotsIntl } from './intl';

type Tone = 'neutral' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning';

const COLORS: Record<Tone, { backgroundColor: string; textColor: string }> = {
  neutral: { backgroundColor: 'neutral150', textColor: 'neutral700' },
  primary: { backgroundColor: 'primary100', textColor: 'primary700' },
  secondary: { backgroundColor: 'secondary100', textColor: 'secondary700' },
  success: { backgroundColor: 'success100', textColor: 'success700' },
  danger: { backgroundColor: 'danger100', textColor: 'danger700' },
  warning: { backgroundColor: 'warning100', textColor: 'warning700' },
};

/** Shared by jobs, directive runs and their steps, so the same outcome has the same colour everywhere. */
const TONES: Record<string, Tone> = {
  pending: 'neutral',
  processing: 'secondary',
  completed: 'success',
  errored: 'danger',
  cancelled: 'neutral',
  dispatching: 'secondary',
  running: 'secondary',
  waiting: 'neutral',
  partial: 'warning',
  dispatched: 'secondary',
  failed: 'danger',
  waiting_for_resources: 'neutral',
  waiting_for_source_workflow: 'neutral',
  starting: 'primary',
  unconfirmed: 'warning',
};

export default function StatusBadge({ status }: { status?: string | null }) {
  const { t } = useRobotsIntl();
  const tone = TONES[status ?? ''] ?? 'neutral';

  const label =
    status === 'starting'
      ? t('Robots.status.starting', 'Starting…')
      : status === 'unconfirmed'
        ? t('Robots.status.unconfirmed', 'Not confirmed')
        : // Step states are snake_case.
          (status ?? t('Robots.status.unknown', 'unknown')).replace(/_/g, ' ');

  return (
    <Badge {...(COLORS[tone] as any)} size="S">
      {label}
    </Badge>
  );
}
