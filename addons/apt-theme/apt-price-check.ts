import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, signal, untracked } from '@angular/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { ItemCategory, ItemRarity } from '@/parser';
import { applyIncr } from '@/parser/advanced-mod-desc';
import { ITEM_BY_REF } from '@/assets/data';
import {
  FilterTag,
  INTERNAL_TRADE_IDS,
  type FilterNumeric,
  type FilterOrGroup,
  type StatFilter,
} from '../../src/lib/apt/web/price-check/filters/interfaces';
import { percentRoll, roundRoll } from '../../src/lib/apt/web/price-check/filters/util';
import { RATE_LIMIT_RULES, RATE_LIMIT_RULES_REVISION } from '../../src/lib/apt/web/price-check/trade/common';
import { CATEGORY_TO_TRADE_ID } from '../../src/lib/apt/web/price-check/trade/pathofexile-trade';
import { MODS_PRESET_ID } from '../../src/app/constants';
import { currencyRates } from '../../src/app/core/currency-rates';
import { autoCurrency, displayRounding } from '../../src/app/core/ninja-prices';
import { t, TranslatePipe, TrPipe } from '../../src/app/core/i18n';
import { NumInput } from '../../src/app/price-check/num-input';
import { PriceCheckPanel } from '../../src/app/price-check/price-check-panel';
import { Currency } from '../../src/app/shared/currency';
import { host } from '../../src/app/host';
import { AptIcon } from './apt-icon';
import { AptTitleBar } from './apt-title-bar';

/** APT's related items panel beside the column: max-width 24 rem. */
const APT_RELATED_WIDTH = 384;

/** One part of a mod text: the rolled number is drawn in Exo 2 white (APT `ItemModifierText`). */
export interface TextPart {
  text: string;
  roll?: boolean;
}

/** A chip of the filter row (APT `FilterBtnNumeric` / `FilterBtnLogical`). */
type Chip =
  | { kind: 'numeric'; key: string; name: string; filter: FilterNumeric }
  | { kind: 'logical'; key: string; text: string; active: boolean; toggle?: () => void; img?: string; collapse?: boolean };

/** An APT price: "4.5", "1 / 12", a range "3 ~ 5"; `div` prices are golden. */
interface QuickPrice {
  min: string;
  max: string | null;
  div: boolean;
}

/** Rows of APT's listing tables: always 20, empty ones keep the stripes going. */
const TABLE_ROWS = 20;

/** Mod text with the rolled value in place of `#` (APT splits on `[+-]?#`, dropping the sign). */
export function modTextParts(text: string, roll: number | undefined): TextPart[] {
  const parts: TextPart[] = [];
  const pieces = text.split(/(?<![#])[+-]?[#]/gm);
  pieces.forEach((piece, i) => {
    if (piece !== '') parts.push({ text: piece });
    if (i !== pieces.length - 1) parts.push(roll == null ? { text: '#' } : { text: String(roll), roll: true });
  });
  return parts;
}

/**
 * The price check as Awakened PoE Trade lays it out (one column as tall as the game), over the
 * same logic as ours: everything comes from PriceCheckPanel, the template is APT's. What APT
 * shows and the base class does not compute (its chips, tags, tier badges, the mods behind a
 * filter, the trend arrows) is computed here.
 */
@Component({
  selector: 'app-apt-price-check',
  imports: [NgTemplateOutlet, TranslatePipe, TrPipe, NumInput, Currency, AptIcon, AptTitleBar],
  templateUrl: './apt-price-check.html',
  host: { class: 'apt-price-check relative flex min-h-0 flex-1 flex-row', '(mousedown)': 'backdropDown($event)' },
})
export class AptPriceCheck extends PriceCheckPanel {
  /** Related items stand beside the column (the window grows by their panel), as in APT. */
  protected readonly relatedBeside = computed(() => {
    const group = this.related();
    return !!group && !('error' in group);
  });

  /** A click on the transparent part beside the column is a click into the game: it closes. */
  protected backdropDown(event: MouseEvent): void {
    if (event.target === event.currentTarget) void host.hidePopup();
  }

  /**
   * Opposite the cursor, related items take one side of the column (the window grows by their
   * panel, the column stays next to the game's panel). Centred, the window grows on both sides so
   * the column itself stays in the centre of the game, with related items on its right.
   */
  protected override themeWindowWidth(width: number): number {
    if (!this.relatedBeside()) return width;
    return this.popupSide() === 'centre' ? width + 2 * APT_RELATED_WIDTH : width + APT_RELATED_WIDTH;
  }

  protected readonly tableRows = TABLE_ROWS;
  /** "Collapse": the filters fold into the "N of M, stats" chip. */
  protected readonly statsFolded = signal(false);
  protected readonly showRateLimits = signal(false);
  protected readonly onlineOpen = signal(false);

  constructor() {
    super();
    // A new item: filters unfolded, hidden ones not shown (APT `FiltersBlock`).
    effect(() => {
      this.item();
      untracked(() => {
        this.statsFolded.set(false);
        this.showHidden.set(false);
        this.onlineOpen.set(false);
      });
    });
  }

  // Name bar (APT `FilterName.vue`)

  protected readonly nameLabel = computed(() => {
    const filters = this.active()?.filters;
    if (!filters) return this.item().info.name;
    const search = filters.searchRelaxed && !filters.searchRelaxed.disabled ? filters.searchRelaxed : filters.searchExact;
    if (search.name) return search.name;
    if (search.baseType) return search.baseType;
    if (search.category) {
      const tradeId = CATEGORY_TO_TRADE_ID.get(search.category);
      if (tradeId) return t('item_category.prop', t(`item_category.${tradeId.replace('.', '_')}`));
    }
    return '???';
  });

  protected readonly nameExact = computed(() => this.active()?.filters.searchRelaxed?.disabled === true);

  protected toggleNameAccuracy(): void {
    const relaxed = this.active()?.filters.searchRelaxed;
    if (relaxed) this.setBase(!relaxed.disabled);
  }

  /** APT 3.29 has two states: Not Corrupted / Corrupted. */
  protected readonly isCorrupted = computed(() => this.active()?.filters.corrupted?.value ?? false);

  protected toggleCorrupted(): void {
    this.setCorruptedState(this.corrupted() === 'not' ? 'only' : 'not');
  }

  // poe.ninja line (APT `PriceTrend.vue` + `ItemQuickPrice.vue`)

  protected toQuick(min: number, max: number, currency: string, fraction: boolean): QuickPrice {
    const a = displayRounding(min, fraction);
    const b = displayRounding(max, fraction);
    return { min: a, max: a === b ? null : b, div: currency === 'div' };
  }

  protected readonly ninjaQuick = computed(() => {
    const value = this.ninjaValue();
    if (!value) return null;
    return this.toQuick(value.min, value.max, value.currency, this.active()?.filters.stackSize != null);
  });

  /** No poe.ninja line: APT still shows "icon → ?" for items that are not crafting bases. */
  protected readonly ninjaUnknown = computed(() => !this.ninjaValue() && !this.item().info.craftable);

  /** APT sizes the item picture by its inventory cells: 2 tall, 2 wide or 1×1. */
  protected readonly itemImgSize = computed(() => {
    const info = this.item().info;
    const base = info.unique ? (ITEM_BY_REF('ITEM', info.unique.base)?.[0] ?? info) : info;
    const w = base.w ?? 1;
    const h = base.h ?? 1;
    return h > 1 ? 'w-8 h-10 -my-1' : w > 1 ? 'w-12 h-8' : 'w-8 h-8';
  });

  /**
   * Arrows and the sparkline. The number is ours (the week's change, F-34), the look APT's:
   * ⌃⌃ green when up, ⌄⌄ red when down, ± when flat.
   */
  protected readonly trendView = computed(() => {
    const trend = this.ninja()?.trend;
    if (!trend) return null;
    const rounded = Math.round(Math.abs(trend.change));
    const forecast = rounded === 0 ? 'const' : trend.change > 0 ? 'up' : 'down';
    return { forecast, text: `${rounded} %`, path: this.trendPaths(trend.graph) };
  });

  /** APT's 3 × 2 rem area chart: smooth line, gray-700 fill below, a little air above and below. */
  private trendPaths(graph: Array<number | null>): { line: string; area: string } {
    const points = graph.filter((p): p is number => p != null);
    const mean = points.reduce((a, b) => a + b, 0) / points.length;
    const spread = Math.sqrt(points.map((x) => (x - mean) ** 2).reduce((a, b) => a + b, 0) / Math.max(1, points.length - 1));
    const lo = Math.min(...points) - (spread || 1);
    const hi = Math.max(...points) + (spread || 1);
    const W = 48;
    const H = 32;
    const xy = points.map((p, i) => [points.length > 1 ? (i / (points.length - 1)) * W : 0, H - ((p - lo) / (hi - lo)) * H]);
    const r = (n: number) => Math.round(n * 10) / 10;
    let line = `M${r(xy[0][0])},${r(xy[0][1])}`;
    for (let i = 1; i < xy.length; i++) {
      // Catmull-Rom → Bézier: the "smooth" curve of ApexCharts.
      const p0 = xy[Math.max(0, i - 2)];
      const p1 = xy[i - 1];
      const p2 = xy[i];
      const p3 = xy[Math.min(xy.length - 1, i + 1)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      line += ` C${r(c1[0])},${r(c1[1])} ${r(c2[0])},${r(c2[1])} ${r(p2[0])},${r(p2[1])}`;
    }
    return { line, area: `${line} L${W},${H} L0,${H} Z` };
  }

  protected openNinja(): void {
    const url = this.ninja()?.url;
    if (url) void openUrl(url);
  }

  // Chips (APT `FiltersBlock.vue`, in its order)

  protected readonly aptChips = computed<Chip[]>(() => {
    const filters = this.active()?.filters;
    if (!filters) return [];
    const chips: Chip[] = [];
    const numeric = (key: keyof typeof filters, i18n: string) => {
      const filter = filters[key] as FilterNumeric | undefined;
      if (filter) chips.push({ kind: 'numeric', key, name: t(i18n, ''), filter });
    };
    const readonly = (key: string, text: string) => chips.push({ kind: 'logical', key, text, active: true });
    numeric('linkedSockets', 'item.linked_sockets');
    numeric('mapTier', 'item.map_tier');
    if (filters.mapCompletionReward) readonly('reward', t('item.map_foil_reward', filters.mapCompletionReward.name));
    numeric('areaLevel', 'item.area_level');
    numeric('sentinelCharge', 'item.sentinel_charge');
    if (filters.mapBlighted?.value) readonly('blighted', t(filters.mapBlighted.value));
    numeric('itemLevel', 'item.item_level');
    numeric('stackSize', 'item.stock');
    numeric('whiteSockets', 'item.white_sockets');
    numeric('gemLevel', 'item.gem_level');
    numeric('quality', 'item.quality');
    for (const influence of filters.influences ?? []) {
      chips.push({
        kind: 'logical',
        key: `influence-${influence.value}`,
        text: t(influence.value),
        active: !influence.disabled,
        toggle: () => (influence.disabled = !influence.disabled),
        img: `apt-influence apt-influence-${influence.value}`,
      });
    }
    const logical = (key: string, filter: { disabled: boolean } | undefined, text: string, always = false) => {
      if (filter) {
        chips.push({ kind: 'logical', key, text, active: always || !filter.disabled, toggle: () => (filter.disabled = !filter.disabled) });
      }
    };
    if (filters.rarity?.value === 'magic') logical('rarity', filters.rarity, t('Magic'));
    logical('unidentified', filters.unidentified, t('item.unidentified'));
    logical('veiled', filters.veiled, t('item.veiled'));
    logical('foil', filters.foil, t('item.foil_unique'));
    if (filters.mirrored && !filters.mirrored.hidden) {
      logical('mirrored', filters.mirrored, t(filters.mirrored.disabled ? 'item.not_mirrored' : 'item.mirrored'), true);
    }
    if (filters.split && !filters.split.hidden) {
      logical('split', filters.split, t(filters.split.disabled ? 'item.not_split' : 'item.split'), true);
    }
    if (this.hasStats()) {
      const on = this.counts().on;
      chips.push({
        kind: 'logical',
        key: 'stats',
        text: on > 0 ? t('filters.selected_some', on, this.counts().all) : t('filters.selected_none'),
        active: on > 0,
        toggle: () => this.statsFolded.update((folded) => !folded),
        collapse: this.statsFolded(),
      });
    }
    return chips;
  });

  protected clickChip(chip: Chip): void {
    if (chip.kind !== 'logical' || !chip.toggle) return;
    if (chip.key === 'stats') {
      chip.toggle();
      return;
    }
    chip.toggle();
    this.markChanged();
  }

  protected toggleNumeric(filter: FilterNumeric): void {
    filter.disabled = !filter.disabled;
    this.markChanged();
  }

  /** The chip field grows with its number, like APT's (`1.2 + digits` ch). */
  protected chipInputWidth(value: number | '' | undefined): string {
    return `${1.2 + Math.max(String(value ?? '').length, 2)}ch`;
  }

  // Stat filters

  /** Unknown mods are listed after the filters (APT `UnknownModifier.vue`), except on maps and sentinels. */
  protected readonly unknownMods = computed(() => {
    const item = this.item();
    if (item.category === ItemCategory.Sentinel || item.category === ItemCategory.Map) return [];
    return item.unknownModifiers;
  });

  protected readonly hasStats = computed(
    () =>
      (this.active()?.stats.length ?? 0) > 0 ||
      (this.unknownMods().length > 0 && this.item().rarity === ItemRarity.Unique) ||
      this.aptPresets().length > 1,
  );

  /** Hidden on: only the hidden filters; off: only the others (APT `filteredStats`). */
  protected readonly aptStats = computed(() => {
    const stats = this.active()?.stats ?? [];
    const hidden = (entry: FilterOrGroup) => (entry.group ? entry.meta.hidden != null : entry.hidden != null);
    return stats.filter((entry) => hidden(entry) === this.showHidden());
  });

  protected readonly anyHidden = computed(() => (this.active()?.stats ?? []).some((entry) => (entry.group ? entry.meta.hidden : entry.hidden) != null));

  /** Pseudo / Base item like APT; our extra "Mods" preset is not offered in this theme. */
  protected readonly aptPresets = computed(() => (this.presets()?.presets ?? []).filter((preset) => preset.id !== MODS_PRESET_ID));

  protected filterText(filter: StatFilter): string {
    return INTERNAL_TRADE_IDS.includes(filter.tradeId[0]) ? t(filter.tradeId[0], '#', '#') : filter.text;
  }

  protected parts(text: string, roll?: number): TextPart[] {
    return modTextParts(text, roll);
  }

  /** "(Quality: 20%)" next to the defences and DPS: they are searched at 20 % quality. */
  protected q20(filter: StatFilter): string | null {
    const ids = ['item.armour', 'item.evasion_rating', 'item.energy_shield', 'item.ward', 'item.total_dps', 'item.physical_dps'];
    return ids.includes(filter.tradeId[0]) ? t('item.prop_quality', Math.max(20, this.item().quality || 0)) : null;
  }

  /** APT `showTag`: the kind of the stat, not for properties, gems, the empty-mod filter and plain unique mods. */
  protected tagOf(filter: StatFilter): { cls: string; text: string } | null {
    const item = this.item();
    const show =
      filter.tag !== FilterTag.Property &&
      filter.tradeId[0] !== 'item.has_empty_modifier' &&
      !['Chronicle of Atzoatl', 'Mirrored Tablet', 'Filled Coffin'].includes(item.info.refName) &&
      item.category !== ItemCategory.Gem &&
      !(item.rarity === ItemRarity.Unique && (filter.tag === FilterTag.Explicit || filter.tag === FilterTag.Pseudo));
    if (!show) return null;
    const count = filter.sources.length > 1 ? ` x ${filter.sources.length}` : '';
    return { cls: `apt-tag-${filter.tag}`, text: t(`filters.tag_${filter.tag.replace('-', '_')}`) + count };
  }

  /** "Tier 1" / "Tier 2" badges (APT `FilterModifierTiers.vue`). */
  protected tiers(filter: StatFilter): Array<{ cls: string; tier: number }> {
    const category = this.item().category;
    const out: Array<{ cls: string; tier: number }> = [];
    for (const source of filter.sources) {
      const tier = source.modifier.info.tier;
      if (!tier) continue;
      const plain = filter.tag === FilterTag.Explicit || filter.tag === FilterTag.Pseudo || filter.tag === FilterTag.Property;
      const jewel = [ItemCategory.Jewel, ItemCategory.ClusterJewel, ItemCategory.MemoryLine, ItemCategory.Idol].includes(category!);
      if (plain && !jewel) {
        if (tier === 1) out.push({ cls: 'apt-tier-1', tier });
        else if (tier === 2) out.push({ cls: 'apt-tier-2', tier });
      } else if (tier >= 2) {
        out.push({ cls: 'apt-not-tier-1', tier });
      }
    }
    return out.sort((a, b) => a.tier - b.tier);
  }

  protected readonly emptyAffixKeys = ['filters.option_empty_affix', 'filters.option_empty_prefix', 'filters.option_empty_suffix'];

  /** Mods on: the mods behind the filter under it while hovered (APT `showSourceInfo`). */
  protected showSourceInfo(filter: StatFilter): boolean {
    if (!this.showSources() || !filter.sources.length || filter.option != null) return false;
    const first = filter.sources[0].modifier.info;
    return filter.tag === FilterTag.Pseudo || filter.sources.length >= 2 || first.name != null || first.tier != null || first.rank != null;
  }

  /** One mod behind a filter (APT `SourceInfo.vue`): `Explicit "Rapturous" (Tier: 2)` and its lines. */
  protected sourceInfo(filter: StatFilter, source: StatFilter['sources'][number]) {
    const { info } = source.modifier;
    let title = t(`item.mod_${info.type}`);
    if (info.name != null) title += ` "${info.name}"`;
    if (info.tier != null) title += ` (${t('item.mod_tier', info.tier)})`;
    if (info.rank != null) title += ` (${t('item.mod_rank', info.rank)})`;

    let contribution = source.contributes?.value;
    if (contribution != null && filter.roll) {
      contribution = roundRoll(contribution * (filter.roll.isNegated ? -1 : 1), filter.roll.dp);
    }
    const lines = source.modifier.stats.map((parsed) => {
      if (parsed.stat.ref !== source.stat.stat.ref) {
        return { parts: modTextParts(parsed.translation.string, undefined), contributes: false, contribution: undefined };
      }
      const applied = applyIncr(info, parsed) ?? parsed;
      const roll = applied.roll ? roundRoll(applied.roll.value * (applied.translation.negate ? -1 : 1), applied.roll.dp) : undefined;
      return { parts: modTextParts(applied.translation.string, roll), contributes: true, contribution };
    });
    return { title, lines };
  }

  // Roll slider (APT `StatRollSlider.vue`)

  protected slider(filter: StatFilter) {
    const roll = filter.roll!;
    const bounds = roll.bounds!;
    const span = bounds.max - bounds.min || 1;
    const min = roll.min;
    const max = roll.max;
    const tick = ((roll.value - bounds.min) / span) * 100;
    if (typeof min === 'number' && typeof max !== 'number') {
      return { mode: 'min', left: ((min - bounds.min) / span) * 100, right: 0, minIn: false, maxIn: true, tick };
    }
    if (typeof min !== 'number' && typeof max === 'number') {
      return { mode: 'max', left: 0, right: ((bounds.max - max) / span) * 100, minIn: true, maxIn: false, tick };
    }
    if (typeof min === 'number' && typeof max === 'number' && min <= max) {
      return {
        mode: 'range',
        left: ((min - bounds.min) / span) * 100,
        right: ((bounds.max - max) / span) * 100,
        minIn: min <= bounds.min,
        maxIn: max >= bounds.max,
        tick,
      };
    }
    return { mode: 'none', left: 0, right: 0, minIn: false, maxIn: false, tick };
  }

  /** Dragging on the slider moves the min (or the max, when only that is set). */
  protected slide(event: MouseEvent, filter: StatFilter, track: HTMLElement): void {
    const mode = this.slider(filter).mode;
    if (mode !== 'min' && mode !== 'max') return;
    event.preventDefault();
    const roll = filter.roll!;
    const bounds = roll.bounds!;
    const move = (e: MouseEvent) => {
      const rect = track.getBoundingClientRect();
      const k = Math.max(0, Math.min((e.clientX - rect.x) / rect.width, 1));
      const value = (bounds.max - bounds.min) * k + bounds.min;
      if (mode === 'min') this.setRoll(filter, 'min', percentRoll(value, -0, Math.floor, roll.dp));
      else this.setRoll(filter, 'max', percentRoll(value, +0, Math.ceil, roll.dp));
    };
    const stop = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', stop);
    };
    move(event);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', stop);
  }

  // Results

  /** After Search (and until a filter changes) the listings take the place of the Search button. */
  protected readonly showResults = computed(() => !this.stale() || this.isSearching());

  protected readonly aptRows = computed(() => {
    const rows: Array<ReturnType<typeof this.search.rows>[number] | null> = [...this.search.rows()];
    while (rows.length < TABLE_ROWS && this.search.searchResult() && rows.length < this.search.searchResult()!.result.length) rows.push(null);
    return rows;
  });

  /** Bulk: always 20 rows, the Market Ratio row among them (APT `selectedResults`). */
  protected readonly aptBulkLines = computed(() => {
    const lines: Array<ReturnType<typeof this.bulkLines>[number] | null> = this.bulk.current() ? this.bulkLines().slice(0, TABLE_ROWS) : [];
    while (lines.length < TABLE_ROWS) lines.push(null);
    return lines;
  });

  protected readonly floor = Math.floor;

  protected bulkNumber(value: number, digits: number): number {
    return Number(value.toFixed(digits));
  }

  protected readonly onlineLabel = computed(() => {
    const trade = this.active()?.filters.trade;
    if (!trade) return '';
    if (trade.offline) return t('Offline');
    if (this.activeTab() !== 'bulk' && trade.merchantOnly) return t('online_filter.merchant_toggle');
    return t('Online');
  });

  protected readonly onlineWarning = computed(() => {
    const trade = this.active()?.filters.trade;
    return Boolean(trade && ((trade.listed && ['1day', '3days', '1week'].includes(trade.listed)) || (trade.currency && trade.currency !== 'chaos_divine')));
  });

  protected readonly listedOptions: Array<{ value: string | null; key: string }> = [
    { value: null, key: 'online_filter.listed_any_time' },
    { value: '1day', key: 'online_filter.listed_1day' },
    { value: '3days', key: 'online_filter.listed_3days' },
    { value: '1week', key: 'online_filter.listed_1week' },
    { value: '2weeks', key: 'online_filter.listed_2weeks' },
    { value: '1month', key: 'online_filter.listed_1month' },
    { value: '2months', key: 'online_filter.listed_2months' },
  ];

  protected readonly currencyOptions: Array<{ value: string | null; key: string }> = [
    { value: null, key: 'online_filter.currency_any' },
    { value: 'chaos', key: 'online_filter.currency_only_chaos' },
    { value: 'divine', key: 'online_filter.currency_only_div' },
    { value: 'chaos_divine', key: 'online_filter.currency_chaos_div' },
  ];

  protected setOffline(): void {
    const trade = this.active()!.filters.trade;
    // APT: offline sellers come with "listed in the last 2 months".
    if (this.activeTab() !== 'bulk') trade.listed = trade.offline ? null : '2months';
    this.toggleOffline();
  }

  protected setListed(value: string | null): void {
    this.active()!.filters.trade.listed = value;
    this.markChanged();
    this.runSearchSoon();
  }

  protected setCurrency(value: string | null): void {
    this.active()!.filters.trade.currency = value;
    this.markChanged();
    this.runSearchSoon();
  }

  // Stack value (APT `StackValue.vue`)

  protected readonly stackValue = computed(() => {
    const filters = this.active()?.filters;
    const chaos = this.ninja()?.price?.chaos;
    if (!filters?.stackSize || chaos == null) return null;
    const isDivine = this.item().info.refName === 'Divine Orb';
    const priceFor = (n: number) => {
      const value = isDivine ? { min: n * chaos, currency: 'chaos' } : autoCurrency(n * chaos, currencyRates.divine());
      return `${displayRounding(value.min)} ${value.currency}`;
    };
    const have = filters.stackSize.value;
    const stack = this.item().stackSize?.max;
    return {
      have: { amount: have, price: priceFor(have) },
      stack: stack ? { amount: stack, price: priceFor(stack) } : null,
    };
  });

  // Related items (APT `RelatedItems.vue`)

  protected relatedQuick(chaos: number | undefined): QuickPrice | null {
    if (chaos == null) return null;
    const value = autoCurrency(chaos, currencyRates.divine());
    return this.toQuick(value.min, value.max, value.currency, true);
  }

  // Rate limiting tab (APT `RateLimiterState.vue`)

  protected readonly rateLimits = computed(() => {
    RATE_LIMIT_RULES_REVISION();
    const policies = [
      { policy: 'trade-search-request-limit', rules: RATE_LIMIT_RULES.SEARCH },
      { policy: 'trade-exchange-request-limit', rules: RATE_LIMIT_RULES.EXCHANGE },
      { policy: 'trade-fetch-request-limit', rules: RATE_LIMIT_RULES.FETCH },
    ];
    return policies.map(({ policy, rules }) => {
      const list = Array.from(rules);
      list.forEach((rule) => rule.revision());
      return {
        policy,
        hasQueue: list.some((rule) => rule.queue()),
        rules: list.map((rule) => ({ max: rule.max, window: rule.window, active: rule.stack.length, queue: rule.queue() })),
      };
    });
  });

  protected readonly isLimited = computed(() => this.rateLimits().some((limit) => limit.hasQueue));
}
