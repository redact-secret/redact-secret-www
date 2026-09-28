import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { Header } from './Header';

const meta: Meta = {
  title: 'Shell/Header',
  component: Header,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => {
    const locale = globals.locale as Locale;
    return <Header locale={locale} copy={content[locale].shell} />;
  },
};

export default meta;
type Story = StoryObj;

export const Desktop: Story = {};

export const Korean: Story = { globals: { locale: 'ko' } };

/** Below 1040px the nav collapses behind "Menu" (spec § 12). */
export const Narrow: Story = {
  globals: { viewport: { value: 'tablet' } },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1' } },
};
