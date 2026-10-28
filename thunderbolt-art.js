/* Thunderbolt: five-color pixel animation shared by the editor and both games. */
(function(root){
'use strict';
const palette=['#d49a1b','#f1c52b','#ffe652','#fff4ad','#ffffff'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const paths=[
 [[0,0],[8,-1],[20,-10],[28,7],[39,-6],[49,6],[56,-3],[64,0]],
 [[0,0],[8,1],[22,9],[30,-8],[41,7],[51,-6],[58,2],[64,0]],
 [[0,0],[11,-2],[24,-9],[32,8],[42,-7],[52,6],[59,-2],[64,0]],
 [[0,0],[10,1],[20,8],[29,-7],[40,9],[50,-7],[58,3],[64,0]]
];
function stroke(map,points,r,color){
 for(let k=1;k<points.length;k++){
  const a=points[k-1],b=points[k],n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]),1);
  for(let i=0;i<=n;i++){
   const x=Math.round(a[0]+(b[0]-a[0])*i/n),y=Math.round(a[1]+(b[1]-a[1])*i/n);
   for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++)if(xx*xx+yy*yy<=r*r+.5)map.set((x+xx)+','+(y+yy),color);
  }
 }
}
const entries=map=>[...map].map(([key,c])=>[...key.split(',').map(Number),c]);
function beam(frame){
 frame=clamp(frame|0,0,15);
 const cells=new Map(),path=paths[Math.floor(frame/2)%4];
 const thickness=frame>=13?0:frame%4===1?2:1;
 // Broad angular trunk, pale core, and a restrained gold edge. No emitter orb
 // and no permanent impact symbol: the caster and contact have their own layers.
 stroke(cells,path,thickness+2,palette[0]);
 stroke(cells,path,thickness+1,palette[2]);
 stroke(cells,path,thickness,palette[3]);
 stroke(cells,path,Math.max(0,thickness-1),palette[4]);
 if(frame<12){
  const sign=frame%4<2?1:-1;
  stroke(cells,[[26,sign*2],[32,sign*9],[37,sign*7],[40,sign*13]],0,palette[1]);
 }
 // The first two frames extend; the final frames break into a fading afterimage.
 const reach=frame===0?30:frame===1?52:66;
 return entries(cells).filter(([x,y])=>x>=0&&x<=reach&&
  (x<59||Math.abs(y)<=Math.max(0,(66-x)*.65))&&
  (frame<14||((x+frame*7)%24<15&&Math.abs(y)<9)));
}
function corona(frame){
 const cells=new Map(),sign=Math.floor(frame/2)%2?1:-1;
 // Open arcs hug the silhouette, leaving the face/body unobscured. Two small
 // forks break away from the body rather than making a ring at the muzzle.
 const a=[[-11,12],[-16,5],[-12,-3],[-15,-10],[-8,-21],[-9,-11]];
 const b=[[11,-17],[15,-8],[12,0],[16,6],[9,14],[7,9]];
 const shifted=p=>p.map(([x,y])=>[x*sign,y+(frame%3-1)]);
 for(const p of [shifted(a),shifted(b)]){
  stroke(cells,p,2,palette[1]);stroke(cells,p,1,palette[2]);stroke(cells,p,0,palette[4]);
 }
 if(frame%4<2){stroke(cells,[[-9,-5],[-22,-10],[-19,-3],[-26,-5]],0,palette[3]);}
 else stroke(cells,[[9,6],[22,12],[19,4],[25,7]],0,palette[3]);
 return entries(cells);
}
function encode(pixels){const runs=[];let last=pixels[0],n=0;for(const p of pixels){if(p===last)n++;else{runs.push(last,n);last=p;n=1;}}runs.push(last,n);return runs;}
function template(){
 const frames=[];for(let f=0;f<16;f++){
  const p=new Uint8Array(128*96);for(const [x,y,c] of beam(f))p[(48+y)*128+24+x]=palette.indexOf(c)+1;
  frames.push({runs:encode(p)});
 }
 return {version:1,id:'thunderbolt',width:128,height:96,anchor:{x:24,y:48},palette:[null,...palette],frames,fps:18};
}
function stamp(g,cells,x,y,scale=1,alpha=1){g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;for(const [px,py,c] of cells){g.fillStyle=c;g.fillRect(Math.round(x+px*scale),Math.round(y+py*scale),scale,scale);}g.restore();}
const masks=new WeakMap();
function mask(image,sx,sy,w,h,color){
 let cache=masks.get(image);if(!cache){cache=new Map();masks.set(image,cache);}
 const key=[sx,sy,w,h,color].join(':');if(cache.has(key))return cache.get(key);
 const c=root.document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
 g.drawImage(image,sx,sy,w,h,0,0,w,h);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,w,h);cache.set(key,c);return c;
}
// Draw the actual PMD silhouette with a crisp luminous rim; no blur/filter.
function caster(g,image,crop,dst,progress,charging=false){
 const [sx,sy,w,h]=crop,[x,y,dw,dh]=dst,f=Math.floor(progress*16)%16;
 const gold=mask(image,sx,sy,w,h,palette[2]),yellow=mask(image,sx,sy,w,h,palette[1]),white=mask(image,sx,sy,w,h,palette[3]);
 const unit=Math.max(1,Math.round(dw/w)),intensity=charging?.42+.38*progress:.78;
 g.save();g.imageSmoothingEnabled=false;
 g.globalAlpha*=intensity;
 // A complete pixel halo around the silhouette, followed by a warm wash
 // over the full character so the whole body reads as lit from within.
 for(const [dx,dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]])
  g.drawImage(yellow,x+dx*unit*2,y+dy*unit*2,dw,dh);
 for(const [dx,dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]])
  g.drawImage(gold,x+dx*unit,y+dy*unit,dw,dh);
 g.restore();g.drawImage(image,sx,sy,w,h,x,y,dw,dh);
 g.save();g.globalAlpha*=charging?.24+.12*progress:.34;g.drawImage(gold,x,y,dw,dh);
 g.globalAlpha*=charging?.35:(f%4===1?.5:.27);g.drawImage(white,x,y,dw,dh);g.restore();
}
// Bend the editable RPG sprite along the travelled head path. The image and
// collision use the same path; the full range is never drawn ahead of the head.
function drawPath(g,image,frame,points,pivotX=64,pivotY=192,alpha=1){
 const segments=[];let length=0;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
  if(d>.001){segments.push({a,dx,dy,d,from:length});length+=d;}
 }
 if(!length)return;
 const columns=Math.floor(image.naturalWidth/640),fx=(frame%columns)*640,fy=Math.floor(frame/columns)*384;
 g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;let segment=0;
 for(let d=0;d<length;d+=2){
  while(segment+1<segments.length&&d>=segments[segment].from+segments[segment].d)segment++;
  const s=segments[segment],u=(d-s.from)/s.d,span=Math.min(2,length-d);
  const sourceX=Math.floor(d/length*210),sw=Math.max(1,Math.ceil(span/length*210));
  g.save();g.translate(Math.round(s.a.x+s.dx*u),Math.round(s.a.y+s.dy*u));g.rotate(Math.atan2(s.dy,s.dx));
  g.drawImage(image,fx+pivotX+sourceX,fy+pivotY-48,sw,96,0,-48,span+1,96);g.restore();
 }
 g.restore();
}
root.ThunderboltArt={palette,beam,corona,template,stamp,caster,drawPath};
})(typeof window==='undefined'?globalThis:window);
