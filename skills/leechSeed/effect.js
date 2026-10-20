import { R } from '../../lib/render-api.js';
export const id='leechSeed';
export const nameKo='씨뿌리기';
export const kind='extra';

export function drawProjectile(s){
  const {SPRITE_PX,pxJaggedBurst,fxStamp,arcadePal,snap}=R();
  const pal=arcadePal(s.element), ang=Math.atan2(s.vy,s.vx);
  const cols={ink:pal.ink||'#1a2030', body:pal.main, accent:pal.accent, hot:pal.hot||'#fff'};
  const ctx=R().ctx; ctx.save(); ctx.translate(snap(s.x),snap(s.y)); ctx.globalAlpha=s.team==='enemy'?.9:.99;
  pxJaggedBurst(0,0,SPRITE_PX*4,cols.ink,cols.body,cols.accent,.95);
  fxStamp('leaves',SPRITE_PX*3,0,SPRITE_PX*6,SPRITE_PX*8,0,.9,ang);
  ctx.restore();
}
