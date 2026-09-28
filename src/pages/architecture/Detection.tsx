import {
  Card,
  Chips,
  Claim,
  DetectorAnatomy,
  DocSection,
  Grid,
  Note,
  PageHead,
  RichCode,
  RuleRows,
  SourceStrip,
  TierLadder,
} from '../../components/architecture';
import { StatusChip } from '../../components/ui';
import { Rich, type RichText } from '../../components/ui/Rich';
import type { ArchitecturePagesCopy } from '../../content';
import type { Locale } from '../../i18n';
import { evidence } from '../../slots';

// Mechanism constants, not copy: the tier names and example shapes, the
// anatomy of a provider detector, the exclusion list and the byte classes are
// the core's own vocabulary and read the same in every locale.
const tiers = [
  { tier: '5 · Private key', example: '-----BEGIN …' },
  { tier: '4 · Provider', example: 'ghp_ · AKIA · sk-' },
  { tier: '3 · Structural', example: 'Bearer …' },
  { tier: '2 · Contextual', example: 'api_key = …' },
  { tier: '1 · Entropy', example: 'x8Kd92mQz1' },
];

const anatomy = [
  { label: 'Prefix', value: 'ghp_' },
  { label: 'Alphabet', value: 'A–Z a–z 0–9' },
  { label: 'Run', value: 'exactly 36' },
  { label: 'Validator', value: 'none' },
];

const skipped = [
  'changeme',
  'placeholder',
  'redacted',
  '<your-key-here>',
  '${process.env.KEY}',
  '$[variables.x]',
  '`date +%s`',
  'op://vault/item/field',
  ':bind_param',
  '/etc/ssl/key.pem',
  'true',
  '12345',
];

const byteClasses = [
  'alnum',
  'alnum-dash',
  'alnum-dash-dot',
  'alnum-underscore',
  'upper-alnum',
  'lower-alnum',
  'digit',
  'hex',
  'hex-or-dash',
  'lower-hex',
  'base64-body',
];

const ruleset = [
  'ruleset-revision: 1',
  'detector: acme-internal-token',
  'specificity: contextual',
  'prefix: "ACME_"',
  'alphabet: alnum-dash',
  'run: at-least 20',
  'validator: none',
].join('\n');

const tier1Tones = ['none', 'danger'] as const;

type Row = { term: string; body: RichText };
const ruleRows = (rows: Row[]) => rows.map((r) => ({ term: r.term, body: <Rich value={r.body} /> }));

/** 02 How it detects. Words: i18n/<locale>/architecture/detection.json. */
export function Detection({ copy }: { locale: Locale; copy: ArchitecturePagesCopy['detection'] }) {
  const { matrix, detectors } = evidence;
  const { head, theLadder: ladder, tier4, tier3, tier2, tier1, whenTiersDisagree: order, theLittleLanguage: lang } = copy;
  const { bringYourOwnRules: own, personalData: pii } = copy;
  return (
    <>
      <PageHead eyebrow={head.eyebrow} title={head.title} lede={<Rich value={head.lede} />} />

      <DocSection eyebrow={ladder.eyebrow} title={ladder.title} lede={<Rich value={ladder.lede} />}>
        <TierLadder
          rungs={ladder.rungs.map((rung, i) => ({ ...tiers[i], title: rung.title, sub: <Rich value={rung.sub} /> }))}
          axis={[ladder.axis[0], ladder.axis[1]]}
        />
      </DocSection>

      <DocSection
        eyebrow={tier4.eyebrow}
        title={tier4.title}
        lede={<Rich value={tier4.lede} vars={{ providers: matrix.providers, families: matrix.families }} />}
      >
        <DetectorAnatomy
          parts={tier4.parts.map((part, i) => ({
            ...anatomy[i],
            desc: <Rich value={part.desc} vars={{ alphabets: detectors.alphabets }} />,
          }))}
        />
        <RuleRows rows={ruleRows(tier4.rows)} />
        <p class="small">
          <Rich value={tier4.p1} />
        </p>
        <RichCode label={tier4.codeLabel}>
          <Rich value={tier4.code} />
        </RichCode>
        <p class="small">
          <Rich value={tier4.p2} />
        </p>
        <Note tone="warning">
          <p>
            <Rich value={tier4.tradeoff} />
          </p>
        </Note>
      </DocSection>

      <DocSection
        eyebrow={tier3.eyebrow}
        title={tier3.title}
        lede={<Rich value={tier3.lede} vars={{ structural: detectors.structural }} />}
      >
        <RuleRows rows={ruleRows(tier3.rows)} />
        <p>
          <Rich value={tier3.p1} />
        </p>
        <Note tone="warning">
          <p>
            <Rich value={tier3.tradeoff} />
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow={tier2.eyebrow} title={tier2.title} lede={<Rich value={tier2.lede} />}>
        <RuleRows rows={ruleRows(tier2.rows)} />
        <h3 class="h3">
          <Rich value={tier2.heading} />
        </h3>
        <p>
          <Rich value={tier2.p1} />
        </p>
        <Chips label={tier2.chipsLabel} struck items={skipped} />
        <p class="small">
          <Rich value={tier2.p2} />
        </p>
        <Note tone="warning">
          <p>
            <Rich value={tier2.tradeoff} />
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow={tier1.eyebrow} title={tier1.title}>
        <Grid cols={2}>
          {tier1.cards.map((card, i) => (
            <Card key={i}>
              <h3>
                <StatusChip tone={tier1Tones[i]}>
                  <Rich value={card.chip} />
                </StatusChip>
              </h3>
              <p>
                <Rich value={card.body} />
              </p>
            </Card>
          ))}
        </Grid>
        <Claim sub={tier1.claimSub}>
          <Rich value={tier1.claim} />
        </Claim>
      </DocSection>

      <DocSection eyebrow={order.eyebrow} title={order.title} lede={<Rich value={order.lede} />}>
        <RuleRows rows={ruleRows(order.rows)} />
        <p class="small">
          <Rich value={order.p} />
        </p>
      </DocSection>

      <DocSection eyebrow={lang.eyebrow} title={lang.title} lede={<Rich value={lang.lede} />}>
        <Grid cols={2}>
          {lang.cards.map((card, i) => (
            <Card key={i}>
              <h3>
                <Rich value={card.title} />
              </h3>
              <p>
                <Rich value={card.body} />
              </p>
            </Card>
          ))}
        </Grid>
        <h3 class="h3">
          <Rich value={lang.alphabetsHeading} vars={{ alphabets: detectors.alphabets }} />
        </h3>
        <Chips label={lang.chipsLabel} items={byteClasses} />
      </DocSection>

      <DocSection
        eyebrow={own.eyebrow}
        title={own.title}
        lede={[
          <StatusChip tone="success">
            <Rich value={own.status} />
          </StatusChip>,
          <Rich value={own.lede} />,
        ]}
      >
        <RichCode label={own.codeLabel}>{ruleset}</RichCode>
        <Grid cols={2}>
          {own.cards.map((card, i) => (
            <Card key={i}>
              <h3>
                <Rich value={card.title} />
              </h3>
              <p>
                <Rich value={card.body} />
              </p>
            </Card>
          ))}
        </Grid>
        <RuleRows rows={ruleRows(own.rows)} />
      </DocSection>

      <DocSection eyebrow={pii.eyebrow} title={pii.title} lede={<Rich value={pii.lede} />}>
        <Grid cols={3}>
          {pii.cards.map((card, i) => (
            <Card key={i}>
              <h3>
                <Rich value={card.title} />
              </h3>
              <p>
                <Rich value={card.body} />
              </p>
            </Card>
          ))}
        </Grid>
        <p>
          <Rich value={pii.p} />
        </p>
        <Note tone="danger">
          <p>
            <Rich value={pii.note} />
          </p>
        </Note>
      </DocSection>

      <SourceStrip label={copy.sources.label}>
        <Rich value={copy.sources.body} />
      </SourceStrip>
    </>
  );
}
