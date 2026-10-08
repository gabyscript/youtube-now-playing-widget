import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config.ts';

const STANDALONE_CONTENT_SCRIPTS: string[] = ['src/content/mainWorld.ts', 'src/content/bridge.ts'];

export default defineConfig({
  plugins: [crx({ manifest, contentScripts: { standaloneFiles: STANDALONE_CONTENT_SCRIPTS } })],
});
