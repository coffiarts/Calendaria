/**
 * Foundry VTT globals mock for testing.
 * @module Mocks/Foundry
 */

import { vi } from 'vitest';

// Mock game.i18n
const i18n = {
  localize: vi.fn((key) => key),
  format: vi.fn((key, data) => {
    let result = key;
    for (const [k, v] of Object.entries(data || {})) {
      result = result.replace(`{${k}}`, String(v));
    }
    return result;
  })
};

// Mock user
const user = {
  id: 'test-user',
  name: 'Test User',
  isGM: true,
  active: true
};

// Mock time
const time = {
  worldTime: 0,
  components: { year: 1, month: 0, dayOfMonth: 0, hour: 12, minute: 0, second: 0 },
  advance: vi.fn()
};

// Mock settings
const settings = {
  get: vi.fn(),
  set: vi.fn(() => Promise.resolve(true)),
  register: vi.fn(),
  registerMenu: vi.fn()
};

// Global game object
globalThis.game = {
  i18n,
  user,
  time,
  settings,
  modules: { get: vi.fn() },
  system: { id: 'dnd5e' },
  world: { id: 'test-world' }
};

// Mock ui
globalThis.ui = {
  notifications: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
};

// Mock Hooks
globalThis.Hooks = {
  on: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
  call: vi.fn(),
  callAll: vi.fn()
};

// Mock CONFIG
globalThis.CONFIG = {};

// Mock foundry namespace
globalThis.foundry = {
  utils: {
    mergeObject: vi.fn((target, source) => ({ ...target, ...source })),
    deepClone: vi.fn((obj) => JSON.parse(JSON.stringify(obj)))
  }
};
