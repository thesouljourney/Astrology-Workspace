/**
 * Local (localStorage-or-memory) implementation of the `caseNotesRepository`
 * contract - Production UX Refactor, Part 13.
 *
 * Mirrors the exact isolation/async pattern of `localCaseRepository.js`/
 * `localNotesRepository.js`: UI components never touch localStorage
 * directly, every public method is `async` (always Promise-returning)
 * for the same future-Supabase-compatibility reason documented there.
 * One record per `caseId`; unlike Topic Notes this is NOT isolated by
 * chartFingerprint or versioned - see `caseNotesModel.js` for why.
 */
import { getDefaultStorage } from "./memoryStorage.js";
import { readJson, writeJson } from "./jsonStore.js";
import { caseNotesKey } from "./storageKeys.js";
import { createCaseNotesRecord } from "../caseNotesModel.js";

/** @param {object} [storage] a Web Storage-compatible adapter; defaults to localStorage-or-memory. */
export function createLocalCaseNotesRepository(storage = getDefaultStorage()) {
  return {
    /** Resolves to this Case's General Notes record, creating a blank one on first access (never persisted until the first save, though - see `save`). */
    async get(caseId) {
      return readJson(storage, caseNotesKey(caseId), null) ?? createCaseNotesRecord(caseId);
    },

    /** Merges `patch` (only `notes`) into the record and persists it, bumping updatedAt. */
    async save(caseId, patch) {
      const current = await this.get(caseId);
      const updated = { ...current, notes: patch.notes ?? current.notes, updatedAt: new Date().toISOString() };
      writeJson(storage, caseNotesKey(caseId), updated);
      return updated;
    },
  };
}
