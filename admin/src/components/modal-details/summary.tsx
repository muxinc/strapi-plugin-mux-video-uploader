import React from 'react';
import { useIntl } from 'react-intl';
import { DateTime } from 'luxon';
import { Box } from '@strapi/design-system/Box';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { Stack } from '@strapi/design-system/Stack';
import { Typography } from '@strapi/design-system/Typography';

import { MuxAsset } from '../../../../types';
import getTrad from '../../utils/getTrad';

interface Props {
  muxAsset?: MuxAsset;
}

const Summary = (props:Props) => {
  const { muxAsset } = props;

  const { formatMessage } = useIntl();

  if(muxAsset === undefined) return null;

  const created = DateTime.fromISO(muxAsset.created_at).toFormat('yyyy-MM-dd HH:mm:ss');
  const updated = DateTime.fromISO(muxAsset.updated_at).toFormat('yyyy-MM-dd HH:mm:ss');

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
            <Typography variant="pi">{muxAsset.asset_id}</Typography>
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
            <Typography variant="pi">{muxAsset.upload_id}</Typography>
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
            <Typography variant="pi">{muxAsset.playback_id}</Typography>
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
                  <Typography variant="pi">{created}</Typography>
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
                  <Typography variant="pi">{updated}</Typography>
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
