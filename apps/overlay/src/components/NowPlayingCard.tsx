import type { ReactElement } from 'react';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import type { VideoInfo } from '@ynp/shared';
import type { CardLayout, OverlayField } from '../lib/overlayConfig';
import { formatDuration, formatViewCount, getPublishYear } from '../lib/formatters';

export interface NowPlayingCardProps {
  video: VideoInfo | null;
  currentTimeSeconds: number;
  isPlaying: boolean;
  visibleFields: OverlayField[];
  cardLayout: CardLayout;
}

const IDLE_CONTENT_KEY: string = 'idle';

const VIDEO_CHANGE_TRANSITION: Transition = { duration: 0.35, ease: 'easeOut' };

export function NowPlayingCard({
  video,
  currentTimeSeconds,
  isPlaying,
  visibleFields,
  cardLayout,
}: NowPlayingCardProps): ReactElement {
  const isFieldVisible = (field: OverlayField): boolean => visibleFields.includes(field);

  return (
    <div className="card" data-layout={cardLayout}>
      <AnimatePresence mode="wait" initial={false}>
        {video ? (
          <motion.div
            key={video.videoId}
            className="card-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={VIDEO_CHANGE_TRANSITION}
          >
            {isFieldVisible('thumbnail') && <img className="thumbnail" src={video.thumbnailUrl} alt="" />}

            <div className="info">
              <p className="title">{video.title}</p>

              {(isFieldVisible('channel') || isFieldVisible('avatar')) && (
                <div className="channel-row">
                  {isFieldVisible('avatar') && video.channelAvatarUrl && (
                    <img className="avatar" src={video.channelAvatarUrl} alt="" />
                  )}
                  {isFieldVisible('channel') && <span>{video.channelName}</span>}
                </div>
              )}

              <div className="meta">
                {isFieldVisible('year') && video.publishDate && <span>{getPublishYear(video.publishDate)}</span>}
                {isFieldVisible('views') && video.viewCount != null && <span>{formatViewCount(video.viewCount)}</span>}
              </div>

              {isFieldVisible('progress') && (
                <PlaybackProgress currentTimeSeconds={currentTimeSeconds} durationSeconds={video.durationSeconds} />
              )}
            </div>

            {!isPlaying && <span className="paused-badge">❚❚</span>}
          </motion.div>
        ) : (
          <motion.div
            key={IDLE_CONTENT_KEY}
            className="card-content idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Sin video en reproducción
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PlaybackProgressProps {
  currentTimeSeconds: number;
  durationSeconds: number;
}

function PlaybackProgress({ currentTimeSeconds, durationSeconds }: PlaybackProgressProps): ReactElement {
  if (durationSeconds <= 0) return <span className="live-badge">EN VIVO</span>;

  const progressPercent: number = Math.min(100, (currentTimeSeconds / durationSeconds) * 100);
  return (
    <div className="progress">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      <span>
        {formatDuration(currentTimeSeconds)} / {formatDuration(durationSeconds)}
      </span>
    </div>
  );
}
