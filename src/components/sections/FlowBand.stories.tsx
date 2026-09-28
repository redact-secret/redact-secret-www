import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { FlowBand } from './FlowBand';

const meta: Meta = {
  title: 'Sections/Parts/FlowBand',
  component: FlowBand,
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => {
    const { boundary } = content[globals.locale as Locale];
    return (
      <div style={{ background: 'var(--brand-green)', padding: 'var(--space-8)' }}>
        <FlowBand label={boundary.flowLabel} steps={boundary.flow} />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
export const Stacked: Story = { globals: { viewport: { value: 'mobile1' } } };
