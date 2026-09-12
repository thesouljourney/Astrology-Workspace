/**
 * Framework-agnostic stale-result-protected data loader — Phase 7
 * pre-lock audit fix (Part 1).
 *
 * Deliberately has no React dependency, mirroring
 * `autosaveController.js`'s own design, so "a slow previous read
 * cannot overwrite a newer selection" can be unit-tested directly
 * (fake delays, no DOM/React) - `useAsyncData` (in the UI layer) is a
 * thin React wrapper around one of these.
 *
 * Guarantee: each `load(loader)` call is stamped with a sequence
 * number. If `load()` is called again (e.g. because the user switched
 * Case/Topic before the first load resolved) before an earlier call's
 * `loader()` promise settles, that earlier call's result is discarded
 * on arrival - `onResult` is never invoked for a superseded call, no
 * matter how much later it actually resolves.
 */
export function createAsyncDataController({ onResult }) {
  let sequence = 0;

  return {
    /** Runs `loader()` (a () => Promise<T> or plain value factory). Resolves/rejects normally, but `onResult` only fires if this call is still the latest one dispatched. */
    load(loader) {
      const mySequence = ++sequence;
      return Promise.resolve()
        .then(() => loader())
        .then(
          (data) => {
            if (mySequence === sequence) onResult({ data, error: null });
            return data;
          },
          (error) => {
            if (mySequence === sequence) onResult({ data: undefined, error });
            throw error;
          },
        );
    },
  };
}
