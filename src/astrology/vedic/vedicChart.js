/**
 * Vedic Sidereal Foundation & Navagraha — Phase 4A.
 *
 * SCOPE: sidereal conversion, ayanamsha, the nine Navagraha, Rashi
 * placement, and a sidereal Lagna FOUNDATION value only. Deliberately
 * does NOT implement Bhava/houses, Nakshatra, dignity, lordship, yogas,
 * dasha, or any interpretation — see chart.vedic.meta for explicit
 * "not_yet_implemented"/"none" markers, never silently omitted.
 *
 * ARCHITECTURE: zero new planetary ephemeris. Every position here is
 * derived from the already-verified Phase 1 tropical longitudes
 * (planets.js), the already-locked Phase 2 lunar-node functions
 * (nodes.js), and the already-verified Phase 1 house/Ascendant
 * calculation (houses.js) — this module only subtracts an explicitly
 * researched, time-varying Lahiri ayanamsha (ayanamsha.js) and performs
 * Rashi lookup (rashi.js). See those modules' own doc comments for the
 * full research/verification trail.
 *
 * SIDEREAL CONVERSION: siderealLongitude = normalize360(tropicalLongitude
 * - ayanamshaDegrees), using the tropical longitude EXACTLY as already
 * computed upstream (never altered) — see ayanamsha.js's doc comment for
 * why this simple, exactly-reconciling formula is used verbatim rather
 * than adding a hidden nutation correction.
 *
 * NODE CONVENTION: Rahu uses the MEAN lunar node (reusing nodes.js's
 * `computeMeanNode` verbatim), per the project owner's explicit decision
 * after research found most traditional Jyotish texts/software assume
 * the mean node — see Part E research notes in the Phase 4A report.
 * Ketu is never computed independently: it is always exactly the mean
 * node's tropical longitude + 180 degrees (nodes.js's own
 * `computeSouthNode`), so the sidereal reconciliation
 * (tropicalLongitude - ayanamsha === siderealLongitude) holds for Ketu
 * exactly the same way it does for every other Graha.
 *
 * MOTION: tropical speed is reused verbatim from Phase 1/2. Sidereal
 * speed is NOT assumed equal to it — ayanamsha itself changes over time
 * (~0.0139 deg/day), so this module computes sidereal speed properly via
 * the exact same symmetric finite-difference technique planets.js
 * already uses for tropical speed (same half-window, same wraparound
 * handling), applied to the sidereal longitude function instead. No new
 * numerical method is introduced; this is the same technique the project
 * has used since Phase 1. `retrograde` is derived from the SIDEREAL
 * speed (the technically correct choice for a sidereal chart, since a
 * planet's sidereal station can occur at a measurably different instant
 * than its tropical station), never from a hard-coded assumption. This
 * is a purely technical motion fact, not a Vedic retrograde
 * interpretation.
 */

import { normalizeDegrees } from "../zodiac.js";
import { PLANET_BODIES, computeLongitudeAndSpeed } from "../planets.js";
import { computeMeanNode, computeSouthNode } from "../nodes.js";
import {
  computeLahiriAyanamsha,
  AYANAMSHA_FAMILY,
  AYANAMSHA_CONVENTION,
  AYANAMSHA_INCLUDES_NUTATION,
  SIDEREAL_CONVERSION,
  EXTERNAL_VERIFICATION,
} from "./ayanamsha.js";
import { getRashi } from "./rashi.js";
import { NAVAGRAHA_ORDER } from "./grahaNames.js";
import {
  buildVedicBhava,
  VEDIC_BHAVA_SYSTEM,
  VEDIC_BHAVA_CUSP_MODEL,
  VEDIC_HOUSE_LORDSHIP_SYSTEM,
  VEDIC_BHAVA_CHALIT_STATUS,
  VEDIC_FUNCTIONAL_LORDSHIP_STATUS,
  VEDIC_HOUSE_INTERPRETATION,
} from "./bhava.js";

export { NAVAGRAHA_ORDER };

const REAL_PLANET_KEYS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];

const DISPLAY_NAME = {
  sun: "Sun",
  moon: "Moon",
  mars: "Mars",
  mercury: "Mercury",
  jupiter: "Jupiter",
  venus: "Venus",
  saturn: "Saturn",
  rahu: "Rahu",
  ketu: "Ketu",
};

export const VEDIC_NODE_TYPE = "mean";

// Same symmetric-difference half-window planets.js already uses for
// tropical speed (30 minutes each side) - reused here, not reinvented,
// for sidereal speed.
const SPEED_HALF_WINDOW_DAYS = 1 / 48;

function bodyForPlanet(planetKey) {
  return PLANET_BODIES.find((p) => p.key === planetKey).body;
}

/** Sidereal longitude of a real planet at an arbitrary instant (used only for the speed probe below). */
function siderealLongitudeOfPlanetAt(planetKey, astroTime) {
  const { longitude } = computeLongitudeAndSpeed(bodyForPlanet(planetKey), astroTime);
  const { degrees: ayanamsha } = computeLahiriAyanamsha(astroTime);
  return normalizeDegrees(longitude - ayanamsha);
}

/** Sidereal longitude of the mean lunar node at an arbitrary instant (used only for the speed probe below). */
function siderealMeanNodeLongitudeAt(astroTime) {
  const tropical = computeMeanNode(astroTime);
  const { degrees: ayanamsha } = computeLahiriAyanamsha(astroTime);
  return normalizeDegrees(tropical - ayanamsha);
}

/**
 * Symmetric finite-difference speed of a sidereal-longitude function,
 * exactly mirroring planets.js's own tropical-speed technique (same
 * half-window, same 180-degree wraparound handling) - reused, not a new
 * numerical method.
 */
function computeSiderealSpeed(siderealLongitudeFn, astroTime) {
  const before = siderealLongitudeFn(astroTime.AddDays(-SPEED_HALF_WINDOW_DAYS));
  const after = siderealLongitudeFn(astroTime.AddDays(SPEED_HALF_WINDOW_DAYS));
  let delta = after - before;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta / (2 * SPEED_HALF_WINDOW_DAYS);
}

function buildGrahaRecord({ key, tropicalLongitude, ayanamshaDegrees, tropicalSpeedDegPerDay, siderealSpeedDegPerDay, forceNeverRetrograde }) {
  const siderealLongitude = normalizeDegrees(tropicalLongitude - ayanamshaDegrees);
  const { rashi, rashiIndex, degreeWithinRashi, degreeFormatted } = getRashi(siderealLongitude);
  const retrograde = forceNeverRetrograde ? false : siderealSpeedDegPerDay < 0;

  return {
    name: DISPLAY_NAME[key],
    tropicalLongitude,
    ayanamshaDegrees,
    siderealLongitude,
    rashi: rashi.name,
    rashiIndex,
    degreeWithinRashi,
    degreeFormatted,
    motion: {
      tropicalSpeedDegPerDay,
      siderealSpeedDegPerDay,
      retrograde,
    },
  };
}

/**
 * @param {object} params
 * @param {object} params.chart the already-computed Phase 1 chart (chart.planets, chart.angles)
 * @param {import("astronomy-engine").AstroTime} params.astroTime
 * @returns {object} chart.vedic (see module doc comment / README for shape)
 */
export function buildVedicChart({ chart, astroTime }) {
  const ayanamsha = computeLahiriAyanamsha(astroTime);
  const ayanamshaDegrees = ayanamsha.degrees;

  const grahas = {};

  for (const key of REAL_PLANET_KEYS) {
    const p = chart.planets.find((pl) => pl.key === key);
    const siderealSpeedDegPerDay = computeSiderealSpeed((t) => siderealLongitudeOfPlanetAt(key, t), astroTime);
    // Sun/Moon are never retrograde by convention throughout this project
    // (their apparent geocentric speed is always positive) - see
    // planets.js's PLANET_BODIES `canRetrograde: false` for Sun/Moon.
    const forceNeverRetrograde = key === "sun" || key === "moon";
    grahas[key] = buildGrahaRecord({
      key,
      tropicalLongitude: p.longitude,
      ayanamshaDegrees,
      tropicalSpeedDegPerDay: p.speedDegPerDay,
      siderealSpeedDegPerDay,
      forceNeverRetrograde,
    });
  }

  // Rahu: mean lunar node (project default - see Part E research notes).
  // Reuses nodes.js's already-locked computeMeanNode verbatim - no new
  // node calculation.
  const rahuTropicalLongitude = computeMeanNode(astroTime);
  const rahuTropicalSpeed = (() => {
    const before = computeMeanNode(astroTime.AddDays(-SPEED_HALF_WINDOW_DAYS));
    const after = computeMeanNode(astroTime.AddDays(SPEED_HALF_WINDOW_DAYS));
    let delta = after - before;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return delta / (2 * SPEED_HALF_WINDOW_DAYS);
  })();
  const rahuSiderealSpeed = computeSiderealSpeed(siderealMeanNodeLongitudeAt, astroTime);
  grahas.rahu = {
    ...buildGrahaRecord({
      key: "rahu",
      tropicalLongitude: rahuTropicalLongitude,
      ayanamshaDegrees,
      tropicalSpeedDegPerDay: rahuTropicalSpeed,
      siderealSpeedDegPerDay: rahuSiderealSpeed,
      forceNeverRetrograde: false,
    }),
    nodeType: VEDIC_NODE_TYPE,
  };

  // Ketu: NEVER computed independently - always exactly Rahu's tropical
  // longitude + 180 degrees (nodes.js's own computeSouthNode), so the
  // tropicalLongitude - ayanamsha === siderealLongitude reconciliation
  // (Part N) holds for Ketu exactly like every other Graha, and Ketu
  // lands exactly 180 degrees from Rahu in sidereal longitude too (the
  // subtraction of the same ayanamsha from both distributes exactly).
  const ketuTropicalLongitude = computeSouthNode(rahuTropicalLongitude);
  grahas.ketu = {
    ...buildGrahaRecord({
      key: "ketu",
      tropicalLongitude: ketuTropicalLongitude,
      ayanamshaDegrees,
      tropicalSpeedDegPerDay: rahuTropicalSpeed,
      siderealSpeedDegPerDay: rahuSiderealSpeed,
      forceNeverRetrograde: false,
    }),
    nodeType: VEDIC_NODE_TYPE,
  };

  // Sidereal Lagna FOUNDATION only - explicitly NOT a Bhava/house-1
  // placement engine (Part I/H). Reuses Phase 1's already-verified
  // tropical Ascendant verbatim.
  const tropicalAscendant = chart.angles.asc.longitude;
  const lagnaSiderealLongitude = normalizeDegrees(tropicalAscendant - ayanamshaDegrees);
  const lagnaRashi = getRashi(lagnaSiderealLongitude);
  const lagna = {
    label: "Sidereal Ascendant / Lagna foundation - NOT a Bhava/house-1 placement engine",
    tropicalLongitude: tropicalAscendant,
    ayanamshaDegrees,
    siderealLongitude: lagnaSiderealLongitude,
    rashi: lagnaRashi.rashi.name,
    rashiIndex: lagnaRashi.rashiIndex,
    degreeWithinRashi: lagnaRashi.degreeWithinRashi,
    degreeFormatted: lagnaRashi.degreeFormatted,
  };

  // Phase 4B: Whole-Sign Bhava structure, derived purely from the
  // sidereal Lagna/Graha Rashis just computed above - no second sidereal
  // engine, and the Phase 4A `lagna`/`grahas` objects above are never
  // mutated (Bhava data lives in its own additive `chart.vedic.bhava`).
  const bhava = buildVedicBhava({ lagna, grahas });

  const meta = {
    vedicSystem: "jyotish",
    zodiacType: "sidereal",
    ayanamsha: AYANAMSHA_FAMILY,
    ayanamshaImplementation: AYANAMSHA_CONVENTION,
    ayanamshaIncludesNutation: AYANAMSHA_INCLUDES_NUTATION,
    siderealConversion: SIDEREAL_CONVERSION,
    externalVerification: EXTERNAL_VERIFICATION,
    vedicNodeType: VEDIC_NODE_TYPE,
    grahaSet: "navagraha",
    rashiSystem: "12_equal_30_degree_signs",
    bhavaSystem: VEDIC_BHAVA_SYSTEM,
    bhavaCuspModel: VEDIC_BHAVA_CUSP_MODEL,
    houseLordshipSystem: VEDIC_HOUSE_LORDSHIP_SYSTEM,
    bhavaChalit: VEDIC_BHAVA_CHALIT_STATUS,
    functionalLordship: VEDIC_FUNCTIONAL_LORDSHIP_STATUS,
    nakshatraSystem: "not_yet_implemented",
    vedicInterpretation: "none",
    vedicHouseInterpretation: VEDIC_HOUSE_INTERPRETATION,
  };

  return { meta, ayanamsha, lagna, grahas, bhava };
}
