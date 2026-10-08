import type { PlaybackState, VideoInfo } from '@ynp/shared';

interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

interface YouTubeVideoDetails {
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: string;
  viewCount?: string;
  thumbnail?: { thumbnails: YouTubeThumbnail[] };
}

interface YouTubePlayerMicroformat {
  publishDate?: string;
  uploadDate?: string;
  ownerProfileUrl?: string;
}

interface YouTubePlayerResponse {
  videoDetails?: YouTubeVideoDetails;
  microformat?: { playerMicroformatRenderer?: YouTubePlayerMicroformat };
}

interface YouTubePlayerElement extends HTMLElement {
  getPlayerResponse?: () => YouTubePlayerResponse | undefined;
  getCurrentTime?: () => number;
  getDuration?: () => number;
  getPlayerState?: () => number;
  getPlaybackRate?: () => number;
}

const PLAYER_ELEMENT_ID: string = 'movie_player';
const AD_SHOWING_CLASS: string = 'ad-showing';
const WATCH_PAGE_PATH: string = '/watch';
const VIDEO_ID_QUERY_PARAM: string = 'v';
const PLAYER_STATE_PLAYING: number = 1;
const CHANNEL_AVATAR_SELECTOR: string =
  'ytd-watch-metadata #owner #avatar img, ytd-video-owner-renderer #avatar img';
const AVATAR_SIZE_PATTERN: RegExp = /=s\d+-/;
const AVATAR_SIZE_REPLACEMENT: string = '=s88-';

function getPlayerElement(): YouTubePlayerElement | null {
  return document.getElementById(PLAYER_ELEMENT_ID) as YouTubePlayerElement | null;
}

export function isWatchPage(): boolean {
  return location.pathname === WATCH_PAGE_PATH;
}

export function isAdShowing(): boolean {
  return getPlayerElement()?.classList.contains(AD_SHOWING_CLASS) ?? false;
}

function getVideoIdFromUrl(): string | null {
  return new URLSearchParams(location.search).get(VIDEO_ID_QUERY_PARAM);
}

function buildThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function readChannelAvatarUrl(): string | undefined {
  const avatarImage: HTMLImageElement | null = document.querySelector<HTMLImageElement>(CHANNEL_AVATAR_SELECTOR);
  if (!avatarImage?.src) return undefined;
  return avatarImage.src.replace(AVATAR_SIZE_PATTERN, AVATAR_SIZE_REPLACEMENT);
}

export function readVideoInfo(): VideoInfo | null {
  const playerResponse: YouTubePlayerResponse | undefined = getPlayerElement()?.getPlayerResponse?.();
  const videoDetails: YouTubeVideoDetails | undefined = playerResponse?.videoDetails;
  if (!videoDetails || videoDetails.videoId !== getVideoIdFromUrl()) return null;

  const microformat: YouTubePlayerMicroformat | undefined = playerResponse?.microformat?.playerMicroformatRenderer;
  const viewCount: number = Number(videoDetails.viewCount);

  return {
    videoId: videoDetails.videoId,
    title: videoDetails.title,
    channelName: videoDetails.author,
    channelUrl: microformat?.ownerProfileUrl,
    publishDate: microformat?.publishDate ?? microformat?.uploadDate,
    thumbnailUrl: buildThumbnailUrl(videoDetails.videoId),
    channelAvatarUrl: readChannelAvatarUrl(),
    viewCount: Number.isFinite(viewCount) ? viewCount : undefined,
    durationSeconds: Number(videoDetails.lengthSeconds) || 0,
  };
}

export function readPlaybackState(): PlaybackState | null {
  const playerElement: YouTubePlayerElement | null = getPlayerElement();
  if (!playerElement?.getCurrentTime) return null;

  return {
    currentTimeSeconds: playerElement.getCurrentTime(),
    durationSeconds: playerElement.getDuration?.() ?? 0,
    isPlaying: playerElement.getPlayerState?.() === PLAYER_STATE_PLAYING,
    playbackRate: playerElement.getPlaybackRate?.() ?? 1,
    isAdShowing: isAdShowing(),
  };
}
