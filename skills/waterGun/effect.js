import { R } from '../../lib/render-api.js';
export const id='waterGun';
export const nameKo='물대포';
export const kind='basic';

export function drawProjectile(s){
  const {SPRITE_PX,pxLayeredBeam,arcadePal,snap}=R();
  const pal=arcadePal(s.element), ang=Math.atan2(s.vy,s.vx), pulse=s.pulse||0;
  const cols={ink:pal.ink||'#1a2030', body:pal.main, accent:pal.accent, hot:pal.hot||'#fff'};
  const ctx=R().ctx; ctx.save(); ctx.translate(snap(s.x),snap(s.y)); ctx.globalAlpha=s.team==='enemy'?.9:.99;
  pxLayeredBeam(-Math.cos(ang)*SPRITE_PX*7,-Math.sin(ang)*SPRITE_PX*7, Math.cos(ang)*SPRITE_PX*5, Math.sin(ang)*SPRITE_PX*5, SPRITE_PX*3, cols, {t:pulse,spiral:true,tip:true,wobble:false});
  ctx.restore();
}
