import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';

import { ProblemSection } from './ProblemSection';

const meta: Meta = {
  title: 'Sections/2 Problem',
  component: ProblemSection,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => {
    const c = content[globals.locale as Locale];
    return <ProblemSection copy={c.problem} />;
  },
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
export const Dark: Story = { globals: { theme: 'dark' } };
