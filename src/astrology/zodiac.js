/**
 * Tropical zodiac sign definitions and longitude helpers.
 *
 * Phase 1 uses the Tropical Zodiac exclusively. No ayanamsa / sidereal
 * correction is applied anywhere in this module.
 */

export const ZODIAC_SIGNS = [
  { index: 0, key: "aries", english: "Aries", chinese: "白羊座", symbol: "♈" },
  { index: 1, key: "taurus", english: "Taurus", chinese: "金牛座", symbol: "♉" },
  { index: 2, key: "gemini", english: "Gemini", chinese: "双子座", symbol: "♊" },
  { index: 3, key: "cancer", english: "Cancer", chinese: "巨蟹座", symbol: "♋" },
  { index: 4, key: "leo", english: "Leo", chinese: "狮子座", symbol: "♌" },
  { index: 5, key: "virgo", english: "Virgo", chinese: "处女座", symbol: "♍" },
  { index: 6, key: "libra", english: "Libra", chinese: "天秤座", symbol: "♎" },
  { index: 7, key: "scorpio", english: "Scorpio", chinese: "天蝎座", symbol: "♏" },
  { index: 8, key: "sagittarius", english: "Sagittarius", chinese: "射手座", symbol: "♐" },
  { index: 9, key: "capricorn", english: "Capricorn", chinese: "摩羯座", symbol: "♑" },
  { index: 10, key: "aquarius", english: "Aquarius", chinese: "水瓶座", symbol: "♒" },
  { index: 11, key: "pisces", english: "Pisces", chinese: "双鱼座", symbol: "♓" },
];

export const DEGREES_PER_SIGN = 30;

/**
 * Normalizes any angle in degrees to the range [0, 360).
 * @param {number} degrees
 * @returns {number}
 */
export function normalizeDegrees(degrees) {
  let d = degrees % 360;
  if (d < 0) d += 360;
  return d;
}

/**
 * Resolves the zodiac sign and degree-within-sign for an absolute
 * tropical ecliptic longitude.
 *
 * @param {number} absoluteLongitude 0-360 (will be normalized)
 * @returns {{sign: object, degreeInSign: number}}
 */
export function getZodiacSign(absoluteLongitude) {
  const longitude = normalizeDegrees(absoluteLongitude);
  const signIndex = Math.min(11, Math.floor(longitude / DEGREES_PER_SIGN));
  const degreeInSign = longitude - signIndex * DEGREES_PER_SIGN;
  return { sign: ZODIAC_SIGNS[signIndex], degreeInSign };
}
