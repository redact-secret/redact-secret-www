import type { Meta, StoryObj } from '@storybook/preact-vite';
import { DataTable } from './DataTable';

const meta = {
  title: 'Architecture/DataTable',
  component: DataTable,
  args: {
    label: 'What each repository owns',
    wide: true,
    head: ['Repository', 'Owns', 'Must not own'],
    rows: [
      ['redact-secret', 'Detection, overlap resolution, policy, redaction', 'Restoration storage, any dependency on the vault'],
      ['redact-secret-vault', 'Mapping lifecycle, opaque tokens, restore checks', 'Detection rules, changes to core policy'],
      ['redact-secret-adapters', 'Host integrations for logs, traces, AI context and MCP', 'Restoration'],
    ],
  },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wide: Story = {};
export const Narrow: Story = {
  args: {
    wide: false,
    label: 'Markers',
    head: ['Marker', 'When'],
    rows: [
      [<b class="mono">[REDACTED:BLOCKED]</b>, 'A block verdict. The whole leaf is replaced.'],
      [<b class="mono">[REDACTED:LIMIT_EXCEEDED]</b>, 'Over the walk budget. Never passed through unscanned.'],
    ],
  },
};
