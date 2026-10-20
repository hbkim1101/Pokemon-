import { R } from '../../lib/render-api.js';
export const id='airSlash';
export const nameKo='에어슬래시';
export const kind='extra';

export function drawProjectile(s){
  const {SPRITE_PX,pxLayeredBeam,snap}=R();
  const ang=Math.atan2(s.vy,s.vx), pulse=s.pulse||0;
  const ctx=R().ctx; ctx.save(); ctx.translate(snap(s.x),snap(s.y)); ctx.globalAlpha=s.team==='enemy'?.9:.99;
  for(let i=-2;i<=2;i++){
    const a=ang+i*.18; const c=Math.cos(a), sn=Math.sin(a);
    pxLayeredBeam(-c*SPRITE_PX*8+i*SPRITE_PX,-sn*SPRITE_PX*8, c*SPRITE_PX*10+i*SPRITE_PX, sn*SPRITE_PX*10, SPRITE_PX*(i===0?3:2), {ink:'#1a3a55',body:'#6ec8ff',accent:'#e8ffff',hot:'#ffffff'}, {t:pulse,spiral:false,tip:false,wobble:false});
  }
  ctx.restore();
}
