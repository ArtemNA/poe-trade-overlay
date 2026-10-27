# Redesign brief: the price check of Price of Exile

Price of Exile is a Path of Exile price check overlay for Windows (Angular 22 + Tauri 2, Tailwind 4),
a faster rewrite of Awakened PoE Trade (APT). It already works; this brief is about how its windows
look and read, above all the price check.

## What the owner said (verbatim, Ukrainian)

> мені подобається візуальний стиль базовий, колір і тп. хоча я не жорстко до них привязаний.
> дизайн же APT в міру дивний через висоту але насправді дуже зручний (хоча мені твоя ідея з правою
> доп колонкою для цін, вікі і всього такого подобається більше), проте я думаю що список модів,
> статус (кораптед), база, її рівень тощо — в нас менш зручна ніж в оригіналі.

In English: *I like the current visual style, its colours and so on, though I'm not strictly tied to
them. APT's design is somewhat odd because of its height, but actually very convenient (though I like
our idea of a right-hand column for prices, wiki and the rest better). Still, I think our mod list,
the status (corrupted), the base, its level and so on are less convenient than in the original.*

So: keep (or freely evolve) the look, keep the two-column idea, and rethink the **left column**: how
the item, its base, its level, corrupted state and the stat filters are shown and toggled.

## The surfaces

| Window | Size (logical px) | Notes |
|---|---|---|
| Price check popup | 960 wide, 590–900 tall (grows with the filters) | Left 420 px: item plate, poe.ninja price, preset tabs (Pseudo / Mods / Base item), stat filters, item filters, trade options, Search. Right: tabs Trade / Bulk / poe.ninja / Wiki with listings, bulk offers, price trend, links. Title bar: league, divine rate, close. Footer: rate-limit state, key hints. |
| Item check popup | 380 wide, height of its content | Name plate, item level, Wiki / PoEDB / Craft of Exile, Find in Stash, weapon DPS, dust, poe.ninja row. |
| Map check popup | 440 wide | Area screenshot with the name over it, tier, quantity / rarity / pack size, profile I / II / III, mods coloured by the user's marks. |
| Stash search panel | 360 wide | Groups of preset buttons. |
| Settings window | 900 × 640 | Sidebar + sections. |
| Start message | 340 × 92 | Corner toast. |

How the popup behaves matters for the design:

- It is shown **over the game without taking focus**: clicks work, but the keyboard stays in the game.
  Only the number fields take the keyboard for a moment while the user types into them. So the design
  cannot lean on typing (no search box, no text inputs beyond numbers); everything is clicks, the mouse
  wheel on numbers, and a few hotkeys (Esc closes, a click outside closes).
- It opens centred on the game (or opposite the cursor, a setting), at 1920×1080 and 3440×1440 alike,
  and must stay readable at a glance in the middle of a fight. Speed is the point of the app: the window
  is on screen ~65 ms after the hotkey.
- It must fit a 1080 px tall game: the window grows up to 900 px, then the filter list scrolls.

## The current look ("R3·1")

Dark, warm, PoE-like: near-black browns, bronze rules, gold for actions and prices, the PoE mod blue for
stat filters, Alegreya SC (small caps) for names and headings, Inter for everything else. Tokens are in
[src/styles.css](../../src/styles.css):

```
chrome #0f0e0c  panel #151311  raised #1c1915  well #0d0c0b
line #2e2820  line-strong #3a3226  frame #4a3c28  bronze #7a5f36
gold #c9a15a  gold-soft #f0d48a  text #ddd6c9  bright #e8e4dc  muted #8f887c
mod #9a9aff  mod-off #6f6fb8  good #6fbf73  warn #d9a441  bad #e0806a
```

The owner likes it but is not tied to it.

## Screenshots

Ours: [../screenshots/](../screenshots/), described one by one in [../screenshots/README.md](../screenshots/README.md).
The most relevant for the price check:

- `15-price-check-pseudo.png`, `15-price-check-mods-preset.png` — a rare shield, Pseudo and Mods tabs
- `15-price-check-many-mods-fitted.png` — boots with many mods, the window grown to fit; F (fractured) buttons
- `15-price-check-fractured-toggle.png` — a mod switched to fractured search
- `13-price-check-exact-range.png`, `05-rare-base-price.png` — a rare ring, search not run yet
- `05-unique.png`, `05-unique-ninja-tab.png` — a unique: listings, poe.ninja tab with the trend and related items
- `05-currency-bulk.png`, `05-fragment.png` — bulk offers
- `08-unidentified-unique-picker.png` — "which unique is it?"
- `09-item-check-*.png`, `10-map-check-*.png`, `11-stash-panel.png` — the smaller popups
- `13-settings-*.png` — the settings window

APT, the original: [../screenshots/apt/](../screenshots/apt/), with what each shows and how ours differs
in [../screenshots/apt/README.md](../screenshots/apt/README.md). In short, APT's left part has:

- a header line with the item **category** ("Category: Gloves") that is a button switching to the exact
  **base** ("Precursor Gauntlets"), and **Corrupted / Not Corrupted** as a one-click switch;
- the poe.ninja base price with a tiny trend graph, an editable **item level**, "3 of 10, stats";
- stat filters with small tags under each line (pseudo ×2, eldritch, explicit) and **tier** badges;
- **Hidden** (filters of little use, eye-slash with the reason) and **Mods** (which mods a pseudo
  total adds up, with tiers) toggles; "1 Empty or Crafted Modifier" with **Any / Prefix / Suffix**.

What the data offers (everything APT shows is available): rarity, name, base, category, item level,
quality, sockets / links, corrupted, mirrored, fractured, influences, every mod with its type, tier, roll
and range, pseudo totals and the mods behind them, poe.ninja price and 7-day trend, trade listings,
bulk offers, rate-limit state.

## Freedom

Everything about the layout is open: what goes where, what is a chip, a toggle, a tag or a row, how
dense it is, whether the left column keeps its width, whether the header carries the base and status,
how presets look, whether hidden filters hide. The two-column idea (filters left, prices / wiki /
trend right) is liked and worth keeping, but not sacred. The colours can move too.
