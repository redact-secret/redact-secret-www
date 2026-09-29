import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { Handoff } from './Handoff';

const url = 'https://github.com/redact-secret/redact-secret/issues/new?template=bug-report.yml&title=%5Bbug%5D+example';

const meta: Meta = {
  title: 'Community/Handoff',
  component: Handoff,
  render: (args, { globals }) => {
    const locale = globals.locale as Locale;
    return <Handoff locale={locale} copy={content[locale].community.handoff} status="idle" hits={[]} url={url} urlLimit={8000} reasons={[]} {...args} />;
  },
};

export default meta;
type Story = StoryObj;

export const Idle: Story = { args: { reasons: ['the safety checkbox is ticked'] } };
export const Clean: Story = { args: { status: 'clean' } };
export const Found: Story = {
  args: {
    status: 'found',
    hits: [{ field: 'repro', label: 'Minimal synthetic reproduction', type: 'contextual_secret', line: 2, col: 9, length: 31 }],
    reasons: ['the possible secrets are removed'],
  },
};
export const TooLong: Story = { args: { status: 'clean', url: `${url}${'x'.repeat(8200)}`, reasons: ['the address is short enough for GitHub'] } };
export const CheckFailed: Story = { args: { status: 'failed', reasons: ['the check has run'], fallbackHref: url } };
