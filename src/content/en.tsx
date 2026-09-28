import { anchors, urls } from './shared';
import type { SiteContent } from './types';

export const en: SiteContent = {
  locale: 'en',
  meta: {
    title: 'Redact Secret — runtime credential redaction',
    description:
      'Redact Secret detects supported credentials while data is still in your application and replaces them before they reach logs, traces, tools, or AI context.',
  },
  shell: {
    skipToContent: 'Skip to content',
    mainNavLabel: 'Main',
    nav: [
      { label: 'Playground', href: `/en/#${anchors.playground}` },
      { label: 'Docs', href: `/en/#${anchors.integrations}` },
      { label: 'Architecture', href: '/en/architecture/' },
      { label: 'Benchmarks', href: urls.benchmarks, external: true },
      { label: 'GitHub', href: urls.repo, external: true },
      { label: 'Community', href: `#${anchors.community}` },
    ],
    getStarted: 'Get started',
    languageLabel: 'Language',
    themeLabel: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    menu: 'Menu',
    closeMenu: 'Close menu',
  },
  footer: {
    tagline: 'Deterministic secret detection and redaction for runtime data and AI context. MIT licensed.',
    columns: [
      {
        title: 'Product',
        links: [
          { label: 'Quickstart', href: `/en/#${anchors.firstRun}` },
          { label: 'Guides', href: `/en/#${anchors.integrations}` },
          { label: 'Architecture', href: '/en/architecture/' },
          { label: 'Reference', href: `/en/#${anchors.evidence}` },
        ],
      },
      {
        title: 'Evidence',
        links: [
          { label: 'Releases', href: urls.releaseStatus },
          { label: 'Support matrix', href: urls.supportMatrix },
          { label: 'Benchmarks', href: urls.benchmarks, external: true },
        ],
      },
      {
        title: 'Community',
        links: [
          { label: 'GitHub Issues', href: urls.issues },
          { label: 'Security reporting', href: urls.security },
          { label: 'GitHub', href: urls.repo, external: true },
        ],
      },
    ],
    channelNote:
      'Slack and Discord links appear only once maintained channels exist. Never post a live credential in a public channel.',
    languageNote: 'Korean pages that link an English original label it as such.',
  },
  hero: {
    eyebrow: 'Runtime credential redaction · Open source',
    title: (
      <>
        Secrets spread fast.
        <br />
        Stop them before they spread.
      </>
    ),
    lede: (
      <>
        A credential pasted into a prompt can end up in a tool response, a trace, a log, and a conversation
        history. Redact Secret detects supported credentials <b>while the data is still in your application</b>{' '}
        and replaces them before they reach those destinations.
      </>
    ),
    primaryCta: 'Get started',
    secondaryCta: 'View benchmarks',
    proof: 'One local detection core. Integrations for the paths your data takes.',
    io: {
      caption: 'One scan',
      footnote:
        'Synthetic fixture, never a live credential. The finding metadata records the family, the offset and the length — never the value.',
    },
  },
  problem: {
    eyebrow: 'The runtime problem',
    title: 'Protect live data, not just source code.',
    lede: (
      <>
        Repository scanners help find secrets committed to code. Redact Secret works where your application
        handles text at runtime: user input, error messages, tool results, logs, traces, stored records, and
        model context. <b>One paste becomes five copies before anyone notices.</b>
      </>
    ),
    sourceLabel: 'A user pastes one line',
    sourceNote:
      'The application never asked for a credential. It arrived inside text the application does not control.',
    redactedLabel: 'redacted credential value',
    destinations: [
      { name: 'Tool response', note: 'returned to the agent, then quoted back into context' },
      { name: 'Trace span attribute', note: 'exported to a vendor backend, retained for weeks' },
      { name: 'Application log', note: 'shipped, indexed, searchable by everyone on call' },
      { name: 'Conversation history', note: 'replayed into every later turn of the session' },
      { name: 'Stored record', note: 'written to the database, the cache and the search index' },
    ],
    kept: 'Value kept',
    counts: [
      { value: '1', label: 'paste' },
      { value: '5', label: 'systems now hold it' },
      { value: '0', label: 'of them are the place to fix it' },
    ],
    remedy:
      'Rotating the credential is the only remedy once it has landed. The scan belongs one step earlier, at the boundary where your application hands the text to something else.',
  },
  integrations: {
    eyebrow: 'Core, adapters, and vault',
    title: 'Use the core directly — or connect the host you already use.',
    lede: (
      <>
        One Rust detection core sits behind every package. Adapters wire it into logging, tracing, and AI workflows
        without recreating detection rules in each host; the vault is a separate, opt-in way to restore what was
        redacted. <b>Each card states what that package does not cover.</b>
      </>
    ),
    groups: {
      core: { title: 'Core', lede: 'One engine, three ways in.', link: urls.repo },
      adapters: {
        title: 'Adapters',
        lede: 'Host integrations. They decide nothing — they carry text into the core and its answer back out.',
        link: urls.adapters,
      },
      vault: {
        title: 'Vault',
        lede: 'Optional and separate. The core never keeps a value; the vault holds a mapping in memory only when you ask it to, and restores only under your policy.',
        link: urls.vault,
      },
    },
    runtimes: { browser: 'Browser', node: 'Node.js', python: 'Python' },
    terms: { version: 'Version', registries: 'Registries', core: 'Core', host: 'Host', tag: 'npm tag', install: 'Install' },
    statusLabels: { released: 'Published', alpha: 'Alpha', unpublished: 'Not published' },
    notPublished: 'not on the registry',
    cards: {
      core: {
        title: 'Core library',
        description: 'Detection, policy, and redaction in Rust, with one API for JavaScript (Node.js and browsers), Python, and Rust.',
        coverage: 'Credentials by default. PII detection is opt-in and off unless you select it.',
      },
      wasm: {
        title: 'WebAssembly build',
        description: (
          <>
            The browser build of the core. Installed automatically with <code>@redact-secret/core</code>; not meant to be
            imported directly.
          </>
        ),
        coverage: 'Runs on the page or in a Worker — the playground above uses it.',
      },
      cli: {
        title: 'CLI',
        description: 'Reads standard input or one file and writes the sanitized text, for shells, pipelines, and hooks.',
        coverage: 'Installed from crates.io, not npm. PII is opt-in with --pii.',
      },
      'web-stream': {
        title: 'Web Streams',
        description: 'A TransformStream that redacts text as it streams, shipped inside the core.',
        coverage: 'There is no separate browser adapter package; this core subpath is the browser integration.',
      },
      pino: {
        title: 'Pino',
        description: 'Redacts values in log calls and in the finished line, alongside pino’s own path-based redact.',
        coverage: 'Not object keys, and nothing a destination or transport adds after the line is written.',
      },
      otel: {
        title: 'OpenTelemetry traces',
        description: 'Wraps the next SpanProcessor and redacts string attributes, events, span names, and status messages.',
        coverage: 'Attribute names are not redacted; spans the wrapped processor never receives are out of reach.',
      },
      masking: {
        title: 'Masking callbacks',
        description: 'createMaskSecrets() for hosts that hand you a value to mask, such as Langfuse.',
        coverage: 'Covers only what the host routes through its callback.',
      },
      'ai-context': {
        title: 'AI context',
        description: 'Builds model context from user input and tool results — fail-closed and all-or-nothing.',
        coverage: 'Binary and encoded values are blocked, not decoded. Model output is not covered.',
      },
      mcp: {
        title: 'MCP tool calls',
        description: 'Scans tools/call and resources/read results before they are logged, stored, or placed in context.',
        coverage: 'Other MCP methods are out of scope; binary payloads block the result by default.',
      },
      logging: {
        title: 'Python logging',
        description: 'A logging.Filter that adds value-based redaction to the standard library.',
        coverage: 'Runs only where attached — put it on every emitting handler, not the logger.',
      },
      'otel-py': {
        title: 'OpenTelemetry Python',
        description: 'Wraps the next span processor in Python services.',
        coverage: 'Installed only with the otel extra. A span that cannot be rewritten is dropped, not exported.',
      },
      'masking-py': {
        title: 'Masking callbacks',
        description: 'mask_secrets for hosts that hand you a value to mask, such as Langfuse.',
        coverage: 'Covers only what the host routes through its callback.',
      },
      'vault-browser': {
        title: 'Vault',
        description: 'Replaces a secret with an opaque <rsv_…> token on the way to a model, and restores it only into a field you designate.',
        coverage: 'Main thread, or an opt-in dedicated-Worker mode qualified separately. No storage, no network.',
      },
      'vault-node': {
        title: 'Vault',
        description: 'The same in-memory capture and restore in Node.js 20, 22, and 24.',
        coverage: 'Pins one exact core version; it does not install beside a different one.',
      },
      'vault-server': {
        title: 'Vault server',
        description: 'Authorizes every restore by principal, tenant, source, destination, and value path.',
        coverage: 'In-memory backend only; persistent stores are a proposal, not a package.',
      },
      'vault-py': {
        title: 'Vault (Python)',
        description: 'A native Python implementation of the vault server’s authorization contract.',
        coverage: 'Research-grade and not on PyPI: install from the repository. Capture needs a node executable.',
      },
    },
    observed: (date) => (
      <>
        Versions, tags, and ranges as published on the registries, observed <b>{date}</b>.
      </>
    ),
  },
  quickstart: {
    eyebrow: 'First run',
    title: 'Start with a single scan.',
    lede: 'Install a specific published version, run one scan, and compare the output. The same synthetic fixture is used in every runtime.',
    tabsLabel: 'Runtime',
    rustNote: (
      <>
        Rust is installed from crates.io; its first example lives in the <a href={urls.rustGuide}>Rust guide</a>.
      </>
    ),
    pinLabel: 'Pinned at build',
    pin: (core) => (
      <>
        <b>{core.npm}</b> is the current beta, observed on the registries <b>{core.observedAt}</b>.{' '}
        {core.npmLatest === core.npm ? (
          <>
            npm <code>latest</code> points at it today — the command pins it anyway, because <code>latest</code> has
            moved before.
          </>
        ) : (
          <>
            npm <code>latest</code> points at <code>{core.npmLatest}</code>, so{' '}
            <code>npm install @redact-secret/core</code> alone will not select it.
          </>
        )}{' '}
        Python spells it <code>{core.pypi}</code>.
      </>
    ),
    why: {
      title: 'Why the version is written out',
      body: 'Package state is read from the release record at build time and stamped with its observation date, in one place. It is never retyped into translated prose.',
    },
    expect: {
      title: 'What you should see',
      body: (
        <>
          The value is gone and a typed placeholder stands in its place. <code>result.findings</code> describes the
          family, offset and length — and carries no plaintext.
        </>
      ),
    },
  },
  playground: {
    eyebrow: 'Playground',
    title: 'Try it on your own text.',
    lede: 'Edit the input and watch the output change. The detection core runs as WebAssembly in this tab — the same engine the packages ship.',
    privacy: (
      <>
        <b>Nothing you type leaves this browser tab.</b> It is not sent, stored, or logged, and spellcheck is
        off. Use synthetic values anyway: never paste a live credential into a web page.
      </>
    ),
    presetsLabel: 'Examples',
    presets: { env: '.env', log: 'Log line', json: 'JSON', header: 'Header', yaml: 'YAML', prose: 'No context', pii: 'PII' },
    styleLabel: 'Placeholder style',
    piiLabel: 'PII',
    piiModes: { off: 'Off', global: 'Global', us: 'Global + US' },
    piiNote: (
      <>
        PII detection is <b>opt-in</b> and off by default: credentials only. <b>Global</b> adds email, phone, payment
        card, IP address, and IBAN; <b>Global + US</b> adds US Social Security numbers. Each mode is a separate engine
        instance, because the core fixes its PII selection when it starts.
      </>
    ),
    inputLabel: 'Input',
    outputLabel: 'Output',
    clear: 'Clear',
    reset: 'Reset',
    loading: 'Loading the engine…',
    loadFailed: 'The engine could not load in this browser.',
    retry: 'Try again',
    staleEngine: 'The site was updated since this page opened. Reload the page to load the engine.',
    reload: 'Reload page',
    engine: (version, artifact) => (
      <>
        Runs locally · <span class="mono">@redact-secret/core {version}</span> ({artifact})
      </>
    ),
    size: (used, max) => `${used} / ${max}`,
    findingCount: (n) => (n === 1 ? '1 finding' : `${n} findings`),
    findingsTitle: 'Findings',
    columns: { id: 'ID', type: 'Type', detector: 'Detector', confidence: 'Confidence', action: 'Action', range: 'Range' },
    noFindings: (
      <>
        No findings. <b>An empty finding list is not proof that content is safe</b> — without a key name or other
        context, a generic value like this one is not detected.
      </>
    ),
    errors: {
      INPUT_LIMIT_EXCEEDED: 'The input is over the playground limit of 32 KB.',
      FINDING_LIMIT_EXCEEDED: 'The input produced more findings than the playground shows.',
      UNPAIRED_SURROGATE: 'The input contains a broken character that cannot be scanned.',
      default: 'The scan failed.',
    },
  },
  boundary: {
    eyebrow: 'How it works · Control',
    title: 'Your data stays in your process.',
    lede: 'Detection and redaction run locally, without sending text to a scanning service. No network calls, no telemetry, and the same input always gives the same result.',
    flowLabel: 'Where the core sits',
    flow: [
      {
        key: '01',
        title: 'Untrusted text',
        description: 'user input, config, errors, tool results, retrieved documents',
      },
      {
        key: '02',
        title: 'Application boundary',
        description: 'the last point you control before the text is handed on',
      },
      {
        key: '03 · Core',
        title: 'Redact Secret',
        description: 'detection, overlap resolution, policy, redaction — in your process',
        core: true,
      },
      {
        key: '04',
        title: 'Sanitized text + safe findings',
        description: 'findings describe the match; they never carry the value',
      },
      {
        key: '05',
        title: 'Logs · storage · traces · tools · model',
        description: 'each destination receives text that no longer holds the credential',
      },
    ],
    pillars: [
      {
        title: 'Browser: preventive',
        body: 'A scan in the client catches a pasted credential before it leaves the device. Clients can be modified or skipped, so this is useful — and it is never enforcement.',
      },
      {
        title: 'Server: authoritative',
        body: 'The server scans again, independently, before logging, storage, context construction, or model and tool invocation. That scan is the one your security decisions rely on.',
      },
      {
        title: (
          <>
            Who enforces <code>block</code>
          </>
        ),
        body: (
          <>
            The core reports a <code>block</code> action. <b>Your application is what rejects the request.</b>{' '}
            Redact Secret does not stop anything on its own.
          </>
        ),
      },
    ],
    links: [
      { label: 'The architecture, page by page', href: '/en/architecture/' },
      { label: 'Read the architecture', href: urls.architecture },
      { label: 'Safe integration guide', href: urls.safeIntegration },
    ],
  },
  evidence: {
    eyebrow: 'Public evidence',
    title: 'Claims you can inspect.',
    lede: 'Explore supported credential formats, their evidence status, and reproducible benchmark results. The benchmark site publishes its methods and limitations alongside the numbers.',
    links: [
      {
        title: 'Supported formats',
        body: 'Which credential families are supported and how strong the evidence is for each. Generated from evaluation evidence, not written by hand.',
        go: 'Support matrix →',
        href: urls.supportMatrix,
      },
      {
        title: 'Release status',
        body: 'Every published version with its source revision, artifact set, and registry state — including the runs that did not complete.',
        go: 'Release record →',
        href: urls.releaseStatus,
      },
      {
        title: 'Benchmarks',
        body: 'Project-maintained synthetic measurements with fixture provenance, tool versions, and stated limits. Reproducible regression evidence, not a product ranking.',
        go: 'Read the methods, then the numbers ↗',
        href: urls.benchmarks,
      },
    ],
    routing: {
      title: 'Which problem are you solving?',
      problemHeader: 'The problem',
      startHeader: 'Where to start',
      rows: [
        { problem: 'Find credentials already committed to Git history', start: 'Gitleaks or TruffleHog' },
        {
          problem: 'De-identify broad personal data in documents and images',
          start: 'Presidio or a managed data-protection service',
        },
        {
          problem:
            'Replace supported credentials in a running application before they reach logs, traces, tools or AI context',
          start: <b>Redact Secret</b>,
        },
      ],
      note: 'These tools solve different problems and are complementary. This table routes you; it is not a score.',
    },
    limits: {
      title: 'Limits',
      body: [
        <>
          Redact Secret detects <b>supported credential formats</b>, not every secret or personal-data category.{' '}
          <b>An empty finding list is not proof that content is safe.</b>
        </>,
        'It never contacts a provider, so it cannot tell whether a detected credential is still active. It does not validate, rotate or revoke credentials, does not walk commit history, and does not replace a DLP platform.',
      ],
    },
  },
  final: {
    eyebrow: 'Next step',
    title: 'Put protection where your data flows.',
    lede: 'Start with the core. Add the integration that fits your logs, traces, or AI workflow.',
    primaryCta: 'Get started',
    secondaryCta: 'GitHub',
  },
  notFound: {
    title: 'Page not found',
    body: 'This page does not exist.',
    home: 'Go to the home page',
  },
};
