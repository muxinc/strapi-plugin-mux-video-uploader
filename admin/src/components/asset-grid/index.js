const React = require('react');
const { Box } = require('@strapi/design-system/Box');
const { Grid, GridItem } = require('@strapi/design-system/Grid');

const AssetCard = require('./asset-card');

const AssetGrid = (props) => {
  const { muxAssets, onMuxAssetClick } = props;

  if(muxAssets === undefined) return null;

  const assets = muxAssets.map((muxAsset) =>
    <GridItem col={3} xs={12}>
      <AssetCard muxAsset={muxAsset} onClick={onMuxAssetClick} />
    </GridItem>
  );

  return (
    <Box paddingTop={5}>
      <Grid gap={4}>
        {assets}
      </Grid>
    </Box>
  );
};

AssetGrid.defaultProps = {
  onMuxAssetClick: () => {}
};

export default AssetGrid;
