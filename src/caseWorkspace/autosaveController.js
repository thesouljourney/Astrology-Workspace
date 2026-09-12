/**
 * Framework-agnostic debounced-autosave controller — Phase 7.
 *
 * Deliberately has no React dependency so its debounce/flush/latest-
 * wins/cross-write-prevention behavior can be unit-tested directly
 * (fake timers, no DOM) - `useAutosave` (in the UI layer) is a thin
 * React wrapper around one of these per editable note.
 *
 * Guarantees:
 *   - `notifyChange()` resets the debounce timer; only the LAST payload
 *     within a quiet period is ever persisted (never one save per
 *     keystroke).
 *   - `flush()` cancels any pending timer and saves immediately - call
 *     this when switching Case/Topic/note version, or on unmount, so a
 *     stale delayed write can never land after the context has moved on
 *     and no in-progress edit is silently dropped.
 *   - A sequence counter ignores a slow, now-superseded save's result:
 *     if save #1 is still in flight when save #2 is dispatched (e.g. a
 *     future async/network-backed repository), only save #2's outcome
 *     is allowed to set the reported status - "latest edit wins".
 */

export const AUTOSAVE_STATUS = { IDLE: "idle", UNSAVED: "unsaved", SAVING: "saving", SAVED: "saved", ERROR: "error" };

/**
 * @param {object} params
 * @param {(payload: any) => Promise<any> | any} params.save
 * @param {number} [params.delayMs=1500]
 * @param {(status: string) => void} [params.onStatusChange]
 */
export function createAutosaveController({ save, delayMs = 1500, onStatusChange = () => {} }) {
  let timer = null;
  let pendingPayload = null;
  let hasPending = false;
  let sequence = 0;
  let status = AUTOSAVE_STATUS.IDLE;

  function setStatus(next) {
    status = next;
    onStatusChange(status);
  }

  async function runSave(payload) {
    const mySequence = ++sequence;
    setStatus(AUTOSAVE_STATUS.SAVING);
    try {
      await save(payload);
      if (mySequence === sequence) setStatus(AUTOSAVE_STATUS.SAVED);
    } catch (err) {
      if (mySequence === sequence) setStatus(AUTOSAVE_STATUS.ERROR);
      throw err;
    }
  }

  return {
    /** Call on every edit. Resets the debounce window; does not save immediately. */
    notifyChange(payload) {
      pendingPayload = payload;
      hasPending = true;
      setStatus(AUTOSAVE_STATUS.UNSAVED);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        const toSave = pendingPayload;
        hasPending = false;
        runSave(toSave).catch(() => {});
      }, delayMs);
    },

    /** Cancels any pending debounce timer and saves immediately if there was unsaved content. Call before switching Case/Topic/note version, or on unmount. */
    async flush() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (!hasPending) return;
      const toSave = pendingPayload;
      hasPending = false;
      await runSave(toSave);
    },

    /** Cancels any pending debounce timer WITHOUT saving - used only when the pending edit should be explicitly discarded (e.g. leaving a version whose edits must not be persisted). */
    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      hasPending = false;
    },

    getStatus() {
      return status;
    },
  };
}
