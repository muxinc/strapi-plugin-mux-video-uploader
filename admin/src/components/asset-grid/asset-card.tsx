import React from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { Box } from '@strapi/design-system/Box';
import { Loader } from '@strapi/design-system/Loader';
import { Typography } from '@strapi/design-system/Typography';

import { MuxAsset } from '../../../../types';
import errorIcon from './../../static/error-icon.svg';
import { getThumbnail } from '../../services/strapi';
import getTrad from '../../utils/getTrad';

const BoxStyled = styled(Box)`
  cursor: pointer;
`;

const BackdropContainerStyled = styled.div`
  position: relative;
`;

const TypographyEllipsis = styled(Typography)`
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

interface BackdropProps {
  imageUrl?: string;
}

const BackdropStyled = styled.div<BackdropProps>`
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

interface DefaultProps {
  onClick: (muxAsset:MuxAsset) => void;
}
interface Props extends DefaultProps {
  muxAsset: MuxAsset;
}

const AssetCard = (props:Props) => {
  const { muxAsset, onClick } = props;

  const { formatMessage } = useIntl();

  const isLoading = muxAsset.asset_id === null;

  const renderStatus = React.useCallback(() => {
    if(muxAsset.error_message !== null) {
      return (<img src={errorIcon} />);
    } else if(isLoading) {
      return (<Loader small color="neutral0">Loading</Loader>);
    }
  }, [muxAsset]);

  const thumbnailImageUrl = muxAsset.playback_id !== null ? 
    // If we have a playback_id, construct a thumbnail url
    getThumbnail(muxAsset.playback_id) :
    // Else, we use a transparent single-pixel png data uri
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  const handleOnClick = () => {
    onClick(muxAsset);
  }

  const loadingTitle = isLoading && formatMessage({
    id: getTrad('AssetCard.is-loading'),
    defaultMessage: 'Asset is being processed'
  });

  const errorTitle = isLoading && formatMessage({
    id: getTrad('AssetCard.is-error'),
    defaultMessage: 'Asset encountered an error'
  });

  return (
    <BoxStyled onClick={handleOnClick} title={errorTitle || loadingTitle || undefined}>
      <BackdropContainerStyled>
        <BackdropStyled imageUrl={thumbnailImageUrl} />
        <LoadingIndicatorContainerStyled>
          {renderStatus()}
        </LoadingIndicatorContainerStyled>
      </BackdropContainerStyled>
      <TypographyEllipsis variant="omega" fontWeight="bold" title={muxAsset.title}>
        {muxAsset.title}
      </TypographyEllipsis>
    </BoxStyled>
  );
};

AssetCard.defaultProps = {
  onClick: () => {}
} as DefaultProps;

export default AssetCard;
