import {
  Card,
  Claim,
  DocSection,
  Flow,
  FlowArrow,
  FlowNode,
  GateList,
  Grid,
  Note,
  PackageTile,
  PageHead,
  RuleRows,
  SourceStrip,
} from '../../../components/architecture';
import { PlaceholderChip, StatusChip } from '../../../components/ui';
import type { Locale } from '../../../i18n';
import { evidence, slots, statusOf, type PackageSlot, type PackageStatus } from '../../../slots';

const statusLabels: Record<PackageStatus, string> = { released: '출시됨', alpha: 'Alpha', unpublished: '미게시' };
const registryNames: Record<PackageSlot['registry'], string> = { npm: 'npm', pypi: 'PyPI', crates: 'crates.io' };

function meta(slot: PackageSlot) {
  if (slot.unpublished) return typeof slot.unpublished === 'string' ? slot.unpublished : undefined;
  return [registryNames[slot.registry], slot.version].filter(Boolean).join(' · ');
}

export function Vault(_props: { locale: Locale }) {
  const p = slots.packages;
  const vault = p.vault;
  const tile = (key: string) => ({
    name: p[key].name,
    status: statusOf(p[key]),
    statusLabel: statusLabels[statusOf(p[key])],
    meta: meta(p[key]),
  });

  return (
    <>
      <PageHead
        eyebrow="06 · 볼트"
        title="코어는 원본을 버립니다. 가끔은 그것이 다시 필요합니다."
        lede={
          <>
            여기가 원본을 보관해도 되는 <b>유일한 곳</b>이고, 그 보관을 어렵게 만들도록 설계되어 있습니다.
          </>
        }
      />

      <DocSection eyebrow="긴장" title="서로 모순되는 두 개의 좋은 규칙">
        <Grid cols={2}>
          <Card>
            <h3>코어의 약속</h3>
            <p>
              매치된 <b>평문을 절대 저장하지 않고</b> 탐지하고 치환합니다. 탐지 결과는 종류와 범위뿐입니다.{' '}
              <b>아무것도 보관하지 않았으므로 훔칠 것도 없습니다.</b>
            </p>
          </Card>
          <Card>
            <h3>실제 요구</h3>
            <p>
              에이전트가 고객의 카드번호를 가리고, 답을 받고, 이제 실제 주문을 넣어야 합니다.{' '}
              <b>어딘가에서 무언가가 값을 되돌려 놓아야 합니다.</b>
            </p>
          </Card>
        </Grid>
        <Note tone="danger">
          <p>
            <b>해법은 별도 저장소입니다.</b> 코어만 설치하거나 사용하는 것이 복구 가능한 매핑을 만들어서는 절대 안
            됩니다. 이것은 <b>의도적으로 손을 뻗어야</b> 닿고, 손을 뻗는 순간 당신의 보안 모델이 바뀝니다.
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow="형태" title="영수증과 함께 가리기">
        <Flow>
          <FlowNode title="신뢰된 런타임 안의 원본 텍스트">
            볼트는 <b>제한된 범위와 수명</b>으로 명시적으로 열립니다.
          </FlowNode>
          <FlowArrow>코어가 당신의 정책 아래 스캔합니다</FlowArrow>
          <FlowNode title="정리된 텍스트와 토큰">
            <PlaceholderChip>{'<rsv_…>'}</PlaceholderChip> — 128비트 난수, 볼트 하나와 캡처 하나에 묶입니다.{' '}
            <b>원본은 신뢰된 쪽 메모리에 남습니다.</b>
          </FlowNode>
          <FlowArrow>경계를 넘는 것은 정리된 텍스트뿐입니다</FlowArrow>
          <FlowNode title="모델, 로그, 제3자">
            그들은 토큰을 봅니다. <b>토큰은 값이 아니고 값이 될 수도 없습니다.</b>
          </FlowNode>
          <FlowArrow>나중에, 인가된 복구</FlowArrow>
          <Claim sub="그리고 다른 어디로도 가지 않습니다.">승인된 값이, 승인된 목적지로</Claim>
        </Flow>
      </DocSection>

      <DocSection
        eyebrow="중심 규칙"
        title="토큰만으로는 아무 권한도 없습니다"
        lede={
          <>
            설계 전체가 이 생각 위에서 돕니다. <b>영수증을 들고 있다는 것이 수령 권한은 아닙니다.</b> 복구 시점에 서버
            연동이 누가 왜 요청하는지를 <b>신뢰된 런타임 문맥에서</b> 해석하며, 모델이 말한 무언가에서 해석하지
            않습니다.
          </>
        }
      >
        <GateList
          gates={[
            { title: '주체.', body: '어떤 인증된 신원이 요청하는가.' },
            { title: '테넌트.', body: '테넌트를 넘는 조회는 실패합니다.' },
            { title: '출처.', body: '캡처가 어디에서 왔는가.' },
            { title: '싱크와 정확한 경로.', body: '어떤 목적지의, 그 안의 어떤 구조적 필드인가.' },
            { title: '목적.', body: '무엇을 위한 것인지, 애플리케이션이 선언합니다.' },
            { title: '생존.', body: '만료, 폐기, 사용 예산, 그리고 정확히 발급된 토큰들.' },
          ]}
        />
        <Note tone="danger">
          <p>
            <b>전부 아니면 전무.</b> 연산 전체가 여섯 검사에 대해 한꺼번에 사전 검증됩니다.{' '}
            <b>하나만 위반해도 연산 전체가 거부되고</b>, 부분 평문도 반환되지 않고 예산도 소모되지 않습니다.
          </p>
        </Note>
      </DocSection>

      <DocSection
        eyebrow="일부러 막은 함정"
        title="보이는 라벨은 열쇠가 아닙니다"
        lede={
          <>
            코어는 안전한 메타데이터로 타입 있는 자리표시자를 만들 수 있고(<code>&lt;JWT_1&gt;</code>), PII 타입도
            포함합니다(<code>&lt;PII_JURISDICTION_US_SSN_1&gt;</code>). 그런 라벨을 <b>값이 보관되었다는 증거</b>로
            여기고 싶어집니다.
          </>
        }
      >
        <Grid cols={2}>
          <Card>
            <h3>
              <StatusChip tone="none">아무 권한도 없음</StatusChip>
            </h3>
            <p>
              타입 있는 표시용 자리표시자 — 코어의 것이든 <code>&lt;SSN_1&gt;</code> 같은 애플리케이션 라벨이든.{' '}
              <b>형식에 관한 문제일 뿐</b>이며, 원본이 보관되었거나 복구 가능하다는 것을 함의하지 않습니다.
            </p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="success">기회를 줌</StatusChip>
            </h3>
            <p>
              발급된 볼트 토큰, <em>그리고</em> 싱크와 정확한 경로를 지정한 애플리케이션 승인.{' '}
              <b>복구는 표시용 자리표시자를 소유권 증거로 파싱하지 않습니다.</b>
            </p>
          </Card>
        </Grid>
        <p class="small">
          이것이 중요한 이유는 모델이 언제든 <code>&lt;SSN_1&gt;</code>을 자기 출력에 써 넣을 수 있기 때문입니다.{' '}
          <b>모델 출력, 도구 인자, 보이는 자리표시자 텍스트는 자기 자신의 복구를 인가할 수 없습니다.</b>
        </p>
      </DocSection>

      <DocSection eyebrow="무엇을 보관할 수 있나" title="전부는 절대 아닙니다">
        <RuleRows
          rows={[
            {
              term: '차단됨',
              body: (
                <>
                  코어의 <code>block</code> 판정, 즉 개인키 자료는 <b>절대</b> 복구 가능한 항목이 될 수 없습니다.
                  옵트인도 아니고 설정 가능하지도 않습니다.
                </>
              ),
            },
            {
              term: '그 외 판정',
              body: (
                <>
                  명시적인 적격성 결정을 요구합니다. 보관은 옵트인이며 <b>부수 효과가 아닙니다</b>.
                </>
              ),
            },
            {
              term: '개인정보',
              body: (
                <>
                  애플리케이션이 <em>정확한</em> 타입을 캡처의 허용 목록에 이름 지을 때만 보관됩니다(
                  <code>pii: {'{ retain: […] }'}</code>). 그 외 모든 PII 판정은{' '}
                  <b>복구할 수 없는 표시용 자리표시자</b>가 됩니다.
                </>
              ),
            },
          ]}
        />
        <Note tone="success">
          <p>
            <b>기본값의 방향을 보십시오.</b> 이름 짓지 않은 것은 전부 복구 불가입니다.{' '}
            <b>실수로 켜 둘 “전부 보관” 스위치가 존재하지 않습니다.</b>
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow="구성 요소" title="둘은 출시, 하나는 연구용, 하나는 종이 위">
        <Grid cols={2}>
          <PackageTile {...tile('vault')}>
            이식 가능한 부분 — 옵트인이고 제한된 인메모리 캡처와 토큰 수명주기. Node.js 20/22/24와 브라우저 메인
            스레드에서 자격을 얻었고, 전용 Worker 모드는 <em>따로</em> 자격을 얻습니다.{' '}
            <b>Worker 모드는 암묵적 업그레이드가 아니며</b>, 두 모드의 보장은 따로 문서화됩니다.
          </PackageTile>
          <PackageTile {...tile('vault-server')}>
            권한 계층 — 모든 복구에 대해 주체·테넌트·출처·싱크·경로·목적 검사를 수행하며, 위 패키지 위에 인메모리
            백엔드를 얹습니다. Node.js 20/22/24에서 시험됩니다.
          </PackageTile>
          <PackageTile {...tile('vault-py')} name={`${p['vault-py'].name} (Python)`}>
            연구 등급. 이식 가능한 볼트 API가 아니라 같은 <em>서버 권한</em> 계약의 네이티브 Python 구현입니다.
            문서화된 Node.js 서비스 경계를 통해 진짜 코어를 상대로 공유 적합성 코퍼스를 통과합니다.
          </PackageTile>
          <PackageTile name="@redact-secret/store-*" status="contract" statusLabel="계약만 존재">
            영속 백엔드. 서면 계약은 있고 구현은 없습니다. <b>영속성은 저장 방식의 선택이지 세 번째 신뢰 환경이
            아닙니다.</b>
          </PackageTile>
        </Grid>
        <p class="small">
          npm 이름이 이것을 JavaScript 전용으로 만들지 않습니다. 서버 보안 계약은 언어 중립이며, Python·Rust·Go는
          각자 네이티브 배포판이나 따로 자격을 얻은 서비스 경계가 필요합니다.
        </p>
      </DocSection>

      <DocSection eyebrow="정직하게" title="alpha라고 적혀 있고, 그 말 그대로입니다">
        <Note tone="warning" title="저장소가 스스로 밝힌 한계">
          <ul>
            <li>
              <b>영속성 없음.</b> 인메모리 전용. 영속 저장 계약은 쓰였고 구현한 것은 없습니다.
            </li>
            <li>
              <b>스트리밍 없음.</b> 전체 입력 캡처와 구조적 필드 복구만.
            </li>
            <li>
              <b>브라우저 메모리는 페이지의 신뢰 경계입니다.</b> 브라우저 볼트는 최종 표시용입니다. 다중 사용자 서버
              인가를 강제할 수 없고, <b>그런 척해서도 안 됩니다.</b>
            </li>
            <li>
              <b>요청에 따라 메모리를 지울 수 없습니다.</b> 관리형 런타임의 문자열이 모든 사본에서 지워졌다고 보장할
              수 있는 라이브러리는 없습니다. 저장소가 <b>돌려 말하지 않고 그렇게 적고 있습니다.</b>
            </li>
            <li>
              <b>자격을 얻지 않은 환경:</b> 엣지 런타임, SharedWorker, Service Worker, Node.js{' '}
              <code>worker_threads</code>.
            </li>
          </ul>
        </Note>
        {vault.latest && vault.latest !== vault.version && (
          <Note tone="danger" title="실제 설치 함정">
            <p>
              npm의 <code>latest</code> 태그가 <code>{vault.name}</code>의 <code>{vault.latest}</code>를 가리키는데,
              그것은 이전 코어 베타를 고정하고 <b>코어 {slots.core.npm} 버전과 충돌합니다.</b> <code>{vault.tag}</code>{' '}
              태그가 가리키는 <code>{vault.version}</code>이 맞는 쪽이며, 코어{' '}
              <code>{vault.peers?.['@redact-secret/core']}</code>를 고정합니다.{' '}
              <b>dist-tag 대신 정확한 버전을 설치하십시오.</b>
            </p>
          </Note>
        )}
      </DocSection>

      <SourceStrip label="출처.">
        <code>{evidence.sources.vault.repo.split('/')[1]}</code>
        {evidence.sources.vault.commit && (
          <>
            {' '}
            <code>{evidence.sources.vault.commit}</code>
          </>
        )}
        의 <code>README.md</code>·<code>ARCHITECTURE.md</code>와 <code>docs/decisions/</code>. 게시된 버전과
        dist-tag는 {slots.observedAt}에 npm 레지스트리에서 읽었습니다. 이 저장소는 이전에{' '}
        <code>redact-secret-reversible</code>이라는 이름이었고, 정확한 API 시그니처·TTL 기본값·토큰 문법·저장
        구현·출시일은 모두 아직 열려 있다고 기술됩니다.
      </SourceStrip>
    </>
  );
}
