import { vi } from 'vitest';

// This file must not import plugin code: `test/setup.ts` loads it before the global exists, and some
// plugin modules read `strapi` as soon as they are imported.

export type Row = Record<string, any> & { id: number };
type Where = Record<string, any>;
type OrderBy = string | Record<string, 'asc' | 'desc'> | Array<string | Record<string, 'asc' | 'desc'>>;

interface FindParams {
  where?: Where;
  filters?: Where;
  orderBy?: OrderBy;
  limit?: number;
  offset?: number;
  populate?: unknown;
  select?: unknown;
}

const clone = <T>(value: T): T => (value === undefined ? value : structuredClone(value));

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

const comparable = (value: unknown) => (value instanceof Date ? value.getTime() : value);

function matchesCondition(value: unknown, condition: unknown): boolean {
  if (!isPlainObject(condition)) return comparable(value) === comparable(condition);

  return Object.entries(condition).every(([operator, operand]) => {
    const isNull = value === null || value === undefined;
    switch (operator) {
      case '$eq':
        return comparable(value) === comparable(operand);
      case '$ne':
        return comparable(value) !== comparable(operand);
      case '$in':
        return (operand as unknown[]).includes(value);
      case '$notIn':
        return !(operand as unknown[]).includes(value);
      case '$null':
        return operand ? isNull : !isNull;
      case '$notNull':
        return operand ? !isNull : isNull;
      case '$lt':
        return !isNull && (comparable(value) as number) < (comparable(operand) as number);
      case '$lte':
        return !isNull && (comparable(value) as number) <= (comparable(operand) as number);
      case '$gt':
        return !isNull && (comparable(value) as number) > (comparable(operand) as number);
      case '$gte':
        return !isNull && (comparable(value) as number) >= (comparable(operand) as number);
      case '$containsi':
        return String(value ?? '')
          .toLowerCase()
          .includes(String(operand).toLowerCase());
      default:
        throw new Error(`Fake db: unsupported operator ${operator}`);
    }
  });
}

function matchesWhere(row: Row, where: Where | undefined): boolean {
  if (!where) return true;

  return Object.entries(where).every(([key, condition]) => {
    if (key === '$and') return (condition as Where[]).every((part) => matchesWhere(row, part));
    if (key === '$or') return (condition as Where[]).some((part) => matchesWhere(row, part));
    if (key === '$not') return !matchesWhere(row, condition);
    return matchesCondition(row[key], condition);
  });
}

function sortRows(rows: Row[], orderBy: OrderBy | undefined): Row[] {
  if (!orderBy) return rows;

  const keys: Array<[string, 'asc' | 'desc']> = (Array.isArray(orderBy) ? orderBy : [orderBy]).flatMap(
    (entry): Array<[string, 'asc' | 'desc']> => (typeof entry === 'string' ? [[entry, 'asc']] : Object.entries(entry))
  );

  return [...rows].sort((a, b) => {
    for (const [key, direction] of keys) {
      const left = comparable(a[key]) as any;
      const right = comparable(b[key]) as any;
      if (left === right) continue;
      const order =
        left === null || left === undefined ? -1 : right === null || right === undefined ? 1 : left < right ? -1 : 1;
      return direction === 'desc' ? -order : order;
    }
    return 0;
  });
}

function createFakeDb() {
  const tables = new Map<string, Row[]>();
  let nextId = 1;

  const table = (uid: string) => {
    if (!tables.has(uid)) tables.set(uid, []);
    return tables.get(uid)!;
  };

  const find = (uid: string, params: FindParams = {}) => {
    const where =
      params.where && params.filters ? { $and: [params.where, params.filters] } : (params.where ?? params.filters);
    const rows = sortRows(
      table(uid).filter((row) => matchesWhere(row, where)),
      params.orderBy
    );
    const offset = params.offset ?? 0;
    return params.limit === undefined || params.limit < 0
      ? rows.slice(offset)
      : rows.slice(offset, offset + params.limit);
  };

  const query = (uid: string) => ({
    findOne: vi.fn(async (params: FindParams | number | string = {}) => {
      // `findOne(id)` is not part of the query engine's API, and it ignores the argument. Mirror that.
      const normalized = typeof params === 'object' ? params : {};
      return clone(find(uid, { ...normalized, limit: 1 })[0] ?? null);
    }),
    findMany: vi.fn(async (params: FindParams = {}) => clone(find(uid, params))),
    count: vi.fn(async (params: FindParams = {}) => find(uid, { ...params, limit: undefined, offset: 0 }).length),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const row = { ...clone(data), id: nextId++ } as Row;
      table(uid).push(row);
      return clone(row);
    }),
    update: vi.fn(async ({ where, data }: { where: Where; data: Record<string, unknown> }) => {
      const row = table(uid).find((candidate) => matchesWhere(candidate, where));
      if (!row) return null;
      Object.assign(row, clone(data));
      return clone(row);
    }),
    updateMany: vi.fn(async ({ where, data }: { where: Where; data: Record<string, unknown> }) => {
      const rows = table(uid).filter((candidate) => matchesWhere(candidate, where));
      rows.forEach((row) => Object.assign(row, clone(data)));
      return { count: rows.length };
    }),
    delete: vi.fn(async ({ where }: { where: Where }) => {
      const rows = table(uid);
      const index = rows.findIndex((candidate) => matchesWhere(candidate, where));
      if (index === -1) return null;
      return clone(rows.splice(index, 1)[0]);
    }),
    deleteMany: vi.fn(async ({ where }: { where: Where }) => {
      const rows = table(uid);
      const kept = rows.filter((candidate) => !matchesWhere(candidate, where));
      const count = rows.length - kept.length;
      tables.set(uid, kept);
      return { count };
    }),
  });

  const queries = new Map<string, ReturnType<typeof query>>();

  return {
    /** The same spied query object for every call with one uid, so tests can assert on it. */
    query: (uid: string) => {
      if (!queries.has(uid)) queries.set(uid, query(uid));
      return queries.get(uid)!;
    },
    /** Inserts rows directly, bypassing the spies. */
    seed: (uid: string, rows: Array<Record<string, unknown>>) =>
      rows.map((data) => {
        const row = { ...clone(data), id: (data.id as number | undefined) ?? nextId++ } as Row;
        nextId = Math.max(nextId, row.id + 1);
        table(uid).push(row);
        return clone(row);
      }),
    /** The stored rows, as a copy. */
    rows: (uid: string) => clone(table(uid)),
  };
}

export type FakeDb = ReturnType<typeof createFakeDb>;

export const DEFAULT_PLUGIN_CONFIG = {
  accessTokenId: 'test-token-id',
  secretKey: 'test-token-secret',
  webhookSigningSecret: 'test-webhook-secret',
  playbackSigningId: '',
  playbackSigningSecret: '',
  defaultDirectiveIds: [] as string[],
};

type ServiceFactory = (context: { strapi: unknown }) => unknown;

export interface InstallOptions {
  /** Merged over `DEFAULT_PLUGIN_CONFIG`. */
  config?: Partial<typeof DEFAULT_PLUGIN_CONFIG> & Record<string, unknown>;
  /** `strapi.config.get('middlewares')`. */
  middlewares?: unknown;
  /** The plugin's service factories, usually `server/src/services`. Instantiated on first use. */
  services?: Record<string, ServiceFactory>;
  /** Services of other plugins, by plugin name then service name. */
  pluginServices?: Record<string, Record<string, unknown>>;
}

/**
 * A fake global `strapi`: an in-memory `db.query`, spied `log`, the plugin's config and its services.
 * Install a fresh one per test.
 */
export function installFakeStrapi(options: InstallOptions = {}) {
  const db = createFakeDb();
  const pluginConfig = { ...DEFAULT_PLUGIN_CONFIG, ...options.config };
  const config: Record<string, unknown> = {
    middlewares: options.middlewares,
    'plugin::mux-video-uploader': pluginConfig,
  };
  const instances = new Map<string, unknown>();

  const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

  const fake: Record<string, any> = {
    db: { query: db.query },
    /** Just what the plugin's own document calls need, on top of the same store. */
    documents: (uid: string) => ({
      create: ({ data }: { data: Record<string, unknown> }) => db.query(uid).create({ data }),
      findMany: (params: FindParams = {}) => db.query(uid).findMany(params),
      count: (params: FindParams = {}) => db.query(uid).count(params),
    }),
    log,
    config: {
      server: { url: 'http://localhost:1337' },
      get: vi.fn((key: string, fallback?: unknown) => (key in config ? config[key] : fallback)),
      set: vi.fn((key: string, value: unknown) => {
        config[key] = value;
      }),
    },
    plugins: { 'users-permissions': {} },
    plugin: vi.fn((name: string) => ({
      service: (serviceName: string) => {
        if (name !== 'mux-video-uploader') return options.pluginServices?.[name]?.[serviceName];

        if (!instances.has(serviceName)) {
          const factory = options.services?.[serviceName];
          if (!factory) throw new Error(`Fake strapi: no service "${serviceName}" was installed`);
          instances.set(serviceName, factory({ strapi: fake }));
        }
        return instances.get(serviceName);
      },
    })),
    admin: {
      services: {
        permission: { actionProvider: { registerMany: vi.fn(async () => undefined) } },
      },
    },
  };

  (globalThis as any).strapi = fake;

  return { strapi: fake, db, log, pluginConfig, config };
}

export type FakeStrapi = ReturnType<typeof installFakeStrapi>;
