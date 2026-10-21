'use strict';
// Dependency-free regression tests for Pokemon Arena v27.
// Run from the repository root: node tests/smoke.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const addon = fs.readFileSync(path.join(root, 'battle-studio.js'), 'utf8');
const anchors = fs.readFileSync(path.join(root, 'emitter-anchors.js'), 'utf8');
const main = html.split('<script>')[1]?.split('</script>')[0];
assert(main, 'Missing main JavaScript');
assert(html.includes('battle-studio.js?v=27'), 'Motion Studio not linked');
assert(html.includes('emitter-anchors.js?v=27'), 'Sprite anchor data not linked');

function fakeContext(){
  return new Proxy({}, {
    get(obj, key){
      if(key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({addColorStop(){}});
      if(key === 'getImageData') return () => ({data:new Uint8ClampedArray(4)});
      if(key === 'measureText') return () => ({width:48});
      if(key in obj) return obj[key];
      return () => {};
    },
    set(obj, key, value){obj[key] = value;return true;}
  });
}
const canvasContext = fakeContext();
const elements = new Map();
function element(tag='div'){
  return {
    tag, id:'', dataset:{}, style:{setProperty(){}}, value:'-1',
    classList:{add(){},remove(){},toggle(){},contains(){return false}},
    innerHTML:'', textContent:'', width:440, height:850,
    parentElement:{style:{setProperty(){}}},
    getContext(){return canvasContext}, appendChild(){}, append(){}, replaceChildren(){},
    addEventListener(){}, setAttribute(){}, getAttribute(){return null},
    insertAdjacentElement(){}, querySelector(){return element()}, querySelectorAll(){return []},
    getBoundingClientRect(){return {left:0,top:460,width:200,height:150}},
    getElementsByTagName(){return []}
  };
}
const sandbox = {
  innerWidth:440, innerHeight:850, devicePixelRatio:1,
  performance:{now:()=>1000}, navigator:{userAgent:'CI mock'},
  document:{
    body:element(),head:element(),
    getElementById(id){if(!elements.has(id)) elements.set(id,element());return elements.get(id);},
    createElement:element,
    querySelector(){return element()}, querySelectorAll(){return []},addEventListener(){}
  },
  addEventListener(){},requestAnimationFrame(){},setTimeout(){return 1;},clearTimeout(){},
  fetch(){return Promise.reject(new Error('Network intentionally disabled in CI'));},
  Image: class {
    constructor(){this.width=72;this.height=72;this.naturalWidth=72;this.naturalHeight=72;}
    set src(_value){if(this.onerror)this.onerror(new Error('Offline sprite mock'));}
  },
  DOMParser:class {parseFromString(){return {getElementsByTagName(){return []}};}},
  Uint8ClampedArray, Math, Date
};
sandbox.window = sandbox;
const exposed = [
  'globalThis.__smoke = {',
  ' studio:window.motionStudio,',
  ' setChosen:(n)=>{chosen=n},',
  ' reset:()=>reset(),',
  ' draw:()=>draw(),',
  ' advance:(dt)=>advance(dt),',
  ' activate:(slot)=>activate(slot),',
  ' hurtPlayer:(amount)=>hurt(amount),',
  ' direction:(angle)=>faceFromAngle(angle),',
  ' flameTiming:(id)=>flameShootTiming(id),',
  ' flameClock:(age,info)=>flameChannelClock(age,info),',
  ' testShootMetadata:()=>{const shoot=sprites[roster[1].id].anims.Shoot;shoot.frames=18;shoot.dur=[4,2,4,2,1,1,1,2,4,2,2,2,2,2,2,2,2,4];shoot.hitFrame=8;shoot.returnFrame=11;return shoot;},',
  ' spriteClock:(actor)=>combatSpriteClock(actor,combatAnimation(actor),actor.animT||0),',
  ' stopFlame:()=>stopPlayerChannel(),',
  ' signature:(type)=>signatureAnimation(type),',
  ' anchorPoints:(actor,move,options)=>emissionWorldPoints(actor,move,options),',
  ' anchorPoint:(actor,move,options)=>emissionPoint(actor,move,options),',
  ' atlas:()=>window.PMD_EMISSION_ATLAS,',
  ' tuneSourceSheet:(id)=>{const atlas=window.PMD_EMISSION_ATLAS[id],sheet=sprites[id].anims.Shoot;const len=atlas.ports[Object.keys(atlas.ports)[0]].frames[0].length;sheet.frames=len;sheet.dur=Array(len).fill(4);sheet.w=atlas.cell[0];sheet.h=atlas.cell[1];sheet.feet=Array.from({length:8},()=>Array(len).fill(atlas.cell[1]*.79));sprites[id].variant=atlas.variant},',
  ' actionOf:(actor)=>combatAnimation(actor),',
  ' state:()=>({gameState,player,enemies,specialEffects,projectiles,extras:EXTRA_SKILLS_ENABLED}),',
  ' injectSheets:()=>{for(const actor of roster){const anims={};for(const key of ACTIONS){anims[key]={image:{width:240,height:448},w:60,h:56,frames:4,dirs:8,dur:[8,8,8,8]}}sprites[actor.id]={anims,variant:"mock",loaded:true}}}',
  '};'
].join('\n');
vm.runInNewContext(anchors+'\n'+main+'\n'+addon+'\n'+exposed, sandbox, {timeout:20000,filename:'arena+studio.js'});
const api = sandbox.__smoke;
assert.equal(api.state().gameState,'menu');
assert.equal(api.state().extras,false);
api.injectSheets();
assert.equal(api.studio.audit().valid,192);
for(let k=0;k<4;k++){
  api.setChosen(k);
  const beforeStudio=api.state().gameState;
  api.studio.open();
  assert.equal(api.state().gameState,'studio');
  for(const action of ['basic','special','dash']){
    api.studio.preview(action);
    assert.equal(api.studio.getState().action,action==='dash'?'Attack':'Shoot', 'Studio action role mismatch');
    api.draw();
  }
  api.studio.setCompare(true);
  assert.equal(api.studio.getState().compare,true);
  api.draw();
  api.studio.setCompare(false);
  api.studio.close();
  assert.equal(api.state().gameState,beforeStudio,'Studio did not restore the previous game state');
  api.reset();
  assert.equal(api.state().enemies.length,1);
  api.activate(3);api.activate(4);
  assert.equal(api.state().player.cd[3],0,'Old skill 3 activated');
  assert.equal(api.state().player.cd[4],0,'Old skill 4 activated');
  const me=api.state().player;
  const profile=api.atlas()[['0026','0006','0009','0003'][k]];
  assert(profile,'Missing PMD sprite port config for '+k);
  for(let direction=0;direction<8;direction++){
    const pmdAngles=[Math.PI/2,Math.PI/4,0,-Math.PI/4,-Math.PI/2,-3*Math.PI/4,Math.PI,3*Math.PI/4];
    const coords=api.anchorPoints(me,profile===api.atlas()['0026']?'thunderbolt':k===1?'flamethrower':k===2?'surf':'energyball',
      {angle:pmdAngles[direction],action:'Shoot',clock:.12});
    assert.equal(coords.length,k===2?2:1,'Wrong emission port count');
    for(const p of coords){
      assert.equal(p.direction,direction,'Wrong directional port row');
      assert(Number.isFinite(p.x)&&Number.isFinite(p.y),'Emitter coordinates must be finite');
      assert(p.cell.x>=0&&p.cell.y>=0,'Emitter pixel coordinates must not be negative');
      assert(p.cell.x<=profile.cell[0]&&p.cell.y<=profile.cell[1],'Emitter position exceeds sprite cell');
    }
  }
  api.activate(0);
  assert.equal(api.state().player.action,'Shoot','Basic ranged move should use Shoot');
  const emitted=api.state().projectiles.at(-1),origin=api.anchorPoint(me,'basic',
    {angle:me.face,action:'Shoot',clock:.12,index:0});
  assert(Math.abs(emitted.x-origin.x-Math.cos(me.face)*4)<.01,'Basic projectile X did not originate at port');
  assert(Math.abs(emitted.y-origin.y-Math.sin(me.face)*4)<.01,'Basic projectile Y did not originate at port');
  api.activate(1);
  assert(api.state().specialEffects.length>0,'Signature move did not cast');
  assert.equal(api.state().player.action,'Shoot','Signature move action role mismatch');
  assert.equal(api.actionOf(api.state().player),'Shoot','Rendered signature motion mismatched');
  const specialMove=api.state().specialEffects.find(m=>['thunderbolt','flamethrower','surf','energyball'].includes(m.type));
  assert(specialMove,'Signature effect not spawned');
  if(k===0){
    const start=api.anchorPoint(me,'thunderbolt',{angle:me.face,action:'Shoot',clock:.12});
    assert(Math.abs(start.x-specialMove.x)<.01,'10만볼트 must emerge at Raichu body');
  }
  if(k===2){
    assert.equal(specialMove.emitters.length,2,'Surf must originate from both Blastoise cannons');
    assert(specialMove.waveOrigin,'Surf needs cannon-root waveOrigin');
  }
  if(k===1 || k===3){
    const start=api.anchorPoint(me,k===1?'flamethrower':'energyball',
      {angle:me.face,action:'Shoot',clock:.12});
    const offset=k===3?14:0;
    assert(Math.abs(specialMove.x-start.x-Math.cos(me.face)*offset)<.01,'Projectile not emitted from mouth');
  }
  api.activate(2);
  assert.equal(api.state().player.action,'Attack','Dash must use Attack instead of Walk');
  assert.equal(api.actionOf(api.state().player),'Attack','Rendered dash must use Attack');
  api.state().player.inv=0;
  api.hurtPlayer(1);
  assert.equal(api.actionOf(api.state().player),'Hurt','Hit must show Hurt animation');
  api.advance(.035);
  // Hitstop can postpone state updates for several frames; allow enough simulated frames.
  for(let tick=0;tick<20;tick++)api.advance(.035);
  assert.equal(api.state().player.hurt,0,'Player Hurt animation must expire');
  assert.notEqual(api.actionOf(api.state().player),'Hurt','Rendered Hurt pose must release');
  api.advance(0.016);
  api.draw();
}
// Sustained Flamethrower: avoid recoil/Hurt-like HitFrame; hold forward-emission frame.
api.setChosen(1);
api.reset();
api.state().enemies[0].shoot=1000;
api.state().enemies[0].specialCd=1000;
api.state().enemies[0].atk=1000;
api.state().enemies[0].extraCd=1000;
const charizard=api.state().player;
const sheet=api.testShootMetadata(),timing=api.flameTiming('0006');
assert(timing.hold>0 && timing.end>timing.hold, 'Invalid Shoot phase timing');
assert.equal(timing.hitFrame,8,'Original HitFrame metadata lost');
assert.equal(timing.returnFrame,11,'Original ReturnFrame metadata lost');
assert(timing.windupFrame<=5,'Windup should not play the recoil-like middle frames');
assert(timing.holdFrame>=12&&timing.holdFrame!==timing.hitFrame,'Sustained emission must not freeze Hurt-like HitFrame 8');
const visualFrameAt=(seconds)=>{let clock=(seconds*60)%sheet.dur.reduce((a,b)=>a+b,0);
 for(let i=0;i<sheet.frames;i++){if(clock<sheet.dur[i])return i;clock-=sheet.dur[i];}return 0};
assert.equal(visualFrameAt(timing.hold),timing.holdFrame,'Held clock must display intended forward-emission frame');
assert.equal(visualFrameAt(api.flameClock(timing.windup+.025,timing)),timing.holdFrame,'Post-windup clock must skip Hurt-like recoil section');
assert(visualFrameAt(api.flameClock(timing.windup-.02,timing))<=timing.windupFrame,'Early windup must stay in preparation frames');
api.activate(1);
assert.equal(api.actionOf(charizard),'Shoot','Channel must use Shoot');
api.state().specialEffects.find(m=>m.type==='flamethrower').age=timing.hold+1.5;
const heldClock=api.spriteClock(charizard);
assert(Math.abs(heldClock-timing.hold)<1e-8,'Long flame channel must hold a stable pose');
api.state().specialEffects.find(m=>m.type==='flamethrower').age=timing.hold+3.5;
assert.equal(api.spriteClock(charizard),heldClock,'Shoot animation must not loop on hold');
api.stopFlame();
assert(charizard.flameRecovery,'Pointerup must start recovery without a one-frame flash');
assert.equal(api.actionOf(charizard),'Shoot','Release must remain in Shoot until recovery finishes');
api.advance(.016);
assert(charizard.flameRecovery,'Releasing flame must start recovery frames');
const releaseClock=api.spriteClock(charizard);
assert(releaseClock>=heldClock,'Release must move forward from held frame');
for(let i=0;i<40;i++)api.advance(.035);
assert.equal(charizard.flameRecovery,null,'Flamethrower recovery must finish');
assert.notEqual(api.actionOf(charizard),'Shoot','Caster must leave sustained Shoot pose');

// Assert every port has a distinct, frame-addressable pixel position and that
// game-space conversion uses the CURRENT rendered Shoot frame.
for(const id of ['0026','0006','0009','0003']){
 api.tuneSourceSheet(id);
 const avatar={id,kind:['0026','0006','0009','0003'].indexOf(id),x:400,y:400,face:0,animT:0,action:'Shoot'};
 const atlas=api.atlas()[id],names=Object.keys(atlas.ports);
 for(const name of names){
  const port=atlas.ports[name];
  for(let d=0;d<8;d++){
   const angles=[Math.PI/2,Math.PI/4,0,-Math.PI/4,-Math.PI/2,-3*Math.PI/4,Math.PI,3*Math.PI/4];
   for(let frame=0;frame<port.frames[d].length;frame++){
    const clock=(frame*4+.25)/60;
    const points=api.anchorPoints(avatar,id==='0026'?'thunderbolt':id==='0006'?'flamethrower':id==='0009'?'surf':'energyball',
      {action:'Shoot',clock,angle:angles[d]});
    const point=points.find(p=>p.port===name);
    assert(point,'Missing body part landmark '+name);
    assert.equal(point.frame,frame,'Incorrect source animation frame');
    assert.equal(point.exact,true,'Per-frame atlas not applied');
    assert.equal(point.cell.x,port.frames[d][frame][0],'Incorrect frame-local X landmark');
    assert.equal(point.cell.y,port.frames[d][frame][1],'Incorrect frame-local Y landmark');
   }
  }
  const first=port.frames[2][0],last=port.frames[2][port.frames[2].length-1];
  assert(first[0]!==last[0]||first[1]!==last[1],id+' emitter does not follow animation');
 }
}

const pmdAngles=[Math.PI/2,Math.PI/4,0,-Math.PI/4,-Math.PI/2,-3*Math.PI/4,Math.PI,3*Math.PI/4];
for(let direction=0;direction<8;direction++)assert.equal(api.direction(pmdAngles[direction]),direction,'PMD row is mapped to the wrong angle');
assert(!html.includes('let didExtra=false;'), 'AI legacy move block still enabled');
assert.equal(api.signature('electric'),'Shoot');
assert.equal(api.signature('fire'),'Shoot');
assert.equal(api.signature('water'),'Shoot');
assert.equal(api.signature('grass'),'Shoot');
console.log('PASS: 4 Pokemon, 192 motion cells, 8-way sprite-local emitter anchors, sustained Shoot, Raichu body, Blastoise cannons, mouth attacks, Flamethrower hold');
