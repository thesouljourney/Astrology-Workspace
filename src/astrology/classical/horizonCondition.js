/**
 * Above/below horizon status for a traditional planet, from actual
 * geometric altitude — not house number (house 1-6 vs 7-12 is a
 * quadrant-house approximation that can disagree with true horizon
 * crossing near the ASC/DESC for non-equal-house systems; this uses the
 * real astronomical altitude instead, as the project brief requires).
 *
 * Uses astronomy-engine's own per-body Equator() (true right ascension/
 * declination of date, not an ecliptic-latitude=0 shortcut — several
 * traditional planets have non-negligible ecliptic latitude, so their
 * true equatorial position is used directly) followed by Horizon() to
 * get real topocentric altitude. This does not duplicate or modify any
 * verified Phase 1 calculation — it is a new, independent use of
 * astronomy-engine's already-relied-upon Equator/Horizon transform (the
 * same functions already used and verified in partOfFortune.js and
 * vertex.js).
 */

import * as Astronomy from "astronomy-engine";

/**
 * @param {Astronomy.AstroTime} astroTime
 * @param {number} latitude degrees north positive
 * @param {number} longitude degrees east positive
 * @param {Astronomy.Body} body
 * @returns {{ altitudeDegrees: number, isAboveHorizon: boolean }}
 */
export function computeHorizonCondition(astroTime, latitude, longitude, body) {
  const observer = new Astronomy.Observer(latitude, longitude, 0);
  const equ = Astronomy.Equator(body, astroTime, observer, true, true);
  const hor = Astronomy.Horizon(astroTime, observer, equ.ra, equ.dec, null);

  return { altitudeDegrees: hor.altitude, isAboveHorizon: hor.altitude > 0 };
}
