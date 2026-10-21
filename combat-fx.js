/* Arena combat renderer v30. World-space geometry, 1 source pixel = 1.43 world units.
 * No per-frame random numbers: travelling details remain coherent between frames.
 * Render functions are stateless and share the same paths in battle and studio. */
(function(root){
'use strict';
const PIXEL=1.43,TAU=Math.PI*2;
const colors={fire:['#813320','#ef592a','#ffad42','#fff1b2'],water:['#155d85','#238fbd','#77daf2','#f0ffff'],grass:['#205c45','#3caa69','#9ae878','#f0ffd0'],electric:['#896019','#e6b42f','#ffea75','#fffef1'],neutral:['#53687b','#9fb8c5','#d1e7ec','#ffffff']};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function dot(g,x,y,r,c,a=1){g.globalAlpha=a;g.fillStyle=c;g.fillRect(Math.round((x-r/2)/PIXEL)*PIXEL,Math.round((y-r/2)/PIXEL)*PIXEL,Math.max(PIXEL,Math.round(r/PIXEL)*PIXEL),Math.max(PIXEL,Math.round(r/PIXEL)*PIXEL));}
function line(g,a,b,w,c,alpha=1){g.globalAlpha=alpha;g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();}
function disc(g,x,y,r,c,a=1){g.globalAlpha=a;g.fillStyle=c;g.beginPath();g.arc(x,y,Math.max(.1,r),0,TAU);g.fill();}
function leaf(g,x,y,r,ang,c,a=1){g.save();g.translate(x,y);g.rotate(ang);g.globalAlpha=a;g.fillStyle=c;g.beginPath();g.moveTo(-r,0);g.quadraticCurveTo(0,-r*.85,r,0);g.quadraticCurveTo(0,r*.85,-r,0);g.fill();line(g,{x:-r*.65,y:0},{x:r*.65,y:0},PIXEL,'#e5ffbd',a*.7);g.restore();}
function halo(g,x,y,r,c,a,quality){if(quality==='low')return;g.save();const h=g.createRadialGradient(x,y,0,x,y,r);h.addColorStop(0,c+'77');h.addColorStop(1,c+'00');g.globalAlpha=a;g.fillStyle=h;g.fillRect(x-r,y-r,r*2,r*2);g.restore();}
function charge(g,m,quality){const p=colors[m.element]||colors.neutral,u=clamp(m.age/(m.windup||.18),0,1);g.save();halo(g,m.x,m.y,22,p[2],.5,quality);for(let i=0;i<6;i++){const a=i*TAU/6+m.age*9,r=22*(1-u)+4;dot(g,m.x+Math.cos(a)*r,m.y+Math.sin(a)*r,PIXEL*2,p[2],.3+u*.6);}disc(g,m.x,m.y,2+4*u,p[3],.8);g.restore();}
function projectile(g,m,quality){if(m.delay>0)return;const p=colors[m.element]||colors.neutral,a=Math.atan2(m.vy,m.vx),t=m.pulse||0;g.save();g.translate(m.x,m.y);g.rotate(a);halo(g,0,0,18,p[2],.3,quality);
 if(m.element==='grass'){leaf(g,0,0,10,t*1.5,p[2]);leaf(g,-8,3,5,t*1.5+1,p[1],.55);}
 else if(m.element==='electric'){const pts=[[-13,2],[-5,-4],[-2,2],[5,-4],[12,0]];for(let j=0;j<pts.length-1;j++){const a={x:pts[j][0],y:pts[j][1]},b={x:pts[j+1][0],y:pts[j+1][1]};line(g,a,b,4,p[1]);line(g,a,b,PIXEL,p[3]);}}
 else if(m.element==='fire'){for(let j=8;j>=0;j--){const u=j/8;disc(g,-j*2.8,Math.sin(t*2-j*.5)*u*3,Math.max(1,8*(1-u)**1.4),p[j<2?2:1],1-u*.65);}disc(g,2,-1,4.2,p[3]);}
 else {for(let j=5;j>=0;j--){const u=j/5;disc(g,-j*3,Math.sin(t*2-j)*u*2,6*(1-u*.65),p[j<2?2:1],1-u*.8);}disc(g,3,-1,3,p[3]);}
 g.restore();}
// Reference: supplied trailer, Charizard/Blastoise duel. Rotating lobes, not a flat cone.
function flame(g,m,quality){
 const L=m.renderStream??m.stream??0;if(L<1)return;
 const t=Math.max(0,m.age-(m.windup||0)),spacing=quality==='low'?19:13;
 g.save();g.translate(m.x,m.y);g.rotate(Math.atan2(m.vy,m.vx));
 // The dark body connects the lobes, leaving the nozzle unobscured.
 line(g,{x:0,y:0},{x:L,y:0},5,'#ffb54c',.95);
 for(let d=3;d<L;d+=spacing){
  const travel=(d+t*150)%L,u=travel/Math.max(1,L),end=clamp((L-travel)/14,.15,1);
  const r=(3+u*20)*end,spin=t*15-travel*.09,y=Math.sin(spin)*r*.15;
  g.save();g.translate(travel,y);g.rotate(Math.sin(spin)*.25);
  for(const [k,c,off] of [[1,'#8c301e',0],[.87,'#dc4b20',-1],[.68,'#ff942f',-2],[.40,'#ffdb75',-3]]){
   g.globalAlpha=.97;g.fillStyle=c;g.beginPath();g.ellipse(off,-r*.12,r*.72*k+2,r*k,0,0,TAU);g.fill();
  }
  g.strokeStyle='#ffec9d';g.lineWidth=PIXEL*1.4;g.beginPath();g.ellipse(0,0,r*.5,r*.8,0,spin,spin+Math.PI*.8);g.stroke();
  g.restore();
 }
 for(let i=0;i<12;i++){const u=(i*.618+t*1.8)%1,d=u*L;dot(g,d,Math.sin(i*4.7+t)*u*28,PIXEL*(1+i%2),i%2?'#ffc159':'#fff1ab',.65*(1-u));}
 disc(g,2,0,3,'#fff0bb');halo(g,L*.7,0,34,'#ff9f42',.3,quality);g.restore();
 if(m.contact)contact(g,m,quality);
}
function contact(g,m,quality){
 const p=m.contact,t=m.age;g.save();halo(g,p.x,p.y,36,'#ffd895',.8,quality);
 for(let i=0;i<9;i++){const a=i*TAU/9+t*2,r=7+((t*65+i*7)%22);line(g,{x:p.x+Math.cos(a)*r*.65,y:p.y+Math.sin(a)*r*.65},{x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r},PIXEL,i%2?'#fff7cc':'#ffb950',.8);}
 // Small rising puffs at contact, with cool steam colouring on Water targets.
 if(quality!=='low')for(let i=0;i<6;i++){const u=(t*.9+i/6)%1,r=5+u*11,x=p.x+Math.sin(i*4.1+u*2)*10,y=p.y-u*54;disc(g,x,y,r,p.steam?'#d4e9e8':'#b8a08b',(1-u)*.2);}
 disc(g,p.x,p.y,5+Math.sin(t*28), '#fff9de',.9);g.restore();
}
function jet(g,m,ports,quality){
 const age=Math.max(0,m.age-(m.windup||0)),fade=clamp(1-age/.34,0,1);if(!fade)return;
 g.save();for(const p of ports){
  const reach=18+Math.min(70,age*310),end={x:p.x+m.vx*reach,y:p.y+m.vy*reach};
  halo(g,p.x,p.y,16,'#9ceaff',fade*.4,quality);
  for(const [w,c] of [[9,'#246caf'],[5,'#72cfff'],[2,'#f4ffff']])line(g,p,end,w,c,fade);
  for(let i=0;i<6;i++){const u=(age*4+i/6)%1,d=u*reach,side=Math.sin(i*4+age*25)*4;dot(g,p.x+m.vx*d-m.vy*side,p.y+m.vy*d+m.vx*side,PIXEL*2,'#efffff',fade*(1-u*.4));}
 }g.restore();
}
function thunder(g,m,quality){const pts=m.path||[];if(pts.length<2)return;const fade=m.type==='boltEcho'?clamp(1-m.age/m.life,0,1):1,t=Math.floor(m.age*24);g.save();
 for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,w=Math.sin(i*9.1+t*1.7)*5;const mid={x:(a.x+b.x)/2-dy/d*w,y:(a.y+b.y)/2+dx/d*w},alpha=fade*(.1+.9*i/pts.length);
 for(const [width,c] of [[7,'#a07b20'],[3.5,'#ffdc50'],[PIXEL,'#ffffe5']]){line(g,a,mid,width,c,alpha);line(g,mid,b,width,c,alpha);}
 if(i%5===0){line(g,mid,{x:mid.x-dy/d*12,y:mid.y+dx/d*12},PIXEL,'#acfbff',alpha*.7);}}
 const h=pts.at(-1);halo(g,h.x,h.y,26,'#ffe85d',fade*.6,quality);disc(g,h.x,h.y,3,'#fffde1',fade);g.restore();}
function orb(g,m,quality){const t=m.age,r=17;g.save();halo(g,m.x,m.y,34,'#8bf783',.6,quality);for(let i=5;i>0;i--)disc(g,m.x-m.vx*i*6,m.y-m.vy*i*6,Math.max(1,r-i*2.5),'#65d578',.12*(1-i/7));disc(g,m.x,m.y,r,'#215a46');disc(g,m.x,m.y,r-2,'#51bb72');disc(g,m.x+2,m.y-2,r-6,'#b5f19b');disc(g,m.x+4,m.y-5,4,'#f4ffd3');for(let i=0;i<7;i++){const a=i*TAU/7+t*5;leaf(g,m.x+Math.cos(a)*22,m.y+Math.sin(a)*17,5,a+Math.PI/2,colors.grass[1+i%2],.9);}g.restore();}
function surf(g,m,quality){const t=m.age,a=Math.atan2(m.vy,m.vx),fade=clamp((m.life-m.age)/.18,0,1),r=47;g.save();g.translate(m.x,m.y);g.rotate(a);g.globalAlpha=fade;
 for(let layer=0;layer<4;layer++){g.fillStyle=colors.water[layer];g.beginPath();g.moveTo(-24,-r);for(let i=0;i<=24;i++){const s=-r+i*r/12,crest=17+20*(1-(s/r)**2)+Math.sin(s*.16-t*14)*3-layer*4;g.lineTo(crest,s);}g.lineTo(-20+layer*9,r);g.closePath();g.fill();}
 for(let i=0;i<16;i++){const s=-r+i*2*r/15,x=22+18*(1-(s/r)**2)+Math.sin(s*.16-t*14)*3;dot(g,x,s,PIXEL*(1+i%3),'#f1ffff',fade);const q=(t*1.6+i*.618)%1;dot(g,-24-q*40,s,PIXEL*2,'#8be8f5',fade*(1-q)*.6);}g.restore();}
function impact(g,m,quality){const u=clamp(m.age/(m.life||.4),0,1),a=(1-u)**2,p=colors[m.element]||colors.grass,r=6+Math.sqrt(u)*42;g.save();halo(g,m.x,m.y,40,p[2],a*.7,quality);g.strokeStyle=p[2];g.lineWidth=PIXEL*2*(1-u);g.globalAlpha=a;g.beginPath();g.ellipse(m.x,m.y,r,r*.7,0,0,TAU);g.stroke();for(let i=0;i<12;i++){const ang=i*TAU/12+(m.seed||0),d=r*(.7+(i%3)*.15);if(m.element==='grass')leaf(g,m.x+Math.cos(ang)*d,m.y+Math.sin(ang)*d,4*(1-u),ang+u*3,p[2],a);else line(g,{x:m.x+Math.cos(ang)*d*.7,y:m.y+Math.sin(ang)*d*.7},{x:m.x+Math.cos(ang)*d,y:m.y+Math.sin(ang)*d},PIXEL*(1+i%2),p[2+i%2],a);}if(u<.2)disc(g,m.x,m.y,10*(1-u/.2),p[3],a);g.restore();}
function particle(g,p){const a=clamp(p.life/p.max,0,1)*(p.alpha??1),s=Math.min(7,Math.max(PIXEL,p.size*.45));g.save();if(p.shape==='leaf')leaf(g,p.x,p.y,s,p.rot||0,p.color,a);else if(p.shape==='spark'){line(g,{x:p.x-(p.vx||0)*.015,y:p.y-(p.vy||0)*.015},{x:p.x,y:p.y},PIXEL,p.color,a);}else if(p.shape==='ring'){g.globalAlpha=a;g.lineWidth=PIXEL;g.strokeStyle=p.color;g.beginPath();g.ellipse(p.x,p.y,p.size,p.size*.65,0,0,TAU);g.stroke();}else dot(g,p.x,p.y,s,p.color,a);g.restore();}
root.ArenaFX={PIXEL,charge,projectile,flame,thunder,orb,surf,impact,particle,jet,contact};
})(typeof window==='undefined'?globalThis:window);
