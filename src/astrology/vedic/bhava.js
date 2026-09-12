/**
 * Vedic Bhava (house) structure — Phase 4B, Whole-Sign from Lagna.
 *
 * SCOPE: this module derives the first Vedic house architecture layer
 * from data Phase 4A already computed (the sidereal Lagna Rashi and the
 * nine Navagraha's sidereal Rashis) — it performs no astronomical
 * calculation of its own and creates no second sidereal engine. It
 * builds: the 12 Whole-Sign Bhavas, each Graha's Bhava placement,
 * traditional Rashi lordship (house ownership), and a lordship-placement
 * network. It deliberately does NOT implement Bhava Chalit (degree-based
 * house cusps), Nakshatra, dignity, yogas, drishti (aspects), dashas,
 * Vargas, or any interpretation/scoring — see `chart.vedic.meta` for
 * explicit "not_implemented"/"none" markers on all of those.
 *
 * CONVENTION: `whole_sign_from_lagna` — the entire Rashi occupied by the
 * Lagna becomes Bhava 1 in full; each following Rashi (in the fixed
 * zodiacal order) becomes the next Bhava, regardless of the degree
 * within the Rashi at which the Lagna actually falls. This is the
 * oldest and most widespread Jyotish house convention (as distinct from
 * Sripati/Bhava Chalit or any Western degree-based cusp system, none of
 * which are implemented here). No house has a cusp degree in this
 * phase; membership is categorical by Rashi alone.
 *
 * BHAVA NUMBER FORMULA: for a Graha in sidereal Rashi index `g` (0 =
 * Aries .. 11 = Pisces) with the Lagna in Rashi index `l`:
 *
 *   bhavaNumber = ((g - l + 12) % 12) + 1
 *
 * (the `+ 12` before the modulo guards against a negative left operand,
 * since `g - l` can be as low as -11 in plain JavaScript `%`, which is a
 * remainder operator, not a true modulo, and does not itself wrap
 * negative values into [0, 12)).
 *
 * RASHI LORDSHIP: the traditional seven-planet Jyotish scheme
 * (`rashiLordship.js`) — Rahu/Ketu are never assigned Rashi lordship or
 * Bhava ownership in this phase (or any phase; this is not a Phase 4B
 * simplification, it is the traditional rule), even though they receive
 * ordinary Whole-Sign Bhava placement like every other graha.
 *
 * NO INTERPRETATION: "2nd lord in the 4th Bhava" is exposed as a plain
 * technical fact (`lordPlacedInBhava`, `lordshipNetwork`) — this module
 * never states or implies what that fact means (yogakaraka, functional
 * benefic/malefic, maraka, etc.); those judgments belong to a later,
 * explicitly-deferred phase (or to the human interpreter, per this
 * project's core principle).
 */

import { RASHIS } from "./rashi.js";
import { RASHI_LORDS } from "./rashiLordship.js";
import { GRAHA_DISPLAY_NAME, NAVAGRAHA_ORDER } from "./grahaNames.js";

export const VEDIC_BHAVA_SYSTEM = "whole_sign_from_lagna";
export const VEDIC_BHAVA_CUSP_MODEL = "none_rashi_based";
export const VEDIC_HOUSE_LORDSHIP_SYSTEM = "traditional_jyotish_rashi_lordship";
export const VEDIC_BHAVA_CHALIT_STATUS = "not_implemented";
export const VEDIC_FUNCTIONAL_LORDSHIP_STATUS = "not_implemented";
export const VEDIC_HOUSE_INTERPRETATION = "none";

/**
 * Whole-Sign Bhava number for a Graha, given the Lagna's Rashi index.
 * @param {number} grahaRashiIndex 0 (Aries) .. 11 (Pisces)
 * @param {number} lagnaRashiIndex 0 (Aries) .. 11 (Pisces)
 * @returns {number} 1..12
 */
export function bhavaNumberFromRashiIndex(grahaRashiIndex, lagnaRashiIndex) {
  return ((grahaRashiIndex - lagnaRashiIndex + 12) % 12) + 1;
}

/**
 * Builds the Phase 4B Whole-Sign Bhava structure from an already-built
 * Phase 4A `chart.vedic` object (its `lagna` and `grahas`) — no
 * additional astronomical input is needed or used.
 *
 * @param {object} params
 * @param {object} params.lagna Phase 4A `chart.vedic.lagna` (needs `.rashiIndex`, `.rashi`)
 * @param {object} params.grahas Phase 4A `chart.vedic.grahas` (keyed by lowercase graha key)
 * @returns {object} `chart.vedic.bhava` (see module doc comment / README for shape)
 */
export function buildVedicBhava({ lagna, grahas }) {
  const lagnaRashiIndex = lagna.rashiIndex;
  const lagnaRashiKey = RASHIS[lagnaRashiIndex].key;
  const lagnaLordKey = RASHI_LORDS[lagnaRashiKey];

  // The 12 Whole-Sign Bhavas, in Bhava-number order (1..12), each holding
  // exactly one Rashi - the Lagna's own Rashi for Bhava 1, then each
  // following Rashi in fixed zodiacal order.
  const houses = [];
  for (let offset = 0; offset < 12; offset++) {
    const rashiIndex = (lagnaRashiIndex + offset) % 12;
    const rashi = RASHIS[rashiIndex];
    const lordKey = RASHI_LORDS[rashi.key];
    houses.push({
      bhavaNumber: offset + 1,
      rashi: rashi.name,
      rashiIndex,
      lord: GRAHA_DISPLAY_NAME[lordKey],
      grahas: [],
      lagnaOffsetSigns: offset,
      // filled in below, once every Graha's placement is known
      lordPlacedInBhava: null,
    });
  }

  // Every Navagraha's Bhava placement, derived purely from its own
  // already-computed sidereal Rashi (Phase 4A) and the Lagna's Rashi -
  // never a new position calculation. Kept as its own additive
  // structure (never mutating Phase 4A's `chart.vedic.grahas` objects),
  // per the brief's explicit preference.
  const grahaPlacements = {};
  for (const key of NAVAGRAHA_ORDER) {
    const g = grahas[key];
    const bhavaNumber = bhavaNumberFromRashiIndex(g.rashiIndex, lagnaRashiIndex);
    grahaPlacements[key] = {
      rashi: g.rashi,
      rashiIndex: g.rashiIndex,
      bhavaNumber,
    };
    houses[bhavaNumber - 1].grahas.push(GRAHA_DISPLAY_NAME[key]);
  }

  // Neutral technical house-lordship structure (Part H) - forward map
  // (Bhava -> lord) and reverse map (planet -> Bhavas it owns). Only the
  // seven classical grahas ever own a Bhava; Rahu/Ketu never appear here
  // as owners (they still receive ordinary placement above).
  const houseLords = {};
  const planetaryHouseOwnership = {};
  for (const lordKey of new Set(Object.values(RASHI_LORDS))) {
    planetaryHouseOwnership[lordKey] = [];
  }
  for (const house of houses) {
    houseLords[house.bhavaNumber] = house.lord;
    const lordKey = RASHI_LORDS[RASHIS[house.rashiIndex].key];
    planetaryHouseOwnership[lordKey].push(house.bhavaNumber);
    house.lordPlacedInBhava = grahaPlacements[lordKey].bhavaNumber;
  }

  // Traceable lordship network (Part J): for every Bhava, where its own
  // lord physically sits. A plain technical fact only - no
  // yogakaraka/functional-benefic/maraka judgment is made or implied.
  const lordshipNetwork = houses.map((house) => {
    const lordKey = RASHI_LORDS[RASHIS[house.rashiIndex].key];
    const lordPlacement = grahaPlacements[lordKey];
    return {
      sourceBhava: house.bhavaNumber,
      sourceRashi: house.rashi,
      lord: house.lord,
      lordRashi: lordPlacement.rashi,
      lordBhava: lordPlacement.bhavaNumber,
    };
  });

  return {
    meta: {
      system: VEDIC_BHAVA_SYSTEM,
      bhavaCuspModel: VEDIC_BHAVA_CUSP_MODEL,
      bhavaChalit: VEDIC_BHAVA_CHALIT_STATUS,
    },
    lagna: {
      rashi: lagna.rashi,
      rashiIndex: lagnaRashiIndex,
      lord: GRAHA_DISPLAY_NAME[lagnaLordKey],
    },
    houses,
    grahaPlacements,
    houseLords,
    planetaryHouseOwnership,
    lordshipNetwork,
  };
}
