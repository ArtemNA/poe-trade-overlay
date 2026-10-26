import { Component, DestroyRef, inject, signal } from '@angular/core';
import { listen } from '@tauri-apps/api/event';
import { parseClipboard } from '@/parser';
import { settings } from '../core/settings';
import { loadGameData } from '../game-data';
import { host, ItemTextEvent } from '../host';
import { ItemView, toItemView } from './item-view';

/** Stage 1 popup: the item parsed by the ported APT parser, plus the raw text for debugging. */
@Component({
  selector: 'app-popup-window',
  templateUrl: './popup-window.html',
})
export class PopupWindow {
  protected readonly event = signal<ItemTextEvent | null>(null);
  protected readonly item = signal<ItemView | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly showRaw = signal(false);
  protected readonly settings = settings;

  constructor() {
    // Load game data while the popup is still hidden, so the first hotkey is fast.
    const dataReady = loadGameData().catch((e) => {
      this.error.set(String(e));
      throw e;
    });

    const unlisten = listen<ItemTextEvent>('item-text', async ({ payload }) => {
      this.event.set(payload);
      this.item.set(null);
      this.error.set(null);
      try {
        await dataReady;
      } catch {
        return;
      }
      const result = parseClipboard(payload.text);
      if (result.isOk()) {
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
