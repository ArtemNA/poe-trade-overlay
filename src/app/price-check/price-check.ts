// Price check session logic. Port of the non-UI parts of APT CheckedItem.vue
// (MIT © 2020 Alexander Drozdov): preset creation and the "search right away" decision.

import { ItemCategory, ItemRarity, type ParsedItem } from '@/parser';
import { createPresets } from '../../lib/apt/web/price-check/filters/create-presets';
import type { FilterPreset } from '../../lib/apt/web/price-check/filters/interfaces';
import { CATEGORY_TO_TRADE_ID } from '../../lib/apt/web/price-check/trade/pathofexile-trade';
import { PRICE_CHECK_DEFAULTS } from '../constants';
import { settings } from '../core/settings';

export interface Presets {
  active: string;
  presets: FilterPreset[];
}

export function activePreset(presets: Presets): FilterPreset {
  return presets.presets.find((preset) => preset.id === presets.active)!;
}

/**
 * Filter presets for an item. The buyout currency filter carries over when the same item
 * is checked again (as in APT).
 */
export function createItemPresets(item: ParsedItem, leagueId: string, previous?: { item: ParsedItem; presets: Presets }): Presets {
  const sameItem =
    previous &&
    item.info.namespace === previous.item.info.namespace &&
    item.info.refName === previous.item.info.refName;
  return createPresets(item, {
    league: leagueId,
    merchantOnly: PRICE_CHECK_DEFAULTS.merchantOnly,
    collapseListings: PRICE_CHECK_DEFAULTS.collapseListings,
    activateStockFilter: PRICE_CHECK_DEFAULTS.activateStockFilter,
    searchStatRange: PRICE_CHECK_DEFAULTS.searchStatRange,
    useEn: settings().useIntlSite,
    currency: sameItem ? activePreset(previous.presets).filters.trade.currency : PRICE_CHECK_DEFAULTS.defaultCurrency,
  });
}

/** Items whose price rarely depends on filter tweaks are searched right away. */
export function shouldSearchImmediately(item: ParsedItem, presets: Presets): boolean {
  if (!PRICE_CHECK_DEFAULTS.smartInitialSearch) return false;
  return Boolean(
    item.rarity === ItemRarity.Unique ||
      presets.active === 'filters.preset_bulk' ||
      item.mapCompletionReward ||
      item.category === ItemCategory.HeistContract ||
      item.category === ItemCategory.HeistBlueprint ||
      item.category === ItemCategory.SanctumRelic ||
      item.category === ItemCategory.Charm ||
      item.category === ItemCategory.Idol ||
      (!CATEGORY_TO_TRADE_ID.has(item.category!) && item.info.refName !== 'Mercenary Warrant') ||
      item.isUnidentified ||
      item.isVeiled,
  );
}
