import type { Meta, StoryObj } from '@storybook/preact-vite';
import { RedactedOutput } from './RedactedOutput';

const meta = {
  title: 'Playground/RedactedOutput',
  component: RedactedOutput,
} satisfies Meta<typeof RedactedOutput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Numbered: Story = {
  args: {
    segments: [
      { text: 'API_KEY=' },
      { placeholder: '<SECRET_1>', findingId: 'finding-1' },
      { text: '\nAuthorization: Bearer ' },
      { placeholder: '<SECRET_2>', findingId: 'finding-2' },
    ],
  },
};

export const Typed: Story = {
  args: {
    segments: [
      { text: 'API_KEY=' },
      { placeholder: '<CONTEXTUAL_SECRET_1>', findingId: 'finding-1' },
      { text: '\nAuthorization: Bearer ' },
      { placeholder: '<BEARER_TOKEN_2>', findingId: 'finding-2' },
    ],
  },
};

export const OneActive: Story = { args: { ...Numbered.args, activeId: 'finding-2' } };
