'use strict';
(function () {
  const BASE = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/';
  const STORE = 'pokemonArena.pmdEmitterFrameOverrides.v27';
  const ROSTER = [
    { id: '0026', name: '라이츄', type: 'electric', tone: 'volt', basic: '전기쇼크', special: '10만볼트', moveId: 'thunderbolt', port: 'body', variants: ['0004/0001', '0001', '0000', ''] },
    { id: '0006', name: '리자몽', type: 'fire', tone: 'fire', basic: '불꽃세례', special: '화염방사', moveId: 'flamethrower', port: 'mouth', variants: ['0005', '0004', '0001', '0000/0001', ''] },
    { id: '0009', name: '거북왕', type: 'water', tone: 'water', basic: '물대포', special: '파도타기', moveId: 'surf', port: 'cannonLeft', variants: ['0004', '0000/0001', ''] },
    { id: '0003', name: '이상해꽃', type: 'grass', tone: 'leaf', basic: '나뭇잎', special: '에너지볼', moveId: 'energyball', port: 'mouth', variants: ['0003', '0000', ''] }
  ];
  const DIRS = [
    { i: 0, label: '↓', name: '남' }, { i: 1, label: '↘', name: '남동' }, { i: 2, label: '→', name: '동' }, { i: 3, label: '↗', name: '북동' },
    { i: 4, label: '↑', name: '북' }, { i: 5, label: '↖', name: '북서' }, { i: 6, label: '←', name: '서' }, { i: 7, label: '↙', name: '남서' }
  ];
  const FACES = [Math.PI / 2, Math.PI / 4, 0, -Math.PI / 4, -Math.PI / 2, -3 * Math.PI / 4, Math.PI, 3 * Math.PI / 4];

  const $ = (id) => document.getElementById(id);
  const canvas = $('stage');
  const ctx = canvas.getContext('2d');
  const sprites = {};
  const state = {
    kind: 1,
    move: 'special',
    vfxVariant: 0,
    dir: 0,
    frame: 0,
    portIndex: 0,
    clock: 0,
    last: performance.now(),
    playFx: true,
    showMarker: true,
    previewAge: 0,
    previewing: true,
    zoomCell: null
  };

  function current() { return ROSTER[state.kind]; }
  function portsFor(mon) {
    const atlas = window.PMD_EMISSION_ATLAS?.[mon.id];
    const channel = state.move === 'basic' ? 'basic' : mon.moveId;
    return atlas?.channels?.[channel] || [mon.port];
  }
  function currentPort(mon) {
    const ports = portsFor(mon);
    return ports[state.portIndex % ports.length];
  }
  function pointAt(mon, port, dir, frame) {
    const frames = window.PMD_EMISSION_ATLAS?.[mon.id]?.ports?.[port]?.frames;
    if (!frames?.[dir]?.[frame]) return null;
    return frames[dir][frame].slice();
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let done = false;
      const timer = setTimeout(() => finish(false), 6000);
      function finish(ok) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        img.onload = img.onerror = null;
        if (ok) resolve(img); else reject(new Error('load fail'));
      }
      img.crossOrigin = 'anonymous';
      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = url;
    });
  }
  async function loadXml(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4500);
    try {
      const res = await fetch(url, { mode: 'cors', signal: ctrl.signal });
      if (!res.ok) throw new Error('http');
      return new DOMParser().parseFromString(await res.text(), 'application/xml');
    } finally {
      clearTimeout(timer);
    }
  }
  function parseAnim(xml, name) {
    const nodes = [...xml.getElementsByTagName('Anim')];
    const node = nodes.find((n) => n.getElementsByTagName('Name')[0]?.textContent === name);
    if (!node) return null;
    const num = (key) => Number(node.getElementsByTagName(key)[0]?.textContent || 0);
    return {
      w: num('FrameWidth'),
      h: num('FrameHeight'),
      dur: [...node.getElementsByTagName('Duration')].map((n) => +n.textContent),
      hitFrame: Number(node.getElementsByTagName('HitFrame')[0]?.textContent ?? NaN),
      returnFrame: Number(node.getElementsByTagName('ReturnFrame')[0]?.textContent ?? NaN)
    };
  }
  async function preload(id, variants) {
    const pack = sprites[id] = { anims: {}, loaded: false, variant: '' };
    for (const variant of variants) {
      const root = BASE + id + (variant ? '/' + variant : '') + '/';
      let meta = {};
      try {
        const xml = await loadXml(root + 'AnimData.xml');
        for (const name of ['Walk', 'Idle', 'Shoot', 'Attack']) meta[name] = parseAnim(xml, name);
      } catch (err) {}
      const temp = {};
      await Promise.all(['Walk', 'Idle', 'Shoot', 'Attack'].map(async (name) => {
        try {
          const image = await loadImage(root + name + '-Anim.png');
          let m = meta[name];
          if (!m?.w || !m?.h) {
            const h = Math.max(1, Math.floor(image.height / 8));
            m = { w: h, h, dur: Array.from({ length: Math.max(1, Math.floor(image.width / h)) }, () => 8) };
          }
          temp[name] = {
            image, w: m.w, h: m.h, dur: m.dur?.length ? m.dur : [8],
            frames: Math.max(1, Math.floor(image.width / m.w)),
            dirs: Math.max(1, Math.floor(image.height / m.h)),
            hitFrame: Number.isFinite(m.hitFrame) ? m.hitFrame : null,
            returnFrame: Number.isFinite(m.returnFrame) ? m.returnFrame : null
          };
        } catch (err) {}
      }));
      if (temp.Shoot || temp.Walk || temp.Idle) {
        pack.anims = temp;
        pack.loaded = true;
        pack.variant = variant;
        break;
      }
    }
    return pack;
  }

  function buildUi() {
    const pokemonGroup = $('pokemonGroup');
    const moveGroup = $('moveGroup');
    const dirGroup = $('dirGroup');
    const variantGroup = $('variantGroup');
    pokemonGroup.innerHTML = '';
    moveGroup.innerHTML = '';
    dirGroup.innerHTML = '';
    variantGroup.innerHTML = '';
    ROSTER.forEach((mon, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip ' + mon.tone + (i === state.kind ? ' active' : '');
      btn.textContent = mon.name;
      btn.onclick = () => { state.kind = i; state.frame = 0; state.portIndex = 0; state.previewAge = 0; refresh(); };
      pokemonGroup.append(btn);
    });
    const mon = current();
    [
      { id: 'special', label: mon.special, tone: mon.tone },
      { id: 'basic', label: mon.basic, tone: mon.tone }
    ].forEach((move) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip ' + move.tone + (state.move === move.id ? ' active' : '');
      btn.textContent = move.label;
      btn.onclick = () => { state.move = move.id; state.portIndex = 0; state.previewAge = 0; refresh(); };
      moveGroup.append(btn);
    });
    const ports = portsFor(mon);
    if (ports.length > 1) {
      ports.forEach((port, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip' + (state.portIndex === i ? ' active' : '');
        btn.textContent = '포트 ' + port;
        btn.onclick = () => { state.portIndex = i; refresh(); };
        moveGroup.append(btn);
      });
    }
    const variants = {
      surf: ['파도에 올라타기', '말리는 큰 파도', '쌍물살 질주'],
      thunderbolt: ['굵은 직격 번개', '촘촘한 방전 가지', '겹번개 폭주'],
      flamethrower: ['이어지는 불길', '갈라지는 화염 혀', '소용돌이 화염'],
      energyball: ['잎을 두른 구체', '숲의 에너지 핵', '꽃잎 회오리']
    }[mon.moveId] || ['기본 시안', '시안 2', '시안 3'];
    variants.forEach((label, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip ' + mon.tone + (state.vfxVariant === i ? ' active' : '');
      btn.textContent = (i + 1) + ' · ' + label;
      btn.onclick = () => { state.vfxVariant = i; state.previewAge = 0; state.previewing = true; refresh(); };
      variantGroup.append(btn);
    });
    $('variantNote').textContent = '시안 ' + (state.vfxVariant + 1) + '/3 · ' + variants[state.vfxVariant] + ' · 전투 밸런스는 바뀌지 않습니다.';
    DIRS.forEach((dir) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (state.dir === dir.i ? ' active' : '');
      btn.textContent = dir.label + ' ' + dir.name;
      btn.onclick = () => { state.dir = dir.i; state.previewAge = 0; refresh(); };
      dirGroup.append(btn);
    });
  }

  function buildStrip() {
    const mon = current();
    const shoot = sprites[mon.id]?.anims?.Shoot;
    const strip = $('strip');
    strip.innerHTML = '';
    if (!shoot) {
      strip.textContent = 'Shoot 시트를 아직 불러오지 못했습니다.';
      return;
    }
    state.frame = Math.min(state.frame, shoot.frames - 1);
    for (let f = 0; f < shoot.frames; f++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'frameCell' + (f === state.frame ? ' active' : '');
      const c = document.createElement('canvas');
      c.width = 56; c.height = 56;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.clearRect(0, 0, 56, 56);
      g.fillStyle = '#10262c';
      g.fillRect(0, 0, 56, 56);
      const scale = Math.min(52 / shoot.w, 52 / shoot.h);
      const dw = shoot.w * scale, dh = shoot.h * scale;
      g.drawImage(shoot.image, f * shoot.w, state.dir * shoot.h, shoot.w, shoot.h, (56 - dw) / 2, (56 - dh) / 2, dw, dh);
      const pt = pointAt(mon, currentPort(mon), state.dir, f);
      if (pt) {
        g.fillStyle = '#22eeff';
        g.fillRect(Math.round((56 - dw) / 2 + pt[0] * scale) - 1, Math.round((56 - dh) / 2 + pt[1] * scale) - 1, 3, 3);
      }
      cell.append(c);
      const lab = document.createElement('small');
      lab.textContent = String(f);
      cell.append(lab);
      cell.onclick = () => { state.frame = f; state.previewAge = 0; refresh(); };
      strip.append(cell);
    }
  }

  function setPoint(x, y) {
    const mon = current();
    const port = currentPort(mon);
    const shoot = sprites[mon.id]?.anims?.Shoot;
    if (!shoot) return;
    window.setPMDEmitterFramePoint?.(mon.id, port, state.dir, state.frame, x, y);
    refreshExport();
    buildStrip();
    updateMeta();
  }
  function nudge(dx, dy) {
    const mon = current();
    const port = currentPort(mon);
    const pt = pointAt(mon, port, state.dir, state.frame);
    if (!pt) return;
    setPoint(pt[0] + dx, pt[1] + dy);
  }
  function resetFrame() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
      const port = currentPort(current());
      if (saved[current().id]?.[port]?.[state.dir]?.[state.frame] != null) {
        delete saved[current().id][port][state.dir][state.frame];
        localStorage.setItem(STORE, JSON.stringify(saved));
      }
    } catch (err) {}
    location.reload();
  }

  function drawSprite(pack, action, x, y, dir, frame, scale) {
    const anim = pack.anims[action] || pack.anims.Shoot || pack.anims.Idle || pack.anims.Walk;
    if (!anim) return null;
    const f = Math.max(0, Math.min(frame, anim.frames - 1));
    const d = Math.max(0, Math.min(dir, anim.dirs - 1));
    const dw = anim.w * scale, dh = anim.h * scale;
    ctx.drawImage(anim.image, f * anim.w, d * anim.h, anim.w, anim.h, x - dw / 2, y - dh + 8, dw, dh);
    return { anim, f, d, dw, dh, x, y, scale };
  }

  function drawFx(mon, origin, angle, age, scale) {
    const vx = Math.cos(angle), vy = Math.sin(angle);
    const nx = -vy, ny = vx;
    const move = state.move === 'basic' ? 'basic' : mon.moveId;
    if (move === 'basic') {
      const d = 24 + Math.min(age, 1) * 280;
      ctx.fillStyle = mon.tone === 'fire' ? '#ff9a55' : mon.tone === 'water' ? '#7ad8ff' : mon.tone === 'leaf' ? '#9be37a' : '#ffe56b';
      ctx.fillRect(origin.x + vx * d - 4, origin.y + vy * d - 4, 8, 8);
      return;
    }
    ArenaFX.setPixel(scale);
    const m={...origin,vx,vy,age,life:1.4,type:move,variant:state.vfxVariant};
    if(move==='surf')return;
    if(move==='thunderbolt'){
      const dist=420*Math.min(1,age/.55),steps=Math.max(2,Math.ceil(dist/18));
      m.path=Array.from({length:steps+1},(_,i)=>{
        const side=i===0||i===steps?0:Math.sin(i*2.7+Math.floor(age*16))*12;
        return {x:origin.x+vx*dist*i/steps+nx*side,y:origin.y+vy*dist*i/steps+ny*side};
      });
      ArenaFX.thunder(ctx,m);ArenaFX.aura(ctx,{...m,element:'electric'});
    }else if(move==='flamethrower'){
      m.stream=Math.min(300,age*820)*Math.max(0,Math.min(1,(1.4-age)/.25));
      ArenaFX.flame(ctx,m);
    }else{
      const dist=move==='surf'?42+Math.sin(age*5)*8:Math.min(360,age*380);
      m.x+=vx*dist;m.y+=vy*dist;
      if(move==='surf')ArenaFX.surf(ctx,m);else ArenaFX.orb(ctx,m);
    }
  }

  function render() {
    const mon = current();
    const pack = sprites[mon.id];
    const w = canvas.width, h = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#163744');
    g.addColorStop(0.55, '#214f48');
    g.addColorStop(1, '#1a4038');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2d6a55';
    ctx.fillRect(0, h * 0.58, w, h * 0.42);
    ctx.strokeStyle = '#245647';
    for (let y = h * 0.58; y < h; y += 28) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const cx = w * 0.38, cy = h * 0.62;
    const angle = FACES[state.dir];
    const shoot = pack?.anims?.Shoot;
    const scale = shoot ? Math.min(4.2, 210 / Math.max(shoot.w, shoot.h)) : 3.2;
    let drawn = null;
    const riding=state.move==='special'&&mon.moveId==='surf'&&state.playFx&&state.previewing;
    const rideBob=riding?Math.sin(state.clock*9)*3:0;
    if (pack?.loaded) {
      ctx.fillStyle = '#0005';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 28, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      if(riding){
        ArenaFX.setPixel(scale);
        ArenaFX.ride(ctx,{x:cx,y:cy+14,vx:Math.cos(angle),vy:Math.sin(angle),age:state.previewAge,life:1.2,variant:state.vfxVariant});
      }
      drawn = drawSprite(pack, 'Shoot', cx, cy+rideBob, state.dir, state.frame, scale);
    }

    const port = currentPort(mon);
    const pt = pointAt(mon, port, state.dir, state.frame);
    let world = null;
    if (drawn && pt) {
      const ox = cx - drawn.dw / 2 + pt[0] * scale;
      const oy = cy - drawn.dh + 8 + pt[1] * scale;
      world = { x: ox, y: oy };
      if (state.showMarker) {
        ctx.fillStyle = '#22eeff';
        ctx.fillRect(Math.round(ox) - 2, Math.round(oy) - 2, 4, 4);
      }
      if (state.playFx && state.previewing) drawFx(mon, world, angle, state.previewAge, scale);
    }

    // Zoomed editable cell on the right half
    if (shoot) {
      const zoom = Math.min(8, Math.floor(220 / Math.max(shoot.w, shoot.h)));
      const zw = shoot.w * zoom, zh = shoot.h * zoom;
      const zx = w * 0.68 - zw / 2, zy = h * 0.42 - zh / 2;
      state.zoomCell = { zx, zy, zw, zh, zoom, shoot };
      ctx.fillStyle = '#0b1f27';
      ctx.fillRect(zx - 10, zy - 28, zw + 20, zh + 44);
      ctx.strokeStyle = '#4f8b7d';
      ctx.strokeRect(zx - 10, zy - 28, zw + 20, zh + 44);
      ctx.drawImage(shoot.image, state.frame * shoot.w, state.dir * shoot.h, shoot.w, shoot.h, zx, zy, zw, zh);
      if (pt) {
        ctx.fillStyle = '#22eeff';
        ctx.fillRect(zx + pt[0] * zoom - 2, zy + pt[1] * zoom - 2, 5, 5);
      }
      ctx.fillStyle = '#d8ffe8';
      ctx.font = '600 12px "IBM Plex Mono", monospace';
      ctx.fillText('FRAME ' + state.frame + ' · CLICK TO SET', zx - 4, zy - 10);
    }

    $('hud').textContent = [
      mon.name + ' · ' + (state.move === 'basic' ? mon.basic : mon.special),
      'dir ' + DIRS[state.dir].label + ' · frame ' + state.frame,
      'port ' + port + (pt ? ' · ' + pt[0] + ',' + pt[1] : ' · no point'),
      pack?.variant ? 'PMD ' + mon.id + '/' + pack.variant : 'loading'
    ].join('\n');
  }

  function updateMeta() {
    const mon = current();
    const pack = sprites[mon.id];
    const shoot = pack?.anims?.Shoot;
    const port = currentPort(mon);
    const pt = pointAt(mon, port, state.dir, state.frame);
    $('info').textContent = [
      mon.name,
      '기본 ' + mon.basic,
      '고유 ' + mon.special,
      pack?.loaded ? ('시트 ' + (pack.variant || 'root') + ' · Shoot ' + (shoot ? shoot.frames + 'f × ' + shoot.dirs + 'dir' : '없음')) : '로딩 중',
      shoot?.hitFrame != null ? ('HitFrame ' + shoot.hitFrame + ' · ReturnFrame ' + (shoot.returnFrame ?? '—')) : ''
    ].filter(Boolean).join('\n');
    $('coordMeta').textContent = pt
      ? mon.id + ' / ' + port + '\n방향 ' + state.dir + ' 프레임 ' + state.frame + '\n픽셀 ' + pt[0] + ', ' + pt[1]
      : '이 프레임에 저장된 발사점이 없습니다.';
  }
  function refreshExport() {
    $('jsonOut').value = window.exportPMDEmitterFramePoints?.() || '{}';
  }
  function refresh() {
    buildUi();
    buildStrip();
    updateMeta();
    refreshExport();
    render();
  }

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    const cell = state.zoomCell;
    if (!cell) return;
    if (x < cell.zx || y < cell.zy || x > cell.zx + cell.zw || y > cell.zy + cell.zh) return;
    const px = Math.round((x - cell.zx) / cell.zoom);
    const py = Math.round((y - cell.zy) / cell.zoom);
    setPoint(px, py);
    $('status').textContent = '발사점 저장 · ' + px + ', ' + py;
  });

  $('btnPlay').onclick = () => {
    state.playFx = !state.playFx;
    $('btnPlay').classList.toggle('active', state.playFx);
    $('btnPlay').textContent = state.playFx ? '미리보기 ON' : '미리보기 OFF';
  };
  $('btnMarker').onclick = () => {
    state.showMarker = !state.showMarker;
    $('btnMarker').classList.toggle('active', state.showMarker);
    $('btnMarker').textContent = state.showMarker ? '발사점 ON' : '발사점 OFF';
  };
  $('btnNudgeL').onclick = () => nudge(-1, 0);
  $('btnNudgeR').onclick = () => nudge(1, 0);
  $('btnNudgeU').onclick = () => nudge(0, -1);
  $('btnNudgeD').onclick = () => nudge(0, 1);
  $('btnResetPort').onclick = resetFrame;
  $('btnReplay').onclick = () => { state.previewAge = 0; state.previewing = true; $('status').textContent = '기술 재생'; };
  $('btnCopy').onclick = async () => {
    const json = window.exportPMDEmitterFramePoints?.() || '{}';
    try {
      await navigator.clipboard.writeText(json);
      $('status').textContent = '좌표 JSON을 복사했습니다.';
    } catch (err) {
      $('status').textContent = '클립보드 복사에 실패했습니다. 아래 텍스트를 직접 복사하세요.';
      $('jsonOut').focus();
      $('jsonOut').select();
    }
  };
  addEventListener('keydown', (event) => {
    if (event.target.matches('textarea,input')) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); nudge(-1, 0); }
    if (event.key === 'ArrowRight') { event.preventDefault(); nudge(1, 0); }
    if (event.key === 'ArrowUp') { event.preventDefault(); nudge(0, -1); }
    if (event.key === 'ArrowDown') { event.preventDefault(); nudge(0, 1); }
    if (event.key === ' ') { event.preventDefault(); state.previewAge = 0; state.previewing = true; }
    if (event.key === '[') { state.frame = Math.max(0, state.frame - 1); refresh(); }
    if (event.key === ']') {
      const shoot = sprites[current().id]?.anims?.Shoot;
      state.frame = Math.min((shoot?.frames || 1) - 1, state.frame + 1);
      refresh();
    }
  });

  function frame(now) {
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    state.clock += dt;
    if (state.previewing) {
      state.previewAge += dt;
      const life = current().moveId === 'flamethrower' ? 1.45 : 1.2;
      if (state.previewAge > life) {
        state.previewAge = 0;
        if (!state.playFx) state.previewing = false;
      }
    }
    render();
    requestAnimationFrame(frame);
  }

  (async function boot() {
    buildUi();
    $('status').textContent = 'PMD 시트 연결 중…';
    await Promise.all(ROSTER.map((mon) => preload(mon.id, mon.variants)));
    const ready = ROSTER.filter((mon) => sprites[mon.id]?.loaded).length;
    $('status').textContent = '로드 완료 · ' + ready + '/' + ROSTER.length;
    refresh();
    requestAnimationFrame(frame);
  })();
})();
