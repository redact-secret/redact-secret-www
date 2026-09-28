import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { EngineLoadError, type EngineLoader } from '../../playground/engine';
import { Playground } from './Playground';
import { PlaygroundSection } from './PlaygroundSection';

const never: EngineLoader = () => new Promise(() => {});
const failing: EngineLoader = () => Promise.reject(new EngineLoadError('init', 'INITIALIZATION_FAILED'));
const stale: EngineLoader = () => Promise.reject(new EngineLoadError('stale'));

const meta: Meta = {
  title: 'Playground/Playground',
  component: Playground,
  parameters: { layout: 'fullscreen' },
  render: (args, { globals }) => (
    <div class="wrap" style={{ paddingBlock: 'var(--space-8)' }}>
      <Playground copy={content[globals.locale as Locale].home.playground} eager {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj;

/** The real engine: @redact-secret/core as WebAssembly. */
export const Live: Story = {};
export const LiveKorean: Story = { globals: { locale: 'ko' } };
export const LiveMobile: Story = { globals: { viewport: { value: 'mobile1' } } };
/** PII opt-in on (Global + US): the same default text, more redacted. */
export const LivePiiOn: Story = { args: { initialPii: 'us' } };
export const Loading: Story = { args: { loadEngine: never } };
export const LoadFailed: Story = { args: { loadEngine: failing } };
/** Engine chunk gone (tab open across a deploy): reload, not retry. */
export const StaleAfterDeploy: Story = { args: { loadEngine: stale } };

export const Section: Story = {
  render: (_args, { globals }) => <PlaygroundSection copy={content[globals.locale as Locale].home.playground} />,
};
