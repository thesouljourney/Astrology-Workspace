/**
 * Vedic Nakshatra & Pada placement — Phase 4C.
 *
 * SCOPE: this module derives the 27-Nakshatra/4-Pada placement layer
 * purely from data Phase 4A already computed and locked (the sidereal
 * Lagna and Navagraha longitudes) — it performs no astronomical
 * calculation, recomputes no tropical position, and never touches the
 * ayanamsha. It builds: each Nakshatra's identity/lord, each Graha's
 * (and the Lagna's) Nakshatra + Pada, and a prominently-exposed Moon
 * Nakshatra summary. It deliberately does NOT implement Dasha (of any
 * kind - Mahadasha, Antardasha, Pratyantardasha, balance-at-birth, or a
 * timeline), Navamsa/D9/any Varga, Tara Bala, or any interpretation -
 * `chart.vedic.meta` marks every one of those explicitly
 * `"not_implemented"`/`"none"`, never silently omitted.
 *
 * INPUT SOURCE (never anything else): `chart.vedic.lagna.siderealLongitude`
 * and `chart.vedic.grahas[*].siderealLongitude` - both already-verified
 * Phase 4A sidereal longitudes, passed in by the caller. This module
 * creates no second sidereal engine and mutates neither object.
 *
 * ====================================================================
 * GEOMETRY (Part A)
 * ====================================================================
 *
 * 27 Nakshatras span the 360-degree sidereal zodiac in fixed order, each
 * spanning exactly 360/27 = 13 + 20/60 degrees (13 degrees 20 arcminutes);
 * each Nakshatra divides into 4 Padas, each spanning exactly
 * 360/108 = 3 + 20/60 degrees (3 degrees 20 arcminutes). Both spans are
 * computed here as exact fractions (`360 / 27`, `360 / 108`), never a
 * rounded decimal literal like `13.33`.
 *
 * ====================================================================
 * FLOATING-POINT SAFETY (Part G) - read this before touching the index math
 * ====================================================================
 *
 * `360 / 27` is not exactly representable in IEEE-754 double precision
 * (it is a repeating fraction in decimal, though not in binary either -
 * 27 has prime factor 3, which never divides a power of 2), so naively
 * comparing a longitude against `nakshatraIndex * (360 / 27)` risks
 * exactly the kind of drift Part G warns about: a longitude that is
 * mathematically supposed to sit precisely on a Nakshatra/Pada boundary
 * could land a few ULPs to the wrong side of it purely from
 * floating-point rounding, misclassifying the body by one whole
 * Nakshatra or Pada.
 *
 * This module avoids that by doing every index/boundary decision in an
 * integer **microarcsecond** space instead of raw floating degrees:
 *
 *   360 degrees = 1,296,000 arcseconds = 1,296,000,000,000 microarcseconds
 *   Nakshatra span = 1,296,000,000,000 / 27 = 48,000,000,000 microarcsec (EXACT)
 *   Pada span      = 1,296,000,000,000 / 108 = 12,000,000,000 microarcsec (EXACT)
 *
 * Both span constants divide evenly - no rounding error is possible in
 * the constants themselves (unlike `360 / 27` in degrees). A longitude
 * is converted to this integer space by `Math.round(degrees * 3.6e9)`
 * (microarcseconds are always small enough here - at most ~1.296e12 -
 * to stay far inside JavaScript's safe-integer range of 2^53). The
 * `Math.round` deliberately snaps away any sub-microarcsecond binary
 * floating-point noise (which is many orders of magnitude smaller than
 * a microarcsecond for longitudes in the 0-360 degree range - IEEE-754
 * double absolute precision here is roughly 1e-10 microarcsecond),
 * while preserving every deliberate, real difference this phase's own
 * boundary tests rely on (e.g. the 0.001 arcsecond = 1,000 microarcsecond
 * gap between "13d19m59.999s" and the exact 13d20m boundary is nine
 * orders of magnitude larger than the floating-point noise being
 * filtered out). All Nakshatra/Pada INDEX decisions use this integer
 * space exclusively; the human-readable `degreeWithinNakshatra` value
 * returned to callers is derived back from that same integer space, so
 * the displayed degree and the assigned Pada can never disagree with
 * each other. The stored sidereal longitude itself (Phase 4A's own
 * value) is never rounded, truncated, or otherwise degraded - only this
 * module's internal index arithmetic uses the integer representation.
 *
 * ====================================================================
 * BOUNDARY POLICY (Part H)
 * ====================================================================
 *
 * Half-open intervals, start-inclusive / end-exclusive: `[start, end)`.
 * The start boundary of a Nakshatra or Pada belongs to that Nakshatra/
 * Pada; the end boundary belongs to the next one. E.g. exactly
 * 13d20m00.000s is Bharani Pada 1 (not the end of Ashwini Pada 4), and
 * exactly 13d19m59.999s is (the very end of) Ashwini.
 */

import { normalizeDegrees } from "../zodiac.js";
import { formatDegreeDMS } from "./rashi.js";
import { GRAHA_DISPLAY_NAME, NAVAGRAHA_ORDER } from "./grahaNames.js";

export const NAKSHATRA_SYSTEM = "27_nakshatra_4_pada";
export const NAKSHATRA_BOUNDARY_POLICY = "half_open_start_inclusive_end_exclusive";
export const NAKSHATRA_LORD_SEQUENCE_NAME = "vimshottari_9_lord_cycle";
export const DASHA_SYSTEM_STATUS = "not_implemented";
export const NAVAMSA_FROM_PADA_STATUS = "not_implemented";
export const NAKSHATRA_INTERPRETATION = "none";

/** Exact fractional spans (Part A) - never a rounded decimal literal. */
export const NAKSHATRA_SPAN_DEGREES = 360 / 27;
export const PADA_SPAN_DEGREES = 360 / 108;

/** Integer microarcsecond space used for all boundary/index decisions (Part G) - see module doc comment. */
const MICROARCSEC_PER_DEGREE = 3600 * 1e6;
const NAKSHATRA_SPAN_MICROARCSEC = 1_296_000_000_000 / 27; // = 48,000,000,000 exactly
const PADA_SPAN_MICROARCSEC = 1_296_000_000_000 / 108; // = 12,000,000,000 exactly

/** The standard 9-lord Vimshottari sequence (Part C) - used ONLY to assign each Nakshatra's lord, nothing more (no Dasha of any kind is computed anywhere in this module). */
export const NAKSHATRA_LORD_SEQUENCE = ["ketu", "venus", "sun", "moon", "mars", "rahu", "jupiter", "saturn", "mercury"];

const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati",
];

const NAKSHATRA_KEYS = [
  "ashwini", "bharani", "krittika", "rohini", "mrigashira", "ardra", "punarvasu", "pushya", "ashlesha",
  "magha", "purva_phalguni", "uttara_phalguni", "hasta", "chitra", "swati", "vishakha", "anuradha", "jyeshtha",
  "mula", "purva_ashadha", "uttara_ashadha", "shravana", "dhanishta", "shatabhisha", "purva_bhadrapada",
  "uttara_bhadrapada", "revati",
];

/** All 27 Nakshatras, in fixed zodiacal order (Part B), each with its Vimshottari lord (Part C). */
export const NAKSHATRAS = NAKSHATRA_NAMES.map((name, index) => ({
  index,
  key: NAKSHATRA_KEYS[index],
  name,
  lordKey: NAKSHATRA_LORD_SEQUENCE[index % 9],
}));

/**
 * Resolves the Nakshatra and Pada for a sidereal longitude, using the
 * integer-microarcsecond boundary math described in the module doc
 * comment - never raw floating-degree comparisons against a Nakshatra/
 * Pada span.
 *
 * @param {number} siderealLongitude 0-360 (normalized internally)
 * @returns {{
 *   siderealLongitude: number,
 *   nakshatra: string,
 *   nakshatraNumber: number,
 *   nakshatraIndex: number,
 *   nakshatraKey: string,
 *   nakshatraLord: string,
 *   pada: number,
 *   padaIndex: number,
 *   degreeWithinNakshatra: number,
 *   degreeFormatted: string,
 * }}
 */
export function getNakshatra(siderealLongitude) {
  const longitude = normalizeDegrees(siderealLongitude);
  const longitudeMicroarcsec = Math.round(longitude * MICROARCSEC_PER_DEGREE);

  const nakshatraIndex = Math.min(26, Math.floor(longitudeMicroarcsec / NAKSHATRA_SPAN_MICROARCSEC));
  const degreeWithinNakshatraMicroarcsec = longitudeMicroarcsec - nakshatraIndex * NAKSHATRA_SPAN_MICROARCSEC;

  const padaIndex = Math.min(3, Math.floor(degreeWithinNakshatraMicroarcsec / PADA_SPAN_MICROARCSEC));

  const degreeWithinNakshatra = degreeWithinNakshatraMicroarcsec / MICROARCSEC_PER_DEGREE;
  const nakshatra = NAKSHATRAS[nakshatraIndex];

  return {
    siderealLongitude: longitude,
    nakshatra: nakshatra.name,
    nakshatraNumber: nakshatra.index + 1,
    nakshatraIndex: nakshatra.index,
    nakshatraKey: nakshatra.key,
    nakshatraLord: GRAHA_DISPLAY_NAME[nakshatra.lordKey],
    pada: padaIndex + 1,
    padaIndex,
    degreeWithinNakshatra,
    degreeFormatted: formatDegreeDMS(degreeWithinNakshatra),
  };
}

/**
 * Builds the Phase 4C Nakshatra/Pada structure from already-locked
 * Phase 4A sidereal longitudes - `lagna.siderealLongitude` and each
 * `grahas[*].siderealLongitude` - no additional astronomical input.
 *
 * @param {object} params
 * @param {object} params.lagna Phase 4A `chart.vedic.lagna` (needs `.siderealLongitude`)
 * @param {object} params.grahas Phase 4A `chart.vedic.grahas` (keyed by lowercase graha key, each needs `.siderealLongitude`)
 * @returns {object} `chart.vedic.nakshatra` (see module doc comment / README for shape)
 */
export function buildVedicNakshatra({ lagna, grahas }) {
  const lagnaNakshatra = getNakshatra(lagna.siderealLongitude);

  const grahaNakshatras = {};
  for (const key of NAVAGRAHA_ORDER) {
    grahaNakshatras[key] = getNakshatra(grahas[key].siderealLongitude);
  }

  return {
    meta: {
      system: NAKSHATRA_SYSTEM,
      nakshatraSpanDegrees: NAKSHATRA_SPAN_DEGREES,
      padaSpanDegrees: PADA_SPAN_DEGREES,
      boundaryPolicy: NAKSHATRA_BOUNDARY_POLICY,
      lordSequence: NAKSHATRA_LORD_SEQUENCE.map((key) => GRAHA_DISPLAY_NAME[key]),
    },
    lagna: lagnaNakshatra,
    grahas: grahaNakshatras,
    // Prominently exposed per Part J - a plain duplicate view of
    // grahas.moon, purely for discoverability; no new computation.
    moonNakshatra: {
      name: grahaNakshatras.moon.nakshatra,
      number: grahaNakshatras.moon.nakshatraNumber,
      lord: grahaNakshatras.moon.nakshatraLord,
      pada: grahaNakshatras.moon.pada,
    },
  };
}
