import type { Meta, StoryObj } from '@storybook/preact-vite';
import { snippets } from '../../content/shared';
import { CodeBlock } from './CodeBlock';

const meta = {
  title: 'UI/CodeBlock',
  component: CodeBlock,
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Install: Story = {
  args: { code: snippets.js.install },
};

export const WithComment: Story = {
  args: {
    code: snippets.js.code,
  },
};

export const LongLineScrolls: Story = {
  args: {
    code: "printf '%s\\n' 'API_KEY=SYNTHETIC_REVOKED_CONTEXT_VALUE' | redact-secret --redact --some-very-long-flag --and-another-one",
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
