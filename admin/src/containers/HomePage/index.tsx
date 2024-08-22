import { 
  Button,
  Grid,
  Flex,
  Searchbar,
  SingleSelect,
  Typography,
  SingleSelectOption,
} from '@strapi/design-system';
import { } from '@strapi/core'
import { Page, useFetchClient, useRBAC } from '@strapi/strapi/admin';
import { Plus } from '@strapi/icons';
import React from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useLocation } from 'react-router-dom';

import { GetMuxAssetsResponse, MuxAsset } from '../../../../server/content-types/mux-asset/types';
import AssetGrid from '../../components/asset-grid';
import ListPagination from '../../components/list-pagination';
import ModalDetails from '../../components/modal-details/modal-details';
import ModalNewUpload from '../../components/modal-new-upload/modal-new-upload';
import SetupNeeded from '../../components/setup-needed';
import pluginPermissions from '../../permissions';
import getTrad from '../../utils/get-trad';
import { appendQueryParameter } from '../../utils/url';
import pluginId from '../../plugin-id';
import { SearchField, SearchVector, SortVector } from '../../types';

const ProtectedHomePage = () => (
  <Page.Protect permissions={pluginPermissions.mainRead}>
    <HomePage />
  </Page.Protect>
);

const HomePage = () => {
  const location = useLocation();
  const history = useNavigate();

  const { get } = useFetchClient();
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

    let search;

    switch (searchVector?.field) {
      case 'by_title': {
        search = `&filters[title][$containsi]=${searchVector.value}`;

        break;
      }
      case 'by_asset_id': {
        search = `&filters[asset_id][$containsi]=${searchVector.value}`;

        break;
      }
      default: {
        search = '';
      }
    }

    const sort = sortVector ? `&sort=${sortVector.field}&order=${sortVector.desc ? 'desc' : 'asc'}` : '';

    const { data } = await get(`${pluginId}/mux-asset?start=${start}${sort}&limit=${pageLimit}${search}`);

    const pages = Math.ceil(data.totalCount / pageLimit);

    setMuxAssets(data);
    setPages(pages);
  };

  React.useEffect(() => {
    get(`${pluginId}/mux-settings`)
    .then(result => {
      const { data } = result;

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

  const handleOnSearchFieldChange = (field: string) => {
    history.push(appendQueryParameter(location, { field }));
  };

  const handleOnSearchValueChange = (event: any) => {
    history.push(appendQueryParameter(location, { value: event?.target.value || '' }));
  };

  const handleOnMuxAssetClick = (muxAsset: MuxAsset) => setSelectedAsset(muxAsset);
  const handleOnInvalidate = () => loadMuxAssets();

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
      <div>
        <Flex justifyContent="space-between">
          <Typography>{formatMessage({
            id: getTrad('HomePage.section-label'),
            defaultMessage: 'Mux Video Uploader',
          })}</Typography>
          <Button disabled={!canCreate} startIcon={<Plus />} size="L" onClick={handleOnNewUploadClick}>
            {formatMessage({
              id: getTrad('HomePage.new-upload-button'),
              defaultMessage: 'Upload new assets',
            })}
          </Button>
        </Flex>
        <div>
          <Grid.Root gap={4}>
            <Grid.Item col={2} xs={12} s={12}>
              <SingleSelect
                aria-label={formatMessage({
                  id: getTrad('HomePage.search-label'),
                  defaultMessage: 'Choose the field to search',
                })}
                placeholder={formatMessage({
                  id: getTrad('HomePage.search-placeholder'),
                  defaultMessage: 'Search field',
                })}
                value={searchField}
                onChange={(value) => handleOnSearchFieldChange(value.toString())}
              >
                {SEARCH_FIELDS.map((searchField) => (
                  <SingleSelectOption value={searchField.value}>{searchField.label}</SingleSelectOption>
                ))}
              </SingleSelect>
            </Grid.Item>
            <Grid.Item col={6} xs={12} s={12}>
              <Searchbar
                name="searchbar"
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
            </Grid.Item>
          </Grid.Root>
          <AssetGrid muxAssets={muxAssets?.items} onMuxAssetClick={handleOnMuxAssetClick} onInvalidate={handleOnInvalidate} />
          <ListPagination page={page} pages={pages} />
        </div>
      </div>
      <ModalNewUpload isOpen={isNewUploadOpen} onToggle={handleOnNewUploadClose} />
      {/* {selectedAsset !== undefined && (
        <ModalDetails
          isOpen={true}
          muxAsset={selectedAsset}
          enableUpdate={canUpdate}
          enableDelete={canDelete}
          onToggle={handleOnDetailsClose}
        />
      )} */}
    </>
  );
};

export default ProtectedHomePage;
