## v34 — Battlegrounds still reference

- Skill effects are stamped again from scratch, using the Big Kid Nation gameplay MP4 on `main` (`YTDown.com_YouTube_..._003_480p.mp4`) as the silhouette reference. Every mark is one character sprite pixel (`PIXEL`, 1.43 world units in battle, the studio sprite scale in the motion studio). A larger shape is more pixels, not a bigger pixel.
- Flamethrower is a dense mass of overlapping bulbs with crescent highlights, not a single row of circles. Thunderbolt is a thick jagged bolt. Surf is a solid foamy wave, and the cannon jet is a wide white-core stream. Energy Ball is a large green bulb with leaf pixels. Basic fire is a small teardrop with a dotted tail.
- The later-request brief is in `.cursor/rules/dot-pixel-effects.mdc`. Keywords: 도트, 1픽셀, 스프라이트 픽셀, 겹치는 원형 불덩이, 흰 코어, 포말, 잎.
- Character motion stays axis-aligned. The extra squash, tilt, and foot bob are gone, so the feet stay on a pixel shadow. Walk cycles advance with distance. A dodge plays through the Attack sheet instead of a short aborted windup plus a smeared afterimage.

## v30 — combat motion and effects rewrite

- `combat-fx.js` is the shared battle/studio renderer: coherent flame tongues, branching electric trails, foamy surf, rotating energy-ball leaves, smaller projectiles and particles. The studio no longer draws duplicate effect layers.
- Basic attacks prepare for 120 ms before releasing from the current sprite landmark. Signature attacks have explicit preparation and release phases. Channelled attacks retain their firing stance and recovery.
- Player and rival movement use time-based acceleration/braking and distance-based walking animation. Casting slows locomotion; dodge velocity eases through its duration.
- Sprite rendering and emission points share `spritePose`. Saved PMD variants and anatomical landmarks are preserved. v31 drops the extra rotation and non-uniform scale so sprite pixels stay square.
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


## 고유 기술 도트 그래픽 (v35)

공유 `combat-fx.js`에서 파도타기는 휘어진 수면과 말리는 흰 포말, 10만볼트는 흰 코어와 꺾이는 가지 번개, 화염방사는 입에서 넓어지는 연속 불꽃과 불티, 에너지볼은 회전 무늬가 있는 녹색 구체와 작은 잎으로 표현합니다. 애니메이션은 12–16Hz 단계로 갱신하며 캐릭터와 같은 픽셀 크기를 유지합니다. `studio.html`도 전투와 같은 렌더러를 사용하며 확대된 캐릭터 배율에 도트 크기를 맞춥니다. 피해량·쿨다운·판정 범위는 유지됩니다.


### 연출 비교 시안

기술 스튜디오의 **연출 시안** 버튼으로 네 가지 기술을 각각 세 가지 도트 모션으로 비교할 수 있다. 파도타기는 거북왕 바로 아래에 받쳐지는 물결 위 후류, 큰 말림 파도, 폭을 줄인 급류를 제안한다. 스튜디오와 전투 모두 파도를 포켓몬 뒤 레이어에 깔고 캐릭터가 그 위에 보이도록 그린다. 10만볼트는 굵은 직격, 촘촘한 갈래, 겹번개를 비교하고 화염방사는 이어지는 불길, 넓게 퍼지는 불길, 소용돌이형 불길을 비교한다. 에너지볼에는 잎 고리, 세 갈래 핵, 꽃잎 회오리를 둔다. 시안은 미리보기 전용이며 기본 전투 연출은 바꾸지 않는다.

형태 참고: Pokémon의 [Surf 전투 장면](https://www.sportskeeda.com/esports/the-best-moveset-lapras-pokemon-red-blue), [Thunderbolt 도트 애니메이션](https://wiki.otpokemon.com/index.php/TM24_-_Thunderbolt), [Flamethrower 게임 장면](https://archives.bulbagarden.net/wiki/File%3AFlamethrower_LA.png), [Energy Ball 장면](https://bulbapedia.bulbagarden.net/wiki/Energy_Ball_%28move%29). 구성과 픽셀은 이 프로젝트용으로 새로 그렸다.


### v39: 파도와 탑승자 합성 수정

파도 좌표를 확대 배율로 두 번 나누던 오류를 고쳤다. 스튜디오의 투명한 이미지 셀 아래쪽 대신 실제 불투명 픽셀의 발 위치를 기준으로 캐릭터를 배치한다. 파도의 높이와 탑승자의 높이를 공유하고, 뒤쪽 물결 → 캐릭터 → 발 앞의 포말 순서로 합성한다. 전투와 두 스튜디오에 같은 합성을 적용했다. 방향을 바꾸어도 파도의 높이는 화면 위쪽을 향하며, 말리는 앞부분·물결의 경사·후류를 별도로 그린다.

직접 확인한 참고 자료:
- 저장소의 `YTDown.com_YouTube_Media_J_JhLHfqZXY_Pokemon-Arena-2D-by-Big-Kid-Nation-Fan-Game-95-real-gameplay_003_480p.mp4`: 00:34–00:36의 입에서 넓어지는 둥근 화염 덩어리, 01:03–01:07의 물대포와 화염방사 충돌 장면. 이 영상에서 파도타기 탑승 장면은 확인하지 못했다.
- [Pokémon UNITE 공식 거북왕 기술 설명](https://unite.pokemon.com/en-au/news/blastoise-has-blasted-into-pokemon-unite/): 파도 위에 올라 함께 전진하는 Surf의 구성을 참고했다. 영상/공식 자산을 복사하지 않고 코드로 새 도트를 그렸다.

검증: 실제 Chromium에서 네 기술의 렌더링을 캡처했고, 스모크 테스트에 전투/확대 배율 3종 × 8방향의 파도 좌표 이동 회귀 검사를 추가했다. 모바일 실기기 검증은 포함하지 않는다.


### v40: 위에서 내려다본 파도와 연속 화염

파도는 낮은 높이와 넓은 수면 투영을 사용한다. 거북왕의 발 높이도 함께 낮추고, 앞쪽 포말과 뒤로 길게 흐르는 후류로 진행 방향을 표현한다. 화염방사는 구체를 겹치던 방식을 없애고, 외곽선 하나로 이어진 불길 안에 길게 흐르는 밝은 줄기와 갈라진 끝을 그린다. 네 기술의 Chromium 캡처에서 실행 오류가 없었고, 기존 스모크 및 8방향·3배율 좌표 검사를 통과했다.


### v41: Pokémon Champions 실제 기술 장면 참고

아래 영상의 실제 재생 프레임을 확인해 색과 형태를 도트로 재해석했다. 3D 자산이나 영상 프레임을 게임 자산으로 사용하지 않았다.

- [Surf (CJTAMBER)](https://www.youtube.com/watch?v=uJ5_MxQZ93w&t=4s), 약 00:04: 청록색 수면과 넓게 부서지는 흰 포말. 현재 게임에서는 요청된 내려다보기 구도와 거북왕 탑승을 유지한다.
- [All Fire Type Move Showcase (WeeGrind)](https://www.youtube.com/watch?v=QWTUo63h3yY&t=68s), 약 01:08–01:10, 화면의 Flamethrower 표기 확인: 입에서 좁게 시작하는 밝은 황색 불길과 뒤따르는 불티. 개별 구체 테두리를 추가하지 않고 연속 불길의 밝은 중심을 넓혔다.
- [All Electric Type Moves (Jeyknite)](https://www.youtube.com/watch?v=lx9hm1AdzWU&t=165s), 약 02:45–02:49, Thunderbolt 표기 확인: 시전자 주위 방전과 표적을 감싸는 각진 전기 가지. 몸 주변 방전을 끊어진 호로 바꾸고 끝점의 별 모양을 비대칭 가지 방전으로 교체했다.
- [All Grass Type Move Showcase (WeeGrind)](https://www.youtube.com/watch?v=dKuKdPppbBc&t=26s), 약 00:26–00:30, Energy Ball 표기 확인: 밝은 녹색 핵, 가느다란 에너지 줄기, 녹백색 명중 섬광. 기본 구체의 잎 장식을 에너지 줄기로 바꾸고 명중 중심부를 밝게 했다. 잎 시안은 선택지로 유지한다.

피해량·판정·쿨다운은 변경하지 않았다. 기술 스튜디오는 에너지볼과 10만볼트의 짧은 응축 단계를 보여준다.


### v42: 타입별 기본 공격

전기쇼크는 짧은 가지 번개, 불꽃세례는 황색 핵과 붉은 꼬리의 불씨, 물대포는 백청색 중심과 짧은 물꼬리, 나뭇잎은 잎맥이 있는 비대칭 잎으로 구분한다. 기본 탄은 최대 12×7 원본 픽셀의 두 프레임으로 그려 고유 기술보다 작게 유지하며 방향에 맞춰 회전한다. 스튜디오의 단색 사각형을 제거하고 전투와 같은 ArenaFX.projectile 렌더러를 사용한다. 시뮬레이션 pulse 속도를 환산해 약 12Hz로 애니메이션을 갱신한다. 피해량·속도·판정은 변경하지 않았다.

검증: 네 기본기를 실제 Chromium에서 확인했고 페이지 실행 오류가 없었다. JS 구문 검사, 기존 스모크 테스트 및 diff 검사를 통과했다.


### v43: 여덟 기술의 도트 디테일과 잔상 정리

기본기 4개와 고유기 4개를 함께 다듬었다. 기본 탄의 최대 본체는 14×9 원본 픽셀이고, 짧은 잔상까지 포함해 고유기보다 작게 유지한다. 전기쇼크는 가지 번개와 점 잔상, 불꽃세례는 어두운 외곽과 밝은 불씨 핵, 물대포는 흰 중심의 물 탄과 분리된 물방울, 나뭇잎은 잎맥과 비대칭 실루엣을 사용한다. 기본기에서 매 프레임 생성하던 무작위 입자는 제거하고 공유 렌더러의 정해진 짧은 꼬리로 교체했다. 추가 기술의 기존 입자는 유지한다.

화염방사는 구체를 다시 쌓지 않고 연속 불길의 외곽과 내부 명암을 보강했다. 10만볼트는 주 줄기와 가지의 밝기를 구분한다. 파도타기는 내려다보는 수면의 가장자리를 불규칙하게 다듬었으며, 에너지볼은 작은 밝은 핵·진한 하부·얇은 회전 띠를 사용한다. 발사점, 피해량, 속도, 판정, 쿨다운은 유지한다.

참고한 실제 영상 구간:
- 저장소 MP4: 00:12 전기 잔상, 00:32 불씨, 00:34–00:35 화염의 대비, 00:48 물 표현, 01:03–01:05 물대포의 밝은 중심.
- 요청 링크의 실제 대상 [RED vs CYNTHIA](https://www.youtube.com/watch?v=UGcfjUR-lIU): 초반 00:09–00:58 및 01:20–01:29, 01:50–01:59, 02:25–02:34 구간을 재생해 확인. 작고 선명한 탄과 윤곽, 02:25의 넓은 수면·흰 포말, Air Slash의 얇은 청백색 곡선 표현을 참고했다. 다른 기술의 색과 형태 언어를 참고한 것이며, 이 영상에서 요청한 여덟 기술 모두가 등장한다고 주장하지 않는다.
- 링크 표시문구의 별도 ID [Pokémon Apex Arena Trailer](https://www.youtube.com/watch?v=jDiTnib-mow): 00:03의 밝은 중심선, 00:15의 가지 방전, 00:24의 불꽃 장면을 확인했다. 게임의 부드러운 광원 효과는 가져오지 않고 동일 크기 도트로 재해석했다.

검증: 실제 Chromium에서 8개 기술, 파도 8방향과 전투 화면을 캡처해 확인했으며 페이지 오류 없음. 기본기 4종 × 8방향의 크기·발사 지연·애니메이션 회귀 검사를 추가했고 기존 스모크 테스트도 통과했다.


### v44: DS 시대의 도트 표현으로 재해석

[Pokémon Platinum - All Move Animations](https://www.youtube.com/watch?v=bjEHWRECvIA)의 실제 재생 화면을 참고해 색 단계와 도트 실루엣을 다시 정리했다. 원작 프레임을 추출해 게임 자산으로 쓰거나 원작 애니메이션을 그대로 복제한 것은 아니다. 실시간 전투의 진행 방향과 기존 요청에 맞게 재해석했다.

- 전기쇼크: 작고 각진 지그재그 본체. 10만볼트: 12Hz 방전과 표적 양쪽을 감싸며 교대로 끊기는 가지.
- 불꽃세례: 위로 갈라지는 불씨 실루엣. 화염방사: 황색 중심과 주황색 혀가 길게 흐르는 연속 불길. 구체의 연결 형태로 돌아가지 않는다.
- 물대포: 납작한 청백색 물 탄. 파도타기: 청색 수면 위를 이동하는 반복 물결과 흰 포말. 내려다보는 시점과 거북왕 탑승을 유지하며 대각선 수면의 빈 픽셀을 보정했다.
- 나뭇잎: 넓은 잎과 옆면 프레임을 교대로 사용. 에너지볼: 작은 밝은 핵, 단계적인 녹색 명암과 짧은 궤도 입자.

검증: Chromium에서 8개 기술, 파도 8방향 및 전투 화면 확인, 페이지 오류 없음. 기존 스모크 테스트, JavaScript 구문 검사와 diff 검사를 통과했다. 피해량·속도·쿨다운·판정은 변경하지 않았다.

확인한 주요 장면: 영상 약 17:11–17:17의 `Flamethrower` 표기와 좁게 출발해 커지는 주황·황색 불길, 약 49:32–49:35의 `Thunder` 표기와 황백색 지그재그 방전. Thunder 장면은 전기 계열의 표현 참고이며 Thunderbolt 장면으로 간주하지 않았다. 모든 8개 기술을 원작과 일대일로 복제한 변경은 아니다.


### v45: Black 2 / White 2의 개별 기술 장면 대조

참고 기준을 Platinum의 일부 장면에서 [HeroLinik의 White 2 녹화 영상](https://www.youtube.com/watch?v=bNW2L2DtPIg)으로 교체했다. 영상 설명의 “Recorded in White 2 using melonDS”를 확인했고, 아래 기술명과 실제 연속 프레임을 각각 대조했다.

- 전기쇼크: 1:04:33–1:04:36. 표적 위에서 내리는 한 줄의 가는 황색 번개.
- 10만볼트: 1:04:48–1:04:52. 여러 줄 낙뢰 → 밝은 방사형 명중 섬광 → 표적 주변 잔류 방전. 시전자에서 뻗는 가로 빔과 끝점의 괄호 모양을 제거했다.
- 불꽃세례: 17:02–17:04. 작은 황색 중심의 주황색 불씨와 표적 위 불꽃.
- 화염방사: 21:12–21:15. 붉은 외곽과 주황·황색 불길 덩어리가 겹치며 흐르고 표적에서 퍼진다. 단색 띠 대신 진행 방향으로 커지는 불꽃 입자를 사용한다.
- 물대포: 1:07:50–1:07:52. 청백색 중심의 짧은 물방울들이 이어지는 분사.
- 파도타기: 1:01:09–1:01:13. 넓은 청색 수면, 얕은 파도와 흰 포말. 기존 요청의 내려다보기·거북왕 탑승은 유지한다.
- 풀 기본기: 47:24–47:28의 Razor Leaf. BW2에는 Leafage가 없으므로 기존 UI의 나뭇잎은 잎날가르기의 여러 잎·비행·명중 표현을 사용한다.
- 에너지볼: 17:22–17:25. 녹색 응축 → 고리가 회전하는 반투명 구체 → 여러 녹색 구체 고리로 분산. 불투명한 녹색 공과 일반 흰 폭발을 교체했다.

영상 프레임을 게임 자산으로 복사하지 않고 셀 렌더러로 다시 그렸다. 원작의 고정 카메라·턴제 연출을 실시간 전투에 적용하므로 영상과 픽셀 단위로 동일한 복제본은 아니다. 이동형 공격 판정·피해량·속도·쿨다운은 유지하고 시각적 시간 흐름은 게임의 기술 수명에 맞춘다. 기본기와 에너지볼의 스튜디오 미리보기에도 명중 단계를 표시한다.

검증: 기존 스모크 및 8방향·배율 검사, 낙뢰가 표적 위치에서 화면 수직으로 유지되는 회귀 검사, Chromium의 8개 기술·8방향 파도·전투 화면과 명중 단계 확인.


### v46: 원작 비교와 표면 디테일 정리

화염 입자의 밝은 영역을 비대칭으로 분리하고 외곽에 반투명 도트 한 겹을 사용해 반복되는 동심원 느낌을 줄였다. 파도 수면에는 물결 사이를 연결하는 짧은 포말을 추가했다. 같은 크기의 픽셀과 nearest-neighbor 렌더링을 유지한다.

스튜디오의 오래된 3개 시안 선택은 현재 구현과 맞지 않아 BW2 원작 기준으로 정리했다. 기본기/고유기 선택에 따라 해당 기술의 실제 영상 타임스탬프 링크를 표시한다. 풀 기본기는 잎날가르기 기준임을 화면에도 명시한다.


### v47: 몸에서 발사하는 10만볼트

사용자 요청에 따라 10만볼트는 원작의 수직 낙뢰 대신 라이츄 몸 주변의 방전에서 공격 방향으로 이어지는 번개로 변경했다. 실제 전투에서는 매 프레임 현재 몸 발사점을 사용하고, 유도 경로의 오래된 점이 제거되어도 몸과 끝점 사이의 번개를 연결한다. 표적 추적·피해량·공격 속도와 다른 7개 기술은 유지한다. 전투와 두 스튜디오가 동일한 렌더러를 사용한다.

검증: 8방향·2배율에서 몸과 끝점 사이 픽셀 연결 및 시전자 이동 회귀 검사 통과. Chromium에서 8방향 10만볼트와 전투 화면을 확인했고 페이지 오류가 없었다.


### v48: 배틀과 스튜디오의 10만볼트 모양 통일

기존 렌더러는 입력 경로의 각 구간 안에만 꺾임을 추가했다. 실제 배틀의 경로 점이 촘촘하면 추가 꺾임이 생기지 않았고, 스튜디오는 별도로 만든 지그재그를 사용해 서로 다르게 보였다. 경로 전체를 동일한 픽셀 간격으로 다시 나눈 뒤 공통 렌더러에서 꺾임과 가지를 생성하도록 변경했다. 두 스튜디오의 자체 번개 경로 생성은 제거했다. 몸 주변 방전의 시간도 발사 준비 시간을 제외한 동일 기준으로 맞췄다. 유도 이동과 공격 판정은 유지한다.

검증: 8방향·2배율·고/저품질에서 2점 미리보기 경로와 13/31/61점 전투 경로의 결과 픽셀이 일치하는 회귀 검사 통과. 실제 Chromium의 배틀과 스튜디오 캡처에서 확인, 페이지 오류 없음. 브라우저 캐시 갱신용 스크립트 버전은 v48이다.
