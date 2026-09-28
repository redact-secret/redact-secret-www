import { Band, CodeBlock, Ruled, SectionHeader, Tabs, VersionSlot } from '../ui';
import type { HomeCopy } from '../../content';
import { Rich } from '../ui/Rich';
import { anchors, snippets } from '../../content/shared';
import type { CoreSlot } from '../../slots';
import styles from './QuickstartSection.module.css';

export type QuickstartSectionProps = {
  copy: HomeCopy['quickstart'];
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
  // Both variants are authored; the slot picks one (npm `latest` has moved before).
  const { same, moved } = copy.pinLatest;
  const latest = core.npmLatest === core.npm ? same : moved;
  return (
    <Band id={anchors.firstRun} labelledBy="first-run-title">
      <SectionHeader id="first-run-title" eyebrow={<Rich value={copy.eyebrow} />} title={<Rich value={copy.title} />} lede={<Rich value={copy.lede} />} />
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
          <p class={`small ${styles.rust}`}><Rich value={copy.rustNote} /></p>
        </div>
        <div class={styles.side}>
          <VersionSlot label={copy.pinLabel}>
            <Rich
              value={copy.pin}
              vars={{
                npm: core.npm,
                observedAt: core.observedAt,
                pypi: core.pypi,
                latest: <Rich value={latest} vars={{ npmLatest: core.npmLatest }} />,
              }}
            />
          </VersionSlot>
          <Ruled>
            <h3 class="h3"><Rich value={copy.why.title} /></h3>
            <p class="small"><Rich value={copy.why.body} /></p>
          </Ruled>
          <Ruled>
            <h3 class="h3"><Rich value={copy.expect.title} /></h3>
            <p class="small"><Rich value={copy.expect.body} /></p>
          </Ruled>
        </div>
      </div>
    </Band>
  );
}
