import type { Meta, StoryObj } from '@storybook/preact-vite';
import { useState } from 'preact/hooks';
import { SegmentedControl } from './SegmentedControl';

const meta = {
  title: 'UI/SegmentedControl',
  component: SegmentedControl,
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Theme: Story = {
  args: {
    label: 'Theme',
    options: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ],
    value: 'light',
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
  },
};

export const LanguageLinks: Story = {
  args: {
    label: 'Language',
    options: [
      { value: 'en', label: 'EN', href: '#en', hrefLang: 'en' },
      { value: 'ko', label: '한국어', href: '#ko', hrefLang: 'ko' },
    ],
    value: 'ko',
  },
};

export const NothingSelected: Story = {
  args: { ...Theme.args, value: undefined },
};
