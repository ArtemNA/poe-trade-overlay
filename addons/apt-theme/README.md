# APT theme (addon)

The look of Awakened PoE Trade for Price of Exile: APT's colours and fonts in every window, and APT's
price check layout (one column as tall as the game, next to the game's inventory or stash panel)
over our own price check logic (`AptPriceCheck extends PriceCheckPanel`).

Not part of the normal build. Build it in:

| Command | Result |
|---|---|
| `npm run dev:apt` | dev build with the theme in Settings → Overlay → Theme |
| `npm run build:apt` | release front end with the theme offered in the settings |
| `npm run build:apt-default` | the same, with the theme as the default for a fresh install |

(Angular configurations `apt` / `apt-default` in `angular.json`: `src/app/addons.ts` is replaced by
`addons.ts` / `addons.default.ts` here and `theme.css` is added to the styles.)

Files: `theme.ts` (registration), `theme.css` (palette over our tokens, fonts, global styles),
`apt-price-check.*` (the price check), `apt-title-bar.ts`, `apt-unidentified-picker.ts`, `apt-icon.ts`
(Font Awesome glyphs APT uses, as SVG), `images/` and `fonts/`.

Credits: the look, the images in `images/` (influence icons, stash) and the font files come from
Awakened PoE Trade, MIT © Alexander Drozdov (`LICENSE-awakened-poe-trade.txt`). Fonts: Fontin and
Fontin SmallCaps by Jos Buivenga (exljbris, free font licence), Exo 2 by Natanael Gama (SIL OFL).
APT's Cyrillic font (FrizQuadrata, commercial) is not included: Cyrillic falls back to Alegreya SC.
