import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Pager } from './Pager';

const meta = {
  title: 'Architecture/Pager',
  component: Pager,
  args: {
    label: '아키텍처 페이지',
    prev: { kicker: '← 이전', title: '작동 방식', href: '#how-it-works' },
    next: { kicker: '다음 →', title: '지원 주장은 어떻게 만들어지나', href: '#support-claims' },
  },
} satisfies Meta<typeof Pager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Middle: Story = { globals: { locale: 'ko' } };
export const LastPage: Story = {
  globals: { locale: 'ko' },
  args: {
    prev: { kicker: '← 이전', title: '어댑터', href: '#adapters' },
    next: { kicker: '돌아가기 →', title: '아키텍처 개요', href: '#overview' },
  },
};
