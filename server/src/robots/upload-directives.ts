import { Config, getService } from '../utils';

/** Past this, an upload stops waiting for the directive listing and attaches the configured ids as they are. */
export const UPLOAD_DIRECTIVES_TIMEOUT_MS = 5000;

/**
 * Which of the configured `defaultDirectiveIds` a new upload gets. Nothing outside the config is ever
 * attached.
 *
 * - Someone with Run Robots keeps the ids their request lists (no list keeps them all). Without it the
 *   request is ignored: every configured directive runs.
 * - Ids Mux doesn't know are dropped only when the listing is complete. When it can't be read, or may
 *   be incomplete, the list is attached as is.
 */
export async function resolveUploadDirectives({
  canRunRobots,
  requested,
}: {
  canRunRobots: boolean;
  requested?: string[];
}): Promise<Array<{ id: string }>> {
  const { defaultDirectiveIds = [] } = await Config.getConfig();
  const configured = Array.from(
    new Set(defaultDirectiveIds.filter((id) => typeof id === 'string' && id.trim() !== ''))
  );

  const chosen =
    canRunRobots && Array.isArray(requested) ? configured.filter((id) => requested.includes(id)) : configured;

  if (chosen.length === 0) return [];

  let attached = chosen;

  try {
    const { directives, complete } = await getService('robots').listDirectives({
      timeoutMs: UPLOAD_DIRECTIVES_TIMEOUT_MS,
    });

    if (complete) {
      const known = new Set(directives.map((directive) => directive.id));
      const unknown = chosen.filter((id) => !known.has(id));

      if (unknown.length > 0) {
        strapi.log.warn(
          `[mux-video-uploader] Not attaching Robots directives Mux doesn't have: ${unknown.join(', ')}. Remove them from defaultDirectiveIds.`
        );
        attached = chosen.filter((id) => known.has(id));
      }
    }
  } catch (error) {
    strapi.log.warn(
      `[mux-video-uploader] Couldn't list Robots directives, attaching the configured ones as they are: ${
        error instanceof Error ? error.message : error
      }`
    );
  }

  return attached.map((id) => ({ id }));
}
