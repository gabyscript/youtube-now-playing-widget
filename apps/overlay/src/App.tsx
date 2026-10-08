import type { ReactElement } from 'react';
import { ConfigPage } from './pages/ConfigPage';
import { OverlayPage } from './pages/OverlayPage';
import { OVERLAY_ROUTE_PATH } from './lib/overlayConfig';

const TRAILING_SLASHES_PATTERN: RegExp = /\/+$/;

export default function App(): ReactElement {
  const currentPath: string = window.location.pathname.replace(TRAILING_SLASHES_PATTERN, '');
  return currentPath === OVERLAY_ROUTE_PATH ? <OverlayPage /> : <ConfigPage />;
}
