//! Pre-created hidden popup window, shown next to the game on demand without taking focus.

use tauri::{AppHandle, Manager};

use crate::constants::{
    FOCUS_RETRY_DELAY, POPUP_HEIGHT_LOGICAL, POPUP_MARGIN_LOGICAL, POPUP_TOP_RATIO,
    POPUP_WIDTH_LOGICAL, POPUP_WINDOW as LABEL,
};
use crate::platform::{self, Point, Rect};
use crate::state::AppState;

/// Call once on startup, after the popup window exists.
pub fn init(app: &AppHandle) -> tauri::Result<()> {
    let window = app
        .get_webview_window(LABEL)
        .expect("popup window is declared in tauri.conf.json");
    let raw = window.hwnd()?.0 as platform::RawHwnd;
    platform::make_no_activate(raw);
    app.state::<AppState>().set_popup_hwnd(raw);

    let handle = app.clone();
    platform::watch_escape(move || {
        // Runs inside the keyboard hook: just post the work and return.
        log::info!("[focus] Esc pressed");
        let inner = handle.clone();
        let _ = handle.run_on_main_thread(move || hide(&inner, true));
    });
    Ok(())
}

/// Like APT: the popup sits in the half of the game window opposite to the cursor
/// (item in the inventory on the right → popup on the left).
pub fn geometry(game: Rect, cursor: Point, scale: f64) -> Rect {
    let px = |logical: f64| (logical * scale).round() as i32;
    let margin = px(POPUP_MARGIN_LOGICAL);
    let width = px(POPUP_WIDTH_LOGICAL).min(game.width - 2 * margin).max(0);
    let height = px(POPUP_HEIGHT_LOGICAL)
        .min(game.height - 2 * margin)
        .max(0);

    let cursor_on_right = cursor.x > game.x + game.width / 2;
    let x = if cursor_on_right {
        game.x + margin
    } else {
        game.x + game.width - margin - width
    };
    let top = (game.height as f64 * POPUP_TOP_RATIO).round() as i32;
    let y = game.y + top.min(game.height - margin - height).max(margin);
    Rect {
        x,
        y,
        width,
        height,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const GAME: Rect = Rect {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
    };

    #[test]
    fn opposite_side_of_cursor() {
        let left = geometry(GAME, Point { x: 1700, y: 300 }, 1.0);
        assert_eq!(
            (left.x, left.y, left.width, left.height),
            (24, 108, 820, 590)
        );
        let right = geometry(GAME, Point { x: 200, y: 300 }, 1.0);
        assert_eq!(right.x, 1920 - 24 - 820);
    }

    #[test]
    fn scales_with_dpi_and_fits_small_games() {
        let scaled = geometry(GAME, Point { x: 1700, y: 0 }, 1.25);
        assert_eq!((scaled.width, scaled.height), (1025, 738));
        let small = Rect {
            x: 100,
            y: 50,
            width: 800,
            height: 600,
        };
        let fitted = geometry(small, Point { x: 700, y: 0 }, 1.0);
        assert_eq!(
            (fitted.x, fitted.y, fitted.width, fitted.height),
            (124, 74, 752, 552)
        );
    }
}

pub fn show(app: &AppHandle, game: Rect, cursor: Point) {
    let Some(window) = app.get_webview_window(LABEL) else {
        return;
    };
    let scale = window.scale_factor().unwrap_or(1.0);
    let state = app.state::<AppState>();
    platform::show_no_activate(state.popup_hwnd(), geometry(game, cursor, scale));
    state.set_popup_visible(true);
    platform::set_escape_enabled(true);
}

/// `return_focus`: give the keyboard back to the game if the popup had it (Esc, close button).
/// Not when the user switched to another application.
pub fn hide(app: &AppHandle, return_focus: bool) {
    let state = app.state::<AppState>();
    log::info!("[focus] hide popup (return focus: {return_focus})");
    platform::set_escape_enabled(false);
    // Hide first, then hand focus back: focusing the game while the popup still shows a
    // focused text field let the Windows text input host grab the foreground instead.
    platform::hide(state.popup_hwnd());
    state.set_popup_visible(false);
    release_focus(app, return_focus);
}

/// The user clicked an input: let the popup take the keyboard until `release_focus`.
/// Returns false when Windows refused: the caller must not start typing, or the keys
/// would go to the game (where digits are flasks and skills).
pub fn focus_for_input(app: &AppHandle) -> bool {
    let state = app.state::<AppState>();
    if !state.popup_visible() {
        return false;
    }
    if state.popup_focused() {
        return true;
    }
    platform::set_no_activate(state.popup_hwnd(), false);
    state.set_popup_focused(true);
    if platform::focus(state.popup_hwnd()) {
        log::info!("[focus] popup took the keyboard");
        return true;
    }
    log::info!("[focus] Windows refused to focus the popup");
    platform::set_no_activate(state.popup_hwnd(), true);
    state.set_popup_focused(false);
    false
}

pub fn release_focus(app: &AppHandle, return_focus: bool) {
    let state = app.state::<AppState>();
    if !state.popup_focused() {
        return;
    }
    platform::set_no_activate(state.popup_hwnd(), true);
    state.set_popup_focused(false);
    log::info!("[focus] popup released the keyboard (return to game: {return_focus})");
    if return_focus {
        if let Some(game) = state.game_hwnd() {
            if !platform::focus(game) {
                log::info!("[focus] game refocus intercepted, retrying");
                // Something (e.g. "Windows Input Experience") took the foreground in between: retry once.
                std::thread::spawn(move || {
                    std::thread::sleep(FOCUS_RETRY_DELAY);
                    platform::focus(game);
                });
            }
        }
    }
}
