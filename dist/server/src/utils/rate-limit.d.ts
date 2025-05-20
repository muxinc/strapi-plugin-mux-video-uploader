type ForEachRateLimitCallback<T> = (item: T, index: number, array: Array<T>) => void;
interface ForEachRateLimitOptions {
    count?: number;
    interval?: number;
}
declare const forEachRateLimit: <T>(array: Array<T>, fn: ForEachRateLimitCallback<T>, options?: ForEachRateLimitOptions) => void;
export { forEachRateLimit };
