import type { ReleaseSlots } from '../../slots';

export type DocsSnippetId =
  | 'js-core-install'
  | 'js-core'
  | 'python-core-install'
  | 'python-core'
  | 'pino-install'
  | 'pino'
  | 'otel-install'
  | 'otel'
  | 'python-logging-install'
  | 'python-logging'
  | 'mcp-install'
  | 'mcp'
  | 'ai-context-install'
  | 'ai-context'
  | 'gateway'
  | 'vault-install'
  | 'vault';

const version = (slots: ReleaseSlots, id: string) => {
  const value = slots.packages[id]?.version;
  if (!value) throw new Error(`docs snippet: missing released package "${id}"`);
  return value;
};

/** Runnable examples and install commands. Versions always come from data/release.json. */
export function snippetsForDocs(slots: ReleaseSlots): Record<DocsSnippetId, string> {
  return {
    'js-core-install': `npm install @redact-secret/core@${slots.core.npm}`,
    'js-core': `import { initialize, scanAndRedact } from "@redact-secret/core";

await initialize();
const result = scanAndRedact("API_KEY=SYNTHETIC_REVOKED_CONTEXT_VALUE");
console.log(result.text, result.findings.length);`,
    'python-core-install': `python -m pip install redact-secret==${slots.core.pypi}`,
    'python-core': `import redact_secret

result = redact_secret.scan_and_redact("API_KEY=SYNTHETIC_REVOKED_CONTEXT_VALUE")
print(result.text, len(result.findings))`,
    'pino-install': `npm install @redact-secret/core@${slots.core.npm} @redact-secret/adapter-pino@${version(slots, 'adapter-pino')} pino`,
    'pino': `import pino from "pino";
import { createRedactingHooks } from "@redact-secret/adapter-pino";

const logger = pino({ hooks: await createRedactingHooks() });
logger.info({ apiKey: "SYNTHETIC_REVOKED_VALUE" }, "ready");`,
    'otel-install': `npm install @redact-secret/core@${slots.core.npm} @redact-secret/adapter-otel-trace@${version(slots, 'adapter-otel-trace')} @opentelemetry/sdk-trace-base`,
    'otel': `import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { createRedactingSpanProcessor } from "@redact-secret/adapter-otel-trace";

const processor = await createRedactingSpanProcessor(
  new SimpleSpanProcessor(exporter),
);
// Register processor with your existing tracer provider.`,
    'python-logging-install': `python -m pip install redact-secret-adapters==${version(slots, 'adapters-py')}`,
    'python-logging': `import logging
from redact_secret_adapters.logging_filter import RedactSecretFilter

handler = logging.StreamHandler()
handler.addFilter(RedactSecretFilter())
logging.getLogger().addHandler(handler)`,
    'mcp-install': `npm install @redact-secret/core@${slots.core.npm} @redact-secret/adapter-mcp@${version(slots, 'adapter-mcp')}`,
    'mcp': `import { createMcpBoundary, toCallToolResult } from "@redact-secret/adapter-mcp";

const boundary = await createMcpBoundary();
const outcome = await boundary.sanitizeToolCall(({ signal }) =>
  client.callTool(params, undefined, { signal }),
);
const safeResult = toCallToolResult(outcome);`,
    'ai-context-install': `npm install @redact-secret/core@${slots.core.npm} @redact-secret/adapter-ai-context@${version(slots, 'adapter-ai-context')}`,
    'ai-context': `import { createAiContextBoundary } from "@redact-secret/adapter-ai-context";

const boundary = await createAiContextBoundary();
const outcome = boundary.buildContext([
  { role: "user", text: "API_KEY=SYNTHETIC_REVOKED_VALUE" },
]);
if (outcome.outcome !== "ok") throw new Error(outcome.outcome);
sendToModel(outcome.value);`,
    gateway: `const client = new OpenAI({
  baseURL: "http://127.0.0.1:8787/v1",
  apiKey: process.env.OPENAI_API_KEY,
});
// Gateway is source-only and experimental; qualify the supported endpoint first.`,
    'vault-install': `npm install @redact-secret/core@${slots.core.npm} @redact-secret/vault@${version(slots, 'vault')}`,
    vault: `const captured = await vault.capture({
  value: "SYNTHETIC_REVOKED_VALUE",
  sink: "support-tool",
  path: "ticket.customerToken",
});

const restored = await vault.restore(captured.token, {
  sink: "support-tool",
  path: "ticket.customerToken",
});`,
  };
}
