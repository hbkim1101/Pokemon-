import { R } from '../../lib/render-api.js';
export const id='discharge';
export const nameKo='방전';
export const kind='extra';

export function drawExtra(m, layer){
  const {SPRITE_PX,pxFloorRing,pxLayeredBeam,pxJaggedBurst,pxRadialLines,arcadePal,fxQuality,player,enemies}=R();
  const actor=m.owner==='player'?player:enemies[0]; if(!actor)return;
  const t=m.age,k=t/m.life,alpha=Math.min(1,(1-k)*3),x=actor.x,y=actor.y-7;
  const typePal=arcadePal(m.move.type||'neutral');
  if(layer==='under'){
    const rr=Math.round(Math.min(m.move.range,t*440)/SPRITE_PX)*SPRITE_PX;
    pxFloorRing(x,y,rr,rr*.55,typePal.ink,.55*alpha);
    pxFloorRing(x,y,Math.round(rr*.88/SPRITE_PX)*SPRITE_PX,Math.round(rr*.48/SPRITE_PX)*SPRITE_PX,typePal.main,.4*alpha);
    pxRadialLines(x,y,SPRITE_PX*2,rr*.9,12,typePal.hot||'#fff',.7*alpha,.65);
    return;
  }
  if(layer!=='over')return;
  const r=Math.round(Math.min(m.move.range,t*520)/SPRITE_PX)*SPRITE_PX;
  const cols={ink:typePal.ink, body:typePal.main, accent:typePal.accent, hot:typePal.hot||'#fff'};
  pxFloorRing(x,y,r,r*.55,cols.ink,.45*alpha);
  pxJaggedBurst(x,y,SPRITE_PX*6,cols.ink,cols.body,cols.hot,.9*alpha);
  pxRadialLines(x,y,SPRITE_PX*2,r,fxQuality==='low'?12:18,cols.hot,.85*alpha,.7);
  const n=fxQuality==='low'?8:14;
  for(let i=0;i<n;i++){
    const a=i*Math.PI*2/n+t*2.5;
    pxLayeredBeam(x,y,x+Math.cos(a)*r,y+Math.sin(a)*r*.7,SPRITE_PX*2,cols,{t:t+i,spiral:true,tip:true,wobble:true,alpha:alpha*.85});
  }
}
