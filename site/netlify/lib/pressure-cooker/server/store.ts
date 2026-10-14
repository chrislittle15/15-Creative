// A tiny key-value interface so the guard, cache and pool can be tested without Netlify.
// Production uses Netlify Blobs (runtime.ts); tests use the in-memory version below.
//
// What is stored, and nothing else: the day's total AI spend, recipes added to the shared
// pool, and cached responses from TheMealDB. No visitor data.

export interface KV {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

export function memoryKV(): KV & { dump(): Record<string, unknown> } {
  const data = new Map<string, string>();
  return {
    async get<T>(key: string) {
      const raw = data.get(key);
      return raw === undefined ? null : (JSON.parse(raw) as T);
    },
    async set(key, value) {
      data.set(key, JSON.stringify(value));
    },
    async list(prefix) {
      return [...data.keys()].filter((k) => k.startsWith(prefix));
    },
    dump() {
      return Object.fromEntries([...data].map(([k, v]) => [k, JSON.parse(v)]));
    },
  };
}
