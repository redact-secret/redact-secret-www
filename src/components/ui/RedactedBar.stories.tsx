import type { Meta, StoryObj } from '@storybook/preact-vite';
import { RedactedBar } from './RedactedBar';

const meta = {
  title: 'UI/RedactedBar',
  component: RedactedBar,
  args: { label: 'redacted credential value' },
} satisfies Meta<typeof RedactedBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InCode: Story = {
  render: (args) => (
    <p class="mono">
      API_KEY=<RedactedBar {...args} />
    </p>
  ),
};
