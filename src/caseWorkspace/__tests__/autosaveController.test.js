import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAutosaveController, AUTOSAVE_STATUS } from "../autosaveController.js";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("Phase 7 F. Autosave", () => {
  it("debounces: many rapid notifyChange calls result in exactly one save", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const controller = createAutosaveController({ save, delayMs: 1500 });

    controller.notifyChange("a");
    vi.advanceTimersByTime(500);
    controller.notifyChange("ab");
    vi.advanceTimersByTime(500);
    controller.notifyChange("abc");
    vi.advanceTimersByTime(1500);
    await vi.runAllTimersAsync();

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("abc"); // latest edit wins
  });

  it("does not save on every keystroke", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const controller = createAutosaveController({ save, delayMs: 1500 });
    for (let i = 0; i < 10; i++) {
      controller.notifyChange(`keystroke-${i}`);
      vi.advanceTimersByTime(100); // well under the debounce window each time
    }
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1500);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("flush() cancels the pending timer and saves immediately with the latest payload", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const controller = createAutosaveController({ save, delayMs: 1500 });
    controller.notifyChange("draft text");
    await controller.flush();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("draft text");
    // the debounce timer must have been cancelled - advancing time triggers no second save
    await vi.advanceTimersByTimeAsync(2000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("flush() is a no-op when there is nothing pending", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const controller = createAutosaveController({ save, delayMs: 1500 });
    await controller.flush();
    expect(save).not.toHaveBeenCalled();
  });

  it("a stale, slow save cannot overwrite the status set by a newer save (latest-wins guard)", async () => {
    let resolveFirst;
    const firstSave = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const save = vi.fn().mockImplementationOnce(() => firstSave).mockImplementationOnce(() => Promise.resolve());
    const statuses = [];
    const controller = createAutosaveController({ save, delayMs: 100, onStatusChange: (s) => statuses.push(s) });

    controller.notifyChange("first");
    await vi.advanceTimersByTimeAsync(100); // dispatches the first (slow) save
    controller.notifyChange("second");
    await vi.advanceTimersByTimeAsync(100); // dispatches the second (fast) save, which resolves before the first
    // second save's SAVED status should already be recorded
    expect(statuses.filter((s) => s === AUTOSAVE_STATUS.SAVED)).toHaveLength(1);

    resolveFirst(); // the stale first save now resolves
    await Promise.resolve();
    await Promise.resolve();
    // its resolution must not add a second SAVED status flip after being superseded
    expect(statuses.filter((s) => s === AUTOSAVE_STATUS.SAVED)).toHaveLength(1);
  });

  it("cancel() discards a pending change without saving", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const controller = createAutosaveController({ save, delayMs: 1500 });
    controller.notifyChange("discard me");
    controller.cancel();
    await vi.advanceTimersByTimeAsync(2000);
    expect(save).not.toHaveBeenCalled();
  });

  it("reports UNSAVED then SAVING then SAVED status transitions", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const statuses = [];
    const controller = createAutosaveController({ save, delayMs: 1000, onStatusChange: (s) => statuses.push(s) });
    controller.notifyChange("x");
    expect(statuses).toEqual([AUTOSAVE_STATUS.UNSAVED]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(statuses).toEqual([AUTOSAVE_STATUS.UNSAVED, AUTOSAVE_STATUS.SAVING, AUTOSAVE_STATUS.SAVED]);
  });

  it("reports ERROR status when save rejects", async () => {
    const save = vi.fn().mockRejectedValue(new Error("boom"));
    const statuses = [];
    const controller = createAutosaveController({ save, delayMs: 500, onStatusChange: (s) => statuses.push(s) });
    controller.notifyChange("x");
    await vi.advanceTimersByTimeAsync(500);
    expect(statuses).toContain(AUTOSAVE_STATUS.ERROR);
  });
});
