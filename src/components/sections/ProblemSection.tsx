import { Band, SectionHeader } from '../ui';
import type { HomeCopy } from '../../content';
import { Rich } from '../ui/Rich';
import { anchors } from '../../content/shared';
import { SpreadDiagram } from './SpreadDiagram';

export type ProblemSectionProps = {
  copy: HomeCopy['problem'];
};

/** Block 2 — why does this matter? */
export function ProblemSection({ copy }: ProblemSectionProps) {
  return (
    <Band id={anchors.problem} labelledBy="problem-title">
      <SectionHeader id="problem-title" eyebrow={<Rich value={copy.eyebrow} />} title={<Rich value={copy.title} />} lede={<Rich value={copy.lede} />} />
      <SpreadDiagram copy={copy} />
    </Band>
  );
}
