import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Ruled } from './Ruled';

const meta = {
  title: 'UI/Ruled',
  component: Ruled,
} satisfies Meta<typeof Ruled>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <h3 class="h3">Why the version is written out</h3>
        <p class="small">Package state is read from the release record at build time.</p>
      </>
    ),
  },
};
