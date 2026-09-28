import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { AppShell } from './AppShell';

const meta: Meta = {
  title: 'Shell/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => {
    const locale = globals.locale as Locale;
    return (
      <AppShell content={content[locale]}>
        <div class="wrap" style={{ paddingBlock: 'var(--space-16)', minHeight: '50vh' }}>
          <p class="lede">Page content goes here.</p>
        </div>
      </AppShell>
    );
  },
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
