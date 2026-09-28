import type { Meta, StoryObj } from '@storybook/preact-vite';
import { PageHead } from './PageHead';

const meta = {
  title: 'Architecture/PageHead',
  component: PageHead,
  args: {
    eyebrow: '02 · 탐지 방식',
    title: '모든 탐지기가 같은 질문에 답합니다 — 얼마나 확신하며, 왜인가?',
    lede: '‘왜’는 정확히 다섯 종류뿐입니다. 그 다섯에 순위가 있고, 그 순위가 나머지 전부를 결정합니다.',
  },
} satisfies Meta<typeof PageHead>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SubPage: Story = { globals: { locale: 'ko' } };
export const Hub: Story = {
  args: {
    display: true,
    eyebrow: 'Architecture',
    title: 'The rules are written once',
    lede: 'Detection, overlap resolution, policy and redaction happen inside one Rust core.',
  },
};
