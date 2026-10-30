# Theming Price of Exile

Price of Exile ships with two themes: its own and **Awakened PoE Trade** (`addons/apt-theme`), picked in
Settings → Overlay → Theme. This page is for anyone who wants to make another one.

## How a theme works

- **Colours and fonts are CSS variables.** `src/styles.css` declares the design tokens in Tailwind 4's
  `@theme` block (`--color-panel`, `--color-text`, `--color-gold`, `--color-mod`, … and `--font-sans`,
  `--font-display`). Every template uses only these (`bg-panel`, `text-muted`, `border-line`); there are
  no hard-coded colours in the templates. A theme gives the variables its own values.
- **The theme is an attribute on `<html>`.** Each window sets `data-theme="<theme id>"`, so a theme's CSS is
  scoped with `html[data-theme='<id>'] { --color-panel: …; }` and can add any rule it needs under the same
  selector (rounded corners, cursors, …).
- **A theme can bring its own price check.** The price check logic is `PriceCheckPanel`
  (`src/app/price-check/price-check-panel.ts`): parsing, filters, presets, trade search, bulk, poe.ninja,
  related items. A theme may subclass it with its own template (and styles); every signal and method of
  the base class is there for the template. The APT theme does this (`AptPriceCheck`).
- **Window size and placement.** A theme may set the price check window width and make it as tall as the
  game (`priceCheckSize`). The popup position setting (centre / opposite the cursor) still applies; the
  side the popup ended up on is in `popupSide()` (`'left'`, `'right'`, `'centre'`), and
  `themeWindowWidth()` can ask for a wider window (the APT theme puts related items beside its column, over
  the transparent rest of the window).

## Making a theme

1. **Folder.** `addons/<name>/`, for example by copying `addons/apt-theme/`.
2. **`theme.css`** with the tokens under your selector. Start from the token list in `src/styles.css`;
   anything you do not set keeps our value.

   ```css
   html[data-theme='my-theme'] {
     --font-sans: 'My Font', sans-serif;
     --color-panel: #202428;
     --color-text: #e6e6e6;
     --color-gold: #4aa3df; /* primary action, focus, active borders */
   }
   ```

   Fonts: put the files in your folder and declare them with `@font-face` (relative `url()`s are bundled).
   Ship only fonts whose licence allows it.
3. **`theme.ts`** registers it:

   ```ts
   import type { Theme } from '../../src/app/themes';

   export const MY_THEME: Theme = {
     id: 'my-theme', // the data-theme value
     label: 'My theme', // shown in Settings → Overlay → Theme
     // priceCheck: MyPriceCheck,                          // optional own price check view
     // priceCheckSize: { width: 460, fullHeight: true },  // optional window size
   };
   ```
4. **Add it to the app:** append the theme to `ADDON_THEMES` in `src/app/addons.ts` and the CSS file to
   `styles` in `angular.json` (after `src/styles.css`).
5. **Own price check (optional):** `class MyPriceCheck extends PriceCheckPanel` with
   `@Component({ templateUrl: './my-price-check.html', imports: [...] })`. Start from
   `src/app/price-check/price-check-panel.html` or `addons/apt-theme/apt-price-check.html`. Keep the
   element with `#filtersScroll` if you want the window to fit its height to the filters (our theme), or
   use `priceCheckSize.fullHeight`.
6. **Texts:** use `{{ 'English text' | tr }}` for new texts and add their translations to
   `public/i18n/uk.json` and `ru.json` (`ui` section); missing ones stay English.

The `apt-default` build configuration (`npm run build:apt-default`) shows how to make a theme the default
for a fresh install: it replaces `src/app/addons.ts` with a file that sets `DEFAULT_THEME_ID`.

## Testing

`npm run dev`, pick the theme in Settings → Overlay, and check every window: price check (a rare item, a
unique, currency with bulk offers, a fragment with related items), item check, map check, stash search,
settings, the start message. Without the game: `scripts/fake-game.ps1` and `POE_GAME_TITLE="PoE Fake Game"`
(see `scripts/` and `docs/screenshots/README.md` for the states worth checking).
