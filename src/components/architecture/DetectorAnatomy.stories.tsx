import type { Meta, StoryObj } from '@storybook/preact-vite';
import { DetectorAnatomy } from './DetectorAnatomy';

const meta = {
  title: 'Architecture/DetectorAnatomy',
  component: DetectorAnatomy,
  args: {
    parts: [
      { label: 'Prefix', value: 'ghp_', desc: '문자열 하나' },
      { label: 'Alphabet', value: 'A–Z a–z 0–9', desc: '고정된 바이트 클래스 중 하나' },
      { label: 'Run', value: 'exactly 36', desc: '정확히 n, 또는 n 이상' },
      { label: 'Validator', value: 'none', desc: '선택적 추가 검사' },
    ],
  },
} satisfies Meta<typeof DetectorAnatomy>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { globals: { locale: 'ko' } };
export const Folded: Story = { globals: { locale: 'ko', viewport: { value: 'mobile1' } } };
