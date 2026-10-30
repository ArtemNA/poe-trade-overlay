import { APT_THEME } from '../../addons/apt-theme/theme';
import type { Theme } from './themes';

// Themes besides ours that the app ships with; each lives in addons/<name> (see THEMING.md).
// The "apt-default" configuration replaces this file to start with the APT theme instead of ours.
export const ADDON_THEMES: readonly Theme[] = [APT_THEME];
/** An addon theme to start with instead of ours. */
export const DEFAULT_THEME_ID: string | null = null;
