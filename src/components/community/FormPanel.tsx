import type { CommunityCopy } from '../../content';
import { formSource, type FeedbackForm, type FormField } from '../../content/community';
import { plainText, Rich } from '../ui/Rich';
import styles from './FormPanel.module.css';

type FormCopy = CommunityCopy['forms'][keyof CommunityCopy['forms']];

export type FormPanelProps = {
  form: FeedbackForm;
  /** The page's shared form words. */
  copy: CommunityCopy['form'];
  /** This form's words. */
  formCopy: FormCopy;
  /** Field id → value; `title` is the short title. */
  values: Readonly<Record<string, string>>;
  ack: boolean;
  /** Field ids where the check found something: outlined, and marked invalid. */
  flagged?: ReadonlySet<string>;
  /** Fills `{ var: version }` in placeholders: the published core version. */
  version: string;
  onChange?: (id: string, value: string) => void;
  onAck?: (checked: boolean) => void;
  onClear?: () => void;
};

// Text typed here may hold a secret by mistake: spellcheck, autocorrect and
// grammar extensions can send field contents off-device, so all are off
// (the same rule as the playground, ADR 0001 § 3; here ADR 0004).
const privateField = {
  spellcheck: false,
  autocomplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'off',
  'data-gramm': 'false',
  'data-gramm_editor': 'false',
  'data-enable-grammarly': 'false',
  'data-lt-active': 'false',
} as const;

const fieldId = (id: string) => `cf-${id}`;

/** One form, mirroring its GitHub YAML: the title, its fields, and the safety acknowledgement. */
export function FormPanel({ form, copy, formCopy, values, ack, flagged, version, onChange, onAck, onClear }: FormPanelProps) {
  const dest =
    form.kind === 'issue' ? (
      <>
        <span>{copy.issueForm}</span>
        <span class={styles.chip}>{form.template}</span>
        <span>{copy.labels}</span>
        {form.labels.map((l) => (
          <span class={styles.chip} key={l}>
            {l}
          </span>
        ))}
      </>
    ) : (
      <>
        <span>{copy.discussion}</span>
        <span>{copy.category}</span>
        <span class={styles.chip}>{form.category}</span>
      </>
    );

  const badge = (required: boolean) =>
    required ? <span class={styles.req}>{copy.required}</span> : <span class={styles.opt}>{copy.optional}</span>;

  function control(field: FormField) {
    const fc = formCopy.fields[field.id];
    if (!fc) throw new Error(`community: no copy for field "${field.id}" of ${form.key}`);
    const value = values[field.id] ?? '';
    const common = {
      id: fieldId(field.id),
      'aria-required': field.required ? ('true' as const) : undefined,
      'aria-invalid': flagged?.has(field.id) ? ('true' as const) : undefined,
      'aria-describedby': fc.help ? `${fieldId(field.id)}-help` : undefined,
    };
    const placeholder = fc.placeholder ? plainText(fc.placeholder, { version }) : undefined;
    if (field.type === 'dropdown') {
      return (
        <select {...common} class={styles.control} value={value} onChange={(e) => onChange?.(field.id, e.currentTarget.value)}>
          <option value="">{copy.choose}</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }
    if (field.type === 'textarea') {
      return (
        <textarea
          {...common}
          {...privateField}
          class={[styles.control, styles.area, field.code && styles.code].filter(Boolean).join(' ')}
          value={value}
          placeholder={placeholder}
          rows={5}
          onInput={(e) => onChange?.(field.id, e.currentTarget.value)}
        />
      );
    }
    return (
      <input
        {...common}
        {...privateField}
        type="text"
        class={styles.control}
        value={value}
        placeholder={placeholder}
        onInput={(e) => onChange?.(field.id, e.currentTarget.value)}
      />
    );
  }

  return (
    <div class={styles.panel}>
      <div class={styles.head}>
        <h2 class="h2">{formCopy.name}</h2>
        <div class={styles.dest}>
          {dest}
          <a href={formSource(form)}>{copy.source}</a>
        </div>
      </div>
      <p class={styles.intro}>
        <Rich value={formCopy.intro} />
      </p>

      <form class={styles.form} noValidate onSubmit={(e) => e.preventDefault()}>
        <div class={flagged?.has('title') ? `${styles.field} ${styles.flag}` : styles.field}>
          <div class={styles.top}>
            <label for={fieldId('title')}>{copy.titleLabel}</label>
            {badge(true)}
          </div>
          <p class={styles.help} id={`${fieldId('title')}-help`}>
            <Rich value={copy.titleHelp} />
          </p>
          <div class={styles.titleRow}>
            <span class={styles.prefix} aria-hidden="true">
              {form.prefix.trim()}
            </span>
            <input
              {...privateField}
              id={fieldId('title')}
              type="text"
              class={styles.control}
              value={values.title ?? ''}
              aria-required="true"
              aria-invalid={flagged?.has('title') ? 'true' : undefined}
              aria-describedby={`${fieldId('title')}-help`}
              onInput={(e) => onChange?.('title', e.currentTarget.value)}
            />
          </div>
        </div>

        {form.fields.map((field) => {
          const fc = formCopy.fields[field.id];
          return (
            <div class={flagged?.has(field.id) ? `${styles.field} ${styles.flag}` : styles.field} key={field.id}>
              <div class={styles.top}>
                <label for={fieldId(field.id)}>{fc?.label}</label>
                {badge(field.required)}
              </div>
              {fc?.help && (
                <p class={styles.help} id={`${fieldId(field.id)}-help`}>
                  <Rich value={fc.help} />
                </p>
              )}
              {control(field)}
            </div>
          );
        })}

        <fieldset class={styles.field}>
          <div class={styles.top}>
            <legend>{copy.ackLegend}</legend>
            {badge(true)}
          </div>
          <label class={styles.check}>
            <input type="checkbox" checked={ack} aria-required="true" onChange={(e) => onAck?.(e.currentTarget.checked)} />
            <span>{formCopy.ack}</span>
          </label>
        </fieldset>
      </form>

      <div>
        <button type="button" class={styles.quiet} onClick={onClear}>
          {copy.clear}
        </button>
      </div>
    </div>
  );
}
