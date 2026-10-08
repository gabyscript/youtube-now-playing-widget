import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json' with { type: 'json' };

const YOUTUBE_MATCH_PATTERNS: string[] = ['https://www.youtube.com/*'];

export default defineManifest({
  manifest_version: 3,
  name: 'YouTube Now Playing → OBS',
  description: 'Envía el video de YouTube actual a un overlay de OBS a través de obs-websocket.',
  version: packageJson.version,
  permissions: ['storage'],
  background: { service_worker: 'src/background/serviceWorker.ts', type: 'module' },
  options_ui: { page: 'src/options/options.html', open_in_tab: true },
  action: { default_title: 'YouTube Now Playing: opciones' },
  content_scripts: [
    {
      matches: YOUTUBE_MATCH_PATTERNS,
      js: ['src/content/mainWorld.ts'],
      world: 'MAIN',
      run_at: 'document_idle',
    },
    {
      matches: YOUTUBE_MATCH_PATTERNS,
      js: ['src/content/bridge.ts'],
      run_at: 'document_idle',
    },
  ],
});
