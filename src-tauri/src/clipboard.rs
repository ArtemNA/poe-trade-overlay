//! Reading item text after the game handles Ctrl+C. Port of APT `HostClipboard.readItemText`.

use std::time::Duration;

use arboard::Clipboard;

const POLL_DELAY: Duration = Duration::from_millis(48);
const POLL_LIMIT: Duration = Duration::from_millis(500);

/// First line of copied item text, per game language. Only EN for now.
const ITEM_FIRST_LINES: &[&str] = &["Item Class: "];

pub fn is_poe_item(text: &str) -> bool {
  ITEM_FIRST_LINES.iter().any(|line| text.starts_with(line))
}

/// Clears an old item from the clipboard (so the same item copied twice is still detected),
/// runs `copy`, then polls until new item text appears.
pub fn read_item_text(copy: impl FnOnce()) -> Result<String, String> {
  let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
  if clipboard.get_text().is_ok_and(|text| is_poe_item(&text)) {
    let _ = clipboard.clear();
  }

  copy();

  let mut elapsed = Duration::ZERO;
  while elapsed < POLL_LIMIT {
    std::thread::sleep(POLL_DELAY);
    elapsed += POLL_DELAY;
    if let Ok(text) = clipboard.get_text() {
      if is_poe_item(&text) {
        return Ok(text);
      }
    }
  }
  Err("No item text found in clipboard".into())
}
