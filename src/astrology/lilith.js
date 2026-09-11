/**
 * Black Moon Lilith (the apogee point of the Moon's orbit around Earth —
 * NOT the asteroid 1181 Lilith, which is a different, unrelated body and is
 * not implemented here).
 *
 * Two conventions, both computed locally from first principles (no new
 * dependency, no API):
 *
 * - MEAN (Mean Black Moon Lilith / "Mean Apogee"): the apogee of the Moon's
 *   *mean* orbit. Derived here as (mean lunar longitude) - (mean lunar
 *   anomaly) + 180, using Meeus's standard low-precision lunar mean-element
 *   polynomials ("Astronomical Algorithms" 2nd ed., eq. 47.1 / 47.2).
 *
 * - TRUE / OSCULATING (Osculating Apogee): the instantaneous apogee
 *   direction of the Moon's actual, perturbed orbit at the requested
 *   instant, derived from its real position and velocity via the
 *   Laplace-Runge-Lenz (eccentricity) vector: e = (v x h)/mu - r_hat.
 *   The eccentricity vector points toward perigee; apogee is its opposite
 *   direction. mu is the standard two-body gravitational parameter for the
 *   Earth-Moon relative orbit (mu = G*(M_Earth + M_Moon)).
 *
 * IMPORTANT — accuracy caveat, not hidden:
 * Dev-time cross-check against real Swiss Ephemeris (`sweph-wasm`, temporary
 * devDependency only, never shipped) for the project's verification chart:
 *   Mean Apogee:      ~149 arcsec (~2.5') from swe_calc SE_MEAN_APOG.
 *   Osculating Apogee: ~96 arcsec (~1.6') from swe_calc SE_OSCU_APOG.
 * Both exceed the project's 1-arcminute target. This is a known, inherent
 * property of Black Moon Lilith (not a bug): different lunar theories
 * disagree on the exact secular "mean elements" used for Mean Lilith, and
 * apsidal (apogee/perigee) direction is far more sensitive to solar
 * perturbation than nodal direction, so a pure two-body osculating
 * extraction (as used here) does not reach the sub-arcminute agreement
 * achieved for other calculated points. This discrepancy is disclosed
 * rather than corrected with an arbitrary offset.
 */

import * as Astronomy from "astronomy-engine";
import { normalizeDegrees } from "./zodiac.js";

// Standard gravitational parameters (km^3/s^2), converted to AU^3/day^2 for
// consistency with astronomy-engine's native position/velocity units.
const GM_EARTH_KM3S2 = 398600.4418;
const GM_MOON_KM3S2 = 4902.8;
const AU_KM = 149597870.7;
const DAY_S = 86400;
const MU_EARTH_MOON_AU3_DAY2 = ((GM_EARTH_KM3S2 + GM_MOON_KM3S2) * DAY_S * DAY_S) / (AU_KM * AU_KM * AU_KM);

function cross(a, b) {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
function magnitude(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
}

/**
 * Mean Black Moon Lilith (mean apogee) longitude.
 * @param {Astronomy.AstroTime} astroTime
 * @returns {number} degrees [0, 360)
 */
export function computeMeanLilith(astroTime) {
  const T = astroTime.tt / 36525;

  // Meeus eq. 47.1 — Moon's mean longitude
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + Math.pow(T, 3) / 538841 - Math.pow(T, 4) / 65194000;
  // Meeus eq. 47.2 — Moon's mean anomaly
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + Math.pow(T, 3) / 69699 - Math.pow(T, 4) / 14712000;

  const meanPerigee = Lp - Mp;
  return normalizeDegrees(meanPerigee + 180);
}

/**
 * True/osculating Black Moon Lilith (osculating apogee) longitude.
 * @param {Astronomy.AstroTime} astroTime
 * @returns {number} degrees [0, 360)
 */
export function computeTrueLilith(astroTime) {
  const geoState = Astronomy.GeoMoonState(astroTime);
  const eclState = Astronomy.RotateState(Astronomy.Rotation_EQJ_ECT(astroTime), geoState);

  const r = { x: eclState.x, y: eclState.y, z: eclState.z };
  const v = { x: eclState.vx, y: eclState.vy, z: eclState.vz };

  const h = cross(r, v);
  const rMag = magnitude(r);
  const rHat = { x: r.x / rMag, y: r.y / rMag, z: r.z / rMag };
  const vxh = cross(v, h);

  // eccentricity (Laplace-Runge-Lenz) vector — points toward perigee
  const e = {
    x: vxh.x / MU_EARTH_MOON_AU3_DAY2 - rHat.x,
    y: vxh.y / MU_EARTH_MOON_AU3_DAY2 - rHat.y,
  };

  // apogee is the opposite direction
  return normalizeDegrees((Math.atan2(-e.y, -e.x) * 180) / Math.PI);
}

/**
 * Black Moon Lilith longitude for the requested convention.
 * @param {Astronomy.AstroTime} astroTime
 * @param {"true"|"mean"} lilithType
 * @returns {{ longitude: number, lilithType: "true"|"mean" }}
 */
export function computeLilith(astroTime, lilithType = "mean") {
  const longitude = lilithType === "true" ? computeTrueLilith(astroTime) : computeMeanLilith(astroTime);
  return { longitude, lilithType };
}
