import { R } from '../../lib/render-api.js';
export const id='heatWave';
export const nameKo='열풍';
export const kind='extra';

export function drawExtra(m, layer){
  const {SPRITE_PX,pxFloorRing,pxLayeredBeam,pxDustClump,arcadePal,fxQuality,player,enemies}=R();
  const actor=m.owner==='player'?player:enemies[0]; if(!actor)return;
  const t=m.age,k=t/m.life,alpha=Math.min(1,(1-k)*3),x=actor.x,y=actor.y-7;
  const typePal=arcadePal(m.move.type||'neutral');
  if(layer==='under'){
    const rr=Math.round(Math.min(m.move.range,t*560)/SPRITE_PX)*SPRITE_PX;
    pxFloorRing(x,y,rr,rr*.55,typePal.ink,.7*alpha);
    pxFloorRing(x,y,Math.round(rr*.9/SPRITE_PX)*SPRITE_PX,Math.round(rr*.5/SPRITE_PX)*SPRITE_PX,typePal.main,.4*alpha);
    return;
  }
  if(layer!=='over')return;
  const rr=Math.round(Math.min(m.move.range,30+k*m.move.range*.75)/SPRITE_PX)*SPRITE_PX;
  const cols={ink:'#3d120c', body:'#ff5f1f', accent:'#ffc857', hot:'#fff8e0'};
  pxFloorRing(x,y,rr,rr*.55,cols.ink,.5*alpha);
  const n=fxQuality==='low'?10:16;
  for(let i=0;i<n;i++){
    const a=i*Math.PI*2/n+k*2.8;
    const x1=x+Math.cos(a)*rr, y1=y+Math.sin(a)*rr*.55;
    const x2=x1+Math.cos(a)*SPRITE_PX*5, y2=y1+Math.sin(a)*SPRITE_PX*3-SPRITE_PX*4;
    pxLayeredBeam(x1,y1,x2,y2,SPRITE_PX*2,cols,{t:t+i,spiral:false,tip:true,wobble:true,alpha:alpha*.9});
    if(i%2===0)pxDustClump(x1,y1,i,1,alpha*.7);
  }
}
