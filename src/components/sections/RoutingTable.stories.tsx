import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { RoutingTable } from './RoutingTable';

const meta: Meta = {
  title: 'Sections/Parts/RoutingTable',
  component: RoutingTable,
  render: (_args, { globals }) => <RoutingTable copy={content[globals.locale as Locale].evidence.routing} />,
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
