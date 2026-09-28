import type { Locale } from '../i18n';
import { en } from './en';
import { ko } from './ko';
import type { SiteContent } from './types';

export const content: Record<Locale, SiteContent> = { en, ko };

export type { SiteContent } from './types';
