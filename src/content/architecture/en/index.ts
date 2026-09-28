/**
 * The six architecture pages in English, authored for this locale from the
 * English originals and composed from components/architecture.
 */
import type { SubPageBody, SubPageId } from '../pages';
import { Adapters } from './Adapters';
import { Detection } from './Detection';
import { EvaluationMethods } from './EvaluationMethods';
import { HowItWorks } from './HowItWorks';
import { SupportClaims } from './SupportClaims';
import { Vault } from './Vault';

export const enPages: Record<SubPageId, SubPageBody> = {
  'how-it-works': HowItWorks,
  detection: Detection,
  'support-claims': SupportClaims,
  'evaluation-methods': EvaluationMethods,
  adapters: Adapters,
  vault: Vault,
};
