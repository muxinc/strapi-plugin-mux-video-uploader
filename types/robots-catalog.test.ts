import { describe, expect, it } from 'vitest';

import {
  assetContextFrom,
  buildRobotsParameters,
  confirmWarnings,
  DEFAULT_ROBOTS_WORKFLOW,
  defaultParamValues,
  emptyQuestionRow,
  paramsFromFormValues,
  ROBOTS_CATALOG,
  ROBOTS_CATALOG_BY_KEY,
  ROBOTS_WORKFLOW_KEYS,
  robotsValuesSchema,
  validateParams,
  workflowByEventKey,
  workflowUnavailability,
  workflowUnavailableReason,
} from './robots-catalog';

const def = (key: keyof typeof ROBOTS_CATALOG_BY_KEY) => ROBOTS_CATALOG_BY_KEY[key];

const errorsFor = (key: keyof typeof ROBOTS_CATALOG_BY_KEY, values: Record<string, unknown>, context = {}) =>
  validateParams(def(key), { ...defaultParamValues(def(key).params), ...values }, context);

describe('the catalog', () => {
  it('has the twelve public workflows, each with its SDK resource and webhook spelling', () => {
    expect(ROBOTS_CATALOG.map((workflow) => workflow.key)).toEqual([...ROBOTS_WORKFLOW_KEYS]);
    for (const workflow of ROBOTS_CATALOG) {
      expect(workflow.eventKey).toBe(workflow.key.replace(/-/g, '_'));
      expect(workflow.sdkKey).toBe(workflow.key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()));
      expect(workflowByEventKey(workflow.eventKey)).toBe(workflow);
    }
  });

  it('never exposes prompt_overrides or detection_method', () => {
    const names = ROBOTS_CATALOG.flatMap((workflow) => workflow.params.map((field) => field.name));

    expect(names.filter((name) => name.startsWith('prompt_overrides'))).toEqual([]);
    expect(names.filter((name) => name.includes('detection_method'))).toEqual([]);
  });

  it('never offers a select option that claims a default Mux does not document', () => {
    const labels = ROBOTS_CATALOG.flatMap((workflow) =>
      workflow.params.flatMap((field) => (field.options ?? []).map((option) => option.label))
    );

    expect(labels).not.toContain('Default');
  });

  it('opens on a workflow every asset can run', () => {
    expect(
      workflowUnavailableReason(def(DEFAULT_ROBOTS_WORKFLOW), { isAudioOnly: true, hasCaptions: false })
    ).toBeUndefined();
  });

  it('disables picture workflows on audio-only assets and chapters without captions', () => {
    expect(workflowUnavailableReason(def('find-scenes'), { isAudioOnly: true })).toBe(
      'is not available for audio-only videos'
    );
    expect(workflowUnavailableReason(def('find-best-thumbnails'), { isAudioOnly: true })).toBe(
      'is not available for audio-only videos'
    );
    expect(workflowUnavailableReason(def('generate-chapters'), { hasCaptions: false })).toBe('needs a caption track');
    expect(workflowUnavailableReason(def('find-scenes'), {})).toBeUndefined();
  });

  it('points chapters without captions at premium captions, and audio-only assets at nothing', () => {
    expect(workflowUnavailability(def('generate-chapters'), { hasCaptions: false })).toEqual({
      reason: 'no-captions',
      fix: 'generate-premium-captions',
    });
    expect(workflowUnavailability(def('find-scenes'), { isAudioOnly: true })).toEqual({ reason: 'audio-only' });
  });
});

describe('building parameters', () => {
  it('nests dotted names and always adds the asset id', () => {
    expect(buildRobotsParameters('ast_1', { 'thresholds.sexual': 0.5, 'output_steering.scope.start_time': 3 })).toEqual(
      {
        asset_id: 'ast_1',
        thresholds: { sexual: 0.5 },
        output_steering: { scope: { start_time: 3 } },
      }
    );
  });

  it('drops what the person left alone but keeps false', () => {
    expect(
      paramsFromFormValues(def('summarize'), 'ast_1', {
        tone: '',
        title_length: undefined,
        'output_steering.brand_terms': [],
        output_language_code: null,
        update_asset_meta: false,
      })
    ).toEqual({ asset_id: 'ast_1', update_asset_meta: false });
  });

  it('never sends form-only controls or fields their condition hides', () => {
    const values = {
      ...defaultParamValues(def('edit-captions').params),
      track_id: 'trk_1',
      replacements: [{ find: 'teh', replace: 'the', caseSensitive: false }],
      upload_to_mux: false,
    };

    expect(paramsFromFormValues(def('edit-captions'), 'ast_1', values)).toEqual({
      asset_id: 'ast_1',
      track_id: 'trk_1',
      replacements: [{ find: 'teh', replace: 'the' }],
      upload_to_mux: false,
    });
  });

  it('sends the censoring object only while censoring is on, with its documented default mode', () => {
    const values = { ...defaultParamValues(def('edit-captions').params), track_id: 'trk_1', censor_profanity: true };

    expect(paramsFromFormValues(def('edit-captions'), 'ast_1', values)).toMatchObject({
      auto_censor_profanity: { mode: 'blank' },
    });
    expect(paramsFromFormValues(def('edit-captions'), 'ast_1', values)).not.toHaveProperty('censor_profanity');
  });

  it('only sends replace_existing while uploading the captions', () => {
    const values = { ...defaultParamValues(def('generate-premium-captions').params), replace_existing: true };

    expect(paramsFromFormValues(def('generate-premium-captions'), 'ast_1', values)).toMatchObject({
      replace_existing: true,
    });
    expect(
      paramsFromFormValues(def('generate-premium-captions'), 'ast_1', { ...values, upload_to_mux: false })
    ).not.toHaveProperty('replace_existing');
  });

  it("hides moderate's language on videos with pictures, and keeps it when the kind is unknown", () => {
    const values = { language_code: 'en' };

    expect(paramsFromFormValues(def('moderate'), 'ast_1', values, { isAudioOnly: false })).not.toHaveProperty(
      'language_code'
    );
    expect(paramsFromFormValues(def('moderate'), 'ast_1', values, {})).toHaveProperty('language_code', 'en');
  });

  it('turns question rows into answer options or free-form replies, never both', () => {
    const questions = [
      { question: 'Is there a dog?', answerOptions: '', answerMode: 'options' },
      { question: 'Which colour?', answerOptions: 'red, blue ,', answerMode: 'options' },
      { question: 'What happens?', answerOptions: 'ignored', answerMode: 'free_form' },
      { question: '   ', answerOptions: 'x', answerMode: 'options' },
    ];

    expect(paramsFromFormValues(def('ask-questions'), 'ast_1', { questions })).toEqual({
      asset_id: 'ast_1',
      questions: [
        { question: 'Is there a dog?' },
        { question: 'Which colour?', answer_options: ['red', 'blue'] },
        { question: 'What happens?', free_form_reply: true },
      ],
    });
  });

  it('sends a taxonomy whole, with allow_other, or not at all', () => {
    const taxonomy = {
      name: ' Pillars ',
      allowOther: false,
      values: [
        { label: 'News', description: '', aliases: 'current events, headlines' },
        { label: '  ', description: 'empty rows are dropped', aliases: '' },
      ],
    };

    expect(paramsFromFormValues(def('summarize'), 'ast_1', { 'output_steering.tag_taxonomy': taxonomy })).toEqual({
      asset_id: 'ast_1',
      output_steering: {
        tag_taxonomy: {
          name: 'Pillars',
          values: [{ label: 'News', aliases: ['current events', 'headlines'] }],
          allow_other: false,
        },
      },
    });
    expect(
      paramsFromFormValues(def('summarize'), 'ast_1', {
        'output_steering.tag_taxonomy': { name: '', allowOther: true, values: [] },
      })
    ).toEqual({ asset_id: 'ast_1' });
  });
});

describe('validation', () => {
  it('requires the required fields', () => {
    expect(errorsFor('translate-captions', {})).toEqual([
      'Source caption track is required.',
      'Target language is required.',
    ]);
    expect(errorsFor('ask-questions', { questions: [emptyQuestionRow()] })).toContain('Questions is required.');
  });

  it('checks number bounds', () => {
    expect(errorsFor('find-best-thumbnails', { max_thumbnails: 6 })).toContain('Maximum candidates must be at most 5.');
    expect(errorsFor('moderate', { sampling_interval: 2 })).toContain('Seconds between samples must be at least 5.');
    expect(errorsFor('find-scenes', { min_scene_duration_ms: 500 })).toContain(
      'Minimum scene length (ms) must be at least 1000.'
    );
    expect(errorsFor('find-key-moments', { max_moments: 26 }, { hasCaptions: true })).toContain(
      'Maximum moments must be at most 25.'
    );
    expect(
      errorsFor('ask-questions', {
        questions: [{ question: 'Why?', answerOptions: '', answerMode: 'free_form' }],
        max_free_form_answer_length: 1001,
      })
    ).toContain('Maximum length of a written answer must be at most 1000.');
  });

  it("caps premium captions' phrase hints", () => {
    const phrases = Array.from({ length: 101 }, (_, index) => `phrase ${index}`);

    expect(errorsFor('generate-premium-captions', { phrases })).toContain('Phrase hints: at most 100 entries.');
    expect(errorsFor('generate-premium-captions', { phrases: ['x'.repeat(50)] })[0]).toMatch(/at most 49 characters/);
    expect(errorsFor('generate-premium-captions', { phrases: ['one two three four five six'] })[0]).toMatch(
      /at most 5 words/
    );
    expect(errorsFor('generate-premium-captions', { phrases: ['<b>'] })[0]).toMatch(/cannot contain/);
    expect(errorsFor('generate-premium-captions', { phrases: ['Mux Robots'] })).toEqual([]);
  });

  it('needs something for edit-captions to do', () => {
    expect(errorsFor('edit-captions', { track_id: 'trk_1' })).toEqual([
      'Add at least one replacement rule, or turn on "Censor profanity".',
    ]);
    expect(errorsFor('edit-captions', { track_id: 'trk_1', censor_profanity: true })).toEqual([]);
  });

  it('holds the execution window to start before end, and start inside the video', () => {
    expect(
      errorsFor('summarize', { 'output_steering.scope.start_time': 30, 'output_steering.scope.end_time': 10 })
    ).toEqual(['The start time must be before the end time.']);
    expect(errorsFor('summarize', { 'output_steering.scope.start_time': 90 }, { duration: 60 })).toEqual([
      'The start time is past the end of the video, which is 60 seconds long.',
    ]);
  });

  it('wants both highlight bounds or neither, in order', () => {
    expect(errorsFor('find-key-moments', { 'target_duration_ms.min': 1000 }, { hasCaptions: true })).toEqual([
      'Set both highlight length bounds, or neither.',
    ]);
    expect(
      errorsFor(
        'find-key-moments',
        { 'target_duration_ms.min': 5000, 'target_duration_ms.max': 1000 },
        { hasCaptions: true }
      )
    ).toEqual(['The minimum highlight length cannot exceed the maximum.']);
  });

  it('wants captions for key moments unless they come from the picture', () => {
    expect(errorsFor('find-key-moments', {}, { hasCaptions: false })[0]).toMatch(/no caption track/);
    expect(errorsFor('find-key-moments', { use_shots: true }, { hasCaptions: false })).toEqual([]);
    expect(errorsFor('find-key-moments', { use_shots: true }, { hasCaptions: false, isAudioOnly: true })).toHaveLength(
      2
    );
  });

  it('wants captions for chapters', () => {
    expect(errorsFor('generate-chapters', {}, { hasCaptions: false })[0]).toMatch(
      /Chapters are generated from the transcript/
    );
    expect(errorsFor('generate-chapters', {}, {})).toEqual([]);
  });

  it("caps ask-questions' question and option lengths", () => {
    expect(errorsFor('ask-questions', { questions: [{ question: 'x'.repeat(601), answerOptions: '' }] })).toContain(
      'A question can be at most 600 characters.'
    );
    expect(errorsFor('ask-questions', { questions: [{ question: 'Pick', answerOptions: 'y'.repeat(151) }] })).toContain(
      'An answer option can be at most 150 characters.'
    );
  });

  it("enforces the tag taxonomy's documented caps", () => {
    const values = Array.from({ length: 51 }, (_, index) => ({
      label: `value ${index} ${'x'.repeat(30)}`,
      description: '',
      aliases: '',
    }));
    const errors = errorsFor('summarize', {
      'output_steering.tag_taxonomy': { name: 'n'.repeat(101), allowOther: true, values },
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        'Tag taxonomy: at most 50 values.',
        'Tag taxonomy: the taxonomy name is at most 100 characters.',
        expect.stringContaining('the whole taxonomy is at most 2000 characters'),
      ])
    );
    expect(
      errorsFor('summarize', { 'output_steering.tag_taxonomy': { name: 'Named', allowOther: true, values: [] } })
    ).toEqual(['Tag taxonomy: add at least one value, or clear the taxonomy name.']);
  });

  it("enforces the tag taxonomy's per-value caps", () => {
    const taxonomy = (row: Record<string, string>) => ({
      'output_steering.tag_taxonomy': {
        name: '',
        allowOther: true,
        values: [{ label: 'News', description: '', aliases: '', ...row }],
      },
    });

    expect(errorsFor('summarize', taxonomy({ label: 'l'.repeat(101) }))[0]).toMatch(
      /a value is at most 100 characters/
    );
    expect(errorsFor('summarize', taxonomy({ description: 'd'.repeat(301) }))[0]).toMatch(
      /the description of "News" is at most 300 characters/
    );
    expect(
      errorsFor('summarize', taxonomy({ aliases: Array.from({ length: 11 }, (_, i) => `alias${i}`).join(', ') }))[0]
    ).toMatch(/"News" has more than 10 aliases/);
    expect(errorsFor('summarize', taxonomy({ aliases: 'a'.repeat(101) }))[0]).toMatch(
      /an alias is at most 100 characters/
    );
    expect(errorsFor('summarize', taxonomy({ description: 'When it is news', aliases: 'headlines' }))).toEqual([]);
  });

  it('keeps moderation thresholds between 0 and 1, and written answers at least 1 character', () => {
    expect(errorsFor('moderate', { 'thresholds.sexual': 1.5 })).toEqual([
      'Sexual content threshold must be at most 1.',
    ]);
    expect(errorsFor('moderate', { 'thresholds.violence': -0.1 })).toEqual(['Violence threshold must be at least 0.']);
    expect(
      errorsFor('ask-questions', {
        questions: [{ question: 'Why?', answerOptions: '', answerMode: 'free_form' }],
        max_free_form_answer_length: 0,
      })
    ).toEqual(['Maximum length of a written answer must be at least 1.']);
  });

  it('requires a target language to dub into', () => {
    expect(errorsFor('translate-audio', {})).toEqual(['Target language is required.']);
    expect(errorsFor('translate-audio', { to_language_code: 'es' })).toEqual([]);
  });

  it('allows at most four tie-breakers', () => {
    expect(
      errorsFor(
        'find-key-moments',
        { 'output_steering.rubric_priorities': ['novelty', 'novelty', 'novelty', 'novelty', 'novelty'] },
        { hasCaptions: true }
      )
    ).toContain('Tie-breakers: at most 4 entries.');
  });
});

describe('confirm warnings', () => {
  it('warns before arming the deletion of playback IDs, and only then', () => {
    expect(confirmWarnings(def('moderate'), { 'on_flagged.action': 'delete_playback_ids' })).toEqual([
      expect.objectContaining({ title: 'This run can make the video unplayable' }),
    ]);
    expect(confirmWarnings(def('moderate'), defaultParamValues(def('moderate').params))).toEqual([]);
  });
});

describe('form values the server accepts', () => {
  it('accepts what the form produces', () => {
    const values = {
      ...defaultParamValues(def('summarize').params),
      title_length: 8,
      'output_steering.brand_terms': ['Mux'],
      'output_steering.tag_taxonomy': {
        name: '',
        allowOther: true,
        values: [{ label: 'a', description: '', aliases: '' }],
      },
    };

    expect(robotsValuesSchema(def('summarize')).safeParse(values).success).toBe(true);
  });

  it("rejects fields the workflow doesn't have, so nothing outside the catalog reaches Mux", () => {
    const parsed = robotsValuesSchema(def('summarize')).safeParse({ prompt_overrides: { title: 'x' } });

    expect(parsed.success).toBe(false);
  });

  it('rejects select values outside the documented enum', () => {
    expect(robotsValuesSchema(def('summarize')).safeParse({ tone: 'sarcastic' }).success).toBe(false);
    expect(robotsValuesSchema(def('moderate')).safeParse({ 'on_flagged.action': 'delete_asset' }).success).toBe(false);
  });
});

describe('the asset', () => {
  it('reads captions, kind and duration from the stored Mux asset', () => {
    expect(
      assetContextFrom({
        duration: 42,
        tracks: [
          { type: 'video' },
          { type: 'audio' },
          { type: 'text', text_type: 'subtitles', status: 'ready' },
          { type: 'text', text_type: 'chapters', status: 'ready' },
        ],
      })
    ).toEqual({ duration: 42, hasCaptions: true, isAudioOnly: false });
    expect(
      assetContextFrom({ tracks: [{ type: 'audio' }, { type: 'text', text_type: 'subtitles', status: 'preparing' }] })
    ).toEqual({
      hasCaptions: false,
      isAudioOnly: true,
    });
    expect(assetContextFrom(undefined)).toEqual({});
  });
});
