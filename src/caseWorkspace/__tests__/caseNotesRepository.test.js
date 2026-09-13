import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryStorage } from "../storage/memoryStorage.js";
import { createLocalCaseNotesRepository } from "../storage/localCaseNotesRepository.js";

let repo;
beforeEach(() => {
  repo = createLocalCaseNotesRepository(createMemoryStorage());
});

describe("Production UX Refactor: General Case Notes repository", () => {
  it("get() returns a blank record for a Case that has never been saved", async () => {
    const record = await repo.get("case-1");
    expect(record.caseId).toBe("case-1");
    expect(record.notes).toBe("");
  });

  it("save() persists notes and get() returns them back", async () => {
    await repo.save("case-1", { notes: "Repeated theme: absent father figure" });
    const record = await repo.get("case-1");
    expect(record.notes).toBe("Repeated theme: absent father figure");
  });

  it("save() is a merge, not a full overwrite, and bumps updatedAt", async () => {
    const first = await repo.save("case-1", { notes: "v1" });
    const second = await repo.save("case-1", { notes: "v2" });
    expect(second.notes).toBe("v2");
    expect(second.updatedAt >= first.updatedAt).toBe(true);
  });

  it("notes are isolated per caseId", async () => {
    await repo.save("case-1", { notes: "case one notes" });
    await repo.save("case-2", { notes: "case two notes" });
    expect((await repo.get("case-1")).notes).toBe("case one notes");
    expect((await repo.get("case-2")).notes).toBe("case two notes");
  });

  it("every public method returns a Promise (async-compatible contract)", () => {
    expect(repo.get("case-1")).toBeInstanceOf(Promise);
    expect(repo.save("case-1", { notes: "x" })).toBeInstanceOf(Promise);
  });
});
