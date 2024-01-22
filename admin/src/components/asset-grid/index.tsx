import { Flex, Typography } from '@strapi/design-system';
import { Box } from '@strapi/design-system/Box';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import React from 'react';

import { MuxAsset } from '../../../../server/content-types/mux-asset/types';
import AssetCard from './asset-card';
import getTrad from '../../utils/getTrad';
import { useIntl } from 'react-intl';

interface DefaultProps {
  onMuxAssetClick: (muxAsset: MuxAsset) => void;
}

interface Props extends DefaultProps {
  muxAssets: MuxAsset[] | undefined;
}

const AssetGrid = (props: Props) => {
  const { muxAssets, onMuxAssetClick } = props;
  const { formatMessage } = useIntl();

  if (muxAssets === undefined) return null;

  if (muxAssets.length === 0)
    return (
      <Flex justifyContent="center" padding={5}>
        <Typography variant="omega" textColor="neutral700">
          {formatMessage({
            id: getTrad('HomePage.no-assets'),
            defaultMessage: 'No assets found',
          })}
        </Typography>
      </Flex>
    );

  const assets = muxAssets.map((muxAsset) => (
    <GridItem col={3} xs={12} s={6}>
      <AssetCard muxAsset={muxAsset} onClick={onMuxAssetClick} />
    </GridItem>
  ));

  return (
    <Box paddingTop={6} paddingBottom={8}>
      <Grid gap={4}>{assets}</Grid>
    </Box>
  );
};

AssetGrid.defaultProps = {
  onMuxAssetClick: () => {},
} as DefaultProps;

export default AssetGrid;
