/**
 * Topic Note model — Phase 7. Pure data factories, no storage, no
 * astrology calculation, no interpretation. Every field a human writes
 * starts empty; nothing here ever pre-fills chart interpretation.
 */

const uuid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `note_${Date.now()}_${Math.random().toString(16).slice(2)}`);

export const NOTE_STATUS = { DRAFT: "draft", FINAL: "final", ARCHIVED: "archived" };

/** Every locked Phase 6 topic ID Phase 7 can render a workspace for - never a second topic-recipe engine, just this identity list. */
export const PHASE6_TOPIC_IDS = ["self_core_nature", "career", "wealth", "relationship", "family_roots", "parents", "siblings", "inner_shadow"];

/** Suggested "Evidence Relied On" categories (brief Part 13) - user annotation, never a score. */
export const EVIDENCE_RELIED_ON_CATEGORIES = ["domain_architecture", "core_rulers", "technical_condition", "domain_occupants", "structural_connections", "supporting_evidence", "other"];

/**
 * @param {object} params
 * @param {string} params.caseId
 * @param {string} params.topicId one of PHASE6_TOPIC_IDS
 * @param {string} params.chartFingerprint
 * @param {number} params.versionNumber 1, 2, 3...
 * @returns {object} a new, entirely-blank Topic Note version
 */
export function createNoteVersion({ caseId, topicId, chartFingerprint, versionNumber }) {
  const now = new Date().toISOString();
  return {
    noteId: uuid(),
    caseId,
    topicId,
    chartFingerprint,

    westernNotes: "",
    classicalNotes: "",
    vedicNotes: "",

    convergenceNotes: "",
    differencesNotes: "",
    uncertainNotes: "",

    finalInterpretation: "",
    evidenceReliedOn: [],

    versionNumber,
    status: NOTE_STATUS.DRAFT,

    createdAt: now,
    updatedAt: now,
  };
}
