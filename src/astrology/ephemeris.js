/**
 * Chart orchestration: ties together time conversion, planetary positions,
 * and house calculation into a single structured result.
 *
 * This is the only module the UI layer should talk to for calculations —
 * App.jsx must not contain any astrology math itself.
 */

import * as Astronomy from "astronomy-engine";
import { convertLocalBirthTimeToUTC, calculateJulianDay } from "./time.js";
import { computePlanetPositions } from "./planets.js";
import { computeHouseCusps, getHouseForLongitude, SUPPORTED_HOUSE_SYSTEMS } from "./houses.js";
import { getZodiacSign, normalizeDegrees } from "./zodiac.js";
import { buildModernWesternPoints } from "./modernWestern.js";
import { buildClassicalChart } from "./classical/classicalChart.js";
import { buildVedicChart } from "./vedic/vedicChart.js";
import { buildCrossSystemEvidence } from "./crossSystem.js";

/**
 * Validates raw form input. Throws a descriptive Error on the first problem found.
 */
function validateInput({ birthDate, birthTime, latitude, longitude, utcOffset, houseSystem }) {
  if (!birthDate) throw new Error("Birth Date is required.");
  if (!birthTime) throw new Error("Birth Time is required.");
  if (!utcOffset) throw new Error("UTC Offset is required.");

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (latitude === "" || latitude === undefined || latitude === null || Number.isNaN(lat)) {
    throw new Error("Latitude is required and must be a number.");
  }
  if (lat < -90 || lat > 90) {
    throw new Error(`Latitude must be between -90 and +90. Received: ${latitude}`);
  }

  if (longitude === "" || longitude === undefined || longitude === null || Number.isNaN(lon)) {
    throw new Error("Longitude is required and must be a number.");
  }
  if (lon < -180 || lon > 180) {
    throw new Error(`Longitude must be between -180 and +180. Received: ${longitude}`);
  }

  if (houseSystem && !SUPPORTED_HOUSE_SYSTEMS.includes(houseSystem)) {
    throw new Error(`House system "${houseSystem}" is not supported in Phase 1.`);
  }

  return { latitude: lat, longitude: lon };
}

/**
 * Calculates a full Phase 1 tropical natal chart.
 *
 * @param {object} input
 * @param {string} input.birthDate "YYYY-MM-DD"
 * @param {string} input.birthTime "HH:MM" or "HH:MM:SS"
 * @param {number|string} input.latitude degrees north positive, -90..90
 * @param {number|string} input.longitude degrees east positive, -180..180
 * @param {string} input.utcOffset e.g. "+08:00"
 * @param {string} [input.houseSystem="placidus"]
 * @returns {object} structured chart data
 */
export function calculateChart(input) {
  const houseSystem = input.houseSystem || "placidus";
  const { latitude, longitude } = validateInput({ ...input, houseSystem });

  let utcDate;
  try {
    utcDate = convertLocalBirthTimeToUTC(input.birthDate, input.birthTime, input.utcOffset);
  } catch (err) {
    throw new Error(`Time conversion failed: ${err.message}`);
  }

  const julianDay = calculateJulianDay(utcDate);

  let astroTime;
  let planets;
  let houses;
  try {
    astroTime = Astronomy.MakeTime(utcDate);
    planets = computePlanetPositions(astroTime);
    houses = computeHouseCusps(astroTime, latitude, longitude, houseSystem);
  } catch (err) {
    throw new Error(`Ephemeris engine failed to load. (${err.message})`);
  }

  const planetsWithSignAndHouse = planets.map((p) => {
    const { sign, degreeInSign } = getZodiacSign(p.longitude);
    return {
      ...p,
      sign,
      degreeInSign,
      house: getHouseForLongitude(p.longitude, houses.cusps),
    };
  });

  const angles = {
    asc: { longitude: houses.asc, ...getZodiacSign(houses.asc) },
    mc: { longitude: houses.mc, ...getZodiacSign(houses.mc) },
    ic: { longitude: houses.ic, ...getZodiacSign(houses.ic) },
    desc: { longitude: houses.desc, ...getZodiacSign(houses.desc) },
  };

  const houseCusps = houses.cusps.map((longitude, i) => {
    const { sign, degreeInSign } = getZodiacSign(longitude);
    return { house: i + 1, longitude: normalizeDegrees(longitude), sign, degreeInSign };
  });

  const nodeType = input.nodeType || "true";
  const lilithType = input.lilithType || "mean";

  const points = buildModernWesternPoints({
    astroTime,
    latitude,
    longitude,
    houses,
    planetsWithSignAndHouse,
    nodeType,
    lilithType,
  });

  const chart = {
    meta: {
      utcDate,
      utcIso: utcDate.toISOString(),
      julianDay,
      zodiacType: "tropical",
      houseSystem,
      nodeType,
      lilithType,
      input,
    },
    planets: planetsWithSignAndHouse,
    angles,
    houseCusps,
    points,
  };

  chart.classical = buildClassicalChart({ chart, astroTime, latitude, longitude });

  // Phase 4A: Vedic sidereal foundation. Kept structurally separate from
  // chart.points/chart.classical, deriving sidereal positions from the
  // already-verified tropical data above - never a second ephemeris, and
  // never mutating the Modern Western/Classical outputs.
  chart.vedic = buildVedicChart({ chart, astroTime });

  // Phase 5: neutral cross-system evidence mapping layer, built purely
  // from the now-complete Modern Western/Classical/Vedic structures
  // above - no new astronomical or astrological calculation, no merge of
  // the three systems, no mutation of chart.points/chart.classical/chart.vedic.
  chart.crossSystem = buildCrossSystemEvidence({ chart });

  return chart;
}
