import type { Theme } from './themes';

// Addons built into the app. Empty in the normal build; an addon's Angular configuration replaces
// this file with its own list (fileReplacements in angular.json, see addons/README.md).
export const ADDON_THEMES: readonly Theme[] = [];
/** An addon theme to start with instead of ours (its "-default" configuration sets it). */
export const DEFAULT_THEME_ID: string | null = null;
