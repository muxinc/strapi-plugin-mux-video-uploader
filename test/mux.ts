import { vi } from 'vitest';
import { APIConnectionError, APIConnectionTimeoutError, APIError } from '@mux/ts/core/error';

// Listed by hand rather than read from the catalog, so a misspelt `sdkKey` there fails the tests.
export const WORKFLOW_SDK_KEYS = [
  'askQuestions',
  'editCaptions',
  'findBestThumbnails',
  'findKeyMoments',
  'findScenes',
  'generateChapters',
  'generateEngagementInsights',
  'generatePremiumCaptions',
  'moderate',
  'summarize',
  'translateAudio',
  'translateCaptions',
] as const;

function createMuxClient() {
  const workflows = Object.fromEntries(
    WORKFLOW_SDK_KEYS.map((key) => [key, { create: vi.fn(), retrieve: vi.fn() }])
  ) as Record<
    (typeof WORKFLOW_SDK_KEYS)[number],
    { create: ReturnType<typeof vi.fn>; retrieve: ReturnType<typeof vi.fn> }
  >;

  return {
    video: {
      assets: {
        retrieve: vi.fn(),
        list: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        createTrack: vi.fn(),
        deleteTrack: vi.fn(),
        createPlaybackId: vi.fn(),
      },
      uploads: { create: vi.fn() },
    },
    robots: {
      jobs: { list: vi.fn(), cancel: vi.fn(), ...workflows },
      directives: { list: vi.fn(), runs: { create: vi.fn(), list: vi.fn(), retrieve: vi.fn() } },
    },
    webhooks: { unwrap: vi.fn() },
    jwt: { signPlaybackId: vi.fn() },
  };
}

export type MuxClientMock = ReturnType<typeof createMuxClient>;

export const mux: { client: MuxClientMock; options: Array<Record<string, any>> } = {
  client: createMuxClient(),
  options: [],
};

/**
 * Stands in for the `@mux/ts` client. In a test file:
 *
 *   vi.mock('@mux/ts', async () => ({ default: (await import('../../../test/mux')).MuxMock }));
 *
 * then `resetMux()` in `beforeEach` and stub what the test needs on `mux.client`. Records the options
 * every client was built with.
 */
export class MuxMock {
  constructor(options: Record<string, any>) {
    mux.options.push(options);
    return mux.client as any;
  }
}

export function resetMux() {
  mux.client = createMuxClient();
  mux.options = [];
  return mux.client;
}

/** An error the way the SDK throws it when Mux answers: `status`, and the parsed body under `error`. */
export const muxApiError = (status: number, body?: unknown) =>
  APIError.generate(status, body as object | undefined, undefined, new Headers());

/** No answer from Mux: the request may or may not have arrived. */
export const muxConnectionError = () => new APIConnectionError({ message: 'Connection error.' });

export const muxTimeoutError = () => new APIConnectionTimeoutError();

/** What `await client.<resource>.list()` resolves to. */
export const page = <T>(data: T[]) => ({ data });
