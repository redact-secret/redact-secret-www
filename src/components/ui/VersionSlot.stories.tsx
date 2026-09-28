import type { Meta, StoryObj } from '@storybook/preact-vite';
import { slots } from '../../slots';
import { VersionSlot } from './VersionSlot';

const meta = {
  title: 'UI/VersionSlot',
  component: VersionSlot,
} satisfies Meta<typeof VersionSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Pinned at build',
    children: (
      <>
        <b>{slots.core.npm}</b> is the current beta, observed on the registries <b>{slots.core.observedAt}</b>.
      </>
    ),
  },
};
