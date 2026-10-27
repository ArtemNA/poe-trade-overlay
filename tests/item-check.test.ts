import { beforeAll, describe, expect, it } from 'vitest';
import { parseClipboard, type ParsedItem } from '@/parser';
import {
  canCraftOfExile,
  craftOfExileUrl,
  poedbUrl,
  stashSearchText,
  weaponDps,
  wikiUrl,
} from '../src/app/core/item-links';
import { loadGameDataFromDisk } from './game-data';
import * as items from './items';

beforeAll(loadGameDataFromDisk);

function parse(text: string): ParsedItem {
  return parseClipboard(text)._unsafeUnwrap();
}

const ATZIRIS_PROMISE = `Item Class: Flasks
Rarity: Unique
Atziri's Promise
Amethyst Flask
--------
Lasts 5.00 Seconds
Consumes 30 of 60 Charges on use
Currently has 0 Charges
--------
Requirements:
Level: 68
--------
Item Level: 75
--------
Right click to drink. Can only hold charges while in belt. Refills as you kill monsters.
`;

describe('item check', () => {
  it('links to the wiki and PoEDB by the base or unique name', () => {
    const tabula = parse(items.UNIQUE_TABULA);
    expect(wikiUrl(tabula)).toBe('https://www.poewiki.net/wiki/Tabula_Rasa');
    expect(poedbUrl(tabula)).toBe('https://poedb.tw/us/Tabula_Rasa');
    const ring = parse(items.RARE_RING);
    expect(wikiUrl(ring)).toBe('https://www.poewiki.net/wiki/Sapphire_Ring');
    const promise = parse(ATZIRIS_PROMISE);
    expect(wikiUrl(promise)).toBe("https://www.poewiki.net/wiki/Atziri's_Promise");
    expect(poedbUrl(promise)).toBe('https://poedb.tw/us/Atziris_Promise');
  });

  it('offers Craft of Exile only for craftable, uncorrupted items', () => {
    const ring = parse(items.RARE_RING);
    expect(canCraftOfExile(ring)).toBe(true);
    expect(craftOfExileUrl(ring)).toBe(
      `https://craftofexile.com/?game=poe1&eimport=${encodeURIComponent(items.RARE_RING)}`,
    );
    expect(canCraftOfExile(parse(items.UNIDENTIFIED_CORRUPTED))).toBe(false);
    expect(canCraftOfExile(parse(items.CURRENCY_CHAOS))).toBe(false);
  });

  it('searches the stash for the item name as a phrase', () => {
    expect(stashSearchText(parse(items.UNIQUE_TABULA))).toBe('"Tabula Rasa"');
    expect(stashSearchText(parse(items.RARE_RING))).toBe('"Sapphire Ring"');
  });

  it('computes weapon DPS from the properties', () => {
    expect(weaponDps(parse(items.RARE_BOW))).toEqual({ phys: 161, elem: 112, total: 273 });
    expect(weaponDps(parse(items.RARE_RING))).toBeNull();
  });
});
