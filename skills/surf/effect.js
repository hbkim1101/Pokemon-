import { R } from '../../lib/render-api.js';
export const id='surf';
export const nameKo='파도타기';
export const kind='special';

export function draw(m){
 const {ctx,SPRITE_PX,SPRITE_SCALE,pxLayeredBeam,pxJaggedBurst,pxRadialLines,pxTex,pxFloorRing,arcadePal,fxQuality,snap,time,SURF_WIDTH_TEXELS}=R();
 const vx=m.vx,vy=m.vy,nx=-vy,ny=vx,t=m.age,pal=arcadePal('water');
 const cols={ink:pal.ink||'#0f3d5c', body:pal.main, accent:pal.accent, hot:pal.hot||'#fff'};
 // Fixed readable band: SURF_WIDTH_TEXELS (120 = 3×40 char widths), not arena ring / thin beam.
 const surfW = SURF_WIDTH_TEXELS ?? 120;
 const half=m.halfW||((surfW*SPRITE_PX)/2);
 const depth=SPRITE_PX*14; // how far the face extends ahead
 for(let s=-half;s<=half;s+=SPRITE_PX){
  const u=Math.abs(s)/half;
  const ahead=depth*(.55+(1-u)*.45)+Math.sin(t*11+s*.04)*SPRITE_PX;
  const x0=m.x+nx*s-vx*SPRITE_PX*4, y0=m.y+ny*s-vy*SPRITE_PX*4;
  const x1=m.x+nx*s+vx*ahead, y1=m.y+ny*s+vy*ahead;
  const localHalf=SPRITE_PX*(u<.25?3:u<.6?2:1);
  pxLayeredBeam(x0,y0,x1,y1,localHalf,cols,{t, spiral:u<.3, tip:false, wobble:true, alpha:.96});
 }
 // foam crest (1-texel white) across the wave face
 for(let s=-half;s<=half;s+=SPRITE_PX){
  const ahead=depth*(.9+(1-Math.abs(s)/half)*.15)+Math.sin(t*10+s*.05)*SPRITE_PX;
  pxTex(m.x+nx*s+vx*ahead, m.y+ny*s+vy*ahead, '#ffffff', .98);
 }
}
