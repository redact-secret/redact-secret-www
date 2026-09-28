import type { Meta, StoryObj } from '@storybook/preact-vite';
import { ArchitectureLayout, SectionNav, type SectionNavGroup } from './ArchitectureLayout';

const groups: SectionNavGroup[] = [
  { label: '섹션', items: [{ n: '00', label: '개요', href: '#overview' }] },
  {
    label: '엔진',
    items: [
      { n: '01', label: '작동 방식', href: '#how-it-works' },
      { n: '02', label: '탐지 방식', href: '#detection', current: true },
    ],
  },
  {
    label: '증거',
    items: [
      { n: '03', label: '지원 주장', href: '#support-claims' },
      { n: '04', label: '평가 방법', href: '#evaluation-methods' },
    ],
  },
  {
    label: '경계',
    items: [
      { n: '05', label: '어댑터', href: '#adapters' },
      { n: '06', label: '볼트', href: '#vault' },
    ],
  },
];

const meta: Meta = {
  title: 'Architecture/ArchitectureLayout',
  component: ArchitectureLayout,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  globals: { locale: 'ko' },
  render: () => (
    <ArchitectureLayout
      section="아키텍처"
      path="/ko/architecture/detection/"
      navLabel="아키텍처"
      contents="아키텍처 목차"
      groups={groups}
    >
      <h1 class="h1">모든 탐지기가 같은 질문에 답합니다</h1>
      <p class="lede">‘왜’는 정확히 다섯 종류뿐입니다.</p>
    </ArchitectureLayout>
  ),
};

export const Collapsed: Story = { ...Default, globals: { locale: 'ko', viewport: { value: 'mobile1' } } };

export const NavOnly: Story = {
  globals: { locale: 'ko' },
  render: () => <SectionNav groups={groups} />,
};
