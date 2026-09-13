import { useEffect, useState } from "react";
import { useAutosave, AUTOSAVE_STATUS } from "./useAutosave.js";
import { useAsyncData } from "./useAsyncData.js";

const STATUS_TEXT = {
  [AUTOSAVE_STATUS.IDLE]: "",
  [AUTOSAVE_STATUS.UNSAVED]: "Unsaved changes｜有未保存的更改",
  [AUTOSAVE_STATUS.SAVING]: "Saving…｜保存中…",
  [AUTOSAVE_STATUS.SAVED]: "Saved｜已保存",
  [AUTOSAVE_STATUS.ERROR]: "Save failed｜保存失败",
};

/**
 * General Case Notes — Production UX Refactor, Part 13. Observations
 * that belong to the whole Case, not one Topic (repeated themes,
 * questions to revisit, consultation prep). Autosaved via the same
 * `useAutosave`/`autosaveController.js` pattern as Topic Notes.
 */
export function CaseNotesSection({ caseId, caseNotesRepo }) {
  const { data: record, loading, error } = useAsyncData(() => caseNotesRepo.get(caseId), [caseNotesRepo, caseId]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (record) setText(record.notes);
  }, [record?.caseId, record?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const { notifyChange, status } = useAutosave({
    targetKey: caseId,
    save: (patch) => caseNotesRepo.save(caseId, patch),
  });

  if (loading) return <p className="reception-note">Loading Case Notes…｜加载整盘笔记中…</p>;
  if (error) return <div className="error-box">{error.message}</div>;

  function handleChange(value) {
    setText(value);
    notifyChange({ notes: value });
  }

  return (
    <div className="case-notes-section">
      <h3>Case Notes｜整盘笔记</h3>
      <p className="reception-note">
        Observations about the whole Case that are not tied to one Topic — repeated themes, questions to revisit,
        consultation prep｜与整个案例相关、不属于单一主题的观察 — 重复主题、待确认问题、咨询准备
      </p>
      <div className="ws-note-field">
        <label htmlFor="case-notes-textarea">General Notes｜一般笔记</label>
        <textarea id="case-notes-textarea" rows={10} value={text} onChange={(e) => handleChange(e.target.value)} placeholder="Anything worth remembering about this Case as a whole…｜关于本案例整体值得记录的任何内容…" />
      </div>
      <span className="ws-autosave-status">{STATUS_TEXT[status]}</span>
    </div>
  );
}
