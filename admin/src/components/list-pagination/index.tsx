import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Dots, Grid, NextLink, PageLink, Pagination, PreviousLink } from '@strapi/design-system';

import { appendQueryParameter } from '../../utils/url';
import { getTranslation } from '../../utils/getTranslation';
import { createPagination } from './utils';

interface Props {
  page?: number;
  pages?: number;
}

const ListPagination = (props: Props) => {
  const { page, pages } = props;

  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const prevIntl = {
    id: getTranslation('ListPagination.previous-page'),
    defaultMessage: 'Previous page',
  };

  const nextIntl = {
    id: getTranslation('ListPagination.next-page'),
    defaultMessage: 'Next page',
  };

  const gotoIntl = {
    id: getTranslation('ListPagination.goto-page-n'),
    defaultMessage: 'Go to page {pageNumber}',
  };

  const dotsIntl = {
    id: getTranslation('ListPagination.dots'),
    defaultMessage: 'And {more} other pages',
  };

  if (page === undefined || pages === undefined) return null;

  const { location } = window;

  const handleOnChangePage = (page: number) => {
    const loc = appendQueryParameter(location, { page: page.toString() });

    navigate(`?${loc.search}`);
  };

  return (
    <Grid.Root>
      <Grid.Item>
        <Pagination activePage={page} pageCount={pages}>
          <PreviousLink onClick={() => handleOnChangePage(page - 1)}>{formatMessage(prevIntl)}</PreviousLink>
          <NextLink onClick={() => handleOnChangePage(page + 1)}>{formatMessage(nextIntl)}</NextLink>
          {createPagination({ activePage: page, pages }).items.map((item) => {
            if (item.type === 'PageItem') {
              return (
                <PageLink key={item.value} number={item.value} onClick={() => handleOnChangePage(item.value)}>
                  {formatMessage(gotoIntl, { pageNumber: item.label })}
                </PageLink>
              );
            } else if (item.type === 'DotsItem' && item.display) {
              return <Dots key={`dots-${item.value}`}>{formatMessage(dotsIntl, { more: item.additional })}</Dots>;
            }
          })}
        </Pagination>
      </Grid.Item>
    </Grid.Root>
  );
};

export default ListPagination;
