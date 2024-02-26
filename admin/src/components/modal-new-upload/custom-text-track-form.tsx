import { Button, Card, CardBody, CardContent, Checkbox, Combobox, ComboboxOption, Flex } from '@strapi/design-system';
import { Pencil, Plus, Trash } from '@strapi/icons';
import LanguagesList, { LanguageCode } from 'iso-639-1';
import React from 'react';
import { useIntl } from 'react-intl';
import type { MuxAsset } from '../../../../server/content-types/mux-asset/types';
import { getMuxTextTrackUrl } from '../../../../server/utils/text-tracks';
import { ParsedCustomTextTrack, TextTrackFile } from '../../../../types/shared-types';
import getTrad from '../../utils/get-trad';
import { useSignedTokens } from '../signed-tokens-provider';
import { FileInput } from '../file-input';

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
            <Flex alignItems="start">
              <Combobox
                placeholder={formatMessage({
                  id: getTrad('CustomTextTrackForm.language'),
                  defaultMessage: 'Language',
                })}
                label={formatMessage({
                  id: getTrad('CustomTextTrackForm.language'),
                  defaultMessage: 'Language',
                })}
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
              {track.stored_track?.id && muxAsset?.playback_id && (
                <a
                  href={getMuxTextTrackUrl({
                    playback_id: muxAsset.playback_id,
                    track: track.stored_track,
                    signedToken: video || undefined,
                  })}
                  download
                >
                  {formatMessage({
                    id: getTrad('Common.download-button'),
                    defaultMessage: 'Download',
                  })}
                </a>
              )}
            </Flex>
            {editable && (
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
            )}
            <Checkbox
              checked={track.closed_captions}
              value={track.closed_captions}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                modifyTrack({ closed_captions: e.currentTarget.checked });
              }}
              disabled={!editable}
            >
              {formatMessage({
                id: getTrad('CustomTextTrackForm.closed-captions'),
                defaultMessage: 'Closed captions',
              })}
            </Checkbox>
            <Flex alignItems="center" justifyContent="between" gap={2}>
              <Button startIcon={<Trash />} onClick={deleteTrack} variant="danger-light">
                {formatMessage({
                  id: getTrad('Common.delete-button'),
                  defaultMessage: 'Delete',
                })}
              </Button>
              {!editable && (
                <Button onClick={() => setEditable(true)} startIcon={<Pencil />}>
                  {formatMessage({
                    id: getTrad('Common.update-button'),
                    defaultMessage: 'Update',
                  })}
                </Button>
              )}
            </Flex>
          </div>
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
      <Button startIcon={<Plus />} onClick={handleNew} style={{ justifyContent: 'center' }}>
        {formatMessage({
          id: getTrad('CustomTextTrackForm.new-caption'),
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
