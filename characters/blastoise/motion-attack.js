export function attackMods(face, k, S){
  const ux=Math.cos(face), uy=Math.sin(face), q=Math.round;
  return {dx:q(ux*S*2*k), dy:q(uy*S*1.5*k+S*.5*k), sx:1+.06*k, sy:1-.07*k, tilt:.05*uy*k, jaw:0, cheek:0, cannon:k, flower:0};
}
export function attackOverlays(R, x, y, face, mods){
  if(mods.cannon<=0.15) return;
  const {pxTex, SPRITE_PX:S} = R();
  const ux=Math.cos(face), uy=Math.sin(face), nx=-uy, ny=ux, c=mods.cannon;
  for(const s of [-1,1]){
    const cx=x+nx*S*8*s+ux*S*(2+3*c);
    const cy=y-S*14+ny*S*8*s+uy*S*(2+3*c);
    pxTex(cx,cy,'#a0afaf',.95*c); pxTex(cx+ux*S,cy+uy*S,'#ecf0dd',.9*c);
    pxTex(cx+ux*S*2,cy+uy*S*2,'#1a2a30',.85*c);
  }
}
export const thrustTexels = 2.5;
