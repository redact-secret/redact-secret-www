/**
 * The playground's bridge to `@redact-secret/core`, which runs in a
 * same-origin Web Worker per PII mode — created lazily, so the page and the
 * prerender never pay for the engine. Nothing typed leaves the browser.
 *
 * Boundary: ADR 0001 and ADR 0002 (docs/decisions/).
 */
import { piiSelectors, type FromWorker, type PiiMode, type PlaceholderStyle, type RunResult } from './protocol';

export { limits, type PiiMode, type PlaceholderStyle, type RunResult, type Segment } from './protocol';

export type Engine = {
  version: string;
  artifact: string;
  /** The core's canonical activation identity, e.g. `selectors=pii:global`. */
  activation: string;
  run: (input: string, style: PlaceholderStyle) => Promise<RunResult>;
};

export type EngineLoader = (mode: PiiMode) => Promise<Engine>;

/**
 * Why loading failed. `stale` means the engine's code could not be fetched —
 * typically a tab left open across a deploy (old hashed assets are pruned)
 * or, in development, across a dependency change. Only a reload fixes that.
 * `init` means the code arrived but the engine could not start.
 */
export class EngineLoadError extends Error {
  constructor(
    readonly kind: 'stale' | 'init',
    readonly code?: string,
  ) {
    super(kind);
  }
}

function startWorker(mode: PiiMode): Promise<Engine> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module', name: `redact-${mode}` });
    const pending = new Map<number, (result: RunResult) => void>();
    let nextId = 0;

    worker.onerror = (event) => {
      event.preventDefault();
      worker.terminate();
      reject(new EngineLoadError('stale'));
    };

    worker.onmessage = (event: MessageEvent<FromWorker>) => {
      const message = event.data;
      if (message.type === 'ready') {
        worker.onerror = null;
        resolve({
          version: message.version,
          artifact: message.artifact,
          activation: message.activation,
          run: (input, style) =>
            new Promise((done) => {
              const id = nextId++;
              pending.set(id, done);
              worker.postMessage({ type: 'run', id, input, style });
            }),
        });
      } else if (message.type === 'init-failed') {
        worker.terminate();
        reject(new EngineLoadError('init', message.code));
      } else {
        pending.get(message.id)?.(message.result);
        pending.delete(message.id);
      }
    };

    worker.postMessage({ type: 'init', pii: piiSelectors[mode] });
  });
}

const engines = new Map<PiiMode, Promise<Engine>>();

export const loadEngine: EngineLoader = (mode) => {
  let engine = engines.get(mode);
  if (!engine) {
    engine = startWorker(mode);
    engine.catch(() => engines.delete(mode)); // a failed load may be retried
    engines.set(mode, engine);
  }
  return engine;
};
