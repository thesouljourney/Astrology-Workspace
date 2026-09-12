/**
 * Local (localStorage-or-memory) implementation of the `caseRepository`
 * contract - Phase 7.
 *
 * UI components talk to this interface ONLY; they never call
 * `localStorage` directly (brief Part 19). A future
 * `SupabaseCaseRepository` can implement the exact same async-friendly
 * method names against a remote table without the UI changing at all -
 * see the README's "Future Supabase Compatibility" section for the
 * conceptual `cases` table mapping.
 */

import { getDefaultStorage } from "./memoryStorage.js";
import { readJson, writeJson } from "./jsonStore.js";
import { caseIndexKey } from "./storageKeys.js";
import { createCaseRecord, CASE_STATUS } from "../caseModel.js";

/** @param {object} [storage] a Web Storage-compatible adapter; defaults to localStorage-or-memory. */
export function createLocalCaseRepository(storage = getDefaultStorage()) {
  const readAll = () => readJson(storage, caseIndexKey(), []);
  const writeAll = (cases) => writeJson(storage, caseIndexKey(), cases);

  return {
    /** Creates and persists a new Case. Returns the created record. */
    create({ caseName, birthData, calculationProfile, chartFingerprint = null }) {
      const record = createCaseRecord({ caseName, birthData, calculationProfile });
      record.chartFingerprint = chartFingerprint;
      const all = readAll();
      all.push(record);
      writeAll(all);
      return record;
    },

    /** Returns one Case by its stable caseId, or null. */
    get(caseId) {
      return readAll().find((c) => c.caseId === caseId) ?? null;
    },

    /** Returns all Cases (active + archived unless `includeArchived: false`). */
    list({ includeArchived = true } = {}) {
      const all = readAll();
      return includeArchived ? all : all.filter((c) => c.status !== CASE_STATUS.ARCHIVED);
    },

    /** Merges `patch` into the Case (caseName/birthData/calculationProfile/chartFingerprint/status), bumps updatedAt. caseId/createdAt are never mutated. */
    update(caseId, patch) {
      const all = readAll();
      const index = all.findIndex((c) => c.caseId === caseId);
      if (index === -1) return null;
      const { caseId: _ignoredId, createdAt: _ignoredCreatedAt, ...allowedPatch } = patch;
      const updated = { ...all[index], ...allowedPatch, updatedAt: new Date().toISOString() };
      all[index] = updated;
      writeAll(all);
      return updated;
    },

    /** Convenience: rename only (never touches caseId). */
    rename(caseId, caseName) {
      return this.update(caseId, { caseName });
    },

    archive(caseId) {
      return this.update(caseId, { status: CASE_STATUS.ARCHIVED });
    },

    unarchive(caseId) {
      return this.update(caseId, { status: CASE_STATUS.ACTIVE });
    },
  };
}
