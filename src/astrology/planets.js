/**
 * Geocentric tropical planetary longitude calculations.
 *
 * Calculation engine: astronomy-engine (pure JS/TS, MIT licensed).
 * It ships no external data files and performs all computation locally
 * in-process (VSOP87/ELP2000/Pluto-analytic style series compiled into the
 * library itself) — there is no network access involved at any point.
 *
 * All longitudes returned here are:
 *   - Geocentric (as seen from Earth's center, not topocentric)
 *   - Apparent (corrected for light-time and aberration)
 *   - Referred to the TRUE ecliptic and equinox OF DATE (tropical, no
 *     ayanamsa applied)
 */

import * as Astronomy from "astronomy-engine";
import { normalizeDegrees } from "./zodiac.js";

export const PLANET_BODIES = [
  { key: "sun", english: "Sun", chinese: "太阳", body: Astronomy.Body.Sun, canRetrograde: false },
  { key: "moon", english: "Moon", chinese: "月亮", body: Astronomy.Body.Moon, canRetrograde: false },
  { key: "mercury", english: "Mercury", chinese: "水星", body: Astronomy.Body.Mercury, canRetrograde: true },
  { key: "venus", english: "Venus", chinese: "金星", body: Astronomy.Body.Venus, canRetrograde: true },
  { key: "mars", english: "Mars", chinese: "火星", body: Astronomy.Body.Mars, canRetrograde: true },
  { key: "jupiter", english: "Jupiter", chinese: "木星", body: Astronomy.Body.Jupiter, canRetrograde: true },
  { key: "saturn", english: "Saturn", chinese: "土星", body: Astronomy.Body.Saturn, canRetrograde: true },
  { key: "uranus", english: "Uranus", chinese: "天王星", body: Astronomy.Body.Uranus, canRetrograde: true },
  { key: "neptune", english: "Neptune", chinese: "海王星", body: Astronomy.Body.Neptune, canRetrograde: true },
  { key: "pluto", english: "Pluto", chinese: "冥王星", body: Astronomy.Body.Pluto, canRetrograde: true },
];

// Half-width (in days) of the central-difference window used to derive
// instantaneous ecliptic longitude speed (deg/day) for retrograde detection.
const SPEED_HALF_WINDOW_DAYS = 1 / 48; // 30 minutes each side

/**
 * Geocentric apparent tropical ecliptic longitude of `body` at `astroTime`.
 * @param {Astronomy.Body} body
 * @param {Astronomy.AstroTime} astroTime
 * @returns {number} longitude in degrees [0, 360)
 */
function geocentricEclipticLongitude(body, astroTime) {
  const geoVector = Astronomy.GeoVector(body, astroTime, true);
  const ecliptic = Astronomy.Ecliptic(geoVector);
  return normalizeDegrees(ecliptic.elon);
}

/**
 * Computes ecliptic longitude and longitudinal speed (deg/day) for a body,
 * via symmetric central difference. Speed < 0 means retrograde motion.
 *
 * Exported so other modules (e.g. classical/directPerfection.js, Phase
 * 3G-A) can recalculate a single body's real position/speed at an
 * arbitrary future AstroTime using this exact same method, rather than
 * building a second, competing longitude calculation.
 */
export function computeLongitudeAndSpeed(body, astroTime) {
  const longitude = geocentricEclipticLongitude(body, astroTime);

  const before = geocentricEclipticLongitude(body, astroTime.AddDays(-SPEED_HALF_WINDOW_DAYS));
  const after = geocentricEclipticLongitude(body, astroTime.AddDays(SPEED_HALF_WINDOW_DAYS));

  // Unwrap across the 0/360 boundary before differencing.
  let delta = after - before;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;

  const speedDegPerDay = delta / (2 * SPEED_HALF_WINDOW_DAYS);

  return { longitude, speedDegPerDay };
}

/**
 * Computes geocentric tropical positions for the Phase 1 planet set.
 *
 * @param {Astronomy.AstroTime} astroTime
 * @returns {Array<{key,english,chinese,longitude,speedDegPerDay,retrograde}>}
 */
export function computePlanetPositions(astroTime) {
  return PLANET_BODIES.map(({ key, english, chinese, body, canRetrograde }) => {
    const { longitude, speedDegPerDay } = computeLongitudeAndSpeed(body, astroTime);
    return {
      key,
      english,
      chinese,
      longitude,
      speedDegPerDay,
      retrograde: canRetrograde && speedDegPerDay < 0,
    };
  });
}
