import {
  Card,
  Claim,
  DocSection,
  Flow,
  FlowArrow,
  FlowNode,
  GateList,
  Grid,
  Note,
  PackageTile,
  PageHead,
  RuleRows,
  SourceStrip,
} from '../../../components/architecture';
import { PlaceholderChip, StatusChip } from '../../../components/ui';
import type { Locale } from '../../../i18n';
import { evidence, slots, statusOf, type PackageSlot, type PackageStatus } from '../../../slots';

const statusLabels: Record<PackageStatus, string> = { released: 'Released', alpha: 'Alpha', unpublished: 'Not published' };
const registryNames: Record<PackageSlot['registry'], string> = { npm: 'npm', pypi: 'PyPI', crates: 'crates.io' };

function meta(slot: PackageSlot) {
  if (slot.unpublished) return typeof slot.unpublished === 'string' ? slot.unpublished : undefined;
  return [registryNames[slot.registry], slot.version].filter(Boolean).join(' · ');
}

export function Vault(_props: { locale: Locale }) {
  const p = slots.packages;
  const vault = p.vault;
  const tile = (key: string) => ({
    name: p[key].name,
    status: statusOf(p[key]),
    statusLabel: statusLabels[statusOf(p[key])],
    meta: meta(p[key]),
  });

  return (
    <>
      <PageHead
        eyebrow="06 · Vault"
        title="The core throws the original away. Sometimes you need it back."
        lede={
          <>
            This is the <b>one place</b> allowed to keep it, and it is built to make that hard.
          </>
        }
      />

      <DocSection eyebrow="The tension" title="Two good rules that contradict each other">
        <Grid cols={2}>
          <Card>
            <h3>The core's promise</h3>
            <p>
              It detects and redacts <b>without ever storing the matched plaintext</b>. A finding is a type and a
              range. <b>There is nothing to steal, because nothing was kept.</b>
            </p>
          </Card>
          <Card>
            <h3>The real requirement</h3>
            <p>
              An agent redacts a customer's card number, gets an answer, and now has to place the real order.{' '}
              <b>Something, somewhere, has to put the value back.</b>
            </p>
          </Card>
        </Grid>
        <Note tone="danger">
          <p>
            <b>The resolution is a separate repository.</b> Installing or using the core alone must never create a
            recoverable mapping. You have to <b>reach for this deliberately</b>, and reaching for it changes your
            security model.
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow="The shape of it" title="Redact with a receipt">
        <Flow>
          <FlowNode title="Original text, in a trusted runtime">
            The vault is opened explicitly, with a <b>bounded scope and lifetime</b>.
          </FlowNode>
          <FlowArrow>the core scans, under your policy</FlowArrow>
          <FlowNode title="Sanitized text plus a token">
            <PlaceholderChip>{'<rsv_…>'}</PlaceholderChip> — 128 random bits, bound to one vault and one capture.{' '}
            <b>The original stays behind, in memory, on the trusted side.</b>
          </FlowNode>
          <FlowArrow>only the sanitized text crosses the boundary</FlowArrow>
          <FlowNode title="The model, the log, the third party">
            They see the token. <b>The token is not the value and cannot become it.</b>
          </FlowNode>
          <FlowArrow>later, an authorized restore</FlowArrow>
          <Claim sub="And nowhere else.">The approved value, to the approved destination</Claim>
        </Flow>
      </DocSection>

      <DocSection
        eyebrow="The central rule"
        title="A token alone grants nothing"
        lede={
          <>
            This is the idea the whole design turns on. <b>Holding the receipt is not permission to collect.</b> At
            restore time, a server integration resolves who is asking and why from{' '}
            <b>trusted runtime context, never from something the model said</b>.
          </>
        }
      >
        <GateList
          gates={[
            { title: 'Principal.', body: 'Which authenticated identity is asking.' },
            { title: 'Tenant.', body: 'Cross-tenant lookups fail.' },
            { title: 'Source.', body: 'Where the capture came from.' },
            { title: 'Sink and exact path.', body: 'Which destination, and which structural field inside it.' },
            { title: 'Purpose.', body: 'What it is for, declared by the application.' },
            { title: 'Liveness.', body: 'Expiry, revocation, usage budget, and the exact issued tokens.' },
          ]}
        />
        <Note tone="danger">
          <p>
            <b>All of it, or none of it.</b> The whole operation is preflighted against every check at once.{' '}
            <b>One violation rejects the complete operation</b>, with no partial plaintext returned and no budget
            consumed.
          </p>
        </Note>
      </DocSection>

      <DocSection
        eyebrow="A trap it closes on purpose"
        title="A visible label is not a key"
        lede={
          <>
            The core can format a typed placeholder from safe metadata, such as <code>&lt;JWT_1&gt;</code>, including
            PII types like <code>&lt;PII_JURISDICTION_US_SSN_1&gt;</code>. It is tempting to treat a label like that
            as <b>proof the value was kept</b>.
          </>
        }
      >
        <Grid cols={2}>
          <Card>
            <h3>
              <StatusChip tone="none">Grants nothing</StatusChip>
            </h3>
            <p>
              A typed display placeholder, whether the core's own or an application label like{' '}
              <code>&lt;SSN_1&gt;</code>. <b>It is a formatting concern.</b> It does not imply the original was
              retained, or can be restored.
            </p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="success">Grants a chance</StatusChip>
            </h3>
            <p>
              An issued vault token, <em>plus</em> an application grant naming the sink and the exact path.{' '}
              <b>Restoration never parses a display placeholder as proof of ownership.</b>
            </p>
          </Card>
        </Grid>
        <p class="small">
          Which matters because a model can write <code>&lt;SSN_1&gt;</code> into its output whenever it likes.{' '}
          <b>Model output, tool arguments and visible placeholder text cannot authorize their own restoration.</b>
        </p>
      </DocSection>

      <DocSection eyebrow="What may be kept" title="Never everything">
        <RuleRows
          rows={[
            {
              term: 'Blocked',
              body: (
                <>
                  A core <code>block</code> finding, private-key material, can <b>never</b> become a restorable entry.
                  Not opt-in, not configurable.
                </>
              ),
            },
            {
              term: 'Other findings',
              body: (
                <>
                  Require an explicit eligibility decision. Retention is opt-in, <b>never a side effect</b>.
                </>
              ),
            },
            {
              term: 'Personal data',
              body: (
                <>
                  Retained only when the application names its <em>exact</em> type in the capture's allowlist,{' '}
                  <code>pii: {'{ retain: […] }'}</code>. Every other PII finding becomes a{' '}
                  <b>display placeholder that cannot be restored</b>.
                </>
              ),
            },
          ]}
        />
        <Note tone="success">
          <p>
            <b>Note the direction of the default.</b> Everything is unrecoverable unless you named it.{' '}
            <b>There is no “retain everything” switch to leave on by mistake.</b>
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow="The pieces" title="Two published, one research, one on paper">
        <Grid cols={2}>
          <PackageTile {...tile('vault')}>
            The portable piece: opt-in, bounded, in-memory capture and the token lifecycle. Qualified for Node.js
            20/22/24 and the browser main thread, with an optional dedicated-Worker mode qualified <em>separately</em>{' '}
            — <b>Worker mode is not an implicit upgrade</b>, and the two modes' guarantees are documented apart.
          </PackageTile>
          <PackageTile {...tile('vault-server')}>
            The authority layer: principal, tenant, source, sink, path and purpose checks on every restore, with an
            in-memory backend built on the package above. Tested on Node.js 20/22/24.
          </PackageTile>
          <PackageTile {...tile('vault-py')} name={`${p['vault-py'].name} (Python)`}>
            Research-grade. A native Python implementation of the same <em>server authority</em> contract, not of the
            portable vault API. It passes the shared conformance corpus against the real core through a documented
            Node.js service boundary.
          </PackageTile>
          <PackageTile name="@redact-secret/store-*" status="contract" statusLabel="Contract only">
            Persistent backends. A written contract exists; no implementation does.{' '}
            <b>Persistence is a storage choice, not a third trust environment.</b>
          </PackageTile>
        </Grid>
        <p class="small">
          The npm names do not make this JavaScript-only. The server security contract is language-neutral, and
          Python, Rust and Go each need their own native distribution or a separately qualified service boundary.
        </p>
      </DocSection>

      <DocSection eyebrow="Being honest" title="It says alpha, and means it">
        <Note tone="warning" title="Known limits, stated by the repository itself">
          <ul>
            <li>
              <b>No persistence.</b> In-memory only. The persistent-store contract is written; nothing implements it.
            </li>
            <li>
              <b>No streaming.</b> Whole-input capture and structured-field restoration only.
            </li>
            <li>
              <b>Browser memory is the page's trust boundary.</b> A browser vault is for final display. It cannot
              enforce multi-user server authorization, <b>and it must not pretend to.</b>
            </li>
            <li>
              <b>Memory cannot be wiped on demand.</b> No library can guarantee a managed-runtime string has been
              erased from every copy. The repository <b>says so outright</b> rather than implying otherwise.
            </li>
            <li>
              <b>Not qualified for</b> edge runtimes, SharedWorker, Service Worker or Node.js{' '}
              <code>worker_threads</code>.
            </li>
          </ul>
        </Note>
        {vault.latest && vault.latest !== vault.version && (
          <Note tone="danger" title="A real install trap">
            <p>
              npm's <code>latest</code> tag on <code>{vault.name}</code> points at <code>{vault.latest}</code>, which
              pins an older core beta and <b>conflicts with core {slots.core.npm}.</b> The <code>{vault.tag}</code> tag
              points at <code>{vault.version}</code>, which pins core{' '}
              <code>{vault.peers?.['@redact-secret/core']}</code> and is the one that matches.{' '}
              <b>Install exact versions rather than a dist-tag.</b>
            </p>
          </Note>
        )}
      </DocSection>

      <SourceStrip label="Sources.">
        <code>README.md</code>, <code>ARCHITECTURE.md</code> and the decision records under{' '}
        <code>docs/decisions/</code> in <code>{evidence.sources.vault.repo.split('/')[1]}</code>
        {evidence.sources.vault.commit && (
          <>
            {' '}
            at <code>{evidence.sources.vault.commit}</code>
          </>
        )}
        . Published versions and dist-tags were read from the npm registry on {slots.observedAt}. The repository was
        formerly named <code>redact-secret-reversible</code>. Exact API signatures, TTL defaults, token syntax, store
        implementations and release dates are all described as still open.
      </SourceStrip>
    </>
  );
}
