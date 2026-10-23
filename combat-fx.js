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
 const pal=PAL.fire,[ox,oy]=grid(m.x,m.y),variant=m.variant||0;
 // Reference clip 00:35: overlapping round flame lobes grow from a narrow mouth.
 const count=Math.max(3,Math.ceil(len/6));
 for(let i=0;i<=count;i++){
  const d=Math.min(len,i*len/count),u=d/len;
  const sway=Math.sin(i*1.8-step*.7)*u*(variant===2?5:2);
  const radius=Math.max(2,Math.round(2+u*(variant===1?11:9)+Math.sin(i*2-step*.6)));
  const [x,y]=at(ox,oy,v,d,sway);
  // Offset hot interiors make each lobe a licking flame rather than concentric targets.
  for(let yy=-radius;yy<=radius;yy++)for(let xx=-radius;xx<=radius;xx++){
   const rr=xx*xx+yy*yy;if(rr>radius*radius)continue;
   const hot=Math.hypot(xx+v.x*radius*.35+v.y*2,yy+v.y*radius*.35-v.x*2);
   const color=rr>(radius-1)**2?pal[0]:hot<radius*.23?pal[4]:hot<radius*.48?pal[3]:hot<radius*.78?pal[2]:pal[1];
   place(cells,x+xx,y+yy,color);
  }
 }
 for(let i=0;i<(quality==='low'?2:4);i++){
  const d=len*.65+((step*2+i*11)%23),side=(i%2?1:-1)*(9+i%3*3);
  const [x,y]=at(ox,oy,v,d,side);bulb(cells,x,y,2+i%2,pal);
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
 const pal=PAL.electric,step=tickOf(m.age,16),variant=m.variant||0;
 const paths=[pts.map(p=>grid(p.x,p.y))];
 // Short, bent forks rather than perpendicular comb teeth.
 for(let i=1;i<pts.length-1;i+=variant===1?1:variant===2?3:quality==='low'?4:2){
  if(nse(i+step*7)>.65)continue;
  const [x,y]=paths[0][i],prev=paths[0][i-1];
  const dx=x-prev[0],dy=y-prev[1],len=Math.hypot(dx,dy)||1,sign=(i+step)%2?1:-1;
  const nx=-dy/len*sign,ny=dx/len*sign,reach=(variant===1?9:variant===2?16:12)*( .6+nse(i*5+step)*.6);
  paths.push([[x,y],[x+Math.round(nx*7+dx/len*3),y+Math.round(ny*7+dy/len*3)],
   [x+Math.round(nx*(reach-4)-dx/len*2),y+Math.round(ny*(reach-4)-dy/len*2)],
   [x+Math.round(nx*reach+dx/len*4),y+Math.round(ny*reach+dy/len*4)]]);
  if(variant===2)paths.push([[x,y],[x+Math.round(nx*3+dx/len*5),y+Math.round(ny*3+dy/len*5)],
   [x+Math.round(nx*8-dx/len*3),y+Math.round(ny*8-dy/len*3)]]);
 }
 for(let layer=0;layer<3;layer++)for(let p=0;p<paths.length;p++){
  const points=paths[p],r=layer===0?(p?1:2):layer===1?(p?0:1):0;
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
// Ground-plane heading and screen-space height are separate: height never rotates.
function rideLift(age,variant=0){return (variant===1?18:14)+Math.round(Math.sin(tickOf(age,12)*.6));}
function ride(cells,m){
 const v=unit(m),p=PAL.water,[cx,cy]=grid(m.x,m.y),step=tickOf(m.age,12),variant=m.variant||0;
 const lift=rideLift(m.age,variant),width=variant===1?23:variant===2?15:20;
 const project=(a,b,h)=>[cx+Math.round(a*v.x-b*v.y),cy+Math.round((a*v.y+b*v.x)*.28-h)];
 // A curled cross-section is swept across the wave, preserving a hollow breaking lip.
 const profile=[[-34,0],[-25,2],[-17,6],[-9,12],[-2,16],[6,18],[13,17],[18,13],[19,9],[16,6],[12,6],[9,9],[10,12],[7,13],[4,11],[4,7],[8,3],[19,0]];
 const inside=(a,z)=>{let hit=false;for(let i=0,j=profile.length-1;i<profile.length;j=i++){
  const [x,y]=profile[i],[xx,yy]=profile[j];if((y>z)!==(yy>z)&&a<(xx-x)*(z-y)/(yy-y)+x)hit=!hit;
 }return hit;};
 const sections=Array.from({length:width*2+1},(_,i)=>i-width).sort((a,b)=>(a-b)*v.x);
 for(const side of sections){
  const edge=Math.abs(side)/width,taper=.78+.22*Math.sqrt(Math.max(0,1-edge*edge));
  for(let a=-34;a<=19;a++)for(let z=0;z<=18;z++){
   if(!inside(a,z)||Math.abs(side)>width*(.45+.55*Math.sin((a+34)/53*Math.PI)))continue;
   const h=z*taper*lift/16;
   const [x,y]=project(a,side,h);
   const rim=!inside(a,z+1)||!inside(a+1,z);
   let color=z<2?p[0]:edge>.93?p[1]:p[1];
   if(z>7)color=p[2];
   if(rim&&z>12&&a<15)color=p[3];
   if(rim&&z>15)color=p[4];
   if(a>8&&z<11)color=z>7?p[2]:p[0];
   if(!rim&&z>3&&Math.sin(a*.32+z*.45+step*.6+side*.18)>.94)color=p[2];
   place(cells,x,y,color);
  }
 }
 // Broken white curls ride across the top; small irregular gaps reveal the blue body.
 for(let side=-width+2;side<width-1;side++){
  const taper=.78+.22*Math.sqrt(Math.max(0,1-(side/width)**2));
  for(let k=0;k<5;k++){
   const a=7+k,h=(17-Math.max(0,k-1)*.65)*taper*lift/16;
   const [x,y]=project(a,side,h+Math.sin(side*.55+step*.6));
   if((side+step+k)%7!==0)place(cells,x,y,p[k<5?3:4]);
  }
 }
 // Visible hollow at the breaking edge in side views.
 if(Math.abs(v.x)>.45){
  const side=width*.68*Math.sign(v.x),[hx,hy]=project(12,side,10*lift/16);
  for(let y=-5;y<=5;y++)for(let x=-5;x<=5;x++){
   const d=x*x+y*y;if(d>25)continue;
   if(d<10)place(cells,hx+x,hy+y,p[0]);
   else if(y<0||x*v.x>0)place(cells,hx+x,hy+y,d>18?p[3]:p[2]);
  }
 }
 for(let i=0;i<14;i++){
  const [x,y]=project(12+(i%3)*3,-width+i*width*2/13,1+(i+step)%2);
  if(i%3!==0){place(cells,x,y,p[3]);place(cells,x+1,y,p[4]);}
 }
 // Broken wake ribbons and kicked-up drops, moving away from the rider.
 for(const b of [-width+3,width-3])for(let a=-40;a<-19;a++){
  const [x,y]=project(a,b+Math.sin(a*.3+step*.6)*2,1);
  if((a+step)%6!==0)place(cells,x,y,p[(a+step)%3?2:3]);
 }
 for(let i=0;i<8;i++){
  const [x,y]=project(5+(i*3+step)%14,(i%2?1:-1)*(width+2+i%3),4+(step+i*2)%7);
  place(cells,x,y,p[3]);place(cells,x,y-1,p[4]);
 }
}
function rideFoam(cells,m){
 const [cx,cy]=grid(m.x,m.y),h=rideLift(m.age,m.variant||0),step=tickOf(m.age,12);
 // Tiny contact splashes overlap the feet, joining the sprite to the water surface.
 for(let x=-10;x<=10;x++){
  const y=cy-h+1+Math.round(Math.abs(x)/7);
  if(Math.abs(x)>5||(x+step)%5===0){place(cells,cx+x,y,PAL.water[3]);place(cells,cx+x,y+1,PAL.water[2]);}
 }
}
function surf(cells,m){ride(cells,m);}
const LEAF=['.3.','121','232','.1.'];
function orb(cells,m,quality){
 const pal=PAL.grass,v=unit(m),step=tickOf(m.age,14),variant=m.variant||0,r=variant===1?11:variant===2?8:9;
 const [cx,cy]=grid(m.x,m.y);
 // Filled round seed of energy, with asymmetric light and swirling bands.
 for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){
  const d=Math.hypot(x,y);if(d>r)continue;
  const light=Math.hypot(x+3,y+3);
  const lobes=variant===1?3:variant===2?5:2;
  const swirl=Math.sin(Math.atan2(y,x)*lobes+d*(variant===2?1.1:.65)-step*(variant===2?1:.6));
  const color=d>r-1?pal[0]:light<2.5?pal[4]:swirl>.82&&d<r-2?pal[3]:light<r*.75?pal[2]:pal[1];
  place(cells,cx+x,cy+y,color);
 }
 const count=variant===2?10:quality==='low'?4:6;
 for(let i=0;i<count;i++){
  const a=i/count*TAU+step*(variant===2?.38:.22),rad=variant===1?16:13;
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
 flame,thunder:bolt,orb,surf,ride,rideFoam,impact,projectile,charge,aura,particle,
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
 ride:(g,m,q)=>run('ride',g,m,q,1),
 rideFoam:(g,m,q)=>run('rideFoam',g,m,q,1),
 rideLift,
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
