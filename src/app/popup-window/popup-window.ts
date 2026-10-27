import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { listen } from '@tauri-apps/api/event';
import { parseClipboard, type ParsedItem } from '@/parser';
import { currencyRates, divineFractions, trackCurrencyRates } from '../core/currency-rates';
import { loadI18n } from '../core/i18n';
import { Leagues } from '../core/leagues';
import { settings } from '../core/settings';
import { loadGameData } from '../game-data';
import { CheckTarget, host, ItemTextEvent } from '../host';
import { ItemCheckPanel } from '../item-check/item-check-panel';
import { formatChaos } from '../price-check/listing-summary';
import { PriceCheckPanel } from '../price-check/price-check-panel';
import { ItemView, toItemView } from './item-view';

/** The popup: price check (title bar with league and divine rate, filters, listings) or item check. */
@Component({
  selector: 'app-popup-window',
  imports: [PriceCheckPanel, ItemCheckPanel],
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
    });
    inject(DestroyRef).onDestroy(() => unlisten.then((fn) => fn()));
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
