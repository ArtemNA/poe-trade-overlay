import type { FilterNumeric, ItemFilters } from '../../lib/apt/web/price-check/filters/interfaces';
import { t } from '../core/i18n';

/** One toggleable item property filter (item level, links, quality, …). */
export interface ItemFilterChip {
  key: string;
  label: string;
  enabled: boolean;
  toggle(): void;
  /** Numeric filters change their value with the mouse wheel. */
  numeric?: FilterNumeric;
}

/** Numeric ItemFilters keys with the APT i18n key of their label ("Item Level: {0}"). */
const NUMERIC: Array<[keyof ItemFilters, string]> = [
  ['itemLevel', 'item.item_level'],
  ['linkedSockets', 'item.linked_sockets'],
  ['whiteSockets', 'item.white_sockets'],
  ['quality', 'item.quality'],
  ['gemLevel', 'item.gem_level'],
  ['mapTier', 'item.map_tier'],
  ['areaLevel', 'item.area_level'],
  ['stackSize', 'item.stock'],
  ['sentinelCharge', 'item.sentinel_charge'],
];

export function itemFilterChips(filters: ItemFilters): ItemFilterChip[] {
  const chips: ItemFilterChip[] = [];

  const relaxed = filters.searchRelaxed;
  if (relaxed) {
    chips.push({
      key: 'base',
      label: filters.searchExact.baseType ?? filters.searchExact.name ?? 'Base',
      enabled: relaxed.disabled,
      toggle: () => (relaxed.disabled = !relaxed.disabled),
    });
  }

  const rarity = filters.rarity;
  if (rarity) {
    chips.push({ key: 'rarity', label: rarity.value, enabled: !rarity.disabled, toggle: () => (rarity.disabled = !rarity.disabled) });
  }

  for (const [key, i18nKey] of NUMERIC) {
    const filter = filters[key] as FilterNumeric | undefined;
    if (!filter) continue;
    chips.push({
      key,
      label: t(i18nKey, filter.max != null && filter.max !== filter.value ? `${filter.value}–${filter.max}` : filter.value),
      enabled: !filter.disabled,
      toggle: () => (filter.disabled = !filter.disabled),
      numeric: filter,
    });
  }

  const corrupted = filters.corrupted;
  if (corrupted) {
    chips.push({
      key: 'corrupted',
      label: t(corrupted.value ? 'item.corrupted' : 'item.not_corrupted'),
      enabled: true,
      toggle: () => (corrupted.value = !corrupted.value),
    });
  }

  for (const [key, i18nKey] of [['mirrored', 'item.mirrored'], ['split', 'item.split']] as const) {
    const filter = filters[key];
    if (filter && !filter.hidden) {
      chips.push({ key, label: t(i18nKey), enabled: !filter.disabled, toggle: () => (filter.disabled = !filter.disabled) });
    }
  }

  const unidentified = filters.unidentified;
  if (unidentified) {
    chips.push({ key: 'unidentified', label: t('item.unidentified'), enabled: !unidentified.disabled, toggle: () => (unidentified.disabled = !unidentified.disabled) });
  }

  for (const influence of filters.influences ?? []) {
    chips.push({ key: `influence-${influence.value}`, label: t(influence.value), enabled: !influence.disabled, toggle: () => (influence.disabled = !influence.disabled) });
  }

  return chips;
}
