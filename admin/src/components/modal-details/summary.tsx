import { Badge } from '@strapi/design-system';
import { Box } from '@strapi/design-system/Box';
import { Grid, GridItem } from '@strapi/design-system/Grid';
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
      <Stack>
        <Box paddingBottom={4}>
          <Stack>
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
          </Stack>
        </Box>
        <Box paddingBottom={4}>
          <Stack>
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
          </Stack>
        </Box>
        <Box paddingBottom={4}>
          <Stack>
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
          </Stack>
        </Box>
        <Box paddingBottom={4}>
          <Stack>
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
          </Stack>
        </Box>
        <Box paddingBottom={4}>
          <Stack>
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
          </Stack>
        </Box>
        <Box>
          <Grid gap={4}>
            <GridItem col={6} s={12}>
              <Box>
                <Stack>
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
                </Stack>
              </Box>
            </GridItem>
            <GridItem col={6} s={12}>
              <Box>
                <Stack>
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
                </Stack>
              </Box>
            </GridItem>
          </Grid>
        </Box>
      </Stack>
    </Box>
  );
};

export default Summary;
