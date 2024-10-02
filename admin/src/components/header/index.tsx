import React from 'react';
import { useIntl } from 'react-intl';
import { Button } from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { Layouts, useRBAC } from '@strapi/strapi/admin';

import pluginPermissions from '../../permissions';
import { getTranslation } from '../../utils/getTranslation';
import ModalNewUpload from '../modal-new-upload/modal-new-upload';

interface Props {
  onUploadNewAssetModalClose?: () => void;
}

const Header = (props: Props) => {
  const { onUploadNewAssetModalClose = () => {} } = props;

  const [isNewUploadOpen, setIsNewUploadOpen] = React.useState<boolean>(false);

  const permissions = React.useMemo(() => {
    return [pluginPermissions.mainCreate];
  }, []);

  const { formatMessage } = useIntl();
  const {
    allowedActions: { canCreate },
  } = useRBAC(permissions);

  const handleOnNewUploadClick = () => setIsNewUploadOpen(true);

  const handleOnNewUploadClose = (refresh: boolean) => {
    setIsNewUploadOpen(false);
    if (!refresh) return;

    onUploadNewAssetModalClose();
  };

  return (
    <>
      <Layouts.Header
        title={formatMessage({
          id: getTranslation('HomePage.section-label'),
          defaultMessage: 'Mux Video Uploader',
        })}
        primaryAction={
          <Button disabled={!canCreate} startIcon={<Plus />} onClick={handleOnNewUploadClick}>
            {formatMessage({
              id: getTranslation('HomePage.new-upload-button'),
              defaultMessage: 'Upload new assets',
            })}
          </Button>
        }
      />
      <ModalNewUpload isOpen={isNewUploadOpen} onToggle={handleOnNewUploadClose} />
    </>
  );
};

export default Header;
