//! Static, tunable values of the Rust side in one place.
//! TypeScript counterparts live in `src/app/constants.ts`.

use std::time::Duration;

/// Exact title of the game window until the settings arrive (`set_host_config`).
/// Override with the `ENV_GAME_TITLE` variable, which then wins over the settings.
pub const DEFAULT_GAME_TITLE: &str = "Path of Exile";

/// Dev: any window can stand in for the game (e.g. Notepad with item text).
pub const ENV_GAME_TITLE: &str = "POE_GAME_TITLE";
/// Dev: `=1` keeps the popup open when the game loses focus (needed for screenshots).
pub const ENV_KEEP_POPUP: &str = "POE_KEEP_POPUP";

/// Debug builds must run under the dev identifier (`npm run dev`, `tauri.dev.conf.json`), so their
/// settings file, WebView data and log never touch those of an installed release.
pub const DEV_IDENTIFIER_SUFFIX: &str = ".dev";

/// Built-in browser (FINDINGS F-45): created on first use; trade requests run inside its page.
pub const BROWSER_WINDOW: &str = "browser";
/// The trade sites the browser may be on and make requests for (FINDINGS F-60): the page has to be
/// on the request's host to send it with its cookies. The game language picks one (ru for Russian).
pub const BROWSER_HOSTS: [&str; 2] = ["www.pathofexile.com", "ru.pathofexile.com"];
/// Until the settings tell the game language's site (`set_trade_host`).
pub const DEFAULT_TRADE_HOST: &str = "www.pathofexile.com";
/// Page the browser opens on its host.
pub const BROWSER_HOME_PATH: &str = "/trade";
pub const BROWSER_WIDTH_LOGICAL: f64 = 1100.0;
pub const BROWSER_HEIGHT_LOGICAL: f64 = 800.0;
/// Global of the page where request results wait to be collected.
pub const BROWSER_REPLIES_GLOBAL: &str = "__poeTradeOverlayReplies";
/// Request paths in the log are cut to this length (fetch URLs carry long id lists).
pub const BROWSER_LOG_URL_CHARS: usize = 80;
/// How often we look for a result in the page.
pub const BROWSER_POLL_DELAY: Duration = Duration::from_millis(25);
pub const BROWSER_LOAD_TIMEOUT: Duration = Duration::from_secs(20);
pub const BROWSER_REQUEST_TIMEOUT: Duration = Duration::from_secs(30);

/// Log file size before it is started over (only the latest file is kept).
pub const LOG_MAX_BYTES: u128 = 2 * 1024 * 1024;
pub const TRAY_ID: &str = "main";
/// The NSIS installer puts this next to the exe; without it the exe is the portable build.
pub const INSTALLER_UNINSTALLER: &str = "uninstall.exe";
/// Before 0.1.2 the app was "PoE Trade Overlay" and installed into its own folder, so an update
/// to Price of Exile left the Start menu and desktop shortcuts on the old exe (FINDINGS F-56).
/// Shortcuts with this name that start this exe are moved to the current one.
pub const OLD_SHORTCUT_FILE: &str = "PoE Trade Overlay.lnk";
pub const OLD_EXE_FILE: &str = "poe-trade-overlay.exe";
pub const SHORTCUT_FILE: &str = "Price of Exile.lnk";
/// Start message in the screen corner: label, gap to the work area edge, how long it stays.
pub const TOAST_WINDOW: &str = "toast";
pub const TOAST_MARGIN_LOGICAL: f64 = 16.0;
pub const TOAST_DURATION: Duration = Duration::from_millis(4500);
/// A found update stays longer: it asks for a click.
pub const TOAST_UPDATE_DURATION: Duration = Duration::from_secs(12);
/// Event to the toast page: what to show (the start message or an update).
pub const TOAST_MESSAGE_EVENT: &str = "toast-message";
/// The settings page asks for the start message while the toast window may not exist yet (a
/// release build loads the page faster than the windows are created): wait for it this long.
pub const TOAST_WAIT: Duration = Duration::from_secs(5);
pub const TOAST_WAIT_STEP: Duration = Duration::from_millis(50);

/// Window labels, as declared in `tauri.conf.json`.
pub const MAIN_WINDOW: &str = "main";
pub const POPUP_WINDOW: &str = "popup";

/// Price check window size in logical pixels (shrinks to fit a smaller game window).
pub const POPUP_WIDTH_LOGICAL: f64 = 960.0;
pub const POPUP_HEIGHT_LOGICAL: f64 = 590.0;
/// Item check window size in logical pixels; it is vertically centred on the game.
pub const ITEM_CHECK_WIDTH_LOGICAL: f64 = 380.0;
pub const ITEM_CHECK_HEIGHT_LOGICAL: f64 = 330.0;
/// Stash search panel size in logical pixels until the page fits it; centred on the game,
/// between the stash and the inventory.
pub const STASH_PANEL_WIDTH_LOGICAL: f64 = 360.0;
pub const STASH_PANEL_HEIGHT_LOGICAL: f64 = 300.0;
/// After the popup moved to a monitor with another scale, Windows resizes it for that scale:
/// set its place once more after this delay.
pub const DPI_REPOSITION_DELAY: Duration = Duration::from_millis(80);
/// Gap between the popup and the game window edge, logical pixels.
pub const POPUP_MARGIN_LOGICAL: f64 = 24.0;
/// Width of the game's own side panels (stash on the left, inventory on the right) as a share
/// of the game height: 986 px at 1600 px tall, as APT measures it. "Opposite the cursor" puts the
/// popup right next to the panel the item is in, not at the far edge of the game.
pub const POE_PANEL_WIDTH_RATIO: f64 = 986.0 / 1600.0;
/// The popup's top edge sits this share of the game height below the game's top.
pub const POPUP_TOP_RATIO: f64 = 0.1;

/// Chat commands (APT `text-box.ts`): the last whisper partner, at the start or end of a command.
pub const CHAT_PLACEHOLDER_LAST: &str = "@last";
/// First characters the game clears the chat input for by itself: global, party, whisper,
/// trade, guild channels and commands.
pub const CHAT_AUTO_CLEAR: [char; 6] = ['#', '%', '@', '$', '&', '/'];

/// The clipboard is put back this long after a stash search pasted into the game (APT `RESTORE_AFTER`).
pub const CLIPBOARD_RESTORE_AFTER: Duration = Duration::from_millis(120);
/// Wait for the game to have the keyboard again after the popup gave it back, before typing into it.
pub const STASH_SEARCH_FOCUS_DELAY: Duration = Duration::from_millis(60);

/// Clipboard polling after Ctrl+C (APT `HostClipboard`: 48 ms × up to 500 ms).
pub const CLIPBOARD_POLL_DELAY: Duration = Duration::from_millis(48);
pub const CLIPBOARD_POLL_LIMIT: Duration = Duration::from_millis(500);

/// Second attempt to give the keyboard back to the game if the first one was intercepted.
pub const FOCUS_RETRY_DELAY: Duration = Duration::from_millis(150);

/// First line of copied item text, per game language (APT `HostClipboard.ts`): EN and RU.
pub const ITEM_FIRST_LINES: &[&str] = &["Item Class: ", "Класс предмета: "];
