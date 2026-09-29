import type { Meta, StoryObj } from '@storybook/preact-vite';
import { KindList } from './KindList';

const meta: Meta<typeof KindList> = {
  title: 'Community/KindList',
  component: KindList,
  args: {
    label: 'Kinds of feedback',
    groups: [
      {
        key: 'wrong',
        label: 'Something is wrong',
        items: [
          { key: 'bug', name: 'Bug report', where: 'A crash, an error, or bindings disagreeing', current: true },
          { key: 'false-positive', name: 'False positive', where: "Flagged or redacted, but it isn't a secret", current: false },
        ],
      },
      { key: 'security', label: 'Security', items: [{ key: 'security', name: 'Security vulnerability', where: 'Private advisory', current: false }] },
    ],
  },
};

export default meta;
export const Default: StoryObj<typeof KindList> = {};
