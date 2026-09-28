import { Band, CodeBlock, Ruled, SectionHeader, Tabs, VersionSlot } from '../ui';
import type { SiteContent } from '../../content';
import { anchors, snippets } from '../../content/shared';
import type { CoreSlot } from '../../slots';
import styles from './QuickstartSection.module.css';

export type QuickstartSectionProps = {
  copy: SiteContent['quickstart'];
  core: CoreSlot;
};

/**
 * Block 4 — how do I install it? Install commands pin the version, and the
 * version slot beside them explains why (`latest` is not trusted, spec § 08).
 */
export function QuickstartSection({ copy, core }: QuickstartSectionProps) {
  const runtimes: { label: string; install?: string; code: string }[] = [
    snippets.js,
    snippets.python,
    snippets.cli,
  ];
  return (
    <Band id={anchors.firstRun} labelledBy="first-run-title">
      <SectionHeader id="first-run-title" eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} />
      <div class={styles.grid}>
        <div>
          <Tabs
            label={copy.tabsLabel}
            items={runtimes.map((runtime) => ({
              id: runtime.label.toLowerCase(),
              label: runtime.label,
              content: (
                <>
                  {runtime.install && <CodeBlock code={runtime.install} label={`${runtime.label} install`} />}
                  <CodeBlock code={runtime.code} label={`${runtime.label} example`} />
                </>
              ),
            }))}
          />
          <p class={`small ${styles.rust}`}>{copy.rustNote}</p>
        </div>
        <div class={styles.side}>
          <VersionSlot label={copy.pinLabel}>{copy.pin(core)}</VersionSlot>
          <Ruled>
            <h3 class="h3">{copy.why.title}</h3>
            <p class="small">{copy.why.body}</p>
          </Ruled>
          <Ruled>
            <h3 class="h3">{copy.expect.title}</h3>
            <p class="small">{copy.expect.body}</p>
          </Ruled>
        </div>
      </div>
    </Band>
  );
}
