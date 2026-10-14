import { describe, expect, it } from 'vitest';

import { MuxError } from '@mux/ts/core/error';

import { muxApiError, muxConnectionError, muxTimeoutError } from '../../../test/mux';
import { classifyMuxError, readMuxErrorMessage, ROBOTS_DASHBOARD_URL } from './errors';

const body = (type: string | undefined, messages: unknown) => ({ error: { ...(type ? { type } : {}), messages } });

describe('classifyMuxError', () => {
  it.each([
    ['401', muxApiError(401, body('unauthorized', ['Unauthorized'])), 'scope-missing'],
    ['insufficient_scope', muxApiError(403, body('insufficient_scope', ['Missing scope'])), 'scope-missing'],
    ['403 without a type', muxApiError(403, { error: { messages: ['Forbidden'] } }), 'not-enabled'],
    ['403 forbidden', muxApiError(403, body('forbidden', ['Robots is not enabled'])), 'not-enabled'],
    [
      'robots_units_limit_exceeded',
      muxApiError(403, body('robots_units_limit_exceeded', ['Not enough units'])),
      'units-exhausted',
    ],
    ['409', muxApiError(409, body('conflict', ['Duplicate'])), 'conflict'],
    ['400', muxApiError(400, body('invalid_parameters', ['bad'])), 'invalid-parameters'],
    ['422', muxApiError(422, body('invalid_parameters', ['bad'])), 'invalid-parameters'],
    [
      'robots_workflow_not_available',
      muxApiError(403, body('robots_workflow_not_available', ['Not on your plan'])),
      'mux-error',
    ],
    ['500', muxApiError(500, body('internal', ['Oops'])), 'mux-error'],
    ['429', muxApiError(429, body('rate_limited', ['Slow down'])), 'mux-error'],
    ['a connection error', muxConnectionError(), 'unconfirmed'],
    ['a timeout', muxTimeoutError(), 'unconfirmed'],
    [
      'an error raised before anything is sent',
      new MuxError('Path parameters result in path with invalid segments'),
      'invalid-parameters',
    ],
    ['an error from anywhere else', new TypeError('Cannot read properties of undefined'), 'unconfirmed'],
  ])('classifies %s', (_case, error, reason) => {
    expect(classifyMuxError(error).reason).toBe(reason);
  });

  it("links the page Mux's message names for accepting Robots' terms", () => {
    const error = muxApiError(
      403,
      body('forbidden', [
        'Accept the Robots terms at https://dashboard.mux.com/organizations/o1/environments/e1/robots.',
      ])
    );

    expect(classifyMuxError(error)).toMatchObject({
      reason: 'not-enabled',
      termsUrl: 'https://dashboard.mux.com/organizations/o1/environments/e1/robots',
    });
  });

  it('falls back to the dashboard when the message names no page', () => {
    expect(classifyMuxError(muxApiError(403, body('forbidden', ['Forbidden']))).termsUrl).toBe(ROBOTS_DASHBOARD_URL);
  });

  it('says what a conflict means for a job and for a directive run', () => {
    const error = muxApiError(409, body('conflict', ['Duplicate']));

    expect(classifyMuxError(error, 'job').message).toBe(
      'This workflow is already running on this video with the same settings.'
    );
    expect(classifyMuxError(error, 'run').message).toBe('That directive is already running on this video.');
  });

  it("keeps Mux's words for a conflict on anything but a create", () => {
    const error = muxApiError(409, body('conflict', ['This job has already finished.']));

    expect(classifyMuxError(error)).toMatchObject({ reason: 'conflict', message: 'This job has already finished.' });
  });

  it("keeps Mux's own message", () => {
    expect(classifyMuxError(muxApiError(400, body('invalid_parameters', ['track_id is required']))).message).toBe(
      'track_id is required'
    );
  });
});

describe('readMuxErrorMessage', () => {
  it.each([
    ['every error.messages entry', { error: { messages: ['One.', { message: 'Two.' }, ' '] } }, 'One. Two.'],
    ['error.message', { error: { message: 'Singular.' } }, 'Singular.'],
    ['root messages', { messages: ['Root list.'] }, 'Root list.'],
    ['root message', { message: 'Root message.' }, 'Root message.'],
    ['root errors', { errors: [{ message: 'From errors.' }] }, 'From errors.'],
    ['error as a string', { error: 'invalid_parameters' }, 'invalid_parameters'],
    ['nothing recognisable', { what: 'ever' }, 'Mux rejected this request (HTTP 418)'],
    ['no body', undefined, 'Mux rejected this request (HTTP 418)'],
  ])('reads %s', (_case, errorBody, message) => {
    expect(readMuxErrorMessage(errorBody, 418)).toBe(message);
  });

  it('prefers error.messages over every other shape', () => {
    expect(
      readMuxErrorMessage({ error: { messages: ['First choice.'], message: 'Second.' }, message: 'Third.' }, 400)
    ).toBe('First choice.');
  });
});
