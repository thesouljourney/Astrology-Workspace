import { groupSystemEvidence } from "../../caseWorkspace/evidenceGrouping.js";

const GROUP_LABEL = {
  domain_architecture: "Domain Architecture｜主题结构",
  core_rulers: "Core Rulers / Significators｜核心宫主/指标星",
  technical_condition: "Technical Condition｜技术状态",
  domain_occupants: "Domain Occupants｜主题宫位内行星",
  structural_connections: "Structural Connections｜结构连接",
  supporting_evidence: "Supporting Evidence｜辅助证据",
};
const GROUP_ORDER = ["domain_architecture", "core_rulers", "technical_condition", "domain_occupants", "structural_connections", "supporting_evidence"];

const AVAILABILITY_LABEL = {
  available: "Available｜可用",
  contextual_available: "Contextual｜情境相关",
  future_required: "Future Required｜未来需要",
  excluded: "Excluded｜已排除",
  convention_pending: "Convention Pending｜约定待定",
};

/** Best-effort compact one-line summary of a resolved value - never interpretive, purely a display shortcut. Deliberately independent of Phase 6's own UI summarizer (never imports from/modifies locked Phase 6 files). */
function summarize(item) {
  const v = item.value;
  if (v == null) {
    if (item.availability === "contextual_available") return "No active relationship in this chart｜此命盘中无实际关系";
    return null;
  }
  if (v.sign && v.englishName) return `${v.englishName}｜${v.chineseName} — ${v.sign.english} ${v.degreeInSign?.toFixed?.(2)}°, House ${v.house ?? "—"}`;
  if (v.evidence && v.lordKey) return `Lord: ${v.lordKey} — ${v.evidence.position.sign} ${v.evidence.position.degreeInSign.toFixed(2)}°, House ${v.evidence.position.house}`;
  if (v.lordGraha) return `Lord: ${v.lordKey} — Rashi ${v.lordGraha.position.rashi}, Bhava ${v.lordGraha.bhava.number}`;
  if (Array.isArray(v.occupants)) {
    const names = v.occupants.map((o) => o.englishName ?? o.evidence?.identity?.planet ?? o.planet ?? o).filter(Boolean);
    return `House ${v.house}: ${names.length > 0 ? names.join(", ") : "—"}`;
  }
  if (v.bhavaNumber) return `Bhava ${v.bhavaNumber} (${v.rashi}) — Lord: ${v.lord}, Grahas: ${v.grahas?.length > 0 ? v.grahas.join(", ") : "—"}`;
  if (v.position && v.bhava) return `${v.position.rashi}, Bhava ${v.bhava.number}${v.nakshatra ? `, ${v.nakshatra.name} Pada ${v.nakshatra.pada}` : ""}`;
  if (item.availability === "contextual_available" && item.triggered) return "Relationship found — see details｜发现实际关系 — 详见下方";
  return null;
}

/**
 * Presentation-only visual hierarchy (Production UX Refactor, Part 10):
 * the actual astrology content (the resolved value) leads; the category
 * label becomes a small caption and the availability badge a muted tag
 * rather than the dominant colored element - "available" is implicit
 * once evidence is shown at all, so it no longer needs to visually lead.
 * No data/markup meaning changes: same `item` fields, same DOM nodes.
 */
export function EvidenceItemRow({ item }) {
  const summary = summarize(item);
  return (
    <li className={`ws-evidence-row ws-evidence-${item.category}`}>
      <div className="ws-evidence-head">
        <span className="ws-evidence-label">
          {item.label.en}｜{item.label.zh}
        </span>
        <span className={`ws-availability-badge ws-availability-${item.availability}`}>{AVAILABILITY_LABEL[item.availability]}</span>
      </div>
      {summary && <div className="ws-evidence-summary">{summary}</div>}
      {item.neutralReason && <div className="reception-note">{item.neutralReason}</div>}
    </li>
  );
}

function EvidenceGroup({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="ws-evidence-group">
      <h5>{title}</h5>
      <ul>
        {items.map((item) => (
          <EvidenceItemRow key={item.evidenceId} item={item} />
        ))}
      </ul>
    </div>
  );
}

/** Missing/Future evidence (Part 11): truthful but never a primary visual element - a compact collapsed count, not one large card per item. */
function MissingEvidenceGroup({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <details className="ws-missing-evidence-group">
      <summary>Missing / Future Evidence｜尚未实现资料 ({items.length})</summary>
      <ul>
        {items.map((item) => (
          <EvidenceItemRow key={item.evidenceId} item={item} />
        ))}
      </ul>
    </details>
  );
}

/** Renders one system's (Modern Western / Classical / Vedic) Phase 6 evidence, regrouped by Phase 7 workflow section. Never fabricates a section this system's evidence does not actually contain. */
export function SystemEvidencePanel({ systemLabel, bundle }) {
  const grouped = groupSystemEvidence(bundle);
  return (
    <div className="ws-system-panel">
      <h4>{systemLabel}</h4>

      {bundle.conceptStatus && (
        <p className="reception-note ws-concept-status">
          {bundle.conceptStatus === "cross_framework_relevant_evidence_only"
            ? "Relevant Technical Evidence only — not presented as this system's own doctrine｜仅为相关技术证据 — 并非此体系本有学说"
            : bundle.conceptStatus === "modern_psychological_framing"
              ? "Modern psychological framing｜现代心理学框架"
              : bundle.conceptStatus}
        </p>
      )}
      {bundle.conventions && Object.keys(bundle.conventions).length > 0 && (
        <p className="reception-note ws-convention-note">Convention｜约定: {Object.values(bundle.conventions).join(", ")}</p>
      )}

      {GROUP_ORDER.map((group) => <EvidenceGroup key={group} title={GROUP_LABEL[group]} items={grouped[group]} />)}

      <MissingEvidenceGroup items={grouped.missing_evidence} />
      <EvidenceGroup title="Convention Pending｜约定待定" items={grouped.convention_pending} />

      {grouped.excluded?.length > 0 && (
        <details className="raw-data">
          <summary>Excluded (technical/debug)｜已排除（技术调试数据）</summary>
          <ul>
            {grouped.excluded.map((item) => (
              <EvidenceItemRow key={item.evidenceId} item={item} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
