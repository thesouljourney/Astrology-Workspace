import { useState } from "react";

const SYSTEM_LABEL = {
  modernWestern: "Modern Western｜现代西方",
  classical: "Classical｜古典",
  vedic: "Vedic｜印度",
};

const AVAILABILITY_LABEL = {
  available: "Available｜可用",
  contextual_available: "Contextual｜情境相关",
  future_required: "Future Required｜未来需要",
  excluded: "Excluded｜已排除",
  convention_pending: "Convention Pending｜约定待定",
};

/** Best-effort compact one-line summary of a resolved evidence value - never interpretive, purely a display shortcut. Full JSON is always available via the nested <details>. */
function summarize(item) {
  const v = item.value;
  if (v == null) {
    if (item.availability === "contextual_available") return "No active relationship in this chart｜此命盘中无实际关系";
    return null;
  }
  if (v.sign && v.englishName) {
    return `${v.englishName}｜${v.chineseName} — ${v.sign.english} ${v.degreeInSign?.toFixed?.(2)}°, House ${v.house ?? "—"}`;
  }
  if (v.evidence && v.lordKey) {
    const p = v.evidence.position;
    return `Lord: ${v.lordKey} — ${p.sign} ${p.degreeInSign.toFixed(2)}°, House ${p.house}`;
  }
  if (v.lordGraha) {
    return `Lord: ${v.lordKey} — Rashi ${v.lordGraha.position.rashi}, Bhava ${v.lordGraha.bhava.number}`;
  }
  if (Array.isArray(v.occupants)) {
    const names = v.occupants.map((o) => o.englishName ?? o.evidence?.identity?.planet ?? o.planet ?? o).filter(Boolean);
    return `House ${v.house}: ${names.length > 0 ? names.join(", ") : "—"}`;
  }
  if (v.bhavaNumber) {
    return `Bhava ${v.bhavaNumber} (${v.rashi}) — Lord: ${v.lord}, Grahas: ${v.grahas?.length > 0 ? v.grahas.join(", ") : "—"}`;
  }
  if (v.position && v.bhava) {
    return `${v.position.rashi}, Bhava ${v.bhava.number}${v.nakshatra ? `, ${v.nakshatra.name} Pada ${v.nakshatra.pada}` : ""}`;
  }
  if (v.lagnaLordDispositor) {
    return `Lagna Lord: ${v.lagnaLord} — Dispositor: ${v.lagnaLordDispositor}, Final: ${v.finalDispositor ?? "loop"}`;
  }
  if (v.nakshatraLord && v.rashi) {
    return `${v.rashi}, ${v.nakshatra} Pada ${v.pada} — Lord: ${v.lagnaLord}`;
  }
  if (item.availability === "contextual_available" && item.triggered) {
    return "Relationship found — see details｜发现实际关系 — 详见下方";
  }
  return null;
}

function EvidenceRow({ item }) {
  const summary = summarize(item);
  return (
    <li className={`evidence-row evidence-${item.category}`}>
      <div className="evidence-head">
        <span className="evidence-label">
          {item.label.en}｜{item.label.zh}
        </span>
        <span className="evidence-badges">
          <span className="evidence-role">{item.role}</span>
          <span className={`evidence-availability availability-${item.availability}`}>{AVAILABILITY_LABEL[item.availability]}</span>
        </span>
      </div>
      {summary && <div className="evidence-summary">{summary}</div>}
      {item.neutralReason && <div className="reception-note evidence-reason">{item.neutralReason}</div>}
      {item.value !== null && (
        <details className="evidence-raw">
          <summary>Raw｜原始数据</summary>
          <pre>{JSON.stringify(item.value, null, 1)}</pre>
        </details>
      )}
    </li>
  );
}

function EvidenceSection({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="evidence-section">
      <h5>{title}</h5>
      <ul>
        {items.map((item) => (
          <EvidenceRow key={item.evidenceId} item={item} />
        ))}
      </ul>
    </div>
  );
}

function SystemColumn({ systemKey, bundle }) {
  return (
    <div className="system-column">
      <h4>{SYSTEM_LABEL[systemKey]}</h4>
      {bundle.conceptStatus && (
        <p className="reception-note concept-status-note">
          {bundle.conceptStatus === "cross_framework_relevant_evidence_only"
            ? "Relevant Technical Evidence only — not presented as this system's own doctrine｜仅为相关技术证据 — 并非此体系本有学说"
            : bundle.conceptStatus === "modern_psychological_framing"
              ? "Modern psychological framing｜现代心理学框架"
              : bundle.conceptStatus}
        </p>
      )}
      {Object.keys(bundle.conventions).length > 0 && (
        <p className="reception-note convention-note">
          Convention｜约定: {Object.values(bundle.conventions).join(", ")}
        </p>
      )}
      <EvidenceSection title="Primary｜主要" items={bundle.primary} />
      <EvidenceSection title="Secondary｜次要" items={bundle.secondary} />
      <EvidenceSection title="Contextual｜情境相关" items={bundle.contextual} />
      <EvidenceSection title="Future Required｜未来需要" items={bundle.futureRequired} />
      <EvidenceSection title="Convention Pending｜约定待定" items={bundle.conventionPending} />
      {bundle.excluded.length > 0 && (
        <details className="raw-data">
          <summary>Excluded (technical/debug)｜已排除（技术调试数据）</summary>
          <ul>
            {bundle.excluded.map((item) => (
              <EvidenceRow key={item.evidenceId} item={item} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function ParentsSubdomain({ label, systemKey, bundle, matchLabel }) {
  const filterFn = (item) => item.label.en.includes(matchLabel);
  const primary = bundle.primary.filter(filterFn);
  const secondary = bundle.secondary.filter(filterFn);
  return (
    <div className="parents-subdomain">
      <h6>{label}</h6>
      <ul>
        {[...primary, ...secondary].map((item) => (
          <EvidenceRow key={item.evidenceId} item={item} />
        ))}
      </ul>
    </div>
  );
}

function ParentsView({ topic }) {
  return (
    <div className="systems-grid">
      {["modernWestern", "classical", "vedic"].map((systemKey) => {
        const bundle = topic.systems[systemKey];
        return (
          <div className="system-column" key={systemKey}>
            <h4>{SYSTEM_LABEL[systemKey]}</h4>
            <p className="reception-note convention-note">Convention｜约定: {Object.values(bundle.conventions).join(", ")}</p>
            {systemKey === "modernWestern" && (
              <p className="reception-note">
                Parental Axis｜父母轴线: IC/House 4 ↔ MC/House 10
              </p>
            )}
            {systemKey === "classical" && (
              <p className="reception-note">Parental Axis｜父母轴线: House 4 ↔ House 10 (traditional Lilly convention)</p>
            )}
            {systemKey === "vedic" && (
              <p className="reception-note">Parental Axis｜父母轴线: Bhava 4 ↔ Bhava 9</p>
            )}
            <ParentsSubdomain label="Mother｜母亲" systemKey={systemKey} bundle={bundle} matchLabel="[Mother]" />
            <ParentsSubdomain label="Father｜父亲" systemKey={systemKey} bundle={bundle} matchLabel="[Father]" />
            <EvidenceSection title="Future Required｜未来需要" items={bundle.futureRequired} />
            <EvidenceSection title="Convention Pending｜约定待定" items={bundle.conventionPending} />
            {bundle.excluded.length > 0 && (
              <details className="raw-data">
                <summary>Excluded (technical/debug)｜已排除（技术调试数据）</summary>
                <ul>
                  {bundle.excluded.map((item) => (
                    <EvidenceRow key={item.evidenceId} item={item} />
                  ))}
                </ul>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function TopicRetrieval({ chart }) {
  const { topicRetrieval } = chart;
  const [selectedId, setSelectedId] = useState(null);

  if (!topicRetrieval) return null;

  const topic = topicRetrieval.topics.find((t) => t.id === selectedId) ?? topicRetrieval.topics[0];

  return (
    <section className="topic-retrieval">
      <h2>Topic Retrieval｜主题取数</h2>
      <p className="reception-note">
        Retrieval only — existing Phase 1–5 technical evidence, regrouped by topic. No new astrology calculation, no
        interpretation, no scoring, no cross-system agreement judgment｜仅为取数 — 重新组织已有的第1–5阶段技术证据。无新占星计算、无解读、无评分、无跨体系一致性判断
      </p>

      <div className="topic-selector">
        {topicRetrieval.topics.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === topic.id ? "topic-btn active" : "topic-btn"}
            onClick={() => setSelectedId(t.id)}
          >
            {t.label.en}｜{t.label.zh}
          </button>
        ))}
      </div>

      <p className="reception-note topic-definition">
        {topic.definition.en}｜{topic.definition.zh}
      </p>

      {topic.id === "parents" ? (
        <ParentsView topic={topic} />
      ) : (
        <div className="systems-grid">
          {["modernWestern", "classical", "vedic"].map((systemKey) => (
            <SystemColumn key={systemKey} systemKey={systemKey} bundle={topic.systems[systemKey]} />
          ))}
        </div>
      )}
    </section>
  );
}
