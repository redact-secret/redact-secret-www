/**
 * The integrations block's structure — which cards exist, in which group and
 * runtime, backed by which slot. Shared by both locales; each locale authors
 * the words for a card id (content/*.tsx), the slots supply every version.
 */
export type FactKind = 'version' | 'registries' | 'core' | 'host' | 'tag' | 'install';

export type CardDef = {
  /** Copy key in `SiteContent['integrations'].cards`. */
  id: string;
  /** Slot key in release.json `packages`. */
  slot: string;
  /** Shown instead of the slot's package name (a subpath or an extra). */
  display?: string;
  facts: FactKind[];
  /** For `host` on a Python extra: the extra's name. */
  extra?: string;
  /** For `install`. */
  install?: (version: string) => string;
};

export const runtimes = ['browser', 'node', 'python'] as const;
export type Runtime = (typeof runtimes)[number];

export type GroupDef =
  | { id: 'core'; cards: CardDef[] }
  | { id: 'adapters' | 'vault'; runtimes: Record<Runtime, CardDef[]> };

export const integrationGroups: GroupDef[] = [
  {
    id: 'core',
    cards: [
      { id: 'core', slot: 'core', facts: ['registries'] },
      { id: 'wasm', slot: 'wasm', facts: ['version'] },
      {
        id: 'cli',
        slot: 'cli',
        facts: ['version', 'install'],
        install: (v) => `cargo install redact-secret-cli --version ${v} --locked`,
      },
    ],
  },
  {
    id: 'adapters',
    runtimes: {
      browser: [{ id: 'web-stream', slot: 'core', display: '@redact-secret/core/web-stream', facts: ['version'] }],
      node: [
        { id: 'pino', slot: 'adapter-pino', facts: ['version', 'host', 'core'] },
        { id: 'otel', slot: 'adapter-otel', facts: ['version', 'host', 'core'] },
        { id: 'masking', slot: 'adapter', facts: ['version', 'core'] },
        { id: 'ai-context', slot: 'adapter-ai-context', facts: ['version', 'tag', 'core'] },
        { id: 'mcp', slot: 'adapter-mcp', facts: ['version', 'tag', 'host', 'core'] },
      ],
      python: [
        { id: 'logging', slot: 'adapters-py', facts: ['version', 'core'] },
        { id: 'otel-py', slot: 'adapters-py', display: 'redact-secret-adapters[otel]', extra: 'otel', facts: ['version', 'host'] },
        { id: 'masking-py', slot: 'adapters-py', facts: ['version'] },
      ],
    },
  },
  {
    id: 'vault',
    runtimes: {
      browser: [{ id: 'vault-browser', slot: 'vault', facts: ['version', 'tag', 'core'] }],
      node: [
        { id: 'vault-node', slot: 'vault', facts: ['version', 'tag', 'core'] },
        { id: 'vault-server', slot: 'vault-server', facts: ['version', 'core'] },
      ],
      python: [{ id: 'vault-py', slot: 'vault-py', facts: ['version'] }],
    },
  },
];
