# APT theme (addon)

The look of Awakened PoE Trade for Price of Exile: APT's colours and fonts in every window, and APT's
price check layout (one column as tall as the game, next to the game's inventory or stash panel)
over our own price check logic (`AptPriceCheck extends PriceCheckPanel`).

Built into the app (`src/app/addons.ts`, `angular.json` styles) and offered in Settings → Overlay → Theme.
`npm run build:apt-default` builds the front end with it as the default theme for a fresh install.
How themes work and how to make one: [THEMING.md](../../THEMING.md).

Files: `theme.ts` (registration), `theme.css` (palette over our tokens, fonts, global styles),
`apt-price-check.*` (the price check), `apt-title-bar.ts`, `apt-unidentified-picker.ts`, `apt-icon.ts`
(Font Awesome glyphs APT uses, as SVG), `images/` and `fonts/`.

Credits: the look, the images in `images/` (influence icons, stash) and the font files come from
Awakened PoE Trade, MIT © Alexander Drozdov (`LICENSE-awakened-poe-trade.txt`). Fonts: Fontin and
Fontin SmallCaps by Jos Buivenga (exljbris, free font licence), Exo 2 by Natanael Gama (SIL OFL).
APT's Cyrillic font (FrizQuadrata, commercial) is not included: Cyrillic falls back to Alegreya SC.
