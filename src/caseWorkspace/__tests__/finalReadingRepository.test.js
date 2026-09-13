import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryStorage } from "../storage/memoryStorage.js";
import { createLocalFinalReadingRepository } from "../storage/localFinalReadingRepository.js";

let repo;
beforeEach(() => {
  repo = createLocalFinalReadingRepository(createMemoryStorage());
});

describe("Production UX Refactor: Final Reading repository", () => {
  it("get() returns a blank record for a Case that has never been saved", async () => {
    const record = await repo.get("case-1");
    expect(record.caseId).toBe("case-1");
    expect(record.overallImpression).toBe("");
    expect(record.repeatedThemes).toBe("");
    expect(record.crossSystemConvergence).toBe("");
    expect(record.crossSystemDifferences).toBe("");
    expect(record.finalSynthesis).toBe("");
  });

  it("save() merges only recognized fields and persists them", async () => {
    await repo.save("case-1", { overallImpression: "Strong Saturn-Sun themes", finalSynthesis: "A grounded, dutiful nature", notThisField: "ignored" });
    const record = await repo.get("case-1");
    expect(record.overallImpression).toBe("Strong Saturn-Sun themes");
    expect(record.finalSynthesis).toBe("A grounded, dutiful nature");
    expect(record.notThisField).toBeUndefined();
  });

  it("save() is a partial merge across multiple calls", async () => {
    await repo.save("case-1", { overallImpression: "first" });
    await repo.save("case-1", { repeatedThemes: "second" });
    const record = await repo.get("case-1");
    expect(record.overallImpression).toBe("first");
    expect(record.repeatedThemes).toBe("second");
  });

  it("Final Reading is isolated per caseId", async () => {
    await repo.save("case-1", { finalSynthesis: "case one" });
    await repo.save("case-2", { finalSynthesis: "case two" });
    expect((await repo.get("case-1")).finalSynthesis).toBe("case one");
    expect((await repo.get("case-2")).finalSynthesis).toBe("case two");
  });

  it("every public method returns a Promise (async-compatible contract)", () => {
    expect(repo.get("case-1")).toBeInstanceOf(Promise);
    expect(repo.save("case-1", {})).toBeInstanceOf(Promise);
  });
});
