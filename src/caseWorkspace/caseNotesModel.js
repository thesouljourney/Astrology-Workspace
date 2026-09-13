/**
 * General Case Notes model — Production UX Refactor, Part 13.
 *
 * Observations that belong to the Case as a whole, not to any single
 * Phase 6 Topic (repeated themes, questions to revisit, consultation
 * prep). Pure data factory - no storage, no astrology calculation, no
 * interpretation. Scoped by `caseId` only (not by chartFingerprint):
 * these are the astrologer's own working notes about the person/
 * consultation, not a per-chart-version technical interpretation like a
 * Topic Note (see `noteModel.js`), so they are not versioned or
 * fingerprint-isolated the way Topic Notes are.
 */
export function createCaseNotesRecord(caseId) {
  const now = new Date().toISOString();
  return { caseId, notes: "", createdAt: now, updatedAt: now };
}
