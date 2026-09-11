/**
 * Lunar nodes.
 *
 * astronomy-engine does NOT expose a lunar-node longitude directly (checked:
 * its `Body` enum has no node/apogee entries, and `SearchMoonNode` only finds
 * the *times* of actual latitude=0 crossings, not an instantaneous "current
 * node" longitude). Both conventions below are therefore computed locally
 * from first principles — no new dependency, no API.
 *
 * Two conventions exist and are NOT interchangeable:
 *
 * - MEAN NODE: the node of the Moon's *mean* orbit — a smooth, slowly
 *   regressing point defined by a low-precision secular polynomial
 *   (Meeus, "Astronomical Algorithms" 2nd ed., eq. 22.2 / 47.7). No
 *   knowledge of the Moon's actual position at the instant is used.
 *
 * - TRUE NODE: the instantaneous *osculating* ascending node of the Moon's
 *   actual (perturbed) orbit at the requested instant — derived here from
 *   the Moon's real position and velocity vectors (geocentric, ecliptic of
 *   date), via the standard orbital-mechanics identity: for specific
 *   angular momentum h = r x v, the ascending-node direction is k x h
 *   (k = ecliptic pole). This is the same category of computation used by
 *   professional ephemeris software for "True Node".
 *
 * Dev-time cross-check against real Swiss Ephemeris (`sweph-wasm`, used only
 * as a temporary devDependency during development, never shipped) for the
 * project's verification chart:
 *   Mean Node: -10.8 arcsec vs swe_calc SE_MEAN_NODE (nutation-scale; Meeus's
 *     series is a deliberately low-precision "mean elements" polynomial).
 *   True Node: +2.9 arcsec vs swe_calc SE_TRUE_NODE.
 *
 * Per the project's chosen default: True Node is used unless the caller
 * asks for mean. The result always carries `meta.nodeType` so north/south
 * node output is never ambiguous about which convention produced it.
 */

import * as Astronomy from "astronomy-engine";
import { normalizeDegrees } from "./zodiac.js";

/**
 * Mean ascending node longitude (Meeus, low-precision secular series).
 * @param {Astronomy.AstroTime} astroTime
 * @returns {number} degrees [0, 360)
 */
export function computeMeanNode(astroTime) {
  const T = astroTime.tt / 36525; // Julian centuries, Terrestrial Time, from J2000.0
  const omega =
    125.0445479 -
    1934.1362891 * T +
    0.0020754 * T * T +
    Math.pow(T, 3) / 467441 -
    Math.pow(T, 4) / 60616000;
  return normalizeDegrees(omega);
}

/**
 * True (osculating) ascending node longitude, from the Moon's actual
 * geocentric position and velocity at the instant.
 * @param {Astronomy.AstroTime} astroTime
 * @returns {number} degrees [0, 360)
 */
export function computeTrueNode(astroTime) {
  const geoState = Astronomy.GeoMoonState(astroTime); // EQJ frame
  const eclState = Astronomy.RotateState(Astronomy.Rotation_EQJ_ECT(astroTime), geoState);

  const rx = eclState.x, ry = eclState.y, rz = eclState.z;
  const vx = eclState.vx, vy = eclState.vy, vz = eclState.vz;

  // specific angular momentum h = r x v
  const hx = ry * vz - rz * vy;
  const hy = rz * vx - rx * vz;
  // hz is not needed: the ascending node direction n = k x h = (-hy, hx, 0)

  return normalizeDegrees((Math.atan2(hx, -hy) * 180) / Math.PI);
}

/**
 * North Node longitude for the requested convention.
 * @param {Astronomy.AstroTime} astroTime
 * @param {"true"|"mean"} nodeType
 * @returns {{ longitude: number, nodeType: "true"|"mean" }}
 */
export function computeNorthNode(astroTime, nodeType = "true") {
  const longitude = nodeType === "mean" ? computeMeanNode(astroTime) : computeTrueNode(astroTime);
  return { longitude, nodeType };
}

/**
 * South Node = North Node + 180 degrees, normalized. Never computed
 * independently, per the project's stated rule.
 * @param {number} northNodeLongitude
 * @returns {number}
 */
export function computeSouthNode(northNodeLongitude) {
  return normalizeDegrees(northNodeLongitude + 180);
}
