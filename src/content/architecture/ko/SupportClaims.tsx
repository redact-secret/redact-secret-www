import {
  Card,
  Chips,
  Claim,
  DocSection,
  FileGrid,
  Flow,
  FlowArrow,
  FlowNode,
  Grid,
  Note,
  PageHead,
  PinPair,
  RichCode,
  Dim,
  Flag,
  SourceStrip,
  StatusBar,
} from '../../../components/architecture';
import { StatusChip } from '../../../components/ui';
import type { Locale } from '../../../i18n';
import { evidence } from '../../../slots';

const { matrix, taxonomy, staleProse, sources, measurement } = evidence;

/** `2026-09-21` → `9월 21일`. */
function monthDay(date: string) {
  const [, m, d] = date.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}

const githubTokens = [
  { prefix: 'ghp_', desc: '클래식 개인 액세스 토큰' },
  { prefix: 'gho_', desc: 'OAuth 액세스 토큰' },
  { prefix: 'ghu_', desc: 'App user-to-server' },
  { prefix: 'ghs_', desc: 'App server-to-server' },
  { prefix: 'ghr_', desc: 'OAuth 리프레시 토큰' },
  { prefix: 'github_pat_', desc: '세분화된 PAT — 이제 자기 탐지기를 가짐' },
];

export function SupportClaims(_props: { locale: Locale }) {
  return (
    <>
      <PageHead
        eyebrow="03 · 지원 주장은 어떻게 만들어지나"
        title="GitHub은 여섯 종류의 토큰을 발급합니다. 그중 무엇을 잡습니까?"
        lede="이 질문에 정직하게 답하는 것이 이 구조 전체의 목적입니다."
      />

      <DocSection
        eyebrow="문제"
        title="탐지기 이름은 잘못된 단위입니다"
        lede={
          <>
            <code>github-token</code>이라는 탐지기는 <code>ghp_ | gho_ | ghu_ | ghs_ | ghr_</code> 다섯 형태를
            매치합니다. GitHub은 여섯을 발급합니다. 오랫동안 여섯 번째는 그냥 덮이지 않았고,{' '}
            <b>어떤 규칙 목록도 그 사실을 알려 주지 않았습니다.</b>
          </>
        }
      >
        <Grid cols={3}>
          {githubTokens.map((t) => (
            <Card key={t.prefix} compact>
              <b class="mono">{t.prefix}</b>
              <span class="tiny">{t.desc}</span>
            </Card>
          ))}
        </Grid>
        <Claim sub="그래서 한 파일이 코드와 무관하게 그 목록을 고정합니다. 코드가 무엇을 잡든 상관없이.">
          주장의 단위는 “우리가 쓴 탐지기”가 아니라 “공급자가 실제로 발급하는 자격 증명”입니다.
        </Claim>
        <Note tone="success" title="그리고 실제로 작동했습니다">
          <p>
            여섯 번째 계열은 taxonomy 안에 <b>공개된 공백</b>으로, 그것을 발견한 이슈 번호와 함께 앉아 있었습니다.
            지금은 <code>github-fine-grained-pat</code>이라는 자기 탐지기를 갖고 여섯이 모두 덮입니다.{' '}
            <b>공백이 보였기 때문에 메워졌고</b>, 그것이 이 설계 전체의 논거입니다.
          </p>
        </Note>
      </DocSection>

      <DocSection
        eyebrow="세 개의 입력"
        title="세 파일, 세 가지 다른 질문"
        lede={
          <>
            일부러 떼어 놓았습니다. 각각이 <b>따로 틀릴 수 있고</b>, 각각을 다른 절차가 씁니다.
          </>
        }
      >
        <FileGrid
          files={[
            {
              name: 'benchmarks/detectors.json',
              question: '무슨 코드를 출시했나?',
              facts: [
                { term: '작성 주체', desc: '생성기가 코어의 탐지기 레지스트리에서 뽑습니다.' },
                { term: '고정 대상', desc: '정확한 커밋 하나 — 측정이 돌아간 빌드.' },
                { term: '내용', desc: '탐지기 id와 제목의 평평한 목록. 품질에 관한 것은 없습니다.' },
              ],
            },
            {
              name: 'benchmarks/support/taxonomy.json',
              question: '세상은 무엇을 발급하나?',
              facts: [
                { term: '작성 주체', desc: '사람이 손으로. 모든 항목에 출처 링크나 서술된 근거가 붙습니다.' },
                { term: '고정 대상', desc: '없음. 우리 코드가 아니라 공급자를 기술합니다.' },
                { term: '내용', desc: '모든 자격 증명 계열 — 우리가 탐지하든 말든.' },
              ],
            },
            {
              name: 'results-output/support-status.json',
              question: '각각은 얼마나 잘했나?',
              facts: [
                { term: '작성 주체', desc: '벤치마크 코퍼스를 돌려서. 의견이 아니라 측정.' },
                { term: '고정 대상', desc: '코퍼스 해시 매니페스트와 측정된 버전.' },
                {
                  term: '내용',
                  desc: (
                    <>
                      <em>탐지기</em>별 판정 — 상태, 증거 등급, 이유.
                    </>
                  ),
                },
              ],
            },
          ]}
        />
        <Note>
          <p>
            <b>셋 모두에 없는 것을 보십시오.</b> 어느 파일에도 지원 주장이 들어 있지 않습니다. 주장은 셋을 합친
            뒤에야 존재하고, 그래서 <b>아무도 손으로 쓸 수 없습니다.</b>
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow="결합" title="측정은 탐지기에, 주장은 계열에 내려앉습니다">
        <Flow>
          <Grid cols={3}>
            <Card compact center>
              <b class="mono">detectors.json</b>
              <span class="tiny">존재하는 코드</span>
            </Card>
            <Card compact center>
              <b class="mono">taxonomy.json</b>
              <span class="tiny">세상의 자격 증명</span>
            </Card>
            <Card compact center>
              <b class="mono">support-status.json</b>
              <span class="tiny">각 탐지기의 측정</span>
            </Card>
          </Grid>
          <FlowArrow />
          <FlowNode title="복사할 뿐, 다시 유도하지 않습니다">
            각 탐지기의 판정이 <b>글자 그대로</b> 그 탐지기가 담당하는 모든 계열에 복사됩니다. GitHub 탐지기 하나의
            결과가 다섯 계열에 내려앉고, Stripe의 것은 넷에 내려앉습니다. 결합 과정은 자기 판단을 조금도 더하지
            않습니다.
          </FlowNode>
          <FlowArrow />
          <FlowNode title="support-matrix.json" marked>
            한 행에 자격 증명 계열 하나. 이 제품이 싣고 있는 사본에는 {matrix.families}행이 있습니다.
          </FlowNode>
          <FlowArrow />
          <FlowNode
            title={
              <>
                <code>docs/support-matrix.md</code>와 README 표
              </>
            }
          >
            둘 다 생성물입니다. 어느 한쪽이라도 JSON에서 어긋나면 <code>npm run ci</code>가 실패합니다.
          </FlowNode>
        </Flow>
        <p class="small">
          방향이 한쪽인 것이 핵심입니다. 매트릭스가 taxonomy를 읽지, 그 반대는 없습니다. 코드 리뷰 규칙이 이를
          명시합니다 — <b>관련 계열 이름에서 변종 지원을 추론해서는 안 됩니다.</b> 지원되는 토큰과 접두사를
          공유한다는 것은 증거가 아닙니다.
        </p>
      </DocSection>

      <DocSection
        eyebrow="영리한 부분"
        title="탐지기가 없는 계열도 한 행입니다"
        lede={
          <>
            taxonomy에서, 아무도 탐지기를 쓰지 않은 자격 증명은 빈 목록을 갖습니다 — <code>"detectors": []</code>.
            그것은 빈칸이 아니라 공개 표에 <b>unsupported 행을 만들라는 지시</b>이고, 동시에 작업 목록입니다.
            GitHub의 여섯 번째 토큰이 여기서 시작했습니다.
          </>
        }
      >
        <Grid cols={2}>
          <Card>
            <h3>
              <StatusChip tone="danger">보통</StatusChip>
            </h3>
            <p>
              규칙 목록을 출시합니다. 아무도 규칙을 쓰지 않은 자격 증명은 언급조차 되지 않습니다.{' '}
              <b>“확인했고 못 잡는다”와 “생각해 본 적 없다”를 구별할 수 없습니다.</b>
            </p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="success">여기</StatusChip>
            </h3>
            <p>
              공백을 성과와 같은 표에, 이유를 붙여 이름 짓습니다. 오늘 탐지기가 없는 계열이{' '}
              {taxonomy.withoutDetector}개이고, <b>그 전부가 공개되어 있습니다.</b>
            </p>
          </Card>
        </Grid>
        <p>
          그리고 테스트가 이를 강제합니다. 탐지기가 0개인 계열은 <em>반드시</em> 출처 링크나 서술된 근거를 달아야
          합니다. 이유 없는 unsupported 주장은 빌드를 실패시키며, 명세는 그것을 공급자에 관한 사실이 아니라{' '}
          <b>taxonomy의 버그</b>라고 부릅니다.
        </p>
        <RichCode label="unsupported 행 예시">
          <Dim>// 실제 unsupported 행</Dim>
          {'\n"provider": "atlassian",\n"status": "unsupported",\n"detectors": [],\n"reason": '}
          <Dim>
            {
              '"the pinned third-party detector targets the distinct ATCT\n  access-token family, not the ATAT-prefixed API-token shape."'
            }
          </Dim>
        </RichCode>
      </DocSection>

      <DocSection
        eyebrow="유사품이 전부 계열은 아닙니다"
        title="일부러 빼는 것들"
        lede={
          <>
            키처럼 생긴 것이 전부 계열이 되면 unsupported 목록이 <b>애초에 비밀이 아니었던 것들</b>로 가득 찹니다.
            그래서 몇 가지는 이름을 지정해 제외하고, 그 이유를 기록합니다.
          </>
        }
      >
        <Chips
          label="이름을 지정해 제외한 형태"
          struck
          items={['AWS AIDA…', 'Twilio Account SID', 'Twilio API Key SID', 'Stripe pk_…', 'Supabase sb_publishable_…']}
        />
        <Grid cols={2}>
          <Card>
            <h3>식별자이지 비밀이 아님</h3>
            <p>
              AWS <code>AIDA</code> 값은 IAM 사용자를 가리킵니다. Twilio SID는 계정을 식별하며, 옆의 토큰 탐지를
              게이팅하는 데 쓰이지만 그 자체가 새는 것은 유출이 아닙니다.
            </p>
          </Card>
          <Card>
            <h3>공개로 문서화됨</h3>
            <p>
              Stripe의 publishable key와 Supabase의 publishable key는 둘 다 브라우저 코드에 실려 나가도록
              만들어졌습니다. <b>벤더 자신이 그렇게 말합니다.</b>
            </p>
          </Card>
        </Grid>
        <p class="small">
          그 대가로 <b>unsupported</b>는 언제나 “이 프로젝트가 잡지 못하는 실제 자격 증명”을 뜻하고, “우리 패턴과
          닮은 문자열”을 뜻하는 일이 없습니다.
        </p>
      </DocSection>

      <DocSection
        eyebrow="한 행이 말하는 것"
        title="provisional은 느낌이 아니라 산술입니다"
        lede={
          <>
            계열이 기준에 못 미치면, 그 행은 <b>어떤 게이트를 얼마나 못 넘었는지</b>를 숫자와 함께 싣습니다.
          </>
        }
      >
        <RichCode label="provisional 행 예시">
          <Dim>// 실제 provisional 행</Dim>
          {
            '\n"provider": "anthropic",\n"status": "provisional",  "evidenceTier": "T1",\n"evidenceBasis": "provider-documented",\n"reason":\n  documented.minimumPositiveCases:   '
          }
          <Flag>5 &lt; 6</Flag>
          {'\n  documented.minimumPositiveAxes:    '}
          <Flag>2 &lt; 4</Flag>
          {'\n  documented.minimumBenignCases:     '}
          <Flag>5 &lt; 8</Flag>
          {'\n  documented.minimumControlAxes:     '}
          <Flag>3 &lt; 4</Flag>
        </RichCode>
        <p>
          이 계열의 토큰 형식은 공급자가 문서화한 것으로, 존재하는 가장 좋은 증거 등급입니다. 그런데도
          provisional이었습니다 — 뒤를 받치는 fixture가 양성 사례 하나와 benign 대조군 셋이 모자랐기 때문입니다.{' '}
          <b>여기에는 논쟁할 것이 없고, 누군가 가서 fixture 넷을 쓰면 됩니다.</b> 매트릭스의 대부분이 이미 그렇게
          했습니다.
        </p>
      </DocSection>

      <DocSection eyebrow="상태 분포" title={`출시된 매트릭스 ${matrix.families}행`}>
        <StatusBar
          label={`출시된 매트릭스 ${matrix.families}행의 상태`}
          segments={[
            { tone: 'success', count: matrix.status.stable, word: 'Stable', desc: '기준을 넘음, 의지해도 됨' },
            { tone: 'danger', count: matrix.status.unsupported, word: 'Unsupported', desc: '이유와 함께 그래도 실림' },
            { tone: 'warning', count: matrix.status.provisional, word: 'Provisional', desc: '유용하나 증거 미완' },
            { tone: 'info', count: matrix.status.pending, word: 'Pending', desc: '탐지도 미탐지도 신뢰 불가' },
          ]}
        />
        <p class="small">
          stable {matrix.status.stable}개는 두 갈래로 따로 셉니다 — <b>{matrix.stableBasis.documented}개</b>는 공급자가
          공개한 계약에 근거하고, <b>{matrix.stableBasis.empirical}개</b>는 벤더 문서가 없어 측정만으로 확보한
          것입니다. 증거 등급은 다시 자기 축에서 매겨집니다(T1 {matrix.tiers.T1}, T2 {matrix.tiers.T2}, T3{' '}
          {matrix.tiers.T3}, T0 {matrix.tiers.T0}). <b>실증적 자격 획득이 T2 증거를 T1으로 승격시키는 일은 없습니다.</b>
        </p>
      </DocSection>

      <DocSection eyebrow="조심스럽게 세기" title="두 숫자가 어긋나는 것은 핀이 작동한다는 뜻입니다">
        <PinPair
          live={{
            label: '살아 있는 taxonomy',
            value: taxonomy.families,
            note: `${taxonomy.providers}개 공급자에 걸친 계열. benchmarks 저장소가 계속 움직입니다.`,
          }}
          pinned={{
            label: '이 제품이 싣는 매트릭스',
            value: matrix.families,
            note: '얼어붙은 사본. 누군가 측정을 다시 돌려 핀을 갱신할 때만 바뀝니다.',
          }}
        />
        <p>
          한 릴리스 전에는 정확히 일치했습니다.{' '}
          <b>둘 사이의 간격은 오류가 아니라, 증거가 얼마나 오래되었는지를 핀이 알려 주는 것입니다.</b> 화면은 이 둘을
          하나로 합치지 않고 나란히 둡니다.
        </p>
        <p>
          버전도 마찬가지입니다.{' '}
          {measurement.measured ? (
            <>
              출시된 매트릭스는 <code>{measurement.measured}</code>에서 측정되었고
            </>
          ) : (
            <>출시된 매트릭스에는 어느 버전을 측정했는지 기록되어 있지 않고</>
          )}
          (benchmarks <code>{measurement.benchmarks}</code>), 현재 릴리스는 <code>{measurement.released}</code>
          입니다. 이 릴리스의 드리프트 게이트는{' '}
          {measurement.gated ? '바로 이 매트릭스를 대상으로 실행되었습니다' : '아직 이 매트릭스를 대상으로 실행되지 않았습니다'}. 두
          값 모두 제품 저장소 <code>{measurement.commit}</code>의 사이트 피드에서 {measurement.observedAt}에 읽었습니다.
        </p>
        <Note tone="warning" title="믿지 말아야 할 세 번째 숫자">
          <p>
            명세의 산문은 아직{' '}
            <em>
              {staleProse.providers}개 공급자에 {staleProse.families}개 계열
            </em>
            이라고 적고 있고, 날짜는 {monthDay(staleProse.dated)}입니다. <b>세 번의 릴리스 동안 틀린 채였습니다.</b>{' '}
            명세 스스로가 자기 문단보다 <code>taxonomy.json</code>이 진실의 원천이라고 선언해 이를 예방합니다.
          </p>
          <p>
            <b>일반 규칙:</b> 산문은 낡고 생성된 파일은 낡지 않습니다. 중요한 모든 수치는 계산되고, 작성된 사본이
            계산된 값에서 어긋나면 CI가 실패합니다 — 그래서 아무도 생성하지 않는 그 문단만 옛 숫자를 아직 들고 있는
            것입니다.
          </p>
        </Note>
      </DocSection>

      <SourceStrip label="출처.">
        benchmarks 저장소 <code>{sources.benchmarks.commit}</code>의 <code>docs/specs/taxonomy.md</code>·
        <code>benchmarks/support/taxonomy.json</code>·<code>benchmarks/detectors.json</code>·
        <code>benchmarks/support/matrix.ts</code>, 그리고 제품 저장소 <code>{sources.core.commit}</code>의 출시
        매트릭스와 핀 매니페스트를 {evidence.observedAt}에 읽었습니다. 수치는 산문이 아니라 JSON에서 계산한
        것입니다.
      </SourceStrip>
    </>
  );
}
