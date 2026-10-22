import React from 'react';
import { Link } from '@strapi/design-system';

import { useRobotsIntl } from './intl';
import { PricingLink, ROBOTS_DASHBOARD_URL, ROBOTS_TOKENS_URL } from './links';
import Note from './note';

export function UnavailableNote({
  capability,
  termsUrl,
}: {
  capability: 'scope-missing' | 'not-enabled';
  termsUrl?: string;
}) {
  const { t } = useRobotsIntl();

  if (capability === 'scope-missing') {
    return (
      <Note
        variant="warning"
        title={t('Robots.capability.scope-missing.title', "This Mux access token can't use Robots")}
        action={
          <Link href={ROBOTS_TOKENS_URL} isExternal>
            {t('Robots.capability.scope-missing.link', 'Open access tokens in the Mux dashboard')}
          </Link>
        }
      >
        {t(
          'Robots.capability.scope-missing.body',
          "Create a new token with the Robots permission in the Mux dashboard and put it in accessTokenId / secretKey in config/plugins. Existing tokens can't gain new permissions."
        )}
      </Note>
    );
  }

  return (
    <Note
      title={t('Robots.capability.not-enabled.title', "Robots isn't enabled for this Mux account")}
      action={
        <Link href={termsUrl ?? ROBOTS_DASHBOARD_URL} isExternal>
          {t('Robots.capability.not-enabled.link', 'Turn on Robots in the Mux dashboard')}
        </Link>
      }
    >
      {t(
        'Robots.capability.not-enabled.body',
        'Robots runs AI workflows, such as captions, dubs, summaries, chapters and moderation, on your Mux videos. Mux turns it on once its terms are accepted.'
      )}
    </Note>
  );
}

export function UnitsExhaustedNote() {
  const { t } = useRobotsIntl();

  return (
    <Note
      variant="warning"
      title={t('Robots.capability.units.title', 'Not enough Mux AI units left')}
      action={<PricingLink />}
    >
      {t(
        'Robots.capability.units.body',
        "Mux refused the last run because this account doesn't have enough Mux AI units left for it. A cheaper workflow may still fit."
      )}
    </Note>
  );
}
