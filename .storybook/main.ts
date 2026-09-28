import type { StorybookConfig } from '@storybook/preact-vite';
import type { PluginOption } from 'vite';

// Storybook reuses vite.config.ts, but the site's prerender step needs
// index.html's entry script, which Storybook's preview build does not have.
const prerenderPlugins = new Set(['vite-prerender-plugin', 'serve-prerendered-html']);

function withoutPrerender(plugins: PluginOption[] = []): PluginOption[] {
  return plugins
    .map((p) => (Array.isArray(p) ? withoutPrerender(p) : p))
    .filter((p) => !(p && typeof p === 'object' && 'name' in p && prerenderPlugins.has(p.name)));
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: '@storybook/preact-vite',
  core: { disableTelemetry: true },
  viteFinal: (config) => ({ ...config, plugins: withoutPrerender(config.plugins) }),
};

export default config;
