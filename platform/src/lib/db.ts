import pg from "pg";

// Return DATE columns as "YYYY-MM-DD" strings instead of local-midnight Date objects.
pg.types.setTypeParser(1082, (value: string) => value);

export type Row = Record<string, any>;

/** Marks a value to be sent as JSON (otherwise pg sends JS arrays as Postgres arrays). */
class JsonParam {
  constructor(readonly value: unknown) {}
}

/**
 * Tagged-template queries over pg: interpolated values always become bound
 * parameters ($1, $2, ...), never SQL text.
 *   const rows = await db<{ id: string }[]>`select id from camps where slug = ${slug}`;
 */
export interface Db {
  <T extends readonly unknown[] = Row[]>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  json(value: unknown): JsonParam;
  /** Raw SQL. Without params, may contain several statements (used by migrations). */
  unsafe<T extends readonly unknown[] = Row[]>(text: string, params?: unknown[]): Promise<T>;
}

export interface Sql extends Db {
  begin<R>(fn: (tx: Db) => Promise<R>): Promise<R>;
  end(): Promise<void>;
}

type Runner = (text: string, params?: unknown[]) => Promise<pg.QueryResult>;

function compile(strings: TemplateStringsArray, values: unknown[]) {
  let text = strings[0]!;
  const params = values.map((v, i) => {
    text += `$${i + 1}${strings[i + 1]}`;
    return v instanceof JsonParam ? JSON.stringify(v.value) : v;
  });
  return { text, params };
}

function makeDb(run: Runner): Db {
  const db = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const { text, params } = compile(strings, values);
    return (await run(text, params)).rows;
  }) as Db;
  db.json = (value) => new JsonParam(value);
  db.unsafe = (async (text: string, params?: unknown[]) => {
    const result = await run(text, params);
    return Array.isArray(result) ? (result.at(-1)?.rows ?? []) : result.rows;
  }) as Db["unsafe"];
  return db;
}

export function createSql(url: string, options: { max?: number } = {}): Sql {
  const pool = new pg.Pool({
    connectionString: url,
    max: options.max ?? 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });
  pool.on("error", () => {
    // An idle client lost its connection; the pool replaces it on next use.
  });

  const sql = makeDb((text, params) => (params ? pool.query(text, params) : pool.query(text))) as Sql;

  sql.begin = async (fn) => {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const tx = makeDb((text, params) => (params ? client.query(text, params) : client.query(text)));
      const result = await fn(tx);
      await client.query("commit");
      return result;
    } catch (err) {
      await client.query("rollback").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  };
  sql.end = () => pool.end();
  return sql;
}

const clients = new Map<string, Sql>();

/**
 * One pool per URL, reused across warm serverless invocations. On Supabase use
 * the transaction pooler URL (port 6543); pg only uses unnamed statements, which
 * the pooler supports.
 */
export function getSql(url: string, options: { max?: number } = {}): Sql {
  let client = clients.get(url);
  if (!client) {
    client = createSql(url, options);
    clients.set(url, client);
  }
  return client;
}

/** Postgres RAISE EXCEPTION messages used by the capacity functions, e.g. "group_full:boys". */
export function capacityError(err: unknown): { kind: string; subject: string } | null {
  const e = err as { code?: string; message?: string };
  if (e?.code === "P0001" && typeof e.message === "string") {
    const match = /^(group_full|group_closed|unknown_group|session_full):(.+)$/.exec(e.message);
    if (match) return { kind: match[1]!, subject: match[2]! };
  }
  return null;
}
