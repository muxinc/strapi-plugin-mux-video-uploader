import React from 'react';
import { useIntl } from 'react-intl';
import { createUpload, UpChunk } from '@mux/upchunk';
import { FormikErrors, FormikHelpers, useFormik } from 'formik';
import Cross from '@strapi/icons/Cross';
import Plus from '@strapi/icons/Plus';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { Divider } from '@strapi/design-system/Divider';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { IconButton } from '@strapi/design-system/IconButton';
import { ModalBody, ModalFooter } from '@strapi/design-system/ModalLayout';
import { Tabs, Tab, TabGroup, TabPanels, TabPanel } from '@strapi/design-system/Tabs';
import { TextInput } from '@strapi/design-system/TextInput';
import { Typography } from '@strapi/design-system/Typography';
import { ToggleInput } from '@strapi/design-system/ToggleInput';

import { submitUpload, UploadInfo } from '../../services/strapi';
import Uploaded from './uploaded';
import Uploading from './uploading';
import { FileInput } from '../file-input';
import { ModalBlocking, ModalHeader } from '../modal-blocking';
import getTrad from '../../utils/getTrad';
import UploadError from './upload-error';

interface FormValues {
  from_computer_title: string;
  from_url_title: string;
  file?: File[];
  url?: string;
  signed: boolean;
}

const INITIAL_VALUES: FormValues = {
  from_computer_title: '',
  from_url_title: '',
  file: undefined,
  url: undefined,
  signed: false,
};

interface DefaultProps {
  onToggle: (refresh: boolean) => void;
}

interface Props extends DefaultProps {
  isOpen: boolean;
}

const ModalNewUpload = (props: Props) => {
  const { isOpen, onToggle } = props;

  const [activeTab, setActiveTab] = React.useState<number>(0);
  const [uploadPercent, setUploadPercent] = React.useState<number>();
  const [isComplete, setIsComplete] = React.useState<boolean>(false);
  const [isSigned, setIsSigned] = React.useState<boolean>(false);
  const [uploadError, setUploadError] = React.useState<string>();

  const uploadRef = React.useRef<UpChunk | undefined>();

  const { formatMessage } = useIntl();

  const uploadFile = (endpoint: string, file: File) => {
    setUploadPercent(0);

    uploadRef.current = createUpload({ endpoint, file });
    uploadRef.current.on('error', (err) => setUploadError(err.detail));
    uploadRef.current.on('progress', (progressEvt) => {
      if (isComplete) return;
      setUploadPercent(Math.floor(progressEvt.detail));
    });
    uploadRef.current.on('success', () => {
      setIsComplete(true);
      setUploadPercent(undefined);
    });
  };

  const generateUploadInfo = (body: FormValues): UploadInfo => {
    const errors: FormikErrors<FormValues> = {};

    let uploadInfo: UploadInfo | undefined;

    if (activeTab === 0) {
      if (!body.from_computer_title) {
        errors.from_computer_title = formatMessage({
          id: getTrad('Common.title-required'),
          defaultMessage: 'No title specified',
        });
      } else if (body.from_computer_title.length < 3) {
        errors.from_computer_title = formatMessage({
          id: getTrad('Common.title-length'),
          defaultMessage: 'Needs to be at least 3 letters',
        });
      }

      if (body.file !== undefined) {
        uploadInfo = {
          origin: 'from_computer',
          title: body.from_computer_title,
          media: body.file,
          signed: body.signed,
        };
      } else {
        errors.file = formatMessage({
          id: getTrad('Common.file-required'),
          defaultMessage: 'File needs to be selected',
        });
      }
    } else if (activeTab === 1) {
      if (!body.from_url_title) {
        errors.from_url_title = formatMessage({
          id: getTrad('Common.title-required'),
          defaultMessage: 'No title specified',
        });
      } else if (body.from_url_title.length < 3) {
        errors.from_url_title = formatMessage({
          id: getTrad('Common.title-length'),
          defaultMessage: 'Needs to be at least 3 letters',
        });
      }

      if (body.url) {
        uploadInfo = {
          origin: 'from_url',
          title: body.from_url_title,
          media: body.url,
          signed: body.signed,
        };
      } else {
        errors.url = formatMessage({
          id: getTrad('Common.url-required'),
          defaultMessage: 'No url specified',
        });
      }
    }

    if (Object.entries(errors).length > 0) {
      throw errors;
    }

    return uploadInfo!;
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
    } catch (err) {
      switch (typeof err) {
        case 'string': {
          setUploadError(err);
          break;
        }
        case 'object': {
          setUploadError((err as Error).message);
          break;
        }
        default: {
          setUploadError(
            formatMessage({
              id: getTrad('ModalNewUpload.unknown-error'),
              defaultMessage: 'Unknown error encountered',
            })
          );

          break;
        }
      }

      return;
    }

    const { statusCode, data } = result;

    if (statusCode && statusCode !== 200) {
      return data?.errors;
    } else if (activeTab === 0) {
      uploadFile(result.url, uploadInfo.media[0] as File);
    } else if (activeTab === 1) {
      setUploadPercent(100);
      setIsComplete(true);
    } else {
      console.log(
        formatMessage({
          id: getTrad('ModalNewUpload.unresolvable-upload-state'),
          defaultMessage: 'Unable to resolve upload state',
        })
      );
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
    if (uploadError) {
      return <UploadError message={uploadError} />;
    } else if (isComplete) {
      return <Uploaded />;
    } else if (uploadPercent !== undefined) {
      return <Uploading percent={uploadPercent} />;
    } else {
      return (
        <Box background="neutral0">
          <TabGroup label="Upload origin" variant="simple" onTabChange={handleOnTabChange}>
            <Tabs>
              <Tab>
                {formatMessage({
                  id: getTrad('ModalNewUpload.from-computer-tab-label'),
                  defaultMessage: 'From computer',
                })}
              </Tab>
              <Tab>
                {formatMessage({
                  id: getTrad('ModalNewUpload.from-url-tab-label'),
                  defaultMessage: 'From url',
                })}
              </Tab>
            </Tabs>
            <Divider />
            <TabPanels>
              <TabPanel>
                <Box padding={1} background="neutral0">
                  <Grid>
                    <GridItem col={6} xs={12} s={12}>
                      <Box paddingTop={2} paddingBottom={2}>
                        <TextInput
                          label={formatMessage({
                            id: getTrad('Common.title-label'),
                            defaultMessage: 'Title',
                          })}
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
                        <ToggleInput
                          label={formatMessage({
                            id: getTrad('Common.signed-label'),
                            defaultMessage: 'Signed Playback URL',
                          })}
                          name="Private"
                          value={values.signed}
                          onLabel="on"
                          offLabel="off"
                          checked={isSigned}
                          onChange={(e: any) => {
                            setIsSigned(e.target.checked);
                            setFieldValue('signed', e.target.checked);
                          }}
                        />
                      </Box>
                    </GridItem>
                    <GridItem col={8} xs={12} s={12}>
                      <Box paddingTop={2} paddingBottom={2}>
                        <FileInput
                          name="file"
                          label={formatMessage({
                            id: getTrad('Common.file-label'),
                            defaultMessage: 'File',
                          })}
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
                          label={formatMessage({
                            id: getTrad('Common.title-label'),
                            defaultMessage: 'Title',
                          })}
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
                        <ToggleInput
                          label={formatMessage({
                            id: getTrad('Common.signed-label'),
                            defaultMessage: 'Signed Playback URL',
                          })}
                          name="Private"
                          value={values.signed}
                          onLabel="on"
                          offLabel="off"
                          checked={isSigned}
                          onChange={(e: any) => {
                            setIsSigned(e.target.checked);
                            setFieldValue('signed', e.target.checked);
                          }}
                        />
                      </Box>
                    </GridItem>
                    <GridItem col={8} xs={12} s={12}>
                      <Box paddingTop={2} paddingBottom={2}>
                        <TextInput
                          label={formatMessage({
                            id: getTrad('Common.url-label'),
                            defaultMessage: 'Url',
                          })}
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
    if (uploadError || isComplete) {
      return (
        <ModalFooter
          endActions={
            <>
              <Button variant="secondary" startIcon={<Plus />} onClick={handleOnReset}>
                {formatMessage({
                  id: getTrad('Uploaded.upload-another-button'),
                  defaultMessage: 'Upload another asset',
                })}
              </Button>
              <Button onClick={handleOnModalFinish}>
                {formatMessage({
                  id: getTrad('Common.finish-button'),
                  defaultMessage: 'Finish',
                })}
              </Button>
            </>
          }
        />
      );
    } else if (uploadPercent !== undefined) {
      return (
        <ModalFooter
          startActions={
            <Button onClick={handleOnAbort} variant="tertiary">
              {formatMessage({
                id: getTrad('Common.cancel-button'),
                defaultMessage: 'Cancel',
              })}
            </Button>
          }
        />
      );
    } else {
      return (
        <ModalFooter
          startActions={
            <Button onClick={handleOnModalClose} variant="tertiary">
              {formatMessage({
                id: getTrad('Common.cancel-button'),
                defaultMessage: 'Cancel',
              })}
            </Button>
          }
          endActions={
            <Button type="submit">
              {formatMessage({
                id: getTrad('Common.save-button'),
                defaultMessage: 'Save',
              })}
            </Button>
          }
        />
      );
    }
  };

  const { values, errors, resetForm, setFieldValue, handleChange, handleSubmit } = useFormik({
    initialValues: INITIAL_VALUES,
    enableReinitialize: true,
    validateOnChange: false,
    onSubmit: handleOnSubmit,
  });

  const handleOnReset = () => {
    setActiveTab(0);
    setUploadPercent(undefined);
    setIsComplete(false);
    setUploadError(undefined);
    resetForm();
  };

  return (
    <>
      <ModalBlocking isOpen={isOpen}>
        <ModalHeader>
          <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
            {formatMessage({
              id: getTrad('ModalNewUpload.header'),
              defaultMessage: 'New upload',
            })}
          </Typography>
          <IconButton
            onClick={handleOnModalClose}
            aria-label={formatMessage({ id: getTrad('ModalNewUpload.close-modal'), defaultMessage: 'Close modal' })}
            icon={<Cross />}
          />
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>{renderBody(errors, values, setFieldValue, handleChange)}</ModalBody>
          {renderFooter()}
        </form>
      </ModalBlocking>
    </>
  );
};

ModalNewUpload.defaultProps = {
  onToggle: () => {},
} as DefaultProps;

export default ModalNewUpload;
