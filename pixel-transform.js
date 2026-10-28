(function(root){
'use strict';
function transform(pixels,width,height,anchor,operation){
 const next=new Uint8Array(pixels.length);let left=width,right=-1,top=height,bottom=-1;
 pixels.forEach((v,i)=>{if(v){left=Math.min(left,i%width);right=Math.max(right,i%width);top=Math.min(top,Math.floor(i/width));bottom=Math.max(bottom,Math.floor(i/width));}});
 pixels.forEach((v,i)=>{
  if(!v)return;const x=i%width,y=Math.floor(i/width),dx=x-anchor.x,dy=y-anchor.y;let nx=x,ny=y;
  if(operation==='horizontal')nx=left+right-x;
  else if(operation==='vertical')ny=top+bottom-y;
  else if(operation==='cw'){nx=anchor.x-dy;ny=anchor.y+dx;}
  else if(operation==='ccw'){nx=anchor.x+dy;ny=anchor.y-dx;}
  else throw Error('지원하지 않는 변환입니다.');
  if(nx<0||ny<0||nx>=width||ny>=height)throw Error('회전하면 그림이 캔버스를 벗어납니다. 도트를 안쪽으로 옮긴 뒤 다시 시도하세요.');
  next[ny*width+nx]=v;
 });return next;
}
root.ArenaPixelTransform=transform;
})(typeof window==='undefined'?globalThis:window);
