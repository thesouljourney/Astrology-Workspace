/**
 * Solar elongation and solar condition (cazimi / combust / under the
 * beams / free from beams) for the six traditional planets other than
 * the Sun itself.
 *
 * THRESHOLDS — this project's explicit convention, per William Lilly's
 * "Christian Astrology" (1647), cross-checked during development against
 * two independent traditional-astrology references (a modern learn-
 * astrology summary and the Skyscript astrological glossary), which
 * agree with each other and with Lilly's original figures:
 *
 *   Cazimi:          <= 0 deg 17' (0.28333... deg) from the Sun
 *   Combust:         >  0 deg 17'  and <= 8 deg 30' from the Sun
 *   Under the Beams: >  8 deg 30'  and <= 17 deg 00' from the Sun
 *   Free from Beams: >  17 deg 00' from the Sun
 *
 * KNOWN HISTORICAL VARIATION (documented, not silently merged): some
 * sources cite the Cazimi orb as 17'30" (half the Sun's mean apparent
 * angular diameter) rather than a flat 17'. This project uses exactly
 * 17'00" as specified by the project brief — the 17'30" variant is noted
 * here for completeness but is NOT used. If this convention is ever
 * revisited, it must be a deliberate, documented change, not a silent one.
 *
 * These are orb/threshold CONVENTIONS, not astronomical constants — do
 * not change them without updating this comment and the project README.
 */

import { normalizeDegrees } from "../zodiac.js";

export const THRESHOLDS = {
  cazimiDegrees: 17 / 60, // 0 deg 17'
  combustionDegrees: 8.5, // 8 deg 30'
  beamsDegrees: 17, // 17 deg 00'
};

function wrapSigned180(deg) {
  let d = deg % 360;
  if (d <= -180) d += 360;
  if (d > 180) d -= 360;
  return d;
}

/**
 * @param {number} planetLongitude absolute ecliptic longitude, degrees
 * @param {number} sunLongitude absolute ecliptic longitude, degrees
 * @returns {{ signedElongation: number, absoluteSolarElongation: number }}
 */
export function computeSolarElongation(planetLongitude, sunLongitude) {
  const signedElongation = wrapSigned180(normalizeDegrees(planetLongitude) - normalizeDegrees(sunLongitude));
  return { signedElongation, absoluteSolarElongation: Math.abs(signedElongation) };
}

/**
 * @param {number} absoluteSolarElongation degrees, 0-180
 * @returns {"cazimi"|"combust"|"under_beams"|"free"}
 */
export function classifySolarCondition(absoluteSolarElongation) {
  if (absoluteSolarElongation <= THRESHOLDS.cazimiDegrees) return "cazimi";
  if (absoluteSolarElongation <= THRESHOLDS.combustionDegrees) return "combust";
  if (absoluteSolarElongation <= THRESHOLDS.beamsDegrees) return "under_beams";
  return "free";
}

/**
 * @param {number} planetLongitude
 * @param {number} sunLongitude
 * @returns {{
 *   signedElongation: number,
 *   elongation: number,
 *   condition: "cazimi"|"combust"|"under_beams"|"free",
 *   cazimiThreshold: number,
 *   combustionThreshold: number,
 *   beamsThreshold: number
 * }}
 */
export function computeSolarCondition(planetLongitude, sunLongitude) {
  const { signedElongation, absoluteSolarElongation } = computeSolarElongation(planetLongitude, sunLongitude);
  return {
    signedElongation,
    elongation: absoluteSolarElongation,
    condition: classifySolarCondition(absoluteSolarElongation),
    cazimiThreshold: THRESHOLDS.cazimiDegrees,
    combustionThreshold: THRESHOLDS.combustionDegrees,
    beamsThreshold: THRESHOLDS.beamsDegrees,
  };
}
