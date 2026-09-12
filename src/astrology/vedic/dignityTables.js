/**
 * Vedic (Parashari) dignity/relationship reference tables — Phase 4D.
 *
 * Pure data, no calculation. Every table here was cross-checked against
 * at least two independent reputable sources before being adopted (per
 * the Phase 4D brief's explicit "Critical Research Rule"); where sources
 * materially disagreed, the choice was surfaced to the project owner
 * rather than silently picked — see the per-table notes below for
 * exactly which points were contested and how they were resolved.
 *
 * ====================================================================
 * OWN SIGNS, EXALTATION/DEBILITATION SIGNS (Parts B/C) — UNCONTESTED
 * ====================================================================
 * Every reputable Parashari source agrees on the own-sign and
 * exaltation/debilitation SIGN tables (as opposed to the exact DEGREE
 * within a sign, which is handled separately below) - no disagreement
 * was found across sources during research, so these were adopted
 * directly without needing to surface a convention choice.
 *
 * ====================================================================
 * EXACT EXALTATION DEGREES (Part D)
 * ====================================================================
 * The standard Parashari degree-of-exaltation table (Sun 10 Aries, Moon
 * 3 Taurus, Mars 28 Capricorn, Mercury 15 Virgo, Jupiter 5 Cancer, Venus
 * 27 Pisces, Saturn 20 Libra) was confirmed consistently across multiple
 * sources with no disagreement, EXCEPT for one narrow point: a Western
 * tropical/Ptolemaic source cites Saturn's exaltation at 21 Libra rather
 * than 20 Libra. This is a cross-TRADITION difference (Western tropical
 * vs. Vedic sidereal astrology use separate degree conventions
 * entirely), not a disagreement WITHIN Jyotish sources - every Vedic/
 * Parashari-specific source found cites 20 Libra, so it was adopted
 * without needing to stop, consistent with this phase's Vedic-only
 * scope (this project's own separate Western Classical engine, Phase
 * 3A, is unaffected and untouched).
 *
 * Debilitation's exact point is derived mathematically as exactly 180
 * degrees from the exaltation point (same degree-within-sign number, in
 * the opposite sign) rather than stored as a second independent table -
 * this is a documented, uncontested mathematical property, not an
 * independent research question.
 *
 * ====================================================================
 * MOOLATRIKONA (Part E) — GENUINELY CONTESTED, RESOLVED BY EXPLICIT APPROVAL
 * ====================================================================
 * Two points of real, material disagreement were found across sources
 * during research (surfaced to and resolved by the project owner before
 * this table was written - see the Phase 4D research findings/report):
 *
 * 1. Moon's Moolatrikona in Taurus: some sources give 4-20 degrees
 *    (treating it like the other six planets' fixed ~16-degree-wide
 *    zone), while BPHS-critical-edition-based sources give 4-30 degrees
 *    (Moolatrikona filling the rest of the sign after the 3-degree
 *    exaltation point - Moon is the one planet whose Moolatrikona sits
 *    inside its own EXALTATION sign rather than an owned sign). RESOLVED:
 *    4-30 Taurus (the BPHS/Jagannatha-Hora-style convention).
 *
 * 2. Mercury's Moolatrikona in Virgo: some sources give 15-20 degrees
 *    (starting exactly at Mercury's own 15-degree exaltation point),
 *    while BPHS-critical-edition sources give 16-20 (starting one degree
 *    after the exact exaltation point, avoiding overlap with it).
 *    RESOLVED: 16-20 Virgo (the BPHS-style convention, consistent with
 *    the same "gap right after the exact exaltation degree" pattern
 *    used for Moon above).
 *
 * A third, much narrower discrepancy (Sun's Moolatrikona starting at 0
 * vs. 1 degree Leo) appeared in only one lower-quality aggregation with
 * no textual justification offered for "1", against the consistent,
 * textually-grounded "0" from every other source (and matching the
 * 0-degree start used for five of the other six planets) - this was
 * treated as an isolated citation error rather than a genuine second
 * convention, so 0 was adopted without stopping.
 *
 * Selected convention name: `"bphs_critical_edition"`.
 * Boundary policy (Part E, matching this project's Phase 4C precedent):
 * half-open `[startDegree, endDegree)` - the start degree belongs to
 * Moolatrikona, the end degree belongs to the next dignity zone.
 *
 * ====================================================================
 * DIGNITY PRECEDENCE (Part F) — for the single `rashiDignityStatus` display field
 * ====================================================================
 * Multiple sources consistently describe the same strength ordering
 * used in classical Shadbala (Sthana Bala) scoring, with no disagreement
 * found: Exaltation > Moolatrikona > Own Sign > Friend's Sign > Neutral
 * Sign > Enemy Sign > Debilitation. This project does NOT compute
 * Shadbala or any strength score (Part N) - only this precedence
 * ORDERING is borrowed, purely to pick one label when a placement
 * satisfies more than one independent boolean at once (e.g. Mercury
 * anywhone in Virgo is simultaneously in its own sign AND its
 * exaltation sign; within 16-20 Virgo it is additionally Moolatrikona -
 * all three booleans stay independently true and visible; this
 * precedence only decides which ONE word summarizes them).
 *
 * ====================================================================
 * NATURAL FRIENDSHIP / NAISARGIKA MAITRI (Part G) — UNCONTESTED
 * ====================================================================
 * The classical Parashari natural-friendship table was found identical
 * (down to its well-known ASYMMETRIES - e.g. Mercury naturally
 * considers the Sun a friend, but the Sun considers Mercury merely
 * neutral; Saturn considers Mars an enemy, but Mars considers Saturn
 * merely neutral) across every source checked - no disagreement found,
 * so no convention choice was needed. This table is used ONLY for
 * natural (Naisargika) friendship - temporary (Tatkalika) and compound
 * (Panchadha) friendship are explicitly NOT implemented in this phase
 * (Part I).
 *
 * ====================================================================
 * COMBUSTION / ASTA (Part J) — CONVENTION NAMED, CONFIRMED CONSISTENT
 * ====================================================================
 * The per-planet Jyotish combustion-orb table (distinct from, and never
 * reusing, this project's separate Western Classical Phase 3B
 * combustion thresholds, which use a single universal orb rather than a
 * per-planet one) was checked across multiple sources citing Brihat
 * Parashara Hora Shastra and Mantreswara's Phaladeepika, with no
 * material disagreement found: Moon 12, Mars 17, Mercury 14 (12 when
 * retrograde), Jupiter 11, Venus 10 (8 when retrograde), Saturn 15. A
 * follow-up check specifically confirmed that ONLY Mercury and Venus
 * (the two planets that can appear retrograde while near the Sun) carry
 * a separate retrograde threshold in these sources - Mars/Jupiter/
 * Saturn/Moon use one fixed orb regardless of motion state. The Sun has
 * no combustion threshold (a body cannot be combust by its own light).
 * Selected convention name: `"bphs_phaladeepika_per_planet_orb"`.
 */

export const DIGNITY_SYSTEM = "parashari_baseline";
export const EXALTATION_CONVENTION = "parashari_standard_exact_degrees";
export const MOOLATRIKONA_CONVENTION = "bphs_critical_edition";
export const NATURAL_FRIENDSHIP_CONVENTION = "naisargika_maitri_bphs";
export const COMBUSTION_CONVENTION = "bphs_phaladeepika_per_planet_orb";
export const RAHU_KETU_DIGNITY_STATUS = "not_assigned_due_to_traditional_variance";

export const CLASSICAL_GRAHA_KEYS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];

/** Own signs (Swakshetra) — Part B. Rashi keys match `rashi.js`'s `RASHIS[].key`. */
export const OWN_SIGNS = {
  sun: ["leo"],
  moon: ["cancer"],
  mars: ["aries", "scorpio"],
  mercury: ["gemini", "virgo"],
  jupiter: ["sagittarius", "pisces"],
  venus: ["taurus", "libra"],
  saturn: ["capricorn", "aquarius"],
};

/** Exaltation sign + exact degree within that sign (Parts C/D). */
export const EXALTATION = {
  sun: { rashiKey: "aries", exactDegree: 10 },
  moon: { rashiKey: "taurus", exactDegree: 3 },
  mars: { rashiKey: "capricorn", exactDegree: 28 },
  mercury: { rashiKey: "virgo", exactDegree: 15 },
  jupiter: { rashiKey: "cancer", exactDegree: 5 },
  venus: { rashiKey: "pisces", exactDegree: 27 },
  saturn: { rashiKey: "libra", exactDegree: 20 },
};

/** Moolatrikona sign + half-open degree range (Part E) — see module doc comment for the two resolved disagreements. */
export const MOOLATRIKONA = {
  sun: { rashiKey: "leo", startDegree: 0, endDegree: 20 },
  moon: { rashiKey: "taurus", startDegree: 4, endDegree: 30 },
  mars: { rashiKey: "aries", startDegree: 0, endDegree: 12 },
  mercury: { rashiKey: "virgo", startDegree: 16, endDegree: 20 },
  jupiter: { rashiKey: "sagittarius", startDegree: 0, endDegree: 10 },
  venus: { rashiKey: "libra", startDegree: 0, endDegree: 15 },
  saturn: { rashiKey: "aquarius", startDegree: 0, endDegree: 20 },
};

/** Precedence for the single display field `rashiDignityStatus` (Part F), strongest first. */
export const DIGNITY_STATUS_PRECEDENCE = [
  "exaltation",
  "moolatrikona",
  "own_sign",
  "friend_sign",
  "neutral_sign",
  "enemy_sign",
  "debilitation",
];

/** Naisargika Maitri — natural planetary friendship (Part G). Deliberately asymmetric in places; see module doc comment. */
export const NATURAL_RELATIONSHIPS = {
  sun: { friends: ["moon", "mars", "jupiter"], neutrals: ["mercury"], enemies: ["venus", "saturn"] },
  moon: { friends: ["sun", "mercury"], neutrals: ["mars", "jupiter", "venus", "saturn"], enemies: [] },
  mars: { friends: ["sun", "moon", "jupiter"], neutrals: ["venus", "saturn"], enemies: ["mercury"] },
  mercury: { friends: ["sun", "venus"], neutrals: ["mars", "jupiter", "saturn"], enemies: ["moon"] },
  jupiter: { friends: ["sun", "moon", "mars"], neutrals: ["saturn"], enemies: ["mercury", "venus"] },
  venus: { friends: ["mercury", "saturn"], neutrals: ["mars", "jupiter"], enemies: ["sun", "moon"] },
  saturn: { friends: ["mercury", "venus"], neutrals: ["jupiter"], enemies: ["sun", "moon", "mars"] },
};

/** Combustion (Asta) orb in degrees of solar elongation (Part J). `retrograde: null` means no separate retrograde value is used for that planet. */
export const COMBUSTION_THRESHOLDS = {
  moon: { direct: 12, retrograde: null },
  mars: { direct: 17, retrograde: null },
  mercury: { direct: 14, retrograde: 12 },
  jupiter: { direct: 11, retrograde: null },
  venus: { direct: 10, retrograde: 8 },
  saturn: { direct: 15, retrograde: null },
};

/**
 * Debilitation sign + exact degree, derived mathematically as exactly
 * 180 degrees from the exaltation point (Part D) — never a second,
 * independently-sourced table.
 * @param {"sun"|"moon"|"mars"|"mercury"|"jupiter"|"venus"|"saturn"} planetKey
 * @param {Array<{key: string}>} rashis the `RASHIS` table from `rashi.js` (passed in to avoid a circular import)
 * @returns {{rashiKey: string, exactDegree: number}}
 */
export function getDebilitation(planetKey, rashis) {
  const exaltation = EXALTATION[planetKey];
  const exaltationIndex = rashis.findIndex((r) => r.key === exaltation.rashiKey);
  const debilitationIndex = (exaltationIndex + 6) % 12;
  return { rashiKey: rashis[debilitationIndex].key, exactDegree: exaltation.exactDegree };
}

/**
 * The combustion orb (degrees) for a planet given its current motion
 * state — Part J. Returns `null` for the Sun (never applicable).
 * @param {string} planetKey
 * @param {boolean} isRetrograde
 * @returns {number|null}
 */
export function getCombustionThreshold(planetKey, isRetrograde) {
  const entry = COMBUSTION_THRESHOLDS[planetKey];
  if (!entry) return null;
  if (isRetrograde && entry.retrograde !== null) return entry.retrograde;
  return entry.direct;
}
