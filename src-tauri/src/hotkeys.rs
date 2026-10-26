//! Global hotkeys. Like APT, they are registered only while the game is the foreground
//! window, so RegisterHotKey never steals keys from other applications.

use std::time::Instant;

use tauri::plugin::TauriPlugin;
use tauri::{AppHandle, Emitter, Manager, Wry};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::constants::{POPUP_WINDOW, PRICE_CHECK_KEY, PRICE_CHECK_MODIFIERS, PRICE_CHECK_VKS};
use crate::platform::{self, KeyAction, Point, Rect, vk};
use crate::state::AppState;
use crate::{clipboard, log_to_ui, popup};

fn price_check_shortcut() -> Shortcut {
    Shortcut::new(Some(PRICE_CHECK_MODIFIERS), PRICE_CHECK_KEY)
}

/// Release the keys of the hotkey first (otherwise the game sees e.g. Ctrl+D+C),
/// then press Ctrl+C. Mirrors APT `Shortcuts.register` + `pressKeysToCopyItemText`.
fn copy_sequence() -> Vec<KeyAction> {
    PRICE_CHECK_VKS
        .iter()
        .map(|&key| KeyAction::Up(key))
        .chain([
            KeyAction::Down(vk::CONTROL),
            KeyAction::Down(vk::C),
            KeyAction::Up(vk::C),
            KeyAction::Up(vk::CONTROL),
        ])
        .collect()
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ItemTextPayload {
    text: String,
    cursor: Point,
    game_rect: Rect,
    elapsed_ms: u128,
}

pub fn plugin() -> TauriPlugin<Wry> {
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, shortcut, event| {
            if event.state() != ShortcutState::Pressed {
                return;
            }
            if *shortcut == price_check_shortcut() {
                let app = app.clone();
                // Clipboard polling sleeps, keep it off the event loop.
                std::thread::spawn(move || price_check(&app));
            }
        })
        .build()
}

/// RegisterHotKey binds to a window owned by the main thread, so (un)register there.
fn set_registered(app: &AppHandle, shortcut: Shortcut, enabled: bool) {
    let handle = app.clone();
    let _ = app.run_on_main_thread(move || {
        let gs = handle.global_shortcut();
        if enabled {
            if !gs.is_registered(shortcut) {
                if let Err(e) = gs.register(shortcut) {
                    log_to_ui(
                        &handle,
                        format!("Failed to register hotkey {shortcut}: {e}"),
                    );
                }
            }
        } else if gs.is_registered(shortcut) {
            let _ = gs.unregister(shortcut);
        }
    });
}

pub fn set_game_hotkeys(app: &AppHandle, enabled: bool) {
    set_registered(app, price_check_shortcut(), enabled);
}

fn price_check(app: &AppHandle) {
    let state = app.state::<AppState>();
    let Some(game) = state.game_hwnd() else {
        return;
    };
    if !state.try_begin_check() {
        return;
    }

    let cursor = platform::cursor_pos();
    let started = Instant::now();
    let result = clipboard::read_item_text(|| platform::send_keys(&copy_sequence()));
    let elapsed_ms = started.elapsed().as_millis();
    state.end_check();

    let text = match result {
        Ok(text) => text,
        Err(e) => {
            log_to_ui(app, format!("{e} (after {elapsed_ms} ms)"));
            return;
        }
    };
    let Some(game_rect) = platform::client_rect(game) else {
        log_to_ui(app, "Game window is gone".into());
        return;
    };

    log_to_ui(app, format!("Item text read in {elapsed_ms} ms"));
    let payload = ItemTextPayload {
        text,
        cursor,
        game_rect,
        elapsed_ms,
    };
    let _ = app.emit_to(POPUP_WINDOW, "item-text", payload);
    popup::show(app, game_rect, cursor);
}
