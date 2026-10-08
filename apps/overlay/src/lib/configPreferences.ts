import { buildOverlayUrl, DEFAULT_OVERLAY_CONFIG, parseOverlayConfig, type OverlayConfig } from './overlayConfig';

const PREFERENCES_STORAGE_KEY: string = 'ynp-last-overlay-url';

export function loadConfigPreferences(): OverlayConfig {
  try {
    const storedOverlayUrl: string | null = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!storedOverlayUrl) return DEFAULT_OVERLAY_CONFIG;
    return parseOverlayConfig(new URL(storedOverlayUrl));
  } catch {
    return DEFAULT_OVERLAY_CONFIG;
  }
}

export function saveConfigPreferences(config: OverlayConfig): void {
  const overlayUrlWithoutPassword: string = buildOverlayUrl(window.location.origin, { ...config, obsPassword: '' });
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, overlayUrlWithoutPassword);
  } catch {
    return;
  }
}
