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

/** localStorage key for user settings; shared by the main and popup windows. */
export const SETTINGS_STORAGE_KEY = 'poe-trade-overlay.settings';
