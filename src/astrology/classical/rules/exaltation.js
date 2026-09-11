/**
 * Traditional exaltation (and, derived, fall) degrees.
 *
 * Source/tradition: the standard Western tropical exaltation degrees
 * preserved from antiquity (e.g. via Al-Biruni's "Book of Instruction",
 * 10th century, and Al-Qabisi) and reproduced consistently across modern
 * traditional references (cross-checked against Astrodienst's Astrowiki
 * and multiple independent traditional-astrology sources during
 * development — no disagreement found for these seven values).
 *
 * Note: Vedic/sidereal astrology commonly cites a different exaltation
 * degree for Jupiter (5 deg Cancer) — that is a distinct, sidereal-zodiac
 * convention and is out of scope here; this project's Classical module is
 * tropical only (see chart.classical.meta.zodiacType), so 15 deg Cancer
 * (the Western tropical value) is used.
 *
 * Fall is derived programmatically as the point exactly opposite the
 * exaltation degree (same degree-within-sign, opposite sign) rather than
 * hand-transcribed separately, so the two can never drift out of sync.
 */

export const EXALTATION = {
  sun: { sign: "aries", degree: 19 },
  moon: { sign: "taurus", degree: 3 },
  mercury: { sign: "virgo", degree: 15 },
  venus: { sign: "pisces", degree: 27 },
  mars: { sign: "capricorn", degree: 28 },
  jupiter: { sign: "cancer", degree: 15 },
  saturn: { sign: "libra", degree: 21 },
};

const SIGN_ORDER = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

function oppositeSign(sign) {
  const i = SIGN_ORDER.indexOf(sign);
  return SIGN_ORDER[(i + 6) % 12];
}

export function getFall(planetKey) {
  const ex = EXALTATION[planetKey];
  if (!ex) return null;
  return { sign: oppositeSign(ex.sign), degree: ex.degree };
}

export function isExalted(planetKey, sign) {
  return EXALTATION[planetKey]?.sign === sign;
}

export function isFall(planetKey, sign) {
  return getFall(planetKey)?.sign === sign;
}
