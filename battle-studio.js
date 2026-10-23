'use strict';
(function studioModule(){
'use strict';
const css=document.createElement('style');
css.textContent=`
/* Motion Studio / four-move lock, v22 */
body .skill[data-n="3"],body .skill[data-n="4"],body .loadoutSetup{display:none!important}
body .buttons{grid-template-columns:repeat(2,clamp(46px,13vw,65px))!important;grid-template-rows:repeat(2,clamp(46px,13vw,65px))!important;gap:6px!important;align-items:center!important}
body .buttons .skill[data-n="1"]{grid-column:1!important;grid-row:1!important}
body .buttons .skill[data-n="0"]{grid-column:2!important;grid-row:2!important}
body .buttons .skill[data-n="2"]{grid-column:1!important;grid-row:2!important}
@media(max-width:390px){body .buttons{padding:8px 6px!important}body .buttons .skill{max-width:100%;max-height:100%}}
body.studio-open #hud,body.studio-open #controls,body.studio-open #toast,body.studio-open #tips,body.studio-open #aimHelp,body.studio-open #roundBadge,body.studio-open #comboBadge{display:none!important}
#openMotionStudio{margin:9px auto 3px;border:1px solid #70dbb9;background:#113747;color:#f0fffa;padding:11px 16px;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer}
#motionStudio{display:none;position:fixed;inset:0;z-index:190;pointer-events:none;font-family:system-ui,sans-serif;color:#ecfffc}
body.studio-open #motionStudio{display:block}
#motionStudio .studioHead{position:absolute;top:max(12px,env(safe-area-inset-top));left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;text-shadow:0 2px 3px #001b28}
#motionStudio .studioHead strong{font-size:clamp(17px,3.5vw,25px);letter-spacing:.6px}
#motionStudio .studioHead small{display:block;color:#a8e6dc;font-size:10px;margin-top:5px;max-width:400px}
#motionStudio .studioPanel{position:absolute;bottom:0;left:0;right:0;max-height:min(54vh,440px);overflow-y:auto;padding:12px 13px max(18px,env(safe-area-inset-bottom));background:linear-gradient(180deg,#112f3bf0,#061c2af9);border-top:1px solid #66ccb8a6;pointer-events:auto;box-shadow:0 -10px 35px #0006}
#motionStudio .studioGroup{margin:0 auto 9px;max-width:800px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:5px}
#motionStudio button{border:1px solid #477c83;background:#173947;color:#e2f6f5;border-radius:6px;padding:8px 10px;font-size:11px;font-weight:800;cursor:pointer;touch-action:manipulation}
#motionStudio button.active{background:#dfebaa;color:#183329;border-color:#fff2a7}
#motionStudio button:focus-visible{outline:2px solid #fff}
#motionStudio .sLabel{min-width:50px;font-size:10px;font-weight:900;color:#a9e9d7;text-align:left}
#motionStudio .studioExit{pointer-events:auto;border-color:#d4aaaa;background:#4a242b;min-width:64px}
#motionStudio .studioMeta{font-size:10px;color:#c8ded8;text-align:center;line-height:1.65;margin:4px}#motionStudio #studioAudit{color:#b8efd6;max-width:730px;margin:auto}
#motionStudio .studioSpeed{display:inline-flex;align-items:center;gap:6px;font-size:11px}
#motionStudio input[type=range]{max-width:110px;accent-color:#d1f18f}
@media(max-width:520px){#motionStudio .studioPanel{max-height:60vh;padding:8px 7px max(15px,env(safe-area-inset-bottom))}#motionStudio .studioGroup{gap:3px;margin-bottom:5px}#motionStudio button{padding:7px 6px;font-size:10px}#motionStudio .sLabel{min-width:35px;font-size:9px}}
`;
document.head.append(css);
const studioNode=document.createElement('div');
studioNode.id='motionStudio';
studioNode.setAttribute('role','region');
studioNode.setAttribute('aria-label','포켓몬 8방향 스프라이트 및 기술 모션 테스트');
studioNode.innerHTML=`
<div class="studioHead"><div><strong>⚙ 모션 · 이펙트 스튜디오</strong><small>PMD 8방향 원본 프레임 / 이동 · 공격 · 피격 / 전용 기술 미리보기</small></div><button class="studioExit" id="studioExit">돌아가기 ✕</button></div>
<div class="studioPanel">
<div class="studioGroup" id="studioActors"><span class="sLabel">포켓몬</span>
<button data-actor="0">⚡ 라이츄</button><button data-actor="1">🔥 리자몽</button><button data-actor="2">💧 거북왕</button><button data-actor="3">🍃 이상해꽃</button></div>
<div class="studioGroup" id="studioActions"><span class="sLabel">모션</span>
<button data-action="Idle">대기</button><button data-action="Walk">이동</button><button data-action="Attack">몸통 공격 · 돌진</button><button data-action="Shoot">원거리 공격 · 발사</button><button data-action="Charge">기 모으기</button><button data-action="Hurt">피격</button></div>
<div class="studioGroup" id="studioDirections"><span class="sLabel">방향</span>
<button data-dir="5">↖</button><button data-dir="4">↑</button><button data-dir="3">↗</button><button data-dir="6">←</button><button data-dir="2">→</button><button data-dir="7">↙</button><button data-dir="0">↓</button><button data-dir="1">↘</button></div>
<div class="studioGroup"><span class="sLabel">기술</span><button data-test="basic">기본 공격</button><button data-test="special">고유 기술</button><button data-test="dash">돌진 동작 시험</button><button id="studioAnchors" aria-pressed="true">발사점 표시 ON</button><button id="studioCompare" aria-pressed="false">8방향 동시 비교</button><button id="studioReplay">현재 모션 다시</button><button id="studioCycle">전체 자동 순회</button><button id="studioStop">순회 중단</button><button id="studioAuditBtn">원본 프레임 검사</button><button id="studioFreeze" aria-pressed="false">프레임 고정 OFF</button><label class="studioSpeed">프레임 <input type="range" id="studioFrame" min="0" max="17" value="0" step="1"><span id="studioFrameLabel">1/18</span></label>
<label class="studioSpeed">재생 속도 <input type="range" id="studioSpeed" min="0.25" max="2" step=".25" value="1"><span id="studioSpeedLabel">1.0×</span></label></div>
<div class="studioGroup" id="studioPointEditor"><span class="sLabel">좌표 보정</span><button id="studioPort">발사점 선택</button><button data-point-move="-1,0" aria-label="발사점 왼쪽 1픽셀">← 1px</button><button data-point-move="1,0" aria-label="발사점 오른쪽 1픽셀">→ 1px</button><button data-point-move="0,-1" aria-label="발사점 위로 1픽셀">↑ 1px</button><button data-point-move="0,1" aria-label="발사점 아래로 1픽셀">↓ 1px</button><button id="studioCopyCoords">전체 좌표 복사</button></div><p class="studioMeta" id="studioMeta" aria-live="polite">스프라이트 정보 확인 중…</p><p class="studioMeta" id="studioAudit" aria-live="polite">검사하면 캐릭터별 원본 8방향 모션 누락을 표시합니다.</p>
</div>`;
document.body.append(studioNode);
const launcher=document.createElement('button');
launcher.id='openMotionStudio';
launcher.type='button';
launcher.textContent='🎞 인게임 모션 테스트';
$('start').insertAdjacentElement('afterend',launcher);
const studioPageLink=document.createElement('a');
studioPageLink.className='studioLink';
studioPageLink.href='./studio.html';
studioPageLink.textContent='기술 스프라이트 스튜디오 · 발사점 다듬기';
launcher.insertAdjacentElement('afterend',studioPageLink);
const state={open:false,previous:'menu',menuVisible:true,kind:0,action:'Idle',dir:0,clock:0,last:0,speed:1,preview:null,auto:false,autoIndex:0,autoTime:0,completed:false,compare:false,anchors:true,freezeFrame:false,frameIndex:0,portIndex:0};
// PMD sprite-sheet row order: S, SE, E, NE, N, NW, W, SW.
const faces=[Math.PI/2,Math.PI/4,0,-Math.PI/4,-Math.PI/2,-3*Math.PI/4,Math.PI,3*Math.PI/4];
const faceLabels=['↓','↘','→','↗','↑','↖','←','↙'];
const faceNames=['남','남동','동','북동','북','북서','서','남서'];
const testActions=['Idle','Walk','Attack','Shoot','Charge','Hurt'];
const motionExplanations={Idle:'대기',Walk:'이동',Attack:'근접 타격·몸통 돌진',Shoot:'원거리 공격·기술 발사',Charge:'기 모으기·준비 자세',Hurt:'피격'};
function meta(){
 const sp=roster[state.kind],pack=sprites[sp.id],sheet=pack?.anims[state.action],fallback=pack?.anims.Walk||pack?.anims.Idle;
 const active=sheet||fallback;
 const atlas=sheet?`${sheet.frames}프레임 · ${sheet.dirs}방향 · ${pack.variant||'기본 버전'}`:active?`해당 액션 원본 없음 (대체 모션 ${active.frames}프레임)`:'원본 로딩 대기 / 대체 이미지';
 const special=MOVE_SPECS[sp.type];
  const frameSheet=pack?.anims?.[state.action],count=frameSheet?Math.max(1,Math.min(frameSheet.frames,frameSheet.dur?.length||frameSheet.frames)):1;
  state.frameIndex=Math.min(state.frameIndex,count-1);
  $('studioFrame').max=String(count-1);$('studioFrame').value=String(state.frameIndex);
  $('studioFrameLabel').textContent=(state.frameIndex+1)+'/'+count;
  $('studioFreeze').textContent=state.freezeFrame?'프레임 고정 ON':'프레임 고정 OFF';
  $('studioFreeze').classList.toggle('active',state.freezeFrame);
  $('studioFreeze').setAttribute('aria-pressed',String(state.freezeFrame));
  const names=window.PMD_EMISSION_ATLAS?.[sp.id]?.channels?.[MOVE_SPECS[sp.type].id]||['body'];
  state.portIndex%=Math.max(1,names.length);
  $('studioPort').textContent='발사점: '+names[state.portIndex];
  $('studioPointEditor').style.display=state.action==='Shoot'?'flex':'none';
 $('studioMeta').textContent=`${sp.name} · ${state.action} · ${faceLabels[state.dir]} · PMD ${atlas} · ${motionExplanations[state.action]} · 기본: ${sp.basic} / 고유: ${special.name}${state.auto?' · 전체 자동 검사 중':''}${state.completed?' · 전체 순회 완료':''}`;
 for(const btn of studioNode.querySelectorAll('[data-actor]'))btn.classList.toggle('active',+btn.dataset.actor===state.kind);
 for(const btn of studioNode.querySelectorAll('[data-action]'))btn.classList.toggle('active',btn.dataset.action===state.action);
 for(const btn of studioNode.querySelectorAll('[data-dir]'))btn.classList.toggle('active',+btn.dataset.dir===state.dir);
 $('studioAnchors').classList.toggle('active',state.anchors);
 $('studioAnchors').textContent=state.anchors?'발사 좌표 표시 ON':'발사점 표시 OFF';
 $('studioAnchors').setAttribute('aria-pressed',String(state.anchors));
 $('studioCompare').classList.toggle('active',state.compare);
 $('studioCompare').setAttribute('aria-pressed',String(state.compare));
}
function audit(){
  let valid=0,total=0;const missing=[];
  for(const character of roster)for(const action of testActions){
   const sheet=sprites[character.id]?.anims?.[action];
   for(let direction=0;direction<8;direction++){
    total++;
    if(sheet?.image&&sheet.frames>0&&sheet.dirs>direction)valid++;
    else missing.push(character.name+'/'+action+'/'+faceNames[direction]);
   }
  }
  const ready=roster.filter(c=>sprites[c.id]?.loaded).length;
  const summary=`원본 방향·모션 셀 ${valid}/${total} · 로딩 완료 ${ready}/4종`;
  $('studioAudit').textContent=missing.length?`${summary} · 미사용 원본 ${missing.length}개: ${missing.slice(0,6).join(', ')}${missing.length>6?' 외 '+(missing.length-6)+'개':''} · 누락은 대체 모션으로 재생`:`${summary} · 전부 원본 8방향 확인`;
  return {valid,total,missing};
 }
 function select(kind=state.kind,action=state.action,dir=state.dir){
 state.kind=kind;state.action=action;state.dir=dir;state.clock=0;state.frameIndex=0;state.portIndex=0;state.preview=null;meta();
}
function open(){
 if(state.open)return;
 state.previous=gameState;state.menuVisible=!$('menu').classList.contains('hidden');
 state.open=true;state.last=performance.now();state.auto=false;state.completed=false;state.compare=false;
 gameState='studio';stopPlayerChannel();$('menu').classList.add('hidden');document.body.classList.add('studio-open');
 select(chosen,'Idle',0);audit();
}
function close(){
 if(!state.open)return;
 state.open=false;state.preview=null;state.auto=false;
 gameState=state.previous;
 document.body.classList.remove('studio-open');
 if(state.menuVisible)$('menu').classList.remove('hidden');
}
function attack(which){
 state.auto=false;state.completed=false;state.compare=false;
 const t=roster[state.kind].type;
 state.action=which==='dash'?'Attack':which==='basic'?'Shoot':signatureAnimation(t);state.clock=0;
 state.preview={type:which==='dash'?'dash':which==='basic'?'basic':MOVE_SPECS[t].id,age:0,life:which==='dash'?.65:which==='basic'?1.25:t==='fire'?1.45:1.25};
 meta();
}
launcher.addEventListener('click',open);
$('studioExit').addEventListener('click',close);
try{if(String(location.search||'').indexOf('studio')>=0)addEventListener('load',()=>setTimeout(open,80))}catch(err){}
studioNode.addEventListener('click',(e)=>{
 const btn=e.target.closest('button');if(!btn)return;
 if(btn.dataset.actor!==undefined){state.auto=false;state.completed=false;select(+btn.dataset.actor);return;}
 if(btn.dataset.action!==undefined){state.auto=false;state.completed=false;select(undefined===state.kind?0:state.kind,btn.dataset.action);return;}
 if(btn.dataset.dir!==undefined){state.auto=false;state.completed=false;select(state.kind,state.action,+btn.dataset.dir);return;}
 if(btn.dataset.test)attack(btn.dataset.test);
 if(btn.id==='studioAnchors'){state.anchors=!state.anchors;meta();}
 if(btn.id==='studioCompare'){state.compare=!state.compare;state.auto=false;state.preview=null;state.completed=false;meta();}
 if(btn.id==='studioReplay'){state.auto=false;state.completed=false;select();}
 if(btn.id==='studioCycle'){state.auto=true;state.compare=false;state.completed=false;state.autoIndex=0;state.autoTime=0;select(0,'Idle',0);}
 if(btn.id==='studioStop'){state.auto=false;meta();}
 if(btn.id==='studioAuditBtn')audit();
 if(btn.id==='studioPort'){
  const sp=roster[state.kind],ports=window.PMD_EMISSION_ATLAS?.[sp.id]?.channels?.[MOVE_SPECS[sp.type].id]||['body'];
  state.portIndex=(state.portIndex+1)%ports.length;meta();
 }
 if(btn.dataset.pointMove){
  const sp=roster[state.kind],atlas=window.PMD_EMISSION_ATLAS?.[sp.id];
  const ports=atlas?.channels?.[MOVE_SPECS[sp.type].id]||[];
  const port=ports[state.portIndex],xy=atlas?.ports?.[port]?.frames?.[state.dir]?.[state.frameIndex];
  if(!xy)return;
  const [dx,dy]=btn.dataset.pointMove.split(',').map(Number);
  window.setPMDEmitterFramePoint?.(sp.id,port,state.dir,state.frameIndex,xy[0]+dx,xy[1]+dy);
  state.freezeFrame=true;state.preview=null;meta();
 }
 if(btn.id==='studioCopyCoords'){
  const json=window.exportPMDEmitterFramePoints?.()||'{}';
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(json).then(
   ()=>$('studioAudit').textContent='전체 스프라이트 좌표 JSON을 복사했습니다.',
   ()=>$('studioAudit').textContent='클립보드 권한이 거부됐습니다. HTTPS 연결에서 다시 시도하세요.'
  );
  else $('studioAudit').textContent='브라우저에서 클립보드 복사가 지원되지 않습니다.';
 }
 if(btn.id==='studioFreeze'){state.freezeFrame=!state.freezeFrame;state.preview=null;state.clock=0;meta();}
});
$('studioSpeed').addEventListener('input',e=>{state.speed=Number(e.target.value)||1;$('studioSpeedLabel').textContent=state.speed.toFixed(2)+'×';});
 $('studioFrame').addEventListener('input',e=>{state.frameIndex=Number(e.target.value)||0;state.freezeFrame=true;state.preview=null;state.clock=0;meta();});
addEventListener('keydown',e=>{if(state.open && (e.key==='Escape'||e.key.toLowerCase()==='p')){e.preventDefault();close();} });
function studioEmitters(x,y,a,clock,scale,move){
 const sp=roster[state.kind],avatar={x,y,kind:state.kind,id:sp.id,type:sp.type,face:a,action:'Shoot',animT:clock,actionT:clock};
 return emissionWorldPoints(avatar,move||MOVE_SPECS[sp.type].id,{action:'Shoot',clock,angle:a,scale,
   phase:move==='flamethrower'&&clock>=flameShootTiming(sp.id).windup?'hold':'cast'});
}
function studioFrameClock(){
  if(!state.freezeFrame)return state.clock;
  const id=roster[state.kind].id,s=sprites[id]?.anims?.[state.action];
  if(!s)return state.clock;
  const frame=Math.max(0,Math.min(state.frameIndex,s.frames-1));
  const start=s.dur.slice(0,frame).reduce((a,b)=>a+b,0)/60;
  return start+Math.min(.005,(s.dur[frame]||8)/120);
 }
 function drawStudioAnchors(x,y,a,clock,scale){
 if(!state.anchors||state.action!=='Shoot')return;
 const points=studioEmitters(x,y,a,clock,scale);
 // A single pixel-sized DOT at each saved anatomical emitter point.
 // No halo, ring, pointer, or coordinate label obscures the actual mouth.
 ctx.save();
 ctx.imageSmoothingEnabled=false;
 for(const p of points){
  const size=Math.max(2,Math.min(3,Math.round(scale)));
  const sx=Math.round(p.x),sy=Math.round(p.y);
  ctx.fillStyle=p.exact?'#22eeff':'#ffcb53';
  ctx.fillRect(sx-Math.floor(size/2),sy-Math.floor(size/2),size,size);
 }
 ctx.restore();
}
function drawStudioEffects(x,y,a,clock,scale){
 if(!state.preview)return;
 const m=state.preview,age=m.age,vx=Math.cos(a),vy=Math.sin(a),nx=-vy,ny=vx;
 const points=studioEmitters(x,y,a,clock,scale,m.type==='basic'?'basic':m.type);
 const baseX=points.length?points.reduce((sum,p)=>sum+p.x,0)/points.length:x+vx*26;
 const baseY=points.length?points.reduce((sum,p)=>sum+p.y,0)/points.length:y-33+vy*12;
 const k=Math.min(1,age/m.life);
 if(m.type==='dash'){
   const k=Math.min(1,age/m.life),maxDist=Math.min(74,W*.14);
   const reach=maxDist*(k<.55?k/.55:1-(k-.55)/.45);
   for(let i=1;i<=5;i++){const d=reach-i*13;pxRect(x+vx*d-4,y-17+vy*d-4,8,8,roster[state.kind].color,(.55-i*.075)*(1-k*.5));}
 }else if(m.type==='basic'){
   const d=30+Math.min(age,1)*420,q={x:baseX+vx*d,y:baseY+vy*d,vx,vy,element:roster[state.kind].type,team:'player',pulse:age*8};
   if(age<.95)drawProjectileSprite(q);
   if(age>.65 && age<1.15)fxStar(q.x,q.y,10+age*12,q.element,(1.15-age)*2);
 }else if(m.type==='thunderbolt'){
   const reach=Math.min(1,age/.57),dist=520*reach,steps=Math.max(2,Math.floor(dist/19)),path=[];
   for(let i=0;i<=steps;i++){let d=dist*i/steps;path.push({x:baseX+vx*d+nx*(i===steps?0:Math.sin(i*2.8+age*19)*15),y:baseY+vy*d+ny*(i===steps?0:Math.sin(i*2.8+age*19)*15)});}
   if(age<.85){
     if(window.ArenaFX)ArenaFX.setPixel(scale);
     drawThunderbolt({type:'thunderbolt',path,age,life:.9,x:baseX+vx*dist,y:baseY+vy*dist});
     if(age<.7)ArenaFX.aura(ctx,{x:baseX,y:baseY,age,element:'electric'},fxQuality);
   }
   else drawThunderbolt({type:'boltEcho',path,age:age-.85,life:.38,x:baseX+vx*dist,y:baseY+vy*dist});
 }else if(m.type==='flamethrower'){
   const length=Math.min(335,Math.max(0,age*900))*Math.min(1,(m.life-age)/.25);
   drawFlamethrower({type:'flamethrower',x:baseX,y:baseY,vx,vy,age,stream:length});
 }else if(m.type==='surf'){
   return; // Rider and wave are composed together in render().
 }else if(m.type==='energyball'){
   const d=Math.min(435,age*410),cx=baseX+vx*d,cy=baseY+vy*d;
   if(age<1.03)drawEnergyball({type:'energyball',x:cx,y:cy,vx,vy,age,life:m.life});
   else drawEnergyBurst({x:baseX+vx*420,y:baseY+vy*420,age:age-1.03,life:.3});
 }
}
function render(){
 const now=performance.now(),dt=Math.min(.06,Math.max(0,(now-state.last)/1000))*state.speed;state.last=now;
 state.clock+=dt;
 if(state.preview){
  state.preview.age+=dt;
  if(state.preview.age>state.preview.life){
   const finished=state.preview.type;
   state.preview=null;
   if(finished==='flamethrower'){state.action='Idle';state.clock=0;meta();}
  }
 }
 if(state.auto){state.autoTime+=dt;if(state.autoTime>.77){state.autoTime=0;state.autoIndex++;if(state.autoIndex>=roster.length*8*testActions.length){state.auto=false;state.completed=true;meta();audit();}else{const count=testActions.length,k=Math.floor(state.autoIndex/(8*count)),d=Math.floor(state.autoIndex/count)%8,ac=testActions[state.autoIndex%count];select(k,ac,d);}}}
 const cx=W*.5,cy=Math.min(H*.48,Math.max(175,H-(Math.min(H*.6,440)+65))),sp=roster[state.kind],a=faces[state.dir];
 ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;
 const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#122f43');bg.addColorStop(.6,'#235660');bg.addColorStop(1,'#142d37');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 const horizon=Math.max(110,cy-120);
 ctx.fillStyle='#477565';ctx.fillRect(0,horizon,W,H-horizon);
 ctx.strokeStyle='#355c55';ctx.lineWidth=1;for(let yy=horizon;yy<H;yy+=32){ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(W,yy);ctx.stroke();}
 for(let xx=0;xx<W;xx+=32){ctx.beginPath();ctx.moveTo(xx,horizon);ctx.lineTo(xx,H);ctx.stroke();}
 const scale=W<520?1.75:2.2;
 if(window.ArenaFX)ArenaFX.setPixel(scale);
 pxRing(cx,cy+1,49,2,'#b6f9e1',.43,5);pxRing(cx,cy+1,64,2,sp.color,.28,6);
 if(state.compare){
   const top=studioNode.querySelector('.studioPanel').getBoundingClientRect().top;
   const region=Math.max(160,top-62),ch=Math.max(75,Math.min(160,region/2)),cw=W/4;
   const y0=Math.max(67,top/2-ch+19),dirs=[5,4,3,2,6,7,0,1];
   const active=sprites[sp.id]?.anims?.[state.action]||sprites[sp.id]?.anims?.Walk||sprites[sp.id]?.anims?.Idle;
   const scale=Math.max(.37,Math.min(W<520?1:1.32,(cw-14)/(active?.w||80),(ch-20)/(active?.h||80)));
   for(let i=0;i<8;i++){
     const xx=(i%4+.5)*cw,yy=y0+Math.floor(i/4)*ch+ch*.72,d=dirs[i],angle=faces[d];
     ctx.globalAlpha=state.dir===d?1:.93;
     pxRing(xx,yy+1,Math.max(17,scale*27),2,sp.color,.28,4);
     spriteDraw(sp.id,xx,yy,angle,state.action,studioFrameClock(),scale,state.action==='Hurt'?.35:0,'player');
     drawStudioAnchors(xx,yy,angle,studioFrameClock(),scale);
     ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#eafff7';
     ctx.fillText(faceLabels[d],xx,yy-Math.max(48,scale*(active?.h||80)+8));
   }
   ctx.globalAlpha=1;ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff7d2';ctx.fillText(sp.name+' · '+state.action+' · 8방향 원본 비교',W/2,Math.max(67,y0-24));
   ctx.restore();return;
  }
  if(state.action==='Walk'){const ox=Math.sin(state.clock*7)*12;for(let i=0;i<3;i++)pxRect(cx-ox*(i+1)*1.2-5,cy+12+i*5,10,4,'#d8edbe',.2);}
 const dashPreview=state.preview?.type==='dash',dk=dashPreview?Math.min(1,state.preview.age/state.preview.life):0;
  const offset=dashPreview?Math.min(74,W*.14)*(dk<.55?dk/.55:1-(dk-.55)/.45):0;
  let spriteClock=studioFrameClock();
  if(state.preview?.type==='flamethrower'){
   const timing=flameShootTiming(sp.id),p=state.preview,releaseStart=p.life-.22;
   spriteClock=p.age<releaseStart?flameChannelClock(p.age,timing):
    timing.hold+(timing.end-timing.hold)*Math.min(1,(p.age-releaseStart)/.22);
  }
  const surfing=state.preview?.type==='surf';
  const wave=surfing?{x:cx,y:cy,vx:Math.cos(a),vy:Math.sin(a),age:state.preview.age}:null;
  if(wave)ArenaFX.ride(ctx,wave);
  spriteDraw(sp.id,cx+Math.cos(a)*offset,cy+Math.sin(a)*offset-(wave?ArenaFX.rideLift(wave.age)*scale:0),a,state.action,spriteClock,scale,state.action==='Hurt'?.9:0,'player');
  if(wave)ArenaFX.rideFoam(ctx,wave);
 if(state.action==='Hurt' && state.clock<.4){const n=Math.max(0,1-state.clock/.4);fxStar(cx+Math.cos(a)*-16,cy-42,12+20*(1-n),'fire',n);pxRing(cx,cy-28,18+35*(1-n),4,'#ffe6d6',n,4);}
 drawStudioAnchors(cx,cy,a,spriteClock,scale);
  if(state.preview)drawStudioEffects(cx,cy,a,spriteClock,scale);
 ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#f3fff1';ctx.fillText(sp.name+' · '+state.action,cx,Math.max(95,cy-135));
 ctx.font='11px system-ui';ctx.fillStyle='#cdeee6';ctx.fillText('방향별 원본 이미지 프레임을 재생합니다',cx,Math.max(112,cy-116));
 ctx.restore();
}
const originalDraw=draw;
draw=function(){if(state.open)render();else originalDraw();};
window.motionStudio={open,close,getState:()=>({kind:state.kind,action:state.action,dir:state.dir,face:faceLabels[state.dir],auto:state.auto,compare:state.compare,anchors:state.anchors,freezeFrame:state.freezeFrame,frameIndex:state.frameIndex}),preview:attack,audit,setCompare(enabled){state.compare=!!enabled;state.auto=false;state.preview=null;meta();}};
 
// Layered hand-pixel treatments applied on top of existing combat rendering.
// All colors are procedural pixels, rather than footage-copied artwork.
// Skill PIXEL scale is relative to the visible PMD sprite sheet width,
// not to arena collision radii. Preserve projectile travel and hit detection.
function skillSpriteWidth(m){
 const actor=m?.owner==='player'?player:m?.owner==='enemy'?enemies[0]:null;
 const id=actor?.id||roster[state.kind]?.id;
 return (sprites[id]?.anims?.Shoot?.w||window.PMD_EMISSION_ATLAS?.[id]?.cell?.[0]||48)*1.43;
}
function skillVisualRatio(m,originalWidth,min=.40,max=.72){
 return Math.max(min,Math.min(max,skillSpriteWidth(m)*.72/originalWidth));
}
function scaleSkillAround(m,f){
 ctx.translate(m.x,m.y);ctx.scale(f,f);ctx.translate(-m.x,-m.y);
}
function scaleSkillBeamWidth(m,f,origin){
 const vx=m.vx??(m.path?.length>1?(m.path.at(-1).x-m.path[0].x):1);
 const vy=m.vy??(m.path?.length>1?(m.path.at(-1).y-m.path[0].y):0);
 const angle=Math.atan2(vy,vx);
 const x=origin?.x??m.x,y=origin?.y??m.y;
 ctx.translate(x,y);ctx.rotate(angle);ctx.scale(1,f);ctx.rotate(-angle);ctx.translate(-x,-y);
}
// v30: battle and studio share combat-fx.js directly; no stacked effect wrappers.
window.motionStudio.getVisualRatio=(type)=>{
 const widths={thunderbolt:85,flamethrower:105,surf:185,energyball:86,energyburst:225};
 return skillVisualRatio({owner:'player',type},widths[type]||86);
};
})();
