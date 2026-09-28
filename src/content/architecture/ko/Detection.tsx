import {
  Card,
  Chips,
  Claim,
  DetectorAnatomy,
  Dim,
  DocSection,
  Grid,
  Note,
  PageHead,
  RichCode,
  RuleRows,
  SourceStrip,
  TierLadder,
} from '../../../components/architecture';
import { StatusChip } from '../../../components/ui';
import type { Locale } from '../../../i18n';
import { evidence } from '../../../slots';

const ruleset = [
  'ruleset-revision: 1',
  'detector: acme-internal-token',
  'specificity: contextual',
  'prefix: "ACME_"',
  'alphabet: alnum-dash',
  'run: at-least 20',
  'validator: none',
].join('\n');

export function Detection(_props: { locale: Locale }) {
  const { matrix, detectors } = evidence;
  return (
    <>
      <PageHead
        eyebrow="02 · 탐지 방식"
        title="모든 탐지기가 같은 질문에 답합니다 — 얼마나 확신하며, 왜인가?"
        lede="‘왜’는 정확히 다섯 종류뿐입니다. 그 다섯에 순위가 있고, 그 순위가 나머지 전부를 결정합니다."
      />

      <DocSection
        eyebrow="사다리"
        title="증거의 다섯 등급"
        lede={
          <>
            각 탐지기는 자기가 찾은 것에 이 중 하나를 찍습니다. <b>닫힌 목록</b>입니다 — 여섯 번째를 만들어 내는 것도,
            스스로를 승격시키는 것도 없습니다.
          </>
        }
      >
        <TierLadder
          rungs={[
            {
              tier: '5 · Private key',
              title: '텍스트가 스스로 밝힙니다',
              sub: (
                <>
                  여는 배너와 닫는 배너 사이 전부. 유일하게 기본 동작이 <b>block</b>인 등급입니다.
                </>
              ),
              example: '-----BEGIN …',
            },
            {
              tier: '4 · Provider',
              title: '회사가 자기 키에 도장을 찍습니다',
              sub: '고정 접두사, 정해진 알파벳, 알려진 길이.',
              example: 'ghp_ · AKIA · sk-',
            },
            {
              tier: '3 · Structural',
              title: '자기만의 형식이 있습니다',
              sub: '어느 벤더도 소유하지 않은 문법 — 헤더, URL, JWT.',
              example: 'Bearer …',
            },
            {
              tier: '2 · Contextual',
              title: '무언가가 그것을 비밀이라 불렀습니다',
              sub: '자격 증명 같은 이름, 그리고 무작위 같은 값.',
              example: 'api_key = …',
            },
            {
              tier: '1 · Entropy',
              title: '그냥 무작위해 보입니다',
              sub: '단독으로는 절대 충분하지 않습니다. 보조 신호일 뿐입니다.',
              example: 'x8Kd92mQz1',
            },
          ]}
          axis={['↑ 더 확실함', '가장 약함 ↓']}
        />
      </DocSection>

      <DocSection
        eyebrow="Tier 4"
        title="접두사 하나, 알파벳 하나, 길이 하나"
        lede={
          <>
            <b>
              {matrix.providers}개 공급자, {matrix.families}개 계열
            </b>
            이 자기 키에 알아볼 수 있는 시작을 붙입니다. 그 탐지기 전부가 같은 네 부분 구조이고, 이 등급 전체가 이 작은
            언어 위에 세워져 있습니다.
          </>
        }
      >
        <DetectorAnatomy
          parts={[
            { label: 'Prefix', value: 'ghp_', desc: '문자열 하나' },
            { label: 'Alphabet', value: 'A–Z a–z 0–9', desc: `고정된 ${detectors.alphabets}개 바이트 클래스 중 하나` },
            { label: 'Run', value: 'exactly 36', desc: '정확히 n, 또는 n 이상' },
            { label: 'Validator', value: 'none', desc: '선택적 추가 검사' },
          ]}
        />
        <RuleRows
          rows={[
            {
              term: '경계',
              body: (
                <>
                  바로 앞과 바로 뒤 문자가 그 알파벳에 <em>속하지 않아야</em> 합니다. 더 긴 덩어리의 일부를 통째 키로
                  착각하지 않기 위해서입니다.
                </>
              ),
            },
            {
              term: '대소문자',
              body: '벤더가 소문자 16진수로 문서화한 형식은 소문자 전용 클래스를 씁니다. 대소문자가 뒤섞인 유사품은 매치되지 않고 거부됩니다.',
            },
            {
              term: '검증기',
              body: (
                <>
                  Confluent 키는 실제 <b>CRC-32</b> 체크섬 꼬리를 달고 있어 탐지기가 다시 계산합니다. Cloudflare 쪽은
                  소문자 16진수인지만 봅니다.
                </>
              ),
            },
          ]}
        />
        <p class="small">구조에 맞지 않을 만큼 특이한 벤더 둘은 손으로 짠 문법을 받습니다:</p>
        <RichCode label="OpenAI 프로젝트 키 형식">
          sk-proj-<Dim>⟨74자⟩</Dim>T3BlbkFJ<Dim>⟨74자⟩</Dim>
        </RichCode>
        <p class="small">
          가운데 표식은 <code>base64("OpenAI")</code>입니다. 발급되는 모든 키가 이를 지니므로, 탐지기는{' '}
          <code>sk-</code>만 믿는 대신 여기에 닻을 내립니다.
        </p>
        <Note tone="warning">
          <p>
            <b>대가는 정밀도입니다.</b> 새로 나온 키 형식이나 잘린 키는, 누군가 그 문법을 추가하기 전까지 그냥
            놓칩니다.
          </p>
        </Note>
      </DocSection>

      <DocSection
        eyebrow="Tier 3"
        title="아무도 소유하지 않은 형식"
        lede={
          <>
            벤더 패턴이 아니라 포맷입니다. {detectors.structural}개뿐이고, 작은 <code>common</code> 프로파일이 유일하게
            남기는 탐지기들입니다.
          </>
        }
      >
        <RuleRows
          rows={[
            {
              term: 'JWT',
              body: (
                <>
                  점으로 나뉜 세 덩어리, 그리고 앞의 둘은 <code>eyJ</code>로 시작해야 합니다 — base64로 감싼 JSON의
                  지문입니다.
                </>
              ),
            },
            {
              term: 'Bearer',
              body: (
                <>
                  <code>Bearer</code> 뒤 최소 16자. <b>토큰만</b> 선택하고 헤더 단어는 건드리지 않습니다.
                </>
              ),
            },
            {
              term: '연결 URL',
              body: (
                <>
                  <code>postgres://user:pw@host</code>에서 <em>비밀번호만</em> 집어냅니다. 호스트는 읽을 수 있게
                  남습니다.
                </>
              ),
            },
            {
              term: 'otpauth URI',
              body: (
                <>
                  스킴과 <code>secret=</code> 파라미터. 라벨과 발급자는 그대로 둡니다.
                </>
              ),
            },
          ]}
        />
        <p>
          규칙을 증명하는 의도적 예외가 하나 있습니다. JWT의 페이로드가 자신을 Supabase <code>anon</code> 키라고 말하면
          버립니다 — 설계상 공개이고 브라우저 번들에 실려 나가는 키이기 때문입니다. <b>토큰의 내용을 읽는 유일한 지점</b>
          입니다.
        </p>
        <Note tone="warning">
          <p>
            <b>대가:</b> <code>otpauth://</code> 포장이 없는 맨 TOTP 시드는 닻을 내릴 형태가 없어 여기서는 보이지
            않습니다.
          </p>
        </Note>
      </DocSection>

      <DocSection
        eyebrow="Tier 2"
        title="이름이 값을 보증합니다"
        lede={
          <>
            아무도 문법을 만들어 주지 않은 자격 증명을 위한 포괄 등급입니다. <b>두 가지가 동시에</b> 성립해야 합니다 —
            비밀처럼 들리는 이름, 그리고 비밀처럼 보이는 값.
          </>
        }
      >
        <RuleRows
          rows={[
            {
              term: '이름',
              body: (
                <>
                  대소문자와 구두점을 먼저 평탄화하므로 <code>apiKey</code>, <code>API-KEY</code>, <code>api.key</code>는
                  한 이름입니다.
                </>
              ),
            },
            {
              term: '강한 이름',
              body: (
                <>
                  <code>api_key</code>, <code>password</code>, <code>client_secret</code>, <code>access_token</code> —
                  값이 무작위성 <b>3.0</b>을 넘어야 합니다.
                </>
              ),
            },
            {
              term: '애매한 이름',
              body: (
                <>
                  <code>auth</code>, <code>credential</code>, <code>signing_key</code> — 기준이 <b>3.5</b>로 올라갑니다.
                  단어가 약하면 증거가 강해야 합니다.
                </>
              ),
            },
            {
              term: '길이',
              body: '최소 8자. 무작위성은 16자를 넘어야 측정하고, 4 KB를 넘으면 전문 탐지기에 맡깁니다.',
            },
            {
              term: '맨 token',
              body: (
                <>
                  단어 <code>token</code> 하나만 있는 경우는 의도적으로 무시합니다. 너무 흔해서 아무 뜻이 없습니다.
                </>
              ),
            },
          ]}
        />
        <h3 class="h3">그리고 대부분을 버립니다</h3>
        <p>
          이 탐지기의 큰 부분은 <em>무엇이 비밀이 아닌지</em>를 아는 일입니다. 아래는 전부 인식되고 건너뛰어집니다:
        </p>
        <Chips
          label="인식되고 건너뛰는 값"
          struck
          items={[
            'changeme',
            'placeholder',
            'redacted',
            '<your-key-here>',
            '${process.env.KEY}',
            '$[variables.x]',
            '`date +%s`',
            'op://vault/item/field',
            ':bind_param',
            '/etc/ssl/key.pem',
            'true',
            '12345',
          ]}
        />
        <p class="small">
          전부 비밀값 자체가 아니라 비밀값을 <em>가리키는 것</em>입니다. 이런 것을 잡는 것이야말로 사람들이 스캐너를 꺼
          버리게 만드는 가장 빠른 길입니다.
        </p>
        <Note tone="warning">
          <p>
            <b>대가:</b> 가장 시끄러운 등급이므로 가장 엄격한 제외 목록을 붙였고, 기본적으로는 확신이 높지 않으면
            경고만 합니다.
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow="Tier 1" title="무작위성은 증거가 아닙니다">
        <Grid cols={2}>
          <Card>
            <h3>
              <StatusChip tone="none">잡지 않음</StatusChip>
            </h3>
            <p>
              <code>a8f3k29dj4ms91x</code>가 텍스트에 홀로 있을 때. 커밋 해시, ID, nonce, UUID일 수 있습니다.
            </p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="danger">잡음</StatusChip>
            </h3>
            <p>
              <code>password=a8f3k29dj4ms91x</code>. 같은 문자열인데, 이제 뒤에 무언가가 서 있습니다.
            </p>
          </Card>
        </Grid>
        <Claim sub="위 등급의 기준선을 올리거나 내릴 뿐입니다. 이 한 가지 결정이 오탐이 적은 이유이자, 이름도 형태도 없는 고엔트로피 비밀값이 그대로 통과하는 이유입니다.">
          엔트로피는 아무것도 승격시키지 않습니다.
        </Claim>
      </DocSection>

      <DocSection
        eyebrow="등급이 충돌할 때"
        title="다섯 개의 결정 규칙, 언제나 이 순서로"
        lede={
          <>
            두 탐지기가 겹치는 텍스트를 주장하는 일은 흔합니다. 승자는 <b>먼저 실행된 쪽이 아니라</b> 고정된 비교를
            위에서부터 내려가며 처음 갈리는 지점에서 정해집니다.
          </>
        }
      >
        <RuleRows
          rows={[
            {
              term: '1 · 심각도',
              body: (
                <>
                  경고만 할 후보는 차단할 후보를 절대 밀어낼 수 없습니다. <b>등급보다도 우선</b>합니다.
                </>
              ),
            },
            {
              term: '2 · 등급',
              body: '위의 사다리. private key > provider > structural > contextual > entropy.',
            },
            { term: '3 · 확신', body: 'high, medium, low.' },
            {
              term: '4 · 폭',
              body: (
                <>
                  좁은 범위가 이깁니다. <b>키를 지우지, 그 주변 문단을 지우지 않습니다.</b>
                </>
              ),
            },
            {
              term: '5 · 순서',
              body: '등록 순서, 그다음 방출 순서. 내장 탐지기가 커스텀보다 먼저 등록되므로 항상 안정된 답이 존재합니다.',
            },
          ]}
        />
        <p class="small">
          입력 전체에 대해서는 탐욕적으로 승자를 고르지 않습니다. 같은 기준으로 가중치를 매겨,{' '}
          <b>겹치지 않는 조합 중 총 증거가 가장 큰 조합</b>을 고릅니다.
        </p>
      </DocSection>

      <DocSection
        eyebrow="작은 언어"
        title="정규식 엔진이 없습니다"
        lede={
          <>
            “정규식을 피했다”가 아닙니다. 코어에는 외부 의존성이 <b>0개</b> 허용되므로, 정규식 엔진을 가질 방법 자체가
            없습니다. 대신 Tier 4의 네 부분 구조를 한 번 적어 두고, 모든 공급자 탐지기가 그것의 인스턴스입니다.
          </>
        }
      >
        <Grid cols={2}>
          <Card>
            <h3>얻는 것</h3>
            <p>
              백트래킹이 존재하지 않으므로, 악의적 입력 하나가 서버를 멈추는 고전적 공격이 살 곳이 없습니다 — 검토가
              아니라 <b>구조적으로</b>. 스캔당 한 번 계산하는 룩업 테이블이 적대적 입력에도 전체 패스를 선형으로
              유지합니다.
            </p>
          </Card>
          <Card>
            <h3>치르는 값</h3>
            <p>
              “접두사 다음에 제한된 런” 형태가 아닌 것은 전부 손으로 코드를 써야 합니다. 벤더 두 곳의 형식이 정확히
              그랬습니다.
            </p>
          </Card>
        </Grid>
        <h3 class="h3">{detectors.alphabets}개의 알파벳, 그리고 그 외에는 없음</h3>
        <Chips
          label="바이트 클래스"
          items={[
            'alnum',
            'alnum-dash',
            'alnum-dash-dot',
            'alnum-underscore',
            'upper-alnum',
            'lower-alnum',
            'digit',
            'hex',
            'hex-or-dash',
            'lower-hex',
            'base64-body',
          ]}
        />
      </DocSection>

      <DocSection
        eyebrow="직접 만드는 규칙"
        title="당신의 형식, 그들의 엔진"
        lede={[
          <StatusChip tone="success">출시됨 · Rust · JavaScript · Python · CLI</StatusChip>,
          <>
            회사마다 자기 키 형식이 있습니다. 탐지기를 추가하려면 Rust를 써야 했고, 그래서 다들 이 라이브러리 옆에 자기
            스캔을 하나 더 돌렸습니다 — 이 라이브러리가 막으려는 바로 그 분기입니다. 이제는 같은 네 부분 구조를
            평문으로 건네면 됩니다. 콜백이 아니라 <b>데이터</b>입니다.
          </>,
        ]}
      >
        <RichCode label="룰셋 예시">{ruleset}</RichCode>
        <Grid cols={2}>
          <Card>
            <h3>콜백은 거부됩니다</h3>
            <p>
              당신의 코드가 모든 후보에 대해 실행됩니다. 판단하려면 평문이 필요하므로 <b>평문이 경계를 넘고</b>,
              Node·브라우저·Python이 각각 다른 답을 낼 수 있습니다.
            </p>
          </Card>
          <Card>
            <h3>룰셋이 출시된 이유</h3>
            <p>
              당신의 문법이 앞에서 <b>한 번</b> 경계를 넘습니다. 매칭은 Rust 코어가 이미 가진 엔진으로 직접 합니다.
              실행할 것이 없으니 텍스트를 가로챌 것도 없습니다.
            </p>
          </Card>
        </Grid>
        <RuleRows
          rows={[
            {
              term: '등급 상한',
              body: (
                <>
                  룰은 <b>entropy</b> 또는 <b>contextual</b>만 주장할 수 있습니다. 상위 세 등급은 내장 전용이라, 당신의
                  룰은 결과를 더할 수는 있어도 <b>뒤집을 수는 없습니다</b>.
                </>
              ),
            },
            { term: '검증기', body: '닫힌 목록에서 이름으로 고릅니다. 함수도, 표현식도, 당신이 쓴 본문도 아닙니다.' },
            { term: '확신', body: '언제나 medium. 올릴 수 있는 필드가 없습니다.' },
            {
              term: '크기',
              body: (
                <>
                  UTF-8 64 KiB, 앞에서 한 번 파싱. <b>닫히는 쪽으로 실패합니다</b> — 한 줄이 잘못되면 파일 전체가
                  거부됩니다.
                </>
              ),
            },
          ]}
        />
      </DocSection>

      <DocSection
        eyebrow="개인정보"
        title="여섯 번째 대상, 따로 떼어서"
        lede={
          <>
            개인정보가 다섯 등급 <em>옆에</em> 자기 도메인을 갖습니다 — 이메일, IBAN, 결제카드, 전화, 네트워크 주소,
            미국 SSN. <b>모든 표면에서 옵트인이고 기본 비활성</b>이며, 활성화는 명시적이어야 합니다.
          </>
        }
      >
        <Grid cols={3}>
          <Card>
            <h3>Luhn</h3>
            <p>결제카드는 카드 업계가 이미 쓰는 체크섬으로 검증합니다 — 이름과 버전이 붙은 검증기로.</p>
          </Card>
          <Card>
            <h3>IBAN mod-97</h3>
            <p>계좌번호는 형태만이 아니라 ISO 나머지 검사로 확인합니다.</p>
          </Card>
          <Card>
            <h3>SSN 할당</h3>
            <p>미국 기관이 공개하는 구조적 제외 규칙만 씁니다. 발급 조회도, 신원 조회도 하지 않습니다.</p>
          </Card>
        </Grid>
        <p>
          이 셋이 엔진 최초의 <em>산술</em> 검사입니다. 그전까지 코어 전체의 유일한 수치 검사는 한 공급자 키의 CRC-32
          하나였습니다.
        </p>
        <Note tone="danger">
          <p>
            <b>
              모든 PII 계열이 <StatusChip tone="none">Pending</StatusChip>입니다.
            </b>{' '}
            사용 가능함은 지원 주장이 아닙니다. 정확한 아티팩트 기준 벤치마크 증거가 검토될 때까지 pending으로 남으며,{' '}
            <b>탐지된 것도 놓친 것도 아직 신뢰하지 마십시오.</b>
          </p>
        </Note>
      </DocSection>

      <SourceStrip label="출처.">
        등급 사다리와 결정 규칙은 <code>types.rs</code>·<code>pipeline.rs</code>, 네 부분 구조는{' '}
        <code>detectors/pattern.rs</code>, 이름 목록·임계값·제외는 <code>detectors/generic_token.rs</code>, 룰셋 문법은{' '}
        <code>ruleset.rs</code>와 <code>docs/guides/rulesets.md</code>, PII 계열은 <code>pii/</code>와{' '}
        <code>structured_validators.rs</code>. 여기 등장하는 모든 자격 증명 표기는 <b>형식이지 값이 아닙니다</b>.
      </SourceStrip>
    </>
  );
}
