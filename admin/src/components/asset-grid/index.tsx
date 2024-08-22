import React from 'react';
import { Box, Flex, Grid, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';

import { MuxAsset } from '../../../../server/content-types/mux-asset/types';
import AssetCard from './asset-card';
import getTrad from '../../utils/get-trad';

interface DefaultProps {
  onMuxAssetClick: (muxAsset: MuxAsset) => void;
  onInvalidate: () => void;
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
    <Grid.Item col={3} xs={12} s={6}>
      <AssetCard muxAsset={muxAsset} onClick={onMuxAssetClick} />
    </Grid.Item>
  ));

  return (
    <Box paddingTop={6} paddingBottom={8}>
      <Grid.Root gap={4}>{assets}</Grid.Root>
    </Box>
  );
};

AssetGrid.defaultProps = {
  onMuxAssetClick: () => {},
  onInvalidate: () => {}
} as DefaultProps;

export default AssetGrid;
