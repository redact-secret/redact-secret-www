import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { slots } from '../../slots';
import { IntegrationsSection } from './IntegrationsSection';

const meta: Meta = {
  title: 'Sections/3 Integrations',
  component: IntegrationsSection,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => (
    <IntegrationsSection copy={content[globals.locale as Locale].integrations} slots={slots} />
  ),
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
export const Dark: Story = { globals: { theme: 'dark' } };
