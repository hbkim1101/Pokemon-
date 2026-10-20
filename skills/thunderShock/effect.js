import { R } from '../../lib/render-api.js';
export const id='thunderShock';
export const nameKo='전기쇼크';
export const kind='basic';

export function drawProjectile(s){
  const {SPRITE_PX,pxLayeredBeam,arcadePal,snap}=R();
  const pal=arcadePal(s.element), ang=Math.atan2(s.vy,s.vx), pulse=s.pulse||0;
  const cols={ink:pal.ink||'#1a2030', body:pal.main, accent:pal.accent, hot:pal.hot||'#fff'};
  const ctx=R().ctx; ctx.save(); ctx.translate(snap(s.x),snap(s.y)); ctx.globalAlpha=s.team==='enemy'?.9:.99;
  pxLayeredBeam(-Math.cos(ang)*SPRITE_PX*6,-Math.sin(ang)*SPRITE_PX*6, Math.cos(ang)*SPRITE_PX*6, Math.sin(ang)*SPRITE_PX*6, SPRITE_PX*2, cols, {t:pulse,spiral:true,tip:true,wobble:true});
  ctx.restore();
}
