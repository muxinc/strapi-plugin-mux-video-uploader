import React from 'react';
import { Link } from '@strapi/design-system';

import { ROBOTS_DIRECTIVES_MIGRATION_URL, type RobotsDirectiveSummary } from '../../../../types/robots';
import { useRobotsIntl } from './intl';
import Note from './note';

/**
 * Robots v0 is deprecated and Strapi runs only v1 directives. A v0 directive in `defaultDirectiveIds`
 * still runs, on v0, on every upload, until someone replaces its id with a v1 copy's.
 */
export default function V0DirectivesNote({ configured }: { configured: RobotsDirectiveSummary[] }) {
  const { t } = useRobotsIntl();

  return (
    <Note
      variant="warning"
      title={t('Robots.v0.title', 'Robots v0 directives')}
      action={
        <Link href={ROBOTS_DIRECTIVES_MIGRATION_URL} isExternal>
          {t('Robots.v0.guide', 'How to move a directive to v1')}
        </Link>
      }
    >
      {t(
        'Robots.v0.body',
        'Robots v0 is deprecated, and Strapi only runs v1 directives. Create a v1 copy of a v0 directive in the Mux dashboard to run it from here.'
      )}
      {configured.length > 0 &&
        ` ${t(
          'Robots.v0.configured',
          'Every upload still runs {names} on v0: replace their ids in defaultDirectiveIds with those of their v1 copies.',
          { names: configured.map((directive) => directive.name).join(', ') }
        )}`}
    </Note>
  );
}
