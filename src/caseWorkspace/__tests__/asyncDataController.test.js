import { describe, it, expect, vi } from "vitest";
import { createAsyncDataController } from "../asyncDataController.js";

const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

describe("Phase 7 pre-lock audit fix: asyncDataController stale-result protection", () => {
  it("a slow previous load cannot overwrite the result of a newer load (Case-switch safety)", async () => {
    const results = [];
    const controller = createAsyncDataController({ onResult: (r) => results.push(r) });

    const slowLoad = controller.load(() => delay(50, "case-A-slow-result"));
    const fastLoad = controller.load(() => delay(5, "case-B-fast-result"));

    await Promise.all([slowLoad, fastLoad]);
    await delay(60); // let the slow one's timer actually fire too

    expect(results).toHaveLength(1);
    expect(results[0].data).toBe("case-B-fast-result");
  });

  it("Topic-switch safety: three rapid switches only ever apply the LAST one's result", async () => {
    const results = [];
    const controller = createAsyncDataController({ onResult: (r) => results.push(r) });

    controller.load(() => delay(30, "career"));
    controller.load(() => delay(20, "wealth"));
    const last = controller.load(() => delay(10, "relationship"));
    await last;
    await delay(40);

    expect(results).toHaveLength(1);
    expect(results[0].data).toBe("relationship");
  });

  it("a superseded load's rejection is also silently discarded (never surfaces a stale error over a newer success)", async () => {
    const results = [];
    const controller = createAsyncDataController({ onResult: (r) => results.push(r) });

    const staleFailing = controller.load(() => delay(30).then(() => Promise.reject(new Error("stale network error"))));
    const newerSucceeding = controller.load(() => delay(5, "fresh data"));

    await newerSucceeding;
    await staleFailing.catch(() => {}); // the rejection still propagates to its own caller...
    await delay(40);

    // ...but never overwrites the UI-facing result via onResult.
    expect(results).toHaveLength(1);
    expect(results[0].data).toBe("fresh data");
    expect(results[0].error).toBeNull();
  });

  it("a single, non-superseded load reports its own error normally", async () => {
    const onResult = vi.fn();
    const controller = createAsyncDataController({ onResult });
    const err = new Error("boom");
    await controller.load(() => Promise.reject(err)).catch(() => {});
    expect(onResult).toHaveBeenCalledWith({ data: undefined, error: err });
  });

  it("sequential (non-overlapping) loads each report correctly", async () => {
    const results = [];
    const controller = createAsyncDataController({ onResult: (r) => results.push(r) });
    await controller.load(() => Promise.resolve("first"));
    await controller.load(() => Promise.resolve("second"));
    expect(results.map((r) => r.data)).toEqual(["first", "second"]);
  });
});
