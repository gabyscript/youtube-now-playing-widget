import type { CheckConnectionRuntimeMessage, ObsConnectionStatus } from '../messages';
import {
  loadObsConnectionSettings,
  saveObsConnectionSettings,
  type ObsConnectionSettings,
} from '../obsConnectionSettings';

interface OptionsPageElements {
  settingsForm: HTMLFormElement;
  obsPortInput: HTMLInputElement;
  obsPasswordInput: HTMLInputElement;
  submitButton: HTMLButtonElement;
  connectionStatusText: HTMLParagraphElement;
}

function queryRequiredElement<ElementType extends Element>(selector: string): ElementType {
  const element: ElementType | null = document.querySelector<ElementType>(selector);
  if (!element) throw new Error(`Missing element in options.html: ${selector}`);
  return element;
}

const pageElements: OptionsPageElements = {
  settingsForm: queryRequiredElement<HTMLFormElement>('#settings-form'),
  obsPortInput: queryRequiredElement<HTMLInputElement>('#obs-port'),
  obsPasswordInput: queryRequiredElement<HTMLInputElement>('#obs-password'),
  submitButton: queryRequiredElement<HTMLButtonElement>('#settings-form button[type="submit"]'),
  connectionStatusText: queryRequiredElement<HTMLParagraphElement>('#connection-status'),
};

function renderConnectionStatus(connectionStatus: ObsConnectionStatus): void {
  const errorSuffix: string = connectionStatus.lastErrorMessage ? `: ${connectionStatus.lastErrorMessage}` : '';
  pageElements.connectionStatusText.textContent = connectionStatus.isConnected
    ? '🟢 Conectado a OBS'
    : `🔴 Desconectado${errorSuffix}`;
}

async function checkConnection(forceReconnect: boolean): Promise<void> {
  pageElements.connectionStatusText.textContent = 'Conectando…';
  pageElements.submitButton.disabled = true;
  try {
    const checkMessage: CheckConnectionRuntimeMessage = { type: 'check-connection', forceReconnect };
    const connectionStatus: ObsConnectionStatus = await chrome.runtime.sendMessage(checkMessage);
    renderConnectionStatus(connectionStatus);
  } finally {
    pageElements.submitButton.disabled = false;
  }
}

async function initializeOptionsPage(): Promise<void> {
  const settings: ObsConnectionSettings = await loadObsConnectionSettings();
  pageElements.obsPortInput.value = String(settings.obsPort);
  pageElements.obsPasswordInput.value = settings.obsPassword;
  await checkConnection(false);
}

pageElements.settingsForm.addEventListener('submit', async (submitEvent: SubmitEvent) => {
  submitEvent.preventDefault();
  const settings: ObsConnectionSettings = {
    obsPort: Number(pageElements.obsPortInput.value),
    obsPassword: pageElements.obsPasswordInput.value,
  };
  await saveObsConnectionSettings(settings);
  await checkConnection(true);
});

void initializeOptionsPage();
