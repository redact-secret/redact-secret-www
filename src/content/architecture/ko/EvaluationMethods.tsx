import {
  Card,
  Claim,
  Dim,
  DocSection,
  Grid,
  MethodBlock,
  Note,
  PageHead,
  Phase,
  RichCode,
  RuleRows,
  SourceStrip,
  SpanLattice,
} from '../../../components/architecture';
import { StatusChip } from '../../../components/ui';
import type { Locale } from '../../../i18n';
import { evidence } from '../../../slots';

const { sources } = evidence;

export function EvaluationMethods(_props: { locale: Locale }) {
  return (
    <>
      <PageHead
        eyebrow="04 · 평가 방법"
        title="스캐너는 자기가 맞았는지에 투표권이 없습니다"
        lede="열 개의 시험 방법. 그 아래에 규칙은 하나입니다."
      />

      <DocSection
        eyebrow="규칙"
        title="정답을 먼저 쓰고, 그다음에 돌립니다"
        lede={
          <>
            모든 방법이 기대 결과를 스캐너가 바이트를 만지기 <em>전에</em> 작성하고, 검토하고, 해시할 것을
            요구합니다. 예의가 아니라, <b>숫자에 의미를 부여하는 바로 그 장치</b>입니다.
          </>
        }
      >
        <RuleRows
          rows={[
            { term: '명세 01', body: '“스캐너 결과가 정답을 만들거나 수정해서는 안 된다.”' },
            { term: '명세 04', body: '“…스캐너 간 합의로 유효성을 추론하는 대신.”' },
            { term: '명세 05', body: '“범위는 구성에서 다시 계산하라. 스캐너 출력을 뒤져서 찾지 말고.”' },
            { term: '명세 06', body: '“경쟁 제품이 표시했다는 이유로 대조군의 라벨을 바꾸지 말라.”' },
            { term: '명세 08', body: '“다수결은 기대값을 승격시키거나 강등시키거나 다시 쓸 수 없다.”' },
          ]}
        />
        <p class="small">
          스캐너는 심지어 눈이 가려져 있습니다. 어댑터에는 fixture의 식별자와 바이트만 전달되고,{' '}
          <b>기대값도 증거 등급도 전달되지 않습니다.</b>
        </p>
      </DocSection>

      <DocSection
        eyebrow="채점"
        title="답은 둘이 아니라 다섯입니다"
        lede={
          <>
            “비밀값을 찾았나?”는 너무 뭉툭합니다. 진짜 범위가 바이트 단위로 알려져 있으므로, 채점은{' '}
            <em>어떤 바이트를</em> 잡았는지에 관한 것입니다.
          </>
        }
      >
        <SpanLattice
          passLabel="통과"
          failLabel="실패"
          legend={{ hit: '가려진 비밀값 바이트', leak: '새어 나간 비밀값 바이트', over: '함께 잡힌 무고한 바이트' }}
          rows={[
            {
              code: 'Exact',
              pass: true,
              cells: ['none', 'none', 'hit', 'hit', 'hit', 'hit', 'none', 'none'],
              description: '비밀값 바이트를 정확히 가림',
            },
            {
              code: 'Covered',
              pass: true,
              cells: ['none', 'over', 'hit', 'hit', 'hit', 'hit', 'over', 'none'],
              description: '비밀값 전체를 가리고, 허용 범위 안에서 양옆 한 바이트씩 함께 가림',
            },
            {
              code: 'Overbroad',
              pass: false,
              cells: ['over', 'over', 'hit', 'hit', 'hit', 'hit', 'over', 'over'],
              description: '비밀값은 가렸지만 허용 범위를 넘어 주변 텍스트까지 가림',
            },
            {
              code: 'Partial',
              pass: false,
              cells: ['none', 'none', 'hit', 'hit', 'hit', 'leak', 'none', 'none'],
              description: '비밀값 일부를 가리고 마지막 바이트가 새어 나감',
            },
            {
              code: 'Miss',
              pass: false,
              cells: ['none', 'none', 'leak', 'leak', 'leak', 'leak', 'none', 'none'],
              description: '비밀값 바이트가 전부 새어 나감',
            },
          ]}
        />
        <Claim
          sub={
            <>
              그것이 <b>Partial</b>이고, 실패합니다. <b>Overbroad</b>도 마찬가지입니다 — 키 주변 문단을 통째로
              삼키면 키는 가려지지만 로그 줄이 파괴됩니다. 작성된 허용 범위 안에 들어온 범위만 통과합니다.
            </>
          }
        >
          32바이트 중 31바이트를 잡는 것은 아까운 실패가 아닙니다. 누출입니다.
        </Claim>
      </DocSection>

      <DocSection
        eyebrow="열 가지 방법"
        title="각각이 다른 방식의 오답을 묻습니다"
        lede={
          <>
            번호가 붙은 이유는 순서이기 때문입니다. 첫 번째 이후는 전부 그것에서 <em>파생</em>됩니다 — 쌍둥이를 만들
            원본 양성 사례가 없으면 쌍둥이를 쓸 수 없습니다.
          </>
        }
      >
        <Phase title="먼저 진실을 만든다">자격 증명 하나, 가장 단순한 사례 하나</Phase>
        <MethodBlock
          n="01"
          title="표준 양성"
          ask="쉬운 것을 찾습니까?"
          gist={
            <>
              다른 모든 방법이 자라 나오는 씨앗입니다. 바이트 범위·증거·소스 해시가 스캐너가 돌기 <b>전에</b>{' '}
              기록됩니다. <b>이것만 통과해서는 어떤 지원 주장도 얻지 못합니다.</b>
            </>
          }
        />

        <Phase title="까다로운지, 그냥 욕심이 많은지 증명한다">
          더 많은 텍스트를 잡는 탐지기는 양성만 보면 더 좋아 보인다
        </Phase>
        <MethodBlock
          n="02"
          title="음성 쌍둥이"
          ask="정확히 한 가지만 바꿉니다. 조용해집니까?"
          gist={
            <>
              변이는 하나만 — 접두사, 길이, 알파벳, 경계, 공개 접두사 중 하나. 둘을 바꾸면 쌍둥이가 아닙니다. 쌍이{' '}
              <b>한 단위로</b> 채점되므로, 전부 잡는 방식으로는 이길 수 없습니다.
            </>
          }
        >
          <RichCode label="음성 쌍둥이 예시">
            ACME_KEY=… <Dim>반드시 잡아야 함</Dim>
            {'\n'}ACMX_KEY=… <Dim>반드시 잡지 말아야 함</Dim>
          </RichCode>
        </MethodBlock>
        <MethodBlock
          n="06"
          title="무해한 유사품"
          ask="키처럼 보이기만 하는 것에 침묵합니까?"
          gist={
            <>
              일부러 진짜에 가깝게 만들어 각각이 과잉 매치의 특정 경로를 찌릅니다. 정책 기반 대조군은 출처 기반
              대조군과 <b>분모를 따로</b> 셉니다 — 판단이 사실을 희석하지 못하게.
            </>
          }
        >
          <RichCode label="무해한 유사품 예시">
            AKIAIOSFODNN7EXAMPLE <Dim>벤더 자신의 문서에서</Dim>
            {'\n'}&lt;your-api-key-here&gt;{'  '}
            <Dim>자리표시자</Dim>
            {'\n'}pk_live_…{'            '}
            <Dim>publishable, 공개 의도</Dim>
          </RichCode>
        </MethodBlock>

        <Phase title="그다음 공격한다">가장자리, 문자, 컨테이너, 기계가 만든 변종</Phase>
        <MethodBlock
          n="03"
          title="경계 사례"
          ask="규칙의 한 글자 안팎에서는 어떻게 됩니까?"
          gist={
            <>
              문서화된 모든 길이와 구분자에 대해 <b>안쪽과 바깥쪽</b> 사례가 필요하거나, 그 쌍이 무의미한 이유가
              서술되어야 합니다. off-by-one 범위와 우연한 부분 문자열 매치를 잡습니다. 파일 끝, 마지막 개행 없음,
              CRLF, 다음 토큰과 맞닿음까지.
            </>
          }
        />
        <MethodBlock
          n="04"
          title="알파벳 변이"
          ask="정말 본문을 검사합니까, 아니면 접두사와 길이만 봅니까?"
          gist={
            <>
              한 글자만 바꾸고 나머지는 고정합니다. “접두사 맞고 길이 대충 맞음”만 보는 값싼 탐지기는{' '}
              <b>오직 여기서만</b> 실패합니다.
            </>
          }
        >
          <RichCode label="알파벳 변이 예시">
            ACME_a9f3k2… <Dim>적법한 문자, 잡아야 함</Dim>
            {'\n'}ACME_a9f!k2… <Dim>부적법한 문자, 침묵해야 함</Dim>
          </RichCode>
        </MethodBlock>
        <MethodBlock
          n="05"
          title="맥락 순열"
          ask="같은 키, 다른 포장. 같은 답입니까?"
          gist={
            <>
              bare · .env · JSON · YAML · TOML · 소스 코드 · Markdown · URI · 따옴표 · CRLF. 자격 증명 바이트는
              그대로이고 주변만 바뀝니다. 기대값이 <b>지원되는 모든 포장에서 살아남아야</b> 하며, 맥락마다 따로
              보고되므로 큰 계열 하나가 약한 하나를 가릴 수 없습니다.
            </>
          }
        />
        <MethodBlock
          n="07"
          title="생성된 변이"
          ask="아무도 손으로 쓰지 않을 천 개의 변종은?"
          gist={
            <>
              명시적으로 <b>퍼징이 아닙니다.</b> 변종은 어떤 스캔보다 먼저 생성되고, 각각 preserve · invalidate ·
              review-required로 미리 태그되며, 개수와 비용이 제한됩니다. operator v3 + seed 41 + 소스 해시로{' '}
              <b>깨끗한 체크아웃이 바이트 단위로 재현</b>합니다.
            </>
          }
        />

        <Phase title="밖을 보고, 앞을 본다">다른 도구, 보지 못한 사례, 시간의 경과</Phase>
        <MethodBlock
          n="08"
          title="경쟁 제품 불일치"
          ask="같은 바이트에서 우리와 Gitleaks와 TruffleHog는 어디서 갈립니까?"
          gist={
            <>
              경쟁 제품은 <b>관측이지 신탁이 아닙니다.</b> 모든 어댑터가 작성된 기대값에 대해 각자 채점됩니다.
              불일치는 사람이 볼 <b>검토 항목을 여는 것</b>이고, 기대값을 편집하는 일은 결코 없습니다.
            </>
          }
        />
        <MethodBlock
          n="09"
          title="홀드아웃 평가"
          ask="한 번도 맞춰 본 적 없는 사례에서는 어떻습니까?"
          gist={
            <>
              아무도 공부하지 못한 시험입니다. 일반 개발 명령은 홀드아웃 코퍼스를 <b>읽을 수조차 없고</b>, 사례가
              공개되기 전에 후보가 동결되며, 그 뒤에 후보를 건드리면 실행이 무효가 됩니다. 새 규칙이 마지막 구멍을
              막았습니다 — <b>홀드아웃 결과로 채점기 임계값이나 가중치를 고를 수 없고</b>, 홀드아웃이 보여 준 것
              때문에 재조정하면 그 에포크는 오염됩니다.
            </>
          }
        />
        <MethodBlock
          n="10"
          title="회귀 동결"
          ask="다음 달에 우리가 조용히 망가뜨릴 수 있습니까?"
          gist={
            <>
              끝난 실행은 불변의 비교점이 됩니다(<code>baselines/{evidence.baseline}.json</code> — fixture 해시,
              버전, 모든 결과). 새로운 <b>Partial</b>·<b>Miss</b>·오탐은 빌드를 실패시킵니다. 의도적 변경은{' '}
              <b>서면으로 승인된 이유</b>가 있어야 baseline이 움직이고, 개선이 옛 기록을 지우는 일은 없습니다.
            </>
          }
        />
      </DocSection>

      <DocSection
        eyebrow="탈출구"
        title="세 번째 답이 있습니다"
        lede={
          <>
            실제 형식은 가장자리에서 모호합니다. 모든 사례를 통과 아니면 실패로 밀어 넣는 시험은{' '}
            <b>사실을 지어내기 시작합니다.</b> 그래서 세 번째 통을 둡니다.
          </>
        }
      >
        <Grid cols={3}>
          <Card>
            <h3>
              <StatusChip tone="success">Preserve</StatusChip>
            </h3>
            <p>변경 후에도 여전히 비밀값. 반드시 잡아야 합니다.</p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="danger">Invalidate</StatusChip>
            </h3>
            <p>더 이상 비밀값이 아님. 반드시 무시해야 합니다.</p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="none">Review required</StatusChip>
            </h3>
            <p>
              아직 아무도 모름. <b>0으로 채점되고</b> 사람이 결정합니다.
            </p>
          </Card>
        </Grid>
        <p>
          review-required 사례는 통과도 실패도 주장하지 않으며 어떤 평균에도 들어가지 않습니다. <b>T0</b> 증거도
          같습니다 — 관측 가능하고 검사 가능하며, 의도적으로 채점되지 않습니다.
        </p>
        <Note>
          <p>
            <b>왜 중요한가:</b> 대안은 스캐너들이 무엇을 했는지 보고 모호함을 정리하는 것인데, 그것이야말로 이 시험
            전체가 끊으려는 순환입니다.
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow="무엇을 얻고 무엇을 얻지 못하나" title="열 개가 전부 초록이어도">
        <Grid cols={2}>
          <Card>
            <h3>
              <StatusChip tone="success">증명된 것</StatusChip>
            </h3>
            <p>
              이 정확한 바이트에서, 이 정확한 버전에서, 고정된 도구 버전으로, 스캐너가 검토자들이 그래야 한다고 말한
              대로 동작했다는 것. 그리고 누구든 깨끗한 체크아웃에서 재현할 수 있다는 것.
            </p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="none">증명되지 않은 것</StatusChip>
            </h3>
            <p>
              운영 환경 정확도. 명세 01이 직접 말합니다 — 이것은 <em>fixture 상대적</em> 커버리지입니다. 명세 09는
              홀드아웃도 운영 정확도를 확립하지 않는다고 덧붙입니다.{' '}
              <b>열 개의 초록은 코퍼스를 기술하지 세상을 기술하지 않습니다.</b>
            </p>
          </Card>
        </Grid>
        <p class="small">
          그래서 어떤 방법도 혼자서는 충분하지 않고, 지원 매트릭스가 계열을 <b>한 번이라도 탐지된 적 있는가</b>가
          아니라 <b>이 중 몇 개를 통과했는가</b>로 매기는 것입니다.
        </p>
      </DocSection>

      <SourceStrip label="출처.">
        benchmarks 저장소 <code>{sources.benchmarks.commit}</code>의 <code>docs/specs/evaluation-methods/</code> 아래
        열 개 명세를 {evidence.observedAt}에 전부 읽었습니다. 인용은 원문을 옮긴 것이며, 예시는 각 방법의 형태를
        보이기 위한 합성 예시이지 코퍼스에서 복사한 fixture가 아닙니다.
      </SourceStrip>
    </>
  );
}
