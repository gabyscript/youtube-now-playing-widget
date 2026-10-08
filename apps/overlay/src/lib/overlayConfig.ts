export const OVERLAY_FIELDS = ['channel', 'avatar', 'year', 'views', 'thumbnail', 'progress'] as const;

export type OverlayField = (typeof OVERLAY_FIELDS)[number];
export type OverlayTheme = 'apple' | 'gamer';
export type ColorMode = 'light' | 'dark';
export type CardLayout = 'horizontal' | 'vertical';

export interface OverlayConfig {
  theme: OverlayTheme;
  colorMode: ColorMode;
  cardLayout: CardLayout;
  visibleFields: OverlayField[];
  obsPort: number;
  obsPassword: string;
  isDebugEnabled: boolean;
}

interface OverlayUrlParamNames {
  theme: string;
  colorMode: string;
  cardLayout: string;
  visibleFields: string;
  obsPort: string;
  obsPassword: string;
  isDebugEnabled: string;
}

const URL_PARAM_NAMES: OverlayUrlParamNames = {
  theme: 'theme',
  colorMode: 'mode',
  cardLayout: 'layout',
  visibleFields: 'fields',
  obsPort: 'port',
  obsPassword: 'pw',
  isDebugEnabled: 'debug',
};

const FIELD_SEPARATOR: string = ',';

export const OVERLAY_ROUTE_PATH: string = '/overlay';

export const DEFAULT_OBS_PORT: number = 4455;

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'apple',
  colorMode: 'dark',
  cardLayout: 'horizontal',
  visibleFields: [...OVERLAY_FIELDS],
  obsPort: DEFAULT_OBS_PORT,
  obsPassword: '',
  isDebugEnabled: false,
};

export interface OverlayUrlParts {
  search: string;
  hash: string;
}

export const OVERLAY_THEMES: readonly OverlayTheme[] = ['apple', 'gamer'];

export const COLOR_MODES: readonly ColorMode[] = ['dark', 'light'];

export const OVERLAY_THEME_LABELS: Record<OverlayTheme, string> = {
  apple: 'Apple',
  gamer: 'Gamer',
};

export const COLOR_MODE_LABELS: Record<ColorMode, string> = {
  dark: 'Oscuro',
  light: 'Claro',
};

export interface BrowserSourceSize {
  width: number;
  height: number;
}

export const CARD_LAYOUTS: readonly CardLayout[] = ['horizontal', 'vertical'];

export const CARD_LAYOUT_LABELS: Record<CardLayout, string> = {
  horizontal: 'Horizontal',
  vertical: 'Vertical',
};

export const RECOMMENDED_SOURCE_SIZES: Record<CardLayout, BrowserSourceSize> = {
  horizontal: { width: 600, height: 180 },
  vertical: { width: 344, height: 400 },
};

export const OVERLAY_FIELD_LABELS: Record<OverlayField, string> = {
  channel: 'Autor (canal)',
  avatar: 'Avatar del canal',
  year: 'Año de publicación',
  views: 'Visitas',
  thumbnail: 'Miniatura',
  progress: 'Duración / progreso',
};

function isOverlayField(value: string): value is OverlayField {
  return (OVERLAY_FIELDS as readonly string[]).includes(value);
}

function parseVisibleFields(rawFields: string | null): OverlayField[] {
  if (rawFields === null) return DEFAULT_OVERLAY_CONFIG.visibleFields;
  return rawFields.split(FIELD_SEPARATOR).filter(isOverlayField);
}

export function parseOverlayConfig(overlayUrl: OverlayUrlParts): OverlayConfig {
  const queryParams: URLSearchParams = new URLSearchParams(overlayUrl.search);
  const hashParams: URLSearchParams = new URLSearchParams(overlayUrl.hash.slice(1));
  const parsedPort: number = Number(queryParams.get(URL_PARAM_NAMES.obsPort));

  return {
    theme: queryParams.get(URL_PARAM_NAMES.theme) === 'gamer' ? 'gamer' : 'apple',
    colorMode: queryParams.get(URL_PARAM_NAMES.colorMode) === 'light' ? 'light' : 'dark',
    cardLayout: queryParams.get(URL_PARAM_NAMES.cardLayout) === 'vertical' ? 'vertical' : 'horizontal',
    visibleFields: parseVisibleFields(queryParams.get(URL_PARAM_NAMES.visibleFields)),
    obsPort: Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_OBS_PORT,
    obsPassword: hashParams.get(URL_PARAM_NAMES.obsPassword) ?? '',
    isDebugEnabled: queryParams.get(URL_PARAM_NAMES.isDebugEnabled) === '1',
  };
}

export function buildOverlayUrl(origin: string, config: OverlayConfig): string {
  const queryParams: URLSearchParams = new URLSearchParams({
    [URL_PARAM_NAMES.theme]: config.theme,
    [URL_PARAM_NAMES.colorMode]: config.colorMode,
    [URL_PARAM_NAMES.cardLayout]: config.cardLayout,
    [URL_PARAM_NAMES.visibleFields]: config.visibleFields.join(FIELD_SEPARATOR),
    [URL_PARAM_NAMES.obsPort]: String(config.obsPort),
  });
  if (config.isDebugEnabled) queryParams.set(URL_PARAM_NAMES.isDebugEnabled, '1');

  const hashParams: URLSearchParams = new URLSearchParams({ [URL_PARAM_NAMES.obsPassword]: config.obsPassword });
  const hashFragment: string = config.obsPassword ? `#${hashParams}` : '';

  return `${origin}${OVERLAY_ROUTE_PATH}?${queryParams}${hashFragment}`;
}
