# 애니메이션 작업 폴더

`source/<character>/<action>/`에는 편집 가능한 원본(`.aseprite`, `.kra`, `.psd` 등)을, `exports/<character>/<action>/`에는 게임으로 가져갈 투명 PNG와 `animation.json`을 둡니다. `pixel-editor.html`에서 만든 기술 이펙트 PNG는 `exports/moves/<move>/`에 정리할 수 있습니다.

권장 `animation.json` 예시:

```json
{
  "character": "hero",
  "action": "Attack",
  "directions": ["south", "southwest", "west", "northwest", "north", "northeast", "east", "southeast"],
  "frames": 8,
  "fps": 12,
  "canvas": { "width": 192, "height": 192 },
  "origin": { "x": 96, "y": 176 },
  "sheet": { "columns": 8, "rows": 8, "frameOrder": "row-major; direction order as listed" }
}
```

이 JSON은 제작용 메타데이터이며 Essentials가 자동으로 읽는 포맷은 아닙니다. RPG Maker XP의 이벤트 캐릭터셋은 `Graphics/Characters/`용 규격이고, 기술 이펙트 프레임은 Essentials `Graphics/Animations/`에 넣어 Battle Animation Editor에서 참조할 수 있습니다.

현재 `MyPokemonGame`은 바닐라 Essentials v21.1입니다. Pokémon 배틀러의 Idle/Attack/Shoot/Hurt 포즈용 시트는 코어 Essentials만으로 자동 재생되지 않습니다. 해당 동작에는 호환 플러그인과 런타임 통합이 별도로 필요합니다.
