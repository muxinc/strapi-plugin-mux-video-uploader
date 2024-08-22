import React from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { useFetchClient } from '@strapi/strapi/admin'
import { Earth, Lock, WarningCircle } from '@strapi/icons';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  CardAsset,
  CardTimer,
  CardContent,
  CardBadge,
  CardTitle,
  CardSubtitle,
  Loader,
  Tooltip
} from '@strapi/design-system';

import getTrad from '../../utils/get-trad';
import { secondsToFormattedString } from '../../utils/date-time';
import { MuxAsset } from '../../../../server/content-types/mux-asset/types';
import pluginId from '../../plugin-id';

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
  onInvalidate: () => void;
}
interface Props extends DefaultProps {
  muxAsset: MuxAsset;
}

const AssetCard = (props: Props) => {
  const { muxAsset, onClick, onInvalidate } = props;

  const [thumbnailImageUrl, setThumbnailImageUrl] = React.useState<string>('');

  const { get } = useFetchClient();
  const { formatMessage, formatDate } = useIntl();

  const isLoading = muxAsset.asset_id === null;

  const init = async (muxAsset:MuxAsset) => {
    const { playback_id } = muxAsset;
    if (muxAsset.playback_id !== null && muxAsset.signed) {
      const { data: sigData } = await get(`${pluginId}/sign/${playback_id}?type=thumbnail`);
      const { data: imageData } = await get(`${pluginId}/thumbnail/${playback_id}?token=${sigData.token}`);
      
      setThumbnailImageUrl(imageData);
    } else if (muxAsset.playback_id !== null) {
      const { data: imageData } = await get(`${pluginId}/thumbnail/${playback_id}`);
      setThumbnailImageUrl(imageData);
    } else {
      setThumbnailImageUrl(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      );
    }
  };

  React.useEffect(() => {
    init(muxAsset);
  }, []);

  const renderCardAssetStatus = React.useCallback(() => {
    if (muxAsset.error_message !== null) {
      return <WarningCircle color="danger500" />;
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
              { muxAsset.signed ? <Lock /> : <Earth />}
            </Tooltip>
          </CardBadge>
        </CardBody>
      </Card>
    </BoxStyled>
  );
};

AssetCard.defaultProps = {
  onClick: () => {},
  onInvalidate: () => {}
} as DefaultProps;

export default AssetCard;
