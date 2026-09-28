import { Band, SectionHeader } from '../ui';
import type { SiteContent } from '../../content';
import { anchors } from '../../content/shared';
import { SpreadDiagram } from './SpreadDiagram';

export type ProblemSectionProps = {
  copy: SiteContent['problem'];
};

/** Block 2 — why does this matter? */
export function ProblemSection({ copy }: ProblemSectionProps) {
  return (
    <Band id={anchors.problem} labelledBy="problem-title">
      <SectionHeader id="problem-title" eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} />
      <SpreadDiagram copy={copy} />
    </Band>
  );
}
