import type { Theme } from '../../src/app/themes';
import { AptPriceCheck } from './apt-price-check';
import { AptUnidentifiedPicker } from './apt-unidentified-picker';

/** Awakened PoE Trade's look: its colours everywhere, its price check layout. */
export const APT_THEME: Theme = {
  id: 'apt',
  label: 'Awakened PoE Trade',
  priceCheck: AptPriceCheck,
  unidentifiedPicker: AptUnidentifiedPicker,
  // APT: 28.75 rem = 460 px wide, as tall as the game, next to the game's inventory or stash panel.
  priceCheckSize: { width: 460, fullHeight: true },
  // The popup position setting applies as in our theme; "Opposite the cursor" is APT's own.
};
