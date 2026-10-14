/** A verified Mux webhook event. Only `type` is relied on everywhere; each handler reads its own payload. */
export interface WebhookEvent {
  type: string;
  data?: unknown;
  [key: string]: unknown;
}

/** `ignored` covers unknown event types and events about assets this Strapi doesn't have. Both answer 200. */
export type WebhookOutcome = 'handled' | 'ignored';
