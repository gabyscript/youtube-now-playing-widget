import OBSWebSocket, { EventSubscription, type OBSRequestTypes } from 'obs-websocket-js';
import { createNowPlayingEvent, type NowPlayingEvent, type NowPlayingPayload } from '@ynp/shared';
import type { ObsConnectionStatus } from '../messages';
import { showConnectionBadge } from './connectionBadge';
import { loadObsConnectionSettings, type ObsConnectionSettings } from '../obsConnectionSettings';

type BroadcastEventData = OBSRequestTypes['BroadcastCustomEvent']['eventData'];

const OBS_HOST: string = '127.0.0.1';
const RETRY_COOLDOWN_MS: number = 5_000;
const OBS_NOT_RESPONDING_MESSAGE: string = 'OBS no responde (¿está abierto con el servidor WebSocket activo?)';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class ObsConnectionManager {
  private readonly obsClient: OBSWebSocket = new OBSWebSocket();
  private isConnected: boolean = false;
  private pendingConnection: Promise<void> | null = null;
  private lastAttemptAtMs: number = 0;
  private lastErrorMessage: string | undefined;

  constructor() {
    this.obsClient.on('Identified', () => {
      this.isConnected = true;
      this.lastErrorMessage = undefined;
      this.refreshBadge();
    });
    this.obsClient.on('ConnectionClosed', (closeError: Error) => {
      this.isConnected = false;
      if (closeError.message) this.lastErrorMessage = closeError.message;
      this.refreshBadge();
    });
  }

  private refreshBadge(): void {
    if (this.isConnected) {
      void showConnectionBadge('connected');
      return;
    }
    void showConnectionBadge('error', this.lastErrorMessage || OBS_NOT_RESPONDING_MESSAGE);
  }

  getStatus(): ObsConnectionStatus {
    return { isConnected: this.isConnected, lastErrorMessage: this.lastErrorMessage };
  }

  async broadcast(payload: NowPlayingPayload): Promise<void> {
    if (!(await this.ensureConnected())) return;
    const nowPlayingEvent: NowPlayingEvent = createNowPlayingEvent(payload);
    try {
      await this.obsClient.call('BroadcastCustomEvent', { eventData: nowPlayingEvent as unknown as BroadcastEventData });
    } catch (broadcastError: unknown) {
      this.lastErrorMessage = toErrorMessage(broadcastError);
      this.refreshBadge();
    }
  }

  async checkConnection(forceReconnect: boolean): Promise<ObsConnectionStatus> {
    this.lastAttemptAtMs = 0;
    if (forceReconnect) {
      await this.obsClient.disconnect();
      this.isConnected = false;
    }
    await this.ensureConnected();
    return this.getStatus();
  }

  private async ensureConnected(): Promise<boolean> {
    if (this.isConnected) return true;
    if (!this.pendingConnection) {
      if (Date.now() - this.lastAttemptAtMs < RETRY_COOLDOWN_MS) return false;
      this.lastAttemptAtMs = Date.now();
      this.pendingConnection = this.connect().finally(() => {
        this.pendingConnection = null;
      });
    }
    await this.pendingConnection;
    return this.isConnected;
  }

  private async connect(): Promise<void> {
    try {
      const settings: ObsConnectionSettings = await loadObsConnectionSettings();
      await this.obsClient.connect(`ws://${OBS_HOST}:${settings.obsPort}`, settings.obsPassword || undefined, {
        eventSubscriptions: EventSubscription.None,
      });
      this.isConnected = true;
      this.lastErrorMessage = undefined;
    } catch (connectionError: unknown) {
      this.isConnected = false;
      this.lastErrorMessage = toErrorMessage(connectionError);
    }
    this.refreshBadge();
  }
}
