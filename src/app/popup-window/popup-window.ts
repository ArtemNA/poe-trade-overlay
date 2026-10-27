import { afterNextRender, Component, computed, DestroyRef, effect, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { listen } from '@tauri-apps/api/event';
import { parseClipboard, type ParsedItem } from '@/parser';
import { currencyRates, divineFractions, trackCurrencyRates } from '../core/currency-rates';
import { loadI18n } from '../core/i18n';
import { Leagues } from '../core/leagues';
import { settings } from '../core/settings';
import { loadGameData } from '../game-data';
import { openUrl } from '@tauri-apps/plugin-opener';
import { CheckTarget, host, ItemActionEvent, ItemTextEvent } from '../host';
import { craftOfExileUrl, poedbUrl, stashSearchText, wikiUrl } from '../core/item-links';
import { ITEM_CHECK_WIDTH, MAP_CHECK_WIDTH, STASH_PANEL_WIDTH } from '../constants';
import { ItemCheckPanel } from '../item-check/item-check-panel';
import { isMapLike } from '../map-check/map-check';
import { MapCheckPanel } from '../map-check/map-check-panel';
import { StashPanel } from '../stash-search/stash-panel';
import { formatChaos } from '../price-check/listing-summary';
import { PriceCheckPanel } from '../price-check/price-check-panel';
import { ItemView, toItemView } from './item-view';

/** The popup: price check (title bar with league and divine rate, filters, listings), item check or map check. */
@Component({
  selector: 'app-popup-window',
  imports: [PriceCheckPanel, ItemCheckPanel, MapCheckPanel, StashPanel],
  templateUrl: './popup-window.html',
  // Esc normally reaches the host's keyboard hook; while the popup has the keyboard
  // (typing into a field) it arrives here instead.
  host: { '(document:keydown.escape)': 'close()' },
})
export class PopupWindow {
  protected readonly target = signal<CheckTarget>('price-check');
  protected readonly parsed = signal<ParsedItem | null>(null);
  protected readonly item = signal<ItemView | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly menu = signal<'league' | 'divine' | null>(null);
  protected readonly settings = settings;
  protected readonly leagues = inject(Leagues);
  protected readonly divine = currencyRates.divine;
  protected readonly ratesUpdated = currencyRates.updatedAt;
  protected readonly mapCheck = computed(() => {
    const item = this.parsed();
    return this.target() === 'item-check' && item !== null && isMapLike(item);
  });
  protected readonly title = computed(() =>
    this.target() === 'price-check'
      ? 'Price check'
      : this.target() === 'stash-search'
        ? 'Stash search'
        : this.mapCheck()
          ? 'Map check'
          : 'Item check',
  );
  /** Item and map check content; the window takes its height (see `fit`). */
  private readonly fitContent = viewChild<ElementRef<HTMLElement>>('fitContent');
  private readonly injector = inject(Injector);

  constructor() {
    // Load game data and UI strings while the popup is still hidden, so the first hotkey is fast.
    const dataReady = Promise.all([loadGameData(), loadI18n()]).catch((e) => {
      this.error.set(String(e));
      throw e;
    });
    void this.leagues.load();
    effect(() => trackCurrencyRates(settings().leagueId));

    const unlisten = listen<ItemTextEvent>('item-text', async ({ payload }) => {
      host.popupLostKeyboard(); // a new check: the popup was hidden or never had it
      this.menu.set(null);
      this.error.set(null);
      this.target.set(payload.target);
      if (payload.target === 'stash-search') {
        afterNextRender(() => this.fit(), { injector: this.injector });
        return;
      }
      try {
        await dataReady;
      } catch {
        return;
      }
      const result = parseClipboard(payload.text);
      if (result.isOk()) {
        this.parsed.set(result.value);
        this.item.set(toItemView(result.value));
      } else {
        this.parsed.set(null);
        this.item.set(null);
        this.error.set(result.error);
      }
      // Fit even when the height did not change: the host has just shown the window at the default size.
      afterNextRender(() => this.fit(), { injector: this.injector });
    });
    // Link and stash search hotkeys: act on the item, the popup stays as it is.
    const unlistenAction = listen<ItemActionEvent>('item-action', async ({ payload }) => {
      try {
        await dataReady;
      } catch {
        return;
      }
      const result = parseClipboard(payload.text);
      if (result.isErr()) return;
      const item = result.value;
      switch (payload.action) {
        case 'wiki':
          return openUrl(wikiUrl(item));
        case 'poedb':
          return openUrl(poedbUrl(item));
        case 'craft-of-exile':
          return openUrl(craftOfExileUrl(item));
        case 'stash-search':
          return host.stashSearch(stashSearchText(item)).catch(() => undefined);
      }
    });
    // Later changes of the content (marks, the stash error) resize the window too.
    const resizes = new ResizeObserver(() => this.fit());
    effect(() => {
      resizes.disconnect();
      const content = this.fitContent()?.nativeElement;
      if (content) resizes.observe(content);
    });
    inject(DestroyRef).onDestroy(() => {
      resizes.disconnect();
      void unlisten.then((fn) => fn());
      void unlistenAction.then((fn) => fn());
    });
  }

  /** Item, map check and the stash panel: the window is as tall as the content; the price check keeps its size. */
  private fit(): void {
    const content = this.fitContent()?.nativeElement;
    const section = content?.closest('section');
    if (!content || !section || this.target() === 'price-check') return;
    const chrome = section.offsetHeight - (content.parentElement?.clientHeight ?? 0);
    const width = this.target() === 'stash-search' ? STASH_PANEL_WIDTH : this.mapCheck() ? MAP_CHECK_WIDTH : ITEM_CHECK_WIDTH;
    void host.fitPopup(width, Math.ceil(content.offsetHeight + chrome));
  }

  /** A click outside the number fields ends typing: keyboard back to the game (no-op otherwise). */
  protected pointerDown(event: Event): void {
    if (!(event.target as HTMLElement).closest('app-num-input')) void host.popupReleaseFocus();
  }

  protected toggleMenu(menu: 'league' | 'divine'): void {
    this.menu.update((open) => (open === menu ? null : menu));
  }

  protected selectLeague(id: string): void {
    this.leagues.select(id);
    this.menu.set(null);
  }

  protected fractions(divine: number) {
    return divineFractions(divine);
  }

  protected formatChaos(value: number): string {
    return formatChaos(value);
  }

  protected minutesAgo(date: Date | null): string {
    if (!date) return '';
    const minutes = Math.round((Date.now() - date.getTime()) / 60000);
    return minutes < 1 ? 'just now' : `${minutes} min ago`;
  }

  protected close(): void {
    this.menu.set(null);
    host.hidePopup();
  }
}
