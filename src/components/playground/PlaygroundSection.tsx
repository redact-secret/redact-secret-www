import { Band, SectionHeader } from '../ui';
import type { SiteContent } from '../../content';
import { anchors } from '../../content/shared';
import { Playground } from './Playground';

export type PlaygroundSectionProps = {
  copy: SiteContent['playground'];
};

/** Block 3 — right after the problem: the product solving it, live, before any install. */
export function PlaygroundSection({ copy }: PlaygroundSectionProps) {
  return (
    <Band id={anchors.playground} labelledBy="playground-title">
      <SectionHeader id="playground-title" eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} />
      <Playground copy={copy} />
    </Band>
  );
}
