/**
 * Chart fingerprinting — Phase 7.
 *
 * THIS FILE PERFORMS NO ASTROLOGY CALCULATION. It reads a handful of
 * already-locked identifiers off an already-computed `chart` (Phase 1
 * `chart.meta`, Phase 3A `chart.classical.meta`, Phase 4A/4B/4D
 * `chart.vedic.meta`) and hashes them deterministically, purely to
 * detect when astrology-relevant input or a locked calculation
 * convention has changed since a Case's notes were written.
 *
 * `deriveCalculationProfile(chart)` intentionally reuses each phase's
 * OWN already-exported convention identifiers rather than inventing a
 * parallel "Phase 7 opinion" of what convention is in effect — e.g.
 * `chart.classical.meta.rulershipSystem` (locked since Phase 3A), never
 * a second hard-coded "traditional" string that could silently drift
 * out of sync with the real calculation.
 */

/** Fields pulled from the chart that determine a Case's chartFingerprint. Anything NOT listed here (caseName, notes, timestamps, UI state) must never affect the fingerprint. */
export function deriveCalculationProfile(chart) {
  return {
    westernZodiac: chart.meta.zodiacType,
    westernHouseSystem: chart.meta.houseSystem,
    westernNodeType: chart.meta.nodeType,
    westernLilithType: chart.meta.lilithType,

    classicalRulershipSystem: chart.classical.meta.rulershipSystem,
    classicalTriplicitySystem: chart.classical.meta.triplicitySystem,
    classicalTermSystem: chart.classical.meta.termSystem,
    classicalFaceSystem: chart.classical.meta.faceSystem,

    vedicAyanamsha: chart.vedic.meta.ayanamshaImplementation,
    vedicBhavaSystem: chart.vedic.meta.bhavaSystem,
    vedicNodeType: chart.vedic.meta.vedicNodeType,
  };
}

/**
 * cyrb53 — a small, public-domain, non-cryptographic, deterministic
 * string hash (fixed seed = 0). Chosen over Web Crypto's
 * `crypto.subtle.digest` because that API is async (Promise-based) and
 * this fingerprint must be computable synchronously in both a browser
 * and a plain Node/vitest environment with zero new dependency. This is
 * a change-detection fingerprint, not a security boundary, so a
 * non-cryptographic hash is an appropriate and documented choice.
 */
function cyrb53(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/** Canonical, deterministic JSON: keys sorted recursively so key order in the source object can never change the resulting string. */
function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * The exact, exhaustive set of fingerprint inputs (brief Part 15):
 * birth date/time/latitude/longitude/timezone, plus every
 * `deriveCalculationProfile()` field. Deliberately excludes caseName,
 * notes, timestamps, UI state, and display preferences.
 */
function fingerprintPayload(birthData, calculationProfile) {
  return {
    birthDate: birthData.date,
    birthTime: birthData.time,
    latitude: Number(birthData.latitude),
    longitude: Number(birthData.longitude),
    timezone: birthData.timezone,
    ...calculationProfile,
  };
}

/**
 * Computes the deterministic chartFingerprint for a Case's birthData
 * against an already-computed `chart`. Same birthData + same locked
 * calculation conventions => same fingerprint, always - changing only
 * caseName/notes/timestamps never touches this function's inputs.
 */
export function computeChartFingerprint(birthData, chart) {
  const calculationProfile = deriveCalculationProfile(chart);
  const payload = fingerprintPayload(birthData, calculationProfile);
  return `fp1_${cyrb53(canonicalize(payload))}`;
}
