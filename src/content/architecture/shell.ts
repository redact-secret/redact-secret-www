/**
 * Shell copy for the architecture section, per locale: sidebar, pager,
 * section bar, and each page's <title> and description. The hub's body is
 * ./hub.tsx; the six sub-page bodies are ./en/ and ./ko/.
 */
import type { Locale } from '../../i18n';
import type { ArchitectureGroup, ArchitecturePageId } from './pages';

export type ArchitectureShellCopy = {
  /** Section name in the section bar and the <title> suffix. */
  section: string;
  navLabel: string;
  /** The collapsible contents below 1040px. */
  contents: string;
  groups: Record<ArchitectureGroup, string>;
  pages: Record<ArchitecturePageId, { nav: string; title: string; description: string }>;
  pager: { label: string; prev: string; next: string; back: string };
};

export const architectureShell: Record<Locale, ArchitectureShellCopy> = {
  en: {
    section: 'Architecture',
    navLabel: 'Architecture',
    contents: 'Architecture contents',
    groups: { section: 'Section', engine: 'The engine', evidence: 'The evidence', boundaries: 'The boundaries' },
    pages: {
      overview: {
        nav: 'Overview',
        title: 'Architecture overview',
        description:
          'How Redact Secret is built: one Rust core that every language calls, how its decisions are measured, and the adapter and vault repositories outside it.',
      },
      'how-it-works': {
        nav: 'How it works',
        title: 'How it works',
        description: 'Four surfaces over one core, the four pipeline stages, and what it is not.',
      },
      detection: {
        nav: 'How it detects',
        title: 'How it detects',
        description: 'Five tiers of evidence, fixed tie-breakers, no regex engine, and your own rulesets.',
      },
      'support-claims': {
        nav: 'Support claims',
        title: 'How a support claim is built',
        description: 'Three files answer three questions; a support claim exists only once they are joined.',
      },
      'evaluation-methods': {
        nav: 'Evaluation methods',
        title: 'Evaluation methods',
        description: 'Ten ways a detector can be wrong, graded five ways over byte ranges.',
      },
      adapters: {
        nav: 'Adapters',
        title: 'Adapters',
        description: 'The packages between your host and the engine. They decide nothing.',
      },
      vault: {
        nav: 'Vault',
        title: 'Vault',
        description: 'The one place allowed to keep an original, built to make that hard.',
      },
    },
    pager: { label: 'Architecture pages', prev: '← Previous', next: 'Next →', back: 'Back →' },
  },
  ko: {
    section: '아키텍처',
    navLabel: '아키텍처',
    contents: '아키텍처 목차',
    groups: { section: '섹션', engine: '엔진', evidence: '증거', boundaries: '경계' },
    pages: {
      overview: {
        nav: '개요',
        title: '아키텍처 개요',
        description:
          'Redact Secret의 구조: 모든 언어가 부르는 하나의 Rust 코어, 그 결정을 측정하는 방법, 그리고 코어 바깥의 어댑터와 볼트 저장소.',
      },
      'how-it-works': {
        nav: '작동 방식',
        title: '작동 방식',
        description: '네 표면과 하나의 코어, 파이프라인 네 단계, 그리고 이것이 아닌 것.',
      },
      detection: {
        nav: '탐지 방식',
        title: '탐지 방식',
        description: '증거 다섯 등급, 순서가 고정된 결정 규칙, 정규식 엔진이 없는 이유, 직접 만드는 룰셋.',
      },
      'support-claims': {
        nav: '지원 주장',
        title: '지원 주장은 어떻게 만들어지나',
        description: '세 파일이 세 질문에 답하고, 셋을 합쳐야만 지원 주장이 생깁니다.',
      },
      'evaluation-methods': {
        nav: '평가 방법',
        title: '평가 방법',
        description: '탐지기가 틀릴 수 있는 열 가지 방법과, 바이트 범위에 대한 다섯 가지 판정.',
      },
      adapters: {
        nav: '어댑터',
        title: '어댑터',
        description: '호스트와 엔진 사이의 패키지들. 아무것도 판단하지 않습니다.',
      },
      vault: {
        nav: '볼트',
        title: '볼트',
        description: '원본을 보관해도 되는 유일한 곳, 그리고 그 보관을 어렵게 만드는 설계.',
      },
    },
    pager: { label: '아키텍처 페이지', prev: '← 이전', next: '다음 →', back: '돌아가기 →' },
  },
};
