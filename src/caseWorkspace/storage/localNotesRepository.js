/**
 * Local (localStorage-or-memory) implementation of the `notesRepository`
 * contract - Phase 7.
 *
 * Storage shape, one record per (caseId, topicId) pair, under
 * `notesWorkspaceKey(caseId, topicId)`:
 *
 *   {
 *     caseId, topicId,
 *     byFingerprint: {
 *       "<chartFingerprint>": { chartFingerprint, versions: [NoteVersion, ...] },
 *       ...
 *     },
 *   }
 *
 * Grouping by fingerprint first is what makes "this interpretation was
 * written for an earlier chart version" (brief Part 16) a plain lookup:
 * a fingerprint the Case's CURRENT chart no longer produces is, by
 * definition, historical - nothing is ever deleted or silently
 * migrated to the new fingerprint.
 *
 * Every note version's own `chartFingerprint` field (see `noteModel.js`)
 * is redundant with its position in this map by construction, kept only
 * because the Topic Note schema (brief Part 17) declares it on the
 * version itself - both are always written together and never drift.
 *
 * Every public method below is declared `async` and therefore ALWAYS
 * returns a Promise, even though the work inside it is synchronous -
 * the PUBLIC CONTRACT is async-compatible so a future
 * `SupabaseNotesRepository` can implement the exact same method names
 * against remote tables, and so no UI consumer is ever written against
 * an assumption a network-backed implementation could not honor.
 */

import { getDefaultStorage } from "./memoryStorage.js";
import { readJson, writeJson } from "./jsonStore.js";
import { notesWorkspaceKey } from "./storageKeys.js";
import { createNoteVersion, NOTE_STATUS } from "../noteModel.js";

const NOTE_PATCHABLE_FIELDS = ["westernNotes", "classicalNotes", "vedicNotes", "convergenceNotes", "differencesNotes", "uncertainNotes", "finalInterpretation", "evidenceReliedOn"];

function emptyWorkspace(caseId, topicId) {
  return { caseId, topicId, byFingerprint: {} };
}

/** @param {object} [storage] a Web Storage-compatible adapter; defaults to localStorage-or-memory. */
export function createLocalNotesRepository(storage = getDefaultStorage()) {
  const readWorkspace = (caseId, topicId) => readJson(storage, notesWorkspaceKey(caseId, topicId), emptyWorkspace(caseId, topicId));
  const writeWorkspace = (caseId, topicId, workspace) => writeJson(storage, notesWorkspaceKey(caseId, topicId), workspace);

  function findVersion(workspace, chartFingerprint, noteId) {
    const group = workspace.byFingerprint[chartFingerprint];
    if (!group) return { group: null, version: null, index: -1 };
    const index = group.versions.findIndex((v) => v.noteId === noteId);
    return { group, version: index === -1 ? null : group.versions[index], index };
  }

  return {
    /** The full raw workspace for one (caseId, topicId) pair - every chartFingerprint that has ever had notes, and every version within each. */
    async getWorkspace({ caseId, topicId }) {
      return readWorkspace(caseId, topicId);
    },

    /** Every chartFingerprint that has notes for this (caseId, topicId), most-recently-touched first. */
    async listFingerprints({ caseId, topicId }) {
      const workspace = readWorkspace(caseId, topicId);
      return Object.values(workspace.byFingerprint)
        .map((group) => ({
          chartFingerprint: group.chartFingerprint,
          lastUpdatedAt: group.versions.reduce((max, v) => (v.updatedAt > max ? v.updatedAt : max), ""),
        }))
        .sort((a, b) => (a.lastUpdatedAt < b.lastUpdatedAt ? 1 : -1));
    },

    /** All versions for one specific chartFingerprint, sorted by versionNumber ascending. Empty array if none exist yet. */
    async listVersions({ caseId, topicId, chartFingerprint }) {
      const workspace = readWorkspace(caseId, topicId);
      const group = workspace.byFingerprint[chartFingerprint];
      return group ? [...group.versions].sort((a, b) => a.versionNumber - b.versionNumber) : [];
    },

    /** The version with the highest versionNumber for this fingerprint (draft/final/archived alike), or null if this fingerprint has no notes yet. */
    async getCurrentVersion({ caseId, topicId, chartFingerprint }) {
      const versions = await this.listVersions({ caseId, topicId, chartFingerprint });
      return versions.length > 0 ? versions[versions.length - 1] : null;
    },

    /** Creates a new blank Draft version for this fingerprint - versionNumber = (max existing for this fingerprint) + 1, or 1 if none exist. Never triggered by autosave; only by an explicit user action or a changed fingerprint. */
    async createVersion({ caseId, topicId, chartFingerprint }) {
      const workspace = readWorkspace(caseId, topicId);
      const group = workspace.byFingerprint[chartFingerprint] ?? { chartFingerprint, versions: [] };
      const nextVersionNumber = group.versions.reduce((max, v) => Math.max(max, v.versionNumber), 0) + 1;
      const version = createNoteVersion({ caseId, topicId, chartFingerprint, versionNumber: nextVersionNumber });
      group.versions = [...group.versions, version];
      workspace.byFingerprint[chartFingerprint] = group;
      writeWorkspace(caseId, topicId, workspace);
      return version;
    },

    /**
     * Autosave entry point: merges `patch` (only the human-editable note
     * fields) into an existing Draft version in place. Never creates a
     * new version. Throws if the target version does not exist or is
     * not a Draft (brief Part 18's "Final is read-only by default"
     * policy is enforced here, not just in the UI, so no caller can
     * bypass it).
     */
    async saveDraft({ caseId, topicId, chartFingerprint, noteId, patch }) {
      const workspace = readWorkspace(caseId, topicId);
      const { group, version, index } = findVersion(workspace, chartFingerprint, noteId);
      if (!version) throw new Error(`saveDraft: no note version ${noteId} found for ${caseId}/${topicId}/${chartFingerprint}`);
      if (version.status !== NOTE_STATUS.DRAFT) throw new Error(`saveDraft: version ${noteId} is "${version.status}", not "draft" - create a new version to keep editing`);

      const allowedPatch = {};
      for (const field of NOTE_PATCHABLE_FIELDS) {
        if (field in patch) allowedPatch[field] = patch[field];
      }
      const updated = { ...version, ...allowedPatch, updatedAt: new Date().toISOString() };
      group.versions[index] = updated;
      writeWorkspace(caseId, topicId, workspace);
      return updated;
    },

    /** Draft -> Final. Refuses to act on anything that isn't currently a Draft. */
    async markFinal({ caseId, topicId, chartFingerprint, noteId }) {
      const workspace = readWorkspace(caseId, topicId);
      const { group, version, index } = findVersion(workspace, chartFingerprint, noteId);
      if (!version) throw new Error(`markFinal: no note version ${noteId} found for ${caseId}/${topicId}/${chartFingerprint}`);
      if (version.status !== NOTE_STATUS.DRAFT) throw new Error(`markFinal: version ${noteId} is already "${version.status}"`);
      const updated = { ...version, status: NOTE_STATUS.FINAL, updatedAt: new Date().toISOString() };
      group.versions[index] = updated;
      writeWorkspace(caseId, topicId, workspace);
      return updated;
    },

    /** Draft or Final -> Archived. Content is preserved and remains readable via listVersions/getCurrentVersion; only its status changes. */
    async archiveVersion({ caseId, topicId, chartFingerprint, noteId }) {
      const workspace = readWorkspace(caseId, topicId);
      const { group, version, index } = findVersion(workspace, chartFingerprint, noteId);
      if (!version) throw new Error(`archiveVersion: no note version ${noteId} found for ${caseId}/${topicId}/${chartFingerprint}`);
      const updated = { ...version, status: NOTE_STATUS.ARCHIVED, updatedAt: new Date().toISOString() };
      group.versions[index] = updated;
      writeWorkspace(caseId, topicId, workspace);
      return updated;
    },
  };
}
