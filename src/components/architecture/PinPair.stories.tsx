import type { Meta, StoryObj } from '@storybook/preact-vite';
import { evidence } from '../../slots';
import { PinPair } from './PinPair';

const meta = {
  title: 'Architecture/PinPair',
  component: PinPair,
  args: {
    live: {
      label: '살아 있는 taxonomy',
      value: evidence.taxonomy.families,
      note: `${evidence.taxonomy.providers}개 공급자에 걸친 계열. benchmarks 저장소가 계속 움직입니다.`,
    },
    pinned: {
      label: '이 제품이 싣는 매트릭스',
      value: evidence.matrix.families,
      note: '얼어붙은 사본. 누군가 측정을 다시 돌려 핀을 갱신할 때만 바뀝니다.',
    },
  },
} satisfies Meta<typeof PinPair>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { globals: { locale: 'ko' } };
