import React from 'react';
import { Box, Flex, Grid, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';

import { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
import AssetCard from './asset-card';
import { getTranslation } from '../../utils/getTranslation';

interface Props {
  muxAssets: MuxAsset[] | undefined;
  onMuxAssetClick?: (muxAsset: MuxAsset) => void;
}

const AssetGrid = (props: Props) => {
  const { muxAssets, onMuxAssetClick = () => {} } = props;

  const { formatMessage } = useIntl();

  if (muxAssets === undefined) return null;

  if (muxAssets.length === 0)
    return (
      <Flex justifyContent="center" padding={5}>
        <Typography variant="omega" textColor="neutral700">
          {formatMessage({
            id: getTranslation('HomePage.no-assets'),
            defaultMessage: 'No assets found',
          })}
        </Typography>
      </Flex>
    );

  const assets = muxAssets.map((muxAsset) => (
    <Grid.Item col={3} m={4} xs={12} s={6} key={muxAsset.id}>
      <Box width="100%">
        <AssetCard muxAsset={muxAsset} onClick={onMuxAssetClick} />
      </Box>
    </Grid.Item>
  ));

  return (
    <Box paddingTop={6} paddingBottom={8}>
      <Grid.Root gap={4}>{assets}</Grid.Root>
    </Box>
  );
};

export default AssetGrid;
