import React from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { FormikHelpers, FormikTouched, useFormik } from 'formik';
import ExclamationMarkCircle from '@strapi/icons/ExclamationMarkCircle';
import Trash from '@strapi/icons/Trash';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { Dialog, DialogBody, DialogFooter } from '@strapi/design-system/Dialog';
import { Flex } from '@strapi/design-system/Flex';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { ModalLayout, ModalBody, ModalHeader, ModalFooter } from '@strapi/design-system/ModalLayout';
import { Stack } from '@strapi/design-system/Stack';
import { Status } from '@strapi/design-system/Status';
import { TextInput } from '@strapi/design-system/TextInput';
import { ToggleInput } from '@strapi/design-system/ToggleInput';
import { Typography } from '@strapi/design-system/Typography';

import { MuxAsset } from '../../../../types';
import PreviewPlayer from '../preview-player';
import Summary from './summary';
import { deleteMuxAsset, setMuxAsset } from '../../services/strapi';
import getTrad from '../../utils/getTrad';
import PlayerWrapper from './player-wrapper';

const GridItemStyled = styled(GridItem)`
  position: sticky;
  top: 0;
`;

interface FormProps {
  title: string;
  isReady: boolean;
}

interface DefaultProps {
  onToggle: (refresh?:boolean) => void;
}

interface Props extends DefaultProps{
  isOpen: boolean;
  muxAsset?: MuxAsset;
  enableUpdate: boolean;
  enableDelete: boolean;
}

const ModalDetails = (props:Props) => {
  const { isOpen, muxAsset, enableUpdate, enableDelete, onToggle } = props;

  const { formatMessage } = useIntl();

  if(muxAsset === undefined) return null;

  const [touchedFields, setTouchedFields] = React.useState<FormikTouched<FormProps>>({});
  const [showDeleteWarning, setShowDeleteWarning] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const INITIAL_VALUES = {
    title: muxAsset.title,
    isReady: muxAsset.isReady 
  };

  const toggleDeleteWarning = () => setShowDeleteWarning(prevState => !prevState);

  const handleOnDeleteConfirm = async () => {
    setIsProcessing(true);

    await deleteMuxAsset(muxAsset);

    setIsProcessing(false);

    toggleDeleteWarning();
    onToggle(true);
  };

  const handleOnSubmit = async (values: FormProps, { setErrors, setSubmitting }: FormikHelpers<FormProps>) => {
    const title = formatMessage({
      id: getTrad('Common.title-required'),
      defaultMessage: 'No title specified'
    });

    if (!values.title) {
      setErrors({ title });  

      return;
    }
    
    if(Object.keys(touchedFields).length > 0) {
      const data:any = { id: muxAsset.id };

      if (touchedFields.title) {
        data.title = values.title;
      }

      if(touchedFields.isReady) {
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
    onSubmit: handleOnSubmit
  }); 

  if (!isOpen) return null;

  return (
    <>
      <ModalLayout onClose={onToggle} labelledBy="title">
        <ModalHeader>
          <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
            {
              formatMessage({
                id: getTrad('ModalDetails.header'),
                defaultMessage: 'Details'
              })
            }
          </Typography>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Grid gap={4}>
              <GridItemStyled col={6} s={12}>
                <PlayerWrapper disableDelete={!enableDelete} onDelete={toggleDeleteWarning}>
                  <PreviewPlayer muxAsset={muxAsset} />
                </PlayerWrapper>
              </GridItemStyled>
              <GridItem col={6} s={12}>
                <Stack>
                  {muxAsset.error_message ?
                    (
                      <Box paddingBottom={4}>
                        <Status variant="danger">
                          <Typography>{muxAsset.error_message}</Typography>
                        </Status>
                      </Box>
                    ) : null
                  }
                  <Box paddingBottom={4}>
                    <Summary muxAsset={muxAsset} />
                  </Box>
                  <Box paddingBottom={4}>
                    <TextInput
                      label={
                        formatMessage({
                          id: getTrad('Common.title-label'),
                          defaultMessage: 'Title'
                        })
                      }
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
                    <ToggleInput
                      label={
                        formatMessage({
                          id: getTrad('Common.isReady-label'),
                          defaultMessage: 'Is ready'
                        })
                      }
                      name="isReady"
                      onLabel="on"
                      offLabel="off"
                      checked={values.isReady}
                      error={errors.isReady}
                      disabled={!enableUpdate}
                      onChange={(e: any) => {
                        setTouchedFields({ ...touchedFields, isReady: true });
                        handleChange(e);
                      }}
                    />
                  </Box>
                </Stack>
              </GridItem>
            </Grid>
          </ModalBody>
          <ModalFooter
            startActions={
              <>
                <Button variant="tertiary" onClick={onToggle}>
                  {
                    formatMessage({
                      id: getTrad('Common.cancel-button'),
                      defaultMessage: 'Cancel'
                    })
                  }
                </Button>
              </>
            }
            endActions={
              <Button type="submit" variant="success" disabled={isProcessing || isSubmitting}>
                {
                  formatMessage({
                    id: getTrad('Common.finish-button'),
                    defaultMessage: 'Finish'
                  })
                }
              </Button>
            }
          />
        </form>
      </ModalLayout>
      <Dialog
        onClose={toggleDeleteWarning}
        title={
          formatMessage({
            id: getTrad('ModalDetails.delete-confirmation-header'),
            defaultMessage: 'Delete confirmation'
          })
        }
        isOpen={showDeleteWarning}
      >
        <DialogBody icon={<ExclamationMarkCircle />}>
          <Stack>
            <Flex justifyContent="center">
              <Typography>
                {
                  formatMessage({
                    id: getTrad('ModalDetails.delete-confirmation-prompt'),
                    defaultMessage: 'Are you sure you want to delete this item?'
                  })
                }
              </Typography>
            </Flex>
            <Flex justifyContent="center">
              <Typography>
                {
                  formatMessage({
                    id: getTrad('ModalDetails.delete-confirmation-callout'),
                    defaultMessage: 'This will also delete the Asset from Mux.'
                  })
                }
              </Typography>
            </Flex>
          </Stack>
        </DialogBody>
        <DialogFooter
          startAction={
            <Button onClick={toggleDeleteWarning} variant="tertiary">
              {
                formatMessage({
                  id: getTrad('Common.cancel-button'),
                  defaultMessage: 'Cancel'
                })
              }
            </Button>
          }
          endAction={
            <Button variant="danger-light" startIcon={<Trash />} onClick={handleOnDeleteConfirm}>
              {
                formatMessage({
                  id: getTrad('Common.confirm-button'),
                  defaultMessage: 'Confirm'
                })
              }
            </Button>
          }
        />
      </Dialog>
    </>
  );
}

ModalDetails.defaultProps = {
  onToggle: () => {}
} as DefaultProps;

export default ModalDetails;
