# Calendaria

![GitHub release](https://img.shields.io/github/v/release/Sayshal/calendaria?style=for-the-badge)
![GitHub Downloads (specific asset, all releases)](<https://img.shields.io/github/downloads/Sayshal/calendaria/module.zip?style=for-the-badge&logo=foundryvirtualtabletop&logoColor=white&logoSize=auto&label=Downloads%20(Total)&color=ff144f>)
![GitHub Downloads (specific asset, latest release)](<https://img.shields.io/github/downloads/Sayshal/calendaria/latest/module.zip?sort=date&style=for-the-badge&logo=foundryvirtualtabletop&logoColor=white&logoSize=auto&label=Downloads%20(Latest)&color=ff144f>)

![Foundry Version](https://img.shields.io/endpoint?url=https%3A%2F%2Ffoundryshields.com%2Fversion%3Fstyle%3Dfor-the-badge%26url%3Dhttps%3A%2F%2Fgithub.com%2FSayshal%2Fcalendaria%2Freleases%2Flatest%2Fdownload%2Fmodule.json)

## Support

[![Discord](https://dcbadge.limes.pink/api/server/PzzUwU9gdz)](https://discord.gg/PzzUwU9gdz)

---

A system-agnostic calendar and time tracking module for Foundry VTT. Manage in-game dates, track moon phases, schedule events, and sync scene darkness with the time of day—and keep tabs on everything from a floating calendar.

## Pre-Built Calendars

Calendaria ships with 15+ ready-to-use calendars:

**Official D&D Settings**: Greyhawk, Harptos (Forgotten Realms), Khorvaire (Eberron), Exandria (Critical Role), Barovia (Ravenloft), Athas (Dark Sun), Krynn (Dragonlance - Elven & Solamnic)

**Other Settings**: Golarion (Pathfinder), Cerilia (Birthright), Thyatia (Mystara), Drakkenheim, Forbidden Lands

**General**: Gregorian, plus the Renescara showcase calendar demonstrating advanced features

Don't see yours? The Calendar Editor lets you build custom calendars from scratch, or import from Simple Calendar, Fantasy-Calendar.com, Seasons & Stars, Simple Timekeeping, and Calendarium (Obsidian.MD).

## Features

**Calendar HUD** — A dome-style widget with animated sky gradients, sun/moon positioning, cloud effects, and time controls. Drag it anywhere on screen, lock position, or collapse to a minimal bar.

**Moon Phases** — Track multiple moons with independent cycles. Define custom phase names, set colors, and configure per-moon behavior.

**Weather** — 27 weather presets across standard, severe, environmental, and fantasy categories. Set up climate zones with seasonal temperature ranges, or pick weather manually.

**Notes & Events** — Create journal-linked notes tied to specific dates. Supports recurrence patterns including weekday-of-month ("2nd Tuesday"), seasonal triggers, moon phase conditions, and linked events that spawn automatically.

**Reminders** — Schedule notifications before events trigger. Choose between toast popups, chat messages, or dialog prompts with snooze.

**Scene Darkness** — Scene lighting follows a day/night cycle based on world time. Configure sunrise/sunset per calendar, or override per-scene.

**Eras & Cycles** — Track historical eras with custom formatting, plus repeating cycles like zodiac signs or elemental weeks.

**Search** — Find notes by name or content across your entire calendar.

**Chat Timestamps** — Optionally display in-game time on chat messages.

## Installation

Install through Foundry's Module Manager or The Forge's Bazaar.

**Manual**: Paste this manifest URL in Foundry's Install Module dialog:
```
https://github.com/Sayshal/calendaria/releases/latest/download/module.json
```

## API

Calendaria exposes a public API at `CALENDARIA.api` for macros and module integration:

```javascript
// Current date and time
const now = CALENDARIA.api.getCurrentDateTime();

// Advance time by 8 hours
await CALENDARIA.api.advanceTime({ hour: 8 });

// Get moon phase (first moon)
const phase = CALENDARIA.api.getMoonPhase(0);

// Check for active festival
const festival = CALENDARIA.api.getCurrentFestival();

// Get weather
const weather = CALENDARIA.api.getWeather();

// Search notes
const results = CALENDARIA.api.search("dragon");
```

