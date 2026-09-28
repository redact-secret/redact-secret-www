import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Logo } from './Logo';

const meta = {
  title: 'UI/Logo',
  component: Logo,
  args: { href: '#' },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = { globals: { theme: 'light' } };
export const Dark: Story = { globals: { theme: 'dark' } };
