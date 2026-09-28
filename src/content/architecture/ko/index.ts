/**
 * The six architecture pages in Korean, authored for this locale (not
 * translated in place from ../en/) and composed from components/architecture.
 */
import type { SubPageBody, SubPageId } from '../pages';
import { Adapters } from './Adapters';
import { Detection } from './Detection';
import { EvaluationMethods } from './EvaluationMethods';
import { HowItWorks } from './HowItWorks';
import { SupportClaims } from './SupportClaims';
import { Vault } from './Vault';

export const koPages: Record<SubPageId, SubPageBody> = {
  'how-it-works': HowItWorks,
  detection: Detection,
  'support-claims': SupportClaims,
  'evaluation-methods': EvaluationMethods,
  adapters: Adapters,
  vault: Vault,
};
