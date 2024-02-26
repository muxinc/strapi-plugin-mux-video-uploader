import React from 'react';
import { useIntl } from 'react-intl';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { Dots, NextLink, PageLink, Pagination, PreviousLink } from '@strapi/design-system/Pagination';

import { appendQueryParameter } from '../../utils/url';
import getTrad from '../../utils/get-trad';

interface Props {
  page?: number;
  pages?: number;
}

const ListPagination = (props: Props) => {
  const { page, pages } = props;

  const { formatMessage } = useIntl();

  const prevIntl = {
    id: getTrad('ListPagination.previous-page'),
    defaultMessage: 'Previous page',
  };

  const nextIntl = {
    id: getTrad('ListPagination.next-page'),
    defaultMessage: 'Next page',
  };

  const gotoIntl = {
    id: getTrad('ListPagination.goto-page-n'),
    defaultMessage: 'Go to page {pageNumber}',
  };

  const dotsIntl = {
    id: getTrad('ListPagination.dots'),
    defaultMessage: 'And {more} other links',
  };

  if (page === undefined || pages === undefined) return null;

  const previous = page !== 1 && pages > 9 && (
    <PreviousLink to={(l: Location) => appendQueryParameter(l, { page: (page - 1).toString() })}>
      {formatMessage(prevIntl)}
    </PreviousLink>
  );

  const next = page != pages && pages > 9 && (
    <NextLink to={(l: Location) => appendQueryParameter(l, { page: (page + 1).toString() })}>
      {formatMessage(nextIntl)}
    </NextLink>
  );

  const resolvePageLinks = () => {
    // Example: 1 2 3 4 5 6 7 8 9
    if (pages <= 9) {
      const items = Array(pages)
        .fill(null)
        .map((_n, index) => (
          <PageLink
            key={index}
            number={index + 1}
            to={(l: Location) => appendQueryParameter(l, { page: (index + 1).toString() })}
          >
            {formatMessage(gotoIntl, { pageNumber: index + 1 })}
          </PageLink>
        ));

      return <>{items}</>;
    }
    // Example: 1 2 ... 9 10
    else if (page === 1 || page === pages) {
      return (
        <>
          <PageLink number={1} to={(l: Location) => appendQueryParameter(l, { page: '1' })}>
            {formatMessage(gotoIntl, { pageNumber: 1 })}
          </PageLink>
          <PageLink number={2} to={(l: Location) => appendQueryParameter(l, { page: '2' })}>
            {formatMessage(gotoIntl, { pageNumber: 2 })}
          </PageLink>
          <Dots>{formatMessage(dotsIntl, { more: pages - 4 })}</Dots>
          <PageLink number={pages - 1} to={(l: Location) => appendQueryParameter(l, { page: (pages - 1).toString() })}>
            {formatMessage(gotoIntl, { pageNumber: pages - 1 })}
          </PageLink>
          <PageLink number={pages} to={(l: Location) => appendQueryParameter(l, { page: pages.toString() })}>
            {formatMessage(gotoIntl, { pageNumber: pages })}
          </PageLink>
        </>
      );
    }
    // Example: 1 2 3 4 ... 9 10
    else if (page === 2 || page === 3) {
      return (
        <>
          <PageLink number={1} to={(l: Location) => appendQueryParameter(l, { page: '1' })}>
            {formatMessage(gotoIntl, { pageNumber: 1 })}
          </PageLink>
          <PageLink number={2} to={(l: Location) => appendQueryParameter(l, { page: '2' })}>
            {formatMessage(gotoIntl, { pageNumber: 2 })}
          </PageLink>
          <PageLink number={3} to={(l: Location) => appendQueryParameter(l, { page: '3' })}>
            {formatMessage(gotoIntl, { pageNumber: 3 })}
          </PageLink>
          <PageLink number={4} to={(l: Location) => appendQueryParameter(l, { page: '4' })}>
            {formatMessage(gotoIntl, { pageNumber: 4 })}
          </PageLink>
          <Dots>{formatMessage(dotsIntl, { more: pages - 6 })}</Dots>
          <PageLink number={pages - 1} to={(l: Location) => appendQueryParameter(l, { page: (pages - 1).toString() })}>
            {formatMessage(gotoIntl, { pageNumber: pages - 1 })}
          </PageLink>
          <PageLink number={pages} to={(l: Location) => appendQueryParameter(l, { page: pages.toString() })}>
            {formatMessage(gotoIntl, { pageNumber: pages })}
          </PageLink>
        </>
      );
    }
    // Example: 1 2 ... 7 8 9 10
    else if (page === pages - 1 || page === pages - 2) {
      return (
        <>
          <PageLink number={1} to={(l: Location) => appendQueryParameter(l, { page: '1' })}>
            {formatMessage(gotoIntl, { pageNumber: 1 })}
          </PageLink>
          <PageLink number={2} to={(l: Location) => appendQueryParameter(l, { page: '2' })}>
            {formatMessage(gotoIntl, { pageNumber: 2 })}
          </PageLink>
          <Dots>{formatMessage(dotsIntl, { more: pages - 6 })}</Dots>
          <PageLink number={pages - 3} to={(l: Location) => appendQueryParameter(l, { page: (pages - 3).toString() })}>
            {formatMessage(gotoIntl, { pageNumber: pages - 3 })}
          </PageLink>
          <PageLink number={pages - 2} to={(l: Location) => appendQueryParameter(l, { page: (pages - 2).toString() })}>
            {formatMessage(gotoIntl, { pageNumber: pages - 2 })}
          </PageLink>
          <PageLink number={pages - 1} to={(l: Location) => appendQueryParameter(l, { page: (pages - 1).toString() })}>
            {formatMessage(gotoIntl, { pageNumber: pages - 1 })}
          </PageLink>
          <PageLink number={pages} to={(l: Location) => appendQueryParameter(l, { page: pages.toString() })}>
            {formatMessage(gotoIntl, { pageNumber: pages })}
          </PageLink>
        </>
      );
    }
    // Example: 1 ... 4 5 6 ... 10
    else {
      return (
        <>
          <PageLink number={1} to={(l: Location) => appendQueryParameter(l, { page: '1' })}>
            {formatMessage(gotoIntl, { pageNumber: 1 })}
          </PageLink>
          <Dots>{formatMessage(dotsIntl, { more: page - 2 })}</Dots>
          <PageLink number={page - 1} to={(l: Location) => appendQueryParameter(l, { page: (page - 1).toString() })}>
            {formatMessage(gotoIntl, { pageNumber: page - 1 })}
          </PageLink>
          <PageLink number={page} to={(l: Location) => appendQueryParameter(l, { page: page.toString() })}>
            {formatMessage(gotoIntl, { pageNumber: page })}
          </PageLink>
          <PageLink number={page + 1} to={(l: Location) => appendQueryParameter(l, { page: (page + 1).toString() })}>
            {formatMessage(gotoIntl, { pageNumber: page + 1 })}
          </PageLink>
          <Dots>{formatMessage(dotsIntl, { more: pages - (page + 2) })}</Dots>
          <PageLink number={pages} to={(l: Location) => appendQueryParameter(l, { page: pages.toString() })}>
            {formatMessage(gotoIntl, { pageNumber: pages })}
          </PageLink>
        </>
      );
    }
  };

  return (
    <Grid>
      <GridItem>
        <Pagination activePage={page} pageCount={pages}>
          {previous}
          {resolvePageLinks()}
          {next}
        </Pagination>
      </GridItem>
    </Grid>
  );
};

export default ListPagination;
