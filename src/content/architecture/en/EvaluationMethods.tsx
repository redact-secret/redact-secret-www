import {
  Card,
  Claim,
  Dim,
  DocSection,
  Grid,
  MethodBlock,
  Note,
  PageHead,
  Phase,
  RichCode,
  RuleRows,
  SourceStrip,
  SpanLattice,
} from '../../../components/architecture';
import { StatusChip } from '../../../components/ui';
import type { Locale } from '../../../i18n';
import { evidence } from '../../../slots';

const { sources } = evidence;

export function EvaluationMethods(_props: { locale: Locale }) {
  return (
    <>
      <PageHead
        eyebrow="04 · Evaluation methods"
        title="The scanner never gets a vote on whether it was right"
        lede="Ten test methods. One rule underneath all of them."
      />

      <DocSection
        eyebrow="The rule"
        title="Write down the answer first. Then run it."
        lede={
          <>
            Every method insists the expected result is authored, reviewed and hashed <em>before</em> any scanner
            touches the bytes. Not as a nicety, but as <b>the thing that makes a number mean anything</b>.
          </>
        }
      >
        <RuleRows
          rows={[
            { term: 'Spec 01', body: '“A scanner result must never create or revise ground truth.”' },
            { term: 'Spec 04', body: '“…rather than inferring validity from scanner agreement.”' },
            { term: 'Spec 05', body: '“Recalculate spans from construction, never by searching scanner output.”' },
            { term: 'Spec 06', body: '“Never relabel a control because a competitor flags it.”' },
            { term: 'Spec 08', body: '“Majority agreement cannot promote, demote, or rewrite an expectation.”' },
          ]}
        />
        <p class="small">
          Scanners are even kept in the dark: adapters get only the fixture's identity and its bytes,{' '}
          <b>never the expectation, never the evidence tier.</b>
        </p>
      </DocSection>

      <DocSection
        eyebrow="How a result is graded"
        title="Five answers, not two"
        lede={
          <>
            “Did it find the secret?” is too blunt. The true span is known to the byte, so the grade is about{' '}
            <em>which bytes</em>.
          </>
        }
      >
        <SpanLattice
          passLabel="Pass"
          failLabel="Fail"
          legend={{ hit: 'secret bytes, redacted', leak: 'secret bytes that leaked', over: 'innocent bytes taken too' }}
          rows={[
            {
              code: 'Exact',
              pass: true,
              cells: ['none', 'none', 'hit', 'hit', 'hit', 'hit', 'none', 'none'],
              description: 'Redacts exactly the secret bytes',
            },
            {
              code: 'Covered',
              pass: true,
              cells: ['none', 'over', 'hit', 'hit', 'hit', 'hit', 'over', 'none'],
              description: 'Redacts the whole secret plus one byte either side, within the allowance',
            },
            {
              code: 'Overbroad',
              pass: false,
              cells: ['over', 'over', 'hit', 'hit', 'hit', 'hit', 'over', 'over'],
              description: 'Redacts the secret but takes surrounding text beyond the allowance',
            },
            {
              code: 'Partial',
              pass: false,
              cells: ['none', 'none', 'hit', 'hit', 'hit', 'leak', 'none', 'none'],
              description: 'Redacts part of the secret; the last byte leaks',
            },
            {
              code: 'Miss',
              pass: false,
              cells: ['none', 'none', 'leak', 'leak', 'leak', 'leak', 'none', 'none'],
              description: 'Every secret byte leaks',
            },
          ]}
        />
        <Claim
          sub={
            <>
              That is <b>Partial</b>, and it fails. So does <b>Overbroad</b>: swallowing the paragraph around the key
              hides the key but destroys the log line. Only a span inside its authored allowance passes.
            </>
          }
        >
          Catching 31 of 32 bytes is not a near miss. It is a leak.
        </Claim>
      </DocSection>

      <DocSection
        eyebrow="The ten methods"
        title="Each one asks a different way to be wrong"
        lede={
          <>
            They are numbered because they are a sequence: everything after the first is <em>derived</em> from it. You
            cannot write a twin without a canonical positive to twin.
          </>
        }
      >
        <Phase title="First, make a truth">one credential, one simplest case</Phase>
        <MethodBlock
          n="01"
          title="Canonical positive"
          ask="Does it find the easy one?"
          gist={
            <>
              The seed every other method grows from. Byte ranges, evidence and source hash are recorded <b>before</b>{' '}
              a scanner runs. <b>Passing this alone earns no support claim at all.</b>
            </>
          }
        />

        <Phase title="Then prove it is fussy, not greedy">
          a detector that matches more text looks better on positives alone
        </Phase>
        <MethodBlock
          n="02"
          title="Negative twin"
          ask="Change exactly one thing. Does it go quiet?"
          gist={
            <>
              One mutation only: prefix, length, alphabet, boundary or public-prefix. Two changes is not a twin. The pair
              is scored as <b>one unit</b>, so you cannot win by flagging everything.
            </>
          }
        >
          <RichCode label="Negative twin example">
            ACME_KEY=… <Dim>must fire</Dim>
            {'\n'}ACMX_KEY=… <Dim>must not</Dim>
          </RichCode>
        </MethodBlock>
        <MethodBlock
          n="06"
          title="Benign lookalikes"
          ask="Does it stay silent on things that merely look like keys?"
          gist={
            <>
              Deliberately close to the real thing, each one probing a specific way to overmatch. Policy-based controls
              are counted in a <b>separate denominator</b> from source-backed ones, so a judgement call cannot dilute a
              fact.
            </>
          }
        >
          <RichCode label="Benign lookalike examples">
            AKIAIOSFODNN7EXAMPLE <Dim>from the vendor's own docs</Dim>
            {'\n'}&lt;your-api-key-here&gt;{'  '}
            <Dim>placeholder</Dim>
            {'\n'}pk_live_…{'            '}
            <Dim>publishable, meant to be public</Dim>
          </RichCode>
        </MethodBlock>

        <Phase title="Then attack it">edges, characters, containers, and machine-made variants</Phase>
        <MethodBlock
          n="03"
          title="Boundary cases"
          ask="What happens one character either side of the rule?"
          gist={
            <>
              Every documented length and delimiter needs a case <b>inside and outside</b> it, or a written reason why
              that pair is meaningless. Catches off-by-one ranges and accidental substring matches — down to end of
              file, no final newline, CRLF, and touching the next token.
            </>
          }
        />
        <MethodBlock
          n="04"
          title="Alphabet mutations"
          ask="Is it really checking the body, or just the prefix and the length?"
          gist={
            <>
              One character swapped, everything else held still. A cheap detector that only checks “right prefix,
              roughly right length” fails <b>here and nowhere else</b>.
            </>
          }
        >
          <RichCode label="Alphabet mutation example">
            ACME_a9f3k2… <Dim>legal characters, fire</Dim>
            {'\n'}ACME_a9f!k2… <Dim>illegal character, silent</Dim>
          </RichCode>
        </MethodBlock>
        <MethodBlock
          n="05"
          title="Context permutations"
          ask="Same key, different wrapper. Same answer?"
          gist={
            <>
              bare · .env · JSON · YAML · TOML · source code · Markdown · URI · quoted · CRLF. The credential bytes do
              not change; everything around them does. The expected answer must <b>survive every supported wrapper</b>,
              and each context is reported separately so one big family cannot hide one weak one.
            </>
          }
        />
        <MethodBlock
          n="07"
          title="Generated mutations"
          ask="What about the thousand variants nobody would hand-write?"
          gist={
            <>
              Explicitly <b>not fuzzing</b>: variants are generated before any scan, each tagged in advance as preserve,
              invalidate or review-required, and bounded in count and cost. With operator v3, seed 41 and the source
              hash, <b>a clean checkout reproduces them byte for byte</b>.
            </>
          }
        />

        <Phase title="Then look outward, and forward">other tools, unseen cases, and the passage of time</Phase>
        <MethodBlock
          n="08"
          title="Competitor disagreement"
          ask="Where do we and Gitleaks and TruffleHog differ on identical bytes?"
          gist={
            <>
              Competitors are <b>observations, never an oracle</b>. Every adapter is graded against the authored
              expectation on its own. A disagreement <b>opens a review item</b> for a human; it never edits the
              expectation.
            </>
          }
        />
        <MethodBlock
          n="09"
          title="Holdout evaluation"
          ask="How does it do on cases it was never tuned against?"
          gist={
            <>
              The exam nobody studied for. The ordinary development command <b>cannot even read</b> the holdout corpus,
              the candidate is frozen before the cases are revealed, and touching the candidate afterwards voids the
              run. A newer rule closes the last loophole: <b>holdout results may never be used to pick scorer
              thresholds or weights</b>, and retuning because of what holdout showed contaminates the epoch.
            </>
          }
        />
        <MethodBlock
          n="10"
          title="Regression freeze"
          ask="Could we quietly break this next month?"
          gist={
            <>
              A finished run becomes an immutable comparison point (<code>baselines/{evidence.baseline}.json</code> —
              fixture hashes, versions, every outcome). A new <b>Partial</b>, <b>Miss</b> or false alarm fails the
              build. An intentional change needs <b>a written, approved reason</b> before the baseline moves, and
              improvements never erase the old record.
            </>
          }
        />
      </DocSection>

      <DocSection
        eyebrow="The escape hatch"
        title="There is a third answer"
        lede={
          <>
            Real formats are ambiguous at the edges. A suite that forces every case into pass or fail{' '}
            <b>starts inventing facts.</b> So these methods keep a third bucket.
          </>
        }
      >
        <Grid cols={3}>
          <Card>
            <h3>
              <StatusChip tone="success">Preserve</StatusChip>
            </h3>
            <p>Still a secret after the change. Must be caught.</p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="danger">Invalidate</StatusChip>
            </h3>
            <p>No longer a secret. Must be ignored.</p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="none">Review required</StatusChip>
            </h3>
            <p>
              Nobody knows yet. <b>Scored as nothing</b>; a human decides.
            </p>
          </Card>
        </Grid>
        <p>
          A review-required case makes no pass or fail claim and never enters an average. The same goes for{' '}
          <b>T0</b> evidence: observable, inspectable, and deliberately unscored.
        </p>
        <Note>
          <p>
            <b>Why this matters:</b> the alternative is settling ambiguity by seeing what the scanners did, which is
            exactly the loop the whole suite exists to break.
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow="What it all buys" title="Even with all ten green">
        <Grid cols={2}>
          <Card>
            <h3>
              <StatusChip tone="success">Proven</StatusChip>
            </h3>
            <p>
              That on these exact bytes, at this exact version, with these pinned tool versions, the scanner behaved as
              reviewers said it should — and that anyone can reproduce it from a clean checkout.
            </p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="none">Not proven</StatusChip>
            </h3>
            <p>
              Production accuracy. Method 01 says so outright: this is <em>fixture-relative</em> coverage. Method 09
              adds that holdout does not establish production accuracy either.{' '}
              <b>Ten green methods describe the corpus, not the world.</b>
            </p>
          </Card>
        </Grid>
        <p class="small">
          Which is why no single method is enough on its own, and why the support matrix grades a family on{' '}
          <b>how many of these it has cleared</b> rather than on <b>whether it was ever detected once</b>.
        </p>
      </DocSection>

      <SourceStrip label="Sources.">
        The ten specs in <code>docs/specs/evaluation-methods/</code> in the benchmarks repository at{' '}
        <code>{sources.benchmarks.commit}</code>, read in full on {evidence.observedAt}. Quoted lines are verbatim; the
        examples are synthetic illustrations of each method's shape, not fixtures copied from the corpus.
      </SourceStrip>
    </>
  );
}
