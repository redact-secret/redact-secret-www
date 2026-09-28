import type { Meta, StoryObj } from '@storybook/preact-vite';
import type { Locale } from '../i18n';
import { Home } from './Home';

const meta: Meta = {
  title: 'Pages/Landing',
  component: Home,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => <Home locale={globals.locale as Locale} />,
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
export const EnglishDark: Story = { globals: { theme: 'dark' } };
export const KoreanMobile: Story = { globals: { locale: 'ko', viewport: { value: 'mobile1' } } };
