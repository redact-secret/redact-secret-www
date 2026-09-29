import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { EngineLoadError, type EngineLoader } from '../../playground/engine';
import { CommunityDesk } from './CommunityDesk';

const never: EngineLoader = () => new Promise(() => {});
const failing: EngineLoader = () => Promise.reject(new EngineLoadError('init', 'INITIALIZATION_FAILED'));
const stale: EngineLoader = () => Promise.reject(new EngineLoadError('stale'));

const filled = {
  title: 'write("") throws in streaming mode',
  'package-version': '@redact-secret/core@0.1.0-beta.10',
  'binding-runtime': 'Node 22 on Linux x64',
  'what-happened': 'write("") throws RangeError; I expected a no-op.',
  repro: 'const s = createSanitizer({ stream: true });\ns.write("");',
};

const meta: Meta = {
  title: 'Community/CommunityDesk',
  component: CommunityDesk,
  parameters: { layout: 'fullscreen' },
  render: (args, { globals }) => {
    const locale = globals.locale as Locale;
    return (
      <div class="wrap" style={{ paddingBlock: 'var(--space-8)' }}>
        <CommunityDesk locale={locale} copy={content[locale].community} version="0.1.0-beta.10" {...args} />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj;

/** The real engine: type the synthetic fixture into a field to see it found. */
export const Empty: Story = {};
export const EmptyKorean: Story = { globals: { locale: 'ko' } };
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
export const Filled: Story = { args: { initialValues: filled } };
export const FixtureFound: Story = { args: { initialValues: { ...filled, repro: 'API_KEY=SYNTHETIC_REVOKED_CONTEXT_VALUE' } } };
export const Loading: Story = { args: { initialValues: filled, loadEngine: never } };
export const CheckFailed: Story = { args: { initialValues: filled, loadEngine: failing } };
export const StaleAfterDeploy: Story = { args: { initialValues: filled, loadEngine: stale } };
export const Discussion: Story = { args: { initialKey: 'question' } };
export const Security: Story = { args: { initialKey: 'security' } };
