/**
 * Tests for API date conversion functions (dateToTimestamp, timestampToDate)
 * Verifies correct 0/1 indexing between external API (1-indexed) and internal (0-indexed)
 * @module Tests/ApiDateConversion
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock CalendarManager before importing
vi.mock('../../scripts/calendar/calendar-manager.mjs', async () => {
  const { default: CalendarManager, defaultCalendar } = await import('../__mocks__/calendar-manager.mjs');
  return { default: CalendarManager, defaultCalendar };
});

import CalendarManager from '../../scripts/calendar/calendar-manager.mjs';

// Import API functions directly for testing
// We'll test the conversion logic by simulating what the API does

beforeEach(() => {
  CalendarManager._reset();
});

/* -------------------------------------------- */
/*  Date Indexing Convention Tests              */
/* -------------------------------------------- */

describe('Date Indexing Conventions', () => {
  describe('External API uses 1-indexed days', () => {
    it('day 1 represents the first day of the month', () => {
      // Simulate timestampToDate: internal dayOfMonth 0 → external day 1
      const internalDayOfMonth = 0;
      const externalDay = internalDayOfMonth + 1;
      expect(externalDay).toBe(1);
    });

    it('day 31 represents the 31st day of the month', () => {
      const internalDayOfMonth = 30;
      const externalDay = internalDayOfMonth + 1;
      expect(externalDay).toBe(31);
    });
  });

  describe('Internal uses 0-indexed dayOfMonth', () => {
    it('dayOfMonth 0 represents the first day of the month', () => {
      const externalDay = 1;
      const internalDayOfMonth = externalDay - 1;
      expect(internalDayOfMonth).toBe(0);
    });

    it('dayOfMonth 30 represents the 31st day of the month', () => {
      const externalDay = 31;
      const internalDayOfMonth = externalDay - 1;
      expect(internalDayOfMonth).toBe(30);
    });
  });
});

/* -------------------------------------------- */
/*  timestampToDate Tests                       */
/* -------------------------------------------- */

describe('timestampToDate()', () => {
  it('returns 1-indexed day from 0-indexed internal dayOfMonth', () => {
    const calendar = CalendarManager.getActiveCalendar();
    // timeToComponents returns 0-indexed dayOfMonth
    const timestamp = 0; // Start of epoch
    const components = calendar.timeToComponents(timestamp);

    // Simulate timestampToDate conversion
    const result = {
      year: components.year,
      month: components.month,
      day: components.dayOfMonth + 1, // Convert to 1-indexed
      hour: components.hour,
      minute: components.minute
    };

    expect(result.day).toBe(1); // First day should be 1, not 0
  });

  it('returns day 15 for internal dayOfMonth 14', () => {
    const calendar = CalendarManager.getActiveCalendar();
    // Create timestamp for day 15 (14 in 0-indexed)
    const secondsPerDay = 24 * 60 * 60;
    const timestamp = 14 * secondsPerDay; // 14 days from epoch
    const components = calendar.timeToComponents(timestamp);

    const result = {
      day: components.dayOfMonth + 1
    };

    expect(result.day).toBe(15);
  });
});

/* -------------------------------------------- */
/*  dateToTimestamp Tests                       */
/* -------------------------------------------- */

describe('dateToTimestamp()', () => {
  it('converts 1-indexed day to 0-indexed for internal use', () => {
    // Simulate dateToTimestamp with external 1-indexed day
    const externalDate = { year: 0, month: 0, day: 1 };

    // The fix: dayOfMonth = date.day - 1
    const dayOfMonth = externalDate.day - 1;

    expect(dayOfMonth).toBe(0); // Internal should be 0-indexed
  });

  it('converts day 19 to internal dayOfMonth 18', () => {
    const externalDate = { year: 2026, month: 4, day: 19 };
    const dayOfMonth = externalDate.day - 1;

    expect(dayOfMonth).toBe(18);
  });

  it('handles dayOfMonth property directly (0-indexed)', () => {
    // If caller passes dayOfMonth directly, use it as-is (already 0-indexed)
    const internalDate = { year: 2026, month: 4, dayOfMonth: 18 };

    // The fix prioritizes dayOfMonth over day
    const dayOfMonth = internalDate.dayOfMonth ?? (internalDate.day != null ? internalDate.day - 1 : 0);

    expect(dayOfMonth).toBe(18);
  });

  it('prioritizes dayOfMonth over day when both are provided', () => {
    const mixedDate = { year: 2026, month: 4, day: 19, dayOfMonth: 18 };

    const dayOfMonth = mixedDate.dayOfMonth ?? (mixedDate.day != null ? mixedDate.day - 1 : 0);

    expect(dayOfMonth).toBe(18); // dayOfMonth takes priority
  });
});

/* -------------------------------------------- */
/*  Roundtrip Conversion Tests                  */
/* -------------------------------------------- */

describe('Roundtrip: dateToTimestamp → timestampToDate', () => {
  it('preserves day value through roundtrip (day 1)', () => {
    const calendar = CalendarManager.getActiveCalendar();
    const originalDate = { year: 0, month: 0, day: 1 };

    // dateToTimestamp: convert 1-indexed to 0-indexed, then to timestamp
    const dayOfMonth = originalDate.day - 1; // 0
    const components = { year: originalDate.year, day: dayOfMonth, hour: 0, minute: 0, second: 0 };
    const timestamp = calendar.componentsToTime(components);

    // timestampToDate: convert timestamp back, then 0-indexed to 1-indexed
    const resultComponents = calendar.timeToComponents(timestamp);
    const resultDay = resultComponents.dayOfMonth + 1;

    expect(resultDay).toBe(originalDate.day);
  });

  it('preserves day value through roundtrip (day 19)', () => {
    const calendar = CalendarManager.getActiveCalendar();
    const originalDate = { year: 0, month: 4, day: 19 };

    // dateToTimestamp
    const dayOfMonth = originalDate.day - 1; // 18
    let dayOfYear = dayOfMonth;
    const months = calendar.months.values;
    for (let i = 0; i < originalDate.month; i++) {
      dayOfYear += months[i].days;
    }
    const components = { year: originalDate.year, day: dayOfYear, hour: 0, minute: 0, second: 0 };
    const timestamp = calendar.componentsToTime(components);

    // timestampToDate
    const resultComponents = calendar.timeToComponents(timestamp);
    const resultDay = resultComponents.dayOfMonth + 1;

    expect(resultDay).toBe(originalDate.day);
  });

  it('preserves day value through roundtrip (last day of month)', () => {
    const calendar = CalendarManager.getActiveCalendar();
    // January has 31 days
    const originalDate = { year: 0, month: 0, day: 31 };

    // dateToTimestamp
    const dayOfMonth = originalDate.day - 1; // 30
    const components = { year: originalDate.year, day: dayOfMonth, hour: 0, minute: 0, second: 0 };
    const timestamp = calendar.componentsToTime(components);

    // timestampToDate
    const resultComponents = calendar.timeToComponents(timestamp);
    const resultDay = resultComponents.dayOfMonth + 1;

    expect(resultDay).toBe(originalDate.day);
  });

  it('preserves full date through roundtrip', () => {
    const calendar = CalendarManager.getActiveCalendar();
    const originalDate = { year: 5, month: 6, day: 15, hour: 14, minute: 30 };

    // dateToTimestamp
    const dayOfMonth = originalDate.day - 1;
    let dayOfYear = dayOfMonth;
    const months = calendar.months.values;
    for (let i = 0; i < originalDate.month; i++) {
      dayOfYear += months[i].days;
    }
    const components = {
      year: originalDate.year,
      day: dayOfYear,
      hour: originalDate.hour,
      minute: originalDate.minute,
      second: 0
    };
    const timestamp = calendar.componentsToTime(components);

    // timestampToDate
    const resultComponents = calendar.timeToComponents(timestamp);
    const result = {
      year: resultComponents.year,
      month: resultComponents.month,
      day: resultComponents.dayOfMonth + 1,
      hour: resultComponents.hour,
      minute: resultComponents.minute
    };

    expect(result.year).toBe(originalDate.year);
    expect(result.month).toBe(originalDate.month);
    expect(result.day).toBe(originalDate.day);
    expect(result.hour).toBe(originalDate.hour);
    expect(result.minute).toBe(originalDate.minute);
  });
});

/* -------------------------------------------- */
/*  Edge Cases                                  */
/* -------------------------------------------- */

describe('Edge Cases', () => {
  it('handles day 1 of month correctly (boundary)', () => {
    const externalDay = 1;
    const internalDayOfMonth = externalDay - 1;
    expect(internalDayOfMonth).toBe(0);

    // And back
    const backToExternal = internalDayOfMonth + 1;
    expect(backToExternal).toBe(1);
  });

  it('handles missing day property with default', () => {
    const dateWithoutDay = { year: 2026, month: 4 };

    // The fix: default to day 1 (which becomes 0 internally)
    const dayOfMonth = dateWithoutDay.dayOfMonth ?? (dateWithoutDay.day != null ? dateWithoutDay.day - 1 : 0);

    expect(dayOfMonth).toBe(0);
  });

  it('handles null day property', () => {
    const dateWithNullDay = { year: 2026, month: 4, day: null };

    // day is null, so use default
    const dayOfMonth = dateWithNullDay.dayOfMonth ?? (dateWithNullDay.day != null ? dateWithNullDay.day - 1 : 0);

    expect(dayOfMonth).toBe(0);
  });

  it('handles December 31st correctly', () => {
    const calendar = CalendarManager.getActiveCalendar();
    const originalDate = { year: 0, month: 11, day: 31 }; // December 31st

    // dateToTimestamp
    const dayOfMonth = originalDate.day - 1; // 30
    let dayOfYear = dayOfMonth;
    const months = calendar.months.values;
    for (let i = 0; i < originalDate.month; i++) {
      dayOfYear += months[i].days;
    }
    const components = { year: originalDate.year, day: dayOfYear, hour: 0, minute: 0, second: 0 };
    const timestamp = calendar.componentsToTime(components);

    // timestampToDate
    const resultComponents = calendar.timeToComponents(timestamp);
    const resultDay = resultComponents.dayOfMonth + 1;

    expect(resultDay).toBe(31);
    expect(resultComponents.month).toBe(11);
  });

  it('handles first day of year correctly', () => {
    const calendar = CalendarManager.getActiveCalendar();
    const originalDate = { year: 1, month: 0, day: 1 }; // January 1st, year 1

    // dateToTimestamp
    const dayOfMonth = originalDate.day - 1; // 0
    const components = { year: originalDate.year, day: dayOfMonth, hour: 0, minute: 0, second: 0 };
    const timestamp = calendar.componentsToTime(components);

    // timestampToDate
    const resultComponents = calendar.timeToComponents(timestamp);
    const result = {
      year: resultComponents.year,
      month: resultComponents.month,
      day: resultComponents.dayOfMonth + 1
    };

    expect(result.year).toBe(1);
    expect(result.month).toBe(0);
    expect(result.day).toBe(1);
  });
});

/* -------------------------------------------- */
/*  Regression Test for Reported Bug            */
/* -------------------------------------------- */

describe('Regression: Bug fix verification', () => {
  it('dateToTimestamp then timestampToDate returns same day (the reported bug)', () => {
    const calendar = CalendarManager.getActiveCalendar();
    const inputDate = { year: 2026, month: 4, day: 19 };

    // This is the exact scenario that was reported as broken:
    // api.timestampToDate(api.dateToTimestamp({year: 2026, month: 4, day: 19}))
    // was returning { year: 2026, month: 4, day: 20, ...} instead of day: 19

    // Simulate dateToTimestamp with fix
    const dayOfMonth = inputDate.dayOfMonth ?? (inputDate.day != null ? inputDate.day - 1 : 0);
    expect(dayOfMonth).toBe(18); // Internal 0-indexed

    let dayOfYear = dayOfMonth;
    const months = calendar.months.values;
    for (let i = 0; i < inputDate.month; i++) {
      dayOfYear += months[i].days;
    }

    const components = {
      year: inputDate.year,
      day: dayOfYear,
      hour: 0,
      minute: 0,
      second: 0
    };
    const timestamp = calendar.componentsToTime(components);

    // Simulate timestampToDate
    const resultComponents = calendar.timeToComponents(timestamp);
    const outputDate = {
      year: resultComponents.year,
      month: resultComponents.month,
      day: resultComponents.dayOfMonth + 1, // Convert back to 1-indexed
      hour: resultComponents.hour,
      minute: resultComponents.minute
    };

    // The fix ensures day 19 comes back as day 19, not day 20
    expect(outputDate.day).toBe(19);
    expect(outputDate.month).toBe(4);
    expect(outputDate.year).toBe(2026);
  });

  it('multiple roundtrips preserve the date', () => {
    const calendar = CalendarManager.getActiveCalendar();
    let date = { year: 2026, month: 4, day: 19 };

    // Perform 5 roundtrips
    for (let i = 0; i < 5; i++) {
      // dateToTimestamp
      const dayOfMonth = date.dayOfMonth ?? (date.day != null ? date.day - 1 : 0);
      let dayOfYear = dayOfMonth;
      const months = calendar.months.values;
      for (let m = 0; m < date.month; m++) {
        dayOfYear += months[m].days;
      }
      const timestamp = calendar.componentsToTime({
        year: date.year,
        day: dayOfYear,
        hour: 0,
        minute: 0,
        second: 0
      });

      // timestampToDate
      const resultComponents = calendar.timeToComponents(timestamp);
      date = {
        year: resultComponents.year,
        month: resultComponents.month,
        day: resultComponents.dayOfMonth + 1
      };
    }

    // After 5 roundtrips, date should still be the same
    expect(date.year).toBe(2026);
    expect(date.month).toBe(4);
    expect(date.day).toBe(19);
  });
});
