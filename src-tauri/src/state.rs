use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, AtomicIsize, Ordering};

use crate::platform::RawHwnd;

pub const DEFAULT_GAME_TITLE: &str = "Path of Exile";

pub struct AppState {
  game_title: Mutex<String>,
  /// Foreground game window, 0 when the game is not active.
  game_hwnd: AtomicIsize,
  popup_hwnd: AtomicIsize,
  popup_visible: AtomicBool,
  /// Guards against a second price check while the clipboard is still being polled.
  busy: AtomicBool,
  /// POE_KEEP_POPUP=1: don't hide the popup when the game loses focus (for screenshots while developing).
  pub keep_popup_on_blur: bool,
}

impl Default for AppState {
  fn default() -> Self {
    // POE_GAME_TITLE lets any window stand in for the game while developing (e.g. Notepad).
    let game_title = std::env::var("POE_GAME_TITLE").unwrap_or_else(|_| DEFAULT_GAME_TITLE.into());
    Self {
      game_title: Mutex::new(game_title),
      game_hwnd: AtomicIsize::new(0),
      popup_hwnd: AtomicIsize::new(0),
      popup_visible: AtomicBool::new(false),
      busy: AtomicBool::new(false),
      keep_popup_on_blur: std::env::var("POE_KEEP_POPUP").is_ok_and(|v| v == "1"),
    }
  }
}

impl AppState {
  pub fn game_title(&self) -> String {
    self.game_title.lock().unwrap().clone()
  }
  pub fn set_game_title(&self, title: String) {
    *self.game_title.lock().unwrap() = title;
  }
  pub fn is_game_window(&self, title: &str) -> bool {
    *self.game_title.lock().unwrap() == title
  }

  pub fn game_hwnd(&self) -> Option<RawHwnd> {
    Some(self.game_hwnd.load(Ordering::SeqCst)).filter(|h| *h != 0)
  }
  pub fn set_game_hwnd(&self, hwnd: Option<RawHwnd>) {
    self.game_hwnd.store(hwnd.unwrap_or(0), Ordering::SeqCst);
  }

  pub fn popup_hwnd(&self) -> RawHwnd {
    self.popup_hwnd.load(Ordering::SeqCst)
  }
  pub fn set_popup_hwnd(&self, hwnd: RawHwnd) {
    self.popup_hwnd.store(hwnd, Ordering::SeqCst);
  }

  pub fn popup_visible(&self) -> bool {
    self.popup_visible.load(Ordering::SeqCst)
  }
  pub fn set_popup_visible(&self, visible: bool) {
    self.popup_visible.store(visible, Ordering::SeqCst);
  }

  /// Returns false if a check is already running.
  pub fn try_begin_check(&self) -> bool {
    !self.busy.swap(true, Ordering::SeqCst)
  }
  pub fn end_check(&self) {
    self.busy.store(false, Ordering::SeqCst);
  }
}
