/** Messages between the playground and its engine worker. */
import type { SecretFinding } from '@redact-secret/core';

export type PiiMode = 'off' | 'global' | 'us';
export type PlaceholderStyle = 'numbered' | 'typed';

export type Segment = { text: string } | { placeholder: string; findingId: string };

export type RunResult =
  | { ok: true; text: string; findings: readonly SecretFinding[]; segments: Segment[] }
  | { ok: false; code: string };

/** `initialize({ pii })` selectors per mode, as the core names them. */
export const piiSelectors: Record<PiiMode, string[]> = {
  off: [],
  global: ['pii'],
  us: ['pii:us'],
};

/** ADR 0001 § Bounded work. */
export const limits = { maxInputBytes: 32 * 1024, maxFindings: 1000 };

export type ToWorker =
  | { type: 'init'; pii: string[] }
  | { type: 'run'; id: number; input: string; style: PlaceholderStyle };

export type FromWorker =
  | { type: 'ready'; version: string; artifact: string; activation: string }
  | { type: 'init-failed'; code?: string }
  | { type: 'result'; id: number; result: RunResult };
