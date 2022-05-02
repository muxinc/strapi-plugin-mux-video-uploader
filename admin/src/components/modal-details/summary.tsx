import React from 'react';
import { useIntl } from 'react-intl';
import { Box } from '@strapi/design-system/Box';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { Stack } from '@strapi/design-system/Stack';
import { Typography } from '@strapi/design-system/Typography';

import { MuxAsset } from '../../../../types';
import getTrad from '../../utils/getTrad';
import styled from 'styled-components';

const TypographyWrapped = styled(Typography)`
  overflow-wrap: break-word;
`;

interface Props {
  muxAsset?: MuxAsset;
}

const Summary = (props:Props) => {
  const { muxAsset } = props;

  const { formatMessage, formatDate, formatTime } = useIntl();

  if(muxAsset === undefined) return null;

  const created_date = formatDate(Date.parse(muxAsset.createdAt));
  const created_time = formatTime(Date.parse(muxAsset.createdAt));
  const updated_date = formatDate(Date.parse(muxAsset.updatedAt));
  const updated_time = formatTime(Date.parse(muxAsset.updatedAt));
  
  return (
    <Box padding={3} background="neutral150">
      <Stack>
        <Box paddingBottom={4}>
          <Stack>
            <Typography variant="pi" fontWeight="bold">
              {
                formatMessage({
                  id: getTrad('Summary.assetId'),
                  defaultMessage: 'Asset Id'
                })
              }
            </Typography>
            <TypographyWrapped variant="pi">{muxAsset.asset_id}</TypographyWrapped>
          </Stack>
        </Box>
        <Box paddingBottom={4}>
          <Stack>
            <Typography variant="pi" fontWeight="bold">
              {
                formatMessage({
                  id: getTrad('Summary.uploadId'),
                  defaultMessage: 'Upload Id'
                })
              }
            </Typography>
            <TypographyWrapped variant="pi">{muxAsset.upload_id}</TypographyWrapped>
          </Stack>
        </Box>
        <Box paddingBottom={4}>
          <Stack>
            <Typography variant="pi" fontWeight="bold">
              {
                formatMessage({
                  id: getTrad('Summary.playbackId'),
                  defaultMessage: 'Playback Id'
                })
              }
            </Typography>
            <TypographyWrapped variant="pi">{muxAsset.playback_id}</TypographyWrapped>
          </Stack>
        </Box>
        <Box>
          <Grid gap={4}>
            <GridItem col={6} s={12}>
              <Box>
                <Stack>
                  <Typography variant="pi" fontWeight="bold">
                    {
                      formatMessage({
                        id: getTrad('Summary.created'),
                        defaultMessage: 'Created'
                      })
                    }
                  </Typography>
                  <Typography variant="pi">{created_date} {created_time}</Typography>
                </Stack>
              </Box>
            </GridItem>
            <GridItem col={6} s={12}>
              <Box>
                <Stack>
                  <Typography variant="pi" fontWeight="bold">
                    {
                      formatMessage({
                        id: getTrad('Summary.updated'),
                        defaultMessage: 'Updated'
                      })
                    }
                  </Typography>
                  <Typography variant="pi">{updated_date} {updated_time}</Typography>
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
