/** Character image helpers / fallback canvas art for venusaur (PMD 0003). */
import { R } from '../../../lib/render-api.js';

export const speciesKey = 'venusaur';
export const pmdId = '0003';
export const displayName = '이상해꽃';

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
  const pal={a:'#509d7c',b:'#307c60',c:'#e46d80',d:'#80be63'};
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const b=(color,xx,yy,w,h)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(xx),Math.round(yy),w,h)};
  b('#78ba65',-27,-41,54,12);b('#4f9c67',-21,-44,42,17);
  b(pal.c,-14,-59,28,33);b('#f5c981',-8,-52,16,14);
  b(pal.c,-26,-51,18,19);b(pal.c,8,-51,18,19);
  b('#86c772',-33,-37,24,14);b('#86c772',9,-37,24,14);
  b(pal.b,-23,-26,46,24);b(pal.a,-21,-24,42,20);
  b(pal.b,-23,-6,13,6);b(pal.b,10,-6,13,6);
  b('#1d292f',-11,-29,5,5);b('#1d292f',7,-29,5,5);
  b('#f2fbf5',-10,-29,2,2);b('#f2fbf5',8,-29,2,2);
  ctx.restore();
}

export function drawFallback(x, y, scale=1, t=0, angle=Math.PI/2){
  drawFallbackArt(x, y, scale, t, angle, R().ctx);
}
