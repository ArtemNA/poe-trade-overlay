//! Pre-created hidden popup window, shown next to the game on demand without taking focus.

use tauri::{AppHandle, Manager};

use crate::platform::{self, Point, Rect};
use crate::state::AppState;

pub const LABEL: &str = "popup";
const WIDTH_LOGICAL: f64 = 460.0;

/// Call once on startup, after the popup window exists.
pub fn init(app: &AppHandle) -> tauri::Result<()> {
  let window = app.get_webview_window(LABEL).expect("popup window is declared in tauri.conf.json");
  let raw = window.hwnd()?.0 as platform::RawHwnd;
  platform::make_no_activate(raw);
  app.state::<AppState>().set_popup_hwnd(raw);

  let handle = app.clone();
  platform::watch_escape(move || {
    // Runs inside the keyboard hook: just post the work and return.
    let inner = handle.clone();
    let _ = handle.run_on_main_thread(move || hide(&inner));
  });
  Ok(())
}

/// Like APT: the popup takes the half of the game window opposite to the cursor
/// (item in the inventory on the right → popup on the left).
pub fn geometry(game: Rect, cursor: Point, scale: f64) -> Rect {
  let width = ((WIDTH_LOGICAL * scale).round() as i32).min(game.width);
  let cursor_on_right = cursor.x > game.x + game.width / 2;
  let x = if cursor_on_right { game.x } else { game.x + game.width - width };
  Rect { x, y: game.y, width, height: game.height }
}

pub fn show(app: &AppHandle, game: Rect, cursor: Point) {
  let Some(window) = app.get_webview_window(LABEL) else { return };
  let scale = window.scale_factor().unwrap_or(1.0);
  let state = app.state::<AppState>();
  platform::show_no_activate(state.popup_hwnd(), geometry(game, cursor, scale));
  state.set_popup_visible(true);
  platform::set_escape_enabled(true);
}

pub fn hide(app: &AppHandle) {
  let state = app.state::<AppState>();
  platform::set_escape_enabled(false);
  platform::hide(state.popup_hwnd());
  state.set_popup_visible(false);
}
