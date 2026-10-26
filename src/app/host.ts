import { invoke } from '@tauri-apps/api/core';

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
};
