# Personal Astrology Workspace｜个人占星工作台

A private, local-first astrology calculation tool. This is **not** related
to any other project — it has its own codebase, its own dependencies, and
no shared code, credentials, or services with anything else.

**Status:** Phase 1 (core Tropical Western calculation engine), Phase 2
(the 26-point Modern Western data model), Phase 3A (Classical essential
dignity), Phase 3B (Classical sect & planetary condition), and Phase 3C
(accidental/operational condition — see §10-12) are implemented. No
interpretation, no AI, no Vedic/Hayz/reception/aspect systems yet.

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
| 17 | Black Moon Lilith | ✅ Implemented (mean & osculating) | `lilith.js` |
| 18 | Part of Fortune | ✅ Implemented | `partOfFortune.js` |
| 19 | Vertex | ✅ Implemented | `vertex.js` |
| 20 | East Point | ✅ Implemented | `vertex.js` |
| 21 | Chiron | ❌ Not implemented — see §7f | `asteroids.js` (status only) |
| 22 | Ceres | ❌ Not implemented — see §7f | `asteroids.js` |
| 23 | Pallas | ❌ Not implemented — see §7f | `asteroids.js` |
| 24 | Juno | ❌ Not implemented — see §7f | `asteroids.js` |
| 25 | Vesta | ❌ Not implemented — see §7f | `asteroids.js` |
| 26 | Eros | ❌ Not implemented — see §7f | `asteroids.js` |

**Implementation status by category: Planets 10/10, Angles 4/4, Nodes &
Calculated Points 6/6, Asteroids & Centaurs 0/6 — 20/26 overall.** The UI
shows this exact breakdown (not a bare "26 Points" claim) at the top of
the Modern Western section and per group heading. The 6 unimplemented
points are all asteroids/centaurs — see §7f for exactly why, and what
would unlock them. Nothing is silently omitted: unimplemented points still
appear in `chart.points` with `absoluteLongitude: null`, `sign: null`,
etc. and a `meta.reason` string — never fake coordinates — and the UI
renders them as an explicit "Not Implemented" row rather than hiding them.

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
conventions computed locally in `src/astrology/lilith.js`, using the
literal `meta.lilithType` values `"mean"` and `"osculating"`
(`"osculating"`, not `"true"` — chosen to match the term Swiss Ephemeris
itself uses for this convention, SE_OSCU_APOG, avoiding confusion with the
Node's separate "true"/"mean" terminology):

- **Mean** (project default): mean lunar longitude minus mean lunar
  anomaly, +180° (Meeus eq. 47.1/47.2). Cross-check vs Swiss Ephemeris:
  **~149 arcsec (~2.5′)**.
- **Osculating**: instantaneous apogee direction from the Moon's
  Laplace-Runge-Lenz (eccentricity) vector. Cross-check: **~96 arcsec
  (~1.6′)**.

**Both exceed the project's 1-arcminute target — disclosed, not hidden.**
Black Moon Lilith is treated in this project as a **convention/model-
dependent calculated point, not an inaccurate or invalid one**: apsidal
(apogee/perigee) direction is far more perturbation-sensitive than nodal
direction, and different lunar theories genuinely disagree on the secular
"mean elements" used for Mean Lilith (a well-known source of cross-software
disagreement in real astrology tools, not unique to this project). No
arbitrary offset was introduced to hide this. Every Lilith result carries
`meta.lilithType` (which convention produced it) and
`meta.conventionNote` (the plain-language explanation above, verbatim, so
the UI/raw-data view never has to editorialize this itself).

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
project's own rule, that required the user's explicit sign-off, not a
unilateral choice made in code. **Resolved: the user chose to stay
MIT-only.** `sweph-wasm`/Swiss Ephemeris will not be added as a production
dependency; all 6 asteroid/centaur points remain explicitly marked "Not
Implemented" with their exact reason, both in `chart.points` and in the
UI — never fabricated, never silently dropped, never given fake
coordinates. Their placeholder rows are preserved in the UI (not removed)
specifically so the status stays visible.

### 7g. Independent validation methodology

Every non-trivial Phase 2 formula above (True Node, Mean Node, Mean
Lilith, Osculating Lilith, Vertex, East Point) was cross-checked during
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

### 7h. Permanent chart metadata and provenance fields

Every `calculateChart()` result permanently stores, at `chart.meta`:

```
zodiacType: "tropical"
houseSystem: "placidus"
nodeType: "true" | "mean"
lilithType: "mean" | "osculating"
```

These are never silently mixed — a chart computed with `nodeType: "mean"`
carries that exact string, not an inferred or default one, and the same
value is echoed onto every North/South Node point's own `meta.nodeType`
(same for `lilithType` on the Lilith point).

For every calculated point (nodes, Lilith, Part of Fortune, Vertex, East
Point), `chart.points[i].meta` additionally carries, where applicable:

- `calculationMethod` — plain-language description of the actual method
  used (e.g. "osculating orbital element (Moon r x v cross product)")
- `calculationConvention` — which named convention this is (e.g. "True
  Node", "Osculating Apogee", "Night formula (ASC + Sun - Moon)")
- `verificationDifferenceArcsec` — the measured dev-time deviation from
  real Swiss Ephemeris (see §7g), or `null` where no independent
  cross-check was performed (e.g. Part of Fortune, whose accuracy is
  inherited arithmetically from the already-verified ASC/Sun/Moon
  longitudes rather than checked as its own separate quantity)

The "Raw Calculation Data" section in the UI exposes all of these columns
directly, alongside the full `meta` object as JSON, specifically so every
number on the page is traceable back to its method and its measured
agreement (or disagreement) with an independent source.

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

## 9. Known limitations, disclosed plainly

- **Black Moon Lilith is a convention/model-dependent calculated point**,
  not an inaccurate or invalid one (see §7c). Measured dev-time deviation
  from Swiss Ephemeris: Mean ~2.5′ (SE_MEAN_APOG), Osculating ~1.6′
  (SE_OSCU_APOG) — both above the project's general 1′ target for
  calculated points, but for a well-understood reason (differing lunar
  "mean elements" conventions, and apsidal direction being far more
  perturbation-sensitive than nodal direction) rather than a defect.
  `meta.verificationDifferenceArcsec` and `meta.conventionNote` on every
  Lilith result state this directly.
- **Asteroids/Centaurs (Chiron, Ceres, Pallas, Juno, Vesta, Eros)**: not
  implemented, by decision — see §7f. This is a known, intentional gap,
  not an accuracy issue.

Everything else in Phase 2 (True Node, Mean Node, Part of Fortune's
day/night sect logic, Vertex, East Point) agreed with real Swiss Ephemeris
to well under 1 arcminute — most under 3 arcseconds.

---

## 10. Phase 3A: Classical Astrology — Essential Dignity

A **rule layer**, not a second astronomical engine: it consumes the
already-verified Tropical longitudes from Phase 1/2
(`src/astrology/planets.js`, `houses.js`) and applies traditional
dignity/debility rules on top, in `src/astrology/classical/`. Sect
(day/night) is read from the already-computed Part of Fortune point rather
than recomputed — there is exactly one sect calculation in the codebase.

Applies **only** to the seven traditional planets (Sun through Saturn) —
never to Uranus/Neptune/Pluto, asteroids, Lilith, Nodes, Vertex, East
Point, or Part of Fortune.

**Conventions used** (stored permanently in `chart.classical.meta`, never
silently changed): Tropical zodiac, traditional domicile rulership,
Dorothean triplicity (day/night/participating rulers — distinct from
Ptolemy's simpler scheme and Lilly's Renaissance variant), Egyptian Terms
(the older Hellenistic bounds table, not the later Ptolemaic revision),
Chaldean Faces/decans.

**Reference table validation** (per project rule — not relied on from
memory alone): Egyptian Terms, Dorothean Triplicity, traditional
exaltation degrees, and Chaldean Faces were each cross-checked during
development against multiple independent traditional-astrology sources.
The Egyptian Terms table additionally passed two internal consistency
checks that a mistranscription would very likely have broken: every sign
sums to exactly 30°, and the five planets' total degrees across the full
zodiac (57/79/66/82/76, summing to 360) match an independently-cited
reference breakdown exactly. No disagreement between sources was found for
any of the four tables as specifically scoped by this project (Dorothean
triplicity, Western tropical exaltation degrees, the Egyptian — not
Ptolemaic — term table, Hellenistic Chaldean faces).

Dignities stack (evaluated independently, never mutually exclusive
if/else): Domicile +5, Exaltation +4, Triplicity +3 (active sect ruler
only), Term +2, Face +1, Detriment −5, Fall −4. Peregrine = none of the
five positive dignities active (Detriment/Fall do not by themselves
determine peregrine status). `immediateDispositor` is returned per planet
(dispositor chains are not implemented — future phase).

Not implemented yet as of Phase 3A, by design: accidental dignity,
angularity scoring, combustion/cazimi/under the beams, hayz, almuten,
reception, dispositor chains, aspects, Vedic astrology, transits,
progressions. (Combustion/cazimi/under the beams were added in Phase 3B —
see §11.)

Zero new dependencies, zero runtime API/network calls — pure local rule
evaluation over already-computed data.

---

## 11. Phase 3B: Classical Sect & Planetary Condition

Reports **technical condition only** — no accidental dignity score, no
interpretation. Adds `condition` to each of the seven traditional
planets' `chart.classical.planets[i]` entries, alongside (never replacing)
the Phase 3A `dignity` data.

**Chart sect**: reused, not recalculated — read from the same
already-computed Part of Fortune point Phase 3A uses (ultimately the
Sun's real astronomical altitude, never AM/PM).

**Planetary sect family**: Sun/Jupiter/Saturn fixed diurnal,
Moon/Venus/Mars fixed nocturnal, Mercury variable (see below).
`isOfSect` means only "this planet's sect family matches the chart's
sect" — it deliberately does **not** require correct hemisphere,
masculine/feminine sign, or any other Hayz condition (Hayz is a distinct,
unimplemented, future concept — not to be confused with this).

**Mercury's sect** follows its solar phase, not a fixed family — documented
in full in `src/astrology/classical/mercurySect.js`: the signed elongation
`((mercuryLon - sunLon + 540) % 360) - 180` is computed (correctly
handling the 0/360 wraparound); negative means Mercury trails the Sun in
zodiacal longitude (oriental, rises before the Sun, morning star, this
project's convention: diurnal); positive means occidental (evening star,
nocturnal). Cross-checked during development against the traditional
definition ("oriental of the Sun" = positioned west of the Sun at a lower
effective zodiacal longitude, because lower-longitude objects rise
first) — confirmed by two independent traditional-astrology sources.

**Solar condition** (cazimi/combust/under the beams/free), per William
Lilly's *Christian Astrology* (1647), cross-checked against two
independent sources (a modern learn-astrology summary and the Skyscript
astrological glossary), both agreeing with Lilly's original figures:

```
Cazimi:          <= 0 deg 17'            (this project's exact convention)
Combust:         >  0 deg 17'  and <= 8 deg 30'
Under the Beams: >  8 deg 30'  and <= 17 deg
Free from Beams: >  17 deg
```

**Known historical variation, documented, not silently merged**: some
sources cite the Cazimi orb as 17'30" (half the Sun's mean apparent
diameter) rather than a flat 17'. This project uses exactly 17'00" as its
stated convention — the 17'30" variant is real but not used here. Any
future change to these thresholds must be a deliberate, documented one.

**Motion/retrograde**: reused verbatim from the already-verified Phase 1
`speedDegPerDay`/`retrograde` — never recalculated.

**Station status**: investigated, not implemented. The existing
astronomy layer does provide a reliable instantaneous longitudinal speed
(already exposed as `condition.motion.longitudeSpeed`), but this project
found no single sourced, agreed-upon threshold for calling a planet
"stationary" (real ephemeris programs vary this by planet and by
context) during the time available, so **no `isStationary` flag is
invented**. The raw speed is stored so a future phase can add this once
a specific, cited method is chosen — consistent with the project's
"do not invent thresholds" rule.

**Above/below horizon**: real geometric altitude, not house number.
Computed per-planet via `astronomy-engine`'s own `Equator()` (true
right ascension/declination of date — not an ecliptic-latitude=0
shortcut, since most planets have non-negligible ecliptic latitude) and
`Horizon()`, the same transform already relied upon and verified
elsewhere in this codebase (Part of Fortune's sect, Vertex, East Point).

Zero new dependencies, zero network calls.

---

## 12. Phase 3C: Accidental Condition & Operational Strength

"How much practical ability does the planet have to act?" — reports
technical facts only, **no combined score**. `operationalCondition` on
each of the seven traditional planets adds:

- **House angularity** (`housePosition`): angular (1/4/7/10), succedent
  (2/5/8/11), or cadent (3/6/9/12), derived purely from the already-
  verified `planet.house` — no new house-placement logic, no strength
  value assigned.
- **Angle proximity** (`angleProximity`): shortest zodiacal distance to
  ASC/IC/DSC/MC (wraparound-safe) plus `nearestAngle` — metadata only; a
  cadent planet near an angle is never auto-promoted to angular, and no
  "angular orb" is defined anywhere in this project.
- **Speed** (`speed`): see below.
- **Motion, solar, sect, horizon**: reused verbatim from Phase 3B
  (`condition.motion`/`.solar`/`.sect`/`.horizon`) — nothing recalculated,
  confirmed by test.

**Planetary speed / swift-slow research and decision**: cross-checked
against William Lilly's *Christian Astrology* (1647, Ch. XIII) and a
second modern source (Anthony Louis, citing Lilly directly) for Sun,
Moon, Mars, Jupiter, Saturn — consistent mean daily motions found:

```
Moon:     13 deg 10' 36" / day       Jupiter:  0 deg 04' 59" / day
Sun:       0 deg 59' 08" / day       Saturn:   0 deg 02' 01" / day
Mars:      0 deg 31' 27" / day
```

Method (Lilly's, as corroborated): direct comparison of *absolute* daily
speed against the mean — swift if above, slow if below, **no invented
tolerance band**. Absolute value is used specifically so retrograde is
never auto-converted to "slow" — `motion.direction` and `speed.status`
are always reported as separate facts (verified by test with a synthetic
fast-retrograde case classified "swift").

**Mercury/Venus — a genuine sourced disagreement, resolved by explicit
decision, not silently**: Lilly assigns both the Sun's rate (59'08",
the "triune system" convention). A second historical author, Ivy
Goldstein-Jacobson, assigns each its own faster rate instead — though a
modern secondary review separately flags her specific transcribed
figures as possibly erroneous. This was reported to the project owner
rather than resolved unilaterally; **the owner chose Lilly's convention**,
so this project uses 59'08"/day for both, matching Lilly's original table
and most modern traditional software's default. The alternative is
documented in `rules/planetarySpeed.js` but not used.

**Mercury and Venus swift/slow classification follows William Lilly's
Christian Astrology convention using 59′08″/day as the reference motion.**

This convention is stored **permanently in the calculation output itself**,
not only in comments/README: every traditional planet's
`operationalCondition.speed` carries `speedConvention: "william_lilly"`
and a human-readable `referenceMeanSpeedFormatted` string (e.g.
`"59′08″/day"`, `"13°10′36″/day"`), and `chart.classical.meta` carries the
same `speedConvention: "william_lilly"` value. The other Lilly reference
mean motions currently in use, all under this same convention: Sun
59′08″/day, Moon 13°10′36″/day, Mars 31′27″/day, Jupiter 04′59″/day,
Saturn 02′01″/day (matching `REFERENCE_MEAN_SPEED_FORMATTED` exactly).

**Stationary status**: still not implemented (Phase 3B's decision stands
unchanged) — no planet-specific, sourced threshold was found for this
phase either. Raw `longitudeSpeed` remains available regardless.

No `accidentalScore`, `operationalScore`, `strengthScore`, or
`totalClassicalScore` exists anywhere — verified by test. Phase 3A's
`totalEssentialScore` remains the only score in the codebase.

Zero new dependencies, zero network calls.

---

## 13. Phase 3D: Hayz, Halb & Sect Condition

A traditional "planetary contentment" layer on top of Phase 3B/3C — **rule
logic only**, no new astronomical calculation, no score. Adds
`sectConditionDetail` to each of the seven traditional planets in
`chart.classical.planets`, plus a "Sect Condition｜派别条件" section in the
Classical Astrology UI (summary table + per-planet ✓/— breakdown).

**Sign gender** (`rules/signGender.js`): a direct rule table, not inferred
from element at runtime — masculine: Aries, Gemini, Leo, Libra,
Sagittarius, Aquarius; feminine: Taurus, Cancer, Virgo, Scorpio,
Capricorn, Pisces (Ptolemy's fire/air vs. earth/water assignment).
Cross-checked against Skyscript and deVore's *Encyclopedia of Astrology* —
fully consistent across sources, no disagreement found for this table.

**Hayz** (`hayzHalb.js`) — the traditional three-part test, all three legs
reused verbatim from already-verified upstream data, nothing recalculated:

```
Diurnal planet:  chart is DAY   AND above horizon AND in a masculine sign
Nocturnal planet: chart is NIGHT AND below horizon AND in a feminine sign
```

`sectConditionDetail.hayz` reports the three legs independently
(`chartSectMatches`, `hemisphereMatches`, `signGenderMatches`) alongside
the final `isHayz`, so a non-Hayz planet's specific failing condition(s)
are always visible — not just a single boolean. Cross-checked against
Skyscript's glossary and William Lilly's *Christian Astrology*, which
agree on this exact three-part definition.

**Halb — revised convention (base condition beneath Hayz, not disjoint
from it)**: historical authors vary in their exact definitions of Halb.
This project's initial Phase 3D implementation defined Halb as a narrow
intermediate category deliberately disjoint from Hayz. On review, that
was revised to follow the more common traditional pattern instead —
consistent with, among others, John Frawley's *The Horary Textbook* (as
summarized by Skyscript), which uses "Halb" as a synonym for the sect/
hemisphere condition alone, with Hayz built on top of it as a fuller
condition:

```
HALB = chart sect matches the planet's effective sect
       AND the planet is on the correct side of the horizon for that sect
       (diurnal: above horizon by day; nocturnal: below horizon by night)

HAYZ = HALB, PLUS the planet is in a sign of the matching gender
       (diurnal: masculine sign; nocturnal: feminine sign)
```

This is stored as `hayzHalbConvention: "traditional_halb_base_hayz_full"`
in `chart.classical.meta`, permanently in the calculation output, not
only in comments. Because Hayz is Halb plus one further condition,
**`isHayz === true` implies `isHalb === true`** — the two are reported as
independent booleans (`sectConditionDetail.hayz.isHayz` and
`sectConditionDetail.halb.isHalb`) and are **not** forced mutually
exclusive (verified by exhaustive test across the full sign/sect/
hemisphere input space, confirming every Hayz case also has Halb true,
and that Halb-without-Hayz cases exist too). A separate, genuinely
mutually-exclusive `sectConditionLabel` is provided for display so the UI
never shows confusing duplication — `"halb_only"` means Halb is true but
the sign-gender leg failed, so Hayz is not reached.

Other traditional sources still disagree with this project's specific
choice in various ways (e.g. some treat Halb as an intermediate category
separate from Hayz, as this project's own earlier implementation did) —
this variance is disclosed here and in `hayzHalb.js`'s doc comment rather
than hidden; the project owner made the explicit convention choice this
revision implements.

**Mercury** uses its already-computed oriental/occidental
`effectiveSect` from Phase 3B (`condition.sect.effectiveSect`) with no
separate recalculation — same code path as every other planet, including
Sun and Moon (verified by test that Sun's `sectConditionDetail` is
identical to calling `computeSectConditionDetail()` directly with its own
upstream inputs).

`sectConditionLabel` is an optional, mutually-exclusive convenience
summary — `"hayz"` | `"halb_only"` | `"of_sect_only"` | `"out_of_sect"` —
derived from, not additional to, the underlying `isHayz`/`isHalb`
booleans (which are not mutually exclusive).

**No score of any kind** (`hayzScore`, `sectScore`,
`traditionalStrengthScore`, or otherwise) exists anywhere in this module
— verified by test.

**Verification chart** (1994-11-21, 01:44:00 +08:00, 1.8548°N 102.9325°E,
Placidus — chart sect: **night**) — computed from the rules, not assumed
in advance:

| Planet  | Effective Sect | Of Sect | Sign Gender | Horizon | Hayz | Halb | Sect Condition |
|---------|-----------------|---------|-------------|---------|------|------|-----------------|
| Sun     | Diurnal         | No      | Feminine    | Below   | —    | —    | Out of Sect     |
| Moon    | Nocturnal       | Yes     | Masculine   | Above   | —    | —    | Of Sect Only    |
| Mercury | Diurnal         | No      | Feminine    | Below   | —    | —    | Out of Sect     |
| Venus   | Nocturnal       | Yes     | Feminine    | Below   | ✓    | ✓    | **Hayz**        |
| Mars    | Nocturnal       | Yes     | Masculine   | Above   | —    | —    | Of Sect Only    |
| Jupiter | Diurnal         | No      | Feminine    | Below   | —    | —    | Out of Sect     |
| Saturn  | Diurnal         | No      | Feminine    | Below   | —    | —    | Out of Sect     |

Exactly one planet (Venus) reaches full Hayz in this chart, and — under
the revised base/full convention — it is also Halb, since Hayz implies
Halb. No other planet reaches even `halb_only` in this particular chart
(each non-Hayz planet fails either the sect or the hemisphere leg
outright); this emerged from the rules, it was not targeted in advance.

Zero new dependencies, zero network calls. All 184 tests pass (159
carried over from Phase 1–3C unchanged, plus 25 Phase 3D tests reflecting
this revision).

---

No interpretation is generated anywhere in this codebase, by design:

```
Birth Data → Accurate Astronomical Calculation → Structured Astrology Data → Human Interpretation
```

Software calculates. You interpret.
