import { R } from '../../lib/render-api.js';
export const id='thunderbolt';
export const nameKo='10만볼트';
export const kind='special';

export function draw(m){
 const {ctx,SPRITE_PX,SPRITE_SCALE,pxLayeredBeam,pxJaggedBurst,pxRadialLines,pxTex,pxFloorRing,arcadePal,fxQuality,snap,time}=R();
 const pts=m.path||[];if(pts.length<2)return;
 const fade=m.type==='boltEcho'?Math.max(0,1-m.age/m.life):1;
 const pal=arcadePal('electric');
 const cols={ink:pal.ink||'#3a2808', body:pal.main, accent:pal.accent, hot:pal.hot||'#fff'};
 ctx.save();ctx.globalAlpha*=fade;
 // Guided bolt ribbon along the whole path (body → enemy)
 for(let i=0;i<pts.length-1;i++){
  const a=pts[i],b=pts[i+1];
  pxLayeredBeam(a.x,a.y,b.x,b.y,SPRITE_PX*(i===0?3:4),cols,{t:m.age+i*.2, spiral:true, tip:false, wobble:true, alpha:1});
 }
 // small forks near the tip only
 if(pts.length>=3){
  const a=pts[pts.length-3],b=pts[pts.length-1];
  const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1;
  const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
  pxLayeredBeam(mx,my, mx-(dy/L)*SPRITE_PX*7, my+(dx/L)*SPRITE_PX*7, SPRITE_PX*2, cols,{t:m.age,spiral:false,tip:true,wobble:false,alpha:.9});
 }
 const e=pts[pts.length-1];
 pxJaggedBurst(e.x,e.y,SPRITE_PX*6,cols.ink,cols.body,cols.hot,.95*fade);
 pxRadialLines(e.x,e.y,SPRITE_PX*2,SPRITE_PX*12,12,cols.hot,.85*fade,.7);
 ctx.restore();
}
