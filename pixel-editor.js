(function(){
'use strict';
const Art=window.ArenaPixelArt,$=id=>document.getElementById(id),board=$('board'),ctx=board.getContext('2d');
const DRAFT='pokemon-arena-pixel-draft-v1:',W=128,H=96;
const STALE_THUNDERSHOCK_PALETTE=['#d49a1b','#f1c52b','#ffe652','#fff4ad'];
function draftKey(id){return (id==='thunderbolt'?'pokemon-arena-pixel-draft-v4:':id==='tackle'||id==='quickattack'?'pokemon-arena-pixel-draft-v2:':DRAFT)+id;}
let doc,frame=0,tool='pencil',zoom=5,color='#ffffff',alpha=100,playing=true,space=false,drag=null,lastPoint=null;
let undo=[],redo=[],draftTimer,autoApplyTimer,changed=false,previewDirty=true,lastPreview=-1,playStarted=performance.now();
let autoApplying=false;const pendingAutoApply=new Map(),moveRevisions=new Map(),autoApplyDelay=700;
let exactColor=null;
let rushPreviewData=null;
const thunderSprite=new Image();thunderSprite.onload=()=>{previewDirty=true;};
thunderSprite.src='/rpg-maker-xp/projects/MyPokemonGame/Graphics/Arena/0025/Shoot.png';
const rushSprite=new Image();
rushSprite.onload=()=>{previewDirty=true;};
rushSprite.src='/rpg-maker-xp/projects/MyPokemonGame/Graphics/Arena/0025/Attack.png';
fetch('/rpg-maker-xp/projects/MyPokemonGame/Plugins/Lappet%20Opening/arena-action.json',{cache:'no-store'})
 .then(r=>r.json()).then(data=>{rushPreviewData=data;previewDirty=true;}).catch(()=>{});
const originals=new Map();
function message(text){$('status').textContent=text;}
function original(id){if(!originals.has(id))originals.set(id,Art.template(id));return originals.get(id);}
function unpack(asset){const a=Art.validate(asset);return {...a,frames:a.frames.map(f=>Art.decode(f.runs,W*H,a.palette.length))};}
function pack(){return {...doc,frames:doc.frames.map(pixels=>({runs:Art.encode(pixels)}))};}
function draftSave(){
 clearTimeout(draftTimer);if(!doc)return;
 try{localStorage.setItem(draftKey(doc.id),JSON.stringify(pack()));if(changed)$('saveState').textContent=pendingAutoApply.has(doc.id)||autoApplying?'자동 반영 대기 · RPG 파일 갱신 중':'자동 반영 대기 · 잠시 후 RPG에도 적용';}
 catch{message('초안 저장 공간이 부족합니다. JSON 작업 파일로 내보내 주세요.');}
}
function checkpoint(){undo.push({asset:pack(),frame});if(undo.length>40)undo.shift();redo=[];}
function queueAutoApply(asset,delay=autoApplyDelay){
 const revision=(moveRevisions.get(asset.id)||0)+1;moveRevisions.set(asset.id,revision);
 pendingAutoApply.set(asset.id,{asset:JSON.parse(JSON.stringify(asset)),revision});
 clearTimeout(autoApplyTimer);autoApplyTimer=setTimeout(flushAutoApply,delay);
 if(doc?.id===asset.id)$('saveState').textContent='자동 반영 대기 · 잠시 후 RPG에도 적용';
}
async function flushAutoApply(){
 clearTimeout(autoApplyTimer);if(autoApplying||!pendingAutoApply.size)return;
 autoApplying=true;if(doc&&pendingAutoApply.has(doc.id))render();
 try{
  while(pendingAutoApply.size){
   const [id,entry]=pendingAutoApply.entries().next().value;pendingAutoApply.delete(id);
   try{
    const result=await Art.save(entry.asset),latest=moveRevisions.get(id)===entry.revision;
    if(latest)lastApplyStatus.set(id,result.rpgExport?.ok?'RPG 파일 자동 반영 완료':'배틀에는 저장됨 · RPG 파일 내보내기 실패: '+(result.rpgExport?.error||'알 수 없는 오류'));
    if(doc?.id===id&&latest){changed=JSON.stringify(pack())!==JSON.stringify(Art.get(id)||original(id));draftSave();render();}
    if(latest)message(result.rpgExport?.ok?Art.specs.find(spec=>spec.id===id).name+' 이펙트를 RPG 파일까지 자동 반영했습니다.':'배틀 공용 파일은 저장했지만 RPG 파일 갱신에 실패했습니다. '+(result.rpgExport?.error||''));
   }catch(error){
    if(moveRevisions.get(id)===entry.revision){lastApplyStatus.set(id,'자동 반영 실패 · '+error.message);if(doc?.id===id){changed=true;render();message('자동 반영에 실패했습니다. 서버 연결을 확인한 뒤 상단 버튼으로 다시 적용하세요. '+error.message);}}
   }
  }
 }finally{autoApplying=false;if(pendingAutoApply.size)autoApplyTimer=setTimeout(flushAutoApply,0);}
}
const lastApplyStatus=new Map();
function edited(){changed=true;previewDirty=true;clearTimeout(draftTimer);draftTimer=setTimeout(draftSave,350);queueAutoApply(pack());render();}
function loadMove(id,provided){
 if(doc)draftSave();let asset=provided;
 if(!asset){try{const raw=localStorage.getItem(draftKey(id));if(raw){const savedDraft=JSON.parse(raw);
  const staleThunderShock=id==='thundershock'&&savedDraft.frames?.length===4&&
   JSON.stringify(savedDraft.palette?.slice(1).map(color=>color.toLowerCase()))===JSON.stringify(STALE_THUNDERSHOCK_PALETTE);
  if(staleThunderShock){const restored=Art.get(id)||original(id);if(restored.frames.length===8){asset=restored;localStorage.setItem(draftKey(id),JSON.stringify(restored));}}
  if(!asset){asset=Art.validate(savedDraft);if(asset.id!==id)asset=null;}
 }}catch{}}
 asset=asset||Art.get(id)||original(id);doc=unpack(asset);setColor(color);frame=0;undo=[];redo=[];changed=JSON.stringify(pack())!==JSON.stringify(Art.get(id)||original(id));previewDirty=true;
 $('fps').value=doc.fps;render();if(changed)queueAutoApply(pack());message('도트를 수정하면 잠시 후 배틀과 RPG 프로젝트에 자동 반영됩니다.');
}

function renderMoves(){
 $('moves').replaceChildren();
 const tones={electric:'#ffe27b',fire:'#ff9b70',water:'#86d9ff',grass:'#abe681',normal:'#f0d5a1',rock:'#c9b58b',dark:'#d5a7c2'};
 for(const spec of Art.specs){const b=document.createElement('button');b.className='move'+(spec.id===doc.id?' selected':'');b.setAttribute('aria-pressed',String(spec.id===doc.id));b.dataset.move=spec.id;
  const strong=document.createElement('strong'),dot=document.createElement('span');dot.className='dot';dot.style.background=tones[spec.element];strong.append(dot,document.createTextNode(spec.name));
  const small=document.createElement('small'),saved=Art.get(spec.id);small.textContent=`${spec.mon} · ${spec.attackClass==='basic'?'기본 4색':'기술 5색'}${Art.has(spec.id)?' · 적용됨':saved?' · 저장됨 · 적용 대기':''}`;b.append(strong,small);b.onclick=()=>loadMove(spec.id);$('moves').append(b);
 }
}
function paintFrame(target,pixels,scale=1,opacity=1){
 target.save();target.globalAlpha=opacity;
 for(let i=0;i<pixels.length;i++)if(pixels[i]){target.fillStyle=doc.palette[pixels[i]];target.fillRect(i%W*scale,Math.floor(i/W)*scale,scale,scale);}
 target.restore();
}
function renderBoard(){
 board.width=W*zoom;board.height=H*zoom;
 for(let y=0;y<H;y+=8)for(let x=0;x<W;x+=8){ctx.fillStyle=(x/8+y/8)%2?'#253440':'#1b2730';ctx.fillRect(x*zoom,y*zoom,8*zoom,8*zoom);}
 if($('onion').checked&&doc.frames.length>1)paintFrame(ctx,doc.frames[(frame+doc.frames.length-1)%doc.frames.length],zoom,.2);
 paintFrame(ctx,doc.frames[frame],zoom);
 if($('grid').checked&&zoom>=4){ctx.fillStyle='#9bb8c017';for(let x=0;x<=W;x++)ctx.fillRect(x*zoom,0,1,H*zoom);for(let y=0;y<=H;y++)ctx.fillRect(0,y*zoom,W*zoom,1);}
 if($('origin').checked){const x=(doc.anchor.x+.5)*zoom,y=(doc.anchor.y+.5)*zoom;ctx.fillStyle='#eaf38baa';ctx.fillRect(x-zoom*2,y,zoom*4,1);ctx.fillRect(x,y-zoom*2,1,zoom*4);}
 $('pixelCount').textContent=doc.frames[frame].reduce((n,p)=>n+(p?1:0),0)+' pixels';
}
function renderFrames(){
 $('frames').replaceChildren();
 doc.frames.forEach((pixels,i)=>{const b=document.createElement('button');b.className='frame'+(frame===i?' selected':'');b.setAttribute('aria-label','프레임 '+(i+1));b.setAttribute('aria-pressed',String(frame===i));const c=document.createElement('canvas');c.width=W;c.height=H;paintFrame(c.getContext('2d'),pixels);const n=document.createElement('small');n.textContent=String(i+1).padStart(2,'0');b.append(c,n);b.onclick=()=>{frame=i;previewDirty=true;render();};$('frames').append(b);});
 $('frameLabel').textContent='FRAME '+String(frame+1).padStart(2,'0')+' / '+String(doc.frames.length).padStart(2,'0');
 $('deleteFrame').disabled=doc.frames.length===1;$('copyFrame').disabled=doc.frames.length>=16;
}
function selectedColor(){return exactColor||color+(alpha<100?Math.round(alpha/100*255).toString(16).padStart(2,'0'):'');}
function setColor(value){
 const available=doc?.palette?.slice(1)||[];let picked=value.slice(0,7).toLowerCase();
 if(available.length&&!available.includes(picked)){
  const rgb=parseInt(picked.slice(1),16),r=rgb>>16,g=(rgb>>8)&255,b=rgb&255;
  picked=available.reduce((best,c)=>{const n=parseInt(c.slice(1),16),dr=r-(n>>16),dg=g-((n>>8)&255),db=b-(n&255);return dr*dr+dg*dg+db*db < best.distance?{color:c,distance:dr*dr+dg*dg+db*db}:best;},{color:available[0],distance:Infinity}).color;
 }
 exactColor=picked;color=picked;alpha=100;
 $('color').value=color;$('hex').value=color;$('alpha').value=100;$('alphaValue').textContent='100%';renderPalette();
}
function renderPalette(){
 $('palette').replaceChildren();
 doc.palette.slice(1).forEach((c,i)=>{const b=document.createElement('button');b.className='swatch'+(c.toLowerCase()===selectedColor().toLowerCase()?' selected':'');b.style.background=c;b.title=c+(i<9?' · '+(i+1):'');b.setAttribute('aria-label','색상 '+c);b.onclick=()=>setColor(c);$('palette').append(b);});
 const selected=doc.palette.findIndex(c=>c?.toLowerCase()===selectedColor().toLowerCase());
 $('addColor').disabled=true;$('deleteColor').disabled=true;
 const spec=Art.specs.find(s=>s.id===doc.id);$('paletteCount').textContent=`${spec.colors.length}색 고정 팔레트 · 투명 배경 제외`;
}
$('addColor').onclick=()=>{
 const c=selectedColor().toLowerCase();if(doc.palette.includes(c)||doc.palette.length>=256)return;
 checkpoint();doc.palette.push(c);edited();draftSave();message('선택한 색을 팔레트에 추가했습니다.');
};
$('deleteColor').onclick=()=>{
 const index=doc.palette.findIndex(c=>c?.toLowerCase()===selectedColor().toLowerCase());if(index<1)return;
 checkpoint();let removed=0;
 doc.frames=doc.frames.map(pixels=>pixels.map(v=>{if(v===index){removed++;return 0;}return v>index?v-1:v;}));
 doc.palette.splice(index,1);setColor(doc.palette[Math.min(index,doc.palette.length-1)]||'#ffffff');
 edited();draftSave();message('팔레트 색과 모든 프레임의 해당 도트 '+removed+'개를 삭제했습니다. Ctrl+Z로 복원할 수 있습니다.');
};
function render(){
 const spec=Art.specs.find(s=>s.id===doc.id);$('moveTitle').textContent=spec.name;
 $('saveState').textContent=changed?(lastApplyStatus.get(doc.id)?.startsWith('자동 반영 실패')?lastApplyStatus.get(doc.id):pendingAutoApply.has(doc.id)||autoApplying?'RPG 자동 반영 대기 중…':'편집 내용 저장 중…'):lastApplyStatus.get(doc.id)||(Art.has(doc.id)?'배틀에 적용된 도트':Art.get(doc.id)?'저장된 도트 · 배틀 적용 대기':'원본 도트');
 $('undo').disabled=!undo.length;$('redo').disabled=!redo.length;$('resetApplied').disabled=!Art.has(doc.id);
 renderMoves();renderBoard();renderFrames();renderPalette();
}
function indexForColor(){
 const c=selectedColor().toLowerCase();let index=doc.palette.findIndex(p=>p?.toLowerCase()===c);
 if(index<0){setColor(c);index=doc.palette.findIndex(p=>p?.toLowerCase()===selectedColor().toLowerCase());}
 if(index<1)throw Error('이 기술에 지정된 색상 팔레트에서 골라 주세요.');return index;
}
function point(event){const r=board.getBoundingClientRect();return {x:Math.floor((event.clientX-r.left-1)/zoom),y:Math.floor((event.clientY-r.top-1)/zoom)};}
function inside(p){return p.x>=0&&p.x<W&&p.y>=0&&p.y<H;}
function dab(p,index){const size=Number($('brush').value),start=-Math.floor((size-1)/2);for(let y=start;y<start+size;y++)for(let x=start;x<start+size;x++){const a=p.x+x,b=p.y+y;if(a>=0&&a<W&&b>=0&&b<H)doc.frames[frame][b*W+a]=index;}}
function line(a,b,index){let x=a.x,y=a.y,dx=Math.abs(b.x-x),sx=x<b.x?1:-1,dy=-Math.abs(b.y-y),sy=y<b.y?1:-1,err=dx+dy;for(let n=0;n<2048;n++){dab({x,y},index);if(x===b.x&&y===b.y)break;const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}}}
function flood(p,index){const pixels=doc.frames[frame],old=pixels[p.y*W+p.x];if(old===index)return;const stack=[p.y*W+p.x];pixels[stack[0]]=index;while(stack.length){const i=stack.pop(),x=i%W,y=Math.floor(i/W);for(const n of [x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1])if(n>=0&&pixels[n]===old){pixels[n]=index;stack.push(n);}}}
function chooseTool(name){tool=name;document.querySelectorAll('[data-tool]').forEach(b=>{const selected=b.dataset.tool===name;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});board.style.cursor=name==='move'?'move':name==='picker'?'copy':'crosshair';}
function movement(){
 const indices=$('transformAll').checked?doc.frames.map((_,i)=>i):[frame];
 const bases=indices.map(i=>[i,doc.frames[i].slice()]);let minX=W,maxX=-1,minY=H,maxY=-1;
 for(const [,pixels] of bases)pixels.forEach((v,i)=>{if(v){minX=Math.min(minX,i%W);maxX=Math.max(maxX,i%W);minY=Math.min(minY,Math.floor(i/W));maxY=Math.max(maxY,Math.floor(i/W));}});
 return {bases,minX,maxX,minY,maxY,dx:0,dy:0};
}
function movePixels(state,dx,dy){
 if(state.maxX<0)return;
 state.dx=Math.max(-state.minX,Math.min(W-1-state.maxX,dx));state.dy=Math.max(-state.minY,Math.min(H-1-state.maxY,dy));
 for(const [i,pixels] of state.bases){const next=new Uint8Array(W*H);pixels.forEach((v,j)=>{if(v)next[j+state.dy*W+state.dx]=v;});doc.frames[i]=next;}
 previewDirty=true;renderBoard();
}
function commitMovement(state,cancel=false){
 const updates=state.bases.map(([i])=>[i,doc.frames[i]]);
 for(const [i,pixels] of state.bases)doc.frames[i]=pixels;
 if(!cancel&&(state.dx||state.dy)){checkpoint();for(const [i,pixels] of updates)doc.frames[i]=pixels;edited();draftSave();message('도트를 '+state.dx+', '+state.dy+' px 이동했습니다. 발사점은 유지됩니다.');}
 else{previewDirty=true;render();if(cancel)draftSave();}
}
board.addEventListener('contextmenu',event=>event.preventDefault());
board.addEventListener('pointerdown',event=>{
 if(event.button>2)return;event.preventDefault();board.focus();board.setPointerCapture(event.pointerId);
 if(space||event.button===1){drag={pan:true,x:event.clientX,y:event.clientY,left:$('viewport').scrollLeft,top:$('viewport').scrollTop};return;}
 const p=point(event);if(!inside(p))return;
 if(tool==='picker'||event.altKey){const index=doc.frames[frame][p.y*W+p.x];if(index)setColor(doc.palette[index]);message(index?'색상을 가져왔습니다.':'투명한 픽셀입니다.');return;}
 if(tool==='move'&&event.button===0){drag={move:true,start:p,...movement()};return;}
 if(tool==='replace'&&event.button===0){
  const old=doc.frames[frame][p.y*W+p.x];if(!old){message('색을 바꿀 도트를 클릭하세요. 투명 배경은 유지됩니다.');return;}
  if(doc.palette[old].toLowerCase()===selectedColor().toLowerCase())return;
  try{checkpoint();const replacement=indexForColor(),source=doc.palette[old].toLowerCase();const indices=$('colorAll').checked?doc.frames.map((_,i)=>i):[frame];
   for(const i of indices)doc.frames[i]=doc.frames[i].map(v=>v&&doc.palette[v].toLowerCase()===source?replacement:v);
   edited();draftSave();message('같은 색의 도트를 변경했습니다. 실행 취소할 수 있습니다.');
  }catch(error){message(error.message);}return;
 }
 try{checkpoint();const index=event.button===2||tool==='eraser'?0:indexForColor();
  if(tool==='fill'){flood(p,index);edited();return;}
  drag={index};lastPoint=p;dab(p,index);edited();
 }catch(error){message(error.message);}
});
board.addEventListener('pointermove',event=>{
 const p=point(event);$('coords').textContent=inside(p)?p.x+', '+p.y:'—, —';
 if(!drag)return;
 if(drag.pan){$('viewport').scrollLeft=drag.left-event.clientX+drag.x;$('viewport').scrollTop=drag.top-event.clientY+drag.y;return;}
 if(drag.move){movePixels(drag,p.x-drag.start.x,p.y-drag.start.y);return;}
 if(!inside(p)){lastPoint=null;return;}if(lastPoint)line(lastPoint,p,drag.index);else dab(p,drag.index);lastPoint=p;edited();
});
function finishStroke(){if(drag?.move)commitMovement(drag);else if(drag&&!drag.pan)draftSave();drag=null;lastPoint=null;}
function cancelStroke(){if(drag?.move){commitMovement(drag,true);drag=null;lastPoint=null;}else finishStroke();}
board.addEventListener('pointerup',finishStroke);board.addEventListener('pointercancel',cancelStroke);board.addEventListener('lostpointercapture',finishStroke);
function setZoom(value){
 const view=$('viewport'),x=(view.scrollLeft+view.clientWidth/2-32)/zoom,y=(view.scrollTop+view.clientHeight/2-32)/zoom;
 zoom=Math.min(12,Math.max(2,Number(value)));$('zoom').value=zoom;$('zoomValue').textContent=zoom+'×';renderBoard();view.scrollLeft=x*zoom-view.clientWidth/2+32;view.scrollTop=y*zoom-view.clientHeight/2+32;
}
$('viewport').addEventListener('wheel',event=>{if(event.ctrlKey||event.metaKey)return;event.preventDefault();setZoom(zoom+(event.deltaY<0?1:-1));},{passive:false});
$('zoom').oninput=event=>setZoom(event.target.value);
$('fit').onclick=()=>{const view=$('viewport');setZoom(Math.floor(Math.min((view.clientWidth-64)/W,(view.clientHeight-64)/H)));view.scrollLeft=0;view.scrollTop=0;};
for(const id of ['grid','onion','origin'])$(id).onchange=renderBoard;
 $('color').oninput=event=>setColor(event.target.value);
 $('alpha').oninput=()=>{ $('alpha').value=100;$('alphaValue').textContent='100%'; };
$('hex').onchange=event=>{const c=event.target.value;if(/^#[\da-f]{6}([\da-f]{2})?$/i.test(c))setColor(c);else{event.target.value=selectedColor();message('색상은 #RRGGBB 또는 #RRGGBBAA로 입력하세요.');}};
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>chooseTool(b.dataset.tool));
function history(from,to){if(!from.length)return;to.push({asset:pack(),frame});const entry=from.pop();doc=unpack(entry.asset);frame=Math.min(entry.frame,doc.frames.length-1);$('fps').value=doc.fps;edited();}
$('undo').onclick=()=>history(undo,redo);$('redo').onclick=()=>history(redo,undo);
$('copyFrame').onclick=()=>{if(doc.frames.length>=16)return;checkpoint();doc.frames.splice(frame+1,0,doc.frames[frame].slice());frame++;edited();};
$('deleteFrame').onclick=()=>{if(doc.frames.length<=1)return;checkpoint();doc.frames.splice(frame,1);frame=Math.min(frame,doc.frames.length-1);edited();};
$('clear').onclick=()=>{checkpoint();doc.frames[frame].fill(0);edited();message('프레임을 비웠습니다. 실행 취소로 되돌릴 수 있습니다.');};
function transformFrames(operation){
 try{
  const indices=$('transformAll').checked?doc.frames.map((_,i)=>i):[frame];
  const updates=indices.map(i=>[i,window.ArenaPixelTransform(doc.frames[i],W,H,doc.anchor,operation)]);
  checkpoint();for(const [i,pixels] of updates)doc.frames[i]=pixels;edited();
  message(indices.length+'개 프레임을 변환했습니다. 실행 취소로 되돌릴 수 있습니다.');
 }catch(error){message(error.message);}
}
$('mirror').onclick=()=>transformFrames('horizontal');
$('flipVertical').onclick=()=>transformFrames('vertical');
$('rotateCW').onclick=()=>transformFrames('cw');
$('rotateCCW').onclick=()=>transformFrames('ccw');
$('restoreFrame').onclick=()=>{
 const base=unpack(original(doc.id)),pixels=base.frames[frame%base.frames.length];
 const needed=base.palette.slice(1).filter(c=>!doc.palette.includes(c));
 if(doc.palette.length+needed.length>256){message('원본 팔레트를 추가할 공간이 없습니다. 기존 색상 수를 줄인 작업 파일을 사용해 주세요.');return;}
 checkpoint();doc.palette.push(...needed);const next=new Uint8Array(W*H);
 for(let i=0;i<pixels.length;i++)if(pixels[i])next[i]=doc.palette.indexOf(base.palette[pixels[i]]);
 doc.frames[frame]=next;edited();
};
$('fps').onchange=event=>{const n=Number(event.target.value);if(!Number.isInteger(n)||n<1||n>24){event.target.value=doc.fps;return;}checkpoint();doc.fps=n;edited();};
$('apply').onclick=()=>{if(!doc)return;queueAutoApply(pack(),0);message('현재 기술을 즉시 배틀과 RPG 프로젝트에 반영합니다…');};
$('resetApplied').onclick=async()=>{try{const result=await Art.reset(doc.id);changed=true;render();message(result?.ok?'공용 적용을 해제하고 RPG Maker 이펙트를 기본 스프라이트로 갱신했습니다.':'공용 스프라이트 적용을 해제했습니다. 편집 중인 초안은 남아 있습니다.');}catch(error){message(error.message);}};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('exportJson').onclick=()=>download(new Blob([JSON.stringify(pack())],{type:'application/json'}),'arena-'+doc.id+'.json');
$('importJson').onclick=()=>$('file').click();
$('file').onchange=async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;try{if(file.size>4*1024*1024)throw Error('4MB 이하의 작업 파일을 선택하세요.');const asset=Art.validate(JSON.parse(await file.text()));if(doc.id!==asset.id)loadMove(asset.id);checkpoint();doc=unpack(asset);frame=0;$('fps').value=doc.fps;edited();message('작업 파일을 불러왔습니다. 잠시 후 배틀과 RPG 프로젝트에 자동 반영됩니다.');}catch(error){message('불러오지 못했습니다: '+error.message);}};
$('exportPng').onclick=()=>{
 const c=document.createElement('canvas');c.width=W*doc.frames.length;c.height=H;const g=c.getContext('2d');doc.frames.forEach((pixels,i)=>{g.save();g.translate(i*W,0);paintFrame(g,pixels);g.restore();});c.toBlob(blob=>{if(blob)download(blob,'arena-'+doc.id+'-'+doc.fps+'fps.png');},'image/png');
};
$('play').onclick=()=>{playing=!playing;playStarted=performance.now();previewDirty=true;$('play').textContent=playing?'Ⅱ 일시정지':'▶ 재생';$('play').setAttribute('aria-pressed',String(playing));};
$('direction').onchange=()=>{previewDirty=true;};
let aiCandidate=null,aiBusy=false;
async function checkAI(){
 try{const response=await fetch('/api/ai/status',{cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();
  $('aiStatus').textContent=data.configured?'연결 준비됨 · '+data.model:'API 키 미설정 · 아래 연결 방법을 확인하세요.';
  $('aiRequest').disabled=!data.configured||aiBusy;
 }catch{$('aiStatus').textContent='AI 서버가 꺼져 있습니다. python server.py로 실행하세요.';$('aiRequest').disabled=true;}
}
$('aiRefresh').onclick=checkAI;
function drawComparison(before,after){
 let minX=W,maxX=0,minY=H,maxY=0;
 for(let i=0;i<W*H;i++)if(before[i]||after[i]){minX=Math.min(minX,i%W);maxX=Math.max(maxX,i%W);minY=Math.min(minY,Math.floor(i/W));maxY=Math.max(maxY,Math.floor(i/W));}
 if(minX===W){minX=doc.anchor.x;maxX=minX;minY=doc.anchor.y;maxY=minY;}
 const scale=Math.min(10,Math.floor( Math.min(384/(maxX-minX+7),288/(maxY-minY+7))));
 for(const [id,pixels] of [['aiBefore',before],['aiAfter',after]]){
  const c=$(id),g=c.getContext('2d');g.fillStyle='#132630';g.fillRect(0,0,c.width,c.height);g.imageSmoothingEnabled=false;
  const ox=Math.floor((c.width-(maxX-minX+1)*scale)/2),oy=Math.floor((c.height-(maxY-minY+1)*scale)/2);
  for(let i=0;i<pixels.length;i++)if(pixels[i]){g.fillStyle=doc.palette[pixels[i]];g.fillRect(ox+(i%W-minX)*scale,oy+(Math.floor(i/W)-minY)*scale,scale,scale);}
 }
}
$('aiRequest').onclick=async()=>{
 if(aiBusy)return;const prompt=$('aiPrompt').value.trim();if(!prompt){message('어떻게 보정할지 입력하세요.');$('aiPrompt').focus();return;}
 const asset=pack(),signature=JSON.stringify(asset),selected=frame;aiBusy=true;$('aiRequest').disabled=true;$('aiStatus').textContent='AI가 현재 프레임을 보정 중입니다…';
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),100000);
 try{
  const response=await fetch('/api/ai/refine',{method:'POST',headers:{'Content-Type':'application/json','X-Arena-Editor':'1'},body:JSON.stringify({asset,frame:selected,prompt}),signal:controller.signal});
  const result=await response.json();if(!response.ok)throw Error(result.error||'보정 요청에 실패했습니다.');
  if(JSON.stringify(pack())!==signature)throw Error('요청 중 도트가 변경되어 보정안을 적용하지 않았습니다. 현재 도트로 다시 요청하세요.');
  if(!Array.isArray(result.edits)||result.edits.length>512)throw Error('올바르지 않은 AI 결과입니다.');
  const before=doc.frames[selected].slice(),after=before.slice();
  for(const e of result.edits){if(!e||!Number.isInteger(e.x)||e.x<0||e.x>=W||!Number.isInteger(e.y)||e.y<0||e.y>=H||!Number.isInteger(e.colorIndex)||e.colorIndex<0||e.colorIndex>=doc.palette.length)throw Error('올바르지 않은 AI 픽셀입니다.');after[e.y*W+e.x]=e.colorIndex;}
  const count=after.reduce((n,v,i)=>n+(v!==before[i]),0);if(!count){message('AI가 변경할 픽셀을 제안하지 않았습니다. 보정 요청을 구체적으로 바꿔보세요.');return;}
  aiCandidate={signature,selected,after};drawComparison(before,after);$('aiResult').textContent=(selected+1)+'번 프레임 · '+count+'개 픽셀 변경 제안';$('aiDialog').showModal();
 }catch(error){message(error.name==='AbortError'?'응답 대기 시간이 지났습니다. 원본은 유지됩니다.':error.message);}
 finally{clearTimeout(timeout);aiBusy=false;checkAI();}
};
$('aiAccept').onclick=()=>{
 if(!aiCandidate)return;
 if(JSON.stringify(pack())!==aiCandidate.signature){message('원본이 변경되어 보정안을 적용하지 않았습니다.');$('aiDialog').close();aiCandidate=null;return;}
 checkpoint();frame=aiCandidate.selected;doc.frames[frame]=aiCandidate.after;edited();draftSave();$('aiDialog').close();aiCandidate=null;message('AI 보정안을 초안에 적용했습니다. 실행 취소할 수 있습니다.');
};
$('aiDiscard').onclick=()=>{$('aiDialog').close();aiCandidate=null;message('원본을 유지했습니다.');};
$('aiDialog').addEventListener('close',()=>{aiCandidate=null;});
window.addEventListener('arena-pixel-art-change',()=>{if(doc&&!changed){doc=unpack(Art.get(doc.id)||original(doc.id));frame=Math.min(frame,doc.frames.length-1);$('fps').value=doc.fps;previewDirty=true;render();}});
checkAI();
window.addEventListener('keydown',event=>{
 if($('aiDialog').open)return;
 if(/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
 if(drag?.move){if(event.key==='Escape'){event.preventDefault();cancelStroke();}return;}
 if(event.code==='Space'){space=true;event.preventDefault();}
 if(event.ctrlKey||event.metaKey){if(event.key.toLowerCase()==='z'){event.preventDefault();history(event.shiftKey?redo:undo,event.shiftKey?undo:redo);}else if(event.key.toLowerCase()==='y'){event.preventDefault();history(redo,undo);}else if(event.key.toLowerCase()==='s'){event.preventDefault();$('apply').click();}return;}
 if(event.altKey)return;
 if(tool==='move'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
  event.preventDefault();const step=event.shiftKey?5:1,state=movement();movePixels(state,event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0);commitMovement(state);return;
 }
 if(/^[1-9]$/.test(event.key)){const c=doc.palette[Number(event.key)];if(c){event.preventDefault();setColor(c);}return;}
 if(event.key==='['||event.key===']'){event.preventDefault();let i=doc.palette.findIndex(c=>c?.toLowerCase()===selectedColor().toLowerCase());const n=doc.palette.length-1;if(!n)return;i=i<1?1:((i-1+(event.key===']'?1:-1)+n)%n)+1;setColor(doc.palette[i]);return;}
 if(event.key.toLowerCase()==='c'){event.preventDefault();$('color').click();return;}
 const t={b:'pencil',e:'eraser',g:'fill',i:'picker',v:'move',r:'replace'}[event.key.toLowerCase()];if(t)chooseTool(t);
});
window.addEventListener('keyup',event=>{if(event.code==='Space')space=false;});window.addEventListener('blur',()=>{space=false;finishStroke();});window.addEventListener('beforeunload',draftSave);
function preview(now){
 if(doc){const physical=doc.id==='tackle'||doc.id==='quickattack',electric=doc.id==='thunderbolt';
  const age=playing?(now-playStarted)/1000:frame/doc.fps,index=physical?Math.floor(age*30):Math.floor(age*doc.fps)%doc.frames.length;
  if(previewDirty||index!==lastPreview){
   const c=$('preview'),g=c.getContext('2d');g.fillStyle='#0b151e';g.fillRect(0,0,c.width,c.height);g.fillStyle='#172c35';for(let x=0;x<c.width;x+=16)g.fillRect(x,0,1,c.height);for(let y=0;y<c.height;y+=16)g.fillRect(0,y,c.width,1);
   const angle=Number($('direction').value)*Math.PI/180;
   let scale=1.5,cx=c.width/2,cy=c.height/2,fxAge=age;
   let rushPose=null;
   if(electric&&rushPreviewData&&thunderSprite.complete&&thunderSprite.naturalWidth){
    const cycle=playing?age%1.6:.17+frame/doc.fps,charging=cycle<.17,active=cycle<1.05;
    const progress=charging?cycle/.17:Math.min(1,(cycle-.17)/.88);
    cx=c.width/2-Math.cos(angle)*45;cy=c.height/2-Math.sin(angle)*45;scale=1.5;
    fxAge=active&&!charging?(playing?cycle-.17:frame/doc.fps):null;
    const row=(2-Math.round(angle/(Math.PI/4))+8)%8,pose=charging?Math.min(3,Math.floor(progress*3)):3;
    const anchor=rushPreviewData.frameAnchors['0025'].Shoot[row][pose],ox=(rushPreviewData.frameOriginsX['0025'].Shoot?.[row]?.[pose]??20);
    const dst=[Math.round(cx-ox*1.5),Math.round(cy+18-anchor*1.5),60,84],crop=[pose*40,row*56,40,56];
    if(active)ThunderboltArt.stamp(g,ThunderboltArt.corona(Math.floor(progress*16)),cx,cy,1.1,charging?progress:Math.min(1,(1-progress)*6));
    rushPose=()=>{if(active)ThunderboltArt.caster(g,thunderSprite,crop,dst,progress,charging);else g.drawImage(thunderSprite,...crop,...dst);};
    g.font='11px sans-serif';g.fillStyle='#fff4ad';g.fillText(charging?'몸에 전기 모으기':active?'몸에서 전류 방출':'잔광 · 회복',10,17);
   }
   if(physical&&rushPreviewData&&rushSprite.complete&&rushSprite.naturalWidth){
    const move=rushPreviewData.moves[doc.id==='tackle'?'ArenaStudio_Tackle':'ArenaStudio_QuickAttack'];
    const cycle=age%1.25,u=Math.max(0,Math.min(1,(cycle-move.cast)/move.duration));
    const distance=move.distance*.65,travel=distance*(1-(1-u)**2),row=(2-Math.round(angle/(Math.PI/4))+8)%8;
    const pose=cycle<move.cast?1:u<1?3:9;
    cx=c.width/2+Math.cos(angle)*(travel-distance/2);cy=c.height/2+Math.sin(angle)*(travel-distance/2);
    scale=.9;fxAge=Math.max(0,cycle-move.cast);
    const drawMon=(x,y,alpha)=>{
     const anchor=rushPreviewData.frameAnchors['0025'].Attack[row][pose];
     const ox=rushPreviewData.frameOriginsX['0025'].Attack[row][pose];
     g.globalAlpha=alpha;g.drawImage(rushSprite,pose*80,row*80,80,80,Math.round(x-ox*1.5),Math.round(y+16-anchor*1.5),120,120);g.globalAlpha=1;
    };
    g.imageSmoothingEnabled=false;g.fillStyle='#426055';g.fillRect(Math.round(cx-10),Math.round(cy+13),20,4);
    if(cycle>move.cast&&u<1)for(let i=3;i>=1;i--)drawMon(cx-Math.cos(angle)*i*9,cy-Math.sin(angle)*i*9,.24*(1-i/4));
    rushPose=()=>drawMon(cx,cy,1);
    g.fillStyle='#d6e5c4';g.font='11px sans-serif';g.fillText(doc.id==='tackle'?'몸통과 함께 짧게 돌진':'몸통과 함께 빠르게 돌진',10,17);
    if(cycle<move.cast||u>=1)fxAge=null;
   }
   const cells=fxAge===null?[]:Art.preview(pack(),fxAge,angle);
   g.imageSmoothingEnabled=false;for(const [x,y,c] of cells){g.fillStyle=c;g.fillRect(Math.round(cx+x*scale),Math.round(cy+y*scale),Math.ceil(scale),Math.ceil(scale));}
   if(rushPose)rushPose();
   else {g.fillStyle='#e1ef88';g.fillRect(cx-4,cy,9,1);g.fillRect(cx,cy-4,1,9);}
   g.font='10px monospace';g.fillStyle='#91a7b4';g.fillText(String(Math.floor(age*doc.fps)%doc.frames.length+1).padStart(2,'0')+' / '+String(doc.frames.length).padStart(2,'0'),10,c.height-10);
   lastPreview=index;previewDirty=false;
  }
 }requestAnimationFrame(preview);
}
async function startEditor(){await Art.refresh();try{const requested=new URLSearchParams(location.search).get('move');loadMove(Art.specs.some(s=>s.id===requested)?requested:'thunderbolt');requestAnimationFrame(preview);}catch(error){message('작업실을 열지 못했습니다: '+error.message);console.error(error);}}
startEditor();
})();
