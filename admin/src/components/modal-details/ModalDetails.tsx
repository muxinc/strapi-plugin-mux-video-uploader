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
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { MuxAsset } from '../../../../server/content-types/mux-asset/types';
import { deleteMuxAsset, setMuxAsset } from '../../services/strapi';
import getTrad from '../../utils/getTrad';
import PreviewPlayer from '../preview-player';
import TextTracks from './TextTracks';
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

interface FormProps {
  title: string;
  isReady: boolean;
}

export default function ModalDetails(props: {
  onToggle: (refresh?: boolean) => void;
  isOpen: boolean;
  muxAsset: MuxAsset;
  enableUpdate: boolean;
  enableDelete: boolean;
}) {
  const { isOpen, muxAsset, enableUpdate, enableDelete, onToggle = () => {} } = props;

  const { formatMessage } = useIntl();
  const deleteButtonRef = React.useRef<HTMLButtonElement>(null);

  const [touchedFields, setTouchedFields] = React.useState<FormikTouched<FormProps>>({});
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

  const INITIAL_VALUES = {
    title: muxAsset.title,
    isReady: muxAsset.isReady,
  };

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

  const handleOnSubmit = async (values: FormProps, { setErrors, setSubmitting }: FormikHelpers<FormProps>) => {
    const title = formatMessage({
      id: getTrad('Common.title-required'),
      defaultMessage: 'No title specified',
    });

    if (!values.title) {
      setErrors({ title });

      return;
    }

    if (Object.keys(touchedFields).length > 0) {
      const data: any = { id: muxAsset.id };

      if (touchedFields.title) {
        data.title = values.title;
      }

      if (touchedFields.isReady) {
        data.isReady = values.isReady;
      }

      await setMuxAsset(data);
    }

    setSubmitting(false);

    onToggle(true);
  };

  const { errors, values, isSubmitting, handleChange, handleSubmit } = useFormik({
    initialValues: INITIAL_VALUES,
    validateOnChange: false,
    enableReinitialize: true,
    onSubmit: handleOnSubmit,
  });

  if (!isOpen) return null;

  const codeSnippetHint = (
    <div>
      {formatMessage({
        id: getTrad('ModalDetails.powered-by-mux'),
        defaultMessage: 'Powered by mux-player.',
      })}{' '}
      <Link href="https://docs.mux.com/guides/video/mux-player" isExternal>
        {formatMessage({
          id: getTrad('ModalDetails.read-more'),
          defaultMessage: 'Read more about it',
        })}
      </Link>
    </div>
  );

  const aspect_ratio = muxAsset.aspect_ratio || muxAsset.asset_data?.aspect_ratio;
  return (
    <ModalLayout
      onClose={onToggle}
      labelledBy="title"
      style={{
        width: 'min(90vw, 60rem)',
      }}
    >
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          {formatMessage({
            id: getTrad('ModalDetails.header'),
            defaultMessage: 'Video details',
          })}
        </Typography>
      </ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          {deletingState === 'deleting' ? (
            <Flex justifyContent="center" padding={4}>
              <Typography variant="omega" textColor="neutral700">
                {formatMessage({
                  id: getTrad('ModalDetails.deleting'),
                  defaultMessage: 'Deleting...',
                })}
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
                  }}
                >
                  <PreviewPlayer muxAsset={muxAsset} />
                </Box>
                <TextTracks muxAsset={muxAsset} />
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
                      label={formatMessage({
                        id: getTrad('Common.title-label'),
                        defaultMessage: 'Title',
                      })}
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
                      label={formatMessage({
                        id: getTrad('ModalDetails.code-snippet'),
                        defaultMessage: 'Code snippet',
                      })}
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
                {formatMessage({
                  id: getTrad('Common.cancel-button'),
                  defaultMessage: 'Cancel',
                })}
              </Button>
            </>
          }
          endActions={
            <>
              <IconButton
                label={formatMessage({ id: getTrad('Common.delete-button'), defaultMessage: 'Delete' })}
                disableDelete={!enableDelete}
                onClick={toggleDeleteWarning}
                icon={<Trash />}
                ref={deleteButtonRef}
              />
              {showDeleteWarning && (
                <Popover source={deleteButtonRef} onDismiss={toggleDeleteWarning}>
                  <Flex padding={4} direction="column" gap={2}>
                    <Box textAlign="center">
                      <ExclamationMarkCircle />
                    </Box>
                    <Flex justifyContent="center">
                      <Typography>
                        {formatMessage({
                          id: getTrad('ModalDetails.delete-confirmation-prompt'),
                          defaultMessage: 'Are you sure you want to delete this item?',
                        })}
                      </Typography>
                    </Flex>
                    <Flex justifyContent="center">
                      <Typography>
                        {formatMessage({
                          id: getTrad('ModalDetails.delete-confirmation-callout'),
                          defaultMessage: 'This will also delete the Asset from Mux.',
                        })}
                      </Typography>
                    </Flex>
                    <Flex justifyContent="between" paddingTop={1}>
                      <Button onClickCapture={toggleDeleteWarning} variant="tertiary">
                        {formatMessage({
                          id: getTrad('Common.cancel-button'),
                          defaultMessage: 'Cancel',
                        })}
                      </Button>
                      <Button variant="danger-light" startIcon={<Trash />} onClickCapture={handleOnDeleteConfirm}>
                        {formatMessage({
                          id: getTrad('Common.confirm-button'),
                          defaultMessage: 'Confirm',
                        })}
                      </Button>
                    </Flex>
                  </Flex>
                </Popover>
              )}
              <Button type="submit" variant="success" disabled={deletingState === 'deleting' || isSubmitting}>
                {formatMessage({
                  id: getTrad('Common.finish-button'),
                  defaultMessage: 'Finish',
                })}
              </Button>
            </>
          }
        />
      </form>
    </ModalLayout>
  );
}
