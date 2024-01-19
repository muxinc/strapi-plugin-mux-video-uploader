import { Button, Card, CardBody, CardContent, Checkbox, Combobox, ComboboxOption } from '@strapi/design-system';
import { Plus, Trash } from '@strapi/icons';
import LanguagesList, { LanguageCode } from 'iso-639-1';
import React from 'react';
import { useIntl } from 'react-intl';
import { ParsedCustomTextTrack, TextTrackFile } from '../../../../types/shared-types';
import getTrad from '../../utils/getTrad';
import { FileInput } from '../file-input';
import { NewUploadFormValues } from './newUpload';

function TrackForm({
  track,
  modifyTrack,
  deleteTrack,
}: {
  track: Partial<ParsedCustomTextTrack>;
  modifyTrack: (newValues: Partial<ParsedCustomTextTrack>) => void;
  deleteTrack: () => void;
}) {
  const { formatMessage } = useIntl();

  async function handleFiles(files: File[]) {
    const parsed = await fileToTrackFile(files[0]);
    if (!parsed.success) {
      modifyTrack({ file: undefined });
      return;
    }

    modifyTrack({ file: parsed.data });
  }

  return (
    <Card>
      <CardBody>
        <CardContent>
          <div
            style={{
              display: 'grid',
              gap: '1rem',
            }}
          >
            <Combobox
              placeholder="Language"
              label="Language"
              value={track.language_code}
              onChange={(newValue: LanguageCode) => {
                modifyTrack({ language_code: newValue, name: LanguagesList.getNativeName(newValue) });
              }}
              required
            >
              {LanguagesList.getAllCodes().map((code) => (
                <ComboboxOption key={code} value={code}>
                  {LanguagesList.getNativeName(code)}
                </ComboboxOption>
              ))}
            </Combobox>
            <FileInput
              name="file"
              label={formatMessage({
                id: getTrad('Common.file-label'),
                defaultMessage: 'Subtitles file (.vtt or .srt)',
              })}
              required
              onFiles={handleFiles}
              inputProps={{
                accept: '.vtt,.srt',
              }}
            />
            <Checkbox
              checked={track.closed_captions}
              value={track.closed_captions}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                modifyTrack({ closed_captions: e.currentTarget.checked });
              }}
            >
              Closed captions
            </Checkbox>
            <Button
              startIcon={<Trash />}
              onClick={deleteTrack}
              variant="danger-light"
              style={{ justifySelf: 'flex-start' }}
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </CardBody>
    </Card>
  );
}

export default function CustomTextTrackForm({
  values,
  setFieldValue,
}: {
  values: NewUploadFormValues;
  setFieldValue: <Field extends keyof NewUploadFormValues>(
    field: Field,
    value: NewUploadFormValues[Field],
    shouldValidate?: boolean | undefined
  ) => void;
}) {
  function handleNew() {
    setFieldValue('custom_text_tracks', [
      ...(values.custom_text_tracks || []),
      {
        file: undefined,
        language_code: '',
        name: '',
        closed_captions: false,
      } as any as ParsedCustomTextTrack,
    ]);
  }

  function modifyTrack(index: number) {
    return (newValues: Partial<Partial<ParsedCustomTextTrack>>) => {
      setFieldValue(
        'custom_text_tracks',
        values.custom_text_tracks?.map((track, i) => {
          if (i === index) {
            return {
              ...track,
              ...newValues,
            };
          }
          return track;
        })
      );
    };
  }

  function deleteTrack(index: number) {
    return () => {
      setFieldValue(
        'custom_text_tracks',
        values.custom_text_tracks?.filter((_, i) => i !== index)
      );
    };
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
      }}
    >
      {values.custom_text_tracks?.map((track, index) => (
        <TrackForm
          key={`${index}-${track.name}`}
          track={track}
          modifyTrack={modifyTrack(index)}
          deleteTrack={deleteTrack(index)}
        />
      ))}
      <Button startIcon={<Plus />} onClick={handleNew} style={{ justifyContent: 'center' }}>
        New caption/subtitle
      </Button>
    </div>
  );
}

function getFileTextContents(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsText(file);
  });
}

async function fileToTrackFile(file: File) {
  return TextTrackFile.safeParse({
    name: file.name,
    size: file.size,
    type: file.type,
    contents: await getFileTextContents(file),
  });
}
