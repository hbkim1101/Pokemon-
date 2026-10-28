# RPG Maker XP + Pokémon Essentials 작업 환경

이 PC에는 RPG Maker XP 무료 체험판과 Pokémon Essentials v21.1 작업 프로젝트가 준비되어 있습니다. 실제 게임 프로젝트 폴더는 이 PC의 `projects/` 아래에 있으며, 라이선스 조건 때문에 Git에는 포함하지 않습니다. 기존 Pokémon Arena 웹 프로젝트는 그대로 두고, RMXP 게임은 이 폴더 아래에서 따로 작업합니다.

## 바로 시작하기

- **편집기:** 이미 열려 있는 RPG Maker XP에서 `rpg-maker-xp/projects/MyPokemonGame/Game.rxproj` 프로젝트를 편집합니다.
- **실제 게임 프로젝트:** `projects/MyPokemonGame` (이 PC에만 있는 로컬 프로젝트)
- **액션/기술 애니메이션 원본과 내보내기:** [`action-animations`](action-animations/README.md)
- **새 베이스 복사 도구:** `../scripts/prepare-essentials.ps1`

게임 실행 파일은 `projects/MyPokemonGame/Game.exe`입니다. 실행할 때는 먼저 `Game.rxproj`로 프로젝트를 저장하세요. 이 프로젝트의 기본 맵과 이벤트는 Essentials v21.1 샘플을 바탕으로 하며, RPG Maker XP의 Map/Database/Event 기능으로 바꾸면 됩니다.

## 현재 설치 구성

- RPG Maker XP 1.0.5.0 무료 체험판: `C:\Program Files (x86)\Enterbrain\RPGXP\RPGXP.exe`
- RPG Maker XP 체험판은 첫 실행부터 30일간 편집기를 사용할 수 있습니다. 배포 제한은 [공식 체험판 조건](https://www.rpgmakerofficial.com/support/trial/)을 확인하세요.
- Pokémon Essentials v21.1 베이스: Eevee Expo의 [Essentials v21.1 리소스](https://eeveeexpo.com/essentials/)에서 받은 2023-07-30 프로젝트.
- `MyPokemonGame`에는 베이스 파일을 복사한 다음 [공식 Maruno17 Essentials 소스](https://github.com/Maruno17/pokemon-essentials)의 현재 `master` 내용을 병합했습니다. 베이스 복사본 `Essentials-v21.1-base`는 원본 보존용입니다.
- Git과 PowerShell은 준비되어 있습니다. Ruby를 별도로 설치하지 않아도 RPG Maker XP 편집과 Essentials 프로젝트 작업을 시작할 수 있습니다.

## 내 액션 애니메이션 작업

1. 원본 그림/타임라인은 `action-animations/source/<캐릭터>/<액션>/`에 둡니다.
2. 투명 PNG 시트와 메타데이터는 `action-animations/exports/<캐릭터>/<액션>/`에 내보냅니다.
3. **기술 이펙트 애니메이션:** 기존 `pixel-editor.html`에서 프레임을 그리고 `PNG 스프라이트 시트`로 내보냅니다. 이펙트 시트를 `MyPokemonGame/Graphics/Animations/`에 복사한 뒤 게임의 Battle Animation Editor에서 셀/타이밍을 연결합니다.
4. **RPG Maker XP 필드 캐릭터셋:** `Graphics/Characters/`의 RMXP 캐릭터셋 규격을 사용합니다. 배틀용 Pokémon 스프라이트 시트와 파일 규격이 다릅니다.
5. **첫 스타터·라이벌 액션전:** `MyPokemonGame`의 `Lappet Opening` 플러그인이 스타터 획득 뒤 RPG Maker 화면 안에서 네이티브 실시간 전투를 실행하고, 승패 후 기존 연구소 이벤트를 이어갑니다. 브라우저나 Arena 서버는 필요하지 않습니다. PMD 8방향 동작 시트와 사용자 기술 이펙트는 게임 프로젝트에 포함합니다.

애니메이션 시트 폴더의 `animation.json`은 제작용 메타데이터이며 Essentials가 자동으로 읽지는 않습니다. 권장 상태명은 `Idle`, `Walk`, `Attack`, `Shoot`, `Charge`, `Hurt`; 방향은 `south`, `southwest`, `west`, `northwest`, `north`, `northeast`, `east`, `southeast`입니다.

## 새 Essentials 프로젝트 복사

Windows PowerShell에서 저장소 루트로 이동해 실행합니다.

```powershell
.\scripts\prepare-essentials.ps1 `
  -BaseProjectPath '.\rpg-maker-xp\projects\Essentials-v21.1-base' `
  -DestinationPath '.\rpg-maker-xp\projects\AnotherPokemonGame'
```

스크립트는 완전한 실행 가능 베이스를 새 폴더로 복사한 뒤 공식 소스 파일을 병합합니다. 원본은 바꾸지 않으며 대상 경로가 이미 있으면 덮어쓰지 않습니다. 기본 브랜치는 GitHub `master`입니다. 저장소의 게임 프로젝트 폴더는 기존 Arena Git 저장소의 대용량 게임 에셋과 섞이지 않게 로컬 전용으로 유지합니다.

## 참고

- [Essentials 공식 저장소의 병합/스크립트 설명](https://github.com/Maruno17/pokemon-essentials)
- [Essentials v21.1 다운로드 페이지](https://eeveeexpo.com/essentials/)
- [RPG Maker XP 공식 지원/체험판 조건](https://www.rpgmakerofficial.com/support/trial/)
