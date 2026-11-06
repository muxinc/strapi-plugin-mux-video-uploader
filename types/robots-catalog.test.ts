import { describe, expect, it } from 'vitest';

import {
  assetContextFrom,
  buildRobotsParameters,
  confirmWarnings,
  DEFAULT_ROBOTS_WORKFLOW,
  defaultParamValues,
  emptyQuestionRow,
  isRunnableWorkflow,
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
  it('has every workflow, each with its SDK resource and webhook spelling', () => {
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

  it.each(['generate-premium-captions', 'translate-captions', 'translate-audio'] as const)(
    "only sends %s's replace_existing_tracks while uploading, failing on a clash by default",
    (key) => {
      const values = defaultParamValues(def(key).params);

      expect(paramsFromFormValues(def(key), 'ast_1', values)).toMatchObject({ replace_existing_tracks: 'fail' });
      expect(paramsFromFormValues(def(key), 'ast_1', { ...values, upload_to_mux: false })).not.toHaveProperty(
        'replace_existing_tracks'
      );
    }
  );

  it('sends the v1 field names, never their v0 ones', () => {
    const names = ROBOTS_CATALOG.flatMap((workflow) => workflow.params.map((field) => field.name));

    for (const removed of ['to_language_code', 'replace_existing', 'delete_original_track', 'track_name_suffix']) {
      expect(names).not.toContain(removed);
    }
    expect(names.filter((name) => name.startsWith('target_duration_ms'))).toEqual([]);
    expect(
      paramsFromFormValues(def('find-key-moments'), 'ast_1', { 'target_duration.min': 5, 'target_duration.max': 20.5 })
    ).toEqual({ asset_id: 'ast_1', target_duration: { min: 5, max: 20.5 } });
  });

  it("edits captions on v1's defaults: the edited track replaces the source and keeps its name", () => {
    const values = { ...defaultParamValues(def('edit-captions').params), track_id: 'trk_en', censor_profanity: true };

    expect(paramsFromFormValues(def('edit-captions'), 'ast_1', values)).toMatchObject({
      replace_existing_tracks: 'replace',
    });
    expect(paramsFromFormValues(def('edit-captions'), 'ast_1', values)).not.toHaveProperty('track_name');
    // Mux runs it without an upload only when neither is sent.
    const notUploaded = paramsFromFormValues(def('edit-captions'), 'ast_1', {
      ...values,
      upload_to_mux: false,
      track_name: 'Kept',
    });
    expect(notUploaded).not.toHaveProperty('replace_existing_tracks');
    expect(notUploaded).not.toHaveProperty('track_name');
  });

  it('sends speaker names trimmed and without brackets, and drops half-filled rows', () => {
    expect(
      paramsFromFormValues(def('edit-captions'), 'ast_1', {
        track_id: 'trk_en',
        speaker_replacements: [
          { find: ' [Speaker 1] ', replace: ' Ana ' },
          { find: 'Speaker 2', replace: '' },
        ],
      })
    ).toMatchObject({ speaker_replacements: [{ find: 'Speaker 1', replace: 'Ana' }] });
  });

  it("sends moderate's captions to read whenever the transcript is moderated, as Robots v1 reads them on videos too", () => {
    const values = { ...defaultParamValues(def('moderate').params), language_code: 'en' };

    expect(paramsFromFormValues(def('moderate'), 'ast_1', values, { isAudioOnly: false })).toMatchObject({
      include_transcript: true,
      language_code: 'en',
    });
    expect(
      paramsFromFormValues(def('moderate'), 'ast_1', { ...values, include_transcript: false }, { isAudioOnly: false })
    ).not.toHaveProperty('language_code');
    // An audio-only video is always moderated on its transcript, so the option isn't sent.
    const audioOnly = paramsFromFormValues(def('moderate'), 'ast_1', values, { isAudioOnly: true });
    expect(audioOnly).toHaveProperty('language_code', 'en');
    expect(audioOnly).not.toHaveProperty('include_transcript');
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
      'Add at least one replacement rule or speaker name, or turn on "Censor profanity".',
    ]);
    expect(errorsFor('edit-captions', { track_id: 'trk_1', censor_profanity: true })).toEqual([]);
    expect(
      errorsFor('edit-captions', { track_id: 'trk_1', speaker_replacements: [{ find: 'Speaker 1', replace: 'Ana' }] })
    ).toEqual([]);
  });

  describe("edit-captions' new track name", () => {
    const context = {
      captionTracks: [
        { id: 'trk_en', name: 'English', language_code: 'en' },
        { id: 'trk_es', name: 'Spanish', language_code: 'es' },
      ],
      textTracks: [
        { id: 'trk_en', name: 'English' },
        { id: 'trk_es', name: 'Spanish' },
        { id: 'trk_chapters', name: 'Chapters' },
      ],
    };
    const edit = (values: Record<string, unknown>) =>
      errorsFor('edit-captions', { track_id: 'trk_en', censor_profanity: true, ...values }, context);

    it('needs a name of its own to keep the source', () => {
      expect(edit({ replace_existing_tracks: 'fail' })).toEqual([
        'Keeping the track being edited needs a name for the new track.',
      ]);
      expect(edit({ replace_existing_tracks: 'fail', track_name: ' english ' })).toEqual([
        'Keeping the track being edited needs a different name for the new track.',
      ]);
      expect(edit({ replace_existing_tracks: 'fail', track_name: 'English (clean)' })).toEqual([]);
    });

    it("can't take another text track's name, ignoring case, whichever choice", () => {
      expect(edit({ track_name: 'SPANISH' })).toEqual(['This video already has a text track named "Spanish".']);
      expect(edit({ replace_existing_tracks: 'fail', track_name: 'chapters' })).toEqual([
        'This video already has a text track named "Chapters".',
      ]);
      expect(edit({ track_name: 'English' })).toEqual([]);
    });

    it('checks nothing about names without an upload', () => {
      expect(edit({ upload_to_mux: false, replace_existing_tracks: 'fail' })).toEqual([]);
    });
  });

  it('reads only a caption language the video has, matched exactly as Robots v1 does', () => {
    const context = { captionTracks: [{ id: 'trk_en', language_code: 'en-US' }] };

    expect(errorsFor('summarize', { language_code: 'en' }, context)[0]).toMatch(/no ready caption track in "en"/);
    expect(errorsFor('summarize', { language_code: 'en-US' }, context)).toEqual([]);
    // Unknown tracks never block a run.
    expect(errorsFor('summarize', { language_code: 'en' }, {})).toEqual([]);
  });

  it('holds the execution window to start before end, and start inside the video', () => {
    expect(
      errorsFor('summarize', { 'output_steering.scope.start_time': 30, 'output_steering.scope.end_time': 10 })
    ).toEqual(['The start time must be before the end time.']);
    expect(errorsFor('summarize', { 'output_steering.scope.start_time': 90 }, { duration: 60 })).toEqual([
      'The start time is past the end of the video, which is 60 seconds long.',
    ]);
  });

  it('wants both highlight bounds or neither, in order, in seconds that can be fractions', () => {
    expect(errorsFor('find-key-moments', { 'target_duration.min': 1 }, { hasCaptions: true })).toEqual([
      'Set both highlight length bounds, or neither.',
    ]);
    expect(
      errorsFor('find-key-moments', { 'target_duration.min': 5, 'target_duration.max': 1 }, { hasCaptions: true })
    ).toEqual(['The minimum highlight length cannot exceed the maximum.']);
    expect(
      errorsFor('find-key-moments', { 'target_duration.min': 2.5, 'target_duration.max': 7.25 }, { hasCaptions: true })
    ).toEqual([]);
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

  it('wants whole numbers for counts', () => {
    expect(errorsFor('summarize', { title_length: 2.5 })).toEqual(['Max title length (words) must be a whole number.']);
    expect(errorsFor('summarize', { tag_count: 0.5 })).toEqual(['Number of tags must be a whole number.']);
    expect(errorsFor('moderate', { max_samples: 3.2 })).toEqual(['Maximum samples must be a whole number.']);
    expect(errorsFor('summarize', { title_length: 3, tag_count: 12 })).toEqual([]);
  });

  it('marks every count as a whole number, and no time', () => {
    const integerFields = ROBOTS_CATALOG.flatMap((workflow) =>
      workflow.params.filter((field) => field.integer).map((field) => `${workflow.key}:${field.name}`)
    );

    expect(integerFields).toEqual(
      expect.arrayContaining([
        'summarize:title_length',
        'summarize:description_length',
        'summarize:tag_count',
        'ask-questions:max_free_form_answer_length',
        'find-key-moments:max_moments',
        'find-best-thumbnails:max_thumbnails',
        'moderate:max_samples',
      ])
    );
    // Seconds and thresholds can be fractions.
    expect(integerFields).not.toContain('moderate:thresholds.sexual');
    expect(integerFields).not.toContain('summarize:output_steering.scope.start_time');
    expect(integerFields).not.toContain('find-key-moments:target_duration.min');
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
    expect(errorsFor('translate-audio', { output_language_code: 'es' })).toEqual([]);
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

  it('warns before a run deletes the tracks in its way, and only while uploading', () => {
    const values = { ...defaultParamValues(def('translate-captions').params), replace_existing_tracks: 'replace_all' };

    expect(confirmWarnings(def('translate-captions'), values)).toEqual([
      expect.objectContaining({ title: 'This run deletes tracks first' }),
    ]);
    expect(confirmWarnings(def('translate-captions'), { ...values, upload_to_mux: false })).toEqual([]);
  });
});

describe('Analyze structure and the workflows Strapi only lists', () => {
  it('offers Analyze structure, and never Find scenes or Generate contextual text', () => {
    expect(ROBOTS_CATALOG.filter(isRunnableWorkflow).map((workflow) => workflow.key)).toContain('analyze-structure');
    expect(isRunnableWorkflow(def('find-scenes'))).toBe(false);
    expect(isRunnableWorkflow(def('generate-contextual-text'))).toBe(false);
  });

  it('runs on audio-only videos that have captions, and leaves both asset updates off', () => {
    expect(workflowUnavailability(def('analyze-structure'), { isAudioOnly: true, hasCaptions: true })).toBeUndefined();
    expect(workflowUnavailability(def('analyze-structure'), { isAudioOnly: true, hasCaptions: false })).toEqual({
      reason: 'no-captions',
      fix: 'generate-premium-captions',
    });
    expect(
      workflowUnavailability(def('analyze-structure'), { isAudioOnly: false, hasCaptions: false })
    ).toBeUndefined();
    expect(
      paramsFromFormValues(def('analyze-structure'), 'ast_1', defaultParamValues(def('analyze-structure').params))
    ).toEqual({ asset_id: 'ast_1', update_asset_meta: false, update_asset_chapters: false });
  });

  it("holds the steering to Mux's documented limits", () => {
    expect(errorsFor('analyze-structure', { 'output_steering.audience': 'x'.repeat(161) })).toEqual([
      'Audience is at most 160 characters.',
    ]);
    expect(
      errorsFor('analyze-structure', { 'output_steering.brand_terms': Array.from({ length: 7 }, () => 'x'.repeat(40)) })
    ).toEqual(['Brand terms: at most 240 characters in all.']);
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
    ).toEqual({ duration: 42, hasCaptions: true, isAudioOnly: false, captionTracks: [], textTracks: [] });
    expect(
      assetContextFrom({
        tracks: [
          { type: 'audio' },
          { id: 'trk_es', type: 'text', text_type: 'subtitles', status: 'ready', name: 'Spanish', language_code: 'es' },
          { id: 'trk_en', type: 'text', text_type: 'subtitles', status: 'preparing', language_code: 'en' },
        ],
      })
    ).toEqual({
      hasCaptions: true,
      isAudioOnly: true,
      captionTracks: [{ id: 'trk_es', name: 'Spanish', language_code: 'es' }],
      textTracks: [
        { id: 'trk_es', name: 'Spanish' },
        { id: 'trk_en', name: undefined },
      ],
    });
    expect(assetContextFrom(undefined)).toEqual({});
  });

  it("counts an audio-only video's one legacy text track as its transcript, as Robots v1 does", () => {
    const legacy = { id: 'trk_1', type: 'text', status: 'ready', name: 'Transcript' };

    expect(assetContextFrom({ tracks: [{ type: 'audio' }, legacy] })).toMatchObject({ hasCaptions: true });
    expect(assetContextFrom({ tracks: [{ type: 'video' }, { type: 'audio' }, legacy] })).toMatchObject({
      hasCaptions: false,
    });
    expect(assetContextFrom({ tracks: [{ type: 'audio' }, legacy, { ...legacy, id: 'trk_2' }] })).toMatchObject({
      hasCaptions: false,
    });
  });
});
