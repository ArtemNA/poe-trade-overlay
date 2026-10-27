import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, input, signal, untracked } from '@angular/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import type { ParsedItem } from '@/parser';
import type { FilterNumeric, FilterOrGroup, StatFilter } from '../../lib/apt/web/price-check/filters/interfaces';
import {
  apiToSatisfySearch,
  RATE_LIMIT_RULES,
  RATE_LIMIT_RULES_REVISION,
  tradeTag,
} from '../../lib/apt/web/price-check/trade/common';
import { CURRENCY_COLOR_OTHER, CURRENCY_COLORS, RARITY_COLORS } from '../constants';
import { isValuableBasetype } from '../../lib/apt/web/price-check/trends/getDetailsId';
import { currencyRates, toChaos } from '../core/currency-rates';
import {
  autoCurrency,
  CurrencyValue,
  displayRounding,
  findItemPrice,
  ninjaUrl,
  priceTrend,
  queryId,
  relatedItems,
  sparkline,
} from '../core/ninja-prices';
import { t, TranslatePipe } from '../core/i18n';
import { settings } from '../core/settings';
import type { ItemView } from '../popup-window/item-view';
import {
  bestOffer,
  BulkHave,
  BulkRow,
  BulkSearch,
  bulkSiteUrl,
  MarketRatio,
  marketRatio,
  priceOffers,
  stackWorth,
} from './bulk-search';
import { ItemFilterChip, itemFilterChips } from './item-filter-chips';
import { formatChaos, limiterUsage, summarizeListings } from './listing-summary';
import { NumInput } from './num-input';
import { activePreset, createItemPresets, Presets, shouldSearchImmediately } from './price-check';
import { GroupedResult, TradeSearch, tradeSiteUrl } from './trade-search';

type Group = Extract<FilterOrGroup, { group: string }>;
type Tab = 'trade' | 'bulk' | 'ninja';
type BulkLine = { kind: 'offer'; row: BulkRow } | { kind: 'ratio'; ratio: MarketRatio };

/** Tabs of the results pane (Wiki: stage 9). */
const TABS = [
  { id: 'trade', label: 'Trade' },
  { id: 'bulk', label: 'Bulk' },
  { id: 'ninja', label: 'poe.ninja' },
  { id: 'wiki', label: 'Wiki' },
] as const;

/**
 * The price check window body: filters on the left, trade listings on the right, status bar.
 * APT filter objects are mutable by design: edits change them in place and bump `revision`.
 */
@Component({
  selector: 'app-price-check',
  imports: [NgTemplateOutlet, TranslatePipe, NumInput],
  templateUrl: './price-check-panel.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class PriceCheckPanel {
  readonly item = input.required<ParsedItem>();
  readonly view = input.required<ItemView>();

  protected readonly presets = signal<Presets | null>(null);
  protected readonly error = signal<string | null>(null);
  /** Filters changed since the last search: the user starts the next one. */
  protected readonly stale = signal(true);
  protected readonly search = new TradeSearch();
  protected readonly bulk = new BulkSearch();
  protected readonly tabs = TABS;
  /** Bait offers (far below poe.ninja) are hidden unless the user asks to see them. */
  protected readonly hideBait = signal(true);
  private readonly tabChoice = signal<Tab | null>(null);
  protected readonly open = signal({ stats: true, item: true, trade: false });
  private readonly revision = signal(0);
  private previous?: { item: ParsedItem; presets: Presets };

  protected readonly active = computed(() => {
    this.revision();
    const presets = this.presets();
    return presets ? activePreset(presets) : null;
  });

  protected readonly chips = computed(() => {
    const active = this.active();
    return active ? itemFilterChips(active.filters) : [];
  });

  protected readonly plate = computed(() => RARITY_COLORS[this.view().rarity] ?? RARITY_COLORS['Normal']);

  protected readonly summary = computed(() => summarizeListings(this.search.groupedResults(), currencyRates.rates()));

  protected readonly limits = computed(() => {
    RATE_LIMIT_RULES_REVISION();
    const format = (usage?: { used: number; max: number }) => (usage ? `${usage.used}/${usage.max}` : '—');
    return this.activeTab() === 'bulk'
      ? `Exchange ${format(limiterUsage(RATE_LIMIT_RULES.EXCHANGE))}`
      : `Search ${format(limiterUsage(RATE_LIMIT_RULES.SEARCH))} · Fetch ${format(limiterUsage(RATE_LIMIT_RULES.FETCH))}`;
  });

  // Tabs

  /** Bulk exchange exists only for items with a trade tag (currency, fragments, essences, …). */
  protected readonly canBulk = computed(() => tradeTag(this.item()) != null);

  /** Like APT: bulk when no stat filter is on and the item can be exchanged; the user may switch. */
  protected readonly activeTab = computed<Tab>(() => {
    const choice = this.tabChoice();
    if (choice) return choice;
    const active = this.active();
    return active ? apiToSatisfySearch(this.item(), active.stats, active.filters) : 'trade';
  });

  protected tabReady(id: string): boolean {
    return id === 'trade' || id === 'ninja' || (id === 'bulk' && this.canBulk());
  }

  protected selectTab(id: string): void {
    if (!this.tabReady(id) || id === this.activeTab()) return;
    const searchTab = this.activeTab() !== 'ninja' && id !== 'ninja';
    this.tabChoice.set(id as Tab);
    // poe.ninja shows the same item: switching to it and back keeps the search results.
    if (searchTab) this.stale.set(true);
  }

  protected readonly isSearching = computed(() => this.search.isSearching() || this.bulk.isSearching());
  protected readonly searchError = computed(() => (this.activeTab() === 'bulk' ? this.bulk.error() : this.search.error()));

  // poe.ninja

  /** poe.ninja entry for the item (null: it has no poe.ninja id, e.g. rares). */
  protected readonly ninja = computed(() => {
    const found = findItemPrice(currencyRates.prices(), this.item());
    if (!found) return null;
    const { query, price } = found;
    const leagueId = settings().leagueId;
    return {
      query,
      price,
      label: [query.name, query.variant].filter(Boolean).join(', '),
      url: price && leagueId ? ninjaUrl(price, leagueId) : undefined,
      trend: price ? priceTrend(price.graph) : null,
    };
  });

  protected updatedAgo(): string {
    const date = currencyRates.updatedAt();
    if (!date) return '';
    const minutes = Math.round((Date.now() - date.getTime()) / 60000);
    return minutes < 1 ? 'just now' : `${minutes} min ago`;
  }

  protected readonly ninjaLoading =computed(() => currencyRates.updatedAt() == null && !currencyRates.error());
  protected readonly ninjaError = currencyRates.error;

  /** Rares and magic bases are priced by base type only: say so next to the price. */
  protected readonly ninjaBaseOnly = computed(() => isValuableBasetype(this.item()));

  /** Price as APT shows it: chaos, or divines from about one divine up (Divine Orb itself in chaos). */
  protected readonly ninjaValue = computed<CurrencyValue | null>(() => {
    const price = this.ninja()?.price;
    if (!price) return null;
    return this.item().info.refName === 'Divine Orb'
      ? { min: price.chaos, max: price.chaos, currency: 'chaos' }
      : autoCurrency(price.chaos, currencyRates.divine());
  });

  protected readonly ninjaSpark = computed(() => {
    const trend = this.ninja()?.trend;
    return trend ? sparkline(trend.graph, 300, 64) : null;
  });

  protected readonly related = computed(() => {
    const query = this.ninja()?.query;
    return query ? relatedItems(queryId(query), currencyRates.prices()) : null;
  });

  protected price(value: CurrencyValue | null | undefined, fraction = false): string {
    if (!value) return '?';
    const unit = value.currency === 'div' ? 'div' : 'c';
    const min = displayRounding(value.min, fraction);
    const max = displayRounding(value.max, fraction);
    return min === max ? `${min} ${unit}` : `${min} – ${max} ${unit}`;
  }

  protected relatedPrice(chaos: number | undefined): string {
    return chaos == null ? '—' : this.price(autoCurrency(chaos, currencyRates.divine()), true);
  }

  protected percent(value: number): string {
    const rounded = Math.abs(value) < 10 ? Math.round(value * 10) / 10 : Math.round(value);
    return `${rounded > 0 ? '+' : rounded < 0 ? '−' : '±'}${Math.abs(rounded)} %`;
  }

  // Bulk

  /** poe.ninja chaos price of the item being priced (currency, fragment, essence, …). */
  protected readonly ninjaChaos = computed(() => currencyRates.rates().get(this.item().info.refName));

  private readonly bulkPriced = computed(() =>
    priceOffers(this.bulk.current()?.listed ?? [], this.bulk.selected(), this.ninjaChaos(), currencyRates.divine()),
  );

  protected readonly bulkBest = computed(() => bestOffer(this.bulkPriced()));
  protected readonly bulkBaitCount = computed(() => this.bulkPriced().filter((row) => row.isBait).length);

  /** Offers with poe.ninja's price slotted in where it belongs (APT "Market Ratio" row). */
  protected readonly bulkLines = computed<BulkLine[]>(() => {
    const rows = this.bulkPriced().filter((row) => !(this.hideBait() && row.isBait));
    const lines: BulkLine[] = rows.map((row) => ({ kind: 'offer', row }));
    const ninja = this.ninjaChaos();
    const ratio = ninja != null ? marketRatio(this.bulk.selected(), ninja, currencyRates.divine()) : undefined;
    if (ratio) {
      const perItem = ratio.exchangeAmount / ratio.itemAmount;
      const at = rows.findIndex((row) => row.exchangeAmount / row.itemAmount >= perItem);
      lines.splice(at === -1 ? lines.length : at, 0, { kind: 'ratio', ratio });
    }
    return lines;
  });

  /** "You have × 12 → 4,111 chaos" from the stock filter or the copied stack (APT StackValue). */
  protected readonly youHave = computed(() => {
    const ninja = this.ninjaChaos();
    const amount = this.active()?.filters.stackSize?.value ?? this.item().stackSize?.value;
    if (ninja == null || !amount) return null;
    const isDivine = this.item().info.refName === 'Divine Orb';
    return { amount, worth: stackWorth(amount, ninja, currencyRates.divine(), isDivine) };
  });

  protected selectHave(have: BulkHave): void {
    void this.bulk.select(have);
  }

  protected toggleHideBait(): void {
    this.hideBait.update((hide) => !hide);
  }

  protected amount(value: number): string {
    return formatChaos(value);
  }

  protected readonly tradeSummary = computed(() => {
    const trade = this.active()?.filters.trade;
    if (!trade) return '';
    return [trade.offline ? 'online & offline' : 'online', trade.merchantOnly ? 'instant buyout' : 'any listing'].join(' · ');
  });

  constructor() {
    effect(() => {
      const item = this.item();
      untracked(() => this.start(item));
    });
  }

  private start(item: ParsedItem): void {
    this.search.reset();
    this.bulk.reset();
    this.tabChoice.set(null);
    this.error.set(null);
    const leagueId = settings().leagueId;
    if (!leagueId) {
      this.presets.set(null);
      this.error.set('No league selected: choose one in the title bar.');
      return;
    }
    const presets = createItemPresets(item, leagueId, this.previous);
    this.previous = { item, presets };
    this.presets.set(presets);
    this.stale.set(true);
    if (shouldSearchImmediately(item, presets)) this.runSearch();
  }

  protected runSearch(): void {
    const active = this.active();
    if (!active || this.isSearching()) return;
    if (this.activeTab() === 'ninja') this.tabChoice.set(null); // Search goes to trade or bulk
    this.stale.set(false);
    if (this.activeTab() === 'bulk') void this.bulk.search(this.item(), active.filters);
    else void this.search.search(active.filters, active.stats);
  }

  protected selectPreset(id: string): void {
    this.presets.update((presets) => presets && { ...presets, active: id });
    this.markChanged();
  }

  protected presetLabel(id: string): string {
    return t(id);
  }

  protected isOpen(key: string): boolean {
    return this.open()[key as 'stats' | 'item' | 'trade'];
  }

  protected toggleSection(key: 'stats' | 'item' | 'trade'): void {
    this.open.update((open) => ({ ...open, [key]: !open[key] }));
  }

  /** Stat and item filter edits wait for the Search button, like in APT. */
  private markChanged(): void {
    this.revision.update((n) => n + 1);
    this.stale.set(true);
  }

  // Item filters

  protected toggleChip(chip: ItemFilterChip): void {
    chip.toggle();
    this.markChanged();
  }

  protected setNumeric(filter: FilterNumeric, which: 'value' | 'max', value: number | ''): void {
    if (which === 'value') {
      if (value === '') return;
      filter.value = value;
    } else {
      filter.max = value === '' ? undefined : value;
    }
    filter.disabled = false;
    this.markChanged();
  }

  // Online filters change the search right away (as in APT).

  protected toggleOffline(): void {
    const trade = this.active()!.filters.trade;
    trade.offline = !trade.offline;
    this.revision.update((n) => n + 1);
    this.runSearchSoon();
  }

  protected toggleMerchantOnly(): void {
    const trade = this.active()!.filters.trade;
    trade.merchantOnly = !trade.merchantOnly;
    this.revision.update((n) => n + 1);
    this.runSearchSoon();
  }

  private runSearchSoon(): void {
    this.stale.set(true);
    if (!this.isSearching()) this.runSearch();
  }

  // Stat filters

  protected isGroup(filter: FilterOrGroup): filter is Group {
    return Boolean(filter.group);
  }

  protected asStat(filter: FilterOrGroup): StatFilter {
    return filter as StatFilter;
  }

  protected toggleStat(filter: StatFilter): void {
    filter.disabled = !filter.disabled;
    this.markChanged();
  }

  protected toggleGroup(group: Group): void {
    group.expanded = !group.expanded;
    this.revision.update((n) => n + 1);
  }

  protected statText(filter: StatFilter): string {
    const value = filter.roll?.value;
    return value != null && filter.text.split('#').length === 2 ? filter.text.replace('#', String(value)) : filter.text;
  }

  /** Short tag before non-explicit stats ("implicit", "crafted", …). */
  protected statTag(filter: StatFilter): string {
    return filter.tag === 'explicit' || filter.tag === 'pseudo' ? '' : t(`filters.tag_${filter.tag}`);
  }

  protected rollValue(filter: StatFilter, which: 'min' | 'max'): number | '' | undefined {
    return filter.roll?.[which];
  }

  protected setRoll(filter: StatFilter, which: 'min' | 'max', value: number | ''): void {
    if (!filter.roll) return;
    filter.roll[which] = value;
    filter.disabled = false;
    this.markChanged();
  }

  // Listings

  protected dot(row: GroupedResult): string {
    return CURRENCY_COLORS[row.priceCurrency] ?? CURRENCY_COLOR_OTHER;
  }

  /** "≈ 3.8" for listings not priced in chaos. */
  protected equivalent(row: GroupedResult): string {
    if (row.priceCurrency === 'chaos') return '';
    const chaos = toChaos(row.priceAmount, row.priceCurrency, currencyRates.rates());
    return chaos != null ? `≈ ${formatChaos(chaos)}` : '';
  }

  protected isCheapest(row: GroupedResult): boolean {
    return `${row.priceAmount} ${row.priceCurrency}` === this.summary().cheapest?.price;
  }

  protected detailHeader(rows: GroupedResult[]): string {
    if (rows.some((r) => r.stackSize != null)) return 'Stack';
    if (rows.some((r) => r.level != null)) return 'Lvl / Q';
    return 'iLvl';
  }

  protected detail(row: GroupedResult): string {
    if (row.stackSize != null) return String(row.stackSize);
    if (row.level != null) return [row.level, row.quality].filter(Boolean).join(' / ');
    return row.itemLevel ?? '';
  }

  protected openTradeSite(): void {
    if (this.activeTab() === 'ninja') {
      const url = this.ninja()?.url;
      if (url) void openUrl(url);
      return;
    }
    const active = this.active();
    if (!active) return;
    const url =
      this.activeTab() === 'bulk'
        ? bulkSiteUrl(this.item(), active.filters, this.bulk.selected())
        : tradeSiteUrl(active.filters, active.stats, this.stale() ? undefined : this.search.searchResult()?.id);
    void openUrl(url);
  }
}
