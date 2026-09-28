import {
  Card,
  Claim,
  DataTable,
  DocSection,
  Flow,
  FlowArrow,
  FlowNode,
  Grid,
  Note,
  PackageTile,
  PageHead,
  RuleRows,
  SourceStrip,
  StatTile,
} from '../../../components/architecture';
import { StatusChip } from '../../../components/ui';
import type { Locale } from '../../../i18n';
import { evidence, slots, statusOf, type PackageSlot, type PackageStatus } from '../../../slots';
import { architecturePath } from '../pages';

const statusLabels: Record<PackageStatus, string> = { released: '출시됨', alpha: 'Alpha', unpublished: '미게시' };
const registryNames: Record<PackageSlot['registry'], string> = { npm: 'npm', pypi: 'PyPI', crates: 'crates.io' };

/** `opentelemetry-sdk<2,>=1.16.0; extra == "otel"` → `opentelemetry-sdk <2,>=1.16.0`. */
function pythonExtra(requires: string[] | undefined, extra: string) {
  for (const line of requires ?? []) {
    const [spec, marker] = line.split(';').map((part) => part.trim());
    if (marker?.match(/extra == "([^"]+)"/)?.[1] !== extra) continue;
    const name = spec.match(/^[A-Za-z0-9_.-]+/)?.[0] ?? '';
    return `${name} ${spec.slice(name.length)}`;
  }
  return undefined;
}

function hostRange(slot: PackageSlot) {
  return Object.entries(slot.peers ?? {})
    .filter(([name]) => name !== '@redact-secret/core')
    .map(([name, range]) => `${name} ${range}`)
    .join(', ');
}

function meta(slot: PackageSlot, ...extra: (string | undefined)[]) {
  return [registryNames[slot.registry], slot.version, ...extra].filter(Boolean).join(' · ');
}

export function Adapters({ locale }: { locale: Locale }) {
  const p = slots.packages;
  const budgets = evidence.adapterBudgets;
  const n = (value: number) => value.toLocaleString('ko-KR');
  const tile = (key: string) => ({ name: p[key].name, status: statusOf(p[key]), statusLabel: statusLabels[statusOf(p[key])] });

  return (
    <>
      <PageHead
        eyebrow="05 · 어댑터"
        title="코어는 무엇이 비밀값인지 압니다. 누군가는 가서 텍스트를 가져와야 합니다."
        lede={
          <>
            가져오고 나르는 것이 전부인 여섯 개의 패키지. <b>이들은 아무것도 결정하지 않습니다.</b>
          </>
        }
      />

      <DocSection eyebrow="푸는 문제" title="복사한 예제는 당신이 소유하게 된 포크입니다">
        <Grid cols={2}>
          <Card>
            <h3>
              <StatusChip tone="danger">이전</StatusChip>
            </h3>
            <p>
              예제 폴더에서 <code>pino-redact.mjs</code>를 복사합니다. 오늘은 잘 돕니다. pino의 다음 메이저가 훅
              시그니처를 바꿔도 <b>아무도 알려 주지 않습니다.</b>
            </p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="success">지금</StatusChip>
            </h3>
            <p>
              <code>npm install {p['adapter-pino'].name}</code>. 선언된 pino 범위를 <b>양 끝에서 시험</b>하고, 자기
              changelog를 tarball 안에 들고 있습니다.
            </p>
          </Card>
        </Grid>
        <p>
          버전도, changelog도, 호스트 SDK 계약이 움직였을 때의 통지도 없이 파일을 소유하게 되는 것 — 이 저장소가
          존재하는 이유 전부이고, <b>배선을 코어로 옮기지 않고</b> 그 간극을 닫습니다.
        </p>
      </DocSection>

      <DocSection eyebrow="위치" title="호스트와 엔진 사이">
        <Flow>
          <FlowNode title="당신의 호스트">
            pino 로거, OpenTelemetry span, Python 로그 레코드, MCP 도구 결과, 모델 프롬프트.
          </FlowNode>
          <FlowArrow>어댑터가 텍스트를 실어 들입니다</FlowArrow>
          <Claim sub="무엇이 비밀값인지는 코어가 정합니다. 어댑터는 정하지 않습니다.">Redact Secret 코어</Claim>
          <FlowArrow>그리고 답을 실어 냅니다</FlowArrow>
          <FlowNode title="같은 호스트, 정리된 상태">
            로그 줄, span 속성, 도구 결과가 비밀값이 빠진 채로 목적지로 갑니다.
          </FlowNode>
        </Flow>
      </DocSection>

      <DocSection eyebrow="패키지" title="두 레지스트리에 여섯 개">
        <Grid cols={2}>
          <PackageTile {...tile('adapter')} meta={meta(p.adapter)}>
            나머지 전부가 올라서는 공용 기반 — 문자열 하나를 가리는 원시 연산과, 중첩 객체 안의 문자열을 찾는{' '}
            <b>제한된 워커</b>. 자기 연동을 직접 만들 때만 이것을 설치합니다.
          </PackageTile>
          <PackageTile {...tile('adapter-pino')} meta={meta(p['adapter-pino'], hostRange(p['adapter-pino']))}>
            pino 자신의 경로 기반 <code>redact</code>를 <em>대체하지 않고 나란히</em>, <b>값 기준</b>으로
            치환합니다. pino는 메시지 문자열이나 오류 메시지 안의 토큰을 볼 수 없지만 이것은 봅니다.
          </PackageTile>
          <PackageTile {...tile('adapter-otel')} meta={meta(p['adapter-otel'], hostRange(p['adapter-otel']))}>
            span과 그 이벤트의 모든 문자열·문자열 배열 속성을, span이 다음 processor에 닿기 전에 치환합니다. 속성
            이름을 허용 목록으로 제한하지 않으므로 OpenInference와 GenAI 관례가 <b>하드코딩 없이</b> 덮입니다.
          </PackageTile>
          <PackageTile {...tile('adapter-ai-context')} meta={meta(p['adapter-ai-context'])}>
            AI 작업을 위한 프레임워크 중립 경계 — 사용자 입력, 도구 결과, 구성된 컨텍스트, 스트리밍 텍스트를 모델에
            닿기 전에 정리합니다. <b>모델 벤더도 에이전트 프레임워크도 전송 방식도 이름 짓지 않습니다.</b>
          </PackageTile>
          <PackageTile {...tile('adapter-mcp')} meta={meta(p['adapter-mcp'])}>
            Model Context Protocol 경계 — 도구 결과, 선택적으로 인자, 그리고 클라이언트가{' '}
            <code>resources/read</code>로 읽는 것. 위 패키지의 얇은 특수화이며 MCP 형태만 더합니다.{' '}
            <b>타입을 위해서도 MCP SDK를 import하지 않습니다.</b>
          </PackageTile>
          <PackageTile {...tile('adapters-py')} meta={meta(p['adapters-py'], 'logging 필터', '[otel] extra')}>
            Python 표준 라이브러리에는 값 기반 치환이 아예 없습니다. 이 필터가 그것을 더하고, <code>[otel]</code>{' '}
            extra가 span을 덮습니다.
          </PackageTile>
        </Grid>
        <p class="small">
          Langfuse 같은 <b>마스킹 콜백 호스트는 전용 패키지가 필요 없습니다</b> — 공용 워커가 연동 그 자체입니다.
        </p>
        <p class="tiny">버전과 호스트 범위는 {slots.observedAt}에 npm·PyPI 레지스트리에서 읽은 값입니다.</p>
      </DocSection>

      <DocSection
        eyebrow="설계 규칙"
        title="의심스러우면 마커를 찍습니다"
        lede={
          <>
            모든 어댑터가 문자열을 가리는 하나의 원시 연산을 공유하고, 그 연산은{' '}
            <b>오류가 텍스트를 선로에 올리도록 절대 허용하지 않습니다.</b> 이 마커들은 공개 API입니다 — 호스트가
            보는 것이고, 메이저 버전에서만 바뀝니다.
          </>
        }
      >
        <DataTable
          label="어댑터 마커"
          head={['마커', '언제']}
          rows={[
            [
              <span class="mono">[REDACTED:BLOCKED]</span>,
              <>
                <code>block</code> 판정. 매치된 범위만이 아니라 <b>잎 전체</b>가 교체됩니다.
              </>,
            ],
            [
              <span class="mono">[REDACTED:ERROR]</span>,
              '코어 호출 안의 모든 실패 — 초기화되지 않은 코어 포함. 원본 텍스트도, 오류 자신의 메시지도 내보내지 않습니다.',
            ],
            [
              <span class="mono">[REDACTED:LIMIT_EXCEEDED]</span>,
              <>
                워크 예산을 넘은 값. <b>스캔되지도 않고 가려지지 않은 채 통과하지도 않습니다.</b>
              </>,
            ],
            [<span class="mono">[REDACTED:CYCLE]</span>, '자기 자신을 참조하는 객체.'],
          ]}
        />
        <Note tone="danger">
          <p>
            <b>세 번째 줄을 두 번 읽으십시오.</b> 스캔하기에 너무 큰 것이 있을 때 구미가 당기는 동작은 그냥 통과시키는
            것입니다. <b>그것이 정확히 비밀값이 빠져나가는 경로입니다.</b> 여기서는 스캔할 수 없으면 출력할 수도
            없습니다.
          </p>
        </Note>
        <h3 class="h3">예산</h3>
        <Grid cols={4}>
          <StatTile value={n(budgets.depth)}>최대 깊이</StatTile>
          <StatTile value={n(budgets.arrayLength)}>최대 배열 길이</StatTile>
          <StatTile value={n(budgets.objectKeys)}>최대 객체 키</StatTile>
          <StatTile value={n(budgets.leaves)}>최대 총 잎 수</StatTile>
        </Grid>
        <p class="small">
          여기에 문자열당 {n(budgets.stringChars)}자 상한이 더해집니다. 한계를 넘은 요소와 키는{' '}
          <b>통과되지 않고 버려집니다.</b> 모든 한계는 호출 단위로 재정의할 수 있습니다.
        </p>
      </DocSection>

      <DocSection eyebrow="작게 유지되는 이유" title="코어에서 네 가지, 그 외에는 없음">
        <RuleRows
          rows={[
            { term: 'initialize()', body: '엔진을 적재합니다.' },
            { term: 'scanAndRedact()', body: '그리고 그것이 돌려주는 모양.' },
            { term: 'findings', body: '배열이라는 것.' },
            {
              term: 'finding.action',
              body: (
                <>
                  <code>block</code>인지 <code>warn</code>인지.
                </>
              ),
            },
          ]}
        />
        <p>
          선언된 호환 범위가 지키는 것이 바로 이 표면입니다. 이 패키지들은 코어가 내보내는 타입에 대해 TypeScript로
          쓰였으므로, 그 표면이 바뀌면 <b>조용히 나빠지는 대신 빌드가 실패합니다.</b>
        </p>
        <Note tone="success">
          <p>
            <b>그리고 독립성을 삽니다.</b> 코어는 Rust·npm·PyPI·CLI가 lockstep으로 릴리스됩니다. 이 패키지들은 그
            lockstep에 없습니다 — <b>pino의 새 릴리스는 <code>adapter-pino</code>만 움직이고 그 외에는 아무것도
            움직이지 않습니다.</b>
          </p>
        </Note>
      </DocSection>

      <DocSection
        eyebrow="여기서 “지원”의 뜻"
        title="추측이 아니라 확인 가능한 범위"
        lede={
          <>
            출시된 모든 어댑터가 지원하는 호스트 범위를 명시하고, CI에서 그 범위의{' '}
            <b>양 끝에서 실제 호스트 인스턴스</b>를 상대로 시험합니다.
          </>
        }
      >
        <DataTable
          label="어댑터별 선언된 호스트 범위"
          head={['어댑터', '선언된 범위', '무엇으로 검증하나']}
          rows={[
            ['adapter-pino', <span class="mono">{hostRange(p['adapter-pino'])}</span>, '캡처된 스트림에 쓰는 진짜 pino 로거'],
            [
              'adapter-otel',
              <span class="mono">{hostRange(p['adapter-otel'])}</span>,
              <>
                <code>onEnd</code>를 통과하는 진짜 span
              </>,
            ],
            ['Python logging', <span class="mono">CPython &gt;=3.10</span>, '필터가 붙은 진짜 로거'],
            [
              'Python otel',
              <span class="mono">{pythonExtra(p['adapters-py'].requires, 'otel')}</span>,
              '진짜 tracer provider를 통과하는 진짜 span',
            ],
          ]}
        />
        <p>
          선언 범위 밖의 pino 메이저는 <b>일부러</b> 주장하지 않습니다. 아마 잘 돌 것입니다. 시험하지 않았으므로
          주장하지 않습니다 — <b>코어가 자기 탐지기에 적용하는 것과 같은 규율입니다.</b>
        </p>
      </DocSection>

      <DocSection eyebrow="정직하게" title="여기 없는 것">
        <Note tone="warning" title="의도적으로 범위 밖">
          <ul>
            <li>
              <b>탐지.</b> 무엇이 비밀값인지 정하는 일은 언제나 코어에 남습니다.
            </li>
            <li>
              <b>스트림 어댑터.</b> Node <code>Transform</code>과 Web <code>TransformStream</code>은 코어 자체에{' '}
              <code>./node-stream</code>·<code>./web-stream</code>으로 들어 있습니다.
            </li>
            <li>
              <b>LangChain과 Langfuse 패키지.</b> 마스킹 콜백 호스트는 패키지가 필요 없습니다 — 공용 워커가
              연동입니다.
            </li>
            <li>
              <b>복구.</b> 어댑터는 나가는 싱크를 정리합니다. 값을 되돌릴 능력을 <b>절대 얻지 않으며</b>, 그것은{' '}
              <a href={architecturePath(locale, 'vault')}>별도 저장소</a>의 일이고 이 패키지들은 그것에 의존하지
              않습니다.
            </li>
          </ul>
        </Note>
      </DocSection>

      <SourceStrip label="출처.">
        <code>{evidence.sources.adapters.repo.split('/')[1]}</code>
        {evidence.sources.adapters.commit && (
          <>
            {' '}
            <code>{evidence.sources.adapters.commit}</code>
          </>
        )}
        의 <code>README.md</code>·<code>ARCHITECTURE.md</code>와 각 패키지의 README·changelog. 버전은{' '}
        {slots.observedAt}에 npm·PyPI 레지스트리에서 읽었고 저장소에서 읽지 않았습니다.
      </SourceStrip>
    </>
  );
}
