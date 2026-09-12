import { useCallback, useEffect, useMemo, useState } from "react";
import { createAsyncDataController } from "../../caseWorkspace/asyncDataController.js";

/**
 * Small reusable async-data-loading hook — Phase 7 pre-lock audit fix.
 *
 * Fixes the exact problem Audit 1 found: several components were
 * reading a repository method's return value directly during render or
 * inside `useMemo`, which only ever worked because the local repository
 * happens to resolve synchronously today. Every repository method now
 * always returns a Promise (see `localCaseRepository.js`/
 * `localNotesRepository.js`), and neither render bodies nor `useMemo`
 * callbacks can `await` - so loading must go through `state + effect`.
 *
 * This is a thin React wrapper around `asyncDataController.js`'s
 * framework-agnostic stale-result protection: if `deps` changes again
 * (e.g. the user switches Case/Topic) before an in-flight `loader()`
 * resolves, that now-superseded result is silently discarded instead of
 * overwriting the state for whatever is now selected.
 */
export function useAsyncData(loader, deps) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null });

  const controller = useMemo(() => createAsyncDataController({ onResult: ({ data, error }) => setState({ data, error, loading: false }) }), []);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    return controller.load(loader).catch(() => {}); // errors already surfaced via onResult
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
