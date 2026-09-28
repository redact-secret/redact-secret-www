import type { Meta, StoryObj } from '@storybook/preact-vite';
import { PlaceholderChip } from './PlaceholderChip';

const meta = {
  title: 'UI/PlaceholderChip',
  component: PlaceholderChip,
  args: { children: '<SECRET_1>' },
} satisfies Meta<typeof PlaceholderChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InCode: Story = {
  render: (args) => (
    <p class="mono">
      API_KEY=<PlaceholderChip {...args} />
    </p>
  ),
};

export const Active: Story = { args: { active: true } };
