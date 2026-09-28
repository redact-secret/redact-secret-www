import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { Footer } from './Footer';

const meta: Meta = {
  title: 'Shell/Footer',
  component: Footer,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => {
    const locale = globals.locale as Locale;
    return <Footer locale={locale} copy={content[locale].footer} />;
  },
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
