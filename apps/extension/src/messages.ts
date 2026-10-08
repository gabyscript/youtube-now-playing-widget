import type { NowPlayingPayload } from '@ynp/shared';

export type PageMessageSource = 'ynp-main-world';

export const PAGE_MESSAGE_SOURCE: PageMessageSource = 'ynp-main-world';

export interface PageMessage {
  source: PageMessageSource;
  payload: NowPlayingPayload;
}

export interface NowPlayingRuntimeMessage {
  type: 'now-playing';
  payload: NowPlayingPayload;
}

export interface CheckConnectionRuntimeMessage {
  type: 'check-connection';
  forceReconnect: boolean;
}

export type RuntimeMessage = NowPlayingRuntimeMessage | CheckConnectionRuntimeMessage;

export interface ObsConnectionStatus {
  isConnected: boolean;
  lastErrorMessage?: string;
}

export function isPageMessage(candidate: unknown): candidate is PageMessage {
  if (typeof candidate !== 'object' || candidate === null) return false;
  const partialMessage: Partial<PageMessage> = candidate as Partial<PageMessage>;
  return partialMessage.source === PAGE_MESSAGE_SOURCE && typeof partialMessage.payload === 'object';
}
