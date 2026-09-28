import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import { integrationGroups, type CardDef } from '../../content/integrations';
import type { Locale } from '../../i18n';
import { slots } from '../../slots';
import { PackageCard } from './PackageCard';

const defs = new Map<string, CardDef>(
  integrationGroups.flatMap((g) => ('cards' in g ? g.cards : Object.values(g.runtimes).flat())).map((d) => [d.id, d]),
);

function render(id: string) {
  return (_args: unknown, { globals }: { globals: Record<string, unknown> }) => {
    const copy = content[globals.locale as Locale].home.integrations;
    const def = defs.get(id)!;
    return (
      <div style={{ maxWidth: '380px' }}>
        <PackageCard def={def} slot={slots.packages[def.slot]} copy={copy.cards[id as keyof typeof copy.cards]} labels={copy} />
      </div>
    );
  };
}

const meta: Meta = { title: 'Sections/Parts/PackageCard', component: PackageCard };
export default meta;
type Story = StoryObj;

/** Core: versions on all three registries. */
export const Core: Story = { render: render('core') };
export const CliWithInstall: Story = { render: render('cli') };
/** Published, with host and core peer ranges from the registry manifest. */
export const Published: Story = { render: render('otel') };
export const PublishedKorean: Story = { render: render('otel'), globals: { locale: 'ko' } };
/** Alpha on its own dist-tag, where `latest` points elsewhere. */
export const AlphaTagBehindLatest: Story = { render: render('vault-node') };
export const PythonExtra: Story = { render: render('otel-py') };
export const NotPublished: Story = { render: render('vault-py') };
