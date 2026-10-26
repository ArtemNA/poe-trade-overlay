import { invoke } from '@tauri-apps/api/core';

/**
 * Whether the popup currently holds the keyboard. Tracked here rather than read from
 * `document.hasFocus()`, which WebView2 keeps reporting as true after the window lost focus.
 */
let popupHasKeyboard = false;

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  width: number;
  height: number;
}

/** Payload of the `item-text` event, emitted to the popup after a price check hotkey. */
export interface ItemTextEvent {
  text: string;
  cursor: Point;
  gameRect: Rect;
  elapsedMs: number;
}

export interface ForegroundEvent {
  title: string;
  isGame: boolean;
}

export interface Status {
  gameTitle: string;
  gameActive: boolean;
}

export const host = {
  getStatus: () => invoke<Status>('get_status'),
  setGameTitle: (title: string) => invoke<void>('set_game_title', { title }),
  hidePopup: () => invoke<void>('hide_popup'),
  /** The popup takes the keyboard (for typing into a field); false if Windows refused. */
  popupFocusInput: async () => (popupHasKeyboard = await invoke<boolean>('popup_focus_input')),
  /** Keyboard back to the game; no-op when the popup does not have it. */
  popupReleaseFocus: async () => {
    if (!popupHasKeyboard) return;
    popupHasKeyboard = false;
    await invoke<void>('popup_release_focus');
  },
  /** The host took the keyboard back (popup hidden, game clicked). */
  popupLostKeyboard: () => (popupHasKeyboard = false),
};
