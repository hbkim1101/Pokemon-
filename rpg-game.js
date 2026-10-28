(() => {
  'use strict';

  const SAVE_KEY = 'pokemon-rpg-web-save-v1';
  const W = 640, H = 360;
  const SPECIES = {
    '0001': { name: '이상해씨', icon: '🌱', color: '#7bc884', note: '풀 타입' },
    '0004': { name: '파이리', icon: '🔥', color: '#f18955', note: '불꽃 타입' },
    '0007': { name: '꼬부기', icon: '💧', color: '#69b9e5', note: '물 타입' }
  };
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const title = document.getElementById('title');
  const namePrompt = document.getElementById('namePrompt');
  const starterPrompt = document.getElementById('starterPrompt');
  const dialog = document.getElementById('dialog');
  const battleView = document.getElementById('battleView');
  const battleFrame = document.getElementById('battleFrame');
  const battleReturn = document.getElementById('battleReturn');
  const keys = new Set();
  const justPressed = new Set();
  const obstacles = [
    {x:45,y:46,w:120,h:40}, {x:475,y:46,w:120,h:40},
    {x:77,y:135,w:95,h:42}, {x:469,y:135,w:95,h:42},
    {x:250,y:78,w:140,h:38}, {x:0,y:0,w:16,h:H}, {x:624,y:0,w:16,h:H}
  ];
  const starterPositions = [
    {id:'0001',x:294,y:153}, {id:'0004',x:320,y:153}, {id:'0007',x:346,y:153}
  ];
  let state = loadSave() || freshState();
  let lastFrame = 0;
  let clock = 0;
  let dialogueQueue = [];
  let dialogueDone = null;
  let debug = new URLSearchParams(location.search).has('debug');

  function freshState() {
    return { version:1, scene:'title', name:'지우', x:320, y:280, facing:'up', starter:'', won:false, introSeen:false };
  }
  function loadSave() {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!data || data.version !== 1 || !['title','lab','starter','battle','postBattle'].includes(data.scene)) return null;
      return {...freshState(), ...data};
    } catch { return null; }
  }
  function save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    setNotice('진행 상황을 이 브라우저에 저장했습니다.');
  }
  function setNotice(text) {
    const node = document.getElementById('notice');
    node.textContent = text;
    clearTimeout(setNotice.timer);
    setNotice.timer = setTimeout(() => { node.textContent = ''; }, 3200);
  }
  function updateHud() {
    document.getElementById('trainerLabel').textContent = state.name || '트레이너';
    document.getElementById('partyLabel').textContent = state.starter
      ? `${SPECIES[state.starter]?.name || '파트너'} · Lv. 5 · HP 보존`
      : '아직 파트너가 없습니다';
    document.getElementById('sceneName').textContent = state.scene === 'postBattle' ? '연구소 · 첫 라이벌전 완료' : '연구소 · 첫 파트너를 만나는 날';
  }
  function startNewGame() {
    state = freshState();
    state.scene = 'lab';
    state.x = 320; state.y = 276;
    saveSilently(); updateHud(); title.hidden = true; namePrompt.hidden = false;
    document.getElementById('trainerName').value = state.name;
    document.getElementById('trainerName').focus();
  }
  function saveSilently() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
  }
  function showContinue() {
    const canContinue = !!loadSave();
    document.getElementById('continueGame').hidden = !canContinue;
    document.getElementById('quickStart').hidden = !debug;
    document.getElementById('checkpointButton').hidden = !debug;
    document.getElementById('debug').hidden = !debug;
    if (canContinue) document.getElementById('continueGame').textContent = `이어서 하기 · ${loadSave().name || '트레이너'}`;
  }
  function hideAllPanels() {
    title.hidden = true; namePrompt.hidden = true; starterPrompt.hidden = true; battleReturn.hidden = true; dialog.hidden = true;
  }
  function beginDialogue(lines, done) {
    dialogueQueue = lines.slice(); dialogueDone = done || null;
    showDialogueLine();
    canvas.focus();
  }
  function showDialogueLine() {
    if (!dialogueQueue.length) {
      dialog.hidden = true;
      const done = dialogueDone; dialogueDone = null;
      done?.();
      return;
    }
    const item = dialogueQueue.shift();
    document.getElementById('speaker').textContent = item.speaker;
    document.getElementById('line').textContent = item.text;
    dialog.hidden = false;
  }
  function advanceDialogue() { if (!dialog.hidden) { showDialogueLine(); if (dialog.hidden) canvas.focus(); } }
  function enterLab(withIntro = true) {
    hideAllPanels(); battleView.hidden = true; state.scene = state.won ? 'postBattle' : 'lab';
    if (!state.x || state.x < 200 || state.x > 430 || state.y < 200) { state.x = 320; state.y = 280; }
    updateHud(); saveSilently(); canvas.focus();
    if (withIntro && !state.introSeen) {
      beginDialogue([
        {speaker:'오박사',text:`어서 오렴, ${state.name || '트레이너'}! 오늘은 네 첫 파트너를 만나는 날이란다.`},
        {speaker:'오박사',text:'연구소를 둘러보고 중앙의 몬스터볼을 살펴보렴. 파트너를 고르면 라이벌과 첫 대결이 시작돼.'},
        {speaker:'안내',text:'방향키 또는 WASD로 이동 · E 또는 Enter로 조사 · Space로 대화 넘기기'}
      ], () => { state.introSeen = true; saveSilently(); });
    } else if (state.scene === 'postBattle') {
      beginDialogue([{speaker:'오박사',text:state.won ? '첫 대결을 훌륭하게 치렀구나! 이제 너와 파트너의 모험이 시작된단다.' : '아쉽지만 괜찮아. 파트너와 함께 다시 도전해 보렴.'}], () => {});
    }
  }
  function interact() {
    if (!dialog.hidden) { advanceDialogue(); return; }
    if (state.won) {
      beginDialogue([{speaker:'오박사',text:'첫 라이벌전은 끝났어. 파트너와 함께 연구소 문을 나서면 새로운 모험이 기다리고 있단다.'}]);
      return;
    }
    const nearProfessor = Math.hypot(state.x - 320, state.y - 126) < 78;
    const nearBalls = Math.hypot(state.x - 320, state.y - 178) < 62;
    if (nearProfessor || nearBalls) {
      if (!state.starter) openStarterPicker();
      else if (!state.won) beginDialogue([{speaker:'오박사',text:`${SPECIES[state.starter].name}을(를) 데리고 라이벌에게 다시 도전하자.`}], launchBattle);
      else beginDialogue([{speaker:'오박사',text:`${SPECIES[state.starter].name}과 함께라면 어디든 갈 수 있단다.`}]);
    } else if (state.x < 210 && state.y < 190) {
      beginDialogue([{speaker:'안내',text:'연구 장비가 정리되어 있다. 중앙의 몬스터볼을 살펴보자.'}]);
    } else {
      beginDialogue([{speaker:'안내',text:'오박사의 연구소다. 중앙 테이블의 몬스터볼을 조사해 보자.'}]);
    }
  }
  function openStarterPicker() {
    starterPrompt.hidden = false;
    const host = document.getElementById('starterChoices'); host.replaceChildren();
    for (const id of Object.keys(SPECIES)) {
      const mon = SPECIES[id];
      const button = document.createElement('button');
      button.className = 'choice';
      button.innerHTML = `<span aria-hidden="true">${mon.icon}</span><b>${mon.name}</b><small>${mon.note}</small>`;
      button.addEventListener('click', () => chooseStarter(id));
      host.append(button);
    }
  }
  function chooseStarter(id) {
    state.starter = id; state.scene = 'starter'; saveSilently(); updateHud();
    starterPrompt.hidden = true;
    beginDialogue([
      {speaker:'오박사',text:`${SPECIES[id].name}을(를) 파트너로 골랐구나! 멋진 선택이야.`},
      {speaker:'라이벌',text:'잠깐! 첫 파트너를 골랐으면 실력을 겨뤄 봐야지. 지금 배틀하자!'}
    ], launchBattle);
  }
  function launchBattle() {
    state.scene = 'battle'; saveSilently(); hideAllPanels(); updateHud();
    battleView.hidden = false;
    const ticket = Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2,'0')).join('');
    const query = new URLSearchParams({starter:state.starter, mode:'rpg', ticket, embedded:'1', v:'web-rpg-1'});
    battleFrame.src = `/index.html?${query}`;
    battleFrame.onload = () => battleFrame.contentWindow?.focus();
  }
  function finishBattle(data) {
    battleView.hidden = true; battleReturn.hidden = false;
    state.scene = 'postBattle'; state.won = !!data.won;
    saveSilently(); updateHud();
    document.getElementById('resultTitle').textContent = state.won ? '첫 승리!' : '다시 도전';
    document.getElementById('resultText').textContent = state.won
      ? `${SPECIES[state.starter]?.name || '파트너'}와 함께 첫 라이벌전을 이겼습니다. 연구소 장면으로 돌아가 진행을 이어갑니다.`
      : '라이벌과의 첫 대결에서 졌습니다. 파트너의 HP가 회복된 상태로 다시 도전할 수 있습니다.';
    document.getElementById('retryBattle').hidden = state.won;
  }
  function retryBattle() { state.won = false; launchBattle(); }
  function drawRoom() {
    ctx.fillStyle='#d6c8a4';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#667d68';ctx.fillRect(0,0,W,54);
    ctx.fillStyle='#465d50';ctx.fillRect(0,50,W,7);
    for(let y=58;y<H;y+=32)for(let x=0;x<W;x+=32){
      ctx.fillStyle=((x/32+y/32)%2)?'#b5aa8c':'#c5b996';ctx.fillRect(x,y,32,32);
      ctx.fillStyle='#9b957e';ctx.fillRect(x,y,32,1);ctx.fillRect(x,y,1,32);
    }
    // Wall charts and windows
    ctx.fillStyle='#152b2d';ctx.fillRect(34,13,86,31);ctx.fillRect(520,13,86,31);
    ctx.fillStyle='#b5d9c1';ctx.fillRect(39,17,76,22);ctx.fillRect(525,17,76,22);
    ctx.fillStyle='#dce7c5';ctx.fillRect(76,17,2,22);ctx.fillRect(39,27,76,2);ctx.fillRect(562,17,2,22);ctx.fillRect(525,27,76,2);
    ctx.fillStyle='#ece0be';ctx.fillRect(194,10,252,37);ctx.strokeStyle='#5c705f';ctx.strokeRect(194.5,10.5,251,36);
    ctx.fillStyle='#405b4d';ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillText('POKÉMON  RESEARCH LAB',320,27);
    ctx.font='9px monospace';ctx.fillStyle='#536453';ctx.fillText('PALLET TOWN',320,40);
    // Work tables
    drawDesk(45,54,120,34,'#674b36');drawDesk(475,54,120,34,'#674b36');
    drawMachine(56,94,'PC','#8cc8b5');drawMachine(532,94,'DATA','#e3cb75');
    drawDesk(77,135,95,42,'#805739');drawDesk(469,135,95,42,'#805739');
    drawDesk(250,78,140,38,'#75503a');
    ctx.fillStyle='#483d33';ctx.fillRect(256,78,128,11);
    ctx.fillStyle='#c8d4b3';ctx.fillRect(264,65,112,22);
    ctx.fillStyle='#799881';ctx.fillRect(268,68,104,15);
    ctx.fillStyle='#fff1b4';ctx.fillRect(271,71,98,9);
    ctx.font='8px monospace';ctx.fillStyle='#415747';ctx.textAlign='center';ctx.fillText('STARTER POKÉ BALLS',320,78);
    for(const p of starterPositions){const mon=SPECIES[p.id];ctx.fillStyle='#fff4d9';ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle=mon.color;ctx.beginPath();ctx.arc(p.x,p.y,5,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#4b5145';ctx.fillRect(p.x-5,p.y,10,1.5);ctx.fillStyle='#f9f4df';ctx.fillRect(p.x-1,p.y-1,2,2);}
    // Professor and floor markers
    drawProfessor(320,126);
    ctx.fillStyle='#758873';ctx.fillRect(300,311,40,5);ctx.fillStyle='#d0c697';ctx.fillRect(305,316,30,5);
    ctx.fillStyle='#526857';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText('LAB EXIT',320,340);
    ctx.textAlign='left';
  }
  function drawDesk(x,y,w,h,color){ctx.fillStyle='#0003';ctx.fillRect(x+3,y+h-2,w,h?8:4);ctx.fillStyle=color;ctx.fillRect(x,y,w,h);ctx.fillStyle='#aa8053';ctx.fillRect(x,y,w,5);ctx.fillStyle='#4c3d31';ctx.fillRect(x+7,y+h,5,7);ctx.fillRect(x+w-12,y+h,5,7);ctx.fillStyle='#dfcca3';ctx.fillRect(x+8,y+11,w-16,2);}
  function drawMachine(x,y,label,light){ctx.fillStyle='#455d54';ctx.fillRect(x,y,48,31);ctx.fillStyle='#253b3b';ctx.fillRect(x+5,y+4,38,18);ctx.fillStyle=light;ctx.fillRect(x+8,y+7,32,12);ctx.fillStyle='#d9e4bf';ctx.fillRect(x+8,y+24,8,3);ctx.fillStyle='#bed0b8';ctx.font='6px monospace';ctx.textAlign='center';ctx.fillText(label,x+25,y+21);ctx.textAlign='left';}
  function drawProfessor(x,y){
    ctx.fillStyle='#0003';ctx.fillRect(x-12,y+18,24,5);
    ctx.fillStyle='#d8ddc8';ctx.fillRect(x-10,y-3,20,19);ctx.fillStyle='#f1eee0';ctx.fillRect(x-8,y-2,16,16);
    ctx.fillStyle='#658d89';ctx.fillRect(x-3,y-1,6,15);ctx.fillStyle='#9c7556';ctx.fillRect(x-5,y-15,10,12);
    ctx.fillStyle='#d7c2a2';ctx.fillRect(x-5,y-13,10,9);ctx.fillStyle='#66533e';ctx.fillRect(x-5,y-15,10,3);
    ctx.fillStyle='#3b433c';ctx.fillRect(x-3,y-9,2,2);ctx.fillRect(x+3,y-9,2,2);
    ctx.fillStyle='#363d39';ctx.fillRect(x-9,y+15,7,6);ctx.fillRect(x+2,y+15,7,6);
    ctx.fillStyle='#283a35';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText('오박사',x,y-22);ctx.textAlign='left';
  }
  function drawPlayer() {
    const x=Math.round(state.x),y=Math.round(state.y),step=Math.floor(clock*8)%2;
    ctx.fillStyle='#0004';ctx.fillRect(x-8,y+8,16,4);
    ctx.fillStyle='#27352f';ctx.fillRect(x-6,y+2,5,8+step);ctx.fillRect(x+1,y+2,5,9-step);
    ctx.fillStyle='#e2a66c';ctx.fillRect(x-7,y-14,14,14);
    ctx.fillStyle='#293d45';ctx.fillRect(x-8,y-18,16,5);ctx.fillRect(x-6,y-21,12,4);
    ctx.fillStyle='#347e78';ctx.fillRect(x-8,y-1,16,12);ctx.fillStyle='#e4d89c';ctx.fillRect(x-2,y,4,8);
    ctx.fillStyle='#e8c09a';if(state.facing==='left')ctx.fillRect(x-8,y-10,3,4);else if(state.facing==='right')ctx.fillRect(x+5,y-10,3,4);else{ctx.fillStyle='#354039';ctx.fillRect(x-4,y-9,2,2);ctx.fillRect(x+2,y-9,2,2);}
    if(!dialog.hidden){ctx.fillStyle='#fff1b7';ctx.fillRect(x-2,y-29,4,4);ctx.fillRect(x-1,y-33,2,3);}
  }
  function draw() { drawRoom(); drawPlayer(); }
  function movePlayer(dt) {
    if (!title.hidden || !namePrompt.hidden || !starterPrompt.hidden || !dialog.hidden || !battleView.hidden) return;
    let dx=0,dy=0;
    if(keys.has('arrowleft')||keys.has('a'))dx--;
    if(keys.has('arrowright')||keys.has('d'))dx++;
    if(keys.has('arrowup')||keys.has('w'))dy--;
    if(keys.has('arrowdown')||keys.has('s'))dy++;
    if(!dx&&!dy)return;
    const mag=Math.hypot(dx,dy);dx/=mag;dy/=mag;state.facing=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
    const speed=116; const nx=state.x+dx*speed*dt,ny=state.y+dy*speed*dt;
    const collides=(x,y)=>{
      if(x<20||x>620||y<24||y>337)return true;
      if(Math.hypot(x-320,y-126)<24)return true;
      return obstacles.some(o=>x+6>o.x&&x-6<o.x+o.w&&y+4>o.y&&y-8<o.y+o.h);
    };
    if(!collides(nx,state.y))state.x=nx;
    if(!collides(state.x,ny))state.y=ny;
    state._saveTimer=(state._saveTimer||0)+dt;
    if(state._saveTimer>.75){state._saveTimer=0;saveSilently();}
  }
  function frame(time) {
    const dt=Math.min(.05,lastFrame?(time-lastFrame)/1000:0);lastFrame=time;clock+=dt;
    movePlayer(dt);draw();
    for(const key of [...justPressed]) justPressed.delete(key);
    requestAnimationFrame(frame);
  }
  function checkpoint(where) {
    hideAllPanels();battleView.hidden=true;state.won=false;
    if(where==='intro'){state.scene='lab';state.introSeen=false;state.starter='';enterLab(true);}
    if(where==='lab'){state.scene='lab';state.introSeen=true;state.starter='';state.x=320;state.y=276;enterLab(false);}
    if(where==='starter'){state.scene='lab';state.introSeen=true;state.starter='';state.x=320;state.y=210;enterLab(false);openStarterPicker();}
    if(where==='battle'){state.scene='starter';state.introSeen=true;if(!state.starter)state.starter='0004';launchBattle();}
    saveSilently();
  }
  document.getElementById('newGame').addEventListener('click',startNewGame);
  document.getElementById('continueGame').addEventListener('click',()=>{state=loadSave()||freshState();if(state.scene==='battle'&&state.starter){launchBattle();return;}enterLab(!state.introSeen);});
  document.getElementById('quickStart').addEventListener('click',()=>{state=freshState();state.scene='lab';state.introSeen=true;enterLab(false);openStarterPicker();});
  document.getElementById('confirmName').addEventListener('click',()=>{state.name=(document.getElementById('trainerName').value.trim()||'트레이너').slice(0,10);namePrompt.hidden=true;saveSilently();updateHud();beginDialogue([{speaker:'오박사',text:`반갑구나, ${state.name}! 연구소 중앙에 파트너 후보가 기다리고 있단다.`}],()=>{state.introSeen=true;saveSilently();});canvas.focus();});
  document.getElementById('next').addEventListener('click',advanceDialogue);
  document.getElementById('saveButton').addEventListener('click',save);
  document.getElementById('continueStory').addEventListener('click',()=>{battleReturn.hidden=true;enterLab(false);});
  document.getElementById('retryBattle').addEventListener('click',retryBattle);
  document.getElementById('exitButton').addEventListener('click',()=>{battleView.hidden=true;hideAllPanels();title.hidden=false;state.scene='title';saveSilently();showContinue();});
  document.getElementById('checkpointButton').addEventListener('click',()=>document.getElementById('debug').hidden=!document.getElementById('debug').hidden);
  document.querySelectorAll('[data-checkpoint]').forEach(button=>button.addEventListener('click',()=>checkpoint(button.dataset.checkpoint)));
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==battleFrame.contentWindow)return;
    if(event.data?.type==='arena-rpg-result')finishBattle(event.data);
  });
  window.addEventListener('keydown',event=>{
    if(event.target instanceof HTMLElement && event.target.closest('button,input,select,textarea'))return;
    const key=event.key.toLowerCase();
    if(['arrowleft','arrowright','arrowup','arrowdown',' ','enter'].includes(key))event.preventDefault();
    if(!keys.has(key))justPressed.add(key);keys.add(key);
    if(['e','enter',' '].includes(key)&&!event.repeat){if(!dialog.hidden)advanceDialogue();else if(!title.hidden)startNewGame();else if(!namePrompt.hidden)document.getElementById('confirmName').click();else if(starterPrompt.hidden)interact();}
  });
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur',()=>keys.clear());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear();});
  showContinue();updateHud();
  if(debug)document.getElementById('debug').hidden=false;
  requestAnimationFrame(frame);
})();
