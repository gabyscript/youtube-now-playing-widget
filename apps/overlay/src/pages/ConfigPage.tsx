import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactElement } from 'react';
import { NowPlayingCard } from '../components/NowPlayingCard';
import { loadConfigPreferences, saveConfigPreferences } from '../lib/configPreferences';
import {
  buildOverlayUrl,
  CARD_LAYOUT_LABELS,
  CARD_LAYOUTS,
  COLOR_MODE_LABELS,
  COLOR_MODES,
  OVERLAY_FIELD_LABELS,
  OVERLAY_FIELDS,
  OVERLAY_THEME_LABELS,
  OVERLAY_THEMES,
  RECOMMENDED_SOURCE_SIZES,
  type BrowserSourceSize,
  type OverlayConfig,
  type OverlayField,
} from '../lib/overlayConfig';
import { SAMPLE_CURRENT_TIME_SECONDS, SAMPLE_VIDEO } from '../lib/sampleVideo';

type CopyStatus = 'idle' | 'copied' | 'failed';

const COPY_FEEDBACK_DURATION_MS: number = 2_000;
const MASKED_PASSWORD_FRAGMENT: string = '#pw=••••••';
const MIN_PORT: number = 1;
const MAX_PORT: number = 65_535;

const COPY_BUTTON_LABELS: Record<CopyStatus, string> = {
  idle: 'Copiar URL',
  copied: '¡Copiada!',
  failed: 'No se pudo copiar',
};

function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= MIN_PORT && port <= MAX_PORT;
}

function maskPasswordInUrl(overlayUrl: string, hasPassword: boolean): string {
  const urlWithoutHash: string = overlayUrl.split('#')[0];
  return hasPassword ? `${urlWithoutHash}${MASKED_PASSWORD_FRAGMENT}` : urlWithoutHash;
}

export function ConfigPage(): ReactElement {
  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig>(loadConfigPreferences);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  useEffect(() => {
    saveConfigPreferences(overlayConfig);
  }, [overlayConfig]);

  useEffect(() => {
    if (copyStatus === 'idle') return;
    const resetTimerId: number = window.setTimeout(() => setCopyStatus('idle'), COPY_FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(resetTimerId);
  }, [copyStatus]);

  const updateConfig = (changes: Partial<OverlayConfig>): void => {
    setOverlayConfig((currentConfig: OverlayConfig) => ({ ...currentConfig, ...changes }));
  };

  const toggleField = (toggledField: OverlayField): void => {
    setOverlayConfig((currentConfig: OverlayConfig) => {
      const wasVisible: boolean = currentConfig.visibleFields.includes(toggledField);
      const visibleFields: OverlayField[] = OVERLAY_FIELDS.filter((field: OverlayField) =>
        field === toggledField ? !wasVisible : currentConfig.visibleFields.includes(field),
      );
      return { ...currentConfig, visibleFields };
    });
  };

  const hasPassword: boolean = overlayConfig.obsPassword.length > 0;
  const isPortValid: boolean = isValidPort(overlayConfig.obsPort);
  const overlayUrl: string = buildOverlayUrl(window.location.origin, overlayConfig);
  const displayedUrl: string = maskPasswordInUrl(overlayUrl, hasPassword);
  const recommendedSourceSize: BrowserSourceSize = RECOMMENDED_SOURCE_SIZES[overlayConfig.cardLayout];

  const copyOverlayUrl = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const preventSubmit = (submitEvent: FormEvent<HTMLFormElement>): void => submitEvent.preventDefault();

  return (
    <main className="config-page">
      <header className="config-header">
        <h1>YouTube Now Playing</h1>
        <p>Configura la tarjeta y copia la URL para la Fuente de navegador de OBS.</p>
      </header>

      <div className="config-layout">
        <form className="config-form" onSubmit={preventSubmit}>
          <fieldset>
            <legend>Datos a mostrar</legend>
            <label className="checkbox-row">
              <input type="checkbox" checked disabled /> Título (siempre visible)
            </label>
            {OVERLAY_FIELDS.map((field: OverlayField) => (
              <label key={field} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={overlayConfig.visibleFields.includes(field)}
                  onChange={() => toggleField(field)}
                />{' '}
                {OVERLAY_FIELD_LABELS[field]}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Apariencia</legend>
            <OptionGroup
              groupLabel="Tema"
              options={OVERLAY_THEMES}
              optionLabels={OVERLAY_THEME_LABELS}
              selectedOption={overlayConfig.theme}
              onSelect={(theme) => updateConfig({ theme })}
            />
            <OptionGroup
              groupLabel="Modo"
              options={COLOR_MODES}
              optionLabels={COLOR_MODE_LABELS}
              selectedOption={overlayConfig.colorMode}
              onSelect={(colorMode) => updateConfig({ colorMode })}
            />
            <OptionGroup
              groupLabel="Orientación"
              options={CARD_LAYOUTS}
              optionLabels={CARD_LAYOUT_LABELS}
              selectedOption={overlayConfig.cardLayout}
              onSelect={(cardLayout) => updateConfig({ cardLayout })}
            />
          </fieldset>

          <fieldset>
            <legend>Conexión con OBS</legend>
            <label className="text-field">
              Puerto
              <input
                type="number"
                min={MIN_PORT}
                max={MAX_PORT}
                value={Number.isNaN(overlayConfig.obsPort) ? '' : overlayConfig.obsPort}
                aria-invalid={!isPortValid}
                onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
                  updateConfig({ obsPort: changeEvent.target.valueAsNumber })
                }
              />
            </label>
            {!isPortValid && <p className="field-error">Ingresa un puerto entre {MIN_PORT} y {MAX_PORT}.</p>}

            <label className="text-field">
              Contraseña
              <input
                type="password"
                autoComplete="off"
                value={overlayConfig.obsPassword}
                onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
                  updateConfig({ obsPassword: changeEvent.target.value })
                }
              />
            </label>
            {!hasPassword && (
              <p className="field-hint">Sin contraseña solo funciona si OBS tiene la autenticación desactivada.</p>
            )}

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={overlayConfig.isDebugEnabled}
                onChange={(changeEvent: ChangeEvent<HTMLInputElement>) =>
                  updateConfig({ isDebugEnabled: changeEvent.target.checked })
                }
              />{' '}
              Mostrar estado de conexión (para diagnosticar)
            </label>
          </fieldset>
        </form>

        <section className="config-output">
          <h2>Vista previa</h2>
          <div className="preview-stage">
            <div
              className="theme-root"
              data-theme={overlayConfig.theme}
              data-mode={overlayConfig.colorMode}
              data-layout={overlayConfig.cardLayout}
            >
              <NowPlayingCard
                video={SAMPLE_VIDEO}
                currentTimeSeconds={SAMPLE_CURRENT_TIME_SECONDS}
                isPlaying
                visibleFields={overlayConfig.visibleFields}
                cardLayout={overlayConfig.cardLayout}
              />
            </div>
          </div>

          <h2>URL para OBS</h2>
          <div className="url-row">
            <input className="url-box" readOnly value={displayedUrl} aria-label="URL del overlay" />
            <button type="button" onClick={copyOverlayUrl} disabled={!isPortValid} data-status={copyStatus}>
              {COPY_BUTTON_LABELS[copyStatus]}
            </button>
          </div>
          <p className="field-hint">
            La URL copiada incluye la contraseña de OBS: aquí se muestra oculta, pero no la pegues en pantalla
            durante el stream.
          </p>

          <h2>Cómo agregarlo en OBS</h2>
          <ol className="obs-steps">
            <li>En tu escena, agrega una <em>Fuente → Navegador</em>.</li>
            <li>
              Pega la URL copiada, con ancho {recommendedSourceSize.width} y alto {recommendedSourceSize.height}.
            </li>
            <li>Desactiva <em>Apagar la fuente cuando no esté visible</em>.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}

interface OptionGroupProps<OptionValue extends string> {
  groupLabel: string;
  options: readonly OptionValue[];
  optionLabels: Record<OptionValue, string>;
  selectedOption: OptionValue;
  onSelect: (selectedOption: OptionValue) => void;
}

function OptionGroup<OptionValue extends string>({
  groupLabel,
  options,
  optionLabels,
  selectedOption,
  onSelect,
}: OptionGroupProps<OptionValue>): ReactElement {
  return (
    <div className="option-group" role="radiogroup" aria-label={groupLabel}>
      <span className="option-group-label">{groupLabel}</span>
      <div className="segmented-control">
        {options.map((option: OptionValue) => (
          <label key={option} className="segment" data-selected={option === selectedOption}>
            <input
              type="radio"
              name={groupLabel}
              value={option}
              checked={option === selectedOption}
              onChange={() => onSelect(option)}
            />
            {optionLabels[option]}
          </label>
        ))}
      </div>
    </div>
  );
}
