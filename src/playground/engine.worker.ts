/// <reference lib="webworker" />
/**
 * One engine instance per worker. The core fixes its PII activation when it
 * initializes (a different selection later fails with
 * PII_ACTIVATION_CONFLICT), so each PII mode gets its own worker.
 *
 * Runs in the visitor's browser like the rest of the page: text posted here
 * never leaves the tab (ADR 0001, ADR 0002).
 */
import * as core from '@redact-secret/core';
import type { PlaceholderFormatter, SecretFinding } from '@redact-secret/core';
import { limits, type FromWorker, type PlaceholderStyle, type Segment, type ToWorker } from './protocol';

declare const self: DedicatedWorkerGlobalScope;

const post = (message: FromWorker) => self.postMessage(message);

const formatters: Record<PlaceholderStyle, PlaceholderFormatter> = {
  numbered: core.defaultPlaceholderFormatter,
  typed: core.typedPlaceholderFormatter,
};

const replacedActions = new Set(['redact', 'block']);

/**
 * Splits the output into plain text and placeholders so the UI can render
 * chips. Placeholders are captured from the formatter itself; if the
 * reassembled text ever disagrees with the core's output, the core wins.
 */
function toSegments(input: string, text: string, findings: readonly SecretFinding[], placeholders: string[]) {
  const replaced = findings.filter((f) => replacedActions.has(f.action)).sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let pos = 0;
  replaced.forEach((finding, i) => {
    if (finding.start > pos) segments.push({ text: input.slice(pos, finding.start) });
    segments.push({ placeholder: placeholders[i] ?? '', findingId: finding.id });
    pos = finding.end;
  });
  if (pos < input.length) segments.push({ text: input.slice(pos) });
  const joined = segments.map((s) => ('text' in s ? s.text : s.placeholder)).join('');
  return joined === text ? segments : [{ text }];
}

self.onmessage = async (event: MessageEvent<ToWorker>) => {
  const message = event.data;

  if (message.type === 'init') {
    try {
      await core.initialize({ pii: message.pii });
      post({ type: 'ready', version: core.VERSION, artifact: core.artifact(), activation: core.piiActivation() });
    } catch (error) {
      post({ type: 'init-failed', code: error instanceof core.SecretScanError ? error.code : undefined });
    }
    return;
  }

  const placeholders: string[] = [];
  const placeholderFormatter: PlaceholderFormatter = (finding, context) => {
    const placeholder = formatters[message.style](finding, context);
    placeholders[context.placeholderIndex - 1] = placeholder;
    return placeholder;
  };
  try {
    const { text, findings } = core.scanAndRedact(message.input, { placeholderFormatter, limits });
    // Findings are frozen objects; copy to plain data for postMessage.
    const plain = findings.map((f) => ({ ...f }));
    post({
      type: 'result',
      id: message.id,
      result: { ok: true, text, findings: plain, segments: toSegments(message.input, text, findings, placeholders) },
    });
  } catch (error) {
    // SecretScanError carries only a fixed code — never input.
    post({
      type: 'result',
      id: message.id,
      result: { ok: false, code: error instanceof core.SecretScanError ? error.code : 'UNKNOWN' },
    });
  }
};
