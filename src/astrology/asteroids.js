/**
 * Asteroids / Centaurs (Chiron, Ceres, Pallas, Juno, Vesta, Eros).
 *
 * STATUS: NOT IMPLEMENTED in this phase.
 *
 * Investigated: astronomy-engine's `Body` enum contains only the Sun, Moon,
 * and the eight classical/modern planets (Mercury through Pluto) — no
 * asteroids, and no orbital-element data for them. Unlike the angles/nodes/
 * Lilith/Vertex/East Point above, asteroid positions cannot be derived from
 * first-principles spherical astronomy — they require either:
 *
 *   (a) a real perturbation-quality ephemeris for each body (e.g. Swiss
 *       Ephemeris's bundled asteroid data file), or
 *   (b) hand-rolled two-body Keplerian propagation from a set of published
 *       osculating orbital elements at some reference epoch.
 *
 * (b) was deliberately rejected: propagating from fixed elements ignores
 * planetary perturbations and its error grows with time-from-epoch — this
 * is exactly the kind of invented/approximated output the project
 * explicitly prohibits ("do not invent or approximate them").
 *
 * (a) was investigated using `sweph-wasm` (temporary devDependency only,
 * never shipped) purely to determine feasibility, NOT wired into this
 * codebase:
 *   - Chiron, Ceres, Pallas, Juno, Vesta: ARE present in the base Swiss
 *     Ephemeris asteroid data file bundled with sweph-wasm (`seas_*.se1`) —
 *     no extra download needed if that dependency were adopted.
 *   - Eros (433): requires a separate per-asteroid orbital element file
 *     (`se00433s.se1`) that is NOT bundled and is not present anywhere in
 *     the sweph-wasm package — obtaining it would require a network
 *     request this project does not make. Eros therefore cannot be
 *     implemented locally at all right now, independent of any other
 *     decision.
 *
 * Adopting Swiss Ephemeris (even via a WASM wrapper) as a PERMANENT
 * PRODUCTION dependency is an AGPL-3.0 licensing decision with real
 * commercial implications for this project — per this project's own rule,
 * that requires explicit user sign-off before being added, not a unilateral
 * choice made here. See the Phase 2 final report for the exact question
 * posed to the user.
 *
 * This module intentionally exports no calculation — only status metadata,
 * so the UI can render "not implemented" honestly instead of silently
 * omitting the rows.
 */

export const ASTEROID_STATUS = [
  {
    id: "chiron",
    englishName: "Chiron",
    chineseName: "凯龙星",
    symbol: "⚷",
    implemented: false,
    reason:
      "Requires a perturbation-quality ephemeris not available in astronomy-engine. Available via Swiss Ephemeris's bundled base asteroid file if adopted as a dependency (pending decision — see README/report).",
  },
  {
    id: "ceres",
    englishName: "Ceres",
    chineseName: "谷神星",
    symbol: "⚳",
    implemented: false,
    reason: "Same as Chiron.",
  },
  {
    id: "pallas",
    englishName: "Pallas",
    chineseName: "智神星",
    symbol: "⚴",
    implemented: false,
    reason: "Same as Chiron.",
  },
  {
    id: "juno",
    englishName: "Juno",
    chineseName: "婚神星",
    symbol: "⚵",
    implemented: false,
    reason: "Same as Chiron.",
  },
  {
    id: "vesta",
    englishName: "Vesta",
    chineseName: "灶神星",
    symbol: "⚶",
    implemented: false,
    reason: "Same as Chiron.",
  },
  {
    id: "eros",
    englishName: "Eros",
    chineseName: "爱神星",
    symbol: "",
    implemented: false,
    reason:
      "Requires a per-asteroid orbital element file (se00433s.se1) that is not bundled with any locally-available library and is not present in this project. Not implementable offline right now under any of this project's currently available options.",
  },
];
