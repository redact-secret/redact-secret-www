/**
 * The community page's forms: one entry per issue form or discussion
 * category in redact-secret/redact-secret's .github/, mirroring its YAML —
 * field ids, types, required flags, dropdown options, title prefix and
 * labels. These are the prefill contract (GitHub fills a form field from the
 * query parameter named by its id, and a dropdown only from an exact option),
 * so they stay in code, untranslated. The words around them — labels, help,
 * placeholders, intros — are i18n/<locale>/community.json.
 *
 * Checked against main at 8f97f14d97d73b76602e5396eea35d0a5a4f0eb3. When a
 * form changes upstream, change it here and in both locales' copy.
 */
import { urls } from './shared';

export type FieldType = 'input' | 'textarea' | 'dropdown';

export type FormField = {
  id: string;
  type: FieldType;
  required: boolean;
  /** Monospaced, spellcheck off: code or a reproduction. */
  code?: boolean;
  /** Dropdown options, exactly as the YAML spells them. */
  options?: readonly string[];
};

export type FeedbackGroup = 'wrong' | 'missing' | 'talk' | 'security';

type FormBase = { key: string; group: FeedbackGroup; prefix: string; fields: readonly FormField[] };

export type IssueForm = FormBase & { kind: 'issue'; template: string; labels: readonly string[] };
export type DiscussionForm = FormBase & { kind: 'discussion'; category: string; template: string };
export type SecurityRoute = { key: 'security'; group: 'security'; kind: 'security' };

export type FeedbackForm = IssueForm | DiscussionForm;
export type FeedbackKind = FeedbackForm | SecurityRoute;

const input = (id: string, required: boolean): FormField => ({ id, type: 'input', required });
const textarea = (id: string, required: boolean, code = false): FormField => ({ id, type: 'textarea', required, ...(code ? { code } : {}) });
const dropdown = (id: string, required: boolean, options: readonly string[]): FormField => ({ id, type: 'dropdown', required, options });

export const feedbackGroups: readonly FeedbackGroup[] = ['wrong', 'missing', 'talk', 'security'];

export const feedbackKinds = [
  {
    key: 'bug',
    group: 'wrong',
    kind: 'issue',
    template: 'bug-report.yml',
    prefix: '[bug] ',
    labels: ['bug'],
    fields: [input('package-version', true), input('binding-runtime', true), textarea('what-happened', true), textarea('repro', true, true)],
  },
  {
    key: 'false-positive',
    group: 'wrong',
    kind: 'issue',
    template: 'false-positive.yml',
    prefix: '[false-positive] ',
    labels: ['area:conformance'],
    fields: [
      input('package-version', true),
      input('runtime', true),
      input('family', false),
      dropdown('expected-action', true, [
        'No finding at all (allow)',
        'warn instead of redact',
        'warn instead of block',
        'redact instead of block',
        'Other (describe below)',
      ]),
      textarea('repro-shape', true),
    ],
  },
  {
    key: 'missed-detection',
    group: 'wrong',
    kind: 'issue',
    template: 'missed-detection.yml',
    prefix: '[missed-detection] ',
    labels: ['area:conformance'],
    fields: [
      input('package-version', true),
      input('runtime', true),
      input('family', false),
      dropdown('expected-action', true, [
        'Should have produced a finding (any action) but produced none',
        'Should have been redact but was warn/allow',
        'Should have been block but was warn/allow/redact',
        'Other (describe below)',
      ]),
      textarea('repro-shape', true),
    ],
  },
  {
    key: 'website',
    group: 'wrong',
    kind: 'issue',
    template: 'website-feedback.yml',
    prefix: '[website] ',
    labels: ['area:site'],
    fields: [
      input('page-url', true),
      dropdown('kind', true, ['Broken link', 'Wrong or outdated content', 'Translation (EN/KO)', 'Playground', 'Other']),
      textarea('description', true),
      dropdown('locale', false, ['en', 'ko']),
    ],
  },
  {
    key: 'detector',
    group: 'missing',
    kind: 'issue',
    template: 'request-detector.yml',
    prefix: '[detector request] ',
    labels: ['area:detectors', 'enhancement'],
    fields: [
      dropdown('category', true, ['Provider-issued credential', 'Contextual or generic credential', 'PII entity (beta.10 or later)', 'Other / unsure']),
      input('provider-or-entity', true),
      textarea('use-case', true),
      input('public-docs', false),
      textarea('relevant-details', false),
    ],
  },
  {
    key: 'integration',
    group: 'missing',
    kind: 'issue',
    template: 'integration-docs.yml',
    prefix: '[integration/docs] ',
    labels: ['documentation', 'area:integration'],
    fields: [
      dropdown('topic', true, ['Installation or packaging', 'Adapter or host integration', 'Documentation or example', 'Other / unsure']),
      textarea('problem', true),
      input('package-version', false),
      input('runtime', false),
      input('guide', false),
      textarea('safe-reproduction', false),
    ],
  },
  { key: 'question', group: 'talk', kind: 'discussion', category: 'q-a', template: 'q-a.yml', prefix: '[Q&A] ', fields: [textarea('question', true)] },
  { key: 'idea', group: 'talk', kind: 'discussion', category: 'ideas', template: 'ideas.yml', prefix: '[idea] ', fields: [textarea('idea', true)] },
  { key: 'security', group: 'security', kind: 'security' },
] as const satisfies readonly FeedbackKind[];

export type FeedbackKey = (typeof feedbackKinds)[number]['key'];
export type FormKey = Exclude<FeedbackKey, 'security'>;

export const defaultFeedbackKey: FeedbackKey = 'bug';

export const isFeedbackKey = (value: string): value is FeedbackKey => feedbackKinds.some((k) => k.key === value);

/** GitHub's URL length is not documented; past about 8,000 characters a prefilled link starts failing. */
export const prefillUrlLimit = 8000;

/** The form's YAML on main, for the "source" link. */
export function formSource(form: FeedbackForm) {
  return `${urls.repo}/blob/main/.github/${form.kind === 'issue' ? 'ISSUE_TEMPLATE' : 'DISCUSSION_TEMPLATE'}/${form.template}`;
}

/** Where to go when this page cannot help: GitHub's own chooser, blank forms. */
export const communityUrls = {
  chooser: `${urls.repo}/issues/new/choose`,
  advisory: `${urls.repo}/security/advisories/new`,
  securityPolicy: urls.security,
};

/**
 * The prefilled "new issue" or "new discussion" address: the template or
 * category, the title with its prefix, and one parameter per non-empty field.
 * The safety checkbox is never prefilled: GitHub asks for it again.
 */
export function prefillUrl(form: FeedbackForm, values: Readonly<Record<string, string>>) {
  const q = new URLSearchParams();
  if (form.kind === 'issue') q.set('template', form.template);
  else q.set('category', form.category);
  q.set('title', form.prefix + (values.title ?? ''));
  for (const field of form.fields) {
    const v = values[field.id];
    if (v) q.set(field.id, v);
  }
  return `${urls.repo}/${form.kind === 'issue' ? 'issues' : 'discussions'}/new?${q}`;
}
