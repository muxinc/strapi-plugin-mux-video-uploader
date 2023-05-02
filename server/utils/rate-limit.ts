type ForEachRateLimitCallback<T> = (item: T, index: number, array: Array<T>) => void;

interface ForEachRateLimitOptions {
  count?: number;
  interval?: number;
}

const forEachRateLimit = <T>(array: Array<T>, fn: ForEachRateLimitCallback<T>, options?: ForEachRateLimitOptions) => {
  const { count, interval } = Object.assign(
    {
      count: 1,
      interval: 1000,
    },
    options
  );

  const state = { startIndex: 0 };

  const fire = () => {
    const items = array.slice(state.startIndex, state.startIndex + count);

    items.forEach(fn);

    if (items.length === 0) return;

    state.startIndex += count;

    setTimeout(fire, interval);
  };

  fire();
};

export { forEachRateLimit };
