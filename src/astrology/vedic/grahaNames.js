/**
 * Shared Navagraha display-name lookup — Phase 4A/4B.
 *
 * Pulled out into its own tiny module so both `vedicChart.js` (Phase 4A,
 * locked) and `bhava.js` (Phase 4B) can use the same capitalized display
 * names without importing from each other (avoids a circular import,
 * since `vedicChart.js` calls into `bhava.js` to build `chart.vedic.bhava`).
 */

export const GRAHA_DISPLAY_NAME = {
  sun: "Sun",
  moon: "Moon",
  mars: "Mars",
  mercury: "Mercury",
  jupiter: "Jupiter",
  venus: "Venus",
  saturn: "Saturn",
  rahu: "Rahu",
  ketu: "Ketu",
};

/** Canonical Navagraha key order — the single source of truth, re-exported by `vedicChart.js` (Phase 4A) so `bhava.js` (Phase 4B) can use it without a circular import between the two. */
export const NAVAGRAHA_ORDER = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];
