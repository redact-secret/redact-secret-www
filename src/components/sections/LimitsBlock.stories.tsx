import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { LimitsBlock } from './LimitsBlock';

const meta: Meta = {
  title: 'Sections/Parts/LimitsBlock',
  component: LimitsBlock,
  render: (_args, { globals }) => <LimitsBlock copy={content[globals.locale as Locale].home.evidence.limits} />,
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
