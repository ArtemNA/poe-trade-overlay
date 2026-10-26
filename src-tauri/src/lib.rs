mod clipboard;
mod hotkeys;
mod platform;
mod popup;
mod state;

use tauri::{AppHandle, Emitter, Manager, WindowEvent};

use platform::ForegroundInfo;
use state::AppState;

pub(crate) fn log_to_ui(app: &AppHandle, message: String) {
  log::info!("{message}");
  let _ = app.emit_to("main", "log", message);
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
    // Must never happen: the popup is WS_EX_NOACTIVATE. Keep the game state as is.
    log_to_ui(app, "WARNING: popup became the foreground window".into());
    return;
  }

  let is_game = !info.is_own_process && state.is_game_window(&info.title);
  let was_game = state.game_hwnd().is_some();
  state.set_game_hwnd(is_game.then_some(info.hwnd));

  let _ = app.emit_to("main", "foreground", ForegroundPayload { title: info.title, is_game });
  if is_game != was_game {
    hotkeys::set_game_hotkeys(app, is_game);
  }
  if !is_game && state.popup_visible() {
    popup::hide(app);
  }
}

#[tauri::command]
fn get_status(state: tauri::State<AppState>) -> Status {
  Status {
    game_title: state.game_title(),
    game_active: state.game_hwnd().is_some(),
  }
}

#[tauri::command]
fn set_game_title(state: tauri::State<AppState>, title: String) {
  state.set_game_title(title.trim().to_string());
}

#[tauri::command]
fn hide_popup(app: AppHandle) {
  popup::hide(&app);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(AppState::default())
    .plugin(
      tauri_plugin_log::Builder::default()
        .level(log::LevelFilter::Info)
        .build(),
    )
    .plugin(hotkeys::plugin())
    .invoke_handler(tauri::generate_handler![get_status, set_game_title, hide_popup])
    .setup(|app| {
      let handle = app.handle().clone();
      popup::init(&handle)?;

      let watcher_handle = handle.clone();
      platform::watch_foreground(move |info| on_foreground(&watcher_handle, info));
      on_foreground(&handle, platform::current_foreground());
      Ok(())
    })
    .on_window_event(|window, event| {
      // The hidden popup would otherwise keep the process alive.
      if window.label() == "main" && matches!(event, WindowEvent::CloseRequested { .. }) {
        window.app_handle().exit(0);
      }
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
