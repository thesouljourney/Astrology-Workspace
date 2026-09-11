/**
 * Unified astrology data model.
 *
 * Every body/point in the chart (planet, angle, node, calculated point,
 * or asteroid) is represented with this same shape, so the UI and any
 * future rule layer (Classical, Vedic, ...) can consume one consistent
 * structure instead of special-casing each category.
 *
 * Not every point has every property — e.g. angles have no retrograde
 * status, Part of Fortune has no independent "speed". Inapplicable
 * properties are `null`, never fabricated.
 */

import { getZodiacSign, normalizeDegrees } from "./zodiac.js";
import { formatDMS } from "../utils/formatDegree.js";

/**
 * @typedef {"ephemeris"|"angle"|"derived"|"calculated"} SourceType
 * - "ephemeris": read directly from the astronomical ephemeris engine (planets)
 * - "angle": a chart angle derived from the verified house-cusp geometry (ASC/MC/DSC/IC)
 * - "derived": obtained by a fixed geometric relationship to another point (e.g. South Node = North Node + 180)
 * - "calculated": produced by an astrological formula combining multiple inputs (e.g. Part of Fortune)
 */

/**
 * Builds one canonical point object.
 *
 * @param {object} params
 * @param {string} params.id
 * @param {"planet"|"angle"|"node"|"calculated"|"asteroid"} params.category
 * @param {string} params.englishName
 * @param {string} params.chineseName
 * @param {string} params.symbol
 * @param {number} params.absoluteLongitude ecliptic longitude, degrees [0,360)
 * @param {number|null} [params.house] 1-12, or null if not yet assigned
 * @param {number|null} [params.speedLongitude] deg/day, or null if not applicable/unknown
 * @param {boolean} [params.retrogradeApplicable] whether retrograde is a meaningful concept for this point
 * @param {SourceType} params.sourceType
 * @param {object} [params.meta] convention/provenance details (e.g. { nodeType: "true" })
 */
export function buildPoint({
  id,
  category,
  englishName,
  chineseName,
  symbol,
  absoluteLongitude,
  house = null,
  speedLongitude = null,
  retrogradeApplicable = false,
  sourceType,
  meta = {},
}) {
  const longitude = normalizeDegrees(absoluteLongitude);
  const { sign, degreeInSign } = getZodiacSign(longitude);

  return {
    id,
    category,
    englishName,
    chineseName,
    symbol,
    absoluteLongitude: longitude,
    sign,
    degreeInSign,
    formattedDegree: formatDMS(degreeInSign),
    house,
    motion: retrogradeApplicable
      ? { speedLongitude, retrograde: speedLongitude !== null && speedLongitude < 0 }
      : null,
    sourceType,
    meta,
  };
}
