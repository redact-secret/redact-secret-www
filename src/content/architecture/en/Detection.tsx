import {
  Card,
  Chips,
  Claim,
  DetectorAnatomy,
  Dim,
  DocSection,
  Grid,
  Note,
  PageHead,
  RichCode,
  RuleRows,
  SourceStrip,
  TierLadder,
} from '../../../components/architecture';
import { StatusChip } from '../../../components/ui';
import type { Locale } from '../../../i18n';
import { evidence } from '../../../slots';

const ruleset = [
  'ruleset-revision: 1',
  'detector: acme-internal-token',
  'specificity: contextual',
  'prefix: "ACME_"',
  'alphabet: alnum-dash',
  'run: at-least 20',
  'validator: none',
].join('\n');

export function Detection(_props: { locale: Locale }) {
  const { matrix, detectors } = evidence;
  return (
    <>
      <PageHead
        eyebrow="02 · How it detects"
        title="Every detector answers the same question: how sure, and why?"
        lede="There are exactly five kinds of why. They are ranked, and the ranking decides everything."
      />

      <DocSection
        eyebrow="The ladder"
        title="Five tiers of evidence"
        lede={
          <>
            Each detector stamps its find with one of these. It is a <b>closed list</b>: nothing invents a sixth rung,
            and nothing promotes itself.
          </>
        }
      >
        <TierLadder
          rungs={[
            {
              tier: '5 · Private key',
              title: 'It announces itself',
              sub: (
                <>
                  Everything between the opening and closing banners. The only tier whose default action is{' '}
                  <b>block</b>.
                </>
              ),
              example: '-----BEGIN …',
            },
            {
              tier: '4 · Provider',
              title: 'A company stamps its keys',
              sub: 'A literal prefix, a fixed alphabet, a known length.',
              example: 'ghp_ · AKIA · sk-',
            },
            {
              tier: '3 · Structural',
              title: 'It has a shape of its own',
              sub: 'A grammar no vendor owns: headers, URLs, JWTs.',
              example: 'Bearer …',
            },
            {
              tier: '2 · Contextual',
              title: 'Something called it a secret',
              sub: 'A credential-ish name, then a random-ish value.',
              example: 'api_key = …',
            },
            {
              tier: '1 · Entropy',
              title: 'Just looks random',
              sub: 'Never enough on its own. A supporting signal only.',
              example: 'x8Kd92mQz1',
            },
          ]}
          axis={['↑ More certain', 'Weakest ↓']}
        />
      </DocSection>

      <DocSection
        eyebrow="Tier 4"
        title="A prefix, an alphabet, a length"
        lede={
          <>
            <b>
              {matrix.providers} providers, {matrix.families} credential families
            </b>{' '}
            stamp their keys with a recognisable opening. Every one of those detectors is the same four-part shape, and
            this is the little language the whole tier is built from.
          </>
        }
      >
        <DetectorAnatomy
          parts={[
            { label: 'Prefix', value: 'ghp_', desc: 'one literal string' },
            { label: 'Alphabet', value: 'A–Z a–z 0–9', desc: `one of ${detectors.alphabets} fixed byte classes` },
            { label: 'Run', value: 'exactly 36', desc: 'exact n, or at-least n' },
            { label: 'Validator', value: 'none', desc: 'optional extra check' },
          ]}
        />
        <RuleRows
          rows={[
            {
              term: 'Boundary',
              body: (
                <>
                  The character just before and just after must <em>not</em> be part of the alphabet, so a slice of a
                  longer blob is not mistaken for a whole key.
                </>
              ),
            },
            {
              term: 'Case',
              body: 'A vendor documented as lowercase hex uses a lowercase-only class, so a case-mangled lookalike is rejected rather than matched.',
            },
            {
              term: 'Validator',
              body: (
                <>
                  Confluent's keys carry a real <b>CRC-32</b> checksum tail, which the detector recomputes. Cloudflare's
                  is only checked for being lowercase hex.
                </>
              ),
            },
          ]}
        />
        <p class="small">Two vendors are quirkier than the shape allows and get hand-composed grammars:</p>
        <RichCode label="OpenAI project key format">
          sk-proj-<Dim>⟨74 chars⟩</Dim>T3BlbkFJ<Dim>⟨74 chars⟩</Dim>
        </RichCode>
        <p class="small">
          That marker in the middle is <code>base64("OpenAI")</code>. Every key they issue carries it, so the detector
          anchors on it instead of trusting <code>sk-</code> alone.
        </p>
        <Note tone="warning">
          <p>
            <b>The tradeoff: precision.</b> A brand-new key format, or a truncated one, is simply missed until someone
            adds its grammar.
          </p>
        </Note>
      </DocSection>

      <DocSection
        eyebrow="Tier 3"
        title="Shapes nobody owns"
        lede={
          <>
            These are not vendor patterns, they are formats. {detectors.structural} of them, and they are the only
            detectors the small <code>common</code> profile keeps.
          </>
        }
      >
        <RuleRows
          rows={[
            {
              term: 'JWT',
              body: (
                <>
                  Three dot-separated chunks, and the first two must start <code>eyJ</code>, the fingerprint of base64'd
                  JSON.
                </>
              ),
            },
            {
              term: 'Bearer',
              body: (
                <>
                  <code>Bearer</code> plus at least 16 characters. <b>Only the token</b> is selected, never the header
                  word.
                </>
              ),
            },
            {
              term: 'Connection URL',
              body: (
                <>
                  Picks out <em>only</em> the password inside <code>postgres://user:pw@host</code>. The host stays
                  readable.
                </>
              ),
            },
            {
              term: 'otpauth URI',
              body: (
                <>
                  The scheme plus a <code>secret=</code> parameter. The label and issuer are left alone.
                </>
              ),
            },
          ]}
        />
        <p>
          One deliberate exception proves the rule: a JWT is dropped if its payload says it is a Supabase{' '}
          <code>anon</code> key, which is public by design and ships in browser bundles.{' '}
          <b>It is the only place a token's contents are read at all.</b>
        </p>
        <Note tone="warning">
          <p>
            <b>The tradeoff:</b> a bare TOTP seed with no <code>otpauth://</code> wrapper has no shape to key on, so it
            is invisible here.
          </p>
        </Note>
      </DocSection>

      <DocSection
        eyebrow="Tier 2"
        title="The name vouches for the value"
        lede={
          <>
            This is the catch-all for credentials nobody has a grammar for. It needs <b>two things to agree</b>: a name
            that sounds like a secret, and a value that looks like one.
          </>
        }
      >
        <RuleRows
          rows={[
            {
              term: 'Name',
              body: (
                <>
                  Case and punctuation are flattened first, so <code>apiKey</code>, <code>API-KEY</code> and{' '}
                  <code>api.key</code> are one name.
                </>
              ),
            },
            {
              term: 'Strong names',
              body: (
                <>
                  <code>api_key</code>, <code>password</code>, <code>client_secret</code>, <code>access_token</code>:
                  the value must score <b>3.0</b> on randomness.
                </>
              ),
            },
            {
              term: 'Maybe names',
              body: (
                <>
                  <code>auth</code>, <code>credential</code>, <code>signing_key</code>: the bar rises to <b>3.5</b>.
                  Weaker word, stronger proof.
                </>
              ),
            },
            {
              term: 'Length',
              body: 'At least 8 characters; randomness is only measured past 16; anything over 4 KB is left to the specialists.',
            },
            {
              term: 'Plain token',
              body: (
                <>
                  The bare word <code>token</code> is deliberately ignored. Too common to mean anything.
                </>
              ),
            },
          ]}
        />
        <h3 class="h3">Then it throws most of them away</h3>
        <p>
          A large part of this detector is knowing what <em>is not</em> a secret. All of these are recognised and
          skipped:
        </p>
        <Chips
          label="Values recognised and skipped"
          struck
          items={[
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
          ]}
        />
        <p class="small">
          Every one of those is a <em>pointer</em> to a secret, not the secret. Flagging them is the fastest way to make a
          scanner people turn off.
        </p>
        <Note tone="warning">
          <p>
            <b>The tradeoff:</b> this is the noisiest tier, so it is held to the strictest exclusions, and by default it
            only warns unless confidence is high.
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow="Tier 1" title="Randomness is not evidence">
        <Grid cols={2}>
          <Card>
            <h3>
              <StatusChip tone="none">Not flagged</StatusChip>
            </h3>
            <p>
              <code>a8f3k29dj4ms91x</code> alone in your text. A commit hash, an ID, a nonce, a UUID.
            </p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="danger">Flagged</StatusChip>
            </h3>
            <p>
              <code>password=a8f3k29dj4ms91x</code>. The same string, now with something standing behind it.
            </p>
          </Card>
        </Grid>
        <Claim sub="It only raises or lowers the bar for a tier above it. That single decision is why this library reports so few false alarms, and why a high-entropy secret with no name and no shape walks straight past.">
          Entropy never promotes anything by itself.
        </Claim>
      </DocSection>

      <DocSection
        eyebrow="When tiers disagree"
        title="Five tie-breakers, always in this order"
        lede={
          <>
            Two detectors often claim overlapping text. The winner is <b>never whoever ran first</b>: it is a fixed
            comparison, run top to bottom until something differs.
          </>
        }
      >
        <RuleRows
          rows={[
            {
              term: '1 · Severity',
              body: (
                <>
                  A candidate that would only warn can never displace one that would block.{' '}
                  <b>This outranks even the tier.</b>
                </>
              ),
            },
            {
              term: '2 · Tier',
              body: 'The ladder above. Private key beats provider beats structural beats contextual beats entropy.',
            },
            { term: '3 · Confidence', body: 'High, medium, low.' },
            {
              term: '4 · Width',
              body: (
                <>
                  The narrower span wins. <b>Redact the key, not the paragraph around it.</b>
                </>
              ),
            },
            {
              term: '5 · Order',
              body: 'Registration order, then emission order. Built-ins register before anything custom, so a stable answer always exists.',
            },
          ]}
        />
        <p class="small">
          Across the whole input it does not take winners greedily: it picks{' '}
          <b>the combination of non-overlapping finds with the highest total evidence</b>, weighted by these same keys.
        </p>
      </DocSection>

      <DocSection
        eyebrow="The little language"
        title="There is no regex engine"
        lede={
          <>
            Not “we avoided regex”: the core is allowed <b>zero</b> outside dependencies, so there is nothing to have a
            regex engine with. Instead the four-part shape from tier 4 was written down once, and every provider detector
            is an instance of it.
          </>
        }
      >
        <Grid cols={2}>
          <Card>
            <h3>What that buys</h3>
            <p>
              No backtracking exists, so the classic one-evil-input-hangs-the-server attack has nowhere to live,{' '}
              <b>by construction</b> rather than by review. A lookup table computed once per scan keeps the whole pass
              linear, even on hostile input.
            </p>
          </Card>
          <Card>
            <h3>What it costs</h3>
            <p>
              Anything that is not “prefix, then a bounded run” needs hand-written code. Two vendors' formats needed
              exactly that.
            </p>
          </Card>
        </Grid>
        <h3 class="h3">The {detectors.alphabets} alphabets, and nothing else</h3>
        <Chips
          label="Byte classes"
          items={[
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
          ]}
        />
      </DocSection>

      <DocSection
        eyebrow="Bring your own rules"
        title="Your format, their engine"
        lede={[
          <StatusChip tone="success">Shipped · Rust · JavaScript · Python · CLI</StatusChip>,
          <>
            Companies have their own key formats. Adding a detector used to mean writing Rust, so everyone else ran a
            second scan of their own beside this one, which is exactly the divergence the library exists to prevent. Now
            you hand over the same four-part shape as plain text. Not a callback: <b>data</b>.
          </>,
        ]}
      >
        <RichCode label="Ruleset example">{ruleset}</RichCode>
        <Grid cols={2}>
          <Card>
            <h3>A callback, still rejected</h3>
            <p>
              Your code runs on every candidate. It needs the plaintext to decide, so <b>plaintext crosses the
              boundary</b>, and Node, the browser and Python could each answer differently.
            </p>
          </Card>
          <Card>
            <h3>A ruleset, what shipped</h3>
            <p>
              Your grammar crosses the boundary <b>once</b>, up front. The Rust core does every match itself, through the
              engine it already has. Nothing to execute, so nothing can capture your text.
            </p>
          </Card>
        </Grid>
        <RuleRows
          rows={[
            {
              term: 'Tier cap',
              body: (
                <>
                  A rule may claim <b>entropy</b> or <b>contextual</b> only. The top three tiers are reserved for
                  built-ins, so your rule can add finds, <b>never overturn one</b>.
                </>
              ),
            },
            { term: 'Validators', body: 'Chosen by name from a closed list. Never a function, an expression, or a body you write.' },
            { term: 'Confidence', body: 'Always medium. There is no field to raise it.' },
            {
              term: 'Size',
              body: (
                <>
                  64 KiB of UTF-8, parsed once up front. <b>Fail closed</b>: one bad line rejects the file.
                </>
              ),
            },
          ]}
        />
      </DocSection>

      <DocSection
        eyebrow="Personal data"
        title="A sixth thing to find, kept apart"
        lede={
          <>
            Personal data has its own domain <em>beside</em> the five tiers: email, IBAN, payment card, phone, network
            address and US social security number. It is <b>opt in and off by default on every surface</b>, and
            activation is explicit.
          </>
        }
      >
        <Grid cols={3}>
          <Card>
            <h3>Luhn</h3>
            <p>Payment cards are validated by the checksum the card industry already uses, as a named, versioned validator.</p>
          </Card>
          <Card>
            <h3>IBAN mod-97</h3>
            <p>Bank account numbers are checked by the ISO remainder test, not by shape alone.</p>
          </Card>
          <Card>
            <h3>SSN allocation</h3>
            <p>Structural exclusions the US agency publishes, never issuance or identity lookup.</p>
          </Card>
        </Grid>
        <p>
          These three are the first <em>arithmetic</em> checks in the engine. Before them, the only numeric test in the
          whole core was one CRC-32 on one provider's key.
        </p>
        <Note tone="danger">
          <p>
            <b>
              Every PII family is <StatusChip tone="none">Pending</StatusChip>.
            </b>{' '}
            Availability is not a support claim. They stay pending until the exact-artifact benchmark evidence is
            reviewed, so <b>trust neither a hit nor a miss yet.</b>
          </p>
        </Note>
      </DocSection>

      <SourceStrip label="Sources.">
        The tier ladder and tie-breakers are <code>types.rs</code> and <code>pipeline.rs</code>; the four-part shape is{' '}
        <code>detectors/pattern.rs</code>; the name lists, thresholds and exclusions are{' '}
        <code>detectors/generic_token.rs</code>; the ruleset grammar is <code>ruleset.rs</code> and{' '}
        <code>docs/guides/rulesets.md</code>; the PII families are <code>pii/</code> and{' '}
        <code>structured_validators.rs</code>. <b>Every credential shape shown here is a format, not a value.</b>
      </SourceStrip>
    </>
  );
}
