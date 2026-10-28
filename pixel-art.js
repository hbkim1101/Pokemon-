/* Editable move sprites shared by the pixel editor, studio and battle. */
(function(root){
'use strict';
const KEY='pokemon-arena-pixel-art-v1';
const syncChannel=typeof root.BroadcastChannel==='function'?new root.BroadcastChannel(KEY):null;
const COLORS={
 grass4:['#315a29','#52a539','#94d64a','#d6ef84'],grass5:['#315a29','#52a539','#94d64a','#d6ef84','#f7ffce'],
 fire4:['#9c2921','#e74921','#ff8429','#ffce52'],fire5:['#9c2921','#e74921','#ff8429','#ffce52','#fff7bd'],
 water4:['#294a9c','#427be7','#73bdff','#ffffff'],water5:['#294a9c','#427be7','#73bdff','#c6efff','#ffffff'],
 electric4:['#b7b02e','#dfe54b','#ffffff','#f1ff86'],electric5:root.ThunderboltArt?.palette||['#d49a1b','#f1c52b','#ffe652','#fff4ad','#ffffff'],
 normal4:['#70451b','#bb6b1d','#f0a827','#fff2ae'],normal5:['#70451b','#bb6b1d','#f0a827','#ffd84c','#fff2ae'],
 rock5:['#433b32','#73624d','#a18c68','#c9b58b','#efe0b6'],
 bite5:['#241d2d','#603344','#a64d48','#e69b55','#fff0c6']
};
const specs=[
 {id:'thunderbolt',name:'10만볼트',mon:'피카츄',element:'electric',kind:'thunder',mode:'ribbon',attackClass:'technique',colors:COLORS.electric5},
 {id:'flamethrower',name:'화염방사',mon:'리자몽',element:'fire',kind:'flame',mode:'ribbon',attackClass:'technique',colors:COLORS.fire5},
 {id:'surf',name:'파도타기',mon:'거북왕',element:'water',kind:'ride',mode:'ground',attackClass:'technique',colors:COLORS.water5},
 {id:'energyball',name:'에너지볼',mon:'이상해꽃',element:'grass',kind:'orb',mode:'heading',attackClass:'technique',colors:COLORS.grass5},
 {id:'leaf',name:'나뭇잎',mon:'이상해꽃',element:'grass',kind:'projectile',mode:'heading',attackClass:'basic',colors:COLORS.grass4},
 {id:'ember',name:'불꽃세례',mon:'리자몽',element:'fire',kind:'projectile',mode:'heading',attackClass:'basic',colors:COLORS.fire4},
 {id:'thundershock',name:'전기쇼크',mon:'피카츄',element:'electric',kind:'projectile',mode:'heading',attackClass:'basic',colors:COLORS.electric4},
 {id:'watergun',name:'물대포',mon:'거북왕',element:'water',kind:'projectile',mode:'heading',attackClass:'basic',colors:COLORS.water4},
 {id:'tackle',name:'몸통박치기',mon:'피카츄',element:'normal',kind:'tackle',mode:'heading',attackClass:'basic',colors:COLORS.normal4},
 {id:'quickattack',name:'전광석화',mon:'피카츄',element:'normal',kind:'dash',mode:'heading',attackClass:'technique',colors:COLORS.normal5},
 {id:'rockthrow',name:'돌떨구기',mon:'암멍이',element:'rock',kind:'rock',mode:'heading',attackClass:'technique',colors:COLORS.rock5},
 {id:'bite',name:'물기',mon:'암멍이',element:'dark',kind:'bite',mode:'heading',attackClass:'technique',colors:COLORS.bite5}
];
const byId=Object.fromEntries(specs.map(s=>[s.id,s]));
const colorPattern=/^#[0-9a-f]{6}([0-9a-f]{2})?$/i;
function decode(runs,size,paletteSize){
 if(!Array.isArray(runs)||runs.length%2||runs.length>size*2)throw Error('프레임 데이터가 올바르지 않습니다.');
 const pixels=new Uint8Array(size);let offset=0;
 for(let i=0;i<runs.length;i+=2){
  const value=runs[i],count=runs[i+1];
  if(!Number.isInteger(value)||value<0||value>=paletteSize||!Number.isInteger(count)||count<1||offset+count>size)throw Error('프레임의 색상 또는 크기가 올바르지 않습니다.');
  pixels.fill(value,offset,offset+count);offset+=count;
 }
 if(offset!==size)throw Error('프레임 크기가 맞지 않습니다.');
 return pixels;
}
function encode(pixels){
 const runs=[];let last=pixels[0],count=0;
 for(const value of pixels){if(value===last)count++;else{runs.push(last,count);last=value;count=1;}}
 if(count)runs.push(last,count);return runs;
}
function nearestColorIndex(color,colors){
 const value=parseInt(color.slice(1,7),16),r=value>>16,g=(value>>8)&255,b=value&255;
 let best=0,bestDistance=Infinity;
 for(let i=0;i<colors.length;i++){
  const candidate=parseInt(colors[i].slice(1,7),16),dr=r-(candidate>>16),dg=g-((candidate>>8)&255),db=b-(candidate&255),distance=dr*dr+dg*dg+db*db;
  if(distance<bestDistance){best=i;bestDistance=distance;}
 }
 return best+1;
}
function validate(asset){
 if(!asset||asset.version!==1||typeof asset.id!=='string'||!Object.hasOwn(byId,asset.id))throw Error('지원하지 않는 도트 파일입니다.');
 const {width,height,anchor,palette,frames,fps}=asset;
 if(width!==128||height!==96||!anchor||!Number.isInteger(anchor.x)||!Number.isInteger(anchor.y)||anchor.x<0||anchor.x>=width||anchor.y<0||anchor.y>=height)throw Error('캔버스 또는 발사점이 올바르지 않습니다.');
 if(!Array.isArray(palette)||palette.length<1||palette.length>256||palette[0]!==null||palette.slice(1).some(c=>typeof c!=='string'||!colorPattern.test(c)))throw Error('팔레트가 올바르지 않습니다.');
 if(!Number.isInteger(fps)||fps<1||fps>24||!Array.isArray(frames)||frames.length<1||frames.length>16)throw Error('프레임은 1–16개, 속도는 1–24 FPS여야 합니다.');
 const clean={version:1,id:asset.id,width,height,anchor:{x:anchor.x,y:anchor.y},fps,palette:[...palette],frames:frames.map(frame=>{decode(frame.runs,width*height,palette.length);return {runs:[...frame.runs]};})};
 const colors=byId[clean.id].colors;
 clean.frames=clean.frames.map((frame,frameIndex)=>{const pixels=decode(frame.runs,width*height,palette.length);
  for(let i=0;i<pixels.length;i++)if(pixels[i])pixels[i]=nearestColorIndex(palette[pixels[i]],colors);
  return {runs:encode(pixels)};
 });
 clean.palette=[null,...colors];
 return clean;
}
let saved={},applied=new Set(),cache=new Map();
let remoteReady=false;
function publish(){cache.clear();if(root.dispatchEvent&&typeof root.Event==='function')root.dispatchEvent(new root.Event('arena-pixel-art-change'));}
function load(){
 try{const data=JSON.parse(root.localStorage?.getItem(KEY)||'null'),next={};
  if(data?.version===1&&data.moves)for(const spec of specs)if(data.moves[spec.id]){try{next[spec.id]=validate(data.moves[spec.id]);}catch{}}
  saved=next;applied=new Set(Array.isArray(data?.appliedMoves)?data.appliedMoves.filter(id=>Object.hasOwn(byId,id)):[]);cache.clear();
 }catch{saved={};applied=new Set();cache.clear();}
}
load();
root.addEventListener?.('storage',event=>{if(event.key===KEY||event.key===null)load();});
root.addEventListener?.('focus',load);
async function refreshRemote(){
 try{const response=await fetch('/api/pixel-art',{cache:'no-store'});if(!response.ok)throw Error('공용 스프라이트를 읽지 못했습니다.');const data=await response.json();
  if(data.version!==1||!data.moves||typeof data.moves!=='object')throw Error('공용 스프라이트 형식이 올바르지 않습니다.');
  const next={};for(const spec of specs)if(data.moves[spec.id]){try{next[spec.id]=validate(data.moves[spec.id]);}catch{}}
  // Migrate pre-existing same-origin applied work once without replacing newer server data.
  if(!remoteReady){try{const legacy=JSON.parse(root.localStorage?.getItem(KEY)||'null');if(legacy?.version===1&&legacy.moves){const missing={};for(const spec of specs)if(!next[spec.id]&&legacy.moves[spec.id]){try{missing[spec.id]=validate(legacy.moves[spec.id]);}catch{}}
    if(Object.keys(missing).length){const migrated=await fetch('/api/pixel-art/migrate',{method:'POST',headers:{'Content-Type':'application/json','X-Arena-Editor':'1'},body:JSON.stringify({moves:missing})});if(migrated.ok){const result=await migrated.json();for(const spec of specs)if(result.moves?.[spec.id])next[spec.id]=validate(result.moves[spec.id]);}}
  }}catch{}}
  const nextApplied=new Set(Array.isArray(data.appliedMoves)?data.appliedMoves.filter(id=>Object.hasOwn(byId,id)):[]);
  const before=JSON.stringify({moves:saved,appliedMoves:[...applied]});saved=next;applied=nextApplied;remoteReady=true;
  if(before!==JSON.stringify({moves:saved,appliedMoves:[...applied]}))publish();
 }catch(error){if(root.dispatchEvent&&typeof root.CustomEvent==='function')root.dispatchEvent(new root.CustomEvent('arena-pixel-art-sync-error',{detail:error.message}));}
}
refreshRemote();root.addEventListener?.('focus',refreshRemote);root.addEventListener?.('visibilitychange',()=>{if(root.document?.visibilityState==='visible')refreshRemote();});
root.setInterval?.(refreshRemote,3000);
function get(id){return saved[id]?JSON.parse(JSON.stringify(saved[id])):null;}
function persist(next,nextApplied=applied,applyRevision=Date.now()){
 if(!root.localStorage)throw Error('이 브라우저에서는 저장소를 사용할 수 없습니다. JSON으로 내보내 주세요.');
 const active=[...nextApplied].filter(id=>Object.hasOwn(byId,id)&&Object.hasOwn(next,id));
 root.localStorage.setItem(KEY,JSON.stringify({version:1,moves:next,appliedMoves:active,applyRevision}));saved=next;applied=new Set(active);publish();
 syncChannel?.postMessage({type:'updated',revision:applyRevision,appliedMoves:active});
}
async function save(asset){const clean=validate(asset),next={...saved,[clean.id]:clean};
 const response=await fetch('/api/pixel-art/'+encodeURIComponent(clean.id),{method:'PUT',headers:{'Content-Type':'application/json','X-Arena-Editor':'1'},body:JSON.stringify(clean)});
 if(!response.ok){const data=await response.json().catch(()=>({}));throw Error(data.error||'공용 서버에 스프라이트를 저장하지 못했습니다.');}
 const result=await response.json();persist(next,new Set(result.appliedMoves||[...applied,clean.id]));return {...clean,rpgExport:result.rpgExport||null};
}
async function reset(id){const response=await fetch('/api/pixel-art/'+encodeURIComponent(id),{method:'DELETE',headers:{'X-Arena-Editor':'1'}});if(!response.ok)throw Error('공용 서버에서 스프라이트 적용을 해제하지 못했습니다.');const result=await response.json();const next={...saved};delete next[id];persist(next,new Set(result.appliedMoves||[...applied].filter(move=>move!==id)));return result.rpgExport||null;}
function authoredTemplate(id){
 const width=128,height=96,anchor={x:76,y:48},fps=id==='quickattack'?18:15;
 const palette=[null,...byId[id].colors];
 const frames=[];
 const set=(pixels,x,y,color)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<width&&y<height)pixels[y*width+x]=palette.indexOf(color);};
 const line=(pixels,x1,y1,x2,y2,color)=>{const n=Math.max(Math.abs(x2-x1),Math.abs(y2-y1),1);for(let i=0;i<=n;i++){const t=i/n;set(pixels,x1+(x2-x1)*t,y1+(y2-y1)*t,color);}};
 const burst=(pixels,cx,cy,r,colors)=>{for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){const d=Math.abs(x)+Math.abs(y);if(d<=r)set(pixels,cx+x,cy+y,colors[Math.min(colors.length-1,Math.floor(d/2))]);}
  for(const [dx,dy] of [[0,-r-2],[r+2,0],[0,r+2],[-r-2,0],[r-1,-r+1],[-r+1,-r+1],[r-1,r-1],[-r+1,r-1]])line(pixels,cx,cy,cx+dx,cy+dy,colors[0]);};
 for(let f=0;f<10;f++){
  const pixels=new Uint8Array(width*height),u=f/9;
  // The anchor follows the body. Streaks peel away behind it; the impact is
  // spawned by the battle only on physical contact, never as a flying bullet.
  const quick=id==='quickattack',shift=f%3*3;
  for(let i=0;i<(quick?7:5);i++){
   const side=i-(quick?3:2),yy=48+side*(quick?3:4);
   const head=76-13-Math.abs(side)*2-shift;
   const tail=head-(quick?22:12)-(i%3)*3;
   line(pixels,tail,yy,head,yy,palette[quick?4:4]);
   line(pixels,tail+3,yy+1,head-4,yy+1,palette[quick?3:3]);
   if((f+i)%2===0)set(pixels,tail-3,yy,palette[2]);
  }
  const nose=88+(f%2),edge=palette[palette.length-1];
  line(pixels,nose-5,37,nose,43,edge);line(pixels,nose,43,nose+2,48,edge);
  line(pixels,nose+2,48,nose,53,edge);line(pixels,nose,53,nose-5,59,edge);
  for(let i=0;i<3;i++){const x=54-i*10-shift,y=61+(i%2)*3;line(pixels,x,y,x+3,y,palette[2]);}
  frames.push({runs:encode(pixels)});
 }
 return validate({version:1,id,width,height,anchor,fps,palette,frames});
}
function rockThrowTemplate(){
 const width=128,height=96,anchor={x:64,y:48},palette=[null,...COLORS.rock5],frames=[];
 // A closed, consistently sized stone throughout flight. Only its facets turn;
 // impact/disintegration belongs to the battle's contact effect, not this loop.
 const rim=[[-14,-4],[-11,-10],[-4,-14],[5,-13],[12,-7],[14,1],[10,10],[3,14],[-6,12],[-13,5]];
 const inside=(x,y)=>{let yes=false;for(let i=0,j=rim.length-1;i<rim.length;j=i++){
  const [xi,yi]=rim[i],[xj,yj]=rim[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)yes=!yes;
 }return yes;};
 const cross=(a,b,x,y)=>(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);
 for(let f=0;f<8;f++){
  const pixels=new Uint8Array(width*height),angle=f*Math.PI/4,center=[Math.round(Math.cos(angle)*2),Math.round(Math.sin(angle)*2)];
  for(let y=-14;y<=14;y++)for(let x=-14;x<=14;x++){
   if(!inside(x+.5,y+.5))continue;
   let color=3;
   for(let i=0;i<rim.length;i++){
    const a=rim[i],b=rim[(i+1)%rim.length];
    if(cross(center,a,x+.5,y+.5)>=0&&cross(a,b,x+.5,y+.5)>=0&&cross(b,center,x+.5,y+.5)>=0){
     const light=-(a[0]+b[0])*.018-(a[1]+b[1])*.033+Math.sin(angle+i*1.7)*.17;
     color=light>.53?5:light>.0?4:light>-.55?3:2;break;
    }
   }
   if(!inside(x-.5,y+.5)||!inside(x+1.5,y+.5)||!inside(x+.5,y-.5)||!inside(x+.5,y+1.5))color=1;
   pixels[(y+anchor.y)*width+x+anchor.x]=color;
  }
  frames.push({runs:encode(pixels)});
 }
 return validate({version:1,id:'rockthrow',width,height,anchor,fps:12,palette,frames});
}
function template(id){
 const spec=byId[id];if(!spec)throw Error('알 수 없는 기술입니다.');
 if(id==='thunderbolt'&&root.ThunderboltArt)return validate(root.ThunderboltArt.template());
 if(root.ArenaPixelPresets?.[id])return validate(root.ArenaPixelPresets[id]);
 if(id==='tackle'||id==='quickattack')return authoredTemplate(id);
 if(id==='rockthrow')return rockThrowTemplate();
 const width=128,height=96,anchor={x:spec.mode==='ribbon'?24:64,y:48},palette=[null],frames=[];
 const old=root.ArenaFX.PIXEL;root.ArenaFX.setPixel(1);
 try{for(let i=0;i<8;i++){
  const m={x:0,y:0,vx:1,vy:0,age:i/16,life:1,element:spec.element,stream:64,path:[{x:0,y:0},{x:64,y:0}]};
  const cells=root.ArenaFX.originalCells(spec.kind,m),pixels=new Uint8Array(width*height);
  for(const [x,y,color] of cells){const px=x+anchor.x,py=y+anchor.y;if(px<0||py<0||px>=width||py>=height)continue;
   let index=palette.indexOf(color);if(index<0){index=palette.length;palette.push(color);}pixels[py*width+px]=index;
  }frames.push({runs:encode(pixels)});
 }}finally{root.ArenaFX.setPixel(old);}
 return validate({version:1,id,width,height,anchor,palette,frames,fps:16});
}
function identify(kind,m){
 if(kind==='projectile')return {electric:'thundershock',fire:'ember',water:'watergun',grass:'leaf'}[m.element];
 if(kind==='dash')return 'quickattack';
 if(kind==='tackle')return 'tackle';
 if(kind==='rock')return 'rockthrow';
 if(kind==='bite')return 'bite';
 if(kind==='impact'&&m.element==='normal')return 'tackle';
 return {thunder:'thunderbolt',flame:'flamethrower',ride:'surf',surf:'surf',orb:'energyball'}[kind];
}
function prepared(asset){
 return asset.frames.map(f=>{
  const pixels=decode(f.runs,asset.width*asset.height,asset.palette.length),columns=new Map();let min=Infinity,max=-Infinity;
  for(let y=0;y<asset.height;y++)for(let x=0;x<asset.width;x++){
   const index=pixels[y*asset.width+x];if(!index)continue;
   const xx=x-asset.anchor.x,yy=y-asset.anchor.y;if(!columns.has(xx))columns.set(xx,[]);columns.get(xx).push([yy,asset.palette[index]]);min=Math.min(min,xx);max=Math.max(max,xx);
  }return {columns,min,max};
 });
}
function renderAsset(asset,kind,m,pixel,frames){
 if(kind==='projectile'&&(m.delay||0)>0)return [];
 const spec=byId[asset.id],age=Math.max(0,(m.age??((m.pulse||0)/8))-(m.windup||0));
 const frame=frames[Math.floor(age*asset.fps)%frames.length],out=new Map();
 const set=(x,y,c)=>out.set(Math.round(x)+','+Math.round(y),c);
 let vx=m.vx??1,vy=m.vy??0,mag=Math.hypot(vx,vy)||1;vx/=mag;vy/=mag;
 const source=kind==='thunder'?(m.source||m.path?.[0]||m):m;
 const cx=Math.round((source.x||0)/pixel),cy=Math.round((source.y||0)/pixel);
 if(spec.mode==='ribbon'){
  const controls=kind==='thunder'?[{x:cx,y:cy},...(m.path||[]).map(p=>({x:p.x/pixel,y:p.y/pixel}))]:[{x:cx,y:cy},{x:cx+vx*(m.renderStream??m.stream??0)/pixel,y:cy+vy*(m.renderStream??m.stream??0)/pixel}];
  const segments=[];let length=0;
  for(let i=1;i<controls.length;i++){const a=controls[i-1],b=controls[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>.00001){segments.push({a,dx,dy,d,from:length});length+=d;}}
  if(!segments.length)return [];
  const pin=kind==='thunder'?12:0,tip=6;
  const stretch=x=>x<0?x:x>64?length+x-64:length<=pin+tip?x*length/64:x<=pin?x:x>=64-tip?length-(64-x):pin+(x-pin)*(length-pin-tip)/(64-pin-tip);
  const inverse=d=>d<0?d:d>length?64+d-length:length<=pin+tip?d/length*64:d<=pin?d:d>=length-tip?64-(length-d):pin+(d-pin)*(64-pin-tip)/(length-pin-tip);
  let segment=0;
  for(let d=Math.floor(stretch(frame.min));d<=Math.ceil(stretch(frame.max));d++){
   const sx=Math.round(inverse(d)),column=frame.columns.get(sx);if(!column)continue;
   while(segment+1<segments.length&&d>segments[segment].from+segments[segment].d)segment++;
   const part=segments[segment],u=(d-part.from)/part.d,x=part.a.x+part.dx*u,y=part.a.y+part.dy*u;
   for(const [side,c] of column)set(x-part.dy/part.d*side,y+part.dx/part.d*side,c);
  }
 }else for(const [x,column] of frame.columns)for(const [y,c] of column){
  if(spec.mode==='screen')set(cx+x,cy+y,c);
  else if(spec.mode==='ground'){
   const lift=4,depth=(y+lift)/.78;
   set(cx+x*vx-depth*vy,cy+(x*vy+depth*vx)*.78-lift,c);
  }else set(cx+x*vx-y*vy,cy+x*vy+y*vx,c);
 }
 return [...out].map(([key,c])=>[...key.split(',').map(Number),c]);
}
function render(kind,m,pixel){
 if(kind==='rideFoam'&&saved.surf)return [];
 const id=identify(kind,m);if(!id||!byId[id])return null;
 const source=saved[id]||root.ArenaPixelPresets?.[id]||template(id);
 if(!cache.has(id)){const asset=validate(source);cache.set(id,{asset,frames:prepared(asset)});}
 const entry=cache.get(id);return renderAsset(entry.asset,kind,m,pixel,entry.frames);
}
root.ArenaPixelArt={KEY,specs,validate,encode,decode,get,has:id=>applied.has(id),save,reset,refresh:refreshRemote,template,render,
 preview:(asset,age=0,angle=0)=>{const clean=validate(asset),spec=byId[clean.id];return renderAsset(clean,spec.kind,{x:0,y:0,vx:Math.cos(angle),vy:Math.sin(angle),age,element:spec.element,stream:64,path:[{x:0,y:0},{x:Math.cos(angle)*64,y:Math.sin(angle)*64}]},1,prepared(clean));}
};
})(typeof window==='undefined'?globalThis:window);
