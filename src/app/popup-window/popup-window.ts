import { Component, DestroyRef, inject, signal } from '@angular/core';
import { listen } from '@tauri-apps/api/event';
import { host, ItemTextEvent } from '../host';

/** Stage 0 popup: shows the raw item text read from the clipboard. */
@Component({
  selector: 'app-popup-window',
  templateUrl: './popup-window.html',
})
export class PopupWindow {
  protected readonly item = signal<ItemTextEvent | null>(null);
  protected readonly clicks = signal(0);

  constructor() {
    const unlisten = listen<ItemTextEvent>('item-text', ({ payload }) => {
      this.item.set(payload);
      this.clicks.set(0);
    });
    inject(DestroyRef).onDestroy(() => unlisten.then((fn) => fn()));
  }

  protected close() {
    host.hidePopup();
  }
}
