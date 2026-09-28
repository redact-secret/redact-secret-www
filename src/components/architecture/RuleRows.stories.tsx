import type { Meta, StoryObj } from '@storybook/preact-vite';
import { RuleRows } from './RuleRows';

const meta = {
  title: 'Architecture/RuleRows',
  component: RuleRows,
  args: {
    rows: [
      { term: '1 · 심각도', body: <>경고만 할 후보는 차단할 후보를 밀어낼 수 없습니다. <b>등급보다도 우선</b>합니다.</> },
      { term: '2 · 등급', body: 'private key > provider > structural > contextual > entropy.' },
      { term: '3 · 확신', body: 'high, medium, low.' },
      { term: '4 · 폭', body: '좁은 범위가 이깁니다.' },
    ],
  },
} satisfies Meta<typeof RuleRows>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { globals: { locale: 'ko' } };
export const Stacked: Story = { globals: { locale: 'ko', viewport: { value: 'mobile1' } } };
