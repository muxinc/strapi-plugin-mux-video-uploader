import {
  Button,
  Card,
  CardBody,
  CardContent,
  Checkbox,
  Combobox,
  ComboboxOption,
  Field,
  Flex,
} from '@strapi/design-system';
import { Download, Pencil, Plus, Trash } from '@strapi/icons';
import LanguagesList, { LanguageCode } from 'iso-639-1';
import React, { ChangeEvent } from 'react';
import { useIntl } from 'react-intl';
import type { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
import { getMuxTextTrackUrl } from '../../../../server/src/utils/text-tracks';
import { ParsedCustomTextTrack, TextTrackFile } from '../../../../types/shared-types';
import { getTranslation } from '../../utils/getTranslation';
import { FileInput } from '../file-input';
import { useSignedTokens } from '../signed-tokens-provider';

function TrackForm({
  track,
  modifyTrack,
  deleteTrack,
  muxAsset,
}: {
  track: Partial<ParsedCustomTextTrack>;
  modifyTrack: (newValues: Partial<ParsedCustomTextTrack>) => void;
  deleteTrack: () => void;
  muxAsset?: MuxAsset;
}) {
  const { video } = useSignedTokens();
  const [editable, setEditable] = React.useState(track.stored_track?.id ? false : true);
  const { formatMessage } = useIntl();

  async function handleFiles(files: File[]) {
    const parsed = await fileToTrackFile(files[0]);
    if (!parsed.success) {
      modifyTrack({ file: undefined });
      return;
    }

    modifyTrack({ file: parsed.data });
  }

  function downloadOnClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    if (!muxAsset?.playback_id || !track.stored_track) return;

    const trackUrl = getMuxTextTrackUrl({
      playback_id: muxAsset.playback_id,
      track: track.stored_track,
      signedToken: video || undefined,
    });

    const anchor = document.createElement('a');
    anchor.setAttribute('href', trackUrl);
    anchor.setAttribute('download', 'true');
    anchor.click();
  }

  return (
    <Card>
      <CardBody>
        <CardContent
          style={{
            display: 'grid',
            gap: '1rem',
            flex: 1,
          }}
        >
          <Flex alignItems="start" gap={2}>
            <div style={{ flex: 1 }}>
              <Field.Root
                hint={formatMessage({
                  id: getTranslation('CustomTextTrackForm.language'),
                  defaultMessage: 'Language',
                })}
              >
                <Field.Label>
                  {formatMessage({
                    id: getTranslation('CustomTextTrackForm.language'),
                    defaultMessage: 'Language',
                  })}
                </Field.Label>
                <Combobox
                  value={track.language_code}
                  onChange={(newValue: LanguageCode) => {
                    modifyTrack({ language_code: newValue, name: LanguagesList.getNativeName(newValue) });
                  }}
                  required
                  disabled={!editable}
                >
                  {LanguagesList.getAllCodes().map((code) => (
                    <ComboboxOption key={code} value={code}>
                      {LanguagesList.getNativeName(code)}
                    </ComboboxOption>
                  ))}
                </Combobox>
                <Field.Error />
                <Field.Hint />
              </Field.Root>
            </div>
            {track.stored_track?.id && muxAsset?.playback_id && (
              <div style={{ paddingTop: '1.5em' }}>
                <Button variant="ghost" startIcon={<Download />} onClick={downloadOnClick}>
                  {formatMessage({
                    id: getTranslation('Common.download-button'),
                    defaultMessage: 'Download',
                  })}
                </Button>
              </div>
            )}
          </Flex>
          {editable && (
            <FileInput
              name="file"
              label={formatMessage({
                id: getTranslation('Common.file-label'),
                defaultMessage: 'Subtitles file (.vtt or .srt)',
              })}
              required
              onFiles={handleFiles}
              inputProps={{
                accept: '.vtt,.srt',
              }}
            />
          )}
          <Checkbox
            value={parseInt(track.closed_captions ? 'yes' : 'no')}
            onChange={(e: any) => {
              modifyTrack({ closed_captions: e.currentTarget.value === 'yes' ? true : false });
            }}
            disabled={!editable}
          >
            {formatMessage({
              id: getTranslation('CustomTextTrackForm.closed-captions'),
              defaultMessage: 'Closed captions',
            })}
          </Checkbox>
          <Flex alignItems="center" justifyContent="between" gap={2}>
            <Button startIcon={<Trash />} onClick={deleteTrack} variant="danger-light">
              {formatMessage({
                id: getTranslation('Common.delete-button'),
                defaultMessage: 'Delete',
              })}
            </Button>
            {!editable && (
              <Button onClick={() => setEditable(true)} startIcon={<Pencil />}>
                {formatMessage({
                  id: getTranslation('Common.update-button'),
                  defaultMessage: 'Update',
                })}
              </Button>
            )}
          </Flex>
        </CardContent>
      </CardBody>
    </Card>
  );
}

export default function CustomTextTrackForm({
  custom_text_tracks,
  modifyCustomTextTracks,
  muxAsset,
}: {
  custom_text_tracks: Partial<ParsedCustomTextTrack>[];
  modifyCustomTextTracks: (newValues: Partial<ParsedCustomTextTrack>[]) => void;
  muxAsset?: MuxAsset;
}) {
  const { formatMessage } = useIntl();

  function handleNew() {
    modifyCustomTextTracks([
      ...(custom_text_tracks || []),
      {
        file: undefined,
        language_code: '',
        name: '',
        closed_captions: false,
      } as any as ParsedCustomTextTrack,
    ]);
  }

  function modifyTrack(index: number) {
    return (newValues: Partial<ParsedCustomTextTrack>) => {
      modifyCustomTextTracks(
        custom_text_tracks?.map((track, i) => {
          if (i === index) {
            return {
              ...track,
              ...newValues,
            };
          }
          return track;
        }) || [newValues]
      );
    };
  }

  function deleteTrack(index: number) {
    return () => {
      modifyCustomTextTracks(custom_text_tracks?.filter((_, i) => i !== index) || []);
    };
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
      }}
    >
      {custom_text_tracks?.map((track, index) => (
        <TrackForm
          key={track.stored_track?.id || `${index}-${track.language_code}`}
          track={track}
          modifyTrack={modifyTrack(index)}
          deleteTrack={deleteTrack(index)}
          muxAsset={muxAsset}
        />
      ))}
      <Button type="button" startIcon={<Plus />} onClick={handleNew} style={{ justifyContent: 'center' }}>
        {formatMessage({
          id: getTranslation('CustomTextTrackForm.new-caption'),
          defaultMessage: 'New caption/subtitle',
        })}
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
