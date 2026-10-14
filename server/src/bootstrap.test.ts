import { describe, expect, it } from 'vitest';

import { installFakeStrapi } from '../../test/strapi';
import bootstrap from './bootstrap';

describe('bootstrap', () => {
  it('warns at boot when the webhook signing secret is empty', async () => {
    const { strapi, log } = installFakeStrapi({ config: { webhookSigningSecret: '' } });

    await bootstrap({ strapi: strapi as any });

    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('webhookSigningSecret is empty'));
  });

  it('stays quiet when the secret is set', async () => {
    const { strapi, log } = installFakeStrapi();

    await bootstrap({ strapi: strapi as any });

    expect(log.warn).not.toHaveBeenCalled();
  });
});
