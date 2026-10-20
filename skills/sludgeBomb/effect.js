import { R } from '../../lib/render-api.js';
export const id='sludgeBomb';
export const nameKo='오물폭탄';
export const kind='extra';

export function drawProjectile(s){
  const {SPRITE_PX,pxJaggedBurst,pxTex,arcadePal,snap}=R();
  const pal=arcadePal(s.element), pulse=s.pulse||0;
  const cols={ink:pal.ink||'#1a2030', body:pal.main, accent:pal.accent, hot:pal.hot||'#fff'};
  const ctx=R().ctx; ctx.save(); ctx.translate(snap(s.x),snap(s.y)); ctx.globalAlpha=s.team==='enemy'?.9:.99;
  pxJaggedBurst(0,0,SPRITE_PX*6,cols.ink,cols.body,cols.hot,.95);
  for(let i=0;i<6;i++){const a=pulse*3+i;pxTex(Math.cos(a)*SPRITE_PX*5,Math.sin(a)*SPRITE_PX*5,i%2?'#e8ff7a':cols.body,.9)}
  ctx.restore();
}
