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

  it('registers Run Robots beside the Read, Create, Update and Delete actions', async () => {
    const { strapi } = installFakeStrapi();

    await bootstrap({ strapi: strapi as any });

    const [actions] = strapi.admin.services.permission.actionProvider.registerMany.mock.calls[0];
    expect(actions.map((action: { uid: string }) => action.uid)).toEqual(
      expect.arrayContaining(['read', 'create', 'update', 'delete', 'robots.run'])
    );
    expect(actions.find((action: { uid: string }) => action.uid === 'robots.run')).toMatchObject({
      section: 'plugins',
      displayName: 'Run Robots',
      pluginName: 'mux-video-uploader',
    });
  });
});
