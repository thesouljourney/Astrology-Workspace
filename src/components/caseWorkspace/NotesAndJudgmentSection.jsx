import { useEffect, useState } from "react";
import { useAutosave, AUTOSAVE_STATUS } from "./useAutosave.js";
import { NOTE_STATUS, EVIDENCE_RELIED_ON_CATEGORIES } from "../../caseWorkspace/noteModel.js";

const STATUS_TEXT = {
  [AUTOSAVE_STATUS.IDLE]: "",
  [AUTOSAVE_STATUS.UNSAVED]: "Unsaved changes｜有未保存的更改",
  [AUTOSAVE_STATUS.SAVING]: "Saving…｜保存中…",
  [AUTOSAVE_STATUS.SAVED]: "Saved｜已保存",
  [AUTOSAVE_STATUS.ERROR]: "Save failed｜保存失败",
};

const EDITABLE_FIELDS = ["westernNotes", "classicalNotes", "vedicNotes", "convergenceNotes", "differencesNotes", "uncertainNotes", "finalInterpretation"];

function NoteField({ id, label, placeholder, value, readOnly, onChange, textarea = true }) {
  const Tag = textarea ? "textarea" : "input";
  return (
    <div className="ws-note-field">
      <label htmlFor={id}>{label}</label>
      <Tag id={id} value={value} placeholder={placeholder} readOnly={readOnly} disabled={readOnly} onChange={(e) => onChange(e.target.value)} rows={textarea ? 4 : undefined} />
    </div>
  );
}

/**
 * Covers workflow steps 08-10 (System Notes / Cross-System Observation /
 * Final Manual Judgment). Every field here is human-written; nothing is
 * ever pre-filled with generated interpretation - `createNoteVersion()`
 * always starts every field blank (see `noteModel.js`).
 */
export function NotesAndJudgmentSection({ caseId, topicId, chartFingerprint, notesRepo, version, versions, onSelectVersion, onRefresh, forceReadOnly = false }) {
  const [fields, setFields] = useState(() => extractFields(version));

  useEffect(() => {
    setFields(extractFields(version));
  }, [version?.noteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const targetKey = version ? `${caseId}|${topicId}|${chartFingerprint}|${version.noteId}` : "none";
  const { notifyChange, flush, status } = useAutosave({
    targetKey,
    save: (patch) => notesRepo.saveDraft({ caseId, topicId, chartFingerprint, noteId: version.noteId, patch }),
  });

  if (!version) {
    return (
      <div className="ws-notes-section">
        <p className="reception-note">No note version exists yet for this chart version｜此图版本尚无笔记</p>
        <button
          type="button"
          className="ws-btn ws-btn-primary"
          onClick={() => {
            notesRepo.createVersion({ caseId, topicId, chartFingerprint });
            onRefresh();
          }}
        >
          Start Note｜开始记录
        </button>
      </div>
    );
  }

  const readOnly = forceReadOnly || version.status !== NOTE_STATUS.DRAFT;

  function update(field, value) {
    const next = { ...fields, [field]: value };
    setFields(next);
    notifyChange(next);
  }

  function toggleEvidenceCategory(category) {
    const has = fields.evidenceReliedOn.includes(category);
    update("evidenceReliedOn", has ? fields.evidenceReliedOn.filter((c) => c !== category) : [...fields.evidenceReliedOn, category]);
  }

  async function handleMarkFinal() {
    await flush();
    notesRepo.markFinal({ caseId, topicId, chartFingerprint, noteId: version.noteId });
    onRefresh();
  }

  async function handleCreateNewVersion() {
    await flush();
    const created = notesRepo.createVersion({ caseId, topicId, chartFingerprint });
    onRefresh();
    onSelectVersion(created.noteId);
  }

  async function handleArchive() {
    await flush();
    notesRepo.archiveVersion({ caseId, topicId, chartFingerprint, noteId: version.noteId });
    onRefresh();
  }

  return (
    <div className="ws-notes-section">
      <div className="ws-version-bar">
        <label htmlFor="ws-version-select">Version｜版本</label>
        <select id="ws-version-select" value={version.noteId} onChange={(e) => onSelectVersion(e.target.value)}>
          {versions.map((v) => (
            <option key={v.noteId} value={v.noteId}>
              v{v.versionNumber} — {v.status}
            </option>
          ))}
        </select>
        <span className={`ws-status-badge ws-status-${version.status}`}>{version.status}</span>
        {!readOnly && <span className="ws-autosave-status">{STATUS_TEXT[status]}</span>}
        {!forceReadOnly && (
          <div className="ws-version-actions">
            {!readOnly && (
              <button type="button" className="ws-btn" onClick={handleMarkFinal}>
                Mark as Final｜标记为最终版
              </button>
            )}
            <button type="button" className="ws-btn" onClick={handleCreateNewVersion}>
              Create New Version｜新建版本
            </button>
            {version.status !== NOTE_STATUS.ARCHIVED && (
              <button type="button" className="ws-btn" onClick={handleArchive}>
                Archive｜归档
              </button>
            )}
          </div>
        )}
      </div>

      {forceReadOnly && <p className="reception-note">Viewing a historical chart version, read-only｜正在查看历史图版本（只读）</p>}
      {!forceReadOnly && readOnly && (
        <p className="reception-note">
          This version is {version.status} and read-only. Create a new version to keep editing｜此版本为{version.status === "final" ? "最终版" : "已归档"}，只读。如需继续编辑请新建版本。
        </p>
      )}

      <h5>System Notes｜各体系笔记</h5>
      <NoteField id="western-notes" label="Modern Western Notes｜现代西占笔记" placeholder="Your own reading of the Modern Western evidence above｜你对上方现代西方证据的解读" value={fields.westernNotes} readOnly={readOnly} onChange={(v) => update("westernNotes", v)} />
      <NoteField id="classical-notes" label="Classical Notes｜古典占星笔记" placeholder="Your own reading of the Classical evidence above｜你对上方古典占星证据的解读" value={fields.classicalNotes} readOnly={readOnly} onChange={(v) => update("classicalNotes", v)} />
      <NoteField id="vedic-notes" label="Vedic Notes｜印度占星笔记" placeholder="Your own reading of the Vedic evidence above｜你对上方印度占星证据的解读" value={fields.vedicNotes} readOnly={readOnly} onChange={(v) => update("vedicNotes", v)} />

      <h5>Cross-System Observation｜跨体系观察</h5>
      <NoteField id="convergence-notes" label="Convergence I Observe｜我观察到的共同指向" placeholder="Where do the systems seem to point the same way, in your own judgment?｜在你看来，各体系似乎指向何种共同方向？" value={fields.convergenceNotes} readOnly={readOnly} onChange={(v) => update("convergenceNotes", v)} />
      <NoteField id="differences-notes" label="Differences I Observe｜我观察到的差异" placeholder="Where do they differ, and is that difference doctrinal or coincidental?｜它们在哪些方面不同？这种差异是学说性的还是巧合？" value={fields.differencesNotes} readOnly={readOnly} onChange={(v) => update("differencesNotes", v)} />
      <NoteField id="uncertain-notes" label="Questions / Uncertain｜仍需确认的问题" placeholder="What remains unclear or needs more evidence/confirmation?｜还有哪些不清楚或需要更多证据确认的地方？" value={fields.uncertainNotes} readOnly={readOnly} onChange={(v) => update("uncertainNotes", v)} />

      <h5>Final Manual Judgment｜最终人工判断</h5>
      <NoteField id="final-interpretation" label="Final Interpretation｜最终人工判断" placeholder="Your final, entirely human-written interpretation for this topic｜你对本主题的最终解读，完全由人工撰写" value={fields.finalInterpretation} readOnly={readOnly} onChange={(v) => update("finalInterpretation", v)} />

      <div className="ws-evidence-relied-on">
        <span>Evidence Relied On｜主要参考证据</span>
        <div className="ws-checkbox-row">
          {EVIDENCE_RELIED_ON_CATEGORIES.map((category) => (
            <label key={category} className="ws-checkbox-label">
              <input type="checkbox" checked={fields.evidenceReliedOn.includes(category)} disabled={readOnly} onChange={() => toggleEvidenceCategory(category)} />
              {category}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function extractFields(version) {
  if (!version) return null;
  return EDITABLE_FIELDS.reduce((acc, field) => ({ ...acc, [field]: version[field] }), { evidenceReliedOn: [...version.evidenceReliedOn] });
}
