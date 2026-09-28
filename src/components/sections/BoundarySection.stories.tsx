import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';

import { BoundarySection } from './BoundarySection';

const meta: Meta = {
  title: 'Sections/5 Boundary',
  component: BoundarySection,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => {
    const c = content[globals.locale as Locale].home;
    return <BoundarySection locale={globals.locale as Locale} copy={c.boundary} />;
  },
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
export const Dark: Story = { globals: { theme: 'dark' } };
