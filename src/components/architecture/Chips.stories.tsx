import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Chips } from './Chips';

const meta = {
  title: 'Architecture/Chips',
  component: Chips,
  args: {
    label: '인식하고 건너뛰는 값',
    items: ['changeme', 'placeholder', 'redacted', '<your-key-here>', '${process.env.KEY}', 'op://vault/item/field'],
    struck: true,
  },
} satisfies Meta<typeof Chips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Excluded: Story = {};
export const Plain: Story = {
  args: { label: '알파벳', items: ['alnum', 'alnum-dash', 'hex', 'lower-hex', 'base64-body'], struck: false },
};
