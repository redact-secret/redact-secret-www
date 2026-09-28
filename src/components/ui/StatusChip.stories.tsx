import type { Meta, StoryObj } from '@storybook/preact-vite';
import { StatusChip } from './StatusChip';

const meta = {
  title: 'UI/StatusChip',
  component: StatusChip,
  args: { tone: 'success', children: 'Published' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['success', 'warning', 'danger', 'info', 'none'] },
  },
} satisfies Meta<typeof StatusChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Released: Story = {};
export const Prerelease: Story = { args: { tone: 'info', children: 'Prerelease' } };
export const VerifyPerHost: Story = { args: { tone: 'warning', children: 'Verify per host' } };
export const ValueKept: Story = { args: { tone: 'danger', children: 'Value kept' } };
export const NoStatus: Story = { args: { tone: 'none', children: 'Not measured' } };

export const AllKorean: Story = {
  globals: { locale: 'ko' },
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      <StatusChip tone="success">출시됨</StatusChip>
      <StatusChip tone="info">Alpha · 프리릴리스</StatusChip>
      <StatusChip tone="warning">호스트별 검증</StatusChip>
      <StatusChip tone="danger">값이 그대로</StatusChip>
    </div>
  ),
};
