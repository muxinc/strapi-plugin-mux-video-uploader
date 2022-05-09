import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@strapi/design-system/Typography';
import { Dialog, DialogBody, DialogFooter } from '@strapi/design-system/Dialog';
import { Stack } from '@strapi/design-system/Stack';
import { AssetDefinition } from '../../constants';

export const DuplicateAssetsDialog = ({
  title,
  text,
  assets,
  startAction,
  endAction,
  onClose,
  isOpen,
}) => {
  return (
    <Dialog onClose={onClose} title={title} isOpen={isOpen}>
      <DialogBody>
        <Stack spacing={3}>
          <Typography>{text}</Typography>
          <div style={{ overflowY: 'scroll', height: '30vh' }}>
            <Stack padding={3} spacing={3}>
              {assets.map((asset) => (
                <Typography variant="pi" fontWeight="bold">
                  ● {asset.nameWithoutExtension}
                </Typography>
              ))}
            </Stack>
          </div>
        </Stack>
      </DialogBody>

      <DialogFooter startAction={startAction} endAction={endAction} />
    </Dialog>
  );
};

DuplicateAssetsDialog.defaultProps = {};

DuplicateAssetsDialog.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  assets: PropTypes.arrayOf(AssetDefinition).isRequired,
  startAction: PropTypes.node.isRequired,
  endAction: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};
