import { useEffect, useMemo, useRef, useState } from "react";
import { createAutosaveController, AUTOSAVE_STATUS } from "../../caseWorkspace/autosaveController.js";

/**
 * Thin React wrapper around `createAutosaveController` - Phase 7.
 *
 * A new controller is created whenever `targetKey` changes (case/topic/
 * chart-fingerprint/note-version identity), and the PREVIOUS controller
 * is flushed (pending edits saved immediately, never dropped) before the
 * new one takes over - this is what "switching Case/Topic/note version
 * cancels/flushes safely" means in practice. The same flush runs on
 * unmount.
 */
export function useAutosave({ targetKey, save, delayMs = 1500 }) {
  const [status, setStatus] = useState(AUTOSAVE_STATUS.IDLE);
  const saveRef = useRef(save);
  saveRef.current = save;

  const controller = useMemo(
    () =>
      createAutosaveController({
        save: (payload) => saveRef.current(payload),
        delayMs,
        onStatusChange: setStatus,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [targetKey],
  );

  useEffect(() => {
    setStatus(AUTOSAVE_STATUS.IDLE);
    return () => {
      controller.flush();
    };
  }, [controller]);

  return { notifyChange: controller.notifyChange, flush: controller.flush, status };
}

export { AUTOSAVE_STATUS };
