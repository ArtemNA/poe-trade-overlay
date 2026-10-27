import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { listen } from '@tauri-apps/api/event';
import { DEFAULT_CURRENCY_OPTIONS, HotkeyAction, SEARCH_STAT_RANGE_MAX } from '../constants';
import { Leagues } from '../core/leagues';
import { type ChatCommand, type PriceCheckSettings, settings, updateSettings } from '../core/settings';
import { ForegroundEvent, host } from '../host';
import { MapModsEditor } from '../map-check/map-mods-editor';
import { hotkeyConflicts } from './hotkey';
import { HotkeyInput } from './hotkey-input';

interface LogLine {
  time: string;
  text: string;
}

const MAX_LOG_LINES = 200;

type Section = 'general' | 'hotkeys' | 'chat' | 'price-check' | 'map-check' | 'log';

const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'hotkeys', label: 'Hotkeys' },
  { id: 'chat', label: 'Chat' },
  { id: 'price-check', label: 'Price check' },
  { id: 'map-check', label: 'Map check' },
  { id: 'log', label: 'Log' },
];

const HOTKEYS: Array<{ action: HotkeyAction; label: string; hint: string }> = [
  { action: 'price-check', label: 'Price check', hint: 'Trade listings and poe.ninja price of the hovered item' },
  { action: 'item-check', label: 'Item check', hint: 'Links and details; on maps, contracts and logbooks the map check' },
  { action: 'wiki', label: 'Open on wiki', hint: 'poewiki.net page of the item, without the popup' },
  { action: 'poedb', label: 'Open on PoEDB', hint: 'poedb.tw page of the item, without the popup' },
  { action: 'craft-of-exile', label: 'Open in Craft of Exile', hint: 'The item in the crafting simulator' },
  { action: 'stash-search', label: 'Find in stash', hint: 'Types the item name into the stash search' },
];

/** The main window: settings (APT `SettingsWindow.vue`) and the host log. Pushes the host's part of the settings. */
@Component({
  selector: 'app-settings-window',
  imports: [HotkeyInput, MapModsEditor],
  templateUrl: './settings-window.html',
})
export class SettingsWindow {
  protected readonly sections = SECTIONS;
  protected readonly hotkeyRows = HOTKEYS;
  protected readonly currencies = DEFAULT_CURRENCY_OPTIONS;
  protected readonly statRangeMax = SEARCH_STAT_RANGE_MAX;
  protected readonly section = signal<Section>('general');
  protected readonly settings = settings;
  protected readonly leagues = inject(Leagues);
  protected readonly gameActive = signal(false);
  /** The title the host really looks for; differs from the setting when `POE_GAME_TITLE` is set (dev). */
  protected readonly hostGameTitle = signal<string | null>(null);
  protected readonly log = signal<LogLine[]>([]);
  /** Messages from the host about hotkeys it could not register. */
  protected readonly hotkeyErrors = signal<string[]>([]);
  /** Hotkey owners that share a key: action ids and `chat-<index>` for chat commands. */
  protected readonly conflicts = computed(() =>
    hotkeyConflicts({
      ...settings().hotkeys,
      ...Object.fromEntries(settings().commands.map((command, i) => [`chat-${i}`, command.hotkey])),
    }),
  );

  constructor() {
    void this.loadLeagues();
    host.getStatus().then((status) => this.gameActive.set(status.gameActive));

    // The host keeps no settings of its own: every change of the title or the hotkeys goes there.
    effect(() => {
      const { gameTitle, hotkeys, commands } = settings();
      host
        .setHostConfig(gameTitle, hotkeys, commands.filter((command) => command.text.trim()))
        .then((errors) => {
          this.hotkeyErrors.set(errors);
          return host.getStatus();
        })
        .then(
          (status) => this.hostGameTitle.set(status.gameTitle),
          (e) => this.hotkeyErrors.set([String(e)]),
        );
    });

    const unlisteners = [
      listen<ForegroundEvent>('foreground', ({ payload }) => {
        this.gameActive.set(payload.isGame);
        this.append(`Foreground: "${payload.title}"${payload.isGame ? ' → game' : ''}`);
      }),
      listen<string>('log', ({ payload }) => this.append(payload)),
    ];
    inject(DestroyRef).onDestroy(() => unlisteners.forEach((p) => p.then((unlisten) => unlisten())));
  }

  protected setGameTitle(title: string): void {
    const trimmed = title.trim();
    if (trimmed && trimmed !== settings().gameTitle) updateSettings({ gameTitle: trimmed });
  }

  protected setAccountName(name: string): void {
    updateSettings({ accountName: name.trim() });
  }

  protected setHotkey(action: HotkeyAction, hotkey: string | null): void {
    updateSettings({ hotkeys: { ...settings().hotkeys, [action]: hotkey } });
  }

  protected updateCommand(index: number, patch: Partial<ChatCommand>): void {
    updateSettings({ commands: settings().commands.map((command, i) => (i === index ? { ...command, ...patch } : command)) });
  }

  protected addCommand(): void {
    updateSettings({ commands: [...settings().commands, { text: '', hotkey: null, send: true }] });
  }

  protected removeCommand(index: number): void {
    updateSettings({ commands: settings().commands.filter((_, i) => i !== index) });
  }

  protected setPriceCheck(patch: Partial<PriceCheckSettings>): void {
    updateSettings({ priceCheck: { ...settings().priceCheck, ...patch } });
  }

  /** APT accepts 0–50 %; anything else keeps the old value. */
  protected setStatRange(text: string): void {
    const value = Number(text);
    if (Number.isInteger(value) && value >= 0 && value <= SEARCH_STAT_RANGE_MAX) this.setPriceCheck({ searchStatRange: value });
  }

  protected async loadLeagues(): Promise<void> {
    await this.leagues.load();
    const error = this.leagues.error();
    this.append(error ? `Leagues failed: ${error}` : `Leagues: ${this.leagues.list().map((l) => l.id).join(', ')}`);
  }

  private append(text: string): void {
    const time = new Date().toLocaleTimeString();
    this.log.update((lines) => [{ time, text }, ...lines].slice(0, MAX_LOG_LINES));
  }
}
