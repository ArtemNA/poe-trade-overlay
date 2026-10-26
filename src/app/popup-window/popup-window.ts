import { Component, DestroyRef, inject, signal } from '@angular/core';
import { listen } from '@tauri-apps/api/event';
import { parseClipboard, type ParsedItem } from '@/parser';
import { loadI18n } from '../core/i18n';
import { settings } from '../core/settings';
import { loadGameData } from '../game-data';
import { host, ItemTextEvent } from '../host';
import { PriceCheckPanel } from '../price-check/price-check-panel';
import { ItemView, toItemView } from './item-view';

/** Popup: the parsed item, its price check, and the raw text for debugging. */
@Component({
  selector: 'app-popup-window',
  imports: [PriceCheckPanel],
  templateUrl: './popup-window.html',
})
export class PopupWindow {
  protected readonly event = signal<ItemTextEvent | null>(null);
  protected readonly parsed = signal<ParsedItem | null>(null);
  protected readonly item = signal<ItemView | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly showDetails = signal(false);
  protected readonly showRaw = signal(false);
  protected readonly settings = settings;

  constructor() {
    // Load game data and UI strings while the popup is still hidden, so the first hotkey is fast.
    const dataReady = Promise.all([loadGameData(), loadI18n()]).catch((e) => {
      this.error.set(String(e));
      throw e;
    });

    const unlisten = listen<ItemTextEvent>('item-text', async ({ payload }) => {
      this.event.set(payload);
      this.item.set(null);
      this.parsed.set(null);
      this.error.set(null);
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
        this.error.set(result.error);
      }
    });
    inject(DestroyRef).onDestroy(() => unlisten.then((fn) => fn()));
  }

  protected close() {
    host.hidePopup();
  }
}
