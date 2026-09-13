/**
 * Namespaced, versioned local-storage key strategy — Phase 7.
 *
 * Every key Phase 7 ever writes goes through one of these builders, so
 * there is exactly one place that documents the on-disk shape. Bumping
 * `STORAGE_SCHEMA_VERSION` changes every key this module produces,
 * which is the deliberate, simple migration story for now: old-version
 * keys are simply never read by a new version (see `readJson()`'s
 * "missing/malformed data must never crash" contract in the
 * repositories) rather than being silently reinterpreted.
 */
export const STORAGE_SCHEMA_VERSION = 1;
const NAMESPACE = `astro_workspace.v${STORAGE_SCHEMA_VERSION}`;

/** The index of every Case (list of {caseId} pointers is not needed - the index stores full Case records, since Cases are small). */
export const caseIndexKey = () => `${NAMESPACE}.cases`;

/** One Case's full record, addressed by its stable caseId (never its caseName). */
export const caseKey = (caseId) => `${NAMESPACE}.case.${caseId}`;

/** The full notes workspace for one (caseId, topicId) pair - every chartFingerprint this pair has ever had notes under, and every version within each. */
export const notesWorkspaceKey = (caseId, topicId) => `${NAMESPACE}.notes.${caseId}.${topicId}`;

/** General Case Notes (Production UX Refactor, Part 13) - one freeform document per Case, not tied to a Topic or chartFingerprint. */
export const caseNotesKey = (caseId) => `${NAMESPACE}.caseNotes.${caseId}`;

/** Final Reading (Production UX Refactor, Part 14) - one human-authored Case-level synthesis document per Case. */
export const finalReadingKey = (caseId) => `${NAMESPACE}.finalReading.${caseId}`;
