import * as airSlash from './airSlash/effect.js';
import * as aquaJet from './aquaJet/effect.js';
import * as discharge from './discharge/effect.js';
import * as dragonClaw from './dragonClaw/effect.js';
import * as dragonPulse from './dragonPulse/effect.js';
import * as ember from './ember/effect.js';
import * as energyball from './energyball/effect.js';
import * as flamethrower from './flamethrower/effect.js';
import * as flashCannon from './flashCannon/effect.js';
import * as heatWave from './heatWave/effect.js';
import * as hydroPump from './hydroPump/effect.js';
import * as iceBeam from './iceBeam/effect.js';
import * as ironTail from './ironTail/effect.js';
import * as leechSeed from './leechSeed/effect.js';
import * as quickAttack from './quickAttack/effect.js';
import * as razorLeaf from './razorLeaf/effect.js';
import * as sludgeBomb from './sludgeBomb/effect.js';
import * as solarBeam from './solarBeam/effect.js';
import * as surf from './surf/effect.js';
import * as thunderShock from './thunderShock/effect.js';
import * as thunderbolt from './thunderbolt/effect.js';
import * as vineWhip from './vineWhip/effect.js';
import * as voltSwitch from './voltSwitch/effect.js';
import * as waterGun from './waterGun/effect.js';

/** skill-id → effect module. Game imports this map only. */
export const SKILLS = {
  airSlash: airSlash,
  aquaJet: aquaJet,
  discharge: discharge,
  dragonClaw: dragonClaw,
  dragonPulse: dragonPulse,
  ember: ember,
  energyball: energyball,
  flamethrower: flamethrower,
  flashCannon: flashCannon,
  heatWave: heatWave,
  hydroPump: hydroPump,
  iceBeam: iceBeam,
  ironTail: ironTail,
  leechSeed: leechSeed,
  quickAttack: quickAttack,
  razorLeaf: razorLeaf,
  sludgeBomb: sludgeBomb,
  solarBeam: solarBeam,
  surf: surf,
  thunderShock: thunderShock,
  thunderbolt: thunderbolt,
  vineWhip: vineWhip,
  voltSwitch: voltSwitch,
  waterGun: waterGun
};

export const SKILL_LIST = Object.keys(SKILLS);

export function skillEffect(id){
  return SKILLS[id] || null;
}

export const SKILL_BY_KO = Object.fromEntries(
  Object.values(SKILLS).map(m => [m.nameKo, m.id]).filter(([ko,id]) => ko && id)
);
