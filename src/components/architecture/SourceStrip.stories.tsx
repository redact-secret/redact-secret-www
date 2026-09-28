import type { Meta, StoryObj } from '@storybook/preact-vite';
import { SourceStrip } from './SourceStrip';

const meta = {
  title: 'Architecture/SourceStrip',
  component: SourceStrip,
  args: {
    label: '출처.',
    children: (
      <>
        등급 사다리와 결정 규칙은 <code>types.rs</code>·<code>pipeline.rs</code>. 여기 등장하는 모든 자격 증명 표기는{' '}
        <b>형식이지 값이 아닙니다</b>.
      </>
    ),
  },
} satisfies Meta<typeof SourceStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { globals: { locale: 'ko' } };
