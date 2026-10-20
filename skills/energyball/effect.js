import { R } from '../../lib/render-api.js';
export const id='energyball';
export const nameKo='에너지볼';
export const kind='special';

export function draw(m){
 const {ctx,SPRITE_PX,SPRITE_SCALE,pxLayeredBeam,pxJaggedBurst,pxRadialLines,pxTex,pxFloorRing,arcadePal,fxQuality,snap,time}=R();
 const t=m.age,cx=m.x,cy=m.y,pal=arcadePal('grass');
 const ink=pal.ink||'#1d4a28', body=pal.main, accent=pal.accent, hot=pal.hot||'#fff';
 // Layered pixel orb (rim → body → core), same texel size as characters.
 const R=SPRITE_PX*6;
 for(let y=-R;y<=R;y+=SPRITE_PX){
  for(let x=-R;x<=R;x+=SPRITE_PX){
   const d=Math.hypot(x,y);
   if(d>R+SPRITE_PX*.2)continue;
   const t0=d/R;
   const col=t0>.82?ink:t0>.5?body:t0>.22?accent:hot;
   pxTex(cx+x,cy+y,col,.98);
  }
 }
 // subtle spin accents (1-texel)
 for(let i=0;i<6;i++){
  const a=t*6+i*Math.PI/3;
  pxTex(cx+Math.cos(a)*SPRITE_PX*4, cy+Math.sin(a)*SPRITE_PX*4, i%2?hot:accent, .9);
 }
}

export function drawBurst(m){
 const {SPRITE_PX,pxRing,arcadePal,clamp,fxQuality,fxStamp,fxStar}=R();
 const k=clamp(m.age/m.life,0,1),r=14+115*k,a=Math.min(1,(1-k)*1.55),pal=arcadePal('grass');
 pxRing(m.x,m.y,r+3,11,pal.ink,.7*a,8);pxRing(m.x,m.y,r,9,pal.main,.75*a,8);pxRing(m.x,m.y,r*.64,6,pal.accent,.94*a,7);
 for(let i=0;i<(fxQuality==='low'?10:18);i++){
  const an=i*Math.PI*2/18+m.age*2.9;
  fxStamp('leaves',m.x+Math.cos(an)*r*.74,m.y+Math.sin(an)*r*.74,11,24,i,a*.92,an);
 }
 if(k<.3){fxStamp('hitX',m.x,m.y,24,30,0,1-k*3.2,0);fxStar(m.x,m.y,Math.max(11,r*.5),'grass',1-k*3.2)}
}
