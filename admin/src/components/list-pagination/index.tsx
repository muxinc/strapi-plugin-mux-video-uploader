import React from 'react';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { Dots, NextLink, PageLink, Pagination, PreviousLink } from '@strapi/design-system/Pagination';

import { appendQueryParameter } from '../../utils/url';

interface Props {
  page?: number;
  pages?: number;
}

const ListPagination = (props: Props) => {
  const { page, pages } = props;

  if (page === undefined || pages === undefined) return null;
  
  const previous = page !== 1
    && pages > 9
    && <PreviousLink to={(l: Location) => appendQueryParameter(l, { page: (page - 1).toString() })}>Previous page</PreviousLink>;

  const next = page != pages
    && pages > 9
    && <NextLink to={(l: Location) => appendQueryParameter(l, { page: (page + 1).toString() })}>Next page</NextLink>;

  const resolvePageLinks = () => {
    // Example: 1 2 3 4 5 6 7 8 9
    if (pages <= 9) {
      const items = Array(pages).fill(null).map((_n, index) => (
        <PageLink
          key={index}
          number={index + 1}
          to={(l: Location) => appendQueryParameter(l, { page: (index + 1).toString() })}
        >
          Go to page {index + 1}
        </PageLink>
      ));

      return <>{items}</>
    }
    // Example: 1 2 ... 9 10
    else if (page === 1 || page === pages) {
      const more = page - 4;

      return (
        <>
          <PageLink
            number={1}
            to={(l: Location) => appendQueryParameter(l, { page: '1' })}
          >
            Go to page 1
          </PageLink>
          <PageLink
            number={2}
            to={(l: Location) => appendQueryParameter(l, { page: '2' })}
          >
            Go to page 2
          </PageLink>
          <Dots>And {more} other link{more > 1 ? 's' : ''}</Dots>
          <PageLink
            number={pages - 1}
            to={(l: Location) => appendQueryParameter(l, { page: (pages - 1).toString() })}
          >
            Go to page {pages - 1}
          </PageLink>
          <PageLink
            number={pages}
            to={(l: Location) => appendQueryParameter(l, { page: pages.toString() })}
          >
            Go to page {pages}
          </PageLink>
        </>
      );
    }
    // Example: 1 2 3 4 ... 9 10
    else if (page === 2 || page === 3) {
      const more = pages - 6;
      return (
        <>
          <PageLink number={1} to={(l: Location) => appendQueryParameter(l, { page: '1' })}>
            Go to page 1
          </PageLink>
          <PageLink number={2} to={(l: Location) => appendQueryParameter(l, { page: '2' })}>
            Go to page 2
          </PageLink>
          <PageLink number={3} to={(l: Location) => appendQueryParameter(l, { page: '3' })}>
            Go to page 3
          </PageLink>
          <PageLink number={4} to={(l: Location) => appendQueryParameter(l, { page: '4' })}>
            Go to page 4
          </PageLink>
          <Dots>And {more} other link{more > 1 ? 's' : ''}</Dots>
          <PageLink
            number={pages - 1}
            to={(l: Location) => appendQueryParameter(l, { page: (pages - 1).toString() })}
          >
            Go to page {pages - 1}
          </PageLink>
          <PageLink
            number={pages}
            to={(l: Location) => appendQueryParameter(l, { page: (pages).toString() })}
          >
            Go to page {pages}
          </PageLink>
        </>
      );
    }
    // Example: 1 2 ... 7 8 9 10
    else if (page === pages - 1 || page === pages - 2) {
      const more = pages - 6;
      return (
        <>
          <PageLink number={1} to={(l: Location) => appendQueryParameter(l, { page: '1' })}>
            Go to page 1
          </PageLink>
          <PageLink number={2} to={(l: Location) => appendQueryParameter(l, { page: '2' })}>
            Go to page 2
          </PageLink>
          <Dots>And {more} other link{more > 1 ? 's' : ''}</Dots>
          <PageLink
            number={pages - 3}
            to={(l: Location) => appendQueryParameter(l, { page: (pages - 3).toString() })}
          >
            Go to page {pages - 3}
          </PageLink>
          <PageLink
            number={pages - 2}
            to={(l: Location) => appendQueryParameter(l, { page: (pages - 2).toString() })}
          >
            Go to page {pages - 2}
          </PageLink>
          <PageLink
            number={pages - 1}
            to={(l: Location) => appendQueryParameter(l, { page: (pages - 1).toString() })}
          >
            Go to page {pages - 1}
          </PageLink>
          <PageLink
            number={pages}
            to={(l: Location) => appendQueryParameter(l, { page: (pages).toString() })}
          >
            Go to page {pages}
          </PageLink>
        </>
      );
    }
    // Example: 1 ... 4 5 6 ... 10
    else {
      const moreOne = page - 2;
      const moreTwo = (page - pages - 2);
      return (
        <>
          <PageLink number={1} to={(l: Location) => appendQueryParameter(l, { page: '1' })}>
            Go to page 1
          </PageLink>
          <Dots>And {moreOne} other link{moreOne > 1 ? 's' : ''}</Dots>
          <PageLink
            number={page - 1}
            to={(l: Location) => appendQueryParameter(l, { page: (page - 1).toString() })}
          >
            Go to page {page - 1}
          </PageLink>
          <PageLink
            number={page}
            to={(l: Location) => appendQueryParameter(l, { page: page.toString() })}
          >
            Go to page {page}
          </PageLink>
          <PageLink
            number={page + 1}
            to={(l: Location) => appendQueryParameter(l, { page: (page + 1).toString() })}
          >
            Go to page {page + 1}
          </PageLink>
          <Dots>And {moreTwo} other link{moreTwo > 1 ? 's' : ''}</Dots>
          <PageLink
            number={pages}
            to={(l: Location) => appendQueryParameter(l, { page: pages.toString() })}
          >
            Go to page {pages}
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
