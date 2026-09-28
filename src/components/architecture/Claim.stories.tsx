import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Claim } from './Claim';

const meta = {
  title: 'Architecture/Claim',
  component: Claim,
  args: {
    children: '엔트로피는 아무것도 승격시키지 않습니다.',
    sub: '위 등급의 기준선을 올리거나 내릴 뿐입니다. 이 한 가지 결정이 오탐이 적은 이유입니다.',
  },
} satisfies Meta<typeof Claim>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Korean: Story = { globals: { locale: 'ko' } };
export const English: Story = {
  args: {
    children: 'One core, four surfaces.',
    sub: 'Each language gets a translator, never its own copy of the rules.',
  },
};
export const LineOnly: Story = { args: { children: 'detect → resolve → policy → redact', sub: undefined } };
