import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';

import { FinalCtaSection } from './FinalCtaSection';

const meta: Meta = {
  title: 'Sections/7 Final CTA',
  component: FinalCtaSection,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => {
    const c = content[globals.locale as Locale];
    return <FinalCtaSection copy={c.final} />;
  },
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
export const Dark: Story = { globals: { theme: 'dark' } };
