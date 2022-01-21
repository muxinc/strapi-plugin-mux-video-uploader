const React = require('react');
const { useIntl } = require('react-intl');
const { DebouncedFunc } = require('lodash');
const debounce = require('lodash.debounce');
const { CheckPagePermissions, GlobalPagination } = require('@strapi/helper-plugin');
const Plus = require('@strapi/icons/Plus');
const { Button } = require('@strapi/design-system/Button');
const { Grid, GridItem } = require('@strapi/design-system/Grid');
const { HeaderLayout, Layout, ContentLayout } = require('@strapi/design-system/Layout');
const { Main } = require('@strapi/design-system/Main');
const { Searchbar, SearchForm } = require('@strapi/design-system/Searchbar');
const { Select, Option } = require('@strapi/design-system/Select');

// const { GetMuxAssetsResponse, MuxAsset } = require('../../../../types');
const SetupNeeded = require('../../components/setup-needed');
const { getIsConfigured, getMuxAssets } = require('../../services/strapi');
const AssetGrid = require('../../components/asset-grid');
// const { SearchField, SearchVector, SortVector } = require('../../services/strapi/types');
const ModalDetails = require('../../components/modal-details');
const usePrevious = require('../../utils/use-previous');
const ModalNewUpload = require('../../components/modal-new-upload');
const pluginPermissions = require('../../permissions');
const getTrad = require('../../utils/getTrad');

const SEARCH_FIELDS = [{ 
  label: 'By Title',
  value: 'by_title',
}, {
  label: 'By Asset Id',
  value: 'by_asset_id'
}];

const HomePage = () => {
  const [isReady, setIsReady] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const [muxAssets, setMuxAssets] = React.useState();
  const [selectedAsset, setSelectedAsset] = React.useState();
  const [isNewUploadOpen, setIsNewUploadOpen] = React.useState(false);

  const [searchField, setSearchField] = React.useState(SEARCH_FIELDS[0].value);
  const [searchValue, setSearchValue] = React.useState(undefined);
  const [pageLimit] = React.useState(20);
  const [pageStart, setPageStart] = React.useState(0);

  const { formatMessage } = useIntl();

  const prevSearchField = usePrevious(searchField);
  const prevSearchValue = usePrevious(searchValue);
  const prevPageLimit = usePrevious(pageLimit);
  const prevPageStart = usePrevious(pageStart);

  const loadMuxAssets = async () => {
    let searchVector = undefined;

    if(searchValue !== undefined && searchValue) {
      searchVector = {
        field: searchField,
        value: searchValue
      };
    }

    const sortVector = { field: 'created_at', desc: true };

    const start = pageStart * pageLimit;

    const data = await getMuxAssets(searchVector, sortVector, start, pageLimit);
    
    setMuxAssets(data);
  }

  const loadMuxAssetsDebounced = debounce(loadMuxAssets, 300);

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

  const handleOnSearchFieldChange = (field) => {
    // const field = event?.target.value === '' ? undefined : event?.target.value;

    if(field !== undefined && field !== searchField) {
      setPageStart(0);
    }

    setSearchField(field);
  };

  const handleOnSearchValueChange = (event) => {
    const value = event?.target.value === '' ? undefined : event?.target.value;
    
    setSearchValue(value);
    
    if(value !== undefined && value !== searchValue) {
      setPageStart(0);
    }
  };
  
  const handleOnMuxAssetClick = (muxAsset) => setSelectedAsset(muxAsset);

  const handleOnDetailsClose = (refresh) => {
    setSelectedAsset(undefined);
    if(!refresh) return;
    loadMuxAssets();
  }

  const handleOnNewUploadClose = (refresh) => {
    setIsNewUploadOpen(false);
    if(!refresh) return;
    loadMuxAssets();
  }

  const handleOnNewUploadClick = () => setIsNewUploadOpen(true);

  const handleOnPaginateChange = ({ target }) => {
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

module.exports = React.memo(HomePage);
