import { TextTrack } from '@mux/mux-node';
import { Badge } from '@strapi/design-system';
import { Box } from '@strapi/design-system/Box';
import { Stack } from '@strapi/design-system/Stack';
import { Typography } from '@strapi/design-system/Typography';
import React from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { MuxAsset } from '../../../../server/content-types/mux-asset/types';
import getTrad from '../../utils/getTrad';

const TypographyWrapped = styled(Typography)`
  overflow-wrap: break-word;
`;

export default function TextTracks({ muxAsset }: { muxAsset: MuxAsset }) {
  const { formatMessage } = useIntl();

  const subtitles = (muxAsset.asset_data?.tracks ?? []).filter(
    (track) => track.type === 'text' && track.text_type === 'subtitles'
  ) as TextTrack[];

  if (!muxAsset || !Array.isArray(subtitles) || subtitles.length === 0) return null;

  return (
    <div>
      <Typography variant="pi" fontWeight="bold">
        {formatMessage({
          id: getTrad('Captions.title'),
          defaultMessage: 'Captions / subtitles',
        })}
      </Typography>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        {subtitles.map((track) => {
          return (
            <Box>
              <Stack>
                <Box paddingBottom={1}>
                  <Typography variant="sigma" fontWeight="bold" textColor="neutral600" textTransform="uppercase">
                    {track.name}
                  </Typography>
                </Box>
                <TypographyWrapped variant="pi" textColor="neutral700">
                  <StatusBadge track={track} />
                </TypographyWrapped>
              </Stack>
            </Box>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ track }: { track: TextTrack }) {
  if (track.status === 'errored') {
    return (
      <Badge backgroundColor="danger100" textColor="danger700">
        Error
      </Badge>
    );
  }

  if (track.status === 'preparing') {
    return <Badge>Preparing</Badge>;
  }

  return <Badge active>Ready</Badge>;
}
