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
 // One continuous plume: only its outside edge is outlined, never individual lobes.
 for(let d=0;d<=len+7;d++){
  const u=Math.min(1,d/len),phase=d*.19-step*.85;
  const center=Math.sin(d*.11-step*.55)*u*(variant===2?3:1.5);
  const half=1.8+u*(variant===1?12:9)+Math.sin(phase)*u*1.6;
  for(let side=-15;side<=15;side++){
   const across=(side-center)/half;
   // Unequal pointed tongues break the end of the stream into a ragged flame front.
   const end=len-5+Math.sin(side*.7+step*.45)*6-Math.abs(across)*4;
   const taper=Math.min(1,Math.max(0,(end-d)/12));
   const width=half*taper;if(width<.4||Math.abs(side-center)>width)continue;
   const edge=Math.abs(side-center)/width;
   const ribbon=Math.abs(side-center-Math.sin(d*.14-step*.7)*u*2)/width;
   let color=edge>.94?pal[0]:edge>.77?pal[1]:ribbon>.56?pal[2]:pal[3];
   if(ribbon<.19&&d<len*.82)color=pal[4];
   if(u>.45&&edge>.5&&Math.sin(d*.22-step*.9+side*.6)>.6)color=pal[1];
   if(u>.3&&Math.sin(d*.16-side*.9-step*.8)>.78&&edge<.7)color=pal[2];
   const [x,y]=at(ox,oy,v,d,side);place(cells,x,y,color);
  }
 }
 for(let i=0;i<(quality==='low'?2:5);i++){
  const d=len*.65+(i*13+step*3)%Math.max(8,len*.35),side=(i%2?1:-1)*(7+i%3*2);
  for(let k=0;k<3+i%3;k++){
   const [x,y]=at(ox,oy,v,d+k,side+Math.sin(k*.6+step)*.8);
   place(cells,x,y,pal[k<2?2:3]);
  }
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
  if(p&&layer===2&&(p+step)%3===0)continue;
  for(let i=1;i<points.length;i++){
   const seg=linePoints(...points[i-1],...points[i]);
   for(let k=0;k<seg.length;k+=2)for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){
    if(Math.abs(x)+Math.abs(y)>r)continue;
    place(cells,seg[k]+x,seg[k+1]+y,pal[layer===0?1:layer===1?2:4]);
   }
  }
 }
 const [hx,hy]=paths[0].at(-1);
 // Champions Thunderbolt surrounds the target with angular arcs, not a radial star.
 for(let i=0;i<(quality==='low'?4:7);i++){
  const a=i*TAU/7+step*.08,reach=13+nse(i+step)*8;
  const points=[[hx,hy]];
  for(let j=1;j<=4;j++){
   const angle=a+(nse(i*9+j+step*3)-.5)*.7,r=reach*j/4;
   points.push([hx+Math.round(Math.cos(angle)*r),hy+Math.round(Math.sin(angle)*r)]);
  }
  for(let j=1;j<points.length;j++){
   const line=linePoints(...points[j-1],...points[j]);
   for(let k=0;k<line.length;k+=2){place(cells,line[k]+1,line[k+1],pal[2]);place(cells,line[k],line[k+1],pal[j<3?4:3]);}
  }
 }
}
function aura(cells,m){
 const pal=palOf(m.element||'electric'),step=tickOf(m.age,12),[cx,cy]=grid(m.x,m.y);
 for(let arc=0;arc<3;arc++){
  let last=null;
  for(let i=0;i<7;i++){
   const a=arc*TAU/3+i*.19+step*.15,r=9+(i%2?3:0)+nse(step+arc)*2;
   const pt=[cx+Math.round(Math.cos(a)*r),cy+Math.round(Math.sin(a)*r)];
   if(last){const seg=linePoints(...last,...pt);for(let k=0;k<seg.length;k+=2)place(cells,seg[k],seg[k+1],pal[i%3?2:4]);}
   last=pt;
  }
 }
}
// Basic cores fit 14 x 9 cells, with a sparse short tail distinct from signatures.
const BASIC_ART={
 electric:[
  ['..........3...','.....3...35...','.....53.35....','..23345554332.','......35.53...','.....35...3...','.....3........'],
  ['......3.......','......53...3..','.......35.35..','..23345554332.','.....35...53..','....35.....3..','....3.........']
 ],
 fire:[
  ['..............','..2....111....','...21.123321..','.122312344321.','1233344554321.','..12334554321.','...221234321..','.2....12321...','.......111....'],
  ['..............','.......111....','.2....123321..','...2212344321.','1233344554321.','.122334554321.','...21.123321..','..2....121....','..............']
 ],
 water:[
  ['..............','........111...','...3..1124431.','..123123455431','12333445555431','..123123433321','...3..1123321.','........111...','..............'],
  ['..............','.......1111...','..3...1234441.','...12323455431','12333445555431','...12323433321','..3...1233321.','.......1111...','..............']
 ],
 grass:[
  ['..........11..','.......11131..','.....1123431..','...112344321..','.1123443321...','1234433221....','..1112211.....','....111.......','..............'],
  ['..............','....111.......','..1112211.....','1234433221....','.1123443321...','...112344321..','.....1123431..','.......11131..','..........11..']
 ]
};
function projectile(cells,m){
 if((m.delay||0)>0)return;
 const v=unit(m),pal=palOf(m.element),[gx,gy]=grid(m.x,m.y);
 const step=tickOf(m.age??((m.pulse||0)/8),12);
 const frames=BASIC_ART[m.element],art=frames?frames[step%2]:['..1..','.232.','12341','.232.','..1..'];
 const half=Math.floor(art[0].length/2);
 // Short authored afterimages replace frame-rate-dependent random basic-shot particles.
 for(let i=0;i<3;i++){
  const d=-8-i*3,side=Math.sin(step*.8+i)*.8;
  const [x,y]=at(gx,gy,v,d,side);
  if(m.element==='water'){
   place(cells,x,y,pal[i?2:3]);if(i===0)place(cells,x,y+1,pal[1]);
  }else if(m.element==='fire'){
   place(cells,x,y,pal[i?1:3]);if(i===0)place(cells,x,y-1,pal[2]);
  }else if(m.element==='electric'){
   const [xx,yy]=at(gx,gy,v,d+1,side+(step%2?1:-1));place(cells,x,y,pal[i?2:3]);place(cells,xx,yy,pal[2]);
  }else if(m.element==='grass'&&i<2){place(cells,x,y,pal[2]);place(cells,x+1,y,pal[1]);}
 }
 stampArt(cells,gx-Math.round(half*v.x),gy-Math.round(half*v.y),v.x,v.y,art,pal);
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
function rideLift(age,variant=0){return (variant===1?6:4)+Math.round(Math.sin(tickOf(age,12)*.6));}
function ride(cells,m){
 const v=unit(m),p=['#135e9c','#169ed1','#68d9ed','#c9faff','#ffffff'],[cx,cy]=grid(m.x,m.y),step=tickOf(m.age,12),variant=m.variant||0;
 const lift=rideLift(m.age,variant),width=variant===1?25:variant===2?17:22;
 // High camera: show the surface plane, with very little visible vertical face.
 const project=(a,b,h)=>[cx+Math.round(a*v.x-b*v.y),cy+Math.round((a*v.y+b*v.x)*.78-h)];
 for(let a=-35;a<=20;a++)for(let b=-width;b<=width;b++){
  const front=17-Math.pow(Math.abs(b)/width,3)*7+Math.sin(b*.35+step*.4);
  const rear=-34+Math.abs(b)*.36+Math.sin(b*.53+step*.45)*2;
  const bank=width*(.8+.2*Math.cos((a+6)*.045))+Math.sin(a*.27-step*.6)*1.2;
  if(a>front||a<rear||Math.abs(b)>bank)continue;
  const edge=Math.abs(b)/bank,depth=front-a;
  const h=lift*Math.max(0,1-Math.abs(a)/39);
  const [x,y]=project(a,b,h);
  let color=depth<3?p[3]:depth<7?p[2]:edge>.94?p[0]:p[1];
  const foam=Math.sin(b*1.3+step*.7)+Math.sin(a*.8-b*.4-step*.5);
  if(depth<6&&foam>.4)color=p[4];
  if(depth>8&&Math.sin(a*.31+b*.29-step*.65)>.8&&Math.sin(a*.15-b*.4)>.1)color=p[2];
  if(a< -15&&((b+Math.round(Math.sin(a*.16)*3))%7<2))color=p[2];
  if(Math.sin(a*.25+b*.17-step*.65)>.9&&a>-17&&depth>7)color=p[2];
  if(depth<2&&(b+step)%5!==0)color=p[4];
  // Rear edge dissolves into separate streaks rather than closing an oval outline.
  if(a< -25&&(b+step)%6>2)continue;
  place(cells,x,y,color);
 }
 // Two travelling foam bands across the water, with the rider between them.
 for(const row of [-15,11])for(let b=-width+3;b<width-2;b++){
  const a=row-Math.abs(b)*.16+Math.sin(b*.33+step*.5)*1.3;
  const [x,y]=project(a,b,lift);
  if((b+step)%7<4){place(cells,x,y,p[3]);if(row>0)place(cells,x,y+1,p[2]);}
 }
 for(const b of [-width+3,width-3])for(let a=-48;a<-25;a++){
  const [x,y]=project(a,b+Math.sin(a*.25+step*.5)*1.5,0);
  if((a+step)%7<5)place(cells,x,y,p[(a+step)%3?2:3]);
 }
 for(let i=0;i<8;i++){
  const [x,y]=project(10+(step+i*3)%13,(i%2?1:-1)*(width+i%3),1);
  place(cells,x,y,p[3]);if(i%2)place(cells,x+1,y,p[4]);
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
 const p=PAL.grass,v=unit(m),step=tickOf(m.age,14),variant=m.variant||0,r=variant===1?11:9;
 const [cx,cy]=grid(m.x,m.y);
 // Champions: white-green nucleus inside a vivid green envelope, with fine energy tendrils.
 for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){
  const d=Math.hypot(x,y);if(d>r)continue;
  const light=Math.hypot(x+1,y+1),band=Math.sin(Math.atan2(y,x)*3-d*.4+step*.6);
  const color=d>r-1?(y>1?p[0]:p[1]):light<r*.27?p[4]:light<r*.49?p[3]:band>.7?p[3]:y>r*.5?p[1]:p[2];
  place(cells,cx+x,cy+y,color);
 }
 const count=quality==='low'?3:5;
 for(let i=0;i<count;i++){
  const angle=i/count*TAU+step*.12,reach=12+(i+step)%3;
  let last=null;
  for(let d=r-1;d<reach;d++){
   const a=angle+Math.sin(d*.45-step*.5)*.22;
   const pt=[cx+Math.round(Math.cos(a)*d),cy+Math.round(Math.sin(a)*d)];
   if(last){const points=linePoints(...last,...pt);for(let k=0;k<points.length;k+=2)place(cells,points[k],points[k+1],d<r+2?p[3]:p[2]);}
   last=pt;
  }
  if(variant===2&&i%2===0)paintBitmap(cells,last[0]*PIXEL,last[1]*PIXEL,Math.cos(angle),Math.sin(angle),0,LEAF,p);
 }
 for(let i=0;i<20;i++){
  const a=i*.12+step*.2,rr=r+3;
  for(const sign of [-1,1]){
   const x=cx+Math.round(Math.cos(a)*rr)*sign,y=cy+Math.round(Math.sin(a)*rr*.6)*sign;
   if(i%5!==0)place(cells,x,y,p[i<6?3:2]);
  }
 }
 for(let i=0;i<7;i++){
  const [x,y]=at(cx,cy,v,-r-3-i*3,Math.sin(i*.9-step*.5)*(2+i*.3));
  place(cells,x,y,i<2?p[3]:p[2]);
 }
}
function impact(cells,m){
 const u=clamp((m.age||0)/(m.life||.4),0,1),pal=palOf(m.element);
 const [cx,cy]=grid(m.x,m.y),r=Math.max(2,Math.round((1-u)*4+u*12));
 if(m.element==='grass'){
  const core=Math.max(1,Math.round((1-u)*8));
  for(let y=-core;y<=core;y++)for(let x=-core;x<=core;x++)if(x*x+y*y<core*core)place(cells,cx+x,cy+y,pal[u<.28?4:3]);
 }else if(u<.55)stampArt(cells,cx-5,cy,1,0,CRESCENT,pal);
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
