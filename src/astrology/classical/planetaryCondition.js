/**
 * Assembles the full "planetary condition" object for one traditional
 * planet — sect family/of-sect status, solar condition, motion, and
 * horizon status. Technical condition data only; no interpretation.
 *
 * Reuses, rather than recalculates:
 *   - longitude/speed/retrograde: from the already-verified Phase 1
 *     planet ephemeris (planets.js / computePlanetPositions)
 *   - chart sect: from the already-computed Part of Fortune point
 *     (ultimately the Sun's real astronomical altitude)
 * The only genuinely new calculation here is horizon altitude for each
 * individual planet (horizonCondition.js) and the solar-elongation-based
 * classifications (mercurySect.js, solarCondition.js).
 */

import { PLANET_BODIES } from "../planets.js";
import { getSectFamily, isOfSect as checkIsOfSect } from "./rules/sectFamily.js";
import { computeMercuryPhase } from "./mercurySect.js";
import { computeSolarCondition } from "./solarCondition.js";
import { computeHorizonCondition } from "./horizonCondition.js";

const BODY_BY_KEY = Object.fromEntries(PLANET_BODIES.map((p) => [p.key, p.body]));

/**
 * @param {object} params
 * @param {string} params.planetKey
 * @param {number} params.longitude planet's absolute ecliptic longitude
 * @param {number} params.speedDegPerDay
 * @param {boolean} params.retrograde
 * @param {number} params.sunLongitude
 * @param {"day"|"night"} params.chartSect
 * @param {import("astronomy-engine").AstroTime} params.astroTime
 * @param {number} params.latitude
 * @param {number} params.longitudeEast geographic longitude (east positive)
 * @returns {object} the `condition` object (see module doc / README for shape)
 */
export function computePlanetaryCondition({
  planetKey,
  longitude,
  speedDegPerDay,
  retrograde,
  sunLongitude,
  chartSect,
  astroTime,
  latitude,
  longitudeEast,
}) {
  // --- Sect family / Mercury phase / isOfSect ---
  const family = getSectFamily(planetKey);
  let mercuryPhase = null;
  let effectiveSect;

  if (planetKey === "mercury") {
    const phase = computeMercuryPhase(longitude, sunLongitude);
    mercuryPhase = phase.mercuryPhase;
    effectiveSect = phase.mercurySect;
  } else {
    effectiveSect = family; // "diurnal" | "nocturnal" (Sun/Jupiter/Saturn/Moon/Venus/Mars all fixed)
  }

  const sect = {
    family,
    mercuryPhase,
    effectiveSect,
    isOfSect: checkIsOfSect(effectiveSect, chartSect),
  };

  // --- Solar condition (not applicable to the Sun itself) ---
  const solar =
    planetKey === "sun"
      ? null
      : computeSolarCondition(longitude, sunLongitude);

  // --- Motion (reused, not recalculated) ---
  const motion = {
    direction: retrograde ? "retrograde" : "direct",
    longitudeSpeed: speedDegPerDay,
  };

  // --- Horizon (real geometric altitude) ---
  const body = BODY_BY_KEY[planetKey];
  const { altitudeDegrees, isAboveHorizon } = computeHorizonCondition(astroTime, latitude, longitudeEast, body);
  const horizon = { altitude: altitudeDegrees, isAboveHorizon };

  return { chartSect, sect, solar, motion, horizon };
}
