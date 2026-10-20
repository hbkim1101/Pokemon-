export function attackMods(face, k, S){
  const ux=Math.cos(face), uy=Math.sin(face), q=Math.round;
  return {dx:q(ux*S*3*k), dy:q(uy*S*2*k-S*k), sx:1+.03*k, sy:1-.02*k, tilt:.06*k, jaw:0, cheek:0, cannon:0, flower:k};
}
export function attackOverlays(R, x, y, face, mods){
  if(mods.flower<=0.15) return;
  const {pxTex, SPRITE_PX:S} = R();
  const ux=Math.cos(face), uy=Math.sin(face), nx=-uy, ny=ux, f=mods.flower;
  const fx=x+ux*S*(2+2*f), fy=y-S*(16+2*f)+uy*S*2;
  pxTex(fx,fy,'#e46d80',.95*f); pxTex(fx+S,fy,'#e46d80',.9*f);
  pxTex(fx,fy-S,'#f5c981',.85*f); pxTex(fx+nx*S,fy,'#78ba65',.8*f); pxTex(fx-nx*S,fy,'#78ba65',.8*f);
  pxTex(x+ux*S*4, y-S*8+uy*S*3, '#1d4a28', .85*f);
  pxTex(x+ux*S*5, y-S*8+uy*S*4, '#6ce85a', .8*f);
}
export const thrustTexels = 3;
