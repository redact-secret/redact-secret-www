import { createContext, type ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import type { LocaleShellV1 } from '../../contracts';
import { defaultLocale, type Locale } from '../../i18n';
import { routeHref } from '../../routes';
import { Dim, Flag } from '../architecture/RichCode';
import { PlaceholderChip } from './PlaceholderChip';
import { StatusChip } from './StatusChip';

/**
 * The structured rich-text form of the locale copy in i18n/ (schemas/
 * locale-common-v1.schema.json): a string, or a list of inline nodes. Every
 * contract generates the same shapes, so any one namespace names them.
 */
export type RichText = LocaleShellV1.Rich;
export type InlineNode = LocaleShellV1.Inline;

/** Values a page supplies for `{ "var": name }` nodes: slots, or fragments it composes. */
export type RichVars = Record<string, ComponentChildren>;

/** The locale internal links resolve in. AppShell provides it for its page. */
export const RichLocale = createContext<Locale>(defaultLocale);

export type RichProps = {
  value: RichText;
  vars?: RichVars;
};

/**
 * Renders rich text as the elements it names — never as an HTML string.
 * Internal links (`to`) resolve through the route registry in the page's
 * locale; a `var` the page did not supply is an error, not an empty gap.
 */
export function Rich({ value, vars }: RichProps) {
  const locale = useContext(RichLocale);
  return <>{render(value, { locale, vars: vars ?? {} })}</>;
}

type Env = { locale: Locale; vars: RichVars };

function render(value: RichText, env: Env): ComponentChildren {
  if (typeof value === 'string') return value;
  return value.map((node) => renderNode(node, env));
}

function renderNode(node: InlineNode, env: Env): ComponentChildren {
  if (typeof node === 'string') return node;
  if ('b' in node) return <b>{render(node.b, env)}</b>;
  if ('em' in node) return <em>{render(node.em, env)}</em>;
  if ('code' in node) return <code>{render(node.code, env)}</code>;
  if ('span' in node) return <span class={node.class}>{render(node.span, env)}</span>;
  if ('br' in node) return <br />;
  if ('to' in node) return <a href={routeHref(env.locale, node.to)}>{render(node.a, env)}</a>;
  if ('href' in node) return <a href={node.href}>{render(node.a, env)}</a>;
  if ('var' in node) {
    if (!(node.var in env.vars)) throw new Error(`rich text: no value for var "${node.var}"`);
    return env.vars[node.var];
  }
  if ('status' in node) return <StatusChip tone={node.tone}>{render(node.status, env)}</StatusChip>;
  if ('dim' in node) return <Dim>{render(node.dim, env)}</Dim>;
  if ('flag' in node) return <Flag>{render(node.flag, env)}</Flag>;
  if ('placeholder' in node) return <PlaceholderChip>{plainText(node.placeholder, {})}</PlaceholderChip>;
  throw new Error(`rich text: unknown node ${JSON.stringify(node)}`);
}

/**
 * Rich text as a plain string, for attributes and live-region text: only
 * text and vars are allowed, so markup can never be flattened silently.
 */
export function plainText(value: RichText, vars: Record<string, string | number>): string {
  if (typeof value === 'string') return value;
  return value
    .map((node) => {
      if (typeof node === 'string') return node;
      if ('var' in node) {
        if (!(node.var in vars)) throw new Error(`rich text: no value for var "${node.var}"`);
        return String(vars[node.var]);
      }
      throw new Error(`rich text: markup where plain text is required: ${JSON.stringify(node)}`);
    })
    .join('');
}
