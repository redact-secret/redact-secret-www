/**
 * The architecture hub, authored in both locales. Titles and paths of the
 * six pages come from ./shell.tsx and ./pages.ts; this file holds only the
 * hub's own prose.
 */
import type { ComponentChildren } from 'preact';
import type { Locale } from '../../i18n';
import type { SubPageId } from './pages';

type Rich = ComponentChildren;

export type HubCopy = {
  eyebrow: Rich;
  title: Rich;
  lede: Rich;
  claim: { line: Rich; sub: Rich };
  groups: Record<'engine' | 'evidence' | 'boundaries', { eyebrow: Rich; title: Rich }>;
  cards: Record<SubPageId, { question: Rich; body: Rich }>;
  repos: {
    eyebrow: Rich;
    title: Rich;
    lede: Rich;
    tableLabel: string;
    head: [Rich, Rich, Rich];
    rows: { repo: string; owns: Rich; mustNot: Rich }[];
  };
  sources: { label: Rich; body: Rich };
};

export const hub: Record<Locale, HubCopy> = {
  en: {
    eyebrow: 'Architecture',
    title: 'The rules are written once',
    lede: 'Detection, overlap resolution, policy and redaction happen inside one Rust core, and JavaScript, Python, Rust and the CLI all call it. This section covers what that core decides, how well those decisions are measured, and what the text passes through on its way in.',
    claim: {
      line: 'One core, four surfaces.',
      sub: 'Each language gets a translator, never its own copy of the rules. JavaScript and Python cannot quietly disagree about what a secret is.',
    },
    groups: {
      engine: { eyebrow: 'The engine', title: 'What decides' },
      evidence: { eyebrow: 'The evidence', title: 'Why those decisions can be trusted' },
      boundaries: { eyebrow: 'The boundaries', title: 'Outside the core, in their own repositories' },
    },
    cards: {
      'how-it-works': {
        question: '“What is this thing?”',
        body: 'Four surfaces over one core, the four pipeline stages, two build profiles, and why it guards a different door from a repository scanner.',
      },
      detection: {
        question: '“How sure, and why?”',
        body: 'Five tiers of evidence, fixed tie-breakers, why there is no regex engine, and bringing your own ruleset.',
      },
      'support-claims': {
        question: '“What shipped, what does the world issue, how did each one measure?”',
        body: 'Three files answer three different questions. A support claim exists only after they are joined, so there is no place to type one by hand.',
      },
      'evaluation-methods': {
        question: '“Ten ways to be wrong”',
        body: 'Write the answer first, then run it. A result is graded five ways over byte ranges, not two, and the scanner gets no vote.',
      },
      adapters: {
        question: '“Who fetches the text?”',
        body: 'Packages that sit between your host and the engine. They decide nothing, and when they fail they print a marker instead of the value.',
      },
      vault: {
        question: '“What if you need the original back?”',
        body: 'The core throws the original away. The vault is the one place allowed to keep it, and it is built to make that hard.',
      },
    },
    repos: {
      eyebrow: 'In one line',
      title: 'Four repositories, one direction',
      lede: (
        <>
          Dependencies run one way. The vault may use the core's public API; the core and the adapters never depend
          on the vault. That is what keeps “I installed the scanner” from ever meaning “I created a recoverable copy
          of my secrets”.
        </>
      ),
      tableLabel: 'What each repository owns',
      head: ['Repository', 'Owns', 'Must not own'],
      rows: [
        {
          repo: 'redact-secret',
          owns: 'Detection, overlap resolution, policy, redaction, safe metadata, placeholders',
          mustNot: 'Restoration storage, restore authorization, any dependency on the vault',
        },
        {
          repo: 'redact-secret-vault',
          owns: 'Mapping lifecycle, opaque tokens, restore checks, storage extension points',
          mustNot: 'Detection rules, PII classification, changes to core policy',
        },
        {
          repo: 'redact-secret-adapters',
          owns: 'Host integrations for logs, traces, AI context and MCP',
          mustNot: 'Restoration, or emitting mapped plaintext to observability',
        },
        {
          repo: 'redact-secret-benchmarks',
          owns: 'Detection and support evidence',
          mustNot: 'Treating restoration success as detection accuracy',
        },
      ],
    },
    sources: {
      label: 'Sources for this section.',
      body: (
        <>
          The core from <code>README.md</code> and <code>ARCHITECTURE.md</code>; family counts and statuses from the
          generated <code>docs/support-matrix.md</code>; versions from the package registries; methods and taxonomy
          from <code>docs/specs/</code> in the benchmarks repository. Each page states its own sources.
        </>
      ),
    },
  },
  ko: {
    eyebrow: '아키텍처',
    title: '규칙은 한 번만 쓰입니다',
    lede: '탐지·중첩 해소·정책·치환은 하나의 Rust 코어 안에서 일어나고, JavaScript·Python·Rust·CLI는 그 코어를 부릅니다. 이 섹션은 그 코어가 무엇을 어떻게 결정하는지, 그 결정이 얼마나 검증되었는지, 그리고 텍스트가 코어에 닿기까지 무엇을 지나는지를 설명합니다.',
    claim: {
      line: '하나의 코어, 네 개의 표면.',
      sub: '언어마다 번역기가 붙을 뿐, 규칙의 사본은 없습니다. 그래서 JavaScript와 Python이 무엇이 비밀값인지를 두고 조용히 다른 답을 낼 수 없습니다.',
    },
    groups: {
      engine: { eyebrow: '엔진', title: '무엇이 결정하는가' },
      evidence: { eyebrow: '증거', title: '그 결정을 왜 믿나' },
      boundaries: { eyebrow: '경계', title: '코어 바깥, 별도 저장소' },
    },
    cards: {
      'how-it-works': {
        question: '“이게 대체 무슨 물건인가?”',
        body: '네 표면과 하나의 코어, 파이프라인 네 단계, 실행 프로파일 두 가지, 그리고 저장소 스캐너와 다른 문을 지킨다는 것.',
      },
      detection: {
        question: '“얼마나 확신하며, 왜인가?”',
        body: '증거 다섯 등급, 충돌 시 순서가 고정된 결정 규칙, 정규식 엔진이 없는 이유, 그리고 직접 만드는 룰셋.',
      },
      'support-claims': {
        question: '“무엇을 출시했고, 세상은 무엇을 발급하며, 각각은 어떻게 측정됐나?”',
        body: '세 개의 파일이 세 개의 다른 질문에 답하고, 그 셋을 합쳐야만 지원 주장이 생깁니다. 손으로 쓸 수 있는 자리가 없습니다.',
      },
      'evaluation-methods': {
        question: '“틀릴 수 있는 열 가지 방법”',
        body: '정답을 먼저 쓰고 그다음에 돌립니다. 판정은 통과/실패 둘이 아니라 바이트 범위에 대한 다섯 가지이고, 스캐너에게는 투표권이 없습니다.',
      },
      adapters: {
        question: '“텍스트는 누가 가져오나?”',
        body: '호스트와 엔진 사이에 놓이는 패키지들. 아무것도 판단하지 않고, 실패하면 값 대신 마커를 찍습니다.',
      },
      vault: {
        question: '“원본을 되돌려야 한다면?”',
        body: '코어는 원본을 버립니다. 볼트는 그것을 보관해도 되는 유일한 곳이고, 보관을 어렵게 만들도록 설계되어 있습니다.',
      },
    },
    repos: {
      eyebrow: '한 문장으로',
      title: '네 저장소, 한 방향',
      lede: (
        <>
          의존은 한쪽으로만 흐릅니다. 볼트는 코어의 공개 API를 쓸 수 있지만, 코어와 어댑터는 볼트에 절대 의존하지
          않습니다 — “스캐너를 설치했다”가 “복구 가능한 비밀값 사본을 만들었다”를 뜻하지 않게 하는 것이 이 방향의
          목적입니다.
        </>
      ),
      tableLabel: '저장소별 소유 범위',
      head: ['저장소', '소유하는 것', '소유해서는 안 되는 것'],
      rows: [
        {
          repo: 'redact-secret',
          owns: '탐지, 중첩 해소, 정책, 치환, 안전한 메타데이터, 자리표시자',
          mustNot: '복구 저장, 복구 인가, 볼트에 대한 어떤 의존도',
        },
        {
          repo: 'redact-secret-vault',
          owns: '매핑 수명주기, 불투명 토큰, 복구 검사, 저장 확장점',
          mustNot: '탐지 규칙, PII 분류, 코어 정책 변경',
        },
        {
          repo: 'redact-secret-adapters',
          owns: '로그·트레이스·AI 컨텍스트·MCP의 호스트 연동',
          mustNot: '복구, 매핑된 평문을 관측 시스템으로 내보내는 일',
        },
        {
          repo: 'redact-secret-benchmarks',
          owns: '탐지와 지원 근거',
          mustNot: '복구 성공을 탐지 정확도로 취급하는 일',
        },
      ],
    },
    sources: {
      label: '이 섹션의 출처.',
      body: (
        <>
          코어는 <code>README.md</code>·<code>ARCHITECTURE.md</code>, 계열 수와 상태는 생성된{' '}
          <code>docs/support-matrix.md</code>, 버전은 패키지 레지스트리, 평가 방법과 taxonomy는 benchmarks 저장소의{' '}
          <code>docs/specs/</code>. 각 하위 페이지가 자기 출처를 따로 적습니다.
        </>
      ),
    },
  },
};
