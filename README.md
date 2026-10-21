## v30 — combat motion and effects rewrite

- `combat-fx.js` is the shared battle/studio renderer: coherent flame tongues, branching electric trails, foamy surf, rotating energy-ball leaves, smaller projectiles and particles. The studio no longer draws duplicate effect layers.
- Basic attacks prepare for 120 ms before releasing from the current sprite landmark. Signature attacks have explicit preparation and release phases. Channelled attacks retain their firing stance and recovery.
- Player and rival movement use time-based acceleration/braking and distance-based walking animation. Casting slows locomotion; dodge velocity eases through its duration.
- Sprite rendering and emission points share `spritePose`, including the same centre-of-cell rotation pivot. Saved PMD variants and anatomical landmarks are preserved.
- Flame and surf collision widths now follow the new visible shapes. Damage, move selection and the four-character roster remain unchanged.
- Validation: `node tests/smoke.cjs` covers anatomy, preparation/release, sustained fire, 30/60/120 Hz locomotion and canvas state balance in both quality modes.
- Reference: the user-supplied 122-second trailer MP4 was inspected with frame sequences. The Charizard/Blastoise duel informed rolling flame lobes, twin bright cannon jets, impact sparks/steam and compact comet projectiles. The small-step attack/recovery animation and stationary ground shadows informed the motion changes. Existing playable moves are retained; trailer-only characters, beam-clash gameplay and arenas are outside this change.

# Pokémon Arena — Four Moves & Motion Studio (v30)

비상업용 팬 프로젝트입니다. Pokémon 및 관련 캐릭터의 권리는 각 원저작자에게 있습니다.

## 원본 게임플레이 참고 영상 추가 방법

사용자가 제공한 Big Kid Nation의 Pokémon Arena 2D 참고 MP4는 약 74.4MB이므로 GitHub 웹의 일반 파일 업로드 제한(25MiB)을 초과합니다. 파일을 변환하거나 분할하지 않고 Git 명령줄로 원본 그대로 업로드합니다.

**목표 경로:** `assets/reference-video/Pokemon_Arena_2D_Big_Kid_Nation_Original.mp4`

**원본 확인값:** 74,415,401바이트 / SHA-256 `a261c86ff3c7b57fd8c5b1bd8baab201ccb95a17cab82d315dbd089cd57ccafd`

로컬 저장소에서 다음 명령을 실행하세요.

```bash
git switch main
git pull --ff-only
bash scripts/upload-reference-video.sh "/path/to/Pokemon Arena 2D by Big Kid Nation (Fan Game, 95% real gameplay)(2).mp4"
```

스크립트는 업로드 전 SHA-256을 검사하고 지정 경로로 원본을 복사해 `main` 브랜치에 커밋 후 푸시합니다. **스크립트만 저장소에 추가한 상태에서는 영상 파일이 자동으로 업로드되지 않습니다.** 파일을 업로드하려면 원본 MP4가 있는 컴퓨터에서 위 명령을 실행해야 합니다.

## 기술 스프라이트 스튜디오

`studio.html`에서 화염방사 · 10만볼트 · 파도타기 · 에너지볼의 PMD `Shoot` 프레임과 발사점을 다듬을 수 있다. 포켓몬·기술·방향을 고르고, 오른쪽 확대 프레임을 클릭하거나 화살표 키로 1px씩 보정한다. 보정값은 브라우저에 저장되며 JSON으로 복사할 수 있다. 아레나 메뉴의 링크에서도 들어간다.

## 플레이 규칙

각 포켓몬은 **기본 공격 하나 + 해당 포켓몬 고유 기술 하나**만 사용합니다. 기존 추가 기술은 삭제하지 않고 `EXTRA_SKILLS_ENABLED=false`로 비활성화했습니다. 플레이어 키보드/터치, 상대 AI 모두 같은 규칙을 따릅니다. 회피는 기술이 아닌 이동 액션으로 유지합니다.

| 포켓몬 | 기본 공격 | 고유 기술 |
| --- | --- | --- |
| 라이츄 | 전기쇼크 | 10만볼트 |
| 리자몽 | 불꽃세례 | 화염방사 |
| 거북왕 | 물대포 | 파도타기 |
| 이상해꽃 | 나뭇잎 | 에너지볼 |

**키보드**: WASD/방향키 이동, 1 기본 공격, 2 고유 기술, Space 또는 5 회피, P 일시정지. 추가 기술에 사용하던 3, 4는 비활성화됩니다. 모바일에서는 화면상의 기본/고유 기술 버튼으로 공격합니다. 화염방사는 누르고 있는 동안 방출하며 자원을 소모합니다.

## 모션 · 이펙트 스튜디오

메인 화면의 **🎞 캐릭터 모션 · 4종 기술 테스트**를 누릅니다.

- 네 포켓몬 전부 선택 가능
- 대기(Idle), 이동(Walk), 몸통 공격·돌진(Attack), 원거리 공격·발사(Shoot), 기 모으기(Charge), 피격(Hurt) 모션 직접 선택
- 남쪽부터 8개 방향(대각선 포함) 지정
- 기본 공격, 고유 기술 또는 별도의 **돌진 동작 시험** 미리보기
- 애니메이션 속도 0.25–2.00배
- **8방향 동시 비교**: 한 포켓몬의 동일 모션을 8방향으로 동시에 표시하여 서로 다른 프레임과 방향을 빠르게 비교
- **전체 자동 순회**: 4종 × 6개 모션 × 8방향 = 192개 조합 자동 검사 화면 재생
- **원본 프레임 검사**: 외부 PMDCollab 리소스의 실제 액션 시트 존재/방향 수 확인. 누락되면 대체 모션을 사용하며 검사 화면에 부족한 목록 표시
- **발사 좌표 표시 ON/OFF**: 8방향 스프라이트 위에 현재 애니메이션 프레임의 입·몸체·캐논 픽셀 좌표 마커 표시
- **프레임 고정 + 프레임 슬라이더**: 원본 `Shoot`의 개별 프레임을 고정하고 해당 프레임 발사점 확인
- **좌표 보정**: 포트 선택 후 방향키 버튼으로 현재 프레임의 발사점을 1px씩 보정. 같은 브라우저에 저장되며 JSON 복사 가능
- **돌아가기**로 기존 메뉴/일시정지 상태 복귀

### PMD 원본 애니메이션 의미 (v24)

PMDCollab 원본 시트를 직접 비교하여 `Shoot`(전기를 방출하거나 물을 발사하는 원거리 공격), `Attack`(몸을 내밀어 치는 근접·돌진), `Charge`(기 모으기)를 구분했습니다. 10만볼트·화염방사·에너지볼·파도타기 및 기본 공격은 원거리 발사 `Shoot`를 사용합니다. 회피 돌진도 `Walk`에서 `Attack`로 변경했습니다. `Hurt`는 피격 시 적용하고 종료되면 원래 동작으로 복귀합니다.

현재는 PMDCollab 8방향 스프라이트를 우선 로드합니다. 원본에 액션 시트가 없거나 서버 연결에 실패하면 기존 대체 이미지가 표시됩니다. 전부 로드됐다고 보장하지 않으므로 스튜디오의 **원본 프레임 검사**로 직접 확인해 주세요.

## 입 위치 점 표시와 리자몽 프레임별 좌표 재확인 (v28)

원래 모션 스튜디오의 큰 고리, 발사점 좌표 라벨은 **작은 픽셀 점(2–3px)** 하나로 교체했습니다. 정확히 저장된 스프라이트를 쓰면 청록색, 다른 스프라이트 버전의 대체 포인트면 노란색으로 표시됩니다.

PMDCollab 원본 리자몽 `0006/0005/Shoot-Anim.png`를 4배 확대해 8방향과 주요 프레임(0·3·6·8·11·13·17)을 다시 살폈습니다. 이전에는 불길 유지 프레임에서 점이 입 아래 또는 몸체 옆에 찍힌 방향이 있어 주둥이 끝 쪽으로 다시 보정했습니다. 발사 중에는 실제로 보이는 `Shoot` 프레임 번호에 해당하는 저장 좌표를 사용하고, `flamethrower` 이펙트 시작점도 **같은 프레임의 입 점 위치**를 참조합니다.

`tests/preview_mouth.py`는 필요할 때 원본 PNG 확대 비교 이미지를 생성하는 진단 스크립트입니다. 프레임 사이 좌표는 수작업 키프레임을 보간한 추정치가 포함되어 있으며, PNG 불투명 픽셀 근접 검사만으로 입의 해부학적 정확성까지 보장하지는 않습니다. 모션 스튜디오의 프레임 고정/1px 조절로 추가 보정이 가능합니다.

## 화염방사 연속 발사 모션 (v25)

리자몽의 PMD `Shoot`는 단발 모션이며 중간 `HitFrame`(variant `0006/0005`에서 8번)이 **머리를 뒤로 젖히는 자세**입니다. 이 프레임을 그대로 고정하면 피격(`Hurt`) 모션처럼 보이는 오류가 있었습니다. v25에서는 발사 준비를 한 번 재생한 뒤, `HitFrame` 부근의 젖히는 구간을 건너뛰고 **`ReturnFrame` 이후 앞을 향한 발사 자세(해당 시트에서 13번 프레임)**를 유지합니다. 버튼을 떼거나 연료가 소진되면 약 0.22초에 걸쳐 복귀합니다. 원본 버전별 프레임 수와 XML 타이밍을 참조하여 선택합니다. 상대 AI의 지속 화염방사에도 같은 규칙을 적용합니다.

모션 스튜디오의 **고유 기술** 미리보기에서도 리자몽의 발사 포즈 유지와 복귀가 재현됩니다. 프레임 데이터가 없는 경우에는 기본 시간을 사용합니다. GitHub 자동 테스트는 2초 이상 유지해도 애니메이션이 루프되지 않는지, 피격처럼 보이는 `HitFrame`에 머무르지 않는지, 입력 해제 직후 복귀하는지 검사합니다.

## 프레임별 발사점 — PMD 스프라이트 좌표 (v27)

`emitter-anchors.js`는 원본 PMD `Shoot-Anim.png`의 **프레임 내부 픽셀 좌표**를 8방향 × 모든 원본 `Shoot` 프레임에 대해 저장합니다. v26의 8방향별 고정 좌표와 달리 v27은 현재 렌더링되는 프레임 번호에 맞춰 입·몸·캐논 포인트를 변경합니다. 저장된 `cell` 값과 원본 이미지 크기, 애니메이션 프레임, 땅에 닿는 발 위치 및 게임 배율을 사용해 실제 월드 좌표로 변환합니다. 기본 공격과 고유 기술 모두 해당 포트에서 생성됩니다.

| 포켓몬 | 발사점 | 기술 구현 |
|---|---|---|
| 라이츄 | 몸통(body) | 전기쇼크는 몸체 기준 발사, 10만볼트는 **몸을 감싼 노란 전기 고리·번개**와 몸체에서 시작하는 공격 |
| 리자몽 | 입(mouth) | 불꽃세례와 화염방사가 입에서 시작하며, 화염방사 중 원거리 발사 모션 유지 |
| 거북왕 | 좌·우 캐논(cannonLeft, cannonRight) | 물대포는 양쪽 캐논을 번갈아 사용, 파도타기는 양쪽 캐논 물줄기에서 큰 파도로 이어짐 |
| 이상해꽃 | 입(mouth) | 나뭇잎 및 에너지볼이 입 위치에서 시작 |

파도타기를 포함해 **고유 원거리 기술이 활성화된 동안에는 `Shoot` 애니메이션**을 사용합니다. 다만 실제 피해를 받으면 `Hurt`, 회피 돌진 중에는 `Attack`이 우선됩니다. 기존 근접·회피 로직은 유지됩니다.

*좌표 정밀도:* 좌표는 원본 스프라이트를 참고한 수작업 지정·프레임 사이 보간 추정치를 포함합니다. GitHub Actions의 `tests/audit_emission_pixels.py`는 저장된 각 포인트가 실제 원본 PNG의 불투명 픽셀과 9px 이내인지 검사하며 최신 검사에서 이 범위를 벗어난 좌표가 0개였습니다. 이 검사는 포인트가 반드시 **입이나 포신의 해부학적 정확한 지점**이라는 의미가 아닙니다. 필요한 프레임은 모션 스튜디오에서 직접 1px씩 보정하세요. 보정값은 브라우저 로컬 저장소에 저장되며 JSON 복사로 추출할 수 있습니다. 원본과 다른 스프라이트 변형을 불러온 경우 정확히 측정한 테이블은 사용하지 않고 방향별 대체 포인트를 사용합니다.

## 발사점 및 기술 도트 크기 조정 (v29)

- 입 발사점: 리자몽·이상해꽃의 8방향 × 프레임별 원본 입 픽셀 좌표에서 **공격 방향으로 3개 원본 스프라이트 픽셀** 전진한 곳에서 생성
- 캐논 발사점: 거북왕의 각 캐논에서 **2개 원본 픽셀** 전진한 곳에서 생성
- 라이츄의 몸통 발사점: 변경 없이 몸 중심 유지
- 입·캐논의 원래 측정값은 바꾸지 않고, 월드 렌더 좌표에만 방향별 전진 오프셋을 적용합니다. 모션 스튜디오의 작은 점은 실제 발사 시작 지점을 표시합니다.
- **크기 축소:** 에너지볼·파도타기와 에너지볼 폭발은 포켓몬의 원본 `Shoot` 셀 너비 × 화면 스프라이트 배율(1.43)을 기준으로 축소합니다. 화염방사·10만볼트는 진행 거리와 경로를 보존하고 **폭만 축소**합니다. 라이츄 방전 고리와 거북왕 캐논 물줄기 두께도 축소했습니다.
- 이 변경은 **시각적 렌더링만** 조정합니다. 기술의 대미지·적중 판정·공격 사거리·투사체 속도는 변경하지 않습니다.

## 4개 기술의 강화 픽셀 이펙트

`battle-studio.js`가 기존 특수 기술 연출 위에 추가 레이어를 그립니다.

- **10만볼트**: 다중 분기 번개, 3단계 색상 코어, 짧은 스파크 잔광
- **화염방사**: 다층 화염 흐름, 내부 고온 코어, 픽셀 불꽃 및 불티
- **파도타기**: 파도 전면의 포말, 물방울 잔상, 청록색 수면 픽셀
- **에너지볼**: 회전하는 에너지 입자, 궤적 잔광, 방사형 충격 파편

고화질/절전 토글에 따라 장식 입자 수가 달라집니다. 직접 제작한 절차적 픽셀 이펙트이며, 공식 게임 영상이나 YouTube의 프레임을 복사한 자산은 아닙니다.

## 파일 구조

- `index.html`: 게임, 캐릭터, 전투·AI, 스프라이트-좌표 변환, 기본 이펙트
- `studio.html` / `move-studio.js`: 기술 스프라이트·발사점 다듬기 전용 공간
- `emitter-anchors.js`: 포켓몬별 입·몸·캐논의 8방향 × `Shoot` 프레임별 원본 픽셀 발사 좌표 데이터
- `battle-studio.js`: 인게임 모션 테스트, PMD 프레임 진단, 고유 기술의 추가 이펙트 레이어

GitHub Pages 등 정적 호스팅에서 `index.html` 또는 `studio.html`을 열면 됩니다. 스프라이트는 외부 호스트를 사용하므로 네트워크 연결이 필요합니다.

## 자동 회귀 테스트

`node tests/smoke.cjs`를 저장소 루트에서 실행합니다. Node.js 22를 권장하며 별도 npm 패키지는 필요하지 않습니다. GitHub Actions의 `.github/workflows/smoke.yml`은 `main` 푸시와 PR에서 이 검사를 수행합니다.

테스트 항목: 4개 포켓몬 선택, 8방향 행 매핑, 6종 모션 이미지 셀 검사, 기본·고유·돌진 미리보기, 8방향 동시 보기, 기존 기술 슬롯 비활성화, 스튜디오 진입·복귀, 전투 시작, 4종 고유기 시전, 방향별·프레임별 발사 지점 수와 유효성, 몸·입·양쪽 캐논으로부터의 실제 발사 좌표, 공격 중 `Shoot` 연출 매핑, 피격 모션 타이머 종료 및 캔버스 렌더 호출. 그래픽과 이미지 로딩은 모의 환경으로 수행하므로 이 테스트만으로 실기기 화질이나 FPS를 보증하지 않습니다.

## 테스트 범위

GitHub에 반영된 본 변경은 JS 구문 검사 및 소스 정적 검사(플레이어 추가 스킬 차단, 상대 AI 추가 스킬 차단, 2개 스킬 표시, 4가지 특수기, 4종/8방향/6모션 구성)를 통과했습니다. 실제 iOS Safari/Android/PC 브라우저 프레임 성능 및 스프라이트 서버의 로딩 성공은 실행 환경에 따라 달라지며, 실기기 검증이 별도로 필요합니다.
