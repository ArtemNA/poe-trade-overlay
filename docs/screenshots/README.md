# App states

Screenshots of every state reached while testing, for a later redesign. Taken with
`scripts/screenshot.ps1 -Window popup` against the fake game (`scripts/fake-game.ps1`).
Names: `<stage>-<what>.png`; `*-ninja-tab.png` is the same item with the poe.ninja tab open.

| File | State |
|---|---|
| `03-title-divine-fractions-menu.png` | Title bar: divine → chaos fractions menu |
| `03-title-league-menu.png` | Title bar: league menu |
| `05-unique.png`, `05-unique-ninja-tab.png` | Unique (Tabula Rasa 6L): trade listings; poe.ninja price, week change with graph, related items, dust value |
| `05-currency-bulk.png`, `05-currency-bulk-ninja-tab.png` | Divine Orb: bulk tab opens by itself; poe.ninja tab, Divine priced in chaos |
| `05-fragment.png`, `05-fragment-ninja-tab.png` | Sacrifice at Dawn: bulk with market ratio and hidden bait; set and what it turns into |
| `05-gem.png`, `05-gem-ninja-tab.png` | Gem 20/20: poe.ninja variant by level and quality |
| `05-rare-base-price.png`, `05-rare-base-price-ninja-tab.png` | Rare ring: stat filters, poe.ninja base type price |
| `05-no-ninja-price.png`, `05-no-ninja-price-ninja-tab.png` | Divination card poe.ninja does not list: no price, related cards and reward still shown |
| `05-league-allflame.png`, `05-league-allflame-ninja-tab.png` | After switching league: prices reloaded; flat week graph |
| `09-item-check-weapon.png` | Item check (Alt+D), rare bow at 0 % quality: links incl. Craft of Exile, weapon DPS with the 20 % quality value in brackets, no poe.ninja price |
| `09-item-check-weapon-q20.png` | The same bow at 20 % quality: no brackets |
| `09-item-check-unique.png` | Item check, unique: poe.ninja price with week change, dust value |
| `09-item-check-currency.png` | Item check, currency: no Craft of Exile, no item level |
| `09-item-check-corrupted.png` | Item check, unidentified corrupted amulet: flags, no Craft of Exile, base price |
| `09-item-check-rare-base-price.png` | Item check, rare ring: Craft of Exile, poe.ninja base price |
| `09-item-check-no-ninja-price.png` | Item check, divination card poe.ninja does not list |
| `09-price-check-wiki-tab.png` | Price check, Wiki tab: the same links and DPS inside the price check |
| `09-find-in-stash-fake-game.png` | The fake game after "Find in Stash": search text typed, popup hidden (whole game window, not the popup) |
| `10-map-check-rare.png` | Map check (Alt+D on a map), rare T16: area screenshot, tier, quantity/rarity/pack size, default marks (good, warning, deadly) |
| `10-map-check-marked-deadly.png` | After one click on "more Monster Life": marked deadly |
| `10-map-check-profile-2.png` | Profile II: no marks |
| `10-map-check-maven-normal.png` | Normal map without mods, Maven memory boss reminder, no screenshot in the data |
| `10-map-check-unknown-mod.png` | Popup on the right (cursor on the left); a mod the stat data does not know |
| `10-map-check-new-mods-icon.png` | "Show icon for new mods" on: dot on unmarked mods; long mods truncated |
| `10-map-check-marked-seen.png` | After a click on the dot: the mod is "seen" (dimmed, no dot) |
| `10-item-check-fitted.png` | Item check with the height fitted to its content (was a fixed 330) |
| `10-settings-map-mods.png` | Main window, Map check tab: all map mods, marks show on hover |
| `10-settings-only-marked.png` | "Only marked" in profile I |
| `10-settings-search-marked.png` | Search "monster life", a mark set in the editor |
| `13-settings-general.png` | Settings, General: game title (with the dev POE_GAME_TITLE override note), league, account |
| `13-settings-hotkeys.png` | Settings, Hotkeys: defaults |
| `13-settings-hotkey-recording.png` | A hotkey field waiting for keys |
| `13-settings-hotkey-conflict.png` | The same hotkey for two actions: both marked "Used twice" |
| `13-settings-price-check.png` | Settings, Price check |
| `13-settings-map-check.png` | Settings, Map check: the mark editor |
| `13-settings-log.png` | Settings, Log |
| `13-item-check-rebound-hotkey.png` | Item check opened by a re-bound hotkey (Alt+Q) |
| `13-stash-search-hotkey-fake-game.png` | Find in stash hotkey: item name typed into the fake game, no popup (whole game window) |
| `13-price-check-exact-range.png` | Price check with the stat range set to 0 %: filters at the exact rolls |
| `12-settings-chat.png` | Settings, Chat: the default commands |
| `12-settings-chat-hotkeys.png` | Chat commands with hotkeys F6 and F7 set for the `@last` commands |
| `12-chat-hideout-fake-game.png` | F5 in the fake game: `/hideout` sent, chat closed again (top of the game window) |
| `12-chat-last-whisper-fake-game.png` | F6 and F7: `@last ty` → whisper to the last partner, `/invite @last` → `/invite LastWhisper` |
| `11-stash-panel.png` | Stash search panel (Alt+F) with the default groups, centred on the game |
| `11-stash-panel-click-fake-game.png` | After a click on "Map Tier": the text in the fake game's stash search, popup hidden (top of the game window) |
| `11-settings-stash-search.png` | Settings, Stash search: groups and presets |
| `11-stash-preset-hotkey-fake-game.png` | A preset's own hotkey (Alt+1): searched right away, no popup |
| `11-stash-panel-named-hotkey.png` | The panel with a named preset and its hotkey; "Hotkeys" toggle of the group |
| `07-browser-window.png` | Built-in browser (pathofexile.com/trade): the trade page now asks to sign in |
| `07-price-check-through-browser.png` | Price check with "Use the built-in browser" on: search and listings fetched inside the browser page |
| `07-browser-over-game.png` | The browser opened by its hotkey over the fake game |
| `08-unidentified-unique-picker.png` | Unidentified unique Simple Robe: which of its four uniques |
| `08-unidentified-unique-picked.png` | After picking Tabula Rasa: the price check for it, Unidentified filter on |
| `08-unidentified-unique-single.png` | Occultist's Vestment: its only unique (Shavronne's Wrappings) picked without asking |
| `14-settings-general-version.png` | Settings, General: version and "Check for updates"; the new app icon in the title bar |
| `14-settings-log.png` | Settings, Log: "Show the log file" |
| `14-start-message.png` | The message in the screen corner when the overlay starts (4.5 s, click opens the settings) |
| `15-price-check-many-mods-fitted.png` | Boots with many mods: the window grew to fit the filters, no scroll; F buttons, the fractured mod twice (explicit and F on) |
| `15-price-check-pseudo.png` | Shield, Pseudo tab: "+79 total maximum Life" from life and strength |
| `15-price-check-mods-preset.png` | The same shield, Mods tab: life (crafted) and strength on their own |
| `15-price-check-fractured-toggle.png` | F turned on for "74% increased Chance to Block": searched as fractured |

Not captured yet: the tray menu and the update banner (no release to update to yet), the Cloudflare check message with "Open browser" (covered by tests), the outdated wording banner (covered by tests), map check with more mods than fit the game height, poe.ninja still loading, poe.ninja error, items with no poe.ninja entry at all.
