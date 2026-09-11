/**
 * Traditional mean daily motion, and the swift/slow comparison method.
 *
 * SOURCE: William Lilly, "Christian Astrology" (1647), Chapter XIII —
 * cross-checked during development against two independent modern
 * traditional-astrology references (Anthony Louis's horary blog, citing
 * Lilly's table directly, and a separate published swift/slow reference
 * table), which agree with each other and with Lilly's original figures
 * for the Sun, Moon, Mars, Jupiter, and Saturn:
 *
 *   Moon:    13 deg 10' 36" / day
 *   Sun:      0 deg 59' 08" / day
 *   Mars:     0 deg 31' 27" / day
 *   Jupiter:  0 deg 04' 59" / day
 *   Saturn:   0 deg 02' 01" / day
 *
 * METHOD (Lilly, as corroborated by the sources above): a planet is
 * "swift" when its actual daily motion exceeds this mean; "slow" when
 * below it. No tolerance band around the mean is used — this is a direct
 * comparison, not a fuzzy range, matching the historical method exactly
 * ("above the mean is swift, below it is slow"). The comparison uses
 * ABSOLUTE daily speed (not signed), so that retrograde motion is never
 * automatically conflated with "slow" — a fast retrograde planet is
 * still compared on magnitude, consistent with the project's explicit
 * rule that retrograde and speed classification are separate concepts.
 *
 * MERCURY AND VENUS — A GENUINE SOURCED DISAGREEMENT, RESOLVED BY
 * EXPLICIT USER DECISION (not chosen silently):
 * The horary/traditional literature itself is divided on what mean
 * motion to use for these two. William Lilly assigns BOTH Mercury and
 * Venus the same 59' 08"/day figure as the Sun — the "triune system"
 * convention, reasoning that geocentrically their epicyclic motion around
 * the Sun averages, over a full cycle, to the Sun's own mean motion. At
 * least one other historical horary author (Ivy Goldstein-Jacobson, in
 * "Horary Astrology Simplified") instead assigns Mercury and Venus their
 * own distinct, faster mean-motion figures (materially different from
 * Lilly's, on the order of ~1 deg/day rather than ~59'), reflecting each
 * planet's own orbital period rather than the shared solar rate — and a
 * modern secondary review of that alternate table separately flags its
 * specific transcribed figures as possibly erroneous, adding a further
 * layer of uncertainty to that variant.
 *
 * This disagreement was reported to the project owner (rather than
 * resolved silently), who explicitly chose Lilly's convention. This
 * project therefore uses 59' 08"/day (the Sun's rate) for BOTH Mercury
 * and Venus, matching Lilly's original table exactly and matching what
 * most modern traditional-astrology software defaults to. The
 * Goldstein-Jacobson alternative is documented here but not used.
 */

function dms(deg, min, sec) {
  return deg + min / 60 + sec / 3600;
}

export const REFERENCE_MEAN_SPEED = {
  sun: dms(0, 59, 8),
  moon: dms(13, 10, 36),
  mercury: dms(0, 59, 8), // Lilly's "triune system" rate — disputed by Goldstein-Jacobson; project owner chose Lilly's, see module doc comment
  venus: dms(0, 59, 8), // same as above
  mars: dms(0, 31, 27),
  jupiter: dms(0, 4, 59),
  saturn: dms(0, 2, 1),
};

/**
 * @param {string} planetKey
 * @param {number} longitudeSpeed signed deg/day, from the already-verified upstream ephemeris
 * @returns {{
 *   longitudeSpeed: number,
 *   absoluteSpeed: number,
 *   referenceMeanSpeed: number|null,
 *   status: "swift"|"slow"|"mean"|null
 * }}
 */
export function computeSpeedCondition(planetKey, longitudeSpeed) {
  const referenceMeanSpeed = REFERENCE_MEAN_SPEED[planetKey] ?? null;
  const absoluteSpeed = Math.abs(longitudeSpeed);

  let status = null;
  if (referenceMeanSpeed !== null) {
    if (absoluteSpeed > referenceMeanSpeed) status = "swift";
    else if (absoluteSpeed < referenceMeanSpeed) status = "slow";
    else status = "mean";
  }

  return { longitudeSpeed, absoluteSpeed, referenceMeanSpeed, status };
}
