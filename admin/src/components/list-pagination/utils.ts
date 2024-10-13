export interface PageItem {
  type: 'PageItem';
  label: string;
  value: number;
  active: boolean;
}

export interface DotsItem {
  type: 'DotsItem';
  display: boolean;
  value: number;
  additional?: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type FirstFunctionResponse = PageItem[];

interface FirstFunctionParams {
  pages: number;
  activePage: number;
}

type FirstFunction = (params: FirstFunctionParams) => FirstFunctionResponse;

export const first: FirstFunction = function (params) {
  const { pages, activePage } = params;

  return Array.from({ length: clamp(pages, 1, 3) }, (x, i) => ({
    type: 'PageItem',
    label: (i + 1).toString(),
    value: i + 1,
    active: activePage === i + 1,
  }));
};

interface MiddleFunctionResponse {
  dotsStart: DotsItem;
  dotsEnd: DotsItem;
  items: PageItem[];
}

interface MiddleFunctionParams {
  pages: number;
  activePage: number;
}

type MiddleFunction = (params: MiddleFunctionParams) => MiddleFunctionResponse;

export const middle: MiddleFunction = function (params) {
  const { pages, activePage } = params;

  const dotsStart: DotsItem = {
    type: 'DotsItem',
    display: false,
    value: 0,
    additional: undefined,
  };

  const dotsEnd: DotsItem = {
    type: 'DotsItem',
    display: false,
    value: 1,
    additional: undefined,
  };

  if (pages < 4) return { dotsStart, dotsEnd, items: [] };

  const arr = Array.from({ length: pages }).map((_value, index) => index + 1);
  arr.splice(0, 3);
  const omega = arr.length > 6 ? arr.splice(arr.length - 3, 3) : [];

  const cursor = { start: 0, end: 0 };
  const midActiveIndex = arr.findIndex((value) => value === activePage);

  if (activePage < 4) {
    cursor.start = 0;
  } else if (midActiveIndex !== -1 && arr.length - 1 === midActiveIndex) {
    cursor.start = midActiveIndex - 2;
  } else if (midActiveIndex !== -1) {
    cursor.start = midActiveIndex !== 0 ? midActiveIndex - 1 : 0;
  } else {
    cursor.start = arr.length > 2 ? arr.length - 3 : 0;
  }

  cursor.end = cursor.start + 3;

  const items: PageItem[] = new Array();

  dotsStart.display = activePage > 5 && pages > 7;
  dotsStart.additional = dotsStart.display ? cursor.start : undefined;
  dotsEnd.display = omega.length > 0 && cursor.end < arr.length;
  dotsEnd.additional = omega.length > 0 && cursor.end < arr.length ? arr.length - cursor.end : undefined;

  items.push(
    ...arr.slice(cursor.start, cursor.end).map(
      (value) =>
        ({
          type: 'PageItem',
          label: value.toString(),
          value,
          active: activePage === value,
        }) as PageItem
    )
  );

  return {
    dotsStart,
    dotsEnd,
    items,
  };
};

type LastFunctionResponse = PageItem[];

interface LastFunctionParams {
  pages: number;
  activePage: number;
}

type LastFunction = (params: LastFunctionParams) => LastFunctionResponse;

export const last: LastFunction = function (params) {
  const { pages, activePage } = params;

  const remainder = clamp(pages - 6, 0, 3);

  return Array.from({ length: remainder }, (x, i) => {
    const value = pages - (remainder - (i + 1));
    return {
      type: 'PageItem',
      label: value.toString(),
      value,
      active: activePage === value,
    };
  });
};

interface CreatePaginationFunctionResponse {
  items: (PageItem | DotsItem)[];
}

interface CreatePaginationFunctionParams {
  pages: number;
  activePage: number;
}

type CreatePaginationFunction = (params: CreatePaginationFunctionParams) => CreatePaginationFunctionResponse;

export const createPagination: CreatePaginationFunction = function (params) {
  const { pages, activePage } = params;

  const f = first({ pages, activePage });
  const m = middle({ pages, activePage });
  const l = last({ pages, activePage });

  const result: CreatePaginationFunctionResponse = {
    items: [],
  };

  result.items.push(...f);
  result.items.push(m.dotsStart);
  result.items.push(...m.items);
  result.items.push(m.dotsEnd);
  result.items.push(...l);

  return result;
};
