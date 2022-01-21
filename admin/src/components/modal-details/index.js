const React = require('react');
const { Formik, FormikErrors, FormikHelpers, ErrorMessage, Field, FieldProps, FormikTouched } = require('formik');
const { Form } = require('@strapi/helper-plugin');
const ExclamationMarkCircle = require('@strapi/icons/ExclamationMarkCircle');
const Trash = require('@strapi/icons/Trash');
const { Box } = require('@strapi/design-system/Box');
const { Button } = require('@strapi/design-system/Button');
const { Dialog, DialogBody, DialogFooter } = require('@strapi/design-system/Dialog');
const { Flex } = require('@strapi/design-system/Flex');
const { Grid, GridItem } = require('@strapi/design-system/Grid');
const { ModalLayout, ModalBody, ModalHeader, ModalFooter } = require('@strapi/design-system/ModalLayout');
const { Stack } = require('@strapi/design-system/Stack');
const { TextInput } = require('@strapi/design-system/TextInput');
const { ToggleInput } = require('@strapi/design-system/ToggleInput');
const { Typography } = require('@strapi/design-system/Typography');

// const { MuxAsset } = require('../../../../types');
const PreviewPlayer = require('../preview-player');
const Summary = require('./summary');
const { deleteMuxAsset, setMuxAsset } = require('../../services/strapi');

const ModalDetails = (props) => {
  const { isOpen, muxAsset, onToggle } = props;

  if(muxAsset === undefined) return null;

  const [touchedFields, setTouchedFields] = React.useState({});
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

  const handleValidate = (values) => {
    const errors = {};
    if (!values.title) {
      errors.title = 'Required';
    }
    return errors;
  }

  const handleOnSubmit = async (values, actions) => {
    if(Object.keys(touchedFields).length > 0) {
      const data = { id: muxAsset.id };

      if(touchedFields.title) {
        data.title = values.title;
      }

      if(touchedFields.isReady) {
        data.isReady = values.isReady;
      }
      
      await setMuxAsset(data);
    }

    actions.setSubmitting(false);

    onToggle(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <ModalLayout onClose={onToggle} labelledBy="title">
        <ModalHeader>
          <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
            Details
          </Typography>
        </ModalHeader>
        <Formik
          onSubmit={handleOnSubmit}
          initialValues={INITIAL_VALUES}
          validateOnChange={false}
          enableReinitialize
        >
          {({ errors, values, isSubmitting, setFieldValue, handleChange }) => {
            return (
              <Form>
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
                            onChange={(e) => {
                              setTouchedFields({...touchedFields, title: true });
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
                            onChange={(e) => {
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
                      <Button variant="danger" onClick={toggleDeleteWarning}>Delete</Button>
                    </>
                  }
                  endActions={<Button type="submit" variant="success" disabled={isSubmitting}>Finish</Button>}
                />
              </Form>
            );
          }}
        </Formik>
      </ModalLayout>
      <Dialog onClose={toggleDeleteWarning} title="Delete confirmation" isOpen={showDeleteWarning}>
        <DialogBody icon={<ExclamationMarkCircle />}>
          <Stack>
            <Flex justifyContent="center">
              <Typography>Are you sure you want to delete this item?</Typography>
            </Flex>
            <Flex justifyContent="center">
              <Typography>This will also delete the Asset = require(Mux.</Typography>
            </Flex>
          </Stack>
        </DialogBody>
        <DialogFooter
          startAction={<Button onClick={toggleDeleteWarning} variant="tertiary">Cancel</Button>}
          endAction={
            <Button
              variant="danger-light"
              startIcon={<Trash />}
              onClick={handleOnDeleteConfirm}
            >
              Confirm
            </Button>
          }
        />
      </Dialog>
      {/* <ModalLayout isOpen={isOpen} onToggle={onToggle}>
        <HeaderModal onToggle={onToggle}>
          <section>
            <HeaderTitle>Details</HeaderTitle>
          </section>
        </HeaderModal>
        <Formik 
          initialValues={{ title: muxAsset.title, isReady: muxAsset.isReady }} 
          validate={handleValidate}
          onSubmit={handleOnSubmit}
        >
          {({
            handleSubmit,
            isSubmitting
          }) => (
            <form onSubmit={handleSubmit}>
              <ModalForm>
                <ModalBody>
                  <BodyWrapper>
                    <div>
                      <PreviewPlayer muxAsset={muxAsset} />
                    </div>
                    <MetadataContainer>
                      { 
                        muxAsset.error_message &&
                        <div>
                          <ErrorContainer top bottom right left size="sm">
                            {muxAsset.error_message}
                          </ErrorContainer>
                        </div>
                      }
                      <div>
                        <Label message='Title' />
                        <Field name="title">
                          {({ field: { value }, form: { setFieldValue } }:FieldProps) => (
                            <>
                              <InputText
                                type="text"
                                value={value}
                                onChange={(e:InputTextOnChange) => {
                                  setFieldValue('title', e.target.value);
                                  setTouchedFields({...touchedFields, title: true });
                                }}
                              />
                              <ErrorMessageStyled name="title" component="div" />
                            </>
                          )}
                        </Field>
                      </div>
                      <div>
                        <Label message='Is ready' />
                        <Field name="isReady">
                          {({ field: { value }, form: { setFieldValue } }:FieldProps) => (
                            <Toggle
                              value={value}
                              onChange={(e:ToggleOnChange) => {
                                setFieldValue('isReady', e.target.value);
                                setTouchedFields({...touchedFields, isReady: true });
                              }}
                            />
                          )}
                        </Field>
                      </div>
                      <div>
                        <Summary muxAsset={muxAsset} />
                      </div>
                    </MetadataContainer>
                  </BodyWrapper>
                </ModalBody>
              </ModalForm>
              <ModalFooter>
                <section>
                  <LeftFooterContainer>
                    <Button onClick={onToggle} color="cancel">Cancel</Button>
                    <Button onClick={toggleDeleteWarning} color="delete" icon={<FontAwesomeIcon icon={faTrashAlt} />}>Delete</Button>
                  </LeftFooterContainer>
                  <Button type="submit" color="success" disabled={isSubmitting}>Finish</Button>
                </section>
              </ModalFooter>
            </form>
          )}
        </Formik>
      </ModalLayout>
      <PopUpWarning
        isOpen={showDeleteWarning}
        toggleModal={toggleDeleteWarning}
        content={{
          message: 'Are you sure you want to delete this item?',
          secondMessage: 'This will also delete the Asset = require(Mux.'
        }}
        popUpWarningType="danger"
        isConfirmButtonLoading={isProcessing}
        onConfirm={handleOnDeleteConfirm}
      /> */}
    </>
  )
}

ModalDetails.defaultProps = {
  onToggle: () => { }
};

module.exports = ModalDetails;
