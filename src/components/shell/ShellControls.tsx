import { SegmentedControl } from '../ui';
import type { SiteContent } from '../../content';
import { localeNames, locales, type Locale } from '../../i18n';
import { useTheme, type Theme } from './useTheme';

type Props = {
  locale: Locale;
  copy: SiteContent['shell'];
};

/** Language (links — the URL changes) and theme (buttons) switches. */
export function ShellControls({ locale, copy }: Props) {
  const [theme, setTheme] = useTheme();
  return (
    <>
      <SegmentedControl
        label={copy.languageLabel}
        value={locale}
        options={locales.map((l) => ({ value: l, label: localeNames[l], href: `/${l}/`, hrefLang: l }))}
      />
      <SegmentedControl<Theme>
        label={copy.themeLabel}
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'light', label: copy.themeLight },
          { value: 'dark', label: copy.themeDark },
        ]}
      />
    </>
  );
}
