import { useEffect, useState } from "react";
import { useAutosave, AUTOSAVE_STATUS } from "./useAutosave.js";
import { useAsyncData } from "./useAsyncData.js";
import { PHASE6_TOPIC_IDS, NOTE_STATUS } from "../../caseWorkspace/noteModel.js";
import { TOPIC_LABELS } from "./topicLabels.js";

const STATUS_TEXT = {
  [AUTOSAVE_STATUS.IDLE]: "",
  [AUTOSAVE_STATUS.UNSAVED]: "Unsaved changes｜有未保存的更改",
  [AUTOSAVE_STATUS.SAVING]: "Saving…｜保存中…",
  [AUTOSAVE_STATUS.SAVED]: "Saved｜已保存",
  [AUTOSAVE_STATUS.ERROR]: "Save failed｜保存失败",
};

const EDITABLE_FIELDS = ["overallImpression", "repeatedThemes", "crossSystemConvergence", "crossSystemDifferences", "finalSynthesis"];

async function topicReference(notesRepo, caseId, topicId, chartFingerprint) {
  const current = await notesRepo.getCurrentVersion({ caseId, topicId, chartFingerprint });
  return { topicId, version: current };
}

function TopicReferenceCard({ topicId, version }) {
  return (
    <div className="frs-topic-ref">
      <h5>{TOPIC_LABELS[topicId]}</h5>
      {!version && <p className="reception-note">No note started yet｜尚未开始记录</p>}
      {version && (
        <>
          <span className={`ws-status-badge ws-status-${version.status}`}>{version.status}</span>
          <p className="frs-topic-ref-text">{version.finalInterpretation || (version.status === NOTE_STATUS.FINAL ? "(Final Interpretation left blank)｜（最终解读留空）" : "Not yet written｜尚未撰写")}</p>
        </>
      )}
    </div>
  );
}

/**
 * Final Reading — Production UX Refactor, Part 14. A human-authored,
 * Case-level synthesis. References each Topic's current Final
 * Interpretation LIVE (read-only display, never copied into storage) so
 * the astrologer always sees their own already-written per-topic text
 * while composing the overall synthesis - nothing here is AI-generated
 * or auto-invented.
 */
export function FinalReadingSection({ caseId, currentFingerprint, notesRepo, finalReadingRepo }) {
  const { data: reading, loading: readingLoading, error: readingError } = useAsyncData(() => finalReadingRepo.get(caseId), [finalReadingRepo, caseId]);
  const { data: topicRefs, loading: refsLoading } = useAsyncData(
    () => Promise.all(PHASE6_TOPIC_IDS.map((topicId) => topicReference(notesRepo, caseId, topicId, currentFingerprint))),
    [notesRepo, caseId, currentFingerprint],
  );

  const [fields, setFields] = useState(null);

  useEffect(() => {
    if (reading) setFields(EDITABLE_FIELDS.reduce((acc, f) => ({ ...acc, [f]: reading[f] }), {}));
  }, [reading?.caseId, reading?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const { notifyChange, status } = useAutosave({
    targetKey: caseId,
    save: (patch) => finalReadingRepo.save(caseId, patch),
  });

  if (readingLoading || !fields) return <p className="reception-note">Loading Final Reading…｜加载完整解盘中…</p>;
  if (readingError) return <div className="error-box">{readingError.message}</div>;

  function update(field, value) {
    const next = { ...fields, [field]: value };
    setFields(next);
    notifyChange(next);
  }

  return (
    <div className="final-reading-section">
      <h3>Final Reading｜完整解盘</h3>
      <p className="reception-note">
        Your own Case-level synthesis, written entirely by hand — referencing your Topic interpretations below, never
        generated from them｜完全由人工撰写的整盘综合判断 — 参考下方各主题解读，但绝非由其自动生成
      </p>

      <div className="ws-note-field">
        <label htmlFor="fr-overall">Overall Impression｜整体印象</label>
        <textarea id="fr-overall" rows={4} value={fields.overallImpression} onChange={(e) => update("overallImpression", e.target.value)} />
      </div>

      <h4>Topic References｜各主题参考</h4>
      {refsLoading && <p className="reception-note">Loading topic references…｜加载各主题参考中…</p>}
      {!refsLoading && (
        <div className="frs-topic-ref-grid">
          {topicRefs.map(({ topicId, version }) => (
            <TopicReferenceCard key={topicId} topicId={topicId} version={version} />
          ))}
        </div>
      )}

      <div className="ws-note-field">
        <label htmlFor="fr-themes">Repeated Themes｜重复主题</label>
        <textarea id="fr-themes" rows={4} value={fields.repeatedThemes} onChange={(e) => update("repeatedThemes", e.target.value)} />
      </div>
      <div className="ws-note-field">
        <label htmlFor="fr-convergence">Cross-System Convergence｜跨体系共同指向</label>
        <textarea id="fr-convergence" rows={4} value={fields.crossSystemConvergence} onChange={(e) => update("crossSystemConvergence", e.target.value)} />
      </div>
      <div className="ws-note-field">
        <label htmlFor="fr-differences">Cross-System Differences｜跨体系差异</label>
        <textarea id="fr-differences" rows={4} value={fields.crossSystemDifferences} onChange={(e) => update("crossSystemDifferences", e.target.value)} />
      </div>
      <div className="ws-note-field">
        <label htmlFor="fr-synthesis">Final Synthesis｜最终综合判断</label>
        <textarea id="fr-synthesis" rows={6} value={fields.finalSynthesis} onChange={(e) => update("finalSynthesis", e.target.value)} />
      </div>

      <span className="ws-autosave-status">{STATUS_TEXT[status]}</span>
    </div>
  );
}
