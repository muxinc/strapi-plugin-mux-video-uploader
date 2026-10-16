import { z } from 'zod';

/**
 * The workflows as data, so the run form renders itself and the server validates and builds what it
 * sends from the same descriptors.
 *
 * Only documented parameters are listed. Where the reference and a guide disagree on a limit, the
 * stricter figure wins. Left out on purpose: `summarize`'s and `generate-chapters`' `prompt_overrides`
 * (superseded by `output_steering`), and `edit-captions`' `auto_censor_profanity.detection_method`
 * (one documented value).
 */

export const ROBOTS_WORKFLOW_KEYS = [
  'generate-premium-captions',
  'edit-captions',
  'translate-captions',
  'translate-audio',
  'summarize',
  'ask-questions',
  'find-key-moments',
  'find-best-thumbnails',
  'generate-engagement-insights',
  'generate-chapters',
  'find-scenes',
  'moderate',
] as const;

export type RobotsWorkflow = (typeof ROBOTS_WORKFLOW_KEYS)[number];

export type RobotsParamKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'language'
  | 'track'
  | 'stringList'
  /** Multi-select over a fixed enum. Never free text. */
  | 'enumList'
  | 'questions'
  | 'replacements'
  /** A controlled vocabulary: `topic_taxonomy` / `tag_taxonomy`. */
  | 'taxonomy';

export interface RobotsParamOption {
  value: string;
  label: string;
}

/**
 * What is known about the Mux asset itself, as opposed to what the person typed. Every member is
 * optional and stays optional: not knowing must never block a run or hide a control, so every rule
 * reads an explicit `true` / `false`.
 */
export interface RobotsAssetContext {
  hasCaptions?: boolean;
  isAudioOnly?: boolean;
  /** Seconds. */
  duration?: number;
}

/**
 * When a field is rendered, and therefore when it is sent: off another field's value, or off what
 * the asset is. The context form is `notEquals` so an unknown context still shows the control.
 */
export type RobotsFieldCondition =
  | { field: string; equals: unknown }
  | { context: keyof RobotsAssetContext; notEquals: unknown };

/** The documented caps on one controlled vocabulary. An absent limit means the reference states none. */
export interface RobotsTaxonomyLimits {
  maxValues?: number;
  maxNameLength?: number;
  maxLabelLength?: number;
  maxDescriptionLength?: number;
  maxAliases?: number;
  maxAliasLength?: number;
  /** Measured over the JSON of the object actually sent. */
  maxSerializedLength?: number;
}

/** A warning the confirm step must show before a run that arms a destructive value. */
export interface RobotsConfirmWarning {
  whenValue: string;
  title: string;
  body: string;
}

/** A titled group of neighbouring fields in the run form. Presentation only. */
export interface RobotsParamSection {
  id: string;
  title: string;
  description?: string;
}

export interface RobotsParamField {
  kind: RobotsParamKind;
  /** Dotted path within the job's `parameters` object. */
  name: string;
  label: string;
  helpText?: string;
  section?: RobotsParamSection;
  isRequired?: boolean;
  placeholder?: string;
  /** `select` and `enumList` only. */
  options?: RobotsParamOption[];
  /** `number` only. */
  min?: number;
  max?: number;
  step?: number;
  /** `track` only: which kind of existing asset track to pick from. */
  trackType?: 'text' | 'audio';
  /** `stringList` and `enumList`. */
  maxItems?: number;
  /** `stringList` only. */
  maxItemLength?: number;
  /** `taxonomy` only. */
  taxonomyLimits?: RobotsTaxonomyLimits;
  /** The form's starting value. `''` means "untouched", and is never sent. */
  defaultValue?: string | number | boolean;
  /** Render, and send, this parameter only while a condition holds. A hidden field is never sent. */
  showWhen?: RobotsFieldCondition;
  /** A control that shapes the request without being a parameter itself. Never sent to Mux. */
  formOnly?: boolean;
  /** Warnings the confirm step must show, by the value that arms them. */
  confirmWarnings?: RobotsConfirmWarning[];
}

export type RobotsCategory = 'Accessibility' | 'Insights' | 'Structure' | 'Trust & Safety';

export interface RobotsWorkflowDefinition {
  key: RobotsWorkflow;
  /** The workflow's resource on `client.robots.jobs`. */
  sdkKey:
    | 'askQuestions'
    | 'editCaptions'
    | 'findBestThumbnails'
    | 'findKeyMoments'
    | 'findScenes'
    | 'generateChapters'
    | 'generateEngagementInsights'
    | 'generatePremiumCaptions'
    | 'moderate'
    | 'summarize'
    | 'translateAudio'
    | 'translateCaptions';
  /** How webhook types spell the workflow: `robots.job.<eventKey>.<status>`. */
  eventKey: string;
  label: string;
  category: RobotsCategory;
  description: string;
  params: RobotsParamField[];
  /** Shown in the confirm step. */
  notes?: string[];
  /** Needs Mux Data views accumulated before it has anything to analyze. */
  requiresViewData?: boolean;
  /** Writes a track onto the Mux asset when it completes. */
  producesTrack?: boolean;
  /** Not available on every plan. Informational: there's no way to check ahead. */
  planRestricted?: boolean;
  /** Can't run on an audio-only asset. `find-best-thumbnails` is a product decision: it ranks frames. */
  requiresVideoTrack?: boolean;
}

/** The label for every `language_code` that picks which of the asset's caption tracks a workflow reads. */
const CAPTIONS_TO_READ_LABEL = 'Captions to read';

/** A select's `''` option: leave the parameter out. The steering parameters it's used on have no default. */
const NO_PREFERENCE_LABEL = 'No preference';

const SCOPE_SECTION: RobotsParamSection = {
  id: 'scope',
  title: 'Part of the video',
  description:
    'Seconds from the start of the video. Leave both empty to use all of it; timestamps in the ' +
    'result are still measured from the start.',
};

const SCOPE_FIELDS: RobotsParamField[] = [
  {
    kind: 'number',
    name: 'output_steering.scope.start_time',
    label: 'Start time (seconds)',
    min: 0,
    step: 1,
    section: SCOPE_SECTION,
  },
  {
    kind: 'number',
    name: 'output_steering.scope.end_time',
    label: 'End time (seconds)',
    min: 0,
    step: 1,
    section: SCOPE_SECTION,
  },
];

const TAGS_SECTION: RobotsParamSection = { id: 'tags', title: 'Tags' };

const HIGHLIGHT_LENGTH_SECTION: RobotsParamSection = {
  id: 'highlight-length',
  title: 'Highlight length',
  description: 'Set both bounds, or neither.',
};

const UPLOAD_TO_MUX: RobotsParamField = {
  kind: 'boolean',
  name: 'upload_to_mux',
  label: 'Attach the result to the Mux asset',
  helpText: 'Leave on to get a real track on the asset. Off returns a temporary download URL only.',
  defaultValue: true,
};

/** `output_steering.topic_taxonomy`, shared by `find-scenes` and `find-key-moments`. No documented caps. */
const TOPIC_TAXONOMY: RobotsParamField = {
  kind: 'taxonomy',
  name: 'output_steering.topic_taxonomy',
  label: 'Topic taxonomy',
  helpText:
    'A controlled vocabulary to steer the topics this workflow names. Leave it empty to let the ' +
    'model choose its own.',
};

export const ROBOTS_CATALOG: RobotsWorkflowDefinition[] = [
  {
    key: 'generate-premium-captions',
    sdkKey: 'generatePremiumCaptions',
    eventKey: 'generate_premium_captions',
    label: 'Generate premium captions',
    category: 'Accessibility',
    description: "High-accuracy captions from the video's audio, optionally with speaker labels.",
    producesTrack: true,
    params: [
      {
        kind: 'language',
        name: 'language_code',
        label: 'Spoken language',
        helpText: 'Leave empty to auto-detect.',
      },
      {
        kind: 'text',
        name: 'track_name',
        label: 'Track name',
        helpText:
          'Leave empty and Mux names the track after its language — "English (Generated)" for ' + 'English audio.',
      },
      { kind: 'boolean', name: 'include_speakers', label: 'Label speakers', defaultValue: false },
      { kind: 'boolean', name: 'include_words', label: 'Include word-level timings', defaultValue: false },
      {
        kind: 'stringList',
        name: 'phrases',
        label: 'Phrase hints',
        helpText:
          'Names, jargon or product terms to spell correctly. Up to 100 phrases, each at most ' +
          '5 words and 49 characters.',
        maxItems: 100,
        maxItemLength: 49,
      },
      UPLOAD_TO_MUX,
      {
        kind: 'boolean',
        name: 'replace_existing',
        label: 'Replace the existing caption track',
        helpText:
          'Off, a run is rejected when the asset already has a track in this language. On, that ' +
          'track is deleted first.',
        defaultValue: false,
        showWhen: { field: 'upload_to_mux', equals: true },
      },
    ],
  },
  {
    key: 'edit-captions',
    sdkKey: 'editCaptions',
    eventKey: 'edit_captions',
    label: 'Edit captions',
    category: 'Accessibility',
    description: 'Apply find/replace rules and profanity filtering to an existing caption track.',
    producesTrack: true,
    params: [
      { kind: 'track', name: 'track_id', label: 'Caption track to edit', trackType: 'text', isRequired: true },
      {
        kind: 'replacements',
        name: 'replacements',
        label: 'Replacements',
        helpText: 'Static find/replace rules applied to the cue text.',
      },
      {
        kind: 'boolean',
        name: 'censor_profanity',
        label: 'Censor profanity',
        helpText: 'Off leaves the words as they are. Replacements still apply either way.',
        defaultValue: false,
        formOnly: true,
      },
      {
        kind: 'select',
        name: 'auto_censor_profanity.mode',
        label: 'How to censor',
        helpText: 'Blank out writes bracketed underscores, remove drops the text, mask writes question marks.',
        options: [
          { value: 'blank', label: 'Blank out' },
          { value: 'remove', label: 'Remove' },
          { value: 'mask', label: 'Mask' },
        ],
        defaultValue: 'blank',
        showWhen: { field: 'censor_profanity', equals: true },
      },
      {
        kind: 'stringList',
        name: 'auto_censor_profanity.always_censor',
        label: 'Always censor',
        helpText: 'Words or phrases censored whatever the model decides. One per line; spaces are fine.',
        showWhen: { field: 'censor_profanity', equals: true },
      },
      {
        kind: 'stringList',
        name: 'auto_censor_profanity.never_censor',
        label: 'Never censor',
        helpText: 'Words or phrases left alone. One per line; spaces are fine.',
        showWhen: { field: 'censor_profanity', equals: true },
      },
      {
        kind: 'text',
        name: 'track_name_suffix',
        label: 'Suffix for the new track name',
        helpText: 'Added to the original track’s name. Leave empty for Mux’s default, "edited".',
      },
      UPLOAD_TO_MUX,
      {
        kind: 'boolean',
        name: 'delete_original_track',
        label: 'Delete the original track',
        helpText: 'The edited track replaces it rather than sitting alongside it.',
        defaultValue: true,
        showWhen: { field: 'upload_to_mux', equals: true },
      },
    ],
  },
  {
    key: 'translate-captions',
    sdkKey: 'translateCaptions',
    eventKey: 'translate_captions',
    label: 'Translate captions',
    category: 'Accessibility',
    description: 'Translate an existing caption track into another language.',
    producesTrack: true,
    params: [
      { kind: 'track', name: 'track_id', label: 'Source caption track', trackType: 'text', isRequired: true },
      { kind: 'language', name: 'to_language_code', label: 'Target language', isRequired: true },
      {
        kind: 'stringList',
        name: 'never_translate',
        label: 'Never translate',
        helpText:
          'Terms kept verbatim — brand names, product names, proper nouns. One per line. ' + 'Cannot contain < or >.',
      },
      UPLOAD_TO_MUX,
    ],
  },
  {
    key: 'translate-audio',
    sdkKey: 'translateAudio',
    eventKey: 'translate_audio',
    label: 'Translate audio (dub)',
    category: 'Accessibility',
    description: "Translate the video's spoken audio into another language as a new audio track.",
    producesTrack: true,
    planRestricted: true,
    notes: [
      'The run is rejected if the video has no audio track, or already has an audio track in ' + 'the target language.',
      'Dubbing may not be enabled on every account.',
    ],
    params: [{ kind: 'language', name: 'to_language_code', label: 'Target language', isRequired: true }, UPLOAD_TO_MUX],
  },
  {
    key: 'summarize',
    sdkKey: 'summarize',
    eventKey: 'summarize',
    label: 'Summarize',
    category: 'Insights',
    description: 'Generate a title, description and tags for the video.',
    params: [
      {
        kind: 'select',
        name: 'tone',
        label: 'Tone',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'neutral', label: 'Neutral' },
          { value: 'playful', label: 'Playful' },
          { value: 'professional', label: 'Professional' },
        ],
        defaultValue: '',
      },
      { kind: 'number', name: 'title_length', label: 'Max title length (words)', min: 1, step: 1 },
      { kind: 'number', name: 'description_length', label: 'Max description length (words)', min: 1, step: 1 },
      {
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'Summarize reads one of this video’s caption tracks. Choose the language of the one ' +
          'to use, or leave empty and Mux picks. The summary’s own language is Output language.',
      },
      {
        kind: 'language',
        name: 'output_language_code',
        label: 'Output language',
        helpText: 'Leave empty to write in the captions’ language.',
      },
      { kind: 'text', name: 'output_steering.audience', label: 'Audience', placeholder: 'Product marketers' },
      {
        kind: 'stringList',
        name: 'output_steering.brand_terms',
        label: 'Brand terms',
        helpText: 'Terminology to prefer in the generated copy.',
      },
      {
        kind: 'number',
        name: 'tag_count',
        label: 'Number of tags',
        helpText: 'Defaults to 10.',
        min: 1,
        step: 1,
        section: TAGS_SECTION,
      },
      {
        kind: 'taxonomy',
        name: 'output_steering.tag_taxonomy',
        label: 'Tag taxonomy',
        helpText:
          'A controlled vocabulary for the generated tags. Up to 50 values, and 2000 characters ' +
          'across the whole taxonomy. Leave it empty to let the model choose its own tags.',
        section: TAGS_SECTION,
        taxonomyLimits: {
          maxValues: 50,
          maxNameLength: 100,
          maxLabelLength: 100,
          maxDescriptionLength: 300,
          maxAliases: 10,
          maxAliasLength: 100,
          maxSerializedLength: 2000,
        },
      },
      {
        kind: 'select',
        name: 'output_steering.summary_style',
        label: 'Summary style',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'concise', label: 'Concise' },
          { value: 'detailed', label: 'Detailed' },
          { value: 'editorial', label: 'Editorial' },
        ],
        defaultValue: '',
      },
      ...SCOPE_FIELDS,
      {
        kind: 'boolean',
        name: 'update_asset_meta',
        label: "Set the Mux asset's title to the generated one",
        helpText: "Writes `meta.title` on the Mux asset. The video's title in Strapi doesn't change.",
        defaultValue: false,
      },
    ],
  },
  {
    key: 'ask-questions',
    sdkKey: 'askQuestions',
    eventKey: 'ask_questions',
    label: 'Ask questions',
    category: 'Insights',
    description: 'Ask questions about the video and get structured answers.',
    params: [
      {
        kind: 'questions',
        name: 'questions',
        label: 'Questions',
        helpText:
          'One row per question, at most 600 characters each. Pick how each one is answered: ' +
          'from a list of options (empty means yes / no, and each option can be up to 150 ' +
          'characters), or in the model’s own words.',
        isRequired: true,
      },
      {
        kind: 'number',
        name: 'max_free_form_answer_length',
        label: 'Maximum length of a written answer',
        helpText:
          'Characters, 1–1000. Defaults to 500. Ignored unless a question above is set to ' + '“In its own words”.',
        min: 1,
        max: 1000,
        step: 1,
      },
      {
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'The answers come from one of this video’s caption tracks. Choose the language of ' +
          'the one to use, or leave empty and Mux picks.',
      },
      ...SCOPE_FIELDS,
    ],
  },
  {
    key: 'find-key-moments',
    sdkKey: 'findKeyMoments',
    eventKey: 'find_key_moments',
    label: 'Find key moments',
    category: 'Insights',
    description: 'Identify the most compelling moments, scored and titled.',
    params: [
      {
        kind: 'boolean',
        name: 'use_shots',
        label: 'Use visual evidence (Mux Shots)',
        helpText:
          'Off, the video needs a caption track: selection reads the transcript. On, selection ' +
          'reads the picture instead and no captions are needed — at the cost of generating ' +
          'or reusing Mux Shots, billed separately from Mux AI units. Not supported on ' +
          'audio-only videos, which always read the transcript.',
        defaultValue: false,
      },
      {
        kind: 'number',
        name: 'max_moments',
        label: 'Maximum moments',
        helpText: '1–25. Defaults to 10, or 25 for videos over an hour.',
        min: 1,
        max: 25,
        step: 1,
      },
      {
        kind: 'number',
        name: 'target_duration_ms.min',
        label: 'Minimum highlight length (ms)',
        min: 0,
        step: 1000,
        section: HIGHLIGHT_LENGTH_SECTION,
      },
      {
        kind: 'number',
        name: 'target_duration_ms.max',
        label: 'Maximum highlight length (ms)',
        min: 0,
        step: 1000,
        section: HIGHLIGHT_LENGTH_SECTION,
      },
      {
        kind: 'select',
        name: 'output_steering.selection_strategy',
        label: 'What to look for',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'standalone_hooks', label: 'Standalone hooks' },
          { value: 'educational_takeaways', label: 'Educational takeaways' },
          { value: 'story_beats', label: 'Story beats' },
          { value: 'product_moments', label: 'Product moments' },
          { value: 'speaker_highlights', label: 'Speaker highlights' },
        ],
      },
      {
        kind: 'select',
        name: 'output_steering.title_style',
        label: 'Title style',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'descriptive', label: 'Descriptive' },
          { value: 'punchy', label: 'Punchy' },
          { value: 'educational', label: 'Educational' },
          { value: 'social', label: 'Social' },
        ],
      },
      {
        kind: 'enumList',
        name: 'output_steering.rubric_priorities',
        label: 'Tie-breakers',
        helpText: 'Used to choose between moments the strategy above rates equally. Best effort.',
        maxItems: 4,
        options: [
          { value: 'clarity_in_isolation', label: 'Clarity in isolation' },
          { value: 'emotional_intensity', label: 'Emotional intensity' },
          { value: 'novelty', label: 'Novelty' },
          { value: 'soundbite_quality', label: 'Soundbite quality' },
        ],
      },
      { kind: 'text', name: 'output_steering.audience', label: 'Audience' },
      {
        kind: 'stringList',
        name: 'output_steering.brand_terms',
        label: 'Brand terms',
        helpText: 'Terminology to prefer in the generated titles. One per line; spaces are fine.',
      },
      TOPIC_TAXONOMY,
      ...SCOPE_FIELDS,
    ],
  },
  {
    key: 'find-best-thumbnails',
    sdkKey: 'findBestThumbnails',
    eventKey: 'find_best_thumbnails',
    label: 'Find best thumbnails',
    category: 'Insights',
    description: 'Sample and rank frames to pick the strongest thumbnail.',
    requiresVideoTrack: true,
    params: [
      {
        kind: 'number',
        name: 'max_thumbnails',
        label: 'Maximum candidates',
        min: 1,
        max: 5,
        step: 1,
        helpText: '1–5. Defaults to 1.',
      },
      {
        kind: 'boolean',
        name: 'update_asset_thumbnail',
        label: "Set the asset's thumbnail to the winner",
        helpText: 'Writes `thumbnail_time` on the Mux asset. Caches may take a while to catch up.',
        defaultValue: false,
      },
      {
        kind: 'select',
        name: 'output_steering.selection_strategy',
        label: 'What makes a good frame here',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'face_or_action', label: 'Face or action' },
          { value: 'clean_composition', label: 'Clean composition' },
          { value: 'high_contrast', label: 'High contrast' },
          { value: 'brand_safe', label: 'Brand safe' },
          { value: 'campaign_thumbnail', label: 'Campaign thumbnail' },
        ],
      },
      {
        kind: 'enumList',
        name: 'output_steering.scoring_priorities',
        label: 'Scoring priorities',
        helpText: 'What to weigh when two frames score alike. Best effort.',
        options: [
          { value: 'focus', label: 'Focus' },
          { value: 'face_or_action', label: 'Face or action' },
          { value: 'composition', label: 'Composition' },
          { value: 'contrast_color', label: 'Contrast and color' },
          { value: 'brand_fit', label: 'Brand fit' },
        ],
      },
      {
        kind: 'text',
        name: 'output_steering.looking_for',
        label: 'Looking for',
        placeholder: 'The presenter holding the product',
      },
      { kind: 'text', name: 'output_steering.audience', label: 'Audience' },
      { kind: 'text', name: 'output_steering.campaign_style', label: 'Campaign style' },
      ...SCOPE_FIELDS,
    ],
  },
  {
    key: 'generate-engagement-insights',
    sdkKey: 'generateEngagementInsights',
    eventKey: 'generate_engagement_insights',
    label: 'Generate engagement insights',
    category: 'Insights',
    description: 'Turn accumulated viewing data into per-moment engagement insights.',
    requiresViewData: true,
    notes: ['Needs Mux Data views on this asset. With no views recorded there is nothing to analyze.'],
    params: [],
  },
  {
    key: 'generate-chapters',
    sdkKey: 'generateChapters',
    eventKey: 'generate_chapters',
    label: 'Generate chapters',
    category: 'Structure',
    description: 'Create timestamped chapters from the video content.',
    params: [
      {
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'Chapters are made from one of this video’s caption tracks. Choose the language of ' +
          'the one to use, or leave empty and Mux prefers English when there is an English ' +
          'track. The chapter titles’ language is Output language.',
      },
      {
        kind: 'language',
        name: 'output_language_code',
        label: 'Output language',
        helpText: 'Leave empty to write in the captions’ language.',
      },
      {
        kind: 'select',
        name: 'output_steering.chapter_style',
        label: 'Chapter style',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'descriptive', label: 'Descriptive' },
          { value: 'punchy', label: 'Punchy' },
          { value: 'educational', label: 'Educational' },
          { value: 'seo', label: 'SEO' },
          { value: 'platform_neutral', label: 'Platform neutral' },
        ],
        defaultValue: '',
      },
      {
        kind: 'select',
        name: 'output_steering.chapter_granularity',
        label: 'Granularity',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'coarse', label: 'Coarse' },
          { value: 'balanced', label: 'Balanced' },
          { value: 'fine', label: 'Fine' },
        ],
        defaultValue: '',
      },
      { kind: 'text', name: 'output_steering.audience', label: 'Audience' },
      { kind: 'stringList', name: 'output_steering.brand_terms', label: 'Brand terms' },
      {
        kind: 'boolean',
        name: 'update_asset_chapters',
        label: 'Add the chapters to the Mux video',
        helpText:
          'Writes them as the video’s chapters track when the job finishes. Replaces any ' +
          'chapters track the video already has, including one added by hand.',
        defaultValue: true,
      },
    ],
  },
  {
    key: 'find-scenes',
    sdkKey: 'findScenes',
    eventKey: 'find_scenes',
    label: 'Find scenes',
    category: 'Structure',
    description: 'Segment the video into ordered, timestamped scenes.',
    requiresVideoTrack: true,
    params: [
      {
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'Scenes are found from this video’s caption track in that language, if it has one. ' +
          'Leave empty to use the first caption track that is ready.',
      },
      { kind: 'number', name: 'min_scenes', label: 'Minimum scenes (hint)', min: 1, step: 1 },
      {
        kind: 'select',
        name: 'output_steering.segmentation_strategy',
        label: 'How to split the video',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'editorial_beats', label: 'Editorial beats' },
          { value: 'topic_changes', label: 'Topic changes' },
          { value: 'visual_transitions', label: 'Visual transitions' },
          { value: 'action_progression', label: 'Action progression' },
          { value: 'instructional_steps', label: 'Instructional steps' },
        ],
      },
      {
        kind: 'select',
        name: 'output_steering.title_style',
        label: 'Title style',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'descriptive', label: 'Descriptive' },
          { value: 'editorial', label: 'Editorial' },
          { value: 'search_optimized', label: 'Search optimized' },
          { value: 'accessibility', label: 'Accessibility' },
        ],
      },
      {
        kind: 'select',
        name: 'output_steering.narration_detail',
        label: 'Narration detail',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'concise', label: 'Concise' },
          { value: 'balanced', label: 'Balanced' },
          { value: 'detailed', label: 'Detailed' },
        ],
      },
      { kind: 'text', name: 'output_steering.audience', label: 'Audience' },
      { kind: 'stringList', name: 'output_steering.brand_terms', label: 'Brand terms', helpText: 'One per line.' },
      TOPIC_TAXONOMY,
      ...SCOPE_FIELDS,
      {
        kind: 'number',
        name: 'min_scene_duration_ms',
        label: 'Minimum scene length (ms)',
        helpText: 'At least 1000. Defaults to 15000.',
        min: 1000,
        step: 1000,
      },
    ],
  },
  {
    key: 'moderate',
    sdkKey: 'moderate',
    eventKey: 'moderate',
    label: 'Moderate',
    category: 'Trust & Safety',
    description: 'Score sampled frames for sexual and violent content.',
    params: [
      {
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'Only for an audio-only video, which is moderated from its captions. Choose the ' +
          'language of the caption track to use, or leave empty for the first one that is ready.',
        showWhen: { context: 'isAudioOnly', notEquals: false },
      },
      {
        kind: 'number',
        name: 'thresholds.sexual',
        label: 'Sexual content threshold',
        helpText: '0–1. Defaults to 0.7.',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        kind: 'number',
        name: 'thresholds.violence',
        label: 'Violence threshold',
        helpText: '0–1. Defaults to 0.8.',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        kind: 'number',
        name: 'sampling_interval',
        label: 'Seconds between samples',
        helpText: 'At least 5. Defaults to one sample every 10 seconds. Denser sampling costs more.',
        min: 5,
        step: 1,
      },
      { kind: 'number', name: 'max_samples', label: 'Maximum samples', min: 1, step: 1 },
      ...SCOPE_FIELDS,
      {
        kind: 'select',
        name: 'on_flagged.action',
        label: 'If the video is flagged',
        helpText:
          'Deleting the playback IDs makes the video unplayable everywhere it is embedded, the ' +
          'moment the job finishes. The asset itself is kept, and "Create playback ID" in the ' +
          "video's details puts a new one on it.",
        options: [
          { value: '', label: 'Do nothing — just record the scores' },
          { value: 'delete_playback_ids', label: 'Delete every playback ID' },
        ],
        defaultValue: '',
        confirmWarnings: [
          {
            whenValue: 'delete_playback_ids',
            title: 'This run can make the video unplayable',
            body:
              'If the content scores over a threshold, Mux deletes every playback ID on this ' +
              'asset. Playback stops everywhere it is embedded, not just in Strapi, and ' +
              'anything that needs a playback ID breaks with it — including the other workflows ' +
              'of a directive run on this asset. The asset, its captions and its Robots results ' +
              'are kept, and "Create playback ID" in the video\'s details can put a new one on it.',
          },
        ],
      },
    ],
  },
];

export const ROBOTS_CATALOG_BY_KEY = Object.fromEntries(
  ROBOTS_CATALOG.map((definition) => [definition.key, definition])
) as Record<RobotsWorkflow, RobotsWorkflowDefinition>;

export const ROBOTS_CATEGORIES: RobotsCategory[] = ['Accessibility', 'Insights', 'Structure', 'Trust & Safety'];

/** What the run form opens on. Runs on any asset. */
export const DEFAULT_ROBOTS_WORKFLOW: RobotsWorkflow = 'summarize';

/** Looked up in the list, not by property: `constructor` or `__proto__` must not find anything. */
export const workflowByKey = (key: unknown): RobotsWorkflowDefinition | undefined =>
  ROBOTS_CATALOG.find((definition) => definition.key === key);

export const workflowByEventKey = (eventKey: unknown): RobotsWorkflowDefinition | undefined =>
  ROBOTS_CATALOG.find((definition) => definition.eventKey === eventKey);

export const workflowLabel = (workflow: unknown) => workflowByKey(workflow)?.label ?? String(workflow ?? '');

interface TrackLike {
  id?: string;
  type?: string;
  text_type?: string;
  status?: string;
  name?: string;
  language_code?: string;
}

interface AssetLike {
  duration?: number | null;
  tracks?: TrackLike[] | null;
}

/** The caption tracks a workflow can read or edit: ready subtitles, not the chapters track. */
export const readyCaptionTracks = <T extends TrackLike>(asset?: { tracks?: T[] | null } | null): T[] =>
  (asset?.tracks ?? []).filter(
    (track) => track.type === 'text' && track.text_type === 'subtitles' && track.status === 'ready'
  );

/** What the stored Mux asset (`asset_data`) says about the video, for `RobotsAssetContext`. */
export function assetContextFrom(asset?: AssetLike | null): RobotsAssetContext {
  const context: RobotsAssetContext = {};
  if (typeof asset?.duration === 'number') context.duration = asset.duration;

  const tracks = asset?.tracks;
  if (!Array.isArray(tracks)) return context;

  context.hasCaptions = readyCaptionTracks({ tracks }).length > 0;

  const hasVideo = tracks.some((track) => track.type === 'video');
  const hasAudio = tracks.some((track) => track.type === 'audio');
  if (hasVideo) context.isAudioOnly = false;
  else if (hasAudio) context.isAudioOnly = true;

  return context;
}

/** What an asset lacks for a workflow. */
export interface RobotsUnavailability {
  reason: 'audio-only' | 'no-captions';
  /** A workflow that gives the asset what it lacks. */
  fix?: RobotsWorkflow;
}

/** What stops this asset running a workflow, or `undefined` when nothing does. */
export function workflowUnavailability(
  definition: RobotsWorkflowDefinition,
  context: RobotsAssetContext = {}
): RobotsUnavailability | undefined {
  if (definition.requiresVideoTrack && context.isAudioOnly === true) return { reason: 'audio-only' };
  if (definition.key === 'generate-chapters' && context.hasCaptions === false) {
    return { reason: 'no-captions', fix: 'generate-premium-captions' };
  }

  return undefined;
}

const UNAVAILABLE_REASONS: Record<RobotsUnavailability['reason'], string> = {
  'audio-only': 'is not available for audio-only videos',
  'no-captions': 'needs a caption track',
};

/** Why this asset can't run a workflow, or `undefined` when it can. */
export function workflowUnavailableReason(
  definition: RobotsWorkflowDefinition,
  context: RobotsAssetContext = {}
): string | undefined {
  const unavailability = workflowUnavailability(definition, context);
  return unavailability && UNAVAILABLE_REASONS[unavailability.reason];
}

/**
 * One `ask-questions` row. `answerMode` exists because `answer_options` and `free_form_reply` are
 * mutually exclusive: a mode per row makes them separate intents.
 */
export interface QuestionRow {
  question: string;
  answerOptions: string;
  answerMode?: 'options' | 'free_form';
}

export const QUESTION_ANSWER_MODES: RobotsParamOption[] = [
  { value: 'options', label: 'From a list' },
  { value: 'free_form', label: 'In its own words' },
];

export const emptyQuestionRow = (): QuestionRow => ({ question: '', answerOptions: '', answerMode: 'options' });

export interface ReplacementRow {
  find: string;
  replace: string;
  caseSensitive: boolean;
}

/** One row of a controlled vocabulary. `aliases` is comma-separated text, split on the way out. */
export interface TaxonomyRow {
  label: string;
  description: string;
  aliases: string;
}

/**
 * A whole `topic_taxonomy` / `tag_taxonomy`, edited as one field so it's sent whole or not at all.
 * `allowOther` is always sent: the API rejects the object without it. It defaults to `true`, because
 * `false` filters the output to the vocabulary.
 */
export interface TaxonomyValue {
  name: string;
  allowOther: boolean;
  values: TaxonomyRow[];
}

export const emptyTaxonomyRow = (): TaxonomyRow => ({ label: '', description: '', aliases: '' });

export function asTaxonomyValue(value: unknown): TaxonomyValue {
  const partial = (value ?? {}) as Partial<TaxonomyValue>;
  return {
    name: typeof partial.name === 'string' ? partial.name : '',
    allowOther: typeof partial.allowOther === 'boolean' ? partial.allowOther : true,
    values: Array.isArray(partial.values) ? partial.values : [],
  };
}

const splitCommas = (text: string | undefined) =>
  (text ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

/** The form's starting values: the catalog's defaults, and one empty question row to fill in. */
export function defaultParamValues(fields: RobotsParamField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.kind === 'questions') {
      values[field.name] = [emptyQuestionRow()];
      continue;
    }
    if (field.defaultValue !== undefined) values[field.name] = field.defaultValue;
  }
  return values;
}

export function isFieldVisible(
  field: RobotsParamField,
  values: Record<string, unknown>,
  context: RobotsAssetContext = {}
): boolean {
  const condition = field.showWhen;
  if (!condition) return true;
  if ('context' in condition) return context[condition.context] !== condition.notEquals;
  return values[condition.field] === condition.equals;
}

export interface RobotsFieldGroup {
  section?: RobotsParamSection;
  fields: RobotsParamField[];
}

/** Consecutive fields that share a section become one group; every other field stands alone. */
export function groupFieldsBySection(fields: RobotsParamField[]): RobotsFieldGroup[] {
  const groups: RobotsFieldGroup[] = [];
  for (const field of fields) {
    const last = groups[groups.length - 1];
    if (field.section && last?.section?.id === field.section.id) last.fields.push(field);
    else groups.push({ section: field.section, fields: [field] });
  }
  return groups;
}

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const isBlank = (value: unknown) => value === undefined || value === null || value === '';

const isEmptyParam = (value: unknown) => isBlank(value) || (Array.isArray(value) && value.length === 0);

function toApiQuestions(value: unknown) {
  const questions = asArray<QuestionRow>(value)
    .filter((row) => (row?.question ?? '').trim() !== '')
    .map((row) => {
      const question = row.question.trim();
      if (row.answerMode === 'free_form') return { question, free_form_reply: true };
      const options = splitCommas(row.answerOptions);
      return options.length > 0 ? { question, answer_options: options } : { question };
    });
  return questions.length > 0 ? questions : undefined;
}

function toApiReplacements(value: unknown) {
  const replacements = asArray<ReplacementRow>(value)
    .filter((row) => (row?.find ?? '').trim() !== '')
    .map((row) => ({
      find: row.find,
      replace: row.replace ?? '',
      ...(row.caseSensitive && { case_sensitive: true }),
    }));
  return replacements.length > 0 ? replacements : undefined;
}

function toApiTaxonomy(value: unknown) {
  const taxonomy = asTaxonomyValue(value);
  const values = taxonomy.values
    .filter((row) => (row?.label ?? '').trim() !== '')
    .map((row) => {
      const aliases = splitCommas(row.aliases);
      const description = (row.description ?? '').trim();
      return {
        label: row.label.trim(),
        ...(description !== '' && { description }),
        ...(aliases.length > 0 && { aliases }),
      };
    });
  if (values.length === 0) return undefined;
  const name = taxonomy.name.trim();
  return { ...(name !== '' && { name }), values, allow_other: taxonomy.allowOther };
}

/** Turns one form value into what the Robots API expects, or `undefined` to leave it out. */
function toApiParamValue(field: RobotsParamField, value: unknown): unknown {
  switch (field.kind) {
    case 'questions':
      return toApiQuestions(value);
    case 'replacements':
      return toApiReplacements(value);
    case 'taxonomy':
      return toApiTaxonomy(value);
    default:
      return isEmptyParam(value) ? undefined : value;
  }
}

/**
 * Expands flat, dotted-path values into the nested `parameters` object Mux expects, always with
 * `asset_id`. Empty strings, empty arrays, `null` and `undefined` are dropped; `false` is sent.
 */
export function buildRobotsParameters(assetId: string, values: Record<string, unknown>): Record<string, unknown> {
  const parameters: Record<string, unknown> = { asset_id: assetId };

  for (const [path, rawValue] of Object.entries(values)) {
    if (isEmptyParam(rawValue)) continue;

    const segments = path.split('.');
    let target = parameters;
    for (const segment of segments.slice(0, -1)) {
      if (typeof target[segment] !== 'object' || target[segment] === null) target[segment] = {};
      target = target[segment] as Record<string, unknown>;
    }
    target[segments[segments.length - 1]] = rawValue;
  }

  return parameters;
}

/** The job's `parameters`, from the form's flat values: visible, non-`formOnly` fields only. */
export function paramsFromFormValues(
  definition: RobotsWorkflowDefinition,
  assetId: string,
  values: Record<string, unknown>,
  context: RobotsAssetContext = {}
): Record<string, unknown> {
  const apiValues: Record<string, unknown> = {};
  for (const field of definition.params) {
    if (field.formOnly) continue;
    if (!isFieldVisible(field, values, context)) continue;
    const apiValue = toApiParamValue(field, values[field.name]);
    if (apiValue !== undefined) apiValues[field.name] = apiValue;
  }
  return buildRobotsParameters(assetId, apiValues);
}

export function confirmWarnings(
  definition: RobotsWorkflowDefinition,
  values: Record<string, unknown>,
  context: RobotsAssetContext = {}
): RobotsConfirmWarning[] {
  const warnings: RobotsConfirmWarning[] = [];
  for (const field of definition.params) {
    if (!field.confirmWarnings) continue;
    if (!isFieldVisible(field, values, context)) continue;
    const value = values[field.name] ?? field.defaultValue;
    warnings.push(...field.confirmWarnings.filter((warning) => warning.whenValue === value));
  }
  return warnings;
}

function taxonomyErrors(field: RobotsParamField, formValue: unknown, apiValue: unknown): string[] {
  const errors: string[] = [];
  const taxonomy = asTaxonomyValue(formValue);

  if (apiValue === undefined) {
    if (taxonomy.name.trim() !== '') errors.push(`${field.label}: add at least one value, or clear the taxonomy name.`);
    return errors;
  }

  const limits = field.taxonomyLimits;
  if (!limits) return errors;

  const sent = apiValue as {
    name?: string;
    values: Array<{ label: string; description?: string; aliases?: string[] }>;
  };

  if (limits.maxValues !== undefined && sent.values.length > limits.maxValues) {
    errors.push(`${field.label}: at most ${limits.maxValues} values.`);
  }
  if (limits.maxNameLength !== undefined && sent.name !== undefined && sent.name.length > limits.maxNameLength) {
    errors.push(`${field.label}: the taxonomy name is at most ${limits.maxNameLength} characters.`);
  }

  const longLabel = sent.values.find(
    (row) => limits.maxLabelLength !== undefined && row.label.length > limits.maxLabelLength
  );
  if (longLabel) {
    errors.push(
      `${field.label}: a value is at most ${limits.maxLabelLength} characters — "${longLabel.label.slice(0, 40)}…".`
    );
  }

  const longDescription = sent.values.find(
    (row) => limits.maxDescriptionLength !== undefined && (row.description?.length ?? 0) > limits.maxDescriptionLength
  );
  if (longDescription) {
    errors.push(
      `${field.label}: the description of "${longDescription.label}" is at most ${limits.maxDescriptionLength} characters.`
    );
  }

  const manyAliases = sent.values.find(
    (row) => limits.maxAliases !== undefined && (row.aliases?.length ?? 0) > limits.maxAliases
  );
  if (manyAliases) {
    errors.push(`${field.label}: "${manyAliases.label}" has more than ${limits.maxAliases} aliases.`);
  }

  const maxAliasLength = limits.maxAliasLength;
  const longAlias =
    maxAliasLength === undefined
      ? undefined
      : sent.values.flatMap((row) => row.aliases ?? []).find((alias) => alias.length > maxAliasLength);
  if (longAlias !== undefined) {
    errors.push(`${field.label}: an alias is at most ${maxAliasLength} characters — "${longAlias.slice(0, 40)}…".`);
  }

  if (limits.maxSerializedLength !== undefined && JSON.stringify(apiValue).length > limits.maxSerializedLength) {
    errors.push(
      `${field.label}: the whole taxonomy is at most ${limits.maxSerializedLength} characters. Shorten the descriptions, or use fewer values.`
    );
  }

  return errors;
}

function scopeBound(definition: RobotsWorkflowDefinition, values: Record<string, unknown>, name: string) {
  const field = definition.params.find((candidate) => candidate.name === name);
  const value = field ? toApiParamValue(field, values[name]) : undefined;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function scopeErrors(
  definition: RobotsWorkflowDefinition,
  values: Record<string, unknown>,
  context: RobotsAssetContext
) {
  const start = scopeBound(definition, values, 'output_steering.scope.start_time');
  const end = scopeBound(definition, values, 'output_steering.scope.end_time');
  const errors: string[] = [];
  if (start !== undefined && end !== undefined && start >= end) {
    errors.push('The start time must be before the end time.');
  }
  if (start !== undefined && context.duration !== undefined && start >= context.duration) {
    errors.push(
      `The start time is past the end of the video, which is ${Number(context.duration.toFixed(1))} seconds long.`
    );
  }
  return errors;
}

function numberErrors(field: RobotsParamField, value: number): string[] {
  if (Number.isNaN(value)) return [`${field.label} must be a number.`];
  if (field.min !== undefined && value < field.min) return [`${field.label} must be at least ${field.min}.`];
  if (field.max !== undefined && value > field.max) return [`${field.label} must be at most ${field.max}.`];
  return [];
}

function listErrors(field: RobotsParamField, items: unknown[]): string[] {
  const errors: string[] = [];
  if (field.maxItems !== undefined && items.length > field.maxItems) {
    errors.push(`${field.label}: at most ${field.maxItems} entries.`);
  }
  const maxItemLength = field.maxItemLength;
  const tooLong =
    maxItemLength === undefined
      ? undefined
      : items.find((item) => typeof item === 'string' && item.length > maxItemLength);
  if (tooLong !== undefined) {
    errors.push(`${field.label}: each entry is at most ${maxItemLength} characters — "${String(tooLong)}".`);
  }
  return errors;
}

function fieldErrors(field: RobotsParamField, formValue: unknown): string[] {
  const apiValue = toApiParamValue(field, formValue);
  if (field.isRequired && apiValue === undefined) return [`${field.label} is required.`];
  if (field.kind === 'taxonomy') return taxonomyErrors(field, formValue, apiValue);
  if (field.kind === 'number' && typeof apiValue === 'number') return numberErrors(field, apiValue);
  if ((field.kind === 'stringList' || field.kind === 'enumList') && Array.isArray(apiValue)) {
    return listErrors(field, apiValue);
  }
  return [];
}

/** What the asset itself rules out: workflows that read the transcript need a caption track. */
function assetErrors(key: RobotsWorkflow, values: Record<string, unknown>, context: RobotsAssetContext): string[] {
  if (key === 'generate-chapters' && context.hasCaptions === false) {
    return ['This video has no caption track. Chapters are generated from the transcript, so generate captions first.'];
  }
  if (key !== 'find-key-moments') return [];

  const errors: string[] = [];
  if (context.isAudioOnly === true && values.use_shots === true) {
    errors.push('"Use visual evidence (Mux Shots)" is not supported on audio-only videos. Turn it off.');
  }
  // Without `use_shots` the selection reads the transcript. Audio-only assets always read it.
  if (context.hasCaptions === false && (values.use_shots !== true || context.isAudioOnly === true)) {
    errors.push(
      context.isAudioOnly === true
        ? 'This audio-only video has no caption track, and audio-only videos always read the transcript. Generate captions first.'
        : 'This video has no caption track. Turn on "Use visual evidence (Mux Shots)", or generate captions first.'
    );
  }
  return errors;
}

function highlightLengthErrors(values: Record<string, unknown>): string[] {
  const min = values['target_duration_ms.min'];
  const max = values['target_duration_ms.max'];
  const hasMin = !isBlank(min);
  const hasMax = !isBlank(max);
  if (hasMin !== hasMax) return ['Set both highlight length bounds, or neither.'];
  if (hasMin && Number(min) > Number(max)) return ['The minimum highlight length cannot exceed the maximum.'];
  return [];
}

// The API needs at least one of `replacements` and `auto_censor_profanity`.
function editCaptionsErrors(values: Record<string, unknown>): string[] {
  return toApiReplacements(values.replacements) === undefined && values.censor_profanity !== true
    ? ['Add at least one replacement rule, or turn on "Censor profanity".']
    : [];
}

function questionLengthErrors(values: Record<string, unknown>): string[] {
  const rows = asArray<QuestionRow>(values.questions);
  const errors: string[] = [];
  if (rows.some((row) => (row?.question ?? '').trim().length > 600)) {
    errors.push('A question can be at most 600 characters.');
  }
  const longOption = rows
    .filter((row) => row?.answerMode !== 'free_form')
    .flatMap((row) => splitCommas(row?.answerOptions))
    .find((option) => option.length > 150);
  if (longOption) errors.push('An answer option can be at most 150 characters.');
  return errors;
}

function phraseHintErrors(values: Record<string, unknown>): string[] {
  const phrases = asArray<unknown>(values.phrases);
  const errors: string[] = [];
  const tooManyWords = phrases.find((phrase) => typeof phrase === 'string' && phrase.trim().split(/\s+/).length > 5);
  if (tooManyWords !== undefined) errors.push(`Phrase hints can be at most 5 words: "${String(tooManyWords)}".`);
  const illegal = phrases.find((phrase) => typeof phrase === 'string' && /[<>{}[\]]/.test(phrase));
  if (illegal !== undefined) errors.push(`Phrase hints cannot contain < > { } [ ]: "${String(illegal)}".`);
  return errors;
}

const WORKFLOW_RULES: Partial<Record<RobotsWorkflow, (values: Record<string, unknown>) => string[]>> = {
  'find-key-moments': highlightLengthErrors,
  'edit-captions': editCaptionsErrors,
  'ask-questions': questionLengthErrors,
  'generate-premium-captions': phraseHintErrors,
};

/** Validation the person sees before a job is billed, rather than as a 400 afterwards. */
export function validateParams(
  definition: RobotsWorkflowDefinition,
  values: Record<string, unknown>,
  context: RobotsAssetContext = {}
): string[] {
  return [
    ...definition.params.flatMap((field) =>
      isFieldVisible(field, values, context) ? fieldErrors(field, values[field.name]) : []
    ),
    ...assetErrors(definition.key, values, context),
    ...scopeErrors(definition, values, context),
    ...(WORKFLOW_RULES[definition.key]?.(values) ?? []),
  ];
}

const optionEnum = (field: RobotsParamField) => {
  const values = (field.options ?? []).map((option) => option.value);
  return z.enum(values as [string, ...string[]]);
};

function fieldSchema(field: RobotsParamField): z.ZodTypeAny {
  switch (field.kind) {
    case 'number':
      return z.number().nullable();
    case 'boolean':
      return z.boolean();
    case 'select':
      return optionEnum(field);
    case 'stringList':
      return z.array(z.string());
    case 'enumList':
      return z.array(optionEnum(field));
    case 'questions':
      return z.array(
        z.object({
          question: z.string(),
          answerOptions: z.string(),
          answerMode: z.enum(['options', 'free_form']).optional(),
        })
      );
    case 'replacements':
      return z.array(z.object({ find: z.string(), replace: z.string(), caseSensitive: z.boolean() }));
    case 'taxonomy':
      return z.object({
        name: z.string(),
        allowOther: z.boolean(),
        values: z.array(z.object({ label: z.string(), description: z.string(), aliases: z.string() })),
      });
    default:
      return z.string();
  }
}

/**
 * The form values a workflow accepts: its own fields only, each with the type its widget produces.
 * What reaches Mux is still built from the catalog (`paramsFromFormValues`), never from the request.
 */
export const robotsValuesSchema = (definition: RobotsWorkflowDefinition) =>
  z.object(Object.fromEntries(definition.params.map((field) => [field.name, fieldSchema(field).optional()]))).strict();
