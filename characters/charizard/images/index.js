/** Character image helpers / fallback canvas art for charizard (PMD 0006). */
import { R } from '../../../lib/render-api.js';

export const speciesKey = 'charizard';
export const pmdId = '0006';
export const displayName = '리자몽';

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
  const pal={a:'#ef863f',b:'#c65f31',c:'#ffe3a8',d:'#3a9da9'};
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const b=(color,xx,yy,w,h)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(xx),Math.round(yy),w,h)};
  b('#277e88',-37,-37,20,20);b('#55abb0',-34,-34,15,15);b('#277e88',17,-37,20,20);b('#55abb0',19,-34,15,15);
  b(pal.b,-19,-31,38,27);b(pal.a,-17,-35,34,31);b(pal.c,-9,-25,18,20);
  b(pal.a,-15,-52,30,22);b(pal.b,-12,-57,9,8);b(pal.b,5,-57,9,8);
  b(pal.a,-26,-29,12,10);b(pal.a,14,-29,12,10);
  b(pal.b,19,-11,19,5);b('#fce48c',36,-20,9,15);b('#ff913e',41,-29,9,13);
  b(pal.b,-15,-5,12,5);b(pal.b,4,-5,12,5);
  b('#1d292f',-11,-29,5,5);b('#1d292f',7,-29,5,5);
  b('#f2fbf5',-10,-29,2,2);b('#f2fbf5',8,-29,2,2);
  ctx.restore();
}

export function drawFallback(x, y, scale=1, t=0, angle=Math.PI/2){
  drawFallbackArt(x, y, scale, t, angle, R().ctx);
}
