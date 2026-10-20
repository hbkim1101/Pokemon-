import { R } from '../../lib/render-api.js';
export const id='dragonClaw';
export const nameKo='드래곤클로';
export const kind='extra';

export function drawExtra(m, layer){
  if(layer!=='over')return;
  if(m.move.mode!=='melee')return;
  const {pxLine,EXTRA_PALETTE,player,enemies}=R();
  const actor=m.owner==='player'?player:enemies[0]; if(!actor)return;
  const move=m.move,color=EXTRA_PALETTE[move.type],k=Math.min(1,m.age/m.life);
  const px=actor.x+m.vx*24,py=actor.y+m.vy*24-10,nx=-m.vy,ny=m.vx;
  for(let i=-5;i<=5;i++){
    const d=move.range*(.35+(.65-Math.abs(i)/11));
    pxLine(px+m.vx*d+nx*i*8,py+m.vy*d+ny*i*8,px+m.vx*(d+19)+nx*i*8,py+m.vy*(d+19)+ny*i*8,7,color,(1-k)*.9);
  }
}
