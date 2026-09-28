import { SegmentedControl } from '../ui';
import type { SiteContent } from '../../content';
import { homePath, localeNames, locales, type Locale } from '../../i18n';
import { useTheme, type Theme } from './useTheme';

export type Alternates = Partial<Record<Locale, string>>;

type Props = {
  locale: Locale;
  copy: SiteContent['shell'];
  /** This page in each locale; defaults to that locale's home. */
  alternates?: Alternates;
};

/** Language (links — the URL changes) and theme (buttons) switches. */
export function ShellControls({ locale, copy, alternates }: Props) {
  const [theme, setTheme] = useTheme();
  return (
    <>
      <SegmentedControl
        label={copy.languageLabel}
        value={locale}
        options={locales.map((l) => ({ value: l, label: localeNames[l], href: alternates?.[l] ?? homePath(l), hrefLang: l }))}
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
