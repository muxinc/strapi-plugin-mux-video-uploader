import React from 'react';
import {
  Badge,
  Box,
  Button,
  Field,
  Flex,
  Modal,
  SingleSelect,
  SingleSelectOption,
  Typography,
} from '@strapi/design-system';
import { useNotification } from '@strapi/strapi/admin';

import {
  confirmWarnings,
  DEFAULT_ROBOTS_WORKFLOW,
  defaultParamValues,
  ROBOTS_CATALOG,
  ROBOTS_CATALOG_BY_KEY,
  ROBOTS_CATEGORIES,
  RobotsAssetContext,
  RobotsUnavailability,
  RobotsWorkflow,
  RobotsWorkflowDefinition,
  validateParams,
  workflowUnavailability,
} from '../../../../types/robots-catalog';
import { Translate, useRobotsIntl } from './intl';
import { PricingLink } from './links';
import Note from './note';
import ParamFields, { CaptionTrackOption } from './param-fields';

export type RunOutcome = { ok: true } | { ok: false; reason: string; message: string };

interface RunModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** A refusal for `invalid-parameters` keeps the modal open, with Mux's message under the form. */
  onRun: (workflow: RobotsWorkflow, values: Record<string, unknown>) => Promise<RunOutcome>;
  videoTitle: string;
  context: RobotsAssetContext;
  captions: CaptionTrackOption[];
  blockedReason?: string;
}

const unavailableTitle = (t: Translate, unavailability: RobotsUnavailability) =>
  unavailability.reason === 'audio-only'
    ? t('Robots.run.unavailable.audio-only.title', 'Not available for audio-only videos')
    : t('Robots.run.unavailable.no-captions.title', 'This video needs captions first');

function UnavailableWorkflowNote({
  definition,
  unavailability,
  onSwitch,
}: {
  definition: RobotsWorkflowDefinition;
  unavailability: RobotsUnavailability;
  onSwitch: (workflow: RobotsWorkflow) => void;
}) {
  const { t } = useRobotsIntl();
  const fix = unavailability.fix ? ROBOTS_CATALOG_BY_KEY[unavailability.fix] : undefined;

  return (
    <Note
      variant="warning"
      title={unavailableTitle(t, unavailability)}
      action={
        fix && (
          <Button variant="secondary" size="S" onClick={() => onSwitch(fix.key)}>
            {t('Robots.run.unavailable.switch', 'Switch to {workflow}', { workflow: fix.label })}
          </Button>
        )
      }
    >
      {unavailability.reason === 'audio-only'
        ? t(
            'Robots.run.unavailable.audio-only.body',
            "{workflow} works from the video's picture, and this video is audio-only. Pick another workflow.",
            { workflow: definition.label }
          )
        : t(
            'Robots.run.unavailable.no-captions.body',
            "{workflow} is made from the video's transcript, which comes from a caption track, and this video doesn't have one yet. Run {fix} first, or add captions in the Captions tab.",
            { workflow: definition.label, fix: fix?.label ?? '' }
          )}
    </Note>
  );
}

export default function RunModal({
  isOpen,
  onClose,
  onRun,
  videoTitle,
  context,
  captions,
  blockedReason,
}: RunModalProps) {
  const { t } = useRobotsIntl();
  const { toggleNotification } = useNotification();
  const [selected, setSelected] = React.useState<RobotsWorkflow>(DEFAULT_ROBOTS_WORKFLOW);
  const [values, setValues] = React.useState<Record<string, unknown>>({});
  const [confirming, setConfirming] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [muxError, setMuxError] = React.useState<string>();

  const definition = ROBOTS_CATALOG_BY_KEY[selected];
  const unavailability = workflowUnavailability(definition, context);

  // Reset per workflow and per opening, so options from one workflow never leak into another.
  React.useEffect(() => {
    setValues(defaultParamValues(definition.params));
    setConfirming(false);
    setMuxError(undefined);
  }, [definition, isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      setSelected(DEFAULT_ROBOTS_WORKFLOW);
      setSubmitting(false);
    }
  }, [isOpen]);

  // Whether the form is still there when a run's outcome arrives: it goes if the tab does.
  const shown = React.useRef(isOpen);
  React.useEffect(() => {
    shown.current = isOpen;
    return () => {
      shown.current = false;
    };
  }, [isOpen]);

  const errors = React.useMemo(() => validateParams(definition, values, context), [definition, values, context]);
  const warnings = React.useMemo(() => confirmWarnings(definition, values, context), [definition, values, context]);

  const handleRun = async () => {
    if (submitting) return;
    setSubmitting(true);

    const outcome = await onRun(selected, values);

    if (!outcome.ok && outcome.reason === 'invalid-parameters') {
      if (!shown.current) {
        toggleNotification({ type: 'danger', message: outcome.message });
        return;
      }
      setMuxError(outcome.message);
      setConfirming(false);
      setSubmitting(false);
      return;
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal.Root open onOpenChange={(open: boolean) => !open && !submitting && onClose()}>
      <Modal.Content style={{ width: 'min(90vw, 72rem)', maxWidth: 'unset' }}>
        <Modal.Header>
          <Modal.Title>
            {confirming
              ? t('Robots.run.confirm-title', 'Confirm this run')
              : t('Robots.run.title', 'Run a Robots workflow')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirming ? (
            <Flex direction="column" alignItems="stretch" gap={3}>
              <Typography variant="omega">
                {t('Robots.run.confirm', 'This will run {workflow} on "{title}" and consume Mux AI units.', {
                  workflow: definition.label,
                  title: videoTitle,
                })}
              </Typography>
              <Typography variant="omega">
                {t('Robots.run.pricing', 'Robots is billed in Mux AI units.')} <PricingLink />
              </Typography>
              {definition.producesTrack && (
                <Note variant="info">
                  {definition.key === 'translate-audio'
                    ? t(
                        'Robots.run.adds-audio-note',
                        "This adds an audio track to the Mux video. Pick it in the player's audio menu once it is ready."
                      )
                    : t(
                        'Robots.run.adds-track-note',
                        'This adds a track to the Mux video. It shows in the Captions tab and the player once it is ready.'
                      )}
                </Note>
              )}
              {(definition.notes ?? []).map((note) => (
                <Note key={note} variant="warning">
                  {note}
                </Note>
              ))}
              {warnings.map((warning) => (
                <Note key={warning.title} variant="danger" title={warning.title}>
                  {warning.body}
                </Note>
              ))}
            </Flex>
          ) : (
            <Flex direction="column" alignItems="stretch" gap={4}>
              <Field.Root name="workflow" hint={definition.description}>
                <Field.Label>{t('Robots.run.workflow', 'Workflow')}</Field.Label>
                <SingleSelect
                  value={selected}
                  onChange={(next: string | number) => setSelected(next as RobotsWorkflow)}
                >
                  {ROBOTS_CATEGORIES.flatMap((category) =>
                    ROBOTS_CATALOG.filter((candidate) => candidate.category === category).map((candidate) => (
                      <SingleSelectOption key={candidate.key} value={candidate.key}>
                        {`${category} · ${candidate.label}`}
                      </SingleSelectOption>
                    ))
                  )}
                </SingleSelect>
                <Field.Hint />
              </Field.Root>

              {unavailability && (
                <UnavailableWorkflowNote
                  definition={definition}
                  unavailability={unavailability}
                  onSwitch={setSelected}
                />
              )}

              {(definition.producesTrack || definition.planRestricted || definition.requiresViewData) && (
                <Flex gap={2} wrap="wrap">
                  {definition.producesTrack && <Badge>{t('Robots.run.badge.adds-track', 'Adds a track')}</Badge>}
                  {definition.planRestricted && <Badge>{t('Robots.run.badge.plan', 'Plan dependent')}</Badge>}
                  {definition.requiresViewData && <Badge>{t('Robots.run.badge.views', 'Needs Mux Data views')}</Badge>}
                </Flex>
              )}

              {(definition.notes ?? []).map((note) => (
                <Note key={note}>{note}</Note>
              ))}

              <ParamFields
                fields={definition.params}
                values={values}
                onChange={(name, value) => setValues((previous) => ({ ...previous, [name]: value }))}
                captions={captions}
                context={context}
              />

              {/* The note above already says what the asset lacks; its errors would repeat it. */}
              {!unavailability && errors.length > 0 && (
                <Note variant="danger" title={t('Robots.run.fix-these', 'Fix these before running')}>
                  {errors.map((error) => (
                    <Box key={error}>{error}</Box>
                  ))}
                </Note>
              )}

              {muxError && (
                <Note variant="danger" title={t('Robots.run.mux-refused', 'Mux refused this run')}>
                  {muxError}
                </Note>
              )}

              {blockedReason && <Note variant="warning">{blockedReason}</Note>}
            </Flex>
          )}
        </Modal.Body>
        <Modal.Footer>
          {confirming ? (
            <>
              <Button variant="tertiary" onClick={() => setConfirming(false)} disabled={submitting}>
                {t('Robots.run.back', 'Back')}
              </Button>
              <Button onClick={handleRun} loading={submitting} disabled={submitting || !!blockedReason}>
                {t('Robots.run.run', 'Run {workflow}', { workflow: definition.label })}
              </Button>
            </>
          ) : (
            <>
              <Button variant="tertiary" onClick={onClose} disabled={submitting}>
                {t('Common.cancel-button', 'Cancel')}
              </Button>
              <Button
                disabled={!!unavailability || errors.length > 0 || !!blockedReason}
                title={blockedReason ?? (unavailability ? unavailableTitle(t, unavailability) : errors[0])}
                onClick={() => !unavailability && errors.length === 0 && setConfirming(true)}
              >
                {t('Robots.run.continue', 'Continue')}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
