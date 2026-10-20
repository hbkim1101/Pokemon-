import { R } from '../../lib/render-api.js';
export const id='ember';
export const nameKo='불꽃세례';
export const kind='basic';

export function drawProjectile(s){
  const {SPRITE_PX,pxLayeredBeam,snap}=R();
  const ang=Math.atan2(s.vy,s.vx), pulse=s.pulse||0;
  const ctx=R().ctx; ctx.save(); ctx.translate(snap(s.x),snap(s.y)); ctx.globalAlpha=s.team==='enemy'?.9:.99;
  pxLayeredBeam(-Math.cos(ang)*SPRITE_PX*6,-Math.sin(ang)*SPRITE_PX*6, Math.cos(ang)*SPRITE_PX*5, Math.sin(ang)*SPRITE_PX*5, SPRITE_PX*3, {ink:'#3d120c',body:'#ff5f1f',accent:'#ffc857',hot:'#fff8e0'}, {t:pulse,spiral:true,tip:true,wobble:true});
  ctx.restore();
}
