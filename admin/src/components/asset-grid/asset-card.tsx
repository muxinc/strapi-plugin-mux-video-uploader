import React from 'react';
import { useIntl } from 'react-intl';
import { Flex } from '@strapi/design-system';
import styled from 'styled-components';
import { useFetchClient } from '@strapi/strapi/admin';
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
} from '@strapi/design-system';

import { getTranslation } from '../../utils/getTranslation';
import { secondsToFormattedString } from '../../utils/date-time';
import { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
import { PLUGIN_ID } from '../../pluginId';

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

interface Props {
  muxAsset: MuxAsset;
  onClick?: (muxAsset: MuxAsset) => void;
}

const AssetCard = (props: Props) => {
  const { muxAsset, onClick = () => {} } = props;

  const [thumbnailImageUrl, setThumbnailImageUrl] = React.useState<string>(
    // Empty pixel
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  );

  const { get } = useFetchClient();
  const { formatMessage, formatDate } = useIntl();

  const isLoading = muxAsset.asset_id === null;

  const init = async (muxAsset: MuxAsset) => {
    const { playback_id } = muxAsset;
    if (muxAsset.playback_id !== null && muxAsset.signed) {
      const { data: sigData } = await get(`/${PLUGIN_ID}/sign/${playback_id}?type=thumbnail`);

      setThumbnailImageUrl(`/${PLUGIN_ID}/thumbnail/${playback_id}?token=${sigData.token}`);
    } else if (muxAsset.playback_id !== null) {
      setThumbnailImageUrl(`/${PLUGIN_ID}/thumbnail/${playback_id}`);
    }
  };

  React.useEffect(() => {
    init(muxAsset);
  }, []);

  const renderCardAssetStatus = React.useCallback(() => {
    if (muxAsset.error_message !== null) {
      return (
        <Flex>
          <WarningCircle color="danger500" />
        </Flex>
      );
    } else if (isLoading || !muxAsset.playback_id) {
      return (
        <Flex>
          <Loader small>{formatMessage({ id: getTranslation('AssetCard.loading'), defaultMessage: 'Loading' })}</Loader>
        </Flex>
      );
    }
  }, [muxAsset]);

  const handleOnClick = () => {
    onClick(muxAsset);
  };

  const loadingTitle =
    isLoading &&
    formatMessage({
      id: getTranslation('AssetCard.is-loading'),
      defaultMessage: 'Asset is being processed',
    });

  const errorTitle =
    isLoading &&
    formatMessage({
      id: getTranslation('AssetCard.is-error'),
      defaultMessage: 'Asset encountered an error',
    });

  const aspect_ratio = muxAsset.aspect_ratio || muxAsset.asset_data?.aspect_ratio;
  const statusLabel = (() => {
    if (aspect_ratio) return aspect_ratio;

    if (muxAsset.isReady)
      return formatMessage({
        id: getTranslation('AssetCard.no-aspect-ratio'),
        defaultMessage: 'No aspect ratio',
      });

    if (muxAsset.error_message !== null)
      return formatMessage({
        id: getTranslation('AssetCard.processing-error'),
        defaultMessage: 'Error',
      });

    return formatMessage({
      id: getTranslation('AssetCard.processing-pending'),
      defaultMessage: 'Processing',
    });
  })();

  return (
    <BoxStyled onClick={handleOnClick} title={errorTitle || loadingTitle || undefined}>
      <Card>
        <CardHeader>
          <CardAsset src={thumbnailImageUrl} style={{ objectFit: 'cover' }}>
            {renderCardAssetStatus()}
          </CardAsset>
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
            {/* <Tooltip label={muxAsset.signed ? 'Private Playback' : 'Public Playback'}>
              {muxAsset.signed ? <Lock /> : <Earth />}
            </Tooltip> */}
            <span title={muxAsset.signed ? 'Private Playback' : 'Public Playback'}>
              {muxAsset.signed ? <Lock /> : <Earth />}
            </span>
          </CardBadge>
        </CardBody>
      </Card>
    </BoxStyled>
  );
};

export default AssetCard;
