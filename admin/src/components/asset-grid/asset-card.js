const React = require('react');
const styled = require('styled-components');
const { Box } = require('@strapi/design-system/Box');
const { Loader } = require('@strapi/design-system/Loader');
const { Typography } = require('@strapi/design-system/Typography');

const { MuxAsset } = require('../../../../types');
const { generateImageUrl } = require('../../utils/mux');
const errorIcon = require('./../../static/error-icon.svg');

const BoxStyled = styled(Box)`
  cursor: pointer;
`;

const BackdropContainerStyled = styled.div`
  position: relative;
`;

const BackdropStyled = styled.div`
  aspect-ratio: 16 / 9;
  background-color: ${({ theme }) => theme.colors.neutral800};
  background-image: url(${props => props.imageUrl});
  background-repeat: no-repeat;
  background-size: cover;
  margin-bottom: 11px;
`;

const LoadingIndicatorContainerStyled = styled.div`
  position: absolute;
  display: flex;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
`;

const AssetCard = (props) => {
  const { muxAsset, onClick } = props;

  const isLoading = muxAsset.asset_id === null;

  const renderStatus = React.useCallback(() => {
    if(muxAsset.error_message !== null) {
      return (<img src={errorIcon} />);
    } else if(isLoading) {
      return (<Loader small color="neutral0">Loading</Loader>);
    }
  }, [muxAsset]);

  const thumbnailImageUrl = muxAsset.playback_id !== null ? 
    // If we have a playback_id, construct a thumnail url
    generateImageUrl(muxAsset.playback_id) :
    // Else, we use a transparent single-pixel png data uri
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  const handleOnClick = () => { console.log('hi')
    onClick(muxAsset);
  }

  const loadingTitle = isLoading && "Asset is being processed";
  const errorTitle = isLoading && "Asset encountered an error";

  return (
    <BoxStyled onClick={handleOnClick} title={errorTitle || loadingTitle || undefined}>
      <BackdropContainerStyled>
        <BackdropStyled imageUrl={thumbnailImageUrl} />
        <LoadingIndicatorContainerStyled>
          {renderStatus()}
        </LoadingIndicatorContainerStyled>
      </BackdropContainerStyled>
      <Typography variant="omega" fontWeight="bold">{muxAsset.title}</Typography>
    </BoxStyled>
  );
};

AssetCard.defaultProps = {
  onClick: () => {}
};

export default AssetCard;
