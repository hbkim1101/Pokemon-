/* Arena combat renderer v32.
 * One effect cell equals one character sprite pixel. Shapes are dense
 * overlapping bulbs with a crescent highlight, matching the Big Kid Nation
 * gameplay clip: a turbulent mass, not a row of outlined coins. */
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
function unit(m){const d=Math.hypot(m.vx||0,m.vy||0)||1;return {x:(m.vx||1)/d,y:(m.vy||0)/d};}
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
function bulb(cells,gx,gy,r,pal,dirx,diry){
 r=Math.max(2,r|0);
 let dx=dirx||1,dy=diry||0;const mag=Math.hypot(dx,dy)||1;dx/=mag;dy/=mag;
 const rx=r,ry=Math.max(2,Math.round(r*.84)),pad=r+2;
 for(let y=-pad;y<=pad;y++)for(let x=-pad;x<=pad;x++){
  const along=x*dx+y*dy,side=-x*dy+y*dx;
  const e=(along*along)/(rx*rx)+(side*side)/(ry*ry);
  if(e>1.16)continue;
  if(e>0.82){place(cells,gx+x,gy+y,pal[0]);continue;}
  const back=-along;
  const crescent=back>rx*.1&&back<rx*.92&&Math.abs(side)<ry*.72;
  let color=back>0?pal[2]:pal[1];
  if(crescent&&back>rx*.5&&Math.abs(side)<ry*.32)color=pal[4];
  else if(crescent&&back>rx*.22)color=pal[3];
  place(cells,gx+x,gy+y,color);
 }
}
function at(ox,oy,v,alongPx,sidePx){
 return [ox+Math.round(alongPx*v.x-sidePx*v.y),oy+Math.round(alongPx*v.y+sidePx*v.x)];
}
function flame(cells,m,quality){
 const L=m.renderStream??m.stream??0;
 const len=Math.max(0,Math.round(L/PIXEL));
 if(len<1)return;
 const v=unit(m),t=Math.max(0,m.age-(m.windup||0)),step=tickOf(t,11);
 const pal=PAL.fire,[ox,oy]=grid(m.x,m.y);
 const maxR=quality==='low'?9:16;
 let d=2,i=0;
 while(d<len&&i<90){
  const u=d/Math.max(1,len);
  const base=3+Math.round(Math.pow(u,.72)*maxR);
  const rows=u<.16?1:u<.38?2:(quality==='low'?2:2+(nse(i*3+step)>.42?1:0));
  for(let row=0;row<rows;row++){
   const j=i*11+row*17+step*5;
   const rad=Math.max(3,base+Math.round((nse(j)-.4)*base*.7));
   const alongPx=d+Math.round((nse(j+3)-.5)*rad*.9);
   const side=Math.round((row-(rows-1)/2)*rad*1.05+(nse(j+6)-.5)*rad*.65);
   if(alongPx<1)continue;
   const [gx,gy]=at(ox,oy,v,alongPx,side);
   bulb(cells,gx,gy,rad,pal,v.x,v.y);
  }
  if(quality!=='low'&&nse(i+step*2)>.62){
   const spark=2+Math.round(nse(i+4)*2);
   const [sx,sy]=at(ox,oy,v,d+Math.round(nse(i+8)*8),Math.round((nse(i+1)-.5)*(base+8)));
   bulb(cells,sx,sy,spark,pal,v.x,v.y);
  }
  d+=Math.max(5,Math.round(base*(quality==='low'?.7:.48)));
  i++;
 }
 if(m.contact){
  const c=m.contact,[cx,cy]=grid(c.x,c.y),p=c.steam?PAL.water:pal;
  bulb(cells,cx,cy,quality==='low'?6:9,p,v.x,v.y);
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
 const pal=PAL.electric,step=tickOf(m.age,14),wide=quality==='low'?2:3;
 const gpts=pts.map(p=>grid(p.x,p.y));
 const drawn=[];
 for(let i=1;i<gpts.length;i++){
  const seg=linePoints(gpts[i-1][0],gpts[i-1][1],gpts[i][0],gpts[i][1]);
  const horiz=Math.abs(gpts[i][0]-gpts[i-1][0])>=Math.abs(gpts[i][1]-gpts[i-1][1]);
  for(let k=0;k<seg.length;k+=2){
   const x=seg[k],y=seg[k+1];
   drawn.push(x,y,horiz);
   for(let w=-wide;w<=wide;w++){
    const px=horiz?x:x+w,py=horiz?y+w:y;
    const color=w===0?pal[4]:Math.abs(w)===1?pal[3]:Math.abs(w)===wide?pal[0]:pal[2];
    place(cells,px,py,color);
   }
  }
 }
 if(quality!=='low'){
  for(let i=0;i<drawn.length;i+=3){
   if((i/3+step)%6!==2)continue;
   const x=drawn[i],y=drawn[i+1],horiz=drawn[i+2],dir=(i+step)%2?1:-1,span=4+(i%5);
   for(let s=1;s<=span;s++){
    const px=x+(horiz?0:dir*s),py=y+(horiz?dir*s:0);
    place(cells,px,py,s===span?pal[4]:s>span-2?pal[3]:pal[2]);
    if(s>2&&s<span-1)place(cells,px+(horiz?1:0),py+(horiz?0:1),pal[0]);
   }
  }
 }
 const head=gpts.at(-1);
 bulb(cells,head[0],head[1],quality==='low'?4:6,pal,0,-1);
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
 bulb(cells,gx,gy,2,pal,v.x,v.y);
 for(let i=1;i<=3;i++){
  const side=((step+i)%3)-1;
  place(cells,gx+Math.round((-2-i)*v.x-side*v.y),gy+Math.round((-2-i)*v.y+side*v.x),i===1?pal[3]:pal[1]);
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
 const v=unit(m),pal=PAL.water,step=tickOf(m.age,8);
 const half=quality==='low'?16:28,[ox,oy]=grid(m.x,m.y);
 for(let s=-half;s<=half;s++){
  const n=Math.abs(s)/half;
  const lump=Math.round(Math.sin(s*.55+step)*.9);
  const crest=Math.round((1-n*n)*12)+lump;
  const tail=Math.round((1-n*n)*16);
  for(let a=-tail;a<=crest;a++){
   let color=pal[1];
   if(a>=crest-1&&(s+step)%2===0)color=pal[4];
   else if(a>=crest-3)color=pal[3];
   else if(a>=0)color=pal[2];
   else if(a<-tail+2)color=pal[0];
   const [gx,gy]=at(ox,oy,v,a,s);
   place(cells,gx,gy,color);
  }
 }
 const gap=quality==='low'?9:6;
 for(let s=-half+3;s<half;s+=gap){
  const n=Math.abs(s)/half,crest=Math.round((1-n*n)*10);
  const r=Math.max(4,Math.round((quality==='low'?5:8)*(1-n*.35)));
  const [gx,gy]=at(ox,oy,v,crest-1,s);
  bulb(cells,gx,gy,r,pal,v.x,v.y);
 }
}
const LEAF=['.3.','121','232','.1.'];
function orb(cells,m,quality){
 const pal=PAL.grass,v=unit(m),step=tickOf(m.age,9),r=quality==='low'?8:12;
 const [cx,cy]=grid(m.x,m.y);
 bulb(cells,cx,cy,r,pal,v.x,v.y);
 const count=quality==='low'?5:8;
 for(let i=0;i<count;i++){
  const a=(i+step*.2)/count*TAU,rad=r+4;
  paintBitmap(cells,(cx+Math.cos(a)*rad)*PIXEL,(cy+Math.sin(a)*rad)*PIXEL,Math.cos(a),Math.sin(a),0,LEAF,pal);
  if(i%2===0){
   const er=3;
   bulb(cells,cx+Math.round(Math.cos(a)*(r+2)),cy+Math.round(Math.sin(a)*(r+2)),er,pal,Math.cos(a),Math.sin(a));
  }
 }
 for(let i=1;i<=5;i++){
  const [tx,ty]=at(cx,cy,v,-r-i-1,(i%2?1:-1));
  place(cells,tx,ty,i<3?pal[3]:pal[1]);
 }
}
function impact(cells,m){
 const u=clamp((m.age||0)/(m.life||.4),0,1),pal=palOf(m.element);
 const [cx,cy]=grid(m.x,m.y),r=Math.max(2,Math.round((1-u)*4+u*12));
 if(u<.45)bulb(cells,cx,cy,Math.max(3,Math.round((1-u/.45)*7)),pal,0,-1);
 ring(cells,m.x,m.y,r,pal[3]);
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
