import type { Meta, StoryObj } from '@storybook/preact-vite';
import { GateList } from './GateList';

const meta = {
  title: 'Architecture/GateList',
  component: GateList,
  args: {
    gates: [
      { title: '주체.', body: '어떤 인증된 신원이 요청하는가.' },
      { title: '테넌트.', body: '테넌트를 넘는 조회는 실패합니다.' },
      { title: '출처.', body: '캡처가 어디에서 왔는가.' },
      { title: '싱크와 정확한 경로.', body: '어떤 목적지의, 그 안의 어떤 구조적 필드인가.' },
      { title: '목적.', body: '무엇을 위한 것인지, 애플리케이션이 선언합니다.' },
      { title: '생존.', body: '만료, 폐기, 사용 예산.' },
    ],
  },
} satisfies Meta<typeof GateList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { globals: { locale: 'ko' } };
