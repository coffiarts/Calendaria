/**
 * Localization mock for testing.
 * Pass-through functions that return keys unchanged.
 * @module Mocks/Localization
 */

/**
 * Mock localize - returns key unchanged.
 * @param {string} key - Localization key
 * @returns {string} - The key unchanged
 */
export function localize(key) {
  return key;
}

/**
 * Mock format - replaces {key} placeholders with values.
 * @param {string} key - Localization key
 * @param {object} data - Replacement data
 * @returns {string} - Key with placeholders replaced
 */
export function format(key, data) {
  let result = key;
  for (const [k, v] of Object.entries(data || {})) {
    result = result.replace(`{${k}}`, String(v));
  }
  return result;
}
