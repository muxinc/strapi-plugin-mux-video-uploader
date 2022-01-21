const React = require('react');
const { createUpload, UpChunk } = require('@mux/upchunk');
const { Formik, FormikErrors, FormikHelpers } = require('formik');
const { Form } = require('@strapi/helper-plugin');
const { Box } = require('@strapi/design-system/Box');
const { Button } = require('@strapi/design-system/Button');
const { Grid, GridItem } = require('@strapi/design-system/Grid');
const { ModalBody, ModalFooter } = require('@strapi/design-system/ModalLayout');
const { Tabs, Tab, TabGroup, TabPanels, TabPanel } = require('@strapi/design-system/Tabs');
const { TextInput } = require('@strapi/design-system/TextInput');
const { Typography } = require('@strapi/design-system/Typography');

const { submitUpload, UploadInfo } = require('../../services/strapi');
const Uploaded = require('./uploaded');
const Uploading = require('./uploading');
const { FileInput } = require('../file-input');
const { ModalBlocking, ModalHeader } = require('../modal-blocking');

const ModalNewUpload = (props) => {
  const { isOpen, onToggle } = props;

  const [activeTab, setActiveTab] = React.useState(0);
  const [uploadPercent, setUploadPercent] = React.useState();
  const [isComplete, setIsComplete] = React.useState(false);
  const [uploadError, setUploadError] = React.useState();

  const uploadRef = React.useRef();

  const uploadFile = (endpoint, file) => {
    setUploadPercent(0);
    
    uploadRef.current = createUpload({ endpoint, file });
    uploadRef.current.on('error', (err) => setUploadError(err.detail));
    uploadRef.current.on('progress', (progressEvt) => {
      if(isComplete) return;
      setUploadPercent(Math.floor(progressEvt.detail));
    });
    uploadRef.current.on('success', () => {
      setIsComplete(true);
      setUploadPercent(undefined);
    });
  }

  const handleOnReset = () => {
    setActiveTab(0);
    setUploadPercent(undefined);
    setIsComplete(false);
    setUploadError(undefined);
  }

  const generateUploadInfo = (body) => {
    const errors = {};

    if (activeTab === 0) {
      if (!body.from_computer_title) {
        errors.from_computer_title = 'No title specified';  
      }

      if (body.file !== undefined) {
        return {
          origin: 'from_computer',
          title: body.from_computer_title,
          media: body.file
        };
      } else {
        errors.file = 'File needs to be selected';
      }
    }

    else if (activeTab === 1) {
      if (!body.from_url_title) {
        errors.from_url_title = 'No title specified';
      }

      if (body.url !== undefined) {
        return {
          origin: 'from_url',
          title: body.from_url_title,
          media: body.url
        };
      } else {
        errors.url = 'No url specified';
      }
    }

    throw errors;
  };
  
  const handleOnSubmit = async (body, { resetForm, setErrors }) => {
    let uploadInfo;
    try {
      uploadInfo = generateUploadInfo(body);
    } catch (errors) {
      setErrors(errors);

      return;
    }

    let result;
    try {
      result = await submitUpload(uploadInfo);
    } catch(err) {
      switch(typeof err) {
        case 'string': {
          setUploadError(err);
          break;
        }
        case 'object': {
          setUploadError((err).message);
          break;
        }
        default: {
          setUploadError('Unknown error encountered');
          break;
        }
      }

      return;
    }

    const { statusCode, data } = result;

    if(statusCode && statusCode !== 200) {
      return data?.errors;
    } else if(activeTab === 0) {
      uploadFile(result.url, uploadInfo.media[0]);
    } else if(activeTab === 1) {
      setUploadPercent(100);
      setIsComplete(true);
    } else {
      console.log('Unable to resolve upload state');
    }
  };

  const handleOnTabChange = (tabId) => setActiveTab(tabId);

  // const handleOnTitleChange = (e: InputTextOnChange) => setState({ ...state, title: e.target.value });
  // const handleOnFileChange = (e: InputFileOnChange) => {
  //   console.log(e); setState({ ...state, file: e.target.files });
  // }
  // const handleOnUrlChange = (e: InputTextOnChange) => setState({ ...state, url: e.target.value });

  const handleOnModalClose = (forceRefresh = false) => {
    onToggle(forceRefresh);
    handleOnReset();
  };

  const handleOnAbort = () => {
    uploadRef.current?.abort();
    handleOnModalClose();
  };

  const handleOnModalFinish = () => handleOnModalClose(true);

  const renderBody = (
    errors,
    values,
    setFieldValue,
    handleChange
  ) => {
    if (isComplete) {
      return (<Uploaded onReset={handleOnReset} />);
    } else if (uploadPercent !== undefined) {
      return (<Uploading percent={uploadPercent} />);
    } else {
      return (
        <Box background="neutral0">
          <TabGroup label="Upload origin" variant="simple" onTabChange={handleOnTabChange}>
            <Tabs>
              <Tab>= require(computer</Tab>
              <Tab>= require(url</Tab>
            </Tabs>
            <TabPanels>
              <TabPanel>
                <Box padding={1} background="neutral0">
                  <Grid>
                    <GridItem col={6} xs={12} s={12}>
                      <Box paddingTop={2} paddingBottom={2}>
                        <TextInput
                          label="Title"
                          name="from_computer_title"
                          // error={content.length > 5 ? 'Content is too long' : undefined}
                          value={values.from_computer_title}
                          error={errors.from_computer_title}
                          onChange={handleChange}
                        />
                      </Box>
                    </GridItem>
                    <GridItem col={8} xs={12} s={12}>
                      <Box paddingTop={2} paddingBottom={2}>
                        <FileInput
                          name="file"
                          label="File"
                          error={errors.file}
                          required
                          onFiles={(files) => setFieldValue('file', files)}
                        />
                      </Box>
                    </GridItem>
                  </Grid>
                </Box>
              </TabPanel>
              <TabPanel>
                <Box padding={1} background="neutral0">
                  <Grid>
                    <GridItem col={6} xs={12} s={12}>
                      <Box paddingTop={2} paddingBottom={2}>
                        <TextInput
                          label="Title"
                          name="from_url_title"
                          // error={content.length > 5 ? 'Content is too long' : undefined}
                          value={values.from_url_title}
                          error={errors.from_url_title}
                          onChange={handleChange}
                        />
                      </Box>
                    </GridItem>
                    <GridItem col={8} xs={12} s={12}>
                      <Box paddingTop={2} paddingBottom={2}>
                        <TextInput
                          label="Url"
                          name="from_url_url"
                          // error={content.length > 5 ? 'Content is too long' : undefined}
                          value={values.url}
                          error={errors.url}
                          onChange={handleChange}
                        />
                      </Box>
                    </GridItem>
                  </Grid>
                </Box>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </Box>
      );
    }
  };

  const renderFooter = () => {
    if(isComplete) {
      return (
        // <section>
        //   <div />
        //   <Button onClick={handleOnModalFinish} color="primary">Finish</Button>
        // </section>
        <ModalFooter endActions={<Button onClick={handleOnModalFinish}>Finish</Button>} />
      );
    } else if(uploadPercent !== undefined) {
      return (
        // <section>
        //   <Button onClick={handleOnAbort} color="cancel">Cancel</Button>
        // </section>
        <ModalFooter startActions={<Button onClick={handleOnAbort} variant="tertiary">Cancel</Button>} />
      );
    } else {
      return (
        // <section>
        //   <Button onClick={handleOnModalClose} color="cancel">Cancel</Button>
        //   <Button type="submit" color="success">Submit</Button>
        // </section>
        <ModalFooter
          startActions={<Button onClick={handleOnModalClose} variant="tertiary">Cancel</Button>}
          endActions={<Button type="submit">Submit</Button>}
        />
      );
    }
  };

  return (
    <>
      <ModalBlocking isOpen={isOpen}>
        <ModalHeader>
          <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
            New upload
          </Typography>
        </ModalHeader>
          <Formik
            onSubmit={handleOnSubmit}
            initialValues={INITIAL_VALUES}
            validateOnChange={false}
            enableReinitialize
          >
            {({ errors, values, setFieldValue, handleChange }) => {
              return (
                <Form>
                  <ModalBody>
                    {renderBody(errors, values, setFieldValue, handleChange)}
                  </ModalBody>
                  {renderFooter()}
                </Form>
              );
            }}
          </Formik>
      </ModalBlocking>
    </>
  )
}

ModalNewUpload.defaultProps = {
  onToggle: () => { }
};

module.exports = ModalNewUpload;
