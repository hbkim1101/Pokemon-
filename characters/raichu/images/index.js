/** Character image helpers / fallback canvas art for raichu (PMD 0026). */
import { R } from '../../../lib/render-api.js';

export const speciesKey = 'raichu';
export const pmdId = '0026';
export const displayName = '라이츄';

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
  const pal={a:'#ecad43',b:'#d47e36',c:'#ffe68b',d:'#a86934'};
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const b=(color,xx,yy,w,h)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(xx),Math.round(yy),w,h)};
  b('#422f2a',-14,-49,8,18);b('#422f2a',7,-50,8,20);
  b(pal.a,-12,-44,5,12);b(pal.a,9,-45,5,13);
  b(pal.b,-17,-30,34,24);b(pal.a,-15,-31,30,25);
  b(pal.a,-18,-13,36,11);b(pal.c,-10,-18,20,11);
  b('#d66b51',-15,-23,8,5);b('#d66b51',7,-23,8,5);
  b(pal.d,17,-13,13,4);b(pal.d,27,-20,5,11);b(pal.c,24,-31,13,13);b(pal.c,32,-36,7,8);
  b(pal.b,-14,-5,11,5);b(pal.b,4,-5,11,5);
  b('#1d292f',-11,-29,5,5);b('#1d292f',7,-29,5,5);
  b('#f2fbf5',-10,-29,2,2);b('#f2fbf5',8,-29,2,2);
  ctx.restore();
}

export function drawFallback(x, y, scale=1, t=0, angle=Math.PI/2){
  drawFallbackArt(x, y, scale, t, angle, R().ctx);
}
