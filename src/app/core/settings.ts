import { signal } from '@angular/core';
import type { MapCheckConfig } from '@/web/map-check/common';
import {
  DEFAULT_GAME_TITLE,
  DEFAULT_HOTKEYS,
  DEFAULT_LANG,
  DEFAULT_MAP_CHECK,
  HotkeyAction,
  Lang,
  LEGACY_SETTINGS_STORAGE_KEY,
  PRICE_CHECK_DEFAULTS,
  SETTINGS_CHANGED_EVENT,
  SETTINGS_FILE,
  SETTINGS_STORE_KEY,
  SETTINGS_VERSION,
} from '../constants';

/** Price check options the user can change (APT `PriceCheckWidget`, the subset ported so far). */
export interface PriceCheckSettings {
  searchStatRange: number;
  merchantOnly: boolean;
  collapseListings: 'api' | 'app';
  activateStockFilter: boolean;
  defaultCurrency: string | null;
  smartInitialSearch: boolean;
}

export interface Settings {
  configVersion: number;
  leagueId?: string;
  language: Lang;
  /** Use the international (English) trade site regardless of game language. */
  useIntlSite: boolean;
  /** PoE account name: own listings are marked in results. */
  accountName: string;
  /** Exact title of the game window. */
  gameTitle: string;
  hotkeys: Record<HotkeyAction, string | null>;
  priceCheck: PriceCheckSettings;
  /** Map check profile and marked map mods (APT `ItemCheckWidget.maps`). */
  mapCheck: MapCheckConfig;
}

export function defaultSettings(): Settings {
  const { searchStatRange, merchantOnly, collapseListings, activateStockFilter, defaultCurrency, smartInitialSearch } =
    PRICE_CHECK_DEFAULTS;
  return {
    configVersion: SETTINGS_VERSION,
    language: DEFAULT_LANG,
    useIntlSite: false,
    accountName: '',
    gameTitle: DEFAULT_GAME_TITLE,
    hotkeys: { ...DEFAULT_HOTKEYS },
    priceCheck: { searchStatRange, merchantOnly, collapseListings, activateStockFilter, defaultCurrency, smartInitialSearch },
    mapCheck: DEFAULT_MAP_CHECK,
  };
}

/**
 * Brings stored settings of any older version up to `SETTINGS_VERSION` (APT `upgradeConfig`).
 * Version 0 is the localStorage format of stages 2–10: flat, no version, no hotkeys or price check.
 * Unknown or missing fields fall back to the defaults, so a damaged file still loads.
 */
export function upgradeSettings(raw: unknown): Settings {
  const defaults = defaultSettings();
  if (!raw || typeof raw !== 'object') return defaults;
  const stored = raw as Partial<Settings>;
  return {
    ...defaults,
    ...stored,
    configVersion: SETTINGS_VERSION,
    hotkeys: { ...defaults.hotkeys, ...stored.hotkeys },
    priceCheck: { ...defaults.priceCheck, ...stored.priceCheck },
    mapCheck: { ...defaults.mapCheck, ...stored.mapCheck },
  };
}

const state = signal<Settings>(defaultSettings());

/** Current settings; plain module state so ported APT code can read it outside Angular DI. */
export const settings = state.asReadonly();

interface Persistence {
  save(value: Settings): Promise<void>;
  broadcast(value: Settings): Promise<void>;
}
let persistence: Persistence | null = null;

/**
 * Loads the settings before the app starts (call once per window). Without Tauri (unit tests)
 * the defaults stay and nothing is saved.
 */
export async function initSettings(): Promise<void> {
  const { load } = await import('@tauri-apps/plugin-store');
  const { emit, listen } = await import('@tauri-apps/api/event');
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const store = await load(SETTINGS_FILE, { defaults: {}, autoSave: false });
  let stored = await store.get<unknown>(SETTINGS_STORE_KEY);
  if (stored === undefined) {
    stored = readLegacy();
  }
  const settings = upgradeSettings(stored);
  state.set(settings);

  const label = getCurrentWindow().label;
  persistence = {
    async save(value) {
      await store.set(SETTINGS_STORE_KEY, value);
      await store.save();
    },
    broadcast: (value) => emit(SETTINGS_CHANGED_EVENT, { from: label, settings: value }),
  };
  // Both windows load the same file; the one that changes a setting tells the other.
  await listen<{ from: string; settings: Settings }>(SETTINGS_CHANGED_EVENT, ({ payload }) => {
    if (payload.from !== label) state.set(payload.settings);
  });
  if (stored === undefined || (stored as Partial<Settings>).configVersion !== SETTINGS_VERSION) {
    await persistence.save(settings);
  }
}

function readLegacy(): unknown {
  try {
    const raw = globalThis.localStorage?.getItem(LEGACY_SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function updateSettings(patch: Partial<Settings>): void {
  state.update((current) => ({ ...current, ...patch }));
  const value = state();
  void persistence?.save(value).catch((e) => console.error('Saving settings failed', e));
  void persistence?.broadcast(value);
}
