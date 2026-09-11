# Personal Astrology Workspace｜个人占星工作台

A private, local-first astrology calculation tool. This is **not** related
to any other project — it has its own codebase, its own dependencies, and
no shared code, credentials, or services with anything else.

**Phase 1 status:** Tropical Western Astrology calculation prototype only.
No interpretation, no AI, no Vedic/Classical/sidereal systems yet — see
"What Phase 1 does NOT support" below.

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

By design, deferred to later phases:

- Chiron, Ceres, Pallas, Juno, Vesta, Lilith, North/South Node, Part of
  Fortune, Vertex, East Point, Eros
- Classical/essential/accidental dignities
- Vedic / sidereal astrology, nakshatras, ayanamsa
- Any interpretation: personality, career, relationship, psychological,
  or AI-generated readings/summaries of any kind
- Chart comparison (synastry), transits, progressions
- Chart wheel graphics, PDF/Excel export
- Birth place autocomplete / geocoding (Phase 1 requires manually entering
  latitude, longitude, and UTC offset — a local place-name database is
  planned for a future phase, explicitly *not* a geocoding API)
- House systems other than Placidus

This software calculates. It does not interpret. Interpretation is left to
you, by design.

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

---

No interpretation is generated anywhere in this codebase, by design:

```
Birth Data → Accurate Astronomical Calculation → Structured Astrology Data → Human Interpretation
```

Software calculates. You interpret.
