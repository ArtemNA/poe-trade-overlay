import type { Theme } from '../../src/app/themes';
import { APT_THEME } from './theme';

// Replaces src/app/addons.ts in the "apt-default" configuration: the APT theme is also the default.
export const ADDON_THEMES: readonly Theme[] = [APT_THEME];
export const DEFAULT_THEME_ID: string | null = APT_THEME.id;
