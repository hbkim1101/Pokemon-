/* Arena combat renderer v31.
 * Every effect mark is exactly one character sprite pixel (PIXEL world units),
 * snapped to the same grid the sprites use. No strokes, arcs, gradients, or
 * rotated blobs: fire, water, grass and electric are hand-placed 1px cells.
 * Battle and the motion studio share this file. */
(function(root){
'use strict';
let PIXEL=1.43;
const TAU=Math.PI*2;
const PAL={
 fire:['#3a120e','#c24116','#ff8a28','#fff0a8'],
 water:['#0c3048','#1a74ae','#7ad4f2','#f4ffff'],
 grass:['#143428','#2e9a52','#8ee070','#f3ffc4'],
 electric:['#3a2808','#e0a018','#ffe14a','#ffffea'],
 neutral:['#243038','#6a8490','#c5d8de','#ffffff']
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const palOf=el=>PAL[el]||PAL.neutral;
function setPixel(px){if(px>0)PIXEL=px;}
function grid(wx,wy){return [Math.round(wx/PIXEL),Math.round(wy/PIXEL)];}
function place(cells,x,y,color){if(!color)return;cells.set((x|0)+','+(y|0),color);}
function along(cells,ox,oy,vx,vy,ix,iy,color){
 const [gx,gy]=grid(ox,oy);
 place(cells,gx+Math.round(ix*vx-iy*vy),gy+Math.round(ix*vy+iy*vx),color);
}
function unit(m){const d=Math.hypot(m.vx||0,m.vy||0)||1;return {x:(m.vx||1)/d,y:(m.vy||0)/d};}
function tickOf(age,rate){return Math.floor(Math.max(0,age||0)*(rate||12));}

function paintBitmap(cells,ox,oy,vx,vy,shift,bitmap,pal,halfLimit){
 const h=bitmap.length,w=bitmap[0].length,oy0=h>>1;
 for(let y=0;y<h;y++){
  const iy=y-oy0;
  if(halfLimit!=null&&Math.abs(iy)>halfLimit)continue;
  for(let x=0;x<w;x++){
   const ch=bitmap[y][x];
   if(ch==='.')continue;
   along(cells,ox,oy,vx,vy,shift+x,iy,pal[ch.charCodeAt(0)-49]);
  }
 }
}
function lobe(cells,gx,gy,r,pal){
 r=Math.max(1,r|0);
 const core=Math.max(1,r*0.34),mid=r*0.68;
 for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){
  const d2=x*x+y*y;if(d2>r*r)continue;
  const d=Math.sqrt(d2);
  place(cells,gx+x,gy+y,d>=r-0.65?pal[0]:d<=core?pal[3]:d<=mid?pal[2]:pal[1]);
 }
}
function flame(cells,m,quality){
 const L=m.renderStream??m.stream??0;
 const len=Math.max(0,Math.round(L/PIXEL));
 if(len<1)return;
 const v=unit(m),t=Math.max(0,m.age-(m.windup||0)),step=tickOf(t,14);
 const pal=PAL.fire,[ox,oy]=grid(m.x,m.y);
 const spacing=quality==='low'?9:6,maxR=quality==='low'?8:16;
 const count=Math.ceil(len/spacing)+1;
 for(let i=0;i<count;i++){
  const d=i*spacing+(step%spacing);
  if(d<1||d>len)continue;
  const u=d/len,r=2+Math.round(u*maxR);
  const sway=(i%2?1:-1)*Math.max(1,r>>2);
  const gx=ox+Math.round(d*v.x-sway*v.y),gy=oy+Math.round(d*v.y+sway*v.x);
  lobe(cells,gx,gy,r,pal);
  if(quality!=='low'&&i%2===0){
   place(cells,gx+Math.round(-v.y*(r+2)),gy+Math.round(v.x*(r+2)),pal[2]);
   place(cells,gx+Math.round(v.y*(r+1)),gy+Math.round(-v.x*(r+1)),pal[3]);
  }
 }
 lobe(cells,ox+Math.round(v.x*2),oy+Math.round(v.y*2),2,pal);
 if(m.contact){
  const c=m.contact,[cx,cy]=grid(c.x,c.y);
  lobe(cells,cx,cy,quality==='low'?4:6,c.steam?PAL.water:pal);
  for(let i=0;i<5;i++){
   const puff=1+(step+i)%6;
   place(cells,cx+((i%2)?1:-1),cy-puff,c.steam?'#f4ffff':'#fff0a8');
   place(cells,cx,cy-puff-1,c.steam?'#d7e4e6':'#ff8a28');
  }
 }
}
function disk(cells,wx,wy,r,color){
 const [cx,cy]=grid(wx,wy),rad=Math.max(0,r|0);
 for(let y=-rad;y<=rad;y++)for(let x=-rad;x<=rad;x++)if(x*x+y*y<=rad*rad)place(cells,cx+x,cy+y,color);
}
function ring(cells,wx,wy,r,color){
 const [cx,cy]=grid(wx,wy),rad=Math.max(1,r|0),inner=Math.max(0,rad-1);
 for(let y=-rad;y<=rad;y++)for(let x=-rad;x<=rad;x++){const d=x*x+y*y;if(d<=rad*rad&&d>=inner*inner)place(cells,cx+x,cy+y,color);}
}
function line(cells,x0,y0,x1,y1,color,thick){
 x0|=0;y0|=0;x1|=0;y1|=0;
 const adx=Math.abs(x1-x0),ady=Math.abs(y1-y0);
 const nx=adx>=ady?0:1,ny=adx>=ady?1:0;
 let dx=adx,sx=x0<x1?1:-1,dy=-ady,sy=y0<y1?1:-1,err=dx+dy,i=0;
 for(;;){
  place(cells,x0,y0,color);
  if(thick){place(cells,x0+nx,y0+ny,color);place(cells,x0-nx,y0-ny,color);}
  if(x0===x1&&y0===y1)break;
  const e2=2*err;
  if(e2>=dy){err+=dy;x0+=sx;}
  if(e2<=dx){err+=dx;y0+=sy;}
  if(++i>800)break;
 }
}
function bolt(cells,m,quality){
 const pts=m.path||[];if(pts.length<2)return;
 const pal=PAL.electric,step=tickOf(m.age,16);
 const gpts=pts.map(p=>grid(p.x,p.y));
 for(let i=1;i<gpts.length;i++){
  line(cells,gpts[i-1][0],gpts[i-1][1],gpts[i][0],gpts[i][1],pal[0],true);
  line(cells,gpts[i-1][0],gpts[i-1][1],gpts[i][0],gpts[i][1],pal[1],false);
 }
 const keys=[...cells.keys()];
 keys.forEach((k,i)=>{
  if((i+step)%3!==0)return;
  const [x,y]=k.split(',').map(Number);
  place(cells,x,y,pal[3]);
  if(quality!=='low'&&(i+step)%7===2){
   const dir=(i+step)%2?1:-1,span=2+(i%3);
   const horiz=Math.abs((gpts.at(-1)[0]-gpts[0][0]))>=Math.abs(gpts.at(-1)[1]-gpts[0][1]);
   for(let s=1;s<=span;s++)place(cells,x+(horiz?0:dir*s),y+(horiz?dir*s:0),s===span?pal[3]:pal[2]);
  }
 });
 const head=gpts.at(-1);
 ring(cells,head[0]*PIXEL,head[1]*PIXEL,quality==='low'?2:3,pal[2]);
 place(cells,head[0],head[1],pal[3]);
}
function aura(cells,m){
 const pal=palOf(m.element||'electric'),step=tickOf(m.age,12),r=7;
 ring(cells,m.x,m.y,r,pal[1]);
 ring(cells,m.x,m.y,r-3,pal[2]);
 const [cx,cy]=grid(m.x,m.y);
 for(let i=0;i<8;i++){
  const a=i/8*TAU+step*.35,len=2+(i+step)%3;
  for(let k=r;k<r+len;k++)place(cells,cx+Math.round(Math.cos(a)*k),cy+Math.round(Math.sin(a)*k),k===r+len-1?pal[3]:pal[2]);
 }
}
function projectile(cells,m){
 if((m.delay||0)>0)return;
 const v=unit(m),pal=palOf(m.element),[gx,gy]=grid(m.x,m.y);
 const step=tickOf(m.pulse||m.age,10);
 if(m.element==='electric'){
  const zag=[[0,0],[-1,1],[-2,-1],[-3,1],[-4,0]];
  zag.forEach(([x,y],i)=>place(cells,gx+Math.round(x*v.x-y*v.y),gy+Math.round(x*v.y+y*v.x),i%2?pal[3]:pal[2]));
  return;
 }
 const head=3;
 lobe(cells,gx,gy,head,pal);
 for(let i=1;i<=4;i++){
  const side=((step+i)%3)-1;
  place(cells,gx+Math.round((-head-i)*v.x-side*v.y),gy+Math.round((-head-i)*v.y+side*v.x),i<2?pal[2]:pal[0]);
 }
}
function charge(cells,m){
 const pal=palOf(m.element),u=clamp((m.age||0)/(m.windup||.18),0,1),step=tickOf(m.age,14);
 const r=Math.max(2,Math.round(8*(1-u)+1));
 const [cx,cy]=grid(m.x,m.y);
 for(let i=0;i<8;i++){
  const a=(i+step)/8*TAU;
  place(cells,cx+Math.round(Math.cos(a)*r),cy+Math.round(Math.sin(a)*r),pal[i%2?2:1]);
 }
 disk(cells,m.x,m.y,u>.66?2:1,pal[3]);
}
function jet(cells,m,ports,quality){
 const age=Math.max(0,m.age-(m.windup||0));
 const reach=Math.round(Math.min(quality==='low'?12:20,age*36));
 if(reach<1)return;
 const v=unit(m),pal=PAL.water;
 for(const p of ports||[]){
  for(let i=0;i<reach;i++){
   along(cells,p.x,p.y,v.x,v.y,i,0,pal[3]);
   along(cells,p.x,p.y,v.x,v.y,i,1,pal[2]);
   along(cells,p.x,p.y,v.x,v.y,i,-1,pal[2]);
   if(i%2===0){along(cells,p.x,p.y,v.x,v.y,i,2,pal[1]);along(cells,p.x,p.y,v.x,v.y,i,-2,pal[0]);}
  }
  lobe(cells,grid(p.x+v.x*reach*PIXEL)[0],grid(p.y+v.y*reach*PIXEL)[1],quality==='low'?2:3,pal);
 }
}
function surf(cells,m,quality){
 const v=unit(m),pal=PAL.water,step=tickOf(m.age,10);
 const half=quality==='low'?14:22,[ox,oy]=grid(m.x,m.y);
 const gap=quality==='low'?4:3;
 for(let s=-half;s<=half;s+=gap){
  const n=Math.abs(s)/half;
  const crest=Math.round((1-n*n)*(quality==='low'?8:12))+((s+step)%6===0?1:0);
  const r=Math.max(4,Math.round((quality==='low'?4:7)*(1-n*0.28)));
  const gx=ox+Math.round(crest*v.x-s*v.y),gy=oy+Math.round(crest*v.y+s*v.x);
  lobe(cells,gx,gy,r,pal);
  if((s+step)%(gap*2)===0)place(cells,gx+Math.round(v.x*(r+1)),gy+Math.round(v.y*(r+1)),pal[3]);
 }
}
const LEAF=['.2.','121','232','.2.'];
function orb(cells,m,quality){
 const pal=PAL.grass,v=unit(m),step=tickOf(m.age,10),r=quality==='low'?6:9;
 const [cx,cy]=grid(m.x,m.y);
 lobe(cells,cx,cy,r,pal);
 const count=quality==='low'?4:6;
 for(let i=0;i<count;i++){
  const a=(i+step)/count*TAU,rad=r+3;
  paintBitmap(cells,m.x+Math.cos(a)*rad*PIXEL,m.y+Math.sin(a)*rad*PIXEL,Math.cos(a),Math.sin(a),0,LEAF,pal,null);
 }
 for(let i=1;i<=4;i++)along(cells,m.x,m.y,v.x,v.y,-r-i,(i%2?1:-1),i%2?pal[1]:pal[2]);
}
function impact(cells,m){
 const u=clamp((m.age||0)/(m.life||.4),0,1),pal=palOf(m.element),r=Math.max(1,Math.round(u*14));
 ring(cells,m.x,m.y,r,pal[2]);
 if(u<.35)disk(cells,m.x,m.y,2,pal[3]);
 const [cx,cy]=grid(m.x,m.y);
 for(let i=0;i<8;i++){
  const a=i/8*TAU+(m.seed||0);
  const len=r+(i%2);
  for(let k=Math.max(0,r-2);k<=len;k++){
   const x=cx+Math.round(Math.cos(a)*k),y=cy+Math.round(Math.sin(a)*k);
   if(m.element==='grass'&&k===len)paintBitmap(cells,x*PIXEL,y*PIXEL,Math.cos(a),Math.sin(a),0,LEAF,pal,null);
   else place(cells,x,y,k===len?pal[3]:pal[1]);
  }
 }
}
function particle(cells,p){
 const pal=palOf(p.element),v=unit(p),[gx,gy]=grid(p.x,p.y);
 if(p.shape==='leaf')paintBitmap(cells,p.x,p.y,v.x||1,v.y||0,0,LEAF,PAL.grass,null);
 else if(p.shape==='drop'){place(cells,gx,gy,p.color||PAL.water[2]);place(cells,gx,gy+1,p.color||PAL.water[1]);}
 else if(p.shape==='flame'){place(cells,gx,gy,p.color||PAL.fire[2]);place(cells,gx,gy-1,PAL.fire[3]);place(cells,gx-1,gy,PAL.fire[1]);}
 else if(p.shape==='ring')ring(cells,p.x,p.y,Math.max(2,Math.min(12,Math.round((p.size||8)/PIXEL))),p.color||pal[2]);
 else if(p.shape==='spark'){place(cells,gx,gy,p.color||pal[3]);place(cells,gx-Math.round(v.x),gy-Math.round(v.y),p.color||pal[2]);}
 else place(cells,gx,gy,p.color||pal[3]);
}
const BUILD={
 flame,thunder:bolt,orb,surf,impact,projectile,charge,aura,particle,
 jet:(cells,m,quality)=>jet(cells,m,m.ports||m.emitters||[],quality),
 contact:(cells,m)=>flame(cells,{...m,stream:0,renderStream:0,contact:m.contact||{x:m.x,y:m.y}},'high')
};
function cellsOf(kind,m,quality){
 const cells=new Map();
 const fn=BUILD[kind];
 if(fn)fn(cells,m,quality||'high');
 return [...cells.entries()].map(([k,c])=>{const [x,y]=k.split(',').map(Number);return [x,y,c];});
}
let scratch=null;
function sheet(w,h){
 const doc=root.document;
 if(!doc||!doc.createElement)return null;
 if(!scratch)scratch=doc.createElement('canvas');
 scratch.width=w;scratch.height=h;
 return scratch;
}
function blit(g,cells,alpha){
 if(!cells||!cells.size)return;
 let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
 const pts=[];
 for(const [k,c] of cells){
  const [x,y]=k.split(',').map(Number);
  if(x<minX)minX=x;if(y<minY)minY=y;if(x>maxX)maxX=x;if(y>maxY)maxY=y;
  pts.push(x,y,c);
 }
 const w=maxX-minX+1,h=maxY-minY+1;
 if(w<1||h<1||w>640||h>640)return;
 const canvas=sheet(w,h);
 g.save();
 g.imageSmoothingEnabled=false;
 g.globalAlpha=alpha==null?1:alpha;
 if(canvas){
  const b=canvas.getContext('2d');
  b.imageSmoothingEnabled=false;
  b.clearRect(0,0,w,h);
  for(let i=0;i<pts.length;i+=3){b.fillStyle=pts[i+2];b.fillRect(pts[i]-minX,pts[i+1]-minY,1,1);}
  g.drawImage(canvas,0,0,w,h,minX*PIXEL,minY*PIXEL,w*PIXEL,h*PIXEL);
 }else{
  for(let i=0;i<pts.length;i+=3){g.fillStyle=pts[i+2];g.fillRect(pts[i]*PIXEL,pts[i+1]*PIXEL,PIXEL,PIXEL);}
 }
 g.restore();
}
function run(kind,g,m,quality,alpha){
 const cells=new Map();
 const fn=BUILD[kind];
 if(fn)fn(cells,m,quality||'high');
 blit(g,cells,alpha);
}
function fadeOf(m){
 if(m&&m.type==='boltEcho')return clamp(1-(m.age||0)/Math.max(.001,m.life||.24),0,1);
 if(m&&m.type==='surf')return clamp(((m.life||1)-(m.age||0))/.22,0,1);
 return 1;
}
root.ArenaFX={
 get PIXEL(){return PIXEL;},setPixel,cells:cellsOf,stamp:(g,entries,alpha)=>{
  const cells=new Map();
  for(const [x,y,c] of entries)place(cells,x,y,c);
  blit(g,cells,alpha);
 },
 charge:(g,m,q)=>run('charge',g,m,q,1),
 projectile:(g,m,q)=>run('projectile',g,m,q,1),
 flame:(g,m,q)=>run('flame',g,m,q,1),
 thunder:(g,m,q)=>run('thunder',g,m,q,fadeOf(m)),
 orb:(g,m,q)=>run('orb',g,m,q,1),
 surf:(g,m,q)=>run('surf',g,m,q,fadeOf(m)),
 impact:(g,m,q)=>run('impact',g,m,q,clamp(1-(m.age||0)/Math.max(.001,m.life||.4),0,1)**2),
 particle:(g,p)=>{
  const a=clamp((p.life||0)/Math.max(.001,p.max||p.life||.001),0,1)*(p.alpha??1);
  if(a<=.05)return;
  run('particle',g,p,'high',a);
 },
 jet:(g,m,ports,q)=>{
  const age=Math.max(0,(m.age||0)-(m.windup||0));
  run('jet',g,{...m,ports},q,clamp(1-age/.34,0,1));
 },
 aura:(g,m,q)=>run('aura',g,m,q,1),
 contact:(g,m,q)=>run('contact',g,m,q,1),
 get pixel(){return PIXEL;}
};
})(typeof window==='undefined'?globalThis:window);
