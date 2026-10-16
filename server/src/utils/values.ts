export const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** For ids and statuses that reach a database filter: anything but a string could read as a query operator. */
export const nonEmptyString = (value: unknown) => (typeof value === 'string' && value !== '' ? value : undefined);

export const compact = <T extends object>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
