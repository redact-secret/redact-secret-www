/**
 * The browser entry. Every page arrives complete: the renderer
 * (src/render.tsx) prerendered it and embedded the copy and data it was
 * rendered from as inert JSON (`#page-data`). Hydration reads that element —
 * never the network — so the application bundle holds no copy and no data,
 * and a content release changes HTML only (#11).
 *
 * If the element is missing or unreadable, the page is left as it arrived:
 * complete, without the interactive parts. Nothing here ever empties it.
 */
import { hydrate, render } from 'preact';
import { App, payloadElementId, type PagePayload } from './app';
import { installSiteData } from './site-data';
import './tokens.css';
import './style.css';

function embeddedPayload(): PagePayload | undefined {
  const text = document.getElementById(payloadElementId)?.textContent;
  if (!text) return undefined;
  try {
    const payload = JSON.parse(text) as PagePayload;
    return payload?.v === 1 && payload.view && payload.data ? payload : undefined;
  } catch {
    return undefined;
  }
}

const root = document.getElementById('app')!;
const payload = embeddedPayload();
if (payload) {
  installSiteData(payload.data);
  hydrate(<App view={payload.view} />, root);
} else if (import.meta.env.DEV) {
  // `vite` (dev server) serves the bare template; render from the working tree.
  void import('./dev').then(({ devPayload }) => {
    const p = devPayload(location.pathname);
    installSiteData(p.data);
    render(<App view={p.view} />, root);
  });
}
