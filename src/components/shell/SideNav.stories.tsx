import type { Meta, StoryObj } from '@storybook/preact-vite';
import { useState } from 'preact/hooks';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { Button } from '../ui';
import { SideNav } from './SideNav';

const meta: Meta = {
  title: 'Shell/SideNav',
  component: SideNav,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => {
    const locale = globals.locale as Locale;
    const [open, setOpen] = useState(true);
    return (
      <div style={{ padding: 'var(--space-4)' }}>
        <Button onClick={() => setOpen(true)}>{content[locale].shell.header.menu}</Button>
        <SideNav locale={locale} copy={content[locale].shell.header} open={open} onClose={() => setOpen(false)} />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj;

export const Open: Story = {};

export const Korean: Story = { globals: { locale: 'ko' } };
