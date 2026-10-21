'use strict';
(function () {
  const core = window.StoryCore;
  const $ = function (id) { return document.getElementById(id); };
  const canvas = $('world');
  const ctx = canvas.getContext('2d');
  const SAVE_KEY = 'mint-league-v1';
  const TILE = 32;
  const TYPE_COLOR = { normal:'#c8c0b4', grass:'#78c850', fire:'#f08030', water:'#6890f0', electric:'#f8d030', poison:'#a040a0', bug:'#a8b820', flying:'#a890f0', rock:'#b8a038', ground:'#e0c068', fighting:'#c03028', ghost:'#705898', psychic:'#f85888', dragon:'#7038f8', dark:'#705848' };
  const TYPE_NAME = { normal:'노말', grass:'풀', fire:'불꽃', water:'물', electric:'전기', poison:'독', bug:'벌레', flying:'비행', rock:'바위', ground:'땅', fighting:'격투', ghost:'고스트', psychic:'에스퍼', dragon:'드래곤', dark:'악' };
  const ROOF = { house:'#c45c4a', lab:'#4d6f9a', center:'#ef7f9b', mart:'#3f9a5a', gym1:'#9a7b52', gym2:'#3d7ec4', gym3:'#e2b423', gym4:'#4caf63', gym5:'#7a4ea3', gym6:'#c4553a', gym7:'#c2a15a', gym8:'#73b7e6', raid:'#6a46a8', league:'#e6c85a' };
  let state = null;
  let mode = 'title';
  let lines = [];
  let lineAt = 0;
  let afterText = null;
  let battle = null;
  let battleEvents = [];
  let battleAt = 0;
  let hpSnap = null;
  let moveHold = null;
  let lastArea = '';
  let lastTick = performance.now();
  const PSDK = 'https://raw.githubusercontent.com/PokemonWorkshop/PSDKTechnicalDemo/main/graphics/';
  const PMD = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/';
  const HUMANS = {
    player: 'characters/player_m_walk.png',
    mom: 'characters/npc_mom-01.png',
    prof: 'characters/npc_prof-oak.png',
    nurse: 'characters/npc_nurse-01.png',
    clerk: 'characters/npc_clerk.png',
    leader: 'characters/npc_ace-trainer-m-01.png',
    champion: 'characters/npc_red.png',
    raid: 'characters/npc_scientist-m.png',
    gym1: 'characters/npc_boy.png',
    gym2: 'characters/npc_girl-01.png',
    gym3: 'characters/npc_scientist-m.png',
    gym4: 'characters/npc_girl-02.png',
    gym5: 'characters/npc_scientist-f.png',
    gym6: 'characters/npc_ace-trainer-m-01.png',
    gym7: 'characters/npc_rich-boy.png',
    gym8: 'characters/npc_ace-trainer-f-01.png'
  };
  const TILE_SRC = {
    grass: { cells: [[0, 0], [1, 0]] },
    path: { cells: [[4, 10], [6, 10]] },
    water: { cells: [[6, 27]] },
    tree: { cells: [[2, 1]] },
    floor: { indoor: true, cells: [[0, 3]] },
    wall: { indoor: true, cells: [[0, 4]] },
    door: { cells: [[4, 34]] },
    exit: { cells: [[4, 34]] },
    sign: { cells: [[4, 33]] }
  };
  const humanImages = {};
  const pmdPacks = {};
  const tileBasic = new Image();
  const tileIndoor = new Image();
  const ballImage = new Image();
  tileBasic.src = PSDK + 'tilesets/basic.png';
  tileIndoor.src = PSDK + 'tilesets/' + encodeURIComponent('4g tileset_interieur.png');
  ballImage.src = PSDK + 'icons/004.png';
  const battleInput = { up: false, down: false, left: false, right: false, basic: false, special: false, dash: false, ball: false, potion: false };
  let arena = null;
  let arenaClock = 0;
  let choiceKey = '';
  function humanImage(id) {
    const file = HUMANS[id];
    if (!file) return null;
    if (!humanImages[id]) {
      const img = new Image();
      img.src = PSDK + file;
      humanImages[id] = img;
    }
    return humanImages[id];
  }
  function dexPad(speciesId) {
    const species = core.SPECIES[speciesId];
    return species ? String(species.dex).padStart(4, '0') : '0000';
  }
  function frontUrl(speciesId) {
    return PSDK + 'pokedex/pokefront/' + dexPad(speciesId) + '.png';
  }
  function applyPmdSize(pack, name) {
    const anim = pack.anims[name];
    if (!anim || !anim.img.naturalWidth) return;
    const meta = pack.meta[name];
    let w = meta && meta.w;
    let h = meta && meta.h;
    if (!w || !h) {
      h = Math.max(1, Math.floor(anim.img.naturalHeight / 8));
      w = h;
    }
    if (anim.img.naturalWidth < w || anim.img.naturalHeight < h) {
      h = Math.max(1, Math.floor(anim.img.naturalHeight / 8));
      w = h;
    }
    anim.w = w;
    anim.h = h;
    anim.frames = Math.max(1, Math.floor(anim.img.naturalWidth / w));
    anim.dirs = Math.max(1, Math.floor(anim.img.naturalHeight / h));
  }
  function ensurePmd(speciesId) {
    const dex = dexPad(speciesId);
    if (dex === '0000') return null;
    if (pmdPacks[dex]) return pmdPacks[dex];
    const pack = { dex: dex, meta: {}, anims: {} };
    pmdPacks[dex] = pack;
    const actions = ['Walk', 'Idle', 'Attack', 'Shoot'];
    actions.forEach(function (name) {
      const img = new Image();
      pack.anims[name] = { img: img, w: 0, h: 0, frames: 1, dirs: 8 };
      img.onload = function () { applyPmdSize(pack, name); };
      img.src = PMD + dex + '/' + name + '-Anim.png';
    });
    fetch(PMD + dex + '/AnimData.xml').then(function (res) {
      return res.ok ? res.text() : '';
    }).then(function (text) {
      if (!text) return;
      const doc = new DOMParser().parseFromString(text, 'application/xml');
      const nodes = doc.getElementsByTagName('Anim');
      for (let i = 0; i < nodes.length; i++) {
        const nameNode = nodes[i].getElementsByTagName('Name')[0];
        if (!nameNode) continue;
        const w = Number((nodes[i].getElementsByTagName('FrameWidth')[0] || {}).textContent || 0);
        const h = Number((nodes[i].getElementsByTagName('FrameHeight')[0] || {}).textContent || 0);
        if (w && h) pack.meta[nameNode.textContent] = { w: w, h: h };
      }
      actions.forEach(function (name) { applyPmdSize(pack, name); });
    }).catch(function () {});
    return pack;
  }
  function drawCharset(id, sx, sy, dir, moving, size) {
    const img = humanImage(id);
    if (!img || !img.complete || !img.naturalWidth) return false;
    const cellW = img.naturalWidth / 4;
    const cellH = img.naturalHeight / 4;
    const row = { down: 0, left: 1, right: 2, up: 3 }[dir] || 0;
    const frame = moving ? [0, 1, 2, 1][Math.floor(performance.now() / 140) % 4] : 1;
    const drawW = size || TILE;
    const drawH = drawW * (cellH / cellW);
    ctx.drawImage(img, frame * cellW, row * cellH, cellW, cellH, sx, sy + (TILE - drawH), drawW, drawH);
    return true;
  }
  function drawPmd(speciesId, x, y, face, moving, shooting, size) {
    const pack = ensurePmd(speciesId);
    if (!pack) return false;
    const order = shooting ? ['Shoot', 'Attack', 'Walk'] : moving ? ['Walk', 'Idle'] : ['Idle', 'Walk'];
    let anim = null;
    let action = '';
    for (let i = 0; i < order.length; i++) {
      const candidate = pack.anims[order[i]];
      if (candidate && candidate.w && candidate.img.complete && candidate.img.naturalWidth) {
        anim = candidate;
        action = order[i];
        break;
      }
    }
    ctx.fillStyle = '#0006';
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!anim) return false;
    const basis = pack.anims.Walk && pack.anims.Walk.w ? pack.anims.Walk.h : anim.h;
    const px = size / basis;
    const row = { down: 0, right: 2, up: 4, left: 6 }[face] || 0;
    const tick = Math.floor(performance.now() / (action === 'Shoot' || action === 'Attack' ? 70 : 110));
    const frame = (moving || shooting) ? (tick % anim.frames) : 0;
    const dw = anim.w * px;
    const dh = anim.h * px;
    const dir = Math.min(row, anim.dirs - 1);
    ctx.drawImage(anim.img, frame * anim.w, dir * anim.h, anim.w, anim.h, x - dw / 2, y + 8 - dh, dw, dh);
    return true;
  }
  function paintTile(cell, sx, sy, x, y) {
    ctx.fillStyle = tileColor(cell, x, y);
    ctx.fillRect(sx, sy, TILE, TILE);
    const spec = TILE_SRC[cell.k];
    if (!spec) return;
    const img = spec.indoor ? tileIndoor : tileBasic;
    if (!img.complete || !img.naturalWidth) return;
    const at = spec.cells[(x + y) % spec.cells.length];
    ctx.drawImage(img, at[0] * 32, at[1] * 32, 32, 32, sx, sy, TILE, TILE);
  }
  function charsetId(npc) {
    if (npc.trainerId && HUMANS[npc.trainerId]) return npc.trainerId;
    if (HUMANS[npc.id]) return npc.id;
    return 'leader';
  }
  function preloadStorySprites() {
    Object.keys(HUMANS).forEach(humanImage);
    Object.keys(core.SPECIES).forEach(ensurePmd);
  }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
  addEventListener('resize', resize);
  resize();

  function save() {
    if (!state) return;
    localStorage.setItem(SAVE_KEY, core.serialize(state));
  }
  function hasSave() { return !!localStorage.getItem(SAVE_KEY); }
  function say(nextLines, then) {
    lines = (nextLines || []).filter(Boolean);
    lineAt = 0;
    afterText = then || null;
    mode = lines.length ? 'text' : (then ? (then(), mode) : mode);
    renderMessage();
  }
  function advanceText() {
    if (mode !== 'text') return;
    if (lineAt < lines.length - 1) { lineAt += 1; renderMessage(); return; }
    const then = afterText;
    afterText = null;
    mode = 'play';
    renderMessage();
    if (then) then();
  }
  function skipText() {
    if (mode !== 'text') return;
    lineAt = lines.length - 1;
    advanceText();
  }
  function renderMessage() {
    const box = $('message');
    if (mode === 'text' && lines.length) {
      box.classList.add('show');
      box.textContent = lines[lineAt];
    } else box.classList.remove('show');
  }
  function showChoices(buttons) {
    const box = $('choices');
    box.innerHTML = '';
    buttons.forEach(function (button) {
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = button.label;
      el.onclick = button.on;
      box.appendChild(el);
    });
    box.classList.add('show');
  }
  function hideChoices() { $('choices').classList.remove('show'); $('choices').innerHTML = ''; }

  function bootTitle() {
    mode = 'title';
    $('title').classList.add('show');
    $('continueGame').style.display = hasSave() ? '' : 'none';
    $('nameRow').classList.add('hidden');
    $('pad').classList.remove('hidden');
  }
  function begin(name) {
    state = core.createGame(name, (Date.now() % 100000) >>> 0);
    $('title').classList.remove('show');
    mode = 'play';
    save();
    say(['엄마가 앞에서 기다리고 있다. A로 이야기하자.'], null);
  }
  function continueGame() {
    try { state = core.hydrate(localStorage.getItem(SAVE_KEY)); }
    catch (err) { alert('저장 데이터를 읽을 수 없습니다.'); return; }
    $('title').classList.remove('show');
    mode = 'play';
  }

  $('newGame').onclick = function () {
    $('nameRow').classList.remove('hidden');
    $('nameInput').focus();
  };
  $('begin').onclick = function () { begin($('nameInput').value); };
  $('continueGame').onclick = continueGame;
  $('nameInput').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') begin($('nameInput').value);
    event.stopPropagation();
  });

  function tileColor(cell, x, y) {
    if (!cell) return '#102216';
    if (cell.k === 'grass') return (x + y) % 2 ? '#3eae4d' : '#349445';
    if (cell.k === 'path') return (x + y) % 2 ? '#e6cb8d' : '#d8b97a';
    if (cell.k === 'water') return (Math.floor(performance.now() / 400) + x) % 2 ? '#3f86d0' : '#3576bc';
    if (cell.k === 'tree') return '#1d6634';
    if (cell.k === 'roof') return ROOF[cell.buildingId] || '#a14b45';
    if (cell.k === 'door') return '#8a5a32';
    if (cell.k === 'wall') return '#6b4a34';
    if (cell.k === 'floor') return '#e7d3a4';
    if (cell.k === 'exit') return '#c44747';
    if (cell.k === 'sign') return '#c89a4b';
    return '#ccc';
  }
  function drawPerson(x, y, color, dir, bob) {
    const px = x + 8;
    const py = y + 4 + bob;
    ctx.fillStyle = '#0006';
    ctx.fillRect(px + 2, y + 26, 12, 3);
    ctx.fillStyle = color;
    ctx.fillRect(px + 3, py + 10, 10, 10);
    ctx.fillStyle = '#f1c7a5';
    ctx.fillRect(px + 4, py + 2, 8, 8);
    ctx.fillStyle = '#2b2118';
    if (dir === 'left') ctx.fillRect(px + 4, py + 5, 2, 2);
    else if (dir === 'right') ctx.fillRect(px + 10, py + 5, 2, 2);
    else if (dir !== 'up') { ctx.fillRect(px + 5, py + 5, 2, 2); ctx.fillRect(px + 9, py + 5, 2, 2); }
  }
  function drawWorld() {
    if (!state || mode === 'title') return;
    ctx.imageSmoothingEnabled = false;
    const width = innerWidth;
    const height = innerHeight;
    const originX = state.x * TILE + TILE / 2 - width / 2;
    const originY = state.y * TILE + TILE / 2 - height / 2;
    ctx.fillStyle = state.mapId === 'overworld' ? '#143322' : '#6a4632';
    ctx.fillRect(0, 0, width, height);
    const x0 = Math.max(0, Math.floor(originX / TILE) - 1);
    const y0 = Math.max(0, Math.floor(originY / TILE) - 1);
    const grid = state.mapId === 'overworld' ? core.OVERWORLD : core.INTERIORS[state.mapId].grid;
    const x1 = Math.min(grid[0].length, Math.ceil((originX + width) / TILE) + 1);
    const y1 = Math.min(grid.length, Math.ceil((originY + height) / TILE) + 1);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const cell = grid[y][x];
      const sx = x * TILE - originX;
      const sy = y * TILE - originY;
      paintTile(cell, sx, sy, x, y);
      if (cell.k === 'roof') {
        ctx.fillStyle = '#0003';
        ctx.fillRect(sx, sy + 26, TILE, 6);
      }
    }
    const room = core.INTERIORS[state.mapId];
    if (room) room.objects.forEach(function (obj) {
      const sx = obj.x * TILE - originX;
      const sy = obj.y * TILE - originY;
      if (obj.kind === 'starter') {
        if (ballImage.complete && ballImage.naturalWidth) ctx.drawImage(ballImage, sx + 4, sy + 4, 24, 24);
        else { ctx.fillStyle = '#f05a52'; ctx.beginPath(); ctx.arc(sx + 16, sy + 16, 7, 0, Math.PI * 2); ctx.fill(); }
      } else {
        ctx.fillStyle = obj.kind === 'pc' ? '#9fd0ff' : '#f05a52';
        ctx.fillRect(sx + 8, sy + 10, 16, 14);
        ctx.fillStyle = '#fff';
        ctx.fillRect(sx + 13, sy + 14, 6, 6);
      }
    });
    core.npcsOn(state, state.mapId).forEach(function (npc) {
      const sx = npc.x * TILE - originX;
      const sy = npc.y * TILE - originY;
      if (!drawCharset(charsetId(npc), sx, sy, 'down', false)) drawPerson(sx, sy, npc.color, 'down', 0);
    });
    const bob = Math.sin(performance.now() / 160) * 1.2;
    const psx = state.x * TILE - originX;
    const psy = state.y * TILE - originY;
    if (!drawCharset('player', psx, psy + bob, state.dir, !!moveHold)) drawPerson(psx, psy, '#f25d5d', state.dir, bob);
  }
  function renderHud() {
    if (!state) return;
    const area = core.areaName(state);
    $('placeName').textContent = area;
    $('moneyLine').textContent = state.money.toLocaleString('ko-KR') + '원 · 배지 ' + state.badges.length + '/8';
    const next = core.goals(state).find(function (goal) { return !goal.done; });
    $('goal').textContent = next ? '다음: ' + next.name + (next.progress ? ' (' + next.progress + ')' : '') : '민트 리그의 챔피언이다.';
    if (area !== lastArea) lastArea = area;
    $('partyPips').innerHTML = state.party.map(function (mon) {
      const ratio = mon.maxHp ? Math.max(0, mon.hp / mon.maxHp) : 0;
      return '<div class="pip' + (mon.hp <= 0 ? ' faint' : '') + '"><i style="height:' + Math.round(ratio * 100) + '%"></i></div>';
    }).join('');
  }

  function tryStep(dir) {
    if (!state || mode !== 'play') return;
    const result = core.tryMove(state, dir);
    if (result.warp) save();
    if (result.warning) say([result.warning]);
    if (result.encounter) startBattle(core.startWildBattle(state, result.encounter));
  }
  function pressA() {
    if (mode === 'text') return advanceText();
    if (mode === 'battle') return;
    if (mode !== 'play' || !state) return;
    const result = core.interact(state);
    if (result.type === 'text') say(result.lines);
    else if (result.type === 'confirm-starter') confirmStarter(result);
    else if (result.type === 'shop') say(result.lines, openShop);
    else if (result.type === 'pc') say(result.lines, openPc);
    else if (result.type === 'battle') say(result.lines, function () {
      const started = core.startTrainerBattle(state, result.trainerId);
      if (started.battle) startBattle(started.battle);
    });
    else if (result.type === 'raid') say(result.lines, function () { startBattle(core.startRaidBattle(state)); });
  }
  function pressB() {
    if (mode === 'text') return skipText();
    if (mode === 'choice') return;
    if (mode === 'menu') return closeSheet();
    if (mode === 'battle') return;
    if (mode === 'play') openMenu();
  }
  function confirmStarter(result) {
    say(result.lines, function () {
      mode = 'choice';
      showChoices([
        { label: '이 포켓몬으로 한다', on: function () {
          hideChoices();
          const picked = core.chooseStarter(state, result.species);
          mode = 'play';
          save();
          say([picked.message, '밖으로 나가 동쪽 풀숲과 체육관으로 가자.']);
        } },
        { label: '다시 생각한다', on: function () { hideChoices(); mode = 'play'; } }
      ]);
    });
  }

  function openSheet(html) {
    mode = 'menu';
    $('sheet').innerHTML = html;
    $('overlay').classList.add('show');
    $('message').classList.remove('show');
  }
  function closeSheet() {
    $('overlay').classList.remove('show');
    $('sheet').innerHTML = '';
    if (mode === 'menu') mode = 'play';
  }
  function typeTags(types) {
    return types.map(function (type) {
      return '<span class="type" style="background:' + (TYPE_COLOR[type] || '#ddd') + '">' + (TYPE_NAME[type] || type) + '</span>';
    }).join('');
  }
  function monCard(mon, index, action) {
    const info = core.summary(mon);
    return '<button class="mon" data-act="' + action + '" data-i="' + index + '"><img alt="" src="' + frontUrl(mon.speciesId) + '"><div><b>' + info.name + ' Lv.' + info.level + '</b><div>' + typeTags(info.types) + '</div><div class="bar"><i style="width:' + Math.round(info.hp / info.maxHp * 100) + '%"></i></div><small>' + info.hp + '/' + info.maxHp + (info.status ? ' · ' + info.status : '') + '</small></div></button>';
  }
  function openMenu() {
    const goals = core.goals(state).map(function (goal) {
      return '<div>' + (goal.done ? '✓' : '·') + ' ' + goal.name + (goal.progress ? ' ' + goal.progress : '') + '</div>';
    }).join('');
    openSheet('<h2>' + state.name + '의 메뉴</h2><div class="row">' +
      '<button class="primary" id="openParty">포켓몬</button><button class="ghost" id="openBag">가방</button><button class="ghost" id="openDex">도감</button><button class="ghost" id="openBadges">배지</button><button class="ghost" id="doSave">저장</button><button class="ghost" id="closeMenu">닫기</button></div>' +
      '<h2 style="margin-top:16px">여행 목표</h2><div class="note">' + goals + '</div>');
    $('openParty').onclick = openParty;
    $('openBag').onclick = function () { openBag(false); };
    $('openDex').onclick = openDex;
    $('openBadges').onclick = openBadges;
    $('doSave').onclick = function () { save(); say(['기록을 저장했다.']); closeSheet(); };
    $('closeMenu').onclick = closeSheet;
  }
  function openParty() {
    openSheet('<h2>포켓몬</h2><div class="grid2">' + state.party.map(function (mon, index) { return monCard(mon, index, 'summary'); }).join('') + '</div><p class="note">누르면 상태를 보고, 선두로 바꾸거나 도구를 쓸 수 있다.</p><button class="ghost" id="backMenu">메뉴로</button>');
    bindMon('summary', function (index) { openSummary(index); });
    $('backMenu').onclick = openMenu;
  }
  function openSummary(index) {
    const mon = state.party[index];
    const info = core.summary(mon);
    openSheet('<h2>' + info.name + '</h2><p>Lv.' + info.level + ' · ' + typeTags(info.types) + '</p><p>HP ' + info.hp + '/' + info.maxHp + ' · 다음 레벨까지 ' + (info.expNext - info.exp) + '</p><p>공격 ' + info.stats.atk + ' · 방어 ' + info.stats.def + ' · 특공 ' + info.stats.spa + ' · 특방 ' + info.stats.spd + ' · 스피드 ' + info.stats.spe + '</p><p>' + info.moves.map(function (move) { return move.name + ' (' + (TYPE_NAME[move.type] || move.type) + ' ' + move.power + ')'; }).join('<br>') + '</p><div class="row"><button class="primary" id="toFront">선두로</button><button class="ghost" id="backParty">뒤로</button></div>');
    $('toFront').onclick = function () {
      if (index > 0) state.party.unshift(state.party.splice(index, 1)[0]);
      openParty();
    };
    $('backParty').onclick = openParty;
  }
  function openBag(inBattle) {
    const ids = Object.keys(core.ITEMS).filter(function (id) { return state.bag[id] > 0; });
    const buttons = ids.map(function (id) {
      const item = core.ITEMS[id];
      return '<button class="ghost" data-item="' + id + '">' + item.name + ' ×' + state.bag[id] + '<br><small>' + item.desc + '</small></button>';
    }).join('') || '<p>가방이 비어 있다.</p>';
    openSheet('<h2>가방</h2><div class="grid2">' + buttons + '</div><button class="ghost" id="bagBack">뒤로</button>');
    document.querySelectorAll('[data-item]').forEach(function (button) {
      button.onclick = function () { pickItemTarget(button.dataset.item, inBattle); };
    });
    $('bagBack').onclick = inBattle ? function () { closeSheet(); mode = 'battle'; } : openMenu;
  }
  function pickItemTarget(itemId, inBattle) {
    const item = core.ITEMS[itemId];
    if (item.kind === 'ball') {
      if (!inBattle) { say(['몬스터볼은 배틀 중에만 던질 수 있다.']); closeSheet(); return; }
      closeSheet();
      mode = 'battle';
      command({ type: 'item', itemId: itemId });
      return;
    }
    if (item.kind === 'stone' && inBattle) { say(['돌은 배틀 밖에 써야 한다.']); closeSheet(); mode = 'battle'; return; }
    openSheet('<h2>' + item.name + '</h2><div class="grid2">' + state.party.map(function (mon, index) { return monCard(mon, index, 'use'); }).join('') + '</div><button class="ghost" id="bagBack">뒤로</button>');
    bindMon('use', function (index) {
      if (inBattle) {
        closeSheet();
        mode = 'battle';
        command({ type: 'item', itemId: itemId, index: index });
      } else {
        const result = core.useFieldItem(state, itemId, index);
        say([result.message]);
        closeSheet();
        save();
      }
    });
    $('bagBack').onclick = function () { openBag(inBattle); };
  }
  function bindMon(action, fn) {
    document.querySelectorAll('[data-act="' + action + '"]').forEach(function (button) {
      button.onclick = function () { fn(Number(button.dataset.i)); };
    });
  }
  function openDex() {
    const rows = Object.keys(core.SPECIES).map(function (id) {
      const sp = core.SPECIES[id];
      const caught = state.caught.indexOf(id) >= 0;
      const seen = caught || state.seen.indexOf(id) >= 0;
      return '<div>' + (seen ? sp.name : '???') + (caught ? ' · 잡음' : seen ? ' · 발견' : '') + '</div>';
    }).join('');
    openSheet('<h2>도감 ' + state.caught.length + '/' + Object.keys(core.SPECIES).length + '</h2><div class="note">' + rows + '</div><button class="ghost" id="backMenu">메뉴로</button>');
    $('backMenu').onclick = openMenu;
  }
  function openBadges() {
    const owned = Object.keys(core.TRAINERS).filter(function (id) { return core.TRAINERS[id].badgeId && state.badges.indexOf(core.TRAINERS[id].badgeId) >= 0; })
      .map(function (id) { return core.TRAINERS[id].place + ' · ' + core.TRAINERS[id].badge; });
    openSheet('<h2>배지 ' + state.badges.length + '/8</h2><div class="note">' + (owned.join('<br>') || '아직 배지가 없다.') + '</div><button class="ghost" id="backMenu">메뉴로</button>');
    $('backMenu').onclick = openMenu;
  }
  function openShop() {
    mode = 'menu';
    const stock = core.martStock(state).map(function (id) {
      const item = core.ITEMS[id];
      return '<button class="ghost" data-buy="' + id + '">' + item.name + ' · ' + item.price + '원<br><small>' + item.desc + '</small></button>';
    }).join('');
    openSheet('<h2>프렌들리숍</h2><p>소지금 ' + state.money + '원</p><div class="grid2">' + stock + '</div><button class="ghost" id="leaveShop">나간다</button>');
    document.querySelectorAll('[data-buy]').forEach(function (button) {
      button.onclick = function () {
        const result = core.buyItem(state, button.dataset.buy);
        save();
        say([result.message], openShop);
        closeSheet();
      };
    });
    $('leaveShop').onclick = closeSheet;
  }
  function openPc() {
    mode = 'menu';
    const party = state.party.map(function (mon, index) { return monCard(mon, index, 'deposit'); }).join('');
    const box = state.box.map(function (mon, index) { return monCard(mon, index, 'withdraw'); }).join('') || '<p class="note">박스가 비어 있다.</p>';
    openSheet('<h2>박스</h2><div class="grid2"><div><h3>지닌 포켓몬</h3>' + party + '</div><div><h3>박스 ' + state.box.length + '/' + core.BOX_LIMIT + '</h3>' + box + '</div></div><button class="ghost" id="leavePc">끈다</button>');
    bindMon('deposit', function (index) { const result = core.deposit(state, index); save(); say([result.message], openPc); closeSheet(); });
    bindMon('withdraw', function (index) { const result = core.withdraw(state, index); save(); say([result.message], openPc); closeSheet(); });
    $('leavePc').onclick = closeSheet;
  }

  function startBattle(next) {
    battle = next;
    arena = window.StoryArena.create(battle);
    arenaClock = performance.now();
    choiceKey = '';
    mode = 'battle';
    hideChoices();
    Object.keys(battleInput).forEach(function (key) { battleInput[key] = false; });
    $('battle').classList.add('show');
    $('message').classList.remove('show');
  }
  function openBattleChoice() {
    const pending = battle.pending;
    if (pending.type === 'learn') {
      const mine = battle.state.party[battle.playerIndex];
      const moveName = core.MOVES[pending.moveId].name;
      const buttons = mine.moves.map(function (id, index) {
        return { label: core.MOVES[id].name + ' 잊기', on: function () { resolveChoice({ type: 'learn', replace: index }); } };
      });
      buttons.push({ label: moveName + '는 포기', on: function () { resolveChoice({ type: 'learn', replace: null }); } });
      showChoices(buttons);
      return;
    }
    const buttons = [];
    battle.state.party.forEach(function (mon, index) {
      if (mon.hp <= 0) return;
      buttons.push({ label: core.monName(mon) + ' Lv.' + mon.level, on: function () { resolveChoice({ type: 'switch', index: index }); } });
    });
    showChoices(buttons);
  }
  function resolveChoice(cmd) {
    hideChoices();
    choiceKey = '';
    core.battleCommand(battle, cmd);
    if (battle.over) finishBattle();
  }
  function watchBattle() {
    if (!battle) return;
    if (battle.pending) {
      const key = battle.pending.type + ':' + (battle.pending.moveId || '') + ':' + battle.playerIndex + ':' + battle.foeIndex;
      if (choiceKey !== key) { choiceKey = key; openBattleChoice(); }
      return;
    }
    if (choiceKey) { choiceKey = ''; hideChoices(); }
    if (battle.over) finishBattle();
  }
  function drawArena() {
    if (!arena) return;
    const width = innerWidth;
    const height = innerHeight;
    ctx.fillStyle = '#163222';
    ctx.fillRect(0, 0, width, height);
    const scale = Math.min(width / arena.W, (height - 150) / arena.H);
    const ox = (width - arena.W * scale) / 2;
    const oy = 64;
    ctx.imageSmoothingEnabled = false;
    const wildField = arena.battle.kind === 'wild';
    ctx.fillStyle = wildField ? '#3eae4d' : '#6a4632';
    ctx.fillRect(ox, oy, arena.W * scale, arena.H * scale);
    const ground = wildField ? TILE_SRC.grass : TILE_SRC.floor;
    const groundImg = ground.indoor ? tileIndoor : tileBasic;
    if (groundImg.complete && groundImg.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, oy, arena.W * scale, arena.H * scale);
      ctx.clip();
      for (let ty = 0; ty < arena.H; ty += 32) {
        for (let tx = 0; tx < arena.W; tx += 32) {
          const at = ground.cells[(tx + ty) % ground.cells.length];
          ctx.drawImage(groundImg, at[0] * 32, at[1] * 32, 32, 32, ox + tx * scale, oy + ty * scale, 32 * scale, 32 * scale);
        }
      }
      ctx.restore();
    }
    ctx.strokeStyle = '#24180f';
    ctx.strokeRect(ox, oy, arena.W * scale, arena.H * scale);
    function place(x, y) { return [ox + x * scale, oy + y * scale]; }
    arena.shots.forEach(function (shot) {
      const at = place(shot.x, shot.y);
      ctx.fillStyle = TYPE_COLOR[shot.type] || '#fff';
      ctx.fillRect(at[0] - 4, at[1] - 4, 8, 8);
    });
    arena.balls.forEach(function (ball) {
      const at = place(ball.x, ball.y);
      if (ballImage.complete && ballImage.naturalWidth) ctx.drawImage(ballImage, at[0] - 8, at[1] - 8, 16, 16);
    });
    [arena.foe, arena.player].forEach(function (actor) {
      if (!actor || !actor.mon || actor.mon.hp <= 0) return;
      const at = place(actor.x, actor.y);
      const size = 64 * (scale / 1.7);
      const shooting = actor.basicCd > 0.2 || actor.specialCd > 0.9;
      drawPmd(actor.mon.speciesId, at[0], at[1], actor.face, actor.moving, shooting, size);
    });
    const mine = battle.state.party[battle.playerIndex];
    const foe = battle.foe[Math.min(battle.foeIndex, battle.foe.length - 1)];
    const moves = mine ? window.StoryArena.pickMoves(mine) : null;
    $('battleToast').textContent = (arena.toastT > 0 ? arena.toast + '  ' : '') + (moves ? core.MOVES[moves.basic].name + ' · ' + core.MOVES[moves.special].name : '');
    $('foeName').textContent = foe ? core.monName(foe) : '';
    $('foeLv').textContent = foe ? 'Lv.' + foe.level : '';
    $('myName').textContent = mine ? core.monName(mine) : '';
    $('myLv').textContent = mine ? 'Lv.' + mine.level : '';
    if (foe) $('foeHp').style.width = Math.round(foe.hp / foe.maxHp * 100) + '%';
    if (mine) {
      $('myHp').style.width = Math.round(mine.hp / mine.maxHp * 100) + '%';
      $('myExp').style.width = Math.round(mine.exp / core.expToNext(mine.level) * 100) + '%';
    }
  }
  function finishBattle() {
    const result = core.concludeBattle(state, battle);
    const pending = [];
    state.party.forEach(function (mon) { if (mon.uid && mon.uid === battle.pendingEvo) pending.push(mon); });
    const finished = battle;
    battle = null;
    arena = null;
    choiceKey = '';
    $('battle').classList.remove('show');
    mode = 'play';
    save();
    const texts = [];
    if (result.badge) texts.push(result.badge + '를 받았다.');
    if (result.prize) texts.push('상금 ' + result.prize + '원을 받았다.');
    if (result.blackout) texts.push('눈 앞이 캄캄해졌다. ' + result.loss + '원을 떨어뜨리고 포켓몬센터에서 눈을 떴다.');
    if (result.champion) texts.push(state.name + '는 민트 리그의 챔피언이 되었다.');
    const next = function () {
      if (result.champion) openFame();
      else promptEvolution(pending);
    };
    if (texts.length) say(texts, next);
    else next();
    void finished;
  }
  function promptEvolution(queue) {
    const mon = queue.shift();
    if (!mon) return;
    const into = core.evolutionTarget(mon);
    if (!into) return promptEvolution(queue);
    const nextName = core.SPECIES[into].name;
    say([core.monName(mon) + '의 모습이 변하려고 한다.'], function () {
      mode = 'choice';
      showChoices([
        { label: nextName + '(으)로 진화', on: function () {
          hideChoices();
          const evolved = core.commitEvolution(state, mon);
          mode = 'play';
          save();
          say([evolved.from + ' → ' + evolved.to], function () {
            if (core.evolutionTarget(mon)) queue.unshift(mon);
            promptEvolution(queue);
          });
        } },
        { label: '지금은 그만둔다', on: function () {
          hideChoices();
          mon.evoLockLevel = mon.level;
          mode = 'play';
          promptEvolution(queue);
        } }
      ]);
    });
  }
  function openFame() {
    const fame = state.fame;
    const party = fame ? fame.party.map(function (mon) { return mon.name + ' Lv.' + mon.level; }).join('<br>') : '';
    openSheet('<h2>명예의 전당</h2><p>' + state.name + '는 민트 리그 챔피언이다.</p><div class="note">' + party + '</div><button class="primary" id="fameClose">여행을 계속한다</button>');
    $('fameClose').onclick = closeSheet;
  }

  function heldDir() { return moveHold; }
  $('pad').querySelectorAll('button').forEach(function (button) {
    const dir = button.dataset.dir;
    const start = function (event) {
      event.preventDefault();
      moveHold = dir;
      if (mode === 'battle') battleInput[dir] = true;
      else tryStep(dir);
    };
    const stop = function () {
      if (moveHold === dir) moveHold = null;
      battleInput[dir] = false;
    };
    button.addEventListener('pointerdown', start);
    button.addEventListener('pointerup', stop);
    button.addEventListener('pointerleave', stop);
  });
  $('btnA').onclick = pressA;
  $('btnB').onclick = pressB;
  $('fight').querySelectorAll('button').forEach(function (button) {
    const act = button.dataset.act;
    button.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      battleInput[act] = true;
    });
    const release = function () { if (act === 'basic' || act === 'special') battleInput[act] = false; };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointerleave', release);
  });
  const keyDir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', a: 'left', s: 'down', d: 'right' };
  addEventListener('keydown', function (event) {
    if (event.target && event.target.id === 'nameInput') return;
    const dir = keyDir[event.key];
    if (mode === 'battle' && battle && !battle.pending) {
      if (dir) { event.preventDefault(); battleInput[dir] = true; return; }
      if (event.key === '1') { battleInput.basic = true; return; }
      if (event.key === '2') { battleInput.special = true; return; }
      if (event.key === '3') { battleInput.ball = true; return; }
      if (event.key === '4') { battleInput.potion = true; return; }
      if (event.key === ' ' || event.key === '5') { event.preventDefault(); battleInput.dash = true; return; }
    }
    if (dir) { event.preventDefault(); if (!event.repeat) tryStep(dir); moveHold = dir; }
    else if (event.key === 'Enter' || event.key === 'z' || event.key === 'Z' || event.key === ' ') { event.preventDefault(); pressA(); }
    else if (event.key === 'Escape' || event.key === 'x' || event.key === 'X' || event.key === 'Backspace') { event.preventDefault(); pressB(); }
  });
  addEventListener('keyup', function (event) {
    const dir = keyDir[event.key];
    if (dir && moveHold === dir) moveHold = null;
    if (dir) battleInput[dir] = false;
    if (event.key === '1') battleInput.basic = false;
    if (event.key === '2') battleInput.special = false;
  });
  setInterval(function () { if (heldDir() && mode === 'play') tryStep(heldDir()); }, 150);

  function frame(now) {
    if (state && mode !== 'title') state.playMs += Math.min(1000, now - lastTick);
    lastTick = now;
    const walking = mode === 'play' || mode === 'text' || mode === 'choice' || mode === 'battle';
    $('pad').classList.toggle('hidden', !walking);
    $('fight').classList.toggle('hidden', mode !== 'battle' || !!(battle && battle.pending));
    $('actions').classList.toggle('hidden', mode === 'battle' || mode === 'title' || mode === 'menu');
    $('hud').classList.toggle('hidden', mode === 'title');
    $('goal').classList.toggle('hidden', mode !== 'play' && mode !== 'text');
    if (mode === 'battle' && arena && battle) {
      const dt = Math.min(0.05, arenaClock ? (now - arenaClock) / 1000 : 0.016);
      arenaClock = now;
      window.StoryArena.step(arena, battleInput, dt, function () { return Math.random(); });
      battleInput.dash = false;
      battleInput.ball = false;
      battleInput.potion = false;
      watchBattle();
      if (mode === 'battle') drawArena();
      else drawWorld();
    } else {
      arenaClock = now;
      drawWorld();
    }
    renderHud();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  preloadStorySprites();
  bootTitle();
  window.__STORY = {
    core: core,
    get state() { return state; },
    begin: begin,
    continueGame: continueGame,
    pressA: pressA,
    pressB: pressB,
    tryStep: tryStep,
    get mode() { return mode; },
    get battle() { return battle; },
    sprites: function () {
      const player = humanImage('player');
      const ready = Object.keys(pmdPacks).filter(function (dex) {
        const walk = pmdPacks[dex].anims.Walk;
        return walk && walk.w && walk.img.naturalWidth;
      });
      return {
        player: !!(player && player.complete && player.naturalWidth),
        tiles: !!(tileBasic.complete && tileBasic.naturalWidth),
        indoor: !!(tileIndoor.complete && tileIndoor.naturalWidth),
        ball: !!(ballImage.complete && ballImage.naturalWidth),
        pmd: ready
      };
    }
  };
})();
