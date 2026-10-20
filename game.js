/**
 * Pokémon Arena — main game module.
 * Character motions: characters/<species>/motion-*.js
 * Skill effects: skills/<skill-id>/effect.js
 */
import { bindRenderApi, R } from './lib/render-api.js';
import { CHARACTERS, PMD_TO_KEY, characterForPmd } from './characters/index.js';
import { SKILLS, skillEffect, SKILL_BY_KO } from './skills/index.js';

const BUILD_VERSION='v26-cast-poses-vfxlab';
const $=id=>document.getElementById(id),CV=$('stage'),ctx=CV.getContext('2d');let W=innerWidth,H=innerHeight,dpr=1;
// Combat sprites + skill VFX share one integer texel size (PMD nearest-neighbour scale).
// Measured: PMD Walk frames ~32–48px; drawn at SPRITE_SCALE so 1 source texel = SPRITE_PX CSS px.
const SPRITE_SCALE=2, SPRITE_PX=SPRITE_SCALE;

// Mouth / body anchors in *source sprite texels* (× SPRITE_SCALE → screen).
// fwd = along facing, side = perpendicular, up = screen-up from feet (negative = higher).
const MOUTH_ANCHOR={
 '0006':{fwd:16,side:0,up:-22}, // Charizard — snout
 '0026':{fwd:12,side:0,up:-18}, // Raichu — mouth
 '0009':{fwd:14,side:0,up:-20}, // Blastoise — cannon/mouth
 '0003':{fwd:10,side:0,up:-14}  // Venusaur — mouth
};
const BODY_ANCHOR={
 '0006':{fwd:4,side:0,up:-20},
 '0026':{fwd:2,side:0,up:-16},
 '0009':{fwd:2,side:0,up:-18},
 '0003':{fwd:2,side:0,up:-14}
};
// Surf wave full width ≈ 3× typical PMD walk width (40 texels) → 120 source texels.
const SURF_CHAR_W_TEXELS=40, SURF_WIDTH_TEXELS=SURF_CHAR_W_TEXELS*3; // 120
function actorSpeciesId(actor){
 if(!actor)return '0006';
 if(actor===player)return roster[chosen]?.id||'0006';
 return actor.id||roster[actor.kind]?.id||'0006';
}
function anchorWorld(actor, aimX, aimY, table){
 const id=actorSpeciesId(actor), a=table[id]||{fwd:12,side:0,up:-18};
 const L=Math.hypot(aimX,aimY)||1, ux=aimX/L, uy=aimY/L, nx=-uy, ny=ux;
 const sc=SPRITE_SCALE;
 return {
  x:actor.x + ux*a.fwd*sc + nx*a.side*sc,
  y:actor.y + uy*a.fwd*sc + ny*a.side*sc + a.up*sc
 };
}
function mouthWorld(actor, aimX, aimY){const p=anchorWorld(actor, aimX, aimY, MOUTH_ANCHOR),t=castThrustOffset(actor);return{x:p.x+t.x,y:p.y+t.y}}
function bodyWorld(actor, aimX, aimY){const p=anchorWorld(actor, aimX, aimY, BODY_ANCHOR),t=castThrustOffset(actor);return{x:p.x+t.x,y:p.y+t.y}}

// Short skill-cast pose (same SPRITE_PX grid). Total ~0.36s: wind 0.10 / peak 0.10 / recover 0.16.
const CAST_POSE_LIFE=.36, CAST_WIND=.10, CAST_PEAK=.10, CAST_RECOVER=.16;
let labMode=false, labDollKO=0;
function castPoseEnvelope(age,life=CAST_POSE_LIFE){
 const u=Math.max(0,Math.min(1,age/life));
 if(u<CAST_WIND/life)return u/(CAST_WIND/life);
 if(u<(CAST_WIND+CAST_PEAK)/life)return 1;
 return Math.max(0,1-(u-(CAST_WIND+CAST_PEAK)/life)/(CAST_RECOVER/life));
}
function startCastPose(actor){
 if(!actor)return;
 const id=actorSpeciesId(actor);
 actor.castPose={age:0,life:CAST_POSE_LIFE,id};
 playAction(actor,'Attack',CAST_POSE_LIFE);
}
function castThrustOffset(actor){
 if(!actor?.castPose)return{x:0,y:0};
 const k=castPoseEnvelope(actor.castPose.age,actor.castPose.life);
 const a=actor.face||0,ux=Math.cos(a),uy=Math.sin(a);
 const id=actor.castPose.id||actorSpeciesId(actor);
 const thrust=SPRITE_PX*(characterForPmd(id).attack.thrustTexels)*k;
 return{x:ux*thrust,y:uy*thrust};
}
function castPoseDrawMods(id,face,k){
 const ch=characterForPmd(id); const S=SPRITE_PX;
 return ch.attack.attackMods(face,k,S);
}
function drawCastOverlays(id,x,y,face,mods){
 if(!mods)return;
 const ch=characterForPmd(id);
 const mouth=MOUTH_ANCHOR[id];
 ch.attack.attackOverlays(R, x,y,face,mods, mouth);
}

function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);CV.width=Math.round(W*dpr);CV.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false}addEventListener('resize',resize);resize();
const BASE='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/';
const SHOWDOWN_FRONT='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/';
const SHOWDOWN_BACK='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/';
const OFFICIAL_ART='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
const HGSS_GIF='https://raw.githubusercontent.com/teobz/pkmn-hgss-animated-overworld-sprites/main/GIF/by-direction/';
// This flag is absent in iOS file preview / Quick Look when scripts are disabled.
document.getElementById('jsWarning').classList.add('hidden');
document.getElementById('assetStatus').textContent='PMD 8방향 스프라이트 연결 확인 중 · 게임은 바로 시작할 수 있습니다.';
const roster=[
 {id:'0026',name:'라이츄',type:'electric',icon:'⚡',color:'#f6d36c',basic:'전기쇼크',special:'10만볼트',types:['electric'],base:{hp:60,atk:90,def:55,spa:90,spd:80,spe:110}},
 {id:'0006',name:'리자몽',type:'fire',icon:'🔥',color:'#ff9863',basic:'불꽃세례',special:'화염방사',types:['fire','flying'],base:{hp:78,atk:84,def:78,spa:109,spd:85,spe:100}},
 {id:'0009',name:'거북왕',type:'water',icon:'💧',color:'#84caff',basic:'물대포',special:'파도타기',types:['water'],base:{hp:79,atk:83,def:100,spa:85,spd:105,spe:78}},
 {id:'0003',name:'이상해꽃',type:'grass',icon:'🍃',color:'#91dd96',basic:'나뭇잎',special:'에너지볼',types:['grass','poison'],base:{hp:80,atk:82,def:83,spa:100,spd:100,spe:80}}
];


// Mainline Pokémon stat formula, Gen III onward. The battle starts at Lv.50,
// EV=0, selectable nature, and independent IV=0..31 for the six stats.
const STAT_KEYS=['hp','atk','def','spa','spd','spe'];
const STAT_LABELS={hp:'HP',atk:'공격',def:'방어',spa:'특공',spd:'특방',spe:'스피드'};
const BATTLE_LEVEL=50;
// Arcade conversion ONLY. Actual PvP ability stats and damage rolls use official mainline equations.
const ARENA_BALANCE=Object.freeze({hp:2,damage:.8,basicInterval:.5,channelMoveSeconds:.9,
 burnSeconds:9,paralysisSeconds:8,spdefDropSeconds:8,burnTickSeconds:2.5,paralysisSlow:.5});
const arenaHP=hp=>Math.round(hp*ARENA_BALANCE.hp);
const arenaDamage=damage=>Math.max(1,Math.round(damage*ARENA_BALANCE.damage));

const NATURES={
 neutral:{name:'성실 (무보정)',plus:null,minus:null},
 modest:{name:'조심 (+특공 −공격)',plus:'spa',minus:'atk'},
 timid:{name:'겁쟁이 (+스피드 −공격)',plus:'spe',minus:'atk'},
 adamant:{name:'고집 (+공격 −특공)',plus:'atk',minus:'spa'},
 jolly:{name:'명랑 (+스피드 −특공)',plus:'spe',minus:'spa'},
 bold:{name:'대담 (+방어 −공격)',plus:'def',minus:'atk'},
 calm:{name:'차분 (+특방 −공격)',plus:'spd',minus:'atk'}
};
const NATURE_LIST=Object.keys(NATURES);
const makeIV=()=>Object.fromEntries(STAT_KEYS.map(k=>[k,Math.floor(Math.random()*32)]));
const ivSets=roster.map(makeIV);let selectedNature='neutral';
function statFromBase(base,iv,ev,level,nature=1,isHP=false){
 const raw=Math.floor((2*base+iv+Math.floor(ev/4))*level/100);
 return isHP?raw+level+10:Math.floor((raw+5)*nature);
}
function computeStats(idx,iv=ivSets[idx],level=BATTLE_LEVEL,nature='neutral',ev={}){
 const species=roster[idx],nt=NATURES[nature]||NATURES.neutral;
 return Object.fromEntries(STAT_KEYS.map(k=>{
  const mult=k===nt.plus?1.1:k===nt.minus?.9:1;
  return [k,statFromBase(species.base[k],Math.max(0,Math.min(31,Math.floor(iv[k]??0))),ev[k]||0,level,mult,k==='hp')];
 }));
}
const speedFromStat=speed=>Math.max(180,Math.min(290,Math.round(175+(speed-40)*1.1)));
// Only the types used by the four featured Pokémon are required at present.
const TYPE_CHART={
 electric:{electric:.5,fire:1,water:2,grass:.5,poison:1,flying:2},
 fire:{electric:1,fire:.5,water:.5,grass:2,poison:1,flying:1},
 water:{electric:1,fire:2,water:.5,grass:.5,poison:1,flying:1},
 grass:{electric:1,fire:.5,water:2,grass:.5,poison:.5,flying:.5},
 normal:{electric:1,fire:1,water:1,grass:1,poison:1,flying:1},
 flying:{electric:.5,fire:1,water:1,grass:2,poison:1,flying:1},
 dragon:{electric:1,fire:1,water:1,grass:1,poison:1,flying:1},
 ice:{electric:1,fire:.5,water:.5,grass:2,poison:1,flying:2},
 poison:{electric:1,fire:1,water:1,grass:2,poison:.5,flying:1},
 steel:{electric:.5,fire:.5,water:.5,grass:1,poison:1,flying:1}
};
// Gen VI+ base powers, categories, accuracy and secondary effects.
// Surf and Thunderbolt retain the user-chosen real-time riding/homing presentation.
const MOVE_DB={
 electric:{basic:{id:'thunderShock',name:'전기쇼크',power:40,accuracy:100,category:'special',type:'electric',secondary:'paralysis',chance:.10},special:{id:'thunderbolt',name:'10만볼트',power:90,accuracy:100,category:'special',type:'electric',secondary:'paralysis',chance:.10}},
 fire:{basic:{id:'ember',name:'불꽃세례',power:40,accuracy:100,category:'special',type:'fire',secondary:'burn',chance:.10},special:{id:'flamethrower',name:'화염방사',power:90,accuracy:100,category:'special',type:'fire',secondary:'burn',chance:.10}},
 water:{basic:{id:'waterGun',name:'물대포',power:40,accuracy:100,category:'special',type:'water'},special:{id:'surf',name:'파도타기',power:90,accuracy:100,category:'special',type:'water'}},
 grass:{basic:{id:'razorLeaf',name:'나뭇잎',power:55,accuracy:95,category:'physical',type:'grass',highCrit:true},special:{id:'energyball',name:'에너지볼',power:90,accuracy:100,category:'special',type:'grass',secondary:'spdef',chance:.10}}
};

// Modern mainline move powers, accuracy and secondary effect odds; each move uses a unique real-time action.
// The swap effect of Volt Switch is adapted to a backward reposition in this single-combatant arena.
const EXTRA_MOVES={
 electric:[
  {id:'quickAttack',name:'전광석화',type:'normal',power:40,accuracy:100,category:'physical',cooldown:2.8,mode:'dash',range:210,glyph:'➜',label:'선공 돌진'},
  {id:'discharge',name:'방전',type:'electric',power:80,accuracy:100,category:'special',secondary:'paralysis',chance:.30,cooldown:5.8,mode:'burst',range:160,glyph:'✣',label:'범위 마비 30%'},
  {id:'voltSwitch',name:'볼트체인지',type:'electric',power:70,accuracy:100,category:'special',cooldown:5.5,mode:'projectile',range:470,speed:600,glyph:'ϟ',label:'명중 후 후퇴'},
  {id:'ironTail',name:'아이언테일',type:'steel',power:100,accuracy:75,category:'physical',secondary:'defense',chance:.30,cooldown:4.4,mode:'melee',range:105,glyph:'⚔',label:'방어↓ 30%'}
 ],
 fire:[
  {id:'airSlash',name:'에어슬래시',type:'flying',power:75,accuracy:95,category:'special',secondary:'flinch',chance:.30,cooldown:4.0,mode:'projectile',range:490,speed:610,glyph:'彡',label:'풀죽음 30%'},
  {id:'dragonPulse',name:'용의파동',type:'dragon',power:85,accuracy:100,category:'special',cooldown:4.8,mode:'beam',range:480,glyph:'✧',label:'장거리 파동'},
  {id:'heatWave',name:'열풍',type:'fire',power:95,accuracy:90,category:'special',secondary:'burn',chance:.10,cooldown:5.5,mode:'burst',range:180,glyph:'♨',label:'넓은 화염'},
  {id:'dragonClaw',name:'드래곤클로',type:'dragon',power:80,accuracy:100,category:'physical',cooldown:3.6,mode:'melee',range:115,glyph:'⚔',label:'근거리 베기'}
 ],
 water:[
  {id:'iceBeam',name:'냉동빔',type:'ice',power:90,accuracy:100,category:'special',secondary:'freeze',chance:.10,cooldown:5.1,mode:'beam',range:480,glyph:'❄',label:'얼음 10%'},
  {id:'aquaJet',name:'아쿠아제트',type:'water',power:40,accuracy:100,category:'physical',cooldown:2.8,mode:'dash',range:240,glyph:'➜',label:'물 돌진'},
  {id:'hydroPump',name:'하이드로펌프',type:'water',power:110,accuracy:80,category:'special',cooldown:6.0,mode:'projectile',range:500,speed:515,glyph:'◉',label:'고위력 물포'},
  {id:'flashCannon',name:'러스터캐논',type:'steel',power:80,accuracy:100,category:'special',secondary:'spdef',chance:.10,cooldown:4.5,mode:'beam',range:460,glyph:'✺',label:'특방↓ 10%'}
 ],
 grass:[
  {id:'sludgeBomb',name:'오물폭탄',type:'poison',power:90,accuracy:100,category:'special',secondary:'poison',chance:.30,cooldown:4.9,mode:'projectile',range:460,speed:455,glyph:'☣',label:'독 30%'},
  {id:'vineWhip',name:'덩굴채찍',type:'grass',power:45,accuracy:100,category:'physical',cooldown:2.7,mode:'melee',range:165,glyph:'〰',label:'중거리 채찍'},
  {id:'solarBeam',name:'솔라빔',type:'grass',power:120,accuracy:100,category:'special',cooldown:7.5,mode:'charge',range:540,glyph:'☀',label:'0.75초 충전'},
  {id:'leechSeed',name:'씨뿌리기',type:'grass',power:0,accuracy:90,category:'status',cooldown:7,mode:'seed',range:410,speed:430,glyph:'❀',label:'흡수 씨앗'}
 ]
};
const equippedExtra=Object.fromEntries(Object.keys(EXTRA_MOVES).map(t=>[t,[0,1]]));
const EXTRA_PALETTE={normal:'#f0e6d0',electric:'#ffd63d',fire:'#ff5f1f',water:'#3ec8f5',grass:'#6ce85a',flying:'#a8e4ff',dragon:'#8b7cff',ice:'#9ceeff',poison:'#c86ef0',steel:'#c8d8ec'};
function equippedMove(actor,slot){if(slot<3)return null;const type=roster[actor.kind].type,which=slot===3?0:1;const indexes=actor===player?equippedExtra[type]:(actor.extraLoadout||equippedExtra[type]);return EXTRA_MOVES[type][indexes[which]]}
function extraDescription(m){const extras=[];if(m.secondary==='paralysis')extras.push('마비 '+Math.round(m.chance*100)+'%');if(m.secondary==='burn')extras.push('화상 '+Math.round(m.chance*100)+'%');if(m.secondary==='poison')extras.push('독 '+Math.round(m.chance*100)+'%');if(m.secondary==='freeze')extras.push('얼음 '+Math.round(m.chance*100)+'%');if(m.secondary==='flinch')extras.push('풀죽음 '+Math.round(m.chance*100)+'%');if(m.secondary==='spdef')extras.push('특방↓ '+Math.round(m.chance*100)+'%');if(m.secondary==='defense')extras.push('방어↓ '+Math.round(m.chance*100)+'%');return extras.length?extras.join(' · '):m.label}
function refreshLoadout(){
 const p=roster[chosen],moves=EXTRA_MOVES[p.type],slots=equippedExtra[p.type];
 for(let j=0;j<2;j++){
  const el=$('extraSelect'+(j+3));
  el.innerHTML=moves.map((m,i)=>`<option value="${i}" ${slots[j]===i?'selected':''}>${m.name} · ${m.power||'변화'} · ${m.type}</option>`).join('');
 }
 refreshMoveDex();
}
for(let j=0;j<2;j++)$('extraSelect'+(j+3)).addEventListener('change',e=>{
 const t=roster[chosen].type,k=Number(e.target.value),other=1-j,arr=equippedExtra[t];
 if(k===arr[other]){arr[other]=arr[j];}arr[j]=k;refreshLoadout();
});
function updateExtraButtons(){
 const t=roster[chosen].type,arr=equippedExtra[t];
 for(let j=0;j<2;j++){const slot=j+3,m=EXTRA_MOVES[t][arr[j]],button=document.querySelector(`[data-n="${slot}"]`);$('extraGlyph'+slot).textContent=m.glyph;$('extraLabel'+slot).textContent=m.name;button.style.setProperty('--c',EXTRA_PALETTE[m.type]);button.title=`${m.name} · 위력 ${m.power||'—'} · 명중 ${m.accuracy}%`}
}

function moveDescription(move){if(move.highCrit)return '급소율 상승';if(move.secondary==='paralysis')return '마비 10%';if(move.secondary==='burn')return '화상 10%';if(move.secondary==='spdef')return '특방↓ 10%';return '추가 효과 없음'}
function refreshMoveDex(){const p=roster[chosen],db=MOVE_DB[p.type],a=equippedExtra[p.type];const list=[db.basic,db.special,...a.map(i=>EXTRA_MOVES[p.type][i])];$('moveDex').innerHTML=list.map((m,i)=>`<div class="moveItem"><b>${i+1} · ${m.name}</b>${m.power?'위력 '+m.power:'변화기'} · 명중 ${m.accuracy}% · ${m.category==='physical'?'물리':m.category==='special'?'특수':'변화'} · <span style="color:${EXTRA_PALETTE[m.type]}">${m.type}</span> <em>${i<2?moveDescription(m):extraDescription(m)}</em></div>`).join('')}
function effectiveness(attackType,target){return (target.types||[target.type]).reduce((n,t)=>n*(TYPE_CHART[attackType]?.[t]??1),1)}
// Standard non-weather, non-item, non-ability damage (Gen VI+), with
// original base damage, integer random roll, STAB, type effectiveness, crit.
// Optional deterministic roll/crit makes the calculator testable.
function calculateDamage(attacker,defender,move,options={}){
 let atk=move.category==='physical'?attacker.stats.atk:attacker.stats.spa;
 if(move.category==='physical'&&attacker.status?.kind==='burn')atk=Math.max(1,Math.floor(atk/2));
 const stage=move.category==='special'?(defender.spdefStage||0):(defender.defStage||0);
 const stageFactor=stage>=0?(2+stage)/2:2/(2-stage);
 const def=Math.max(1,Math.floor((move.category==='physical'?defender.stats.def:defender.stats.spd)*stageFactor));
 const base=Math.floor(Math.floor((Math.floor(2*attacker.level/5)+2)*move.power*atk/def)/50)+2;
 const critical=options.forceCrit!==undefined?options.forceCrit:(Math.random()<(move.highCrit?1/8:1/24));
 const roll=options.roll??(85+Math.floor(Math.random()*16));
 const stab=(attacker.types||[attacker.type]).includes(move.type)?1.5:1;
 const type=effectiveness(move.type,defender);
 // Staged rounding uses the modern mainline core; extra factors are currently disabled.
 let dmg=Math.floor(base*(critical?1.5:1));
 dmg=Math.floor(dmg*roll/100);
 dmg=Math.max(1,Math.floor(dmg*stab+0.49999999));
 dmg=Math.floor(dmg*type+0.49999999);
 return {damage:type===0?0:Math.max(1,dmg),base,critical,roll,stab,type,move:move.name};
}
function moveOf(actor,slot){return MOVE_DB[actor.type][slot]}
function damagePacket(actor,target,slot,opts){return calculateDamage(actor,target,moveOf(actor,slot),opts)}
function moveAccuracy(move){return Math.random()*100<(move.accuracy??100)}
function canAct(actor){if(actor.staggerT>0||actor.status?.kind==='freeze')return false;if(actor.status?.kind!=='paralysis'||Math.random()>=.25)return true;
 for(let i=0;i<8;i++)emitParticle({x:actor.x+rand(-14,14),y:actor.y-rand(12,32),life:rand(.15,.35),size:rand(3,5),color:'#ffe867',shape:'spark'});
 return false}
function statusDuration(kind){return kind==='burn'?ARENA_BALANCE.burnSeconds:kind==='paralysis'?ARENA_BALANCE.paralysisSeconds:ARENA_BALANCE.spdefDropSeconds}
function canStatus(target,kind){if(kind==='burn'&&target.types.includes('fire'))return false;if(kind==='freeze'&&target.types.includes('ice'))return false;if(kind==='poison'&&(target.types.includes('poison')||target.types.includes('steel')))return false;
 if(kind==='paralysis'&&target.types.includes('electric'))return false;
 return true}
function applySecondary(target,move,options={}){
 if(!move?.secondary||!canStatus(target,move.secondary)||Math.random()>=(options.chance??move.chance??0))return false;
 if(move.secondary==='flinch'){
  target.staggerT=Math.max(target.staggerT||0,.48);playAction(target,'Hurt',.3);emitParticle({x:target.x,y:target.y-19,life:.32,size:12,color:'#d9ecff',shape:'spark'});return true;
 }
 if(move.secondary==='defense'){
  target.defStage=Math.max(-6,(target.defStage||0)-1);target.defTimer=ARENA_BALANCE.spdefDropSeconds;announce('방어가 떨어졌다!');return true;
 }
 if(move.secondary==='spdef'){
  target.spdefStage=Math.max(-6,(target.spdefStage||0)-1);target.spdefTimer=statusDuration('spdef');
  elementalBurst(target.x,target.y-10,'grass',.35);
  if(target===player)announce('특수방어가 떨어졌다!');else announce('상대의 특수방어가 떨어졌다!');
  return true;
 }
 if(target.status)return false;
 target.status={kind:move.secondary,remaining:move.secondary==='freeze'?1.25:move.secondary==='poison'?9:statusDuration(move.secondary),tick:ARENA_BALANCE.burnTickSeconds};
 elementalBurst(target.x,target.y-10,move.type,.4);
 if(target===player)announce(move.secondary==='burn'?'화상에 걸렸다!':'마비에 걸렸다!');
 else announce(move.secondary==='burn'?'상대에게 화상!':'상대에게 마비!');
 return true;
}
function updateStatus(actor,dt){
 if(!actor)return;
 if(actor.status){const st=actor.status;st.remaining-=dt;
  if(st.kind==='burn'||st.kind==='poison'){st.tick-=dt;
   if(st.tick<=0){st.tick+=ARENA_BALANCE.burnTickSeconds;const damage=Math.max(1,Math.floor(actor.maxHp/16));actor.hp=Math.max(0,actor.hp-damage);
    emitParticle({x:actor.x,y:actor.y-16,life:.35,size:9,color:st.kind==='poison'?'#cc87f1':'#ff8840',shape:st.kind==='poison'?'dot':'flame'});
    showDamage(actor.x,actor.y-6,damage,st.kind==='poison'?'grass':'fire');
   }
  }
  if(st.remaining<=0)actor.status=null;
 }
 actor.staggerT=Math.max(0,(actor.staggerT||0)-dt);
 if(actor.seeded&&actor.seeded.remaining>0){actor.seeded.remaining-=dt;actor.seeded.tick-=dt;if(actor.seeded.tick<=0){actor.seeded.tick+=1.5;const drain=Math.max(1,Math.floor(actor.maxHp/16));actor.hp=Math.max(0,actor.hp-drain);const caster=actor.seeded.owner==='player'?player:enemies[0];if(caster)caster.hp=Math.min(caster.maxHp,caster.hp+drain);showDamage(actor.x,actor.y,drain,'grass');for(let i=0;i<5;i++)emitParticle({x:actor.x+rand(-9,9),y:actor.y-20,life:.4,size:5,color:'#b4ed80',shape:'leaf'});}if(actor.seeded.remaining<=0)actor.seeded=null;}
 if((actor.defTimer||0)>0){actor.defTimer-=dt;if(actor.defTimer<=0){actor.defStage=0;actor.defTimer=0}}
 if((actor.spdefTimer||0)>0){actor.spdefTimer-=dt;if(actor.spdefTimer<=0){actor.spdefStage=0;actor.spdefTimer=0}}
}
function statusSpeed(actor){return actor.status?.kind==='freeze'||actor.staggerT>0?0:actor.status?.kind==='paralysis'?ARENA_BALANCE.paralysisSlow:1}
function drawStatusPixels(actor){if(!actor.status&&!actor.spdefStage&&!actor.defStage&&!actor.seeded)return;const tick=Math.floor(time*8),x=actor.x,y=actor.y-40;
 if(actor.status?.kind==='burn'){pxRect(x-12,y+((tick%3)*2),6,8,'#ff702f',.9);pxRect(x+7,y-7+((tick%2)*2),4,7,'#ffde75',.9)}
 else if(actor.status?.kind==='paralysis'){pxRect(x-13,y+(tick%3)*3,6,6,'#fff38b',1);pxRect(x+10,y-6,5,9,'#ffe03c',.9)}
 if(actor.spdefStage){pxRect(x-2,y-15,5,5,'#a6f18d',.9)}if(actor.defStage){pxRect(x+6,y-16,6,6,'#a7a7ee',.9)}if(actor.seeded){pxRect(x-5,y-24,8,6,'#b8ed75',1)}if(actor.status?.kind==='poison'){pxRect(x-14,y-11,6,6,'#d08de9',1)}if(actor.status?.kind==='freeze'){pxRect(x-12,y-13,7,7,'#99eaff',1)}
}


const sprites={};const battleSprites={};const overworldSprites={};const FALLBACK={Walk:[32,40,4],Idle:[40,56,6],Attack:[80,80,10],Shoot:[40,56,11],Hurt:[48,64,2]};const ACTIONS=['Walk','Idle','Attack','Shoot','Hurt'];let spriteLoadCount=0;const unique=[...new Set(roster.map(o=>o.id))];
const PMD_VARIANT_PATHS={
 '0003':['0003','0000',''],
 '0006':['0005','0004','0001','0000/0001',''],
 '0009':['0004','0000/0001',''],
 '0026':['0004/0001','0001','0000','']
};
const variantCandidates=id=>[...new Set([...(PMD_VARIANT_PATHS[id]||[]),''])];
const pmdBasePath=(id,variant='')=>BASE+id+(variant?'/'+variant:'')+'/';
function getAnim(xml,name){let nodes=[...xml.getElementsByTagName('Anim')],node=nodes.find(n=>n.getElementsByTagName('Name')[0]?.textContent===name);if(!node)return null;const val=key=>Number(node.getElementsByTagName(key)[0]?.textContent||0);return {w:val('FrameWidth'),h:val('FrameHeight'),dur:[...node.getElementsByTagName('Duration')].map(n=>+n.textContent)}}
function loadImage(url){return new Promise((resolve,reject)=>{const im=new Image();let ended=false;const timer=setTimeout(()=>finish(false),5500);function finish(ok){if(ended)return;ended=true;clearTimeout(timer);im.onload=im.onerror=null;if(ok)resolve(im);else reject(Error('스프라이트 요청 실패 또는 시간 초과'))}im.crossOrigin='anonymous';im.onload=()=>finish(true);im.onerror=()=>finish(false);im.src=url})}
async function loadXml(url){const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),4200);try{const r=await fetch(url,{mode:'cors',signal:ctrl.signal});if(!r.ok)throw Error('HTTP '+r.status);return new DOMParser().parseFromString(await r.text(),'application/xml')}finally{clearTimeout(timer)}}
// For spritesheet animations, the row/frame canvas includes transparent padding.
// Derive the last visible body pixel (central area) per frame so the actual feet
// land on the SAME world-space floor point as the contact shadow.
function measureSpriteFeet(sheet){
 const ground=[];
 try{
  const canvas=document.createElement('canvas');canvas.width=sheet.image.naturalWidth||sheet.image.width;canvas.height=sheet.image.naturalHeight||sheet.image.height;
  const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(sheet.image,0,0);
  const rgba=c.getImageData(0,0,canvas.width,canvas.height).data;
  const imageW=canvas.width,w=sheet.w,h=sheet.h;
  const x0=Math.max(0,Math.floor(w*.20)),x1=Math.min(w,Math.ceil(w*.80));
  for(let d=0;d<sheet.dirs;d++){
   let row=[];
   for(let k=0;k<sheet.frames;k++){
    let yFound=-1;
    // Require a few opaque pixels in the center strip; don't mistake
    // detached particles or long lateral tails for feet.
    for(let yy=h-1;yy>=0;yy--){
     let count=0;
     for(let xx=x0;xx<x1;xx++){
      if(rgba[(((d*h+yy)*imageW)+(k*w+xx))*4+3]>48){count++;if(count>=2)break}
     }
     if(count>=2){yFound=yy+1;break}
    }
    row.push(yFound>0?yFound:h*.79);
   }
   ground.push(row);
  }
 }catch(err){/* Some asset hosts disallow readback; default to approximate placement. */}
 return ground;
}
function footOffset(sheet,d,f){return sheet?.feet?.[d]?.[f]||sheet?.h*.79||32}
function dirNameFromAngle(a){
 const dx=Math.cos(a),dy=Math.sin(a);
 if(Math.abs(dx)>Math.abs(dy)) return dx>=0?'right':'left';
 return dy>=0?'down':'up';
}
async function preloadOverworld(id){
 const n=String(Number(id)).padStart(3,'0');
 const pack=overworldSprites[id]||(overworldSprites[id]={});
 const dirs=['up','down','left','right'];
 const results=await Promise.allSettled(dirs.map(async d=>{
  const url=`${HGSS_GIF}${d}/regular/${n}_${d}.gif`;
  const img=await loadImage(url); pack[d]=img; return img;
 }));
 pack.loaded=dirs.some(d=>!!pack[d]);
 pack.count=dirs.filter(d=>!!pack[d]).length;
 pack.tried=results.length;
 return pack;
}
function drawOverworldSprite(id,x,y,angle,action,t,scale=1,flash=0,mods=null){
 const pack=overworldSprites[id];
 if(!pack?.loaded)return false;
 const dir=dirNameFromAngle(angle),img=pack[dir]||pack.down||pack.right||pack.left||pack.up;
 if(!img)return false;
 const iw=img.naturalWidth||img.width||32, ih=img.naturalHeight||img.height||32;
 // HGSS gifs are small; scale them up while keeping feet grounded.
 let baseScale=scale*(id==='0006'?2.2:2.05);
 const dw=iw*baseScale, dh=ih*baseScale;
 let dx=0,dy=0,sx=1,sy=1,rot=0;
 if(action==='Walk'){const mm=characterForPmd(id).move.moveMods(t);dy+=mm.dy*0.93;sx*=mm.sx;sy*=mm.sy}
 else if(action==='Shoot'){const p=Math.sin(Math.min(t,.22)/.22*Math.PI); dx+=Math.cos(angle)*5.5*p; dy+=Math.sin(angle)*3.6*p-2.2*p; sx=1+.05*p; sy=1-.03*p; rot=.035*Math.sin(angle)*p}
 else if(action==='Hurt'){const q=Math.sin(t*38)*2.6; dx-=Math.cos(angle)*q*.65; dy-=Math.sin(angle)*q*.42; rot=.05*Math.sin(t*34)}
 if(mods){dx+=mods.dx;dy+=mods.dy;sx*=mods.sx;sy*=mods.sy;rot+=mods.tilt}
 const airborne=(id==='0006'||id==='0169'||id==='0094'||id==='0130');
 contactShadow(x,y,scale*(airborne?.96:1),airborne);
 ctx.save(); ctx.imageSmoothingEnabled=false;
 if(flash>0)ctx.globalAlpha=.7+Math.cos(t*64)*.22;
 ctx.translate(x+dx,y+dy-dh*.78); ctx.rotate(rot); ctx.scale(sx,sy);
 ctx.drawImage(img,-dw/2,0,dw,dh);
 ctx.restore();
 return true;
}

async function preloadBattle(id){
 const num=String(Number(id));
 const pack=battleSprites[id]||(battleSprites[id]={loaded:false});
 const tried=[];
 async function tryLoad(key,url){tried.push(url);try{pack[key]=await loadImage(url);return true}catch(err){return false}}
 let okFront=await tryLoad('front',SHOWDOWN_FRONT+num+'.gif');
 if(!okFront) okFront=await tryLoad('front',SHOWDOWN_FRONT+num+'.png');
 let okBack=await tryLoad('back',SHOWDOWN_BACK+num+'.gif');
 if(!okBack) okBack=await tryLoad('back',SHOWDOWN_BACK+num+'.png');
 await tryLoad('art',OFFICIAL_ART+num+'.png');
 pack.loaded=!!(pack.front||pack.back||pack.art); pack.tried=tried;
 return pack;
}
function drawBattleSprite(id,x,y,scale=1,role='player',flash=0,angle=0,action='Idle',t=0,mods=null){
 const pack=battleSprites[id];
 const shadowScale=scale*1.02;
 contactShadow(x,y,shadowScale,false);
 if(!pack?.loaded)return false;
 const img=(role==='player'?(pack.back||pack.front||pack.art):(pack.front||pack.back||pack.art));
 if(!img)return false;
 const base=Math.min(154, Math.max(86, img.naturalHeight||img.height||96));
 const spriteScale=scale*(role==='player'?1.7:1.55)*(id==='0006'?1.05:1);
 const dh=base*spriteScale, dw=((img.naturalWidth||img.width||96)/(img.naturalHeight||img.height||96))*dh;
 let dx=0,dy=0,rot=0,sx=1,sy=1;
 if(action==='Walk'){const mm=characterForPmd(id).move.moveMods(t);dy+=mm.dy*1.4;sx*=mm.sx;sy*=mm.sy}
 else if(action==='Shoot'){const p=Math.sin(Math.min(t,.22)/.22*Math.PI);dx+=Math.cos(angle)*8*p;dy+=Math.sin(angle)*4*p-3.5*p;rot=.04*Math.sin(angle)*p; sx=1+.045*p; sy=1-.025*p}
 else if(action==='Hurt'){const q=Math.sin(t*35)*2.5;dx-=Math.cos(angle)*q*.7;dy-=Math.sin(angle)*q*.4;rot=.05*Math.sin(t*28)}
 if(mods){dx+=mods.dx;dy+=mods.dy;sx*=mods.sx;sy*=mods.sy;rot+=mods.tilt}
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(x+dx,y+dy);ctx.rotate(rot);ctx.scale(sx,sy);
 if(flash>0)ctx.globalAlpha=.78+.2*Math.cos(t*60);
 ctx.drawImage(img,-dw/2,-dh,dw,dh);
 ctx.restore();
 return true;
}

async function preload(id){
 const pack=sprites[id]={anims:{},loaded:false,variant:''};
 for(const variant of variantCandidates(id)){
  const root=pmdBasePath(id,variant);
  let metadata={};
  try{
   const xml=await loadXml(root+'AnimData.xml');
   for(const a of ACTIONS)metadata[a]=getAnim(xml,a);
  }catch(err){}
  const temp={};
  await Promise.all(ACTIONS.map(async a=>{
   try{
    let image=await loadImage(root+a+'-Anim.png');
    let m=metadata[a];
    if(!m?.w||!m?.h){
      const f=FALLBACK[a];
      m={w:({26:48,6:72,9:64,3:72}[Number(id)]||image.height/8||f[0]),h:image.height/8||f[1],dur:Array.from({length:Math.max(1,Math.round(image.width/(image.height/8||f[0])))},()=>8)}
    }
    if(image.width<m.w||image.height<m.h)throw Error('bad dimensions');
    const anim={image,w:m.w,h:m.h,dur:m.dur?.length?m.dur:[8],frames:Math.max(1,Math.floor(image.width/m.w)),dirs:Math.max(1,Math.floor(image.height/m.h))};
    anim.feet=measureSpriteFeet(anim);
    temp[a]=anim;
   }catch(err){}
  }));
  if(temp.Walk||temp.Idle||Object.keys(temp).length){
   pack.anims=temp;
   pack.loaded=!!(temp.Walk||temp.Idle||Object.keys(temp).length);
   pack.variant=variant;
   break;
  }
 }
 spriteLoadCount++;
 const loadedCount=unique.filter(key=>sprites[key]?.loaded).length;
 $('assetStatus').textContent=`PMD 스프라이트 확인 ${spriteLoadCount}/${unique.length} · 현재 ${loadedCount}종 성공 · 미연결 시 대체 이미지 사용`;
 if(roster.some(p=>p.id===id))refreshChoicePreviews();
}
$('fxMode').onclick=()=>{fxQuality=fxQuality==='high'?'low':'high';$('fxMode').textContent=fxQuality==='high'?'✦ 이펙트: 고화질':'⚙ 이펙트: 절전';};
let chosen=0;const choices=$('choices');for(let i=0;i<roster.length;i++){let o=roster[i],b=document.createElement('button');b.className='choice'+(!i?' on':'');b.innerHTML=`<canvas width="72" height="72" data-preview="${i}"></canvas><b>${o.name}</b><small>${o.icon} ${o.basic}</small>`;b.onclick=()=>{chosen=i;document.querySelectorAll('.choice').forEach((c,k)=>c.classList.toggle('on',k===i));refreshStatPanel();refreshLoadout();};choices.appendChild(b)}
const ivGrid=$('ivGrid');
$('natureSelect').innerHTML=NATURE_LIST.map(k=>`<option value="${k}">${NATURES[k].name}</option>`).join('');
$('natureSelect').addEventListener('change',e=>{selectedNature=e.target.value;refreshStatPanel()});
$('ivReroll').onclick=()=>{ivSets[chosen]=makeIV();refreshStatPanel()};
$('ivPerfect').onclick=()=>{ivSets[chosen]=Object.fromEntries(STAT_KEYS.map(k=>[k,31]));refreshStatPanel()};
function refreshStatPanel(){
 const sp=roster[chosen],iv=ivSets[chosen],stats=computeStats(chosen,iv,BATTLE_LEVEL,selectedNature);
 ivGrid.replaceChildren();
 for(const k of STAT_KEYS){
  const c=document.createElement('div');c.className='ivItem';
  const label=document.createElement('label');label.textContent=STAT_LABELS[k];
  const base=document.createElement('span');base.className='base';base.textContent='종족 '+sp.base[k];
  const input=document.createElement('input');input.type='number';input.min='0';input.max='31';input.step='1';input.value=iv[k];input.setAttribute('aria-label',STAT_LABELS[k]+' 개체값');
  input.addEventListener('input',()=>{if(input.value==='')return;iv[k]=Math.max(0,Math.min(31,Math.round(Number(input.value)||0)));const val=computeStats(chosen,iv,BATTLE_LEVEL,selectedNature)[k];output.textContent=k==='hp'?'실제 '+val+' · PvP '+arenaHP(val):'실제 '+val});
  input.addEventListener('change',()=>{input.value=iv[k]});
  const output=document.createElement('span');output.className='stat';output.textContent=k==='hp'?'실제 '+stats[k]+' · PvP '+arenaHP(stats[k]):'실제 '+stats[k];
  c.append(label,base,input,output);ivGrid.append(c);
 }
}
refreshStatPanel();refreshLoadout();

function refreshChoicePreviews(){document.querySelectorAll('[data-preview]').forEach(c=>{
 let i=+c.dataset.preview,p=roster[i],g=c.getContext('2d');g.clearRect(0,0,72,72);g.imageSmoothingEnabled=false;
 let anim=sprites[p.id]?.anims.Idle||sprites[p.id]?.anims.Walk;
 if(anim){
  const frame=0,dir=0,scale=Math.min(1.65,62/Math.max(1,anim.w),61/Math.max(1,anim.h));
  const dw=anim.w*scale,dh=anim.h*scale,feet=footOffset(anim,dir,frame)*scale;
  g.drawImage(anim.image,frame*anim.w,dir*anim.h,anim.w,anim.h,36-dw/2,69-feet,dw,dh)
 }else{
  const ow=overworldSprites[p.id];
  if(ow?.loaded){
   const img=ow.down||ow.right||ow.left||ow.up;
   const iw=img.naturalWidth||img.width||32, ih=img.naturalHeight||img.height||32;
   const scale=Math.min(64/iw,60/ih)*1.8, dw=iw*scale, dh=ih*scale;
   g.drawImage(img,36-dw/2,70-dh,dw,dh);
  }else{
   const pack=battleSprites[p.id];
   const img=pack?.art||pack?.back||pack?.front;
   if(img){
    const iw=img.naturalWidth||img.width||96, ih=img.naturalHeight||img.height||96;
    const scale=Math.min(60/iw,58/ih)*1.7, dw=iw*scale, dh=ih*scale;
    g.drawImage(img,36-dw/2,67-dh,dw,dh);
   }else drawFallbackCreature(p.id,36,69,p.id==='0006'?.86:1.07,0,Math.PI/2,g)
  }
 }
})}refreshChoicePreviews();
Promise.allSettled(unique.map(async id=>{await Promise.allSettled([preloadOverworld(id),preload(id),preloadBattle(id)])})).then(()=>{const count=unique.filter(id=>overworldSprites[id]?.loaded||battleSprites[id]?.loaded||sprites[id]?.loaded).length;$('assetStatus').textContent=count?`연결 확인 완료 · ${count}/${unique.length}종 PMD 8방향 sprite 사용`:'스프라이트 서버 접속 불가 · 대체 캐릭터로 계속 플레이 가능'; refreshChoicePreviews();});
const map={w:2400,h:1800};let player,enemies=[],projectiles=[],specialEffects=[],particles=[],gems=[],areas=[],kills=0,wave=1,time=0,spawnTimer=0,gameState='menu',last=0,shake=0,idCounter=0;let decals=[],damageTexts=[],shockwaves=[],hitstop=0,flashLevel=0,flashColor='#fff5cf',comboCount=0,comboClock=0,fxQuality='high',cameraKick={x:0,y:0};const ARENA={cx:map.w/2,cy:map.h/2,r:455};const mobileDevice=/iPhone|iPad|Android|Mobile/i.test(navigator.userAgent);const maxParticles=()=>fxQuality==='high'?(mobileDevice?380:560):(mobileDevice?140:220);const ELEMENT_FX={electric:{main:'#ffd63d',accent:'#7ef7ff',glow:'#fff4b0',ink:'#4a3208',hot:'#ffffff'},fire:{main:'#ff5f1f',accent:'#ffc857',glow:'#ff9a45',ink:'#3d120c',hot:'#fff3c8'},water:{main:'#3ec8f5',accent:'#e8ffff',glow:'#8ce8ff',ink:'#0f3d5c',hot:'#ffffff'},grass:{main:'#6ce85a',accent:'#e8ff9a',glow:'#b4ff86',ink:'#1d4a28',hot:'#f6ffe8'},ice:{main:'#9ceeff',accent:'#f4ffff',glow:'#c8f8ff',ink:'#1a4a68',hot:'#ffffff'},dragon:{main:'#8b7cff',accent:'#ffe8ff',glow:'#c4b8ff',ink:'#2a2458',hot:'#ffffff'},flying:{main:'#a8e4ff',accent:'#ffffff',glow:'#d4f4ff',ink:'#2a4a68',hot:'#ffffff'},poison:{main:'#c86ef0',accent:'#e8ff7a',glow:'#e0a8ff',ink:'#3a1848',hot:'#f8e8ff'},steel:{main:'#c8d8ec',accent:'#ffffff',glow:'#e4eef8',ink:'#2a3848',hot:'#ffffff'},ghost:{main:'#c48aff',accent:'#f0dcff',glow:'#dcb5ff',ink:'#2a1840',hot:'#ffffff'},neutral:{main:'#f2f6fb',accent:'#ffffff',glow:'#d9eef8',ink:'#1a2830',hot:'#ffffff'}};const keys=new Set(),joyVec={x:0,y:0};let mouseAim=null,lastAim={x:1,y:0},skillPointers=new Map(),joyPointer=null,toastTime=0,levelUpText='';
const mix=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),rand=(a,b)=>a+Math.random()*(b-a),len=(x,y)=>Math.hypot(x,y),norm=(x,y)=>{let z=len(x,y)||1;return{x:x/z,y:y/z}};
function footDust(x,y,size=1){
 if(Math.random()>.72)return;
 for(let i=0;i<2;i++)emitParticle({x:x+rand(-12,12)*size,y:y+rand(-3,2),vx:rand(-18,18),vy:rand(-12,-3),life:rand(.18,.34),size:rand(1.7,3.3),color:Math.random()<.5?'#9ac99a':'#456d57',shape:'dot',alpha:.5});
}
function emitParticle(o){const sz=Math.max(SPRITE_PX,Math.round((o.size||SPRITE_PX*2)/SPRITE_PX)*SPRITE_PX);particles.push({x:o.x,y:o.y,vx:o.vx||0,vy:o.vy||0,life:o.life||.4,max:o.max||o.life||.4,size:sz,color:o.color||'#fff',shape:o.shape||'dot',rot:o.rot||0,spin:o.spin||0,grow:o.grow||0,gravity:o.gravity||0,alpha:o.alpha??1,line:o.line||0,ink:o.ink||null});if(particles.length>maxParticles())particles.splice(0,particles.length-maxParticles());}
function fx(x,y,color,n=8,speed=100){for(let i=0;i<n;i++){let a=rand(0,Math.PI*2),s=rand(speed*.25,speed);emitParticle({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.15,.42),max:.42,size:SPRITE_PX*(1+(Math.random()<.45?1:0)),color,shape:Math.random()<.55?'spark':'dot'})}}
function arcadePal(element){return ELEMENT_FX[element]||ELEMENT_FX.neutral}
function elementalBurst(x,y,element='neutral',power=1){
 const pal=arcadePal(element);
 // Impact language from watched-03/06: floor rings + dust + jagged burst + radial lines + sparse sparks
 fxSpawnScene('impact', x, y, {element, power, range:Math.round(48+34*power), life:.42+.08*power});
 pxJaggedBurst(x,y, SPRITE_PX*(4+2*power), pal.ink, pal.main, pal.hot||'#fff', .95);
 pxRadialLines(x,y, SPRITE_PX*2, SPRITE_PX*(10+4*power), Math.round(10+6*power), pal.hot||'#fff', .9, .7);
 const sparks=Math.round(6+6*power);
 for(let i=0;i<sparks;i++){
  const a=rand(0,Math.PI*2), d=rand(SPRITE_PX*2, SPRITE_PX*(8+4*power));
  emitParticle({x:x+Math.cos(a)*d,y:y+Math.sin(a)*d*.7,vx:Math.cos(a)*rand(40,120)*power,vy:Math.sin(a)*rand(40,120)*power,life:rand(.12,.28),size:SPRITE_PX,color:i%2?pal.hot||'#fff':pal.main,shape:'dot',alpha:.95});
 }
 if(element==='fire'){
  for(let i=0;i<4;i++)pxDustClump(x+rand(-18,18),y+rand(-8,8),i,1,.8);
 }
 createRing(x,y,pal.main,SPRITE_PX*3,.4);
}

function trailFx(s){
 const pal=arcadePal(s.element);
 // stepped pixel ribbon under the projectile (arcade trail grammar)
 if(Math.random()<.85){
  emitParticle({x:s.x-s.vx*0.012+rand(-2,2),y:s.y-s.vy*0.012+rand(-2,2),life:.2,size:rand(5,8),color:pal.ink||'#1a2030',shape:'dot',alpha:.55});
  emitParticle({x:s.x+rand(-3,3),y:s.y+rand(-3,3),life:.22,size:rand(4,7),color:pal.main,shape:'dot',alpha:.9});
 }
 if(s.team==='enemy'){emitParticle({x:s.x+rand(-2,2),y:s.y+rand(-2,2),life:.2,size:rand(3,6),color:pal.main,shape:'dot'});return}
 if(s.element==='electric'){
  emitParticle({x:s.x+rand(-3,3),y:s.y+rand(-3,3),vx:rand(-40,40),vy:rand(-40,40),life:.18,size:rand(4,7),color:Math.random()<.5?pal.main:pal.accent,shape:'spark',rot:rand(0,7),spin:rand(-18,18)});
  if(Math.random()<.4)emitParticle({x:s.x,y:s.y,life:.12,size:3,color:pal.hot,shape:'dot'});
 }else if(s.element==='fire'){
  emitParticle({x:s.x+rand(-2,2),y:s.y+rand(-2,2),vx:-s.vx*.05+rand(-20,20),vy:-s.vy*.05+rand(-20,20),life:.26,size:rand(5,9),color:Math.random()<.45?pal.accent:pal.main,shape:'flame',grow:-2});
  if(Math.random()<.7)emitParticle({x:s.x-rand(0,8),y:s.y+rand(-4,4),vx:-s.vx*.03+rand(-10,4),vy:rand(-8,8),life:.14,size:4,color:pal.hot,shape:'dot'});
  if(Math.random()<.5)emitParticle({x:s.x-rand(2,10),y:s.y+rand(-5,5),vx:-s.vx*.04,vy:rand(-8,8),life:.18,size:3,color:'#ff8a2a',shape:'dot'});
 }else if(s.element==='water'){
  emitParticle({x:s.x+rand(-3,3),y:s.y+rand(-3,3),vx:-s.vx*.04+rand(-16,16),vy:-s.vy*.04+rand(-16,16),life:.26,size:rand(4,7),color:Math.random()<.4?pal.accent:pal.main,shape:Math.random()<.55?'drop':'dot',gravity:38});
  if(Math.random()<.35)emitParticle({x:s.x,y:s.y,life:.12,size:3,color:'#ffffff',shape:'dot'});
 }else if(s.element==='grass'){
  emitParticle({x:s.x+rand(-3,3),y:s.y+rand(-3,3),vx:-s.vx*.03+rand(-22,22),vy:-s.vy*.03+rand(-22,22),life:.32,size:rand(5,9),color:Math.random()<.5?pal.accent:pal.main,shape:Math.random()<.75?'leaf':'spark',rot:rand(0,7),spin:rand(-12,12)});
 }else{
  emitParticle({x:s.x+rand(-3,3),y:s.y+rand(-3,3),vx:rand(-30,30),vy:rand(-30,30),life:.2,size:rand(4,7),color:pal.main,shape:'spark'});
 }
}

function clampToArena(o,r){const dx=o.x-ARENA.cx,dy=o.y-ARENA.cy,d=Math.hypot(dx,dy);if(d>r){o.x=ARENA.cx+dx*r/d;o.y=ARENA.cy+dy*r/d}}
function createRing(x,y,color,r=15,life=.42){shockwaves.push({x,y,color,r,life,max:life});if(shockwaves.length>42)shockwaves.shift()}
function impactMark(x,y,type,power=1){decals.push({x,y,type,size:rand(19,30)*power,rotation:rand(0,6.28),age:0,life:type==='fire'?18:type==='water'?12:11,seed:Math.random()*1000});if(decals.length>48)decals.shift()}
function showDamage(x,y,damage,type='neutral',big=false){const colors={electric:'#fff3ab',fire:'#ffc69c',grass:'#baffad',water:'#bfeeff',neutral:'#ffffff',ghost:'#e9baff'};damageTexts.push({x:x+rand(-9,9),y:y-rand(36,53),n:Math.round(damage),age:0,life:.7,color:colors[type]||'#fff',big});if(damageTexts.length>30)damageTexts.shift()}
function cinematicImpact(x,y,type,power=1,damage=0){
 const pal=arcadePal(type);
 impactMark(x,y,type,power);
 createRing(x,y,pal.ink||'#1a2030',16+10*power,.28);
 createRing(x,y,pal.main,22+14*power,.42);
 createRing(x,y,pal.hot||'#fff',10+6*power,.22);
 flashColor=type==='fire'?'#ff8a3a':type==='water'?'#7adfff':type==='grass'?'#9eff6a':type==='electric'?'#ffe56a':type==='poison'?'#e0a0ff':type==='ice'?'#b8f4ff':'#fff2a4';
 flashLevel=Math.max(flashLevel,fxQuality==='high'?Math.min(.48,.28*power):Math.min(.28,.14*power));
 hitstop=Math.max(hitstop,Math.min(.12,.032+power*.034));
 shake=Math.max(shake,Math.min(18,5+power*6.2));
 cameraKick.x+=rand(-1.4,1.4)*power*4.2;cameraKick.y+=rand(-1.4,1.4)*power*4.2;
 // arcade X-burst + white core (shared hit language)
 elementalBurst(x,y,type,power*.85);
 fxSpawnScene('impact',x,y,{element:type,power,range:Math.min(130,58+power*28),life:.52});
 if(damage>0){showDamage(x,y,damage,type,power>1.1);comboCount=comboClock>0?comboCount+1:1;comboClock=2.2;}
 playImpactSound(type);
}
let audioNoiseBuffer=null;
function playImpactSound(type){
 try{if(!audioCtx||audioCtx.state!=='running')return;const t=audioCtx.currentTime;
 const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type==='electric'?'sawtooth':type==='water'?'sine':'triangle';
 const base=type==='fire'?130:type==='water'?230:type==='grass'?360:type==='windup'?210:690;
 o.frequency.setValueAtTime(base*1.45,t);o.frequency.exponentialRampToValueAtTime(Math.max(40,base*.45),t+.11);
 g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.033,t+.007);g.gain.exponentialRampToValueAtTime(.0001,t+.14);
 o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+.15);
 }catch(err){}
}
const battleArt=document.createElement('canvas');battleArt.width=battleArt.height=1180;
let battleArtReady=false;
function pseudoNoise(a,b){let t=Math.sin(a*127.1+b*311.7+74.7)*43758.5453;return t-Math.floor(t)}
function paintBattleArt(){
 const theme=roster[chosen]?.type||'electric';
 const tint={electric:'#d1bb75',fire:'#a95d4c',water:'#459cb0',grass:'#63ab7b'}[theme];
 const glow={electric:'#f5e3a0',fire:'#f9aa81',water:'#96efff',grass:'#bdf4b1'}[theme];
 const g=battleArt.getContext('2d');g.imageSmoothingEnabled=false;
 const c=590,R=485;
 g.fillStyle='#183c32';g.fillRect(0,0,1180,1180);
 // Forest floor, layered tiny grass and earth freckles drawn only once.
 for(let j=0;j<1180;j+=30)for(let i=0;i<1180;i+=30){const n=pseudoNoise(i,j);
  g.fillStyle=n>.66?'#225344':n>.3?'#1d4b3d':'#1b4738';g.fillRect(i,j,30,30);
  if(n>.50){g.fillStyle='#4c8462';for(let k=0;k<3;k++){const x=i+5+k*9+Math.floor(n*5),y=j+7+((k*7+Math.floor(n*18))%20);g.fillRect(x,y,2,6);g.fillRect(x+4,y+2,2,4)}}
 }
 // The stone and earth combat circle: a full constructed environment.
 g.save();g.translate(c,c);
 g.fillStyle='#0b2828';g.beginPath();g.arc(0,9,R+26,0,7);g.fill();
 for(let i=0;i<48;i++){let a=i*Math.PI*2/48,r=R+10,x=Math.cos(a)*r,y=Math.sin(a)*r;
  g.save();g.translate(x,y);g.rotate(a+Math.PI/2);g.fillStyle=i%3?'#496c65':'#385950';g.fillRect(-31,-13,61,28);g.fillStyle='#60877a';g.fillRect(-29,-11,57,5);g.fillStyle='#274942';g.fillRect(-28,10,56,4);g.restore()}
 const floor=g.createRadialGradient(-120,-180,70,0,0,R);floor.addColorStop(0,'#607a67');floor.addColorStop(.5,'#4b675b');floor.addColorStop(.91,'#3a564c');floor.addColorStop(1,'#263f3b');
 g.fillStyle=floor;g.beginPath();g.arc(0,0,R-12,0,7);g.fill();
 g.save();g.beginPath();g.arc(0,0,R-14,0,7);g.clip();
 // Broken stone block mesh with nonuniform wear.
 for(let y=-R;y<R;y+=58)for(let x=-R;x<R;x+=58){const k=pseudoNoise(x,y),off=((Math.round(y/58)&1)?26:0),xx=x+off;
 g.fillStyle=k>.7?'#98ab8a14':k>.4?'#a1c39a0d':'#0b26251b';g.fillRect(xx+3,y+3,54,52);
 g.strokeStyle='#1d393843';g.lineWidth=2;g.strokeRect(xx+3,y+3,54,52);
 if(k>.79){g.strokeStyle='#182f2977';g.beginPath();g.moveTo(xx+9,y+9);g.lineTo(xx+28,y+29);g.lineTo(xx+33,y+48);g.stroke()}}
 for(let i=0;i<450;i++){const a=i*2.39996,rad=Math.sqrt((i+.2)/450)*(R-17),x=Math.cos(a)*rad,y=Math.sin(a)*rad,n=pseudoNoise(i,11);
 g.fillStyle=n>.6?'#a2bcae38':'#213e3a66';g.fillRect(x,y,n*3+1,n*2+1)}
 g.restore();
 g.globalAlpha=.16;g.fillStyle=tint;g.beginPath();g.arc(0,0,R-14,0,7);g.fill();g.globalAlpha=1;
 // Element-specific floor relics: these are baked into the texture once.
 for(let i=0;i<42;i++){
   let a=i*2.399963,r=Math.sqrt((i+2)/44)*(R-75),x=Math.cos(a)*r,y=Math.sin(a)*r;
   if(theme==='electric'){g.strokeStyle='#e6d49b79';g.lineWidth=1.5;g.beginPath();g.moveTo(x-10,y+5);g.lineTo(x,y-5);g.lineTo(x+4,y+1);g.lineTo(x+11,y-8);g.stroke()}
   else if(theme==='fire'){g.fillStyle='#402f2b99';g.beginPath();g.ellipse(x,y,13,5,Math.sin(a),0,7);g.fill();g.strokeStyle='#d792636e';g.lineWidth=1.4;g.beginPath();g.moveTo(x-8,y+1);g.lineTo(x+2,y-3);g.lineTo(x+10,y+2);g.stroke()}
   else if(theme==='water'){g.strokeStyle='#99dfdd89';g.lineWidth=1.7;g.beginPath();g.ellipse(x,y,13,5,-a,0,7);g.stroke();g.fillStyle='#76d8de37';g.beginPath();g.ellipse(x-2,y+1,8,3,-a,0,7);g.fill()}
   else {g.strokeStyle='#c1eaa185';g.lineWidth=1.5;g.beginPath();g.moveTo(x-8,y+5);g.quadraticCurveTo(x,y-9,x+7,y-7);g.stroke();g.fillStyle='#82d59685';g.beginPath();g.ellipse(x,y,5,2.2,a,0,7);g.fill()}
 }
 // Circular inlays to anchor a recognizable duel space.
 for(const [r,w,color] of [[R-29,4,'#a7bd95a8'],[R-54,2,'#182f2a99'],[305,4,'#b1c9a165'],[285,1.8,'#0c2d2b72'],[170,3,'#bad5b377'],[154,1.2,'#1d3b3580']]){g.strokeStyle=color;g.lineWidth=w;g.beginPath();g.arc(0,0,r,0,7);g.stroke()}
 for(let i=0;i<16;i++){const a=i*Math.PI/8;g.save();g.rotate(a);g.fillStyle=glow+'88';g.beginPath();g.moveTo(0,-R+42);g.lineTo(-9,-R+62);g.lineTo(0,-R+82);g.lineTo(9,-R+62);g.closePath();g.fill();g.restore()}
 // Center floor emblem (under feet, with no collision effects).
 g.globalAlpha=.16;g.fillStyle='#0c2f34';g.beginPath();g.arc(0,0,76,0,7);g.fill();g.strokeStyle=glow;g.lineWidth=8;g.beginPath();g.arc(0,0,76,0,7);g.stroke();g.beginPath();g.moveTo(-74,0);g.lineTo(74,0);g.stroke();g.beginPath();g.arc(0,0,19,0,7);g.stroke();g.globalAlpha=1;
 g.restore();
 // Blooming bushes, flowers and stone shrines OUTSIDE the arena.
 for(let i=0;i<100;i++){let a=i*2.399963,r=525+70*pseudoNoise(i,87),x=c+Math.cos(a)*r,y=c+Math.sin(a)*r;
  let n=pseudoNoise(i,94);g.fillStyle=n>.3?'#174935':'#113b31';g.beginPath();g.ellipse(x,y+7,18+n*12,7,0,0,7);g.fill();
  for(let k=0;k<4;k++){g.fillStyle=k%2?'#2f7950':'#3d8d61';g.beginPath();g.arc(x+Math.sin(i*2+k*2)*12,y-3+Math.cos(k*3+i)*7,8+n*7,0,7);g.fill()}
  if(i%5===0){g.fillStyle=i%2?'#edbc81':'#f3d1ba';g.fillRect(x,y-12,3,4)}
 }
 for(let k=0;k<8;k++){const a=(k+.5)*Math.PI/4,x=c+Math.cos(a)*545,y=c+Math.sin(a)*545;
   g.save();g.translate(x,y);g.rotate(a);g.fillStyle='#09272299';g.beginPath();g.ellipse(0,13,23,12,0,0,7);g.fill();g.fillStyle='#547369';g.fillRect(-16,-12,32,25);g.fillStyle='#90a795';g.fillRect(-14,-11,28,6);g.fillStyle='#334c48';g.fillRect(-12,2,24,9);g.restore()}
 battleArtReady=true;
}
paintBattleArt();
function paintArenaFloor(ox,oy){
 ctx.fillStyle='#102e2e';ctx.fillRect(0,0,W,H);
 ctx.save();ctx.translate(ox+ARENA.cx-battleArt.width/2,oy+ARENA.cy-battleArt.height/2);ctx.drawImage(battleArt,0,0);ctx.restore();
}
function renderDecals(){
 for(const d of decals){const alpha=clamp(1-d.age/d.life,0,1);ctx.save();ctx.globalAlpha=Math.min(.86,alpha*1.2);const z=Math.max(8,d.size),cx=d.x,cy=d.y;
  if(d.type==='fire'){for(let yy=-z*.5;yy<=z*.5;yy+=6)for(let xx=-z;xx<=z;xx+=6){if((xx/z)**2+(yy/(z*.53))**2<1)pxRect(cx+xx,cy+yy,6,6,Math.abs(xx)<z*.5?'#312921':'#594031',.82)}for(let j=-2;j<=2;j++)pxRect(cx+j*7,cy-z*.4+Math.abs(j)*4,5,5,'#d47c3d',.5)}
  else if(d.type==='electric'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5,vx=Math.cos(a),vy=Math.sin(a);pxLine(cx,cy,cx+vx*z*.5,cy+vy*z*.42,4,'#e9d69a',.6);pxLine(cx+vx*z*.5,cy+vy*z*.42,cx+vx*z,cy+vy*z*.8,4,'#e9d69a',.6)}}
  else if(d.type==='water'){for(let yy=-z*.58;yy<=z*.58;yy+=6)for(let xx=-z*1.48;xx<=z*1.48;xx+=6){if((xx/(z*1.48))**2+(yy/(z*.58))**2<1)pxRect(cx+xx,cy+yy,6,6,yy<0?'#278cad':'#3ca9bf',.43)}pxRing(cx,cy,z*.9,5,'#a5f7ff',.45,6)}
  else {for(let yy=-z*.5;yy<=z*.5;yy+=6)for(let xx=-z;xx<=z;xx+=6){if((xx/z)**2+(yy/(z*.56))**2<1)pxRect(cx+xx,cy+yy,6,6,'#367d54',.45)}for(let j=0;j<5;j++){pxLine(cx+j*6-13,cy+2,cx+j*7-14,cy-z*.32,4,'#b3e690',.65)}}
 ctx.restore();}
}
function renderImpactLights(){
 if(fxQuality==='low')return;ctx.save();ctx.globalCompositeOperation='screen';
 for(const a of shockwaves){const alpha=clamp(a.life/a.max,0,1),r=Math.max(SPRITE_PX*4,Math.round(a.r*(1.1+(1-alpha)*.7)/SPRITE_PX)*SPRITE_PX);pxFloorRing(a.x,a.y,r,r*.55,a.color,alpha*.55);pxFloorRing(a.x,a.y,Math.max(SPRITE_PX*3,r*.7),Math.max(SPRITE_PX*2,r*.38),a.color,alpha*.35)}
 ctx.restore();ctx.globalAlpha=1;
}
function renderShockwaves(){
 ctx.save();for(const a of shockwaves){const k=1-a.life/a.max,rr=Math.round((a.r+70*k)/SPRITE_PX)*SPRITE_PX;pxFloorRing(a.x,a.y,rr,rr*.55,a.color,(1-k)*.75);pxFloorRing(a.x,a.y,Math.round((a.r*.65+110*k)/SPRITE_PX)*SPRITE_PX,Math.round((a.r*.35+60*k)/SPRITE_PX)*SPRITE_PX,a.color,(1-k)*.45)}ctx.restore();
}
function renderDamageText(){
 for(const a of damageTexts){const k=a.age/a.life,alpha=clamp((1-k)*1.6,0,1),y=a.y-42*(1-(1-k)**2);
  ctx.save();ctx.globalAlpha=alpha;fxBitmapNumber('-'+Math.round(a.n),a.x,y,a.big?4:3,a.color);ctx.restore();
 }
}
function updateCinematic(dt){
 fxStepScenes(dt);
 for(const d of decals)d.age+=dt;decals=decals.filter(d=>d.age<d.life);
 for(const d of damageTexts)d.age+=dt;damageTexts=damageTexts.filter(d=>d.age<d.life);
 for(const d of shockwaves)d.life-=dt;shockwaves=shockwaves.filter(d=>d.life>0);
 flashLevel=Math.max(0,flashLevel-dt*2.8);cameraKick.x*=Math.pow(.007,dt);cameraKick.y*=Math.pow(.007,dt);
 if(comboClock>0)comboClock=Math.max(0,comboClock-dt);else comboCount=0;
 const combo=$('comboBadge');if(comboCount>=2&&comboClock>0){combo.textContent=`${comboCount} HIT COMBO`;combo.classList.add('show')}else combo.classList.remove('show');
 const f=$('impactFlash');f.style.background=flashColor;f.style.opacity=flashLevel.toFixed(3);
}


// Classic Substitute doll art in *source texels* (same scale language as heroes: × SPRITE_SCALE).
// Footprint 32×40 texels — matches typical PMD walk sprite size used by the four heroes.
const SUB_DOLL_W_TEXELS=32, SUB_DOLL_H_TEXELS=40;
function drawSubstituteDoll(x,y,flash=0,t=0){
 // Classic doll: green body, white face, angry eyes, stick arms, little feet. SPRITE_PX grid, no blur.
 contactShadow(x,y,SPRITE_SCALE*1.1,false);
 const sc=SPRITE_SCALE;
 const ink='#163820', body='#42c45e', bodyDeep='#2f9a48', face='#ffffff', faceShade='#e8efe6';
 const stick='#7a5230', stickDark='#4e321c', foot='#246638', eye='#101410', brow='#0a0e0a';
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(flash>0)ctx.globalAlpha=.72+Math.cos(t*50)*.22;
 // Local source-texel coords: (0,0) = feet; draw upward like hero sprites.
 const put=(tx,ty,col,a=1)=>{pxTex(x+tx*sc, y+ty*sc, col, a)};
 // green body (tall rounded plush)
 for(let ty=-38;ty<=-3;ty++)for(let tx=-13;tx<=13;tx++){
  const cy=ty+20.5, cx=tx;
  if((cx*cx)/(12.2*12.2)+(cy*cy)/(17.8*17.8)>1)continue;
  const rim=Math.abs(tx)>=11||ty<=-36||ty>=-5;
  put(tx,ty, rim?ink:(Math.abs(tx)>7||ty<-32?bodyDeep:body));
 }
 // ear/horn nubs
 for(const s of [-1,1]){put(s*4,-39,body);put(s*3,-40,body);put(s*3,-39,ink);put(s*4,-40,ink)}
 // large white face plate (reads at battle scale)
 for(let ty=-30;ty<=-11;ty++)for(let tx=-9;tx<=9;tx++){
  const cy=ty+20.5, cx=tx;
  if((cx*cx)/(8.4*8.4)+(cy*cy)/(9.6*9.6)>1)continue;
  put(tx,ty, (Math.abs(tx)>=8||ty<=-29||ty>=-12)?faceShade:face);
 }
 // angry brows (\\ /) + eyes
 put(-6,-26,brow);put(-5,-26,brow);put(-4,-25,brow);put(-7,-25,brow);
 put(6,-26,brow);put(5,-26,brow);put(4,-25,brow);put(7,-25,brow);
 put(-5,-23,eye);put(-4,-23,eye);put(-5,-22,eye);put(-4,-22,eye);
 put(5,-23,eye);put(4,-23,eye);put(5,-22,eye);put(4,-22,eye);
 // angry mouth
 put(-3,-16,eye);put(-2,-15,eye);put(-1,-15,eye);put(0,-15,eye);put(1,-15,eye);put(2,-15,eye);put(3,-16,eye);
 put(-2,-14,eye);put(2,-14,eye);
 // stick arms (clear brown sticks out from sides)
 for(let i=0;i<9;i++){
  put(-14-Math.floor(i/4), -24+i, i%3===0?stickDark:stick);
  put(14+Math.floor(i/4), -24+i, i%3===0?stickDark:stick);
 }
 put(-16,-16,stick);put(-17,-15,stickDark);put(-16,-14,stick);
 put(16,-16,stick);put(17,-15,stickDark);put(16,-14,stick);
 // little feet
 put(-6,-2,foot);put(-5,-2,foot);put(-4,-2,foot);put(-6,-1,ink);put(-5,-1,foot);put(-4,-1,ink);
 put(6,-2,foot);put(5,-2,foot);put(4,-2,foot);put(6,-1,ink);put(5,-1,foot);put(4,-1,ink);
 ctx.restore();
}
function spawnSubstituteDoll(atX,atY){
 const x=atX??(ARENA.cx+180), y=atY??ARENA.cy;
 const stats={hp:200,atk:50,def:80,spa:50,spd:80,spe:40};
 return {uid:++idCounter,id:'sub',isSubstitute:true,kind:-1,type:'normal',types:['normal'],level:50,iv:makeIV(),stats,
  x,y,hp:8000,maxHp:8000,speed:0,r:18,atk:999,flash:0,face:Math.PI,actionT:0,hurt:0,shoot:999,tell:0,
  attackVec:{x:-1,y:0},specialCd:999,channeling:false,action:'Idle',fuel:100,maxFuel:100,actLeft:0,
  status:null,spdefStage:0,spdefTimer:0,defStage:0,defTimer:0,staggerT:0,seeded:null,extraCd:999,extraLoadout:[]};
}
function refreshLabHeroButtons(){
 const row=$('labHeroRow');if(!row)return;row.innerHTML='';
 roster.forEach((p,i)=>{const b=document.createElement('button');b.textContent=p.icon+' '+p.name;b.dataset.i=i;if(i===chosen)b.classList.add('on');
  b.onclick=()=>labSelectHero(i);row.appendChild(b)});
}
function refreshLabSkillButtons(){
 const row=$('labSkillRow');if(!row)return;row.innerHTML='';
 const p=roster[chosen];
 const skills=[
  {n:0,label:'1 '+p.basic},
  {n:1,label:'2 '+p.special},
  {n:3,label:'3 '+(equippedMove(player,3)?.name||'추가1')},
  {n:4,label:'4 '+(equippedMove(player,4)?.name||'추가2')}
 ];
 for(const s of skills){const b=document.createElement('button');b.className='fire';b.textContent=s.label;b.onclick=()=>{if(gameState==='playing'){const aim=labAim();activate(s.n,aim,s.n===1&&roster[chosen].type==='fire');if(s.n===1&&roster[chosen].type==='fire')setTimeout(stopPlayerChannel,900)}};row.appendChild(b)}
}
function labAim(){
 const doll=enemies[0];
 if(doll)return norm(doll.x-player.x,doll.y-player.y);
 return lastAim.x||lastAim.y?lastAim:{x:1,y:0};
}
function labSelectHero(i){
 if(!labMode)return;
 chosen=Math.max(0,Math.min(3,i));
 const p=roster[chosen];
 const keepX=player?.x??ARENA.cx-120, keepY=player?.y??ARENA.cy;
 const doll=enemies[0]?.isSubstitute?{x:enemies[0].x,y:enemies[0].y}:null;
 // Rebuild player with new species; keep lab flags.
 const level=BATTLE_LEVEL,iv={...ivSets[chosen]},stats=computeStats(chosen,iv,level,selectedNature);
 player={x:keepX,y:keepY,kind:chosen,type:p.type,types:p.types,level,iv,stats,hp:arenaHP(stats.hp),maxHp:arenaHP(stats.hp),speed:speedFromStat(stats.spe),r:17,aim:0,face:0,animT:0,action:'Idle',actLeft:0,inv:0,cd:[0,0,0,0,0],dmgBonus:0,fireBonus:0,xp:0,need:24,dashTime:0,dashX:0,dashY:0,moveT:0,channelAim:{x:1,y:0},fuel:100,maxFuel:100,status:null,spdefStage:0,spdefTimer:0,defStage:0,defTimer:0,staggerT:0,seeded:null};
 specialEffects=[];projectiles=[];particles=[];
 enemies=[spawnSubstituteDoll(doll?.x,doll?.y)];
 $('playerName').textContent=p.icon+' '+p.name+' · 시험';
 $('basicSkill').textContent=p.icon;$('basicLabel').textContent=p.basic;$('bigLabel').textContent=p.special;updateExtraButtons();
 $('bigSkill').textContent=p.type==='grass'?'◉':p.type==='water'?'≋':p.type==='fire'?'♨':'ϟ';
 $('fuelHud').hidden=p.type!=='fire';$('fuelButton').hidden=p.type!=='fire';
 $('bigSkill').parentElement.style.setProperty('--c',p.color);
 document.querySelector('[data-n="0"]').style.setProperty('--c',p.color);
 $('enemyName').textContent='🧸 대타출동 인형';
 $('roundBadge').textContent='기술 시험 · VFX LAB';
 paintBattleArt();fxPixelSkillIcons();refreshLabHeroButtons();refreshLabSkillButtons();syncHUD();
 lastAim={x:1,y:0};player.face=0;announce(p.name+' 선택');
}
function bootVfxLab(){
 labMode=true;labDollKO=0;
 chosen=Math.max(0,Math.min(3,+(location.hash.match(/p=(\d)/)||[])[1]||1));
 document.querySelectorAll('.choice').forEach((c,k)=>c.classList.toggle('on',k===chosen));
 refreshStatPanel();refreshLoadout();refreshMoveDex();
 // Start battle shell without rival AI.
 const p=roster[chosen],level=BATTLE_LEVEL,iv={...ivSets[chosen]},stats=computeStats(chosen,iv,level,selectedNature);
 player={x:ARENA.cx-140,y:ARENA.cy,kind:chosen,type:p.type,types:p.types,level,iv,stats,hp:arenaHP(stats.hp),maxHp:arenaHP(stats.hp),speed:speedFromStat(stats.spe),r:17,aim:0,face:0,animT:0,action:'Idle',actLeft:0,inv:0,cd:[0,0,0,0,0],dmgBonus:0,fireBonus:0,xp:0,need:24,dashTime:0,dashX:0,dashY:0,moveT:0,channelAim:{x:1,y:0},fuel:100,maxFuel:100,status:null,spdefStage:0,spdefTimer:0,defStage:0,defTimer:0,staggerT:0,seeded:null};
 enemies=[spawnSubstituteDoll(ARENA.cx+160,ARENA.cy)];
 projectiles=[];specialEffects=[];particles=[];gems=[];areas=[];decals=[];damageTexts=[];shockwaves=[];vfxScenes=[];
 hitstop=0;flashLevel=0;comboCount=0;comboClock=0;cameraKick={x:0,y:0};kills=0;wave=1;time=0;spawnTimer=0;shake=0;idCounter=2;
 lastAim={x:1,y:0};mouseAim=null;skillPointers.clear();joyPointer=null;joyVec.x=joyVec.y=0;
 gameState='playing';$('menu').classList.add('hidden');
 $('playerName').textContent=p.icon+' '+p.name+' · 시험';
 $('enemyName').textContent='🧸 대타출동 인형';
 $('basicSkill').textContent=p.icon;$('basicLabel').textContent=p.basic;$('bigLabel').textContent=p.special;updateExtraButtons();
 $('bigSkill').textContent=p.type==='grass'?'◉':p.type==='water'?'≋':p.type==='fire'?'♨':'ϟ';
 $('fuelHud').hidden=p.type!=='fire';$('fuelButton').hidden=p.type!=='fire';
 $('bigSkill').parentElement.style.setProperty('--c',p.color);
 document.querySelector('[data-n="0"]').style.setProperty('--c',p.color);
 $('roundBadge').textContent='기술 시험 · VFX LAB';
 $('aimHelp').textContent='기술 시험 · #vfxlab · 대타출동 인형';
 $('tips').textContent='QWER 영웅 · 1234 기술 · WASD 이동 · 인형은 반격하지 않음';
 $('vfxLabBar').classList.add('show');
 paintBattleArt();fxPixelSkillIcons();refreshLabHeroButtons();refreshLabSkillButtons();syncHUD();
 announce('기술 시험 시작');
 document.documentElement.dataset.vfxlab='1';
 const mirror=()=>{window.__specialEffects=specialEffects;window.__player=player;window.__enemy=enemies&&enemies[0];window.__labMode=labMode;requestAnimationFrame(mirror)};
 requestAnimationFrame(mirror);
}
function reset(){
 labMode=false;labDollKO=0;const labBar=$('vfxLabBar');if(labBar)labBar.classList.remove('show');
 const p=roster[chosen],level=BATTLE_LEVEL,iv={...ivSets[chosen]},stats=computeStats(chosen,iv,level,selectedNature);
 player={x:map.w/2,y:map.h/2,kind:chosen,type:p.type,types:p.types,level,iv,stats,hp:arenaHP(stats.hp),maxHp:arenaHP(stats.hp),speed:speedFromStat(stats.spe),r:17,aim:0,face:Math.PI/2,animT:0,action:'Idle',actLeft:0,inv:0,cd:[0,0,0,0,0],dmgBonus:0,fireBonus:0,xp:0,need:24,dashTime:0,dashX:0,dashY:0,moveT:0,channelAim:{x:0,y:-1},fuel:100,maxFuel:100,status:null,spdefStage:0,spdefTimer:0,defStage:0,defTimer:0,staggerT:0,seeded:null};
 enemies=[];projectiles=[];specialEffects=[];particles=[];gems=[];areas=[];decals=[];damageTexts=[];shockwaves=[];vfxScenes=[];hitstop=0;flashLevel=0;comboCount=0;comboClock=0;cameraKick={x:0,y:0};kills=0;wave=1;time=0;spawnTimer=0;shake=0;idCounter=0;lastAim={x:0,y:-1};mouseAim=null;skillPointers.clear();joyPointer=null;joyVec.x=joyVec.y=0;
 $('nub').style.transform='';document.querySelectorAll('.skill.selected').forEach(e=>e.classList.remove('selected'));
 gameState='playing';$('menu').classList.add('hidden');$('comboBadge').classList.remove('show');$('playerName').textContent=p.icon+' '+p.name+' Lv.'+BATTLE_LEVEL;
 $('basicSkill').textContent=p.icon;$('basicLabel').textContent=p.basic;$('bigLabel').textContent=p.special;updateExtraButtons();
 $('bigSkill').textContent=p.type==='grass'?'◉':p.type==='water'?'≋':p.type==='fire'?'♨':'ϟ';$('fuelHud').hidden=p.type!=='fire';$('fuelButton').hidden=p.type!=='fire';
 $('bigSkill').parentElement.style.setProperty('--c',p.color);
 document.querySelector('[data-n="0"]').style.setProperty('--c',p.color);
 fxPixelSkillIcons();paintBattleArt();spawnEnemy();syncHUD();const arenaNames={electric:'THUNDER TEMPLE',fire:'EMBER FORGE',water:'TIDAL RUINS',grass:'VERDANT SHRINE'};$('roundBadge').textContent=arenaNames[p.type]+'  ·  1 VS 1';announce('READY · FIGHT!');
}
function pause(){if(gameState==='playing'){stopPlayerChannel();gameState='paused';$('menu').classList.remove('hidden');$('menu').querySelector('h1').innerHTML='PAUSED <em>Ⅱ</em>';$('menuExplain').innerHTML='잠시 쉬어가세요. 전투 기록은 유지됩니다.';$('start').textContent='계속 플레이';}else if(gameState==='paused'){gameState='playing';$('menu').classList.add('hidden')}}
function startButton(){try{if(gameState==='paused')pause();else reset()}catch(err){alert('게임 실행 오류: '+err.message);console.error(err)}}$('start').onclick=startButton;$('pause').onclick=pause;
// SpriteCollab sheet rows: S=0, SE=1, E=2, NE=3, N=4, NW=5, W=6, SW=7.
// Canvas input angles: right=0, down=PI/2, left=PI, up=-PI/2.
function faceFromAngle(a){const step=Math.round(a/(Math.PI/4));return ((2-step)%8+8)%8}
function contactShadow(x,y,scale=1,airborne=false){
 ctx.save();ctx.translate(x,y+1);
 const width=15*scale,height=5*scale;
 // Large diffused penumbra plus a dark, flat contact patch. The shadow is
 // ALWAYS centered at the world-space feet coordinate, not above/below it.
 ctx.fillStyle='rgba(4,25,23,.10)';ctx.beginPath();ctx.ellipse(0,2,width*1.58,height*1.85,0,0,Math.PI*2);ctx.fill();
 const gradient=ctx.createRadialGradient(0,0,0,0,0,width*1.2);
 gradient.addColorStop(0,airborne?'rgba(3,24,25,.25)':'rgba(2,20,19,.66)');
 gradient.addColorStop(.55,airborne?'rgba(3,24,25,.14)':'rgba(3,24,23,.38)');
 gradient.addColorStop(1,'rgba(4,22,22,0)');
 ctx.save();ctx.scale(1,.34);ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(0,0,width*1.2,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.fillStyle=airborne?'rgba(2,22,22,.21)':'rgba(0,18,16,.4)';ctx.beginPath();ctx.ellipse(0,0,width*.63,height*.45,0,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function drawFallbackCreature(id,x,y,scale=1,t=0,angle=Math.PI/2,renderCtx=ctx){
 const ch=characterForPmd(id);
 if(ch?.images?.drawFallbackArt){ ch.images.drawFallbackArt(x,y,scale,t,angle,renderCtx); return; }
}
function spriteDraw(id,x,y,angle,action,t,scale=1,flash=0,role='player',actor=null){
 const poseActor=actor||(role==='player'?player:null);
 const pose=poseActor?.castPose;
 const poseK=pose?castPoseEnvelope(pose.age,pose.life):0;
 const mods=poseK>0?castPoseDrawMods(id,angle,poseK):null;
 const sp=sprites[id]?.anims||{},s=sp[action]||sp.Walk||sp.Idle;
 if(s){
  const shadowScale=scale*(id==='0092'?.85:1);
  contactShadow(x,y,shadowScale,id==='0092');
  let face=faceFromAngle(angle),f=((face%s.dirs)+s.dirs)%s.dirs,
   frames=Math.min(s.frames,s.dur.length||s.frames),clock=t*60,idx=0;
  if(frames>1){const sum=s.dur.slice(0,frames).reduce((a,b)=>a+b,0)||1;clock%=sum;
   for(let i=0;i<frames;i++){if(clock<(s.dur[i]||8)){idx=i;break}clock-=s.dur[i]||8}}
  const feet=footOffset(s,f,idx),dw=s.w*scale,dh=s.h*scale;
  let dx=0,dy=0,sx=1,sy=1,tilt=0;
  if(action==='Walk'){const mm=characterForPmd(id).move.moveMods(t);dy+=mm.dy;sx*=mm.sx;sy*=mm.sy;dx+=mm.dx;tilt+=mm.tilt}
  else if(action==='Shoot'){const p=Math.sin(Math.min(t,.22)/.22*Math.PI);dx+=Math.cos(angle)*6*p;dy+=Math.sin(angle)*4*p-2.5*p;sx=1+.06*p;sy=1-.04*p;tilt=.06*Math.sin(angle)*p}
  else if(action==='Hurt'){const q=Math.sin(t*42)*3;dx-=Math.cos(angle)*q*.7;dy-=Math.sin(angle)*q*.45;tilt=.08*Math.sin(t*36)}
  else if(action==='Attack'&&mods){dx+=mods.dx;dy+=mods.dy;sx*=mods.sx;sy*=mods.sy;tilt+=mods.tilt}
  if(mods&&action!=='Attack'){dx+=mods.dx;dy+=mods.dy;sx*=mods.sx;sy*=mods.sy;tilt+=mods.tilt}
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(flash>0)ctx.globalAlpha=.65+Math.cos(t*65)*.25;
  ctx.translate(x+dx,y+dy-feet*scale+dh/2);ctx.rotate(tilt);ctx.scale(sx,sy);
  ctx.drawImage(s.image,idx*s.w,f*s.h,s.w,s.h,-dw/2,-dh/2,dw,dh);
  ctx.restore();
  if(mods)drawCastOverlays(id,x+dx,y+dy,angle,mods);
  return;
 }
 if(drawOverworldSprite(id,x,y,angle,action,t,scale,flash,mods)){if(mods)drawCastOverlays(id,x+(mods?.dx||0),y+(mods?.dy||0),angle,mods);return;}
 if(drawBattleSprite(id,x,y,scale,role,flash,angle,action,t,mods)){if(mods)drawCastOverlays(id,x+(mods?.dx||0),y+(mods?.dy||0),angle,mods);return;}
 contactShadow(x,y,scale*(id==='0092'?.85:1),id==='0092');
 drawFallbackCreature(id,x+(mods?.dx||0),y+(mods?.dy||0),scale,t,angle);
 if(mods)drawCastOverlays(id,x+(mods?.dx||0),y+(mods?.dy||0),angle,mods);
}



function combatantData(idx){const p=roster[idx],level=BATTLE_LEVEL,iv=makeIV(),stats=computeStats(idx,iv,level,'neutral');return {id:p.id,name:p.name,type:p.type,types:p.types,level,iv,stats,maxHp:arenaHP(stats.hp),speed:speedFromStat(stats.spe),color:p.color,icon:p.icon,special:p.special,basic:p.basic}}
function spawnEnemy(){
 if(enemies.length!==0)return;
 let preferred=Number($('rivalSelect').value);let pool=preferred>=0?[preferred]:roster.map((_,i)=>i).filter(i=>i!==chosen);
 if(!pool.length)pool=[chosen];
 const idx=pool[Math.floor(Math.random()*pool.length)],f=combatantData(idx);
 const side=Math.random()<.5?-1:1;
 const x=clamp(player.x+side*Math.min(120,W*.24),60,map.w-60);
 const y=clamp(player.y-Math.min(205,Math.max(120,H*.23)),60,map.h-60);
 enemies.push({uid:++idCounter,id:f.id,kind:idx,type:f.type,types:f.types,level:f.level,iv:f.iv,stats:f.stats,x,y,hp:f.maxHp,maxHp:f.maxHp,speed:f.speed,r:17,atk:1,flash:0,face:Math.PI/2,actionT:rand(0,1),hurt:0,shoot:rand(.9,1.8),tell:0,attackVec:{x:0,y:1},specialCd:rand(1.8,3.2),channeling:false,action:'Idle',fuel:100,maxFuel:100,actLeft:0,status:null,spdefStage:0,spdefTimer:0,defStage:0,defTimer:0,staggerT:0,seeded:null,extraCd:rand(2,3.2),extraLoadout:(()=>{const a=Math.floor(Math.random()*4);return [a,(a+1+Math.floor(Math.random()*3))%4]})()});
}
function targetAim(){if(mouseAim){return norm(mouseAim.x-W/2,mouseAim.y-H/2)}let best=null,dis=Infinity;for(let e of enemies){let d=len(e.x-player.x,e.y-player.y);if(d<dis){dis=d;best=e}}return best?norm(best.x-player.x,best.y-player.y):{...lastAim}}
function playAction(o,action,d=.23){o.action=action;o.animT=0;o.actLeft=d;if(o!==player)o.actionT=0}
function shoot(kind,ang){
 const p=roster[chosen],v={x:Math.cos(ang),y:Math.sin(ang)};
 const packet=damagePacket(player,enemies[0],'basic'),speed=p.type==='grass'?500:560,move=moveOf(player,'basic');
 projectiles.push({x:player.x+v.x*20,y:player.y+v.y*20,vx:v.x*speed,vy:v.y*speed,r:7,life:.95,dmg:arenaDamage(packet.damage),info:packet,move,team:'player',kind:0,color:p.color,element:p.type,skillId:move.id||MOVE_DB[p.type].basic.id,pierce:0,hit:new Set(),pulse:rand(0,Math.PI*2)});
 fx(player.x+v.x*20,player.y+v.y*20,p.color,7,140);startCastPose(player);playAction(player,'Shoot',.21);
}
function enemyShoot(e,ang){
 const p=roster[e.kind],v={x:Math.cos(ang),y:Math.sin(ang)},packet=damagePacket(e,player,'basic'),move=moveOf(e,'basic');
 projectiles.push({x:e.x+v.x*18,y:e.y+v.y*18-10,vx:v.x*440,vy:v.y*440,r:7,life:.95,dmg:arenaDamage(packet.damage),info:packet,move,team:'enemy',kind:0,color:p.color,element:p.type,skillId:move.id||MOVE_DB[p.type].basic.id,pierce:0,hit:new Set(),pulse:rand(0,Math.PI*2)});
 fx(e.x+v.x*18,e.y+v.y*18-10,p.color,5,100);startCastPose(e);playAction(e,'Shoot',.22);
}
const MOVE_SPECS={
 electric:{id:'thunderbolt',name:'10만볼트',cooldown:5.2,power:90,range:565},
 fire:{id:'flamethrower',name:'화염방사',cooldown:0,power:90,range:315},
 grass:{id:'energyball',name:'에너지볼',cooldown:5.7,power:90,range:490},
 water:{id:'surf',name:'파도타기',cooldown:6.2,power:90,range:390}
};
function rangedHit(e,x,y,vx,vy,range,halfWidth){
 const dx=e.x-x,dy=(e.y-11)-y,along=dx*vx+dy*vy,cross=Math.abs(dx*vy-dy*vx);
 return along>=-e.r && along<=range+e.r && cross<=halfWidth+e.r;
}
function hitOpponent(e,damage,x,y,type,power=1,info=null){
 if(e.hp<=0)return;
 e.hp=Math.max(0,e.hp-damage);e.flash=power<=.4?.055:.16;e.hurt=power<=.4?.07:.25;
 // Channelled attacks must not trigger a full hitstop on every .09s tick.
 // Their full canonical move damage is apportioned over roughly .9s.
 if(power<=.4){
  if(Math.random()<.23){emitParticle({x:x+rand(-12,12),y:y-10,vx:rand(-20,20),vy:rand(-24,-7),life:.23,size:4,color:(ELEMENT_FX[type]||ELEMENT_FX.neutral).main,shape:'spark'});}
 }else{
  cinematicImpact(x,y,type,power,damage);
  if(info?.critical&&power>1)announce('급소에 맞았다!');else if(info?.type>1&&power>1)announce('효과가 굉장했다!');else if(info?.type<1&&power>1)announce('효과가 별로인 듯하다…');
 }
 if(power>1.15&&!e.isSubstitute){const dx=e.x-player.x,dy=e.y-player.y,z=len(dx,dy)||1;e.x+=dx/z*13*power;e.y+=dy/z*13*power;clampToArena(e,ARENA.r-22);}
}

function makeBoltPath(x,y,vx,vy,range,seed=0){
 const points=[{x,y}];const nx=-vy,ny=vx;
 for(let t=28;t<range;t+=rand(18,30)){
   const variance=rand(-17,17)+Math.sin(seed*2+t*.07)*5;
   points.push({x:x+vx*t+nx*variance,y:y+vy*t+ny*variance});
 }
 points.push({x:x+vx*range,y:y+vy*range});
 return points;
}

function performExtraDamage(actor,target,move,x,y,impact=1){
 if(!target||target.hp<=0)return false;
 if(!moveAccuracy(move)){emitParticle({x,y,life:.25,size:7,color:'#e9f5ff',shape:'dot'});return false}
 const pkt=calculateDamage(actor,target,move),value=arenaDamage(pkt.damage);
 if(actor===player)hitOpponent(target,value,x,y,move.type,impact,pkt);
 else {hurt(value);elementalBurst(x,y,move.type,impact);fxSpawnScene('impact',x,y,{element:move.type,power:impact,range:70,life:.44});}
 applySecondary(target,move);
 if(move.id==='voltSwitch'){
  const v=norm(actor.x-target.x,actor.y-target.y);actor.x+=v.x*110;actor.y+=v.y*110;clampToArena(actor,actor===player?ARENA.r-26:ARENA.r-22);
  for(let i=0;i<12;i++)emitParticle({x:actor.x+rand(-20,20),y:actor.y+rand(-16,16),life:.28,size:5,color:'#fbe770',shape:'spark'});
 }
 return true;
}
function castExtra(move,v,owner='player'){
 const actor=owner==='player'?player:enemies[0],target=owner==='player'?enemies[0]:player;
 if(!actor||!target)return false;
 const profile=roster[actor.kind],x=actor.x+v.x*20,y=actor.y+v.y*20-10;
 const fxMove={type:'extra',move,owner,age:0,life:move.mode==='charge'?1.35:move.mode==='beam'?.4:move.mode==='dash'?.42:move.mode==='burst'?.55:.37,x,y,origin:{x:actor.x,y:actor.y},vx:v.x,vy:v.y,hit:false,pulse:0};
 if(move.mode==='projectile'||move.mode==='seed'){
  projectiles.push({x,y,vx:v.x*(move.speed||535),vy:v.y*(move.speed||535),r:move.id==='hydroPump'?16:move.mode==='seed'?8:12,life:move.range/(move.speed||535)+.12,dmg:0,move,team:owner,kind:1,color:EXTRA_PALETTE[move.type],element:move.type,pierce:0,hit:new Set(),extra:true,pulse:0});
  emitParticle({x,y,life:.28,size:12,color:EXTRA_PALETTE[move.type],shape:'ring',grow:28});
 }else if(move.mode==='melee'){
  const reached=rangedHit(target,x,y,v.x,v.y,move.range,move.id==='vineWhip'?36:55);
  if(reached)performExtraDamage(actor,target,move,target.x,target.y-11,1.0);
  fxMove.life=.32;specialEffects.push(fxMove);
 }else if(move.mode==='burst'){
  if(len(target.x-actor.x,target.y-actor.y)<move.range+target.r)performExtraDamage(actor,target,move,target.x,target.y-11,1.25);
  specialEffects.push(fxMove);createRing(actor.x,actor.y,EXTRA_PALETTE[move.type],move.range*.55,.48);
  if(move.id==='heatWave')fxSpawnScene('wall',actor.x,actor.y-12,{element:'fire',range:move.range,life:.83,power:1.6});
 }else if(move.mode==='dash'){
  actor.face=Math.atan2(v.y,v.x);fxMove.life=.34;fxMove.travel=0;specialEffects.push(fxMove);
 }else if(move.mode==='beam'||move.mode==='charge'){
  fxMove.life=move.mode==='charge'?1.26:.38;fxMove.fired=false;fxMove.fireAt=move.mode==='charge'?.75:.055;
  specialEffects.push(fxMove);
 }
 startCastPose(actor);playAction(actor,move.mode==='dash'?'Walk':'Attack',CAST_POSE_LIFE);
 if(owner==='player'){announce(move.name+'!');toastTime=.75;}
 sfx(move.mode==='charge'?230:520,move.mode==='charge'?900:195,.16);
 return true;
}
function resolveExtraProjectile(s,target){
 if(s.move.mode==='seed'){
  if(!moveAccuracy(s.move)||target.types.includes('grass'))return false;
  target.seeded={owner:s.team,remaining:11,tick:1.5};for(let i=0;i<12;i++)emitParticle({x:target.x+rand(-18,18),y:target.y+rand(-16,12),life:.4,size:6,color:'#b7e685',shape:'leaf'});
  if(s.team==='player')announce('상대에게 씨앗을 심었다!');else announce('씨뿌리기에 당했다!');return true;
 }
 return performExtraDamage(s.team==='player'?player:enemies[0],target,s.move,s.x,s.y,1.0);
}
function updateExtraSpecial(m,dt){
 const actor=m.owner==='player'?player:enemies[0],target=m.owner==='player'?enemies[0]:player;
 if(!actor||!target)return;
 const move=m.move,color=EXTRA_PALETTE[move.type];
 if(move.mode==='dash'){
  const step=move.range/.34*dt;const prevX=actor.x,prevY=actor.y;
  actor.x+=m.vx*step;actor.y+=m.vy*step;clampToArena(actor,actor===player?ARENA.r-26:ARENA.r-22);
  if(actor===player)player.inv=Math.max(player.inv,.045);
  for(let i=0;i<4;i++)emitParticle({x:prevX+rand(-8,8),y:prevY+rand(-12,12),vx:-m.vx*rand(25,75),vy:-m.vy*rand(25,75),life:.20,size:rand(4,8),shape:'spark',color});
  if(!m.hit&&len(actor.x-target.x,actor.y-target.y)<actor.r+target.r+22){m.hit=true;performExtraDamage(actor,target,move,target.x,target.y-11,1.1);}
 }else if(move.mode==='beam'||move.mode==='charge'){
  if(!m.fired&&m.age>=m.fireAt){m.fired=true;
   const px=actor.x+m.vx*18,py=actor.y+m.vy*18-11;
   if(rangedHit(target,px,py,m.vx,m.vy,move.range,move.mode==='charge'?37:25))performExtraDamage(actor,target,move,target.x,target.y-11,1.6);
   for(let i=0;i<24;i++){const t=rand(0,move.range);emitParticle({x:px+m.vx*t+rand(-9,9),y:py+m.vy*t+rand(-9,9),life:.22,size:rand(4,9),color,shape:'spark'});}
   createRing(px+m.vx*move.range,py+m.vy*move.range,color,40,.35);
  }
 }
}
function castSpecial(v,owner='player',opts={}){
 const actor=owner==='player'?player:enemies[0];
 if(!actor)return null;
 const profile=owner==='player'?roster[chosen]:roster[actor.kind],spec=MOVE_SPECS[profile.type];
 const packet=damagePacket(actor,owner==='player'?enemies[0]:player,'special');
 // Default tip; overridden per special below.
 let x=actor.x+v.x*19,y=actor.y+v.y*19-11;

 const move={type:spec.id,element:profile.type,x,y,vx:v.x,vy:v.y,age:0,
  life:spec.id==='thunderbolt'?1.25:spec.id==='flamethrower'?(opts.controlled?999:1.4):spec.id==='surf'?1.12:1.65,
  range:spec.range,damage:arenaDamage(packet.damage),info:packet,hit:new Set(),tick:0,pulse:0,seed:rand(0,1000),owner,controlled:!!opts.controlled,end:false};
 if(move.type==='thunderbolt'){
  // Guided bolt starts at caster body, homes to the enemy.
  const body=bodyWorld(actor,v.x,v.y); x=body.x; y=body.y; move.x=x; move.y=y;
  move.path=[{x,y}];move.origin={x,y};move.distance=0;move.speed=690;
  createRing(x,y,'#fff2b8',SPRITE_PX*8,.2);
  for(let i=0;i<8;i++)emitParticle({x:x+rand(-6,6),y:y+rand(-6,6),vx:rand(-50,50),vy:rand(-50,50),life:rand(.12,.22),size:SPRITE_PX,shape:'spark',color:i%2?'#fff4ad':'#a3f7ff'});
  sfx(640,1220,.16);
 }else if(move.type==='flamethrower'){
  const mouth=mouthWorld(actor,v.x,v.y); x=mouth.x; y=mouth.y; move.x=x; move.y=y;
  move.tick=.08;move.stream=0;move.decalTick=.1;move.hitX=x;move.hitY=y;
  sfx(150,65,.2);
 }else if(move.type==='energyball'){
  const mouth=mouthWorld(actor,v.x,v.y); x=mouth.x; y=mouth.y;
  move.x=x; move.y=y; move.origin={x,y};
  sfx(270,760,.24);
 }else if(move.type==='surf'){
  move.distance=0;move.decalTick=.08;
  move.origin={x:actor.x,y:actor.y-5};
  move.x=move.origin.x+v.x*34;move.y=move.origin.y+v.y*34;
  move.halfW=(SURF_WIDTH_TEXELS*SPRITE_PX)/2; // fixed visual + hit half-width
  actor.riding=true; // TAP starts riding immediately, without needing a drag.
  sfx(115,340,.4);
 }
 specialEffects.push(move);
 startCastPose(actor);
 if(move.type==='thunderbolt')fxSpawnScene('impact',x,y,{element:profile.type,power:.3,range:SPRITE_PX*10,life:.2});
 createRing(actor.x+v.x*20,actor.y+v.y*20,profile.color,22,.38);
 cameraKick.x+=v.x*3;cameraKick.y+=v.y*3;
 if(owner==='player'){
  areas.push({x:actor.x,y:actor.y,r:14,max:50,life:.3,color:profile.color,element:profile.type});
  announce(spec.name+'!');toastTime=.85;
 }
 return move;
}
function stopPlayerChannel(){
 for(const m of specialEffects){if(m.owner==='player'&&m.type==='flamethrower'&&m.controlled){m.end=true;}}
}
function updateFuel(actor,owner,dt){
 if(!actor)return;
 const active=specialEffects.find(m=>m.owner===owner&&m.type==='flamethrower'&&m.age<m.life&&!m.end);
 if(active){actor.fuel=Math.max(0,(actor.fuel??100)-49*dt);if(actor.fuel<=0)active.end=true;}
 else actor.fuel=Math.min(100,(actor.fuel??100)+25*dt);
}
function updateSpecials(dt){
 const active=gameState==='playing';if(!active)return;
 for(const m of specialEffects){
  m.age+=dt;m.pulse+=dt;
  const actor=m.owner==='player'?player:enemies[0];
  const target=m.owner==='player'?enemies[0]:player;
  if(!actor || !target){continue;}
  if(m.type==='extra'){updateExtraSpecial(m,dt);if(m.age>=m.life)continue;}
  if(m.type==='flamethrower' && m.controlled){
   const aim=m.owner==='player'?(player.channelAim||lastAim):norm(player.x-actor.x,player.y-actor.y);
   m.vx=aim.x;m.vy=aim.y;actor.face=Math.atan2(m.vy,m.vx);
   if(m.end)m.age=m.life;
  }
  if(m.age>=m.life)continue;
  if(m.type==='thunderbolt'){
   // Homing electricity: body → enemy, path rebuilt as guided bolt.
   const body=bodyWorld(actor,m.vx,m.vy);
   if(!m.path||!m.path.length)m.path=[{x:body.x,y:body.y}];
   m.path[0]={x:body.x,y:body.y};
   const dx=target.x-m.x,dy=target.y-11-m.y,dist=len(dx,dy)||1;
   const aim={x:dx/dist,y:dy/dist};
   if(dist<720){const turn=Math.min(1,dt*11);let nx=m.vx*(1-turn)+aim.x*turn,ny=m.vy*(1-turn)+aim.y*turn;let mag=len(nx,ny)||1;m.vx=nx/mag;m.vy=ny/mag;}
   const step=m.speed*dt;m.x+=m.vx*step;m.y+=m.vy*step;m.distance+=step;
   const last=m.path[m.path.length-1];if(!last||len(m.x-last.x,m.y-last.y)>SPRITE_PX*3){m.path.push({x:m.x,y:m.y});if(m.path.length>32)m.path.splice(1,1);}
   if(Math.random()<dt*14)emitParticle({x:m.x+rand(-4,4),y:m.y+rand(-4,4),vx:rand(-40,40),vy:rand(-40,40),life:rand(.1,.18),size:SPRITE_PX,shape:'spark',color:Math.random()<.5?'#ffeb83':'#a3f7ff'});
   const struck=len(target.x-m.x,target.y-11-m.y)<target.r+17;
   if(struck){
     if(m.owner==='player')hitOpponent(target,m.damage,target.x,target.y-11,'electric',1.45,m.info);
     else hurt(m.damage);
     applySecondary(target,moveOf(actor,'special'));
   }
   if(struck||m.distance>=m.range){
     const tail=m.path.slice();
     specialEffects.push({type:'boltEcho',element:'electric',owner:m.owner,x:m.x,y:m.y,vx:m.vx,vy:m.vy,path:tail,age:0,life:.24,pulse:0});
     if(!struck)elementalBurst(m.x,m.y,'electric',.6);
     else elementalBurst(target.x,target.y-11,'electric',1.1);
     m.age=m.life;
   }
  }else if(m.type==='flamethrower'){
   // Origin = species mouth; stream reaches the actual along-aim hit (target or max grow).
   const mouth=mouthWorld(actor,m.vx,m.vy); m.x=mouth.x; m.y=mouth.y;
   const grow=Math.min(m.range, m.age*710+40);
   const tdx=target.x-m.x, tdy=(target.y-11)-m.y;
   const along=tdx*m.vx+tdy*m.vy, cross=Math.abs(tdx*m.vy-tdy*m.vx);
   const inCone=along>SPRITE_PX*4 && cross<(22+along*.28+target.r);
   const hitDist=inCone?Math.min(m.range, Math.max(along, SPRITE_PX*8)):grow;
   const length=Math.min(m.range, inCone?hitDist:grow);
   m.stream=length; m.hitX=m.x+m.vx*length; m.hitY=m.y+m.vy*length;
   m.decalTick-=dt; if(m.decalTick<=0){m.decalTick+=.14; impactMark(m.hitX,m.hitY,'fire',.72)}
   const perpX=-m.vy,perpY=m.vx;
   if(Math.random()<dt*6){
    const dist=rand(SPRITE_PX*4,Math.max(SPRITE_PX*5,length*.9));
    const side=(Math.random()<.5?-1:1)*(SPRITE_PX*5);
    emitParticle({x:m.x+m.vx*dist+perpX*side,y:m.y+m.vy*dist+perpY*side,vx:perpX*rand(-16,16),vy:perpY*rand(-16,16)-8,life:rand(.1,.18),size:SPRITE_PX,shape:'dot',color:Math.random()<.5?'#fff8e0':'#ffc857',alpha:.95});
   }
   m.tick-=dt;
   if(m.tick<=0){m.tick+=.09; if(inCone&&along<length+target.r){ if(m.owner==='player'){
    hitOpponent(target,m.damage*.1,target.x,target.y-10,'fire',.35,m.info);
    m.channelShown=(m.channelShown||0)+m.damage*.1;
    if(m.channelShown>=5){showDamage(target.x,target.y-10,m.channelShown,'fire');m.channelShown=0;}
   }else {hurt(m.damage*.1,{continuous:true});}
   m.effectExposure=(m.effectExposure||0)+.09;
   if(m.effectExposure>=ARENA_BALANCE.channelMoveSeconds){m.effectExposure-=ARENA_BALANCE.channelMoveSeconds;applySecondary(target,moveOf(actor,'special'));}
   for(let j=0;j<3;j++)emitParticle({x:target.x+rand(-10,10),y:target.y-rand(6,22),vx:rand(-30,30),vy:rand(-70,-12),life:rand(.14,.28),size:SPRITE_PX,color:'#ffb262',shape:'dot'});} }
  }else if(m.type==='energyball'){
    // Travel toward the live target (hit point), layered orb drawn in fxDrawOrb.
    const lastX=m.x,lastY=m.y,speed=400;
    const dx=target.x-m.x,dy=(target.y-11)-m.y,dist=len(dx,dy)||1;
    if(dist<640){const turn=Math.min(1,dt*4.5);let nx=m.vx*(1-turn)+dx/dist*turn,ny=m.vy*(1-turn)+dy/dist*turn;const mag=len(nx,ny)||1;m.vx=nx/mag;m.vy=ny/mag;}
    m.x+=m.vx*speed*dt;m.y+=m.vy*speed*dt;
    if(Math.random()<dt*18)emitParticle({x:lastX,y:lastY,vx:-m.vx*30,vy:-m.vy*30,life:.2,size:SPRITE_PX,shape:'dot',color:Math.random()<.5?'#c8ff93':'#55fa9b',alpha:.9});
    let collided=false; if(len(m.x-target.x,m.y-(target.y-11))<target.r+20){ collided=true; if(m.owner==='player') hitOpponent(target,m.damage,m.x,m.y,'grass',1.6,m.info); else hurt(m.damage); applySecondary(target,moveOf(actor,'special')); }
    if(collided||len(m.x-m.origin.x,m.y-m.origin.y)>=m.range){ const ex=m.x,ey=m.y; elementalBurst(ex,ey,'grass',1.7);fxSpawnScene('impact',ex,ey,{element:'grass',power:1.3,range:76,life:.48});impactMark(ex,ey,'grass',1.55);createRing(ex,ey,'#b9ff9a',50,.5); specialEffects.push({type:'energyburst',element:'grass',x:ex,y:ey,age:0,life:.52,pulse:0,owner:m.owner}); if(!collided&&len(target.x-ex,target.y-11-ey)<72){ if(m.owner==='player') hitOpponent(target,m.damage*.55,target.x,target.y-11,'grass',.8,m.info); else hurt(m.damage*.55);applySecondary(target,moveOf(actor,'special'));} m.age=m.life; }
  }else if(m.type==='surf'){
   m.distance=Math.min(m.range,m.distance+395*dt); m.x=m.origin.x+m.vx*(30+m.distance); m.y=m.origin.y+m.vy*(30+m.distance); const perpX=-m.vy,perpY=m.vx;
   const halfW=m.halfW||((SURF_WIDTH_TEXELS*SPRITE_PX)/2); // ~3 character widths
   const rideDist=Math.min(m.distance*.92,m.range-10); actor.x=m.origin.x+m.vx*(10+rideDist)-perpX*4; actor.y=m.origin.y+m.vy*(10+rideDist)-perpY*4; actor.face=Math.atan2(m.vy,m.vx); clampToArena(actor,m.owner==='player'?ARENA.r-26:ARENA.r-22); if(m.owner==='player'){player.inv=Math.max(player.inv,.06)}
   m.decalTick-=dt; if(m.decalTick<=0){m.decalTick+=.13;impactMark(m.x,m.y,'water',1.25)}
   if(Math.random()<dt*10){const spread=rand(-halfW*.85,halfW*.85); emitParticle({x:m.x+perpX*spread+m.vx*rand(-20,12),y:m.y+perpY*spread+m.vy*rand(-20,12),vx:m.vx*rand(20,70),vy:m.vy*rand(20,70),life:rand(.14,.28),size:SPRITE_PX,shape:'dot',color:Math.random()<.35?'#efffff':'#69d3ff',alpha:.9});}
   // Hit if target is within the wave band (ahead + lateral halfW)
   if(!m.hit.has('target')){
    const tdx=target.x-m.x, tdy=(target.y-11)-m.y; const along=tdx*m.vx+tdy*m.vy, lat=Math.abs(tdx*m.vy-tdy*m.vx);
    if(along>-20&&along<SPRITE_PX*28&&lat<halfW+target.r){
     m.hit.add('target');
     if(m.owner==='player'){
      hitOpponent(target,m.damage,target.x,target.y-11,'water',1.1,m.info);
      const dx=target.x-actor.x,dy=target.y-actor.y,z=len(dx,dy)||1;
      target.x+=dx/z*18;target.y+=dy/z*18;clampToArena(target,ARENA.r-22);
     }else hurt(m.damage);
     // IMPORTANT: hitting the enemy does NOT stop the Pokémon riding the wave.
    }
   }
   if(m.distance>=m.range)m.age=m.life;
  }else if(m.type==='boltEcho'||m.type==='energyburst'){
  }
 }
 specialEffects=specialEffects.filter(m=>m.age<m.life);
 player.riding=specialEffects.some(m=>m.owner==='player'&&m.type==='surf'&&m.age<m.life);
 if(enemies[0])enemies[0].riding=specialEffects.some(m=>m.owner==='enemy'&&m.type==='surf'&&m.age<m.life);
}
function activate(n,vec,hold=false){
 if(gameState!=='playing'||((n!==1||roster[chosen].type!=='fire')&&player.cd[n]>0))return;
 let v=vec||targetAim();v=norm(v.x,v.y); if(!len(v.x,v.y))v={x:1,y:0}; lastAim=v;player.channelAim=v;player.aim=Math.atan2(v.y,v.x);player.face=player.aim;
 if(n===0){player.cd[0]=ARENA_BALANCE.basicInterval;if(!canAct(player)){announce('몸이 마비되어 움직일 수 없다!');return;}shoot(0,player.aim);sfx(450,100,.04)}
 if(n===1){
  if(!canAct(player)){announce('상태이상으로 기술 실패!');return;}
  const type=roster[chosen].type;
  if(type==='fire'){
   if(player.fuel<3||specialEffects.some(m=>m.type==='flamethrower'&&m.owner==='player'&&m.age<m.life))return;
   castSpecial(v,'player',{controlled:true}); // no cooldown: consume gauge only while held
  }else{
   player.cd[1]=MOVE_SPECS[type].cooldown;castSpecial(v,'player');
  }
 }
 if(n===3||n===4){const m=equippedMove(player,n);if(!m)return;if(!canAct(player)){player.cd[n]=.4;return;}player.cd[n]=m.cooldown;castExtra(m,v,'player');}
 if(n===2){if(!canAct(player)){player.cd[2]=.5;return;}player.cd[2]=3;player.dashTime=.2;player.dashX=v.x;player.dashY=v.y;player.inv=.36;playAction(player,'Walk',.2);fx(player.x,player.y,'#a8e9ff',20,200);sfx(700,250,.09)}
}
let audioCtx;function sfx(a,b,d){try{audioCtx ||=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();let o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime;o.type='triangle';o.frequency.setValueAtTime(a,t);o.frequency.exponentialRampToValueAtTime(b,t+d);g.gain.setValueAtTime(.033,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+d)}catch(err){}}
function hurt(amount,opts={}){if(opts.continuous){if(player.dashTime>0||player.riding)return;player.hp=Math.max(0,player.hp-amount);player.flash=Math.max(player.flash||0,.08);if(player.hp<=0)gameOver();return;}if(player.inv>0)return;player.hp-=amount;flashColor='#ff847c';flashLevel=Math.max(flashLevel,.27);createRing(player.x,player.y,'#ffadad',28,.3);player.inv=.55;player.hurt=.25;shake=8;fx(player.x,player.y,'#ff6d89',12,120);playAction(player,'Hurt',.25);sfx(130,55,.18);if(player.hp<=0){player.hp=0;gameOver()}syncHUD()}
function openResult(won){
 gameState=won?'won':'over';$('menu').classList.remove('hidden');
 $('menu').querySelector('h1').innerHTML=won?'YOU <em>WIN!</em>':'YOU <em>LOSE</em>';
 const opponent=enemies[0]?roster[enemies[0].kind]:roster[chosen];
 $('menuExplain').innerHTML=`<b>${roster[chosen].name} VS ${opponent.name} · ${won?'승리':'패배'}</b><br>경기 시간 ${Math.floor(time/60)}분 ${Math.floor(time%60)}초 · 다시 도전하세요!`;
 $('start').textContent='다시 대전';
 $('assetStatus').textContent=`실제 SpriteCollab 스프라이트 ${unique.filter(id=>sprites[id]?.loaded).length}/${unique.length}종 연결`;
}
function gameOver(){if(labMode){player.hp=player.maxHp;syncHUD();return;}stopPlayerChannel();player.hp=0;syncHUD();openResult(false)}
function victory(){if(labMode)return;kills=1;projectiles=[];fx(enemies[0].x,enemies[0].y,'#ffe58a',30,195);cinematicImpact(enemies[0].x,enemies[0].y-10,roster[chosen].type,1.8,0);syncHUD();openResult(true)}
function statusBadge(actor){let s='';if(actor.status?.kind==='burn')s+='<span class="burn">화상</span>';if(actor.status?.kind==='paralysis')s+='<span class="paralysis">마비</span>';if((actor.spdefStage||0)<0)s+='<span class="spdef">특방 '+actor.spdefStage+'</span>';if((actor.defStage||0)<0)s+='<span class="spdef">방어 '+actor.defStage+'</span>';if(actor.seeded)s+='<span class="spdef">씨뿌리기</span>';if(actor.status?.kind==='poison')s+='<span class="spdef">독</span>';if(actor.status?.kind==='freeze')s+='<span class="spdef">얼음</span>';return s}
function syncHUD(){
 $('hpBar').style.width=(clamp(player.hp/player.maxHp,0,1)*100)+'%';
 $('playerCondition').innerHTML=statusBadge(player);
 $('healthText').textContent=Math.ceil(Math.max(0,player.hp))+'/'+Math.ceil(player.maxHp);
 const enemy=enemies[0];
 $('enemyName').textContent=enemy?(enemy.isSubstitute?'🧸 대타출동 인형':roster[enemy.kind].name+' Lv.'+enemy.level):'상대';
 $('enemyCondition').innerHTML=enemy&&!enemy.isSubstitute?statusBadge(enemy):'';
 $('enemyHealthText').textContent=enemy?Math.ceil(Math.max(0,enemy.hp))+'/'+Math.ceil(enemy.maxHp):'—';
 $('enemyHpBar').style.width=enemy?(clamp(enemy.hp/enemy.maxHp,0,1)*100)+'%':'0%';
 const fire=roster[chosen].type==='fire';
 if(fire){const value=clamp(player.fuel,0,100);$('fuelValue').textContent=Math.ceil(value)+'%';$('fuelFill').style.width=value+'%';$('fuelButtonFill').style.width=value+'%';}
 document.querySelectorAll('.skill').forEach(e=>{
  const n=+e.dataset.n,cd=e.querySelector('.cooldown'),seconds=(n===1&&fire)?0:player.cd[n];
  cd.style.display=seconds>0?'flex':'none';cd.textContent=seconds>0?seconds.toFixed(1):'';
 });
}
function announce(t){const el=$('toast');el.textContent=t;el.classList.add('show');toastTime=1.35}
function gainXP(v){player.xp+=v;while(player.xp>=player.need){player.xp-=player.need;player.level++;player.need=Math.floor(player.need*1.34+8);player.level=Math.min(100,player.level);const oldMax=player.maxHp;player.stats=computeStats(chosen,player.iv,player.level,selectedNature);player.maxHp=arenaHP(player.stats.hp);player.hp=Math.min(player.maxHp,player.hp+(player.maxHp-oldMax)+24);player.speed=speedFromStat(player.stats.spe);announce('LEVEL UP! '+player.level);fx(player.x,player.y,'#f7d87e',33,210);sfx(440,880,.35)}}
function advance(dt){
 if(gameState!=='playing')return;
 if(hitstop>0){hitstop=Math.max(0,hitstop-dt);updateCinematic(dt);return;}
 time+=dt;
 updateCinematic(dt);
 updateStatus(player,dt);if(player.hp<=0){if(labMode){player.hp=player.maxHp}else{gameOver();return;}}
 player.inv=Math.max(0,player.inv-dt);player.cd=player.cd.map(v=>Math.max(0,v-dt));
 if(labMode){player.cd=player.cd.map(()=>0);player.fuel=100;player.hp=player.maxHp;}
 if(roster[chosen].type==='fire')updateFuel(player,'player',dt);
 player.actLeft=Math.max(0,player.actLeft-dt);player.animT+=dt;
 if(player.castPose){player.castPose.age+=dt;if(player.castPose.age>=player.castPose.life)player.castPose=null}
 let mx=joyVec.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
 let my=joyVec.y+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
 let mag=len(mx,my),moving=mag>.05;
 if(mag>1){mx/=mag;my/=mag}
 if(specialEffects.some(m=>m.type==='surf'&&m.owner==='player'&&m.age<m.life)){player.dashTime=0; /* ride movement is handled by the Surf state machine */}
 else if(player.dashTime>0){player.x+=player.dashX*850*dt;player.y+=player.dashY*850*dt;player.dashTime-=dt;fx(player.x,player.y,roster[chosen].color,2,20)}
 else{player.x+=mx*player.speed*statusSpeed(player)*dt;player.y+=my*player.speed*statusSpeed(player)*dt;if(moving&&Math.random()<dt*15)footDust(player.x,player.y,1)}
 clampToArena(player,ARENA.r-26);
 if(moving&&player.actLeft<=0){player.face=Math.atan2(my,mx);player.action='Walk'}
 else if(!moving&&player.actLeft<=0){player.action='Idle'}
 if(mouseAim&&skillPointers.size===0)lastAim=targetAim();
 // A match always has one and only one enemy. Lab: Substitute doll (no AI / no win).
 for(const e of enemies){
  if(e.castPose){e.castPose.age+=dt;if(e.castPose.age>=e.castPose.life)e.castPose=null}
  e.actionT+=dt;e.actLeft=Math.max(0,(e.actLeft||0)-dt);e.flash=Math.max(0,e.flash-dt);e.hurt=Math.max(0,e.hurt-dt);
  if(e.isSubstitute||labMode){
   // Doll stays put, faces the hero, can be hit; respawn if KO'd.
   e.face=Math.atan2(player.y-e.y,player.x-e.x);
   e.action='Idle';e.tell=0;e.shoot=999;e.specialCd=999;e.extraCd=999;e.atk=999;
   if(e.hp<=0){
    labDollKO+=dt;
    if(labDollKO>.45){
     const nx=e.x,ny=e.y;enemies[0]=spawnSubstituteDoll(nx,ny);labDollKO=0;announce('대타출동 인형 재배치');
    }
   }else labDollKO=0;
   continue;
  }
  updateStatus(e,dt);if(e.hp<=0){victory();return;}
  e.atk-=dt;e.shoot-=dt;e.extraCd=Math.max(0,(e.extraCd||0)-dt);e.specialCd=Math.max(0,e.specialCd-dt);
  const data=roster[e.kind];if(data.type==='fire')updateFuel(e,'enemy',dt);
  if(e.tell>0){e.tell-=dt;if(e.tell<=0){if(e.staggerT>0||e.status?.kind==='freeze'){e.tell=0;continue;}e.x+=e.attackVec.x*27;e.y+=e.attackVec.y*27;clampToArena(e,ARENA.r-22);if(len(player.x-e.x,player.y-e.y)<74)hurt(arenaDamage(damagePacket(e,player,'basic').damage));applySecondary(player,moveOf(e,'basic'));createRing(e.x,e.y,'#ffa49b',30,.21);}}
  let dx=player.x-e.x,dy=player.y-e.y,d=len(dx,dy)||1;
  if(e.tell<=0&&d>130){e.x+=dx/d*e.speed*statusSpeed(e)*dt;e.y+=dy/d*e.speed*statusSpeed(e)*dt;if(Math.random()<dt*7)footDust(e.x,e.y,.8)}
  else if(e.tell<=0&&d<82){e.x-=dx/d*e.speed*statusSpeed(e)*.22*dt;e.y-=dy/d*e.speed*statusSpeed(e)*.22*dt}
  e.face=Math.atan2(dy,dx);
  if(e.actLeft<=0)e.action=d>130?'Walk':'Idle';
  if(d<e.r+player.r+24&&e.atk<=0&&e.tell<=0&&e.staggerT<=0){e.tell=.35;e.attackVec=norm(dx,dy);e.atk=1.42;playImpactSound('windup');}
  if(gameState!=='playing')return;
  let didExtra=false;if(e.extraCd<=0&&d<440&&!e.riding){const possible=e.extraLoadout.map(i=>EXTRA_MOVES[data.type][i]).filter(m=>m.mode==='dash'||m.mode==='projectile'||m.mode==='seed'||d<m.range+55);const extra=possible[Math.floor(Math.random()*possible.length)];if(extra&&canAct(e)){didExtra=castExtra(extra,norm(dx,dy),'enemy');e.extraCd=extra.cooldown*1.6+rand(.5,1.2);}else e.extraCd=1.0;}
  if(didExtra||e.staggerT>0||e.status?.kind==='freeze'){clampToArena(e,ARENA.r-22);continue;}
  if(data.type==='fire' && d<295 && e.fuel>=55 && !specialEffects.some(m=>m.owner==='enemy'&&m.type==='flamethrower'&&m.age<m.life)){
    if(canAct(e))castSpecial(norm(dx,dy),'enemy',{controlled:true});
  }else if(data.type!=='fire' && d<460 && e.specialCd<=0){
    if(canAct(e))castSpecial(norm(dx,dy),'enemy');e.specialCd=rand(4.4,6.2);
  }else if(d<520 && e.shoot<=0){if(canAct(e))enemyShoot(e,Math.atan2(dy,dx));e.shoot=rand(.95,1.55)}
  clampToArena(e,ARENA.r-22);
 }
 updateSpecials(dt);
 if(!labMode&&enemies[0]?.hp<=0){victory();return}
 for(const s of projectiles){
  s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;s.pulse=(s.pulse||0)+dt*8;trailFx(s);
  if(s.team==='player'){
   for(const e of enemies){
    if(s.hit?.has(e.uid))continue;
    if(len(s.x-e.x,s.y-(e.y-11))<s.r+e.r){
     s.hit.add(e.uid);
     if(s.extra){resolveExtraProjectile(s,e);fx(s.x,s.y,s.color,5,85);}else if(moveAccuracy(s.move)){hitOpponent(e,s.dmg,s.x,s.y,s.element||'neutral',.6,s.info);applySecondary(e,s.move);fx(s.x,s.y,s.color,4,80);}else{emitParticle({x:s.x,y:s.y,life:.24,size:SPRITE_PX*2,color:'#eef4fb',shape:'dot'});}
     if(s.pierce>0)s.pierce--;else{s.life=0;break}
    }
   }
  }else if(player.inv<=0&&len(s.x-player.x,s.y-(player.y-11))<s.r+player.r){if(s.extra){resolveExtraProjectile(s,player);elementalBurst(s.x,s.y,s.element||'neutral',.8);}else if(moveAccuracy(s.move)){elementalBurst(s.x,s.y,s.element||'neutral',1);hurt(s.dmg);applySecondary(player,s.move);}else{emitParticle({x:s.x,y:s.y,life:.24,size:SPRITE_PX*2,color:'#eef4fb',shape:'dot'});}s.life=0;}
  if(gameState!=='playing')return;
  if(s.x<0||s.y<0||s.x>map.w||s.y>map.h)s.life=0;
 }
 projectiles=projectiles.filter(s=>s.life>0);
 if(!labMode&&enemies[0]?.hp<=0){victory();return}
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.95;p.vy*=.95;if(p.gravity)p.vy+=p.gravity*dt;p.life-=dt;p.rot=(p.rot||0)+(p.spin||0)*dt;if(p.grow)p.size+=p.grow*dt}
 particles=particles.filter(p=>p.life>0);
 for(const a of areas)a.life-=dt;areas=areas.filter(a=>a.life>0);
 shake*=Math.pow(.04,dt);
 if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('show')}
 syncHUD();
}

function drawLeafShape(size){
 const s=Math.max(SPRITE_PX,Math.round((size||SPRITE_PX*4)/SPRITE_PX)*SPRITE_PX);
 pxRect(-s,-s/2,s,s/2,'#7cd671');pxRect(0,-s/2,s,s/2,'#bdf49e');
 pxRect(-s/2,0,s,s/2,'#5dcf7a');pxRect(-s,0,s/2,s/2,'#57b85e');
 pxRect(s/2,0,s/2,s/2,'#57b85e');pxRect(-s/2,0,s,s/2,'#9ae87f');
}
function snap(v,g=SPRITE_PX){return Math.round(v/g)*g}
function pxCell(x,y,color,a=1){ctx.save();ctx.globalAlpha*=a;ctx.fillStyle=color;ctx.fillRect(snap(x),snap(y),SPRITE_PX,SPRITE_PX);ctx.restore()}
function fxRect(x,y,w,h,c,a=1){pxRect(x,y,w,h,c,a)}
function pxRect(x,y,w,h,color,a=1){
 // Quantize to sprite texel grid: every filled block is an integer multiple of SPRITE_PX.
 const x0=snap(x),y0=snap(y),x1=snap(x+w),y1=snap(y+h);
 const ww=Math.max(SPRITE_PX,x1-x0),hh=Math.max(SPRITE_PX,y1-y0);
 ctx.save();ctx.globalAlpha*=a;ctx.fillStyle=color;ctx.fillRect(x0,y0,ww,hh);ctx.restore();
}
function pxLine(x1,y1,x2,y2,size,color,a=1,stepMul=1){
 const dx=x2-x1,dy=y2-y1,d=Math.hypot(dx,dy)||1;
 const cell=Math.max(SPRITE_PX,Math.round(size/SPRITE_PX)*SPRITE_PX);
 const step=cell*stepMul,n=Math.max(1,Math.ceil(d/step));
 for(let i=0;i<=n;i++){const t=i/n;pxRect(x1+dx*t-cell/2,y1+dy*t-cell/2,cell,cell,color,a)}
}
function pxCircle(cx,cy,r,color,a=1,size=SPRITE_PX){
 const cell=Math.max(SPRITE_PX,Math.round(size/SPRITE_PX)*SPRITE_PX);
 for(let y=-r;y<=r;y+=cell)for(let x=-r;x<=r;x+=cell)if(x*x+y*y<=r*r)pxRect(cx+x,cy+y,cell,cell,color,a);
}
function pxRing(cx,cy,r,thick,color,a=1,size=SPRITE_PX){
 const cell=Math.max(SPRITE_PX,Math.round(size/SPRITE_PX)*SPRITE_PX);
 const inner=Math.max(0,r-thick),r2=r*r,i2=inner*inner;
 for(let y=-r;y<=r;y+=cell)for(let x=-r;x<=r;x+=cell){const d=x*x+y*y;if(d<=r2&&d>=i2)pxRect(cx+x,cy+y,cell,cell,color,a)}
}
function pxDiamond(cx,cy,r,color,a=1,size=SPRITE_PX){
 const cell=Math.max(SPRITE_PX,Math.round(size/SPRITE_PX)*SPRITE_PX);
 for(let y=-r;y<=r;y+=cell){const w=r-Math.abs(y);for(let x=-w;x<=w;x+=cell)pxRect(cx+x,cy+y,cell,cell,color,a)}
}
function drawPixelShard(x,y,w,h,color,a=.95){const ww=Math.max(SPRITE_PX,Math.round(w/SPRITE_PX)*SPRITE_PX),hh=Math.max(SPRITE_PX,Math.round(h/SPRITE_PX)*SPRITE_PX);pxRect(x-ww/2,y-hh/2,ww,hh,color,a)}
function drawPixelSparkBurst(x,y,r,color,a=.9){for(let i=0;i<8;i++){const ang=i*Math.PI/4;pxCell(x+Math.cos(ang)*r,y+Math.sin(ang)*r,color,a)}pxCell(x,y,'#ffffff',a)}
function drawPixelCrescent(x,y,ang,inner,outer,c1,c2,a=.95){ctx.save();ctx.translate(x,y);ctx.rotate(ang);for(let row=-outer;row<=outer;row+=6){const t=Math.abs(row)/outer;const len=outer*(1-t*t);const start=Math.max(0,inner*(1-t*t));for(let xx=start;xx<=len;xx+=6){drawPixelShard(xx,row,6,6,xx>len-12?c2:c1,a)}}ctx.restore()}
function drawPixelOrbital(x,y,rot,r,colors,size=6){for(let i=0;i<colors.length;i++){const ang=rot+i*(Math.PI*2/colors.length);drawPixelShard(x+Math.cos(ang)*r,y+Math.sin(ang)*r,size,size,colors[i],.95)}}
function drawPixelWaveBand(x,y,dirX,dirY,sideX,sideY,aheadStart,aheadEnd,halfW,c1,c2,foam=false){for(let side=-halfW;side<=halfW;side+=8){const ahead=aheadStart+(aheadEnd-aheadStart)*(1-Math.abs(side)/Math.max(1,halfW));for(let t=-28;t<ahead;t+=8){pxRect(x+dirX*t+sideX*side-4,y+dirY*t+sideY*side-4,8,8,c1,.88)}for(let t=0;t<ahead;t+=8){pxRect(x+dirX*t+sideX*side-4,y+dirY*t+sideY*side-4,8,8,c2,.94)}if(foam&&Math.round((side+halfW)/8)%2===0)pxRect(x+dirX*ahead+sideX*side-4,y+dirY*ahead+sideY*side-4,8,8,'#f7ffff',.98)}}
function drawProjectileSprite(s){
 // Resolve skill id: extras carry move.id; basics map from element.
 let sid = s.skillId || (s.extra && s.move?.id);
 if(!sid){
   sid = ({fire:'ember',water:'waterGun',grass:'razorLeaf',electric:'thunderShock'})[s.element];
 }
 const mod = sid && skillEffect(sid);
 if(mod?.drawProjectile){ mod.drawProjectile(s); return; }
 // Fallback short beam (should not hit if map is complete)
 const pal=arcadePal(s.element), ang=Math.atan2(s.vy,s.vx), pulse=s.pulse||0;
 const cols={ink:pal.ink||'#1a2030', body:pal.main, accent:pal.accent, hot:pal.hot||'#fff'};
 ctx.save();ctx.translate(snap(s.x),snap(s.y));ctx.globalAlpha=s.team==='enemy'?.9:.99;
 pxLayeredBeam(-Math.cos(ang)*SPRITE_PX*6,-Math.sin(ang)*SPRITE_PX*6, Math.cos(ang)*SPRITE_PX*5, Math.sin(ang)*SPRITE_PX*5, SPRITE_PX*3, cols, {t:pulse,spiral:false,tip:true,wobble:false});
 ctx.restore();
}
function drawParticleSprite(p){
 const alpha=clamp((p.life)/(p.max||1),0,1)*(p.alpha??1);if(alpha<=0)return;
 ctx.save();ctx.translate(snap(p.x),snap(p.y));ctx.rotate(Math.round((p.rot||0)/(Math.PI/4))*(Math.PI/4));
 const cells=Math.max(1,Math.round((p.size||SPRITE_PX)/SPRITE_PX));
 const s=cells*SPRITE_PX;
 if(p.shape==='spark'){
  pxLine(-s,0,s,0,SPRITE_PX,p.ink||'#1a2030',alpha*.75,1);pxLine(0,-s,0,s,SPRITE_PX,p.ink||'#1a2030',alpha*.75,1);
  pxLine(-s,0,s,0,SPRITE_PX,p.color,alpha,1);pxLine(0,-s,0,s,SPRITE_PX,p.color,alpha,1);
  if(cells>=2)pxCell(0,0,'#ffffff',alpha*.9);
 }else if(p.shape==='ring'){
  // thin 1-texel expanding ring (watched-03), not thick blob rings
  const rr=Math.max(SPRITE_PX*2, Math.round((p.size||SPRITE_PX*4)/SPRITE_PX)*SPRITE_PX);
  pxFloorRing(0,0,rr,rr*.55,p.color,alpha);
 }else if(p.shape==='leaf'){drawLeafShape(Math.max(SPRITE_PX*4,s));pxCell(0,0,'#f7ffda',alpha*.8)}
 else if(p.shape==='drop'){pxRect(-SPRITE_PX,-s,SPRITE_PX,s*2,p.ink||'#0f3d5c',alpha*.55);pxRect(-SPRITE_PX,-s,SPRITE_PX,s*2,p.color,alpha);pxRect(0,-s*1.5,SPRITE_PX,s*2,p.color,alpha);pxCell(0,-s*2,'#ffffff',alpha*.8)}
 else if(p.shape==='flame'){pxRect(-s/2,-s,s,s*2,p.ink||'#3d120c',alpha*.45);pxRect(-s/2,-s,s/2,s*2,p.color,alpha);pxRect(0,-s*1.5,s/2,s*2.5,p.color,alpha);if(cells>=2)pxCell(0,-s/2,'#fff1b9',alpha*.85)}
 else if(p.shape==='bubble'){pxRect(-s/2,-s/2,s,s,p.color,alpha*.7);if(s>SPRITE_PX*2)pxRect(-s/2+SPRITE_PX,-s/2+SPRITE_PX,s-SPRITE_PX*2,s-SPRITE_PX*2,'#e9ffff',alpha*.35)}
 else if(p.shape==='poison'){pxDiamond(0,0,s,p.ink||'#2a1040',alpha,SPRITE_PX);pxDiamond(0,0,Math.max(SPRITE_PX,s-SPRITE_PX),'#8a4ec6',alpha,SPRITE_PX);pxCell(0,0,'#e6bbff',alpha*.9)}
 else{pxCell(0,0,p.color,alpha)} // default: exact 1-texel (or N) dots
 ctx.restore();
}
function drawAreaPulse(a){let t=1-a.life/.3,r=Math.round((a.r+(a.max-a.r)*t)/SPRITE_PX)*SPRITE_PX,pal=arcadePal(a.element);ctx.save();ctx.globalAlpha=1-t;pxRing(a.x,a.y,r+SPRITE_PX,SPRITE_PX*2,pal.ink||'#1a2030',.7,SPRITE_PX);pxRing(a.x,a.y,r,SPRITE_PX*2,pal.main,.9,SPRITE_PX);pxRing(a.x,a.y,Math.max(SPRITE_PX*4,Math.round(r*.7/SPRITE_PX)*SPRITE_PX),SPRITE_PX,pal.accent,.96,SPRITE_PX);pxRing(a.x,a.y,Math.max(SPRITE_PX*3,Math.round(r*.42/SPRITE_PX)*SPRITE_PX),SPRITE_PX,pal.hot||'#fff',.85,SPRITE_PX);for(let i=0;i<12;i++){let ang=i*Math.PI/6+t*2.4;pxCell(a.x+Math.cos(ang)*r*.92,a.y+Math.sin(ang)*r*.92,i%2?pal.main:pal.hot||'#fff',.95)}ctx.restore()}
/* Arcade Battlegrounds VFX — pixel stamps with ink outline → elemental body → hot core.
   Soft bloom is backlight only; hit confirms share hitX / star / shock-ring grammar. */

/* ---- Battlegrounds pixel patterns (1 cell = SPRITE_PX = 1 character texel) ---- */
function pxTex(x,y,color,a=1){pxCell(x,y,color,a)}
function pxFloorRing(cx,cy,rx,ry,color,a=1){
 // Thin 1-texel elliptical ring on the floor plane (watched-03 / watched-05).
 const R=Math.max(SPRITE_PX*2, Math.round(rx/SPRITE_PX)*SPRITE_PX);
 const Ry=Math.max(SPRITE_PX, Math.round((ry||R*.55)/SPRITE_PX)*SPRITE_PX);
 const steps=Math.max(24, Math.round((R+Ry)*2.2/SPRITE_PX));
 for(let i=0;i<steps;i++){
  const ang=(i/steps)*Math.PI*2;
  pxTex(cx+Math.cos(ang)*R, cy+Math.sin(ang)*Ry, color, a);
 }
}
function pxDustClump(x,y,seed=0,scale=1,a=1){
 // Tan/brown irregular clumps (watched-03). Opaque flat clusters, 2–3 tones.
 const S=SPRITE_PX;
 const ox=snap(x), oy=snap(y);
 const tones=['#6b5340','#a8845c','#c9a57a'];
 const cells=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[2,0],[-2,0],[1,-1],[-1,-1],[0,2]];
 const n=Math.max(5, Math.min(cells.length, 6+((seed*3)%5)+Math.round(scale*2)));
 for(let i=0;i<n;i++){
  const c=cells[(i+seed)%cells.length];
  const sx=ox+c[0]*S*scale, sy=oy+c[1]*S*scale;
  pxTex(sx, sy, tones[(i+seed)%3], a*(i%4===0?.7:.95));
 }
}
function pxRadialLines(cx,cy,r0,r1,count,color,a=1,squash=.72){
 // 1-texel radial spokes (watched-04 clash / watched-06 KO).
 const n=count|0;
 for(let i=0;i<n;i++){
  const ang=(i/n)*Math.PI*2;
  const cos=Math.cos(ang), sin=Math.sin(ang)*squash;
  for(let d=r0; d<=r1; d+=SPRITE_PX){
   pxTex(cx+cos*d, cy+sin*d, color, a);
  }
 }
}
function pxJaggedBurst(cx,cy,r,ink,body,hot,a=1){
 // Noisy jagged disk (watched-06 KO center) — not a soft circle.
 const R=Math.max(SPRITE_PX*2, Math.round(r/SPRITE_PX)*SPRITE_PX);
 for(let y=-R;y<=R;y+=SPRITE_PX){
  for(let x=-R;x<=R;x+=SPRITE_PX){
   const d=Math.hypot(x,y);
   // jagged radius via hash of cell
   const jag=((Math.sin((x*12.9898+y*78.233)*43758.5453)*10000)%1);
   const lim=R*(.72+jag*.35);
   if(d>lim)continue;
   const t=d/lim;
   const col=t>.82?ink:t>.45?body:hot;
   pxTex(cx+x, cy+y, col, a);
  }
 }
}
function pxLayeredBeam(x0,y0,x1,y1,halfW,cols,opts={}){
 // Continuous thick beam (watched-04/05): dark 1-texel rim → orange body → yellow → white core + white spiral.
 const dx=x1-x0, dy=y1-y0, L=Math.hypot(dx,dy)||1;
 const ux=dx/L, uy=dy/L, nx=-uy, ny=ux;
 const S=SPRITE_PX;
 const half=Math.max(S*3, Math.round(halfW/S)*S);
 const tAge=opts.t||0;
 const spiral=opts.spiral!==false;
 const wobble=opts.wobble!==false;
 const alpha=opts.alpha??1;
 // Step along beam one texel at a time for a solid column (no gaps / no blob chain)
 for(let d=0; d<=L; d+=S){
  const u=d/Math.max(1,L);
  const wave=wobble ? Math.round((Math.sin(tAge*14+d*.1)*S + Math.sin(tAge*7+d*.2)*S*.4)/S)*S : 0;
  const w=Math.max(S*2, half + wave - Math.round(u*S)); // slight taper optional
  const cx=x0+ux*d, cy=y0+uy*d;
  for(let s=-w; s<=w; s+=S){
   const abs=Math.abs(s);
   let col;
   if(abs >= w) col=cols.ink;                 // exact outer rim (1 texel)
   else if(abs >= w-S) col=cols.ink;          // keep rim thick enough to read
   else if(abs >= Math.round(w*0.62/S)*S) col=cols.body;
   else if(abs >= Math.round(w*0.32/S)*S) col=cols.accent;
   else col=cols.hot;
   pxTex(cx+nx*s, cy+ny*s, col, alpha);
  }
  // white spiral streaks wrapping the body (1 texel)
  if(spiral){
   const phase=tAge*11+d*.14;
   const side=Math.round((Math.sin(phase)* (w-S*2) )/S)*S;
   pxTex(cx+nx*side, cy+ny*side, '#ffffff', alpha);
   if((Math.floor(d/S)%3)===0){
    const side2=Math.round((Math.sin(phase+2.2)*(w-S*3))/S)*S;
    pxTex(cx+nx*side2, cy+ny*side2, cols.accent||'#ffc857', alpha*.9);
   }
  }
 }
 if(opts.tip!==false){
  pxJaggedBurst(x1,y1, Math.max(S*4, half*1.05), cols.ink, cols.body, cols.hot, alpha*.95);
 }
}
function pxBeamHead(x,y,ang,halfW,cols,a=1){
 const c=Math.cos(ang), s=Math.sin(ang);
 pxLayeredBeam(x-c*halfW, y-s*halfW, x+c*halfW*1.2, y+s*halfW*1.2, halfW*.85, cols, {t:time||0, spiral:false, tip:true, alpha:a, wobble:false});
}

const fxSprites={flames:[],flameCore:[],ember:[],flare:[],ice:[],leaves:[],water:[],sparks:[],hitX:[],slash:[],bolt:[],poison:[],steel:[]};
let vfxScenes=[];
function fxTinyArt(kind,variant=0){
 // Compact texel canvases: each source pixel becomes SPRITE_PX on stage (matches character).
 const sizes={flames:[14,20],flameCore:[10,14],ember:[5,5],flare:[12,14],ice:[8,12],leaves:[7,9],water:[7,11],sparks:[7,12],hitX:[9,9],slash:[12,7],bolt:[7,14],poison:[7,7],steel:[8,8]};
 const [cw,ch]=sizes[kind]||[10,12];
 const c=document.createElement('canvas');c.width=cw;c.height=ch;
 const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const block=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x|0,y|0,Math.max(1,w|0),Math.max(1,h|0))};
 const dot=(x,y,col)=>block(x,y,1,1,col);
 const cx=cw>>1;
 if(kind==='flames'){
  for(let y=1;y<ch-1;y++){const u=y/(ch-1),w=1+Math.floor((cx-1)*Math.pow(u,.75)),lean=Math.round(Math.sin(variant+y*.45)*(1-u)*2);
   for(let x=cx-w+lean;x<=cx+w+lean;x++){const f=Math.abs(x-(cx+lean))/Math.max(1,w); if(f>1)continue;
    const col=f>.9?'#2a1214':f>.7?'#6e1618':f>.45?'#db371a':f>.22?'#ff8b24':u>.45?'#fff0aa':'#ffd761';
    if(x>=0&&x<cw)dot(x,y,col);
   }
  }
  block(cx-1,ch-5,2,3,'#fff7c7');
 }else if(kind==='flameCore'){
  for(let y=1;y<ch-1;y++){const u=y/(ch-1),w=1+Math.floor((cx-1)*Math.sin(u*Math.PI));
   for(let x=cx-w;x<=cx+w;x++){const f=Math.abs(x-cx)/Math.max(1,w);if(f>1)continue;
    const col=f>.85?'#4a1f1c':f>.55?'#bf2b15':f>.3?'#ff7f21':f>.15?'#ffbf49':'#fff7c8';
    if(x>=0&&x<cw)dot(x,y,col);
   }
  }
 }else if(kind==='ember'){
  block(1,1,3,3,'#ff6822');block(2,2,1,1,'#fff5bf');block(0,2,1,1,'#c82f1a');block(4,2,1,1,'#ffb33d');
 }else if(kind==='flare'){
  for(let y=0;y<ch;y++){const u=y/(ch-1),w=1+Math.floor(cx*Math.sin(u*Math.PI));
   for(let x=cx-w;x<=cx+w;x++){const f=Math.abs(x-cx)/Math.max(1,w);dot(x,y,f>.8?'#3d120c':f>.5?'#ff5a1a':f>.25?'#ffb43a':'#fff6c8')}}
 }else if(kind==='ice'){
  for(let y=1;y<ch-1;y++){const w=1+((y+variant)%3);for(let x=cx-w;x<=cx+w;x++)dot(x,y,Math.abs(x-cx)>w-1?'#2a5a72':'#b8f7ff')}
  block(cx,0,1,1,'#ffffff');block(cx-1,ch-2,3,1,'#7fdfff');
 }else if(kind==='leaves'){
  block(1,2,5,2,'#3d7a2e');block(2,1,4,2,'#7cd671');block(3,0,2,2,'#bdf49e');block(2,4,3,2,'#5dcf7a');block(3,6,1,2,'#57b85e');
 }else if(kind==='water'){
  for(let y=1;y<ch-1;y++){const w=1+Math.floor((1-Math.abs(y-cx)/(ch/2))*(cx-1));
   for(let x=cx-w;x<=cx+w;x++)dot(x,y,Math.abs(x-cx)>w-1?'#0f3d5c':y<3?'#e9ffff':'#3ca9bf')}
  block(cx,1,1,1,'#ffffff');
 }else if(kind==='sparks'){
  for(let i=0;i<ch;i++){const zig=((i+variant)%4)<2?1:-1;dot(cx+zig,i,'#1a2030');dot(cx,i,'#ffe03c');if(i%3===0)dot(cx-zig,i,'#fff38b')}
 }else if(kind==='hitX'){
  for(let i=0;i<cw;i++){dot(i,i,'#1a2030');dot(i,cw-1-i,'#1a2030');dot(i,Math.max(0,i-1),'#fff8d0');dot(i,Math.min(cw-1,cw-i),'#fff8d0')}
  block(cx-1,cx-1,2,2,'#ffffff');
 }else if(kind==='slash'){
  for(let x=0;x<cw;x++){const y=Math.floor((x/(cw-1))*(ch-1));dot(x,y,'#1a2030');dot(x,Math.max(0,y-1),'#ffffff');if(y+1<ch)dot(x,y+1,'#c8d8ff')}
 }else if(kind==='bolt'){
  const path=[0,1,2,1,2,3,2,3,4,3,2,1,0,1];
  for(let y=0;y<ch;y++){const x=cx-2+path[y%path.length];dot(x,y,'#1a2030');dot(x+1,y,'#ffe03c');if(y%2===0)dot(x+2,y,'#fff38b')}
 }else if(kind==='poison'){
  for(let y=0;y<ch;y++){const w=cx-Math.abs(y-cx);for(let x=cx-w;x<=cx+w;x++)dot(x,y,Math.abs(x-cx)+Math.abs(y-cx)>cx?'#2a1040':'#8a4ec6')}
  block(cx,cx,1,1,'#e6bbff');
 }else if(kind==='steel'){
  block(1,1,cw-2,ch-2,'#6a7a8a');block(2,2,cw-4,ch-4,'#c5d0dc');block(3,3,2,2,'#ffffff');
  for(let i=0;i<cw;i++){dot(i,0,'#1a2030');dot(i,ch-1,'#1a2030');dot(0,i,'#1a2030');dot(cw-1,i,'#1a2030')}
 }
 return c;
}
for(const kind of Object.keys(fxSprites))for(let i=0;i<4;i++)fxSprites[kind].push(fxTinyArt(kind,i));
function fxStar(x,y,r,type='electric',alpha=1){
 const palette=type==='fire'?['#3d120c','#ff5f1f','#ffc857','#fff3c8']:type==='water'?['#0f3d5c','#3ec8f5','#e8ffff','#fff']:type==='grass'?['#1d4a28','#6ce85a','#e8ff9a','#fff']:type==='poison'?['#2a1040','#c86ef0','#e8ff7a','#fff']:type==='ice'?['#1a4a68','#9ceeff','#f4ffff','#fff']:['#3a2808','#ffd63d','#fff4b0','#fff'];
 ctx.save();ctx.globalAlpha*=alpha;
 const ink=SPRITE_PX*5, core=SPRITE_PX*4;
 pxLine(x-r,y,x+r,y,ink,palette[0],1,1);pxLine(x,y-r,x,y+r,ink,palette[0],1,1);
 for(let j=0;j<4;j++){const rr=Math.round((r*(1-j*.24))/SPRITE_PX)*SPRITE_PX,t=Math.max(SPRITE_PX,core-j*SPRITE_PX);pxLine(x-rr,y,x+rr,y,t,palette[j],1,1);pxLine(x,y-rr,x,y+rr,t,palette[j],1,1);if(j<2){pxLine(x-rr*.7,y-rr*.7,x+rr*.7,y+rr*.7,Math.max(SPRITE_PX,t-SPRITE_PX),palette[j],1,1);pxLine(x-rr*.7,y+rr*.7,x+rr*.7,y-rr*.7,Math.max(SPRITE_PX,t-SPRITE_PX),palette[j],1,1)}}
 ctx.restore();
}
function fxStamp(kind,x,y,w,h=0,variant=0,alpha=1,angle=0){
 const c=fxSprites[kind]?.[Math.abs(Math.floor(variant))%4];if(!c)return;
 // Integer art-scale: each source texel maps to exactly SPRITE_PX CSS px (character grid).
 const nativeW=c.width*SPRITE_PX, nativeH=c.height*SPRITE_PX;
 const artScale=Math.max(1, Math.round((w||nativeW)/nativeW));
 const qw=nativeW*artScale, ph=nativeH*artScale;
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(snap(x),snap(y));ctx.rotate(angle);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(c,-qw/2,-ph,qw,ph);ctx.restore();
}
function fxBloom(x,y,r,c,alpha){if(fxQuality==='low')return;/* thin floor-style rings only — never soft gradients */const rr=Math.round(r/SPRITE_PX)*SPRITE_PX;pxFloorRing(x,y,rr,rr*.55,c,alpha*.35);pxFloorRing(x,y,Math.max(SPRITE_PX*2,rr*.65),Math.max(SPRITE_PX,rr*.36),c,alpha*.2)}
function fxFlameWall(cx,cy,range,t,alpha=1){
 const k=Math.min(1,t/.18), radius=Math.max(SPRITE_PX*5, Math.round(range*k/SPRITE_PX)*SPRITE_PX);
 const cols={ink:'#3d120c', body:'#ff5f1f', accent:'#ffc857', hot:'#fff8e0'};
 ctx.save();ctx.globalAlpha*=alpha;
 pxFloorRing(cx,cy,radius,radius*.55,'#401e1e',.85);
 pxFloorRing(cx,cy,Math.max(SPRITE_PX*3,radius-SPRITE_PX*2),Math.max(SPRITE_PX*2,radius*.45),'#ff7d2a',.7);
 const count=fxQuality==='low'?12:20;
 for(let i=0;i<count;i++){
  const a=(i/count)*Math.PI*2+t*.4;
  const x=cx+Math.cos(a)*radius, y=cy+Math.sin(a)*radius*.55;
  const x2=cx+Math.cos(a)*(radius+SPRITE_PX*5), y2=cy+Math.sin(a)*(radius*.55)-SPRITE_PX*6;
  pxLayeredBeam(x,y,x2,y2,SPRITE_PX*2,cols,{t:t+i,spiral:false,tip:true,wobble:true,alpha:.9});
  if(i%2===0)pxDustClump(x,y+SPRITE_PX,i,1,.75);
 }
 ctx.restore();
}
function fxSpawnScene(kind,x,y,props={}){
 if(vfxScenes.length>=22)vfxScenes.shift();
 const scene={kind,x,y,age:0,life:props.life??.62,element:props.element||'fire',power:props.power||1,range:props.range||145,angle:props.angle||0,seed:props.seed||Math.random()*20,owner:props.owner||'player'};
 vfxScenes.push(scene);return scene;
}
function fxStepScenes(dt){for(const o of vfxScenes)o.age+=dt;vfxScenes=vfxScenes.filter(o=>o.age<o.life)}
function fxDrawScenes(layer){
 for(const o of vfxScenes){
  const k=o.age/o.life, fade=Math.min(1,(1-k)*3), grow=Math.min(1,o.age/.14);
  const r=Math.round((o.range*(.22+grow*.78))/SPRITE_PX)*SPRITE_PX;
  const pal=arcadePal(o.element);
  if(layer==='ground'){
   if(o.kind==='wall'||o.kind==='impact'||o.kind==='quake'){
    // watched-03/05: thin 1-texel concentric floor rings (elliptical)
    const a1=.55*fade, a2=.4*fade, a3=.28*fade;
    pxFloorRing(o.x,o.y,r,r*.55,'#f4f7ff',a1);
    pxFloorRing(o.x,o.y,Math.max(SPRITE_PX*3,r*.72),Math.max(SPRITE_PX*2,r*.4), pal.hot||'#fff', a2);
    pxFloorRing(o.x,o.y,Math.max(SPRITE_PX*2,r*.45),Math.max(SPRITE_PX,r*.28), pal.main, a3);
    // tan dust clumps around base
    const n=fxQuality==='low'?5:9;
    for(let i=0;i<n;i++){
     const ang=(i/n)*Math.PI*2+o.seed, rr=r*(.18+k*.35);
     pxDustClump(o.x+Math.cos(ang)*rr, o.y+Math.sin(ang)*rr*.55, i+((o.seed*10)|0), 1+(i%2), fade*.9);
    }
   }
  } else if(layer==='over'){
   if(o.kind==='wall')fxFlameWall(o.x,o.y,o.range,o.age,fade);
   else if(o.kind==='impact'||o.kind==='quake'){
    // watched-06: jagged hot burst + 1-texel radial lines + sparse sparks
    pxJaggedBurst(o.x,o.y, Math.max(SPRITE_PX*4,r*.35), pal.ink, pal.main, pal.hot||'#fff', .95*fade);
    pxRadialLines(o.x,o.y, r*.15, r*.95, fxQuality==='low'?12:18, k<.5?(pal.hot||'#fff'):pal.accent, .85*fade, .68);
    if(k<.4){fxStamp('hitX',o.x,o.y,SPRITE_PX*10,SPRITE_PX*12,Math.floor(o.seed)%4,(1-k/.45)*.9,0)}
    // sparse 1-texel sparks only
    const n=fxQuality==='low'?8:14;
    for(let i=0;i<n;i++){
     const ang=(i/n)*Math.PI*2+o.seed*3, rr=r*(.25+k*.5);
     pxTex(o.x+Math.cos(ang)*rr, o.y+Math.sin(ang)*rr*.7, i%3?pal.hot||'#fff':pal.main, fade*.95);
    }
   }
  }
 }
}
function fxDrawFlameBeam(m){ skillEffect('flamethrower').draw(m); }

function fxDrawThunder(m){ skillEffect('thunderbolt').draw(m); }

function fxDrawSurf(m){ skillEffect('surf').draw(m); }

function fxDrawOrb(m){ skillEffect('energyball').draw(m); }

function fxDrawExtraSignature(m,layer){
 const sid=m.move?.id; const mod=sid&&skillEffect(sid);
 if(mod?.drawExtra){ mod.drawExtra(m,layer); return; }
 drawExtraSignatureFor(sid,m,layer);
}
function drawExtraSignatureFor(id,m,layer){ /* moved into skills/<id>/effect.js */ }

function fxDrawStatus(actor){
 const st=actor.status?.kind;if(!st&&!actor.seeded)return;
 const x=actor.x,y=actor.y-26,phase=time*8;
 if(st==='burn'){for(let i=0;i<5;i++){const a=phase*.35+i*Math.PI*2/5;fxStamp('flames',x+Math.cos(a)*19,y+Math.sin(a)*8,13,26,i,.72)}}
 if(st==='freeze'){for(let i=0;i<6;i++){const a=i*Math.PI*2/6+phase*.12;fxStamp('ice',x+Math.cos(a)*17,y+Math.sin(a)*13,12,22,i,.86,a*.3)}}
 if(st==='paralysis'){for(let i=0;i<6;i++){const a=i*Math.PI*2/6+phase*.45;fxStamp('sparks',x+Math.cos(a)*21,y+Math.sin(a)*13,9,18,i,.85,a);if(i%2===0)fxStamp('bolt',x+Math.cos(a)*14,y+Math.sin(a)*10,8,16,i,.55,a)}}
 if(st==='poison'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5+phase*.18;fxStamp('poison',x+Math.cos(a)*16,y+Math.sin(a)*14,12,18,i,.8,a)}}
 if(actor.seeded){for(let i=0;i<5;i++){const a=i*Math.PI*2/5+phase*.16;fxStamp('leaves',x+Math.cos(a)*18,y+Math.sin(a)*16,10,18,i,.78,a)}}
}
function fxPixelSkillIcons(){
 if(!player)return;
 const palette={electric:['#805e15','#ffe34d','#ffffff'],fire:['#8e251c','#ff902b','#fff4a5'],water:['#1b639b','#57c8ee','#f1ffff'],grass:['#3b7e45','#80ed79','#f2ffca'],ice:['#28698d','#96e7f6','#f6ffff'],dragon:['#534188','#9c8ce8','#ffffff'],flying:['#447aa1','#a6e5ef','#ffffff'],poison:['#713388','#c875ef','#f0d6ff'],steel:['#51677c','#a7bbd2','#ffffff'],normal:['#766b4e','#e5d7b0','#fff']};
 const mode=(n)=>n===2?'dash':n===0?roster[chosen].type:n===1?roster[chosen].type:equippedMove(player,n)?.type||roster[chosen].type;
 for(const btn of document.querySelectorAll('.skill')){
  const n=+btn.dataset.n,slot=btn.querySelector('.glyph');if(!slot)continue;
  const type=mode(n),p=palette[type]||palette.normal;
  const c=document.createElement('canvas');c.width=c.height=20;c.className='fxMoveIcon';c.style.width='27px';c.style.height='27px';c.style.imageRendering='pixelated';c.style.filter='drop-shadow(0 2px 2px #041826)';
  const g=c.getContext('2d');const b=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
  if(n===2){b(9,1,3,13,'#e6fdff');b(5,7,9,3,'#99e5ff');b(4,14,4,3,'#579eba');b(12,14,4,3,'#579eba');}
  else if(type==='fire'){b(9,1,3,5,p[2]);b(7,5,7,5,p[1]);b(5,9,11,7,p[0]);b(7,10,7,6,p[1]);b(9,9,3,7,p[2]);}
  else if(type==='electric'){b(10,1,5,5,p[1]);b(6,6,8,3,p[2]);b(7,8,5,4,p[1]);b(5,12,6,5,p[1]);b(7,15,3,4,p[2]);}
  else if(type==='water'||type==='ice'){b(9,1,3,4,p[2]);b(7,5,7,5,p[1]);b(5,10,11,5,p[0]);b(7,8,7,9,p[1]);b(9,8,3,5,p[2]);}
  else if(type==='grass'){b(8,2,4,14,p[2]);b(4,6,12,7,p[1]);b(3,10,10,6,p[0]);b(10,4,7,8,p[1]);}
  else{b(8,2,5,15,p[0]);b(5,7,12,8,p[1]);b(8,9,6,5,p[2]);}
  slot.replaceChildren(c);
 }
}

function fxDrawActorMotion(o){
 if(!o)return;
 const isPlayer=o===player,phase=Math.max(0,Math.min(1,1-((o.actLeft||0)/.24))),tx=o.x,ty=o.y-(o.riding?10:0)-13,kind=(o.type||roster[o.kind]?.type||'neutral');
 if((o.action==='Shoot'||o.tell>0)&&phase<1.2){
  const a=(o.face||0),vx=Math.cos(a),vy=Math.sin(a),nx=-vy,ny=vx,pulse=Math.sin((time*18)+(isPlayer?0:1.7))*0.5+0.5;
  if(kind==='electric'){
   for(let i=0;i<4;i++){const off=(i-1.5)*8;fxRect(tx+vx*18+nx*off-2,ty+vy*8+ny*off-2,4,4,i%2?'#93f5ff':'#ffe16b',.85);if(i<3)pxLine(tx+nx*off,ty+ny*off,tx+vx*(18+6*pulse)+nx*(off+4),ty+vy*(10+4*pulse)+ny*(off-3),2,'#fff8b8',.75,.8)}
  } else if(kind==='fire'){
   for(let i=0;i<3;i++){const off=(i-1)*SPRITE_PX*2;pxTex(tx+vx*(12+phase*8)+nx*off,ty+vy*(4+phase*4)+ny*off*.2,i%2?'#ffc857':'#fff8e0',.8)}
   fxStamp('flameCore',tx+vx*(18+phase*10),ty+vy*(4+phase*6),12,20,Math.floor(time*12)%4,.7+phase*.2,Math.atan2(vy,vx)-Math.PI/2);
  } else if(kind==='water'){
   for(let i=0;i<4;i++){const off=(i-1.5)*7;fxStamp('water',tx+vx*(14+phase*8)+nx*off,ty+vy*(6+phase*4)+ny*off*.2,7,14+phase*10,i,.75,a)}
  } else if(kind==='grass'){
   for(let i=0;i<4;i++){const off=(i-1.5)*7;fxStamp('leaves',tx+vx*(12+phase*8)+nx*off,ty+vy*(4+phase*5)+ny*off*.25,8,16+phase*12,i,.76,a+off*.03)}
  }
 }
 if((o.dashTime||0)>0){
  const dir=Math.atan2(o.dashY||0,o.dashX||1),vx=Math.cos(dir),vy=Math.sin(dir);
  for(let i=1;i<=4;i++){const a=.16*(1-i/5),px=tx-vx*i*16,py=ty-vy*i*12;fxRect(px-7,py-7,14,14,'#ffffff',a*.35)}
 }
 if(o.riding){
  const t=time*12;for(let i=0;i<3;i++){const rr=18+i*8+Math.sin(t+i)*2;pxRing(o.x,o.y+10,rr,2,i===0?'#dffaff':'#8feaff',.25,.8)}
 }
}
function fxDrawChargeHalo(o){
 if(!o)return;const kind=(o.type||roster[o.kind]?.type||'neutral'), a=o.face||0,x=o.x,y=o.y-10,pal=arcadePal(kind);
 fxBloom(x,y,26+Math.sin(time*16)*4,pal.glow,.1);
 pxRing(x,y,20+Math.sin(time*10)*2,4,pal.ink,.55,4);pxRing(x,y,17+Math.sin(time*10)*2,3,pal.main,.65,4);
 for(let i=0;i<8;i++){const ang=a+i*Math.PI/4+time*2.2;fxRect(x+Math.cos(ang)*20-2,y+Math.sin(ang)*11-2,5,5,i%2?pal.hot:pal.accent,.8)}
}
function fxArcSlash(cx,cy,r,ang,alpha,c1,c2){
 ctx.save();ctx.translate(snap(cx),snap(cy));ctx.rotate(ang);ctx.globalAlpha*=alpha;
 const rr=Math.round(r/SPRITE_PX)*SPRITE_PX;
 // Pixel-stepped arc band (no canvas stroke)
 for(let a=-1.15;a<-0.08;a+=0.08){
  const x=Math.cos(a)*rr,y=Math.sin(a)*rr;
  pxCell(x,y,c1,1); pxCell(x+SPRITE_PX*Math.cos(a),y+SPRITE_PX*Math.sin(a),c2,.95);
 }
 for(let a=-1.05;a<-0.18;a+=0.1){
  const x=Math.cos(a)*(rr-SPRITE_PX*2),y=Math.sin(a)*(rr-SPRITE_PX*2);
  pxCell(x,y,c2,1);
 }
 ctx.restore();
}

// 5x7 bitmap hit numbers; rasterized on the gameplay canvas for sharp numerical feedback.
const FX_DIGITS={
 '0':['01110','10001','10011','10101','11001','10001','01110'],
 '1':['00100','01100','00100','00100','00100','00100','01110'],
 '2':['01110','10001','00001','00010','00100','01000','11111'],
 '3':['11110','00001','00001','01110','00001','00001','11110'],
 '4':['10010','10010','10010','11111','00010','00010','00010'],
 '5':['11111','10000','10000','11110','00001','00001','11110'],
 '6':['01110','10000','10000','11110','10001','10001','01110'],
 '7':['11111','00001','00010','00100','00100','00100','00100'],
 '8':['01110','10001','10001','01110','10001','10001','01110'],
 '9':['01110','10001','10001','01111','00001','00001','01110'],
 '-':['00000','00000','00000','11111','00000','00000','00000']
};
function fxBitmapNumber(text,x,y,scale,fill){
 text=String(text);const len=text.length,width=len*6*scale-scale,xx=snap(x-width/2,2),yy=snap(y-4*scale,2);
 const entries=[];
 for(let k=0;k<len;k++){
  const glyph=FX_DIGITS[text[k]]||FX_DIGITS['0'];
  for(let iy=0;iy<7;iy++)for(let ix=0;ix<5;ix++)if(glyph[iy][ix]==='1')entries.push([xx+(k*6+ix)*scale,yy+iy*scale]);
 }
 ctx.save();for(const [gx,gy] of entries){ctx.fillStyle='#102431';ctx.fillRect(gx-2,gy-1,scale+3,scale+3)}
 ctx.fillStyle=fill;for(const [gx,gy] of entries)ctx.fillRect(gx,gy,scale,scale);
 ctx.restore();
}


function drawThunderbolt(m){fxDrawThunder(m)}
function drawFlamethrower(m){fxDrawFlameBeam(m)}
function drawEnergyball(m){skillEffect('energyball').draw(m)}
function drawEnergyBurst(m){ const e=skillEffect('energyball'); if(e.drawBurst) e.drawBurst(m); }

function drawSurf(m){fxDrawSurf(m)}
function drawExtraSpecial(m,layer){
 fxDrawExtraSignature(m,layer);
}

function drawSpecials(layer){
 for(const m of specialEffects){
  if(m.type==='extra'){drawExtraSpecial(m,layer);continue;}
  if(layer==='under' && m.type==='surf')drawSurf(m);
  if(layer!=='over')continue;
  if(m.type==='thunderbolt'||m.type==='boltEcho')drawThunderbolt(m);
  if(m.type==='flamethrower')drawFlamethrower(m);
  if(m.type==='energyball')drawEnergyball(m);
  if(m.type==='energyburst')drawEnergyBurst(m);
 }
}
function drawGround(ox,oy){paintArenaFloor(ox,oy)}
function draw(){ctx.clearRect(0,0,W,H);if(!player){ctx.fillStyle='#11323d';ctx.fillRect(0,0,W,H);return}const sh=shake?(Math.random()-.5)*shake:0,ox=Math.round(W/2-player.x+sh+cameraKick.x),oy=Math.round(H/2-player.y+sh+cameraKick.y);drawGround(ox,oy);ctx.save();ctx.translate(ox,oy);renderDecals();fxDrawScenes('ground');renderImpactLights();
drawSpecials('under');
for(const m of specialEffects){if(m.type==='extra'&&m.move.mode==='charge'&&!m.fired)fxDrawChargeHalo(m.owner==='player'?player:enemies[0]);}
let render=[];for(const e of enemies)render.push({y:e.y,kind:0,obj:e});render.push({y:player.y,kind:1,obj:player});render.sort((a,b)=>a.y-b.y);for(const it of render){let e=it.obj;if(it.kind===0){if(e.isSubstitute){drawSubstituteDoll(e.x,e.y,e.flash,e.actionT);ctx.fillStyle='#102837c7';ctx.fillRect(e.x-17,e.y-56,34,5);ctx.fillStyle='#c9a06a';ctx.fillRect(e.x-17,e.y-56,34*clamp(e.hp/e.maxHp,0,1),5);ctx.fillStyle='#fff2c8';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillText('대타출동',e.x,e.y-62)}else{const act=e.hurt>0?'Hurt':(e.action||'Walk');spriteDraw(e.id,e.x,e.y-(e.riding?10:0),e.face,act,e.actionT,SPRITE_SCALE,e.flash,'enemy',e);fxDrawActorMotion(e);drawStatusPixels(e);fxDrawStatus(e);if(e.tell>0){const tr=Math.round((38+10*Math.sin(time*17)**2)/SPRITE_PX)*SPRITE_PX;pxRing(e.x,e.y,tr,SPRITE_PX,'#ff9079',.45+.4*Math.sin(time*23)**2,SPRITE_PX);pxLine(e.x,e.y,e.x+e.attackVec.x*65,e.y+e.attackVec.y*65,SPRITE_PX,'#ff9079',.7,1)}ctx.fillStyle='#102837c7';ctx.fillRect(e.x-17,e.y-56,34,5);ctx.fillStyle='#ff737f';ctx.fillRect(e.x-17,e.y-56,34*clamp(e.hp/e.maxHp,0,1),5)}}else{spriteDraw(roster[chosen].id,player.x,player.y-(player.riding?10:0),player.face,player.action,player.animT,SPRITE_SCALE,player.inv>0?.2:0,'player',player);fxDrawActorMotion(player);drawStatusPixels(player);fxDrawStatus(player)}}
for(const g of gems){ctx.save();ctx.translate(g.x,g.y+Math.sin(g.t*5)*4);ctx.fillStyle='#4af8ed55';ctx.beginPath();ctx.arc(0,0,10,0,7);ctx.fill();ctx.rotate(Math.PI/4);ctx.fillStyle='#85ffe9';ctx.fillRect(-5,-5,10,10);ctx.fillStyle='#e7fffa';ctx.fillRect(-2,-5,4,4);ctx.restore()}
for(const s of projectiles)drawProjectileSprite(s)
drawSpecials('over');fxDrawScenes('over');
for(const p of particles)drawParticleSprite(p);ctx.globalAlpha=1;
for(const a of areas)drawAreaPulse(a);renderShockwaves();renderDamageText();ctx.globalAlpha=1;
let aimVec=skillPointers.size?[...skillPointers.values()].at(-1).v:targetAim();if(gameState==='playing'&&(skillPointers.size>0||mouseAim)){const end=skillPointers.size?260:110;for(let t=18;t<end;t+=10){pxRect(player.x+aimVec.x*t-2,player.y+aimVec.y*t-8,4,4,skillPointers.size?'#fff6a9':'#fff6a988',.9)}if(skillPointers.size){let x=player.x+aimVec.x*260,y=player.y+aimVec.y*260-6;pxRing(x,y,12,4,'#fff3a9',.95,4)}}ctx.restore();
for(let [,p] of skillPointers){for(let q=0;q<=1;q+=0.08){const x=p.sx+(p.x-p.sx)*q,y=p.sy+(p.y-p.sy)*q;ctx.fillStyle='#fffbdbdd';ctx.fillRect(Math.round(x/4)*4,Math.round(y/4)*4,4,4)}ctx.fillStyle='#e3fbffbb';ctx.fillRect(Math.round(p.x/4)*4-4,Math.round(p.y/4)*4-4,8,8)}}

// Expose canvas helpers to character/skill modules (single copy — not inlined there).
function bindArtsApi(){
 bindRenderApi({
  get ctx(){return ctx},
  get SPRITE_PX(){return SPRITE_PX},
  get SPRITE_SCALE(){return SPRITE_SCALE},
  get fxQuality(){return fxQuality},
  get time(){return time},
  get player(){return player},
  get enemies(){return enemies},
  get EXTRA_PALETTE(){return EXTRA_PALETTE},
  get SURF_WIDTH_TEXELS(){return SURF_WIDTH_TEXELS},
  clamp, fxStar, fxStamp, snap,
  pxTex, pxLayeredBeam, pxJaggedBurst, pxRadialLines, pxFloorRing, pxRing, pxRect, pxCell, pxLine, pxDiamond,
  arcadePal, drawFallbackCreature, drawExtraSignatureFor,
  drawLeafShape, fxBloom, fxRect, pxDustClump,
 });
}
bindArtsApi();
function loop(t){let dt=Math.min(.035,(t-last)/1000||0);last=t;advance(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
const joy=$('joy'),nub=$('nub');function moveJoy(e){const r=joy.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,limit=r.width*.31,dist=len(x,y),mag=Math.min(1,dist/limit);joyVec.x=dist?x/dist*mag:0;joyVec.y=dist?y/dist*mag:0;nub.style.transform=`translate(${joyVec.x*limit}px,${joyVec.y*limit}px)`}joy.addEventListener('pointerdown',e=>{if(joyPointer!==null)return;e.preventDefault();joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);moveJoy(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)moveJoy(e)});function stopJoy(e){if(e.pointerId!==joyPointer)return;joyPointer=null;joyVec.x=0;joyVec.y=0;nub.style.transform=''}joy.addEventListener('pointerup',stopJoy);joy.addEventListener('pointercancel',stopJoy);
document.querySelectorAll('.skill').forEach(b=>{
 const n=+b.dataset.n;
 b.addEventListener('pointerdown',e=>{
  if(gameState!=='playing')return;
  e.preventDefault();b.setPointerCapture(e.pointerId);
  const v=targetAim(),instant=n===1&&(roster[chosen].type==='fire'||roster[chosen].type==='water');
  player.channelAim=v;
  skillPointers.set(e.pointerId,{n,sx:e.clientX,sy:e.clientY,x:e.clientX,y:e.clientY,v,instant});
  b.classList.add('selected');
  if(instant)activate(n,v,true); // Surf works with a plain tap immediately.
 });
 b.addEventListener('pointermove',e=>{
  const p=skillPointers.get(e.pointerId);if(!p)return;
  p.x=e.clientX;p.y=e.clientY;
  const dx=p.x-p.sx,dy=p.y-p.sy;
  if(len(dx,dy)>13){
   p.v=norm(dx,dy);player.channelAim=p.v;lastAim=p.v;
   if(p.n===1&&roster[chosen].type==='water'){
    const wave=specialEffects.find(m=>m.type==='surf'&&m.owner==='player'&&m.age<.25);
    if(wave){
      const travelled=wave.distance||0;
      wave.origin.x=player.x-p.v.x*(10+travelled*.92);
      wave.origin.y=player.y-5-p.v.y*(10+travelled*.92);
      wave.vx=p.v.x;wave.vy=p.v.y;
    }
   }
  }
 });
 function release(e,cancelled){
  const p=skillPointers.get(e.pointerId);if(!p)return;
  if(!p.instant&&!cancelled)activate(p.n,p.v);
  if(p.n===1&&roster[chosen].type==='fire')stopPlayerChannel();
  skillPointers.delete(e.pointerId);b.classList.remove('selected');
 }
 b.addEventListener('pointerup',e=>release(e,false));
 b.addEventListener('pointercancel',e=>release(e,true));
 b.addEventListener('lostpointercapture',e=>release(e,true));
});
addEventListener('keydown',e=>{let k=e.key.toLowerCase();keys.add(k);if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(e.repeat)return;
 if(labMode&&(k==='q'||k==='w'||k==='e'||k==='r')){labSelectHero({q:0,w:1,e:2,r:3}[k]);return;}
 const aim=labMode?labAim():undefined;
 if(k==='1')activate(0,aim);if(k==='2'){if(roster[chosen].type==='fire')activate(1,aim||targetAim(),true);else activate(1,aim);}if(k==='3')activate(3,aim);if(k==='4')activate(4,aim);if(k==='5'||k===' ')activate(2,aim);if(k==='p'||k==='escape'){if(labMode)return;pause()}});addEventListener('keyup',e=>{let k=e.key.toLowerCase();keys.delete(k);if(k==='2')stopPlayerChannel()});CV.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')mouseAim={x:e.clientX,y:e.clientY}});CV.addEventListener('pointerdown',e=>{if(gameState==='playing'&&e.pointerType==='mouse'){mouseAim={x:e.clientX,y:e.clientY};if(e.button===2)activate(1,targetAim(),true);else activate(0)}});CV.addEventListener('pointerup',e=>{if(e.button===2)stopPlayerChannel()});CV.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('visibilitychange',()=>{if(document.hidden&&gameState==='playing')pause()});
// iOS Safari: block rapid-double-tap zoom while retaining pointer-based attack controls.
let lastTouchEnd=0,lastTouchAt={x:0,y:0};
document.addEventListener('touchend',e=>{
 const now=Date.now(),t=e.changedTouches[0];
 if(t&&now-lastTouchEnd<340&&Math.hypot(t.clientX-lastTouchAt.x,t.clientY-lastTouchAt.y)<55){e.preventDefault()}
 if(t){lastTouchAt={x:t.clientX,y:t.clientY}}lastTouchEnd=now;
},{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
document.addEventListener('gesturechange',e=>e.preventDefault(),{passive:false});
// QA / capture reel: open with #vfxdemo or #vfxdemo&p=1 (pokemon index 0-3)
// Emphasizes each species' signature special (mouth beam / bolt / surf band / orb).
if(/vfxdemo/i.test(location.hash)){
 const poke=Math.max(0,Math.min(3,+(location.hash.match(/p=(\d)/)||[])[1]||0));
 const boot=()=>{
  chosen=poke;document.querySelectorAll('.choice').forEach((c,k)=>c.classList.toggle('on',k===poke));
  $('rivalSelect').value=String((poke+1)%4);refreshStatPanel();refreshLoadout();refreshMoveDex();
  startButton();
  const arm=()=>{
   if(!player||!enemies[0]){setTimeout(arm,120);return}
   player.maxHp=player.hp=12000;enemies[0].maxHp=enemies[0].hp=12000;
   enemies[0].shoot=999;enemies[0].specialCd=999;enemies[0].extraCd=999;enemies[0].tell=0;
   let step=0;const aim={x:1,y:0};lastAim=aim;mouseAim={x:W*.78,y:H*.48};
   // Keep target far enough that beams/orbs visibly travel to the hit point.
   const targetDist=roster[chosen].type==='fire'?240:roster[chosen].type==='water'?200:220;
   setInterval(()=>{
    if(gameState!=='playing'||!player||!enemies[0])return;
    enemies[0].hp=enemies[0].maxHp;player.hp=player.maxHp;player.fuel=100;
    enemies[0].x=player.x+targetDist;enemies[0].y=player.y-8;enemies[0].status=null;enemies[0].staggerT=0;
    player.cd=[0,0,0,0,0];player.status=null;player.staggerT=0;player.inv=0;
    // Prefer signature special; light basics between casts only.
    const seq=[1,1,0,1,1];const n=seq[step%seq.length];
    if(n===1&&roster[chosen].type==='fire'){activate(1,aim,true);setTimeout(stopPlayerChannel,900)}
    else activate(n,aim,false);
    step++;
   },820);
   // Capture hook each frame (classic-script lets are not on window; filter() rebinds the array).
   const mirror=()=>{window.__specialEffects=specialEffects;window.__player=player;window.__enemy=enemies&&enemies[0];requestAnimationFrame(mirror)};
   requestAnimationFrame(mirror);
   document.documentElement.dataset.vfxdemo='1';
  };
  setTimeout(arm,500);
};
 if(document.readyState==='complete')setTimeout(boot,400);else addEventListener('load',()=>setTimeout(boot,400));
}

// Skill test room: #vfxlab (optional &p=0..3). Not a live match — Substitute doll only.
if(/vfxlab/i.test(location.hash)){
 const bootLab=()=>{bootVfxLab()};
 if(document.readyState==='complete')setTimeout(bootLab,350);else addEventListener('load',()=>setTimeout(bootLab,350));
}
window.__SKILLS=SKILLS;window.__CHARACTERS=CHARACTERS;
