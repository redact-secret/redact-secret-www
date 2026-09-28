import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Claim } from './Claim';
import { Flow, FlowArrow, FlowNode } from './Flow';

const meta: Meta = {
  title: 'Architecture/Flow',
  component: Flow,
};

export default meta;
type Story = StoryObj;

export const WithCore: Story = {
  globals: { locale: 'ko' },
  render: () => (
    <Flow>
      <FlowNode title="당신의 호스트">pino 로거, OpenTelemetry span, MCP 도구 결과.</FlowNode>
      <FlowArrow>어댑터가 텍스트를 실어 들입니다</FlowArrow>
      <Claim sub="무엇이 비밀값인지는 코어가 정합니다.">Redact Secret 코어</Claim>
      <FlowArrow>그리고 답을 실어 냅니다</FlowArrow>
      <FlowNode title="같은 호스트, 정리된 상태" />
    </Flow>
  ),
};

export const Marked: Story = {
  globals: { locale: 'ko' },
  render: () => (
    <Flow>
      <FlowNode title="코드 → 커밋 → CI">파일과 git 기록을 검사합니다.</FlowNode>
      <FlowArrow />
      <FlowNode title="실행 중인 앱 → 움직이는 텍스트" marked>
        <b>Redact Secret.</b> 지금 주고받는 것을 프로세스 안에서 검사합니다.
      </FlowNode>
    </Flow>
  ),
};
