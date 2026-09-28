import type { Meta, StoryObj } from '@storybook/preact-vite';
import { evidence } from '../../slots';
import { Grid } from './Grid';
import { StatTile } from './StatTile';

const meta = {
  title: 'Architecture/StatTile',
  component: StatTile,
  args: { value: 0, children: 'Network calls, file reads, environment lookups or telemetry inside the core.' },
} satisfies Meta<typeof StatTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};
export const Budgets: Story = {
  globals: { locale: 'ko' },
  render: () => (
    <Grid cols={4}>
      <StatTile value={evidence.adapterBudgets.depth}>최대 깊이</StatTile>
      <StatTile value={evidence.adapterBudgets.arrayLength}>최대 배열 길이</StatTile>
      <StatTile value={evidence.adapterBudgets.objectKeys}>최대 객체 키</StatTile>
      <StatTile value={evidence.adapterBudgets.leaves}>최대 총 잎 수</StatTile>
    </Grid>
  ),
};
