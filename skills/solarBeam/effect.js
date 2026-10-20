import { R } from '../../lib/render-api.js';
export const id='solarBeam';
export const nameKo='솔라빔';
export const kind='extra';

export function drawProjectile(s){
  const {SPRITE_PX,pxLayeredBeam,arcadePal,snap,ctx}=R();
  const pal=arcadePal(s.element), ang=Math.atan2(s.vy,s.vx), pulse=s.pulse||0;
  const cols={ink:pal.ink||'#1a2030', body:pal.main, accent:pal.accent, hot:pal.hot||'#fff'};
  ctx.save();ctx.translate(snap(s.x),snap(s.y));ctx.globalAlpha=s.team==='enemy'?.9:.99;
  pxLayeredBeam(-Math.cos(ang)*SPRITE_PX*12,-Math.sin(ang)*SPRITE_PX*12, Math.cos(ang)*SPRITE_PX*10, Math.sin(ang)*SPRITE_PX*10, SPRITE_PX*4, cols, {t:pulse,spiral:true,tip:true,wobble:false});
  ctx.restore();
}

export function drawExtra(m, layer){
  if(layer!=='over')return;
  const {SPRITE_PX,pxLayeredBeam,pxJaggedBurst,pxRadialLines,pxFloorRing,arcadePal,player,enemies}=R();
  const actor=m.owner==='player'?player:enemies[0]; if(!actor)return;
  const id=m.move.id,t=m.age,k=t/m.life,alpha=Math.min(1,(1-k)*3);
  const sx=actor.x+m.vx*14, sy=actor.y+m.vy*14-10;
  const el=id==='iceBeam'?'ice':id==='solarBeam'?'grass':id==='dragonPulse'?'dragon':'steel';
  const pal=arcadePal(el);
  const cols={ink:pal.ink, body:pal.main, accent:pal.accent, hot:pal.hot||'#fff'};
  const half=SPRITE_PX*(id==='solarBeam'?6:4);
  if(m.fired){
    const ex=sx+m.vx*m.move.range, ey=sy+m.vy*m.move.range;
    pxLayeredBeam(sx,sy,ex,ey,half,cols,{t:m.age, spiral:true, tip:true, wobble:id!=='flashCannon', alpha:alpha});
    pxJaggedBurst(ex,ey,half*1.2,cols.ink,cols.body,cols.hot,.9*alpha);
    pxRadialLines(ex,ey,SPRITE_PX*2,half*2.2,12,cols.hot,.8*alpha,.7);
  }else{
    pxJaggedBurst(sx,sy,SPRITE_PX*5,cols.ink,cols.body,cols.hot,.85*alpha);
    pxFloorRing(sx,sy,SPRITE_PX*(8+4*Math.sin(m.age*8)),SPRITE_PX*(5+2*Math.sin(m.age*8)),cols.accent,.55*alpha);
    pxRadialLines(sx,sy,SPRITE_PX,SPRITE_PX*8,8,cols.hot,.7*alpha,.7);
  }
}
