/**
 * Weather Picker Application
 * Allows GMs to select or randomly generate weather.
 * @module Weather/WeatherPicker
 * @author Tyler
 */

import { HOOKS, TEMPLATES } from '../constants.mjs';
import { localize } from '../utils/localization.mjs';
import WeatherManager from './weather-manager.mjs';
import { WEATHER_CATEGORIES, getPresetsByCategory } from './weather-presets.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Weather picker application with selectable presets.
 */
class WeatherPickerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  /** @type {string|null} Selected zone ID (null = no filtering) */
  #selectedZoneId = undefined;

  /** @override */
  static DEFAULT_OPTIONS = {
    id: 'weather-picker',
    classes: ['calendaria', 'weather-picker-app'],
    tag: 'form',
    window: { title: 'CALENDARIA.Weather.Picker.Title', icon: 'fas fa-cloud-sun', resizable: false },
    position: { width: 550, height: 'auto' },
    form: { handler: WeatherPickerApp._onZoneChange, submitOnChange: true, closeOnSubmit: false },
    actions: {
      selectWeather: WeatherPickerApp._onSelectWeather,
      randomWeather: WeatherPickerApp._onRandomWeather,
      clearWeather: WeatherPickerApp._onClearWeather
    }
  };

  /** @override */
  static PARTS = { content: { template: TEMPLATES.WEATHER.PICKER } };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const customPresets = WeatherManager.getCustomPresets();
    const zones = WeatherManager.getCalendarZones() || [];
    if (this.#selectedZoneId === undefined) this.#selectedZoneId = WeatherManager.getActiveZone()?.id ?? null;
    const selectedZone = this.#selectedZoneId ? zones.find((z) => z.id === this.#selectedZoneId) : null;
    context.zoneOptions = [{ value: '', label: localize('CALENDARIA.Weather.Picker.NoZone'), selected: !this.#selectedZoneId }];
    for (const z of zones) context.zoneOptions.push({ value: z.id, label: z.name, selected: z.id === this.#selectedZoneId });
    const enabledPresetIds = new Set();
    if (selectedZone?.presets) for (const p of selectedZone.presets) if (p.enabled !== false) enabledPresetIds.add(p.id);
    const shouldFilter = selectedZone && enabledPresetIds.size > 0;
    context.categories = [];
    const categoryIds = ['standard', 'severe', 'environmental', 'fantasy'];
    for (const categoryId of categoryIds) {
      const category = WEATHER_CATEGORIES[categoryId];
      let presets = getPresetsByCategory(categoryId, customPresets);
      if (shouldFilter) presets = presets.filter((p) => enabledPresetIds.has(p.id));
      if (presets.length === 0) continue;
      context.categories.push({
        id: categoryId,
        label: localize(category.label),
        presets: presets.map((p) => ({ id: p.id, label: localize(p.label), description: p.description ? localize(p.description) : localize(p.label), icon: p.icon, color: p.color }))
      });
    }

    if (customPresets.length > 0) {
      let filtered = customPresets;
      if (shouldFilter) filtered = customPresets.filter((p) => enabledPresetIds.has(p.id));
      if (filtered.length > 0) {
        context.categories.push({
          id: 'custom',
          label: localize(WEATHER_CATEGORIES.custom.label),
          presets: filtered.map((p) => {
            const label = p.label.startsWith('CALENDARIA.') ? localize(p.label) : p.label;
            const description = p.description ? (p.description.startsWith('CALENDARIA.') ? localize(p.description) : p.description) : label;
            return { id: p.id, label, description, icon: p.icon, color: p.color };
          })
        });
      }
    }

    return context;
  }

  /**
   * Handle zone selection change.
   * @param {Event} _event - The change event
   * @param {HTMLFormElement} _form - The form element
   * @param {object} formData - The form data
   */
  static async _onZoneChange(_event, _form, formData) {
    const data = foundry.utils.expandObject(formData.object);
    this.#selectedZoneId = data.climateZone || null;
    this.render();
  }

  /**
   * Select a specific weather preset.
   * @param {PointerEvent} _event - The click event
   * @param {HTMLElement} target - The clicked element
   */
  static async _onSelectWeather(_event, target) {
    const presetId = target.dataset.presetId;
    await WeatherManager.setWeather(presetId);
    await this.close();
    Hooks.callAll(HOOKS.WEATHER_CHANGE);
  }

  /**
   * Generate random weather.
   * @param {PointerEvent} _event - The click event
   * @param {HTMLElement} _target - The clicked element
   */
  static async _onRandomWeather(_event, _target) {
    await WeatherManager.generateAndSetWeather();
    await this.close();
    Hooks.callAll(HOOKS.WEATHER_CHANGE);
  }

  /**
   * Clear current weather.
   * @param {PointerEvent} _event - The click event
   * @param {HTMLElement} _target - The clicked element
   */
  static async _onClearWeather(_event, _target) {
    await WeatherManager.clearWeather();
    await this.close();
    Hooks.callAll(HOOKS.WEATHER_CHANGE);
  }
}

/**
 * Open the weather picker application.
 * @returns {Promise<void>}
 */
export async function openWeatherPicker() {
  const existing = foundry.applications.instances.get('weather-picker');
  if (existing) {
    existing.render(true, { focus: true });
    return;
  }
  new WeatherPickerApp().render(true);
}
