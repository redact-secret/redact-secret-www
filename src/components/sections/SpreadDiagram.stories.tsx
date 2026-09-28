import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { SpreadDiagram } from './SpreadDiagram';

const meta: Meta = {
  title: 'Sections/Parts/SpreadDiagram',
  component: SpreadDiagram,
  render: (_args, { globals }) => <SpreadDiagram copy={content[globals.locale as Locale].home.problem} />,
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
