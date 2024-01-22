import { Button } from '@strapi/design-system/Button';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { ContentLayout, HeaderLayout, Layout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { Searchbar } from '@strapi/design-system/Searchbar';
import { Option, Select } from '@strapi/design-system/Select';
import { CheckPagePermissions, useRBAC } from '@strapi/helper-plugin';
import Plus from '@strapi/icons/Plus';
import React from 'react';
import { useIntl } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';

import { GetMuxAssetsResponse, MuxAsset } from '../../../../server/content-types/mux-asset/types';
import AssetGrid from '../../components/asset-grid';
import ListPagination from '../../components/list-pagination';
import ModalDetails from '../../components/modal-details/ModalDetails';
import ModalNewUpload from '../../components/modal-new-upload/ModalNewUpload';
import SetupNeeded from '../../components/setup-needed';
import pluginPermissions from '../../permissions';
import { getIsConfigured, getMuxAssets } from '../../services/strapi';
import { SearchField, SearchVector, SortVector } from '../../services/strapi/types';
import getTrad from '../../utils/getTrad';
import { appendQueryParameter } from '../../utils/url';

const ProtectedHomePage = () => (
  <CheckPagePermissions permissions={pluginPermissions.mainRead}>
    <HomePage />
  </CheckPagePermissions>
);

const HomePage = () => {
  const location = useLocation();
  const history = useHistory();

  const { formatMessage } = useIntl();

  const SEARCH_FIELDS = [
    {
      label: formatMessage({
        id: getTrad('Common.title-search-field'),
        defaultMessage: 'By Title',
      }),
      value: SearchField.BY_TITLE,
    },
    {
      label: formatMessage({
        id: getTrad('Common.assetId-search-field'),
        defaultMessage: 'By Asset Id',
      }),
      value: SearchField.BY_ASSET_ID,
    },
  ];

  const [isReady, setIsReady] = React.useState<boolean>(false);
  const [muxAssets, setMuxAssets] = React.useState<GetMuxAssetsResponse | undefined>();
  const [selectedAsset, setSelectedAsset] = React.useState<MuxAsset | undefined>();
  const [isNewUploadOpen, setIsNewUploadOpen] = React.useState<boolean>(false);

  const [searchField, setSearchField] = React.useState<SearchField>(SEARCH_FIELDS[0].value);
  const [searchValue, setSearchValue] = React.useState<string | undefined>('');
  const [pageLimit] = React.useState<number>(12);
  const [pages, setPages] = React.useState(1);
  const [page, setPage] = React.useState<number>();

  const loadMuxAssets = async () => {
    if (page === undefined) return;

    let searchVector: SearchVector | undefined = undefined;

    if (searchValue !== undefined && searchValue) {
      searchVector = {
        field: searchField,
        value: searchValue,
      };
    }

    const sortVector: SortVector = { field: 'createdAt', desc: true };

    const start = (page - 1) * pageLimit;

    const data = await getMuxAssets(searchVector, sortVector, start, pageLimit);

    const pages = Math.ceil(data.totalCount / pageLimit);

    setMuxAssets(data);
    setPages(pages);
  };

  React.useEffect(() => {
    getIsConfigured().then((data) => {
      setIsReady(data === true);
    });
  }, []);

  React.useEffect(() => {
    const { page, field, value } = Object.fromEntries(new URLSearchParams(location.search));
    setSearchField((field as SearchField) || SearchField.BY_TITLE);
    setSearchValue(value);

    if ((value && value !== searchValue) || (field && field !== searchField)) {
      setPage(1);
    } else {
      setPage(parseInt(page) || 1);
    }
  }, [location]);

  React.useEffect(() => {
    loadMuxAssets();
  }, [page, searchField, searchValue, pageLimit]);

  const permissions = React.useMemo(() => {
    return {
      create: pluginPermissions.mainCreate,
      update: pluginPermissions.mainUpdate,
      delete: pluginPermissions.mainDelete,
    };
  }, []);

  const {
    isLoading: isLoadingForPermissions,
    allowedActions: { canCreate, canUpdate, canDelete },
  } = useRBAC(permissions);

  const handleOnSearchFieldChange = (field: SearchField) => {
    history.push(appendQueryParameter(location, { field }));
  };

  const handleOnSearchValueChange = (event: any) => {
    history.push(appendQueryParameter(location, { value: event?.target.value || '' }));
  };

  const handleOnMuxAssetClick = (muxAsset: MuxAsset) => setSelectedAsset(muxAsset);

  const handleOnDetailsClose = (refresh?: boolean) => {
    setSelectedAsset(undefined);
    if (!refresh) return;
    loadMuxAssets();
  };

  const handleOnNewUploadClose = (refresh: boolean) => {
    setIsNewUploadOpen(false);
    if (!refresh) return;
    loadMuxAssets();
  };

  const handleOnNewUploadClick = () => setIsNewUploadOpen(true);

  if (!isReady) return <SetupNeeded />;

  if (isLoadingForPermissions) return null;

  return (
    <>
      <Layout>
        <Main>
          <HeaderLayout
            title={formatMessage({
              id: getTrad('HomePage.section-label'),
              defaultMessage: 'Mux Video Uploader',
            })}
            primaryAction={
              <Button disabled={!canCreate} startIcon={<Plus />} size="L" onClick={handleOnNewUploadClick}>
                {formatMessage({
                  id: getTrad('HomePage.new-upload-button'),
                  defaultMessage: 'Upload new assets',
                })}
              </Button>
            }
          />
          <ContentLayout>
            <Grid gap={4}>
              <GridItem col={2} xs={12} s={12}>
                <Select
                  aria-label={formatMessage({
                    id: getTrad('HomePage.search-label'),
                    defaultMessage: 'Choose the field to search',
                  })}
                  placeholder={formatMessage({
                    id: getTrad('HomePage.search-placeholder'),
                    defaultMessage: 'Search field',
                  })}
                  value={searchField}
                  onChange={handleOnSearchFieldChange}
                >
                  {SEARCH_FIELDS.map((searchField) => (
                    <Option value={searchField.value}>{searchField.label}</Option>
                  ))}
                </Select>
              </GridItem>
              <GridItem col={6} xs={12} s={12}>
                <Searchbar
                  onClear={() => setSearchValue('')}
                  value={searchValue}
                  onChange={handleOnSearchValueChange}
                  clearLabel={formatMessage({
                    id: getTrad('HomePage.clear-label'),
                    defaultMessage: 'Clear search',
                  })}
                >
                  {formatMessage({
                    id: getTrad('HomePage.searching'),
                    defaultMessage: 'Searching for Mux assets',
                  })}
                </Searchbar>
              </GridItem>
            </Grid>
            <AssetGrid muxAssets={muxAssets?.items} onMuxAssetClick={handleOnMuxAssetClick} />
            <ListPagination page={page} pages={pages} />
          </ContentLayout>
        </Main>
      </Layout>
      <ModalNewUpload isOpen={isNewUploadOpen} onToggle={handleOnNewUploadClose} />
      {selectedAsset !== undefined && (
        <ModalDetails
          isOpen={true}
          muxAsset={selectedAsset}
          enableUpdate={canUpdate}
          enableDelete={canDelete}
          onToggle={handleOnDetailsClose}
        />
      )}
    </>
  );
};

export default ProtectedHomePage;
