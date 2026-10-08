export interface ObsConnectionSettings {
  obsPort: number;
  obsPassword: string;
}

export const DEFAULT_OBS_CONNECTION_SETTINGS: ObsConnectionSettings = {
  obsPort: 4455,
  obsPassword: '',
};

export async function loadObsConnectionSettings(): Promise<ObsConnectionSettings> {
  const storedSettings: Partial<ObsConnectionSettings> = await chrome.storage.local.get(
    DEFAULT_OBS_CONNECTION_SETTINGS,
  );
  return {
    obsPort: Number(storedSettings.obsPort) || DEFAULT_OBS_CONNECTION_SETTINGS.obsPort,
    obsPassword: String(storedSettings.obsPassword ?? DEFAULT_OBS_CONNECTION_SETTINGS.obsPassword),
  };
}

export async function saveObsConnectionSettings(settings: ObsConnectionSettings): Promise<void> {
  await chrome.storage.local.set(settings);
}
