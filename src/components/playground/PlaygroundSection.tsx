import { Band, SectionHeader } from '../ui';
import type { HomeCopy } from '../../content';
import { anchors } from '../../content/shared';
import { Rich } from '../ui/Rich';
import { Playground } from './Playground';

export type PlaygroundSectionProps = {
  copy: HomeCopy['playground'];
};

/** Block 3 — right after the problem: the product solving it, live, before any install. */
export function PlaygroundSection({ copy }: PlaygroundSectionProps) {
  return (
    <Band id={anchors.playground} labelledBy="playground-title">
      <SectionHeader id="playground-title" eyebrow={<Rich value={copy.eyebrow} />}
        title={<Rich value={copy.title} />}
        lede={<Rich value={copy.lede} />}
       />
      <Playground copy={copy} />
    </Band>
  );
}
