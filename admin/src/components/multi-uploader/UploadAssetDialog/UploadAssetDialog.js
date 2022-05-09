import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ModalLayout } from '@strapi/design-system/ModalLayout';
import { useIntl } from 'react-intl';
import { AddAssetStep } from './AddAssetStep/AddAssetStep';
import { PendingAssetStep } from './PendingAssetStep/PendingAssetStep';
import { AssetDefinition } from '../constants';
import { getMuxAssets } from '../../../services/strapi';

const Steps = {
  AddAsset: 'AddAsset',
  PendingAsset: 'PendingAsset',
};

export const UploadAssetDialog = ({
  initialAssetsToAdd,
  onClose,
  addUploadedFiles,
  trackedLocation,
  enablePublicUpload,
}) => {
  const { formatMessage } = useIntl();
  const [step, setStep] = useState(
    initialAssetsToAdd ? Steps.PendingAsset : Steps.AddAsset
  );
  const [assets, setAssets] = useState(initialAssetsToAdd || []);

  const handleDuplicates = async (nextAssets) => {
    for (const asset of nextAssets) {
      const potentialDuplicates = await getMuxAssets(
        { field: 'by_title', value: asset.nameWithoutExtension },
        undefined,
        0,
        0
      );

      const hasDuplicates = potentialDuplicates?.items?.some(
        (muxAsset) => asset.nameWithoutExtension === muxAsset.title
      );

      const alreadyInPrevAssets = assets.some(
        (prevAsset) =>
          asset.nameWithoutExtension === prevAsset.nameWithoutExtension
      );

      if (alreadyInPrevAssets) {
        asset.duplicate.push({
          type: 'already_in_list',
          error: formatMessage({
            id: 'ModalNewUpload.already-in-list-error',
            defaultMessage: 'Already in list',
          }),
        });
      }

      if (hasDuplicates) {
        asset.duplicate.push({
          type: 'already_uploaded',
          error: formatMessage({
            id: 'ModalNewUpload.already-uploaded-error',
            defaultMessage: 'Already uploaded',
          }),
        });
      }
    }
  };

  const handleAddToPendingAssets = async (nextAssets) => {
    await handleDuplicates(nextAssets);

    setAssets((prevAssets) =>
      prevAssets
        .concat(nextAssets)
        .sort((a, b) =>
          a.nameWithoutExtension.localeCompare(b.nameWithoutExtension)
        )
    );
    setStep(Steps.PendingAsset);
  };

  const moveToAddAsset = () => {
    setStep(Steps.AddAsset);
  };

  const handleCancelUpload = (file) => {
    const nextAssets = assets.filter((asset) => asset.rawFile !== file);
    setAssets(nextAssets);

    // When there's no asset, transition to the AddAsset step
    if (nextAssets.length === 0) {
      moveToAddAsset();
    }
  };

  const handleUploadSuccess = (file) => {
    const nextAssets = assets.filter((asset) => asset.rawFile !== file);
    setAssets(nextAssets);

    if (nextAssets.length === 0) {
      onClose();
    }
  };

  const handleClose = () => {
    if (step === Steps.PendingAsset && assets.length > 0) {
      // eslint-disable-next-line no-alert
      const confirm = window.confirm(
        formatMessage({
          id: 'window.confirm.close-modal.files',
          defaultMessage:
            'Are you sure? You have some files that have not been uploaded yet.',
        })
      );

      if (confirm) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const cleanUpDuplicateError = (assetToRemove, remainingAssets) => {
    const firstDuplicate = remainingAssets.find(
      (asset) =>
        asset.nameWithoutExtension === assetToRemove.nameWithoutExtension
    );

    if (firstDuplicate) {
      firstDuplicate.duplicate = firstDuplicate.duplicate.filter(
        (duplicate) => duplicate.type !== 'already_in_list'
      );
    }
  };

  const handleRemoveAsset = (assetToRemove) => {
    handleRemoveAssets([assetToRemove]);
  };

  const handleRemoveAssets = (assetsToRemove) => {
    const nextAssets = assets.filter(
      (asset) => !assetsToRemove.includes(asset)
    );

    for (const assetToRemove of assetsToRemove) {
      cleanUpDuplicateError(assetToRemove, nextAssets);
    }

    setAssets(nextAssets);
  };

  return (
    <ModalLayout onClose={handleClose} labelledBy="title">
      {step === Steps.AddAsset && (
        <AddAssetStep
          onClose={onClose}
          onAddAsset={handleAddToPendingAssets}
          trackedLocation={trackedLocation}
        />
      )}

      {step === Steps.PendingAsset && (
        <PendingAssetStep
          onClose={handleClose}
          assets={assets}
          onRemoveAsset={handleRemoveAsset}
          onRemoveAssets={handleRemoveAssets}
          onClickAddAsset={moveToAddAsset}
          onCancelUpload={handleCancelUpload}
          onUploadSucceed={handleUploadSuccess}
          initialAssetsToAdd={initialAssetsToAdd}
          addUploadedFiles={addUploadedFiles}
          enablePublicUpload={enablePublicUpload}
        />
      )}
    </ModalLayout>
  );
};

UploadAssetDialog.defaultProps = {
  addUploadedFiles: undefined,
  initialAssetsToAdd: undefined,
  trackedLocation: undefined,
};

UploadAssetDialog.propTypes = {
  addUploadedFiles: PropTypes.func,
  initialAssetsToAdd: PropTypes.arrayOf(AssetDefinition),
  onClose: PropTypes.func.isRequired,
  trackedLocation: PropTypes.string,
};
