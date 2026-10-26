/**
 * Static, tunable values of the app in one place. Rust counterparts: src-tauri/src/constants.rs.
 * Which hosts the app may call at all is the HTTP allowlist in src-tauri/capabilities/default.json.
 * Ported APT code (src/lib/apt) keeps its own constants, identical to upstream.
 */

/** Identifies the app to GGG and other APIs. Keep the version in sync with tauri.conf.json. */
export const APP_NAME = 'PoeTradeOverlay';
export const APP_VERSION = '0.1.0';
export const APP_CONTACT = 'https://github.com/ArtemNA';
export const USER_AGENT = `${APP_NAME}/${APP_VERSION} (+${APP_CONTACT})`;

/** Game data language. Only EN is shipped; add a folder in public/data and extend the maps below. */
export type Lang = 'en';
export const DEFAULT_LANG: Lang = 'en';

/** Game data folder, relative to the app base URL. */
export const DATA_PATH = 'data';

/** Official site per game language (APT `poeWebApi`). Also used when "force English site" is on. */
export const POE_WEB_API: Record<Lang, string> = {
  en: 'www.pathofexile.com',
};
export const POE_INTL_WEB_API = 'www.pathofexile.com';
export const POE_REALM = 'pc';

/** Seconds added to every server rate-limit window to absorb latency (APT default `apiLatencySeconds`). */
export const API_LATENCY_SECONDS = 2;

/** Leagues never offered for trade (APT `Leagues.ts`). Names on pc-ggg and pc-garena. */
export const PERMANENT_SC_LEAGUES = ['Standard', '標準模式'];
export const PERMANENT_HC_LEAGUES = ['Hardcore', '專家模式'];

/** Price check defaults (APT price-check widget `initInstance`). */
export const PRICE_CHECK_DEFAULTS = {
  /** ±% around each roll used for min/max of stat filters. */
  searchStatRange: 10,
  /** Only listings with instant buyout (merchant tabs). */
  merchantOnly: true,
  /** Group same-seller listings by the trade API ('api') or by the app ('app'). */
  collapseListings: 'api' as 'api' | 'app',
  activateStockFilter: false,
  /** Buyout currency filter: null = any. */
  defaultCurrency: null as string | null,
  /** Search immediately when the hotkey is pressed, for items where filters rarely need edits. */
  smartInitialSearch: true,
  showSeller: false as false | 'account' | 'ign',
};

/** Trade listings (APT `TradeListing.vue`). */
export const TRADE_LISTING = {
  /** Rows shown in the popup. */
  showResults: 20,
  /** Ids per /api/trade/fetch request (API maximum is 10). */
  fetchChunk: 10,
  /** Never fetch beyond this many results of one search. */
  apiFetchLimit: 100,
  /** Keep fetching while there are fewer distinct sellers than this… */
  minNotGrouped: 7,
  /** …or fewer rows after grouping than this. */
  minGrouped: 10,
};

/** poe.ninja currency and item prices (APT `Prices.ts` endpoint), host + path without scheme. */
export const POE_NINJA_OVERVIEWS = 'poe.ninja/poe1/api/economy/current/dense/overviews';
/** Re-fetch poe.ninja prices this often while the app runs. */
export const POE_NINJA_REFRESH_MS = 10 * 60 * 1000;
/** Rows of the divine → chaos tooltip in the window title bar. */
export const DIVINE_FRACTIONS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

/** Name plate colors per item rarity (PoE conventions). Keyed by ParsedItem rarity or category. */
export const RARITY_COLORS: Record<string, { text: string; plate: string; rule: string }> = {
  Normal: { text: '#c8c8c8', plate: 'linear-gradient(#2a2826, #161514)', rule: '#5e5a54' },
  Magic: { text: '#8888ff', plate: 'linear-gradient(#22223a, #12121f)', rule: '#4a4a8a' },
  Rare: { text: '#ffff77', plate: 'linear-gradient(#3a2c18, #1f170d)', rule: '#7a5f36' },
  Unique: { text: '#d97a3a', plate: 'linear-gradient(#3a2414, #1f130a)', rule: '#8a5426' },
  Gem: { text: '#1ba29b', plate: 'linear-gradient(#123230, #0a1a19)', rule: '#2a6a66' },
  Currency: { text: '#d8cfa8', plate: 'linear-gradient(#2a2822, #16150f)', rule: '#5e5a4a' },
  'Divination Card': { text: '#0ebaff', plate: 'linear-gradient(#0f2a36, #08161d)', rule: '#2a5a70' },
};

/** Dot color next to listing prices, by trade currency id. */
export const CURRENCY_COLORS: Record<string, string> = {
  chaos: '#d6b04c',
  divine: '#d8d8e8',
  exalted: '#c9b48a',
  chrome: '#5aa0d8',
  vaal: '#b5413a',
};
export const CURRENCY_COLOR_OTHER = '#8f887c';

/** localStorage key for user settings; shared by the main and popup windows. */
export const SETTINGS_STORAGE_KEY = 'poe-trade-overlay.settings';
