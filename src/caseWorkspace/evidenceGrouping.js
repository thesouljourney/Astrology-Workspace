/**
 * Phase 6 evidence -> Phase 7 workflow-group classification.
 *
 * THIS IS A PRESENTATION-ONLY REGROUPING. It introduces no astrology
 * semantics: every value it reads (`category`, `role`) already exists
 * on a resolved Phase 6 `EvidenceItem` (see
 * `topicRetrieval/resolveItem.js`), and this module only decides which
 * of the brief's workflow sections (Domain Architecture / Core Rulers /
 * Technical Condition / Domain Occupants / Structural Connections /
 * Supporting Evidence / Missing Evidence / Convention Pending /
 * Excluded) a given item is displayed under. It never changes an
 * item's `availability`, `value`, or `sourcePath`, and it never
 * fabricates a group a topic's evidence doesn't actually contain.
 *
 * Classification order:
 *   1. category "future_required"    -> "missing_evidence"     (regardless of role)
 *   2. category "excluded"           -> "excluded"              (regardless of role)
 *   3. category "convention_pending" -> "convention_pending"    (regardless of role)
 *   4. category "contextual"         -> "structural_connections" (regardless of role - this
 *                                        is exactly the bucket brief Part 9 describes)
 *   5. category "primary"/"secondary" -> classified by ROLE (see ROLE_TO_GROUP below)
 */

export const DISPLAY_GROUPS = ["domain_architecture", "core_rulers", "technical_condition", "domain_occupants", "structural_connections", "supporting_evidence", "missing_evidence", "convention_pending", "excluded"];

const ROLE_TO_GROUP = {
  domain_anchor: "domain_architecture",
  native_anchor: "domain_architecture",
  sibling_domain_anchor: "domain_architecture",
  elder_sibling_anchor: "domain_architecture",

  domain_ruler: "core_rulers",
  technical_condition: "technical_condition",
  domain_occupant: "domain_occupants",

  supporting_luminary: "supporting_evidence",
  supporting_planet: "supporting_evidence",
  supporting_significator: "supporting_evidence",
  supporting_natural_significator: "supporting_evidence",

  relationship_evidence: "structural_connections",
  contextual_structure: "structural_connections",
};

/** @returns {string} one of DISPLAY_GROUPS for a single resolved EvidenceItem. */
export function classifyDisplayGroup(item) {
  if (item.category === "future_required") return "missing_evidence";
  if (item.category === "excluded") return "excluded";
  if (item.category === "convention_pending") return "convention_pending";
  if (item.category === "contextual") return "structural_connections";
  return ROLE_TO_GROUP[item.role] ?? "supporting_evidence";
}

/** Groups every evidence item in a Phase 6 system bundle (bundle.primary/secondary/contextual/futureRequired/excluded/conventionPending, all arrays) into DISPLAY_GROUPS. A group with zero items is omitted entirely - never fabricated. */
export function groupSystemEvidence(systemBundle) {
  const allItems = [...systemBundle.primary, ...systemBundle.secondary, ...systemBundle.contextual, ...systemBundle.futureRequired, ...systemBundle.excluded, ...systemBundle.conventionPending];

  const grouped = {};
  for (const item of allItems) {
    const group = classifyDisplayGroup(item);
    (grouped[group] ??= []).push(item);
  }
  return grouped;
}
