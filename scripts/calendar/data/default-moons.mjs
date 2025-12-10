/**
 * Default moon configurations for various calendar systems.
 * Injected into 5e-provided calendars that lack moon data.
 *
 * @module Calendar/Data/DefaultMoons
 * @author Tyler
 */

/**
 * Standard 8-phase moon cycle used by most calendars.
 * Percentages represent position in the lunar cycle.
 */
const STANDARD_PHASES = [
  { name: 'CALENDARIA.MoonPhase.NewMoon', icon: 'modules/calendaria/assets/moon-phases/01_newmoon.svg', start: 0, end: 0.0625 },
  { name: 'CALENDARIA.MoonPhase.WaxingCrescent', icon: 'modules/calendaria/assets/moon-phases/02_waxingcrescent.svg', start: 0.0625, end: 0.1875 },
  { name: 'CALENDARIA.MoonPhase.FirstQuarter', icon: 'modules/calendaria/assets/moon-phases/03_firstquarter.svg', start: 0.1875, end: 0.3125 },
  { name: 'CALENDARIA.MoonPhase.WaxingGibbous', icon: 'modules/calendaria/assets/moon-phases/04_waxinggibbous.svg', start: 0.3125, end: 0.4375 },
  { name: 'CALENDARIA.MoonPhase.FullMoon', icon: 'modules/calendaria/assets/moon-phases/05_fullmoon.svg', start: 0.4375, end: 0.5625 },
  { name: 'CALENDARIA.MoonPhase.WaningGibbous', icon: 'modules/calendaria/assets/moon-phases/06_waninggibbous.svg', start: 0.5625, end: 0.6875 },
  { name: 'CALENDARIA.MoonPhase.LastQuarter', icon: 'modules/calendaria/assets/moon-phases/07_lastquarter.svg', start: 0.6875, end: 0.8125 },
  { name: 'CALENDARIA.MoonPhase.WaningCrescent', icon: 'modules/calendaria/assets/moon-phases/08_waningcrescent.svg', start: 0.8125, end: 1 }
];

/**
 * Gregorian calendar moon (Earth's Moon / Luna).
 */
export const GREGORIAN_MOONS = [{ name: 'CALENDARIA.Moon.Gregorian.Luna', cycleLength: 30, phases: STANDARD_PHASES, referenceDate: { year: 2025, month: 0, day: 29 } }];

/**
 * Calendar of Harptos moon (Forgotten Realms).
 */
export const HARPTOS_MOONS = [{ name: 'CALENDARIA.Moon.Harptos.Selune', cycleLength: 30, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 15 } }];

/**
 * Calendar of Greyhawk moons (Oerth).
 */
export const GREYHAWK_MOONS = [
  { name: 'CALENDARIA.Moon.Greyhawk.Luna', cycleLength: 28, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 4 } },
  { name: 'CALENDARIA.Moon.Greyhawk.Celene', cycleLength: 91, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 2, day: 12 } }
];

/**
 * Calendar of Khorvaire moons (Eberron).
 */
export const KHORVAIRE_MOONS = [
  { name: 'CALENDARIA.Moon.Khorvaire.Zarantyr', cycleLength: 28, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 0 } },
  { name: 'CALENDARIA.Moon.Khorvaire.Olarune', cycleLength: 35, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 0 } },
  { name: 'CALENDARIA.Moon.Khorvaire.Therendor', cycleLength: 42, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 0 } },
  { name: 'CALENDARIA.Moon.Khorvaire.Eyre', cycleLength: 49, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 0 } },
  { name: 'CALENDARIA.Moon.Khorvaire.Dravago', cycleLength: 56, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 0 } },
  { name: 'CALENDARIA.Moon.Khorvaire.Nymm', cycleLength: 63, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 0 } },
  { name: 'CALENDARIA.Moon.Khorvaire.Lharvion', cycleLength: 70, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 0 } },
  { name: 'CALENDARIA.Moon.Khorvaire.Barrakas', cycleLength: 77, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 0 } },
  { name: 'CALENDARIA.Moon.Khorvaire.Rhaan', cycleLength: 84, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 0 } },
  { name: 'CALENDARIA.Moon.Khorvaire.Sypheros', cycleLength: 91, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 0 } },
  { name: 'CALENDARIA.Moon.Khorvaire.Aryth', cycleLength: 98, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 0 } },
  { name: 'CALENDARIA.Moon.Khorvaire.Vult', cycleLength: 105, phases: STANDARD_PHASES, referenceDate: { year: 0, month: 0, day: 0 } }
];

/**
 * Map of calendar IDs to their default moon configurations.
 */
export const DEFAULT_MOONS = {
  gregorian: GREGORIAN_MOONS,
  harptos: HARPTOS_MOONS,
  greyhawk: GREYHAWK_MOONS,
  khorvaire: KHORVAIRE_MOONS
};

/**
 * Inject default moons into a calendar config if it doesn't have any.
 * @param {string} calendarId - The calendar identifier
 * @param {object} config - The calendar configuration object
 * @returns {object} The config with moons injected (or unchanged if already has moons)
 */
export function injectDefaultMoons(calendarId, config) {
  // Don't overwrite existing moons
  if (config.moons?.length) return config;

  const defaultMoons = DEFAULT_MOONS[calendarId];
  if (!defaultMoons) return config;

  return { ...config, moons: defaultMoons };
}
