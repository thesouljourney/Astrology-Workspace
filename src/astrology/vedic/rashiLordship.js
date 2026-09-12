/**
 * Traditional Jyotish Rashi (sign) lordship — Phase 4B.
 *
 * The classical seven-planet lordship scheme, unchanged since antiquity
 * and used uniformly across traditional Jyotish texts and software: each
 * of the 12 Rashis is ruled by exactly one of the seven classical grahas
 * (Sun through Saturn). Rahu and Ketu are shadow points (chhaya grahas)
 * and are never assigned Rashi lordship in traditional Jyotish — they
 * receive Bhava (house) placement like any other graha, but never own a
 * house. This mirrors this project's own Classical (Western
 * traditional/Hellenistic) rulership table in spirit — modern
 * outer-planet "rulerships" (Uranus/Neptune/Pluto) are never used here,
 * exactly as this project's Classical engine already excludes them from
 * traditional dignity.
 *
 * Keyed by the same lowercase Rashi `key` values as `rashi.js`'s
 * `RASHIS` table; valued by the same lowercase Graha keys used
 * throughout `vedicChart.js`'s `chart.vedic.grahas` (never a display
 * name here — see `grahaNames.js` for the capitalized display form).
 */

export const RASHI_LORDS = {
  aries: "mars",
  taurus: "venus",
  gemini: "mercury",
  cancer: "moon",
  leo: "sun",
  virgo: "mercury",
  libra: "venus",
  scorpio: "mars",
  sagittarius: "jupiter",
  capricorn: "saturn",
  aquarius: "saturn",
  pisces: "jupiter",
};
