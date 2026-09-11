/**
 * Part of Fortune (Pars Fortunae).
 *
 * Sect (day/night) is determined from the Sun's actual geometric altitude
 * at the birth moment and location — never from a fixed clock-time range —
 * using astronomy-engine's own Equator()/Horizon() transforms.
 *
 * Day chart (Sun above horizon):   Fortune = ASC + Moon - Sun
 * Night chart (Sun below horizon): Fortune = ASC + Sun - Moon
 *
 * This module performs the arithmetic only; it does not interpret the
 * result.
 */

import * as Astronomy from "astronomy-engine";
import { normalizeDegrees } from "./zodiac.js";

/**
 * Determines whether the Sun is above (day) or below (night) the horizon.
 * @param {Astronomy.AstroTime} astroTime
 * @param {number} latitude degrees north positive
 * @param {number} longitude degrees east positive
 * @returns {"day"|"night"}
 */
export function determineSect(astroTime, latitude, longitude) {
  const observer = new Astronomy.Observer(latitude, longitude, 0);
  const equ = Astronomy.Equator(Astronomy.Body.Sun, astroTime, observer, true, true);
  const hor = Astronomy.Horizon(astroTime, observer, equ.ra, equ.dec, null);
  return hor.altitude > 0 ? "day" : "night";
}

/**
 * Computes the Part of Fortune.
 *
 * @param {object} params
 * @param {Astronomy.AstroTime} params.astroTime
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {number} params.ascLongitude
 * @param {number} params.sunLongitude
 * @param {number} params.moonLongitude
 * @returns {{ longitude: number, sect: "day"|"night", formulaUsed: string }}
 */
export function computePartOfFortune({ astroTime, latitude, longitude, ascLongitude, sunLongitude, moonLongitude }) {
  const sect = determineSect(astroTime, latitude, longitude);

  const formulaUsed = sect === "day" ? "ASC + Moon - Sun" : "ASC + Sun - Moon";
  const raw = sect === "day" ? ascLongitude + moonLongitude - sunLongitude : ascLongitude + sunLongitude - moonLongitude;

  return { longitude: normalizeDegrees(raw), sect, formulaUsed };
}
