# Personal Astrology Workspace｜个人占星工作台

A private, local-first astrology calculation tool. This is **not** related
to any other project — it has its own codebase, its own dependencies, and
no shared code, credentials, or services with anything else.

**Status:** Phase 1 (core Tropical Western calculation engine) and Phase 2
(the 26-point Modern Western data model) are implemented. No interpretation,
no AI, no Vedic/Classical/sidereal systems yet — see §7/§9 below.

---

## 1. What calculation engine does this use?

[`astronomy-engine`](https://github.com/cosinekitty/astronomy) (npm package
`astronomy-engine`, v2.x), by Don Cross.

It is **not** the Swiss Ephemeris (`swisseph`) library. That was a
deliberate choice, explained below — please read this if accuracy or
future licensing matters to you.

- It is a pure JavaScript/TypeScript implementation of standard
  astronomical algorithms (VSOP87-class analytic planetary theory,
  ELP2000-class lunar theory, an analytic Pluto model, IAU nutation/
  precession models, etc.), **compiled directly into the library code**.
- It ships **no external data files**. There is nothing to download,
  install, or point a path at — the orbital series are literally part of
  the JavaScript/TypeScript source.
- It runs identically in the browser and in Node.js, with **zero network
  calls**, which was the priority for this project (Swiss Ephemeris's
  official JS bindings are native/WASM wrappers around a C library and
  typically expect ephemeris data files on disk — heavier to guarantee
  "100% local, no file paths, works after `npm install`" for a browser app).
- Internal accuracy is sub-arcsecond for the Sun/Moon/planets over
  historical/modern dates, which is the same order of accuracy Swiss
  Ephemeris targets for the same bodies. See §6 for the actual
  cross-check against this project's verification case.

If a future phase requires bit-for-bit Swiss Ephemeris parity (e.g. to
match another program exactly), swapping the engine is possible because
all astronomy calls are isolated in `src/astrology/planets.js` and
`src/astrology/houses.js` — nothing else in the codebase talks to the
engine directly.

## 2. Does this need the internet to run?

**No**, not for calculation. Once `npm install` has downloaded the
dependencies to `node_modules/` (a one-time, standard step for any Node
project — same as installing any offline desktop app's dependencies), the
Sun/Moon/planet/house/angle calculations run entirely in-process with no
HTTP requests, no API keys, and no external services. You can disconnect
from the network and `npm run dev` / a built static bundle will still
calculate charts correctly.

`npm install` itself does need the internet once, to fetch packages from
the npm registry — that is no different from installing any other local
software.

## 3. Are there any APIs?

No. There is no Supabase, no Firebase, no backend server, no Google Maps /
GeoNames / Mapbox geocoding, no astrology API, and no AI/LLM call anywhere
in this codebase. Birth data you enter never leaves your machine/browser —
it is only ever passed to local JavaScript functions.

## 4. Where are the ephemeris files?

There are none, by design (see §1) — `astronomy-engine` needs no data
files. The `public/` directory has no ephemeris data in it. If a later
phase switches to a file-based engine (e.g. real Swiss Ephemeris `.se1`
data), this is where those files would live, loaded via a relative path,
never fetched remotely.

## 5. How do I run this?

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

Other scripts:

```bash
npm run build     # production static build, output in dist/
npm run preview   # preview the production build locally
npm run test      # run the automated/verification test suite (vitest)
npm run lint      # oxlint
```

`npm run build` produces a static `dist/` folder with no server-side code,
which can be opened/hosted entirely offline (e.g. via `npm run preview`,
or any static file server, or eventually packaged into a local desktop
app).

## 6. What does Phase 1 support?

Calculations (all local, Tropical zodiac, no ayanamsa applied):

- Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
  — geocentric apparent ecliptic longitude, zodiac sign, degree/minute/
  second within sign, house placement, retrograde status (from actual
  longitudinal speed, not assumption)
- ASC (Ascendant) and MC (Midheaven)
- 12 house cusps, **Placidus** system only
- Local birth time → UTC → Julian Day conversion, with an explicit,
  independently-testable conversion step (never treats local time as UTC)
- Basic input validation (latitude -90..90, longitude -180..180, UTC
  offset range) and a clear on-screen error if the ephemeris engine fails
  to load or inputs are invalid

House system selector currently offers Placidus only. The house-system
dispatch in `src/astrology/houses.js` is written so Whole Sign, Equal, and
Regiomontanus can be added later as additional strategies without changing
any caller — they are not implemented yet.

## 7. What does Phase 1 NOT support?

Deferred to later phases, unchanged from Phase 1:

- Classical/essential/accidental dignities
- Vedic / sidereal astrology, nakshatras, ayanamsa
- Any interpretation: personality, career, relationship, psychological,
  or AI-generated readings/summaries of any kind
- Chart comparison (synastry), transits, progressions
- Chart wheel graphics, PDF/Excel export
- Birth place autocomplete / geocoding (requires manually entering
  latitude, longitude, and UTC offset — a local place-name database is
  planned for a future phase, explicitly *not* a geocoding API)
- House systems other than Placidus

This software calculates. It does not interpret. Interpretation is left to
you, by design.

---

## Phase 2: Modern Western Astrology (26 Points)

Phase 2 adds a unified data model (`src/astrology/model.js`) and 16 new
points on top of the verified Phase 1 planet/house engine, organized into
four categories. Every point (implemented or not) is exposed through
`chart.points` with the same shape — see `buildPoint()` in
`src/astrology/model.js`.

### 7a. The 26-point target and what's implemented

| # | Point | Status | Source module |
|---|---|---|---|
| 1-10 | Sun … Pluto | ✅ Implemented (Phase 1) | `planets.js` |
| 11-14 | ASC, MC, DSC, IC | ✅ Implemented | `houses.js` (unchanged) + `modernWestern.js` |
| 15 | North Node | ✅ Implemented (true & mean) | `nodes.js` |
| 16 | South Node | ✅ Implemented (derived) | `nodes.js` |
| 17 | Black Moon Lilith | ✅ Implemented (mean & true/osculating) | `lilith.js` |
| 18 | Part of Fortune | ✅ Implemented | `partOfFortune.js` |
| 19 | Vertex | ✅ Implemented | `vertex.js` |
| 20 | East Point | ✅ Implemented | `vertex.js` |
| 21 | Chiron | ❌ Not implemented — see §7f | `asteroids.js` (status only) |
| 22 | Ceres | ❌ Not implemented — see §7f | `asteroids.js` |
| 23 | Pallas | ❌ Not implemented — see §7f | `asteroids.js` |
| 24 | Juno | ❌ Not implemented — see §7f | `asteroids.js` |
| 25 | Vesta | ❌ Not implemented — see §7f | `asteroids.js` |
| 26 | Eros | ❌ Not implemented — see §7f | `asteroids.js` |

**20 of 26 implemented.** The 6 unimplemented ones are asteroids/centaurs —
see §7f for exactly why, and what would unlock them. Nothing is silently
omitted: unimplemented points still appear in `chart.points` with
`absoluteLongitude: null` and a `meta.reason` string, and the UI renders
them as an explicit "Not Implemented" row rather than hiding them.

### 7b. North/South Node convention

Investigated first (as required): `astronomy-engine`'s `Body` enum has no
node entry at all, and its `SearchMoonNode()` only finds the *times* of
actual latitude=0 crossings, not an instantaneous longitude — so neither
convention comes "for free" from the library. Both are computed locally in
`src/astrology/nodes.js`:

- **True Node** (default): the instantaneous osculating ascending node,
  computed from the Moon's real position and velocity vectors via
  `h = r × v`, node direction `= k × h`. Standard orbital mechanics, no
  dependency added.
- **Mean Node**: Meeus's low-precision secular polynomial (*Astronomical
  Algorithms* 2nd ed., eq. 22.2/47.7).

Dev-time cross-check against real Swiss Ephemeris (see §7g for methodology):
True Node agrees to **2.9 arcsec**; Mean Node to **10.8 arcsec** (nutation-
scale, expected for a deliberately low-precision mean-element series).

The UI's Node Type selector and every North/South Node result's
`meta.nodeType` field make the convention explicit — `"true"` or `"mean"` —
never silently mixed. South Node is always `northNode + 180°`, never
computed independently (`sourceType: "derived"`).

### 7c. Black Moon Lilith convention

This is the **apogee of the Moon's orbit**, not the asteroid 1181 Lilith
(that asteroid is not implemented — see §7f — and is a completely different
body; substituting it would have been wrong, so it wasn't). Both
conventions computed locally in `src/astrology/lilith.js`:

- **Mean** (default): mean lunar longitude minus mean lunar anomaly, +180°
  (Meeus eq. 47.1/47.2). Cross-check vs Swiss Ephemeris: **~149 arcsec
  (~2.5′)**.
- **True/Osculating**: instantaneous apogee direction from the Moon's
  Laplace-Runge-Lenz (eccentricity) vector. Cross-check: **~96 arcsec
  (~1.6′)**.

**Both exceed the project's 1-arcminute target — disclosed, not hidden.**
This is a known, inherent property of Black Moon Lilith, not a bug: apsidal
(apogee/perigee) direction is far more perturbation-sensitive than nodal
direction, and different lunar theories genuinely disagree on the secular
"mean elements" used for Mean Lilith (a well-known source of cross-software
disagreement in real astrology tools, not unique to this project). No
arbitrary offset was introduced to hide this. `meta.lilithType` on every
result states which convention produced it.

### 7d. Part of Fortune day/night formula

Sect is determined from the **Sun's actual geometric altitude** at the
birth instant/location (via `astronomy-engine`'s own `Equator()`/
`Horizon()`), never a fixed clock-time range:

- Day chart (Sun above horizon): `Fortune = ASC + Moon − Sun`
- Night chart (Sun below horizon): `Fortune = ASC + Sun − Moon`

Every result carries `meta.sect` (`"day"`/`"night"`) and
`meta.formulaUsed` — no interpretation is attached.

### 7e. Vertex and East Point convention

**East Point here means the Equatorial Ascendant** — explicitly not the
same thing as ASC, Vertex, or the Aries Point (0° Aries). It is the
ecliptic point whose right ascension equals RAMC+90°, a closed form
structurally identical to the verified MC formula. Cross-check vs Swiss
Ephemeris (`ascmc[4]`, "equatorial ascendant"): **0.089 arcsec**.

**Vertex** is the ecliptic/prime-vertical crossing on the western side
(azimuth = 270°, astronomy-engine convention: 0=N, 90=E, 180=S, 270=W),
found by numeric root-finding using `astronomy-engine`'s own
`Horizon()` — not a half-remembered closed-form shortcut. The antipodal
crossing (azimuth=90°, the Anti-Vertex) is explicitly not returned.
Cross-check vs Swiss Ephemeris (`ascmc[3]`, "Vertex"): **0.003 arcsec**.

### 7f. Asteroids/Centaurs — why 6 of 26 points are not implemented

Investigated first, as required: `astronomy-engine`'s `Body` enum contains
only the Sun, Moon, and the 8 classical/modern planets — **no asteroid
support and no orbital-element data for them.** Unlike the points above,
asteroid positions cannot be derived from spherical-astronomy first
principles; they require real perturbation-quality ephemeris data.

Two options were considered and **neither was silently adopted**:

- **Hand-rolled Keplerian propagation** from published osculating elements
  at some reference epoch — **rejected**. Accuracy degrades with distance
  from the epoch (ignores planetary perturbations), which is exactly the
  "invent/approximate" outcome this project's rules prohibit.
- **Swiss Ephemeris**, via a WASM wrapper (`sweph-wasm`) — investigated at
  dev-time only (temporary devDependency, never shipped) purely to check
  feasibility. Findings: Chiron/Ceres/Pallas/Juno/Vesta ARE present in the
  base Swiss Ephemeris asteroid data file bundled with that package (no
  extra download); **Eros (433) is not** — it needs a separate per-asteroid
  file (`se00433s.se1`) that is not bundled anywhere and would require a
  network fetch this project does not make, independent of any other
  decision.

Adopting Swiss Ephemeris as a **permanent production dependency** is an
AGPL-3.0 licensing decision with real commercial implications — per this
project's own rule, that requires the user's explicit sign-off, not a
unilateral choice made in code. **That decision has been raised separately
and is not yet resolved** — see the Phase 2 final report. Until decided,
all 6 asteroid/centaur points remain explicitly marked "Not Implemented"
with their exact reason, both in `chart.points` and in the UI — never
fabricated, never silently dropped.

### 7g. Independent validation methodology

Every non-trivial Phase 2 formula above (True Node, Mean Node, Mean
Lilith, True Lilith, Vertex, East Point) was cross-checked during
development against **real Swiss Ephemeris** (`sweph-wasm`, run fully
offline — its bundled `.wasm` binary and ephemeris data files loaded via
Node's `fs`, no network call) for this project's verification chart. This
was a **temporary devDependency only**: it was installed, used to generate
the comparison numbers quoted above and in the final report, then
**uninstalled** — it is not in `package.json`, not in the committed repo,
and nothing in `src/` depends on it. Nothing was hardcoded or reverse-
engineered from its output; every formula here is a standard, independently
citable astronomical method (Meeus, or first-principles orbital mechanics)
that was verified, not fitted.

---

## 8. Swiss Ephemeris / license notes for future commercialization

This project currently uses **`astronomy-engine`, MIT licensed**
(see its `package.json`: `"license": "MIT"`, and the upstream repository
[cosinekitty/astronomy](https://github.com/cosinekitty/astronomy)). MIT is
permissive: you may use, modify, and ship this commercially without
publishing your own source code or paying royalties, provided the MIT
license/copyright notice for the library is retained somewhere reasonable
(e.g. an attributions/about page).

**This project does not currently use the Swiss Ephemeris (`swisseph`)
library**, so its licensing terms don't apply here. If a future phase
switches to it (e.g. for guaranteed bit-identical output with other
professional astrology software), be aware before shipping commercially:

- Swiss Ephemeris is dual-licensed by Astrodienst AG: **AGPL v3** (free,
  but AGPL requires that if you offer the software's functionality over a
  network, you must make your complete corresponding source code
  available to users — this has real implications for a closed-source
  commercial web app), **or** a **paid commercial license** from
  Astrodienst if you don't want AGPL's obligations.
- The underlying ephemeris data files themselves also carry their own
  usage terms from Astrodienst.
- None of this is legal advice — consult Astrodienst's actual license text
  and/or a lawyer before any commercial release that uses Swiss Ephemeris.

If this project stays on `astronomy-engine`, the main thing to keep in
mind commercially is simply retaining the MIT attribution notice.

**Phase 2 dependency status: unchanged from Phase 1.** Zero new production
dependencies were added — `package.json`'s `dependencies` still list only
`astronomy-engine`, `react`, and `react-dom`, all MIT/permissive. `sweph-
wasm` (AGPL-3.0) was used only as a temporary devDependency for
verification during development (see §7g) and has been uninstalled; it
never appears in `package.json` or the shipped bundle. The offline/no-API
status described in §1-4 holds identically for everything in Phase 2 — no
new network dependency, no new API, of any kind.

## 9. Known accuracy limitations (unresolved)

Disclosed here rather than buried in code comments:

- **Mean Black Moon Lilith**: ~2.5′ from Swiss Ephemeris's SE_MEAN_APOG —
  exceeds the project's 1′ target. Root cause: differing lunar-theory
  "mean elements" conventions across astronomy libraries — a known,
  general source of disagreement between astrology programs for this
  specific point, not unique to this implementation. See §7c.
- **True/Osculating Black Moon Lilith**: ~1.6′ from Swiss Ephemeris's
  SE_OSCU_APOG — also exceeds the 1′ target. Root cause: apsidal direction
  is highly sensitive to solar perturbation, more than the two-body
  osculating extraction used here captures. See §7c.
- **Asteroids/Centaurs (Chiron, Ceres, Pallas, Juno, Vesta, Eros)**: not
  implemented at all — see §7f. This is a known gap, not an accuracy
  issue, pending the Swiss Ephemeris dependency decision.

Everything else validated in Phase 2 (True Node, Mean Node, Part of
Fortune's day/night sect logic, Vertex, East Point) agreed with real Swiss
Ephemeris to well under 1 arcminute — most under 3 arcseconds.

---

No interpretation is generated anywhere in this codebase, by design:

```
Birth Data → Accurate Astronomical Calculation → Structured Astrology Data → Human Interpretation
```

Software calculates. You interpret.
