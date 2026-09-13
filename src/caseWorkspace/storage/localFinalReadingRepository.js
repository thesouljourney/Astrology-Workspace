/**
 * Local (localStorage-or-memory) implementation of the `finalReadingRepository`
 * contract - Production UX Refactor, Part 14.
 *
 * Same isolation/async pattern as `localCaseNotesRepository.js`. One
 * record per `caseId`, not versioned or fingerprint-isolated - a single
 * evolving human-authored synthesis document per Case.
 */
import { getDefaultStorage } from "./memoryStorage.js";
import { readJson, writeJson } from "./jsonStore.js";
import { finalReadingKey } from "./storageKeys.js";
import { createFinalReadingRecord } from "../finalReadingModel.js";

const PATCHABLE_FIELDS = ["overallImpression", "repeatedThemes", "crossSystemConvergence", "crossSystemDifferences", "finalSynthesis"];

/** @param {object} [storage] a Web Storage-compatible adapter; defaults to localStorage-or-memory. */
export function createLocalFinalReadingRepository(storage = getDefaultStorage()) {
  return {
    /** Resolves to this Case's Final Reading record, creating a blank one on first access (not persisted until the first save). */
    async get(caseId) {
      return readJson(storage, finalReadingKey(caseId), null) ?? createFinalReadingRecord(caseId);
    },

    /** Merges `patch` (any of PATCHABLE_FIELDS) into the record and persists it, bumping updatedAt. */
    async save(caseId, patch) {
      const current = await this.get(caseId);
      const allowedPatch = {};
      for (const field of PATCHABLE_FIELDS) {
        if (field in patch) allowedPatch[field] = patch[field];
      }
      const updated = { ...current, ...allowedPatch, updatedAt: new Date().toISOString() };
      writeJson(storage, finalReadingKey(caseId), updated);
      return updated;
    },
  };
}
