/**
 * The small subset of Jest/Vitest-style assertions these tests use, on top of
 * node:assert. Keeps the test suite on Node's built-in runner, so no
 * non-permissively licensed test tooling is needed.
 */
import { AssertionError } from "node:assert";
import { inspect } from "node:util";

const ASYMMETRIC = Symbol("asymmetric");

interface Asymmetric {
  [ASYMMETRIC]: true;
  match(value: unknown): boolean;
  [inspect.custom](): string;
}

function isAsymmetric(value: unknown): value is Asymmetric {
  return typeof value === "object" && value !== null && ASYMMETRIC in value;
}

function equals(actual: unknown, expected: unknown, partial: boolean): boolean {
  if (isAsymmetric(expected)) return expected.match(actual);
  if (Object.is(actual, expected)) return true;
  if (actual instanceof Date || expected instanceof Date) {
    return actual instanceof Date && expected instanceof Date && actual.getTime() === expected.getTime();
  }
  if (Array.isArray(expected)) {
    return Array.isArray(actual) && actual.length === expected.length && expected.every((e, i) => equals(actual[i], e, partial));
  }
  if (typeof expected === "object" && expected !== null) {
    if (typeof actual !== "object" || actual === null || Array.isArray(actual)) return false;
    const exp = expected as Record<string, unknown>;
    const act = actual as Record<string, unknown>;
    const keys = Object.keys(exp).filter((k) => exp[k] !== undefined);
    if (!partial && Object.keys(act).filter((k) => act[k] !== undefined).length !== keys.length) return false;
    return keys.every((k) => equals(act[k], exp[k], partial));
  }
  return false;
}

const show = (v: unknown) => inspect(v, { depth: 6, breakLength: 120 });

export function expect(actual: unknown, label?: string) {
  const fail = (message: string, expected?: unknown): never => {
    throw new AssertionError({ message: `${label ? `[${label}] ` : ""}${message}`, actual, expected });
  };

  return {
    toBe(expected: unknown) {
      if (!Object.is(actual, expected)) fail(`expected ${show(actual)} to be ${show(expected)}`, expected);
    },
    toEqual(expected: unknown) {
      if (!equals(actual, expected, false)) fail(`expected ${show(actual)} to equal ${show(expected)}`, expected);
    },
    toMatchObject(expected: unknown) {
      if (!equals(actual, expected, true)) fail(`expected ${show(actual)} to match ${show(expected)}`, expected);
    },
    toHaveLength(length: number) {
      const len = (actual as { length?: number } | null)?.length;
      if (len !== length) fail(`expected length ${length}, got ${len}: ${show(actual)}`, length);
    },
    toContain(item: unknown) {
      const ok = typeof actual === "string" ? actual.includes(String(item)) : Array.isArray(actual) && actual.includes(item);
      if (!ok) fail(`expected ${show(actual)} to contain ${show(item)}`, item);
    },
    toBeGreaterThan(n: number) {
      if (typeof actual !== "number" || !(actual > n)) fail(`expected ${show(actual)} to be greater than ${n}`, n);
    },
    toBeNull() {
      if (actual !== null) fail(`expected ${show(actual)} to be null`, null);
    },
    toBeDefined() {
      if (actual === undefined) fail("expected value to be defined");
    },
    not: {
      toContain(item: unknown) {
        const has = typeof actual === "string" ? actual.includes(String(item)) : Array.isArray(actual) && actual.includes(item);
        if (has) fail(`expected ${show(actual)} not to contain ${show(item)}`, item);
      },
    },
    rejects: {
      async toThrow(pattern: RegExp) {
        try {
          await (actual as Promise<unknown>);
        } catch (err) {
          const message = (err as Error)?.message ?? String(err);
          if (!pattern.test(message)) fail(`expected rejection matching ${pattern}, got "${message}"`, pattern);
          return;
        }
        fail(`expected promise to reject with ${pattern}, but it resolved`, pattern);
      },
    },
    resolves: {
      async toBeDefined() {
        if ((await (actual as Promise<unknown>)) === undefined) fail("expected promise to resolve to a defined value");
      },
    },
  };
}

expect.arrayContaining = (items: unknown[]): Asymmetric => ({
  [ASYMMETRIC]: true,
  match: (value) => Array.isArray(value) && items.every((item) => value.some((v) => equals(v, item, false))),
  [inspect.custom]: () => `ArrayContaining ${show(items)}`,
});
