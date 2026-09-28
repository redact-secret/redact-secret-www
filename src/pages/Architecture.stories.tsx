import type { Meta, StoryObj } from '@storybook/preact-vite';
import { architecturePages, type ArchitecturePageId } from '../content/architecture/pages';
import { content } from '../content';
import type { Locale } from '../i18n';
import { Architecture, type ArchitecturePageCopy } from './Architecture';

type Args = { page: ArchitecturePageId };

const meta: Meta<Args> = {
  title: 'Pages/Architecture',
  parameters: { layout: 'fullscreen' },
  argTypes: { page: { control: 'select', options: architecturePages.map((p) => p.id) } },
  args: { page: 'overview' },
  render: ({ page }, { globals }) => {
    const c = content[globals.locale as Locale];
    return (
      <Architecture
        locale={globals.locale as Locale}
        shell={c.shell}
        section={c.architecture.section}
        page={{ id: page, copy: c.architecture.pages[page] } as ArchitecturePageCopy}
      />
    );
  },
};

export default meta;
type Story = StoryObj<Args>;

export const Hub: Story = {};
export const HubKorean: Story = { globals: { locale: 'ko' } };
export const DetectionKorean: Story = { args: { page: 'detection' }, globals: { locale: 'ko' } };
export const DetectionEnglish: Story = { args: { page: 'detection' } };
export const SupportClaimsDark: Story = { args: { page: 'support-claims' }, globals: { locale: 'ko', theme: 'dark' } };
export const EvaluationMethodsMobile: Story = {
  args: { page: 'evaluation-methods' },
  globals: { locale: 'ko', viewport: { value: 'mobile1' } },
};
