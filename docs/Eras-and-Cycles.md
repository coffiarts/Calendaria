# Eras and Cycles

## Eras

Eras define historical periods with custom year formatting. Configure eras in the **Calendar Editor > Eras** tab.

### Era Fields

| Field        | Description                            |
| ------------ | -------------------------------------- |
| Name         | Full era name (e.g., "Dale Reckoning") |
| Abbreviation | Short form (e.g., "DR")                |
| Start Year   | First year of this era                 |
| End Year     | Last year (leave empty if ongoing)     |

### Era Resolution

When displaying a year, Calendaria finds the matching era by checking which era contains that year. The `yearInEra` is calculated as `displayYear - startYear + 1`.

### Displaying Eras in Date Formats

Use era format tokens in date format strings to include era information:

| Token  | Description                          |
| ------ | ------------------------------------ |
| `G`    | Era abbreviation (e.g., DR)          |
| `GGGG` | Full era name (e.g., Dale Reckoning) |

Examples:

- `Y G` produces "1492 DR"
- `Do of MMMM, Y GGGG` produces "15th of Hammer, 1492 Dale Reckoning"

---

## Cycles

Cycles are repeating sequences (zodiac signs, elemental weeks, etc.). Configure cycles in the **Calendar Editor > Cycles** tab.

### Cycle Fields

| Field    | Description                                   |
| -------- | --------------------------------------------- |
| Name     | Cycle name (e.g., "Zodiac")                   |
| Length   | How many units before advancing to next entry |
| Offset   | Starting offset for calculation               |
| Based On | Time unit driving the cycle                   |
| Entries  | List of cycle entries with names              |

### Based On Options

| Value      | Description                   |
| ---------- | ----------------------------- |
| `year`     | Calendar year                 |
| `eraYear`  | Year within current era       |
| `month`    | Month index                   |
| `monthDay` | Day of month                  |
| `day`      | Absolute day count from epoch |
| `yearDay`  | Day of year                   |

### Display Format

The cycle format field controls how cycles appear in the UI. Use numbered placeholders for each cycle:

- `[1]`, `[2]`, etc. — Current entry name for each cycle
- `[n]` — Line break

Example: `[1] - Week of [2]` produces "Gemini - Week of Fire"

> [!TIP]
> To display era and cycle information in date format strings, use the format tokens documented in [Format Tokens](Format-Tokens).

---

## For Developers

See [API Reference](API-Reference#eras-and-cycles) for era and cycle methods.
