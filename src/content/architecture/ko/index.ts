/**
 * The six Korean-only architecture pages (design spec § 04). Each body is
 * authored prose composed from components/architecture; counts and versions
 * come from slots, never from the prose. `locale` is the URL's locale, so
 * cross-links stay in it — an /en/ page never silently links into /ko/.
 */
import type { JSX } from 'preact';
import type { Locale } from '../../../i18n';
import type { SubPageId } from '../pages';
import { Adapters } from './Adapters';
import { Detection } from './Detection';
import { EvaluationMethods } from './EvaluationMethods';
import { HowItWorks } from './HowItWorks';
import { SupportClaims } from './SupportClaims';
import { Vault } from './Vault';

export type SubPageBody = (props: { locale: Locale }) => JSX.Element;

export const koPages: Record<SubPageId, SubPageBody> = {
  'how-it-works': HowItWorks,
  detection: Detection,
  'support-claims': SupportClaims,
  'evaluation-methods': EvaluationMethods,
  adapters: Adapters,
  vault: Vault,
};
