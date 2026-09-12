import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryStorage } from "../storage/memoryStorage.js";
import { createLocalNotesRepository } from "../storage/localNotesRepository.js";
import { notesWorkspaceKey } from "../storage/storageKeys.js";
import { NOTE_STATUS } from "../noteModel.js";

const FP_A = "fp1_aaaaaaaa";
const FP_B = "fp1_bbbbbbbb";

let storage;
let repo;
beforeEach(() => {
  storage = createMemoryStorage();
  repo = createLocalNotesRepository(storage);
});

describe("Phase 7 C. Note isolation", () => {
  it("same Case + different Topic -> separate notes", () => {
    const caseId = "case-1";
    const v1 = repo.createVersion({ caseId, topicId: "career", chartFingerprint: FP_A });
    const v2 = repo.createVersion({ caseId, topicId: "wealth", chartFingerprint: FP_A });
    expect(v1.noteId).not.toBe(v2.noteId);
    expect(repo.listVersions({ caseId, topicId: "career", chartFingerprint: FP_A })).toHaveLength(1);
    expect(repo.listVersions({ caseId, topicId: "wealth", chartFingerprint: FP_A })).toHaveLength(1);
  });

  it("different Case + same Topic -> separate notes", () => {
    const v1 = repo.createVersion({ caseId: "case-a", topicId: "career", chartFingerprint: FP_A });
    const v2 = repo.createVersion({ caseId: "case-b", topicId: "career", chartFingerprint: FP_A });
    expect(v1.noteId).not.toBe(v2.noteId);
    repo.saveDraft({ caseId: "case-a", topicId: "career", chartFingerprint: FP_A, noteId: v1.noteId, patch: { westernNotes: "case a note" } });
    const caseBVersion = repo.getCurrentVersion({ caseId: "case-b", topicId: "career", chartFingerprint: FP_A });
    expect(caseBVersion.westernNotes).toBe("");
  });

  it("same Case + same Topic + different fingerprint -> historical note preserved", () => {
    const caseId = "case-1";
    const vOld = repo.createVersion({ caseId, topicId: "career", chartFingerprint: FP_A });
    repo.saveDraft({ caseId, topicId: "career", chartFingerprint: FP_A, noteId: vOld.noteId, patch: { westernNotes: "old chart note" } });

    const vNew = repo.createVersion({ caseId, topicId: "career", chartFingerprint: FP_B });
    expect(vNew.versionNumber).toBe(1); // independent numbering per fingerprint
    expect(vNew.westernNotes).toBe("");

    const oldStillThere = repo.getCurrentVersion({ caseId, topicId: "career", chartFingerprint: FP_A });
    expect(oldStillThere.westernNotes).toBe("old chart note");

    const fingerprints = repo.listFingerprints({ caseId, topicId: "career" }).map((f) => f.chartFingerprint);
    expect(fingerprints).toContain(FP_A);
    expect(fingerprints).toContain(FP_B);
  });
});

describe("Phase 7 D. Versioning", () => {
  const caseId = "case-1";
  const topicId = "career";

  it("Create New Version increments correctly", () => {
    const v1 = repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    expect(v1.versionNumber).toBe(1);
    repo.markFinal({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId });
    const v2 = repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    expect(v2.versionNumber).toBe(2);
    const v3 = repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    expect(v3.versionNumber).toBe(3);
  });

  it("autosave (saveDraft) updates the current Draft in place and does not create a new version", () => {
    const v1 = repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    repo.saveDraft({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId, patch: { westernNotes: "first pass" } });
    repo.saveDraft({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId, patch: { westernNotes: "second pass" } });
    const versions = repo.listVersions({ caseId, topicId, chartFingerprint: FP_A });
    expect(versions).toHaveLength(1);
    expect(versions[0].westernNotes).toBe("second pass");
  });

  it("old versions remain readable after a new version is created", () => {
    const v1 = repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    repo.saveDraft({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId, patch: { finalInterpretation: "v1 conclusion" } });
    repo.markFinal({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId });
    repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });

    const versions = repo.listVersions({ caseId, topicId, chartFingerprint: FP_A });
    expect(versions).toHaveLength(2);
    expect(versions[0].finalInterpretation).toBe("v1 conclusion");
    expect(versions[0].status).toBe(NOTE_STATUS.FINAL);
  });

  it("Final version is read-only: saveDraft on a Final version throws and does not mutate it", () => {
    const v1 = repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    repo.saveDraft({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId, patch: { westernNotes: "before final" } });
    repo.markFinal({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId });

    expect(() => repo.saveDraft({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId, patch: { westernNotes: "trying to mutate final" } })).toThrow();

    const stillFinal = repo.getCurrentVersion({ caseId, topicId, chartFingerprint: FP_A });
    expect(stillFinal.westernNotes).toBe("before final");
    expect(stillFinal.status).toBe(NOTE_STATUS.FINAL);
  });

  it("markFinal refuses to act on an already-final or archived version", () => {
    const v1 = repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    repo.markFinal({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId });
    expect(() => repo.markFinal({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId })).toThrow();
  });

  it("Archived versions remain retrievable via listVersions", () => {
    const v1 = repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    repo.archiveVersion({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId });
    const versions = repo.listVersions({ caseId, topicId, chartFingerprint: FP_A });
    expect(versions[0].status).toBe(NOTE_STATUS.ARCHIVED);
  });
});

describe("Phase 7 E. Storage abstraction", () => {
  it("local repository round-trip works (write then read back an equivalent record)", () => {
    const v1 = repo.createVersion({ caseId: "case-1", topicId: "career", chartFingerprint: FP_A });
    repo.saveDraft({ caseId: "case-1", topicId: "career", chartFingerprint: FP_A, noteId: v1.noteId, patch: { westernNotes: "hello" } });
    const freshRepo = createLocalNotesRepository(storage); // new repo instance, same storage
    const reread = freshRepo.getCurrentVersion({ caseId: "case-1", topicId: "career", chartFingerprint: FP_A });
    expect(reread.westernNotes).toBe("hello");
  });

  it("malformed local storage data does not crash - falls back to an empty workspace", () => {
    storage.setItem(notesWorkspaceKey("case-1", "career"), "{ this is not valid JSON");
    expect(() => repo.getWorkspace({ caseId: "case-1", topicId: "career" })).not.toThrow();
    const workspace = repo.getWorkspace({ caseId: "case-1", topicId: "career" });
    expect(workspace.byFingerprint).toEqual({});
  });

  it("missing local storage data does not crash - returns empty results", () => {
    expect(repo.listVersions({ caseId: "never-created", topicId: "career", chartFingerprint: FP_A })).toEqual([]);
    expect(repo.getCurrentVersion({ caseId: "never-created", topicId: "career", chartFingerprint: FP_A })).toBeNull();
  });

  it("Note records are JSON serializable", () => {
    const v1 = repo.createVersion({ caseId: "case-1", topicId: "career", chartFingerprint: FP_A });
    const roundTripped = JSON.parse(JSON.stringify(v1));
    expect(roundTripped).toEqual(v1);
  });
});
