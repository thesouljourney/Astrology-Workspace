/**
 * Mercury's variable sect, determined by its solar phase (oriental vs
 * occidental) rather than a fixed planetary family.
 *
 * ALGORITHM (documented explicitly, per project rule):
 *
 * 1. Compute the SIGNED elongation of Mercury from the Sun, wrapped to the
 *    range (-180, +180] degrees:
 *
 *      signedElongation = ((mercuryLongitude - sunLongitude + 540) % 360) - 180
 *
 *    This is the standard wrap-to-signed-range formula (identical in form
 *    to `wrapSigned()` already used in houses.js), and correctly handles
 *    the 0/360 degree boundary: e.g. Mercury at 2 deg, Sun at 359 deg gives
 *    signedElongation = +3 (Mercury is 3 deg AHEAD of the Sun in the
 *    wrapped/shortest-path sense), not the wrong answer a naive
 *    `mercuryLongitude - sunLongitude` (= -357) would suggest.
 *
 * 2. Sign of signedElongation determines the phase:
 *      signedElongation < 0  -> Mercury's zodiacal longitude trails the
 *        Sun's (is "west of" / "behind" the Sun in the order the signs
 *        rise) -> Mercury rises BEFORE the Sun -> ORIENTAL (morning star).
 *      signedElongation > 0  -> Mercury is "ahead of"/"east of" the Sun ->
 *        rises AFTER the Sun -> OCCIDENTAL (evening star).
 *      signedElongation === 0 (exact conjunction) -> treated as oriental
 *        by convention (the boundary case is vanishingly unlikely and not
 *        separately defined in the sources consulted).
 *
 * This matches the traditional definition (cross-checked during
 * development against multiple independent traditional-astrology sources):
 * "oriental of the Sun" means positioned to the west of the Sun in the
 * zodiac, at a lower effective zodiacal longitude — because objects with
 * smaller right ascension/longitude cross the horizon earlier as the sky
 * rotates, they rise first, i.e. before the Sun.
 *
 * 3. Per this project's explicit brief: oriental -> diurnal sect,
 *    occidental -> nocturnal sect. (Mercury does not use hemisphere or any
 *    other condition to determine this — solar phase only.)
 */

import { normalizeDegrees } from "../zodiac.js";

function wrapSigned180(deg) {
  let d = deg % 360;
  if (d <= -180) d += 360;
  if (d > 180) d -= 360;
  return d;
}

/**
 * @param {number} mercuryLongitude absolute ecliptic longitude, degrees
 * @param {number} sunLongitude absolute ecliptic longitude, degrees
 * @returns {{
 *   signedElongation: number,
 *   mercuryPhase: "oriental"|"occidental",
 *   mercurySect: "diurnal"|"nocturnal"
 * }}
 */
export function computeMercuryPhase(mercuryLongitude, sunLongitude) {
  const signedElongation = wrapSigned180(normalizeDegrees(mercuryLongitude) - normalizeDegrees(sunLongitude));

  const mercuryPhase = signedElongation <= 0 ? "oriental" : "occidental";
  const mercurySect = mercuryPhase === "oriental" ? "diurnal" : "nocturnal";

  return { signedElongation, mercuryPhase, mercurySect };
}
