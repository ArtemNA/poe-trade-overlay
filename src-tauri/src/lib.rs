mod clipboard;
mod constants;
mod hotkeys;
mod platform;
mod popup;
mod stash;
mod state;

use std::collections::HashMap;

use tauri::{AppHandle, Emitter, Manager, WindowEvent};

use constants::{DEV_IDENTIFIER_SUFFIX, MAIN_WINDOW};
use platform::ForegroundInfo;
use state::AppState;

pub(crate) fn log_to_ui(app: &AppHandle, message: String) {
    log::info!("{message}");
    let _ = app.emit_to(MAIN_WINDOW, "log", message);
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ForegroundPayload {
    title: String,
    is_game: bool,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct Status {
    game_title: String,
    game_active: bool,
}

fn on_foreground(app: &AppHandle, info: ForegroundInfo) {
    let state = app.state::<AppState>();
    if info.is_own_process && info.hwnd == state.popup_hwnd() {
        // Expected only while the user types into the popup; otherwise it is WS_EX_NOACTIVATE.
        if !state.popup_focused() {
            log_to_ui(app, "WARNING: popup became the foreground window".into());
        }
        // Keep the game state as is.
        return;
    }

    let is_game = !info.is_own_process && state.is_game_window(&info.title);
    let was_game = state.game_hwnd().is_some();
    state.set_game_hwnd(is_game.then_some(info.hwnd));
    if is_game {
        // Clicked back into the game while typing in the popup: popup stops taking focus.
        popup::release_focus(app, false);
    }

    let _ = app.emit_to(
        MAIN_WINDOW,
        "foreground",
        ForegroundPayload {
            title: info.title,
            is_game,
        },
    );
    if is_game != was_game {
        hotkeys::set_game_hotkeys(app, is_game);
    }
    if !is_game && state.popup_visible() && !state.keep_popup_on_blur {
        popup::hide(app, false);
    }
}

#[tauri::command]
fn get_status(state: tauri::State<AppState>) -> Status {
    Status {
        game_title: state.game_title(),
        game_active: state.game_hwnd().is_some(),
    }
}

/// Settings the host needs (APT `update-host-config`): the game window title and the hotkeys.
/// Returns a message for every hotkey that cannot be used.
#[tauri::command]
fn set_host_config(
    app: AppHandle,
    game_title: String,
    hotkeys: HashMap<hotkeys::HotkeyAction, Option<String>>,
) -> Vec<String> {
    app.state::<AppState>()
        .set_game_title(game_title.trim().to_string());
    let errors = hotkeys::set_hotkeys(&app, &hotkeys);
    // The title may now match (or no longer match) the window in front.
    on_foreground(&app, platform::current_foreground());
    errors
}

#[tauri::command]
fn hide_popup(app: AppHandle) {
    popup::hide(&app, true);
}

/// The user clicked an input in the popup: it takes the keyboard.
#[tauri::command]
fn popup_focus_input(app: AppHandle) -> bool {
    let focused = popup::focus_for_input(&app);
    if !focused {
        log_to_ui(&app, "Could not give the popup keyboard focus".into());
    }
    focused
}

/// Typing is done: keyboard back to the game, popup back to no-activate.
#[tauri::command]
fn popup_release_focus(app: AppHandle) {
    popup::release_focus(&app, true);
}

/// The popup page asks for a size that fits its content, in logical pixels.
#[tauri::command]
fn fit_popup(app: AppHandle, width: f64, height: f64) {
    popup::fit(&app, width, height);
}

/// "Find in stash": hide the popup and type `text` into the game's stash search.
#[tauri::command]
fn stash_search(app: AppHandle, text: String) -> Result<(), String> {
    let Some(game) = app.state::<AppState>().game_hwnd() else {
        return Err("The game is not active".into());
    };
    popup::hide(&app, true);
    // Waits for the keyboard and the clipboard: keep it off the event loop.
    std::thread::spawn(move || {
        if let Err(e) = stash::search(game, &text) {
            log_to_ui(&app, format!("Stash search failed: {e}"));
        }
    });
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(AppState::default())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(hotkeys::plugin())
        .invoke_handler(tauri::generate_handler![
            get_status,
            set_host_config,
            hide_popup,
            popup_focus_input,
            popup_release_focus,
            stash_search,
            fit_popup
        ])
        .setup(|app| {
            let identifier = &app.config().identifier;
            if cfg!(debug_assertions) && !identifier.ends_with(DEV_IDENTIFIER_SUFFIX) {
                return Err(format!(
                    "debug build with the release identifier {identifier}: start it with `npm run dev`,                      so it does not use the settings of an installed release"
                )
                .into());
            }
            let handle = app.handle().clone();
            popup::init(&handle)?;

            let watcher_handle = handle.clone();
            platform::watch_foreground(move |info| on_foreground(&watcher_handle, info));
            on_foreground(&handle, platform::current_foreground());
            Ok(())
        })
        .on_window_event(|window, event| {
            // The hidden popup would otherwise keep the process alive.
            if window.label() == MAIN_WINDOW && matches!(event, WindowEvent::CloseRequested { .. })
            {
                window.app_handle().exit(0);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
