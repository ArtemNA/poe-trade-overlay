import { Component } from '@angular/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { SettingsWindow } from './settings/settings-window';
import { PopupWindow } from './popup-window/popup-window';

/** Both Tauri windows load the same app; the window label picks the view. */
@Component({
  selector: 'app-root',
  imports: [SettingsWindow, PopupWindow],
  template: `
    @if (label === 'popup') {
      <app-popup-window />
    } @else {
      <app-settings-window />
    }
  `,
})
export class App {
  protected readonly label = getCurrentWindow().label;

  constructor() {
    if (this.label === 'popup') {
      document.documentElement.classList.add('popup');
    }
  }
}
