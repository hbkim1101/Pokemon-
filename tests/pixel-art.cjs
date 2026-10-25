'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),data=new Map();
function environment(presets=false){
 const events={},context={Uint8Array,Map,Math,JSON,Object,Error,Number,Array,Infinity,localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},addEventListener:(name,fn)=>events[name]=fn};
 context.window=context;vm.createContext(context);for(const file of [...(presets?['pixel-presets.js']:[]),'pixel-art.js','combat-fx.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);return {art:context.ArenaPixelArt,fx:context.ArenaFX,events};
}
const {art,fx,events}=environment();
for(const spec of art.specs){
 const asset=art.template(spec.id);assert.equal(asset.frames.length,8);assert.equal(asset.width,128);assert.equal(asset.height,96);
 assert.deepEqual(JSON.parse(JSON.stringify(art.validate(asset))),JSON.parse(JSON.stringify(asset)));
 for(const f of asset.frames)assert.deepEqual(Array.from(art.encode(art.decode(f.runs,128*96,asset.palette.length))),Array.from(f.runs));
}
let asset=art.template('watergun');asset.palette.push('#ff00ff80');const value=asset.palette.length-1;
for(const frame of asset.frames){const pixels=new Uint8Array(128*96);pixels[asset.anchor.y*128+asset.anchor.x+3]=value;frame.runs=art.encode(pixels);}
art.save(asset);
for(const scale of [1,1.43,4.2]){
 fx.setPixel(scale);
 const pixels=fx.cells('projectile',{element:'water',x:10*scale,y:20*scale,vx:0,vy:1,age:.2});
 assert.equal(JSON.stringify(pixels),JSON.stringify([[10,23,'#ff00ff80']]));
 assert.equal(fx.cells('projectile',{element:'water',x:0,y:0,vx:1,vy:0,delay:.1}).length,0);
 assert(fx.originalCells('projectile',{element:'water',x:0,y:0,vx:1,vy:0}).length>1,'Original art must remain available');
}
const tab=environment();assert.equal(tab.art.get('watergun').palette.at(-1),'#ff00ff80','Applied art must survive reload');
art.reset('watergun');tab.events.storage({key:art.KEY});assert.equal(tab.art.get('watergun'),null,'Other open tabs must see reset');
asset=art.template('flamethrower');asset.frames.forEach(f=>f.runs=[0,128*96]);art.save(asset);
assert.equal(fx.cells('flame',{x:0,y:0,vx:1,vy:0,age:.2,stream:200}).length,0,'A deliberately empty frame must not fall back to original art');
for(const id of ['thunderbolt','flamethrower','surf','energyball']){
 asset=art.template(id);art.save(asset);
 for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI]){
  const spec=art.specs.find(s=>s.id===id),m={x:0,y:0,vx:Math.cos(angle),vy:Math.sin(angle),age:.3,stream:300,path:[{x:0,y:0},{x:120,y:30},{x:200,y:70}]};
  const cells=fx.cells(spec.kind,m);assert(cells.length>0);assert(cells.every(c=>Number.isInteger(c[0])&&Number.isInteger(c[1])));
 }
}
asset=art.template('watergun');
for(const mutate of [a=>a.id='__proto__',a=>a.width=999999,a=>a.frames[0].runs=[1,999999],a=>a.palette[1]='url(bad)',a=>a.fps=0,a=>a.frames[0].runs=[999,128*96]]){
 const bad=JSON.parse(JSON.stringify(asset));mutate(bad);assert.throws(()=>art.validate(bad));
}
console.log('PASS: eight editable templates, RLE/import validation, alpha, scale/direction, blank frames, persistence and live-tab updates');
data.clear();
const completed=environment(true);
for(const id of ['ember','thundershock','watergun']){
 const doc=completed.art.template(id),draft=JSON.parse(fs.readFileSync(path.join(root,'assets/pixel-moves/user-drafts',id+'.json'),'utf8'));
 assert.deepEqual(JSON.parse(JSON.stringify(doc.frames[0])),draft.frames[0],'Preserve the user-authored key frame');
 assert(doc.frames.length>=8);assert(new Set(doc.frames.map(f=>JSON.stringify(f))).size>=4);
 const spec=completed.art.specs.find(s=>s.id===id);
 for(let frame=0;frame<doc.frames.length;frame++)for(let direction=0;direction<8;direction++){
  const angle=direction*Math.PI/4;
  const cells=completed.fx.cells('projectile',{element:spec.element,x:0,y:0,vx:Math.cos(angle),vy:Math.sin(angle),age:frame/doc.fps});
  assert(cells.length>0,'No blank animation beats');assert(cells.every(([x,y])=>Number.isInteger(x)&&Number.isInteger(y)));
 }
 const blank=JSON.parse(JSON.stringify(doc));blank.frames.forEach(f=>f.runs=[0,128*96]);completed.art.save(blank);
 assert.equal(completed.fx.cells('projectile',{element:spec.element}).length,0,'User edits override bundled defaults');
 completed.art.reset(id);assert(completed.fx.cells('projectile',{element:spec.element}).length>0,'Reset returns the finished default');
}
for(const page of ['index.html','studio.html','pixel-editor.html']){
 const text=fs.readFileSync(path.join(root,page),'utf8');
 assert(text.indexOf('pixel-presets.js?v=50')>=0&&text.indexOf('pixel-presets.js?v=50')<text.indexOf('pixel-art.js?v=50'));
}
console.log('PASS: user keyframes preserved, finished loops, 8 directions, bundled defaults and custom override/reset');
