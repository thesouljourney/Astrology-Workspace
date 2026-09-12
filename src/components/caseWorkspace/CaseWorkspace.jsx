import { useMemo, useState } from "react";
import { createLocalCaseRepository } from "../../caseWorkspace/storage/localCaseRepository.js";
import { createLocalNotesRepository } from "../../caseWorkspace/storage/localNotesRepository.js";
import { CaseManager } from "./CaseManager.jsx";
import { CaseOverview } from "./CaseOverview.jsx";
import "./caseWorkspace.css";

/**
 * Phase 7 top-level container. Owns the ONLY repository instances in
 * the app (backed by localStorage-or-memory, behind the repository
 * abstraction - components below never touch localStorage directly).
 */
export default function CaseWorkspace() {
  const caseRepo = useMemo(() => createLocalCaseRepository(), []);
  const notesRepo = useMemo(() => createLocalNotesRepository(), []);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  if (selectedCaseId) {
    const caseRecord = caseRepo.get(selectedCaseId);
    if (!caseRecord) {
      setSelectedCaseId(null);
      return null;
    }
    return <CaseOverview caseRecord={caseRecord} caseRepo={caseRepo} notesRepo={notesRepo} onBack={() => setSelectedCaseId(null)} />;
  }

  return <CaseManager caseRepo={caseRepo} onOpenCase={(c) => setSelectedCaseId(c.caseId)} />;
}
