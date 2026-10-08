import { useMemo, type ReactElement } from 'react';
import { NowPlayingCard } from '../components/NowPlayingCard';
import { parseOverlayConfig, type OverlayConfig } from '../lib/overlayConfig';
import { useInterpolatedPlaybackTime } from '../lib/useInterpolatedPlaybackTime';
import { useObsNowPlaying, type ObsNowPlayingResult } from '../lib/useObsNowPlaying';

export function OverlayPage(): ReactElement {
  const overlayConfig: OverlayConfig = useMemo(() => parseOverlayConfig(window.location), []);
  const { nowPlaying, connectionStatus }: ObsNowPlayingResult = useObsNowPlaying(
    overlayConfig.obsPort,
    overlayConfig.obsPassword,
  );
  const currentTimeSeconds: number = useInterpolatedPlaybackTime(nowPlaying);
  const isPlaying: boolean = nowPlaying ? nowPlaying.playback.isPlaying : true;

  return (
    <div className="theme-root overlay-root" data-theme={overlayConfig.theme} data-mode={overlayConfig.colorMode}>
      <NowPlayingCard
        video={nowPlaying?.video ?? null}
        currentTimeSeconds={currentTimeSeconds}
        isPlaying={isPlaying}
        visibleFields={overlayConfig.visibleFields}
        cardLayout={overlayConfig.cardLayout}
      />
      {overlayConfig.isDebugEnabled && <span className="debug-status">OBS: {connectionStatus}</span>}
    </div>
  );
}
