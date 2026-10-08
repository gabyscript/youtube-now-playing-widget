import { HEARTBEAT_INTERVAL_MS, type NowPlayingPayload, type PlaybackState, type VideoInfo } from '@ynp/shared';
import { PAGE_MESSAGE_SOURCE, type PageMessage } from '../messages';
import { isAdShowing, isWatchPage, readPlaybackState, readVideoInfo } from './youtubePlayerReader';

const YOUTUBE_NAVIGATE_FINISH_EVENT: string = 'yt-navigate-finish';
const CAPTURED_MEDIA_EVENTS: readonly string[] = ['play', 'pause', 'seeked', 'ratechange', 'loadeddata'];
const MEDIA_EVENT_DEBOUNCE_MS: number = 150;
const NAVIGATION_DEBOUNCE_MS: number = 500;
const INITIAL_PUBLISH_DELAY_MS: number = 1_000;

class NowPlayingTracker {
  private lastVideo: VideoInfo | null = null;
  private lastPlayback: PlaybackState | null = null;
  private pendingPublishTimerId: number | undefined;

  start(): void {
    document.addEventListener(YOUTUBE_NAVIGATE_FINISH_EVENT, () => this.schedulePublish(NAVIGATION_DEBOUNCE_MS));
    for (const mediaEventName of CAPTURED_MEDIA_EVENTS) {
      document.addEventListener(mediaEventName, () => this.schedulePublish(MEDIA_EVENT_DEBOUNCE_MS), true);
    }
    window.setInterval(() => this.publish(), HEARTBEAT_INTERVAL_MS);
    this.schedulePublish(INITIAL_PUBLISH_DELAY_MS);
  }

  private schedulePublish(delayMs: number): void {
    window.clearTimeout(this.pendingPublishTimerId);
    this.pendingPublishTimerId = window.setTimeout(() => this.publish(), delayMs);
  }

  private publish(): void {
    if (!isWatchPage()) {
      this.clearIfNeeded();
      return;
    }

    if (isAdShowing()) {
      if (this.lastVideo && this.lastPlayback) {
        const frozenPlayback: PlaybackState = { ...this.lastPlayback, isPlaying: false, isAdShowing: true };
        this.post({ kind: 'playing', video: this.lastVideo, playback: frozenPlayback });
      }
      return;
    }

    const video: VideoInfo | null = readVideoInfo();
    const playback: PlaybackState | null = readPlaybackState();
    if (!video || !playback) return;

    this.lastVideo = video;
    this.lastPlayback = playback;
    this.post({ kind: 'playing', video, playback });
  }

  private clearIfNeeded(): void {
    if (!this.lastVideo) return;
    this.lastVideo = null;
    this.lastPlayback = null;
    this.post({ kind: 'clear' });
  }

  private post(payload: NowPlayingPayload): void {
    const pageMessage: PageMessage = { source: PAGE_MESSAGE_SOURCE, payload };
    window.postMessage(pageMessage, location.origin);
  }
}

new NowPlayingTracker().start();
