import { isPageMessage, type RuntimeMessage } from '../messages';

const PAGE_HIDE_EVENT: string = 'pagehide';

let hasSentPlayingState: boolean = false;

function sendToServiceWorker(runtimeMessage: RuntimeMessage): void {
  try {
    chrome.runtime.sendMessage(runtimeMessage).catch(() => undefined);
  } catch {
    return;
  }
}

window.addEventListener('message', (messageEvent: MessageEvent<unknown>) => {
  if (messageEvent.source !== window || !isPageMessage(messageEvent.data)) return;
  hasSentPlayingState = messageEvent.data.payload.kind === 'playing';
  sendToServiceWorker({ type: 'now-playing', payload: messageEvent.data.payload });
});

window.addEventListener(PAGE_HIDE_EVENT, () => {
  if (hasSentPlayingState) sendToServiceWorker({ type: 'now-playing', payload: { kind: 'clear' } });
});
