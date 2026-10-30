import type { Theme } from '../../src/app/themes';
import { AptPriceCheck } from './apt-price-check';

/** Awakened PoE Trade's look: its colours everywhere, its price check layout. */
export const APT_THEME: Theme = {
  id: 'apt',
  label: 'Awakened PoE Trade',
  priceCheck: AptPriceCheck,
  // APT: 28.75 rem = 460 px wide, as tall as the game, next to the game's inventory or stash panel.
  priceCheckSize: { width: 460, fullHeight: true },
  popupPosition: 'opposite-cursor',
};
