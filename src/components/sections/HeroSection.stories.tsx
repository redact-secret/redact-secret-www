import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';

import { HeroSection } from './HeroSection';

const meta: Meta = {
  title: 'Sections/1 Hero',
  component: HeroSection,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => {
    const c = content[globals.locale as Locale];
    return <HeroSection copy={c.hero} />;
  },
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
export const Dark: Story = { globals: { theme: 'dark' } };
