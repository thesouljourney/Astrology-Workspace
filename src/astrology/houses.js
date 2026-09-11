/**
 * House system calculations: ASC, MC, and the 12 house cusps.
 *
 * Phase 1 implements the Placidus house system. The dispatch structure
 * (`computeHouseCusps`) is written so that additional systems (Whole Sign,
 * Equal, Regiomontanus, ...) can be added later as sibling strategies
 * without touching callers.
 *
 * All formulas below are standard spherical-astronomy relations (see e.g.
 * Meeus, "Astronomical Algorithms", and Duffett-Smith, "Practical Astronomy
 * With Your Calculator"), evaluated numerically rather than assumed, and
 * checked against the project's verification case.
 */

import * as Astronomy from "astronomy-engine";
import { normalizeDegrees } from "./zodiac.js";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

const sinD = (deg) => Math.sin(deg * DEG2RAD);
const cosD = (deg) => Math.cos(deg * DEG2RAD);
const tanD = (deg) => Math.tan(deg * DEG2RAD);
const asinD = (x) => Math.asin(Math.max(-1, Math.min(1, x))) * RAD2DEG;
const acosD = (x) => Math.acos(Math.max(-1, Math.min(1, x))) * RAD2DEG;
const atan2D = (y, x) => Math.atan2(y, x) * RAD2DEG;

/** Wraps `deg` into (-180, 180]. */
function wrapSigned(deg) {
  let d = deg % 360;
  if (d <= -180) d += 360;
  if (d > 180) d -= 360;
  return d;
}

/**
 * Right ascension and declination (degrees) of the ecliptic point at
 * longitude `lambda` (ecliptic latitude 0), for true obliquity `obliquity`.
 */
function equatorialFromEclipticLongitude(lambda, obliquity) {
  const ra = normalizeDegrees(atan2D(cosD(obliquity) * sinD(lambda), cosD(lambda)));
  const dec = asinD(sinD(obliquity) * sinD(lambda));
  return { ra, dec };
}

/** Local hour angle (degrees) of a point with right ascension `ra`, given RAMC. */
function hourAngle(ramc, ra) {
  return wrapSigned(ramc - ra);
}

/** Topocentric-independent geometric altitude (degrees) for given hour angle/declination/latitude. */
function altitudeFromHourAngle(hourAngleDeg, dec, latitude) {
  return asinD(sinD(latitude) * sinD(dec) + cosD(latitude) * cosD(dec) * cosD(hourAngleDeg));
}

/** Semi-diurnal arc (degrees of hour angle) of a point with declination `dec` at `latitude`. */
function semiDiurnalArc(dec, latitude) {
  const cosValue = -tanD(latitude) * tanD(dec);
  if (cosValue < -1 || cosValue > 1) {
    return null; // circumpolar / never-rises case — not expected for Phase 1 use cases
  }
  return acosD(cosValue);
}

/**
 * Obliquity of the ecliptic (true, includes nutation) at the given time, in degrees.
 */
export function trueObliquity(astroTime) {
  return Astronomy.e_tilt(astroTime).tobl;
}

/**
 * Right Ascension of the Midheaven (RAMC) in degrees, i.e. local apparent
 * sidereal time expressed in degrees.
 *
 * @param {Astronomy.AstroTime} astroTime
 * @param {number} geoLongitudeEast degrees, east positive
 */
export function computeRAMC(astroTime, geoLongitudeEast) {
  const gastHours = Astronomy.SiderealTime(astroTime); // [0, 24) sidereal hours
  const gastDegrees = gastHours * 15;
  return normalizeDegrees(gastDegrees + geoLongitudeEast);
}

/** Midheaven ecliptic longitude from RAMC and obliquity. */
export function computeMC(ramc, obliquity) {
  return normalizeDegrees(atan2D(sinD(ramc), cosD(ramc) * cosD(obliquity)));
}

/**
 * Walks the ecliptic from `lambdaStart` over `arcLengthDeg` (always taken in
 * the direction of increasing longitude), returning a continuously-unwrapped
 * hour-angle series alongside the sampled longitudes. Continuity removes any
 * ambiguity from the -180/180 branch cut when a target arc straddles it
 * (e.g. the Ascendant-to-IC quadrant, which crosses hour angle 180).
 */
function traceHourAngleArc(ramc, obliquity, lambdaStart, arcLengthDeg, steps) {
  const lambdas = new Array(steps + 1);
  const hourAngles = new Array(steps + 1);

  let previousH = hourAngle(ramc, equatorialFromEclipticLongitude(normalizeDegrees(lambdaStart), obliquity).ra);

  for (let i = 0; i <= steps; i++) {
    const lambda = lambdaStart + (arcLengthDeg * i) / steps;
    const { ra } = equatorialFromEclipticLongitude(normalizeDegrees(lambda), obliquity);
    let h = hourAngle(ramc, ra);

    // Unwrap relative to the previous sample so the series stays continuous
    // even when it crosses the +/-180 degree branch cut.
    while (h - previousH > 180) h -= 360;
    while (h - previousH < -180) h += 360;

    lambdas[i] = lambda;
    hourAngles[i] = h;
    previousH = h;
  }

  return { lambdas, hourAngles };
}

/**
 * Generic bisection root-finder for a scalar function over [lo, hi], where
 * the caller guarantees a sign change and supplies a continuous evaluator.
 */
function bisect(lo, hi, fLo, fHi, fn, iterations = 60) {
  let a = lo;
  let b = hi;
  let fa = fLo;
  for (let i = 0; i < iterations; i++) {
    const mid = (a + b) / 2;
    const fMid = fn(mid);
    if (fa <= 0 === fMid <= 0) {
      a = mid;
      fa = fMid;
    } else {
      b = mid;
    }
  }
  return (a + b) / 2;
}

/**
 * Solves for the ecliptic longitude satisfying `hourAngle(lambda) = target(lambda)`
 * by sweeping a traced (continuous) arc and bisecting on the bracketed sign change.
 */
function solveOnArc(ramc, obliquity, lambdaStart, arcLengthDeg, targetOfLambdaFn, steps = 720) {
  const { lambdas, hourAngles } = traceHourAngleArc(ramc, obliquity, lambdaStart, arcLengthDeg, steps);

  const g = (lambda, h) => h - targetOfLambdaFn(lambda);
  const values = hourAngles.map((h, i) => g(lambdas[i], h));

  for (let i = 0; i < values.length - 1; i++) {
    const v0 = values[i];
    const v1 = values[i + 1];
    if ((v0 <= 0 && v1 >= 0) || (v0 >= 0 && v1 <= 0)) {
      const lo = lambdas[i];
      const hi = lambdas[i + 1];

      // Local continuous hour-angle function for the tiny bracket [lo, hi],
      // anchored to the branch established during the sweep.
      let anchorH = hourAngles[i];
      const continuousH = (lambda) => {
        const { ra } = equatorialFromEclipticLongitude(normalizeDegrees(lambda), obliquity);
        let h = hourAngle(ramc, ra);
        while (h - anchorH > 180) h -= 360;
        while (h - anchorH < -180) h += 360;
        anchorH = h;
        return h;
      };

      const fn = (lambda) => continuousH(lambda) - targetOfLambdaFn(lambda);
      const root = bisect(lo, hi, v0, values[i + 1], fn);
      return normalizeDegrees(root);
    }
  }

  return null;
}

/**
 * Ascendant ecliptic longitude: the ecliptic point currently crossing the
 * eastern horizon (altitude = 0, rising).
 */
export function computeASC(ramc, obliquity, latitude) {
  const steps = 1440; // 0.25 degree resolution sweep of the full ecliptic
  const { lambdas, hourAngles } = traceHourAngleArc(ramc, obliquity, 0, 360, steps);

  const altitudeAt = (lambda, h) => {
    const { dec } = equatorialFromEclipticLongitude(normalizeDegrees(lambda), obliquity);
    return altitudeFromHourAngle(h, dec, latitude);
  };

  const roots = [];
  let prevAlt = altitudeAt(lambdas[0], hourAngles[0]);
  for (let i = 1; i < lambdas.length; i++) {
    const alt = altitudeAt(lambdas[i], hourAngles[i]);
    if ((prevAlt <= 0 && alt >= 0) || (prevAlt >= 0 && alt <= 0)) {
      if (prevAlt !== alt) {
        // Bisection using the same continuous-H trick within this tiny bracket.
        let a = lambdas[i - 1];
        let b = lambdas[i];
        let anchorH = hourAngles[i - 1];
        const altFn = (lambda) => {
          const { ra, dec } = equatorialFromEclipticLongitude(normalizeDegrees(lambda), obliquity);
          let h = hourAngle(ramc, ra);
          while (h - anchorH > 180) h -= 360;
          while (h - anchorH < -180) h += 360;
          anchorH = h;
          return { alt: altitudeFromHourAngle(h, dec, latitude), h };
        };
        let fa = prevAlt;
        for (let iter = 0; iter < 60; iter++) {
          const mid = (a + b) / 2;
          const { alt: fMid } = altFn(mid);
          if (fa <= 0 === fMid <= 0) {
            a = mid;
            fa = fMid;
          } else {
            b = mid;
          }
        }
        roots.push((a + b) / 2);
      }
    }
    prevAlt = alt;
  }

  // Among the (generically two, ~180 degrees apart) roots, the Ascendant is
  // the one that is rising: its hour angle is negative (approaching the
  // meridian from the east) rather than positive (already past it, setting).
  let ascLambda = null;
  for (const lambda of roots) {
    const { ra } = equatorialFromEclipticLongitude(normalizeDegrees(lambda), obliquity);
    const h = hourAngle(ramc, ra);
    if (h < 0) {
      ascLambda = lambda;
      break;
    }
  }

  if (ascLambda === null && roots.length > 0) {
    // Fallback: pick whichever root has the more negative hour angle.
    ascLambda = roots.reduce((best, lambda) => {
      const hBest = hourAngle(ramc, equatorialFromEclipticLongitude(normalizeDegrees(best), obliquity).ra);
      const hCur = hourAngle(ramc, equatorialFromEclipticLongitude(normalizeDegrees(lambda), obliquity).ra);
      return hCur < hBest ? lambda : best;
    });
  }

  if (ascLambda === null) {
    throw new Error("Ascendant could not be determined for the given time/location (ecliptic never crosses the horizon).");
  }

  return normalizeDegrees(ascLambda);
}

/**
 * Placidus intermediate cusp for houses 11/12 (between MC and ASC) or
 * 2/3 (between ASC and IC), found via the classic self-referential
 * semi-arc trisection, solved numerically.
 *
 * @param {number} fraction 1/3 or 2/3
 * @param {"upper"|"lower"} quadrant "upper" = MC->ASC (houses 11,12), "lower" = ASC->IC (houses 2,3)
 */
function placidusIntermediateCusp(ramc, obliquity, latitude, mc, asc, fraction, quadrant) {
  if (quadrant === "upper") {
    const arcLength = normalizeDegrees(asc - mc);
    const target = (lambda) => {
      const { dec } = equatorialFromEclipticLongitude(normalizeDegrees(lambda), obliquity);
      const sda = semiDiurnalArc(dec, latitude);
      if (sda === null) return 0;
      return -fraction * sda;
    };
    const result = solveOnArc(ramc, obliquity, mc, arcLength, target);
    if (result === null) {
      throw new Error("Placidus cusp (MC-ASC quadrant) could not be solved for this latitude.");
    }
    return result;
  }

  // quadrant === "lower": ASC -> IC
  const ic = normalizeDegrees(mc + 180);
  const arcLength = normalizeDegrees(ic - asc);
  const target = (lambda) => {
    const { dec } = equatorialFromEclipticLongitude(normalizeDegrees(lambda), obliquity);
    const sda = semiDiurnalArc(dec, latitude);
    if (sda === null) return -180;
    const nsa = 180 - sda;
    return -(sda + fraction * nsa);
  };
  const result = solveOnArc(ramc, obliquity, asc, arcLength, target);
  if (result === null) {
    throw new Error("Placidus cusp (ASC-IC quadrant) could not be solved for this latitude.");
  }
  return result;
}

/**
 * Computes ASC, MC and the 12 Placidus house cusps.
 *
 * @param {Astronomy.AstroTime} astroTime
 * @param {number} latitude geographic latitude, degrees north positive
 * @param {number} longitudeEast geographic longitude, degrees east positive
 * @returns {{asc:number, mc:number, ic:number, desc:number, cusps:number[]}} cusps[0] = house 1 ... cusps[11] = house 12
 */
function computePlacidusHouses(astroTime, latitude, longitudeEast) {
  const obliquity = trueObliquity(astroTime);
  const ramc = computeRAMC(astroTime, longitudeEast);

  const mc = computeMC(ramc, obliquity);
  const ic = normalizeDegrees(mc + 180);
  const asc = computeASC(ramc, obliquity, latitude);
  const desc = normalizeDegrees(asc + 180);

  const house11 = placidusIntermediateCusp(ramc, obliquity, latitude, mc, asc, 1 / 3, "upper");
  const house12 = placidusIntermediateCusp(ramc, obliquity, latitude, mc, asc, 2 / 3, "upper");
  const house2 = placidusIntermediateCusp(ramc, obliquity, latitude, mc, asc, 1 / 3, "lower");
  const house3 = placidusIntermediateCusp(ramc, obliquity, latitude, mc, asc, 2 / 3, "lower");

  // Opposite houses are always exactly 180 degrees apart for Placidus.
  const house5 = normalizeDegrees(house11 + 180);
  const house6 = normalizeDegrees(house12 + 180);
  const house8 = normalizeDegrees(house2 + 180);
  const house9 = normalizeDegrees(house3 + 180);

  const cusps = [
    asc, // house 1
    house2,
    house3,
    ic, // house 4
    house5,
    house6,
    desc, // house 7
    house8,
    house9,
    mc, // house 10
    house11,
    house12,
  ];

  return { asc, mc, ic, desc, cusps };
}

const HOUSE_SYSTEMS = {
  placidus: computePlacidusHouses,
  // whole-sign, equal, regiomontanus, etc. can be added here later.
};

/**
 * Computes house cusps for the requested house system.
 * @param {Astronomy.AstroTime} astroTime
 * @param {number} latitude
 * @param {number} longitudeEast
 * @param {string} houseSystem
 */
export function computeHouseCusps(astroTime, latitude, longitudeEast, houseSystem = "placidus") {
  const impl = HOUSE_SYSTEMS[houseSystem];
  if (!impl) {
    throw new Error(`House system "${houseSystem}" is not implemented in Phase 1.`);
  }
  return impl(astroTime, latitude, longitudeEast);
}

export const SUPPORTED_HOUSE_SYSTEMS = Object.keys(HOUSE_SYSTEMS);

/**
 * Determines which house (1-12) a given ecliptic longitude falls into,
 * given the 12 cusp longitudes (cusps[0] = house 1 cusp ... cusps[11] = house 12 cusp).
 *
 * Correctly handles the 360 -> 0 degree wraparound: house membership is
 * determined by measuring the forward (increasing-longitude) angular
 * distance from each cusp, not by naive `min < lon < max` comparison.
 *
 * @param {number} longitude
 * @param {number[]} cusps
 * @returns {number} house number 1-12
 */
export function getHouseForLongitude(longitude, cusps) {
  const lon = normalizeDegrees(longitude);

  for (let i = 0; i < 12; i++) {
    const start = normalizeDegrees(cusps[i]);
    const end = normalizeDegrees(cusps[(i + 1) % 12]);

    const span = normalizeDegrees(end - start) || 360; // guard against a degenerate 0-width span
    const offset = normalizeDegrees(lon - start);

    if (offset < span) {
      return i + 1;
    }
  }

  // Should not happen for a valid, fully-wrapped cusp set.
  throw new Error(`Could not determine house for longitude ${longitude}.`);
}
