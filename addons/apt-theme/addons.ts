import type { Theme } from '../../src/app/themes';
import { APT_THEME } from './theme';

// Replaces src/app/addons.ts in the "apt" configuration: the APT theme is offered in the settings.
export const ADDON_THEMES: readonly Theme[] = [APT_THEME];
export const DEFAULT_THEME_ID: string | null = null;
