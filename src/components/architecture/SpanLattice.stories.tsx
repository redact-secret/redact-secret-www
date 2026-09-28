import type { Meta, StoryObj } from '@storybook/preact-vite';
import { SpanLattice } from './SpanLattice';

const meta = {
  title: 'Architecture/SpanLattice',
  component: SpanLattice,
  args: {
    passLabel: '통과',
    failLabel: '실패',
    legend: { hit: '가려진 비밀값 바이트', leak: '새어 나간 비밀값 바이트', over: '함께 잡힌 무고한 바이트' },
    rows: [
      { code: 'Exact', pass: true, description: '비밀값 바이트를 정확히 가림', cells: ['none', 'none', 'hit', 'hit', 'hit', 'hit', 'none', 'none'] },
      { code: 'Covered', pass: true, description: '허용 범위 안에서 조금 넓게 가림', cells: ['none', 'over', 'hit', 'hit', 'hit', 'hit', 'over', 'none'] },
      { code: 'Overbroad', pass: false, description: '주변 바이트까지 넓게 삼킴', cells: ['over', 'over', 'hit', 'hit', 'hit', 'hit', 'over', 'over'] },
      { code: 'Partial', pass: false, description: '비밀값 바이트 하나가 새어 나감', cells: ['none', 'none', 'hit', 'hit', 'hit', 'leak', 'none', 'none'] },
      { code: 'Miss', pass: false, description: '비밀값 바이트가 전부 새어 나감', cells: ['none', 'none', 'leak', 'leak', 'leak', 'leak', 'none', 'none'] },
    ],
  },
} satisfies Meta<typeof SpanLattice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { globals: { locale: 'ko' } };
