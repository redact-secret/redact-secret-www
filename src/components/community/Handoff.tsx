import type { CommunityCopy } from '../../content';
import { formatNumber, type Locale } from '../../i18n';
import { plainText, Rich } from '../ui/Rich';
import styles from './Handoff.module.css';

export type CheckStatus = 'idle' | 'loading' | 'clean' | 'found' | 'failed' | 'stale';

/** Metadata about one finding: where and what kind — never the value. */
export type CheckHit = { field: string; label: string; type: string; line: number; col: number; length: number };

export type HandoffProps = {
  locale: Locale;
  copy: CommunityCopy['handoff'];
  status: CheckStatus;
  hits: readonly CheckHit[];
  /** The prefilled GitHub address. */
  url: string;
  urlLimit: number;
  /** Why Continue is off; empty when it is on. */
  reasons: readonly string[];
  /** A blank form, offered only when the check cannot run. */
  fallbackHref?: string;
};

const cells = 20;

/** Bar length stands for the finding's length, in five steps; the value itself is never drawn. */
function lengthStep(n: number) {
  return n <= 8 ? 1 : n <= 16 ? 2 : n <= 32 ? 3 : n <= 64 ? 4 : 5;
}

const Icon = ({ ok }: { ok: boolean }) =>
  ok ? (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.5L15 14H1z" fill="none" stroke="currentColor" stroke-width="1.6" />
      <path d="M8 6v4M8 11.5v1.5" stroke="currentColor" stroke-width="1.6" />
    </svg>
  );

/**
 * The check's verdict and the hand-off: which GitHub address Continue opens,
 * and why it is off. Continue is the page's one brand-green element.
 */
export function Handoff({ locale, copy, status, hits, url, urlLimit, reasons, fallbackHref }: HandoffProps) {
  const verdict =
    status === 'found'
      ? { verdict: hits.length === 1 ? copy.foundOne : plainText(copy.foundMany, { count: formatNumber(locale, hits.length) }), body: copy.foundBody }
      : copy[status];
  const tone = status === 'clean' ? styles.ok : status === 'found' || status === 'failed' || status === 'stale' ? styles.bad : styles.idle;
  const over = url.length > urlLimit;
  const filled = Math.min(cells, Math.ceil((url.length / urlLimit) * cells));
  const blocked = reasons.length > 0;

  return (
    <section class={styles.handoff} aria-labelledby="handoff-title">
      <h3 class="h3" id="handoff-title">
        {copy.title}
      </h3>

      <div class={`${styles.scan} ${tone}`} role="status">
        <div class={styles.verdict}>
          {(status === 'clean' || status === 'found' || status === 'failed' || status === 'stale') && <Icon ok={status === 'clean'} />}
          {verdict.verdict}
        </div>
        <div>
          <Rich value={verdict.body} />
        </div>
        {status === 'found' && (
          <ul class={styles.hits}>
            {hits.map((h, i) => (
              <li key={`${h.field}-${h.line}-${h.col}-${i}`}>
                <b>{h.label}</b>
                <span class="mono">{plainText(copy.position, { line: h.line, col: h.col })}</span>
                <span class={styles.chip}>{h.type}</span>
                <span
                  class={`${styles.bar} ${styles[`len${lengthStep(h.length)}`]}`}
                  role="img"
                  aria-label={plainText(copy.length, { n: h.length })}
                />
                <span class="mono" aria-hidden="true">
                  {plainText(copy.length, { n: h.length })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div class={styles.urlbox}>
        <div class={styles.meta}>
          <span>{copy.urlLabel}</span>
          <span>{plainText(copy.urlLength, { used: formatNumber(locale, url.length), max: formatNumber(locale, urlLimit) })}</span>
        </div>
        <div class={`${styles.meter} ${over ? styles.over : ''}`} aria-hidden="true">
          {Array.from({ length: cells }, (_, i) => (
            <span key={i} class={i < filled ? styles.on : undefined} />
          ))}
        </div>
        {hits.length ? (
          <div class={`${styles.url} ${styles.hidden}`}>{copy.urlHidden}</div>
        ) : (
          <div class={styles.url} tabIndex={0}>
            {url}
          </div>
        )}
      </div>

      {blocked && (
        <div class={styles.blocked}>
          <p class="small">{copy.blockedBy}</p>
          <ul class={styles.todo}>
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div class={styles.actions}>
        {blocked ? (
          <a class={`${styles.go} ${styles.off}`} role="link" aria-disabled="true">
            {copy.go}
          </a>
        ) : (
          <a class={styles.go} href={url} target="_blank" rel="noopener noreferrer">
            {copy.go}
            <span aria-hidden="true"> ↗</span>
          </a>
        )}
        {fallbackHref && (
          <a class="small" href={fallbackHref} target="_blank" rel="noopener noreferrer">
            {copy.fallback}
          </a>
        )}
      </div>
      <p class={`tiny ${styles.privacy}`}>
        <Rich value={copy.privacy} />
      </p>
    </section>
  );
}
