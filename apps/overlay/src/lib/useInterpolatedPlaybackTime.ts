import { useEffect, useState } from 'react';
import type { NowPlayingState } from './useObsNowPlaying';

const CLOCK_TICK_INTERVAL_MS: number = 250;
const MS_PER_SECOND: number = 1000;

function isPlaybackAdvancing(nowPlaying: NowPlayingState | null): boolean {
  return nowPlaying !== null && nowPlaying.playback.isPlaying && !nowPlaying.playback.isAdShowing;
}

function computePlaybackTime(nowPlaying: NowPlayingState | null, clockMs: number): number {
  if (!nowPlaying) return 0;
  const { playback, receivedAtMs } = nowPlaying;
  const elapsedMs: number = isPlaybackAdvancing(nowPlaying) ? Math.max(0, clockMs - receivedAtMs) : 0;
  const elapsedSeconds: number = (elapsedMs / MS_PER_SECOND) * playback.playbackRate;
  const maxTimeSeconds: number = playback.durationSeconds > 0 ? playback.durationSeconds : Infinity;
  return Math.min(playback.currentTimeSeconds + elapsedSeconds, maxTimeSeconds);
}

export function useInterpolatedPlaybackTime(nowPlaying: NowPlayingState | null): number {
  const [clockMs, setClockMs] = useState<number>(() => performance.now());
  const isAdvancing: boolean = isPlaybackAdvancing(nowPlaying);

  useEffect(() => {
    if (!isAdvancing) return;
    const clockTimerId: number = window.setInterval(() => setClockMs(performance.now()), CLOCK_TICK_INTERVAL_MS);
    return () => window.clearInterval(clockTimerId);
  }, [isAdvancing]);

  return computePlaybackTime(nowPlaying, clockMs);
}
