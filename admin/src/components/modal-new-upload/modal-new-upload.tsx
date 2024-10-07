import React from 'react';
import { createUpload, UpChunk } from '@mux/upchunk';
import { useFetchClient } from '@strapi/strapi/admin';
import {
  Accordion,
  Badge,
  Box,
  Button,
  Field,
  Flex,
  Grid,
  Modal,
  MultiSelect,
  MultiSelectOption,
  Radio,
  Tabs,
  TextInput,
  Toggle,
} from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { FormikErrors, FormikHelpers, useFormik } from 'formik';
import { useIntl } from 'react-intl';

import { SUPPORTED_MUX_LANGUAGES, type RequestedUploadData } from '../../../../types/shared-types';
import { getTranslation } from '../../utils/getTranslation';
import usePluginIntl from '../../utils/use-plugin-intl';
import { FileInput } from '../file-input';
import CustomTextTrackForm from './custom-text-track-form';
import { generateUploadInfo, NEW_UPLOAD_INITIAL_VALUES } from './new-upload';
import UploadError from './upload-error';
import Uploaded from './uploaded';
import Uploading from './uploading';
import { PLUGIN_ID } from '../../pluginId';

const ModalNewUpload = ({ isOpen, onToggle = () => {} }: { isOpen: boolean; onToggle: (refresh: boolean) => void }) => {
  const [uploadPercent, setUploadPercent] = React.useState<number>();
  const [isComplete, setIsComplete] = React.useState<boolean>(false);
  const [uploadError, setUploadError] = React.useState<string>();

  const uploadRef = React.useRef<UpChunk | undefined>();

  const { post } = useFetchClient();
  const { formatMessage } = usePluginIntl();

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

  const handleOnSubmit = async (
    body: RequestedUploadData,
    { resetForm, setErrors }: FormikHelpers<RequestedUploadData>
  ) => {
    let uploadInfo: RequestedUploadData;
    try {
      uploadInfo = generateUploadInfo({ body, formatMessage });
    } catch (errors) {
      setErrors(errors as FormikErrors<RequestedUploadData>);
      return;
    }

    const url = `${PLUGIN_ID}/${uploadInfo.upload_type === 'url' ? 'submitRemoteUpload' : 'submitDirectUpload'}`;

    const result = await post(url, uploadInfo).catch((error) => {
      console.log({ error });
      switch (typeof error) {
        case 'string': {
          setUploadError(error);
          break;
        }
        case 'object': {
          setUploadError((error as Error).message);
          break;
        }
        default: {
          setUploadError(formatMessage('ModalNewUpload.unknown-error', 'Unknown error encountered'));

          break;
        }
      }

      return undefined;
    });

    if (!result) return;

    const { status, data } = result;

    if ((status && status !== 200) || data?.errors) {
      return data?.errors;
    } else if (uploadInfo.upload_type === 'file') {
      if (!data.url) return setUploadError(formatMessage('ModalNewUpload.unknown-error', 'No upload URL returned'));

      uploadFile(data.url, uploadInfo.file);
    } else if (uploadInfo.upload_type === 'url') {
      setUploadPercent(100);
      setIsComplete(true);
    } else {
      console.log(formatMessage('ModalNewUpload.unresolvable-upload-state', 'Unable to resolve upload state'));
    }

    resetForm();
  };

  const handleOnModalClose = (forceRefresh: boolean = false) => {
    onToggle(forceRefresh);
    handleOnReset();
  };

  const handleOnAbort = () => {
    uploadRef.current?.abort();
    handleOnModalClose();
  };

  const handleOnModalFinish = () => handleOnModalClose(true);

  const renderFooter = () => {
    if (uploadError || isComplete) {
      return (
        <Modal.Footer>
          <Button variant="secondary" startIcon={<Plus />} onClick={handleOnReset}>
            {formatMessage('Uploaded.upload-another-button', 'Upload another asset')}
          </Button>
          <Button onClick={handleOnModalFinish}>{formatMessage('Common.finish-button', 'Finish')}</Button>
        </Modal.Footer>
      );
    }

    if (uploadPercent !== undefined) {
      return (
        <Modal.Footer>
          <Button onClick={handleOnAbort} variant="tertiary">
            {formatMessage('Common.cancel-button', 'Cancel')}
          </Button>
        </Modal.Footer>
      );
    }

    return (
      <Modal.Footer>
        <Button onClick={() => handleOnModalClose()} variant="tertiary">
          {formatMessage('Common.cancel-button', 'Cancel')}
        </Button>
        <Button onClick={handleSubmit}>{formatMessage('Common.save-button', 'Save')}</Button>
      </Modal.Footer>
    );
  };

  const { values, errors, resetForm, setFieldValue, handleChange, handleSubmit } = useFormik({
    initialValues: NEW_UPLOAD_INITIAL_VALUES,
    enableReinitialize: true,
    validateOnChange: false,
    onSubmit: handleOnSubmit,
  });

  const handleOnReset = () => {
    setUploadPercent(undefined);
    setIsComplete(false);
    setUploadError(undefined);
    resetForm();
  };

  const handleOnOpenChange = (open: boolean) => {
    if (open) return;

    handleOnModalClose();
  };

  if (!isOpen) return null;

  return (
    <form>
      <Modal.Root open={isOpen} onOpenChange={handleOnOpenChange}>
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>{formatMessage('ModalNewUpload.header', 'New upload')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <FormBody
              errors={errors}
              values={values}
              setFieldValue={setFieldValue}
              handleChange={handleChange}
              isComplete={isComplete}
              uploadError={uploadError}
              uploadPercent={uploadPercent}
            />
          </Modal.Body>
          {renderFooter()}
        </Modal.Content>
      </Modal.Root>
    </form>
  );
};

export default ModalNewUpload;

function FormBody(props: {
  errors: FormikErrors<RequestedUploadData>;
  values: RequestedUploadData;
  setFieldValue: <Field extends keyof RequestedUploadData>(
    field: Field,
    value: RequestedUploadData[Field],
    shouldValidate?: boolean | undefined
  ) => void;
  handleChange: (e: React.ChangeEvent<any>) => void;
  uploadError?: string;
  isComplete: boolean;
  uploadPercent?: number;
}) {
  const { errors, values, setFieldValue, handleChange } = props;
  const { formatMessage } = useIntl();

  const handleAutogeneratedCaptionsLanguagesChange = (vals: string[]) => {
    const languages: any[] = [];

    vals.forEach((value) => {
      const language = SUPPORTED_MUX_LANGUAGES.find((lang) => lang.code === value);

      language && languages.push(language);
    });

    setFieldValue('autogenerated_captions_languages', languages);
  };

  if (props.uploadError) {
    return <UploadError message={props.uploadError} />;
  }

  if (props.isComplete) {
    return <Uploaded />;
  }

  if (props.uploadPercent !== undefined) {
    return <Uploading percent={props.uploadPercent} />;
  }

  return (
    <Box padding={1} background="neutral0">
      <FieldWrapper>
        <Field.Root error={errors.title}>
          <Field.Label>
            {formatMessage({
              id: getTranslation('Common.title-label'),
              defaultMessage: 'Title',
            })}
          </Field.Label>
          <TextInput
            name="title"
            value={values.title}
            hasError={errors.title !== undefined}
            required
            onChange={handleChange}
          />
          <Field.Error />
          <Field.Hint />
        </Field.Root>
      </FieldWrapper>

      <Field.Root>
        <Field.Label>
          {formatMessage({
            id: getTranslation('Common.upload_type_label-label'),
            defaultMessage: 'Upload via',
          })}
        </Field.Label>
        <Tabs.Root id="upload_type" defaultValue="file" variant="simple">
          <Tabs.List aria-label="Manage your attribute">
            <Tabs.Trigger value="file" onClick={() => setFieldValue('upload_type', 'file')}>
              File
            </Tabs.Trigger>
            <Tabs.Trigger value="url" onClick={() => setFieldValue('upload_type', 'url')}>
              URL
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="file">
            <FieldWrapper>
              <FileInput
                name="file"
                label={formatMessage({
                  id: getTranslation('Common.file-label'),
                  defaultMessage: 'File',
                })}
                inputProps={{
                  accept: 'video/*,audio/*',
                }}
                // @ts-expect-error
                error={'file' in errors ? errors.file : undefined}
                required
                onFiles={(files: File[]) =>
                  setFieldValue(
                    // @ts-expect-error
                    'file',
                    files[0]
                  )
                }
              />
            </FieldWrapper>
          </Tabs.Content>
          <Tabs.Content value="url">
            <FieldWrapper>
              <Field.Root>
                <Field.Label>
                  {formatMessage({
                    id: getTranslation('Common.url-label'),
                    defaultMessage: 'Url',
                  })}
                </Field.Label>
              </Field.Root>
              <TextInput
                name="url"
                value={'url' in values ? values.url : ''}
                hasError={'url' in errors ? true : false}
                required
                onChange={handleChange}
              />
            </FieldWrapper>
          </Tabs.Content>
        </Tabs.Root>
      </Field.Root>

      <Accordion.Root>
        <Accordion.Item value="acc-01">
          <Accordion.Header>
            <Accordion.Trigger>
              {formatMessage({
                id: getTranslation('ModalNewUpload.section_encoding_settings-label'),
                defaultMessage: 'Encoding settings',
              })}
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>
            <Grid.Root gap={4}>
              <Grid.Item col={6} s={12} direction="column" alignItems="start">
                <Box padding={4} width="100%">
                  <Field.Root>
                    <Field.Label>
                      {formatMessage({
                        id: getTranslation('Common.video_quality-label'),
                        defaultMessage: 'Video quality',
                      })}
                    </Field.Label>
                    <Radio.Group
                      onValueChange={(value: any) => setFieldValue('video_quality', value)}
                      value={values.video_quality}
                    >
                      <Radio.Item value="basic">
                        {formatMessage({
                          id: getTranslation('Common.video_quality_basic-label'),
                          defaultMessage: 'Basic',
                        })}
                      </Radio.Item>
                      <Radio.Item value="plus">
                        {formatMessage({
                          id: getTranslation('Common.video_quality_plus-label'),
                          defaultMessage: 'Plus',
                        })}
                      </Radio.Item>
                    </Radio.Group>
                  </Field.Root>
                </Box>
              </Grid.Item>
              <Grid.Item col={6} s={12} direction="column" alignItems="start">
                <Box padding={4} width="100%">
                  <Field.Root>
                    <Field.Label>
                      {formatMessage({
                        id: getTranslation('Common.max_resolution_tier-label'),
                        defaultMessage: 'Maximum stream resolution',
                      })}
                    </Field.Label>
                    <Radio.Group
                      aria-labelledby="max_resolution_tier_label"
                      onValueChange={(value: any) => setFieldValue('max_resolution_tier', value)}
                      value={values.max_resolution_tier}
                      style={{ marginTop: '0.5rem' }}
                      disabled={values.video_quality === 'basic'}
                    >
                      <Radio.Item value="2160p">2160p (4k)</Radio.Item>
                      <Radio.Item value="1440p">1440p (2k)</Radio.Item>
                      <Radio.Item value="1080p">1080p</Radio.Item>
                    </Radio.Group>
                  </Field.Root>
                </Box>
              </Grid.Item>
            </Grid.Root>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="acc-02">
          <Accordion.Header>
            <Accordion.Trigger>
              {formatMessage({
                id: getTranslation('ModalNewUpload.section_delivery_settings-label'),
                defaultMessage: 'Delivery settings',
              })}
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>
            <Grid.Root gap={4}>
              <Grid.Item col={6} s={12} direction="column" alignItems="start">
                <Box padding={4} width="100%">
                  <Field.Root>
                    <Field.Label>
                      {formatMessage({
                        id: getTranslation('Common.signed-label'),
                        defaultMessage: 'Signed Playback URL',
                      })}
                    </Field.Label>
                    <Toggle
                      name="Private"
                      value={values.signed ? 'on' : 'off'}
                      onLabel="on"
                      offLabel="off"
                      checked={values.signed}
                      onChange={(e: any) => {
                        setFieldValue('signed', e.target.checked);
                      }}
                    />
                  </Field.Root>
                </Box>
              </Grid.Item>
              <Grid.Item col={6} s={12} direction="column" alignItems="start">
                <Box padding={4} width="100%">
                  <Field.Root>
                    <Field.Label>
                      {formatMessage({
                        id: getTranslation('Common.mp4_support-label'),
                        defaultMessage: 'Allow downloading via MP4',
                      })}
                    </Field.Label>
                    <Toggle
                      name="mp4_support"
                      value={values.mp4_support}
                      onLabel="on"
                      offLabel="off"
                      checked={values.mp4_support === 'standard'}
                      disabled={values.video_quality === 'basic'}
                      onChange={(e: any) => {
                        setFieldValue(
                          'mp4_support',
                          (e.target.checked ? 'standard' : 'none') as typeof values.mp4_support
                        );
                      }}
                    />
                  </Field.Root>
                </Box>
              </Grid.Item>
            </Grid.Root>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="acc-03">
          <Accordion.Header>
            <Accordion.Trigger>
              {formatMessage({
                id: getTranslation('ModalNewUpload.section_additional_settings-label'),
                defaultMessage: 'Additional settings',
              })}
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>
            <Box padding={4} width="100%">
              <Tabs.Root defaultValue="autogenerated">
                <Tabs.List aria-label="Manage your attribute">
                  <Tabs.Trigger value="autogenerated">
                    <Flex justifyContent="center">
                      <Box>
                        {formatMessage({
                          id: getTranslation('ModalNewUpload.tab_captions_autogenerated-label'),
                          defaultMessage: 'Auto-generated',
                        })}
                      </Box>
                      {values.autogenerated_captions_languages &&
                        values.autogenerated_captions_languages.length > 0 && (
                          <Box marginLeft={4}>
                            <Badge backgroundColor="primary600" textColor="neutral1000">
                              {values.autogenerated_captions_languages.length}
                            </Badge>
                          </Box>
                        )}
                    </Flex>
                  </Tabs.Trigger>
                  <Tabs.Trigger value="custom">
                    <Flex justifyContent="center">
                      <Box>
                        {formatMessage({
                          id: getTranslation('ModalNewUpload.tab_captions_custom-label'),
                          defaultMessage: 'Custom',
                        })}
                      </Box>
                      {values.custom_text_tracks && values.custom_text_tracks.length > 0 && (
                        <Box marginLeft={4}>
                          <Badge backgroundColor="primary600" textColor="neutral1000">
                            {values.custom_text_tracks.length}
                          </Badge>
                        </Box>
                      )}
                    </Flex>
                  </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="autogenerated">
                  <Grid.Root gap={4}>
                    <Grid.Item col={12} direction="column" alignItems="start">
                      <Box width="100%" paddingTop={4}>
                        <Field.Root>
                          <Field.Label>
                            {formatMessage({
                              id: getTranslation('ModalNewUpload.autogenerated_languages-label'),
                              defaultMessage: 'Languages',
                            })}
                          </Field.Label>
                          <MultiSelect
                            name="autogenerated_captions_languages"
                            hasError={errors.autogenerated_captions_languages}
                            value={values.autogenerated_captions_languages?.map((lang) => lang.code)}
                            onChange={handleAutogeneratedCaptionsLanguagesChange}
                            withTags={true}
                          >
                            {SUPPORTED_MUX_LANGUAGES.map((language) => (
                              <MultiSelectOption key={language.code} value={language.code}>
                                {language.label}
                              </MultiSelectOption>
                            ))}
                          </MultiSelect>
                        </Field.Root>
                      </Box>
                    </Grid.Item>
                  </Grid.Root>
                </Tabs.Content>
                <Tabs.Content value="custom">
                  <Box width="100%" paddingTop={4}>
                    <CustomTextTrackForm
                      custom_text_tracks={values.custom_text_tracks || []}
                      modifyCustomTextTracks={(tracks) => setFieldValue('custom_text_tracks', tracks as any)}
                    />
                  </Box>
                </Tabs.Content>
              </Tabs.Root>
            </Box>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </Box>
  );
}

function FieldWrapper(props: React.PropsWithChildren) {
  return (
    <Box paddingTop={4} paddingBottom={4}>
      {props.children}
    </Box>
  );
}
