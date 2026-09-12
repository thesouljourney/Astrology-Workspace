/**
 * Vedic dispositor, lordship & functional structure — Phase 4E.
 *
 * SCOPE: this module builds the structural lordship/dispositor layer -
 * immediate Rashi dispositors, dispositor chains, loop detection, a
 * normalized Lagna Lord network, house-group (Kendra/Trikona/Dusthana/
 * Upachaya) membership, planetary house-ownership roles, a 12-house lord
 * placement matrix, and a per-planet technical evidence rollup. It
 * performs no new astronomical calculation and creates no new house or
 * dignity table - see "REUSE, NEVER REBUILD" below.
 *
 * Deliberately NOT implemented here (see `chart.vedic.meta` for the
 * explicit `"not_implemented"`/`"none"` markers, and the module doc
 * comment section "FUNCTIONAL-LABEL RESEARCH" below for why): functional
 * benefic/malefic, Yogakaraka, Maraka, Badhaka, and any
 * score/interpretation.
 *
 * ====================================================================
 * REUSE, NEVER REBUILD (Core Principle)
 * ====================================================================
 * Phase 4B (`bhava.js`) already computed Bhava number, Bhava Rashi,
 * Bhava lord, `lordPlacedInBhava`, `planetaryHouseOwnership`, and
 * `lordshipNetwork`. Phase 4D (`condition.js`) already computed sign
 * lord, dignity, and retrograde/combustion state. This module reuses
 * those structures directly wherever they already answer a Phase 4E
 * question (house ownership, the 12-house lord matrix's base rows,
 * dignity/retrograde/combustion re-exposed on that matrix) - it never
 * recomputes house ownership or dignity independently, and never
 * mutates `chart.vedic.bhava` or `chart.vedic.condition`. The only new
 * computation Phase 4E performs is genuinely new to this phase:
 * dispositor chains, loop detection, and house-group membership.
 *
 * ====================================================================
 * IMMEDIATE DISPOSITOR (Parts A/B)
 * ====================================================================
 * The dispositor of a Graha is simply the traditional Rashi lord
 * (`rashiLordship.js`'s `RASHI_LORDS`, the same table Phase 4B already
 * uses for house ownership) of the Rashi that Graha currently occupies.
 * When a Graha occupies its own sign, its dispositor is itself
 * (`isSelfDispositor: true`) - mirroring exactly how Phase 4D's
 * `naturalRelationshipToSignLord: "self"` already represents the same
 * own-sign case. Rahu/Ketu receive an ordinary dispositor lookup (e.g.
 * Rahu in Libra -> dispositor Venus) using the exact same table and
 * function as the seven classical Grahas, but - because `RASHI_LORDS`
 * never contains "rahu"/"ketu" as a value (the traditional rule, already
 * enforced identically in Phase 4B) - neither node can ever itself BE a
 * dispositor of anything, and neither can ever be self-dispositor.
 *
 * ====================================================================
 * DISPOSITOR CHAINS & LOOPS (Parts C/D/E)
 * ====================================================================
 * For each of the seven classical Grahas, a chain is built by
 * repeatedly following "who disposits whom" - Graha -> its dispositor ->
 * that dispositor's own dispositor -> ... - stopping the instant either:
 *
 *   1. a self-dispositor is reached (the chain TERMINATES there, and
 *      that Graha becomes `finalDispositor`), or
 *   2. a Graha already seen earlier in THIS chain reappears (a LOOP -
 *      `finalDispositor` is `null`, and the looping members are exposed
 *      explicitly instead, per Part D's explicit instruction never to
 *      force one member of a loop to stand in as "the" final dispositor).
 *
 * Because there are only seven classical Grahas and each has exactly one
 * outgoing "disposits to" edge (a finite functional graph), every chain
 * is mathematically GUARANTEED to terminate one way or the other within
 * at most 8 steps - this is a property of the graph, not an assumption.
 * A `CHAIN_SAFETY_LIMIT` constant (20, comfortably larger than that
 * mathematical bound) exists purely as defensive engineering against a
 * hypothetical future bug - it is NEVER reached in practice and is never
 * itself presented as astrological doctrine (Part C's explicit
 * requirement).
 *
 * Loop membership is CANONICALIZED (Part E) by sorting the looping
 * Grahas' display names alphabetically, so "Mars -> Sun -> Mars" and
 * "Sun -> Mars -> Sun" both produce the identical `{ type: "loop",
 * members: ["Mars", "Sun"] }` object - confirmed by dedicated test. The
 * chart-level `loops` array collects every DISTINCT loop found across
 * all seven chains (a loop encountered by multiple different starting
 * Grahas is listed exactly once).
 *
 * ====================================================================
 * HOUSE GROUPS (Part G) — UNCONTESTED, STANDARD DEFINITIONS
 * ====================================================================
 * Kendra {1,4,7,10}, Trikona {1,5,9}, Dusthana {6,8,12}, and Upachaya
 * {3,6,10,11} are the standard, universally-agreed Parashari house
 * groupings - no research disagreement exists on WHICH house numbers
 * belong to each group (unlike the functional-label doctrines below,
 * which are genuinely disputed). This module exposes membership only;
 * it never infers "good" or "bad" from it (Part G's explicit
 * instruction).
 *
 * ====================================================================
 * FUNCTIONAL-LABEL RESEARCH (Parts L/M/N/O) — DEFERRED, NOT SILENTLY SKIPPED
 * ====================================================================
 * Before writing any code for these four doctrines, each was researched
 * against the questions Part L/M/N/O pose:
 *
 * - FUNCTIONAL BENEFIC/MALEFIC: confirmed genuinely Lagna-dependent (a
 *   separate 7-planet table per each of the 12 possible Ascendants, not
 *   one universal table) and confirmed to involve a real, disputed
 *   secondary doctrine - Kendradhipati Dosha (a natural benefic owning
 *   ONLY a Kendra house is traditionally said to lose some of its
 *   benefic quality, and a natural malefic owning a Kendra is said to
 *   gain strength) - whose exact cancellation conditions (e.g. whether
 *   the Kendra lord must be in its own sign, exalted, or something else
 *   entirely to cancel the Dosha) are not uniformly stated across
 *   sources. Trikona lordship is more consistently treated (a Trikona
 *   lord is close to universally called benefic regardless of natural
 *   character), but the overall classification still requires the
 *   Lagna-dependent table plus the disputed Kendra exception - exactly
 *   the kind of "materially disagreeing, Lagna/special-case-dependent"
 *   doctrine Part L says to STOP on rather than silently resolve.
 * - YOGAKARAKA: confirmed Lagna-dependent by definition (only six of the
 *   twelve possible Ascendants can even produce a Yogakaraka planet -
 *   one whose single Rashi simultaneously rules a Kendra AND a Trikona
 *   for that specific Lagna) and confirmed to carry known special-case
 *   disagreement at the margins (e.g. whether a planet that also RULES
 *   the Lagna itself alongside a Kendra/Trikona combination should still
 *   qualify, and how multiple candidate planets for the same Lagna are
 *   prioritized) - exactly Part M's flagged "Lagna-dependent AND
 *   special-case-dependent" combination.
 * - MARAKA: Part N's own research questions explicitly include "Dasha
 *   context," and traditional Maraka doctrine is inseparable from WHEN a
 *   affliction activates (2nd/7th lords and planets placed in 2/7 are
 *   only traditionally read as death-inflicting during specific Dasha/
 *   Antardasha periods) - this project has no Dasha implementation at
 *   all (Phase 4C's own explicit, locked scope boundary), so Maraka
 *   cannot be represented as static natal structure without inventing an
 *   unresearched simplification. Part N's own fallback applies directly.
 * - BADHAKA: requires classifying the Lagna's sign as movable/fixed/dual
 *   to determine the Badhaka house and Badhakesh (Part O) - this project
 *   has no such sign-modality classification built in any phase to date.
 *   Part O's own text states the Phase 4E structural baseline does not
 *   require it.
 *
 * RESULT: all four remain `"not_implemented"` in `chart.vedic.meta`,
 * exactly as Parts L-O's own preferred defaults anticipate - this is a
 * researched, documented deferral, not a silent omission. The neutral
 * STRUCTURAL evidence these doctrines would eventually be built on top
 * of (`ownsKendra`, `ownsTrikona`, `ownsKendraAndTrikona`, house-lord
 * placement, dignity, retrograde, combustion) is fully exposed via
 * `planetaryLordshipRoles`/`planetaryLordshipEvidence`/`houseLordMatrix`
 * below, so a future phase can implement any of the four without this
 * phase needing to be revisited.
 */

import { RASHIS } from "./rashi.js";
import { RASHI_LORDS } from "./rashiLordship.js";
import { GRAHA_DISPLAY_NAME, NAVAGRAHA_ORDER } from "./grahaNames.js";
import { CLASSICAL_GRAHA_KEYS } from "./dignityTables.js";

export const DISPOSITOR_SYSTEM = "traditional_rashi_lordship";
export const DISPOSITOR_FINAL_RULE = "self_dispositor_terminal_only";
export const DISPOSITOR_LOOP_POLICY = "canonical_cycle_no_forced_final_dispositor";
export const HOUSE_GROUP_CONVENTION = "standard_kendra_trikona_dusthana_upachaya";
export const FUNCTIONAL_BENEFIC_STATUS = "not_implemented";
export const FUNCTIONAL_MALEFIC_STATUS = "not_implemented";
export const YOGAKARAKA_STATUS = "not_implemented";
export const MARAKA_STATUS = "not_implemented";
export const BADHAKA_STATUS = "not_implemented";
export const VEDIC_LORDSHIP_INTERPRETATION = "none";

export const HOUSE_GROUPS = {
  kendra: [1, 4, 7, 10],
  trikona: [1, 5, 9],
  dusthana: [6, 8, 12],
  upachaya: [3, 6, 10, 11],
};

/** Purely a defensive engineering bound, never astrological doctrine - see module doc comment. */
const CHAIN_SAFETY_LIMIT = 20;

/**
 * The immediate Rashi dispositor of a Graha - Parts A/B. Works
 * identically for classical Grahas and for Rahu/Ketu; `isSelfDispositor`
 * is structurally always `false` for Rahu/Ketu, since `RASHI_LORDS`
 * never resolves to either.
 * @param {string} planetKey
 * @param {string} rashiKey the Rashi key currently occupied
 * @returns {{rashi: string, dispositor: string, isSelfDispositor: boolean}}
 */
function computeDispositor(planetKey, rashiKey) {
  const dispositorKey = RASHI_LORDS[rashiKey];
  return {
    rashi: RASHIS.find((r) => r.key === rashiKey).name,
    dispositor: GRAHA_DISPLAY_NAME[dispositorKey],
    isSelfDispositor: dispositorKey === planetKey,
  };
}

/** Canonical loop representation (Part E): alphabetically-sorted display names, so rotation/starting-point never produces a duplicate. */
function canonicalizeLoop(memberDisplayNames) {
  return { type: "loop", members: [...memberDisplayNames].sort() };
}

function loopIdentityKey(loop) {
  return loop.members.join("|");
}

/**
 * Builds the full dispositor chain for one classical Graha - Parts C/D/E.
 * @param {string} startKey
 * @param {Record<string, number>} rashiIndexByClassicalPlanet each of the 7 classical Grahas' current rashiIndex
 * @returns {{chain: string[], finalDispositor: string|null, loop: {type: "loop", members: string[]}|null}}
 */
function buildDispositorChain(startKey, rashiIndexByClassicalPlanet) {
  const chainKeys = [startKey];
  const indexInChain = new Map([[startKey, 0]]);
  let current = startKey;
  let finalDispositorKey = null;
  let loopKeys = null;

  for (let step = 0; step < CHAIN_SAFETY_LIMIT; step++) {
    const rashiKey = RASHIS[rashiIndexByClassicalPlanet[current]].key;
    const dispositorKey = RASHI_LORDS[rashiKey];

    if (dispositorKey === current) {
      finalDispositorKey = current;
      break;
    }
    if (indexInChain.has(dispositorKey)) {
      loopKeys = chainKeys.slice(indexInChain.get(dispositorKey));
      break;
    }
    chainKeys.push(dispositorKey);
    indexInChain.set(dispositorKey, chainKeys.length - 1);
    current = dispositorKey;
  }

  return {
    chain: chainKeys.map((k) => GRAHA_DISPLAY_NAME[k]),
    finalDispositor: finalDispositorKey ? GRAHA_DISPLAY_NAME[finalDispositorKey] : null,
    loop: loopKeys ? canonicalizeLoop(loopKeys.map((k) => GRAHA_DISPLAY_NAME[k])) : null,
  };
}

/** Structural house-ownership role booleans/lists for one planet - Parts H/I. */
function buildLordshipRole(ownedHouses) {
  const ownedKendraHouses = ownedHouses.filter((h) => HOUSE_GROUPS.kendra.includes(h));
  const ownedTrikonaHouses = ownedHouses.filter((h) => HOUSE_GROUPS.trikona.includes(h));
  const ownedDusthanaHouses = ownedHouses.filter((h) => HOUSE_GROUPS.dusthana.includes(h));
  const ownedUpachayaHouses = ownedHouses.filter((h) => HOUSE_GROUPS.upachaya.includes(h));
  return {
    ownedHouses,
    ownedKendraHouses,
    ownedTrikonaHouses,
    ownedDusthanaHouses,
    ownedUpachayaHouses,
    ownsKendra: ownedKendraHouses.length > 0,
    ownsTrikona: ownedTrikonaHouses.length > 0,
    ownsDusthana: ownedDusthanaHouses.length > 0,
    ownsUpachaya: ownedUpachayaHouses.length > 0,
    ownsKendraAndTrikona: ownedKendraHouses.length > 0 && ownedTrikonaHouses.length > 0,
  };
}

/**
 * Builds the Phase 4E `chart.vedic.lordship` structure from already-locked
 * Phase 4A/4B/4D data - no new astronomical calculation, no mutation of
 * `grahas`, `bhava`, or `condition`.
 *
 * @param {object} params
 * @param {object} params.grahas Phase 4A `chart.vedic.grahas`
 * @param {object} params.bhava Phase 4B `chart.vedic.bhava`
 * @param {object} params.condition Phase 4D `chart.vedic.condition`
 * @returns {object} `chart.vedic.lordship` (see module doc comment / README for shape)
 */
export function buildVedicLordship({ grahas, bhava, condition }) {
  const rashiIndexByClassicalPlanet = {};
  for (const key of CLASSICAL_GRAHA_KEYS) {
    rashiIndexByClassicalPlanet[key] = grahas[key].rashiIndex;
  }

  // Part A/B: immediate dispositor for every Graha, classical and nodes alike.
  const dispositors = {};
  for (const key of NAVAGRAHA_ORDER) {
    const rashiKey = RASHIS[grahas[key].rashiIndex].key;
    dispositors[key] = computeDispositor(key, rashiKey);
  }

  // Part C/D/E: full dispositor chain, scoped to the 7 classical Grahas -
  // Rahu/Ketu can never be a link in any chain (Part B), so a chain
  // "starting" at a node would just be its one-step dispositor above.
  const dispositorChains = {};
  for (const key of CLASSICAL_GRAHA_KEYS) {
    dispositorChains[key] = buildDispositorChain(key, rashiIndexByClassicalPlanet);
  }

  // Chart-level distinct loops (Part E) - the same loop reached from
  // multiple starting Grahas is listed exactly once.
  const seenLoopKeys = new Set();
  const loops = [];
  for (const key of CLASSICAL_GRAHA_KEYS) {
    const { loop } = dispositorChains[key];
    if (!loop) continue;
    const identity = loopIdentityKey(loop);
    if (!seenLoopKeys.has(identity)) {
      seenLoopKeys.add(identity);
      loops.push(loop);
    }
  }

  // Part F: Lagna Lord network, normalized from Phase 4B's own lagna/lord data.
  const lagnaRashiKey = RASHIS[bhava.lagna.rashiIndex].key;
  const lagnaLordKey = RASHI_LORDS[lagnaRashiKey];
  const lagnaLordNetwork = {
    lagnaRashi: bhava.lagna.rashi,
    lagnaLord: bhava.lagna.lord,
    lagnaLordRashi: grahas[lagnaLordKey].rashi,
    lagnaLordBhava: bhava.grahaPlacements[lagnaLordKey].bhavaNumber,
    lagnaLordDispositor: dispositors[lagnaLordKey].dispositor,
    dispositorChain: dispositorChains[lagnaLordKey].chain,
    finalDispositor: dispositorChains[lagnaLordKey].finalDispositor,
    loop: dispositorChains[lagnaLordKey].loop,
  };

  // Part H/I: structural house-ownership roles, reusing Phase 4B's
  // planetaryHouseOwnership verbatim - never recomputed.
  const planetaryLordshipRoles = {};
  for (const key of CLASSICAL_GRAHA_KEYS) {
    planetaryLordshipRoles[key] = buildLordshipRole(bhava.planetaryHouseOwnership[key] ?? []);
  }

  // Part J: 12-house lord placement matrix, normalized from Phase 4B's
  // own lordshipNetwork plus Phase 4D's own dignity/retrograde/combustion
  // evidence for that Bhava's lord - neither is recomputed here.
  const houseLordMatrix = bhava.lordshipNetwork.map((entry) => {
    const sourceHouse = bhava.houses[entry.sourceBhava - 1];
    const lordKey = RASHI_LORDS[RASHIS[sourceHouse.rashiIndex].key];
    const lordCondition = condition.planets[lordKey];
    return {
      sourceBhava: entry.sourceBhava,
      sourceRashi: entry.sourceRashi,
      lord: entry.lord,
      lordRashi: entry.lordRashi,
      lordBhava: entry.lordBhava,
      lordDignityStatus: lordCondition.dignity.rashiDignityStatus,
      lordIsRetrograde: lordCondition.condition.isRetrograde,
      lordIsCombust: lordCondition.condition.combustion.isCombust,
    };
  });

  // Part K: per-planet technical evidence rollup - references, not
  // recomputations, of everything already built above and in Phase 4D.
  const planetaryLordshipEvidence = {};
  for (const key of CLASSICAL_GRAHA_KEYS) {
    const planetCondition = condition.planets[key];
    planetaryLordshipEvidence[key] = {
      rashi: grahas[key].rashi,
      bhava: bhava.grahaPlacements[key].bhavaNumber,
      ownedHouses: planetaryLordshipRoles[key].ownedHouses,
      dignityLabels: planetCondition.dignity.dignityLabels,
      rashiDignityStatus: planetCondition.dignity.rashiDignityStatus,
      isRetrograde: planetCondition.condition.isRetrograde,
      isCombust: planetCondition.condition.combustion.isCombust,
      dispositor: dispositors[key].dispositor,
      isSelfDispositor: dispositors[key].isSelfDispositor,
      dispositorChain: dispositorChains[key].chain,
      finalDispositor: dispositorChains[key].finalDispositor,
      loop: dispositorChains[key].loop,
    };
  }

  return {
    meta: {
      dispositorSystem: DISPOSITOR_SYSTEM,
      dispositorFinalRule: DISPOSITOR_FINAL_RULE,
      dispositorLoopPolicy: DISPOSITOR_LOOP_POLICY,
      houseGroupConvention: HOUSE_GROUP_CONVENTION,
      functionalBenefic: FUNCTIONAL_BENEFIC_STATUS,
      functionalMalefic: FUNCTIONAL_MALEFIC_STATUS,
      yogakaraka: YOGAKARAKA_STATUS,
      maraka: MARAKA_STATUS,
      badhaka: BADHAKA_STATUS,
      interpretation: VEDIC_LORDSHIP_INTERPRETATION,
    },
    houseGroups: HOUSE_GROUPS,
    dispositors,
    dispositorChains,
    loops,
    lagnaLordNetwork,
    planetaryLordshipRoles,
    houseLordMatrix,
    planetaryLordshipEvidence,
  };
}
