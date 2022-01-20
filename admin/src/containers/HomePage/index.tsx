import React from 'react';
import { useIntl } from 'react-intl';
import { DebouncedFunc } from 'lodash';
import debounce from 'lodash.debounce';
import { CheckPagePermissions, GlobalPagination } from '@strapi/helper-plugin';
import Plus from '@strapi/icons/Plus';
import { Button } from '@strapi/design-system/Button';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { HeaderLayout, Layout, ContentLayout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { Searchbar, SearchForm } from '@strapi/design-system/Searchbar';
import { Select, Option } from '@strapi/design-system/Select';

import { GetMuxAssetsResponse, MuxAsset } from '../../../../types';
import SetupNeeded from '../../components/setup-needed';
import { getIsConfigured, getMuxAssets } from '../../services/strapi';
import AssetGrid from '../../components/asset-grid';
import { SearchField, SearchVector, SortVector } from '../../services/strapi/types';
import ModalDetails from '../../components/modal-details';
import usePrevious from '../../utils/use-previous';
import ModalNewUpload from '../../components/modal-new-upload';
import pluginPermissions from '../../permissions';
import getTrad from '../../utils/getTrad';

const SEARCH_FIELDS = [{ 
  label: 'By Title',
  value: SearchField.BY_TITLE,
}, {
  label: 'By Asset Id',
  value: SearchField.BY_ASSET_ID
}] as const;

const HomePage = () => {
  const [isReady, setIsReady] = React.useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = React.useState<boolean>(false);
  const [muxAssets, setMuxAssets] = React.useState<GetMuxAssetsResponse|undefined>();
  const [selectedAsset, setSelectedAsset] = React.useState<MuxAsset|undefined>();
  const [isNewUploadOpen, setIsNewUploadOpen] = React.useState<boolean>(false);

  const [searchField, setSearchField] = React.useState<SearchField>(SEARCH_FIELDS[0].value);
  const [searchValue, setSearchValue] = React.useState<string|undefined>(undefined);
  const [pageLimit] = React.useState<number>(20);
  const [pageStart, setPageStart] = React.useState<number>(0);

  const { formatMessage } = useIntl();

  const prevSearchField = usePrevious(searchField);
  const prevSearchValue = usePrevious(searchValue);
  const prevPageLimit = usePrevious(pageLimit);
  const prevPageStart = usePrevious(pageStart);

  const loadMuxAssets = async () => {
    let searchVector:SearchVector|undefined = undefined;

    if(searchValue !== undefined && searchValue) {
      searchVector = {
        field: searchField,
        value: searchValue
      };
    }

    const sortVector:SortVector = { field: 'created_at', desc: true };

    const start = pageStart * pageLimit;

    const data = await getMuxAssets(searchVector, sortVector, start, pageLimit);
    
    setMuxAssets(data);
  }

  const loadMuxAssetsDebounced:DebouncedFunc<any> = debounce(loadMuxAssets, 300);

  React.useEffect(() => {
    getIsConfigured().then(data => {
      setIsReady(data === true);
    });

    () => loadMuxAssetsDebounced.cancel();
  }, []);

  React.useEffect(() => {
    if(!isReady) return;

    if(
      !hasLoaded ||
      (prevSearchField !== searchField && searchValue !== undefined) ||
      prevSearchValue !== searchValue ||
      prevPageStart !== pageStart ||
      prevPageLimit !== pageLimit
    ) {
      loadMuxAssetsDebounced();

      setHasLoaded(true);
    }
  }, [isReady, searchField, searchValue, pageStart, pageLimit]);

  const handleOnSearchFieldChange = (field: SearchField) => {
    // const field = event?.target.value === '' ? undefined : event?.target.value;

    if(field !== undefined && field !== searchField) {
      setPageStart(0);
    }

    setSearchField(field);
  };

  const handleOnSearchValueChange = (event:any) => {
    const value = event?.target.value === '' ? undefined : event?.target.value;
    
    setSearchValue(value);
    
    if(value !== undefined && value !== searchValue) {
      setPageStart(0);
    }
  };
  
  const handleOnMuxAssetClick = (muxAsset:MuxAsset) => setSelectedAsset(muxAsset);

  const handleOnDetailsClose = (refresh?:boolean) => {
    setSelectedAsset(undefined);
    if(!refresh) return;
    loadMuxAssets();
  }

  const handleOnNewUploadClose = (refresh:boolean) => {
    setIsNewUploadOpen(false);
    if(!refresh) return;
    loadMuxAssets();
  }

  const handleOnNewUploadClick = () => setIsNewUploadOpen(true);

  const handleOnPaginateChange = ({ target }: { target: { value: number }}) => {
    setPageStart(target.value - 1);
    loadMuxAssets();
  };

  if(!isReady) return <SetupNeeded />;

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
              <Button
                // disabled={!canUpdate}
                startIcon={<Plus />}
                size="L"
                onClick={handleOnNewUploadClick}
              >
                {formatMessage({ id: getTrad('HomePage.newUpload'), defaultMessage: 'New Upload' })}
              </Button>
            }
          />
          <ContentLayout>
            <Grid gap={4}>
              <GridItem col={2} xs={12} s={12}>
                <Select
                  aria-label="Choose the field to search"
                  placeholder="Search field"
                  value={searchField}
                  onChange={handleOnSearchFieldChange}
                >
                  {
                    SEARCH_FIELDS.map(searchField => <Option value={searchField.value}>{searchField.label}</Option>)
                  }
                </Select>
              </GridItem>
              <GridItem col={6} xs={12} s={12}>
                <SearchForm>
                  <Searchbar
                    name="searchbar"
                    onClear={() => setSearchValue('')}
                    value={searchValue}
                    onChange={handleOnSearchValueChange}
                    clearLabel="Clear search"
                  >
                    Searching for Mux assets
                  </Searchbar>
                </SearchForm>
              </GridItem>
            </Grid>
            <AssetGrid muxAssets={muxAssets?.items} onMuxAssetClick={handleOnMuxAssetClick} />
          </ContentLayout>
        </Main>
      </Layout>
      <ModalNewUpload
        isOpen={isNewUploadOpen}
        onToggle={handleOnNewUploadClose}
      />
      <ModalDetails 
        isOpen={selectedAsset !== undefined}
        muxAsset={selectedAsset}
        onToggle={handleOnDetailsClose}
      />
    </>
    // <CheckPagePermissions permissions={pluginPermissions.main}>
    //   <Layout>
    //     <div>
    //       <ControlsContainer>
    //         <SearchContainer>
    //           <Select
    //             options={SEARCH_FIELDS}
    //             value={searchField}
    //             onChange={handleOnSearchFieldChange}
    //           />
    //           <InputText
    //             placeholder="Search text"
    //             type="text"
    //             value={searchValue}
    //             onChange={handleOnSearchValueChange}
    //           />
    //         </SearchContainer>
    //         <NewUploadButtonContainer>
    //           <Button color="primary" label="New Upload" onClick={handleOnNewUploadClick} />
    //         </NewUploadButtonContainer>
    //       </ControlsContainer>
    //       <AssetGrid muxAssets={muxAssets?.items} onMuxAssetClick={handleOnMuxAssetClick} />
    //       <GlobalPagination
    //         count={muxAssets?.totalCount}
    //         params={{_page: pageStart + 1, _limit: pageLimit}}
    //         onChangeParams={handleOnPaginateChange}
    //       />
    //       <ModalDetails 
    //         isOpen={selectedAsset !== undefined}
    //         muxAsset={selectedAsset}
    //         onToggle={handleOnDetailsClose}
    //       />
    //       <ModalNewUpload
    //         isOpen={isNewUploadOpen}
    //         onToggle={handleOnNewUploadClose}
    //       />
    //     </div>
    //   </Layout>
    // </CheckPagePermissions>
  );
};

export default React.memo(HomePage);
