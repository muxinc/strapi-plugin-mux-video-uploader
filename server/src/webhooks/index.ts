import type { WebhookEvent, WebhookOutcome } from './types';
import { handleVideoEvent } from './video';

export type { WebhookEvent, WebhookOutcome } from './types';

/**
 * Runs a verified event's database writes only: Mux gives up on a webhook after 5 s, so anything that
 * calls Mux is scheduled for after the answer (see `refresh-queue.ts`). Unknown event types and assets
 * are `ignored`, not errors, since a throw makes Mux deliver the event again.
 */
export async function dispatchWebhookEvent(event: WebhookEvent): Promise<WebhookOutcome> {
  const type = typeof event?.type === 'string' ? event.type : '';

  if (type.startsWith('video.')) return handleVideoEvent(event);

  return 'ignored';
}
