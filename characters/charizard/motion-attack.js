export function attackMods(face, k, S){
  const ux=Math.cos(face), uy=Math.sin(face), q=Math.round;
  return {dx:q(ux*S*5*k), dy:q(uy*S*4*k-S*k), sx:1+.04*k, sy:1-.03*k, tilt:.04*uy*k, jaw:k, cheek:0, cannon:0, flower:0};
}
export function attackOverlays(R, x, y, face, mods, mouthAnchor){
  if(mods.jaw<=0.15) return;
  const {pxTex, SPRITE_PX:S, SPRITE_SCALE:sc} = R();
  const ux=Math.cos(face), uy=Math.sin(face), nx=-uy, ny=ux;
  const a=mouthAnchor||{fwd:16,side:0,up:-22};
  const mx=x+ux*a.fwd*sc+nx*a.side*sc, my=y+uy*a.fwd*sc+ny*a.side*sc+a.up*sc;
  const j=mods.jaw;
  pxTex(mx+ux*S, my+uy*S, '#1a0a08', .95*j);
  pxTex(mx+ux*S*2, my+uy*S*2, '#3d120c', .9*j);
  pxTex(mx+nx*S, my+ny*S, '#ff5f1f', .85*j);
  pxTex(mx-nx*S, my-ny*S, '#ff5f1f', .85*j);
  pxTex(mx, my, '#fff8e0', .7*j);
}
export const thrustTexels = 5;
