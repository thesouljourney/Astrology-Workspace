/**
 * Tiny safe JSON<->storage helpers shared by both repositories - Phase 7.
 *
 * "A corrupted local record must not crash the astrology calculator"
 * (brief Part 21) is enforced in exactly one place: `readJson()` never
 * throws - a missing key, invalid JSON, or a value that fails the
 * caller's own shape check all resolve to `fallback`.
 */

export function readJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}
