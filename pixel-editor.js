(function(){
'use strict';
const Art=window.ArenaPixelArt,$=id=>document.getElementById(id),board=$('board'),ctx=board.getContext('2d');
const DRAFT='pokemon-arena-pixel-draft-v1:',W=128,H=96;
let doc,frame=0,tool='pencil',zoom=5,color='#ffffff',alpha=100,playing=true,space=false,drag=null,lastPoint=null;
let undo=[],redo=[],draftTimer,changed=false,previewDirty=true,lastPreview=-1,playStarted=performance.now();
let exactColor=null;
const originals=new Map();
function message(text){$('status').textContent=text;}
function original(id){if(!originals.has(id))originals.set(id,Art.template(id));return originals.get(id);}
function unpack(asset){const a=Art.validate(asset);return {...a,frames:a.frames.map(f=>Art.decode(f.runs,W*H,a.palette.length))};}
function pack(){return {...doc,frames:doc.frames.map(pixels=>({runs:Art.encode(pixels)}))};}
function draftSave(){
 clearTimeout(draftTimer);if(!doc)return;
 try{localStorage.setItem(DRAFT+doc.id,JSON.stringify(pack()));if(changed)$('saveState').textContent='초안 저장됨 · 배틀 적용 대기';}
 catch{message('초안 저장 공간이 부족합니다. JSON 작업 파일로 내보내 주세요.');}
}
function checkpoint(){undo.push({asset:pack(),frame});if(undo.length>40)undo.shift();redo=[];}
function edited(){changed=true;previewDirty=true;clearTimeout(draftTimer);draftTimer=setTimeout(draftSave,350);render();}
function loadMove(id,provided){
 if(doc)draftSave();let asset=provided;
 if(!asset){try{const raw=localStorage.getItem(DRAFT+id);if(raw){asset=Art.validate(JSON.parse(raw));if(asset.id!==id)asset=null;}}catch{}}
 asset=asset||Art.get(id)||original(id);doc=unpack(asset);frame=0;undo=[];redo=[];changed=JSON.stringify(pack())!==JSON.stringify(Art.get(id)||original(id));previewDirty=true;
 $('fps').value=doc.fps;render();message('도트를 클릭하거나 드래그해 수정하세요.');
}
function renderMoves(){
 $('moves').replaceChildren();
 const tones={electric:'#ffe27b',fire:'#ff9b70',water:'#86d9ff',grass:'#abe681'};
 for(const spec of Art.specs){const b=document.createElement('button');b.className='move'+(spec.id===doc.id?' selected':'');b.setAttribute('aria-pressed',String(spec.id===doc.id));b.dataset.move=spec.id;
  const strong=document.createElement('strong'),dot=document.createElement('span');dot.className='dot';dot.style.background=tones[spec.element];strong.append(dot,document.createTextNode(spec.name));
  const small=document.createElement('small');small.textContent=spec.mon+(Art.has(spec.id)?' · 적용됨':'');b.append(strong,small);b.onclick=()=>loadMove(spec.id);$('moves').append(b);
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
 exactColor=value.toLowerCase();
 color=value.slice(0,7);alpha=value.length===9?Math.round(parseInt(value.slice(7),16)/255*100):100;
 $('color').value=color;$('hex').value=value;$('alpha').value=alpha;$('alphaValue').textContent=alpha+'%';renderPalette();
}
function renderPalette(){
 $('palette').replaceChildren();
 doc.palette.slice(1).forEach((c,i)=>{const b=document.createElement('button');b.className='swatch'+(c.toLowerCase()===selectedColor().toLowerCase()?' selected':'');b.style.background=c;b.title=c+(i<9?' · '+(i+1):'');b.setAttribute('aria-label','색상 '+c);b.onclick=()=>setColor(c);$('palette').append(b);});
 const selected=doc.palette.findIndex(c=>c?.toLowerCase()===selectedColor().toLowerCase());
 $('addColor').disabled=selected>0||doc.palette.length>=256;
 $('deleteColor').disabled=selected<1;
 $('paletteCount').textContent=(doc.palette.length-1)+' / 255색';
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
 $('saveState').textContent=changed?'초안 작업 중 · 적용 대기':Art.has(doc.id)?'배틀에 적용된 도트':'원본 도트';
 $('undo').disabled=!undo.length;$('redo').disabled=!redo.length;$('resetApplied').disabled=!Art.has(doc.id);
 renderMoves();renderBoard();renderFrames();renderPalette();
}
function indexForColor(){
 const c=selectedColor().toLowerCase();let index=doc.palette.findIndex(p=>p?.toLowerCase()===c);
 if(index<0){if(doc.palette.length>=256)throw Error('팔레트가 가득 찼습니다. 기존 색상을 선택해 주세요.');index=doc.palette.length;doc.palette.push(c);}return index;
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
$('color').oninput=event=>{exactColor=null;color=event.target.value;$('hex').value=selectedColor();renderPalette();};
$('alpha').oninput=event=>{exactColor=null;alpha=Number(event.target.value);$('alphaValue').textContent=alpha+'%';$('hex').value=selectedColor();renderPalette();};
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
$('apply').onclick=()=>{try{Art.save(pack());changed=false;draftSave();render();message('배틀에 적용했습니다. 같은 주소로 열린 배틀·스튜디오에 자동 반영됩니다.');}catch(error){message('적용하지 못했습니다: '+error.message);}};
$('resetApplied').onclick=()=>{try{Art.reset(doc.id);changed=true;render();message('배틀은 원본으로 돌아갔습니다. 편집 중인 초안은 남아 있습니다.');}catch(error){message(error.message);}};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('exportJson').onclick=()=>download(new Blob([JSON.stringify(pack())],{type:'application/json'}),'arena-'+doc.id+'.json');
$('importJson').onclick=()=>$('file').click();
$('file').onchange=async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;try{if(file.size>4*1024*1024)throw Error('4MB 이하의 작업 파일을 선택하세요.');const asset=Art.validate(JSON.parse(await file.text()));if(doc.id!==asset.id)loadMove(asset.id);checkpoint();doc=unpack(asset);frame=0;$('fps').value=doc.fps;edited();message('작업 파일을 불러왔습니다. 확인 후 배틀에 적용해 주세요.');}catch(error){message('불러오지 못했습니다: '+error.message);}};
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
 if(doc){const age=playing?(now-playStarted)/1000:frame/doc.fps,index=Math.floor(age*doc.fps)%doc.frames.length;
  if(previewDirty||index!==lastPreview){
   const c=$('preview'),g=c.getContext('2d');g.fillStyle='#0b151e';g.fillRect(0,0,c.width,c.height);g.fillStyle='#172c35';for(let x=0;x<c.width;x+=16)g.fillRect(x,0,1,c.height);for(let y=0;y<c.height;y+=16)g.fillRect(0,y,c.width,1);
   const scale=1.5,cx=c.width/2,cy=c.height/2;const cells=Art.preview(pack(),age,Number($('direction').value)*Math.PI/180);
   g.imageSmoothingEnabled=false;for(const [x,y,c] of cells){g.fillStyle=c;g.fillRect(Math.round(cx+x*scale),Math.round(cy+y*scale),Math.ceil(scale),Math.ceil(scale));}
   g.fillStyle='#e1ef88';g.fillRect(cx-4,cy,9,1);g.fillRect(cx,cy-4,1,9);g.font='10px monospace';g.fillStyle='#91a7b4';g.fillText(String(index+1).padStart(2,'0')+' / '+String(doc.frames.length).padStart(2,'0'),10,c.height-10);
   lastPreview=index;previewDirty=false;
  }
 }requestAnimationFrame(preview);
}
try{const requested=new URLSearchParams(location.search).get('move');loadMove(Art.specs.some(s=>s.id===requested)?requested:'thunderbolt');requestAnimationFrame(preview);}catch(error){message('작업실을 열지 못했습니다: '+error.message);console.error(error);}
})();
