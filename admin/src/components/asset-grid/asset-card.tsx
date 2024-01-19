import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import ExclamationMarkCircle from '@strapi/icons/ExclamationMarkCircle';
import Lock from '@strapi/icons/Lock';
import Earth from '@strapi/icons/Earth';
import { Box } from '@strapi/design-system/Box';
import { Tooltip } from '@strapi/design-system';
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

import { getThumbnail } from '../../services/strapi';
import { getPlaybackToken } from '../../services/strapi';
import getTrad from '../../utils/getTrad';
import { secondsToFormattedString } from '../../utils/date-time';
import { MuxAsset } from '../../../../server/content-types/mux-asset/types';

const BoxStyled = styled(Box)`
  cursor: pointer;

  svg {
    display: flex;
    align-items: center;
    justify-content: center;
  }
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
  onClick: (muxAsset: MuxAsset) => void;
}
interface Props extends DefaultProps {
  muxAsset: MuxAsset;
}

const AssetCard = (props: Props) => {
  const { muxAsset, onClick } = props;

  const [thumbnailImageUrl, setThumbnailImageUrl] = useState<string>('');

  const { formatMessage, formatDate } = useIntl();

  const isLoading = muxAsset.asset_id === null;

  useEffect(() => {
    if (muxAsset.playback_id !== null && muxAsset.signed) {
      getPlaybackToken(muxAsset.playback_id, 'thumbnail')
        .then((data) => getThumbnail(muxAsset.playback_id, data.token))
        .then((image) => setThumbnailImageUrl(image as string));
    } else if (muxAsset.playback_id !== null) {
      setThumbnailImageUrl(getThumbnail(muxAsset.playback_id) as string);
    } else {
      setThumbnailImageUrl(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      );
    }
  }, []);

  const renderCardAssetStatus = React.useCallback(() => {
    if (muxAsset.error_message !== null) {
      return <Icon color="danger500" as={ExclamationMarkCircle} />;
    } else if (isLoading) {
      return <Loader small>{formatMessage({ id: getTrad('AssetCard.loading'), defaultMessage: 'Loading' })}</Loader>;
    }
  }, [muxAsset]);

  const handleOnClick = () => {
    onClick(muxAsset);
  };

  const loadingTitle =
    isLoading &&
    formatMessage({
      id: getTrad('AssetCard.is-loading'),
      defaultMessage: 'Asset is being processed',
    });

  const errorTitle =
    isLoading &&
    formatMessage({
      id: getTrad('AssetCard.is-error'),
      defaultMessage: 'Asset encountered an error',
    });

  const aspect_ratio = muxAsset.aspect_ratio || muxAsset.asset_data?.aspect_ratio;
  const statusLabel = (() => {
    if (aspect_ratio) return aspect_ratio;

    if (muxAsset.isReady)
      return formatMessage({
        id: getTrad('AssetCard.no-aspect-ratio'),
        defaultMessage: 'No aspect ratio',
      });

    if (muxAsset.error_message !== null)
      return formatMessage({
        id: getTrad('AssetCard.processing-error'),
        defaultMessage: 'Error',
      });

    return formatMessage({
      id: getTrad('AssetCard.processing-pending'),
      defaultMessage: 'Processing',
    });
  })();

  return (
    <BoxStyled onClick={handleOnClick} title={errorTitle || loadingTitle || undefined}>
      <Card>
        <CardHeader>
          <CardAsset src={thumbnailImageUrl}>{renderCardAssetStatus()}</CardAsset>
          {muxAsset.duration && <CardTimer>{secondsToFormattedString(muxAsset.duration)}</CardTimer>}
        </CardHeader>
        <CardBody>
          <CardContent>
            <CardTitleStyled title={muxAsset.title}>{muxAsset.title}</CardTitleStyled>
            <CardSubtitle>
              {muxAsset.createdAt ? formatDate(muxAsset.createdAt) : null} - {statusLabel}
            </CardSubtitle>
          </CardContent>
          <CardBadge>
            <Tooltip description={muxAsset.signed ? 'Private Playback' : 'Public Playback'}>
              <Icon as={muxAsset.signed ? Lock : Earth} />
            </Tooltip>
          </CardBadge>
          {/* <CardBadge>Video | Audio</CardBadge> */}
        </CardBody>
      </Card>
    </BoxStyled>
  );
};

AssetCard.defaultProps = {
  onClick: () => {},
} as DefaultProps;

export default AssetCard;
