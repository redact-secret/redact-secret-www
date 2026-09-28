import { anchors, urls } from './shared';
import type { SiteContent } from './types';

/** Links to English-only resources say so (CONVENTIONS.md § Bilingual content). */
const englishOnly = ' (영문)';

export const ko: SiteContent = {
  locale: 'ko',
  meta: {
    title: 'Redact Secret — 실행 중 자격 증명 치환',
    description:
      'Redact Secret은 데이터가 아직 애플리케이션 안에 있을 때 지원하는 형식의 자격 증명을 찾아, 로그·트레이스·도구·AI 컨텍스트에 닿기 전에 치환합니다.',
  },
  shell: {
    skipToContent: '본문으로 건너뛰기',
    mainNavLabel: '주 메뉴',
    nav: [
      { label: '플레이그라운드', href: `#${anchors.playground}` },
      { label: '문서', href: `#${anchors.integrations}` },
      { label: '아키텍처', href: `#${anchors.boundary}` },
      { label: '벤치마크', href: urls.benchmarks, external: true },
      { label: 'GitHub', href: urls.repo, external: true },
      { label: '커뮤니티', href: `#${anchors.community}` },
    ],
    getStarted: '시작하기',
    languageLabel: '언어',
    themeLabel: '테마',
    themeLight: '라이트',
    themeDark: '다크',
    menu: '메뉴',
    closeMenu: '메뉴 닫기',
  },
  footer: {
    tagline: '실행 중 데이터와 AI 컨텍스트를 위한 결정적 비밀값 탐지·치환. MIT 라이선스.',
    columns: [
      {
        title: '제품',
        links: [
          { label: '빠른 시작', href: `#${anchors.firstRun}` },
          { label: '가이드', href: `#${anchors.integrations}` },
          { label: '아키텍처', href: `#${anchors.boundary}` },
          { label: '참조 문서', href: `#${anchors.evidence}` },
        ],
      },
      {
        title: '근거',
        links: [
          { label: `릴리스${englishOnly}`, href: urls.releaseStatus },
          { label: `지원 매트릭스${englishOnly}`, href: urls.supportMatrix },
          { label: `벤치마크${englishOnly}`, href: urls.benchmarks, external: true },
        ],
      },
      {
        title: '커뮤니티',
        links: [
          { label: 'GitHub Issues', href: urls.issues },
          { label: `보안 신고${englishOnly}`, href: urls.security },
          { label: 'GitHub', href: urls.repo, external: true },
        ],
      },
    ],
    channelNote: 'Slack·Discord는 운영 채널이 준비된 후에만 연결합니다. 공개 채널에 실제 자격 증명을 올리지 마세요.',
    languageNote: '영어 원문으로 연결되는 링크는 그 사실을 표시합니다.',
  },
  hero: {
    eyebrow: '실행 중 자격 증명 치환 · 오픈 소스',
    title: (
      <>
        비밀값은 빠르게 퍼집니다.
        <br />
        퍼지기 전에 막으세요.
      </>
    ),
    lede: (
      <>
        프롬프트에 붙여 넣은 자격 증명 하나가 도구 응답, 트레이스, 로그, 대화 기록에 남을 수 있습니다. Redact
        Secret은 <b>데이터가 아직 애플리케이션 안에 있을 때</b> 지원하는 형식의 자격 증명을 찾아, 다음 시스템에
        닿기 전에 치환합니다.
      </>
    ),
    primaryCta: '시작하기',
    secondaryCta: '벤치마크 보기',
    proof: '하나의 로컬 탐지 코어. 데이터가 흐르는 곳을 위한 연동.',
    io: {
      caption: '한 번의 검사',
      footnote:
        '합성 fixture이며 실제 자격 증명이 아닙니다. 탐지 메타데이터에는 계열·위치·길이가 기록되고 값 자체는 담기지 않습니다.',
    },
  },
  problem: {
    eyebrow: '실행 중에 일어나는 일',
    title: '소스 코드뿐 아니라 실행 중인 데이터를 보호하세요.',
    lede: (
      <>
        저장소 스캐너는 코드에 커밋된 비밀값을 찾는 데 도움을 줍니다. Redact Secret은 애플리케이션이 실제로 다루는
        사용자 입력, 오류 메시지, 도구 결과, 로그, 트레이스, 저장 기록, 모델 컨텍스트에 적용됩니다.{' '}
        <b>한 번 붙여 넣은 값이 아무도 모르는 사이 다섯 곳에 복제됩니다.</b>
      </>
    ),
    sourceLabel: '사용자가 한 줄을 붙여 넣습니다',
    sourceNote: '애플리케이션이 자격 증명을 요구한 적은 없습니다. 통제할 수 없는 텍스트 안에 섞여 들어왔을 뿐입니다.',
    redactedLabel: '가려진 자격 증명 값',
    destinations: [
      { name: '도구 응답', note: '에이전트로 반환된 뒤 다시 컨텍스트에 인용됨' },
      { name: '트레이스 span 속성', note: '외부 백엔드로 내보내져 수 주간 보관됨' },
      { name: '애플리케이션 로그', note: '수집·색인되어 온콜 전원이 검색 가능' },
      { name: '대화 기록', note: '이후 모든 턴에 다시 주입됨' },
      { name: '저장 기록', note: '데이터베이스·캐시·검색 색인에 기록됨' },
    ],
    kept: '값이 그대로',
    counts: [
      { value: '1', label: '번의 붙여 넣기' },
      { value: '5', label: '개 시스템이 값을 보유' },
      { value: '0', label: '곳도 고칠 지점이 아님' },
    ],
    remedy:
      '값이 도착한 뒤에는 자격 증명 교체 외에 방법이 없습니다. 검사는 그보다 한 단계 앞, 애플리케이션이 텍스트를 다른 시스템에 넘기는 경계에 있어야 합니다.',
  },
  integrations: {
    eyebrow: '코어 · 어댑터 · 볼트',
    title: '코어를 직접 쓰거나, 이미 사용하는 도구에 연결하세요.',
    lede: (
      <>
        모든 패키지 뒤에는 하나의 Rust 탐지 코어가 있습니다. 어댑터는 호스트마다 탐지 규칙을 다시 만들지 않고 코어를 로깅·
        트레이싱·AI 작업 흐름에 연결하고, 볼트는 치환한 값을 되돌리는 별도의 선택 기능입니다.{' '}
        <b>각 카드는 그 패키지가 덮지 않는 범위를 명시합니다.</b>
      </>
    ),
    groups: {
      core: { title: '코어', lede: '하나의 엔진, 세 가지 사용 방법.', link: urls.repo },
      adapters: {
        title: '어댑터',
        lede: '호스트 연동입니다. 스스로 판단하지 않고, 텍스트를 코어로 넘기고 코어의 답을 돌려줄 뿐입니다.',
        link: urls.adapters,
      },
      vault: {
        title: '볼트',
        lede: '선택 사항이며 별도 패키지입니다. 코어는 값을 보관하지 않습니다. 볼트는 요청할 때만 메모리에 매핑을 두고, 정한 정책 아래에서만 복원합니다.',
        link: urls.vault,
      },
    },
    runtimes: { browser: '브라우저', node: 'Node.js', python: 'Python' },
    terms: { version: '버전', registries: '레지스트리', core: '코어', host: '호스트', tag: 'npm 태그', install: '설치' },
    statusLabels: { released: '출시됨', alpha: '알파', unpublished: '미출시' },
    notPublished: '레지스트리에 없음',
    cards: {
      core: {
        title: '코어 라이브러리',
        description: 'Rust로 구현한 탐지·정책·치환을 JavaScript(Node.js와 브라우저), Python, Rust에서 같은 API로 제공합니다.',
        coverage: '기본은 자격 증명만 탐지합니다. 개인정보 탐지는 직접 선택해야 켜집니다.',
      },
      wasm: {
        title: 'WebAssembly 빌드',
        description: (
          <>
            코어의 브라우저용 빌드입니다. <code>@redact-secret/core</code>를 설치하면 함께 설치되며, 직접 import하는
            용도가 아닙니다.
          </>
        ),
        coverage: '페이지나 Worker에서 실행됩니다. 위의 플레이그라운드가 이 빌드를 씁니다.',
      },
      cli: {
        title: 'CLI',
        description: '표준 입력이나 파일 하나를 읽어 치환된 텍스트를 출력합니다. 셸, 파이프라인, 훅에서 씁니다.',
        coverage: 'npm이 아니라 crates.io에서 설치합니다. 개인정보는 --pii로 켭니다.',
      },
      'web-stream': {
        title: 'Web Streams',
        description: '스트림을 흘려보내며 치환하는 TransformStream으로, 코어 안에 들어 있습니다.',
        coverage: '별도의 브라우저 어댑터 패키지는 없습니다. 이 코어 서브패스가 브라우저 연동입니다.',
      },
      pino: {
        title: 'Pino',
        description: '로그 호출과 완성된 로그 줄의 값을 치환합니다. pino 자체의 경로 기반 redact와 함께 동작합니다.',
        coverage: '객체 키와, 줄이 쓰인 뒤 destination·transport가 덧붙이는 내용은 덮지 않습니다.',
      },
      otel: {
        title: 'OpenTelemetry 트레이스',
        description: '다음 SpanProcessor를 감싸 문자열 속성·이벤트·span 이름·상태 메시지를 치환합니다.',
        coverage: '속성 이름은 치환하지 않으며, 감싼 processor가 받지 못하는 span은 범위 밖입니다.',
      },
      masking: {
        title: '마스킹 콜백',
        description: 'Langfuse처럼 마스킹할 값을 넘겨주는 호스트를 위한 createMaskSecrets()입니다.',
        coverage: '호스트가 콜백으로 보내는 범위까지만 덮습니다.',
      },
      'ai-context': {
        title: 'AI 컨텍스트',
        description: '사용자 입력과 도구 결과로 모델 컨텍스트를 만듭니다. 실패 시 닫히고, 전부 아니면 전무입니다.',
        coverage: '바이너리·인코딩된 값은 해석하지 않고 차단합니다. 모델 출력은 덮지 않습니다.',
      },
      mcp: {
        title: 'MCP 도구 호출',
        description: 'tools/call과 resources/read 결과를 기록·저장·컨텍스트 투입 전에 검사합니다.',
        coverage: '다른 MCP 메서드는 범위 밖이며, 바이너리 페이로드는 기본적으로 결과 전체를 차단합니다.',
      },
      logging: {
        title: 'Python 로깅',
        description: '표준 라이브러리에 값 기반 치환을 더하는 logging.Filter입니다.',
        coverage: '붙인 곳에서만 동작합니다. 로거가 아니라 출력하는 모든 핸들러에 붙이세요.',
      },
      'otel-py': {
        title: 'OpenTelemetry Python',
        description: 'Python 서비스에서 다음 span processor를 감쌉니다.',
        coverage: 'otel extra를 지정해야 설치됩니다. 고쳐 쓸 수 없는 span은 내보내지 않고 버립니다.',
      },
      'masking-py': {
        title: '마스킹 콜백',
        description: 'Langfuse처럼 마스킹할 값을 넘겨주는 호스트를 위한 mask_secrets입니다.',
        coverage: '호스트가 콜백으로 보내는 범위까지만 덮습니다.',
      },
      'vault-browser': {
        title: '볼트',
        description: '모델로 가는 길에 비밀값을 불투명한 <rsv_…> 토큰으로 바꾸고, 지정한 필드에만 복원합니다.',
        coverage: '메인 스레드, 또는 별도로 검증된 전용 Worker 모드(선택). 저장소·네트워크를 쓰지 않습니다.',
      },
      'vault-node': {
        title: '볼트',
        description: '같은 메모리 내 캡처·복원을 Node.js 20·22·24에서 제공합니다.',
        coverage: '코어 버전 하나를 정확히 고정하므로, 다른 코어 버전과 함께 설치되지 않습니다.',
      },
      'vault-server': {
        title: '볼트 서버',
        description: '모든 복원을 주체·테넌트·출처·목적지·값 경로 기준으로 승인합니다.',
        coverage: '메모리 백엔드만 있습니다. 영구 저장소는 제안 단계이며 패키지가 없습니다.',
      },
      'vault-py': {
        title: '볼트 (Python)',
        description: '볼트 서버의 승인 계약을 Python으로 직접 구현한 것입니다.',
        coverage: '연구 단계이며 PyPI에 없습니다. 저장소에서 설치하고, 캡처에는 node 실행 파일이 필요합니다.',
      },
    },
    observed: (date) => (
      <>
        버전·태그·범위는 레지스트리에 게시된 값이며, <b>{date}</b>에 관측했습니다.
      </>
    ),
  },
  quickstart: {
    eyebrow: '빠른 실행',
    title: '한 번의 검사로 시작하세요.',
    lede: '출시된 버전을 명시해 설치하고, 한 번 검사한 뒤 출력을 대조하세요. 모든 런타임에서 같은 합성 fixture를 사용합니다.',
    tabsLabel: '런타임',
    rustNote: (
      <>
        Rust는 crates.io에서 설치하며, 첫 예제는 <a href={urls.rustGuide}>Rust 가이드{englishOnly}</a>에 있습니다.
      </>
    ),
    pinLabel: '빌드 시 고정',
    pin: (core) => (
      <>
        <b>{core.npm}</b>이 현재 beta이며 레지스트리 관측일은 <b>{core.observedAt}</b>입니다.{' '}
        {core.npmLatest === core.npm ? (
          <>
            지금은 npm <code>latest</code>도 이 버전을 가리키지만, <code>latest</code>는 전에 바뀐 적이 있어 명령에
            버전을 고정합니다.
          </>
        ) : (
          <>
            npm <code>latest</code>는 <code>{core.npmLatest}</code>을 가리키므로{' '}
            <code>npm install @redact-secret/core</code>만으로는 선택되지 않습니다.
          </>
        )}{' '}
        Python 표기는 <code>{core.pypi}</code>입니다.
      </>
    ),
    why: {
      title: '버전을 명시하는 이유',
      body: '패키지 상태는 빌드 시 릴리스 기록에서 한 곳으로 읽어 오고, 관측 날짜와 함께 표시합니다. 번역된 본문에 손으로 다시 적지 않습니다.',
    },
    expect: {
      title: '확인해야 할 것',
      body: (
        <>
          값이 사라지고 그 자리에 자리표시자가 들어갑니다. <code>result.findings</code>는 계열·위치·길이를 설명하며
          원문을 담지 않습니다.
        </>
      ),
    },
  },
  playground: {
    eyebrow: '플레이그라운드',
    title: '직접 입력해 보세요.',
    lede: '입력을 고치면 출력이 바로 바뀝니다. 탐지 코어가 이 탭 안에서 WebAssembly로 실행됩니다 — 패키지에 들어 있는 것과 같은 엔진입니다.',
    privacy: (
      <>
        <b>입력한 내용은 이 브라우저 탭 밖으로 나가지 않습니다.</b> 전송·저장·기록되지 않으며 맞춤법 검사도 꺼져
        있습니다. 그래도 합성 값만 쓰세요. 실제 자격 증명은 어떤 웹 페이지에도 붙여 넣지 마세요.
      </>
    ),
    presetsLabel: '예제',
    presets: { env: '.env', log: '로그', json: 'JSON', header: '헤더', yaml: 'YAML', prose: '맥락 없음', pii: '개인정보' },
    styleLabel: '자리표시자 형식',
    piiLabel: '개인정보',
    piiModes: { off: '끔', global: '전역', us: '전역 + 미국' },
    piiNote: (
      <>
        개인정보 탐지는 <b>직접 켜야 하는 기능</b>이며 기본값은 꺼짐(자격 증명만)입니다. <b>전역</b>은 이메일·전화번호·결제
        카드·IP 주소·IBAN을, <b>전역 + 미국</b>은 미국 사회보장번호(SSN)까지 탐지합니다. 코어는 시작할 때 개인정보 선택을
        고정하므로, 모드마다 별도의 엔진 인스턴스를 씁니다.
      </>
    ),
    inputLabel: '입력',
    outputLabel: '출력',
    clear: '비우기',
    reset: '처음으로',
    loading: '엔진을 불러오는 중…',
    loadFailed: '이 브라우저에서 엔진을 불러오지 못했습니다.',
    retry: '다시 시도',
    staleEngine: '페이지를 연 뒤 사이트가 업데이트되었습니다. 새로고침하면 엔진을 불러옵니다.',
    reload: '새로고침',
    engine: (version, artifact) => (
      <>
        로컬 실행 · <span class="mono">@redact-secret/core {version}</span> ({artifact})
      </>
    ),
    size: (used, max) => `${used} / ${max}`,
    findingCount: (n) => `탐지 ${n}건`,
    findingsTitle: '탐지 결과',
    columns: { id: 'ID', type: '유형', detector: '탐지기', confidence: '신뢰도', action: '조치', range: '범위' },
    noFindings: (
      <>
        탐지 결과가 없습니다. <b>탐지 결과가 비었다고 해서 안전함이 증명되지는 않습니다</b> — 키 이름이나 다른 맥락이 없으면
        이런 일반적인 값은 탐지되지 않습니다.
      </>
    ),
    errors: {
      INPUT_LIMIT_EXCEEDED: '입력이 플레이그라운드 한도(32 KB)를 넘었습니다.',
      FINDING_LIMIT_EXCEEDED: '탐지 결과가 플레이그라운드에서 보여줄 수 있는 수를 넘었습니다.',
      UNPAIRED_SURROGATE: '검사할 수 없는 깨진 문자가 들어 있습니다.',
      default: '검사에 실패했습니다.',
    },
  },
  boundary: {
    eyebrow: '작동 방식과 통제권',
    title: '데이터는 내 프로세스 안에 머뭅니다.',
    lede: '탐지와 치환은 외부 검사 서비스로 텍스트를 전송하지 않고 로컬에서 실행됩니다. 네트워크 호출도 텔레메트리도 없으며, 같은 입력은 언제나 같은 결과를 냅니다.',
    flowLabel: '코어가 놓이는 자리',
    flow: [
      { key: '01', title: '신뢰할 수 없는 텍스트', description: '사용자 입력, 설정, 오류, 도구 결과, 검색된 문서' },
      { key: '02', title: '애플리케이션 경계', description: '텍스트를 넘기기 직전, 통제 가능한 마지막 지점' },
      {
        key: '03 · 코어',
        title: 'Redact Secret',
        description: '탐지·중첩 해소·정책·치환을 프로세스 안에서 수행',
        core: true,
      },
      { key: '04', title: '치환된 텍스트 + 안전한 탐지 결과', description: '탐지 결과는 위치만 설명하며 값을 담지 않음' },
      { key: '05', title: '로그 · 저장소 · 트레이스 · 도구 · 모델', description: '각 목적지는 자격 증명이 빠진 텍스트를 받음' },
    ],
    pillars: [
      {
        title: '브라우저: 예방',
        body: '클라이언트 검사는 붙여 넣은 자격 증명을 기기를 떠나기 전에 잡습니다. 클라이언트는 수정하거나 건너뛸 수 있으므로, 유용하지만 적용 경계는 아닙니다.',
      },
      {
        title: '서버: 적용 경계',
        body: '서버는 로깅·저장·컨텍스트 구성·모델과 도구 호출 전에 독립적으로 다시 검사합니다. 보안 판단이 의존하는 것은 이 검사입니다.',
      },
      {
        title: (
          <>
            <code>block</code>은 누가 집행하나
          </>
        ),
        body: (
          <>
            코어는 <code>block</code> 결과를 보고합니다. <b>요청을 실제로 거부하는 것은 애플리케이션입니다.</b> Redact
            Secret이 스스로 무엇을 막지는 않습니다.
          </>
        ),
      },
    ],
    links: [
      { label: `아키텍처 읽기${englishOnly}`, href: urls.architecture },
      { label: `안전한 연동 가이드${englishOnly}`, href: urls.safeIntegration },
    ],
  },
  evidence: {
    eyebrow: '공개 근거',
    title: '근거를 직접 확인하세요.',
    lede: '지원하는 자격 증명 형식과 근거 상태, 재현 가능한 벤치마크를 확인할 수 있습니다. 벤치마크 사이트는 측정 수치와 함께 방법과 한계를 공개합니다.',
    links: [
      {
        title: '지원 형식',
        body: '어떤 자격 증명 계열을 지원하고 각각의 근거가 얼마나 강한지. 손으로 쓰지 않고 평가 증거에서 생성됩니다.',
        go: `지원 매트릭스${englishOnly} →`,
        href: urls.supportMatrix,
      },
      {
        title: '출시 상태',
        body: '게시된 모든 버전과 소스 리비전·아티팩트·레지스트리 상태. 완료되지 않은 실행까지 포함합니다.',
        go: `릴리스 기록${englishOnly} →`,
        href: urls.releaseStatus,
      },
      {
        title: '벤치마크',
        body: '프로젝트가 관리하는 합성 측정과 fixture 출처·도구 버전·해석 한계. 재현 가능한 회귀 근거이며 제품 순위가 아닙니다.',
        go: `방법을 먼저, 그다음 수치${englishOnly} ↗`,
        href: urls.benchmarks,
      },
    ],
    routing: {
      title: '어떤 문제를 풀고 있나요?',
      problemHeader: '해결하려는 문제',
      startHeader: '적합한 시작점',
      rows: [
        { problem: '이미 Git 기록에 남은 자격 증명 찾기', start: 'Gitleaks 또는 TruffleHog' },
        { problem: '문서·이미지의 광범위한 PII 비식별화', start: 'Presidio 또는 관리형 데이터 보호 서비스' },
        {
          problem: '실행 중인 애플리케이션에서 지원하는 자격 증명이 로그·트레이스·도구·AI 컨텍스트로 넘어가기 전에 치환',
          start: <b>Redact Secret</b>,
        },
      ],
      note: '각 도구는 다른 문제를 풀며 서로 보완적입니다. 이 표는 안내일 뿐 점수가 아닙니다.',
    },
    limits: {
      title: '범위와 한계',
      body: [
        <>
          Redact Secret은 <b>지원하는 자격 증명 형식</b>을 탐지하며, 모든 비밀이나 개인정보 범주를 탐지하지는 않습니다.{' '}
          <b>탐지 결과가 비었다고 해서 안전함이 증명되지는 않습니다.</b>
        </>,
        '공급자에 접속하지 않으므로 탐지된 자격 증명이 아직 유효한지 알 수 없습니다. 자격 증명의 검증·교체·폐기를 하지 않고, 커밋 기록을 훑지 않으며, DLP 플랫폼을 대신하지 않습니다.',
      ],
    },
  },
  final: {
    eyebrow: '다음 단계',
    title: '데이터가 흐르는 곳에 보호 기능을 두세요.',
    lede: '코어로 시작하고, 로그·트레이스·AI 작업 흐름에 맞는 연동을 추가하세요.',
    primaryCta: '시작하기',
    secondaryCta: 'GitHub',
  },
  notFound: {
    title: '페이지를 찾을 수 없습니다',
    body: '존재하지 않는 페이지입니다.',
    home: '홈으로 가기',
  },
};
