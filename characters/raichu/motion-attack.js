export function attackMods(face, k, S){
  const ux=Math.cos(face), uy=Math.sin(face), q=Math.round;
  return {dx:q(ux*S*3.5*k), dy:q(uy*S*3*k), sx:1+.05*k, sy:1-.04*k, tilt:.08*k*(uy>=0?1:-1), jaw:0, cheek:k, cannon:0, flower:0, earKick:k, tailKick:k};
}
export function attackOverlays(R, x, y, face, mods){
  if(mods.cheek<=0.15) return;
  const {pxTex, SPRITE_PX:S} = R();
  const ux=Math.cos(face), uy=Math.sin(face), nx=-uy, ny=ux, c=mods.cheek;
  for(const s of [-1,1]){
    pxTex(x+nx*S*6*s+ux*S*2, y-S*10+ny*S*6*s, '#ff6b4a', .95*c);
    pxTex(x+nx*S*7*s+ux*S*2, y-S*10+ny*S*7*s, '#ffe16b', .9*c);
    pxTex(x+nx*S*6*s+ux*S, y-S*9+ny*S*6*s, '#ffffff', .7*c);
  }
  if(mods.earKick>0){
    pxTex(x+nx*S*8-ux*S, y-S*18, '#422f2a', .9*mods.earKick);
    pxTex(x-nx*S*8-ux*S, y-S*18, '#422f2a', .9*mods.earKick);
  }
  if(mods.tailKick>0){
    pxTex(x-ux*S*8+nx*S*2, y-S*4, '#ffe68b', .9*mods.tailKick);
    pxTex(x-ux*S*10+nx*S*3, y-S*6, '#ffe68b', .85*mods.tailKick);
  }
}
export const thrustTexels = 3.5;
