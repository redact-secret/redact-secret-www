import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';
import { initialize, scanAndRedact } from '@redact-secret/core';
import { root } from './data/contracts.mjs';

const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const docs = { en: read('i18n/en/docs.json'), ko: read('i18n/ko/docs.json') };
const release = read('data/release.json');
const evidence = read('data/evidence.json');
const errors = [];
const fail = (message) => errors.push(message);

const server = await createServer({
  root,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const { docsPages } = await server.ssrLoadModule('/src/content/docs/pages.ts');
  const { snippetsForDocs } = await server.ssrLoadModule('/src/content/docs/snippets.ts');
  const slotModule = await server.ssrLoadModule('/src/slots/index.ts');
  slotModule.installReleaseData(release, evidence);
  const snippets = snippetsForDocs(slotModule.slots);
  const ids = docsPages.map((page) => page.id);

  for (const locale of ['en', 'ko']) {
    const pageIds = docs[locale].pages.map((page) => page.id);
    if (JSON.stringify(pageIds) !== JSON.stringify(ids)) fail(`${locale}: page IDs or order differ from src/content/docs/pages.ts`);
    const titles = docs[locale].pages.map((page) => page.title);
    const descriptions = docs[locale].pages.map((page) => page.description);
    if (new Set(titles).size !== titles.length) fail(`${locale}: page titles must be unique`);
    if (new Set(descriptions).size !== descriptions.length) fail(`${locale}: page descriptions must be unique`);
    for (const page of docs[locale].pages) {
      for (const section of page.sections) {
        if (section.snippet && !snippets[section.snippet]) fail(`${locale}/${page.id}: unknown or empty snippet ${section.snippet}`);
      }
    }
    if (/\b\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?\b/.test(JSON.stringify(docs[locale]))) {
      fail(`${locale}: package versions belong in source-driven snippets, not docs prose`);
    }
  }

  for (const [id, snippet] of Object.entries(snippets)) {
    if (!snippet.trim()) fail(`snippet ${id}: empty`);
    if (/AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}/.test(snippet)) fail(`snippet ${id}: credential-shaped literal is not an approved synthetic marker`);
  }

  const javascript = ['js-core', 'pino', 'otel', 'mcp', 'ai-context', 'gateway', 'vault'];
  for (const id of javascript) {
    const checked = spawnSync(process.execPath, ['--check', '--input-type=module'], { input: snippets[id], encoding: 'utf8' });
    if (checked.status !== 0) fail(`snippet ${id}: JavaScript syntax check failed`);
  }
  for (const id of ['python-core', 'python-logging']) {
    const checked = spawnSync('python3', ['-c', 'import ast,sys; ast.parse(sys.stdin.read())'], { input: snippets[id], encoding: 'utf8' });
    if (checked.status !== 0) fail(`snippet ${id}: Python syntax check failed`);
  }

  const official = [
    'https://getpino.io/',
    'https://opentelemetry.io/docs/',
    'https://modelcontextprotocol.io/',
    'https://github.com/redact-secret/redact-secret-adapters',
    'https://github.com/redact-secret/gateway',
  ];
  for (const href of official) {
    for (const locale of ['en', 'ko']) if (!JSON.stringify(docs[locale]).includes(href)) fail(`${locale}: missing official ecosystem link ${href}`);
  }

  await initialize();
  const input = 'API_KEY=SYNTHETIC_REVOKED_CONTEXT_VALUE';
  const result = scanAndRedact(input);
  assert.notEqual(result.text, input, 'core docs smoke input must be redacted');
  assert.ok(result.findings.length > 0, 'core docs smoke input must produce a finding');
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await server.close();
}

if (errors.length) {
  for (const error of errors) console.error(`check-docs: ${error}`);
  console.error(`check-docs: ${errors.length} problem(s)`);
  process.exit(1);
}

console.log(`check-docs: ${docs.en.pages.length} bilingual pages, source-driven snippets, official links, and the core smoke path are valid`);
