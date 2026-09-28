import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { slots } from '../../slots';
import { QuickstartSection } from './QuickstartSection';

const meta: Meta = {
  title: 'Sections/4 Quickstart',
  component: QuickstartSection,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => {
    const c = content[globals.locale as Locale];
    return <QuickstartSection copy={c.quickstart} core={slots.core} />;
  },
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
export const Dark: Story = { globals: { theme: 'dark' } };
