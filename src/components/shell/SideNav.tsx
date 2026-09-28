import { useEffect, useRef } from 'preact/hooks';
import { Button } from '../ui';
import type { SiteContent } from '../../content';
import type { Locale } from '../../i18n';
import { NavLinks } from './NavLinks';
import { ShellControls } from './ShellControls';
import styles from './SideNav.module.css';

export const sideNavId = 'side-nav';

export type SideNavProps = {
  locale: Locale;
  copy: SiteContent['shell'];
  open: boolean;
  onClose: () => void;
};

/**
 * The header's nav, language, and theme controls for widths below 1040px.
 * A modal <dialog>: focus is trapped, Escape and the backdrop close it.
 */
export function SideNav({ locale, copy, open, onClose }: SideNavProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      id={sideNavId}
      class={styles.panel}
      aria-label={copy.mainNavLabel}
      onClose={onClose}
      onClick={(event) => {
        // A click on the dialog element itself is a click on the backdrop.
        if (event.target === ref.current) onClose();
      }}
    >
      <div class={styles.inner}>
        <div class={styles.top}>
          <span class="eyebrow">{copy.menu}</span>
          <Button onClick={onClose}>{copy.closeMenu}</Button>
        </div>
        <nav aria-label={copy.mainNavLabel}>
          <NavLinks links={copy.nav} direction="vertical" onNavigate={onClose} />
        </nav>
        <div class={styles.controls}>
          <ShellControls locale={locale} copy={copy} />
        </div>
      </div>
    </dialog>
  );
}
