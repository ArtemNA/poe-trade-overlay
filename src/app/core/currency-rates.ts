// Currency rates from poe.ninja: the divine → chaos rate in the title bar and
// chaos equivalents of listings priced in other currencies.

import { computed, signal } from '@angular/core';
import { ITEMS_ITERATOR } from '@/assets/data';
import { DIVINE_FRACTIONS, POE_NINJA_OVERVIEWS, POE_NINJA_REFRESH_MS } from '../constants';
import { poeFetch } from './http';

interface NinjaOverviews {
  currencyOverviews: Array<{ type: string; lines: Array<{ name: string; chaos: number }> }>;
}

/** Chaos value per currency name ("Divine Orb" → 342.6). */
export type ChaosRates = ReadonlyMap<string, number>;

export function chaosRatesFromNinja(data: NinjaOverviews): ChaosRates {
  const rates = new Map<string, number>([['Chaos Orb', 1]]);
  for (const overview of data.currencyOverviews) {
    for (const line of overview.lines) rates.set(line.name, line.chaos);
  }
  return rates;
}

/** "0.1 div = 34 c" rows for the title bar tooltip. */
export function divineFractions(divineChaos: number): Array<{ divine: number; chaos: number }> {
  return DIVINE_FRACTIONS.map((divine) => ({ divine, chaos: Math.round(divine * divineChaos) }));
}

const nameByTradeTag = new Map<string, string | null>();

/** Trade site currency id ("chrome") → item name ("Chromatic Orb"), from the game data. */
export function currencyName(tradeTag: string): string | undefined {
  if (!nameByTradeTag.has(tradeTag)) {
    const item = ITEMS_ITERATOR(`"tradeTag":"${tradeTag}"`).next().value;
    nameByTradeTag.set(tradeTag, item?.tradeTag === tradeTag ? item.name : null);
  }
  return nameByTradeTag.get(tradeTag) ?? undefined;
}

/** Chaos value of `amount` units of a trade currency, if poe.ninja knows it. */
export function toChaos(amount: number, tradeTag: string, rates: ChaosRates): number | undefined {
  if (tradeTag === 'chaos') return amount;
  const name = currencyName(tradeTag);
  const rate = name ? rates.get(name) : undefined;
  return rate != null ? amount * rate : undefined;
}

// Module state shared by everything in one window (like settings).
const rates = signal<ChaosRates>(new Map());
const updatedAt = signal<Date | null>(null);
const error = signal<string | null>(null);
let league: string | undefined;
let timer: ReturnType<typeof setInterval> | undefined;

export const currencyRates = {
  rates: rates.asReadonly(),
  updatedAt: updatedAt.asReadonly(),
  error: error.asReadonly(),
  divine: computed(() => rates().get('Divine Orb')),
};

async function load(leagueId: string): Promise<void> {
  try {
    const response = await poeFetch(
      `https://${POE_NINJA_OVERVIEWS}?league=${encodeURIComponent(leagueId)}&language=en`,
    );
    if (!response.ok) throw new Error(`poe.ninja: HTTP ${response.status}`);
    const data = (await response.json()) as NinjaOverviews;
    if (leagueId !== league) return;
    rates.set(chaosRatesFromNinja(data));
    updatedAt.set(new Date());
    error.set(null);
  } catch (e) {
    if (leagueId === league) error.set(e instanceof Error ? e.message : String(e));
  }
}

/** Loads rates for the league and keeps them fresh; call again when the league changes. */
export function trackCurrencyRates(leagueId: string | undefined): void {
  if (leagueId === league) return;
  league = leagueId;
  clearInterval(timer);
  rates.set(new Map());
  updatedAt.set(null);
  if (!leagueId) return;
  void load(leagueId);
  timer = setInterval(() => void load(leagueId), POE_NINJA_REFRESH_MS);
}
