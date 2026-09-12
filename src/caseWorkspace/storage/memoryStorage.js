/**
 * A minimal Web Storage-compatible in-memory adapter — Phase 7.
 *
 * Used (a) automatically as the fallback when `window.localStorage` is
 * unavailable (SSR, a locked-down browser, or a plain Node/vitest
 * environment with no DOM), and (b) explicitly in tests, so each test
 * gets a fresh, fully isolated store without needing a jsdom dependency
 * or touching the real browser's localStorage.
 */
export function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    key(index) {
      return Array.from(map.keys())[index] ?? null;
    },
    get length() {
      return map.size;
    },
  };
}

/** `window.localStorage` when available and actually usable, otherwise a fresh in-memory fallback (never throws, never crashes the astrology calculator). */
export function getDefaultStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const probeKey = "__astro_workspace_storage_probe__";
      window.localStorage.setItem(probeKey, "1");
      window.localStorage.removeItem(probeKey);
      return window.localStorage;
    }
  } catch {
    // Private-browsing quota errors, disabled storage, etc. - fall through to memory.
  }
  return createMemoryStorage();
}
