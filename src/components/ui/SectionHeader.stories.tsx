import type { Meta, StoryObj } from '@storybook/preact-vite';
import { SectionHeader } from './SectionHeader';

const meta = {
  title: 'UI/SectionHeader',
  component: SectionHeader,
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const English: Story = {
  args: {
    eyebrow: 'The runtime problem',
    title: 'Protect live data, not just source code.',
    lede: (
      <>
        Repository scanners help find secrets committed to code. <b>One paste becomes five copies before anyone notices.</b>
      </>
    ),
  },
};

export const Korean: Story = {
  globals: { locale: 'ko' },
  args: {
    eyebrow: '실행 중에 일어나는 일',
    title: '소스 코드뿐 아니라 실행 중인 데이터를 보호하세요.',
    lede: (
      <>
        저장소 스캐너는 코드에 커밋된 비밀값을 찾는 데 도움을 줍니다. <b>한 번 붙여 넣은 값이 아무도 모르는 사이 다섯 곳에 복제됩니다.</b>
      </>
    ),
  },
};

export const WithoutLede: Story = {
  args: { eyebrow: 'Next step', title: 'Put protection where your data flows.' },
};
