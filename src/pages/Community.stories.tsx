import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../content';
import type { Locale } from '../i18n';
import { Community } from './Community';

const meta: Meta = {
  title: 'Pages/Community',
  component: Community,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => {
    const locale = globals.locale as Locale;
    return <Community locale={locale} shell={content[locale].shell} copy={content[locale].community} />;
  },
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
export const EnglishDark: Story = { globals: { theme: 'dark' } };
export const KoreanMobile: Story = { globals: { locale: 'ko', viewport: { value: 'mobile1' } } };
