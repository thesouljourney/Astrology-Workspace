/**
 * Project-level astrology calculation-generation identity.
 *
 * This is NOT a historical claim about what has already happened in
 * Phases 1-6 - it is the start of an explicit versioning discipline
 * from this point forward (introduced during Phase 7's pre-lock audit).
 *
 * BUMP RULE: increment `ASTROLOGY_CALCULATION_GENERATION` (e.g.
 * "astrology_calculation_generation_v2") whenever a change to ANY
 * locked astrology calculation or evidence-generating layer (Phases
 * 1-6) could cause IDENTICAL astrology inputs/conventions to produce
 * MATERIALLY DIFFERENT technical evidence. This is a project-wide
 * discipline enforced by convention, not by an automated check.
 *
 * Examples that SHOULD require a bump:
 *   - an ephemeris/position calculation correction
 *   - a house-cusp calculation correction
 *   - a node (Rahu/Ketu or North/South Node) calculation correction
 *   - a Classical dignity/rulership/reception rule correction
 *   - an aspect-geometry or orb computation correction
 *   - a Vedic ayanamsha implementation correction
 *   - a Bhava-placement correction
 *   - a Nakshatra-boundary correction
 *   - any other locked technical-calculation bug fix that changes
 *     evidence output for existing inputs
 *
 * Examples that should NOT require a bump:
 *   - a CSS/UI/layout change
 *   - a README or wording change
 *   - the Phase 7 Case/Notes feature itself
 *   - a storage-backend change (e.g. a future Supabase repository)
 *   - a non-astrology refactor that provably produces identical output
 *
 * This constant is read by `caseWorkspace/fingerprint.js` (via
 * `chart.meta.astrologyCalculationGeneration`, attached in
 * `ephemeris.js`) so that a future bump automatically makes every
 * existing Case's live-recomputed chartFingerprint diverge from
 * whatever fingerprint its notes were written under - exactly the
 * same "written for an earlier chart version" mechanism a birth-data
 * edit already triggers, with zero migration code needed.
 */
export const ASTROLOGY_CALCULATION_GENERATION = "astrology_calculation_generation_v1";
