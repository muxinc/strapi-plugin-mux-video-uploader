import React from 'react';
import styled from 'styled-components';
import { Badge, Box, Grid, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';

import { MuxAsset } from '../../../../server/content-types/mux-asset/types';
import getTrad from '../../utils/get-trad';

const TypographyWrapped = styled(Typography)`
  overflow-wrap: break-word;
`;

interface Props {
  muxAsset?: MuxAsset;
}

const Summary = (props: Props) => {
  const { muxAsset } = props;

  const { formatMessage, formatDate, formatTime } = useIntl();

  if (muxAsset === undefined) return null;

  const created_date = formatDate(Date.parse(muxAsset.createdAt));
  const created_time = formatTime(Date.parse(muxAsset.createdAt));
  const updated_date = formatDate(Date.parse(muxAsset.updatedAt));
  const updated_time = formatTime(Date.parse(muxAsset.updatedAt));

  return (
    <Box padding={4} background="neutral100" hasRadius>
      <Box paddingBottom={4}>
        <Box paddingBottom={1}>
          <Typography variant="sigma" fontWeight="bold" textColor="neutral600" textTransform="uppercase">
            {formatMessage({
              id: getTrad('Common.isReady-label'),
              defaultMessage: 'State',
            })}
          </Typography>
        </Box>
        <TypographyWrapped variant="pi" textColor="neutral700">
          {muxAsset.isReady ? (
            <Badge active>
              {formatMessage({
                id: getTrad('Common.ready'),
                defaultMessage: 'Ready',
              })}
            </Badge>
          ) : (
            <Badge>
              {formatMessage({
                id: getTrad('Common.preparing'),
                defaultMessage: 'Preparing',
              })}
            </Badge>
          )}
        </TypographyWrapped>
      </Box>
      <Box paddingBottom={4}>
        <Box paddingBottom={1}>
          <Typography variant="sigma" fontWeight="bold" textColor="neutral600" textTransform="uppercase">
            {formatMessage({
              id: getTrad('Summary.assetId'),
              defaultMessage: 'Asset Id',
            })}
          </Typography>
        </Box>
        <TypographyWrapped variant="pi" textColor="neutral700">
          {muxAsset.asset_id}
        </TypographyWrapped>
      </Box>
      <Box paddingBottom={4}>
        <Box paddingBottom={1}>
          <Typography variant="sigma" fontWeight="bold" textColor="neutral600" textTransform="uppercase">
            {formatMessage({
              id: getTrad('Summary.uploadId'),
              defaultMessage: 'Upload Id',
            })}
          </Typography>
        </Box>
        <TypographyWrapped variant="pi" textColor="neutral700">
          {muxAsset.upload_id}
        </TypographyWrapped>
      </Box>
      <Box paddingBottom={4}>
        <Box paddingBottom={1}>
          <Typography variant="sigma" fontWeight="bold" textColor="neutral600" textTransform="uppercase">
            {formatMessage({
              id: getTrad('Summary.playbackId'),
              defaultMessage: 'Playback Id',
            })}
          </Typography>
        </Box>
        <TypographyWrapped variant="pi" textColor="neutral700">
          {muxAsset.playback_id}
        </TypographyWrapped>
      </Box>
      <Box paddingBottom={4}>
        <Box paddingBottom={1}>
          <Typography variant="sigma" fontWeight="bold" textColor="neutral600" textTransform="uppercase">
            {formatMessage({
              id: getTrad('Summary.playbackPolicy'),
              defaultMessage: 'Playback Policy',
            })}
          </Typography>
        </Box>
        <TypographyWrapped variant="pi" textColor="neutral700">
          {muxAsset.signed ? 'Signed' : 'Public'}
        </TypographyWrapped>
      </Box>
      <Box>
        <Grid.Root gap={4}>
          <Grid.Item col={6} s={12}>
            <Box>
              <Box paddingBottom={1}>
                <Typography variant="sigma" fontWeight="bold" textColor="neutral600" textTransform="uppercase">
                  {formatMessage({
                    id: getTrad('Summary.created'),
                    defaultMessage: 'Created',
                  })}
                </Typography>
              </Box>
              <Typography variant="pi" textColor="neutral700">
                {created_date} {created_time}
              </Typography>
            </Box>
          </Grid.Item>
          <Grid.Item col={6} s={12}>
            <Box>
              <Box paddingBottom={1}>
                <Typography variant="sigma" fontWeight="bold" textColor="neutral600" textTransform="uppercase">
                  {formatMessage({
                    id: getTrad('Summary.updated'),
                    defaultMessage: 'Updated',
                  })}
                </Typography>
              </Box>
              <Typography variant="pi" textColor="neutral700">
                {updated_date} {updated_time}
              </Typography>
            </Box>
          </Grid.Item>
        </Grid.Root>
      </Box>
    </Box>
  );
};

export default Summary;
