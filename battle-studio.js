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
<button data-action="Idle">대기</button><button data-action="Walk">이동</button><button data-action="Attack">공격</button><button data-action="Shoot">발사</button><button data-action="Hurt">피격</button></div>
<div class="studioGroup" id="studioDirections"><span class="sLabel">방향</span>
<button data-dir="5">↖</button><button data-dir="4">↑</button><button data-dir="3">↗</button><button data-dir="6">←</button><button data-dir="2">→</button><button data-dir="7">↙</button><button data-dir="0">↓</button><button data-dir="1">↘</button></div>
<div class="studioGroup"><span class="sLabel">기술</span><button data-test="basic">기본 공격</button><button data-test="special">고유 기술</button><button id="studioCompare" aria-pressed="false">8방향 동시 비교</button><button id="studioReplay">현재 모션 다시</button><button id="studioCycle">전체 자동 순회</button><button id="studioStop">순회 중단</button><button id="studioAuditBtn">원본 프레임 검사</button>
<label class="studioSpeed">재생 속도 <input type="range" id="studioSpeed" min="0.25" max="2" step=".25" value="1"><span id="studioSpeedLabel">1.0×</span></label></div>
<p class="studioMeta" id="studioMeta" aria-live="polite">스프라이트 정보 확인 중…</p><p class="studioMeta" id="studioAudit" aria-live="polite">검사하면 캐릭터별 원본 8방향 모션 누락을 표시합니다.</p>
</div>`;
document.body.append(studioNode);
const launcher=document.createElement('button');
launcher.id='openMotionStudio';
launcher.type='button';
launcher.textContent='🎞 캐릭터 모션 · 4종 기술 테스트';
$('start').insertAdjacentElement('afterend',launcher);
const state={open:false,previous:'menu',menuVisible:true,kind:0,action:'Idle',dir:0,clock:0,last:0,speed:1,preview:null,auto:false,autoIndex:0,autoTime:0,completed:false,compare:false};
// PMD sprite-sheet row order: S, SE, E, NE, N, NW, W, SW.
const faces=[Math.PI/2,Math.PI/4,0,-Math.PI/4,-Math.PI/2,-3*Math.PI/4,Math.PI,3*Math.PI/4];
const faceLabels=['↓','↘','→','↗','↑','↖','←','↙'];
const faceNames=['남','남동','동','북동','북','북서','서','남서'];
const testActions=['Idle','Walk','Attack','Shoot','Hurt'];
function meta(){
 const sp=roster[state.kind],pack=sprites[sp.id],sheet=pack?.anims[state.action],fallback=pack?.anims.Walk||pack?.anims.Idle;
 const active=sheet||fallback;
 const atlas=sheet?`${sheet.frames}프레임 · ${sheet.dirs}방향 · ${pack.variant||'기본 버전'}`:active?`해당 액션 원본 없음 (대체 모션 ${active.frames}프레임)`:'원본 로딩 대기 / 대체 이미지';
 const special=MOVE_SPECS[sp.type];
 $('studioMeta').textContent=`${sp.name} · ${state.action} · ${faceLabels[state.dir]} · PMD ${atlas} · 기본: ${sp.basic} / 고유: ${special.name}${state.auto?' · 전체 자동 검사 중':''}${state.completed?' · 전체 순회 완료':''}`;
 for(const btn of studioNode.querySelectorAll('[data-actor]'))btn.classList.toggle('active',+btn.dataset.actor===state.kind);
 for(const btn of studioNode.querySelectorAll('[data-action]'))btn.classList.toggle('active',btn.dataset.action===state.action);
 for(const btn of studioNode.querySelectorAll('[data-dir]'))btn.classList.toggle('active',+btn.dataset.dir===state.dir);
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
 state.kind=kind;state.action=action;state.dir=dir;state.clock=0;state.preview=null;meta();
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
 state.action=which==='basic'?'Shoot':'Attack';state.clock=0;
 state.preview={type:which==='basic'?'basic':MOVE_SPECS[t].id,age:0,life:which==='basic'?1.25:t==='fire'?1.45:1.25};
 meta();
}
launcher.addEventListener('click',open);
$('studioExit').addEventListener('click',close);
studioNode.addEventListener('click',(e)=>{
 const btn=e.target.closest('button');if(!btn)return;
 if(btn.dataset.actor!==undefined){state.auto=false;state.completed=false;select(+btn.dataset.actor);return;}
 if(btn.dataset.action!==undefined){state.auto=false;state.completed=false;select(undefined===state.kind?0:state.kind,btn.dataset.action);return;}
 if(btn.dataset.dir!==undefined){state.auto=false;state.completed=false;select(state.kind,state.action,+btn.dataset.dir);return;}
 if(btn.dataset.test)attack(btn.dataset.test);
 if(btn.id==='studioCompare'){state.compare=!state.compare;state.auto=false;state.preview=null;state.completed=false;meta();}
 if(btn.id==='studioReplay'){state.auto=false;state.completed=false;select();}
 if(btn.id==='studioCycle'){state.auto=true;state.compare=false;state.completed=false;state.autoIndex=0;state.autoTime=0;select(0,'Idle',0);}
 if(btn.id==='studioStop'){state.auto=false;meta();}
 if(btn.id==='studioAuditBtn')audit();
});
$('studioSpeed').addEventListener('input',e=>{state.speed=Number(e.target.value)||1;$('studioSpeedLabel').textContent=state.speed.toFixed(2)+'×';});
addEventListener('keydown',e=>{if(state.open && (e.key==='Escape'||e.key.toLowerCase()==='p')){e.preventDefault();close();} });
function drawStudioEffects(x,y,a){
 if(!state.preview)return;
 const m=state.preview,age=m.age,vx=Math.cos(a),vy=Math.sin(a),nx=-vy,ny=vx,baseX=x+vx*26,baseY=y-33+vy*12;
 const k=Math.min(1,age/m.life);
 if(m.type==='basic'){
   const d=30+Math.min(age,1)*420,q={x:baseX+vx*d,y:baseY+vy*d,vx,vy,element:roster[state.kind].type,team:'player',pulse:age*8};
   if(age<.95)drawProjectileSprite(q);
   if(age>.65 && age<1.15)fxStar(q.x,q.y,10+age*12,q.element,(1.15-age)*2);
 }else if(m.type==='thunderbolt'){
   const reach=Math.min(1,age/.57),dist=520*reach,steps=Math.max(2,Math.floor(dist/19)),path=[];
   for(let i=0;i<=steps;i++){let d=dist*i/steps;path.push({x:baseX+vx*d+nx*(i===steps?0:Math.sin(i*2.8+age*19)*15),y:baseY+vy*d+ny*(i===steps?0:Math.sin(i*2.8+age*19)*15)});}
   if(age<.85)drawThunderbolt({type:'thunderbolt',path,age,life:.9,x:baseX+vx*dist,y:baseY+vy*dist});
   else drawThunderbolt({type:'boltEcho',path,age:age-.85,life:.38,x:baseX+vx*dist,y:baseY+vy*dist});
 }else if(m.type==='flamethrower'){
   const length=Math.min(335,Math.max(0,age*900))*Math.min(1,(m.life-age)/.25);
   drawFlamethrower({type:'flamethrower',x:baseX,y:baseY,vx,vy,age,stream:length});
 }else if(m.type==='surf'){
   const d=Math.min(360,age*330);
   drawSurf({type:'surf',x:baseX+vx*(38+d),y:baseY+vy*(38+d),vx,vy,age,life:m.life});
 }else if(m.type==='energyball'){
   const d=Math.min(435,age*410),cx=baseX+vx*d,cy=baseY+vy*d;
   if(age<1.03)drawEnergyball({type:'energyball',x:cx,y:cy,vx,vy,age,life:m.life});
   else drawEnergyBurst({x:baseX+vx*420,y:baseY+vy*420,age:age-1.03,life:.3});
 }
}
function render(){
 const now=performance.now(),dt=Math.min(.06,Math.max(0,(now-state.last)/1000))*state.speed;state.last=now;
 state.clock+=dt;
 if(state.preview){state.preview.age+=dt;if(state.preview.age>state.preview.life)state.preview=null;}
 if(state.auto){state.autoTime+=dt;if(state.autoTime>.77){state.autoTime=0;state.autoIndex++;if(state.autoIndex>=4*8*testActions.length){state.auto=false;state.completed=true;meta();audit();}else{const k=Math.floor(state.autoIndex/(8*5)),d=Math.floor(state.autoIndex/5)%8,ac=testActions[state.autoIndex%5];select(k,ac,d);}}}
 const cx=W*.5,cy=Math.min(H*.48,Math.max(175,H-(Math.min(H*.6,440)+65))),sp=roster[state.kind],a=faces[state.dir];
 ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;
 const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#122f43');bg.addColorStop(.6,'#235660');bg.addColorStop(1,'#142d37');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 const horizon=Math.max(110,cy-120);
 ctx.fillStyle='#477565';ctx.fillRect(0,horizon,W,H-horizon);
 ctx.strokeStyle='#355c55';ctx.lineWidth=1;for(let yy=horizon;yy<H;yy+=32){ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(W,yy);ctx.stroke();}
 for(let xx=0;xx<W;xx+=32){ctx.beginPath();ctx.moveTo(xx,horizon);ctx.lineTo(xx,H);ctx.stroke();}
 const scale=W<520?1.75:2.2;
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
     spriteDraw(sp.id,xx,yy,angle,state.action,state.clock,scale,state.action==='Hurt'?.35:0,'player');
     ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#eafff7';
     ctx.fillText(faceLabels[d],xx,yy-Math.max(48,scale*(active?.h||80)+8));
   }
   ctx.globalAlpha=1;ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff7d2';ctx.fillText(sp.name+' · '+state.action+' · 8방향 원본 비교',W/2,Math.max(67,y0-24));
   ctx.restore();return;
  }
  if(state.action==='Walk'){const ox=Math.sin(state.clock*7)*12;for(let i=0;i<3;i++)pxRect(cx-ox*(i+1)*1.2-5,cy+12+i*5,10,4,'#d8edbe',.2);}
 spriteDraw(sp.id,cx,cy,a,state.action,state.clock,scale,state.action==='Hurt'?.9:0,'player');
 if(state.action==='Hurt' && state.clock<.4){const n=Math.max(0,1-state.clock/.4);fxStar(cx+Math.cos(a)*-16,cy-42,12+20*(1-n),'fire',n);pxRing(cx,cy-28,18+35*(1-n),4,'#ffe6d6',n,4);}
 if(state.preview)drawStudioEffects(cx,cy,a);
 ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#f3fff1';ctx.fillText(sp.name+' · '+state.action,cx,Math.max(95,cy-135));
 ctx.font='11px system-ui';ctx.fillStyle='#cdeee6';ctx.fillText('방향별 원본 이미지 프레임을 재생합니다',cx,Math.max(112,cy-116));
 ctx.restore();
}
const originalDraw=draw;
draw=function(){if(state.open)render();else originalDraw();};
window.motionStudio={open,close,getState:()=>({kind:state.kind,action:state.action,dir:state.dir,face:faceLabels[state.dir],auto:state.auto,compare:state.compare}),preview:attack,audit,setCompare(enabled){state.compare=!!enabled;state.auto=false;state.preview=null;meta();}};
 
// Layered hand-pixel treatments applied on top of existing combat rendering.
// All colors are procedural pixels, rather than footage-copied artwork.
const originalThunder=drawThunderbolt,originalFlame=drawFlamethrower,originalSurf=drawSurf,originalOrb=drawEnergyball,originalBurst=drawEnergyBurst;
drawThunderbolt=function(m){
 originalThunder(m);
 const pts=m.path||[];if(pts.length<2)return;
 const fade=m.type==='boltEcho'?Math.max(0,1-m.age/(m.life||.3)):1;
 const count=fxQuality==='low'?5:12;
 ctx.save();ctx.globalAlpha*=fade;
 for(let i=1;i<pts.length-1;i+=Math.max(1,Math.floor(pts.length/count))){
   const p=pts[i],prev=pts[i-1],dx=p.x-prev.x,dy=p.y-prev.y,mag=Math.hypot(dx,dy)||1,side=i%2?1:-1,amp=12+(i%4)*5;
   const bx=p.x-side*dy/mag*amp,by=p.y+side*dx/mag*amp;
   pxLine(p.x,p.y,bx,by,5,'#8e5d15',.9,.7);pxLine(p.x,p.y,bx,by,3,i%3?'#fff1a0':'#a9f6ff',1,.65);
   pxRect(bx-3,by-3,6,6,i%2?'#ffffff':'#e0f9ff',.96);
 }
 const last=pts[pts.length-1];for(let i=0;i<6;i++){const a=i*Math.PI/3+m.age*23,rr=12+Math.sin(i*3+m.age*28)*5;pxLine(last.x+Math.cos(a)*rr,last.y+Math.sin(a)*rr,last.x+Math.cos(a)*(rr+11),last.y+Math.sin(a)*(rr+11),3,'#fff8d0',.73,.7);}
 ctx.restore();
};
drawFlamethrower=function(m){
 originalFlame(m);
 const L=m.stream||0;if(L<12)return;
 const dx=m.vx,dy=m.vy,nx=-dy,ny=dx,quality=fxQuality==='low'?12:23;
 ctx.save();
 for(let layer=0;layer<3;layer++){
  let px=m.x,py=m.y;
  for(let i=1;i<=quality;i++){
   const u=i/quality,d=u*L,curve=Math.sin(u*19-m.age*24+layer*2)*((5+u*19)*(layer===0?-1:layer===1?1:.2));
   const x=m.x+dx*d+nx*curve,y=m.y+dy*d+ny*curve;
   const size=layer===2?4:layer===1?5:8;
   pxLine(px,py,x,y,size,layer===2?'#fff9d1':layer===1?'#ffca5c':'#df4628',.86,.85);px=x;py=y;
  }
 }
 for(let i=0;i<(fxQuality==='low'?5:12);i++){
  const u=(i+.7)/13,d=L*u,sw=Math.sin(i*7.3+m.age*24)*u*29;
  const x=m.x+dx*d+nx*sw,y=m.y+dy*d+ny*sw;
  fxStamp('ember',x,y,5+u*8,9+u*8,i,.82,(i%2?1:-1)*.2);
 }
 ctx.restore();
};
drawSurf=function(m){
 originalSurf(m);
 const dx=m.vx,dy=m.vy,nx=-dy,ny=dx,phase=m.age*19,q=fxQuality==='low'?12:20;
 ctx.save();
 for(let i=0;i<q;i++){
  const u=i/(q-1)*2-1,side=u*91,front=48+11*Math.sin(phase+i*.85);
  const x=m.x+nx*side+dx*front,y=m.y+ny*side+dy*front;
  pxRect(x-7,y-6,15,12,i%4===0?'#f9ffff':i%2?'#b6f6ff':'#6bd9f1',.95);
  if(i%2===0){pxLine(x,y,x+dx*(8+Math.abs(u)*8)+nx*u*5,y+dy*(8+Math.abs(u)*8)+ny*u*5,4,'#ffffff',.85,.8);}
  const back=m.x+nx*side+dx*(-52+Math.sin(phase*.6+i)*9),by=m.y+ny*side+dy*(-52+Math.sin(phase*.6+i)*9);
  pxRect(back-3,by-3,6,6,i%3?'#b7f5fc':'#ffffff',.67);
 }
 for(let i=0;i<9;i++){const u=i/8*2-1,s=u*76,h=22+Math.sin(phase+i)*12;fxStamp('water',m.x+nx*s+dx*(27+h*.4),m.y+ny*s+dy*(27+h*.4),9,20+h,i,.67,-Math.PI/2+Math.atan2(dy,dx));}
 ctx.restore();
};
drawEnergyball=function(m){
 originalOrb(m);
 const t=m.age,cx=m.x,cy=m.y,rot=t*9,quality=fxQuality==='low'?8:16;
 ctx.save();
 for(let i=0;i<quality;i++){
   const a=i/quality*Math.PI*2+rot,r=24+7*Math.sin(a*2+t*13);
   const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.75;
   pxRect(x-3,y-3,6,6,i%4===0?'#f9ffce':i%2===0?'#b4ff69':'#43c882',.9);
   if(i%3===0){const x2=cx+Math.cos(a+.4)*(r+12),y2=cy+Math.sin(a+.4)*(r+12)*.75;pxLine(x,y,x2,y2,3,'#e0ffa4',.73,.8);}
 }
 for(let i=1;i<=5;i++){const d=i*13,x=cx-(m.vx||1)*d,y=cy-(m.vy||0)*d;pxDiamond(x+Math.sin(t*19+i)*7,y+Math.cos(t*14+i)*7,4+(5-i)*.7,i%2?'#7bea77':'#d8ffa2',.47,4);}
 ctx.restore();
};
drawEnergyBurst=function(m){
 originalBurst(m);
 const k=Math.min(1,m.age/(m.life||.4)),a=Math.max(0,1-k),r=23+k*91,n=fxQuality==='low'?10:20;
 ctx.save();
 for(let i=0;i<n;i++){
  const an=i*Math.PI*2/n+m.age*5+(i%3)*.18,rr=r*(i%2?.76:1),x=m.x+Math.cos(an)*rr,y=m.y+Math.sin(an)*rr*.82;
  pxDiamond(x,y,5+5*(1-k),i%3?'#bdfc81':'#ffffff',a*.93,4);
  if(i%2===0)pxLine(m.x+Math.cos(an)*r*.4,m.y+Math.sin(an)*r*.4,m.x+Math.cos(an)*r*.7,m.y+Math.sin(an)*r*.7,4,'#8de96b',a*.67,.9);
 }
 ctx.restore();
};
})();
