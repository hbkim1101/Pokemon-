/* Shared pixel combat art: stepped animation, hard outlines and sprite-sized cells. */
(function(root){
'use strict';
let PIXEL=1.43;
const TAU=Math.PI*2;
const PAL={
 fire:['#9c2921','#e74921','#ff8429','#ffce52','#fff7bd'],
 water:['#294a9c','#427be7','#73bdff','#c6efff','#ffffff'],
 grass:['#315a29','#52a539','#94d64a','#d6ef84','#f7ffce'],
 electric:['#9c6321','#e7a529','#ffde42','#fff794','#ffffff'],
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
// BW2 flame particles overlap into a turbulent stream, with red rims and yellow lobes.
function fireCloud(cells,cx,cy,v,r,step,seed=0){
 const p=['#b72c1080','#d7330b','#f76308','#ff9c0c','#ffd431'];
 for(let x=-r-2;x<=r+2;x++)for(let y=-r-2;y<=r+2;y++){
  const angle=Math.atan2(y,x),edge=r*(.85+.17*Math.sin(angle*5+seed+step*.6)+.12*Math.cos(angle*3-step*.45));
  const d=Math.hypot(x,y);if(d>edge)continue;
  // Offset hot pockets merge across the particle edges instead of concentric coin rings.
  const hx=x+r*.22+Math.sin(y*.55+step*.8+seed)*r*.24;
  const heat=Math.hypot(hx,y+r*.12+Math.cos(x*.5-step*.7)*r*.18);
  const shade=d>edge-.7?(x< -r*.45?1:0):heat<r*.32?4:heat<r*.62?3:heat<r*.85?2:1;
  const [px,py]=at(cx,cy,v,x,y);place(cells,px,py,p[shade]);
 }
}
function flame(cells,m,quality){
 const len=Math.round((m.renderStream??m.stream??0)/PIXEL);if(len<1)return;
 const v=unit(m),[ox,oy]=grid(m.x,m.y),step=tickOf(Math.max(0,m.age-(m.windup||0)),16);
 const spacing=7,offset=(step*2)%spacing;
 for(let d=offset;d<len;d+=4+Math.round(d/Math.max(1,len)*7)){
  const u=d/Math.max(1,len),r=Math.round(3+u*(m.variant===1?10:8)+(nse(Math.floor(d/7)+step)-.5)*u*2);
  const [x,y]=at(ox,oy,v,d,Math.round(Math.sin(d*.33-step*.7)*u*3));
  fireCloud(cells,x,y,v,r,step,Math.floor(d/spacing)*1.7);
 }
 if(m.contact){
  const [x,y]=grid(m.contact.x,m.contact.y);
  if(m.contact.steam)bulb(cells,x,y,6,PAL.water);
  else fireCloud(cells,x,y,v,11,step,3);
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
function lightningStroke(cells,points,strong,step){
 for(let i=1;i<points.length;i++){
  const seg=linePoints(...points[i-1],...points[i]);
  for(let k=0;k<seg.length;k+=2){
   const x=seg[k],y=seg[k+1];
   if(strong){place(cells,x-1,y,'#b7b02e');place(cells,x+1,y,'#dfe54b');}
   place(cells,x,y,step%3?'#f1ff86':'#ffffff');
  }
 }
}
function bolt(cells,m,quality){
 const pts=m.path||[];if(pts.length<2)return;
 const source=m.source||pts[0],start=grid(source.x,source.y),age=Math.max(0,m.age-(m.windup||0)),step=tickOf(age,16);
 const route=[start,...pts.map(p=>[p.x/PIXEL,p.y/PIXEL])],segments=[],points=[start];
 let total=0;
 // Resample by distance, not by simulation tick or incoming control-point count.
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  if(length<.00001)continue;
  segments.push({a,dx,dy,length,from:total});total+=length;
 }
 let segment=0,sample=0;
 for(let distance=6;distance<total-1;distance+=6){
  while(segment+1<segments.length&&distance>segments[segment].from+segments[segment].length)segment++;
  const part=segments[segment],u=(distance-part.from)/part.length;
  const taper=Math.min(1,distance/10,(total-distance)/10);
  const side=(sample%2?1:-1)*(2+nse(step*13+sample*17)*3.5)*taper;
  points.push([Math.round(part.a[0]+part.dx*u-part.dy/part.length*side),
   Math.round(part.a[1]+part.dy*u+part.dx/part.length*side)]);sample++;
 }
 points.push(grid(pts.at(-1).x,pts.at(-1).y));
 // The body crackle and forward stroke share an origin, so the bolt never floats away.
 aura(cells,{x:source.x,y:source.y,age,element:'electric'});
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],seg=linePoints(...a,...b),vertical=Math.abs(b[1]-a[1])>Math.abs(b[0]-a[0]);
  for(let j=0;j<seg.length;j+=2){
   const x=seg[j],y=seg[j+1];
   place(cells,x+(vertical?1:0),y+(vertical?0:1),'#dfe54b');
   place(cells,x-(vertical?1:0),y-(vertical?0:1),'#b7b02e');
   place(cells,x,y,'#f8ffb1');
  }
  if(i>1&&i%(quality==='low'?7:4)===step%3){
   const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,sign=i%2?1:-1;
   const nx=-dy/len*sign,ny=dx/len*sign;
   lightningStroke(cells,[a,[a[0]+Math.round(nx*5+dx/len*2),a[1]+Math.round(ny*5+dy/len*2)],
    [a[0]+Math.round(nx*9),a[1]+Math.round(ny*9)]],false,step);
  }
 }
 const [cx,cy]=points.at(-1),r=m.type==='boltEcho'?6:3+step%2;
 for(let i=0;i<8;i++){
  const a=i*TAU/8+step*.1;
  lightningStroke(cells,[[cx,cy],[cx+Math.round(Math.cos(a)*r),cy+Math.round(Math.sin(a)*r)]],false,step);
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
function projectile(cells,m){
 if((m.delay||0)>0)return;
 const v=unit(m),[gx,gy]=grid(m.x,m.y),step=tickOf(m.age??((m.pulse||0)/8),16);
 if(m.element==='electric'){
  const points=[[-2,-8],[1,-5],[-1,-2],[2,0],[-1,3],[1,7]].map(([x,y],i)=>[gx+x+(i%2?step%2:0),gy+y]);
  lightningStroke(cells,points,true,step);return;
 }
 if(m.element==='water'){
  // White-blue droplets merge into a short narrow water jet.
  for(let i=3;i>=0;i--){
   const d=5-i*5,rad=i===3?2:3;
   for(let x=-rad;x<=rad;x++)for(let y=-rad;y<=rad;y++){
    if(x*x+y*y>rad*rad)continue;
    const [px,py]=at(gx,gy,v,d+x,y+Math.round(Math.sin(step*.7+i)));
    const light=Math.hypot(x+1,y+1);
    place(cells,px,py,light<1.5?'#ffffff':light<2.8?'#b6efff':x*x+y*y>rad*rad-2?'#258bcc':'#6dcfff');
   }
  }return;
 }
 if(m.element==='fire'){
  const art=step%2?['....2....','....32...','...232...','..23432..','..345432.','.2345432.','..23432..','...232...','....2....']:['.....2...','....23...','...2332..','..23432..','.2345432.','.2345432.','..23432..','...232...','....2....'];
  stampArt(cells,gx-4,gy,1,0,art,['#9b310f','#e75010','#ff9a16','#ffce3d','#fff29b']);
  for(let i=0;i<3;i++){const [x,y]=at(gx,gy,v,-7-i*3,(step+i)%3-1);place(cells,x,y,'#ed8626');}
  return;
 }
 if(m.element==='grass'){
  const leaf=['....22.','..23342','.234432','123332.','.122...'];
  for(let i=0;i<3;i++){
   const [x,y]=at(gx,gy,v,4-i*6,Math.round(Math.sin(step*.5+i*2)*3));
   const a=Math.atan2(v.y,v.x)+Math.sin(step*.6+i)*.65;
   stampArt(cells,x-3,y,Math.cos(a),Math.sin(a),leaf,['#355e1e','#548d22','#8cbd39','#c4dc63']);
  }return;
 }
 stampArt(cells,gx-2,gy,v.x,v.y,['..1..','.232.','12341','.232.','..1..'],PAL.neutral);
}

function charge(cells,m){
 const pal=palOf(m.element),u=clamp((m.age||0)/(m.windup||.18),0,1),step=tickOf(m.age,16),[cx,cy]=grid(m.x,m.y);
 if(m.element==='grass'&&(m.windup||0)<=.12){
  for(let i=0;i<4;i++){const a=i*TAU/4+step*.6;stampArt(cells,cx+Math.round(Math.cos(a)*7),cy+Math.round(Math.sin(a)*5),1,0,LEAF,PAL.grass);}
 }else if(m.element==='grass'){
  energySphere(cells,cx,cy,Math.round(3+u*7),step);
  for(let i=0;i<4;i++){const a=i*TAU/4+step*.4,r=14*(1-u)+4;place(cells,cx+Math.round(Math.cos(a)*r),cy+Math.round(Math.sin(a)*r),'#d9fa81');}
 }else if(m.element==='electric'){
  for(let i=0;i<2;i++)lightningStroke(cells,[[cx-7+i*14,cy-5],[cx-4+i*8,cy-1],[cx-7+i*14,cy+4]],false,step);
 }else for(let i=0;i<4;i++){
  const a=i*TAU/4+step*.4,r=5*(1-u)+2;
  place(cells,cx+Math.round(Math.cos(a)*r),cy+Math.round(Math.sin(a)*r),pal[2]);
 }
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
 const v=unit(m),p=['#1262af','#188bd5','#49b5ed','#a2e8ff','#f2ffff'],[cx,cy]=grid(m.x,m.y),step=tickOf(m.age,16);
 const lift=rideLift(m.age,m.variant||0),width=m.variant===1?34:m.variant===2?23:29;
 const project=(a,b,h)=>[cx+Math.round(a*v.x-b*v.y),cy+Math.round((a*v.y+b*v.x)*.78-h)];
 // Broad sheet of water, shallow crests and broken interlocking white foam as in BW2 Surf.
 for(let a=-40;a<=24;a++)for(let b=-width;b<=width;b++){
  const front=21-Math.pow(Math.abs(b)/width,4)*5+Math.sin(b*.29-step*.25)*1.5;
  const bank=width-2+Math.sin(a*.2+step*.2)*2;
  if(a>front||Math.abs(b)>bank||a< -38+Math.sin(b*.4)*2)continue;
  const phase=((a+step*1.5+Math.sin(b*.28)*2)%15+15)%15;
  const crest=phase<1.6,h=lift+Math.max(0,3-phase)*.6;
  const [x,y]=project(a,b,h),edge=front-a;
  let color=a< -25?p[0]:p[1];
  if(phase<4)color=p[2];
  if(crest)color=p[3];
  if(phase<.8&&((b+50+Math.floor(a/5))%9)<5)color=p[4];
  // Interlocking foam bridges break the surface into rippling patches.
  const bridge=((b+Math.round(Math.sin(a*.27)*2)+60)%11+11)%11;
  if(phase>3&&phase<11&&bridge<1.2)color=p[2];
  if(phase>4&&phase<8&&bridge<.8&&(Math.floor(a/15)+Math.floor(b/11))%2===0)color=p[3];
  if(edge<2)color=p[3];
  if(edge<1&&((b+30)%5)<3)color=p[4];
  if(a< -33&&(b+40)%7>3)continue;
  place(cells,x,y,color);if(Math.abs(v.x*v.y)>.2)place(cells,x+1,y,color);
 }
 // Small forked foam tips, rather than long ornamental wake tendrils.
 for(let i=0;i<9;i++){
  const b=(i-4)*6,a=20-Math.abs(b)*.14;
  const [x,y]=project(a,b,lift+1+(step+i)%4);
  place(cells,x,y,p[4]);place(cells,x,y-1,p[3]);if(i%2)place(cells,x+1,y-2,p[4]);
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
// BW2 Energy Ball is a translucent green sphere with orbiting rings, not a solid leaf orb.
function energySphere(cells,cx,cy,r,step){
 const p=['#246d1a','#47a621','#8bd52b','#b9e947','#e4ff9b'];
 for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){
  const d=Math.hypot(x,y);if(d>r)continue;
  if(d>r-1.1)place(cells,cx+x,cy+y,p[2]);
  else if(d>r-2.1)place(cells,cx+x,cy+y,p[0]);
  else if(Math.sin(x*.5+y*.3+step*.45)>.4)place(cells,cx+x,cy+y,'#387c2380');
 }
 for(let orbit=0;orbit<3;orbit++){
  const turn=orbit*1.05+step*.14,co=Math.cos(turn),si=Math.sin(turn);
  let previous=null;
  for(let i=0;i<=44;i++){
   const a=i/44*TAU,xx=Math.cos(a)*(r-1),yy=Math.sin(a)*(r*.48);
   const pt=[cx+Math.round(xx*co-yy*si),cy+Math.round(xx*si+yy*co)];
   if(previous){const line=linePoints(...previous,...pt);for(let j=0;j<line.length;j+=2)place(cells,line[j],line[j+1],p[(i+orbit*5)%16<5?3:1]);}
   previous=pt;
  }
 }
 const a=step*.4;for(let i=0;i<3;i++){
  const x=cx+Math.round(Math.cos(a+i*2.1)*r*.5),y=cy+Math.round(Math.sin(a+i*2.1)*r*.5);
  place(cells,x,y,p[4]);place(cells,x+1,y,p[3]);place(cells,x,y+1,p[3]);
 }
}
function orb(cells,m,quality){
 const v=unit(m),[cx,cy]=grid(m.x,m.y),step=tickOf(m.age,16),r=m.variant===1?12:10;
 energySphere(cells,cx,cy,r,step);
 for(let i=0;i<(quality==='low'?2:4);i++){
  const [x,y]=at(cx,cy,v,-r-4-i*4,Math.sin(i*1.7-step*.3)*3);
  place(cells,x,y,'#c9f96e');if(i<2){place(cells,x+1,y,'#89c62e');place(cells,x,y+1,'#89c62e');}
 }
}

function impact(cells,m){
 const u=clamp((m.age||0)/(m.life||.4),0,1),pal=palOf(m.element);
 const [cx,cy]=grid(m.x,m.y),r=Math.max(2,Math.round((1-u)*4+u*12));
 if(m.element==='grass'&&m.basic){
  for(let i=0;i<4;i++){
   const a=i*TAU/4+u,r=4+u*12,x=cx+Math.round(Math.cos(a)*r),y=cy+Math.round(Math.sin(a)*r*.6);
   const points=[[x-3,y+2],[x,y-2],[x+3,y-3]];
   lightningStroke(cells,points,false,1);
  }
  return;
 }
 if(m.element==='grass'){
  for(let i=0;i<6;i++){
   const a=i*TAU/6+u*.8,spread=3+u*18;
   energySphere(cells,cx+Math.round(Math.cos(a)*spread),cy+Math.round(Math.sin(a)*spread*.7),Math.max(2,Math.round(7*(1-u))),tickOf(m.age,16)+i);
  }
  return;
 }
 if(m.element==='electric'){
  if(u<.7){const points=[];for(let i=0;i<7;i++)points.push([cx+(i%2?2:-2)+(tickOf(m.age,18)%2),cy-26+i*5]);lightningStroke(cells,points,false,tickOf(m.age,18));}
  return;
 }
 if(m.element==='fire'){
  const step=tickOf(m.age,16);
  for(let i=0;i<3;i++)fireCloud(cells,cx+(i-1)*4,cy-Math.round(u*13)-i*3,{x:1,y:0},Math.max(2,Math.round(5*(1-u))),step,i);
  return;
 }
 if(m.element==='water'){
  for(let i=0;i<7;i++){
   const x=cx+Math.round((i-3)*(2+u*5)),y=cy-Math.round(Math.sin(u*Math.PI)*(8+i%3*4))+Math.round(u*5);
   place(cells,x,y,'#f2ffff');place(cells,x,y+1,'#a5edff');place(cells,x+1,y+1,'#67d9ed');
  }
  return;
 }
 ring(cells,m.x,m.y,r,pal[3]);

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
