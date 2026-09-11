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
 *
 * PERMANENT PROVENANCE (this refinement): the chosen convention is not
 * only documented in comments/README — every speed result below also
 * carries `speedConvention: "william_lilly"` and a human-readable
 * `referenceMeanSpeedFormatted` string, and `chart.classical.meta` carries
 * the same `speedConvention` value, so the convention used is always
 * recoverable from the calculation output itself, not just prose.
 */

const MEAN_MOTION_DMS = {
  sun: { deg: 0, min: 59, sec: 8 },
  moon: { deg: 13, min: 10, sec: 36 },
  // Lilly's "triune system" rate, same as the Sun — disputed by
  // Goldstein-Jacobson; project owner explicitly chose Lilly's, see
  // module doc comment above.
  mercury: { deg: 0, min: 59, sec: 8 },
  venus: { deg: 0, min: 59, sec: 8 },
  mars: { deg: 0, min: 31, sec: 27 },
  jupiter: { deg: 0, min: 4, sec: 59 },
  saturn: { deg: 0, min: 2, sec: 1 },
};

export const SPEED_CONVENTION = "william_lilly";

function toDecimalDegrees({ deg, min, sec }) {
  return deg + min / 60 + sec / 3600;
}

function formatMeanMotion({ deg, min, sec }) {
  const mm = String(min).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return deg > 0 ? `${deg}°${mm}′${ss}″/day` : `${mm}′${ss}″/day`;
}

export const REFERENCE_MEAN_SPEED = Object.fromEntries(
  Object.entries(MEAN_MOTION_DMS).map(([key, value]) => [key, toDecimalDegrees(value)])
);

export const REFERENCE_MEAN_SPEED_FORMATTED = Object.fromEntries(
  Object.entries(MEAN_MOTION_DMS).map(([key, value]) => [key, formatMeanMotion(value)])
);

/**
 * @param {string} planetKey
 * @param {number} longitudeSpeed signed deg/day, from the already-verified upstream ephemeris
 * @returns {{
 *   longitudeSpeed: number,
 *   absoluteSpeed: number,
 *   referenceMeanSpeed: number|null,
 *   referenceMeanSpeedFormatted: string|null,
 *   status: "swift"|"slow"|"mean"|null,
 *   speedConvention: "william_lilly"
 * }}
 */
export function computeSpeedCondition(planetKey, longitudeSpeed) {
  const referenceMeanSpeed = REFERENCE_MEAN_SPEED[planetKey] ?? null;
  const referenceMeanSpeedFormatted = REFERENCE_MEAN_SPEED_FORMATTED[planetKey] ?? null;
  const absoluteSpeed = Math.abs(longitudeSpeed);

  let status = null;
  if (referenceMeanSpeed !== null) {
    if (absoluteSpeed > referenceMeanSpeed) status = "swift";
    else if (absoluteSpeed < referenceMeanSpeed) status = "slow";
    else status = "mean";
  }

  return {
    longitudeSpeed,
    absoluteSpeed,
    referenceMeanSpeed,
    referenceMeanSpeedFormatted,
    status,
    speedConvention: SPEED_CONVENTION,
  };
}
