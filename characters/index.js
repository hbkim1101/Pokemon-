import * as raichuMove from './raichu/motion-move.js';
import * as raichuAttack from './raichu/motion-attack.js';
import * as raichuImages from './raichu/images/index.js';
import * as charizardMove from './charizard/motion-move.js';
import * as charizardAttack from './charizard/motion-attack.js';
import * as charizardImages from './charizard/images/index.js';
import * as blastoiseMove from './blastoise/motion-move.js';
import * as blastoiseAttack from './blastoise/motion-attack.js';
import * as blastoiseImages from './blastoise/images/index.js';
import * as venusaurMove from './venusaur/motion-move.js';
import * as venusaurAttack from './venusaur/motion-attack.js';
import * as venusaurImages from './venusaur/images/index.js';

export const CHARACTERS = {
  raichu: { pmdId:'0026', move: raichuMove, attack: raichuAttack, images: raichuImages },
  charizard: { pmdId:'0006', move: charizardMove, attack: charizardAttack, images: charizardImages },
  blastoise: { pmdId:'0009', move: blastoiseMove, attack: blastoiseAttack, images: blastoiseImages },
  venusaur: { pmdId:'0003', move: venusaurMove, attack: venusaurAttack, images: venusaurImages },
};

export const PMD_TO_KEY = Object.fromEntries(Object.entries(CHARACTERS).map(([k,v])=>[v.pmdId,k]));

export function characterForPmd(pmdId){
  return CHARACTERS[PMD_TO_KEY[pmdId]] || CHARACTERS.charizard;
}
