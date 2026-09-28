import type { Meta, StoryObj } from '@storybook/preact-vite';
import { CodeBlock } from './CodeBlock';
import { Tabs } from './Tabs';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Runtimes: Story = {
  args: {
    label: 'Runtime',
    items: [
      { id: 'js', label: 'JavaScript', content: <CodeBlock code="npm install @redact-secret/core" /> },
      { id: 'py', label: 'Python', content: <CodeBlock code="python -m pip install redact-secret" /> },
      { id: 'cli', label: 'CLI', content: <CodeBlock code="redact-secret --redact" /> },
    ],
  },
};

export const SecondSelected: Story = {
  args: { ...Runtimes.args, defaultId: 'py' },
};
