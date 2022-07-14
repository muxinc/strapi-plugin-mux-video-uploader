import React from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import ExclamationMarkCircle from '@strapi/icons/ExclamationMarkCircle';
import { Box } from '@strapi/design-system/Box';
import {
  Card,
  CardHeader,
  CardBody,
  CardAsset,
  CardTimer,
  CardContent,
  CardBadge,
  CardTitle,
  CardSubtitle,
} from '@strapi/design-system/Card';
import { Icon } from '@strapi/design-system/Icon';
import { Loader } from '@strapi/design-system/Loader';

import { MuxAsset } from '../../../../types';
import errorIcon from './../../static/error-icon.svg';
import { getThumbnail } from '../../services/strapi';
import getTrad from '../../utils/getTrad';
import { secondsToFormattedString } from '../../utils/date-time';

const BoxStyled = styled(Box)`
  cursor: pointer;
`;

const CardTitleStyled = styled(CardTitle)`
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 2.66em;
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

  const renderCardAssetStatus = React.useCallback(() => {
    if (muxAsset.error_message !== null) {
      return (<Icon color="danger500" as={ExclamationMarkCircle} />);
    }
    else if (isLoading) {
      return (<Loader small>Loading</Loader>);
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
      <Card>
        <CardHeader>
          <CardAsset src={thumbnailImageUrl}>
            {renderCardAssetStatus()}
          </CardAsset>
          {muxAsset.duration && (<CardTimer>{secondsToFormattedString(muxAsset.duration)}</CardTimer>)}
        </CardHeader>
        <CardBody>
          <CardContent>
            <CardTitleStyled title={muxAsset.title}>{muxAsset.title}</CardTitleStyled>
            <CardSubtitle>{muxAsset.aspect_ratio ?? 'No aspect ratio'}</CardSubtitle>
          </CardContent>
          {/* <CardBadge>Video | Audio</CardBadge> */}
        </CardBody>
      </Card>
    </BoxStyled>
  );
};

AssetCard.defaultProps = {
  onClick: () => {}
} as DefaultProps;

export default AssetCard;
