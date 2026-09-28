import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Note } from './Note';

const meta = {
  title: 'Architecture/Note',
  component: Note,
  args: {
    tone: 'neutral',
    title: '셋 모두에 없는 것',
    children: <p>어느 파일에도 지원 주장이 들어 있지 않습니다. 주장은 셋을 합친 뒤에야 존재합니다.</p>,
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'info', 'warning', 'danger', 'success'] },
  },
} satisfies Meta<typeof Note>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Info: Story = {
  args: {
    tone: 'info',
    title: undefined,
    children: (
      <p>
        <b>A Korean URL never serves English silently.</b> Links to English-only resources say so.
      </p>
    ),
  },
};
export const Warning: Story = {
  args: {
    tone: 'warning',
    title: 'Deliberately out of scope',
    children: (
      <ul>
        <li>
          <b>Detection.</b> Deciding what is a secret stays in the core.
        </li>
        <li>
          <b>Restoration.</b> Adapters never gain the ability to put a value back.
        </li>
      </ul>
    ),
  },
};
export const Danger: Story = {
  args: {
    tone: 'danger',
    title: undefined,
    children: (
      <p>
        <b>All or nothing.</b> One violated check rejects the whole operation.
      </p>
    ),
  },
};
export const Success: Story = {
  args: { tone: 'success', title: 'And it worked', children: <p>The gap was visible, so it got filled.</p> },
};
