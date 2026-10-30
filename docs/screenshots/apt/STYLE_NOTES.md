# Awakened PoE Trade: style notes for an "APT-like" theme

Raw material read off APT 3.29.108 (screenshots in this folder, 3440×1440, font size 16, so 1 rem = 16 px)
and its source (`project_1/awakened-poe-trade/renderer`, older but the same look: Tailwind 3 with a
hand-written Tailwind v1 palette in `tailwind.config.js`). Every flat colour sampled on screen matched
the palette exactly, so the Tailwind names below are the real values. Text colours are from the
source: on screen, text is ClearType-antialiased and single pixels cannot be trusted.

## Palette (Tailwind v1 names → hex)

| Token | Hex | Where (sampled on screen = ✓) |
|---|---|---|
| gray-900 | `#1a202c` | title bar ✓, header bar of the price check ✓, inputs ✓, chips ✓, settings sidebar / footer ✓, map check header and 4 px border ✓, stash panel ✓ |
| gray-800 | `#2d3748` | window body ✓, map list ✓, toast ✓, related panel ✓, stash buttons ✓, item check info block ✓ |
| striped row | `#353f52` | odd rows of the listing table ✓ (the only custom hex) |
| gray-700 | `#4a5568` | row dividers ✓, buttons (Search, Trade, Collapse, wiki/poedb/CoE) ✓, pseudo tag ✓, highlighted related entry ✓, Market Ratio row ✓, currency-exchange note ✓ |
| gray-600 | `#718096` | title text, explicit/implicit tag text, icons, "Not Corrupted" |
| gray-500 | `#a0aec0` | active chip border ✓ ("2 of 6, stats"), "Matched:", sparkline stroke |
| gray-400 | `#cbd5e0` | button text, toggle labels |
| gray-300 | `#e2e8f0` | input text |
| gray-200 | `#edf2f7` | default text of the price check |
| gray-100 | `#f7fafc` | settings text, toast text |
| yellow-500 | `#ecc94b` | Tier 1 badge fill ✓ / Tier 2 badge outline and text ✓ |
| yellow-400 | `#f6e05e` | fractured tag fill |
| orange-400 | `#f6ad55` | "Not recognized modifier", warning triangle ✓ |
| orange-600 | `#dd6b20` | map check: warning row ✓ |
| red-500 | `#f56565` | "Corrupted" in the header |
| red-600 | `#e53e3e` | trend down arrows, offline dot |
| red-700 | `#c53030` | map check: deadly row ✓, corrupted tag |
| green-500 | `#48bb78` | trend up arrows |
| green-700 | `#2f855a` | map check: good row ✓ |
| blue-600 | `#3182ce` | crafted tag fill (text blue-100 `#ebf8ff`) |
| blue-400 | `#63b3ed` | quality column in listings |
| purple-600 | `#805ad5` | enchant tag (text `#faf5ff`) |
| gold | `#e4c29a` | divine prices (`.golden`), e.g. "1.4 div" in related |
| overlay backdrop | `rgba(129,139,149,0.15)` | over the whole game while the overlay is clickable (measured: game `#1a130d` → `#292521`) |

No rarity colours anywhere: item names are plain gray-200/white; unique, rare, currency look the same.

Other tags: pseudo / not `#4a5568` + black text; explicit / implicit = no fill, gray-600 text with
`text-shadow 0 0 4px #1a202c`; corrupted `#c53030`/`#fff5f5`; variant `#b7791f`/`#fffff0`; scourge
`#dd6b20`/white; foulborn `#b83280`/white; eldritch = gradient `#c53030 → #2b6cb0`; influences
(shaper, elder, …) = gray text with a 20 px influence icon before it. Tags are lower-case in source,
shown in small caps; `px-1 rounded text-xs leading-none`. " x 2" is appended for several sources.

## Fonts

- Whole UI: **FontinSmallCaps** (`.font-poe-sc` on `#app`), `text-sm` = 0.875 rem / 1.25 rem line
  (14 / 20 px). Cyrillic falls back to FrizQuadrataC (unicode-range U+400–4FF).
- **Fontin** (regular/italic/bold) for inputs and some fields (`.font-poe`).
- **Exo 2 SemiBold, white** for the rolled numbers inside mod texts ("**108** total maximum Life");
  the rest of the mod text is gray-200.
- System sans (`font-sans text-xs`) for relative dates ("2 hr. ago") and seller names in listings,
  the "×" glyph, the rate-limit panel.
- Font files: `renderer/src/assets/font/` (Fontin-*.ttf, FontinSmallCaps, FrizQuadrataITC, Exo2-*).
- Size setting = `html { font-size: <fontSize>px }`, default 16; everything is in rem.
- No monospace, no tabular-nums; bulk ratios are aligned with fixed `w-8 text-right` boxes.

## Price check window

- **Width 28.75 rem = 460 px**, full game height, `bg-gray-800`, text gray-200. Never follows the
  cursor: it is glued to the game panel. Panel width = game height × 986 / 1600 (887 px at 1440).
  Cursor in the right half → window on the right, right edge at `screen right − panel` (x 2093–2553
  at 3440 wide); left half → left edge at `panel` (x 887–1347). See `apt-position-cursor-*.png`.
- A 5 rem translucent white circle marks where the cursor was (`showCursor`).
- Related items sit **outside** the window, on the side facing the screen centre: `bg-gray-800`,
  0.25 rem gray-900 border except on the window side, `rounded-l-lg` (right placement), inset shadow,
  max width min(100 %, 24 rem), one or two columns `p-2`, entry `rounded px-1`, highlighted entry
  gray-700, name under the price in gray-600.
- "Rate limiting" tab: bottom edge, `mx-6 px-4 bg-gray-900 text-gray-600 rounded-t leading-6`.

Top to bottom (measured on `apt-price-check-rare-boots.png`):

1. **Title bar** 1.5 rem (24 px), gray-900, gray-600 text: left "⇄ 359" (divine in chaos, opens a white
   tippy popover with 0.1…0.9 div), centre league name ("Allflame"), right `fa-window-close`.
   Buttons `px-2`, hover gray-400 text on a gradient gray-900 → gray-700; close hover red-500.
2. Body padding **p-4 (16 px)**.
3. **Name bar** (y 40–60): gray-900, `rounded`, `mb-2`, line 1.25 rem. Left: category / base name
   button (`px-2 rounded border`, border gray-500 when the exact base is on); right: "Not Corrupted"
   gray-600 / "Corrupted" red-500 (two states).
4. **poe.ninja line** (`pb-4`, min height 3 rem): centred "icon → N × chaos/divine icon" (`text-base`,
   32 px icons, arrow gray-600), right: trend ⌃⌃ green / ⌄⌄ red + "N %" + "Last 7 days" (`text-xs
   gray-500`) and a 3 × 2 rem area sparkline (stroke `#a0aec0`, fill `#4a5568`).
5. **Chips row** (`flex-wrap gap-2 pb-3`): gray-900 `rounded` 20 px high, `border` transparent /
   gray-500 when active; numeric chips have an inline input (ilvl, links, stock, level, quality);
   influence chip with icon; "N of M, stats" toggles folding of the filters (chevron when folded).
6. Optional **preset tabs** "Pseudo / Base item": tabs with gray-700 borders, active = gradient
   gray-900 → gray-800, min width 3 rem.
7. **Stat rows**, `py-2 border-b border-gray-700`:
   - line 1: 20 px checkbox column (`far fa-square` gray-500 / `fas fa-check-square`), text (one line,
     truncated, full text on hover over a gray-700 box), optional "(Quality: 20%)" gray-500, then
     min / max inputs **3 rem (48 px) each, 1 px apart**, gray-900, gray-300 text centred,
     placeholder "min"/"max" gray-700 at 13 px, focus border gray-500.
   - line 2: eye-slash (hidden, gray-600) in the checkbox column, tags, tier badges ("Tier 1" filled
     yellow-500 black text, "Tier 2" outlined yellow-500), optional roll slider 12.5 rem (gray-700
     track, gray-400 fill).
   - unknown mod: orange triangle, text, sub-line "explicit — Not recognized modifier" (gray-600 /
     orange-400, `text-xs`).
   - Mods on + hover: source panel below the row, gradient gray-800 → gray-900, 4 px gray-500 bottom
     border, italic gray-500 headers `Explicit "Rapturous" (Tier: 2)`, contribution box `w-12 rounded
     border-gray-700`.
8. **Footer of the filters** (`flex gap-x-4`, `mb-4`): "Collapse ⌃" button `bg-gray-700 rounded-b w-40
   leading-none`, toggles "Hidden" and "Mods" (`fa-toggle-on` gray-300 / `fa-toggle-off` gray-600,
   label gray-400).
9. **Search / Trade** row (before a search): `.btn` = gray-700, gray-400 text, `px-2 py-1 rounded
   leading-none`, Search min width 5 rem; "Trade ↗" on the right.
10. **Results** (after a search): top bar `mb-2 pl-2`: "Matched: N" (gray-500 label), "⟲ Merchant
    Only" (gray-500), "Trade ↗" right. Table `w-full`, sticky header gray-800 with gray-700 bottom
    border, header text plain; columns Price · (Stock) · iLvl · (Quality) · Listed (· Seller).
    Odd rows `#353f52`. Price as text "4 chaos" (no icons), `px-2`. Listed in system sans `text-xs`
    with a 6 px status dot (offline red-600, afk orange-500). 20 rows.
    Bulk: grey note box "This item is available on the Currency Exchange Market" (`rounded p-2 mb-3
    border-gray-600 bg-gray-700`), Matched with chaos / divine count buttons, columns Price ·
    chaos/bulk · Stock · Fulfill · Listed, "Market Ratio" row gray-700 with 1 px gray-600 outline.
11. **Stack value** box: `p-2 border border-dashed border-gray-600 rounded mt-2`, "You have × 12 →
    4302 chaos · Stack × 20 → 7170 chaos" in gray-400; uniques show "Disenchanting → 1,060 × [dust]".

## Other windows

- **Item check**: anchored by the game panel, vertically centred; min 20 rem, max 30 rem
  (here 321 px), gray-900 frame 4 px, name `py-1 px-4` centred, row of gray-700 buttons wiki · poedb ·
  CoE · ⋮ · Find in Stash (`gap-1 py-1`), info block gray-800 `py-2`, 2-column grid (DPS labels left,
  values right), disenchant value.
- **Map check**: 30 rem max (481 px incl. border), `bg-gray-800 border-4 border-gray-900`; header
  gray-900 `py-1 px-8` with centred name and "Profile I II III" (24 px buttons, active `border
  gray-600`); area picture; rows `p-2 leading-none`, icons 16 px: deadly red-700 + skull, warning
  orange-600 + triangle, good green-700 + check, normal no fill (hover gray-700). Long mods truncated.
- **Stash search panel**: `rounded bg-gray-900 p-1`, shadow `0 1px 3px rgba(0,0,0,.75)`; title gray-100;
  buttons `rounded p-2 bg-gray-800 text-gray-100 leading-4`, 4 px apart, hover gray-700.
- **Widget menu** (overlay mode, top left): gray-900 box `p-1 gap-1 text-base`, buttons gray-800
  `rounded p-2 border`, border gray-500 when that widget is shown.
- **Settings**: centred, max 50 × 38 rem (here 802 × ~600), slides in from the top. Title bar like the
  price check ("Settings - Awakened PoE Trade"). Sidebar gray-900 `min-w 10rem pl-2 pt-2`, items
  `p-2 leading-none text-gray-600 rounded-l`, active gray-400 on gray-800 (a tab joined to the content),
  separators gray-800, Quit button outlined; content gray-800 `rounded-tl`; footer gray-900 with a
  gray-600 top border, "Save" (`bg-gray-800 px-3 rounded`) and "Cancel". Inputs `rounded bg-gray-900
  px-1`, selects `p-1 rounded bg-gray-700`, toggles and radio/checkbox icons from Font Awesome.
- **Start toast**: bottom centre, ~20 % from the bottom, 2.5 s, fade in, "back out down" out;
  `bg-gray-800 rounded`, ring `0 0 1px 2px rgb(255 255 255 / 20%)`, Transfer Orb picture (78 px)
  on the left outside the box, `py-2 px-4`: "Awakened PoE Trade" (`text-base`) / "Is ready and
  running in background".

## Sizes at a glance (font size 16)

| What | Value |
|---|---|
| price check width | 460 px (28.75 rem) |
| title bar | 24 px |
| body padding | 16 px |
| chip / name bar height | 20 px (line 1.25 rem) |
| stat row (row to row) | 40 px without a tag line, 52 px with tags |
| min / max input | 48 × 20 px each |
| checkbox column | 20 px |
| table row | 22 px |
| item / currency icons | 32 px (w-8 h-8) |
| item check width | 20–30 rem |
| map check width | 30 rem incl. 4 px border |
| panel offset | game height × 986 / 1600 |
