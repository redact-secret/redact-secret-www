import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Band } from './Band';
import { SectionHeader } from './SectionHeader';

const meta = {
  title: 'UI/Band',
  component: Band,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Band>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <SectionHeader eyebrow="Public evidence" title="Claims you can inspect." />,
  },
};

export const Brand: Story = {
  args: {
    tone: 'brand',
    children: (
      <SectionHeader
        eyebrow="How it works · Control"
        title="Your data stays in your process."
        lede="Detection and redaction run locally, without sending text to a scanning service."
      />
    ),
  },
};
