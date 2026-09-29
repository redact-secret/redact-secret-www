import { useEffect, useRef, useState } from 'preact/hooks';
import type { CommunityCopy } from '../../content';
import {
  communityUrls,
  defaultFeedbackKey,
  feedbackGroups,
  feedbackKinds,
  isFeedbackKey,
  prefillUrl,
  prefillUrlLimit,
  type FeedbackForm,
  type FeedbackKey,
  type FormKey,
} from '../../content/community';
import type { Locale } from '../../i18n';
import { EngineLoadError, loadEngine as defaultLoader, type Engine, type EngineLoader } from '../../playground/engine';
import { plainText, Rich } from '../ui/Rich';
import { FormPanel } from './FormPanel';
import { Handoff, type CheckHit, type CheckStatus } from './Handoff';
import { KindList } from './KindList';
import { SecurityPanel } from './SecurityPanel';
import styles from './CommunityDesk.module.css';

export type CommunityDeskProps = {
  locale: Locale;
  copy: CommunityCopy;
  /** The published core version, for placeholders. */
  version: string;
  /** Swappable for stories; the page uses the real core in a Web Worker. */
  loadEngine?: EngineLoader;
  /** The kind shown first (stories); the page reads it from the URL hash after hydration. */
  initialKey?: FeedbackKey;
  /** Initial values (stories only): the page always starts empty. */
  initialValues?: Record<string, string>;
};

type EngineState = { status: 'idle' | 'loading' } | { status: 'error'; stale: boolean } | { status: 'ready'; engine: Engine };
type ScanResult = { key: string; hits: CheckHit[] } | { key: string; failed: true };

/** 1-based line and column of a UTF-16 offset. */
function position(text: string, offset: number) {
  const lines = text.slice(0, offset).split('\n');
  return { line: lines.length, col: lines[lines.length - 1]!.length + 1 };
}

/**
 * The feedback router: pick a kind, fill its form, and the published core
 * checks every field in this tab before Continue opens GitHub's form with
 * the text in the address. Drafts live in component state only — no storage,
 * no request; the one place the text goes is the address the visitor opens
 * (ADR 0004).
 */
export function CommunityDesk({ locale, copy, version, loadEngine = defaultLoader, initialKey = defaultFeedbackKey, initialValues }: CommunityDeskProps) {
  const [current, setCurrent] = useState<FeedbackKey>(initialKey);
  const [drafts, setDrafts] = useState<Partial<Record<FormKey, Record<string, string>>>>(
    initialValues && initialKey !== 'security' ? { [initialKey]: initialValues } : {},
  );
  const [acks, setAcks] = useState<Partial<Record<FormKey, boolean>>>({});
  const [engineState, setEngineState] = useState<EngineState>({ status: 'idle' });
  const [scan, setScan] = useState<ScanResult | undefined>(undefined);
  const [live, setLive] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const latestScan = useRef(0);

  // After hydration: the kind named in the address (#false-positive), and
  // the no-JavaScript note hidden by an attribute, so the text stays as prerendered.
  useEffect(() => {
    setLive(true);
    const fromHash = () => {
      const key = decodeURIComponent(location.hash.slice(1));
      if (isFeedbackKey(key)) setCurrent(key);
    };
    fromHash();
    addEventListener('hashchange', fromHash);
    return () => removeEventListener('hashchange', fromHash);
  }, []);

  const kind = feedbackKinds.find((k) => k.key === current)!;
  const form = kind.kind === 'security' ? undefined : (kind as FeedbackForm);
  const formKey = form?.key as FormKey | undefined;
  const values = (formKey && drafts[formKey]) || {};
  const ack = (formKey && acks[formKey]) || false;
  const checked = form ? ['title', ...form.fields.map((f) => f.id)].filter((id) => (values[id] ?? '').trim()) : [];
  const hasText = checked.length > 0;
  const scanKey = JSON.stringify([current, checked.map((id) => [id, values[id]])]);

  // The engine loads once there is something to check — not on page load.
  useEffect(() => {
    if (!hasText || engineState.status !== 'idle') return;
    setEngineState({ status: 'loading' });
    loadEngine('off').then(
      (engine) => setEngineState({ status: 'ready', engine }),
      (error) => setEngineState({ status: 'error', stale: error instanceof EngineLoadError && error.kind === 'stale' }),
    );
  }, [hasText, engineState.status]);

  // Every non-empty field, scanned in the worker; only the newest answer counts.
  useEffect(() => {
    if (!form || !hasText || engineState.status !== 'ready') return;
    const id = ++latestScan.current;
    const timer = setTimeout(async () => {
      const labels: Record<string, string> = { title: copy.form.titleLabel };
      const formCopy = copy.forms[form.key as FormKey];
      for (const f of form.fields) labels[f.id] = formCopy.fields[f.id]?.label ?? f.id;
      const hits: CheckHit[] = [];
      for (const field of checked) {
        const text = values[field]!;
        const result = await engineState.engine.run(text, 'numbered');
        if (id !== latestScan.current) return;
        if (!result.ok) return setScan({ key: scanKey, failed: true });
        for (const finding of result.findings) {
          hits.push({ field, label: labels[field]!, type: finding.type, ...position(text, finding.start), length: finding.end - finding.start });
        }
      }
      if (id === latestScan.current) setScan({ key: scanKey, hits });
    }, 120);
    return () => clearTimeout(timer);
  }, [scanKey, engineState]);

  function select(key: string) {
    if (!isFeedbackKey(key)) return;
    setCurrent(key);
    try {
      history.replaceState(null, '', `#${key}`);
    } catch {
      // A sandboxed frame may refuse; the selection still holds.
    }
    // Stacked layout: the list sits above the form, so bring the form into view.
    if (matchMedia('(max-width: 899px)').matches) panelRef.current?.scrollIntoView({ block: 'start' });
  }

  const kindGroups = feedbackGroups.map((group) => ({
    key: group,
    label: copy.groups[group],
    items: feedbackKinds
      .filter((k) => k.group === group)
      .map((k) => {
        const words = k.kind === 'security' ? copy.security : copy.forms[k.key as FormKey];
        return { key: k.key, name: words.name, where: words.where, current: k.key === current };
      }),
  }));

  let panel;
  if (!form || !formKey) {
    panel = <SecurityPanel copy={copy.security} advisoryHref={communityUrls.advisory} policyHref={communityUrls.securityPolicy} />;
  } else {
    const formCopy = copy.forms[formKey];
    const fresh = scan && scan.key === scanKey ? scan : undefined;
    const shown = fresh ?? scan; // while a re-check runs, the last verdict stays up
    const hits = shown && 'hits' in shown ? shown.hits : [];
    let status: CheckStatus;
    if (!hasText) status = 'idle';
    else if (engineState.status === 'error') status = engineState.stale ? 'stale' : 'failed';
    else if (!shown) status = 'loading';
    else if ('failed' in shown) status = 'failed';
    else status = hits.length ? 'found' : 'clean';

    const url = prefillUrl(form, values);
    const missing = [
      ...(values.title?.trim() ? [] : [copy.form.titleLabel]),
      // An outline left as inserted is not an answer yet.
      ...form.fields
        .filter((f) => f.required && (!(values[f.id] ?? '').trim() || values[f.id]!.trim() === formCopy.fields[f.id]?.template?.trim()))
        .map((f) => formCopy.fields[f.id]?.label ?? f.id),
    ];
    const reasons = [
      ...(missing.length ? [plainText(copy.handoff.needFields, { fields: missing.join(', ') })] : []),
      ...(status === 'found' ? [copy.handoff.needSafe] : []),
      ...(hasText && (status === 'loading' || status === 'failed' || status === 'stale') ? [copy.handoff.needCheck] : []),
      ...(ack ? [] : [copy.handoff.needAck]),
      ...(url.length > prefillUrlLimit ? [copy.handoff.tooLong] : []),
    ];
    // A re-check still running also holds Continue, without a new reason:
    // it settles within a keystroke.
    const settled = !hasText || (fresh !== undefined && status === 'clean');
    const blank = prefillUrl(form, {});

    panel = (
      <>
        <FormPanel
          form={form}
          copy={copy.form}
          formCopy={formCopy}
          values={values}
          ack={ack}
          flagged={new Set(status === 'found' ? hits.map((h) => h.field) : [])}
          version={version}
          onChange={(id, value) => setDrafts((d) => ({ ...d, [formKey]: { ...d[formKey], [id]: value } }))}
          onAck={(v) => setAcks((a) => ({ ...a, [formKey]: v }))}
          onClear={() => {
            setDrafts((d) => ({ ...d, [formKey]: {} }));
            setAcks((a) => ({ ...a, [formKey]: false }));
          }}
        />
        <Handoff
          locale={locale}
          copy={copy.handoff}
          status={status}
          hits={status === 'found' ? hits : []}
          url={url}
          urlLimit={prefillUrlLimit}
          reasons={reasons.length || settled ? reasons : [copy.handoff.needCheck]}
          fallbackHref={status === 'failed' || status === 'stale' ? blank : undefined}
        />
      </>
    );
  }

  return (
    <section class={styles.desk} aria-label={copy.kindsLabel} data-live={live ? '' : undefined}>
      <p class={`small ${styles.nojs}`}>
        <Rich value={copy.noscript} />
      </p>
      <div class={styles.router}>
        <div class={styles.kinds}>
          <KindList label={copy.kindsLabel} groups={kindGroups} onSelect={select} />
        </div>
        <div class={styles.panel} ref={panelRef} id="feedback-form">
          {panel}
        </div>
      </div>
    </section>
  );
}
