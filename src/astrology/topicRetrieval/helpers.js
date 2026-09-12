/**
 * Topic Retrieval shared lookups — Phase 6.
 *
 * THIS FILE PERFORMS NO NEW ASTROLOGY CALCULATION. Every function here is
 * a plain lookup/filter/reverse-map over already-computed, already-locked
 * Phase 1-5 data. Where a lookup table is needed (e.g. "which planet
 * rules this house's cusp sign"), it reuses the exact locked table an
 * earlier phase already built (`rules/rulership.js`'s `getDispositor`,
 * locked since Phase 3A/3E) — it never creates a second rulership table.
 *
 * "Contextual relationship" detectors (aspect/reception/dispositor for
 * Classical; dispositor/ownership for Vedic) are intentionally scoped to
 * a single, direct, one-hop check — e.g. "is A the immediate dispositor
 * of B, or B of A?" — never a multi-step chain-comparison or a new
 * synthesized relationship rule. This keeps Phase 6 a retrieval layer,
 * never a second inference engine.
 */

import { getDispositor } from "../classical/rules/rulership.js";
import { GRAHA_DISPLAY_NAME } from "../vedic/grahaNames.js";

/** Reverse of GRAHA_DISPLAY_NAME ("Mars" -> "mars") - a trivial inversion of an already-locked display table, not a new doctrine table. */
export const VEDIC_KEY_BY_DISPLAY_NAME = Object.fromEntries(Object.entries(GRAHA_DISPLAY_NAME).map(([key, name]) => [name, key]));

// ======================================================================
// MODERN WESTERN
// ======================================================================

/** The full canonical point object for a Modern Western point id (e.g. "sun", "asc", "northNode"), or undefined. */
export function westernPoint(chart, id) {
  return chart.points.find((p) => p.id === id);
}

/** Planet-category points (the 10 core bodies only, never angles/nodes/calculated) currently occupying a given house. */
export function westernPlanetsInHouse(chart, houseNumber) {
  return chart.points.filter((p) => p.category === "planet" && p.house === houseNumber);
}

/** The Phase 1 house-cusp record (house/longitude/sign/degreeInSign) for a given house. */
export function westernHouseCusp(chart, houseNumber) {
  return chart.houseCusps.find((c) => c.house === houseNumber);
}

// ======================================================================
// CLASSICAL
// ======================================================================

/** The lowercase key of the traditional domicile ruler of a given house's cusp sign - reuses the locked rulership.js table verbatim, never a new table. */
export function classicalHouseLordKey(chart, houseNumber) {
  const cusp = westernHouseCusp(chart, houseNumber);
  return getDispositor(cusp.sign.key);
}

/** The full Phase 3H summary evidence bundle for one classical planet (dignity/condition/operationalCondition/sectCondition/dispositor/reception/aspects/technicalFlags, already assembled - never re-picked field by field). */
export function classicalPlanetEvidence(chart, planetKey) {
  return chart.classical.summary.planets[planetKey];
}

/** Traditional planets (of the seven) currently placed in a given house. */
export function classicalPlanetsInHouse(chart, houseNumber) {
  return Object.keys(chart.classical.summary.planets).filter((key) => chart.classical.summary.planets[key].position.house === houseNumber);
}

/** "sun" if the chart is day sect, "moon" if night sect - a trivial, definitional lookup over the already-computed chart.classical.sect fact, not a new dignity rule. */
export function classicalSectLightKey(chart) {
  return chart.classical.sect === "day" ? "sun" : "moon";
}

/** Whether planetA and planetB currently have an aspect within orb (an active natal aspect, not merely "any of the 21 geometric pairs") - and the aspect fact itself if so. */
export function classicalAspectBetween(chart, planetA, planetB) {
  const found = chart.classical.summary.planets[planetA]?.aspects.find((a) => a.otherPlanet === planetB);
  return { triggered: !!found, value: found ?? null };
}

/** Whether planetA and planetB currently have a reception relationship in either direction, and the fact itself if so. */
export function classicalReceptionBetween(chart, planetA, planetB) {
  const pa = chart.classical.summary.planets[planetA]?.reception;
  const aReceivesB = pa?.receivedBy.find((r) => r.otherPlanet === planetB);
  const bReceivesA = pa?.receives.find((r) => r.otherPlanet === planetB);
  const triggered = !!(aReceivesB || bReceivesA);
  return { triggered, value: triggered ? { aReceivesB: aReceivesB ?? null, bReceivesA: bReceivesA ?? null } : null };
}

/** Whether planetA is the immediate (one-hop) dispositor of planetB, or vice versa. */
export function classicalDispositorRelationBetween(chart, planetA, planetB) {
  const pa = chart.classical.summary.planets[planetA]?.dispositor;
  const pb = chart.classical.summary.planets[planetB]?.dispositor;
  const aDispositsB = pb?.immediateDispositor === planetA;
  const bDispositsA = pa?.immediateDispositor === planetB;
  const triggered = !!(aDispositsB || bDispositsA);
  return { triggered, value: triggered ? { aDispositsB, bDispositsA } : null };
}

// ======================================================================
// VEDIC
// ======================================================================

/** The full Phase 4F summary evidence bundle for one Graha (lowercase key, all 9 supported). */
export function vedicGrahaEvidence(chart, key) {
  return chart.vedic.summary.grahas[key];
}

/** The full Phase 4F Bhava evidence record (1-indexed bhavaNumber) - array is 0-indexed, so bhavaNumber - 1. */
export function vedicBhavaEvidence(chart, bhavaNumber) {
  return chart.vedic.summary.bhavas[bhavaNumber - 1];
}

/** The lowercase graha key that lords a given Bhava (via the already-locked Phase 4B/4E lordship network - never recomputed). */
export function vedicBhavaLordKey(chart, bhavaNumber) {
  const displayName = vedicBhavaEvidence(chart, bhavaNumber).lord;
  return VEDIC_KEY_BY_DISPLAY_NAME[displayName];
}

/** The full Phase 4E lordship-role evidence bundle for one classical Graha (owned houses, Kendra/Trikona/Dusthana/Upachaya, ownsKendraAndTrikona). */
export function vedicLordshipEvidence(chart, planetKey) {
  return chart.vedic.summary.lordship.planets[planetKey];
}

/** Whether planetA is the immediate (one-hop) Rashi dispositor of planetB, or vice versa. */
export function vedicDispositorRelationBetween(chart, planetA, planetB) {
  const aName = GRAHA_DISPLAY_NAME[planetA];
  const bName = GRAHA_DISPLAY_NAME[planetB];
  const dispositors = chart.vedic.summary.lordship.dispositorNetwork.immediateDispositors;
  const aDispositsB = dispositors[planetB]?.dispositor === aName;
  const bDispositsA = dispositors[planetA]?.dispositor === bName;
  const triggered = !!(aDispositsB || bDispositsA);
  return { triggered, value: triggered ? { aDispositsB, bDispositsA } : null };
}

/** Whether planetA owns the Bhava planetB currently occupies, or vice versa (Phase 4B/4E house-ownership network, one-hop only). */
export function vedicOwnershipRelationBetween(chart, planetA, planetB) {
  const ownershipA = chart.vedic.bhava.planetaryHouseOwnership[planetA] ?? [];
  const ownershipB = chart.vedic.bhava.planetaryHouseOwnership[planetB] ?? [];
  const bhavaOfA = chart.vedic.summary.grahas[planetA].bhava.number;
  const bhavaOfB = chart.vedic.summary.grahas[planetB].bhava.number;
  const aOwnsBhavaOfB = ownershipA.includes(bhavaOfB);
  const bOwnsBhavaOfA = ownershipB.includes(bhavaOfA);
  const triggered = !!(aOwnsBhavaOfB || bOwnsBhavaOfA);
  return { triggered, value: triggered ? { aOwnsBhavaOfB, bOwnsBhavaOfA } : null };
}
