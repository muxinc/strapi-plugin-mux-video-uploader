import React from 'react';
import { createUpload, UpChunk } from '@mux/upchunk';
import { FormikErrors, FormikHelpers, useFormik } from 'formik';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { ModalBody, ModalFooter } from '@strapi/design-system/ModalLayout';
import { Tabs, Tab, TabGroup, TabPanels, TabPanel } from '@strapi/design-system/Tabs';
import { TextInput } from '@strapi/design-system/TextInput';
import { Typography } from '@strapi/design-system/Typography';

import { submitUpload, UploadInfo } from '../../services/strapi';
import Uploaded from './uploaded';
import Uploading from './uploading';
import { FileInput } from '../file-input';
import { ModalBlocking, ModalHeader } from '../modal-blocking';

interface FormValues {
  from_computer_title: string;
  from_url_title: string;
  file?: File[];
  url?: string;
}

const INITIAL_VALUES: FormValues = {
  from_computer_title: '',
  from_url_title: '',
  file: undefined,
  url: undefined
};

interface DefaultProps {
  onToggle: (refresh: boolean) => void;
}

interface Props extends DefaultProps{
  isOpen: boolean;
}

const ModalNewUpload = (props:Props) => {
  const { isOpen, onToggle } = props;

  const [activeTab, setActiveTab] = React.useState<number>(0);
  const [uploadPercent, setUploadPercent] = React.useState<number>();
  const [isComplete, setIsComplete] = React.useState<boolean>(false);
  const [uploadError, setUploadError] = React.useState<string>();

  const uploadRef = React.useRef<UpChunk|undefined>();

  const uploadFile = (endpoint: string, file: File) => {
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

  const generateUploadInfo = (body: FormValues): UploadInfo => {
    const errors: FormikErrors<FormValues> = {};

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

      if (body.url) {
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
  
  const handleOnSubmit = async (body: FormValues, { resetForm, setErrors }: FormikHelpers<FormValues>) => {
    let uploadInfo;
    try {
      uploadInfo = generateUploadInfo(body);
    } catch (errors) {
      setErrors(errors as FormikErrors<FormValues>);

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
          setUploadError((err as Error).message);
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
      uploadFile(result.url, uploadInfo.media[0] as File);
    } else if(activeTab === 1) {
      setUploadPercent(100);
      setIsComplete(true);
    } else {
      console.log('Unable to resolve upload state');
    }

    resetForm();
  };

  const handleOnTabChange = (tabId: number) => setActiveTab(tabId);

  const handleOnModalClose = (forceRefresh: boolean = false) => {
    onToggle(forceRefresh);
    handleOnReset();
  };

  const handleOnAbort = () => {
    uploadRef.current?.abort();
    handleOnModalClose();
  };

  const handleOnModalFinish = () => handleOnModalClose(true);

  const renderBody = (
    errors: FormikErrors<FormValues>,
    values: FormValues,
    setFieldValue: (field: string, value: any, shouldValidate?: boolean | undefined) => void,
    handleChange: (e: React.ChangeEvent<any>) => void
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
              <Tab>From computer</Tab>
              <Tab>From url</Tab>
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
                          value={values.from_computer_title}
                          error={errors.from_computer_title}
                          required
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
                          onFiles={(files: File[]) => setFieldValue('file', files)}
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
                          value={values.from_url_title}
                          error={errors.from_url_title}
                          required
                          onChange={handleChange}
                        />
                      </Box>
                    </GridItem>
                    <GridItem col={8} xs={12} s={12}>
                      <Box paddingTop={2} paddingBottom={2}>
                        <TextInput
                          label="Url"
                          name="url"
                          value={values.url}
                          error={errors.url}
                          required
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
        <ModalFooter endActions={<Button onClick={handleOnModalFinish}>Finish</Button>} />
      );
    } else if(uploadPercent !== undefined) {
      return (
        <ModalFooter startActions={<Button onClick={handleOnAbort} variant="tertiary">Cancel</Button>} />
      );
    } else {
      return (
        <ModalFooter
          startActions={<Button onClick={handleOnModalClose} variant="tertiary">Cancel</Button>}
          endActions={<Button type="submit">Submit</Button>}
        />
      );
    }
  };

  const { values, errors, setFieldValue, handleChange, handleSubmit } = useFormik({
    initialValues: INITIAL_VALUES,
    enableReinitialize: true,
    validateOnChange: false,
    onSubmit: handleOnSubmit
  });

  return (
    <>
      <ModalBlocking isOpen={isOpen}>
        <ModalHeader>
          <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
            New upload
          </Typography>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {renderBody(errors, values, setFieldValue, handleChange)}
          </ModalBody>
          {renderFooter()}
        </form>
      </ModalBlocking>
    </>
  )
}

ModalNewUpload.defaultProps = {
  onToggle: () => {}
} as DefaultProps;

export default ModalNewUpload;
