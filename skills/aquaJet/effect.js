import { R } from '../../lib/render-api.js';
export const id='aquaJet';
export const nameKo='아쿠아제트';
export const kind='extra';

export function drawExtra(m, layer){
  if(layer==='under' && 'aquaJet'==='aquaJet'){
    const {SPRITE_PX,pxFloorRing,arcadePal,player,enemies}=R();
    const actor=m.owner==='player'?player:enemies[0]; if(!actor)return;
    const t=m.age,k=t/m.life,alpha=Math.min(1,(1-k)*3),x=actor.x,y=actor.y-7;
    const typePal=arcadePal(m.move.type||'neutral');
    pxFloorRing(x,y,SPRITE_PX*12,SPRITE_PX*7,typePal.ink,.4*alpha);
    pxFloorRing(x,y,SPRITE_PX*10,SPRITE_PX*6,typePal.main,.35*alpha);
    return;
  }
  if(layer!=='over')return;
  const {SPRITE_PX,pxLayeredBeam,fxQuality,player,enemies}=R();
  const actor=m.owner==='player'?player:enemies[0]; if(!actor)return;
  const t=m.age,k=t/m.life,alpha=Math.min(1,(1-k)*3),x=actor.x,y=actor.y-7;
  const cols=('aquaJet'==='aquaJet')
   ?{ink:'#0f3d5c',body:'#3ec8f5',accent:'#e8ffff',hot:'#ffffff'}
   :{ink:'#3a2808',body:'#ffd63d',accent:'#fff4b0',hot:'#ffffff'};
  const tail=fxQuality==='low'?6:10;
  for(let i=0;i<tail;i++){
    const dist=i*SPRITE_PX*6;
    const x2=x-m.vx*dist, y2=y-m.vy*dist;
    const x3=x2-m.vx*SPRITE_PX*4, y3=y2-m.vy*SPRITE_PX*4;
    pxLayeredBeam(x3,y3,x2,y2,SPRITE_PX*(i===0?3:2),cols,{t:t+i,spiral:false,tip:false,wobble:false,alpha:alpha*(1-i/tail)});
  }
}
