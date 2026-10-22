import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mux, muxApiError, muxConnectionError, page, resetMux } from '../../../test/mux';
import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import services from '../services';
import { resolveUploadDirectives, UPLOAD_DIRECTIVES_TIMEOUT_MS } from './upload-directives';

vi.mock('@mux/ts', async () => ({ default: (await import('../../../test/mux')).MuxMock }));

let fake: FakeStrapi;

const configure = (defaultDirectiveIds: string[]) => {
  fake = installFakeStrapi({ services, config: { defaultDirectiveIds } });
};

beforeEach(() => {
  resetMux();
  configure(['drv_a', 'drv_b']);
  mux.client.robots.directives.list.mockResolvedValue(
    page([
      { id: 'drv_a', name: 'Summarize' },
      { id: 'drv_b', name: 'Moderate' },
    ])
  );
});

describe('resolveUploadDirectives', () => {
  it('attaches every configured directive for someone without Run Robots, whatever they asked for', async () => {
    expect(await resolveUploadDirectives({ canRunRobots: false, requested: [] })).toEqual([
      { id: 'drv_a' },
      { id: 'drv_b' },
    ]);
    expect(await resolveUploadDirectives({ canRunRobots: false, requested: ['drv_a'] })).toEqual([
      { id: 'drv_a' },
      { id: 'drv_b' },
    ]);
  });

  it('attaches only the configured directives a runner kept checked', async () => {
    expect(await resolveUploadDirectives({ canRunRobots: true, requested: ['drv_b'] })).toEqual([{ id: 'drv_b' }]);
    expect(await resolveUploadDirectives({ canRunRobots: true, requested: [] })).toEqual([]);
  });

  it('attaches every configured directive when a runner sent no list', async () => {
    expect(await resolveUploadDirectives({ canRunRobots: true })).toEqual([{ id: 'drv_a' }, { id: 'drv_b' }]);
  });

  it('never attaches a directive outside the config', async () => {
    expect(await resolveUploadDirectives({ canRunRobots: true, requested: ['drv_a', 'drv_evil'] })).toEqual([
      { id: 'drv_a' },
    ]);
  });

  it("drops ids Mux doesn't have when the listing is complete, and names them in the log", async () => {
    configure(['drv_a', 'drv_doesnotexist']);

    expect(await resolveUploadDirectives({ canRunRobots: false })).toEqual([{ id: 'drv_a' }]);
    expect(fake.log.warn).toHaveBeenCalledWith(expect.stringContaining('drv_doesnotexist'));
  });

  it('keeps the list as it is when Mux has more directives than one listing returns', async () => {
    configure(['drv_a', 'drv_elsewhere']);
    mux.client.robots.directives.list.mockResolvedValue(
      page(Array.from({ length: 100 }, (_, index) => ({ id: `drv_${index}`, name: 'x' })))
    );

    expect(await resolveUploadDirectives({ canRunRobots: false })).toEqual([{ id: 'drv_a' }, { id: 'drv_elsewhere' }]);
  });

  it("doesn't wait for Mux's listing longer than a few seconds", async () => {
    await resolveUploadDirectives({ canRunRobots: false });

    expect(mux.client.robots.directives.list).toHaveBeenCalledWith(
      { limit: 100 },
      { timeout: UPLOAD_DIRECTIVES_TIMEOUT_MS }
    );
  });

  it("keeps the list as it is when the listing can't be read", async () => {
    mux.client.robots.directives.list.mockRejectedValue(muxConnectionError());

    expect(await resolveUploadDirectives({ canRunRobots: false })).toEqual([{ id: 'drv_a' }, { id: 'drv_b' }]);
  });

  it.each([
    ['a token without the Robots scope', 401],
    ['an environment without Robots enabled', 403],
  ])("attaches none for %s, so the upload isn't refused", async (_, status) => {
    mux.client.robots.directives.list.mockRejectedValue(muxApiError(status));

    expect(await resolveUploadDirectives({ canRunRobots: false })).toEqual([]);
    expect(fake.log.warn).toHaveBeenCalledWith(expect.stringContaining("can't use Robots"));
  });

  it('keeps the list as it is when Mux fails for another reason', async () => {
    mux.client.robots.directives.list.mockRejectedValue(muxApiError(500));

    expect(await resolveUploadDirectives({ canRunRobots: false })).toEqual([{ id: 'drv_a' }, { id: 'drv_b' }]);
  });

  it('attaches padded ids trimmed, and ignores blank ones', async () => {
    configure([' drv_a ', '', '  ', 'drv_a', 'drv_b']);

    expect(await resolveUploadDirectives({ canRunRobots: true, requested: ['drv_a', 'drv_b'] })).toEqual([
      { id: 'drv_a' },
      { id: 'drv_b' },
    ]);
  });

  it('asks Mux nothing when the configured list is only blanks, as an empty env var gives', async () => {
    configure(['']);

    expect(await resolveUploadDirectives({ canRunRobots: false })).toEqual([]);
    expect(mux.client.robots.directives.list).not.toHaveBeenCalled();
  });

  it('asks Mux nothing when no directive is configured or kept', async () => {
    configure([]);
    expect(await resolveUploadDirectives({ canRunRobots: true, requested: ['drv_a'] })).toEqual([]);

    configure(['drv_a']);
    expect(await resolveUploadDirectives({ canRunRobots: true, requested: [] })).toEqual([]);

    expect(mux.client.robots.directives.list).not.toHaveBeenCalled();
  });
});
