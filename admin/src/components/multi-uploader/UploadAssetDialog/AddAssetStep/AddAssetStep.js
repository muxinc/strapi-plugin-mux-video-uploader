import React from "react";
import PropTypes from "prop-types";
import { ModalHeader } from "@strapi/design-system/ModalLayout";
import { Typography } from "@strapi/design-system/Typography";
import { useIntl } from "react-intl";
import { FromComputerForm } from "./FromComputerForm";
import getTrad from "../../../../utils/getTrad";

export const AddAssetStep = ({ onClose, onAddAsset, trackedLocation }) => {
  const { formatMessage } = useIntl();

  return (
    <>
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          {formatMessage({
            id: getTrad("header.actions.add-assets"),
            defaultMessage: "Add new assets",
          })}
        </Typography>
      </ModalHeader>

      <FromComputerForm
        onClose={onClose}
        onAddAssets={onAddAsset}
        trackedLocation={trackedLocation}
      />
    </>
  );
};

AddAssetStep.defaultProps = {
  trackedLocation: undefined,
};

AddAssetStep.propTypes = {
  onClose: PropTypes.func.isRequired,
  onAddAsset: PropTypes.func.isRequired,
  trackedLocation: PropTypes.string,
};
