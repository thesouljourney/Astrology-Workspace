/**
 * Final Reading model — Production UX Refactor, Part 14.
 *
 * A human-authored, Case-level synthesis. Every field starts blank -
 * nothing here is ever pre-filled or generated; it exists purely so the
 * astrologer can write their own final judgment while the UI displays
 * (never copies in) each Topic's current Final Interpretation for
 * reference (see `FinalReadingSection.jsx`). Scoped by `caseId` only,
 * like General Case Notes - a single evolving document, not versioned.
 */
export function createFinalReadingRecord(caseId) {
  const now = new Date().toISOString();
  return {
    caseId,
    overallImpression: "",
    repeatedThemes: "",
    crossSystemConvergence: "",
    crossSystemDifferences: "",
    finalSynthesis: "",
    createdAt: now,
    updatedAt: now,
  };
}
