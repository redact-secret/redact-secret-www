import type { Meta, StoryObj } from '@storybook/preact-vite';
import { DocSection } from './DocSection';

const meta = {
  title: 'Architecture/DocSection',
  component: DocSection,
  args: {
    eyebrow: 'Tier 3',
    title: '아무도 소유하지 않은 형식',
    lede: '벤더 패턴이 아니라 포맷입니다.',
    children: <p>규칙을 증명하는 의도적 예외가 하나 있습니다. 토큰의 내용을 읽는 유일한 지점입니다.</p>,
  },
} satisfies Meta<typeof DocSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { globals: { locale: 'ko' } };
export const TwoLedes: Story = {
  globals: { locale: 'ko' },
  args: { lede: ['첫 번째 문단입니다.', '두 번째 문단입니다.'] },
};
