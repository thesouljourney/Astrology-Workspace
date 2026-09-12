import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryStorage } from "../storage/memoryStorage.js";
import { createLocalCaseRepository } from "../storage/localCaseRepository.js";
import { CASE_STATUS } from "../caseModel.js";

const birthData = { date: "1994-11-21", time: "01:44:00", placeName: "Batu Pahat", latitude: 1.8548, longitude: 102.9325, timezone: "+08:00" };
const calculationProfile = { westernZodiac: "tropical", westernHouseSystem: "placidus", westernNodeType: "true", westernLilithType: "mean" };

let repo;
beforeEach(() => {
  repo = createLocalCaseRepository(createMemoryStorage());
});

describe("Phase 7 A. Case identity", () => {
  it("caseId is stable after rename", async () => {
    const created = await repo.create({ caseName: "Alice", birthData, calculationProfile });
    const renamed = await repo.rename(created.caseId, "Alice Renamed");
    expect(renamed.caseId).toBe(created.caseId);
    expect(renamed.caseName).toBe("Alice Renamed");
  });

  it("two Cases never share identity even with the same name", async () => {
    const a = await repo.create({ caseName: "Same Name", birthData, calculationProfile });
    const b = await repo.create({ caseName: "Same Name", birthData, calculationProfile });
    expect(a.caseId).not.toBe(b.caseId);
  });

  it("archived Case remains retrievable", async () => {
    const created = await repo.create({ caseName: "Archive Me", birthData, calculationProfile });
    await repo.archive(created.caseId);
    const fetched = await repo.get(created.caseId);
    expect(fetched.status).toBe(CASE_STATUS.ARCHIVED);
    const all = await repo.list({ includeArchived: true });
    expect(all.some((c) => c.caseId === created.caseId)).toBe(true);
  });

  it("list({includeArchived:false}) excludes archived Cases", async () => {
    const a = await repo.create({ caseName: "Active", birthData, calculationProfile });
    const b = await repo.create({ caseName: "Will Archive", birthData, calculationProfile });
    await repo.archive(b.caseId);
    const activeOnly = await repo.list({ includeArchived: false });
    expect(activeOnly.map((c) => c.caseId)).toContain(a.caseId);
    expect(activeOnly.map((c) => c.caseId)).not.toContain(b.caseId);
  });

  it("Case serialization round-trips through JSON", async () => {
    const created = await repo.create({ caseName: "Serialize Me", birthData, calculationProfile });
    const roundTripped = JSON.parse(JSON.stringify(created));
    expect(roundTripped).toEqual(created);
  });

  it("update() never allows caseId or createdAt to be overwritten", async () => {
    const created = await repo.create({ caseName: "Immutable Fields", birthData, calculationProfile });
    const updated = await repo.update(created.caseId, { caseId: "hacked", createdAt: "hacked", caseName: "New Name" });
    expect(updated.caseId).toBe(created.caseId);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.caseName).toBe("New Name");
  });

  it("unarchive restores active status", async () => {
    const created = await repo.create({ caseName: "Round Trip Archive", birthData, calculationProfile });
    await repo.archive(created.caseId);
    await repo.unarchive(created.caseId);
    const fetched = await repo.get(created.caseId);
    expect(fetched.status).toBe(CASE_STATUS.ACTIVE);
  });
});

describe("Phase 7 pre-lock audit fix: caseRepository public contract is Promise-returning", () => {
  it("every public method returns a genuine thenable (Promise), never a resolved value directly", async () => {
    const createdPromise = repo.create({ caseName: "Promise Check", birthData, calculationProfile });
    expect(typeof createdPromise.then).toBe("function");
    const created = await createdPromise;

    expect(typeof repo.get(created.caseId).then).toBe("function");
    expect(typeof repo.list().then).toBe("function");
    expect(typeof repo.update(created.caseId, { caseName: "x" }).then).toBe("function");
    expect(typeof repo.rename(created.caseId, "y").then).toBe("function");
    expect(typeof repo.archive(created.caseId).then).toBe("function");
    expect(typeof repo.unarchive(created.caseId).then).toBe("function");
  });
});
