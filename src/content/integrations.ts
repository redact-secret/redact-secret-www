/**
 * The integrations block's structure — which cards exist, in which group and
 * runtime, backed by which package — read from data/integrations.json
 * (integrations-v1). Shared by both locales; each locale authors the words
 * for a card id (content/*.tsx), the slots supply every version.
 */
import integrationsJson from '../../data/integrations.json';
import type { IntegrationsV1 } from '../contracts';

const integrations = integrationsJson as unknown as IntegrationsV1.IntegrationsV1;

export type FactKind = IntegrationsV1.FactKind;

export type CardDef = Omit<IntegrationsV1.CardEntry, 'install'> & {
  /** For `install`: the command for a published version. */
  install?: (version: string) => string;
};

export const runtimes = ['browser', 'node', 'python'] as const;
export type Runtime = (typeof runtimes)[number];

export type GroupDef =
  | { id: 'core'; cards: CardDef[] }
  | { id: 'adapters' | 'vault'; runtimes: Record<Runtime, CardDef[]> };

function card({ install, ...entry }: IntegrationsV1.CardEntry): CardDef {
  return install ? { ...entry, install: (version) => install.replaceAll('{version}', version) } : entry;
}

export const integrationGroups: GroupDef[] = integrations.groups.map((group) =>
  'cards' in group
    ? { id: group.id, cards: group.cards.map(card) }
    : {
        id: group.id,
        runtimes: {
          browser: group.runtimes.browser.map(card),
          node: group.runtimes.node.map(card),
          python: group.runtimes.python.map(card),
        },
      },
);
