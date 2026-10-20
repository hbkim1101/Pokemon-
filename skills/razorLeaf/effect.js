import { R } from '../../lib/render-api.js';
export const id='razorLeaf';
export const nameKo='나뭇잎';
export const kind='basic';

export function drawProjectile(s){
  const {SPRITE_PX,pxJaggedBurst,fxStamp,arcadePal,snap}=R();
  const pal=arcadePal(s.element), ang=Math.atan2(s.vy,s.vx), pulse=s.pulse||0;
  const cols={ink:pal.ink||'#1a2030', body:pal.main, accent:pal.accent, hot:pal.hot||'#fff'};
  const ctx=R().ctx; ctx.save(); ctx.translate(snap(s.x),snap(s.y)); ctx.globalAlpha=s.team==='enemy'?.9:.99;
  pxJaggedBurst(0,0,SPRITE_PX*4,cols.ink,cols.body,cols.hot,.95);
  fxStamp('leaves',0,0,SPRITE_PX*7,SPRITE_PX*9,Math.floor(pulse)%4,.9,ang);
  ctx.restore();
}
