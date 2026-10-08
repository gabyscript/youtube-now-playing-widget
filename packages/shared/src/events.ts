import { NOW_PLAYING_EVENT_SOURCE, NOW_PLAYING_PROTOCOL_VERSION } from './constants';
import type { NowPlayingEvent, NowPlayingPayload, NowPlayingPayloadKind } from './types';

interface WrappedEventData {
  eventData?: unknown;
}

const VALID_PAYLOAD_KINDS: readonly NowPlayingPayloadKind[] = ['playing', 'clear'];

export function createNowPlayingEvent(payload: NowPlayingPayload): NowPlayingEvent {
  const nowPlayingEvent: NowPlayingEvent = {
    source: NOW_PLAYING_EVENT_SOURCE,
    version: NOW_PLAYING_PROTOCOL_VERSION,
    payload,
  };
  return nowPlayingEvent;
}

function isNowPlayingEvent(candidate: unknown): candidate is NowPlayingEvent {
  if (typeof candidate !== 'object' || candidate === null) return false;

  const partialEvent: Partial<NowPlayingEvent> = candidate as Partial<NowPlayingEvent>;
  const hasExpectedHeader: boolean =
    partialEvent.source === NOW_PLAYING_EVENT_SOURCE && partialEvent.version === NOW_PLAYING_PROTOCOL_VERSION;
  if (!hasExpectedHeader) return false;

  const payload: Partial<NowPlayingPayload> | undefined = partialEvent.payload;
  return (
    typeof payload === 'object' &&
    payload !== null &&
    VALID_PAYLOAD_KINDS.includes(payload.kind as NowPlayingPayloadKind)
  );
}

export function parseNowPlayingEvent(receivedData: unknown): NowPlayingEvent | null {
  if (isNowPlayingEvent(receivedData)) return receivedData;

  const wrappedData: WrappedEventData | null =
    typeof receivedData === 'object' ? (receivedData as WrappedEventData | null) : null;
  const innerEventData: unknown = wrappedData?.eventData;
  return isNowPlayingEvent(innerEventData) ? innerEventData : null;
}
