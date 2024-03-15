import { Popover } from '@strapi/design-system';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { Flex } from '@strapi/design-system/Flex';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { IconButton } from '@strapi/design-system/IconButton';
import { Link } from '@strapi/design-system/Link';
import { ModalBody, ModalFooter, ModalHeader, ModalLayout } from '@strapi/design-system/ModalLayout';
import { Stack } from '@strapi/design-system/Stack';
import { Status } from '@strapi/design-system/Status';
import { TextInput } from '@strapi/design-system/TextInput';
import { Textarea } from '@strapi/design-system/Textarea';
import { Typography } from '@strapi/design-system/Typography';
import { useNotification } from '@strapi/helper-plugin';
import Duplicate from '@strapi/icons/Duplicate';
import ExclamationMarkCircle from '@strapi/icons/ExclamationMarkCircle';
import Trash from '@strapi/icons/Trash';
import copy from 'copy-to-clipboard';
import { FormikHelpers, FormikTouched, useFormik } from 'formik';
import React from 'react';
import styled from 'styled-components';

import { MuxAsset, MuxAssetUpdate } from '../../../../server/content-types/mux-asset/types';
import { deleteMuxAsset, setMuxAsset } from '../../services/strapi';
import getTrad from '../../utils/get-trad';
import usePluginIntl from '../../utils/use-plugin-intl';
import CustomTextTrackForm from '../modal-new-upload/custom-text-track-form';
import PreviewPlayer from '../preview-player';
import SignedTokensProvider from '../signed-tokens-provider';
import Summary from './summary';

const GridItemStyled = styled(GridItem)`
  position: sticky;
  top: 0;
`;

const IconButtonStyled = styled(IconButton)`
  cursor: pointer;

  :hover {
    filter: brightness(85%);
  }
`;

export default function ModalDetails(props: {
  onToggle: (refresh?: boolean) => void;
  isOpen: boolean;
  muxAsset: MuxAsset;
  enableUpdate: boolean;
  enableDelete: boolean;
}) {
  const { isOpen, muxAsset, enableUpdate, enableDelete, onToggle = () => {} } = props;

  const { formatMessage } = usePluginIntl();
  const deleteButtonRef = React.useRef<HTMLButtonElement>(null);

  const [touchedFields, setTouchedFields] = React.useState<FormikTouched<MuxAssetUpdate>>({});
  const [showDeleteWarning, setShowDeleteWarning] = React.useState(false);
  const [deletingState, setDeletingState] = React.useState<'idle' | 'deleting'>('idle');
  const [codeSnippet] = React.useState<string>(`<mux-player
  playback-id="${muxAsset.playback_id}"
  playback-token="TOKEN"
  env-key="ENV_KEY"
  metadata-video-title="${muxAsset.title}"
  controls
/>`);

  const notification = useNotification();

  const subtitles = (props.muxAsset.asset_data?.tracks ?? []).filter(
    (track) => track.type === 'text' && track.text_type === 'subtitles' && track.status !== 'errored'
  );

  const toggleDeleteWarning = () => setShowDeleteWarning((prevState) => !prevState);

  const handleCopyCodeSnippet = () => {
    copy(codeSnippet);

    notification({
      type: 'success',
      message: {
        id: getTrad('ModalDetails.copied-to-clipboard'),
        defaultMessage: 'Copied code snippet to clipboard',
      },
    });
  };

  const handleOnDeleteConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingState('deleting');
    toggleDeleteWarning();

    try {
      await deleteMuxAsset(muxAsset);
      setDeletingState('idle');

      onToggle(true);
      notification({
        type: 'success',
        message: {
          id: getTrad('ModalDetails.delete-success'),
          defaultMessage: 'Video deleted successfully',
        },
      });
    } catch (error) {
      notification({
        type: 'error',
        message: {
          id: getTrad('ModalDetails.failed-to-delete'),
          defaultMessage: 'Failed to delete video',
        },
      });
    }
  };

  const initialValues: MuxAssetUpdate = {
    id: muxAsset.id,
    title: muxAsset.title || muxAsset.asset_id || muxAsset.createdAt,

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
  const handleOnSubmit = async (
    values: MuxAssetUpdate,
    { setErrors, setSubmitting }: FormikHelpers<MuxAssetUpdate>
  ) => {
    const title = formatMessage('Common.title-required', 'No title specified');

    if (!values.title) {
      setErrors({ title });

      return;
    }

    const tracksModified =
      JSON.stringify(values.custom_text_tracks || []) !== JSON.stringify(initialValues.custom_text_tracks || []);

    const data: MuxAssetUpdate = {
      id: muxAsset.id,
      title: touchedFields.title ? values.title : undefined,
      custom_text_tracks: tracksModified ? values.custom_text_tracks : undefined,
    };

    if (data.title || data.custom_text_tracks) {
      await setMuxAsset(data);
    }

    setSubmitting(false);

    onToggle(true);
  };

  const { errors, values, isSubmitting, handleChange, handleSubmit, setFieldValue } = useFormik<MuxAssetUpdate>({
    initialValues,
    validateOnChange: false,
    enableReinitialize: true,
    onSubmit: handleOnSubmit,
  });

  if (!isOpen) return null;

  const codeSnippetHint = (
    <div>
      {formatMessage('ModalDetails.powered-by-mux', 'Powered by mux-player.')}{' '}
      <Link href="https://docs.mux.com/guides/video/mux-player" isExternal>
        {formatMessage('ModalDetails.read-more', 'Read more about it')}
      </Link>
    </div>
  );

  const aspect_ratio = muxAsset.aspect_ratio || muxAsset.asset_data?.aspect_ratio;
  return (
    <SignedTokensProvider muxAsset={muxAsset}>
      <ModalLayout
        onClose={onToggle}
        labelledBy="title"
        style={{
          width: 'min(90vw, 60rem)',
        }}
      >
        <ModalHeader>
          <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
            {formatMessage('ModalDetails.header', 'Video details')}
          </Typography>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {deletingState === 'deleting' ? (
              <Flex justifyContent="center" padding={4}>
                <Typography variant="omega" textColor="neutral700">
                  {formatMessage('ModalDetails.deleting', 'Deleting...')}
                </Typography>
              </Flex>
            ) : (
              <Grid gap={4} style={{ alignItems: 'flex-start' }}>
                <GridItemStyled col={6} s={12}>
                  <Box
                    background="neutral150"
                    style={{
                      aspectRatio: aspect_ratio ? aspect_ratio.replace(':', ' / ') : undefined,
                      marginBottom: '1.5rem',
                      paddingTop: '3rem',
                      position: 'relative',
                    }}
                  >
                    <PreviewPlayer muxAsset={muxAsset} />

                    <IconButton
                      label={formatMessage('Common.delete-button', 'Delete')}
                      disableDelete={!enableDelete}
                      onClick={toggleDeleteWarning}
                      icon={<Trash />}
                      ref={deleteButtonRef}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                      }}
                    />
                    {showDeleteWarning && (
                      <Popover source={deleteButtonRef} onDismiss={toggleDeleteWarning}>
                        <Flex padding={4} direction="column" gap={2}>
                          <Box textAlign="center">
                            <ExclamationMarkCircle />
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
                          <Flex justifyContent="between" paddingTop={1} gap={2}>
                            <Button onClickCapture={toggleDeleteWarning} variant="tertiary">
                              {formatMessage('Common.cancel-button', 'Cancel')}
                            </Button>
                            <Button variant="danger-light" startIcon={<Trash />} onClickCapture={handleOnDeleteConfirm}>
                              {formatMessage('Common.confirm-button', 'Confirm')}
                            </Button>
                          </Flex>
                        </Flex>
                      </Popover>
                    )}
                  </Box>

                  <div>
                    <Typography variant="pi" fontWeight="bold">
                      {formatMessage('Captions.title', 'Captions / subtitles')}
                    </Typography>
                    <CustomTextTrackForm
                      custom_text_tracks={values.custom_text_tracks || []}
                      modifyCustomTextTracks={(newTracks) => setFieldValue('custom_text_tracks', newTracks)}
                      muxAsset={muxAsset}
                    />
                  </div>
                </GridItemStyled>
                <GridItemStyled col={6} s={12}>
                  <Stack>
                    {muxAsset.error_message ? (
                      <Box paddingBottom={4}>
                        <Status variant="danger">
                          <Typography>{muxAsset.error_message}</Typography>
                        </Status>
                      </Box>
                    ) : null}
                    <Box paddingBottom={4}>
                      <TextInput
                        label={formatMessage('Common.title-label', 'Title')}
                        name="title"
                        value={values.title}
                        error={errors.title}
                        disabled={!enableUpdate}
                        required
                        onChange={(e: any) => {
                          setTouchedFields({ ...touchedFields, title: true });
                          handleChange(e);
                        }}
                      />
                    </Box>
                    <Box paddingBottom={4}>
                      <Summary muxAsset={muxAsset} />
                    </Box>
                    <Box paddingBottom={4}>
                      <Textarea
                        label={formatMessage('ModalDetails.code-snippet', 'Code snippet')}
                        name="codeSnippet"
                        value={codeSnippet}
                        hint={codeSnippetHint}
                        labelAction={
                          <IconButtonStyled
                            color="secondary500"
                            as={Duplicate}
                            onClick={handleCopyCodeSnippet}
                            noBorder
                          />
                        }
                        disabled
                      />
                    </Box>
                  </Stack>
                </GridItemStyled>
              </Grid>
            )}
          </ModalBody>
          <ModalFooter
            startActions={
              <>
                <Button variant="tertiary" onClick={onToggle} disabled={deletingState === 'deleting'}>
                  {formatMessage('Common.cancel-button', 'Cancel')}
                </Button>
              </>
            }
            endActions={
              <Button type="submit" variant="success" disabled={deletingState === 'deleting' || isSubmitting}>
                {formatMessage('Common.finish-button', 'Finish')}
              </Button>
            }
          />
        </form>
      </ModalLayout>
    </SignedTokensProvider>
  );
}
