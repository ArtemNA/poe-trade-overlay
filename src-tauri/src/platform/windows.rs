//! All WinAPI calls live here, so other modules stay platform-agnostic.

use std::sync::OnceLock;
use std::sync::atomic::{AtomicBool, Ordering};

use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, POINT, RECT, WPARAM};
use windows::Win32::Graphics::Gdi::ClientToScreen;
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Threading::{AttachThreadInput, GetCurrentThreadId};
use windows::Win32::UI::Accessibility::{HWINEVENTHOOK, SetWinEventHook};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    INPUT, INPUT_0, INPUT_KEYBOARD, KEYBD_EVENT_FLAGS, KEYBDINPUT, KEYEVENTF_KEYUP,
    MAPVK_VK_TO_VSC, MapVirtualKeyW, SendInput, VIRTUAL_KEY, VK_ESCAPE,
};
use windows::Win32::UI::WindowsAndMessaging::{
    BringWindowToTop, CallNextHookEx, DispatchMessageW, EVENT_SYSTEM_FOREGROUND, GWL_EXSTYLE,
    GetClientRect, GetCursorPos, GetForegroundWindow, GetMessageW, GetWindowLongPtrW,
    GetWindowTextW, GetWindowThreadProcessId, HC_ACTION, HWND_TOPMOST, KBDLLHOOKSTRUCT, MSG,
    SW_HIDE, SWP_NOACTIVATE, SWP_SHOWWINDOW, SetForegroundWindow, SetWindowLongPtrW, SetWindowPos,
    SetWindowsHookExW, ShowWindow, TranslateMessage, WH_KEYBOARD_LL, WINEVENT_OUTOFCONTEXT,
    WM_KEYDOWN, WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW,
};

fn run_message_loop() {
    let mut msg = MSG::default();
    unsafe {
        while GetMessageW(&mut msg, None, 0, 0).as_bool() {
            let _ = TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
    }
}

/// Raw window handle that can be sent between threads.
pub type RawHwnd = isize;

#[derive(Debug, Clone, Copy, serde::Serialize)]
pub struct Rect {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

#[derive(Debug, Clone, Copy, serde::Serialize)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

pub struct ForegroundInfo {
    pub hwnd: RawHwnd,
    pub title: String,
    pub is_own_process: bool,
}

fn hwnd(raw: RawHwnd) -> HWND {
    HWND(raw as *mut _)
}

pub fn window_title(raw: RawHwnd) -> String {
    let mut buf = [0u16; 512];
    let len = unsafe { GetWindowTextW(hwnd(raw), &mut buf) };
    String::from_utf16_lossy(&buf[..len.max(0) as usize])
}

fn foreground_info(raw: RawHwnd) -> ForegroundInfo {
    let mut pid = 0u32;
    unsafe { GetWindowThreadProcessId(hwnd(raw), Some(&mut pid)) };
    ForegroundInfo {
        hwnd: raw,
        title: window_title(raw),
        is_own_process: pid == std::process::id(),
    }
}

pub fn current_foreground() -> ForegroundInfo {
    foreground_info(unsafe { GetForegroundWindow() }.0 as RawHwnd)
}

static FOREGROUND_CB: OnceLock<Box<dyn Fn(ForegroundInfo) + Send + Sync>> = OnceLock::new();

unsafe extern "system" fn on_win_event(
    _hook: HWINEVENTHOOK,
    _event: u32,
    hwnd: HWND,
    _id_object: i32,
    _id_child: i32,
    _thread: u32,
    _time: u32,
) {
    if let Some(cb) = FOREGROUND_CB.get() {
        cb(foreground_info(hwnd.0 as RawHwnd));
    }
}

/// Calls `cb` every time the foreground window changes.
/// The hook needs a message loop, so it runs on its own thread.
pub fn watch_foreground(cb: impl Fn(ForegroundInfo) + Send + Sync + 'static) {
    if FOREGROUND_CB.set(Box::new(cb)).is_err() {
        return;
    }
    std::thread::spawn(|| {
        let _hook = unsafe {
            SetWinEventHook(
                EVENT_SYSTEM_FOREGROUND,
                EVENT_SYSTEM_FOREGROUND,
                None,
                Some(on_win_event),
                0,
                0,
                WINEVENT_OUTOFCONTEXT,
            )
        };
        run_message_loop();
    });
}

static ESCAPE_CB: OnceLock<Box<dyn Fn() + Send + Sync>> = OnceLock::new();
static ESCAPE_ENABLED: AtomicBool = AtomicBool::new(false);

unsafe extern "system" fn on_keyboard(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code == HC_ACTION as i32 && ESCAPE_ENABLED.load(Ordering::SeqCst) {
        let kb = unsafe { &*(lparam.0 as *const KBDLLHOOKSTRUCT) };
        if kb.vkCode == VK_ESCAPE.0 as u32 && wparam.0 as u32 == WM_KEYDOWN {
            if let Some(cb) = ESCAPE_CB.get() {
                cb();
            }
            // Swallow: Esc closes the popup, not game panels.
            return LRESULT(1);
        }
    }
    unsafe { CallNextHookEx(None, code, wparam, lparam) }
}

/// Esc via a low-level keyboard hook rather than RegisterHotKey: such a common key
/// is often already taken by other software. `cb` must return quickly.
pub fn watch_escape(cb: impl Fn() + Send + Sync + 'static) {
    if ESCAPE_CB.set(Box::new(cb)).is_err() {
        return;
    }
    std::thread::spawn(|| {
        let _hook = unsafe {
            let module = GetModuleHandleW(None).ok();
            SetWindowsHookExW(WH_KEYBOARD_LL, Some(on_keyboard), module.map(Into::into), 0)
        };
        run_message_loop();
    });
}

pub fn set_escape_enabled(enabled: bool) {
    ESCAPE_ENABLED.store(enabled, Ordering::SeqCst);
}

/// Client area of a window in screen coordinates (physical pixels).
pub fn client_rect(raw: RawHwnd) -> Option<Rect> {
    let mut rc = RECT::default();
    let mut origin = POINT::default();
    unsafe {
        GetClientRect(hwnd(raw), &mut rc).ok()?;
        if !ClientToScreen(hwnd(raw), &mut origin).as_bool() {
            return None;
        }
    }
    Some(Rect {
        x: origin.x,
        y: origin.y,
        width: rc.right - rc.left,
        height: rc.bottom - rc.top,
    })
}

pub fn cursor_pos() -> Point {
    let mut p = POINT::default();
    let _ = unsafe { GetCursorPos(&mut p) };
    Point { x: p.x, y: p.y }
}

pub mod vk {
    pub const CONTROL: u16 = 0x11;
    pub const RETURN: u16 = 0x0D;
    pub const C: u16 = 0x43;
    pub const F: u16 = 0x46;
    pub const V: u16 = 0x56;
}

#[derive(Clone, Copy)]
pub enum KeyAction {
    Down(u16),
    Up(u16),
}

pub fn send_keys(actions: &[KeyAction]) {
    let inputs: Vec<INPUT> = actions
        .iter()
        .map(|action| {
            let (vk, flags) = match *action {
                KeyAction::Down(vk) => (vk, KEYBD_EVENT_FLAGS(0)),
                KeyAction::Up(vk) => (vk, KEYEVENTF_KEYUP),
            };
            // Some games read scan codes rather than virtual keys, so send both.
            let scan = unsafe { MapVirtualKeyW(vk as u32, MAPVK_VK_TO_VSC) } as u16;
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VIRTUAL_KEY(vk),
                        wScan: scan,
                        dwFlags: flags,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            }
        })
        .collect();
    unsafe { SendInput(&inputs, std::mem::size_of::<INPUT>() as i32) };
}

/// Popup must never take focus away from the game: clicks still work,
/// but the window does not become foreground.
pub fn make_no_activate(raw: RawHwnd) {
    unsafe {
        let ex = GetWindowLongPtrW(hwnd(raw), GWL_EXSTYLE);
        SetWindowLongPtrW(
            hwnd(raw),
            GWL_EXSTYLE,
            ex | (WS_EX_NOACTIVATE.0 | WS_EX_TOOLWINDOW.0) as isize,
        );
    }
}

/// The popup takes keyboard focus only while the user types into it, then goes back to no-activate.
pub fn set_no_activate(raw: RawHwnd, enabled: bool) {
    unsafe {
        let ex = GetWindowLongPtrW(hwnd(raw), GWL_EXSTYLE);
        let flag = WS_EX_NOACTIVATE.0 as isize;
        SetWindowLongPtrW(
            hwnd(raw),
            GWL_EXSTYLE,
            if enabled { ex | flag } else { ex & !flag },
        );
    }
}

/// Makes `raw` the foreground window and reports whether it actually is now.
/// Windows refuses SetForegroundWindow to a background process (a click on a WS_EX_NOACTIVATE
/// window does not count), so our thread briefly shares input with the current foreground
/// window's thread, which lifts that restriction.
pub fn focus(raw: RawHwnd) -> bool {
    unsafe {
        let target = hwnd(raw);
        let foreground = GetForegroundWindow();
        if foreground == target {
            return true;
        }
        let ours = GetCurrentThreadId();
        let theirs = GetWindowThreadProcessId(foreground, None);
        let attached =
            theirs != 0 && theirs != ours && AttachThreadInput(ours, theirs, true).as_bool();
        let _ = SetForegroundWindow(target);
        let _ = BringWindowToTop(target);
        if attached {
            let _ = AttachThreadInput(ours, theirs, false);
        }
        GetForegroundWindow() == target
    }
}

pub fn show_no_activate(raw: RawHwnd, rect: Rect) {
    unsafe {
        let _ = SetWindowPos(
            hwnd(raw),
            Some(HWND_TOPMOST),
            rect.x,
            rect.y,
            rect.width,
            rect.height,
            SWP_NOACTIVATE | SWP_SHOWWINDOW,
        );
    }
}

pub fn hide(raw: RawHwnd) {
    unsafe {
        let _ = ShowWindow(hwnd(raw), SW_HIDE);
    }
}
