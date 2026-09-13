/**
 * One-time/offline generator for `src/geo/cityIndex.data.json` — the
 * local, offline Birth Place search dataset (Production UX Refactor,
 * Part 3).
 *
 * Source: the `city-timezones` npm package (MIT license), which ships a
 * static, already-downloaded snapshot of city name/coordinates/IANA
 * timezone data — NOT a runtime API. This script trims it to only the
 * fields the app's Birth Place search actually needs and writes a plain
 * JSON array, committed to the repo so the app never depends on
 * `city-timezones` at runtime (it is a devDependency, used only here).
 *
 * Re-run with: `node scripts/generateCityIndex.mjs`
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import cityTimezones from "city-timezones/data/cityMap.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "src", "geo", "cityIndex.data.json");

const trimmed = cityTimezones
  .filter((c) => c.city && c.timezone && typeof c.lat === "number" && typeof c.lng === "number")
  .map((c) => ({
    city: c.city,
    province: c.province || "",
    country: c.country || "",
    iso2: c.iso2 || "",
    lat: Math.round(c.lat * 10000) / 10000,
    lng: Math.round(c.lng * 10000) / 10000,
    timezone: c.timezone,
    pop: Math.round(c.pop || 0),
  }));

writeFileSync(outPath, JSON.stringify(trimmed));
console.log(`Wrote ${trimmed.length} places to ${outPath}`);
