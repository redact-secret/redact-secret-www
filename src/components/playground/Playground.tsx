import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Button, SegmentedControl } from '../ui';
import type { HomeCopy } from '../../content';
import { plainText, Rich } from '../ui/Rich';
import { playgroundDefault, playgroundPresetsWithPii, type PlaygroundPreset } from '../../content/shared';
import {
  EngineLoadError,
  limits,
  loadEngine as defaultLoader,
  type Engine,
  type EngineLoader,
  type PiiMode,
  type PlaceholderStyle,
  type RunResult,
} from '../../playground/engine';
import { FindingsTable } from './FindingsTable';
import { RedactedOutput } from './RedactedOutput';
import styles from './Playground.module.css';

export type PlaygroundProps = {
  copy: HomeCopy['playground'];
  /** Swappable for stories; the page uses the real core in a Web Worker. */
  loadEngine?: EngineLoader;
  /** Load on mount instead of when the block nears the viewport. */
  eager?: boolean;
  initialPii?: PiiMode;
};

type EngineState =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; stale: boolean; code?: string }
  | { status: 'ready'; engine: Engine };

const presetIds = Object.keys(playgroundPresetsWithPii) as PlaygroundPreset[];
const piiModes: PiiMode[] = ['off', 'global', 'us'];

function formatBytes(n: number) {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

/**
 * Paste text, see it redacted live. Everything stays in component state and
 * a same-origin worker: no storage, no URL, no request carrying the input
 * (ADR 0001, ADR 0002).
 */
export function Playground({ copy, loadEngine = defaultLoader, eager = false, initialPii = 'off' }: PlaygroundProps) {
  const [input, setInput] = useState(playgroundDefault);
  const [preset, setPreset] = useState<PlaygroundPreset | undefined>(undefined);
  const [style, setStyle] = useState<PlaceholderStyle>('numbered');
  const [pii, setPii] = useState<PiiMode>(initialPii);
  const [visible, setVisible] = useState(eager);
  const [engineState, setEngineState] = useState<EngineState>({ status: 'idle' });
  const [result, setResult] = useState<RunResult | undefined>(undefined);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const latestRun = useRef(0);

  // Start loading when the block nears the viewport (or on input focus).
  useEffect(() => {
    if (visible) return;
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return setVisible(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisible(true);
      },
      { rootMargin: '400px' },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [visible]);

  // One engine per PII mode; switching modes loads (or reuses) that engine.
  useEffect(() => {
    if (!visible) return;
    let current = true;
    setEngineState({ status: 'loading' });
    setResult(undefined);
    loadEngine(pii).then(
      (engine) => current && setEngineState({ status: 'ready', engine }),
      (error) =>
        current &&
        setEngineState({
          status: 'error',
          stale: error instanceof EngineLoadError && error.kind === 'stale',
          code: error instanceof EngineLoadError ? error.code : undefined,
        }),
    );
    return () => {
      current = false;
    };
  }, [visible, pii, attempt]);

  // Scans run in the worker; only the newest answer is shown.
  useEffect(() => {
    if (engineState.status !== 'ready') return;
    const id = ++latestRun.current;
    engineState.engine.run(input, style).then((next) => {
      if (id === latestRun.current) setResult(next);
    });
  }, [engineState, input, style]);

  const bytes = useMemo(() => new TextEncoder().encode(input).length, [input]);

  function choosePreset(id: PlaygroundPreset) {
    setPreset(id);
    setInput(playgroundPresetsWithPii[id]);
    if (id === 'pii' && pii === 'off') setPii('us');
  }

  return (
    <div class={styles.playground} ref={rootRef}>
      <p class={`small ${styles.privacy}`} id="playground-privacy">
        <Rich value={copy.privacy} />
      </p>

      <div class={styles.toolbar}>
        <div class={styles.group}>
          <span class="eyebrow">{copy.presetsLabel}</span>
          <SegmentedControl
            label={copy.presetsLabel}
            value={preset}
            onChange={choosePreset}
            options={presetIds.map((id) => ({ value: id, label: copy.presets[id] }))}
          />
        </div>
        <div class={styles.group}>
          <SegmentedControl<PlaceholderStyle>
            label={copy.styleLabel}
            value={style}
            onChange={setStyle}
            options={[
              { value: 'numbered', label: '<SECRET_1>' },
              { value: 'typed', label: '<TYPE_1>' },
            ]}
          />
          <Button
            onClick={() => {
              setInput('');
              setPreset(undefined);
            }}
          >
            {copy.clear}
          </Button>
          <Button
            onClick={() => {
              setInput(playgroundDefault);
              setPreset(undefined);
            }}
          >
            {copy.reset}
          </Button>
        </div>
      </div>

      <div class={styles.piiRow}>
        <div class={styles.group}>
          <span class="eyebrow">{copy.piiLabel}</span>
          <SegmentedControl<PiiMode>
            label={copy.piiLabel}
            value={pii}
            onChange={setPii}
            options={piiModes.map((mode) => ({ value: mode, label: copy.piiModes[mode] }))}
          />
        </div>
        <p class={`tiny ${styles.piiNote}`}><Rich value={copy.piiNote} /></p>
      </div>

      <div class={styles.panes}>
        <div class={styles.pane}>
          <div class={styles.paneHead}>
            <label class="eyebrow" for="playground-input">
              {copy.inputLabel}
            </label>
            <span class="tiny mono">{plainText(copy.size, { used: formatBytes(bytes), max: formatBytes(limits.maxInputBytes) })}</span>
          </div>
          {/* Spellcheck, autocorrect, and grammar extensions can send field
              contents off-device — all off (ADR 0001 § 3). */}
          <textarea
            id="playground-input"
            class={styles.input}
            value={input}
            onInput={(e) => {
              setInput(e.currentTarget.value);
              setPreset(undefined);
            }}
            onFocus={() => setVisible(true)}
            rows={10}
            spellcheck={false}
            autocomplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-describedby="playground-privacy"
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
            data-lt-active="false"
          />
        </div>
        <div class={styles.pane}>
          <div class={styles.paneHead}>
            <span class="eyebrow" id="playground-output-label">
              {copy.outputLabel}
            </span>
            <span class="tiny" aria-live="polite">
              {result?.ok &&
                plainText(result.findings.length === 1 ? copy.findingCount.one : copy.findingCount.other, {
                  n: result.findings.length,
                })}
            </span>
          </div>
          <div class={styles.outputBody} aria-labelledby="playground-output-label" role="region">
            {engineState.status === 'error' ? (
              <div class={styles.state}>
                {engineState.stale ? (
                  <>
                    <p class="small">{copy.staleEngine}</p>
                    <Button onClick={() => location.reload()}>{copy.reload}</Button>
                  </>
                ) : (
                  <>
                    <p class="small">
                      {copy.loadFailed} {engineState.code && <span class="mono">{engineState.code}</span>}
                    </p>
                    <Button onClick={() => setAttempt((n) => n + 1)}>{copy.retry}</Button>
                  </>
                )}
              </div>
            ) : !result ? (
              <p class="small">{copy.loading}</p>
            ) : result.ok ? (
              <RedactedOutput segments={result.segments} activeId={activeId} />
            ) : (
              <p class="small">
                {copy.errors[result.code as keyof typeof copy.errors] ?? copy.errors.default} <span class="mono">{result.code}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div class={`tiny ${styles.status}`}>
        <span>{engineState.status === 'ready' && (
            <Rich
              value={copy.engine}
              vars={{ version: engineState.engine.version, artifact: engineState.engine.artifact }}
            />
          )}</span>
      </div>

      {result?.ok && (
        <div class={styles.findings}>
          <h3 class="h3">
            <Rich value={copy.findingsTitle} />
          </h3>
          {result.findings.length > 0 ? (
            <FindingsTable
              findings={result.findings}
              columns={copy.columns}
              label={plainText(copy.findingsTitle, {})}
              onActivate={setActiveId}
            />
          ) : (
            <p class={`small ${styles.empty}`}><Rich value={copy.noFindings} /></p>
          )}
        </div>
      )}
    </div>
  );
}
