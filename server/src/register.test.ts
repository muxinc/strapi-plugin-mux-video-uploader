import { describe, expect, it } from 'vitest';

import { installFakeStrapi } from '../../test/strapi';
import register from './register';

const registerWith = (middlewares: unknown) => {
  const { strapi } = installFakeStrapi({ middlewares });
  register({ strapi: strapi as any });
  return strapi.config.get('middlewares');
};

describe('register', () => {
  it("turns a plain 'strapi::body' into an entry that keeps the raw body", () => {
    expect(registerWith(['strapi::logger', 'strapi::body', 'strapi::session'])).toEqual([
      'strapi::logger',
      { name: 'strapi::body', config: { includeUnparsed: true } },
      'strapi::session',
    ]);
  });

  it('adds includeUnparsed to an object entry and keeps the rest of its config', () => {
    expect(registerWith([{ name: 'strapi::body', config: { formLimit: '256mb', jsonLimit: '256mb' } }])).toEqual([
      { name: 'strapi::body', config: { formLimit: '256mb', jsonLimit: '256mb', includeUnparsed: true } },
    ]);
  });

  it('adds a config to an object entry that has none', () => {
    expect(registerWith([{ name: 'strapi::body' }])).toEqual([
      { name: 'strapi::body', config: { includeUnparsed: true } },
    ]);
  });

  it('leaves an explicit includeUnparsed: false untouched', () => {
    const entry = { name: 'strapi::body', config: { includeUnparsed: false } };

    expect(registerWith([entry])).toEqual([entry]);
  });

  it('does nothing when the app has no middlewares list', () => {
    const { strapi } = installFakeStrapi({ middlewares: undefined });
    register({ strapi: strapi as any });

    expect(strapi.config.set).not.toHaveBeenCalled();
  });
});
