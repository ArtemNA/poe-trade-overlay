//! Moves the Start menu and desktop shortcuts of the old "PoE Trade Overlay" install to this exe
//! (FINDINGS F-56). The rename to Price of Exile made the installer use a new folder, so the
//! updater started the new app but the shortcuts kept starting the old one.

use std::path::{Path, PathBuf};

use windows::Win32::Storage::FileSystem::WIN32_FIND_DATAW;
use windows::Win32::System::Com::{
    CLSCTX_INPROC_SERVER, COINIT_APARTMENTTHREADED, CoCreateInstance, CoInitializeEx,
    CoTaskMemFree, IPersistFile, STGM_READ,
};
use windows::Win32::UI::Shell::{
    FOLDERID_Desktop, FOLDERID_Programs, IShellLinkW, KNOWN_FOLDER_FLAG, SHGetKnownFolderPath,
    ShellLink,
};
use windows::core::{HSTRING, Interface, PWSTR};

use crate::constants::{OLD_EXE_FILE, OLD_SHORTCUT_FILE, SHORTCUT_FILE};

/// The user's Start menu programs folder and desktop.
fn shortcut_dirs() -> Vec<PathBuf> {
    [FOLDERID_Programs, FOLDERID_Desktop]
        .iter()
        .filter_map(|id| unsafe {
            let path: PWSTR = SHGetKnownFolderPath(id, KNOWN_FOLDER_FLAG(0), None).ok()?;
            let dir = path.to_string().ok();
            CoTaskMemFree(Some(path.0 as _));
            dir.map(PathBuf::from)
        })
        .collect()
}

/// Moves the old shortcuts in the user's folders to `exe`; returns the ones it replaced.
pub fn migrate(exe: &Path) -> Vec<PathBuf> {
    migrate_in(&shortcut_dirs(), exe)
}

/// In each of `dirs`: an old shortcut that starts the old exe becomes a shortcut to `exe` under
/// the new name (unless one is there already) and is removed.
pub fn migrate_in(dirs: &[PathBuf], exe: &Path) -> Vec<PathBuf> {
    // A COM apartment for this thread; already initialised is fine too.
    let _ = unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) };
    let mut moved = Vec::new();
    for dir in dirs {
        let old = dir.join(OLD_SHORTCUT_FILE);
        if !old.exists() {
            continue;
        }
        match migrate_one(&old, &dir.join(SHORTCUT_FILE), exe) {
            Ok(true) => moved.push(old),
            Ok(false) => {}
            Err(e) => log::warn!("Shortcut {} not moved: {e}", old.display()),
        }
    }
    moved
}

fn migrate_one(old: &Path, new: &Path, exe: &Path) -> windows::core::Result<bool> {
    unsafe {
        let link: IShellLinkW = CoCreateInstance(&ShellLink, None, CLSCTX_INPROC_SERVER)?;
        let file: IPersistFile = link.cast()?;
        file.Load(&HSTRING::from(old.as_os_str()), STGM_READ)?;
        let mut target = [0u16; 1024];
        let mut data = WIN32_FIND_DATAW::default();
        link.GetPath(&mut target, &mut data, 0)?;
        let target = String::from_utf16_lossy(&target);
        let target = target.trim_end_matches('\0');
        // Someone else's shortcut with the same name: leave it.
        if !target
            .to_lowercase()
            .ends_with(&OLD_EXE_FILE.to_lowercase())
        {
            return Ok(false);
        }
        if !new.exists() {
            let exe_path = HSTRING::from(exe.as_os_str());
            link.SetPath(&exe_path)?;
            if let Some(dir) = exe.parent() {
                link.SetWorkingDirectory(&HSTRING::from(dir.as_os_str()))?;
            }
            link.SetIconLocation(&exe_path, 0)?;
            file.Save(&HSTRING::from(new.as_os_str()), true)?;
        }
    }
    std::fs::remove_file(old)
        .map_err(|e| windows::core::Error::new(windows::core::HRESULT(-1), e.to_string()))?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_link(path: &Path, target: &str) {
        unsafe {
            let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
            let link: IShellLinkW =
                CoCreateInstance(&ShellLink, None, CLSCTX_INPROC_SERVER).unwrap();
            link.SetPath(&HSTRING::from(target)).unwrap();
            let file: IPersistFile = link.cast().unwrap();
            file.Save(&HSTRING::from(path.as_os_str()), true).unwrap();
        }
    }

    fn link_target(path: &Path) -> String {
        unsafe {
            let link: IShellLinkW =
                CoCreateInstance(&ShellLink, None, CLSCTX_INPROC_SERVER).unwrap();
            let file: IPersistFile = link.cast().unwrap();
            file.Load(&HSTRING::from(path.as_os_str()), STGM_READ)
                .unwrap();
            let mut target = [0u16; 1024];
            let mut data = WIN32_FIND_DATAW::default();
            link.GetPath(&mut target, &mut data, 0).unwrap();
            String::from_utf16_lossy(&target)
                .trim_end_matches('\0')
                .to_string()
        }
    }

    #[test]
    fn moves_the_old_shortcut_and_leaves_others() {
        let root = std::env::temp_dir().join(format!("poe-shortcuts-{}", std::process::id()));
        let (ours, theirs) = (root.join("ours"), root.join("theirs"));
        std::fs::create_dir_all(&ours).unwrap();
        std::fs::create_dir_all(&theirs).unwrap();
        make_link(
            &ours.join(OLD_SHORTCUT_FILE),
            r"C:\Users\x\AppData\Local\PoE Trade Overlay\poe-trade-overlay.exe",
        );
        make_link(
            &theirs.join(OLD_SHORTCUT_FILE),
            r"C:\Tools\something-else.exe",
        );
        let exe = PathBuf::from(r"C:\Users\x\AppData\Local\Price of Exile\price-of-exile.exe");

        let moved = migrate_in(&[ours.clone(), theirs.clone(), root.join("missing")], &exe);

        assert_eq!(moved, vec![ours.join(OLD_SHORTCUT_FILE)]);
        assert!(!ours.join(OLD_SHORTCUT_FILE).exists());
        assert_eq!(
            link_target(&ours.join(SHORTCUT_FILE)),
            exe.to_string_lossy()
        );
        assert!(theirs.join(OLD_SHORTCUT_FILE).exists());
        assert!(!theirs.join(SHORTCUT_FILE).exists());
        let _ = std::fs::remove_dir_all(&root);
    }
}
