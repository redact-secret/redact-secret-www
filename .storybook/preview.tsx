import type { Preview } from '@storybook/preact-vite';
import { installSiteData, type SiteData } from '../src/site-data';
import release from '../data/release.json';
import evidence from '../data/evidence.json';
import integrations from '../data/integrations.json';
import '../src/tokens.css';
import '../src/style.css';

// Stories render components that read the slots; give them the committed data.
installSiteData({ release, evidence, integrations } as unknown as SiteData);

const preview: Preview = {
  globalTypes: {
    locale: {
      description: 'Page locale',
      toolbar: { title: 'Locale', icon: 'globe', items: ['en', 'ko'], dynamicTitle: true },
    },
    theme: {
      description: 'Color theme',
      toolbar: { title: 'Theme', icon: 'contrast', items: ['system', 'light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { locale: 'en', theme: 'system' },
  parameters: {
    backgrounds: { disable: true },
    controls: { expanded: true },
  },
  decorators: [
    (Story, context) => {
      const root = document.documentElement;
      root.lang = context.globals.locale;
      if (context.globals.theme === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', context.globals.theme);
      return <Story />;
    },
  ],
};

export default preview;
