import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import { feedbackKinds, type FeedbackForm } from '../../content/community';
import type { Locale } from '../../i18n';
import { FormPanel } from './FormPanel';

const form = (key: string) => feedbackKinds.find((k) => k.key === key) as FeedbackForm;

const meta: Meta = {
  title: 'Community/FormPanel',
  component: FormPanel,
  render: (args, { globals }) => {
    const copy = content[globals.locale as Locale].community;
    const f = form(args.form ?? 'false-positive');
    return (
      <FormPanel
        form={f}
        copy={copy.form}
        formCopy={copy.forms[f.key as keyof typeof copy.forms]}
        values={args.values ?? {}}
        ack={false}
        flagged={new Set(args.flagged ?? [])}
        version="0.1.0-beta.10"
      />
    );
  },
};

export default meta;
type Story = StoryObj;

export const IssueForm: Story = {};
export const Flagged: Story = { args: { values: { 'repro-shape': 'API_KEY=SYNTHETIC_REVOKED_CONTEXT_VALUE' }, flagged: ['repro-shape'] } };
export const DiscussionForm: Story = { args: { form: 'question' } };
