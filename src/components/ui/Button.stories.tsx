import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Get started', href: '#' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'primary'] },
    size: { control: 'inline-radio', options: ['md', 'lg'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };

export const Default: Story = {};

export const DefaultLarge: Story = { args: { size: 'lg', children: 'View benchmarks' } };

export const AsButton: Story = { args: { href: undefined, children: 'Button element' } };

export const Korean: Story = {
  args: { variant: 'primary', children: '시작하기' },
  globals: { locale: 'ko' },
};

export const CtaRow: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
      <Button variant="primary" href="#">
        Get started
      </Button>
      <Button size="lg" href="#">
        View benchmarks
      </Button>
    </div>
  ),
};
