import React from 'react';
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
import { TextInput } from '@strapi/design-system/TextInput';
import { ToggleInput } from '@strapi/design-system/ToggleInput';
import { Typography } from '@strapi/design-system/Typography';

import { MuxAsset } from '../../../../types';
import PreviewPlayer from '../preview-player';
import Summary from './summary';
import { deleteMuxAsset, setMuxAsset } from '../../services/strapi';

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
    if (!values.title) {
      setErrors({ title: 'No title specified' });  

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
            Details
          </Typography>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Grid gap={4}>
              <GridItem col={6} s={12}>
                <PreviewPlayer muxAsset={muxAsset} />
              </GridItem>
              <GridItem col={6} s={12}>
                <Stack>
                  <Box paddingBottom={4}>
                    <TextInput
                      label="Title"
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
                      label="Is ready"
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
                  <Box>
                    <Summary muxAsset={muxAsset} />
                  </Box>
                </Stack>
              </GridItem>
            </Grid>
          </ModalBody>
          <ModalFooter
            startActions={
              <>
                <Button variant="tertiary" onClick={onToggle}>Cancel</Button>
                <Button variant="danger" disabled={!enableDelete} onClick={toggleDeleteWarning}>Delete</Button>
              </>
            }
            endActions={
              <Button type="submit" variant="success" disabled={isProcessing || isSubmitting}>Finish</Button>
            }
          />
        </form>
      </ModalLayout>
      <Dialog onClose={toggleDeleteWarning} title="Delete confirmation" isOpen={showDeleteWarning}>
        <DialogBody icon={<ExclamationMarkCircle />}>
          <Stack>
            <Flex justifyContent="center">
              <Typography>Are you sure you want to delete this item?</Typography>
            </Flex>
            <Flex justifyContent="center">
              <Typography>This will also delete the Asset from Mux.</Typography>
            </Flex>
          </Stack>
        </DialogBody>
        <DialogFooter
          startAction={<Button onClick={toggleDeleteWarning} variant="tertiary">Cancel</Button>}
          endAction={
            <Button variant="danger-light" startIcon={<Trash />} onClick={handleOnDeleteConfirm}>
              Confirm
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
