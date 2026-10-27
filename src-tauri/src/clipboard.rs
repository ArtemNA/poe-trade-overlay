//! Reading item text after the game handles Ctrl+C. Port of APT `HostClipboard.readItemText`.

use std::time::Duration;

use arboard::Clipboard;

use crate::constants::{
    CLIPBOARD_POLL_DELAY as POLL_DELAY, CLIPBOARD_POLL_LIMIT as POLL_LIMIT,
    CLIPBOARD_RESTORE_AFTER, ITEM_FIRST_LINES,
};

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

/// Puts `text` on the clipboard for `paste` (keys that make the game paste it), then puts the
/// previous text back. APT `HostClipboard.restoreShortly`, which restores only when the user
/// turned "restore clipboard" on; here the user's clipboard is always given back (F-37).
pub fn paste_text(text: &str, paste: impl FnOnce()) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    let saved = clipboard.get_text().ok();
    clipboard.set_text(text).map_err(|e| e.to_string())?;
    paste();
    std::thread::sleep(CLIPBOARD_RESTORE_AFTER);
    match saved {
        Some(saved) => clipboard.set_text(saved).map_err(|e| e.to_string()),
        None => clipboard.clear().map_err(|e| e.to_string()),
    }
}
