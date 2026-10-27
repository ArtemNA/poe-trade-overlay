// Item check: links to item databases, stash search text and weapon DPS.
// Port of APT `item-check/hotkeyable-actions.ts` and the DPS part of `ItemInfo.vue`.

import type { ParsedItem } from '@/parser';
import { CRAFT_OF_EXILE_SITE, DEFAULT_LANG, Lang, POE_WIKI_SITE, POEDB_LANGS, POEDB_SITE } from '../constants';

export function wikiUrl(item: ParsedItem): string {
  // APT passes the raw name to window.open; the opener plugin needs a valid URL.
  return `${POE_WIKI_SITE}/${encodeURIComponent(item.info.refName.replaceAll(' ', '_'))}`;
}

export function poedbUrl(item: ParsedItem, lang: Lang = DEFAULT_LANG): string {
  const slug = encodeURIComponent(item.info.refName.replaceAll("'", '').replaceAll(' ', '_'));
  return `${POEDB_SITE}/${POEDB_LANGS[lang]}/${slug}`;
}

export function craftOfExileUrl(item: ParsedItem): string {
  return `${CRAFT_OF_EXILE_SITE}/?game=poe1&eimport=${encodeURIComponent(item.rawText)}`;
}

/** Craft of Exile only makes sense for bases that can still be crafted on. */
export function canCraftOfExile(item: ParsedItem): boolean {
  return Boolean(item.info.craftable) && !item.isCorrupted && !item.isMirrored;
}

/** Stash search text: the item name in quotes, matched as a phrase by the game. */
export function stashSearchText(item: ParsedItem): string {
  return JSON.stringify(item.info.name);
}

export interface WeaponDps {
  phys: number;
  elem: number;
  total: number;
}

export function weaponDps(item: ParsedItem): WeaponDps | null {
  if (!item.weaponAS) return null;
  const phys = Math.round(item.weaponAS * (item.weaponPHYSICAL ?? 0));
  const elem = Math.round(item.weaponAS * (item.weaponELEMENTAL ?? 0));
  return { phys, elem, total: phys + elem };
}
