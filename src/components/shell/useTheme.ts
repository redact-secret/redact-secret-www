import { useEffect, useState } from 'preact/hooks';

export type Theme = 'light' | 'dark';

const storageKey = 'rs-theme';

/**
 * Three states (design spec § 12): an explicit choice (`data-theme`), the OS
 * preference, and nothing yet known — `undefined` during prerender, so the
 * static HTML never claims a theme it cannot know.
 */
export function useTheme(): [Theme | undefined, (theme: Theme) => void] {
  const [theme, setThemeState] = useState<Theme | undefined>(undefined);

  useEffect(() => {
    const explicit = document.documentElement.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') {
      setThemeState(explicit);
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setThemeState(media.matches ? 'dark' : 'light');
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  function setTheme(next: Theme) {
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Private mode or blocked storage: the choice lasts for this page only.
    }
    setThemeState(next);
  }

  return [theme, setTheme];
}
