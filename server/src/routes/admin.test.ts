import { describe, expect, it } from 'vitest';

import adminRoutes from './admin';

const PREFIX = '/mux-video-uploader';

const findRoute = (method: string, path: string) =>
  adminRoutes.find((route) => route.method === method && route.path === `${PREFIX}${path}`);

const requiredActions = (route: (typeof adminRoutes)[number] | undefined) =>
  ((route?.config as { policies?: any[] })?.policies ?? []).flatMap((policy) =>
    policy?.name === 'admin::hasPermissions' ? policy.config.actions : []
  );

describe('admin routes', () => {
  it.each([
    ['POST', '/direct-upload', 'create'],
    ['POST', '/remote-upload', 'create'],
    ['DELETE', '/mux-asset/:documentId', 'delete'],
    ['GET', '/sign/:documentId', 'read'],
    ['GET', '/mux-asset', 'read'],
    ['GET', '/mux-asset/count', 'read'],
    ['GET', '/mux-asset/:documentId', 'read'],
    ['POST', '/mux-asset', 'create'],
    ['PUT', '/mux-asset/:documentId', 'update'],
    ['GET', '/mux-settings', 'read'],
    ['GET', '/robots/assets/:asset/jobs', 'read'],
    ['POST', '/robots/assets/:asset/sync', 'read'],
    ['POST', '/robots/assets/:asset/jobs', 'robots.run'],
    ['POST', '/robots/assets/:asset/directive-runs', 'robots.run'],
    ['POST', '/robots/jobs/:id/cancel', 'robots.run'],
    ['GET', '/robots/jobs/:id', 'read'],
    ['DELETE', '/robots/pending/:id', 'robots.run'],
    ['GET', '/robots/directives', 'read'],
    ['POST', '/mux-asset/:asset/apply-title', 'update'],
    ['POST', '/mux-asset/:asset/playback-id', 'update'],
  ])('%s %s requires the plugin %s permission', (method, path, action) => {
    expect(requiredActions(findRoute(method, path))).toEqual([`plugin::mux-video-uploader.${action}`]);
  });

  it.each([
    ['POST', '/webhook-handler'],
    ['GET', '/thumbnail/:documentId'],
    ['GET', '/storyboard/:documentId'],
    ['GET', '/mux-text-tracks/:documentId'],
  ])('%s %s stays public: Mux and the player call it without an admin session', (method, path) => {
    const route = findRoute(method, path);

    expect(route?.config).toMatchObject({ auth: false });
    expect(requiredActions(route)).toEqual([]);
  });

  it('protects every route that needs an admin session', () => {
    const unprotected = adminRoutes.filter(
      (route) => (route.config as { auth?: boolean }).auth !== false && requiredActions(route).length === 0
    );

    expect(unprotected.map((route) => `${route.method} ${route.path}`)).toEqual([]);
  });

  it('has a single route per method and path, so the one written first is the one that runs', () => {
    const keys = adminRoutes.map((route) => `${route.method} ${route.path}`);

    expect(new Set(keys).size).toBe(keys.length);
    expect(findRoute('DELETE', '/mux-asset/:documentId')?.handler).toBe('mux.deleteMuxAsset');
  });
});
