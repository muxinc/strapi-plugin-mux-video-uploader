import React from 'react';
import { Link } from '@strapi/design-system';

import { useRobotsIntl } from './intl';

export const ROBOTS_DASHBOARD_URL = 'https://dashboard.mux.com';
export const ROBOTS_TOKENS_URL = 'https://dashboard.mux.com/settings/access-tokens';
const ROBOTS_PRICING_URL = 'https://www.mux.com/docs/pricing/overview#mux-robots-pricing';

export function PricingLink() {
  const { t } = useRobotsIntl();

  return (
    <Link href={ROBOTS_PRICING_URL} isExternal>
      {t('Robots.run.pricing-link', 'See Robots pricing')}
    </Link>
  );
}
