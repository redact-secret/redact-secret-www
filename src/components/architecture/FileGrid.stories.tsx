import type { Meta, StoryObj } from '@storybook/preact-vite';
import { FileGrid } from './FileGrid';

const meta = {
  title: 'Architecture/FileGrid',
  component: FileGrid,
  args: {
    files: [
      {
        name: 'benchmarks/detectors.json',
        question: '무슨 코드를 출시했나?',
        facts: [
          { term: '작성 주체', desc: '생성기가 코어의 탐지기 레지스트리에서 뽑습니다.' },
          { term: '고정 대상', desc: '정확한 커밋 하나.' },
        ],
      },
      {
        name: 'benchmarks/support/taxonomy.json',
        question: '세상은 무엇을 발급하나?',
        facts: [
          { term: '작성 주체', desc: '사람이 손으로.' },
          { term: '고정 대상', desc: '없음.' },
        ],
      },
      {
        name: 'results-output/support-status.json',
        question: '각각은 얼마나 잘했나?',
        facts: [
          { term: '작성 주체', desc: '벤치마크 코퍼스를 돌려서.' },
          { term: '고정 대상', desc: '코퍼스 해시 매니페스트.' },
        ],
      },
    ],
  },
} satisfies Meta<typeof FileGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { globals: { locale: 'ko' } };
