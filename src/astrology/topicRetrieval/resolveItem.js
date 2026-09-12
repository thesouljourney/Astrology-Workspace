/**
 * Topic Retrieval evidence-item resolver — Phase 6.
 *
 * Converts one static recipe descriptor (see `recipes.js`) into one fully
 * resolved `EvidenceItem` against a real, already-computed `chart`. This
 * is the ONLY place a descriptor's `kind` is dispatched — it never
 * computes new astrology, only fetches/filters/bundles values that
 * Phase 1-5 already produced (see `helpers.js`'s own doc comment).
 *
 * EvidenceItem shape (Part 5 of the brief):
 *   {
 *     evidenceId, label: {en, zh}, role, category, availability,
 *     sourcePath, value, triggered?, convention?, neutralReason?,
 *   }
 *
 * `category` is the recipe-declared bucket the item was placed in
 * ("primary"/"secondary"/"contextual"/"future_required"/"excluded"/
 * "convention_pending"). `availability` is the runtime resolution
 * status - always "available" for primary/secondary, always
 * "future_required"/"excluded"/"convention_pending" for those three
 * (never silently resolved against the chart), and "contextual_available"
 * for contextual items (with `triggered`/`value` carrying the dynamic
 * result - `value` is `null` whenever `triggered` is `false`, since a
 * relationship that does not exist in this chart must never be
 * fabricated - see brief Part 15).
 */

import {
  westernPoint,
  westernPlanetsInHouse,
  westernHouseCusp,
  classicalHouseLordKey,
  classicalPlanetEvidence,
  classicalPlanetsInHouse,
  classicalSectLightKey,
  classicalAspectBetween,
  classicalReceptionBetween,
  classicalDispositorRelationBetween,
  vedicGrahaEvidence,
  vedicBhavaEvidence,
  vedicBhavaLordKey,
  vedicLordshipEvidence,
  vedicDispositorRelationBetween,
  vedicOwnershipRelationBetween,
  VEDIC_KEY_BY_DISPLAY_NAME,
} from "./helpers.js";

function resolveClassicalRef(chart, ref) {
  return ref.type === "planet" ? ref.key : classicalHouseLordKey(chart, ref.house);
}

function resolveVedicRef(chart, ref) {
  if (ref.type === "graha") return ref.key;
  if (ref.type === "bhavaLord") return vedicBhavaLordKey(chart, ref.bhava);
  if (ref.type === "lagnaLord") return VEDIC_KEY_BY_DISPLAY_NAME[chart.vedic.summary.chartOverview.lagna.lagnaLord];
  throw new Error(`resolveVedicRef: unknown ref type "${ref.type}"`);
}

function baseItem(descriptor) {
  return { evidenceId: descriptor.evidenceId, label: descriptor.label, role: descriptor.role, category: descriptor.category };
}

/**
 * @param {object} descriptor a single recipe descriptor (see recipes.js)
 * @param {object} chart the fully-built chart (chart.classical/chart.vedic already attached)
 * @returns {object} one resolved EvidenceItem
 */
export function resolveEvidenceItem(descriptor, chart) {
  const item = baseItem(descriptor);

  switch (descriptor.kind) {
    case "future": {
      return { ...item, availability: "future_required", sourcePath: null, value: null, neutralReason: descriptor.reason };
    }
    case "excluded": {
      return { ...item, availability: "excluded", sourcePath: null, value: null, neutralReason: descriptor.reason };
    }
    case "conventionPending": {
      return { ...item, availability: "convention_pending", sourcePath: null, value: null, neutralReason: descriptor.reason };
    }

    case "westernPoint": {
      return { ...item, availability: "available", sourcePath: `points.${descriptor.id}`, value: westernPoint(chart, descriptor.id) };
    }
    case "westernHouseOccupants": {
      const occupants = westernPlanetsInHouse(chart, descriptor.house);
      return { ...item, availability: "available", sourcePath: `houseCusps.${descriptor.house}`, value: { house: descriptor.house, occupants } };
    }
    case "westernHouseCusp": {
      return { ...item, availability: "available", sourcePath: `houseCusps.${descriptor.house}`, value: westernHouseCusp(chart, descriptor.house) };
    }

    case "classicalPlanet": {
      return { ...item, availability: "available", sourcePath: `classical.summary.planets.${descriptor.id}`, value: classicalPlanetEvidence(chart, descriptor.id) };
    }
    case "classicalLord": {
      const lordKey = classicalHouseLordKey(chart, descriptor.house);
      const cusp = westernHouseCusp(chart, descriptor.house);
      return {
        ...item,
        availability: "available",
        sourcePath: `classical.summary.planets.${lordKey}`,
        value: { sourceHouse: descriptor.house, sourceSign: cusp.sign.key, lordKey, evidence: classicalPlanetEvidence(chart, lordKey) },
      };
    }
    case "classicalHouseOccupants": {
      const occupantKeys = classicalPlanetsInHouse(chart, descriptor.house);
      return {
        ...item,
        availability: "available",
        sourcePath: `houseCusps.${descriptor.house}`,
        value: { house: descriptor.house, occupants: occupantKeys.map((k) => ({ planet: k, evidence: classicalPlanetEvidence(chart, k) })) },
      };
    }
    case "classicalSectLight": {
      const lightKey = classicalSectLightKey(chart);
      return { ...item, availability: "available", sourcePath: `classical.summary.planets.${lightKey}`, value: { sect: chart.classical.sect, lightKey, evidence: classicalPlanetEvidence(chart, lightKey) } };
    }
    case "classicalContextual": {
      const a = resolveClassicalRef(chart, descriptor.a);
      const b = resolveClassicalRef(chart, descriptor.b);
      const aspect = classicalAspectBetween(chart, a, b);
      const reception = classicalReceptionBetween(chart, a, b);
      const dispositor = classicalDispositorRelationBetween(chart, a, b);
      const triggered = aspect.triggered || reception.triggered || dispositor.triggered;
      return {
        ...item,
        availability: "contextual_available",
        sourcePath: `classical.summary.planets.${a}`,
        triggered,
        value: triggered ? { planetA: a, planetB: b, aspect: aspect.value, reception: reception.value, dispositor: dispositor.value } : null,
      };
    }

    case "vedicGraha": {
      return { ...item, availability: "available", sourcePath: `vedic.summary.grahas.${descriptor.id}`, value: vedicGrahaEvidence(chart, descriptor.id) };
    }
    case "vedicLagna": {
      return { ...item, availability: "available", sourcePath: "vedic.summary.chartOverview.lagna", value: chart.vedic.summary.chartOverview.lagna };
    }
    case "vedicLagnaLordNetwork": {
      return { ...item, availability: "available", sourcePath: "vedic.summary.lagnaLordNetwork", value: chart.vedic.summary.lagnaLordNetwork };
    }
    case "vedicBhavaLord": {
      const lordKey = vedicBhavaLordKey(chart, descriptor.bhava);
      return {
        ...item,
        availability: "available",
        sourcePath: `vedic.summary.grahas.${lordKey}`,
        value: {
          bhava: vedicBhavaEvidence(chart, descriptor.bhava),
          lordKey,
          lordGraha: vedicGrahaEvidence(chart, lordKey),
          lordOwnership: vedicLordshipEvidence(chart, lordKey),
        },
      };
    }
    case "vedicLordshipForRef": {
      const key = resolveVedicRef(chart, descriptor.ref);
      return { ...item, availability: "available", sourcePath: `vedic.summary.lordship.planets.${key}`, value: vedicLordshipEvidence(chart, key) };
    }
    case "vedicBhavaOccupants": {
      return { ...item, availability: "available", sourcePath: `vedic.summary.bhavas.${descriptor.bhava}`, value: vedicBhavaEvidence(chart, descriptor.bhava) };
    }
    case "vedicContextual": {
      const a = resolveVedicRef(chart, descriptor.a);
      const b = resolveVedicRef(chart, descriptor.b);
      const dispositor = vedicDispositorRelationBetween(chart, a, b);
      const ownership = vedicOwnershipRelationBetween(chart, a, b);
      const triggered = dispositor.triggered || ownership.triggered;
      return {
        ...item,
        availability: "contextual_available",
        sourcePath: `vedic.summary.grahas.${a}`,
        triggered,
        value: triggered ? { planetA: a, planetB: b, dispositor: dispositor.value, ownership: ownership.value } : null,
      };
    }

    default:
      throw new Error(`resolveEvidenceItem: unknown descriptor kind "${descriptor.kind}"`);
  }
}
