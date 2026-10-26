import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, input, signal, untracked } from '@angular/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import type { ParsedItem } from '@/parser';
import type { FilterNumeric, FilterOrGroup, StatFilter } from '../../lib/apt/web/price-check/filters/interfaces';
import { RATE_LIMIT_RULES, RATE_LIMIT_RULES_REVISION } from '../../lib/apt/web/price-check/trade/common';
import { CURRENCY_COLOR_OTHER, CURRENCY_COLORS, RARITY_COLORS } from '../constants';
import { currencyRates, toChaos } from '../core/currency-rates';
import { t, TranslatePipe } from '../core/i18n';
import { settings } from '../core/settings';
import type { ItemView } from '../popup-window/item-view';
import { ItemFilterChip, itemFilterChips } from './item-filter-chips';
import { formatChaos, limiterUsage, summarizeListings } from './listing-summary';
import { NumInput } from './num-input';
import { activePreset, createItemPresets, Presets, shouldSearchImmediately } from './price-check';
import { GroupedResult, TradeSearch, tradeSiteUrl } from './trade-search';

type Group = Extract<FilterOrGroup, { group: string }>;

/** Tabs of the results pane; only Trade works so far (Bulk: stage 4, poe.ninja: stage 5, Wiki: stage 9). */
const TABS = [
  { id: 'trade', label: 'Trade', ready: true },
  { id: 'bulk', label: 'Bulk', ready: false },
  { id: 'ninja', label: 'poe.ninja', ready: false },
  { id: 'wiki', label: 'Wiki', ready: false },
];

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
  protected readonly tabs = TABS;
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
    return `Search ${format(limiterUsage(RATE_LIMIT_RULES.SEARCH))} · Fetch ${format(limiterUsage(RATE_LIMIT_RULES.FETCH))}`;
  });

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
    if (!active || this.search.isSearching()) return;
    this.stale.set(false);
    void this.search.search(active.filters, active.stats);
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
    if (!this.search.isSearching()) this.runSearch();
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
    const active = this.active();
    if (!active) return;
    void openUrl(tradeSiteUrl(active.filters, active.stats, this.stale() ? undefined : this.search.searchResult()?.id));
  }
}
