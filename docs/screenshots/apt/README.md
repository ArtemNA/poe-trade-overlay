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

## What these show that the price check of Price of Exile does differently

- **Base name button.** In APT the base type in the header is a button: a click switches between the category search ("Category: Gloves") and the exact base ("Precursor Gauntlets"). We have the same as the "Only <base>" chip in the Item section.
- **Corrupted toggle.** A click on "Corrupted" / "Not Corrupted" in the header switches the search between corrupted and not corrupted items. Our "Not Corrupted" chip only turns the filter on or off (off: any).
- **Hidden filters.** APT hides filters it considers of little use (pseudo single resistances, the empty modifier and others) behind the "Hidden" toggle, marked with an eye-slash and the reason. We show them all, unticked.
- **Empty or crafted modifier: Any / Prefix / Suffix.** APT lets one choose which affix has to be free. We show the filter without that choice.
- **Mods toggle.** Under each pseudo filter, the mods it adds up and their tiers. We have a Mods tab instead, which searches by each mod on its own.
- **Item level** is an editable field in the header; ours is the "Item Level" chip with a number field in the Item section.
