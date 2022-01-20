const React = require('react');
const { DateTime } = require('luxon');
const { Box } = require('@strapi/design-system/Box');
const { Grid, GridItem } = require('@strapi/design-system/Grid');
const { Stack } = require('@strapi/design-system/Stack');
const { Typography } = require('@strapi/design-system/Typography');

const { MuxAsset } = require('../../../../types');

const Summary = (props) => {
  const { muxAsset } = props;

  if(muxAsset === undefined) return null;

  const created = DateTime.fromISO(muxAsset.created_at).toFormat('yyyy-MM-dd HH:mm:ss');
  const updated = DateTime.fromISO(muxAsset.updated_at).toFormat('yyyy-MM-dd HH:mm:ss');

  return (
    <Box padding={3} background="neutral150">
      <Stack>
        <Box paddingBottom={4}>
          <Stack>
            <Typography variant="pi" fontWeight="bold">Asset Id</Typography>
            <Typography variant="pi">{muxAsset.asset_id}</Typography>
          </Stack>
        </Box>
        <Box paddingBottom={4}>
          <Stack>
            <Typography variant="pi" fontWeight="bold">Upload Id</Typography>
            <Typography variant="pi">{muxAsset.upload_id}</Typography>
          </Stack>
        </Box>
        <Box paddingBottom={4}>
          <Stack>
            <Typography variant="pi" fontWeight="bold">Playback Id</Typography>
            <Typography variant="pi">{muxAsset.playback_id}</Typography>
          </Stack>
        </Box>
        <Box>
          <Grid gap={4}>
            <GridItem col={6} s={12}>
              <Box>
                <Stack>
                  <Typography variant="pi" fontWeight="bold">Created</Typography>
                  <Typography variant="pi">{created}</Typography>
                </Stack>
              </Box>
            </GridItem>
            <GridItem col={6} s={12}>
              <Box>
                <Stack>
                  <Typography variant="pi" fontWeight="bold">Updated</Typography>
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
