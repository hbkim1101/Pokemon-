/* Shared pixel combat art: stepped animation, hard outlines and sprite-sized cells. */
(function(root){
'use strict';
let PIXEL=1.43;
const TAU=Math.PI*2;
const PAL={
 fire:['#7a1c12','#c43214','#f25c1c','#ffb038','#fff4b4'],
 water:['#123f88','#2b78dc','#7ec8ff','#e7f6ff','#ffffff'],
 grass:['#14502c','#2f9a48','#7ed85a','#d8ff9a','#f4ffd0'],
 electric:['#6a4a08','#e0a018','#ffe14a','#fff7b0','#ffffff'],
 neutral:['#243038','#6a8490','#c5d8de','#ffffff','#ffffff']
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const palOf=el=>PAL[el]||PAL.neutral;
function setPixel(px){if(px>0)PIXEL=px;}
function grid(wx,wy){return [Math.round(wx/PIXEL),Math.round(wy/PIXEL)];}
function place(cells,x,y,color){if(color)cells.set((x|0)+','+(y|0),color);}
function along(cells,ox,oy,vx,vy,ix,iy,color){
 const [gx,gy]=grid(ox,oy);
 place(cells,gx+Math.round(ix*vx-iy*vy),gy+Math.round(ix*vy+iy*vx),color);
}
function unit(m){const x=m.vx??1,y=m.vy??0,d=Math.hypot(x,y);return d?{x:x/d,y:y/d}:{x:1,y:0};}
function tickOf(age,rate){return Math.floor(Math.max(0,age||0)*(rate||12));}
function nse(i){const x=Math.sin(i*127.1+19.2)*43758.5453;return x-Math.floor(x);}
function paintBitmap(cells,ox,oy,vx,vy,shift,bitmap,pal){
 const h=bitmap.length,w=bitmap[0].length,oy0=h>>1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const ch=bitmap[y][x];
  if(ch==='.')continue;
  along(cells,ox,oy,vx,vy,shift+x,y-oy0,pal[ch.charCodeAt(0)-49]||pal[1]);
 }
}
function bulb(cells,gx,gy,r,pal){
 r=Math.max(2,r|0);
 const edge=r*r,hot=(r*.18)*(r*.18),warm=(r*.36)*(r*.36),body=(r*.68)*(r*.68);
 for(let y=-r-1;y<=r+1;y++)for(let x=-r-1;x<=r+1;x++){
  const d2=x*x+y*y;
  if(d2>(r+.45)*(r+.45))continue;
  if(d2>=edge){place(cells,gx+x,gy+y,pal[0]);continue;}
  place(cells,gx+x,gy+y,d2<=hot?pal[4]:d2<=warm?pal[3]:d2<=body?pal[2]:pal[1]);
 }
}
function fringe(cells,rgba){
 const keys=[...cells.keys()];
 for(const k of keys){
  const [x,y]=k.split(',').map(Number);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nk=(x+dx)+','+(y+dy);
   if(!cells.has(nk))cells.set(nk,rgba);
  }
 }
}
function at(ox,oy,v,alongPx,sidePx){
 return [ox+Math.round(alongPx*v.x-sidePx*v.y),oy+Math.round(alongPx*v.y+sidePx*v.x)];
}
const FIRE_NUDGE=[0,1,-1,2,-2,1,0,-1,2];
const SPIKE=[
 '....1....',
 '...121...',
 '..12321..',
 '.1234321.',
 '123454321',
 '.1234321.',
 '..12321..',
 '...121...',
 '....1....'
];
const CRESCENT=[
 '.11111111.',
 '1222222221',
 '12333333321',
 '12334444321',
 '12345...321',
 '12345...321',
 '12334444321',
 '12333333321',
 '1222222221',
 '.11111111.'
];
function stampArt(cells,gx,gy,vx,vy,bitmap,pal){
 const oy=bitmap.length>>1;
 for(let y=0;y<bitmap.length;y++){
  const row=bitmap[y];
  for(let x=0;x<row.length;x++){
   const ch=row[x];
   if(ch==='.')continue;
   const iy=y-oy;
   place(cells,gx+Math.round(x*vx-iy*vy),gy+Math.round(x*vy+iy*vx),pal[ch.charCodeAt(0)-49]);
  }
 }
}
function flame(cells,m,quality){
 const L=m.renderStream??m.stream??0;
 const len=Math.max(0,Math.round(L/PIXEL));
 if(len<1)return;
 const v=unit(m),t=Math.max(0,m.age-(m.windup||0)),step=tickOf(t,14);
 const pal=PAL.fire,[ox,oy]=grid(m.x,m.y);
 // A continuous tapered body. Travelling lobes break into pointed flame tongues.
 for(let d=0;d<=len;d++){
  const u=d/len,phase=d*.34-step*.85;
  const tip=Math.min(1,(len-d+1)/8);
  const half=(2+u*8+Math.sin(phase)*u*2)*tip;
  const center=Math.sin(d*.16-step*.65)*u*2;
  for(let side=Math.floor(center-half);side<=center+half;side++){
   const edge=Math.abs(side-center)/half;
   const hot=Math.abs(side-center+Math.sin(phase)*1.5)/half;
   const color=edge>.88?pal[0]:edge>.66?pal[1]:hot>.4?pal[2]:hot>.16?pal[3]:pal[4];
   const [x,y]=at(ox,oy,v,d,side);place(cells,x,y,color);
  }
 }
 for(let i=0;i<7;i++){
  const d=len*(.3+i*.1),sign=i%2?1:-1,base=3+d/len*6;
  for(let k=0;k<9;k++)for(let w=-2;w<=2;w++){
   if(Math.abs(w)>2-k/4)continue;
   const [x,y]=at(ox,oy,v,d+k,sign*(base+k*.55)+w);
   place(cells,x,y,Math.abs(w)>1?pal[1]:pal[2+(k%3===0?1:0)]);
  }
 }
 for(let i=0;i<(quality==='low'?3:6);i++){
  const [x,y]=at(ox,oy,v,len-8+(i*7+step*3)%20,(i%2?1:-1)*(9+i%3*3));
  place(cells,x,y,pal[3]);place(cells,x-1,y,pal[1]);
 }
 if(m.contact){
  const c=m.contact,[cx,cy]=grid(c.x,c.y),p=c.steam?PAL.water:pal;
  bulb(cells,cx,cy,quality==='low'?5:8,p);
  for(let k=0;k<6;k++){
   const puff=2+(step+k)%7;
   place(cells,cx+((k%3)-1),cy-puff,c.steam?p[4]:pal[4]);
   place(cells,cx+((k%2)?2:-2),cy-puff-1,c.steam?p[3]:pal[3]);
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
function linePoints(x0,y0,x1,y1){
 const pts=[];
 x0|=0;y0|=0;x1|=0;y1|=0;
 let dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy,n=0;
 for(;;){
  pts.push(x0,y0);
  if(x0===x1&&y0===y1)break;
  const e2=2*err;
  if(e2>=dy){err+=dy;x0+=sx;}
  if(e2<=dx){err+=dx;y0+=sy;}
  if(++n>900)break;
 }
 return pts;
}
function bolt(cells,m,quality){
 const pts=m.path||[];if(pts.length<2)return;
 const pal=PAL.electric,step=tickOf(m.age,16);
 const paths=[pts.map(p=>grid(p.x,p.y))];
 // Short, bent forks rather than perpendicular comb teeth.
 for(let i=1;i<pts.length-1;i+=quality==='low'?4:2){
  const [x,y]=paths[0][i],prev=paths[0][i-1];
  const dx=x-prev[0],dy=y-prev[1],len=Math.hypot(dx,dy)||1,sign=(i+step)%2?1:-1;
  const nx=-dy/len*sign,ny=dx/len*sign;
  paths.push([[x,y],[x+Math.round(nx*7+dx/len*3),y+Math.round(ny*7+dy/len*3)],
   [x+Math.round(nx*8-dx/len*2),y+Math.round(ny*8-dy/len*2)],
   [x+Math.round(nx*14+dx/len*4),y+Math.round(ny*14+dy/len*4)]]);
 }
 for(let layer=0;layer<3;layer++)for(let p=0;p<paths.length;p++){
  const points=paths[p],r=layer===0?(p?1:3):layer===1?(p?0:2):0;
  for(let i=1;i<points.length;i++){
   const seg=linePoints(...points[i-1],...points[i]);
   for(let k=0;k<seg.length;k+=2)for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){
    if(Math.abs(x)+Math.abs(y)>r)continue;
    place(cells,seg[k]+x,seg[k+1]+y,pal[layer===0?0:layer===1?2:4]);
   }
  }
 }
 const [hx,hy]=paths[0].at(-1);
 for(let i=0;i<8;i++){
  const a=i*TAU/8,inner=4,outer=7+(i+step)%4;
  const ray=linePoints(hx+Math.round(Math.cos(a)*inner),hy+Math.round(Math.sin(a)*inner),hx+Math.round(Math.cos(a)*outer),hy+Math.round(Math.sin(a)*outer));
  for(let k=0;k<ray.length;k+=2)place(cells,ray[k],ray[k+1],pal[i%2?2:4]);
 }
}
function aura(cells,m){
 const pal=palOf(m.element||'electric'),step=tickOf(m.age,10),[cx,cy]=grid(m.x,m.y);
 for(let i=0;i<10;i++){
  const a=(i+step*.15)/10*TAU,r=8+(i%3);
  place(cells,cx+Math.round(Math.cos(a)*r),cy+Math.round(Math.sin(a)*r),i%2?pal[3]:pal[2]);
  const len=3+(i+step)%4;
  for(let k=r;k<r+len;k++)place(cells,cx+Math.round(Math.cos(a)*k),cy+Math.round(Math.sin(a)*k),k===r+len-1?pal[4]:pal[3]);
 }
 bulb(cells,cx,cy,3,pal,0,-1);
}
function projectile(cells,m){
 if((m.delay||0)>0)return;
 const v=unit(m),pal=palOf(m.element),[gx,gy]=grid(m.x,m.y),step=tickOf(m.pulse||m.age,10);
 if(m.element==='electric'){
  [[0,0],[-1,1],[-2,-1],[-3,1],[-4,0],[-5,1]].forEach(([x,y],i)=>{
   place(cells,gx+Math.round(x*v.x-y*v.y),gy+Math.round(x*v.y+y*v.x),i%2?pal[4]:pal[3]);
  });
  return;
 }
 const DART=['..1..','.121.','12341','.121.','..1..'];
 stampArt(cells,gx,gy,v.x,v.y,DART,pal);
 for(let i=1;i<=2;i++){
  const [tx,ty]=at(gx,gy,v,-2-i,((step+i)%3)-1);
  place(cells,tx,ty,i===1?pal[3]:pal[1]);
 }
}
function charge(cells,m){
 const pal=palOf(m.element),u=clamp((m.age||0)/(m.windup||.18),0,1),step=tickOf(m.age,12);
 const r=Math.max(2,Math.round(9*(1-u)+2)),[cx,cy]=grid(m.x,m.y);
 for(let i=0;i<8;i++){
  const a=(i+step)/8*TAU;
  place(cells,cx+Math.round(Math.cos(a)*r),cy+Math.round(Math.sin(a)*r),pal[i%2?3:2]);
 }
 bulb(cells,cx,cy,u>.6?3:2,pal,0,-1);
}
function jet(cells,m,ports,quality){
 const age=Math.max(0,m.age-(m.windup||0));
 const reach=Math.round(Math.min(quality==='low'?18:32,age*50));
 if(reach<1)return;
 const v=unit(m),pal=PAL.water,half=quality==='low'?3:5;
 for(const p of ports||[]){
  const [sx,sy]=grid(p.x,p.y);
  for(let i=0;i<reach;i++){
   const wob=i%7===3?1:0;
   for(let y=-half-wob;y<=half+wob;y++){
    const ay=Math.abs(y);
    const color=ay<=1?pal[4]:ay<=2?pal[3]:ay<half?pal[2]:pal[0];
    place(cells,sx+Math.round(i*v.x-y*v.y),sy+Math.round(i*v.y+y*v.x),color);
   }
  }
  bulb(cells,sx+Math.round(v.x*3),sy+Math.round(v.y*3),4,pal,v.x,v.y);
  bulb(cells,sx+Math.round(v.x*reach),sy+Math.round(v.y*reach),3,pal,v.x,v.y);
 }
}
function surf(cells,m,quality){
 const v=unit(m),pal=PAL.water,step=tickOf(m.age,12);
 const half=22,[ox,oy]=grid(m.x,m.y);
 // Broad bowed wave with a dark trough and a rolling white lip.
 for(let side=-half;side<=half;side++){
  const u=side/half,crest=Math.round(10*(1-u*u)+Math.sin(side*.45-step*.7)*2);
  const tail=-Math.round(9*(1-u*u))-2;
  for(let d=tail;d<=crest;d++){
   const depth=crest-d;
   let color=depth<2?pal[4]:depth<4?pal[3]:depth<7?pal[2]:d<tail+2?pal[0]:pal[1];
   if(depth>5&&depth<11&&(side+step*2)%9<2)color=pal[2];
   const [x,y]=at(ox,oy,v,d,side);place(cells,x,y,color);
  }
 }
 for(let i=-2;i<=2;i++){
  const side=i*8,crest=9-Math.round(i*i*1.4);
  // Curled foam hooks, open on the trailing side.
  for(let k=0;k<12;k++){
   const a=k/12*TAU*.8+step*.12;
   const [x,y]=at(ox,oy,v,crest+Math.cos(a)*3,side+Math.sin(a)*3);
   place(cells,x,y,pal[4]);place(cells,x,y+1,pal[3]);
  }
 }
 for(let i=0;i<(quality==='low'?6:12);i++){
  const side=-24+i*48/(quality==='low'?5:11),d=12+(i*3+step)%7;
  const [x,y]=at(ox,oy,v,d,side);place(cells,x,y,pal[3]);place(cells,x,y-1,pal[4]);
 }
}
const LEAF=['.3.','121','232','.1.'];
function orb(cells,m,quality){
 const pal=PAL.grass,v=unit(m),step=tickOf(m.age,14),r=9;
 const [cx,cy]=grid(m.x,m.y);
 // Filled round seed of energy, with asymmetric light and swirling bands.
 for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){
  const d=Math.hypot(x,y);if(d>r)continue;
  const light=Math.hypot(x+3,y+3);
  const swirl=Math.sin(Math.atan2(y,x)*2+d*.65-step*.6);
  const color=d>r-1?pal[0]:light<3?pal[4]:swirl>.5?pal[3]:light<9?pal[2]:pal[1];
  place(cells,cx+x,cy+y,color);
 }
 const count=quality==='low'?4:6;
 for(let i=0;i<count;i++){
  const a=i/count*TAU+step*.22,rad=13;
  paintBitmap(cells,(cx+Math.cos(a)*rad)*PIXEL,(cy+Math.sin(a)*rad)*PIXEL,Math.cos(a),Math.sin(a),0,LEAF,pal);
  const [x,y]=at(cx,cy,v,-12-i*3,Math.sin(i+step*.3)*4);
  place(cells,x,y,pal[i%2?2:3]);
 }
}
function impact(cells,m){
 const u=clamp((m.age||0)/(m.life||.4),0,1),pal=palOf(m.element);
 const [cx,cy]=grid(m.x,m.y),r=Math.max(2,Math.round((1-u)*4+u*12));
 if(u<.55)stampArt(cells,cx-5,cy,1,0,CRESCENT,pal);
 ring(cells,m.x,m.y,Math.max(3,Math.round(6+u*8)),pal[4]);
 for(let i=0;i<8;i++){
  const a=i/8*TAU+(m.seed||0),len=r+(i%3);
  for(let k=Math.max(0,r-3);k<=len;k++){
   const x=cx+Math.round(Math.cos(a)*k),y=cy+Math.round(Math.sin(a)*k);
   if(m.element==='grass'&&k===len)paintBitmap(cells,x*PIXEL,y*PIXEL,Math.cos(a),Math.sin(a),0,LEAF,pal);
   else place(cells,x,y,k>=len-1?pal[4]:pal[2]);
  }
 }
}
function particle(cells,p){
 const pal=palOf(p.element),v=unit(p),[gx,gy]=grid(p.x,p.y);
 if(p.shape==='leaf')paintBitmap(cells,p.x,p.y,v.x||1,v.y||0,0,LEAF,PAL.grass);
 else if(p.shape==='drop'){place(cells,gx,gy,p.color||PAL.water[3]);place(cells,gx,gy+1,p.color||PAL.water[1]);}
 else if(p.shape==='flame'){place(cells,gx,gy,p.color||PAL.fire[3]);place(cells,gx,gy-1,PAL.fire[4]);place(cells,gx-1,gy,PAL.fire[2]);}
 else if(p.shape==='ring')ring(cells,p.x,p.y,Math.max(2,Math.min(12,Math.round((p.size||8)/PIXEL))),p.color||pal[2]);
 else if(p.shape==='spark'){place(cells,gx,gy,p.color||pal[4]);place(cells,gx-Math.round(v.x),gy-Math.round(v.y),p.color||pal[2]);}
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
 if(w<1||h<1||w>720||h>720)return;
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
  run('jet',g,{...m,ports},q,clamp(1-age/.5,0,1));
 },
 aura:(g,m,q)=>run('aura',g,m,q,1),
 contact:(g,m,q)=>run('contact',g,m,q,1),
 get pixel(){return PIXEL;}
};
})(typeof window==='undefined'?globalThis:window);
