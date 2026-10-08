import { useEffect, useState } from 'react';
import OBSWebSocket, { EventSubscription } from 'obs-websocket-js';
import {
  parseNowPlayingEvent,
  STALE_STATE_TIMEOUT_MS,
  type NowPlayingEvent,
  type PlaybackState,
  type VideoInfo,
} from '@ynp/shared';

export type ObsConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface NowPlayingState {
  video: VideoInfo;
  playback: PlaybackState;
  receivedAtMs: number;
}

export interface ObsNowPlayingResult {
  nowPlaying: NowPlayingState | null;
  connectionStatus: ObsConnectionStatus;
}

const OBS_HOST: string = '127.0.0.1';
const INITIAL_RETRY_DELAY_MS: number = 1_000;
const MAX_RETRY_DELAY_MS: number = 30_000;
const STALE_CHECK_INTERVAL_MS: number = 1_000;

export function useObsNowPlaying(obsPort: number, obsPassword: string): ObsNowPlayingResult {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ObsConnectionStatus>('connecting');

  useEffect(() => {
    const obsClient: OBSWebSocket = new OBSWebSocket();
    let isDisposed: boolean = false;
    let retryAttempt: number = 0;
    let retryTimerId: number | undefined;
    let lastMessageAtMs: number = 0;

    const scheduleReconnect = (): void => {
      if (isDisposed) return;
      setConnectionStatus('disconnected');
      window.clearTimeout(retryTimerId);
      const retryDelayMs: number = Math.min(MAX_RETRY_DELAY_MS, INITIAL_RETRY_DELAY_MS * 2 ** retryAttempt);
      retryAttempt += 1;
      retryTimerId = window.setTimeout(connectToObs, retryDelayMs);
    };

    const connectToObs = async (): Promise<void> => {
      setConnectionStatus('connecting');
      try {
        await obsClient.connect(`ws://${OBS_HOST}:${obsPort}`, obsPassword || undefined, {
          eventSubscriptions: EventSubscription.General,
        });
        retryAttempt = 0;
        setConnectionStatus('connected');
      } catch {
        scheduleReconnect();
      }
    };

    const handleCustomEvent = (receivedData: unknown): void => {
      const nowPlayingEvent: NowPlayingEvent | null = parseNowPlayingEvent(receivedData);
      if (!nowPlayingEvent) return;

      lastMessageAtMs = Date.now();
      const { payload } = nowPlayingEvent;
      if (payload.kind === 'clear') {
        setNowPlaying(null);
        return;
      }
      setNowPlaying({ video: payload.video, playback: payload.playback, receivedAtMs: performance.now() });
    };

    const clearStaleState = (): void => {
      if (lastMessageAtMs > 0 && Date.now() - lastMessageAtMs > STALE_STATE_TIMEOUT_MS) {
        lastMessageAtMs = 0;
        setNowPlaying(null);
      }
    };

    obsClient.on('ConnectionClosed', scheduleReconnect);
    obsClient.on('CustomEvent', handleCustomEvent);
    const staleCheckTimerId: number = window.setInterval(clearStaleState, STALE_CHECK_INTERVAL_MS);
    void connectToObs();

    return () => {
      isDisposed = true;
      window.clearTimeout(retryTimerId);
      window.clearInterval(staleCheckTimerId);
      obsClient.removeAllListeners();
      void obsClient.disconnect();
    };
  }, [obsPort, obsPassword]);

  return { nowPlaying, connectionStatus };
}
