import type { NowPlayingEventSource, NowPlayingProtocolVersion } from './constants';

export interface VideoInfo {
  videoId: string;
  title: string;
  channelName: string;
  channelUrl?: string;
  publishDate?: string;
  thumbnailUrl: string;
  channelAvatarUrl?: string;
  viewCount?: number;
  durationSeconds: number;
}

export interface PlaybackState {
  currentTimeSeconds: number;
  durationSeconds: number;
  isPlaying: boolean;
  playbackRate: number;
  isAdShowing: boolean;
}

export type NowPlayingPayloadKind = 'playing' | 'clear';

export interface PlayingPayload {
  kind: 'playing';
  video: VideoInfo;
  playback: PlaybackState;
}

export interface ClearPayload {
  kind: 'clear';
}

export type NowPlayingPayload = PlayingPayload | ClearPayload;

export interface NowPlayingEvent {
  source: NowPlayingEventSource;
  version: NowPlayingProtocolVersion;
  payload: NowPlayingPayload;
}
