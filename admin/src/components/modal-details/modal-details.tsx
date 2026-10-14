import React from 'react';
import { FormikHelpers, FormikTouched, useFormik } from 'formik';
import copy from 'copy-to-clipboard';
import {
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  Grid,
  IconButton,
  Link,
  Modal,
  Status,
  Tabs,
  Tag,
  Textarea,
  Tooltip,
  Typography,
} from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { Cross, Duplicate, Trash, WarningCircle } from '@strapi/icons';

import { MuxAsset, MuxAssetUpdate } from '../../../../server/src/content-types/mux-asset/types';
import type { EntryFieldOption } from '../../../../types/robots-format';
import usePluginIntl from '../../utils/use-plugin-intl';
import CustomTextTrackForm from '../modal-new-upload/custom-text-track-form';
import PreviewPlayer from '../preview-player';
import { robotsErrorOf, useRobotsApi } from '../robots/api';
import RobotsErrorBoundary from '../robots/error-boundary';
import { useRobotsIntl } from '../robots/intl';
import Note from '../robots/note';
import RobotsTab from '../robots/robots-tab';
import { useCanRunRobots } from '../robots/use-can-run-robots';
import ApplyDialog from '../robots-panel/apply-dialog';
import Summary from './summary';
import { PLUGIN_ID } from '../../pluginId';

export type DetailsTab = 'details' | 'captions' | 'robots';

/**
 * The player is remounted when this changes, so it loads the new playback ID, tracks (captions,
 * audio, chapters) and thumbnail.
 */
const playbackSignature = (muxAsset?: MuxAsset) => JSON.stringify([muxAsset?.playback_id, muxAsset?.asset_data]);

export default function ModalDetails(props: {
  onToggle: (refresh: boolean) => void;
  isOpen: boolean;
  muxAsset?: MuxAsset;
  enableUpdate: boolean;
  enableDelete: boolean;
  initialTab?: DetailsTab;
}) {
  const { isOpen, enableUpdate, enableDelete, initialTab = 'details', onToggle = () => {} } = props;

  const { del, put } = useFetchClient();
  const { formatMessage } = usePluginIntl();
  const { t } = useRobotsIntl();
  const robotsApi = useRobotsApi();

  const deleteButtonRef = React.useRef<HTMLButtonElement>(null);

  // The player and the Robots tab follow the freshest copy of the video. The form keeps the copy it
  // was filled from while it has unsaved changes, so a re-read never overwrites someone's edits.
  const [latestAsset, setLatestAsset] = React.useState<MuxAsset | undefined>(props.muxAsset);
  const [formAsset, setFormAsset] = React.useState<MuxAsset | undefined>(props.muxAsset);
  const [changedWhileEditing, setChangedWhileEditing] = React.useState(false);
  const [assetChanged, setAssetChanged] = React.useState(false);
  const [playerKey, setPlayerKey] = React.useState(0);
  const [tab, setTab] = React.useState<DetailsTab>(initialTab);
  const [robotsOpened, setRobotsOpened] = React.useState(initialTab === 'robots');
  const [creatingPlaybackId, setCreatingPlaybackId] = React.useState(false);
  const [applyingSummary, setApplyingSummary] = React.useState(false);

  const [touchedFields, setTouchedFields] = React.useState<FormikTouched<MuxAssetUpdate>>({});
  const [showDeleteWarning, setShowDeleteWarning] = React.useState(false);
  const [deletingState, setDeletingState] = React.useState<'idle' | 'deleting'>('idle');
  const [codeSnippet, setCodeSnippet] = React.useState<string>('');

  const { toggleNotification } = useNotification();

  const canRunRobots = useCanRunRobots();

  // The modal stays mounted between videos, so the state above is reset when another one opens.
  React.useEffect(() => {
    setLatestAsset(props.muxAsset);
    setFormAsset(props.muxAsset);
    setChangedWhileEditing(false);
    setAssetChanged(false);
    setTouchedFields({});
    setTab(initialTab);
    setRobotsOpened(initialTab === 'robots');
    setApplyingSummary(false);
  }, [props.muxAsset?.id]);

  React.useEffect(() => {
    if (!latestAsset) return;

    setCodeSnippet(`<mux-player
  playback-id="${latestAsset?.playback_id}"
  playback-token="TOKEN"
  env-key="ENV_KEY"
  metadata-video-title="${latestAsset?.title}"
  controls
/>`);
  }, [latestAsset]);

  const subtitles = (formAsset?.asset_data?.tracks ?? []).filter(
    (track: any) => track.type === 'text' && track.text_type === 'subtitles' && track.status !== 'errored'
  );

  const toggleDeleteWarning = () => setShowDeleteWarning((prevState) => !prevState);

  const handleCopyCodeSnippet = () => {
    copy(codeSnippet);

    toggleNotification({
      type: 'success',
      message: formatMessage('ModalDetails.copied-to-clipboard', 'Copied code snippet to clipboard'),
    });
  };

  const handleOnDeleteConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingState('deleting');
    toggleDeleteWarning();

    if (!latestAsset) return;

    try {
      await del(`${PLUGIN_ID}/mux-asset/${latestAsset.id}`, {
        params: {
          delete_on_mux: true,
        },
      });

      setDeletingState('idle');

      onToggle(true);
      toggleNotification({
        type: 'success',
        message: formatMessage('ModalDetails.delete-success', 'Video deleted successfully'),
      });
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatMessage('ModalDetails.failed-to-delete', 'Failed to delete video'),
      });
    }
  };

  const initialValues: MuxAssetUpdate = {
    id: formAsset?.id || 0,
    title: formAsset?.title || formAsset?.asset_id || formAsset?.createdAt,
    description: formAsset?.description ?? '',
    tags: Array.isArray(formAsset?.tags) ? formAsset.tags : [],

    // @ts-expect-error Due to changes in @mux/mux-node v8, where `TextTrack`, `VideoTrack` and `AudioTrack` were unified,
    // properties required to subtitles as text tracks are showing as optional and breaking the `custom_text_tracks` type.
    custom_text_tracks: subtitles.map((s) => ({
      closed_captions: s.closed_captions,
      file: undefined,
      language_code: s.language_code,
      name: s.name,
      status: s.status,
      stored_track: s,
    })),
  };

  // Only what changed is sent, so a description or tags a summary wrote meanwhile survive the save.
  const changesIn = (values: MuxAssetUpdate) => ({
    title: !!touchedFields.title,
    description: values.description !== initialValues.description,
    tags: JSON.stringify(values.tags) !== JSON.stringify(initialValues.tags),
    tracks: JSON.stringify(values.custom_text_tracks || []) !== JSON.stringify(initialValues.custom_text_tracks || []),
  });

  const handleOnSubmit = async (
    values: MuxAssetUpdate,
    { setErrors, setSubmitting }: FormikHelpers<MuxAssetUpdate>
  ) => {
    const title = formatMessage('Common.title-required', 'No title specified');

    if (!values.title) {
      setErrors({ title });

      return;
    }

    const changed = changesIn(values);

    const data: MuxAssetUpdate = {
      id: formAsset?.id || 0,
      title: changed.title ? values.title : undefined,
      description: changed.description ? values.description || null : undefined,
      tags: changed.tags ? values.tags : undefined,
      custom_text_tracks: changed.tracks ? values.custom_text_tracks : undefined,
      // The server only deletes tracks this form showed, so a caption added meanwhile survives the save.
      known_track_ids: changed.tracks
        ? (initialValues.custom_text_tracks || []).flatMap((track) => track.stored_track?.id || [])
        : undefined,
    };

    if (Object.values(changed).some(Boolean)) {
      await put(`${PLUGIN_ID}/mux-asset/${formAsset?.id}`, data);
    }

    setSubmitting(false);

    onToggle(true);
  };

  const close = () => onToggle(assetChanged);

  const handleOnOpenChange = (open: boolean) => {
    if (open) return;

    close();
  };

  const { errors, values, isSubmitting, handleChange, handleSubmit, setFieldValue } = useFormik<MuxAssetUpdate>({
    initialValues,
    validateOnChange: false,
    enableReinitialize: true,
    onSubmit: handleOnSubmit,
  });

  const isDirty = Object.values(changesIn(values)).some(Boolean);

  // A re-read can land several renders after it was asked for, so it reads the form as it is now.
  const current = React.useRef({ isDirty, latestAsset, formAsset });
  current.current = { isDirty, latestAsset, formAsset };

  const showFreshAsset = (fresh: MuxAsset) => {
    if (!fresh) return;

    const now = current.current;

    if (playbackSignature(fresh) !== playbackSignature(now.latestAsset)) setPlayerKey((key) => key + 1);
    setLatestAsset(fresh);
    setAssetChanged(true);

    const formFieldsOf = (asset?: MuxAsset) =>
      JSON.stringify([asset?.asset_data?.tracks, asset?.description, asset?.tags]);

    if (!now.isDirty) {
      setFormAsset(fresh);
    } else if (formFieldsOf(fresh) !== formFieldsOf(now.formAsset)) {
      setChangedWhileEditing(true);
    }
  };

  const reloadAsset = async () => {
    const assetId = current.current.latestAsset?.id;
    if (!assetId) return;
    try {
      showFreshAsset(await robotsApi.getAsset(assetId));
    } catch {
      // The next re-read, or reopening the video, catches up.
    }
  };

  const createPlaybackId = async () => {
    if (!latestAsset) return;
    setCreatingPlaybackId(true);
    try {
      showFreshAsset((await robotsApi.createPlaybackId(latestAsset.id)).asset);
    } catch (error) {
      toggleNotification({ type: 'danger', message: robotsErrorOf(error).message });
    } finally {
      setCreatingPlaybackId(false);
    }
  };

  const applySummary = (applied: Record<string, unknown>) => {
    for (const [name, value] of Object.entries(applied)) setFieldValue(name, value);
    if ('title' in applied) setTouchedFields((touched) => ({ ...touched, title: true }));

    toggleNotification({
      type: 'success',
      message: t(
        'ModalDetails.apply-summary.done',
        'Applied {count, plural, one {# generated value} other {# generated values}}. Click Finish to save them.',
        {
          count: Object.keys(applied).length,
        }
      ),
    });
  };

  if (!latestAsset) return null;

  const summary = latestAsset.robots_outputs?.summarize;
  const titleLabel = formatMessage('Common.title-label', 'Title');
  const descriptionLabel = formatMessage('ModalDetails.description-label', 'Description');
  const tagsLabel = formatMessage('ModalDetails.tags-label', 'Tags');

  // The video's own fields, with the limits of `mux-asset`'s schema.
  const summaryTargets: EntryFieldOption[] = [
    { name: 'title', label: titleLabel, type: 'string', minLength: 3, maxLength: 255, onlyFor: 'title' },
    { name: 'description', label: descriptionLabel, type: 'text', onlyFor: 'description' },
    { name: 'tags', label: tagsLabel, type: 'json', onlyFor: 'tags' },
  ];

  const applySummaryButton = (
    <Button variant="secondary" disabled={!summary || !enableUpdate} onClick={() => setApplyingSummary(true)}>
      {formatMessage('ModalDetails.apply-summary', 'Apply summary')}
    </Button>
  );

  const aspect_ratio = latestAsset.aspect_ratio || latestAsset.asset_data?.aspect_ratio;
  const needsPlaybackId = latestAsset.isReady && !!latestAsset.asset_id && !latestAsset.playback_id;

  return (
    <form>
      <Modal.Root open={isOpen} onOpenChange={handleOnOpenChange}>
        <Modal.Content
          style={{
            width: 'min(90vw, 100rem)',
            maxWidth: 'unset',
          }}
        >
          <Modal.Header>
            <Modal.Title>{formatMessage('ModalDetails.header', 'Video details')}</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ paddingInline: 20 }}>
            {deletingState === 'deleting' ? (
              <Flex justifyContent="center" padding={4}>
                <Typography variant="omega" textColor="neutral700">
                  {formatMessage('ModalDetails.deleting', 'Deleting...')}
                </Typography>
              </Flex>
            ) : (
              <Grid.Root gap={4} style={{ alignItems: 'flex-start' }}>
                <Grid.Item col={5} s={12} direction="column" alignItems="start">
                  <Box
                    background="neutral150"
                    style={{
                      aspectRatio: aspect_ratio ? aspect_ratio.replace(':', ' / ') : undefined,
                      marginBottom: '1.5rem',
                      padding: '3rem 0',
                      position: 'relative',
                    }}
                    width="100%"
                  >
                    <PreviewPlayer key={playerKey} muxAsset={latestAsset} />

                    <Dialog.Root open={showDeleteWarning}>
                      <Dialog.Trigger>
                        <IconButton
                          label={formatMessage('Common.delete-button', 'Delete')}
                          disabled={!enableDelete}
                          onClick={toggleDeleteWarning}
                          withTooltip={false}
                          ref={deleteButtonRef}
                          style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                          }}
                        >
                          <Trash />
                        </IconButton>
                      </Dialog.Trigger>
                      <Dialog.Content>
                        <Dialog.Header>
                          {formatMessage(
                            'ModalDetails.delete-confirmation-prompt',
                            'Are you sure you want to delete this item?'
                          )}
                        </Dialog.Header>
                        <Dialog.Body>
                          <Flex padding={4} direction="column" gap={2}>
                            <Box textAlign="center">
                              <WarningCircle />
                            </Box>
                            <Flex justifyContent="center">
                              <Typography>
                                {formatMessage(
                                  'ModalDetails.delete-confirmation-prompt',
                                  'Are you sure you want to delete this item?'
                                )}
                              </Typography>
                            </Flex>
                            <Flex justifyContent="center">
                              <Typography>
                                {formatMessage(
                                  'ModalDetails.delete-confirmation-callout',
                                  'This will also delete the Asset from Mux.'
                                )}
                              </Typography>
                            </Flex>
                          </Flex>
                        </Dialog.Body>
                        <Dialog.Footer>
                          <Button onClickCapture={toggleDeleteWarning} variant="tertiary">
                            {formatMessage('Common.cancel-button', 'Cancel')}
                          </Button>
                          <Button variant="danger-light" startIcon={<Trash />} onClickCapture={handleOnDeleteConfirm}>
                            {formatMessage('Common.confirm-button', 'Confirm')}
                          </Button>
                        </Dialog.Footer>
                      </Dialog.Content>
                    </Dialog.Root>
                  </Box>

                  {needsPlaybackId && (
                    <Box paddingBottom={4} width="100%">
                      <Note
                        variant="warning"
                        action={
                          enableUpdate ? (
                            <Button variant="secondary" loading={creatingPlaybackId} onClick={createPlaybackId}>
                              {formatMessage('ModalDetails.create-playback-id', 'Create playback ID')}
                            </Button>
                          ) : undefined
                        }
                      >
                        {formatMessage(
                          'ModalDetails.no-playback-id',
                          "This video has no playback ID, so it can't be played."
                        )}
                      </Note>
                    </Box>
                  )}

                  {latestAsset.error_message ? (
                    <Box paddingBottom={4} width="100%">
                      <Status variant="danger">
                        <Typography>{latestAsset.error_message}</Typography>
                      </Status>
                    </Box>
                  ) : null}
                </Grid.Item>
                <Grid.Item col={7} s={12} direction="column" alignItems="stretch">
                  <Tabs.Root
                    value={tab}
                    onValueChange={(next: string) => {
                      setTab(next as DetailsTab);
                      if (next === 'robots') setRobotsOpened(true);
                    }}
                    variant="simple"
                  >
                    <Tabs.List aria-label={formatMessage('ModalDetails.header', 'Video details')}>
                      <Tabs.Trigger value="details">
                        {formatMessage('ModalDetails.tab-details', 'Details')}
                      </Tabs.Trigger>
                      <Tabs.Trigger value="captions">
                        {formatMessage('ModalDetails.tab-captions', 'Captions')}
                      </Tabs.Trigger>
                      <Tabs.Trigger value="robots">{formatMessage('ModalDetails.tab-robots', 'Robots')}</Tabs.Trigger>
                    </Tabs.List>

                    {changedWhileEditing && (
                      <Box paddingTop={4}>
                        <Note variant="warning">
                          {formatMessage(
                            'ModalDetails.changed-while-editing',
                            'This video changed while you were editing (new captions, tracks, description or tags). Save or discard your changes to see them.'
                          )}
                        </Note>
                      </Box>
                    )}

                    <Tabs.Content value="details">
                      <Box paddingTop={4}>
                        <Box paddingBottom={4} width="100%">
                          <Field.Root id="with_field" error={errors.title}>
                            <Field.Label>{titleLabel}</Field.Label>
                            <Field.Input
                              name="title"
                              hasError={errors.title !== undefined}
                              value={values.title}
                              disabled={!enableUpdate}
                              required
                              onChange={(e: any) => {
                                setTouchedFields({ ...touchedFields, title: true });
                                handleChange(e);
                              }}
                            />
                            <Field.Error />
                          </Field.Root>
                        </Box>
                        <Box paddingBottom={4} width="100%">
                          <Field.Root name="description">
                            <Field.Label>{descriptionLabel}</Field.Label>
                            <Textarea
                              name="description"
                              value={values.description ?? ''}
                              disabled={!enableUpdate}
                              onChange={handleChange}
                            />
                          </Field.Root>
                        </Box>
                        <Box paddingBottom={4} width="100%">
                          <TagsField
                            label={tagsLabel}
                            tags={values.tags ?? []}
                            disabled={!enableUpdate}
                            onChange={(tags) => setFieldValue('tags', tags)}
                          />
                        </Box>
                        <Box paddingBottom={4}>
                          {summary ? (
                            applySummaryButton
                          ) : (
                            <Tooltip
                              label={formatMessage(
                                'ModalDetails.apply-summary-disabled',
                                'Run a Summarize job on this video to apply its title, description and tags.'
                              )}
                            >
                              <span>{applySummaryButton}</span>
                            </Tooltip>
                          )}
                          {applyingSummary && summary && (
                            <ApplyDialog
                              title={formatMessage('ModalDetails.apply-summary.title', 'Apply summary to this video')}
                              help={formatMessage(
                                'ModalDetails.apply-summary.help',
                                "Pick a field for each output, or leave it on Do not apply. Nothing is sent to Mux: the values go into this video's fields, and Finish saves them."
                              )}
                              summary={summary}
                              fields={summaryTargets}
                              values={{ title: values.title, description: values.description, tags: values.tags }}
                              onApply={applySummary}
                              onClose={() => setApplyingSummary(false)}
                            />
                          )}
                        </Box>
                        <Box paddingBottom={4} width="100%">
                          <Summary muxAsset={latestAsset} />
                        </Box>
                        <Box paddingBottom={4} width="100%">
                          <Field.Root
                            hint={
                              <>
                                {formatMessage('ModalDetails.powered-by-mux', 'Powered by mux-player.')}
                                &nbsp;
                                <Link href="https://docs.mux.com/guides/video/mux-player" isExternal>
                                  {formatMessage('ModalDetails.read-more', 'Read more about it')}
                                </Link>
                              </>
                            }
                          >
                            <Field.Label style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                              {formatMessage('ModalDetails.code-snippet', 'Code snippet')}
                              <IconButton
                                label="More actions"
                                borderStyle="none"
                                withTooltip={false}
                                onClick={handleCopyCodeSnippet}
                              >
                                <Duplicate />
                              </IconButton>
                            </Field.Label>
                            <Textarea name="codeSnippet" value={codeSnippet} rows={7} disabled />
                            <Field.Hint />
                          </Field.Root>
                        </Box>
                      </Box>
                    </Tabs.Content>

                    <Tabs.Content value="captions">
                      <Box paddingTop={4} width="100%">
                        <Field.Root>
                          <Field.Label>{formatMessage('Captions.title', 'Captions / subtitles')}</Field.Label>
                          <CustomTextTrackForm
                            custom_text_tracks={values.custom_text_tracks || []}
                            modifyCustomTextTracks={(newTracks) => setFieldValue('custom_text_tracks', newTracks)}
                            muxAsset={formAsset}
                          />
                        </Field.Root>
                      </Box>
                    </Tabs.Content>

                    {/* Kept mounted once opened, so a running job keeps being followed from the other tabs. */}
                    <Tabs.Content value="robots" forceMount={robotsOpened ? true : undefined} hidden={tab !== 'robots'}>
                      {robotsOpened && (
                        <Box paddingTop={4}>
                          <RobotsErrorBoundary
                            title={formatMessage('Robots.crashed.title', "The Robots tab couldn't load")}
                            message={formatMessage(
                              'Robots.crashed.body',
                              'Everything else on this video still works. Reopening the video usually clears this; if it doesn’t, the details are in the browser console.'
                            )}
                          >
                            <RobotsTab
                              muxAsset={latestAsset}
                              canRun={canRunRobots}
                              onAssetMayHaveChanged={reloadAsset}
                            />
                          </RobotsErrorBoundary>
                        </Box>
                      )}
                    </Tabs.Content>
                  </Tabs.Root>
                </Grid.Item>
              </Grid.Root>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close>
              <Button variant="tertiary" onClick={close} disabled={deletingState === 'deleting'}>
                {formatMessage('Common.cancel-button', 'Cancel')}
              </Button>
            </Modal.Close>
            <Button variant="success" disabled={deletingState === 'deleting' || isSubmitting} onClick={handleSubmit}>
              {formatMessage('Common.finish-button', 'Finish')}
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </form>
  );
}

/** An editable list of short strings: Enter or a comma adds what was typed, and each tag removes itself. */
function TagsField({
  label,
  tags,
  disabled,
  onChange,
}: {
  label: string;
  tags: string[];
  disabled: boolean;
  onChange: (tags: string[]) => void;
}) {
  const { t } = useRobotsIntl();
  const [draft, setDraft] = React.useState('');

  // Splits on commas too, so a pasted list adds one tag per item.
  const add = () => {
    const added = draft
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag, index, all) => tag && !tags.includes(tag) && all.indexOf(tag) === index);
    setDraft('');
    if (added.length > 0) onChange([...tags, ...added]);
  };

  return (
    <Field.Root name="tags" hint={t('ModalDetails.tags-hint', 'Press Enter or type a comma to add a tag.')}>
      <Field.Label>{label}</Field.Label>
      {tags.length > 0 && (
        <Flex gap={1} wrap="wrap" paddingBottom={1}>
          {tags.map((tag, index) => (
            <Tag
              key={`${index}-${tag}`}
              icon={<Cross />}
              label={t('ModalDetails.remove-tag', 'Remove {tag}', { tag })}
              disabled={disabled}
              onClick={() => onChange(tags.filter((_, other) => other !== index))}
            >
              {tag}
            </Tag>
          ))}
        </Flex>
      )}
      <Field.Input
        value={draft}
        disabled={disabled}
        placeholder={t('ModalDetails.add-tag', 'Add a tag')}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDraft(event.target.value)}
        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
          if (event.key !== 'Enter' && event.key !== ',') return;
          event.preventDefault();
          add();
        }}
        onBlur={add}
      />
      <Field.Hint />
    </Field.Root>
  );
}
