'use strict';
// Dependency-free regression tests for Pokemon Arena v23.
// Run from the repository root: node tests/smoke.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const addon = fs.readFileSync(path.join(root, 'battle-studio.js'), 'utf8');
const main = html.split('<script>')[1]?.split('</script>')[0];
assert(main, 'Missing main JavaScript');
assert(html.includes('battle-studio.js?v=23'), 'Motion Studio not linked');

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
  ' signature:(type)=>signatureAnimation(type),',
  ' actionOf:(actor)=>combatAnimation(actor),',
  ' state:()=>({gameState,player,enemies,specialEffects,extras:EXTRA_SKILLS_ENABLED}),',
  ' injectSheets:()=>{for(const actor of roster){const anims={};for(const key of ACTIONS){anims[key]={image:{width:240,height:448},w:60,h:56,frames:4,dirs:8,dur:[8,8,8,8]}}sprites[actor.id]={anims,variant:"mock",loaded:true}}}',
  '};'
].join('\n');
vm.runInNewContext(main+'\n'+addon+'\n'+exposed, sandbox, {timeout:20000,filename:'arena+studio.js'});
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
    assert.equal(api.studio.getState().action,action==='dash'?'Attack':action==='basic'?'Shoot':k===2?'Attack':'Shoot', 'Studio action role mismatch');
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
  api.activate(0);
  assert.equal(api.state().player.action,'Shoot','Basic ranged move should use Shoot');
  api.activate(1);
  assert(api.state().specialEffects.length>0,'Signature move did not cast');
  assert.equal(api.state().player.action,k===2?'Attack':'Shoot','Signature move action role mismatch');
  assert.equal(api.actionOf(api.state().player),k===2?'Attack':'Shoot','Rendered signature motion mismatched');
  api.activate(2);
  assert.equal(api.state().player.action,'Attack','Dash must use Attack instead of Walk');
  assert.equal(api.actionOf(api.state().player),'Attack','Rendered dash must use Attack');
  api.state().player.inv=0;
  api.hurtPlayer(1);
  assert.equal(api.actionOf(api.state().player),'Hurt','Hit must show Hurt animation');
  api.advance(.035);
  for(let tick=0;tick<8;tick++)api.advance(.035);
  assert.equal(api.state().player.hurt,0,'Player Hurt animation must expire');
  api.advance(0.016);
  api.draw();
}
const pmdAngles=[Math.PI/2,Math.PI/4,0,-Math.PI/4,-Math.PI/2,-3*Math.PI/4,Math.PI,3*Math.PI/4];
for(let direction=0;direction<8;direction++)assert.equal(api.direction(pmdAngles[direction]),direction,'PMD row is mapped to the wrong angle');
assert(!html.includes('let didExtra=false;'), 'AI legacy move block still enabled');
assert.equal(api.signature('electric'),'Shoot');
assert.equal(api.signature('fire'),'Shoot');
assert.equal(api.signature('water'),'Attack');
assert.equal(api.signature('grass'),'Shoot');
console.log('PASS: 4 Pokemon, 8 directions, 6 animations (192 cells), ranged Shoot / lunge Attack / Charge, dash & signature rendering');
