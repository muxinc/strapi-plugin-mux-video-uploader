import { describe, expect, it } from 'vitest';

import { installFakeStrapi } from '../../../test/strapi';
import { getConfig } from '../utils/config';
import config from './index';

const validate = (overrides: Record<string, unknown>) => () =>
  config.validator({ accessTokenId: 'id', secretKey: 'secret', ...overrides } as any);

describe('plugin config', () => {
  it.each([
    ['empty, as an empty env var reads', ['']],
    ['padded', [' drv_a ', 'drv_b']],
    ['empty', []],
  ])('accepts a directive list that is %s', (_, defaultDirectiveIds) => {
    expect(validate({ defaultDirectiveIds })).not.toThrow();
  });

  it.each([
    ['not a list', 'drv_a'],
    ['a list with something other than ids', ['drv_a', 1]],
  ])('refuses a directive list that is %s', (_, defaultDirectiveIds) => {
    expect(validate({ defaultDirectiveIds })).toThrow('defaultDirectiveIds');
  });

  it('reads directive ids trimmed, without blanks or repeats', async () => {
    installFakeStrapi({ config: { defaultDirectiveIds: [' drv_a ', '', '  ', 'drv_b', 'drv_a'] } });

    expect((await getConfig()).defaultDirectiveIds).toEqual(['drv_a', 'drv_b']);
  });
});
