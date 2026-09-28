import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';

import { EvidenceSection } from './EvidenceSection';

const meta: Meta = {
  title: 'Sections/6 Evidence',
  component: EvidenceSection,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => {
    const c = content[globals.locale as Locale].home;
    return <EvidenceSection copy={c.evidence} />;
  },
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
export const Dark: Story = { globals: { theme: 'dark' } };

/** Launch option: the routing table removed, layout unchanged. */
export const WithoutRoutingTable: Story = {
  render: (_args, { globals }) => (
    <EvidenceSection copy={content[globals.locale as Locale].home.evidence} showRouting={false} />
  ),
};
