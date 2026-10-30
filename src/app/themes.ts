import type { Type } from '@angular/core';
import type { PopupPosition } from './constants';
import { ADDON_THEMES, DEFAULT_THEME_ID } from './addons';

/**
 * A look of the app. The base theme is ours; addons (addons/<name>, built in only with their
 * Angular configuration, see addons/README.md) add more. A theme recolours every window through
 * the CSS tokens of src/styles.css under `html[data-theme="<id>"]`, and may bring its own price
 * check view over the same logic (a subclass of PriceCheckPanel with its own template).
 */
export interface Theme {
  id: string;
  label: string;
  /** Own price check view; the base one otherwise. */
  priceCheck?: Type<unknown>;
  /** Width of the price check window, logical px; `fullHeight`: as tall as the game. */
  priceCheckSize?: { width: number; fullHeight: boolean };
  /** Where the popup goes, whatever the setting (APT always sits next to the game's panel). */
  popupPosition?: PopupPosition;
}

export const BASE_THEME: Theme = { id: 'price-of-exile', label: 'Price of Exile' };

export const THEMES: readonly Theme[] = [BASE_THEME, ...ADDON_THEMES];

/** The theme a fresh install starts with: an addon built in as the default, or ours. */
export const DEFAULT_THEME = DEFAULT_THEME_ID ?? BASE_THEME.id;

/** The theme by its id; '' or an id this build does not have: the build's default. */
export function themeById(id: string): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES.find((theme) => theme.id === DEFAULT_THEME) ?? BASE_THEME;
}
