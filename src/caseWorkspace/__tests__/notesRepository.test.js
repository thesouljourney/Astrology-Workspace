import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryStorage } from "../storage/memoryStorage.js";
import { createLocalNotesRepository } from "../storage/localNotesRepository.js";
import { notesWorkspaceKey } from "../storage/storageKeys.js";
import { NOTE_STATUS } from "../noteModel.js";

const FP_A = "fp2_aaaaaaaa";
const FP_B = "fp2_bbbbbbbb";

let storage;
let repo;
beforeEach(() => {
  storage = createMemoryStorage();
  repo = createLocalNotesRepository(storage);
});

describe("Phase 7 C. Note isolation", () => {
  it("same Case + different Topic -> separate notes", async () => {
    const caseId = "case-1";
    const v1 = await repo.createVersion({ caseId, topicId: "career", chartFingerprint: FP_A });
    const v2 = await repo.createVersion({ caseId, topicId: "wealth", chartFingerprint: FP_A });
    expect(v1.noteId).not.toBe(v2.noteId);
    expect(await repo.listVersions({ caseId, topicId: "career", chartFingerprint: FP_A })).toHaveLength(1);
    expect(await repo.listVersions({ caseId, topicId: "wealth", chartFingerprint: FP_A })).toHaveLength(1);
  });

  it("different Case + same Topic -> separate notes", async () => {
    const v1 = await repo.createVersion({ caseId: "case-a", topicId: "career", chartFingerprint: FP_A });
    const v2 = await repo.createVersion({ caseId: "case-b", topicId: "career", chartFingerprint: FP_A });
    expect(v1.noteId).not.toBe(v2.noteId);
    await repo.saveDraft({ caseId: "case-a", topicId: "career", chartFingerprint: FP_A, noteId: v1.noteId, patch: { westernNotes: "case a note" } });
    const caseBVersion = await repo.getCurrentVersion({ caseId: "case-b", topicId: "career", chartFingerprint: FP_A });
    expect(caseBVersion.westernNotes).toBe("");
  });

  it("same Case + same Topic + different fingerprint -> historical note preserved", async () => {
    const caseId = "case-1";
    const vOld = await repo.createVersion({ caseId, topicId: "career", chartFingerprint: FP_A });
    await repo.saveDraft({ caseId, topicId: "career", chartFingerprint: FP_A, noteId: vOld.noteId, patch: { westernNotes: "old chart note" } });

    const vNew = await repo.createVersion({ caseId, topicId: "career", chartFingerprint: FP_B });
    expect(vNew.versionNumber).toBe(1); // independent numbering per fingerprint
    expect(vNew.westernNotes).toBe("");

    const oldStillThere = await repo.getCurrentVersion({ caseId, topicId: "career", chartFingerprint: FP_A });
    expect(oldStillThere.westernNotes).toBe("old chart note");

    const fingerprints = (await repo.listFingerprints({ caseId, topicId: "career" })).map((f) => f.chartFingerprint);
    expect(fingerprints).toContain(FP_A);
    expect(fingerprints).toContain(FP_B);
  });
});

describe("Phase 7 D. Versioning", () => {
  const caseId = "case-1";
  const topicId = "career";

  it("Create New Version increments correctly", async () => {
    const v1 = await repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    expect(v1.versionNumber).toBe(1);
    await repo.markFinal({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId });
    const v2 = await repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    expect(v2.versionNumber).toBe(2);
    const v3 = await repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    expect(v3.versionNumber).toBe(3);
  });

  it("autosave (saveDraft) updates the current Draft in place and does not create a new version", async () => {
    const v1 = await repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    await repo.saveDraft({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId, patch: { westernNotes: "first pass" } });
    await repo.saveDraft({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId, patch: { westernNotes: "second pass" } });
    const versions = await repo.listVersions({ caseId, topicId, chartFingerprint: FP_A });
    expect(versions).toHaveLength(1);
    expect(versions[0].westernNotes).toBe("second pass");
  });

  it("old versions remain readable after a new version is created", async () => {
    const v1 = await repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    await repo.saveDraft({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId, patch: { finalInterpretation: "v1 conclusion" } });
    await repo.markFinal({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId });
    await repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });

    const versions = await repo.listVersions({ caseId, topicId, chartFingerprint: FP_A });
    expect(versions).toHaveLength(2);
    expect(versions[0].finalInterpretation).toBe("v1 conclusion");
    expect(versions[0].status).toBe(NOTE_STATUS.FINAL);
  });

  it("Final version is read-only: saveDraft on a Final version throws and does not mutate it", async () => {
    const v1 = await repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    await repo.saveDraft({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId, patch: { westernNotes: "before final" } });
    await repo.markFinal({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId });

    await expect(repo.saveDraft({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId, patch: { westernNotes: "trying to mutate final" } })).rejects.toThrow();

    const stillFinal = await repo.getCurrentVersion({ caseId, topicId, chartFingerprint: FP_A });
    expect(stillFinal.westernNotes).toBe("before final");
    expect(stillFinal.status).toBe(NOTE_STATUS.FINAL);
  });

  it("markFinal refuses to act on an already-final or archived version", async () => {
    const v1 = await repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    await repo.markFinal({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId });
    await expect(repo.markFinal({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId })).rejects.toThrow();
  });

  it("Archived versions remain retrievable via listVersions", async () => {
    const v1 = await repo.createVersion({ caseId, topicId, chartFingerprint: FP_A });
    await repo.archiveVersion({ caseId, topicId, chartFingerprint: FP_A, noteId: v1.noteId });
    const versions = await repo.listVersions({ caseId, topicId, chartFingerprint: FP_A });
    expect(versions[0].status).toBe(NOTE_STATUS.ARCHIVED);
  });
});

describe("Phase 7 E. Storage abstraction", () => {
  it("local repository round-trip works (write then read back an equivalent record)", async () => {
    const v1 = await repo.createVersion({ caseId: "case-1", topicId: "career", chartFingerprint: FP_A });
    await repo.saveDraft({ caseId: "case-1", topicId: "career", chartFingerprint: FP_A, noteId: v1.noteId, patch: { westernNotes: "hello" } });
    const freshRepo = createLocalNotesRepository(storage); // new repo instance, same storage
    const reread = await freshRepo.getCurrentVersion({ caseId: "case-1", topicId: "career", chartFingerprint: FP_A });
    expect(reread.westernNotes).toBe("hello");
  });

  it("malformed local storage data does not crash - the promise resolves (never rejects) with a fallback empty workspace", async () => {
    storage.setItem(notesWorkspaceKey("case-1", "career"), "{ this is not valid JSON");
    const workspace = await repo.getWorkspace({ caseId: "case-1", topicId: "career" });
    expect(workspace.byFingerprint).toEqual({});
  });

  it("missing local storage data does not crash - returns empty results", async () => {
    expect(await repo.listVersions({ caseId: "never-created", topicId: "career", chartFingerprint: FP_A })).toEqual([]);
    expect(await repo.getCurrentVersion({ caseId: "never-created", topicId: "career", chartFingerprint: FP_A })).toBeNull();
  });

  it("Note records are JSON serializable", async () => {
    const v1 = await repo.createVersion({ caseId: "case-1", topicId: "career", chartFingerprint: FP_A });
    const roundTripped = JSON.parse(JSON.stringify(v1));
    expect(roundTripped).toEqual(v1);
  });
});

describe("Phase 7 pre-lock audit fix: notesRepository public contract is Promise-returning", () => {
  it("every public method returns a genuine thenable (Promise), never a resolved value directly", async () => {
    const createdPromise = repo.createVersion({ caseId: "case-1", topicId: "career", chartFingerprint: FP_A });
    expect(typeof createdPromise.then).toBe("function");
    const created = await createdPromise;

    expect(typeof repo.getWorkspace({ caseId: "case-1", topicId: "career" }).then).toBe("function");
    expect(typeof repo.listFingerprints({ caseId: "case-1", topicId: "career" }).then).toBe("function");
    expect(typeof repo.listVersions({ caseId: "case-1", topicId: "career", chartFingerprint: FP_A }).then).toBe("function");
    expect(typeof repo.getCurrentVersion({ caseId: "case-1", topicId: "career", chartFingerprint: FP_A }).then).toBe("function");
    expect(typeof repo.saveDraft({ caseId: "case-1", topicId: "career", chartFingerprint: FP_A, noteId: created.noteId, patch: {} }).then).toBe("function");

    const v2 = await repo.createVersion({ caseId: "case-1", topicId: "career2", chartFingerprint: FP_A });
    expect(typeof repo.markFinal({ caseId: "case-1", topicId: "career2", chartFingerprint: FP_A, noteId: v2.noteId }).then).toBe("function");

    const v3 = await repo.createVersion({ caseId: "case-1", topicId: "career3", chartFingerprint: FP_A });
    expect(typeof repo.archiveVersion({ caseId: "case-1", topicId: "career3", chartFingerprint: FP_A, noteId: v3.noteId }).then).toBe("function");
  });
});
