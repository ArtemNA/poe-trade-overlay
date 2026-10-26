import { Component, DestroyRef, inject, signal } from '@angular/core';
import { listen } from '@tauri-apps/api/event';
import { Leagues } from '../core/leagues';
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
  protected readonly leagues = inject(Leagues);

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.loadLeagues();

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

  protected async loadLeagues() {
    await this.leagues.load();
    const error = this.leagues.error();
    this.append(
      error
        ? `Leagues failed: ${error}`
        : `Leagues: ${this.leagues.list().map((l) => l.id).join(', ')}; selected ${this.leagues.selectedId()}`,
    );
  }

  private append(text: string) {
    const time = new Date().toLocaleTimeString();
    this.log.update((lines) => [{ time, text }, ...lines].slice(0, MAX_LOG_LINES));
  }
}
