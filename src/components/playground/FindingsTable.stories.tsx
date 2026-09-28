import type { Meta, StoryObj } from '@storybook/preact-vite';
import type { SecretFinding } from '@redact-secret/core';
import { content } from '../../content';
import { FindingsTable } from './FindingsTable';

const findings: SecretFinding[] = [
  { id: 'finding-1', type: 'contextual_secret', detector: 'generic-token', confidence: 'high', obfuscation: 'none', action: 'redact', start: 8, end: 39 },
  { id: 'finding-2', type: 'bearer_token', detector: 'bearer-token', confidence: 'high', obfuscation: 'none', action: 'redact', start: 62, end: 93 },
];

const meta = {
  title: 'Playground/FindingsTable',
  component: FindingsTable,
  args: { findings, columns: content.en.home.playground.columns, label: 'Findings' },
} satisfies Meta<typeof FindingsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const English: Story = {};
export const Korean: Story = {
  args: { columns: content.ko.home.playground.columns, label: '탐지 결과' },
  globals: { locale: 'ko' },
};
