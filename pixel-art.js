/* Editable move sprites shared by the pixel editor, studio and battle. */
(function(root){
'use strict';
const KEY='pokemon-arena-pixel-art-v1';
const specs=[
 {id:'thunderbolt',name:'10만볼트',mon:'라이츄',element:'electric',kind:'thunder',mode:'ribbon'},
 {id:'flamethrower',name:'화염방사',mon:'리자몽',element:'fire',kind:'flame',mode:'ribbon'},
 {id:'surf',name:'파도타기',mon:'거북왕',element:'water',kind:'ride',mode:'ground'},
 {id:'energyball',name:'에너지볼',mon:'이상해꽃',element:'grass',kind:'orb',mode:'heading'},
 {id:'leaf',name:'나뭇잎',mon:'이상해꽃',element:'grass',kind:'projectile',mode:'heading'},
 {id:'ember',name:'불꽃세례',mon:'리자몽',element:'fire',kind:'projectile',mode:'screen'},
 {id:'thundershock',name:'전기쇼크',mon:'라이츄',element:'electric',kind:'projectile',mode:'screen'},
 {id:'watergun',name:'물대포',mon:'거북왕',element:'water',kind:'projectile',mode:'heading'}
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
function validate(asset){
 if(!asset||asset.version!==1||typeof asset.id!=='string'||!Object.hasOwn(byId,asset.id))throw Error('지원하지 않는 도트 파일입니다.');
 const {width,height,anchor,palette,frames,fps}=asset;
 if(width!==128||height!==96||!anchor||!Number.isInteger(anchor.x)||!Number.isInteger(anchor.y)||anchor.x<0||anchor.x>=width||anchor.y<0||anchor.y>=height)throw Error('캔버스 또는 발사점이 올바르지 않습니다.');
 if(!Array.isArray(palette)||palette.length<2||palette.length>256||palette[0]!==null||palette.slice(1).some(c=>typeof c!=='string'||!colorPattern.test(c)))throw Error('팔레트가 올바르지 않습니다.');
 if(!Number.isInteger(fps)||fps<1||fps>24||!Array.isArray(frames)||frames.length<1||frames.length>16)throw Error('프레임은 1–16개, 속도는 1–24 FPS여야 합니다.');
 const clean={version:1,id:asset.id,width,height,anchor:{x:anchor.x,y:anchor.y},fps,palette:[...palette],frames:frames.map(frame=>{decode(frame.runs,width*height,palette.length);return {runs:[...frame.runs]};})};
 return clean;
}
let saved={},cache=new Map();
function load(){
 try{const data=JSON.parse(root.localStorage?.getItem(KEY)||'null'),next={};
  if(data?.version===1&&data.moves)for(const spec of specs)if(data.moves[spec.id]){try{next[spec.id]=validate(data.moves[spec.id]);}catch{}}
  saved=next;cache.clear();
 }catch{saved={};cache.clear();}
}
load();
root.addEventListener?.('storage',event=>{if(event.key===KEY||event.key===null)load();});
root.addEventListener?.('focus',load);
function get(id){return saved[id]?JSON.parse(JSON.stringify(saved[id])):null;}
function persist(next){
 if(!root.localStorage)throw Error('이 브라우저에서는 저장소를 사용할 수 없습니다. JSON으로 내보내 주세요.');
 root.localStorage.setItem(KEY,JSON.stringify({version:1,moves:next}));saved=next;cache.clear();
}
function save(asset){const clean=validate(asset);persist({...saved,[clean.id]:clean});return clean;}
function reset(id){const next={...saved};delete next[id];persist(next);}
function template(id){
 const spec=byId[id];if(!spec)throw Error('알 수 없는 기술입니다.');
 if(root.ArenaPixelPresets?.[id])return validate(root.ArenaPixelPresets[id]);
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
   set(cx+x*vx-depth*vy,cy+(x*vy+depth*vx)*.78-lift);
  }else set(cx+x*vx-y*vy,cy+x*vy+y*vx,c);
 }
 return [...out].map(([key,c])=>[...key.split(',').map(Number),c]);
}
function render(kind,m,pixel){
 if(kind==='rideFoam'&&saved.surf)return [];
 const id=identify(kind,m),asset=saved[id]||root.ArenaPixelPresets?.[id];if(!asset)return null;
 if(!cache.has(id))cache.set(id,prepared(asset));return renderAsset(asset,kind,m,pixel,cache.get(id));
}
root.ArenaPixelArt={KEY,specs,validate,encode,decode,get,has:id=>Object.hasOwn(saved,id),save,reset,template,render,
 preview:(asset,age=0,angle=0)=>{const spec=byId[asset.id];return renderAsset(asset,spec.kind,{x:0,y:0,vx:Math.cos(angle),vy:Math.sin(angle),age,element:spec.element,stream:64,path:[{x:0,y:0},{x:Math.cos(angle)*64,y:Math.sin(angle)*64}]},1,prepared(asset));}
};
})(typeof window==='undefined'?globalThis:window);
