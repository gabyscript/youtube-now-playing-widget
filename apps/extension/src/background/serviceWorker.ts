import type { ObsConnectionStatus, RuntimeMessage } from '../messages';
import { showConnectionBadge } from './connectionBadge';
import { ObsConnectionManager } from './obsConnectionManager';

void showConnectionBadge('idle');

const obsConnectionManager: ObsConnectionManager = new ObsConnectionManager();

type SendResponse = (response: ObsConnectionStatus) => void;

chrome.runtime.onMessage.addListener(
  (runtimeMessage: RuntimeMessage, _sender: chrome.runtime.MessageSender, sendResponse: SendResponse): boolean => {
    switch (runtimeMessage.type) {
      case 'now-playing':
        void obsConnectionManager.broadcast(runtimeMessage.payload);
        return false;

      case 'check-connection':
        void obsConnectionManager.checkConnection(runtimeMessage.forceReconnect).then(sendResponse);
        return true;
    }
  },
);

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});
