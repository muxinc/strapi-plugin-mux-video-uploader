import { Box, Grid, Searchbar, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import {} from '@strapi/core';
import { Layouts, Page, useFetchClient, useRBAC } from '@strapi/strapi/admin';
import React from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useLocation } from 'react-router-dom';

// @todo - v5 migration this is goofy
import { GetMuxAssetsResponse, MuxAsset } from '../../../server/src/content-types/mux-asset/types';
import AssetGrid from '../components/asset-grid';
import ListPagination from '../components/list-pagination';
import SetupNeeded from '../components/setup-needed';
import pluginPermissions from '../permissions';
import { getTranslation } from '../utils/getTranslation';
import { appendQueryParameter } from '../utils/url';
import { PLUGIN_ID } from '../pluginId';
import { SearchField, SearchVector, SortVector } from '../types';
import Header from '../components/header';

const ProtectedHomePage = () => (
  <Page.Protect permissions={[pluginPermissions.mainRead]}>
    <HomePage />
  </Page.Protect>
);

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { get } = useFetchClient();
  const { formatMessage } = useIntl();

  const SEARCH_FIELDS = [
    {
      label: formatMessage({
        id: getTranslation('Common.title-search-field'),
        defaultMessage: 'By Title',
      }),
      value: SearchField.BY_TITLE,
    },
    {
      label: formatMessage({
        id: getTranslation('Common.assetId-search-field'),
        defaultMessage: 'By Asset Id',
      }),
      value: SearchField.BY_ASSET_ID,
    },
  ];

  const [isReady, setIsReady] = React.useState<boolean>(false);
  const [muxAssets, setMuxAssets] = React.useState<GetMuxAssetsResponse | undefined>();
  const [selectedAsset, setSelectedAsset] = React.useState<MuxAsset | undefined>();

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

    const { data } = await get(`${PLUGIN_ID}/mux-asset?start=${start}${sort}&limit=${pageLimit}${search}`);

    const pages = Math.ceil(data.totalCount / pageLimit);

    setMuxAssets(data);
    setPages(pages);
  };

  React.useEffect(() => {
    get(`${PLUGIN_ID}/mux-settings`).then((result) => {
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
    return [pluginPermissions.mainCreate, pluginPermissions.mainUpdate, pluginPermissions.mainDelete];
  }, []);

  const {
    isLoading: isLoadingForPermissions,
    allowedActions: { canCreate, canUpdate, canDelete },
  } = useRBAC(permissions);

  const handleOnUploadNewAssetModalClose = () => loadMuxAssets();

  const handleOnSearchFieldChange = (field: string) => {
    navigate(appendQueryParameter(location, { field }));
  };

  const handleOnSearchValueChange = (event: any) => {
    navigate(appendQueryParameter(location, { value: event?.target.value || '' }));
  };

  const handleOnMuxAssetClick = (muxAsset: MuxAsset) => setSelectedAsset(muxAsset);

  if (!isReady) return <SetupNeeded />;

  if (isLoadingForPermissions) return null;

  return (
    <Layouts.Root>
      <Page.Main>
        <Header onUploadNewAssetModalClose={handleOnUploadNewAssetModalClose} />
        <Layouts.Action
          startActions={
            <Grid.Root gap={4}>
              <Grid.Item col={2} xs={12} s={12}>
                <SingleSelect
                  aria-label={formatMessage({
                    id: getTranslation('HomePage.search-label'),
                    defaultMessage: 'Choose the field to search',
                  })}
                  placeholder={formatMessage({
                    id: getTranslation('HomePage.search-placeholder'),
                    defaultMessage: 'Search field',
                  })}
                  value={searchField}
                  onChange={(value: string) => handleOnSearchFieldChange(value.toString())}
                >
                  {SEARCH_FIELDS.map((searchField) => (
                    <SingleSelectOption value={searchField.value} key={searchField.value}>
                      {searchField.label}
                    </SingleSelectOption>
                  ))}
                </SingleSelect>
              </Grid.Item>
              <Grid.Item col={8} xs={12} s={12}>
                <Box width="100%">
                  <Searchbar
                    name="searchbar"
                    onClear={() => setSearchValue('')}
                    value={searchValue}
                    onChange={handleOnSearchValueChange}
                    clearLabel={formatMessage({
                      id: getTranslation('HomePage.clear-label'),
                      defaultMessage: 'Clear search',
                    })}
                  >
                    {formatMessage({
                      id: getTranslation('HomePage.searching'),
                      defaultMessage: 'Searching for Mux assets',
                    })}
                  </Searchbar>
                </Box>
              </Grid.Item>
            </Grid.Root>
          }
        />
        <Layouts.Content>
          <AssetGrid muxAssets={muxAssets?.items} onMuxAssetClick={handleOnMuxAssetClick} />
          <ListPagination page={page} pages={pages} />
        </Layouts.Content>
      </Page.Main>
      {/* {selectedAsset !== undefined && (
        <ModalDetails
          isOpen={true}
          muxAsset={selectedAsset}
          enableUpdate={canUpdate}
          enableDelete={canDelete}
          onToggle={handleOnDetailsClose}
        />
      )} */}
    </Layouts.Root>
  );
};

export default ProtectedHomePage;
