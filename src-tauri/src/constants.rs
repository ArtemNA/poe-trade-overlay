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

/// Window labels, as declared in `tauri.conf.json`.
pub const MAIN_WINDOW: &str = "main";
pub const POPUP_WINDOW: &str = "popup";

/// Price check window size in logical pixels (shrinks to fit a smaller game window).
pub const POPUP_WIDTH_LOGICAL: f64 = 820.0;
pub const POPUP_HEIGHT_LOGICAL: f64 = 590.0;
/// Item check window size in logical pixels; it is vertically centred on the game.
pub const ITEM_CHECK_WIDTH_LOGICAL: f64 = 380.0;
pub const ITEM_CHECK_HEIGHT_LOGICAL: f64 = 330.0;
/// Gap between the popup and the game window edge, logical pixels.
pub const POPUP_MARGIN_LOGICAL: f64 = 24.0;
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

/// First line of copied item text, per game language. Only EN for now.
pub const ITEM_FIRST_LINES: &[&str] = &["Item Class: "];
