import type { Meta, StoryObj } from '@storybook/preact-vite';
import { architecturePages, type ArchitecturePageId } from '../content/architecture/pages';
import type { Locale } from '../i18n';
import { Architecture } from './Architecture';

type Args = { page: ArchitecturePageId };

const meta: Meta<Args> = {
  title: 'Pages/Architecture',
  parameters: { layout: 'fullscreen' },
  argTypes: { page: { control: 'select', options: architecturePages.map((p) => p.id) } },
  args: { page: 'overview' },
  render: ({ page }, { globals }) => <Architecture locale={globals.locale as Locale} id={page} />,
};

export default meta;
type Story = StoryObj<Args>;

export const Hub: Story = {};
export const HubKorean: Story = { globals: { locale: 'ko' } };
export const DetectionKorean: Story = { args: { page: 'detection' }, globals: { locale: 'ko' } };
/** A Korean-only page at an /en/ URL: the language label sits above the body. */
export const DetectionAtEnglishUrl: Story = { args: { page: 'detection' } };
export const SupportClaimsDark: Story = { args: { page: 'support-claims' }, globals: { locale: 'ko', theme: 'dark' } };
export const EvaluationMethodsMobile: Story = {
  args: { page: 'evaluation-methods' },
  globals: { locale: 'ko', viewport: { value: 'mobile1' } },
};
