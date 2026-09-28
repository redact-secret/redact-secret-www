import type { Meta, StoryObj } from '@storybook/preact-vite';
import { HubCard, HubGrid } from './HubCard';

const meta: Meta = {
  title: 'Architecture/HubCard',
  component: HubCard,
};

export default meta;
type Story = StoryObj;

export const Pair: Story = {
  render: () => (
    <HubGrid>
      <HubCard
        n="01"
        title="How it works"
        question="“What is this thing?”"
        href="#how-it-works"
        go="/architecture/how-it-works/"
      >
        Four surfaces over one core, the four pipeline stages, and why it guards a different door.
      </HubCard>
      <HubCard n="02" title="How it detects" question="“How sure, and why?”" href="#detection" go="/architecture/detection/">
        Five tiers of evidence, fixed tie-breakers, and bringing your own ruleset.
      </HubCard>
    </HubGrid>
  ),
};

export const Korean: Story = {
  globals: { locale: 'ko' },
  render: () => (
    <HubGrid>
      <HubCard n="05" title="어댑터" question="“텍스트는 누가 가져오나?”" href="#adapters" go="/architecture/adapters/">
        호스트와 엔진 사이에 놓이는 패키지들. 아무것도 판단하지 않습니다.
      </HubCard>
      <HubCard n="06" title="볼트" question="“원본을 되돌려야 한다면?”" href="#vault" go="/architecture/vault/">
        코어는 원본을 버립니다. 볼트는 그것을 보관해도 되는 유일한 곳입니다.
      </HubCard>
    </HubGrid>
  ),
};
