/**
 * Weather Picker Application
 * Allows GMs to select or randomly generate weather.
 * @module Weather/WeatherPicker
 * @author Tyler
 */

import { HOOKS, TEMPLATES } from '../constants.mjs';
import { localize } from '../utils/localization.mjs';
import { fromDisplayUnit, getTemperatureUnit, toDisplayUnit } from './climate-data.mjs';
import WeatherManager from './weather-manager.mjs';
import { WEATHER_CATEGORIES, getPresetsByCategory } from './weather-presets.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Weather picker application with selectable presets.
 */
class WeatherPickerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  /** @type {string|null} Selected zone ID (null = no filtering) */
  #selectedZoneId = undefined;

  /** @type {boolean} Whether to set selected zone as calendar's active zone */
  #setAsActiveZone = false;

  /** @type {string|null} Custom weather label input (null = use current weather) */
  #customLabel = null;

  /** @type {string|null} Custom weather temperature input (null = use current weather) */
  #customTemp = null;

  /** @type {string|null} Custom weather icon input (null = use current weather) */
  #customIcon = null;

  /** @type {string|null} Custom weather color input (null = use current weather) */
  #customColor = null;

  /** @override */
  static DEFAULT_OPTIONS = {
    id: 'weather-picker',
    classes: ['calendaria', 'weather-picker-app', 'standard-form'],
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
    if (this.#selectedZoneId === undefined) this.#selectedZoneId = WeatherManager.getActiveZone(null, game.scenes.active)?.id ?? null;
    const selectedZone = this.#selectedZoneId ? zones.find((z) => z.id === this.#selectedZoneId) : null;
    context.setAsActiveZone = this.#setAsActiveZone;
    context.zoneOptions = [{ value: '', label: localize('CALENDARIA.Common.None'), selected: !this.#selectedZoneId }];
    for (const z of zones) context.zoneOptions.push({ value: z.id, label: localize(z.name), selected: z.id === this.#selectedZoneId });
    context.zoneOptions.sort((a, b) => {
      if (a.value === '') return -1;
      if (b.value === '') return 1;
      return a.label.localeCompare(b.label, game.i18n.lang);
    });
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

    context.temperatureUnit = getTemperatureUnit() === 'fahrenheit' ? '°F' : '°C';

    const currentWeather = WeatherManager.getCurrentWeather();
    const currentTemp = WeatherManager.getTemperature();
    context.customLabel = this.#customLabel ?? (currentWeather?.label ? localize(currentWeather.label) : '');
    context.customTemp = this.#customTemp ?? (currentTemp != null ? toDisplayUnit(currentTemp) : '');
    context.customIcon = this.#customIcon ?? (currentWeather?.icon || 'fa-question');
    context.customColor = this.#customColor ?? (currentWeather?.color || '#888888');

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
    this.#setAsActiveZone = data.setAsActiveZone ?? false;
    this.#customLabel = data.customLabel ?? '';
    this.#customTemp = data.customTemp ?? '';
    this.#customIcon = data.customIcon ?? '';
    this.#customColor = data.customColor ?? '#888888';
    if (this.#setAsActiveZone && this.#selectedZoneId) await WeatherManager.setActiveZone(this.#selectedZoneId);

    // Update weather live when custom fields change
    if (this.#customLabel) {
      const temperature = this.#customTemp ? fromDisplayUnit(parseInt(this.#customTemp, 10)) : null;
      await WeatherManager.setCustomWeather({
        label: this.#customLabel,
        temperature,
        icon: this.#customIcon || 'fa-question',
        color: this.#customColor || '#888888'
      });
      Hooks.callAll(HOOKS.WEATHER_CHANGE);
    }

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
    await WeatherManager.generateAndSetWeather({ zoneId: this.#selectedZoneId });
    this.#customLabel = null;
    this.#customTemp = null;
    this.#customIcon = null;
    this.#customColor = null;
    Hooks.callAll(HOOKS.WEATHER_CHANGE);
    this.render();
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
