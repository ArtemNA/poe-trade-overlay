# Awakened PoE Trade screenshots

The original overlay, for comparing designs and behaviour. Taken in the real game, 3440×1440,
APT with the user's settings (price check on Ctrl+D held, the window next to the inventory,
clicks reach it only in the overlay mode).

| File | What it shows |
|---|---|
| `price-check-rare.png` | Price check of a rare item (Plague Clutches) before searching. Header: item category, "Not Corrupted", poe.ninja base price with the 7-day trend, item level, "3 of 10, stats". Stat filters with tags under the text ("pseudo x 2", "pseudo", "eldritch", "explicit") and tier badges; min / max inputs; "Collapse", "Hidden" and "Mods" toggles; Search and Trade buttons. |
| `price-check-rare-results.png` | The same item after Search: "Matched: 723", "Merchant Only", "Trade" link, 20 listings with price, item level and listed time. |
| `price-check-corrupted-hidden-filters.png` | A corrupted base (Precursor Gauntlets) with "Hidden" on: hidden filters show an eye-slash icon (pseudo resistances); "1 Empty or Crafted Modifier" with Any / Prefix / Suffix options. Header: the base name as a button and "Corrupted" in red. |
| `price-check-item-level-edit.png` | Header of the price check: the item level is an editable field, like the stat inputs. |

## Against the fake game (`apt-*.png`, 30.10.2026)

APT 3.29.108 driven by PowerShell against a borderless copy of `scripts/fake-game.ps1` titled
`Path of Exile` (3440×1440 at 0,0, the same items as our screenshots). League Allflame, font size 16,
the user's settings except: price check opened with "Open without auto-hide" (Ctrl+Shift+D), no
automatic search, item check on Alt+D. The overlay was made clickable with Shift+Space. The user's
config was restored afterwards. Crops are the APT window only (the price check column is 460 px wide
and runs the full game height; crops stop below the content). The game behind is the fake game's text.
Some boots mods show "Not recognized modifier": that is how APT 3.29 reads our test boots text, not an
edit. Item, map and settings windows were opened with the cursor on the right (inventory side)
unless the name says left.

| File | What it shows | Ours |
|---|---|---|
| `apt-position-cursor-right.png` | Whole screen, cursor on the right (grey circle = remembered cursor): the price check sits right next to the inventory panel, x 2093–2553 = screen width − 887 (panel = height × 986/1600) − 460. Overlay backdrop rgba(129,139,149,.15) over the game. "Rate limiting" tab at the bottom left of the window. | `17-popup-opposite-cursor-right.png` |
| `apt-position-cursor-left.png` | The same with the cursor on the left: the window starts right after the stash panel (x 887–1347). | `17-popup-opposite-cursor-left.png` |
| `apt-price-check-rare-boots.png` | Rare boots before Search: header (category, Not Corrupted, poe.ninja base price with trend), Item Level and "2 of 6, stats" chips, Armour/Evasion with "(Quality: 20%)", pseudo totals with tier badges, unknown mods with orange warning, Collapse / Hidden / Mods, Search / Trade. | `15-price-check-many-mods-fitted.png`, `16-price-check-rare-header.png` |
| `apt-price-check-rare-boots-results.png` | The same after Search (1 search): "Matched: 10000", "Merchant Only", striped listing table Price / iLvl / Listed. | `16-price-check-results-currency-icons.png` |
| `apt-price-check-collapsed-results.png` | After "Collapse": filters folded into the "2 of 6, stats ▾" chip, listings right under the header. | — |
| `apt-price-check-mods-sources.png` | Mods on, hovering "108 total maximum Life": the source mods under it ("Explicit "Rapturous" (Tier: 2)", what each adds), gradient panel over the next rows. | `16-price-check-totals-sources-hidden.png` |
| `apt-price-check-hidden-filters.png` | Hidden on: only the hidden filter (eye-slash, pseudo fire resistance) and the unknown mods are listed. | `16-price-check-totals-sources-hidden.png` |
| `apt-price-check-header-switches-clicked.png` | After clicks on the category (→ base "Precursor Greaves" with a frame), "Not Corrupted" (→ red "Corrupted"; only two states) and Armour: "3 of 6, stats". | `16-price-check-header-switches-clicked.png` |
| `apt-price-check-shield.png` | Shield: Shaper influence chip and tag, implicit tag, tier badges, Block 50%. | `15-price-check-pseudo.png` |
| `apt-price-check-shield-mods-sources.png` | The shield with Mods on: "79 total maximum Life" = crafted "Upgraded" 70 + "of the Bear" strength 18 → 9. | `15-price-check-mods-preset.png` |
| `apt-price-check-rare-ring-presets.png` | Rare ring: the "Pseudo / Base item" preset tabs (APT's counterpart of our Pseudo / Mods tabs). | `05-rare-base-price.png`, `15-price-check-pseudo.png` |
| `apt-price-check-rare-ring-base-item.png` | The ring on the "Base item" tab: base name chip and only the implicit. | `15-price-check-mods-preset.png` |
| `apt-price-check-unique-related.png` | Tabula Rasa: "Links: 6" chip, poe.ninja price and trend, disenchant value (dust), related items panel on the left of the window with the item itself highlighted. | `16-price-check-unique-no-stats.png`, `05-unique.png` |
| `apt-price-check-unique-results.png` | Tabula Rasa after Search (1 search): listings, related panel beside. | `05-unique.png` |
| `apt-price-check-unique-with-mods.png` | Farrul's Fur: unique with stat filters and roll sliders (min/max range bar), no related items. | `16-price-check-related-unfolded.png` |
| `apt-price-check-currency.png` | Divine Orb before Search: icon → 359 × chaos, trend, Stock chip, "You have × 12 / Stack × 20" box. | `05-currency-bulk.png` |
| `apt-price-check-currency-bulk.png` | Divine Orb after Search (1 bulk search): "available on the Currency Exchange Market" note, Matched with chaos/divine buttons, Price / chaos/bulk / Stock / Fulfill / Listed, "Market Ratio" row. | `16-price-check-bulk-icons.png` |
| `apt-title-divine-fractions.png` | Title-bar popover "⇄ 359": 0.1–0.9 div in chaos (white tippy box). | `03-title-divine-fractions-menu.png` |
| `apt-price-check-fragment-related.png` | The Maven's Writ: two-column related panel (fragments and what they turn into, poe.ninja prices; divine prices in gold). | `16-price-check-related-items.png` |
| `apt-price-check-fragment-sacrifice.png` | Sacrifice at Dawn: its set and the related items. | `05-fragment.png` |
| `apt-price-check-divination.png` | The Doctor: card icon, price in divine, related (reward Headhunter and the other cards). | `16-price-check-divination-icon.png` |
| `apt-price-check-gem.png` | Arc 20/20: Level / Quality chips, no filters. | `05-gem.png` |
| `apt-price-check-unidentified-corrupted.png` | Unidentified corrupted amulet: "Unidentified" chip, red "Corrupted", implicit only. | `09-item-check-corrupted.png` |
| `apt-unidentified-unique-picker.png` | Unidentified Simple Robe: "which one?" prompt and a 2-column grid of the four uniques. | `08-unidentified-unique-picker.png` |
| `apt-unidentified-unique-picked.png` | After picking Tabula Rasa: Unidentified chip, "Stats ignored", Base Percentile filter. | `08-unidentified-unique-picked.png` |
| `apt-unidentified-unique-single.png` | Occultist's Vestment: Shavronne's Wrappings picked without asking. | `08-unidentified-unique-single.png` |
| `apt-price-trend-up.png`, `apt-price-trend-down.png` | The poe.ninja line close up: green ⌃⌃ / red ⌄⌄ percent, "Last 7 days", 3×2 rem area sparkline. | `16-price-check-rare-header.png` |
| `apt-rate-limiting-tab.png` | The "Rate limiting" tab at the bottom edge. | — |
| `apt-item-check-rare.png` | Item check, rare ring: name, wiki / poedb / CoE, "Find in Stash". | `09-item-check-rare-base-price.png` |
| `apt-item-check-weapon.png` | Item check, rare bow: Physical / Elemental / Total DPS (no quality-20 value). | `09-item-check-weapon.png` |
| `apt-item-check-unique.png` | Item check, Tabula Rasa: disenchant value. | `09-item-check-unique.png` |
| `apt-item-check-currency.png` | Item check, Divine Orb (CoE still shown). | `09-item-check-currency.png` |
| `apt-item-check-unidentified-corrupted.png` | Item check, unidentified corrupted amulet. | `09-item-check-corrupted.png` |
| `apt-item-check-divination.png` | Item check, divination card. | `09-item-check-no-ninja-price.png` |
| `apt-find-in-stash-fake-game.png` | The fake game after "Find in Stash": `"Sapphire Ring"` searched (top of the game window). | `09-find-in-stash-fake-game.png` |
| `apt-map-check-rare.png` | Map check, rare T16 Strand: name, Profile I/II/III, area screenshot, mods with the user's marks (warning orange, deadly red). | `10-map-check-rare.png` |
| `apt-map-check-marked-deadly.png` | After one click on "40% more Monster Life": deadly. | `10-map-check-marked-deadly.png` |
| `apt-map-check-profile-2.png` | Profile II. | `10-map-check-profile-2.png` |
| `apt-map-check-marks-cycle.png` | Three clicks on one mod in profile II side by side: deadly → warning → good. | `10-map-check-rare.png` |
| `apt-map-check-normal.png` | Normal map without mods (Courtyard). | `10-map-check-maven-normal.png` |
| `apt-map-check-unknown-mod-left.png` | Cursor on the left: map check next to the stash; "Not recognized modifier —" in orange. | `10-map-check-unknown-mod.png` |
| `apt-overlay-mode-full.png` | Whole screen in overlay mode (Shift+Space): widget menu top left, "Cheat sheets", the user's "Dump sorting" stash search panel. | — |
| `apt-overlay-menu.png` | Widget menu: cog, search, "Map rolling", ⋯, and "Price check (Ctrl + V)" under it. | — |
| `apt-stash-search-panel.png` | Stash search panel "Dump sorting" (the user's presets). | `11-stash-panel.png` |
| `apt-stash-panel-click-fake-game.png` | After a click on "Map Tier": typed into the fake game's stash search. | `11-stash-panel-click-fake-game.png` |
| `apt-settings-hotkeys.png` | Settings, Hotkeys (item check shown as Alt + D: our temporary change). | `13-settings-hotkeys.png` |
| `apt-settings-chat.png` | Settings, Chat: the user's commands with "Press Enter" toggles and hotkeys. | `12-settings-chat.png` |
| `apt-settings-general.png` | Settings, General: language, font size, log/config paths, overlay background, attach notification, window title. | `21-settings-general.png`, `13-settings-general.png` (not in the repository: shows the owner's account / system) |
| `apt-settings-price-check.png`, `apt-settings-price-check-2.png` | Settings, Price check (top; scrolled: default search filters, built-in browser, auto search toggles). | `13-settings-price-check.png` |
| `apt-settings-map-check.png` | Settings, Map check: all map mods, search, "Only selected", mark icons. | `10-settings-map-mods.png`, `13-settings-map-check.png` |
| `apt-settings-item-info.png` | Settings, Item info: wiki / poedb / CoE / Find in stash hotkeys. | — |
| `apt-settings-debug.png` | Settings, Debug: log lines. | `13-settings-log.png`, `14-settings-log.png` (not in the repository: shows the owner's account / system) |
| `apt-settings-about.png` | Settings, About: version 3.29.108, update check. | `21-settings-about.png` |
| `apt-settings-with-patrons.png` | Settings with the patrons strip under the window. | — |
| `apt-start-message.png` | "Awakened PoE Trade · Is ready and running in background" toast with the orb picture, bottom centre (≈ 20 % from the bottom), 2.5 s. | `14-start-message.png` |

Not captured: the hotkey field waiting for keys (a click on it changed nothing visible) and the hotkey
conflict mark, chat commands sent into the game (the user's F9 is `/exit`), the Online / Merchant Only
popover (clicks did not open it), the built-in browser, the league menu (APT has no menu in the title,
the league is chosen in Settings, Price check), languages other than English, update toasts (no update).

## What these show that the price check of Price of Exile does differently

- **Base name button.** In APT the base type in the header is a button: a click switches between the category search ("Category: Gloves") and the exact base ("Precursor Gauntlets"). We have the same as the "Only <base>" chip in the Item section.
- **Corrupted toggle.** A click on "Corrupted" / "Not Corrupted" in the header switches the search between corrupted and not corrupted items. Our "Not Corrupted" chip only turns the filter on or off (off: any).
- **Hidden filters.** APT hides filters it considers of little use (pseudo single resistances, the empty modifier and others) behind the "Hidden" toggle, marked with an eye-slash and the reason. We show them all, unticked.
- **Empty or crafted modifier: Any / Prefix / Suffix.** APT lets one choose which affix has to be free. We show the filter without that choice.
- **Mods toggle.** Under each pseudo filter, the mods it adds up and their tiers. We have a Mods tab instead, which searches by each mod on its own.
- **Item level** is an editable field in the header; ours is the "Item Level" chip with a number field in the Item section.
