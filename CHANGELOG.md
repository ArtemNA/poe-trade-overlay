# Changelog

Each release takes its "What's new" from the section of its tag.

## Unreleased

- Fix: the start message in the screen corner did not show in installed builds.
- Installs updated from "PoE Trade Overlay" (before 0.1.2): the Start menu and desktop shortcuts that still started the old version now start Price of Exile.
- Fix: Corrupted / Not corrupted, the base switch, the iLvl and links chips, "Not unique", the stat count and the trade options summary change at once on a click, not only after switching between Pseudo and Mods.

## v0.1.6

- Related items of an item with mods (uniques such as Farrul's Fur) can be folded into one line, "Related · 4", by a click on their heading.
- Related items are found for linked uniques too: poe.ninja names those by links ("6L"), the sets by base.

## v0.1.5

- A new price check layout. A full-width header holds the item's name and base and a switch between the whole category and this base. It also holds item level and links as chips, corrupted as Any / Not corrupted / Corrupted, and the poe.ninja price with its 7 day trend.
- Currencies, fragments, divination cards, gems and maps show their picture next to the name.
- Stat filters are grouped (Properties, Totals, Implicit, Eldritch implicits, Explicit, Crafted) and show mod tiers (T1, T2, …).
- "Σ Mods behind totals" shows which mods a pseudo total adds up.
- Rarely useful filters sit under "Hidden", each with the reason it is hidden.
- An empty modifier can be searched as Any, Prefix or Suffix. The F button is now a "Fractured" switch.
- Prices, bulk offers and the divine rate show currency icons instead of "c" and "div".
- Related items (the set a fragment, splinter or card belongs to and what it turns into) are shown next to the price whenever there are any, as in APT, instead of only on the poe.ninja tab.

## v0.1.4

- Price check: a **Mods** tab next to Pseudo, with every mod on its own ("+70 to maximum Life", "+18 to Strength") instead of pseudo totals ("+79 total maximum Life").
- Price check: an **F** button on mods that also exist as fractured: search the mod as fractured, or as a regular one.
- The price check window is wider (960 px, so mod texts fit) and as tall as its filters need, up to 900 px: items with many mods no longer scroll.
- After pathofexile.com answers "too many requests", the overlay sends it nothing until the time it named is over, instead of making the restriction longer.
- The popup takes the scale of the game's monitor (matters with monitors at different scales) and hides when the game window moves or changes size under it.
- A warning in the settings when the game runs in exclusive fullscreen, where no overlay can show: switch the game to Windowed Fullscreen.
- The league list is reloaded every few hours, so an ended league is replaced without a restart.

## v0.1.3

- The repository is now [ArtemNA/price-of-exile](https://github.com/ArtemNA/price-of-exile): updates and release links use the new address (the old one still redirects).
- The program file is now `price-of-exile.exe`.

## v0.1.2

- New name: **Price of Exile**. After the update, Windows may still list the old "PoE Trade Overlay" in installed apps: uninstall that entry and leave "Delete the application data" unchecked, so the settings stay.
- A short message in the corner of the screen when the overlay starts: it runs, its hotkeys, where the settings are. Can be turned off in Settings → General.
- The settings window opens on the very first start again (it stayed in the tray).
- Portable version: a single exe that runs without installing; it shows when a new version is out instead of updating itself.
- MIT license, an installer with the app's own icon, and release notes like this one.

## v0.1.1

The first release.

- Price check (Ctrl+D): trade listings with stat filters, bulk exchange, poe.ninja price with a 7-day trend and related items.
- Item check (Alt+D): wiki, PoEDB and Craft of Exile links, Find in Stash, weapon DPS; on maps, contracts and logbooks the map check with your marked mods.
- Stash search presets (Alt+F) and chat commands (F5 `/hideout`, F9 `/exit`, `@last` commands).
- Built-in browser for logging in to pathofexile.com and the Cloudflare check.
- Settings window with hotkey recording; the app lives in the tray and updates itself.
