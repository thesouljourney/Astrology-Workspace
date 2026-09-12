import { useMemo, useState } from "react";
import { createLocalCaseRepository } from "../../caseWorkspace/storage/localCaseRepository.js";
import { createLocalNotesRepository } from "../../caseWorkspace/storage/localNotesRepository.js";
import { CaseManager } from "./CaseManager.jsx";
import { CaseOverview } from "./CaseOverview.jsx";
import { useAsyncData } from "./useAsyncData.js";
import "./caseWorkspace.css";

/**
 * Phase 7 top-level container. Owns the ONLY repository instances in
 * the app (backed by localStorage-or-memory, behind the repository
 * abstraction - components below never touch localStorage directly).
 *
 * `caseRepo.get()` is Promise-returning (Phase 7 pre-lock audit fix) -
 * this component therefore loads the selected Case via `useAsyncData`
 * (state + effect + stale-result protection) rather than reading the
 * repository's return value directly during render.
 */
export default function CaseWorkspace() {
  const caseRepo = useMemo(() => createLocalCaseRepository(), []);
  const notesRepo = useMemo(() => createLocalNotesRepository(), []);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  const {
    data: caseRecord,
    loading,
    error,
    reload,
  } = useAsyncData(() => (selectedCaseId ? caseRepo.get(selectedCaseId) : Promise.resolve(null)), [caseRepo, selectedCaseId]);

  if (!selectedCaseId) {
    return <CaseManager caseRepo={caseRepo} onOpenCase={(c) => setSelectedCaseId(c.caseId)} />;
  }

  if (loading) return <p className="reception-note">Loading Case…｜加载中…</p>;
  if (error) return <div className="error-box">{error.message}</div>;
  if (!caseRecord) {
    return <CaseManager caseRepo={caseRepo} onOpenCase={(c) => setSelectedCaseId(c.caseId)} />;
  }

  return <CaseOverview caseRecord={caseRecord} caseRepo={caseRepo} notesRepo={notesRepo} onBack={() => setSelectedCaseId(null)} onCaseChanged={reload} />;
}
