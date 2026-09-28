// Checks on the locale copy in i18n/ that a JSON Schema cannot express:
// en/ko structural parity, link targets, the per-page size budget, and keys
// no page reads. Pure functions over parsed documents, so the offline tests
// (scripts/test-data-contracts.mjs) run them without a build; the build runs
// them through scripts/check-i18n.mjs.

export const locales = ['en', 'ko'];

/** Tag keys of the rich-text inline nodes (schemas/locale-common-v1.schema.json). */
const inlineTags = ['b', 'em', 'code', 'span', 'br', 'a', 'var', 'status', 'dim', 'flag', 'placeholder'];

const isInlineNode = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && inlineTags.some((t) => t in v);

/** A rich-text value: a string, or an array holding at least one inline node. */
export const isRich = (v) => typeof v === 'string' || (Array.isArray(v) && v.some(isInlineNode));

const tagOf = (node) => inlineTags.find((t) => t in node);

/**
 * What a rich value must share with its other-locale counterpart: the values
 * it interpolates, where it links, and the marks that carry meaning (status
 * chips, placeholders, code, sample marks, authored line breaks). Emphasis
 * (b, em, span) is the author's per locale — Korean word order moves it.
 */
export function richSignature(value) {
  const out = [];
  const walk = (v) => {
    if (typeof v === 'string') return;
    for (const node of v) {
      if (typeof node === 'string') continue;
      const tag = tagOf(node);
      if (tag === 'var') out.push(`var ${node.var}`);
      else if (tag === 'a') out.push(`link ${node.to ?? node.href}`);
      else if (tag === 'status') out.push(`status ${node.tone}`);
      else if (['code', 'dim', 'flag', 'placeholder', 'br'].includes(tag)) out.push(tag);
      if (tag !== 'var' && tag !== 'br') walk(node[tag]);
    }
  };
  walk(value);
  return out.sort();
}

/**
 * en/ko structural parity for one file: the same keys, the same array
 * lengths, rich text where the other has rich text, and the same rich-text
 * signature. `null` is an authored omission in one locale (the schema says
 * where it is allowed), so it matches anything.
 */
export function parityErrors(en, ko, label) {
  const errors = [];
  const cmp = (a, b, pointer) => {
    if (a === null || b === null) return;
    const where = `${label}${pointer}`;
    if (isRich(a) || isRich(b)) {
      if (!isRich(a) || !isRich(b)) return void errors.push(`${where}: rich text in one locale, ${isRich(a) ? 'something else in ko' : 'something else in en'}`);
      const sa = richSignature(a).join(', ');
      const sb = richSignature(b).join(', ');
      if (sa !== sb) errors.push(`${where}: en and ko differ in vars, links or marks (en: ${sa || 'none'}; ko: ${sb || 'none'})`);
      return;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b)) return void errors.push(`${where}: a list in one locale only`);
      if (a.length !== b.length) errors.push(`${where}: ${a.length} items in en, ${b.length} in ko`);
      for (let i = 0; i < Math.min(a.length, b.length); i++) cmp(a[i], b[i], `${pointer}/${i}`);
      return;
    }
    if (a && typeof a === 'object' && b && typeof b === 'object') {
      for (const k of Object.keys(a)) if (!(k in b)) errors.push(`${where}/${k}: missing in ko`);
      for (const k of Object.keys(b)) if (!(k in a)) errors.push(`${where}/${k}: missing in en`);
      for (const k of Object.keys(a)) if (k in b) cmp(a[k], b[k], `${pointer}/${k}`);
      return;
    }
    if (typeof a !== typeof b) errors.push(`${where}: ${typeof a} in en, ${typeof b} in ko`);
    else if (typeof a === 'boolean' && a !== b) errors.push(`${where}: ${a} in en, ${b} in ko`);
  };
  const { schemaVersion: _a, locale: _b, ...enBody } = en;
  const { schemaVersion: _c, locale: _d, ...koBody } = ko;
  if (en.schemaVersion !== ko.schemaVersion) errors.push(`${label}: schemaVersion ${en.schemaVersion} in en, ${ko.schemaVersion} in ko`);
  cmp(enBody, koBody, '');
  return errors;
}

/** Rich text as the words it shows, vars as `{name}`: for checks that read the copy. */
export function flatText(value) {
  if (typeof value === 'string') return value;
  return value
    .map((node) => {
      if (typeof node === 'string') return node;
      const tag = tagOf(node);
      if (tag === 'var') return `{${node.var}}`;
      if (tag === 'br') return ' ';
      return flatText(node[tag]);
    })
    .join('');
}

/** The value at a JSON pointer, or undefined. */
export const at = (doc, pointer) => pointer.split('/').slice(1).reduce((v, k) => (v == null ? undefined : v[k]), doc);

/**
 * Counts the prose spells out as words ("Four repositories", "열 가지"),
 * tied to the list they count. Each entry names the list (`count`), the
 * number the words say (`n`), and where the words are, per locale. A list
 * that changes length, or a sentence that loses its word, fails until the
 * sentences are re-read and the entry updated.
 */
export function spelledCountErrors(entries, docs) {
  const errors = [];
  for (const { what, count, n, words, at: places } of entries) {
    const actual = count(docs);
    if (actual !== n) errors.push(`${what}: the copy says ${n} but there are ${actual}; re-read ${places.map((p) => p.join('')).join(', ')} in both locales`);
    for (const [file, pointer] of places) {
      for (const [locale, word] of Object.entries(words)) {
        const value = docs[locale]?.[file] && at(docs[locale][file], pointer);
        const found = value != null && (word instanceof RegExp ? word.test(flatText(value)) : flatText(value).includes(word));
        if (!found) errors.push(`i18n/${locale}/${file}${pointer}: expected the count "${word}" (${what})`);
      }
    }
  }
  return errors;
}

/** Every `to` and `href` in a document (link objects and rich-text links), with its pointer. */
export function* linkTargets(value, pointer = '') {
  if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* linkTargets(v, `${pointer}/${i}`);
  else if (value && typeof value === 'object') {
    if (typeof value.to === 'string') yield { pointer: `${pointer}/to`, to: value.to };
    if (typeof value.href === 'string') yield { pointer: `${pointer}/href`, href: value.href };
    for (const [k, v] of Object.entries(value)) if (k !== 'to' && k !== 'href') yield* linkTargets(v, `${pointer}/${k}`);
  }
}

/**
 * Internal links must name a registered route and anchor (src/routes.ts);
 * external ones must be well-formed https URLs with a real host and no
 * credentials. Nothing is fetched.
 */
export function linkErrors(doc, label, { routeIds, anchorIds }) {
  const errors = [];
  for (const link of linkTargets(doc)) {
    const where = `${label}${link.pointer}`;
    if (link.to !== undefined) {
      const [id, anchor, extra] = link.to.split('#');
      if (extra !== undefined) errors.push(`${where}: "${link.to}" has more than one #`);
      if (id !== '' && !routeIds.includes(id)) errors.push(`${where}: unknown route "${id}" (known: ${routeIds.join(', ')})`);
      if (anchor !== undefined && !anchorIds.includes(anchor)) errors.push(`${where}: unknown anchor "#${anchor}"`);
      if (id === '' && anchor === undefined) errors.push(`${where}: empty link target`);
      continue;
    }
    let url;
    try {
      url = new URL(link.href);
    } catch {
      errors.push(`${where}: not a URL`);
      continue;
    }
    if (url.protocol !== 'https:') errors.push(`${where}: ${url.protocol} link; external links are https`);
    if (url.username || url.password) errors.push(`${where}: a link carries credentials`);
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname)) errors.push(`${where}: "${url.hostname}" is not a public host name`);
    if (url.href !== link.href && `${url.href}` !== `${link.href}/`) errors.push(`${where}: not in canonical form (${url.href})`);
  }
  return errors;
}

/**
 * The copy budget per page and locale: bytes of minified JSON for the page's
 * own file plus shell.json (plus section.json on architecture pages). The
 * build bundles every page's copy today; the budget keeps each page's share
 * small enough to ship on its own when content is published separately (#6).
 */
export const PAGE_BUDGET = 32 * 1024;

/** UTF-8 bytes of a document as the page ships it (minified JSON). */
export const shippedBytes = (doc) => Buffer.byteLength(JSON.stringify(doc), 'utf8');

/**
 * Every key a document defines, as JSON pointers, not descending into rich
 * text (a rich value is one unit of copy). `tables` are lookup maps the page
 * indexes with data (a status, a card id): reading the map covers its keys,
 * whose set the schema fixes.
 */
export function definedKeys(doc, tables = []) {
  const out = [];
  const walk = (v, pointer) => {
    if (isRich(v) || v === null || typeof v !== 'object') return;
    const entries = Array.isArray(v) ? v.map((x, i) => [String(i), x]) : Object.entries(v);
    for (const [k, x] of entries) {
      if (pointer === '' && (k === 'schemaVersion' || k === 'locale' || k === '$schema')) continue;
      const p = `${pointer}/${k}`;
      out.push(p);
      if (!tables.some((t) => t.test(p))) walk(x, p);
    }
  };
  walk(doc, '');
  return out;
}

/** Keys (pointers) no page read while rendering: `reads` is the set of pointers read. */
export function unusedKeys(doc, reads, tables = []) {
  const read = [...reads];
  return definedKeys(doc, tables).filter((p) => !read.some((r) => r === p || r.startsWith(`${p}/`)));
}

/**
 * Wraps a parsed document so every property read is recorded as a JSON
 * pointer in `reads`. Values are unchanged; only reads are observed.
 */
export function tracked(doc, reads, pointer = '', proxies = new WeakMap()) {
  if (doc === null || typeof doc !== 'object') return doc;
  // One proxy per object, so identity comparisons in the page still hold.
  if (!proxies.has(doc)) {
    proxies.set(
      doc,
      new Proxy(doc, {
        get(target, key, receiver) {
          const value = Reflect.get(target, key, receiver);
          if (typeof key !== 'string' || !Object.hasOwn(target, key)) return value;
          const p = `${pointer}/${key}`;
          reads.add(p);
          return tracked(value, reads, p, proxies);
        },
      }),
    );
  }
  return proxies.get(doc);
}
