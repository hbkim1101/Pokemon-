/** Character image helpers / fallback canvas art for blastoise (PMD 0009). */
import { R } from '../../../lib/render-api.js';

export const speciesKey = 'blastoise';
export const pmdId = '0009';
export const displayName = '거북왕';

export function spriteUrls(){
  const BASE='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/';
  const SHOWDOWN_FRONT='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/';
  const SHOWDOWN_BACK='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/';
  const OFFICIAL_ART='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
  const HGSS_GIF='https://raw.githubusercontent.com/teobz/pkmn-hgss-animated-overworld-sprites/main/GIF/by-direction/';
  const num=String(Number(pmdId));
  return {
    pmdBase: BASE+pmdId+'/',
    showdownFront: SHOWDOWN_FRONT+num,
    showdownBack: SHOWDOWN_BACK+num,
    officialArt: OFFICIAL_ART+num+'.png',
    hgss: HGSS_GIF,
  };
}

/** Fallback pixel creature when remote sprites fail — same looks as prior inline art. */
export function drawFallbackArt(x, y, scale=1, t=0, angle=Math.PI/2, renderCtx){
  const ctx = renderCtx || R().ctx;
  const pal={a:'#478fd1',b:'#2a6099',c:'#c4d9a4',d:'#6b543f'};
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const b=(color,xx,yy,w,h)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(xx),Math.round(yy),w,h)};
  b('#a0afaf',-26,-43,13,26);b('#ecf0dd',-22,-45,8,18);
  b('#a0afaf',13,-43,13,26);b('#ecf0dd',15,-45,8,18);
  b(pal.d,-22,-28,44,25);b(pal.b,-21,-27,42,24);b(pal.d,-16,-24,32,17);
  b(pal.a,-11,-45,22,24);b(pal.a,-21,-19,15,17);b(pal.a,6,-19,15,17);
  b(pal.c,-11,-20,22,13);b(pal.b,-20,-5,13,5);b(pal.b,7,-5,13,5);
  b('#1d292f',-11,-29,5,5);b('#1d292f',7,-29,5,5);
  b('#f2fbf5',-10,-29,2,2);b('#f2fbf5',8,-29,2,2);
  ctx.restore();
}

export function drawFallback(x, y, scale=1, t=0, angle=Math.PI/2){
  drawFallbackArt(x, y, scale, t, angle, R().ctx);
}
