/**
 * The twelve public Robots workflows. `key` is the workflow's name in the API and in job payloads,
 * `sdkKey` its resource on `client.robots.jobs`, and `eventKey` how webhook types spell it
 * (`robots.job.<eventKey>.<status>`).
 */
export const ROBOTS_WORKFLOWS = [
  { key: 'generate-premium-captions', sdkKey: 'generatePremiumCaptions', eventKey: 'generate_premium_captions' },
  { key: 'edit-captions', sdkKey: 'editCaptions', eventKey: 'edit_captions' },
  { key: 'translate-captions', sdkKey: 'translateCaptions', eventKey: 'translate_captions' },
  { key: 'translate-audio', sdkKey: 'translateAudio', eventKey: 'translate_audio' },
  { key: 'summarize', sdkKey: 'summarize', eventKey: 'summarize' },
  { key: 'ask-questions', sdkKey: 'askQuestions', eventKey: 'ask_questions' },
  { key: 'find-key-moments', sdkKey: 'findKeyMoments', eventKey: 'find_key_moments' },
  { key: 'find-best-thumbnails', sdkKey: 'findBestThumbnails', eventKey: 'find_best_thumbnails' },
  {
    key: 'generate-engagement-insights',
    sdkKey: 'generateEngagementInsights',
    eventKey: 'generate_engagement_insights',
  },
  { key: 'generate-chapters', sdkKey: 'generateChapters', eventKey: 'generate_chapters' },
  { key: 'find-scenes', sdkKey: 'findScenes', eventKey: 'find_scenes' },
  { key: 'moderate', sdkKey: 'moderate', eventKey: 'moderate' },
] as const;

export type RobotsWorkflow = (typeof ROBOTS_WORKFLOWS)[number]['key'];

export const workflowByKey = (key: unknown) => ROBOTS_WORKFLOWS.find((workflow) => workflow.key === key);

export const workflowByEventKey = (eventKey: unknown) =>
  ROBOTS_WORKFLOWS.find((workflow) => workflow.eventKey === eventKey);
