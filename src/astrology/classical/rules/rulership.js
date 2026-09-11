/**
 * Traditional (classical) sign rulership — domicile table.
 *
 * Source/tradition: the seven-planet traditional rulership scheme used
 * throughout Hellenistic, medieval, and Renaissance astrology, before the
 * modern-era "discovery rulers" (Uranus/Aquarius, Neptune/Pisces,
 * Pluto/Scorpio) were proposed. This is the universally-agreed baseline
 * table across traditional sources — there is no historical ambiguity
 * here to report, unlike Egyptian Terms.
 *
 * Detriment is derived programmatically as the sign opposite a planet's
 * domicile sign(s), rather than hand-transcribed as a second table — this
 * guarantees the two can never silently drift out of sync, and was
 * cross-checked to match the project's own detriment brief exactly for
 * all seven planets.
 */

export const DOMICILE_RULERS = {
  aries: "mars",
  taurus: "venus",
  gemini: "mercury",
  cancer: "moon",
  leo: "sun",
  virgo: "mercury",
  libra: "venus",
  scorpio: "mars",
  sagittarius: "jupiter",
  capricorn: "saturn",
  aquarius: "saturn",
  pisces: "jupiter",
};

const SIGN_ORDER = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

function oppositeSign(sign) {
  const i = SIGN_ORDER.indexOf(sign);
  return SIGN_ORDER[(i + 6) % 12];
}

/** Every sign a given traditional planet rules by domicile (1 or 2 signs). */
export function domicileSignsOf(planetKey) {
  return SIGN_ORDER.filter((sign) => DOMICILE_RULERS[sign] === planetKey);
}

/** Every sign a given traditional planet is in detriment in (opposite its domicile sign(s)). */
export function detrimentSignsOf(planetKey) {
  return domicileSignsOf(planetKey).map(oppositeSign);
}

export function isDomicile(planetKey, sign) {
  return DOMICILE_RULERS[sign] === planetKey;
}

export function isDetriment(planetKey, sign) {
  return detrimentSignsOf(planetKey).includes(sign);
}

/** Traditional sign ruler (immediate dispositor) of a given sign. */
export function getDispositor(sign) {
  return DOMICILE_RULERS[sign];
}
