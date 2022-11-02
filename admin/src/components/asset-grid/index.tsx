import React from 'react';
import { Box } from '@strapi/design-system/Box';
import { Grid, GridItem } from '@strapi/design-system/Grid';

import AssetCard from './asset-card';
import { MuxAsset } from '../../../../server/content-types/mux-asset/types';

interface DefaultProps {
  onMuxAssetClick: (muxAsset:MuxAsset) => void;
}

interface Props extends DefaultProps {
  muxAssets:  MuxAsset[] | undefined;
}

const AssetGrid = (props:Props) => {
  const { muxAssets, onMuxAssetClick } = props;

  if(muxAssets === undefined) return null;

  const assets = muxAssets.map((muxAsset) =>
    <GridItem col={3} xs={12} s={6}>
      <AssetCard muxAsset={muxAsset} onClick={onMuxAssetClick} />
    </GridItem>
  );

  return (
    <Box paddingTop={6} paddingBottom={8}>
      <Grid gap={4}>
        {assets}
      </Grid>
    </Box>
  );
};

AssetGrid.defaultProps = {
  onMuxAssetClick: () => {}
} as DefaultProps;

export default AssetGrid;
