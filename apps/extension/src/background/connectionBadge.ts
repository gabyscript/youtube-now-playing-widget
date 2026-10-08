export type ConnectionBadgeState = 'connected' | 'error' | 'idle';

interface BadgeAppearance {
  text: string;
  color: string;
  title: string;
}

const BADGE_APPEARANCES: Record<ConnectionBadgeState, BadgeAppearance> = {
  connected: { text: ' ', color: '#34c759', title: 'YouTube Now Playing: conectado a OBS' },
  error: { text: '!', color: '#ff3b30', title: 'YouTube Now Playing: sin conexión con OBS' },
  idle: { text: '', color: '#8e8e93', title: 'YouTube Now Playing: en espera' },
};

export async function showConnectionBadge(state: ConnectionBadgeState, errorMessage?: string): Promise<void> {
  const appearance: BadgeAppearance = BADGE_APPEARANCES[state];
  const title: string = errorMessage ? `${appearance.title}: ${errorMessage}` : appearance.title;
  await chrome.action.setBadgeBackgroundColor({ color: appearance.color });
  await chrome.action.setBadgeText({ text: appearance.text });
  await chrome.action.setTitle({ title });
}
