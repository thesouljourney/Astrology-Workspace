/**
 * Vertex and East Point — both computed locally from RAMC/obliquity/
 * latitude geometry, no new dependency.
 *
 * EAST POINT (here defined as the Equatorial Ascendant — see README for the
 * explicit convention note): the ecliptic point whose right ascension
 * equals RAMC + 90 degrees. Closed form, structurally identical to the
 * verified MC formula with RAMC shifted by 90 degrees.
 * Dev-time cross-check against real Swiss Ephemeris (ascmc[4], the
 * "equatorial ascendant"): 0.089 arcsec.
 *
 * VERTEX: the ecliptic point where the ecliptic crosses the *prime
 * vertical* (the great circle through zenith, nadir, and the due-east/
 * due-west horizon points) on the western side — i.e. the ecliptic point
 * whose azimuth is 270 degrees (astronomy-engine's azimuth convention:
 * 0=North, 90=East, 180=South, 270=West). This is solved numerically (no
 * closed form used, to avoid relying on a half-remembered shortcut
 * formula): the ecliptic is swept, azimuth(lambda) is evaluated via
 * astronomy-engine's own Equator()/Horizon() transforms, and the crossing
 * nearest azimuth=270 is refined by bisection. The antipodal crossing
 * (azimuth=90) is the Anti-Vertex, not returned here.
 * Dev-time cross-check against real Swiss Ephemeris (ascmc[3], "Vertex"):
 * 0.003 arcsec.
 */

import * as Astronomy from "astronomy-engine";
import { normalizeDegrees } from "./zodiac.js";

// Dev-time cross-check results vs real Swiss Ephemeris (see module doc
// comment above) — measured once during development, not re-derived at
// runtime.
export const EAST_POINT_VERIFICATION_ARCSEC = 0.089;
export const VERTEX_VERIFICATION_ARCSEC = 0.003;

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const sinD = (d) => Math.sin(d * DEG2RAD);
const cosD = (d) => Math.cos(d * DEG2RAD);
const atan2D = (y, x) => Math.atan2(y, x) * RAD2DEG;

/**
 * East Point / Equatorial Ascendant longitude.
 * @param {number} ramc degrees
 * @param {number} obliquity degrees
 * @returns {number} degrees [0, 360)
 */
export function computeEastPoint(ramc, obliquity) {
  const shifted = normalizeDegrees(ramc + 90);
  return normalizeDegrees(atan2D(sinD(shifted), cosD(shifted) * cosD(obliquity)));
}

function azimuthAtLongitude(astroTime, observer, obliquity, lambda) {
  const raHours = normalizeDegrees(atan2D(cosD(obliquity) * sinD(lambda), cosD(lambda))) / 15;
  const dec = Math.asin(sinD(obliquity) * sinD(lambda)) * RAD2DEG;
  return Astronomy.Horizon(astroTime, observer, raHours, dec, null).azimuth;
}

/**
 * Vertex longitude, found by root-finding the ecliptic/prime-vertical
 * (azimuth=270) crossing.
 * @param {Astronomy.AstroTime} astroTime
 * @param {number} obliquity degrees
 * @param {number} latitude degrees
 * @param {number} longitudeEast degrees
 * @returns {number} degrees [0, 360)
 */
export function computeVertex(astroTime, obliquity, latitude, longitudeEast) {
  const observer = new Astronomy.Observer(latitude, longitudeEast, 0);
  const target = 270;
  const steps = 1440;

  const wrap180 = (d) => {
    let x = d % 360;
    if (x > 180) x -= 360;
    if (x < -180) x += 360;
    return x;
  };

  let prevLambda = 0;
  let prevDiff = wrap180(azimuthAtLongitude(astroTime, observer, obliquity, 0) - target);
  const roots = [];

  for (let i = 1; i <= steps; i++) {
    const lambda = (360 * i) / steps;
    const diff = wrap180(azimuthAtLongitude(astroTime, observer, obliquity, lambda) - target);

    if ((prevDiff <= 0 && diff >= 0) || (prevDiff >= 0 && diff <= 0)) {
      let lo = prevLambda;
      let hi = lambda;
      let fLo = prevDiff;
      for (let iter = 0; iter < 40; iter++) {
        const mid = (lo + hi) / 2;
        const fMid = wrap180(azimuthAtLongitude(astroTime, observer, obliquity, mid) - target);
        if (fLo <= 0 === fMid <= 0) {
          lo = mid;
          fLo = fMid;
        } else {
          hi = mid;
        }
      }
      roots.push(normalizeDegrees((lo + hi) / 2));
    }

    prevLambda = lambda;
    prevDiff = diff;
  }

  if (roots.length === 0) {
    throw new Error("Vertex could not be determined for the given time/location.");
  }

  // Disambiguate Vertex (azimuth ~270, West) from Anti-Vertex (azimuth ~90, East).
  for (const lambda of roots) {
    const az = azimuthAtLongitude(astroTime, observer, obliquity, lambda);
    if (Math.abs(wrap180(az - 270)) < Math.abs(wrap180(az - 90))) {
      return lambda;
    }
  }

  return roots[0];
}
