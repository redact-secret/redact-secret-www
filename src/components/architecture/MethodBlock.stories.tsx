import type { Meta, StoryObj } from '@storybook/preact-vite';
import { MethodBlock, Phase } from './MethodBlock';
import { Dim, RichCode } from './RichCode';

const meta: Meta = {
  title: 'Architecture/MethodBlock',
  component: MethodBlock,
};

export default meta;
type Story = StoryObj;

export const WithPhase: Story = {
  globals: { locale: 'ko' },
  render: () => (
    <div>
      <Phase title="까다로운지, 그냥 욕심이 많은지 증명한다">더 많은 텍스트를 잡는 탐지기는 양성만 보면 더 좋아 보인다</Phase>
      <MethodBlock
        n="02"
        title="음성 쌍둥이"
        ask="정확히 한 가지만 바꿉니다. 조용해집니까?"
        gist={
          <>
            변이는 하나만. 쌍이 <b>한 단위로</b> 채점됩니다.
          </>
        }
      >
        <RichCode label="음성 쌍둥이 예시">
          ACME_KEY=… <Dim>반드시 잡아야 함</Dim>
          {'\n'}ACMX_KEY=… <Dim>반드시 잡지 말아야 함</Dim>
        </RichCode>
      </MethodBlock>
    </div>
  ),
};

export const WithoutCode: Story = {
  globals: { locale: 'ko' },
  render: () => (
    <MethodBlock
      n="01"
      title="표준 양성"
      ask="쉬운 것을 찾습니까?"
      gist="다른 모든 방법이 자라 나오는 씨앗입니다."
    />
  ),
};
