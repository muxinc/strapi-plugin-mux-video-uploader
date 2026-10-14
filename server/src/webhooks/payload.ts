import { isRecord } from '../utils/values';
import type { WebhookEvent } from './types';

let loggedShape = false;

/**
 * Where a Robots event carries its job or run. Mux's own sources disagree: the Robots guide puts it in
 * `data`, the SDK and the directives guide nest it under the event type
 * (`event["robots.job.summarize.completed"]`). Both are read, nested first, and the first Robots event
 * logs which shape arrived.
 */
export function eventPayload(event: WebhookEvent): Record<string, any> | undefined {
  const nested = event[event.type];
  const payload = isRecord(nested) ? nested : isRecord(event.data) ? event.data : undefined;

  if (!loggedShape && event.type.startsWith('robots.')) {
    strapi.log.info(
      `[mux-video-uploader] Robots webhook payload is ${isRecord(nested) ? 'nested under the event type' : 'in data'}`
    );
    loggedShape = true;
  }

  return payload;
}
