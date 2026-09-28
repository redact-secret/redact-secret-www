import type { Meta, StoryObj } from '@storybook/preact-vite';
import { evidence } from '../../slots';
import { StatusBar } from './StatusBar';

const { status, families } = evidence.matrix;

const meta = {
  title: 'Architecture/StatusBar',
  component: StatusBar,
  args: {
    label: `Status of ${families} families`,
    segments: [
      { tone: 'success', count: status.stable, word: 'Stable', desc: 'Past the bar; safe to rely on' },
      { tone: 'danger', count: status.unsupported, word: 'Unsupported', desc: 'Listed anyway, with a reason' },
      { tone: 'warning', count: status.provisional, word: 'Provisional', desc: 'Useful, evidence incomplete' },
      { tone: 'info', count: status.pending, word: 'Pending', desc: 'Trust neither hits nor misses' },
    ],
  },
} satisfies Meta<typeof StatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = {};
export const Narrow: Story = { globals: { viewport: { value: 'mobile1' } } };
