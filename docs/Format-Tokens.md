# Format Tokens

Format tokens are placeholders used in display format strings.

---

## Year

| Token         | Description              |
| ------------- | ------------------------ |
| `Y`           | Year (541, 2026)         |
| `YY`          | Year, 2-digit (26 from 2026) |
| `YYYY`        | Year, 4-digit (2026)     |

---

## Month

| Token  | Description                      |
| ------ | -------------------------------- |
| `M`    | Month index (1, 6, 12)           |
| `MM`   | Month index, 2-digit (01, 06, 12)|
| `MMM`  | Month short (Jan, Jun, Dec)      |
| `MMMM` | Month full (January, December)   |
| `Mo`   | Month ordinal (1st, 6th, 12th)   |

---

## Day

| Token | Description                       |
| ----- | --------------------------------- |
| `D`   | Day of month (1, 15, 31)          |
| `DD`  | Day of month, 2-digit (01, 15, 31)|
| `Do`  | Day ordinal (1st, 15th, 31st)     |
| `DDD` | Day of year, 3-digit (001, 166, 365) |

---

## Weekday

| Token   | Description                     |
| ------- | ------------------------------- |
| `EEEE`  | Weekday full (Monday, Tuesday)  |
| `EEE`   | Weekday short (Mon, Tue, Wed)   |
| `EE`    | Weekday short (Mon, Tue, Wed)   |
| `E`     | Weekday short (Mon, Tue, Wed)   |
| `EEEEE` | Weekday narrow (M, T, W)        |
| `e`     | Weekday index (0, 1, 2, 3, 4, 5, 6) |

---

## Week

| Token | Description                    |
| ----- | ------------------------------ |
| `w`   | Week of year (1, 26, 52)       |
| `ww`  | Week of year, 2-digit (01, 26, 52) |
| `W`   | Week of month (1, 2, 3, 4, 5)  |

---

## Time

| Token | Description                    |
| ----- | ------------------------------ |
| `H`   | Hour 24h (0, 14, 23)           |
| `HH`  | Hour 24h, 2-digit (00, 14, 23) |
| `h`   | Hour 12h (1, 2, 12)            |
| `hh`  | Hour 12h, 2-digit (01, 02, 12) |
| `m`   | Minute (0, 30, 59)             |
| `mm`  | Minute, 2-digit (00, 30, 59)   |
| `s`   | Second (0, 30, 59)             |
| `ss`  | Second, 2-digit (00, 30, 59)   |
| `A`   | AM/PM uppercase (AM, PM)       |
| `a`   | am/pm lowercase (am, pm)       |

---

## Era

| Token         | Description              |
| ------------- | ------------------------ |
| `GGGG`        | Era full (Anno Domini)   |
| `GGG`         | Era short (AD, BC)       |
| `GG`          | Era short (AD, BC)       |
| `G`           | Era short (AD, BC)       |
| `[yearInEra]` | Year within era (1, 541) |

---

## Season & Climate

| Token  | Description                           |
| ------ | ------------------------------------- |
| `QQQQ` | Season full (Spring, Summer)          |
| `QQQ`  | Season short (Spr, Sum, Aut, Win)     |
| `QQ`   | Season index, 2-digit (01, 02, 03, 04)|
| `Q`    | Season index (1, 2, 3, 4)             |
| `zzzz` | Climate zone full (Temperate, Tropical) |
| `z`    | Climate zone short (Tmp, Tro)         |

---

## Fantasy

| Token          | Description                                                          |
| -------------- | -------------------------------------------------------------------- |
| `[moon]`       | Moon phase (Full Moon, New Moon)                                     |
| `[moonIcon]`   | Moon phase icon (use `[moonIcon=0]` or `[moonIcon='Name']` for specific moon) |
| `[ch]`         | Canonical hour (Matins, Vespers)                                     |
| `[chAbbr]`     | Canonical hour short (Mat, Ves)                                      |
| `[cycle]`      | Cycle number (1, 2, 3)                                               |
| `[cycleName]`  | Cycle name                                                           |
| `[cycleRoman]` | Cycle roman numeral (I, II, III)                                     |
| `[approxTime]` | Approximate time (Dawn, Noon, Dusk)                                  |
| `[approxDate]` | Approximate date (Early Spring)                                      |

---

## Syntax

Combine tokens to create custom formats:

- `D MMM` → 15 Jan
- `D MMMM, YYYY` → 15 January, 2026
- `EEEE, D MMMM YYYY` → Thursday, 15 January 2026
- `HH:mm` → 14:30
- `h:mm A` → 2:30 PM

Use square brackets `[]` to include literal text:

- `[Year of] YYYY` → Year of 2026
- `[The] Do [of] MMMM` → The 5th of January

**Note:** Custom tokens like `[moon]`, `[cycle]`, etc. use brackets but are recognized as tokens, not literals.

---

## In-App Reference

This same information is available in-app by clicking the help icon (?) next to any Display Formats section in the Settings Panel.
