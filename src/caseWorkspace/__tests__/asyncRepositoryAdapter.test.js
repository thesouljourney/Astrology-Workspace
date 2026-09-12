import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryStorage } from "../storage/memoryStorage.js";
import { createLocalCaseRepository } from "../storage/localCaseRepository.js";
import { createLocalNotesRepository } from "../storage/localNotesRepository.js";
import { CASE_STATUS } from "../caseModel.js";
import { NOTE_STATUS } from "../noteModel.js";

/**
 * Wraps a repository so every public method resolves after a real
 * artificial delay - proving the Phase 7 pre-lock audit fix (Part 1)
 * against something that behaves like a genuinely latent, network-
 * backed repository, not just the local implementation's own
 * (accidentally instant) Promise resolution.
 */
function withDelay(repo, ms = 15) {
  const wrapped = {};
  for (const key of Object.keys(repo)) {
    wrapped[key] = (...args) => new Promise((resolve, reject) => setTimeout(() => repo[key](...args).then(resolve, reject), ms));
  }
  return wrapped;
}

const birthData = { date: "1994-11-21", time: "01:44:00", placeName: "Batu Pahat", latitude: 1.8548, longitude: 102.9325, timezone: "+08:00" };
const calculationProfile = { westernZodiac: "tropical", westernHouseSystem: "placidus", westernNodeType: "true", westernLilithType: "mean" };
const FP = "fp2_delayed_test";

let caseRepo;
let notesRepo;
beforeEach(() => {
  caseRepo = withDelay(createLocalCaseRepository(createMemoryStorage()));
  notesRepo = withDelay(createLocalNotesRepository(createMemoryStorage()));
});

describe("Phase 7 pre-lock audit fix: repository contract survives real async latency", () => {
  it("Case list loads asynchronously and reflects a prior awaited create", async () => {
    await caseRepo.create({ caseName: "Delayed Case", birthData, calculationProfile });
    const list = await caseRepo.list();
    expect(list.some((c) => c.caseName === "Delayed Case")).toBe(true);
  });

  it("Case open (get) works asynchronously after an awaited create", async () => {
    const created = await caseRepo.create({ caseName: "Open Me", birthData, calculationProfile });
    const fetched = await caseRepo.get(created.caseId);
    expect(fetched.caseId).toBe(created.caseId);
  });

  it("create/rename/archive/unarchive are all properly awaited and observable in order", async () => {
    const created = await caseRepo.create({ caseName: "Lifecycle", birthData, calculationProfile });
    await caseRepo.rename(created.caseId, "Renamed");
    await caseRepo.archive(created.caseId);
    let fetched = await caseRepo.get(created.caseId);
    expect(fetched.caseName).toBe("Renamed");
    expect(fetched.status).toBe(CASE_STATUS.ARCHIVED);
    await caseRepo.unarchive(created.caseId);
    fetched = await caseRepo.get(created.caseId);
    expect(fetched.status).toBe(CASE_STATUS.ACTIVE);
  });

  it("note version list loads asynchronously", async () => {
    await notesRepo.createVersion({ caseId: "c1", topicId: "career", chartFingerprint: FP });
    const versions = await notesRepo.listVersions({ caseId: "c1", topicId: "career", chartFingerprint: FP });
    expect(versions).toHaveLength(1);
  });

  it("createVersion's result is safely awaited before noteId is consumed", async () => {
    const created = await notesRepo.createVersion({ caseId: "c1", topicId: "career", chartFingerprint: FP });
    expect(typeof created.noteId).toBe("string");
    // Using created.noteId immediately (not a Promise) proves the await already resolved it.
    await notesRepo.saveDraft({ caseId: "c1", topicId: "career", chartFingerprint: FP, noteId: created.noteId, patch: { westernNotes: "ok" } });
    const version = await notesRepo.getCurrentVersion({ caseId: "c1", topicId: "career", chartFingerprint: FP });
    expect(version.westernNotes).toBe("ok");
  });

  it("markFinal completes before a subsequent refresh-read observes the new status", async () => {
    const created = await notesRepo.createVersion({ caseId: "c1", topicId: "career", chartFingerprint: FP });
    await notesRepo.markFinal({ caseId: "c1", topicId: "career", chartFingerprint: FP, noteId: created.noteId });
    const version = await notesRepo.getCurrentVersion({ caseId: "c1", topicId: "career", chartFingerprint: FP });
    expect(version.status).toBe(NOTE_STATUS.FINAL);
  });

  it("archiveVersion completes before a subsequent refresh-read observes the new status", async () => {
    const created = await notesRepo.createVersion({ caseId: "c1", topicId: "career", chartFingerprint: FP });
    await notesRepo.archiveVersion({ caseId: "c1", topicId: "career", chartFingerprint: FP, noteId: created.noteId });
    const version = await notesRepo.getCurrentVersion({ caseId: "c1", topicId: "career", chartFingerprint: FP });
    expect(version.status).toBe(NOTE_STATUS.ARCHIVED);
  });

  it("concurrent delayed writes to different Cases never cross-contaminate", async () => {
    const [a, b] = await Promise.all([caseRepo.create({ caseName: "A", birthData, calculationProfile }), caseRepo.create({ caseName: "B", birthData, calculationProfile })]);
    expect(a.caseId).not.toBe(b.caseId);
    await Promise.all([caseRepo.rename(a.caseId, "A-renamed"), caseRepo.rename(b.caseId, "B-renamed")]);
    const [fetchedA, fetchedB] = await Promise.all([caseRepo.get(a.caseId), caseRepo.get(b.caseId)]);
    expect(fetchedA.caseName).toBe("A-renamed");
    expect(fetchedB.caseName).toBe("B-renamed");
  });
});
