import React from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import type { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
import type {
  RobotsDirectivesResponse,
  RobotsErrorBody,
  RobotsRowResponse,
  RobotsRowsResponse,
  RobotsSyncResponse,
} from '../../../../types/robots';
import { PLUGIN_ID } from '../../pluginId';

export function useRobotsApi() {
  const { get, post, del } = useFetchClient();

  return React.useMemo(
    () => ({
      listJobs: async (assetRowId: number) =>
        (await get<RobotsRowsResponse>(`${PLUGIN_ID}/robots/assets/${assetRowId}/jobs`)).data,
      sync: async (assetRowId: number) =>
        (await post<RobotsSyncResponse>(`${PLUGIN_ID}/robots/assets/${assetRowId}/sync`, {})).data,
      createJob: async (assetRowId: number, workflow: string, values: Record<string, unknown>) =>
        (await post<RobotsRowResponse>(`${PLUGIN_ID}/robots/assets/${assetRowId}/jobs`, { workflow, values })).data,
      runDirective: async (assetRowId: number, directiveId: string) =>
        (
          await post<RobotsRowResponse>(`${PLUGIN_ID}/robots/assets/${assetRowId}/directive-runs`, {
            directive_id: directiveId,
          })
        ).data,
      cancelJob: async (rowId: number) =>
        (await post<RobotsRowResponse>(`${PLUGIN_ID}/robots/jobs/${rowId}/cancel`, {})).data,
      loadJob: async (rowId: number) => (await get<RobotsRowResponse>(`${PLUGIN_ID}/robots/jobs/${rowId}?load=1`)).data,
      dismissPending: async (rowId: number) => {
        await del(`${PLUGIN_ID}/robots/pending/${rowId}`);
      },
      listDirectives: async () => (await get<RobotsDirectivesResponse>(`${PLUGIN_ID}/robots/directives`)).data,
      applyTitle: async (assetRowId: number, jobId: string) =>
        (await post<{ asset: MuxAsset }>(`${PLUGIN_ID}/mux-asset/${assetRowId}/apply-title`, { job_id: jobId })).data,
      createPlaybackId: async (assetRowId: number) =>
        (await post<{ asset: MuxAsset }>(`${PLUGIN_ID}/mux-asset/${assetRowId}/playback-id`, {})).data,
      getAsset: async (assetRowId: number) => (await get<MuxAsset>(`${PLUGIN_ID}/mux-asset/${assetRowId}`)).data,
    }),
    [get, post, del]
  );
}

export type RobotsApi = ReturnType<typeof useRobotsApi>;

/** Any thrown value, as the `{ reason, message }` the Robots routes answer with. */
export function robotsErrorOf(error: unknown): RobotsErrorBody['error'] {
  const body = (error as { response?: { data?: Partial<RobotsErrorBody> } })?.response?.data?.error;

  if (body && typeof body.reason === 'string') return body as RobotsErrorBody['error'];

  return {
    reason: 'mux-error',
    message: error instanceof Error && error.message ? error.message : 'Something went wrong.',
  };
}
