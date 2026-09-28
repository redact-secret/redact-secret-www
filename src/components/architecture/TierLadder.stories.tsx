import type { Meta, StoryObj } from '@storybook/preact-vite';
import { TierLadder } from './TierLadder';

const meta = {
  title: 'Architecture/TierLadder',
  component: TierLadder,
  args: {
    axis: ['↑ 더 확실함', '가장 약함 ↓'],
    rungs: [
      { tier: '5 · Private key', title: '텍스트가 스스로 밝힙니다', sub: <>기본 동작이 <b>block</b>인 유일한 등급.</>, example: '-----BEGIN …' },
      { tier: '4 · Provider', title: '회사가 자기 키에 도장을 찍습니다', sub: '고정 접두사, 정해진 알파벳, 알려진 길이.', example: 'ghp_ · AKIA · sk-' },
      { tier: '3 · Structural', title: '자기만의 형식이 있습니다', sub: '헤더, URL, JWT.', example: 'Bearer …' },
      { tier: '2 · Contextual', title: '무언가가 그것을 비밀이라 불렀습니다', sub: '자격 증명 같은 이름과 무작위 같은 값.', example: 'api_key = …' },
      { tier: '1 · Entropy', title: '그냥 무작위해 보입니다', sub: '단독으로는 절대 충분하지 않습니다.', example: 'x8Kd92mQz1' },
    ],
  },
} satisfies Meta<typeof TierLadder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { globals: { locale: 'ko' } };
export const Stacked: Story = { globals: { locale: 'ko', viewport: { value: 'mobile1' } } };
