/**
 * Dispositor chain — Phase 3E.
 *
 * Pure rule-layer traversal of the traditional domicile-rulership graph
 * (rules/rulership.js, locked in Phase 3A) applied to each traditional
 * planet's ACTUAL sign placement in this specific chart. No new
 * astronomical calculation; no new rulership table — getDispositor() is
 * reused verbatim.
 *
 * The "dispositor" of a planet is the domicile ruler of the sign that
 * planet actually occupies in this chart. To build a chain, that
 * dispositor planet's OWN actual chart placement is looked up in turn,
 * and so on, until either:
 *   - a planet disposits itself (it is placed in a sign it rules by
 *     domicile) -> terminationType "self_dispositor", finalDispositor set
 *   - a previously-visited planet recurs -> terminationType "loop",
 *     finalDispositor = null (a loop has no single final dispositor;
 *     mutual-reception-style loops are a legitimate, not an error, per
 *     traditional dispositor-tree sources cross-checked during
 *     development)
 *
 * Because there are only seven traditional planets and a visited-set is
 * checked on every step, this always terminates within at most 8 steps —
 * there is no possibility of an unbounded loop. A defensive iteration cap
 * is kept anyway ("unknown" termination) purely as a structural safety
 * net; it is not expected to ever be reached given the fixed 7-planet set
 * and is untestable by construction — kept only because the project
 * brief specifies three termination types.
 */

import { getDispositor } from "./rules/rulership.js";

/**
 * @param {string} startPlanet
 * @param {Record<string,string>} signByPlanet actual chart sign (lowercase key) for each of the 7 traditional planets
 * @returns {{
 *   startPlanet: string,
 *   chain: string[],
 *   terminationType: "self_dispositor"|"loop"|"unknown",
 *   finalDispositor: string|null,
 *   loopMembers: string[],
 * }}
 */
export function computeDispositorChain(startPlanet, signByPlanet) {
  const dispositorOf = (planet) => getDispositor(signByPlanet[planet]);

  const chain = [startPlanet];
  const visited = new Set([startPlanet]);
  let current = startPlanet;
  const MAX_STEPS = 8; // 7 traditional planets + 1 safety margin

  for (let step = 0; step < MAX_STEPS; step++) {
    const next = dispositorOf(current);

    if (next === current) {
      return { startPlanet, chain, terminationType: "self_dispositor", finalDispositor: current, loopMembers: [] };
    }

    if (visited.has(next)) {
      const loopStart = chain.indexOf(next);
      const loopMembers = chain.slice(loopStart);
      return { startPlanet, chain, terminationType: "loop", finalDispositor: null, loopMembers };
    }

    chain.push(next);
    visited.add(next);
    current = next;
  }

  // Structurally unreachable with only 7 traditional planets (see module
  // doc comment) - kept only as a defensive fallback.
  return { startPlanet, chain, terminationType: "unknown", finalDispositor: null, loopMembers: [] };
}

/**
 * Part A's richer immediate-dispositor shape, built from already-verified
 * placement data - traditional domicile rulership only.
 * @param {object} params
 * @param {string} params.planetKey
 * @param {string} params.sign actual chart sign of planetKey (lowercase key)
 * @returns {{planet:string, ruledBy:string, sign:string, dignityType:"domicile"}}
 */
export function buildImmediateDispositor({ planetKey, sign }) {
  return {
    planet: planetKey,
    ruledBy: getDispositor(sign),
    sign,
    dignityType: "domicile",
  };
}
