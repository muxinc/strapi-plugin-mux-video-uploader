import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Card,
  CardAction,
  CardAsset,
  CardBody,
  CardCheckbox,
  CardContent,
  CardHeader,
  CardTitle,
  CardTimer,
} from '@strapi/design-system/Card';
import { Checkbox } from '@strapi/design-system/Checkbox';
import { Stack } from '@strapi/design-system/Stack';
import { IconButton } from '@strapi/design-system/IconButton';
import { Typography } from '@strapi/design-system/Typography';
import Pencil from '@strapi/icons/Pencil';
import Trash from '@strapi/icons/Trash';
import { useIntl } from 'react-intl';
import { Box } from '@strapi/design-system/Box';
import { VideoPreview } from './VideoPreview';
import getTrad from '../../../utils/getTrad';
import { formatDuration } from '../utils/formatDuration';

const VideoPreviewWrapper = styled(Box)`
  canvas,
  video {
    display: block;
    max-width: 100%;
    max-height: ${({ size }) => (size === 'M' ? 164 / 16 : 88 / 16)}rem;
  }
`;

export const VideoAssetCard = ({
  name,
  extension,
  url,
  mime,
  duplicate,
  selected,
  onSelect,
  onEdit,
  onRemove,
  size,
  playbackPolicy,
  onPlaybackPolicyChange,
  enablePublicUpload,
}) => {
  const { formatMessage } = useIntl();
  const [duration, setDuration] = useState();

  const formattedDuration = duration && formatDuration(duration);

  return (
    <Card>
      <CardHeader>
        {onSelect && <CardCheckbox value={selected} onValueChange={onSelect} />}
        {(onRemove || onEdit) && (
          <CardAction position="end">
            {onRemove && (
              <IconButton
                label={formatMessage({
                  id: getTrad('control-card.remove-selection'),
                  defaultMessage: 'Remove from selection',
                })}
                icon={<Trash />}
                onClick={onRemove}
              />
            )}

            {onEdit && (
              <IconButton
                label={formatMessage({
                  id: getTrad('control-card.edit'),
                  defaultMessage: 'Edit',
                })}
                icon={<Pencil />}
                onClick={onEdit}
              />
            )}
          </CardAction>
        )}
        <CardAsset size={size}>
          <VideoPreviewWrapper size={size}>
            <VideoPreview
              url={url}
              mime={mime}
              onLoadDuration={setDuration}
              alt={name}
            />
          </VideoPreviewWrapper>
        </CardAsset>
        <CardTimer>{formattedDuration || '...'}</CardTimer>
      </CardHeader>
      <CardBody>
        <CardContent>
          <Stack padding={3} spacing={2}>
            <Box>
              <CardTitle as="h2">{name}</CardTitle>
            </Box>
            {enablePublicUpload && (
              <Box>
                <Checkbox
                  value={playbackPolicy}
                  onValueChange={onPlaybackPolicyChange}
                >
                  Signed
                </Checkbox>
              </Box>
            )}
            {duplicate && duplicate.length > 0 && (
              <Box>
                <Typography variant="pi" textColor="danger600">
                  {duplicate[0].error}
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </CardBody>
    </Card>
  );
};

VideoAssetCard.defaultProps = {
  onSelect: undefined,
  onEdit: undefined,
  onRemove: undefined,
  selected: false,
  size: 'M',
};

VideoAssetCard.propTypes = {
  extension: PropTypes.string.isRequired,
  mime: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onSelect: PropTypes.func,
  onEdit: PropTypes.func,
  onRemove: PropTypes.func,
  url: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  size: PropTypes.oneOf(['S', 'M']),
};
