/*
 * Uso:
 *   npm run fake-event -- --password <contraseña-obs> [--port 4455] [--seconds-per-video 20]
 *   (la contraseña también puede venir de la variable de entorno OBS_WEBSOCKET_PASSWORD)
 */
import { parseArgs } from 'node:util';
import OBSWebSocket, { type OBSRequestTypes } from 'obs-websocket-js/json';
import {
  createNowPlayingEvent,
  HEARTBEAT_INTERVAL_MS,
  type NowPlayingEvent,
  type NowPlayingPayload,
  type PlaybackState,
  type VideoInfo,
} from '@ynp/shared';

type BroadcastEventData = OBSRequestTypes['BroadcastCustomEvent']['eventData'];

interface FakeEventOptions {
  obsPort: number;
  obsPassword: string;
  secondsPerVideo: number;
}

interface SampleVideo {
  video: VideoInfo;
  startAtSeconds: number;
}

interface SimulationState {
  sampleIndex: number;
  secondsOnCurrentVideo: number;
}

const OBS_HOST: string = '127.0.0.1';
const DEFAULT_OBS_PORT: number = 4455;
const DEFAULT_SECONDS_PER_VIDEO: number = 20;
const MS_PER_SECOND: number = 1000;
const HEARTBEAT_INTERVAL_SECONDS: number = HEARTBEAT_INTERVAL_MS / MS_PER_SECOND;

const SAMPLE_VIDEOS: readonly SampleVideo[] = [
  {
    video: {
      videoId: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
      channelName: 'Rick Astley',
      publishDate: '2009-10-24',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      viewCount: 1_600_000_000,
      durationSeconds: 213,
    },
    startAtSeconds: 60,
  },
  {
    video: {
      videoId: 'jNQXAC9IVRw',
      title: 'Me at the zoo',
      channelName: 'jawed',
      publishDate: '2005-04-23',
      thumbnailUrl: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg',
      viewCount: 350_000_000,
      durationSeconds: 19,
    },
    startAtSeconds: 0,
  },
];

function readOptions(): FakeEventOptions {
  const { values } = parseArgs({
    options: {
      port: { type: 'string', short: 'p' },
      password: { type: 'string', short: 'w' },
      'seconds-per-video': { type: 'string' },
    },
  });
  const parsedPort: number = Number(values.port);
  const parsedSecondsPerVideo: number = Number(values['seconds-per-video']);

  return {
    obsPort: Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_OBS_PORT,
    obsPassword: values.password ?? process.env.OBS_WEBSOCKET_PASSWORD ?? '',
    secondsPerVideo: parsedSecondsPerVideo > 0 ? parsedSecondsPerVideo : DEFAULT_SECONDS_PER_VIDEO,
  };
}

function buildPlayingPayload(sample: SampleVideo, secondsOnCurrentVideo: number): NowPlayingPayload {
  const playback: PlaybackState = {
    currentTimeSeconds: Math.min(sample.startAtSeconds + secondsOnCurrentVideo, sample.video.durationSeconds),
    durationSeconds: sample.video.durationSeconds,
    isPlaying: true,
    playbackRate: 1,
    isAdShowing: false,
  };
  return { kind: 'playing', video: sample.video, playback };
}

async function broadcastPayload(obsClient: OBSWebSocket, payload: NowPlayingPayload): Promise<void> {
  const nowPlayingEvent: NowPlayingEvent = createNowPlayingEvent(payload);
  await obsClient.call('BroadcastCustomEvent', { eventData: nowPlayingEvent as unknown as BroadcastEventData });
}

async function main(): Promise<void> {
  const options: FakeEventOptions = readOptions();
  const obsClient: OBSWebSocket = new OBSWebSocket();
  const simulationState: SimulationState = { sampleIndex: 0, secondsOnCurrentVideo: 0 };

  try {
    await obsClient.connect(`ws://${OBS_HOST}:${options.obsPort}`, options.obsPassword || undefined);
  } catch (connectionError: unknown) {
    const errorMessage: string = connectionError instanceof Error ? connectionError.message : String(connectionError);
    console.error(`No se pudo conectar a OBS en ${OBS_HOST}:${options.obsPort}: ${errorMessage}`);
    if (!options.obsPassword) {
      console.error('No se entregó contraseña. Uso: npm run fake-event -- --password <contraseña>');
    } else {
      console.error('Revisa que OBS esté abierto, el servidor WebSocket activo y la contraseña correcta.');
    }
    process.exit(1);
  }
  console.log(`Conectado a OBS (puerto ${options.obsPort}). Ctrl+C para enviar "clear" y salir.`);

  const sendHeartbeat = async (): Promise<void> => {
    const currentSample: SampleVideo = SAMPLE_VIDEOS[simulationState.sampleIndex];
    const payload: NowPlayingPayload = buildPlayingPayload(currentSample, simulationState.secondsOnCurrentVideo);
    await broadcastPayload(obsClient, payload);
    console.log(`→ ${currentSample.video.title} @ ${simulationState.secondsOnCurrentVideo}s`);

    simulationState.secondsOnCurrentVideo += HEARTBEAT_INTERVAL_SECONDS;
    if (simulationState.secondsOnCurrentVideo >= options.secondsPerVideo) {
      simulationState.secondsOnCurrentVideo = 0;
      simulationState.sampleIndex = (simulationState.sampleIndex + 1) % SAMPLE_VIDEOS.length;
    }
  };

  await sendHeartbeat();
  const heartbeatTimer: NodeJS.Timeout = setInterval(() => void sendHeartbeat(), HEARTBEAT_INTERVAL_MS);

  process.on('SIGINT', async () => {
    clearInterval(heartbeatTimer);
    await broadcastPayload(obsClient, { kind: 'clear' });
    console.log('→ clear');
    await obsClient.disconnect();
    process.exit(0);
  });
}

void main();
