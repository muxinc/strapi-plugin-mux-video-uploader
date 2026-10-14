import { APIConnectionError, MuxError } from '@mux/ts/core/error';

import type { RobotsErrorReason } from '../../../types/robots';
import { isRecord } from '../utils/values';

/** No organization or environment in it, so it's right for every account. */
export const ROBOTS_DASHBOARD_URL = 'https://dashboard.mux.com';

export interface ClassifiedMuxError {
  reason: RobotsErrorReason;
  message: string;
  /** Where Robots' terms are accepted, for `not-enabled`. */
  termsUrl?: string;
  /** Absent when Mux didn't answer. */
  status?: number;
}

/** A refusal the plugin's Robots routes answer with `{ error: { reason, message } }`. */
export class RobotsRequestError extends Error {
  constructor(
    readonly status: number,
    readonly reason: RobotsErrorReason,
    message: string,
    readonly termsUrl?: string
  ) {
    super(message);
  }

  /** Always 400: Mux's own 401 or 403 would read as the person's session or role failing. */
  static fromMux(error: ClassifiedMuxError) {
    return new RobotsRequestError(400, error.reason, error.message, error.termsUrl);
  }
}

/** Runs one Mux request, turning its failure into a `RobotsRequestError`. */
export async function callMux<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw RobotsRequestError.fromMux(classifyMuxError(error));
  }
}

/** The human-readable part of a Mux error body. Mux's endpoints put it in different places, so each is tried in turn. */
export function readMuxErrorMessage(body: unknown, status: number): string {
  const joinStrings = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (!Array.isArray(value)) return undefined;
    const parts = value
      .map((entry) => (typeof entry === 'string' ? entry : isRecord(entry) ? entry.message : undefined))
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '')
      .map((entry) => entry.trim());
    return parts.length > 0 ? parts.join(' ') : undefined;
  };

  const root = isRecord(body) ? body : undefined;
  const error = isRecord(root?.error) ? root.error : undefined;

  return (
    joinStrings(error?.messages) ??
    joinStrings(error?.message) ??
    joinStrings(root?.messages) ??
    joinStrings(root?.message) ??
    joinStrings(root?.errors) ??
    joinStrings(root?.error) ??
    `Mux rejected this request (HTTP ${status})`
  );
}

/** The terms 403 links the exact organization and environment, which beats the generic dashboard URL. */
const dashboardUrlIn = (message: string) =>
  /https:\/\/dashboard\.mux\.com\/[^\s"'<>]*/.exec(message)?.[0].replace(/[.,;:)]+$/, '');

/**
 * What a failed Mux call means for the person who made it.
 *
 * Without a status, Mux may or may not have received the request: `unconfirmed`. The SDK's own checks
 * (an id that makes an invalid path, say) fail before anything is sent, so those are refusals.
 */
export function classifyMuxError(error: unknown, kind: 'job' | 'run' | 'other' = 'other'): ClassifiedMuxError {
  const status = isRecord(error) && typeof error.status === 'number' ? error.status : undefined;

  if (status === undefined) {
    if (error instanceof MuxError && !(error instanceof APIConnectionError)) {
      return { reason: 'invalid-parameters', message: error.message || 'Mux refused the request.' };
    }

    return { reason: 'unconfirmed', message: "Couldn't reach Mux." };
  }

  const body = isRecord(error) ? error.error : undefined;
  const type =
    isRecord(body) && isRecord(body.error) && typeof body.error.type === 'string' ? body.error.type : undefined;
  const message = readMuxErrorMessage(body, status);

  if (status === 401 || type === 'insufficient_scope') return { reason: 'scope-missing', message, status };

  if (status === 403 && (type === undefined || type === 'forbidden')) {
    return { reason: 'not-enabled', message, status, termsUrl: dashboardUrlIn(message) ?? ROBOTS_DASHBOARD_URL };
  }

  if (type === 'robots_units_limit_exceeded') return { reason: 'units-exhausted', message, status };

  // A conflict means "already running" only for creates; anything else keeps Mux's own words.
  if (status === 409) {
    const running: Record<string, string> = {
      job: 'This workflow is already running on this video with the same settings.',
      run: 'That directive is already running on this video.',
    };
    return { reason: 'conflict', message: running[kind] ?? message, status };
  }

  if (status === 400 || status === 422) return { reason: 'invalid-parameters', message, status };

  return { reason: 'mux-error', message, status };
}
