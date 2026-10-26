import { Component, DestroyRef, inject, signal } from '@angular/core';
import { listen } from '@tauri-apps/api/event';
import { ForegroundEvent, host } from '../host';

interface LogLine {
  time: string;
  text: string;
}

const MAX_LOG_LINES = 200;

/** Stage 0 debug window: which window is "the game", foreground changes and hotkey log. */
@Component({
  selector: 'app-main-window',
  templateUrl: './main-window.html',
})
export class MainWindow {
  protected readonly gameTitle = signal('');
  protected readonly gameActive = signal(false);
  protected readonly log = signal<LogLine[]>([]);

  constructor() {
    const destroyRef = inject(DestroyRef);

    host.getStatus().then((status) => {
      this.gameTitle.set(status.gameTitle);
      this.gameActive.set(status.gameActive);
    });

    const unlisteners = [
      listen<ForegroundEvent>('foreground', ({ payload }) => {
        this.gameActive.set(payload.isGame);
        this.append(`Foreground: "${payload.title}"${payload.isGame ? ' → game' : ''}`);
      }),
      listen<string>('log', ({ payload }) => this.append(payload)),
    ];
    destroyRef.onDestroy(() => unlisteners.forEach((p) => p.then((unlisten) => unlisten())));
  }

  protected saveGameTitle(title: string) {
    this.gameTitle.set(title.trim());
    host.setGameTitle(title);
    this.append(`Game window title set to "${title.trim()}"`);
  }

  private append(text: string) {
    const time = new Date().toLocaleTimeString();
    this.log.update((lines) => [{ time, text }, ...lines].slice(0, MAX_LOG_LINES));
  }
}
