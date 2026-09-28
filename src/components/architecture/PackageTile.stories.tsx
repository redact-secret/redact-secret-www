import type { Meta, StoryObj } from '@storybook/preact-vite';
import { slots, statusOf } from '../../slots';
import { PackageTile } from './PackageTile';

const { adapter, 'adapter-mcp': mcp, 'vault-py': vaultPy } = slots.packages;

const meta = {
  title: 'Architecture/PackageTile',
  component: PackageTile,
  args: {
    name: adapter.name,
    status: statusOf(adapter),
    statusLabel: 'Released',
    meta: `npm · ${adapter.version}`,
    children: 'The shared base: one primitive that redacts a string, and a bounded walker for nested objects.',
  },
} satisfies Meta<typeof PackageTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Released: Story = {};
export const Alpha: Story = {
  args: {
    name: mcp.name,
    status: statusOf(mcp),
    statusLabel: 'Alpha',
    meta: `npm · ${mcp.version}`,
    children: 'The Model Context Protocol boundary — tool results, arguments, and resources/read.',
  },
};
export const Unpublished: Story = {
  args: {
    name: `${vaultPy.name} (Python)`,
    status: statusOf(vaultPy),
    statusLabel: 'Not published',
    meta: typeof vaultPy.unpublished === 'string' ? vaultPy.unpublished : undefined,
    children: 'Research grade. A native implementation of the server authority contract.',
  },
};
export const ContractOnly: Story = {
  args: {
    name: '@redact-secret/store-*',
    status: 'contract',
    statusLabel: 'Contract only',
    meta: undefined,
    children: 'Persistent backends. A written contract, no implementation.',
  },
};
