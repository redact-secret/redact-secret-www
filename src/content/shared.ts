/**
 * Shared across locales, never translated: URLs, the one synthetic fixture,
 * and code snippets (CONVENTIONS.md § Bilingual content).
 */
import type { CoreSlot } from '../slots';

export const siteOrigin = 'https://www.redactsecret.com';

const repo = 'https://github.com/redact-secret/redact-secret';

export const urls = {
  repo,
  issues: `${repo}/issues`,
  security: `${repo}/blob/main/SECURITY.md`,
  architecture: `${repo}/blob/main/ARCHITECTURE.md`,
  safeIntegration: `${repo}/blob/main/docs/guides/safe-integration.md`,
  rustGuide: `${repo}/blob/main/docs/guides/rust.md`,
  supportMatrix: `${repo}/blob/main/docs/support-matrix.md`,
  releaseStatus: `${repo}/blob/main/docs/releases/status.md`,
  benchmarks: 'https://benchmarks.redactsecret.dev',
  adapters: 'https://github.com/redact-secret/redact-secret-adapters',
  vault: 'https://github.com/redact-secret/redact-secret-vault',
  benchmarksRepo: 'https://github.com/redact-secret/redact-secret-benchmarks',
};


/** In-page anchors shared by nav, footer, and sections. */
export const anchors = {
  top: 'top',
  main: 'main',
  problem: 'problem',
  integrations: 'integrations',
  firstRun: 'first-run',
  playground: 'playground',
  boundary: 'boundary',
  evidence: 'evidence',
  community: 'community',
} as const;

/** The page's one synthetic fixture. Never add a second example. */
export const fixture = {
  key: 'API_KEY',
  input: 'API_KEY=SYNTHETIC_REVOKED_CONTEXT_VALUE',
  placeholder: '<SECRET_1>',
  call: 'scanAndRedact()',
};

function snippetsFor(core: CoreSlot) {
  return {
    js: {
      label: 'JavaScript',
      install: `npm install @redact-secret/core@${core.npm}`,
      code: [
        'import { initialize, scanAndRedact } from "@redact-secret/core";',
        '',
        'await initialize();',
        `const result = scanAndRedact("${fixture.input}");`,
        'console.log(result.text);',
        `// ${fixture.key}=${fixture.placeholder}`,
      ].join('\n'),
    },
    python: {
      label: 'Python',
      install: `python -m pip install redact-secret==${core.pypi}`,
      code: [
        'import redact_secret',
        '',
        `result = redact_secret.scan_and_redact("${fixture.input}")`,
        'print(result.text)',
        `# ${fixture.key}=${fixture.placeholder}`,
      ].join('\n'),
    },
    cli: {
      label: 'CLI',
      install: `cargo install redact-secret-cli --version ${core.crate} --locked`,
      code: [
        `printf '%s\\n' '${fixture.input}' \\`,
        '  | redact-secret --redact',
        `# ${fixture.key}=${fixture.placeholder}`,
      ].join('\n'),
    },
  };
}

/** Install commands and first-run code, per language; set by installSnippets once the slots are. */
export let snippets!: ReturnType<typeof snippetsFor>;

export function installSnippets(core: CoreSlot) {
  snippets = snippetsFor(core);
}

/**
 * Playground presets: the same one fixture value in different carriers
 * (ADR 0001 § 7). `prose` is a deliberate miss — no key name, no context.
 */
const fixtureValue = fixture.input.split('=')[1];

export const playgroundPresets = {
  env: `API_KEY=${fixtureValue}`,
  log: `2026-09-28T10:00:00Z ERROR payment failed api_key=${fixtureValue} user=42`,
  json: `{"service":"billing","api_key":"${fixtureValue}","retry":3}`,
  header: `Authorization: Bearer ${fixtureValue}`,
  yaml: `database:\n  host: db.internal\n  password: ${fixtureValue}`,
  prose: `Can you check why this fails? My key is ${fixtureValue}`,
} as const;

/**
 * One synthetic value per PII family (ADR 0002), each unmistakably not a
 * person: a reserved `.local` mailbox, an unassigned area code, Stripe's
 * public test card, a private address, the voided "wallet" SSN, and the
 * standard example IBAN. Reserved documentation values (example.com,
 * 555-01xx, 4111…, 192.0.2.x) would be skipped by the engine on purpose.
 */
export const piiFixtures = {
  email: 'Email: synthetic.person@fixture.local',
  phone: 'Phone: 444-444-4444',
  card: 'Card number: 4242 4242 4242 4242',
  ip: 'Client IP: 10.0.0.5',
  ssn: 'SSN: 078-05-1120',
  iban: 'IBAN: GB82 WEST 1234 5698 7654 32',
};

export const playgroundPresetsWithPii = {
  ...playgroundPresets,
  pii: Object.values(piiFixtures).join('\n'),
};

export type PlaygroundPreset = keyof typeof playgroundPresetsWithPii;

/** Credentials and PII in one text, so switching PII on changes the output. */
export const playgroundDefault = [
  playgroundPresets.env,
  playgroundPresets.log,
  playgroundPresets.header,
  piiFixtures.email,
  piiFixtures.phone,
  piiFixtures.card,
].join('\n');
