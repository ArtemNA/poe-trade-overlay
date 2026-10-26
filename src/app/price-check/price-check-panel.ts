import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, input, signal, untracked } from '@angular/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import type { ParsedItem } from '@/parser';
import type { FilterOrGroup, StatFilter } from '../../lib/apt/web/price-check/filters/interfaces';
import { t, TranslatePipe } from '../core/i18n';
import { settings } from '../core/settings';
import { ItemFilterChip, itemFilterChips } from './item-filter-chips';
import { activePreset, createItemPresets, Presets, shouldSearchImmediately } from './price-check';
import { TradeListings } from './trade-listings';
import { TradeSearch, tradeSiteUrl } from './trade-search';

type Roll = NonNullable<StatFilter['roll']>;

/**
 * Filters and trade listings for one item. Stage 3 functional UI; the design comes later.
 * APT filter objects are mutable by design: edits change them in place and bump `revision`.
 */
@Component({
  selector: 'app-price-check',
  imports: [NgTemplateOutlet, TranslatePipe, TradeListings],
  templateUrl: './price-check-panel.html',
})
export class PriceCheckPanel {
  readonly item = input.required<ParsedItem>();

  protected readonly presets = signal<Presets | null>(null);
  protected readonly error = signal<string | null>(null);
  /** Filters changed since the last search: the user starts the next one. */
  protected readonly stale = signal(true);
  protected readonly search = new TradeSearch();
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
      this.error.set('No league selected: choose one in the main window.');
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
    if (!active) return;
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

  protected wheelChip(chip: ItemFilterChip, event: WheelEvent): void {
    if (!chip.numeric) return;
    event.preventDefault();
    chip.numeric.value = Math.max(0, chip.numeric.value + (event.deltaY < 0 ? 1 : -1));
    chip.numeric.disabled = false;
    this.markChanged();
  }

  // Online filters change the search right away (as in APT).

  protected toggleOffline(): void {
    const trade = this.active()!.filters.trade;
    trade.offline = !trade.offline;
    this.revision.update((n) => n + 1);
    this.runSearch();
  }

  protected toggleMerchantOnly(): void {
    const trade = this.active()!.filters.trade;
    trade.merchantOnly = !trade.merchantOnly;
    this.revision.update((n) => n + 1);
    this.runSearch();
  }

  // Stat filters

  protected isGroup(filter: FilterOrGroup): filter is Extract<FilterOrGroup, { group: string }> {
    return Boolean(filter.group);
  }

  protected asStat(filter: FilterOrGroup): StatFilter {
    return filter as StatFilter;
  }

  protected toggleStat(filter: StatFilter): void {
    filter.disabled = !filter.disabled;
    this.markChanged();
  }

  protected toggleGroup(group: Extract<FilterOrGroup, { group: string }>): void {
    group.expanded = !group.expanded;
    this.revision.update((n) => n + 1);
  }

  protected statText(filter: StatFilter): string {
    const value = filter.roll?.value;
    return value != null && filter.text.split('#').length === 2 ? filter.text.replace('#', String(value)) : filter.text;
  }

  protected rollValue(roll: Roll, which: 'min' | 'max'): string {
    const value = roll[which];
    return typeof value === 'number' ? String(value) : '—';
  }

  /** Mouse wheel over min/max steps it; the popup takes no keyboard focus, so there is no typing yet. */
  protected wheelRoll(filter: StatFilter, which: 'min' | 'max', event: WheelEvent): void {
    const roll = filter.roll;
    if (!roll) return;
    event.preventDefault();
    const step = roll.dp ? 0.1 : 1;
    const current = roll[which];
    const base = typeof current === 'number' ? current : roll.value;
    const next = base + (event.deltaY < 0 ? step : -step);
    roll[which] = roll.dp ? Math.round(next * 10) / 10 : next;
    filter.disabled = false;
    this.markChanged();
  }

  /** Click on min/max: clear it, or restore the default when already empty. */
  protected clickRoll(filter: StatFilter, which: 'min' | 'max'): void {
    const roll = filter.roll;
    if (!roll) return;
    roll[which] = typeof roll[which] === 'number' ? '' : roll.default[which];
    this.markChanged();
  }

  protected openTradeSite(): void {
    const active = this.active();
    if (!active) return;
    void openUrl(tradeSiteUrl(active.filters, active.stats, this.stale() ? undefined : this.search.searchResult()?.id));
  }
}
