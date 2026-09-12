/**
 * Lahiri (Chitrapaksha) ayanamsha — Phase 4A, audited/refined before locking.
 *
 * ayanamsha = the arc, measured along the ecliptic, between the tropical
 * (sayana) zero point (the moving vernal equinox) and the fixed sidereal
 * (nirayana) zero point used by Hindu/Jyotish astronomy. It is NOT a
 * constant — it grows over time at essentially the rate of the equinoxes'
 * precession — so this module never hard-codes a single offset; it
 * implements a genuine function of time.
 *
 * ====================================================================
 * EXACT QUANTITY IMPLEMENTED (audit Part B) — read this first
 * ====================================================================
 *
 * `computeLahiriAyanamsha()` implements the MEAN (precessional-only,
 * nutation-EXCLUDED) Lahiri ayanamsha, calibrated to reproduce Swiss
 * Ephemeris's own mean Lahiri quantity. This is precisely Swiss
 * Ephemeris's `swe_get_ayanamsa_ut()` / `swe_get_ayanamsa()` value for
 * `SE_SIDM_LAHIRI` — NOT the "true"/nutation-including Chitrapaksha
 * value, and NOT a reproduction of Swiss Ephemeris's full
 * `SEFLG_SIDEREAL` planetary pipeline (see the nutation section below
 * for exactly how those three differ and by how much). This module is
 * therefore option (A)/(C) in the audit's terms: a mean/precessional
 * Lahiri ayanamsha, implemented as an offline calibrated approximation
 * to Swiss Ephemeris's own mean ayanamsha function — never claimed to
 * be "the Swiss Ephemeris Lahiri implementation" outright, since Swiss
 * Ephemeris is not the production engine here and its full sidereal
 * pipeline (which additionally strips nutation from the tropical side —
 * see below) is not reproduced.
 *
 * ====================================================================
 * SOURCES CROSS-CHECKED (Part A) — exactly what was verified
 * ====================================================================
 *
 * SOURCE A — the historical/official Lahiri definition. N.C. Lahiri,
 * Secretary of the Indian Calendar Reform Committee (1952-56), defined
 * this ayanamsha with reference to the fixed star Spica/Chitra (hence
 * "Chitrapaksha"), calibrated so that the tropical and sidereal zeros
 * coincided around 285 CE, precessing at essentially the general
 * precession rate (~50.3"/year).
 *
 * SOURCE B — direct dev-time cross-check against Swiss Ephemeris,
 * using a specific, named function, verified to exclude nutation. Swiss
 * Ephemeris was installed as a TEMPORARY devDependency (`sweph-wasm`,
 * never a production dependency — removed immediately after this
 * verification) purely to measure its ayanamsha output. The EXACT call
 * used was `swe.swe_get_ayanamsa_ut(tjd_ut)` (cross-checked identical,
 * to sub-milliarcsecond precision, against `swe.swe_get_ayanamsa(tjd_et)`
 * and against `swe.swe_get_ayanamsa_ex_ut(tjd_ut, SEFLG_SWIEPH |
 * SEFLG_NONUT)`). Swiss Ephemeris's own type documentation states
 * plainly that `swe_get_ayanamsa_ut()`/`swe_get_ayanamsa()` compute the
 * ayanamsha "without considering nutation" — confirmed empirically
 * during this audit: `swe_get_ayanamsa_ex_ut(tjd_ut, SEFLG_SWIEPH)`
 * WITHOUT the `SEFLG_NONUT` flag returns a DIFFERENT, larger value (by
 * ~10.8-11", matching the nutation-in-longitude magnitude at that
 * instant almost exactly), while the SAME call WITH `SEFLG_NONUT`
 * exactly reproduces `swe_get_ayanamsa_ut()`. This proves, rather than
 * assumes, that the Source B comparison value EXCLUDED nutation.
 *
 * This module's single free constant (the ayanamsha value at the
 * J2000.0 epoch) was calibrated once against `swe_get_ayanamsa_ut()`,
 * and the resulting formula was then INDEPENDENTLY checked against the
 * same function at five other dates spanning 1900-2024 (including this
 * project's own locked verification date, 1994-11-20) — every one
 * matched to within 0.0003 arcseconds, i.e. far tighter than the
 * "arcminute or larger" threshold that would require stopping to report
 * a material disagreement (see project brief Part A/Q). No disagreement
 * requiring a stop was found — but see the 1956 reference check below,
 * which found a DIFFERENT, already-expected kind of gap against a
 * DIFFERENT quantity (the nutation-including reference value), not a
 * disagreement in what this module actually claims to implement.
 *
 * ====================================================================
 * THE FORMULA
 * ====================================================================
 *
 * ayanamsha(t) = AYANAMSHA_AT_J2000_DEGREES + generalPrecessionInLongitude(t) / 3600
 *
 * where generalPrecessionInLongitude(t), in arcseconds, is the IAU 2000/2006
 * general precession in ecliptic longitude accumulated since J2000.0
 * (N. Capitaine, P.T. Wallace & J. Chapront, "Expressions for IAU 2000
 * precession quantities", Astronomy & Astrophysics 412, 567-586 (2003)):
 *
 *   p_A(T) = 5028.796195" * T + 1.1054348" * T^2   (T = Julian centuries
 *   of Terrestrial Time since J2000.0; higher-order terms are below the
 *   0.001"/century level over the +/-150-year range this project cares
 *   about and are omitted)
 *
 * AYANAMSHA_AT_J2000_DEGREES is the single number calibrated against
 * Source B above. It anchors the (otherwise date-independent)
 * precession formula to Swiss Ephemeris's mean Lahiri zero point at
 * J2000.0 — it is NOT anchored directly to the historical 1956 decree
 * date (see the audited comparison immediately below).
 *
 * ====================================================================
 * AUDIT: THE 1956-03-21 REFERENCE VALUE (audit Part C)
 * ====================================================================
 *
 * The commonly-quoted figure "23°15'00.658" at 1956-03-21 00:00" (the
 * 1985 refinement of the Calendar Reform Committee's original 1956
 * decree) is NOT the mean ayanamsha this module implements — it is the
 * TRUE (nutation-including) Chitrapaksha value. Verified directly during
 * this audit: at 1956-03-21 00:00 TT, this module's formula evaluates to
 * 23°14'44.02" — 16.6 arcseconds LESS than 23°15'00.658". Swiss
 * Ephemeris's own mean function (`swe_get_ayanamsa`, no nutation) at the
 * exact same instant evaluates to 23°14'44.02" as well — the SAME 16.6"
 * gap from the quoted reference — while Swiss Ephemeris's
 * nutation-INCLUDING call (`swe_get_ayanamsa_ex_ut` without
 * `SEFLG_NONUT`) at that same instant evaluates to 23°15'00.80", within
 * 0.14" of the quoted 23°15'00.658" reference. This confirms precisely
 * WHY the gap exists: the quoted historical figure and this module's
 * output are two different, precisely-named quantities (true vs. mean
 * ayanamsha) — not a calibration error. This module's mean ayanamsha
 * matches Swiss Ephemeris's OWN mean ayanamsha at 1956 to within a
 * fraction of an arcsecond, exactly as it does at every other tested
 * date, even though 1956 was never part of the calibration.
 *
 * ====================================================================
 * MEAN vs. TRUE AYANAMSHA (audit Part D) — the two relevant quantities
 * ====================================================================
 *
 * - meanAyanamsha (IMPLEMENTED HERE): precessional-only, no nutation.
 *   Matches Swiss Ephemeris's `swe_get_ayanamsa_ut()`/`swe_get_ayanamsa()`
 *   for `SE_SIDM_LAHIRI` to <0.0003" at every tested date.
 * - trueAyanamshaIncludingNutation (NOT implemented here): the
 *   nutation-including quantity Swiss Ephemeris returns from
 *   `swe_get_ayanamsa_ex_ut()` without `SEFLG_NONUT` (and what
 *   `SE_SIDM_TRUE_CITRA` names directly) — this is the quantity closer
 *   to the historical 1956/1985 decree figure above. This project does
 *   NOT implement a second, nutation-including sidereal engine; adding
 *   one was judged unnecessary for Phase 4A (see Part D/G of the audit
 *   brief) — the single, precisely-named mean quantity is used
 *   consistently everywhere in this project, with the limitation
 *   documented rather than hidden.
 *
 * ====================================================================
 * AUDIT: THE ~11" SIDEREAL-LONGITUDE GAP vs. SWISS EPHEMERIS'S FULL
 * SEFLG_SIDEREAL PIPELINE (audit Part E) — quantitatively decomposed,
 * not merely asserted
 * ====================================================================
 *
 * Swiss Ephemeris's `SEFLG_SIDEREAL` planetary calculation is ALSO
 * confirmed (directly, during this audit) to be a mean-vs-mean
 * quantity: `SE tropical position WITHOUT nutation (SEFLG_NONUT) minus
 * SE's own mean ayanamsha` reproduces `SE's SEFLG_SIDEREAL output`
 * exactly (to 1e-10 degrees, for the Sun, at the verification instant).
 * This project instead follows the project brief's explicit, simpler
 * architecture (Part B/C): siderealLongitude = tropicalLongitude -
 * ayanamsha, using the ALREADY VERIFIED Phase 1 tropical longitude
 * exactly as it already exists — which, like most modern ephemeris
 * output (and per planets.js's own doc comment), is the APPARENT
 * position, i.e. it DOES include nutation. Subtracting this module's
 * nutation-free mean ayanamsha from a nutation-including tropical
 * longitude therefore leaves a residual close to the nutation in
 * longitude itself. Measured directly at the verification instant (Sun):
 *
 *   differenceSiderealArcsec  (this module's production sidereal Sun,
 *                               astronomy-engine tropical - this
 *                               module's ayanamsha, MINUS Swiss
 *                               Ephemeris's own SEFLG_SIDEREAL Sun)  = +11.15"
 *   nutationLongitudeArcsec   (astronomy-engine's own e_tilt().dpsi
 *                               at the same instant)                 = +10.88"
 *   residualArcsec            (difference minus nutation)            = +0.28"
 *
 * Isolating the ayanamsha/nutation effect alone (using Swiss
 * Ephemeris's OWN tropical Sun on both sides, removing the small,
 * separately-already-documented ~0.3" astronomy-engine-vs-Swiss-
 * Ephemeris planetary-position difference) tightens this further:
 *
 *   differenceSiderealArcsec (isolated) = +10.79"
 *   nutationLongitudeArcsec              = +10.88"
 *   residualArcsec            (isolated) = -0.08"
 *
 * These SUBSTANTIALLY RECONCILE (residual under 0.3" either way, a
 * small fraction of the total effect, explainable by minor differences
 * between astronomy-engine's IAU 2000B nutation series and Swiss
 * Ephemeris's own nutation model, plus the pre-existing, separately
 * documented sub-arcsecond planetary-ephemeris difference). This is NOT
 * an unresolved discrepancy requiring a stop: the ~11" gap against
 * Swiss Ephemeris's full sidereal pipeline is fully and quantitatively
 * attributable to the mean-ayanamsha-vs-apparent-tropical-longitude
 * convention difference described above — never a planetary-ephemeris
 * error and never an ayanamsha-value error (this module's ayanamsha
 * itself matches Swiss Ephemeris's own mean ayanamsha to <0.0003", as
 * shown above). It is also exactly why Part N/G of the brief requires
 * the simple subtraction to reconcile exactly with no hidden
 * correction: `siderealLongitude` here is always, by construction,
 * `normalize360(tropicalLongitude - ayanamshaDegrees)` and nothing else.
 */

import { normalizeDegrees } from "../zodiac.js";

export const AYANAMSHA_FAMILY = "lahiri";

/** Precise, non-overclaiming description of the implemented quantity — see module doc comment, "EXACT QUANTITY IMPLEMENTED." */
export const AYANAMSHA_CONVENTION = "lahiri_mean_no_nutation_iau2006_precession_calibrated_to_swiss_ephemeris_mean_ayanamsha";

/** This module never computes the nutation-including ("true") Chitrapaksha quantity. */
export const AYANAMSHA_INCLUDES_NUTATION = false;

/** Exactly what `siderealLongitude` is derived from — see Part N/G: this must always reconcile exactly. */
export const SIDEREAL_CONVERSION = "tropical_longitude_minus_mean_lahiri_ayanamsha";

/** The verification method used for Source B — dev-only, never a production dependency or runtime call. */
export const EXTERNAL_VERIFICATION = "swiss_ephemeris_dev_only_not_production";

/**
 * Lahiri ayanamsha at J2000.0 (2000-01-01 12:00 TT), in degrees.
 * Calibrated once against Swiss Ephemeris's `swe_get_ayanamsa_ut()` for
 * SE_SIDM_LAHIRI (confirmed nutation-EXCLUDED — see module doc comment,
 * Source B). This is the ONLY fitted constant in this module; everything
 * else is a genuine function of time via the IAU 2000/2006 precession
 * series below.
 */
const AYANAMSHA_AT_J2000_DEGREES = 23.85709232529797;

/**
 * IAU 2000/2006 general precession in ecliptic longitude accumulated
 * since J2000.0, in arcseconds (Capitaine, Wallace & Chapront 2003).
 * @param {number} julianCenturiesTT Julian centuries of Terrestrial Time since J2000.0
 * @returns {number} arcseconds
 */
function generalPrecessionInLongitudeArcsec(julianCenturiesTT) {
  const T = julianCenturiesTT;
  return 5028.796195 * T + 1.1054348 * T * T;
}

/**
 * Computes the MEAN (nutation-excluded) Lahiri/Chitrapaksha ayanamsha
 * for an arbitrary date/time. Genuinely varies with time — never a
 * hard-coded constant. See module doc comment for exactly which Swiss
 * Ephemeris quantity this reproduces (and which one it deliberately
 * does not).
 *
 * @param {import("astronomy-engine").AstroTime} astroTime
 * @returns {{
 *   degrees: number,
 *   formatted: string,
 *   family: "lahiri",
 *   convention: string,
 *   includesNutation: false,
 *   epochOrModel: string,
 *   sourceNote: string,
 * }}
 */
export function computeLahiriAyanamsha(astroTime) {
  // astroTime.tt is Terrestrial Time, in DAYS since J2000.0 (astronomy-engine's
  // AstroTime convention) - convert to Julian centuries for the precession series.
  const julianCenturiesTT = astroTime.tt / 36525;
  const precessionArcsec = generalPrecessionInLongitudeArcsec(julianCenturiesTT);
  const degrees = normalizeDegrees(AYANAMSHA_AT_J2000_DEGREES + precessionArcsec / 3600);

  return {
    degrees,
    formatted: formatAyanamshaDMS(degrees),
    family: AYANAMSHA_FAMILY,
    convention: AYANAMSHA_CONVENTION,
    includesNutation: AYANAMSHA_INCLUDES_NUTATION,
    epochOrModel: "J2000.0 reference value (calibrated vs. Swiss Ephemeris's swe_get_ayanamsa_ut(), confirmed nutation-excluded, dev-time only) + IAU 2000/2006 general precession in longitude (Capitaine, Wallace & Chapront 2003)",
    sourceNote:
      "Cross-checked against (A) the historical N.C. Lahiri / Indian Calendar Reform Committee (1956) Chitrapaksha definition and (B) a temporary dev-only Swiss Ephemeris (sweph-wasm) cross-check of swe_get_ayanamsa_ut() at 6 dates spanning 1900-2024, matching to <0.0003 arcsec. This is the MEAN (nutation-excluded) ayanamsha - see module doc comment for the audited, quantitatively-decomposed ~11 arcsec difference against Swiss Ephemeris's full SEFLG_SIDEREAL pipeline (which itself uses a nutation-free tropical position), and for the ~16.6 arcsec difference against the commonly-quoted nutation-INCLUDING 1956/1985 historical reference figure.",
  };
}

function formatAyanamshaDMS(degrees) {
  const d = Math.floor(degrees);
  const minFull = (degrees - d) * 60;
  const m = Math.floor(minFull);
  const s = (minFull - m) * 60;
  return `${d}°${String(m).padStart(2, "0")}'${s.toFixed(2)}"`;
}
