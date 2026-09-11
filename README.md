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

## 14. Phase 3E: Dispositor, Reception & Mutual Reception

A traditional relationship layer on top of Phase 3A's locked dignity
tables — **rule logic only**, no new astronomical calculation, no new
rulership/triplicity/term/face table, no score. Adds `dispositor` and
`reception` to each of the seven traditional planets in
`chart.classical.planets`, plus `chart.classical.receptionMatrix` and
`chart.classical.mutualReceptions`.

**Scope: dignity relationship, not settled "operative" reception.**
Phase 3E records a raw, directional DIGNITY RELATIONSHIP — "planet A
occupies a sign/degree dignified by planet B, therefore B hosts/receives
A" — across the five positive essential dignities. Historical authors
disagree on when this relationship should be called a *complete* or
*operative* reception: some medieval approaches additionally require an
aspect/application between the two planets before it "perfects," and/or
require the relationship to be by domicile or exaltation specifically,
or by two simultaneous minor dignities, before weighting it as
significant; broader traditional and modern usage instead calls any
single dignity relationship "reception" outright. Because this project
has not yet implemented aspects/application (a future phase), Phase 3E
deliberately does **not** decide that question — it preserves the raw
dignity relationships (including single minor-dignity ones) so a future
phase can evaluate operative/perfected reception under an explicitly
chosen convention, rather than presenting one historical convention as
already settled. This is recorded in the data itself via
`chart.classical.meta.receptionQualification: "not_yet_evaluated"` (see
Metadata, below) and is why the UI labels this section "Reception by
dignity — not yet qualified by aspect" rather than simply "Reception."

**Direction** (cross-checked against Wikipedia's "Reception (astrology)"
and Kerykeion's traditional-reception reference, consistent with each
other and with William Lilly's usage): if planet A occupies a sign/degree
dignified by planet B, **B receives A** — never the reverse. "Sun in
Libra" → Venus receives the Sun, not "the Sun receives Venus." Confirmed
for all five dignity types, not domicile alone. Self-reception (a planet
in its own dignity) is excluded throughout, per the project brief.

**Five dignities carry reception equally** — domicile, exaltation,
triplicity, term, face — per both sources above plus Skyscript's forum
consensus; no disagreement found about which dignities count. One
secondary source (astrolearn.com) suggests some authors require at least
two active minor dignities (triplicity/term/face) for a minor-only mutual
reception to be judged "valid." This project's brief explicitly specifies
not requiring matching or multiple dignity types, so that extra weighting
is not applied — disclosed here rather than silently omitted (this is a
practice-weighting nuance, not a disagreement about the core reception
definition, which is unanimous across all sources checked).

**Triplicity reception reuses Phase 3A's exact sect-dependent
`activeRuler`** (`rules/triplicity.js`, unchanged) — the same day/night
Dorothean ruler already used for essential dignity scoring, not a
separate reception-specific triplicity system.

**Immediate dispositor** (`dispositorChain.js`): traditional domicile
rulership only, reusing `getDispositor()` from the locked
`rules/rulership.js` — e.g. Scorpio → Mars, Aquarius → Saturn, Pisces →
Jupiter, never Pluto/Uranus/Neptune.

**Dispositor chain**: walks each successive dispositor's own *actual*
chart placement (not an abstract rulership graph) until a planet
disposits itself (`terminationType: "self_dispositor"`, `finalDispositor`
set) or a previously-visited planet recurs (`"loop"`,
`finalDispositor: null` — a dispositor loop, including the classic
"two planets in each other's domicile" case, is a legitimate structural
result, not an error). A visited-set check and the fixed 7-planet set
guarantee termination within at most 8 steps; a third `"unknown"`
termination type is kept only as a structurally-unreachable defensive
fallback, per the project brief's three-type contract.

**Reception matrix** (`reception.js`): all 42 ordered non-self pairs
among the seven traditional planets, each with the (possibly empty) list
of dignity types through which the receiver receives the received
planet. `receives`/`receivedBy` on each planet are inverse views of this
same matrix (receives = planets **this** planet receives; receivedBy =
planets that receive **this** planet) — verified by test to be exact
inverses.

**Mutual dignity reception** (not "perfect" or operative reception):
computed per unordered pair, never assumed — A receives B and B receives
A may be through the same dignity or different ones (not required to
match, per the brief). `isMutual: true` means only that the directional
dignity relationship holds in both directions, per the scope note above —
it is not a claim that the pairing perfects in the judgment sense.

**Mercury** is treated exactly like the other six planets — reception
depends on dignity rulership only; `getDignityRulersAt()`'s signature
carries no sect-family/oriental-occidental parameter at all, so there is
no code path through which Mercury's Phase 3B sect status could leak in.

**No score, no negative reception, no `receptionLevel`** anywhere in this
module (Parts H/I/J) — verified by test; only the five positive dignity
types ever appear as a reception type.

**Verification chart** (1994-11-21, 01:44:00 +08:00, 1.8548°N 102.9325°E,
Placidus — chart sect: **night**) — computed from the rules, not assumed
in advance. A structural finding specific to this chart: **no traditional
planet sits in its own domicile**, so every one of the seven dispositor
chains terminates in the same loop — the Sun (Scorpio) and Mars (Leo)
mutually disposit each other:

| Planet  | Sign     | Immediate Dispositor | Chain Termination | Final Dispositor |
|---------|----------|-----------------------|--------------------|-------------------|
| Sun     | Scorpio  | Mars                  | Loop (Sun↔Mars)    | None              |
| Moon    | Gemini   | Mercury               | Loop (Sun↔Mars)    | None              |
| Mercury | Scorpio  | Mars                  | Loop (Sun↔Mars)    | None              |
| Venus   | Scorpio  | Mars                  | Loop (Sun↔Mars)    | None              |
| Mars    | Leo      | Sun                   | Loop (Sun↔Mars)    | None              |
| Jupiter | Scorpio  | Mars                  | Loop (Sun↔Mars)    | None              |
| Saturn  | Pisces   | Jupiter               | Loop (Sun↔Mars)    | None              |

Complete mutual-reception list for this chart — four pairs, all emerging
from the calculation, none targeted in advance:

| Pair            | A Receives B         | B Receives A            |
|-----------------|-----------------------|---------------------------|
| Sun ↔ Mars      | Domicile              | Domicile, Triplicity      |
| Mercury ↔ Mars  | Term                  | Domicile, Triplicity      |
| Mars ↔ Jupiter  | Domicile, Triplicity  | Triplicity                |
| Jupiter ↔ Saturn| Domicile              | Term                      |

Mars also receives Venus through all four dignity types simultaneously
(domicile, triplicity, term, and face — Venus sits at 2°39′ Scorpio,
inside Mars's own term and face bounds as well as ruling the sign and
being the active night triplicity ruler), demonstrating that multiple
simultaneous reception types are preserved rather than collapsed.

Stored metadata (`chart.classical.meta`, existing keys preserved):
`receptionConvention: "traditional_five_positive_dignities"`,
`receptionQualification: "not_yet_evaluated"` (the Phase 3E/3F boundary
marker described above — not a placeholder for a later default, but an
explicit statement that Phase 3E takes no position on operative/perfected
reception), `rulershipSystem`, `triplicitySystem`, `termSystem`,
`faceSystem` (all unchanged from Phase 3A).

Zero new dependencies, zero network calls, **zero calculation changes**
in this refinement — the dignity matrix, dispositor chains, and mutual
reception results are numerically identical to the original Phase 3E
implementation; only terminology, documentation, and metadata changed.
All 221 tests pass (209 carried over from Phase 1–3E unchanged, plus 12
new regression tests for this refinement).

---

## 15. Phase 3F: Classical Aspects, Application & Separation

A technical aspect-geometry and relative-motion layer for the seven
traditional planets — **rule/geometry logic only**, no new astronomical
calculation, no perfection judgment. Adds `chart.classical.aspects`, 21
unordered pairs among the seven traditional planets.

**Five classical major aspects only** (Ptolemy's five, cross-checked
against renaissanceastrology.com's summary and multiple traditional
glossaries — no disagreement on the set itself): conjunction (0°),
sextile (60°), square (90°), trine (120°), opposition (180°). No modern
minor aspects (semisextile, semisquare, quincunx, sesquiquadrate,
quintile, etc.).

**Orb convention — a genuine sourced disagreement, resolved by explicit
decision, not silently**: research for this phase found two materially
different traditional orb/moiety tables using the same "moiety-sum"
method (allowed orb = sum of the two planets' individual half-orbs):
William Lilly's *Christian Astrology* (1647) table, and the older
Ptolemaic/Porphyry table (~2nd–8th century), whose values run roughly
**double** Lilly's for several planets (e.g. Sun ~15° vs Lilly's 8.5°).
This was reported to the project owner rather than resolved unilaterally;
**the owner chose Lilly's table**, for consistency with this project's
existing Lilly-based conventions already locked in Phase 3B (solar
condition thresholds) and Phase 3C (traditional mean daily motions).

```
Lilly's moieties (rules/planetaryMoiety.js):
Sun 8.5°   Moon 6.25°   Mercury 3.5°   Venus 4°
Mars 3.75°   Jupiter 6°   Saturn 5°
```

Allowed orb for a pair = sum of their two moieties (the "moiety
technique," attested from Claude Dariot, 16th century, onward, and
consistent with Lilly's own usage).

**Application/separation — from relative motion only, never static
longitude ordering**: a small forward-time numerical probe
(`PROBE_DT_DAYS = 0.01`, ~14.4 minutes) projects both planets forward
using their already-verified signed longitude speeds
(`speedDegPerDay`, Phase 3B/3C), recomputes the wrap-safe distance to
the *same* exact aspect angle, and compares — no re-selection of which
aspect is "nearest" occurs at the future point, so the probe cannot
"skip past" a different aspect. This handles direct/direct,
direct/retrograde, both-retrograde, the 0°/360° wraparound, and
opposition geometry uniformly, with **no retrograde special-casing**
(cross-checked against Skyscript's "applying and separating aspects"
forum discussion, which likewise defines application purely from the
changing distance to exactitude under each planet's actual motion).
Verified by dedicated tests where retrograde motion produces both an
applying and a separating result (never hard-coded either way).

**Exact aspect**: a strict `EXACT_EPSILON_DEGREES = 0.0003°` (~1
arcsecond) numerical-equality tolerance — this is *not* an interpretive
orb. An aspect is never called "exact" merely for being inside the
aspect orb; it must be within this tiny tolerance of the literal
geometric angle. (An earlier internal draft of the applying/separating
comparison mistakenly reused this same epsilon as a "no significant
change" buffer between the current and forward-probed orb, which caused
several genuinely-applying/separating pairs in the verification chart to
be misclassified "exact" — caught during self-testing before this phase
was reported as complete, and fixed by removing the epsilon from that
comparison entirely; "exact" is now returned only from the dedicated
current-position check.)

**Sign-based vs. degree-based aspect**: research found these are
materially different, historically layered traditions — whole-sign
("by sign") aspect doctrine predates and differs from the later
degree-based/Ptolemaic orb doctrine this project's primary `aspect`
field implements (Hellenistic astrology used whole-sign relations
without orbs at all; medieval astrology shifted to degree-based orbs).
Rather than silently picking one, **both are preserved as separate
facts** on every pair: `aspect` (degree-based, with orb) and
`signAspectRelation` (whole-sign, orb-free — conjunction/sextile/
square/trine/opposition purely by sign-distance, or `null` when the
signs are 1 or 5 apart, "in aversion," which whole-sign doctrine does
not treat as an aspect at all).

**Dexter/sinister**: researched (Skyscript's glossary describes the
rule — aspects cast against the order of the zodiac signs, following
diurnal motion, are "dexter" and considered more effective than
"sinister" ones cast with the order of the signs). The geometry (tied to
which planet is faster/primary in a given configuration) was judged not
unambiguous enough for a confident first implementation within this
phase's scope. **Deferred** — `chart.classical.meta.dexterSinisterStatus:
"deferred"` records this explicitly rather than silently omitting it.

**Reception integration**: each aspect pair carries `reception.aReceivesB`
/`reception.bReceivesA` as **linked, read-only metadata** referencing
Phase 3E's already-computed reception matrix — nothing is recomputed,
and Phase 3E's `receptionQualification: "not_yet_evaluated"` is
untouched (this phase does not silently mark it "complete").

**No score, no perfection judgment**: `perfectionCandidate` exposes only
`{isApplying, currentOrb, relativeMotionSupportsPerfection}` — neutral
technical facts ("this pair is moving toward exact aspect"), never a
claim that an event "will happen." No `willPerfect`, `horaryOutcome`, or
similar field exists anywhere.

**Verification chart** (1994-11-21, 01:44:00 +08:00, 1.8548°N 102.9325°E,
Placidus) — all 21 unique pairs checked, computed from the rules, not
assumed in advance: **9 pairs within the Lilly moiety orb**, **5
applying**, **4 separating**, **0 exact** (no pair happens to sit within
1 arcsecond of a literal exact angle in this chart — expected, since
exact-to-the-arcsecond aspects are rare at any given moment):

| Pair | Aspect | Orb from Exact | Allowed Orb | Motion |
|---|---|---|---|---|
| Sun — Mars | Square | 5°06′ | 12°15′ | Separating |
| Sun — Jupiter | Conjunction | 2°18′ | 14°30′ | Separating |
| Sun — Saturn | Square | 7°37′ | 13°30′ | Applying |
| Moon — Venus | Trine | 7°57′ | 10°15′ | Applying |
| Moon — Mars | Sextile | 1°38′ | 10°00′ | Separating |
| Moon — Saturn | Trine | 11°05′ | 11°15′ | Applying |
| Venus — Saturn | Trine | 3°08′ | 9°00′ | Separating |
| Mars — Jupiter | Square | 2°48′ | 9°45′ | Applying |
| Jupiter — Saturn | Square | 9°55′ | 11°00′ | Applying |

Zero new dependencies, zero network calls. All 251 tests pass (221
carried over from Phase 1–3E unchanged, plus 30 new Phase 3F tests).

This phase does **not** yet equal horary perfection — Translation/
Collection of Light, Prohibition, Frustration, Refranation, Void of
Course, and final perfection judgment remain unimplemented and are left
for a future phase.

---

## 16. Phase 3G-A: Direct Perfection & Future Motion Validation

Phase 3F answers "is this aspect applying **right now**?" from a tiny
(0.01-day) forward probe that captures only the instantaneous local
trend. Phase 3G-A answers a genuinely different question: **does that
applying aspect actually reach exact geometric contact in the future**,
before a station or retrogradation prevents it? This absolutely requires
recalculating real future planetary positions — the Phase 3F probe is
explicitly not sufficient for it, and this phase never extrapolates from
a constant current speed. Adds `chart.classical.directPerfection`, one
entry per Phase 3F pair (21 total; only the 5 Phase 3F found "applying"
run a real search — the other 16 get an immediate, cheap non-candidate
result, per the project brief's performance requirement).

**Future positions**: recalculated via `computeLongitudeAndSpeed()`
(exported from the locked `planets.js`, reused verbatim — the exact same
method Phase 1 uses) — no competing longitude calculation, no new
production dependency, no network access.

**Event-search algorithm**: a coarse forward scan (`COARSE_STEP_DAYS =
0.25`, chosen conservatively against the Moon's ~13-15°/day maximum
motion) tracks the signed angular error to the currently-applying exact
aspect angle. When the scan detects a plausible sign change — filtered
to exclude the representation's own wraparound artifact at the point
exactly opposite the target (see "A genuine internal bug," below) — it
refines the crossing via deterministic bisection to
`DIRECT_PERFECTION_ROOT_TOLERANCE_DEGREES` (reused directly from Phase
3F's `EXACT_EPSILON_DEGREES`, ~1 arcsecond). The same coarse scan also
detects sign ingresses (30° boundary crossings) and station events
(speed sign changes) for both planets, each independently refined via
fixed-iteration bisection to sub-minute timestamp precision. The search
always locks onto the SAME physical aspect configuration Phase 3F
identified as applying — it never re-selects a different, later,
geometrically-closer aspect (an aspect other than conjunction/opposition
has two raw-longitude-difference mirrors, e.g. a trine shows up as a
120° or a 240° raw difference; which mirror the pair is actually on is
resolved once, at the start of the search, and held fixed throughout).

**Search horizon**: `DIRECT_PERFECTION_SEARCH_HORIZON_DAYS = 180` — an
explicit **software safety limit**, not a historical astrology doctrine
(kept as a separate metadata field for exactly this reason). 180 days is
generous enough to resolve even a slow Jupiter/Saturn-type applying
aspect through a full retrograde station and return to direct motion (a
typical outer-planet synodic retrograde loop runs roughly 100-150 days)
while remaining bounded rather than open-ended.

**Three distinct tolerances, not conflated**: the Lilly aspect orb
(Phase 3F, degrees-wide, decides whether an aspect exists at all) is
untouched by this phase; the root-finding tolerance
(`DIRECT_PERFECTION_ROOT_TOLERANCE_DEGREES`, ~1 arcsecond) decides when
a search has converged; resulting timestamp precision is a *derived*
quantity from that angular tolerance and the local relative angular
speed (typically sub-minute), not a separately chosen time value.

**Sign-ingress convention — a genuine sourced disagreement, resolved by
explicit decision, not silently**: research (Skyscript forum threads on
"Moon's last aspect" and "changing signs before conjunction") found
reputable traditional authors materially disagree on whether a sign
change by either applying planet, before exact contact, prevents
perfection — Ivy Goldstein-Jacobson requires perfection before the sign
changes; March-McEvers says it doesn't matter; Lilly's own position (per
Skyscript's summary) is nuanced, counting the *application* as formed
within the original sign while perfection itself can still occur after
leaving it, with a separately-named exception ("evasion") specifically
when the *slower* planet leaves its sign before the faster one catches
up. This was reported to the project owner rather than resolved
unilaterally; **the owner chose to defer rather than pick a side**: when
a sign ingress is detected before geometric exactitude, `status` is
`"requires_historical_rule"`, not a forced perfects/does_not_perfect
judgment (`chart.classical.meta.signIngressConvention:
"requires_historical_rule"`). The raw ingress events (planet, from/to
sign, timestamp) are always reported regardless — raw event first,
judgment second, per the project brief.

**Station/motion-change detection**: both planets' direct↔retrograde
transitions are detected from real recalculated future speed (never
inferred from the current speed alone) and reported independently of
any judgment about whether they prevent perfection.

**Refranation** (cross-checked against Astrodienst's Astrowiki and
astrologysoftware.com's dictionary, consistent with each other):
occurs when an applying significator turns retrograde before the aspect
perfects, and *as a direct result* the aspect never reaches exactitude.
Critically, per both sources, refranation does **not** occur merely
because a station happened — if the pair still goes on to complete the
aspect (even after a station, even while retrograde), that is a delay,
not refranation. This project therefore reports `refranation.occurs:
true` only when both (a) a direct→retrograde station was detected, and
(b) no exactitude was ever found within the search horizon. A planet
that starts the search already retrograde and simply continues toward
exactitude is never refranation (no station event occurs at all in that
case) — confirmed by dedicated tests, including one proving a reversal
*after* perfection cannot retroactively undo it.

**A genuine internal bug, caught and fixed before this phase was
reported complete**: the signed error function used for root-finding
wraps into (-180°, 180°], which means the representation itself flips
sign at the point exactly opposite the target — a wraparound artifact,
not a real aspect crossing. An early version of the search treated any
sign flip as a candidate crossing, which caused it to converge on this
artifact instead of the genuine future crossing for several real pairs
in the verification chart (caught via a deliberately long-horizon
regression test, `TEST 20b`, that verifies a known periodic case
resolves to its true crossing rather than the spurious antipodal one).
Fixed by (1) rejecting sign flips whose raw jump size looks like a
wraparound (≈360°) rather than continuous local motion, and (2)
independently verifying the bisection result actually converged near
zero before accepting it as a genuine crossing.

**"perfects" means only** that the two planets geometrically reach the
exact currently-applying classical aspect under the conventions above —
never a claim about outcome, success, or guarantee. No score, and no
Translation of Light / Collection of Light / Prohibition / Frustration /
Abscission / Void of Course / final horary judgment exists anywhere in
this module — those remain explicitly deferred to Phase 3G-B.

**Verification chart** (1994-11-21, 01:44:00 +08:00, 1.8548°N
102.9325°E, Placidus) — all 5 applying pairs evaluated, computed from
the rules, not assumed in advance. None reached a clean, unqualified
"perfects":

| Pair | Aspect | Exactitude | Exact Time (UTC) | Ingress Before? | Refranation? | Status |
|---|---|---|---|---|---|---|
| Sun — Saturn | Square | Found | 1994-11-28 11:22:54 | Yes (Sun) | No | requires_historical_rule |
| Moon — Venus | Trine | Found | 1994-11-21 09:31:59 | Yes (Moon) | No | requires_historical_rule |
| Moon — Saturn | Trine | Found | 1994-11-21 15:57:54 | Yes (Moon) | No | requires_historical_rule |
| Mars — Jupiter | Square | Not found | — | — | Yes (Mars) | does_not_perfect |
| Jupiter — Saturn | Square | Not found | — | — | Yes (Jupiter) | does_not_perfect |

Three pairs geometrically reach exact contact but with a sign ingress
occurring first (deferred to the historical-rule convention above); two
pairs never reach exactitude within the 180-day horizon because the
faster-moving applying planet (Mars, then Jupiter) stations retrograde
first — genuine refranation, found by the search, not targeted in
advance.

Zero new dependencies, zero network calls. All 283 tests pass (251
carried over from Phase 1–3F unchanged, plus 32 new Phase 3G-A tests).

---

No interpretation is generated anywhere in this codebase, by design:

```
Birth Data → Accurate Astronomical Calculation → Structured Astrology Data → Human Interpretation
```

Software calculates. You interpret.
