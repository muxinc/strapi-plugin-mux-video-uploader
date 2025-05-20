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
type FirstFunctionResponse = PageItem[];
interface FirstFunctionParams {
    pages: number;
    activePage: number;
}
type FirstFunction = (params: FirstFunctionParams) => FirstFunctionResponse;
export declare const first: FirstFunction;
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
export declare const middle: MiddleFunction;
type LastFunctionResponse = PageItem[];
interface LastFunctionParams {
    pages: number;
    activePage: number;
}
type LastFunction = (params: LastFunctionParams) => LastFunctionResponse;
export declare const last: LastFunction;
interface CreatePaginationFunctionResponse {
    items: (PageItem | DotsItem)[];
}
interface CreatePaginationFunctionParams {
    pages: number;
    activePage: number;
}
type CreatePaginationFunction = (params: CreatePaginationFunctionParams) => CreatePaginationFunctionResponse;
export declare const createPagination: CreatePaginationFunction;
export {};
