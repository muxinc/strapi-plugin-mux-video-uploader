/**
 * Robots jobs and directive runs as Mux reported them, plus placeholders for creates Mux hasn't
 * confirmed. Never purged, so results outlive Mux's 30-day job retention.
 */
export default {
  kind: 'collectionType',
  collectionName: 'muxrobotjobs',
  info: {
    description: 'Mux Robots jobs and directive runs on Mux assets',
    displayName: 'Mux Robot Job',
    singularName: 'mux-robot-job',
    pluralName: 'mux-robot-jobs',
  },
  pluginOptions: {
    'content-manager': {
      visible: false,
    },
    'content-type-builder': {
      visible: false,
    },
  },
  options: {
    draftAndPublish: false,
  },
  attributes: {
    mux_id: { type: 'string', maxLength: 255 },
    is_directive_run: { type: 'boolean', default: false },
    workflow: { type: 'string', maxLength: 64 },
    directive_id: { type: 'string', maxLength: 255 },
    directive_run_id: { type: 'string', maxLength: 255 },
    status: { type: 'string', maxLength: 32 },
    asset_id: { type: 'string', maxLength: 255 },
    parameters: { type: 'json' },
    outputs: { type: 'json' },
    errors: { type: 'json' },
    units_consumed: { type: 'integer' },
    run_data: { type: 'json' },
    mux_created_at: { type: 'datetime' },
    mux_updated_at: { type: 'datetime' },
    detail_loaded: { type: 'boolean', default: false },
    request_id: { type: 'string', maxLength: 32 },
    requested_at: { type: 'datetime' },
    requested_by: { type: 'integer' },
  },
  // Every Robots webhook looks its row up by Mux id, and the Robots tab lists rows by asset.
  indexes: [
    { name: 'muxrobotjobs_mux_id_index', columns: ['mux_id'] },
    { name: 'muxrobotjobs_asset_id_index', columns: ['asset_id'] },
  ],
};
