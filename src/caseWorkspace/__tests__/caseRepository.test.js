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
  it("caseId is stable after rename", () => {
    const created = repo.create({ caseName: "Alice", birthData, calculationProfile });
    const renamed = repo.rename(created.caseId, "Alice Renamed");
    expect(renamed.caseId).toBe(created.caseId);
    expect(renamed.caseName).toBe("Alice Renamed");
  });

  it("two Cases never share identity even with the same name", () => {
    const a = repo.create({ caseName: "Same Name", birthData, calculationProfile });
    const b = repo.create({ caseName: "Same Name", birthData, calculationProfile });
    expect(a.caseId).not.toBe(b.caseId);
  });

  it("archived Case remains retrievable", () => {
    const created = repo.create({ caseName: "Archive Me", birthData, calculationProfile });
    repo.archive(created.caseId);
    const fetched = repo.get(created.caseId);
    expect(fetched.status).toBe(CASE_STATUS.ARCHIVED);
    expect(repo.list({ includeArchived: true }).some((c) => c.caseId === created.caseId)).toBe(true);
  });

  it("list({includeArchived:false}) excludes archived Cases", () => {
    const a = repo.create({ caseName: "Active", birthData, calculationProfile });
    const b = repo.create({ caseName: "Will Archive", birthData, calculationProfile });
    repo.archive(b.caseId);
    const activeOnly = repo.list({ includeArchived: false });
    expect(activeOnly.map((c) => c.caseId)).toContain(a.caseId);
    expect(activeOnly.map((c) => c.caseId)).not.toContain(b.caseId);
  });

  it("Case serialization round-trips through JSON", () => {
    const created = repo.create({ caseName: "Serialize Me", birthData, calculationProfile });
    const roundTripped = JSON.parse(JSON.stringify(created));
    expect(roundTripped).toEqual(created);
  });

  it("update() never allows caseId or createdAt to be overwritten", () => {
    const created = repo.create({ caseName: "Immutable Fields", birthData, calculationProfile });
    const updated = repo.update(created.caseId, { caseId: "hacked", createdAt: "hacked", caseName: "New Name" });
    expect(updated.caseId).toBe(created.caseId);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.caseName).toBe("New Name");
  });

  it("unarchive restores active status", () => {
    const created = repo.create({ caseName: "Round Trip Archive", birthData, calculationProfile });
    repo.archive(created.caseId);
    repo.unarchive(created.caseId);
    expect(repo.get(created.caseId).status).toBe(CASE_STATUS.ACTIVE);
  });
});
