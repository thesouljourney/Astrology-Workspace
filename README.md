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

**Refranation** (cross-checked against Astrodienst's Astrowiki,
astrologysoftware.com's dictionary, and a third independent summary —
consistent with each other, no material disagreement found): occurs
when an applying significator turns retrograde before the aspect
perfects, and — as a **direct, local** consequence of that specific
reversal — the application withdraws (the orb-from-exact starts
increasing instead of decreasing). All three sources describe the
triggering direction the same way ("turns retrograde," never the
reverse); no source was found describing a retrograde→direct station as
refranation, so only direct→retrograde is treated as historically
qualifying — though the raw station detector records **both** transition
directions with the same local before/after orb evidence, so a future
phase could revisit this without new instrumentation if a source were
found to disagree.

**Refined definition — a local judgment about the moment of reversal,
never defined by the search horizon.** An earlier version of this phase
defined refranation as "a direct→retrograde station occurred AND no
exactitude was found within the 180-day search horizon" — coupling a
historical judgment to an unrelated software safety limit. This was
corrected: refranation is now evaluated purely from evidence sampled
just before and just after each station (`orbBeforeReversal`/
`orbAfterReversal`, `applicationReversedAway`), entirely independent of
whether the search later finds a crossing or how long the horizon is.
Per all three sources, refranation still does **not** occur merely
because a station happened — a station whose own before/after evidence
shows the pair still closing in (e.g. a retrograde station that sends
the planet back into contact) is not refranation, only a delay; a
station occurring *after* the aspect has already perfected can never
retroactively undo that perfection (confirmed by dedicated tests). A
planet that starts the search already retrograde and simply continues
toward exactitude is never refranation either (no station event occurs
at all in that case). If an application refrains and, much later, a
separate re-application happens to perfect (e.g. after the planet
returns direct and a fresh approach develops), the original refranation
record is **never erased** — `status` may read `"perfects"` (describing
that later, distinct crossing) alongside a populated `refranation`
object describing the earlier, interrupted one; Phase 3G-A does not
attempt to fully classify that later event.

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

| Pair | Aspect | Exactitude | Exact Time (UTC) | Ingress Before? | Refranation? | Orb Before → After | Status |
|---|---|---|---|---|---|---|---|
| Sun — Saturn | Square | Found | 1994-11-28 11:22:54 | Yes (Sun) | No | — | requires_historical_rule |
| Moon — Venus | Trine | Found | 1994-11-21 09:31:59 | Yes (Moon) | No | — | requires_historical_rule |
| Moon — Saturn | Trine | Found | 1994-11-21 15:57:54 | Yes (Moon) | No | — | requires_historical_rule |
| Mars — Jupiter | Square | Not found | — | — | Yes (Mars, 1995-01-02) | 2°15′ → 2°39′ | does_not_perfect |
| Jupiter — Saturn | Square | Not found | — | — | Yes (Jupiter, 1995-04-01) | 2°42′ → 2°56′ | does_not_perfect |

Three pairs geometrically reach exact contact but with a sign ingress
occurring first (deferred to the historical-rule convention above); two
pairs exhibit genuine refranation — the faster-moving applying planet
(Mars, then Jupiter) stations retrograde, and the local evidence
confirms the orb-from-exact demonstrably increases immediately
afterward (application withdrawing, not merely slowing) — found by the
search, not targeted in advance, and independent of the 180-day
horizon.

Zero new dependencies, zero network calls. All 289 tests pass (251
carried over from Phase 1–3F unchanged, plus 38 Phase 3G-A tests
reflecting this refinement).

## 17. Phase 3G-B: Perfection Interference Mechanics

Phase 3G-A answers "do A and B reach exactitude?" Phase 3G-B answers a
different question: **what happens before that exactitude?** — Translation
of Light, Collection of Light, Prohibition, and a neutral raw
third-planet interference layer. Adds `chart.classical.perfectionMechanics
= { translations, collections, prohibitions, frustrations, interferenceEvents,
eventTimeline, doctrineStatus }`. This is **not** final Horary judgment:
no yes/no/success/failure outcome and no score exist anywhere in this
module, and none of Void of Course Moon or house-significator
(querent/quesited) role assignment is implemented here.

**Zero new astronomical calculation, one reuse.** Every structure in
this module is built purely by comparing/aggregating already-computed
Phase 3E (`receptionMatrix`), Phase 3F (`aspects`), and Phase 3G-A
(`directPerfection`) data — read-only. The one exception is Translation's
"separation" leg, which needs a *past* exactitude timestamp: found by
calling Phase 3G-A's own `scanForAspectEvents` with time parameterized
backward (negating the day offset passed to each planet's state
function) — the exact same deterministic forward-search/bisection
machinery, not a second competing engine and not constant-speed
extrapolation.

**Translation of Light** (cross-checked against Skyscript forum threads,
astrologysoftware.com's dictionary, Astrocepheus's knowledge base, and
Kerykeion's summary — consistent on the core structure): a third planet
C, faster (by absolute angular speed) than both A and B, separates from
an aspect with one of them and applies to an aspect with the other,
carrying "light" between two planets that do **not** currently aspect
each other directly. Translation and Collection are specifically the
mechanism used when the two significators themselves must not aspect
each other — so both require `aspect.type === null` on the A–B pair as a
precondition. Reception is **not** a hard gate: sources disagree on
whether it is required ("translation and collection can occur without
reception, [though] reception helps to secure it... some astrologers do
not even consider receptions") — resolved the same way Phase 3E resolved
its own reception-qualification question: `receptionContext` is exposed
as informational data, never required for `occurs: true`. No source was
found restricting either leg to a subset of the five classical aspects,
so all five are accepted.

**Collection of Light** (same sources as above): a third planet C,
**slower** than both A and B, receives applying aspects from both —
"collecting" their light. Same no-direct-aspect precondition and same
reception-as-metadata resolution, for the same sourced reason. A leg
that never reaches exactitude (e.g. a refranating pair) is reported with
that leg's exactitude time as `null` rather than excluding the whole
candidate — an empty/null value here means "not (yet) found under this
search," never "historically impossible."

**Prohibition** — William Lilly, *Christian Astrology* (a single, clear,
internally consistent, role-free definition; no material disagreement
found strong enough to warrant a stop): *"Prohibition is when two
Planets that signify the effecting or bringing to conclusion anything
demanded, are applying to an Aspect; and before they can come to a true
Aspect, another Planet interposes either his body or aspect, to that
thereby the matter propounded is hindered or retarded."* Read here
without any house-role assignment: "the two planets that signify the
matter" is simply any currently-applying Phase 3F pair with a found
Phase 3G-A exactitude. A third planet C prohibits when C reaches its own
exactitude with either A or B strictly *before* A–B's own exactitude —
proven from real future-ephemeris timestamps already computed by Phase
3G-A, never inferred from static current geometry. Lilly's own wording
says the matter is "hindered or retarded," not necessarily destroyed —
this module reports the structural fact only, no outcome claim.

**Frustration — deferred as a distinct doctrine, by explicit decision of
the project owner, not a silent omission.** At least one source defines
Frustration as requiring a distinction between a "significator" (the
planet representing the matter) and a "non-significator" — a role
assignment this phase is explicitly forbidden from performing (no
querent/quesited/house-role assignment in this phase). Multiple other
sources instead state that "many writers consider abscission and
frustration synonymous" with the very structure already implemented
above as Prohibition. Rather than silently collapsing Frustration into
Prohibition under a different name, or silently assigning roles this
phase should not assign, this disagreement was reported to the project
owner, who chose to defer: `frustrations` is always `[]`, and
`chart.classical.meta.frustrationConvention:
"deferred_due_to_historical_variance"`. The underlying facts remain
fully visible via Prohibition and the raw interference layer below —
nothing about Frustration is hidden, only its own distinct label is
withheld.

**Abscission / raw interference layer** — resolved the way the project
brief itself preferred for exactly this kind of overlapping terminology:
rather than deciding whether "abscission" is a synonym of Prohibition, a
distinct doctrine, or a broader family, this module exposes a neutral
**raw** interference-event layer (`interferenceEvents`): every
third-planet exact aspect involving either member of a currently-applying
pair that occurs *before* that pair's own candidate exactitude, reported
as plain structural fact, independent of any doctrine label.
`prohibitions` entries are **derived** from this same raw layer under
Lilly's specific historical rule; the raw layer itself makes no doctrine
claim, so it is required regardless of how any future phase eventually
settles the abscission/prohibition/frustration naming question.

**Sign ingress**: reuses Phase 3G-A's already-deferred
`signIngressConvention: "requires_historical_rule"` verbatim — if a
constituent leg of a Translation/Collection candidate itself shows a sign
ingress before its own exactitude, that structure's `technicalStatus` is
likewise set to `"requires_historical_rule"` rather than silently
asserting the doctrine held or failed.

**Event timeline**: `eventTimeline` aggregates every candidate's own
exactitude, every sign ingress, and every station event from Phase
3G-A's already-computed results into one deduplicated, chronologically
sorted list — again, no new calculation, only aggregation of data that
already existed.

New `chart.classical.meta` fields: `translationConvention`,
`collectionConvention`, `prohibitionConvention`, `frustrationConvention:
"deferred_due_to_historical_variance"`, `interferenceLayer:
"raw_event_sequence"`.

**Verification chart** (1994-11-21, 01:44:00 +08:00, 1.8548°N
102.9325°E, Placidus) — computed from the rules, nothing pre-assumed:

| Doctrine | Count | Detail |
|---|---|---|
| Translation of Light | 3 | Moon separates Mars(sextile)/applies Venus(trine); Sun separates Mars(square)/applies Saturn(square); Moon separates Mars(sextile)/applies Saturn(trine) — all three `requires_historical_rule` (ingress before the applying leg's exactitude, consistent with Phase 3G-A's own findings for these same pairs) |
| Collection of Light | 2 | Saturn collects Sun(square) + Moon(trine); Saturn collects Moon(trine) + Jupiter(square) — the Jupiter leg's exactitude is `null` (Jupiter–Saturn refranates, per Phase 3G-A) |
| Prohibition | 2 | Moon's trine to Saturn (1994-11-21 15:57:54 UTC) prohibits Sun–Saturn's own square (1994-11-28 11:22:54 UTC); Venus's trine to Moon (1994-11-21 09:31:59 UTC) prohibits Moon–Saturn's own trine (1994-11-21 15:57:54 UTC) — a cascading chain |
| Frustration | 0 | Always empty — deferred |
| Interference events (raw) | 2 | Matches the 2 Prohibitions 1:1 in this chart, since both intervening events happen to satisfy Lilly's specific rule; the raw layer is not defined as always equal to Prohibition's count in general |

Zero new production dependencies, zero network calls (confirmed:
`npx vite build` diffs to an empty `package.json`/`package-lock.json`
change once the temporary, dev-only, immediately-uninstalled Playwright
UI-screenshot check is excluded — see the project's established UI
verification pattern used in every prior phase). All 312 tests pass
(289 carried over from Phase 1–3G-A unchanged, plus 23 new Phase 3G-B
tests).

### 17a. Refinement: Translation orb-continuity and Collection candidate-vs-completion

Before locking Phase 3G-B, one focused refinement was made to Translation
and Collection only (Prohibition, Frustration, Phase 1–3G-A untouched).

**Translation — a prior exact aspect alone is not sufficient.** Re-checked
against the same source set (Skyscript forum threads, astrologysoftware.com's
dictionary, Astrocepheus's knowledge base — consistent, no material
disagreement found): "the translating planet must be within moiety of
the other two planets in the trio." The translator must STILL be within
its allowed Lilly moiety-sum orb of the planet it is separating from at
the moment it applies to the second planet — not merely have been exact
with it at some point in the past. This is now checked **explicitly**
(`separatingLeg.stillWithinOrb`, computed directly from Phase 3F's own
`orbFromExact`/`allowedOrb` for that pair) rather than left as an
implicit side effect of the upstream applying/separating gate. Each
translation now reports full `separatingLeg`/`applyingLeg` evidence
objects (aspect type, past/future exactitude timestamp, current orb,
allowed orb, within-orb boolean) instead of a handful of flat fields.
**Result: the count is unchanged (3)** — the prior implementation's gate
already implied orb-continuity for every real candidate in this chart;
the refinement makes that condition explicit, independently verified,
and directly testable rather than changing which candidates qualify.

**Collection — a structural candidate is not the same fact as a
completed two-leg event.** `collections` entries now report `isCandidate`
(always `true` for an entry present in the array — two faster planets
currently applying to a slower collector, no direct A–B aspect) alongside
`aLeg`/`bLeg` (each with `applying`, `exactitudeFound`,
`exactitudeTimestampUTC`, `refranation` — Phase 3G-A's own fields, reused
verbatim) and a `completionStatus`: `"both_legs_perfect"`,
`"one_leg_does_not_perfect"`, or `"requires_historical_rule"`. A leg that
firmly does not perfect (refranation, or no crossing found at all) takes
priority over an ingress flag on either leg — Phase 3G-A's
`ingressBeforeExactitude` can be `true` even on a leg that never reaches
exactitude, and that flag is moot when there is no perfection for the
historical-rule question to apply to; this ordering was caught and fixed
via a dedicated test before this refinement was reported complete.
**Re-checking Saturn collects Moon + Jupiter**: this remains a structural
Collection candidate (`isCandidate: true`), but is explicitly **not** a
completed two-leg Collection — `completionStatus: "one_leg_does_not_perfect"`
(Jupiter's leg refranates and never reaches exactitude; Moon's leg does).
The other collection in this chart, Saturn collects Sun + Moon, has both
legs geometrically reach exactitude but each carries its own sign-ingress
ambiguity, so it resolves to `completionStatus: "requires_historical_rule"`
— genuinely distinct from both `"both_legs_perfect"` and
`"one_leg_does_not_perfect"`. **Result: the count is unchanged (2)** —
both structural candidates found before still qualify; only their
completion status is now distinguished rather than collapsed into a
single `technicalStatus`.

**Prohibition, Frustration, and Phase 1–3G-A are confirmed unchanged**
(dedicated regression tests compare the full `prohibitions` array
byte-for-byte against the pre-refinement result, and `directPerfection`/
`aspects`/`receptionMatrix` against a fresh independent computation).
UI extended with a "Separating Leg Still Within Orb" column for
Translation and a "Candidate" / "Completion Status" distinction for
Collection — neutral technical language only, no outcome claims. 7 new
tests (319 total, all passing); zero new production dependencies.

## 18. Phase 3H: Classical Technical Summary & Evidence Layer

**Purpose**: Phase 3A–3G-B each calculate one slice of technical
evidence. Phase 3H does not calculate anything new — it organizes
everything already computed into one normalized, traceable evidence
layer (`chart.classical.summary`) that is easy to inspect, export, and
later hand to a manual interpretation workspace. It answers "what
technical evidence has already been calculated?", never "what does this
mean?"

**This is aggregation, not new doctrine.** `technicalSummary.js` performs
zero new astronomical calculation and zero new astrology rule
evaluation. Every field is read from an already-locked upstream result —
Phase 1 (`chart.meta`), Phase 3A (essential dignity), Phase 3B (planetary
condition), Phase 3C (operational condition), Phase 3D (Hayz/Halb), Phase
3E (dispositor & reception), Phase 3F (aspects), Phase 3G-A (direct
perfection), Phase 3G-B (perfection mechanics) — with only two kinds of
relabeling, both purely cosmetic and applied uniformly: Phase 3G-A's
`status` field is exposed as `technicalStatus` (matching Phase 3G-B's own
name for the same concept), and Phase 3E's `{planet, types}` reception
entries are exposed as `{otherPlanet, dignityTypes}` for symmetry with
the aspect/mechanics evidence entries. No value is ever changed by either
rename. No combined score, no ranking, and no interpretive label
(`isStrong`/`isBeneficial`/etc.) exists anywhere in this module.

**Three levels** (Part B): `chartOverview` (one neutral overview of every
convention marker already in `chart.classical.meta`, plus
`traditionalPlanetsIncluded`), `planets` (one normalized evidence record
per traditional planet, keyed by lowercase planet name — `identity`,
`position`, `essentialDignity`, `planetaryCondition`, `operationalCondition`,
`sectCondition`, `dispositor`, `reception`, `aspects`, `directPerfection`,
`mechanicsInvolvement`, `technicalFlags`, `provenance`), and
`relationships` (one record per unique pair of traditional planets —
`pairId`, `planetA`, `planetB`, `currentAspect`, `reception`,
`directPerfection`, `interference`, `mechanics`, `provenance`). A
chart-level `mechanics` rollup (counts + `doctrineStatus`) and
`unresolvedConventions` sit alongside these three.

**Stable pair IDs** (Part P): `canonicalPlanetPair(a, b)` orders any two
traditional planets by their fixed index in `TRADITIONAL_PLANETS` — the
exact same ordering every upstream Phase 3F/3G-A/3G-B module already uses
internally to build its own pair arrays (`for (i) for (j = i+1)`), never
an alphabetical sort. This is what makes `"A-B"` and `"B-A"` always
normalize to one pairId (e.g. `"sun-saturn"`, never `"saturn-sun"` for
the same pair) — and it is deliberately the same fix as the test-level
mistake this project already made once, in Phase 3G-B: an override key
built with `.sort()` (alphabetical) silently failed to match a pair
object built in `TRADITIONAL_PLANETS` order. Phase 3H's own tests (TEST
5) assert this order-independence directly, and reuse
`canonicalPlanetPair` everywhere a pair needs to be looked up or
compared — never a second, competing ordering.

**Provenance** (Part Q): every planet record, every relationship record,
the chart overview, and the mechanics rollup carry a `provenance` array
of stable logical labels (`phase_1_astronomical_foundation`,
`phase_3a_essential_dignity`, `phase_3b_planetary_condition`,
`phase_3c_operational_condition`, `phase_3d_hayz_halb`,
`phase_3e_reception`, `phase_3f_aspects`, `phase_3ga_direct_perfection`,
`phase_3gb_perfection_mechanics`) — never a file path, so the schema
stays stable even if internal module organization changes later.

**Ambiguity preservation** (Part R): `unresolvedConventions` is *derived*
from `chart.classical.meta`, not hard-coded — a small topic→meta-key map
is filtered against a fixed set of "this is a deferral/ambiguity marker"
values (`requires_historical_rule`, `deferred`,
`deferred_due_to_historical_variance`, `not_yet_evaluated`), so a
convention that a future phase actually resolves automatically drops off
this list on its own, without anyone needing to remember to update it.
In the verification chart this currently yields exactly four entries:
sign ingress before perfection, reception qualification, Frustration, and
Dexter/Sinister. Genuinely settled conventions (e.g. refranation's
`direct_to_retrograde_application_reversal`) never appear here.

**Verification chart** (1994-11-21, 01:44:00 +08:00, 1.8548°N
102.9325°E, Placidus) totals, generated from the live pipeline, never
hard-coded: exactly 7 planet evidence records, exactly 21 relationship
records, 9 aspects within orb, 5 direct-perfection candidates, 3
translations, 2 collections (`collectionCompletionStatusCounts:
{both_legs_perfect: 0, one_leg_does_not_perfect: 1,
requires_historical_rule: 1}`), 2 prohibitions, 2 raw interference
events, 2 refranating legs, and 4 unresolved conventions — every one of
these reconciles exactly with the corresponding Phase 3F/3G-A/3G-B totals
already reported in §15–17.

New `chart.classical.meta` fields: `technicalSummaryVersion:
"phase_3h_v1"`, `technicalSummaryType: "normalized_evidence_layer"`,
`technicalSummaryInterpretation: "none"`.

UI: a new "Technical Summary｜技术总览" section (Chart Overview, seven
compact Planet Evidence cards, 21 collapsible Relationship Evidence
cards, and an Unresolved Conventions list) was added inside "Classical
Astrology｜古典占星", additional to — not replacing — every existing
detailed section. Bilingual major headings/labels follow the established
per-section pattern used throughout this project; a full bilingual
terminology refactor is explicitly out of scope for this phase and is
left for a later, dedicated phase, per the project brief.

**Export readiness**: the whole summary is plain, JSON-serializable data
— no functions, no React elements, no class instances, no circular
references (confirmed by dedicated tests). Excel export itself is not
built in this phase.

Zero new production dependencies, zero network calls (the temporary,
dev-only, immediately-uninstalled Playwright UI check follows the same
established pattern as every prior phase). All 354 tests pass (319
carried over from Phase 1–3G-B unchanged, plus 35 new Phase 3H tests).

## 19. Phase 4A: Vedic Sidereal Foundation & Navagraha

**Scope**: this phase establishes only the astronomical foundation for
Vedic (Jyotish) astrology — sidereal conversion, the Lahiri ayanamsha,
the nine Navagraha (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn,
Rahu, Ketu), Rashi placement, and a sidereal Ascendant/Lagna
*foundation* value. It deliberately does **not** implement Bhava/houses,
Nakshatra, dignity, lordship, yogas, dasha, or any interpretation —
`chart.vedic.meta` marks each of those explicitly as
`"not_yet_implemented"` or `"none"`, never silently omitted.

**Architecture — zero new planetary ephemeris**: `chart.vedic` is built
entirely from data this project already computed and verified. The
seven real Grahas reuse Phase 1's tropical longitudes/speeds
(`planets.js`) verbatim; Rahu reuses Phase 2's already-locked
`computeMeanNode` (`nodes.js`) verbatim; Ketu is never computed
independently — it is always exactly Rahu's tropical longitude + 180°
(`computeSouthNode`), matching this project's existing rule for the
Western North/South Node. Sidereal longitude is
`normalize360(tropicalLongitude - ayanamshaDegrees)`, using the tropical
longitude exactly as it already exists — no second ephemeris, no
alteration of any upstream value.

**Lahiri ayanamsha** (`src/astrology/vedic/ayanamsha.js`): implemented
as a genuine function of time — `ayanamsha(t) = ` a reference value at
J2000.0 `+` the IAU 2000/2006 general precession in ecliptic longitude
accumulated since J2000.0 (Capitaine, Wallace & Chapront 2003), never a
hard-coded constant. Cross-checked against two sources (Part A): (A) the
historical N.C. Lahiri / Indian Calendar Reform Committee (1956)
Chitrapaksha definition (anchor: tropical/sidereal coincidence ≈285 CE,
official 1956 decree value 23°15′00″), and (B) a **temporary dev-only**
Swiss Ephemeris cross-check (`sweph-wasm`, installed only long enough to
measure `swe_get_ayanamsa_ut()` — Swiss Ephemeris's own documentation
states this function computes the ayanamsha "without considering
nutation"; this was additionally confirmed empirically by comparing it
against `swe_get_ayanamsa_ex_ut()` with and without the `SEFLG_NONUT`
flag, which reproduce the same value only when `SEFLG_NONUT` is set —
for `SE_SIDM_LAHIRI` at six dates spanning 1900–2024, then immediately
uninstalled — never a production dependency). This module's single
calibrated constant reproduces that specific, confirmed-nutation-
excluded Swiss Ephemeris quantity to within **0.0003 arcseconds** at
every one of those six dates, including this project's own locked
verification date — far tighter than the "arcminute or larger" threshold
that would have required stopping to report a material disagreement. No
such disagreement was found. `computeLahiriAyanamsha()` therefore
implements the **mean (precessional-only, nutation-excluded)** Lahiri
ayanamsha — never the "true"/apparent Chitrapaksha value, and never a
reproduction of Swiss Ephemeris's full `SEFLG_SIDEREAL` planetary
pipeline (see the pre-lock audit subsection below for exactly how those
differ and by how much, quantitatively).

A genuine, disclosed subtlety was found and documented rather than
hidden: Swiss Ephemeris's own internal sidereal pipeline subtracts this
same (nutation-free, "mean") ayanamsha from a nutation-*free* tropical
longitude, whereas this project's tropical longitude (like most modern
ephemeris output) is the *apparent* position, i.e. it includes nutation.
Subtracting a nutation-free ayanamsha from a nutation-including tropical
longitude leaves a small residual exactly equal to the nutation in
longitude itself (confirmed directly: astronomy-engine's own
`e_tilt().dpsi` at the verification instant is +10.88″, matching the
measured ≈11.15″ gap between this module's production-path sidereal Sun
and Swiss Ephemeris's `SEFLG_SIDEREAL` output to within +0.28″ — and
matching an isolated ayanamsha-only comparison, using Swiss Ephemeris's
own tropical Sun on both sides, to within -0.08″). This is a real,
well-understood, honestly-disclosed *convention* difference (mean vs.
apparent equinox handling in the subtraction) — not a planetary-
ephemeris error and not an ayanamsha-value error — and it is exactly why
the simple, always-reconciling formula above is used with no hidden
correction: every Graha's `tropicalLongitude - ayanamshaDegrees` equals
its own `siderealLongitude` exactly, by construction and by dedicated
test.

**Rahu/Ketu node convention** (Part E): research found most traditional
Jyotish texts/software assume the **mean** node (a smooth, steadily
regressing point whose motion is, by construction, always retrograde —
so the real calculated motion and the classical "always retrograde"
(nitya vakri) doctrine naturally coincide, with nothing to paper over),
while the True Node (this project's own Modern Western default, for its
own distinct purpose) oscillates ±1.29° and can briefly compute as
"direct," conflicting with that doctrine. This was reported to the
project owner, who chose **mean node** as the Vedic default. Stored
explicitly and never hidden: `chart.vedic.meta.vedicNodeType: "mean"`,
plus `nodeType: "mean"` directly on the Rahu/Ketu Graha records
themselves.

**Motion** (Part K): sidereal speed is *not* assumed equal to tropical
speed — ayanamsha itself changes at ≈0.0139°/day, a non-negligible
fraction of a slow planet's own motion near a station. Sidereal speed is
computed via the exact same symmetric finite-difference technique
`planets.js` already uses for tropical speed (same 30-minute half-
window, same wraparound handling) — applied to the sidereal longitude
function instead, not a new numerical method. `retrograde` is derived
from this sidereal speed, the technically correct choice for a sidereal
chart. This is purely technical motion data — no Vedic retrograde
interpretation is implied.

**Sidereal Lagna**: `chart.vedic.lagna` is explicitly labeled "Sidereal
Ascendant / Lagna foundation — NOT a Bhava/house-1 placement engine."
Only a longitude/Rashi/degree value is provided; no house or Bhava field
exists anywhere on it. MC/IC/DSC are not imported into the Vedic core at
all in this phase.

**Verification chart** (1994-11-21, 01:44:00 +08:00, 1.8548°N
102.9325°E, Placidus), computed from the rules, nothing pre-assumed:

Lahiri ayanamsha at the birth instant: **23°47′08.4″ (23.785661°)**.

| Graha | Rashi | Degree | Sidereal Longitude | Tropical Longitude | Motion |
|---|---|---|---|---|---|
| Lagna | Leo | 13°13′38.9″ | 133.2275° | 157.0131° | — |
| Sun | Scorpio | 04°23′23.5″ | 214.3899° | 238.1755° | Direct |
| Moon | Gemini | 00°55′44.0″ | 60.9289° | 84.7146° | Direct |
| Mars | Cancer | 29°17′37.9″ | 119.2939° | 143.0795° | Direct |
| Mercury | Libra | 21°21′41.6″ | 201.3615° | 225.1472° | Direct |
| Jupiter | Scorpio | 02°05′49.1″ | 212.0970° | 235.8826° | Direct |
| Venus | Libra | 08°52′33.4″ | 188.8760° | 212.6616° | Retrograde |
| Saturn | Aquarius | 12°00′21.2″ | 312.0059° | 335.7915° | Direct |
| Rahu | Libra | 20°09′49.8″ | 200.1638° | 223.9495° | Retrograde |
| Ketu | Aries | 20°09′49.8″ | 20.1638° | 43.9495° | Retrograde |

Ketu's sidereal and tropical longitudes are each exactly 180° from
Rahu's, confirmed to floating-point precision.

**Independent verification** (Part P): the same temporary, dev-only
Swiss Ephemeris cross-check used for the ayanamsha was also used to
compare astronomy-engine's own tropical planetary/lunar-node longitudes
against Swiss Ephemeris's SWIEPH output at this verification instant.
Differences, categorized per Part Q:

| Body | Difference vs. Swiss Ephemeris | Category |
|---|---|---|
| Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn | 0.2″–3.8″ | planetary-ephemeris difference (pre-existing, Phase 1, already well within tolerance) |
| Mean Node (Rahu) | ≈10.8″ | lunar-node-ephemeris difference (pre-existing, Phase 2's own documented Meeus low-precision series characteristic — not new to this phase) |
| Tropical Ascendant (Lagna) | ≈7.6″ | pre-existing Phase 1 house/Ascendant characteristic |
| Lahiri ayanamsha value itself | <0.0003″ | ayanamsha-implementation difference — effectively exact |
| Full sidereal longitude vs. Swiss Ephemeris's `SEFLG_SIDEREAL` | ≈11″ (Sun; comparable for other bodies) | convention difference (mean vs. apparent-equinox subtraction — see ayanamsha.js doc comment) — **not** a planetary or ayanamsha-value error |

Every difference is comfortably under one arcminute; none required
stopping under Part A/Q's "arcminute or larger" threshold.

**Regression**: Modern Western, Classical, and Phase 3H summary outputs
are confirmed byte-for-byte unchanged by dedicated tests — `chart.vedic`
is purely additive.

UI: a new "Vedic Astrology｜印度占星" top-level section (Sidereal
Foundation, Lagna, a Navagraha table, and per-Graha detail cards) was
added, additional to the existing Western/Classical sections — no
dignity/strength/benefic/malefic language anywhere.

New `chart.vedic.meta` fields (refined during the pre-lock audit below —
see that subsection for why): `vedicSystem: "jyotish"`, `zodiacType:
"sidereal"`, `ayanamsha: "lahiri"`, `ayanamshaImplementation:
"lahiri_mean_no_nutation_iau2006_precession_calibrated_to_swiss_ephemeris_mean_ayanamsha"`,
`ayanamshaIncludesNutation: false`, `siderealConversion:
"tropical_longitude_minus_mean_lahiri_ayanamsha"`,
`externalVerification: "swiss_ephemeris_dev_only_not_production"`,
`vedicNodeType: "mean"`, `grahaSet: "navagraha"`, `rashiSystem:
"12_equal_30_degree_signs"`, `bhavaSystem: "not_yet_implemented"`,
`nakshatraSystem: "not_yet_implemented"`, `vedicInterpretation: "none"`.

Zero new production dependencies, zero network calls (the temporary,
dev-only Swiss Ephemeris and Playwright UI checks were both fully
uninstalled immediately after use, per this project's established
pattern). All 391 tests pass (354 carried over from Phase 1–3H
unchanged, plus 31 original Phase 4A tests, plus 6 new pre-lock audit
tests — see below).

### 19.1 Pre-lock audit: precise ayanamsha quantity & reconciliation of the ~11″ gap

Before locking Phase 4A, a focused audit re-verified — with concrete,
reproducible numbers rather than qualitative wording — exactly which
Swiss Ephemeris quantity this module was calibrated against, whether
that quantity includes nutation, and exactly what accounts for the ~11″
difference against Swiss Ephemeris's full sidereal pipeline mentioned
above. No formula, constant, or computed chart position changed as a
result — only documentation, naming, and metadata were refined; the
underlying `AYANAMSHA_AT_J2000_DEGREES` constant is bit-for-bit
unchanged.

- **Exact function used for the original calibration**: `swe.swe_get_ayanamsa_ut(tjd_ut)`,
  confirmed identical (to sub-milliarcsecond precision) to
  `swe.swe_get_ayanamsa(tjd_et)` and to `swe.swe_get_ayanamsa_ex_ut(tjd_ut, SEFLG_SWIEPH | SEFLG_NONUT)`.
  This value is the **mean** (nutation-excluded) ayanamsha — confirmed
  empirically, not merely from documentation: the same `ex_ut` call
  *without* `SEFLG_NONUT` returns a different, larger value (by an
  amount matching the nutation in longitude at that instant almost
  exactly).

- **1956-03-21 00:00 TT reference check** (Part C): the commonly-quoted
  "23°15′00.658″" figure (the 1985 refinement of the original 1956
  Calendar Reform Committee decree) turns out to be the **true**
  (nutation-*including*) Chitrapaksha value, not the mean one this
  module implements. At that instant, this module's production formula
  evaluates to **23°14′44.02″**, a difference of **-16.64″** from the
  quoted figure. Swiss Ephemeris's own mean function
  (`swe_get_ayanamsa`) evaluates to the *same* 23°14′44.02″ at that
  instant — the identical -16.64″ gap — while Swiss Ephemeris's
  nutation-*including* call (`swe_get_ayanamsa_ex_ut` without
  `SEFLG_NONUT`) evaluates to 23°15′00.80″, within **0.14″** of the
  quoted reference. This confirms the gap is a difference in *which
  quantity* is being compared, not a calibration error: this module's
  mean ayanamsha matches Swiss Ephemeris's own mean ayanamsha at 1956 to
  a fraction of an arcsecond, exactly as it does at every other tested
  date, even though 1956 was never part of the calibration.

- **Quantitative decomposition of the ~11″ sidereal-longitude gap**
  (Part E), measured directly at the locked verification instant (Sun):
  production path (astronomy-engine tropical longitude minus this
  module's ayanamsha, vs. Swiss Ephemeris's `SEFLG_SIDEREAL` Sun):
  `differenceSiderealArcsec = +11.15″`, `nutationLongitudeArcsec`
  (astronomy-engine's own `e_tilt().dpsi`) `= +10.88″`,
  `residualArcsec = +0.28″`. Isolating the ayanamsha/nutation effect
  alone (Swiss Ephemeris's own tropical Sun on both sides, removing the
  small, separately-documented planetary-ephemeris difference) tightens
  this to `differenceSiderealArcsec = +10.79″`, `residualArcsec =
  -0.08″`. Both reconciliations are well within a fraction of an
  arcsecond of the nutation-in-longitude value itself — this
  substantially reconciles, and is not an unresolved discrepancy.

- **Refined metadata** — three new `chart.vedic.meta` fields make the
  quantity and its limitation explicit rather than implied:
  `ayanamshaIncludesNutation: false`, `siderealConversion:
  "tropical_longitude_minus_mean_lahiri_ayanamsha"`,
  `externalVerification: "swiss_ephemeris_dev_only_not_production"`. The
  `ayanamshaImplementation` string was renamed from
  `"lahiri_chitrapaksha_mean_iau2006_precession"` to
  `"lahiri_mean_no_nutation_iau2006_precession_calibrated_to_swiss_ephemeris_mean_ayanamsha"`
  to state precisely what is (and is not) claimed — Swiss Ephemeris is
  never claimed to be the production engine, and its full sidereal
  pipeline is never claimed to be reproduced.

- **Traceability preserved** (Part G): `normalize360(tropicalLongitude -
  ayanamshaDegrees) === siderealLongitude` remains exactly true for
  every Graha and for Lagna, by construction and by dedicated test — no
  hidden correction was introduced to paper over the ~11″ pipeline
  difference; it is documented instead.

- **No change** to any computed chart position, to the Rahu/Ketu mean-
  node convention, to the Navagraha architecture, or to any production
  dependency. Six new tests were added (`AUDIT TEST 26`–`31` in
  `vedicChart.test.js`) covering the 1956 reference comparison, the
  explicit nutation-inclusion metadata, exact sidereal-conversion
  reconciliation, documentation of the ~11″ external-verification gap,
  absence of any production Swiss Ephemeris dependency, and Western/
  Classical output remaining byte-for-byte unchanged. All 391 tests
  (385 prior + 6 new) pass.

## 20. Phase 4B: Vedic Bhava & House Structure

**Scope**: this phase establishes the first Vedic house architecture
layer — Whole-Sign Bhavas numbered from the Lagna, each Navagraha's
Bhava placement, traditional Jyotish Rashi lordship (house ownership),
the Lagna Lord, and a technical lord-placement/lordship network. It
deliberately does **not** implement Bhava Chalit (any degree-based house
system), Nakshatra, dignity (own sign/exaltation/debilitation/
moolatrikona/friend-enemy), yogas, drishti (aspects), dashas, Vargas, or
functional benefic/malefic/yogakaraka/maraka classification — every one
of those is marked explicitly `"not_implemented"` or `"none"` in
`chart.vedic.meta`, never silently omitted.

**Architecture — zero new sidereal engine**: `chart.vedic.bhava` is
derived entirely from Phase 4A's own already-computed sidereal `lagna`
and `grahas` (their Rashi/`rashiIndex` values) — no planetary or
ayanamsha calculation happens in this phase, and Phase 4A's `lagna` and
`grahas` objects are never mutated; all new data lives in the separate,
additive `chart.vedic.bhava` structure (`src/astrology/vedic/bhava.js`).

**Whole-Sign convention** (`whole_sign_from_lagna`): the entire Rashi
occupied by the Lagna becomes Bhava 1 in full, regardless of the exact
degree the Lagna falls at within it; each following Rashi (fixed
zodiacal order) becomes the next Bhava. No house has a cusp degree in
this phase — membership is categorical by Rashi alone
(`bhavaCuspModel: "none_rashi_based"`). This is deliberately the oldest
and most widespread Jyotish house convention, distinct from Bhava Chalit/
Sripati and from every Western degree-based cusp system (Placidus,
Koch, Campanus, Porphyry, Equal House) — none of which are used here.

**Bhava numbering formula**, for a Graha in sidereal Rashi index `g` (0 =
Aries .. 11 = Pisces) with the Lagna in Rashi index `l`:

```
bhavaNumber = ((g - l + 12) % 12) + 1
```

(the `+ 12` guards against JavaScript's `%` being a remainder operator,
not a true modulo, since `g - l` can be negative). Verified directly:
same Rashi as Lagna → Bhava 1; one Rashi ahead → Bhava 2; one Rashi
behind → Bhava 12; every Pisces→Aries (index 11→0) wrap case checked
explicitly, for all 12 possible Lagna Rashis, not just the verification
chart's own Lagna.

**Traditional Rashi lordship** (`src/astrology/vedic/rashiLordship.js`,
`houseLordshipSystem: "traditional_jyotish_rashi_lordship"`) — the
classical seven-planet scheme, unchanged since antiquity:

| Rashi | Lord | Rashi | Lord |
|---|---|---|---|
| Aries | Mars | Libra | Venus |
| Taurus | Venus | Scorpio | Mars |
| Gemini | Mercury | Sagittarius | Jupiter |
| Cancer | Moon | Capricorn | Saturn |
| Leo | Sun | Aquarius | Saturn |
| Virgo | Mercury | Pisces | Jupiter |

No modern outer-planet (Uranus/Neptune/Pluto) rulership is used, exactly
as this project's Classical (Western traditional) rulership table
already excludes them from dignity.

**Rahu/Ketu treatment**: both shadow points receive ordinary Whole-Sign
Bhava placement from their own sidereal Rashi, exactly like any other
Graha — but neither is ever assigned Rashi lordship or house ownership
(the traditional rule, not a Phase 4B simplification): Rashi lordship
for Aquarius and Scorpio remains with Saturn and Mars respectively.
Confirmed by dedicated test: neither name ever appears in `houseLords`
or `planetaryHouseOwnership`.

**Lagna Lord**: `chart.vedic.bhava.lagna.lord`, derived directly from
the Lagna Rashi's traditional ruler (no separate calculation).

**House ownership structure** (Part H): a forward map (`houseLords`,
Bhava number → owning graha) and a reverse map
(`planetaryHouseOwnership`, graha key → array of Bhava numbers it owns)
— both computed live from the verification chart, never hard-coded. Sun
and Moon each own exactly one Bhava (their single Rashi); the other five
classical grahas each own exactly two; the reverse map's array lengths
sum to exactly 12 (every Bhava owned exactly once) — confirmed by test
for all 12 possible Lagna Rashis, not only the verification chart's own.

**Lord-placement network** (Parts I/J): every Bhava exposes
`lordPlacedInBhava` (a plain integer) and a parallel
`lordshipNetwork` array records, for every Bhava, its source Rashi, its
lord, the lord's own Rashi, and the Bhava the lord is physically placed
in. This is a plain technical fact only — "2nd lord in the 4th Bhava" is
exposed as data, never interpreted (no yogakaraka, functional-benefic/
malefic, or maraka judgment is made or implied anywhere in this phase).

**Verification chart** (1994-11-21, 01:44:00 +08:00, 1.8548°N
102.9325°E, Placidus) — Lagna: **Leo**, Lagna Lord: **Sun**.

| Bhava | Rashi | Lord | Grahas | Lord Placed In |
|---|---|---|---|---|
| 1 | Leo | Sun | — | 4 |
| 2 | Virgo | Mercury | — | 3 |
| 3 | Libra | Venus | Mercury, Venus, Rahu | 3 |
| 4 | Scorpio | Mars | Sun, Jupiter | 12 |
| 5 | Sagittarius | Jupiter | — | 4 |
| 6 | Capricorn | Saturn | — | 7 |
| 7 | Aquarius | Saturn | Saturn | 7 |
| 8 | Pisces | Jupiter | — | 4 |
| 9 | Aries | Mars | Ketu | 12 |
| 10 | Taurus | Venus | — | 3 |
| 11 | Gemini | Mercury | Moon | 3 |
| 12 | Cancer | Moon | Mars | 11 |

Planetary house ownership: Sun → [1]; Moon → [12]; Mars → [4, 9];
Mercury → [2, 11]; Jupiter → [5, 8]; Venus → [3, 10]; Saturn → [6, 7].
Rahu → Bhava 3 (Libra); Ketu → Bhava 9 (Aries) — exactly 6 Bhavas apart,
matching their exact 180° tropical/sidereal opposition from Phase 4A.

**Independent verification** (Part Q): the Whole-Sign mapping was
manually re-derived from the Lagna Rashi and checked Graha-by-Graha
against `bhavaNumberFromRashiIndex`, and the lordship table was checked
against the classical scheme above — no disagreement found. `bhava.js`
is additionally exercised directly (bypassing `calculateChart`) for all
12 possible Lagna Rashis and for synthetic boundary Grahas (exactly 0°
and 29.9997° within the same Rashi), confirming the mapping is correct
independent of the one verification chart's own Lagna.

**Regression**: Phase 4A's own `lagna`/`grahas`/`ayanamsha` objects, plus
Modern Western, Classical, and Phase 3H summary outputs, are confirmed
byte-for-byte unchanged by dedicated tests.

UI: a new "Bhava Structure｜宫位结构" subsection was added inside the
existing Vedic Astrology｜印度占星 section (Lagna/Lagna Lord, a 12-Bhava
table, and a compact Navagraha → Bhava table) — additive only, the
existing Phase 4A subsections are untouched. Verified in-browser at both
desktop and 390px mobile width: no console errors, no horizontal page
overflow (each wide table scrolls within its own container, matching
the existing responsive pattern).

New `chart.vedic.meta` fields (Phase 4A's own fields are unchanged
except `bhavaSystem`, whose placeholder value is now superseded by the
real implementation): `bhavaSystem: "whole_sign_from_lagna"`,
`bhavaCuspModel: "none_rashi_based"`, `houseLordshipSystem:
"traditional_jyotish_rashi_lordship"`, `bhavaChalit: "not_implemented"`,
`functionalLordship: "not_implemented"`, `vedicHouseInterpretation:
"none"`.

Zero new production dependencies, zero network calls, runtime remains
fully local/offline (the temporary, dev-only Playwright UI check was
fully uninstalled immediately after use, per this project's established
pattern). All 429 tests pass (391 carried over from Phase 1–4A-audit
unchanged, plus 38 new Phase 4B tests).

## 21. Phase 4C: Vedic Nakshatra & Pada

**Scope**: this phase places every Navagraha and the Lagna into the
27-Nakshatra / 4-Pada structure, using only the sidereal longitudes
Phase 4A already computed and locked — no tropical recomputation, no
ayanamsha recomputation, no second sidereal engine. It exposes each
Nakshatra's Vimshottari lord (for identification only), a prominently-
surfaced Moon Nakshatra summary, and a separate Lagna Nakshatra. It
deliberately does **not** implement Dasha of any kind (Mahadasha,
Antardasha, Pratyantardasha, balance-at-birth, or a timeline), Navamsa/
D9/any Varga, Tara Bala, or any interpretation — `chart.vedic.meta`
marks every one of those explicitly `"not_implemented"`/`"none"`.

**Architecture — zero new sidereal engine**: `chart.vedic.nakshatra` is
derived entirely from `chart.vedic.lagna.siderealLongitude` and each
`chart.vedic.grahas[*].siderealLongitude` (`src/astrology/vedic/nakshatra.js`)
— Phase 4A's own `lagna`/`grahas` objects are never mutated; all new
data lives in the separate, additive `chart.vedic.nakshatra` structure.

**Geometry**: 27 Nakshatras span the 360-degree sidereal zodiac, each
spanning exactly `360 / 27` degrees (13°20′); each Nakshatra divides
into 4 Padas, each spanning exactly `360 / 108` degrees (3°20′). Both
spans are computed as exact fractions in code, never a rounded decimal
literal like `13.33`.

**Floating-point safety** (the phase's central technical risk): `360/27`
is not exactly representable in IEEE-754 double precision, so naively
comparing a longitude against `nakshatraIndex * (360/27)` risks landing
a few ULPs to the wrong side of an intended boundary. This module avoids
that by doing every Nakshatra/Pada index decision in an integer
**microarcsecond** space instead: `360° = 1,296,000,000,000`
microarcseconds, and both `1,296,000,000,000 / 27 = 48,000,000,000` and
`1,296,000,000,000 / 108 = 12,000,000,000` divide **exactly**, with zero
rounding error in the span constants themselves (unlike `360/27` in raw
degrees). A longitude is converted into this space via
`Math.round(degrees * 3.6e9)`, which snaps away sub-microarcsecond
binary floating-point noise (around 1e-10 microarcsecond for longitudes
in the 0–360° range) while preserving every deliberate boundary-test
difference this phase relies on (e.g. the 0.001-arcsecond/1,000-
microarcsecond gap between `13°19′59.999″` and the exact `13°20′`
boundary is nine orders of magnitude larger than the noise being
filtered). The human-readable `degreeWithinNakshatra` returned to
callers is derived back from that same integer space, so the displayed
degree and the assigned Pada can never disagree with each other. The
stored Phase 4A sidereal longitude itself is never rounded or degraded —
only this module's internal index arithmetic uses the integer form.

**Boundary policy**: half-open intervals, `[start, end)` — the start of
a Nakshatra or Pada belongs to it; the end boundary belongs to the next
one. E.g. exactly `13°20′00.000″` is Bharani Pada 1, not the end of
Ashwini Pada 4; `13°19′59.999″` is (the very end of) Ashwini.

**Nakshatra lord sequence** (Vimshottari 9-lord cycle, used *only* to
identify each Nakshatra's lord — no Dasha of any kind is computed
anywhere in this phase): Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter,
Saturn, Mercury — repeating three times across the 27 Nakshatras (e.g.
Ashwini/Magha/Purva Ashadha all share Ketu; Bharani/Purva Phalguni/
Uttara Ashadha all share Venus).

**Rahu/Ketu**: both receive ordinary Nakshatra/Pada placement from their
own Phase 4A sidereal longitude, with no special-cased index logic.
Since 180° is exactly 54 Pada-spans (108 total Padas around the
zodiac), Rahu and Ketu are confirmed by test to always sit exactly 54
global-Pada-slots apart — the same exact opposition already established
for their tropical/sidereal longitudes in Phase 4A.

**Verification chart** (1994-11-21, 01:44:00 +08:00, 1.8548°N
102.9325°E, Placidus):

Lagna Nakshatra: **Magha** (#10), Lord **Ketu**, Pada 4.
Moon Nakshatra: **Mrigashira** (#5), Lord **Mars**, Pada 3.

| Graha | Sidereal Longitude | Nakshatra | Lord | Pada | Degree Within Nakshatra |
|---|---|---|---|---|---|
| Sun | 214.3899° | Anuradha (17) | Saturn | 1 | 01°03′23.5″ |
| Moon | 60.9289° | Mrigashira (5) | Mars | 3 | 07°35′44.0″ |
| Mars | 119.2939° | Ashlesha (9) | Mercury | 4 | 12°37′37.9″ |
| Mercury | 201.3615° | Vishakha (16) | Jupiter | 1 | 01°21′41.6″ |
| Jupiter | 212.0970° | Vishakha (16) | Jupiter | 4 | 12°05′49.1″ |
| Venus | 188.8760° | Swati (15) | Rahu | 1 | 02°12′33.4″ |
| Saturn | 312.0059° | Shatabhisha (24) | Rahu | 2 | 05°20′21.2″ |
| Rahu | 200.1638° | Vishakha (16) | Jupiter | 1 | 00°09′49.8″ |
| Ketu | 20.1638° | Bharani (2) | Venus | 3 | 06°49′49.8″ |

**Independent verification**: the Nakshatra index and Pada for every row
above were manually recomputed from the sidereal longitude
(`floor(L / (360/27))`, `floor(degreeWithinNakshatra / (360/108))`) and
matched; the lord sequence was checked against the standard Vimshottari
cycle above with no disagreement. `getNakshatra()` is additionally
exercised directly (bypassing `calculateChart`) at every one of the 27
Nakshatra boundaries and all 108 Pada boundaries, one microarcsecond on
each side, confirming correct classification independent of the one
verification chart's own placements.

**Regression**: Phase 4A's own `lagna`/`grahas`/`ayanamsha`, Phase 4B's
`bhava`, and Modern Western/Classical/Phase 3H outputs are confirmed
byte-for-byte unchanged by dedicated tests.

UI: a new "Nakshatra & Pada｜二十七宿与 Pada" subsection was added inside
the existing Vedic Astrology｜印度占星 section (Moon Nakshatra and Lagna
Nakshatra displayed prominently, then a compact Navagraha → Nakshatra/
Pada table) — additive only, existing Phase 4A/4B subsections untouched.
Verified in-browser at desktop and 390px mobile width: no console
errors, no horizontal page overflow.

New `chart.vedic.meta` fields (Phase 4A's own `nakshatraSystem`
placeholder is now superseded by the real implementation, exactly as
`bhavaSystem` was in Phase 4B): `nakshatraSystem: "27_nakshatra_4_pada"`,
`nakshatraBoundaryPolicy: "half_open_start_inclusive_end_exclusive"`,
`nakshatraLordSequence: "vimshottari_9_lord_cycle"`, `dashaSystem:
"not_implemented"`, `navamsaFromPada: "not_implemented"`,
`nakshatraInterpretation: "none"`.

Zero new production dependencies, zero network calls, runtime remains
fully local/offline (the temporary, dev-only Playwright UI check was
fully uninstalled immediately after use). All 469 tests pass (429
carried over from Phase 1–4B unchanged, plus 40 new Phase 4C tests).

## 22. Phase 4D: Vedic Dignity & Planetary Condition

**Scope**: for the seven classical Grahas, this phase establishes
factual, evidence-only dignity and technical condition: own sign,
exaltation/debilitation (sign and exact degree), Moolatrikona, natural
(Naisargika) planetary friendship, the Graha's relationship to its
current sign's lord, retrograde state, and combustion. Rahu/Ketu are
deliberately given only the fields that ARE well-defined for them
(Rashi, degree, retrograde) — never an invented own-sign/exaltation/
Moolatrikona status. This phase does **not** implement temporary or
compound friendship, Shadbala of any kind, functional benefic/malefic,
Yogakaraka, Maraka, Badhaka, Avasthas, or any dignity/strength score or
interpretation — `chart.vedic.meta` marks every one of those explicitly.

**Architecture**: `chart.vedic.condition` (`src/astrology/vedic/dignityTables.js`
+ `condition.js`) is derived entirely from Phase 4A's own locked sidereal
Graha records plus this phase's researched reference tables — no new
astronomical calculation, no mutation of `grahas`.

**Research discipline**: before writing any code, every table below was
cross-checked against at least two independent sources, per the phase
brief's explicit "Critical Research Rule." Two points of **genuine,
material disagreement** were found and surfaced to the project owner for
an explicit decision *before* implementation, rather than silently
picked:

1. **Moon's Moolatrikona in Taurus**: some sources give 4°–20°; BPHS-
   critical-edition sources give 4°–30° (filling the rest of the sign
   after the 3° exaltation point — Moon is the one planet whose
   Moolatrikona sits inside its own *exaltation* sign). **Decided: 4°–30°.**
2. **Mercury's Moolatrikona in Virgo**: some sources give 15°–20°
   (starting exactly at the exaltation degree); BPHS-critical-edition
   sources give 16°–20° (one degree after it, avoiding overlap with the
   exact exaltation point). **Decided: 16°–20°.**

A third, much narrower discrepancy (Sun's Moolatrikona starting at 0°
vs. 1° Leo) appeared in only one low-quality, unjustified citation
against every other (textually-grounded) source's "0°" — treated as an
isolated citation error, not a second convention, so 0° was kept without
stopping. Saturn's exact exaltation degree showed a cross-**tradition**
difference (20° Libra in every Vedic source vs. 21° in a Western
tropical source) — not a disagreement within Jyotish, so 20° (the
Vedic-specific value) was kept without stopping, consistent with this
phase's Vedic-only scope. Selected convention names:
`exaltationConvention: "parashari_standard_exact_degrees"`,
`moolatrikonaConvention: "bphs_critical_edition"`.

**Own signs (Swakshetra)** — uncontested across every source checked:

| Graha | Own Sign(s) |
|---|---|
| Sun | Leo |
| Moon | Cancer |
| Mars | Aries, Scorpio |
| Mercury | Gemini, Virgo |
| Jupiter | Sagittarius, Pisces |
| Venus | Taurus, Libra |
| Saturn | Capricorn, Aquarius |

**Exaltation / debilitation** (sign — uncontested; exact degree —
Parashari standard, confirmed as above):

| Graha | Exaltation | Exact Degree | Debilitation | Exact Degree |
|---|---|---|---|---|
| Sun | Aries | 10° | Libra | 10° |
| Moon | Taurus | 3° | Scorpio | 3° |
| Mars | Capricorn | 28° | Cancer | 28° |
| Mercury | Virgo | 15° | Pisces | 15° |
| Jupiter | Cancer | 5° | Capricorn | 5° |
| Venus | Pisces | 27° | Virgo | 27° |
| Saturn | Libra | 20° | Aries | 20° |

The debilitation point is always derived mathematically as exactly 180°
from the exaltation point (same degree number, opposite sign) — never a
second, independently-sourced table; confirmed by dedicated test for
every Graha.

**Moolatrikona** (`bphs_critical_edition`, half-open `[start, end)` —
matching this project's Phase 4C boundary-policy precedent). The table
below shows the traditional textual (ordinal whole-degree) wording; see
§22.1 for the audited computational boundary, which differs from this
wording for Moon and Mercury only:

| Graha | Sign | Textual Range |
|---|---|---|
| Sun | Leo | 0°–20° |
| Moon | Taurus | 4°–30° |
| Mars | Aries | 0°–12° |
| Mercury | Virgo | 16°–20° |
| Jupiter | Sagittarius | 0°–10° |
| Venus | Libra | 0°–15° |
| Saturn | Aquarius | 0°–20° |

**Dignity overlap / display precedence** (Part F): `isOwnSign`,
`isExaltedSign`, `isDebilitatedSign`, and `isMoolatrikona` are stored as
fully independent booleans — several real placements make more than one
true at once (Mercury anywhere in Virgo is simultaneously own-sign AND
exaltation-sign; within 16°–20° it is additionally Moolatrikona; Sun
within Leo 0°–20° is simultaneously own-sign AND Moolatrikona). The
single summary field `rashiDignityStatus` uses an explicit, documented
precedence for the four categorical (non-relational) dignities —
**Exaltation > Moolatrikona > Own Sign > Debilitation** — falling back to
the relational classification (friend/neutral/enemy sign) only when none
of those four apply.

**Natural friendship (Naisargika Maitri)** — uncontested across every
source checked, including its well-known asymmetries (e.g. Mercury
naturally considers the Sun a friend, but the Sun considers Mercury only
neutral; Saturn considers Mars an enemy, but Mars considers Saturn only
neutral):

| Graha | Friends | Neutrals | Enemies |
|---|---|---|---|
| Sun | Moon, Mars, Jupiter | Mercury | Venus, Saturn |
| Moon | Sun, Mercury | Mars, Jupiter, Venus, Saturn | — |
| Mars | Sun, Moon, Jupiter | Venus, Saturn | Mercury |
| Mercury | Sun, Venus | Mars, Jupiter, Saturn | Moon |
| Jupiter | Sun, Moon, Mars | Saturn | Mercury, Venus |
| Venus | Mercury, Saturn | Mars, Jupiter | Sun, Moon |
| Saturn | Mercury, Venus | Jupiter | Sun, Moon, Mars |

Used only for natural friendship — temporary (Tatkalika) and compound
(Panchadha) friendship remain explicitly `"not_implemented"`.

**Sign relationship** (Part H): for each Graha, its current sign's lord
is looked up (reusing Phase 4B's own `RASHI_LORDS` table verbatim), and
the Graha's natural relationship to that lord is classified as `"self"`
(own sign), `"friend"`, `"neutral"`, or `"enemy"` — a plain technical
fact only (e.g. Moon exalted in Taurus, ruled by Venus, shows
`naturalRelationshipToSignLord: "neutral"`, since Moon and Venus are
natural neutrals — dignity and sign-relationship are independent axes,
not a contradiction).

**Combustion (Asta)** (`bphs_phaladeepika_per_planet_orb`) — a per-planet
orb table, confirmed consistent across sources citing Brihat Parashara
Hora Shastra and Mantreswara's Phaladeepika, and confirmed structurally
**different** from this project's own separate Western Classical Phase
3B combustion threshold (a single flat 8.5° orb for every planet — see
`solarCondition.js` — never reused here, per the phase brief's explicit
warning):

| Graha | Direct | Retrograde |
|---|---|---|
| Moon | 12° | — (never retrograde) |
| Mars | 17° | (same — no separate retrograde value) |
| Mercury | 14° | 12° |
| Jupiter | 11° | (same — no separate retrograde value) |
| Venus | 10° | 8° |
| Saturn | 15° | (same — no separate retrograde value) |

A follow-up check specifically confirmed only Mercury and Venus (the two
planets that can appear retrograde while near the Sun) carry a distinct
retrograde threshold in these sources. The Sun itself has no combustion
threshold (a body cannot be combust by its own light).

**Retrograde**: `isRetrograde` is reused verbatim from Phase 4A's own
sidereal-speed-based `motion.retrograde` field — never recomputed here,
confirmed by dedicated identity test (Part K/Test 17).

**Verification chart** (1994-11-21, 01:44:00 +08:00, 1.8548°N
102.9325°E, Placidus):

| Graha | Rashi | Deg. in Rashi | Dignity | Moolatrikona | Sign Lord | Relationship | Retrograde | Combustion |
|---|---|---|---|---|---|---|---|---|
| Sun | Scorpio | 04°23′23.5″ | Friend's Sign | No | Mars | Friend | Direct | — |
| Moon | Gemini | 00°55′44.0″ | Friend's Sign | No | Mercury | Friend | Direct | — |
| Mars | Cancer | 29°17′37.9″ | Debilitation | No | Moon | Friend | Direct | — |
| Mercury | Libra | 21°21′41.6″ | Friend's Sign | No | Venus | Friend | Direct | Combust (13.03°) |
| Jupiter | Scorpio | 02°05′49.1″ | Friend's Sign | No | Mars | Friend | Direct | Combust (2.29°) |
| Venus | Libra | 08°52′33.4″ | Moolatrikona | Yes | Venus | Self | Retrograde | — |
| Saturn | Aquarius | 12°00′21.2″ | Moolatrikona | Yes | Saturn | Self | Direct | — |

Rahu (Libra, 20°09′49.8″) and Ketu (Aries, 20°09′49.8″) each show
`dignityConvention: "not_assigned_due_to_traditional_variance"` and
their own retrograde state (both retrograde, per Phase 4A's mean-node
convention) — no own-sign/exaltation/Moolatrikona status is invented for
either.

**Independent verification**: every table above was cross-checked
against at least two sources before adoption (own-sign, exaltation/
debilitation signs, natural friendship: uncontested; exact exaltation
degrees: uncontested except one cross-tradition Saturn note; Moolatrikona
and combustion: explicitly researched and, where materially contested,
resolved by approval rather than silently). `dignityTables.js`'s module
doc comment carries the full source-comparison trail. Dedicated tests
independently recompute the debilitation-is-180°-from-exaltation
property, the Moolatrikona/combustion boundaries at every one of the 7
planets' thresholds, and the natural-friendship table's completeness
(every Graha classifies the other six exactly once, symmetric or not).

**Regression**: Phase 4A's own `grahas`/`lagna`/`ayanamsha`, Phase 4B's
`bhava`, Phase 4C's `nakshatra`, and Modern Western/Classical/Phase 3H
outputs are confirmed byte-for-byte unchanged by dedicated tests.

UI: a new "Planetary Condition｜行星状态" subsection was added inside the
existing Vedic Astrology｜印度占星 section (Graha / Rashi / Dignity /
Moolatrikona / Sign Lord / Relationship / Retrograde / Combustion table;
Rahu/Ketu show "Not assigned — convention varies" rather than an invented
status) — additive only, existing Phase 4A/4B/4C subsections untouched.
Verified in-browser at desktop and 390px mobile width: no console
errors, no horizontal page overflow.

New `chart.vedic.meta` fields: `vedicDignitySystem: "parashari_baseline"`,
`exaltationConvention: "parashari_standard_exact_degrees"`,
`moolatrikonaConvention: "bphs_critical_edition"`,
`naturalFriendshipConvention: "naisargika_maitri_bphs"`,
`combustionConvention: "bphs_phaladeepika_per_planet_orb"`,
`rahuKetuDignity: "not_assigned_due_to_traditional_variance"`,
`temporaryFriendship: "not_implemented"`, `compoundFriendship:
"not_implemented"`, `shadbala: "not_implemented"`,
`vedicConditionInterpretation: "none"`.

Zero new production dependencies, zero network calls, runtime remains
fully local/offline (Playwright was again a temporary devDependency for
the in-browser UI check only, fully uninstalled afterward). All 521
tests pass (469 carried over from Phase 1–4C unchanged, plus 51 new
Phase 4D tests, one existing Phase 4A test split into two to separate
the still-banned interpretive vocabulary from Phase 4D's own newly-
approved technical terms).

### 22.1 Pre-lock audit: Moolatrikona computational boundary for Moon/Mercury

Before locking Phase 4D, a focused audit re-examined Moon's and
Mercury's Moolatrikona for a subtle, real bug distinct from the two
convention CHOICES made during initial research (§22): the "4" and "16"
in "4°–30°" (Moon) and "16°–20°" (Mercury) are ordinal, whole-degree
textual wording from the source texts, not necessarily the literal
computational boundary. The ORIGINAL code used the cardinal reading
literally (`startDegree: 4` / `16`), which left a genuine,
empirically-confirmed one-degree band — Taurus 3°00′01″–3°59′59″ for
Moon, Virgo 15°00′01″–15°59′59″ for Mercury — where `isMoolatrikona` was
`false` despite the planet already being past its own exact exaltation
point (3° Taurus / 15° Virgo) and still inside its exaltation sign. No
source ever discussed or defended sub-degree granularity here; every
source's "4" and "16" were whole-degree ordinal labels, never
floating-point interval boundaries, so this gap was artificial, not
doctrinal.

**Audit findings** (all 12 required points classified against the
pre-audit code): for both Moon (Taurus) and Mercury (Virgo), every one
of the six audited points — X°59′59″ just before the exact exaltation
degree, exactly at it, one second after it, at the half-degree, at
X+1°−1″, and exactly at X+1° — showed `isExaltedSign: true` throughout
(a whole-sign dignity), so `rashiDignityStatus` was `"exaltation"` at
every single point, before AND after this fix — the display output
never changed. Only the independently-stored `isMoolatrikona` boolean
had the gap: `false` for all points strictly between the exact
exaltation degree and the next whole degree, `true` only from the next
whole degree onward.

**Resolution**: the COMPUTATIONAL `startDegree` for both is now the
exact exaltation degree itself, making Moolatrikona a continuous
half-open interval with no unclassified band:

| Graha | Traditional Textual Wording | Computational Interval (audited) |
|---|---|---|
| Moon | "4°–30°" (Taurus) | Taurus **[3°, 30°)** |
| Mercury | "16°–20°" (Virgo) | Virgo **[15°, 20°)** |

The traditional textual wording is preserved verbatim as each
Moolatrikona table entry's new `textLabel` field — only the
computational boundary changed. No other Moolatrikona entry needed this
fix: the other five planets' zones start at 0° of their own sign (not
their exaltation sign), so there is no adjacent exact-exaltation point
to create this ordinal/cardinal ambiguity. `exactExaltationLongitudeSidereal`
remains exactly what it always was — a single point, confirmed
unchanged and unwidened by dedicated test.

New metadata: `moolatrikonaBoundaryConvention:
"continuous_half_open_from_exact_exaltation_degree"` (added to both
`chart.vedic.meta` and `chart.vedic.condition.meta`), distinguishing
this computational-boundary policy from `moolatrikonaConvention:
"bphs_critical_edition"` (which continues to name the underlying
source/table convention, textual wording included).

**No verification-chart change**: the locked verification chart's Moon
(Gemini) and Mercury (Libra) are nowhere near Taurus/Virgo, so this
audit changes nothing about that chart's output — confirmed by dedicated
test comparing before/after. Six new tests were added covering all 12
audited points plus the exact-point/no-widening and metadata checks. All
527 tests pass (521 prior + 6 new).

### 22.2 Pre-lock audit: dignity-status overlap and display precedence

A second, immediately-following pre-lock audit re-examined the *display*
side of the same overlap: with §22.1's fix in place, Moon (anywhere in
Taurus) and Mercury (anywhere in Virgo) could be simultaneously
`isExaltedSign: true` AND `isMoolatrikona: true` — and the original
`rashiDignityStatus` precedence (**Exaltation > Moolatrikona > Own Sign >
Debilitation**, borrowed directly from the classical Shadbala Sthana
Bala *strength* ordering) always picked `"exaltation"` in that case,
because `isExaltedSign` is a coarse, whole-sign fact that is true across
the *entire* sign, while `isMoolatrikona` is a narrower, more specific
sub-zone fact. The result: Mercury at 17° Virgo — deep inside its own
Moolatrikona zone — showed only `"exaltation"`, never revealing
Moolatrikona in the summary label at all. Confirmed empirically across
Moon/Taurus 3°/10°/29° and Mercury/Virgo 15°/17°/25° before any code
changed; confirmed this masking does **not** affect the other five
planets, whose Moolatrikona sits inside their *own* sign rather than
their exaltation sign (there, the already-correct Moolatrikona > Own
Sign ordering already surfaced it).

**Root cause**: using a classical *strength* ordering as a *display-
collapse* precedence is a category error — strength orderings rank
numeric Shadbala contribution (irrelevant here, since this project never
computes Shadbala), not which categorical fact is most informative to
show first.

**Resolution — two complementary, non-destructive fixes:**

1. **Full transparency** (`dignity.dignityLabels`): every applicable
   categorical dignity label that is currently true is now listed
   together, never collapsed to one — e.g. Mercury at 17° Virgo now
   reports `["moolatrikona", "exaltation", "own_sign"]`. Nothing is ever
   hidden, regardless of which label is treated as "primary."
2. **Corrected precedence** for the single convenience field
   `rashiDignityStatus` (= `dignityLabels[0]`), now ordered by
   *specificity* of the underlying fact rather than classical strength:
   `exact exaltation point > Moolatrikona > exaltation (whole sign) >
   own sign > exact debilitation point > debilitation (whole sign) >
   friend/neutral/enemy sign`. Two new booleans support the top tier:
   `isExactExaltationPoint` / `isExactDebilitationPoint` (true only at
   the single, measure-zero exact degree — confirmed by test never to
   widen into a range). Under this precedence, Mercury at 17° Virgo now
   correctly reports `rashiDignityStatus: "moolatrikona"`.

All six raw booleans (`isOwnSign`, `isExaltedSign`, `isDebilitatedSign`,
`isMoolatrikona`, `isExactExaltationPoint`, `isExactDebilitationPoint`)
remain fully independent and are never made mutually exclusive —
confirmed by dedicated test that all four can be simultaneously true for
Mercury at its own exact exaltation degree. A debilitated placement
whose sign-lord happens to be a natural friend (e.g. the verification
chart's own Mars, debilitated in Cancer, ruled by its friend the Moon)
now visibly shows *both* `"debilitation"` and `"friend_sign"` in
`dignityLabels`, rather than silently favoring one.

**UI**: the Planetary Condition table's Dignity column now lists every
simultaneously-true *categorical* dignity (Moolatrikona, Exaltation, Own
Sign, etc. — joined, e.g. "Moolatrikona, Own Sign") rather than a single
collapsed word; the relational labels (friend/neutral/enemy sign) are
left to the existing, separate Relationship column to avoid duplication.
Verified in-browser at desktop and 390px mobile width: no console
errors, no horizontal overflow.

New metadata: `dignityDisplayPolicy:
"most_specific_dignity_label_primary_with_full_dignity_labels_array"`
(added to both `chart.vedic.meta` and `chart.vedic.condition.meta`).
`dignityTables.js` now separately documents the classical Shadbala
strength ordering (`SHADBALA_STRENGTH_ORDER_REFERENCE_ONLY`, kept for
reference/citation only, never used for display) from the corrected
specificity-based ordering actually used
(`DIGNITY_LABEL_SPECIFICITY_PRECEDENCE`).

**No verification-chart change**: none of the seven classical Grahas
sits in its own exaltation sign in the locked verification chart, so
every `rashiDignityStatus` value is byte-for-byte unchanged — confirmed
by dedicated test. Six new tests were added. All 533 tests pass (527
prior + 6 new). Phase 4D can now be safely locked.

## 23. Phase 4E: Vedic Dispositor, Lordship & Functional Structure

**Scope**: this phase builds the structural lordship/dispositor layer on
top of the already-locked Phase 4B (Bhava/house ownership) and Phase 4D
(dignity/condition) data: the immediate Rashi dispositor of every Graha,
full dispositor chains with explicit loop detection, a normalized Lagna
Lord network, the standard Kendra/Trikona/Dusthana/Upachaya house-group
memberships, per-planet structural house-ownership roles (including the
neutral `ownsKendraAndTrikona` evidence flag), a 12-house lord placement
matrix, and a per-planet technical evidence rollup. It performs **no new
astronomical calculation** and builds **no new house or dignity table** —
every fact it reports is either a direct reuse of Phase 4B's
`lordshipNetwork`/`planetaryHouseOwnership` or Phase 4D's
dignity/retrograde/combustion evidence, or a genuinely new computation
(dispositor chains, loop detection, house-group membership) built
strictly on top of those locked facts.

**Deliberately NOT implemented** (see "Functional-label research" below):
functional benefic/malefic, Yogakaraka, Maraka, Badhaka, and any
lordship/dispositor score or interpretation.

**Architecture**: `chart.vedic.lordship` (`src/astrology/vedic/lordship.js`)
takes the already-built `grahas` (Phase 4A), `bhava` (Phase 4B), and
`condition` (Phase 4D) objects as input and never mutates any of them.

**Immediate dispositor** (Parts A/B): the dispositor of a Graha is the
traditional Rashi lord (`rashiLordship.js`'s `RASHI_LORDS` — the exact
same table Phase 4B already uses) of the Rashi it currently occupies. A
Graha in its own sign is its own dispositor (`isSelfDispositor: true`).
Rahu/Ketu receive an ordinary dispositor lookup through the same table
and function as the seven classical Grahas (e.g. Rahu in Libra →
dispositor Venus), but since `RASHI_LORDS` never resolves to `"rahu"` or
`"ketu"`, neither node can ever itself *be* a dispositor of anything, and
neither can ever be a self-dispositor — confirmed by dedicated test.

**Dispositor chains & loop detection** (Parts C/D/E): for each of the
seven classical Grahas, a chain is built by repeatedly following "who
disposits whom" until either a self-dispositor terminates the chain
(`finalDispositor` is set) or a Graha already seen earlier in the same
chain reappears (a **loop** — `finalDispositor` is `null` and the looping
members are exposed explicitly, per the brief's explicit rule never to
force one loop member to stand in as "the" final dispositor). Because
there are only seven classical Grahas and each has exactly one outgoing
"disposits to" edge (a finite functional graph), every chain is
mathematically **guaranteed** to terminate one way or the other within at
most 8 steps — a `CHAIN_SAFETY_LIMIT` of 20 exists purely as defensive
engineering against a hypothetical future bug and is never itself
astrological doctrine. Loops are **canonicalized** (Part E) by sorting
the looping Grahas' display names alphabetically, so "Mars → Sun → Mars"
and "Sun → Mars → Sun" both produce the identical
`{ type: "loop", members: ["Mars", "Sun"] }` object; the chart-level
`loops` array lists each distinct loop exactly once even when multiple
starting Grahas reach it.

**Lagna Lord network** (Part F): `lagnaLordNetwork` normalizes the Lagna
Rashi, its lord, that lord's current Rashi/Bhava, its own dispositor, its
full dispositor chain, and its final dispositor or loop — one flat,
uninterpreted object.

**House groups** (Part G) — standard, uncontested Parashari definitions,
membership only, no good/bad inference:

| Group | Houses |
|---|---|
| Kendra | 1, 4, 7, 10 |
| Trikona | 1, 5, 9 |
| Dusthana | 6, 8, 12 |
| Upachaya | 3, 6, 10, 11 |

**Planetary house-ownership roles** (Parts H/I): for each classical
Graha, `planetaryLordshipRoles` reuses Phase 4B's own
`planetaryHouseOwnership` verbatim (never recomputed) and derives which
owned houses fall in each group, plus `ownsKendraAndTrikona` — exposed
strictly as neutral structural evidence, **never** auto-labeled
Yogakaraka (Part I's explicit instruction).

**12-house lord matrix** (Part J): `houseLordMatrix` normalizes Phase
4B's own `lordshipNetwork` into 12 rows, each carrying that Bhava's lord,
the lord's current Rashi/Bhava, and — reused verbatim from Phase 4D — the
lord's dignity status, retrograde state, and combustion state.

**Per-planet evidence rollup** (Part K): `planetaryLordshipEvidence`
combines each classical Graha's owned houses, Rashi/Bhava placement,
dignity labels, retrograde/combustion state, and dispositor/chain/final-
dispositor/loop into one object — references to data computed above and
in Phase 4D, never a new computation, and never narrative text.

**Functional-label research** (Parts L/M/N/O) — researched and
deliberately deferred, not silently skipped:

- **Functional benefic/malefic**: genuinely Lagna-dependent (a separate
  7-planet table per each of the 12 possible Ascendants) and entangled
  with the disputed Kendradhipati Dosha exception, whose exact
  cancellation conditions are not stated uniformly across sources.
- **Yogakaraka**: Lagna-dependent by definition (only six of the twelve
  possible Ascendants can even produce one) with known special-case
  disagreement over edge conditions and prioritization among candidates.
- **Maraka**: traditional doctrine is inseparable from Dasha/Antardasha
  timing, and this project has no Dasha implementation at all (Phase
  4C's own locked scope boundary) — representing Maraka as static natal
  structure would require inventing an unresearched simplification.
- **Badhaka**: requires classifying the Lagna's sign as movable/fixed/
  dual, a classification this project has not built in any phase to
  date.

**Result**: all four remain `"not_implemented"` in `chart.vedic.meta`,
matching the brief's own preferred defaults — a researched, documented
deferral rather than a silent omission. The neutral structural evidence
these doctrines would eventually build on (`ownsKendra`, `ownsTrikona`,
`ownsKendraAndTrikona`, house-lord placement, dignity, retrograde,
combustion) is already fully exposed, so a future phase can implement any
of the four without revisiting this one.

**Verification chart** (1994-11-21, 01:44:00 +08:00, 1.8548°N
102.9325°E, Placidus) — Lagna Leo, Lagna Lord Sun:

Rashi dispositors (all nine Grahas):

| Graha | Rashi | Dispositor | Self-Dispositor |
|---|---|---|---|
| Sun | Scorpio | Mars | No |
| Moon | Gemini | Mercury | No |
| Mars | Cancer | Moon | No |
| Mercury | Libra | Venus | No |
| Jupiter | Scorpio | Mars | No |
| Venus | Libra | Venus | Yes |
| Saturn | Aquarius | Saturn | Yes |
| Rahu | Libra | Venus | No (node — never self) |
| Ketu | Aries | Mars | No (node — never self) |

Dispositor chains (seven classical Grahas) — **no loops present** in this
chart:

| Graha | Chain | Final Dispositor |
|---|---|---|
| Sun | Sun → Mars → Moon → Mercury → Venus | Venus |
| Moon | Moon → Mercury → Venus | Venus |
| Mars | Mars → Moon → Mercury → Venus | Venus |
| Mercury | Mercury → Venus | Venus |
| Jupiter | Jupiter → Mars → Moon → Mercury → Venus | Venus |
| Venus | Venus | Venus (self) |
| Saturn | Saturn | Saturn (self) |

`loops: []` — the two self-dispositors (Venus, Saturn) are the only
terminal points; every other classical Graha's chain funnels into Venus.

Lagna Lord network: Lagna Rashi Leo → Lagna Lord Sun (Scorpio, Bhava 4) →
dispositor Mars → chain Sun → Mars → Moon → Mercury → Venus → final
dispositor **Venus**.

Planetary house-ownership roles:

| Graha | Owned Houses | Kendra | Trikona | Dusthana | Upachaya | Kendra+Trikona |
|---|---|---|---|---|---|---|
| Sun | 1 | 1 | 1 | — | — | **Yes** |
| Moon | 12 | — | — | 12 | — | No |
| Mars | 4, 9 | 4 | 9 | — | — | **Yes** |
| Mercury | 2, 11 | — | — | — | 11 | No |
| Jupiter | 5, 8 | — | 5 | 8 | — | No |
| Venus | 3, 10 | 10 | — | — | 3, 10 | No |
| Saturn | 6, 7 | 7 | — | 6 | 6 | No |

Only Sun and Mars show `ownsKendraAndTrikona: true` for this chart —
reported as neutral structural evidence only, per Part I never
interpreted as Yogakaraka.

12-house lord matrix:

| Bhava | Rashi | Lord | Lord's Rashi | Lord's Bhava | Dignity | Retrograde | Combust |
|---|---|---|---|---|---|---|---|
| 1 | Leo | Sun | Scorpio | 4 | Friend's Sign | No | No |
| 2 | Virgo | Mercury | Libra | 3 | Friend's Sign | No | Yes |
| 3 | Libra | Venus | Libra | 3 | Moolatrikona | Yes | No |
| 4 | Scorpio | Mars | Cancer | 12 | Debilitation | No | No |
| 5 | Sagittarius | Jupiter | Scorpio | 4 | Friend's Sign | No | Yes |
| 6 | Capricorn | Saturn | Aquarius | 7 | Moolatrikona | No | No |
| 7 | Aquarius | Saturn | Aquarius | 7 | Moolatrikona | No | No |
| 8 | Pisces | Jupiter | Scorpio | 4 | Friend's Sign | No | Yes |
| 9 | Aries | Mars | Cancer | 12 | Debilitation | No | No |
| 10 | Taurus | Venus | Libra | 3 | Moolatrikona | Yes | No |
| 11 | Gemini | Mercury | Libra | 3 | Friend's Sign | No | Yes |
| 12 | Cancer | Moon | Gemini | 11 | Friend's Sign | No | No |

**Independent verification**: every immediate dispositor, chain, final
dispositor, house-ownership role, and matrix row above was hand-traced
against Phase 4B's own `lordshipNetwork`/`planetaryHouseOwnership` and
Phase 4D's own dignity/retrograde/combustion fields before being accepted
— confirmed to match exactly. 42 dedicated tests independently re-derive
immediate dispositors for all nine Grahas, walk every classical Graha's
chain by hand, and exercise five synthetic scenarios built by calling the
real `buildVedicBhava`/`buildVedicCondition`/`buildVedicLordship`
functions on hand-placed Rashi positions: a self-dispositor chain, a
two-planet loop, a three-planet loop, a long chain terminating in a
self-dispositor, and a long chain feeding into an existing loop (with
chart-level deduplication confirmed).

**Regression**: Phase 4A's `grahas`/`lagna`/`ayanamsha`, Phase 4B's
`bhava`, Phase 4C's `nakshatra`, Phase 4D's `condition`, and Modern
Western/Classical/Phase 3H outputs are confirmed byte-for-byte unchanged
by dedicated tests.

**UI**: a new "Dispositor & Lordship Structure｜守护星与宫主结构"
subsection was added inside the existing Vedic Astrology｜印度占星 section
— a Lagna Lord Network table, a Rashi Dispositors table (all nine Grahas,
including Rahu/Ketu with an empty chain/final-dispositor cell), a House
Group Ownership table, and the 12-House Lord Matrix table — technical and
compact, no interpretation. Verified in-browser at desktop (1100px) and
mobile (390px) width: no console errors, no horizontal page overflow.

New `chart.vedic.meta` fields: `dispositorSystem:
"traditional_rashi_lordship"`, `dispositorFinalRule:
"self_dispositor_terminal_only"`, `dispositorLoopPolicy:
"canonical_cycle_no_forced_final_dispositor"`, `houseGroupConvention:
"standard_kendra_trikona_dusthana_upachaya"`, `functionalBenefic:
"not_implemented"`, `functionalMalefic: "not_implemented"`, `yogakaraka:
"not_implemented"`, `maraka: "not_implemented"`, `badhaka:
"not_implemented"`, `vedicLordshipInterpretation: "none"`.

Zero new production dependencies, zero network calls, runtime remains
fully local/offline (Playwright was again a temporary devDependency for
the in-browser UI check only, fully uninstalled afterward). All 575
tests pass (533 carried over from Phase 1–4D unchanged, plus 42 new
Phase 4E tests).

No convention disagreement was found for the house-group definitions
themselves (Kendra/Trikona/Dusthana/Upachaya are uncontested across every
source checked) — the only genuinely disputed doctrines encountered
(functional benefic/malefic, Yogakaraka, Maraka, Badhaka) were resolved
by deferral rather than a silent pick, per the phase brief's own STOP
conditions.

## 24. Phase 4F: Vedic Technical Summary & Evidence Layer

**Scope**: this phase is a pure aggregation/normalization layer over the
already-locked Phase 4A–4E data. It answers "what technical Vedic
evidence already exists for this Graha, Bhava, lordship relationship, and
chart?" — never "what does this mean?" It performs **zero** new
astronomical calculation, recomputes **no** sidereal position, Bhava,
Nakshatra, dignity, combustion, or dispositor chain, and creates **no**
new Jyotish doctrine. Every field in `chart.vedic.summary` is read (and,
where noted, regrouped for traceability) directly from `chart.vedic.grahas`
(Phase 4A), `chart.vedic.bhava` (Phase 4B), `chart.vedic.nakshatra`
(Phase 4C), `chart.vedic.condition` (Phase 4D), and `chart.vedic.lordship`
(Phase 4E).

**Architecture**: `chart.vedic.summary` (`src/astrology/vedic/summary.js`)
takes the already-built Phase 4A–4E objects as read-only input and
returns a `structuredClone()` of its aggregated result — a deep copy, so
mutating `chart.vedic.summary` afterward can never corrupt any locked
Phase 4A–4E source structure (see "Mutation isolation" below). Top-level
shape:

```
chart.vedic.summary = {
  meta,                 // Part B
  chartOverview,        // Part C
  grahas,               // Part D/E - 9 records, keyed by Graha
  bhavas,               // Part F - 12 records, array
  lagnaLordNetwork,      // Part G
  lordship: {            // Part H/I
    planets,             // 7 classical records, keyed by Graha
    dispositorNetwork,
  },
  relationships,          // Part J - factual indexes
  unresolvedConventions,  // Part L - generated live, never hard-coded
  provenance,             // Part M
}
```

**Chart overview** (Part C): sidereal foundation facts (`zodiacType`,
`ayanamsha`, `ayanamshaImplementation`, `ayanamshaIncludesNutation`,
`vedicNodeType`), the Lagna's Rashi/degree/Nakshatra/Pada/Nakshatra
Lord/Lagna Lord, and the active `bhavaSystem`/`houseLordshipSystem`/
`nakshatraSystem`/`vedicDignitySystem`/`dispositorSystem` conventions —
no interpretive label.

**Graha evidence** (Parts D/E): exactly 9 records (`sun`...`saturn`,
`rahu`, `ketu`), each with `identity`, `position` (Phase 4A), `bhava`
(Phase 4B), `nakshatra` (Phase 4C), `dignity`/`condition` (Phase 4D,
classical only), `ownership` (Phase 4E, classical only), `dispositor`
(Phase 4E), a factual `flags` array, and a per-concept `provenance` map.
Every one of Phase 4D's six independent dignity booleans (`isOwnSign`,
`isExaltedSign`, `isDebilitatedSign`, `isMoolatrikona`,
`isExactExaltationPoint`, `isExactDebilitationPoint`) is preserved
verbatim alongside `dignityLabels` and `rashiDignityStatus` — never
collapsed to the convenience status alone (Part E). Rahu/Ketu carry only
what Phase 4A–4E actually computed for them: `dignity.applicable: false`
and `ownership.applicable: false`, never a fabricated own-sign,
exaltation, or house-ownership value; their `dispositor.chain` is
explicitly `null` (`chainApplicable: false`), since Phase 4E's multi-step
dispositor chain is built only for the seven classical Grahas.

**Bhava evidence** (Part F): exactly 12 records, built primarily from
Phase 4E's own `houseLordMatrix` (already combining Phase 4B's placement
facts with Phase 4D's dignity/retrograde/combustion evidence for that
Bhava's lord), plus Phase 4B's own `houses` for occupant Grahas and Phase
4E's own `houseGroups` for Kendra/Trikona/Dusthana/Upachaya membership —
e.g. Bhava 10 → Taurus → Lord Venus → Venus in Bhava 3 → Moolatrikona,
retrograde → Kendra = true, Upachaya = true, nothing more.

**Lagna Lord evidence** (Part G): extends Phase 4E's own
`lagnaLordNetwork` with the lord's Phase 4D dignity (`dignityLabels`,
`rashiDignityStatus`) and Phase 4C Nakshatra/Pada — a plain aggregation,
never an interpretation of that condition.

**Lordship evidence** (Part H): for the seven classical Grahas,
`lordship.planets[key]` combines owned houses (with Kendra/Trikona/
Dusthana/Upachaya breakdowns and the neutral `ownsKendraAndTrikona`
evidence flag), current Bhava/Rashi, dignity labels, retrograde/
combustion, and dispositor — reusing Phase 4E's `planetaryLordshipRoles`
and Phase 4D's condition data verbatim. Functional benefic/malefic,
Yogakaraka, Maraka, and Badhaka are never derived here, exactly as Phase
4E itself never derived them.

**Dispositor network summary** (Part I): `lordship.dispositorNetwork`
normalizes all 9 immediate dispositors, all 7 classical dispositor
chains, all final dispositors, and every distinct loop's canonical
membership (`canonicalMembers`). Phase 4E's public output canonicalizes a
loop's membership by alphabetically sorting display names for
deduplication — the actual DIRECTIONAL cycle order that produced a loop
is not preserved in Phase 4E's returned structure. Rather than
reconstructing that order here (which would mean this aggregation layer
quietly re-deriving a fact Phase 4E itself does not expose), this module
reports `orderedPath: null` explicitly, recorded as its own
`"not_implemented"` marker (`dispositorLoopOrderedPath`) so the
limitation surfaces automatically in `unresolvedConventions` rather than
being silently absent. The locked verification chart has zero loops, so
this limitation is not exercised by real chart data today — only by the
module's own synthetic loop tests.

**Relationship indexes** (Part J) — factual groupings only, never a
semantic index (no `careerPlanets`/`marriagePlanets`):
`grahasByBhava` (all 12 Bhava numbers as keys), `grahasByRashi` (all 12
Rashi names as keys), `grahasByNakshatra` (all 27 Nakshatra names as
keys), `bhavasByLord` (the 7 classical Graha display names as keys,
values = owned Bhava numbers). Every index is dense (all keys present,
even with an empty array) and the union of every bucket in
`grahasByBhava`/`grahasByRashi`/`grahasByNakshatra` covers each of the 9
Grahas exactly once.

**Factual flags** (Part K): generated only from already-computed
evidence — `retrograde`, `combust`, `own_sign`, `exalted_sign`,
`debilitated_sign`, `moolatrikona`, `exact_exaltation_point`,
`exact_debilitation_point`, `self_dispositor`, `dispositor_loop_member`.
No interpretive flag (`strong`/`weak`/`auspicious`/`career_positive`/etc.)
is ever generated.

**Unresolved conventions** (Part L): generated by scanning the LIVE
`chart.vedic.meta` (plus this module's own `dispositorLoopOrderedPath`
marker) for the literal deferral marker strings this project already
uses (`"not_implemented"`, and the generic `"not_yet_implemented"`/
`"deferred"` for future-proofing) — **never a hard-coded topic list**. A
topic's snake_case label is derived mechanically from its camelCase meta
key (e.g. `functionalBenefic` → `functional_benefic`), so a future
phase's newly-deferred field appears automatically, and a topic a future
phase resolves disappears automatically the moment its meta value stops
being one of those markers. `"none"` (used for the interpretation-related
fields, e.g. `vedicInterpretation: "none"`) is deliberately **not**
treated as an unresolved marker — it records a permanent, by-design
architectural decision (this project never interprets), not a deferred/
unbuilt feature. For the locked verification chart, 13 topics are
currently listed: Bhava Chalit, (general) Functional Lordship, Dasha,
Navamsa (from Pada), Temporary Friendship, Compound Friendship, Shadbala,
Functional Benefic, Functional Malefic, Yogakaraka, Maraka, Badhaka, and
Dispositor Loop Ordered Path.

**Provenance** (Part M): every Graha evidence record carries a
per-concept provenance map (`position → phase_4a`, `bhava → phase_4b`,
`nakshatra → phase_4c`, `dignity`/`condition → phase_4d`,
`ownership`/`dispositor → phase_4e`), and the top-level
`summary.provenance` names all 5 source phases with a one-line
description each — Phase 4F never claims to be the source of a fact it
only aggregates.

**Internal reconciliation** (Part R): rather than a second external
astrology source (unnecessary, since this phase computes no new
doctrine), every summary field was verified to equal its locked source
field by dedicated test — Sun/Moon/Rahu/Ketu position against Phase 4A,
every Graha's Bhava against Phase 4B, every Graha's Nakshatra/Pada
against Phase 4C, every classical Graha's dignity/combustion/retrograde
against Phase 4D, every dispositor/chain/final-dispositor/loop against
Phase 4E, and every Bhava's Rashi/lord/lord-placement/house-group against
the combination of Phase 4B/4D/4E.

**Mutation isolation** (Part S): `buildVedicTechnicalSummary()` returns
`structuredClone(summary)` rather than manually tracking every nested
array/object reference — a single, robust guarantee that mutating
`chart.vedic.summary` (pushing into an array, reassigning a nested field)
can never reach back into and corrupt any locked Phase 4A/4B/4C/4D/4E
source structure. Confirmed by 5 dedicated tests, one per source phase.

**Verification chart** (1994-11-21, 01:44:00 +08:00, 1.8548°N
102.9325°E, Placidus): `chartOverview.lagna` = Leo, Lord Sun, Nakshatra
Magha Pada 4; 9/9 Graha evidence records; 12/12 Bhava evidence records;
7/7 classical lordship evidence records; `lagnaLordNetwork.finalDispositor`
= Venus; `lordship.dispositorNetwork.loops` = `[]` (zero loops, matching
Phase 4E's own locked report); `grahasByBhava`/`grahasByRashi`/
`grahasByNakshatra` each account for all 9 Grahas exactly once with no
duplicates; `bhavasByLord` accounts for all 12 Bhavas exactly once across
the 7 classical Graha keys.

**UI**: a new "Technical Summary｜技术摘要" subsection was added at the
end of the existing Vedic Astrology｜印度占星 section — a compact coverage
overview (Lagna, Graha/Bhava/Nakshatra/Dignity/Lordship coverage counts),
a live-generated Unresolved/Deferred Technical Modules table, a
Provenance/Source Phases table, and expandable per-Graha evidence cards
(`<details>`, matching the existing Graha Detail pattern) — deliberately
NOT duplicating any of the giant tables already shown in the Phase
4A–4E subsections above it, and with no interpretation. Verified
in-browser at desktop (1100px) and mobile (390px) width: no console
errors, no horizontal page overflow.

New `chart.vedic.meta` fields: `technicalSummaryVersion: "phase_4f_v1"`,
`technicalSummaryType: "normalized_evidence_layer"`,
`technicalSummaryInterpretation: "none"`,
`technicalSummarySourcePhases: ["phase_4a","phase_4b","phase_4c","phase_4d","phase_4e"]`
(the same four values, without the "Summary" infix on the last one, are
also nested at `chart.vedic.summary.meta.sourcePhases`).

Zero new production dependencies, zero network calls, runtime remains
fully local/offline (Playwright was again a temporary devDependency for
the in-browser UI check only, fully uninstalled afterward). All 652
tests pass (575 carried over from Phase 1–4E unchanged, plus 77 new
Phase 4F tests).

### 24.1 Pre-lock audit: unresolved-convention classification policy

Before locking Phase 4F, a focused audit re-examined
`summary.unresolvedConventions`'s detection logic, distinct from the
astrology evidence itself: the original detector recognized exactly
three literal strings (`"not_implemented"`, `"not_yet_implemented"`,
`"deferred"`) via a plain `Set.has()` equality check — precise (no
substring matching), but under-specified, with no documented answer for
a more specific future value (`"not_implemented_pending_research"`,
`"deferred_due_to_..."` — the latter shape Phase 3H's own classical
marker vocabulary already uses) and no explicitly-named reason for
excluding `"none"`.

**Complete live inventory**: every one of `chart.vedic.meta`'s 49 entries
for the locked verification chart was enumerated and classified by hand
against three explicit categories (never inferred from README text) —
confirmed identical across `chart.vedic.meta` and each Phase 4B–4F
sub-module's own nested `meta` object (`bhava.meta`, `nakshatra.meta`,
`condition.meta`, `lordship.meta`, `summary.meta`), so no deferred field
is hidden from the top-level scan. 12 entries are the literal
`"not_implemented"` (`bhavaChalit`, `functionalLordship`, `dashaSystem`,
`navamsaFromPada`, `temporaryFriendship`, `compoundFriendship`,
`shadbala`, `functionalBenefic`, `functionalMalefic`, `yogakaraka`,
`maraka`, `badhaka`); 6 entries are `"none"`
(`vedicInterpretation`, `vedicHouseInterpretation`,
`nakshatraInterpretation`, `vedicConditionInterpretation`,
`vedicLordshipInterpretation`, `technicalSummaryInterpretation` — all "no
interpretation, by design"); one is
`rahuKetuDignity: "not_assigned_due_to_traditional_variance"`; one is
`externalVerification: "swiss_ephemeris_dev_only_not_production"`; the
remaining ~29 are genuine implemented convention names/facts (e.g.
`"bphs_critical_edition"`, `"traditional_rashi_lordship"`,
`ayanamshaIncludesNutation: false`). No metadata value anywhere used
`"not_yet_implemented"`, `"deferred"`, or `"not_yet_evaluated"` at audit
time.

**Explicit classification policy**: `summary.js` now exports
`classifyImplementationStatus(value)`, returning exactly one of three
named outcomes instead of a bare equality check:

- `"unresolved"` — a genuinely deferred/unbuilt feature: the exact
  literal `"not_implemented"`, the generic forms `"not_yet_implemented"`
  and `"not_yet_evaluated"` (the latter reused from Phase 3H's own
  established marker vocabulary for cross-project consistency), exact
  `"deferred"`, and two prefixes (`"not_implemented_"`, `"deferred_"`) so
  a more specific future value in either family is still recognized —
  without ever falling back to a bare substring match on the word "not".
- `"intentional_not_applicable"` — a PERMANENT, deliberate policy/
  architecture outcome that happens to contain "not" but is never a
  deferred feature: `"none"`, `"not_applicable"`, and
  `"not_assigned_due_to_traditional_variance"` (individually named, not
  pattern-matched — this project's own research established that
  Rahu/Ketu dignity is genuinely disputed across Jyotish schools, a
  permanent selected policy, never described anywhere as "pending future
  implementation").
- `"implemented"` — everything else, including
  `externalVerification: "swiss_ephemeris_dev_only_not_production"` (a
  settled statement about the dev-only verification tooling's deployment
  scope, not a Jyotish feature awaiting implementation).

**Result**: rerunning the full live scan under this explicit policy
produces an **identical 13-topic list** to the pre-audit output for the
locked verification chart (the same 12 `chart.vedic.meta` topics plus
this module's own `dispositorLoopOrderedPath` marker) — **zero missing
topics, zero false positives** were found. The audit changed the
classification's explicitness and future robustness, not today's result.
The `orderedPath: null` / `dispositorLoopOrderedPath: "not_implemented"`
limitation (Part I) is confirmed correctly surfaced by the live scan,
exactly as before — it is not reconstructed or silently fixed here.

**No astrology evidence changed**: this audit touched only
`summary.js`'s unresolved-convention DETECTION logic — no Phase 4A–4E
calculation, no new Jyotish doctrine, and every other `chart.vedic.summary`
field is confirmed byte-for-byte unchanged by dedicated test. 15 new
tests were added (the exact-value/prefix classification cases, the two
intentional-exclusion cases with rationale, a live-metadata-still-drives-
the-list proof, and a full Phase 4A–4F regression check). All 667 tests
pass (652 prior + 15 new). Phase 4F remains safe to lock.

## 25. Phase 5: Cross-System Evidence Mapping

**Scope**: this phase does NOT interpret astrology. It builds a neutral
mapping layer, `chart.crossSystem`, that tells the workspace what
technical evidence already exists in Modern Western (Phase 1/2A),
Classical (Phase 3A–3H), and Vedic (Phase 4A–4F), where that evidence
lives, which concepts across the three systems belong to the same broad
"concept family," and — just as importantly — which concepts must
explicitly NOT be collapsed into each other. It performs **zero** new
astronomical or astrological calculation and creates **no** new doctrine
in any of the three systems. This is groundwork for a later Topic
Retrieval Framework (e.g. "Career" → pull the right Western/Classical/
Vedic evidence) — Phase 5 itself implements none of that retrieval.

**Architecture**: `chart.crossSystem` (`src/astrology/crossSystem.js`)
takes the fully-built `chart` (with `chart.classical` and `chart.vedic`
already attached) as read-only input and returns a `structuredClone()`
of its own result:

```
chart.crossSystem = {
  meta,                  // Part Y
  systems,                // Part B - the 3-system registry
  evidenceAvailability,   // Part C - category x system status matrix
  bodyIdentities,         // Part G/H - shared-body + node identity map
  conceptFamilies,        // Parts D-M - descriptor groups
  comparisonGroups,       // Part O - derived from conceptFamilies
  nonEquivalentConcepts,  // Part N
  unresolvedMappings,     // derived live from evidenceAvailability
  provenance,             // Part P
}
```

**Evidence addressing** (Parts T/U): every mapped item carries a
`sourcePath` — a dot-separated path, relative to the top-level `chart`
object, that the exported `resolveEvidencePath(chart, path)` can walk to
the real value. A path segment on an object is a plain property lookup;
a segment on an array is resolved by finding the element whose `id`,
`key`, `planet`, `pairId`, `bhavaNumber`, or `house` field (tried in that
order — all real identifying fields this codebase's own arrays already
use) equals that segment. This lets `"vedic.summary.bhavas.10.lord"`
resolve against the real array-of-12 `chart.vedic.summary.bhavas` by
matching `bhavaNumber === 10`, without requiring that structure to be
object-keyed. Every `sourcePath` in the module is confirmed, by dedicated
test, to resolve to a defined value against the locked verification
chart — "do not invent paths that do not exist" is enforced by that
test, not merely by code review (67 sourcePaths collected from the real
output, 62 unique, zero resolution failures).

**Deviation from the brief's illustrative prefix** (documented per this
project's standing practice of flagging every deviation): the brief's own
examples use a `"modernWestern.*"` prefix, but no `chart.modernWestern`
key exists anywhere in this codebase — Modern Western evidence lives at
`chart.points`/`chart.planets`/`chart.angles`/`chart.houseCusps`. Since
paths must match real schema, Modern Western sourcePaths are rooted at
the real `"points"` array instead.

**System registry** (Part B): all three systems report `available`,
`zodiacType`, `source`, `summaryAvailable`, and `sourcePhases`. Modern
Western's `summaryAvailable` is `false` — Phase 2A never built a
dedicated aggregation layer like Phase 3H (Classical) or Phase 4F
(Vedic); its evidence is read directly from `chart.points`/`chart.planets`/
`chart.angles`/`chart.houseCusps`.

**Evidence availability map** (Part C) — every `implemented`/
`notImplemented` cell is a live predicate over the real computed chart
(e.g. "does every classical planet have a `.dispositor` field?"), not a
guess; `notApplicable` is reserved for a small, explicitly documented set
of architecturally-foreign concepts (Vedic `houses`, Western/Classical
`nakshatra`/`bhava`) and is never used to hide a genuine gap:

| Concept | Modern Western | Classical | Vedic |
|---|---|---|---|
| Identity | ✓ | ✓ | ✓ |
| Position | ✓ | ✓ | ✓ |
| Zodiac | ✓ | ✓ | ✓ |
| Houses | ✓ | ✓ | n/a |
| House Lords | — | — | ✓ |
| Angles | ✓ | — | — |
| Aspects | — | ✓ | — |
| Dignity | — | ✓ | ✓ |
| Sect | ✓ | ✓ | — |
| Planetary Condition | — | ✓ | ✓ |
| Dispositor | — | ✓ | ✓ |
| Reception | — | ✓ | — |
| Perfection | — | ✓ | — |
| Nakshatra | n/a | n/a | ✓ |
| Bhava | n/a | n/a | ✓ |
| Lordship Structure | — | — | ✓ |
| Motion | ✓ | ✓ | ✓ |
| Nodes | ✓ | — | ✓ |
| Calculated Points | ✓ | — | — |
| Provenance | ✓ | ✓ | ✓ |

Notable honest gaps this audit surfaced: neither Modern Western nor
Classical has ever computed a "chart ruler"/house-ruler field in this
project (only Vedic's Bhava lord is implemented) — never fabricated to
fill the `domain_lordship` concept family. Classical has no dedicated
Angle-point evidence structure (angularity is folded into
`operationalCondition` instead). Classical does not treat the lunar
nodes as classical subjects at all (traditional 7 planets only).

**Shared-body identity mapping** (Part G): the seven classical/shared
planets (Sun...Saturn) are mapped across all three systems with real
per-system longitude/sign/house-or-Bhava values and a `sourcePath` each;
`numericallyEquivalent` is always `false` for these (tropical vs.
sidereal), `conceptuallyRelated` always `true`. The three outer/modern
planets (Uranus/Neptune/Pluto) are mapped Modern-Western-only —
`conceptuallyRelated: false`, never approximated into Classical or Vedic.

**Node mapping** (Part H): North Node/Rahu and South Node/Ketu are a
`lunar_ascending_node`/`lunar_descending_node` concept family.
`numericallyEquivalent` is computed LIVE from the two systems' actual
node conventions for that chart (`chart.meta.nodeType` vs.
`chart.vedic.meta.vedicNodeType`) — `false` by default (Western's default
is `"true"`, Vedic is always `"mean"`), flipping to `true` only if the
caller explicitly selects `nodeType: "mean"` for Western, confirmed by
dedicated test.

**Dignity/dispositor/condition/aspect mapping** (Parts I-L): each family
keeps every system's descriptor, `sourcePath`, and provenance fully
separate — Classical Essential Dignity and Vedic Dignity are grouped
under one `planetary_status_by_sign` family label but never numerically
combined; Classical's tropical dispositor chain and Vedic's sidereal
Rashi-lordship chain are never merged; Classical combustion thresholds
and Vedic combustion thresholds stay two separate descriptors even
though both fall under `planetary_condition`; `vedicAspectStatus:
not_implemented` is exposed explicitly rather than a fabricated Drishti
equivalence.

**Domain lordship mapping** (Part M): Western/Classical house-ruler
evidence is `notImplemented` (never fabricated); Vedic Bhava lordship
(Phase 4B/4E) is the only `implemented` entry in this family — no
universal "10th ruler" field is created that would erase which system a
fact came from.

**Non-equivalent concept registry** (Part N) — 9 explicitly registered
pairs, each with a plain-language reason (never "meaningless," only "not
identical"):

1. Western House (Placidus cusp) ≠ Vedic Bhava (Whole-Sign)
2. Classical Essential Dignity ≠ Vedic Dignity
3. Classical Reception ≠ Vedic Sign Relationship
4. Classical Horary Perfection ≠ any current Vedic structure
5. Western Aspect ≠ Classical Horary Perfection
6. True Node (default) ≠ Mean Rahu
7. Placidus 10th House ≠ Whole-Sign 10th Bhava
8. Modern Chart Ruler ≠ Vedic Lagna Lord
9. MC ≠ Vedic 10th Bhava

**Comparison groups** (Part O) are derived directly from
`conceptFamilies` (never a second, separately-maintained list) —
`self_identity`, `house_structure`, `zodiac_framework`,
`planetary_status_by_sign`, `dispositor_structure`,
`planetary_condition`, `aspects`, `domain_lordship`, plus
`classical_specific`/`vedic_specific`/`western_specific` for the
mechanics that exist in only one system.

**Unresolved mappings**: generated live by scanning `evidenceAvailability`
for every `notImplemented` cell (19 for the verification chart) — never a
hard-coded list, so a future phase that implements one of these features
automatically drops off this list.

**Provenance** (Part P): every descriptor names its real source phase
(`phase_1`/`phase_2a` for Modern Western; `phase_3a`...`phase_3h` for
Classical; `phase_4a`...`phase_4f` for Vedic) — Phase 5 is only the
mapping source, never the source of the underlying astrology facts
themselves.

**Verification chart** (1994-11-21, 01:44:00 +08:00, 1.8548°N
102.9325°E, Placidus):

| Body | Western Sign | Western House | Classical Sign | Classical House | Vedic Rashi | Vedic Bhava |
|---|---|---|---|---|---|---|
| Sun | Scorpio | 3 | Scorpio | 3 | Scorpio | 4 |
| Moon | Gemini | 10 | Gemini | 10 | Gemini | 11 |
| Mercury | Scorpio | 3 | Scorpio | 3 | Libra | 3 |
| Venus | Scorpio | 2 | Scorpio | 2 | Libra | 3 |
| Mars | Leo | 12 | Leo | 12 | Cancer | 12 |
| Jupiter | Scorpio | 3 | Scorpio | 3 | Scorpio | 4 |
| Saturn | Pisces | 6 | Pisces | 6 | Aquarius | 7 |

Sun and Jupiter happen to land in Scorpio in BOTH the tropical and
sidereal zodiac for this chart — a real, unforced coincidence, exactly
the kind of apparent match Part F warns establishes nothing about zodiac
framework equivalence (every other body above shows a different
tropical/sidereal sign, as expected). ASC = Virgo (tropical); Lagna =
Leo (sidereal) — different framework, never compared as if they should
match. MC = Gemini (tropical); the Vedic 10th Bhava is Taurus, ruled by
Venus (itself placed in Bhava 3, Moolatrikona, retrograde) — registered
as non-equivalent constructs (Part N item 9), never merged. North
Node/Rahu and South Node/Ketu both show `numericallyEquivalent: false`
for this chart's default settings (Western `"true"` node vs. Vedic's
fixed `"mean"` node).

**Internal reconciliation**: every `bodyIdentities`/`evidenceAvailability`
value was hand-verified against Phase 1/2A/3A-3H/4A-4F source data before
acceptance — confirmed to match exactly, including the two evidence-
availability predicate bugs a pre-lock check caught and fixed (an
inverted absence-check for Modern Western dignity/planetaryCondition and
for Classical's node-exclusion check) before this phase was considered
correct.

**Mutation isolation**: `buildCrossSystemEvidence()` returns
`structuredClone()` of its result, matching Phase 4F's own established
pattern — confirmed by 3 dedicated tests (one per source system) that
mutating `chart.crossSystem` can never reach back into
`chart.points`/`chart.classical`/`chart.vedic`.

**UI**: a new "Cross-System Evidence｜跨体系证据" section was added at
the end of the page (after Modern Western/Classical/Vedic) — System
Availability, Shared Bodies, the full Evidence Availability Matrix,
Concept Families, and the Non-Equivalent Concepts warning list. Verified
in-browser at desktop (1100px) and mobile (390px) width: no console
errors, no page-level horizontal overflow (wide tables scroll within
their own container, matching every other technical table already in
this app via the existing `*:has(> table)` CSS rule from the Responsive
CSS fix).

New metadata (`chart.crossSystem.meta`): `crossSystemVersion:
"phase_5_v1"`, `crossSystemType: "evidence_mapping_layer"`,
`crossSystemInterpretation: "none"`, `crossSystemComparisonPolicy:
"conceptual_mapping_without_equivalence_or_scoring"`.

Zero new production dependencies, zero network calls, runtime remains
fully local/offline (Playwright was again a temporary devDependency for
the in-browser UI check only, fully uninstalled afterward). All 712
tests pass (667 carried over from Phase 1–4F unchanged, plus 45 new
Phase 5 tests).

No concept was left deliberately unmapped without a documented reason —
every category in `evidenceAvailability` and every pair in
`nonEquivalentConcepts` traces to either a live-verified implementation
fact or an explicit, reasoned `notApplicable`/`notImplemented` status.

### 25.1 Pre-lock audit: cross-system equivalence semantics (nodes and beyond)

Before locking Phase 5, a focused audit re-examined every place this
module used the words "equivalent"/"same"/"identical," prompted by a
review of the original `numericallyEquivalent` logic for lunar nodes.

**The bug**: the original code computed
`numericallyEquivalent: westernNodeType === vedicNodeType` — i.e. it
reported nodes as numerically equivalent whenever both systems selected
the same node CONVENTION (mean vs. true), regardless of coordinate
frame. This is wrong: Western node longitudes are always tropical and
Vedic Rahu/Ketu are always sidereal, so even with matching conventions
the two native longitudes differ by the full ayanamsha offset. Verified
on the locked verification chart: with Western explicitly set to the
Mean Node (matching Vedic's fixed mean-node convention), the North
Node/Rahu longitudes are `223.9495°` (tropical) vs. `200.1638°`
(sidereal) — a genuine `23.79°` difference, not a rounding artifact —
yet the old code would have reported `numericallyEquivalent: true`.

**The fix — four separate, independently-computed dimensions**,
replacing every `conceptuallyRelated`/`numericallyEquivalent` pair in
`bodyIdentities` (shared planets, outer planets, and both lunar nodes):

- `sameAstronomicalIdentity` — do the two sides refer to the same
  underlying astronomical body/point (e.g. Rahu IS the Moon's ascending
  node)?
- `sameCalculationConvention` — were the two sides computed with the
  same underlying method (e.g. both "mean node")? Always `true` for
  ordinary planets (one ephemeris read, reused/converted, no alternate
  convention exists); for nodes it depends on the caller's chosen
  Western `nodeType` versus Vedic's fixed `"mean"`.
- `sameCoordinateFrame` — are the two sides' NATIVE displayed
  longitudes in the same zodiac frame? Computed LIVE
  (`chart.meta.zodiacType === chart.vedic.meta.zodiacType`), always
  `false` today since this project's Western/Classical output is always
  tropical and Vedic is always sidereal.
- `numericallyEquivalent` — `true` ONLY when `sameCoordinateFrame` is
  `true` AND the native longitudes agree within a documented
  `1e-6`-degree tolerance. Matching calculation convention alone is
  explicitly NOT sufficient. No coordinate conversion is ever performed
  merely to force equivalence — the native values are compared as-is.

For shared planets (Sun...Saturn), Modern Western and Classical are
additionally known, live, to share the byte-identical tropical
longitude (Classical never recomputes a position — it reads Phase 1's
own value verbatim) — exposed as its own plain fact,
`westernAndClassicalShareValue`, kept separate from the four dimensions
above (which describe the Western-vs-Vedic relationship specifically).

**Other equivalence-semantics findings**: auditing every other
`equivalent`/`same`/`identical` usage in the module found no other
boolean-level conflation — Classical dispositor/dignity vs. Vedic
dispositor/dignity, and Western/Classical houses vs. Vedic Bhava, were
never represented by a numeric-equivalence boolean at all (only by
concept-family grouping plus the `nonEquivalentConcepts` prose registry,
which already correctly kept them separate). One genuine gap was found
and fixed: ASC (tropical Ascendant) vs. Lagna (sidereal Ascendant) had
no explicit `nonEquivalentConcepts` entry despite being exactly the kind
of pair this registry exists to cover — added as a 10th entry.

**UI**: the Shared Bodies table's single, misleading-by-omission
"Numerically Equivalent" column is now four columns — Same Point / Same
Convention / Same Frame / Numerically Equivalent — with a note
explaining that Same Frame (and therefore Numerically Equivalent) is
always "—" for any Western/Classical-vs-Vedic row in this app, even when
Same Convention is "✓".

New metadata: `crossSystemEquivalencePolicy:
"identity_convention_coordinateFrame_and_numeric_equivalence_are_separate_dimensions"`.

**No astrology calculation changed**: this audit touched only
`crossSystem.js`'s equivalence-labeling logic — no Phase 1-4F
calculation, no new doctrine. `chart.points`, `chart.classical`, and
`chart.vedic` are confirmed byte-for-byte unchanged by dedicated test.
14 new tests were added (the two dimension scenarios named in the audit,
South Node/Ketu mirrors, native-longitude preservation, Sun-Saturn
non-implied-equivalence, ASC/Lagna and MC/10th-Bhava non-equivalence
confirmations, no dignity/dispositor equivalence introduced, full
sourcePath re-validation, and no-interpretation/no-scoring/no-agreement/
full-regression checks). All 726 tests pass (712 prior + 14 new). Phase
5 remains safe to lock.

---

No interpretation is generated anywhere in this codebase, by design:

```
Birth Data → Accurate Astronomical Calculation → Structured Astrology Data → Human Interpretation
```

Software calculates. You interpret.
