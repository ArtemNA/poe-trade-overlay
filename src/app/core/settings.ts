import { signal } from '@angular/core';
import { DEFAULT_LANG, Lang, SETTINGS_STORAGE_KEY } from '../constants';

export interface Settings {
  leagueId?: string;
  language: Lang;
  /** Use the international (English) trade site regardless of game language. */
  useIntlSite: boolean;
  /** PoE account name: own listings are marked in results. */
  accountName: string;
}

const DEFAULT_SETTINGS: Settings = {
  language: DEFAULT_LANG,
  useIntlSite: false,
  accountName: '',
};

// Stage 2 storage: localStorage of the webview. Replaced by tauri-plugin-store at the settings stage.
function read(): Settings {
  try {
    const raw = globalThis.localStorage?.getItem(SETTINGS_STORAGE_KEY);
    return { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

const state = signal<Settings>(read());

/** Current settings; plain module state so ported APT code can read it outside Angular DI. */
export const settings = state.asReadonly();

export function updateSettings(patch: Partial<Settings>): void {
  state.update((current) => ({ ...current, ...patch }));
  try {
    globalThis.localStorage?.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state()));
  } catch {
    // Storage unavailable: keep the in-memory value.
  }
}

// The main and popup windows are separate webviews of one origin: pick up each other's changes.
globalThis.addEventListener?.('storage', (event) => {
  if ((event as StorageEvent).key === SETTINGS_STORAGE_KEY) state.set(read());
});
