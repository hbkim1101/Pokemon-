'use strict';
const assert = require('assert');
const core = require('../story-core.js');
const arenaApi = require('../story-arena.js');

function rollSteady() { return 0.2; }

const game = core.createGame('민트', 3);
const picked = core.chooseStarter(game, 'bulbasaur');
assert.strictEqual(picked.ok, true);
const mon = game.party[0];
while (mon.level < 12) core.gainExp(mon, core.expToNext(mon.level));
mon.hp = mon.maxHp;
const wild = core.makeMon('caterpie', 2, rollSteady, { shiny: false, ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } });
const battle = core.startWildBattle(game, wild);
const arena = arenaApi.create(battle);
const before = wild.hp;
let steps = 0;
while (!battle.over && steps < 2400) {
  arenaApi.step(arena, { basic: true }, 1 / 30, rollSteady);
  steps += 1;
}
assert.ok(wild.hp < before, 'real-time shots did not damage the wild Pokémon');
assert.strictEqual(battle.over, 'win');
assert.ok(mon.exp > 0 || mon.level >= 12, 'winning the arena fight did not grant experience');

const hunter = core.createGame('잡이', 4);
core.chooseStarter(hunter, 'squirtle');
hunter.party[0].hp = hunter.party[0].maxHp;
const prey = core.makeMon('rattata', 3, rollSteady);
prey.hp = 1;
const hunt = core.startWildBattle(hunter, prey);
const field = arenaApi.create(hunt);
field.player.face = 'up';
arenaApi.step(field, { ball: true }, 1 / 30, rollSteady);
let caught = hunt.over === 'catch';
for (let i = 0; i < 90 && !caught; i++) {
  arenaApi.step(field, {}, 1 / 30, function () { return 0; });
  caught = hunt.over === 'catch';
}
assert.strictEqual(hunt.over, 'catch');
assert.ok(hunter.party.some(function (pet) { return pet.speciesId === 'rattata'; }) || hunter.box.some(function (pet) { return pet.speciesId === 'rattata'; }));

const healer = core.createGame('약', 5);
core.chooseStarter(healer, 'charmander');
healer.bag.potion = 1;
healer.party[0].hp = 4;
const scrape = core.startWildBattle(healer, core.makeMon('pidgey', 2, rollSteady));
const clinic = arenaApi.create(scrape);
arenaApi.step(clinic, { potion: true }, 1 / 30, rollSteady);
assert.ok(healer.party[0].hp > 4, 'potion button did not heal during a real-time fight');
assert.strictEqual(healer.flags.usedHeal, true);

console.log('story arena ok · steps ' + steps + ' · foe hp ' + wild.hp);
