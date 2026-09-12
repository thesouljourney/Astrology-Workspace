/**
 * Local (localStorage-or-memory) implementation of the `caseRepository`
 * contract - Phase 7.
 *
 * UI components talk to this interface ONLY; they never call
 * `localStorage` directly (brief Part 19). Every public method below is
 * declared `async` and therefore ALWAYS returns a Promise, even though
 * the work inside it is synchronous (plain localStorage/memory reads
 * and writes) - this is deliberate: the PUBLIC CONTRACT is
 * async-compatible so a future `SupabaseCaseRepository` can implement
 * the exact same method names against a remote table, and so no UI
 * consumer is ever written against an assumption ("this resolves
 * instantly, in the same tick") that a network-backed implementation
 * could not honor. See the README's "Future Supabase Compatibility"
 * section for the conceptual `cases` table mapping, and
 * `src/components/caseWorkspace/useAsyncData.js` for how consumers
 * read this data safely (never as a resolved value read directly
 * during render).
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
    /** Creates and persists a new Case. Resolves to the created record. */
    async create({ caseName, birthData, calculationProfile, chartFingerprint = null }) {
      const record = createCaseRecord({ caseName, birthData, calculationProfile });
      record.chartFingerprint = chartFingerprint;
      const all = readAll();
      all.push(record);
      writeAll(all);
      return record;
    },

    /** Resolves to one Case by its stable caseId, or null. */
    async get(caseId) {
      return readAll().find((c) => c.caseId === caseId) ?? null;
    },

    /** Resolves to all Cases (active + archived unless `includeArchived: false`). */
    async list({ includeArchived = true } = {}) {
      const all = readAll();
      return includeArchived ? all : all.filter((c) => c.status !== CASE_STATUS.ARCHIVED);
    },

    /** Merges `patch` into the Case (caseName/birthData/calculationProfile/chartFingerprint/status), bumps updatedAt. caseId/createdAt are never mutated. Resolves to the updated record, or null if caseId doesn't exist. */
    async update(caseId, patch) {
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
    async rename(caseId, caseName) {
      return this.update(caseId, { caseName });
    },

    async archive(caseId) {
      return this.update(caseId, { status: CASE_STATUS.ARCHIVED });
    },

    async unarchive(caseId) {
      return this.update(caseId, { status: CASE_STATUS.ACTIVE });
    },
  };
}
