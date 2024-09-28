import React from 'react';
import { useIntl } from 'react-intl';
import { 
  Dots,
  Grid,
  NextLink,
  PageLink,
  Pagination,
  PreviousLink
} from '@strapi/design-system';

import { appendQueryParameter } from '../../utils/url';
import { getTranslation } from '../../utils/getTranslation';

interface Props {
  page?: number;
  pages?: number;
}

const ListPagination = (props: Props) => {
  const { page, pages } = props;

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
    defaultMessage: 'And {more} other links',
  };

  if (page === undefined || pages === undefined) return null;

  const { location } = window;

  const previous = page !== 1 && pages > 9 && (
    <PreviousLink href={appendQueryParameter(location, { page: (page - 1).toString() }).href}>
      {formatMessage(prevIntl)}
    </PreviousLink>
  );

  const next = page != pages && pages > 9 && (
    <NextLink href={appendQueryParameter(location, { page: (page + 1).toString() }).href}>
      {formatMessage(nextIntl)}
    </NextLink>
  );

  const resolvePageLinks = () => {
    const { location } = window;

    // Example: 1 2 3 4 5 6 7 8 9
    if (pages <= 9) {
      const items = Array(pages)
        .fill(null)
        .map((_n, index) => (
          <PageLink
            key={index}
            number={index + 1}
            href={appendQueryParameter(location, { page: (index + 1).toString() }).href}
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
          <PageLink number={1} href={appendQueryParameter(location, { page: '1' }).href}>
            {formatMessage(gotoIntl, { pageNumber: 1 })}
          </PageLink>
          <PageLink number={2} href={appendQueryParameter(location, { page: '2' }).href}>
            {formatMessage(gotoIntl, { pageNumber: 2 })}
          </PageLink>
          <Dots>{formatMessage(dotsIntl, { more: pages - 4 })}</Dots>
          <PageLink number={pages - 1} href={appendQueryParameter(location, { page: (pages - 1).toString() }).href}>
            {formatMessage(gotoIntl, { pageNumber: pages - 1 })}
          </PageLink>
          <PageLink number={pages} href={appendQueryParameter(location, { page: pages.toString() }).href}>
            {formatMessage(gotoIntl, { pageNumber: pages })}
          </PageLink>
        </>
      );
    }
    // Example: 1 2 3 4 ... 9 10
    else if (page === 2 || page === 3) {
      return (
        <>
          <PageLink number={1} href={appendQueryParameter(location, { page: '1' }).href}>
            {formatMessage(gotoIntl, { pageNumber: 1 })}
          </PageLink>
          <PageLink number={2} href={appendQueryParameter(location, { page: '2' }).href}>
            {formatMessage(gotoIntl, { pageNumber: 2 })}
          </PageLink>
          <PageLink number={3} href={appendQueryParameter(location, { page: '3' }).href}>
            {formatMessage(gotoIntl, { pageNumber: 3 })}
          </PageLink>
          <PageLink number={4} href={appendQueryParameter(location, { page: '4' }).href}>
            {formatMessage(gotoIntl, { pageNumber: 4 })}
          </PageLink>
          <Dots>{formatMessage(dotsIntl, { more: pages - 6 })}</Dots>
          <PageLink number={pages - 1} href={appendQueryParameter(location, { page: (pages - 1).toString() }).href}>
            {formatMessage(gotoIntl, { pageNumber: pages - 1 })}
          </PageLink>
          <PageLink number={pages} href={appendQueryParameter(location, { page: pages.toString() }).href}>
            {formatMessage(gotoIntl, { pageNumber: pages })}
          </PageLink>
        </>
      );
    }
    // Example: 1 2 ... 7 8 9 10
    else if (page === pages - 1 || page === pages - 2) {
      return (
        <>
          <PageLink number={1} href={appendQueryParameter(location, { page: '1' }).href}>
            {formatMessage(gotoIntl, { pageNumber: 1 })}
          </PageLink>
          <PageLink number={2} href={appendQueryParameter(location, { page: '2' }).href}>
            {formatMessage(gotoIntl, { pageNumber: 2 })}
          </PageLink>
          <Dots>{formatMessage(dotsIntl, { more: pages - 6 })}</Dots>
          <PageLink number={pages - 3} href={appendQueryParameter(location, { page: (pages - 3).toString() }).href}>
            {formatMessage(gotoIntl, { pageNumber: pages - 3 })}
          </PageLink>
          <PageLink number={pages - 2} href={appendQueryParameter(location, { page: (pages - 2).toString() }).href}>
            {formatMessage(gotoIntl, { pageNumber: pages - 2 })}
          </PageLink>
          <PageLink number={pages - 1} href={appendQueryParameter(location, { page: (pages - 1).toString() }).href}>
            {formatMessage(gotoIntl, { pageNumber: pages - 1 })}
          </PageLink>
          <PageLink number={pages} href={appendQueryParameter(location, { page: pages.toString() }).href}>
            {formatMessage(gotoIntl, { pageNumber: pages })}
          </PageLink>
        </>
      );
    }
    // Example: 1 ... 4 5 6 ... 10
    else {
      return (
        <>
          <PageLink number={1} href={appendQueryParameter(location, { page: '1' }).href}>
            {formatMessage(gotoIntl, { pageNumber: 1 })}
          </PageLink>
          <Dots>{formatMessage(dotsIntl, { more: page - 2 })}</Dots>
          <PageLink number={page - 1} href={appendQueryParameter(location, { page: (page - 1).toString() }).href}>
            {formatMessage(gotoIntl, { pageNumber: page - 1 })}
          </PageLink>
          <PageLink number={page} href={appendQueryParameter(location, { page: page.toString() }).href}>
            {formatMessage(gotoIntl, { pageNumber: page })}
          </PageLink>
          <PageLink number={page + 1} href={appendQueryParameter(location, { page: (page + 1).toString() }).href}>
            {formatMessage(gotoIntl, { pageNumber: page + 1 })}
          </PageLink>
          <Dots>{formatMessage(dotsIntl, { more: pages - (page + 2) })}</Dots>
          <PageLink number={pages} href={appendQueryParameter(location, { page: pages.toString() }).href}>
            {formatMessage(gotoIntl, { pageNumber: pages })}
          </PageLink>
        </>
      );
    }
  };

  return (
    <Grid.Root>
      <Grid.Item>
        <Pagination activePage={page} pageCount={pages}>
          {previous}
          {resolvePageLinks()}
          {next}
        </Pagination>
      </Grid.Item>
    </Grid.Root>
  );
};

export default ListPagination;
