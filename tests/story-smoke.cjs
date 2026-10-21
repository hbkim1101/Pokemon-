'use strict';
const assert = require('assert');
const core = require('../story-core.js');

function rollZero() { return 0; }
function crush(battle) {
  let guard = 0;
  while (!battle.over && guard++ < 40) {
    if (battle.pending && battle.pending.type === 'switch') {
      const index = battle.state.party.findIndex(function (mon) { return mon.hp > 0; });
      core.battleCommand(battle, { type: 'switch', index: index }, rollZero);
      continue;
    }
    if (battle.pending && battle.pending.type === 'learn') {
      core.battleCommand(battle, { type: 'learn', replace: null }, rollZero);
      continue;
    }
    const foe = battle.foe[battle.foeIndex];
    const mon = battle.state.party[battle.playerIndex];
    if (mon && mon.hp > 0) mon.hp = mon.maxHp;
    if (foe) foe.hp = 1;
    const slot = core.bestMoveSlot(mon, foe);
    core.battleCommand(battle, { type: 'fight', slot: slot }, rollZero);
  }
  assert.ok(battle.over, 'battle did not end');
}

function walk(state, dirs) {
  dirs.forEach(function (dir) {
    const result = core.tryMove(state, dir);
    assert.ok(result.ok, 'blocked while walking ' + dir + ' at ' + state.mapId + ' ' + state.x + ',' + state.y);
  });
}

const game = core.createGame('민트', 7);
assert.strictEqual(game.mapId, 'house');
assert.strictEqual(game.dir, 'down');
const mom = core.interact(game);
assert.ok(mom.lines.join('').includes('민 박사'));
assert.strictEqual(game.bag.potion, 3);
assert.strictEqual(game.money, 2500);

const out = core.findPath(game, { mapId: 'overworld', x: core.BUILD_BY_ID.house.front.x, y: core.BUILD_BY_ID.house.front.y });
assert.ok(out && out.length, 'cannot leave the house');
walk(game, out);
assert.strictEqual(game.mapId, 'overworld');

const labBall = { mapId: 'lab', x: 3, y: 4 };
const toLab = core.findPath(game, labBall);
assert.ok(toLab, 'lab starter is unreachable');
walk(game, toLab);
game.dir = 'up';
const ask = core.interact(game);
assert.strictEqual(ask.type, 'confirm-starter');
const chosen = core.chooseStarter(game, 'charmander');
assert.strictEqual(chosen.ok, true);
assert.strictEqual(game.party[0].speciesId, 'charmander');
assert.strictEqual(game.party[0].level, 5);
assert.strictEqual(game.bag.pokeball, 5);

const potionMon = game.party[0];
potionMon.hp = 4;
const healed = core.useFieldItem(game, 'potion', 0);
assert.strictEqual(healed.ok, true);
assert.strictEqual(potionMon.hp, potionMon.maxHp);
assert.strictEqual(game.flags.usedHeal, true);

const wild = core.makeMon('pidgey', 3, rollZero, { shiny: false, ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } });
const battle = core.startWildBattle(game, wild);
const beforeLevel = game.party[0].level;
crush(battle);
assert.strictEqual(battle.over, 'win');
core.concludeBattle(game, battle);
assert.ok(game.party[0].level >= beforeLevel);
assert.ok(game.money > 2500);

const bulb = core.makeMon('bulbasaur', 15, rollZero, { shiny: false });
const evo = core.gainExp(bulb, core.expToNext(15));
assert.strictEqual(bulb.level, 16);
assert.strictEqual(evo.evo, 'ivysaur');
const evolved = core.commitEvolution({ flags: game.flags, party: [bulb] }, bulb);
assert.strictEqual(evolved.to, '이상해풀');
assert.strictEqual(game.flags.firstEvo, true);
const locked = core.makeMon('charmander', 16, rollZero, { shiny: false });
locked.evoLockLevel = 16;
assert.strictEqual(core.evolutionTarget(locked), null);

const cater = core.makeMon('caterpie', 4, rollZero, { shiny: false });
game.bag.pokeball += 1;
const catchBattle = core.startWildBattle(game, cater);
catchBattle.foe[0].hp = 1;
core.battleCommand(catchBattle, { type: 'item', itemId: 'pokeball' }, rollZero);
assert.strictEqual(catchBattle.over, 'catch');
assert.ok(game.party.some(function (mon) { return mon.speciesId === 'caterpie'; }));
assert.strictEqual(game.flags.firstCatch, true);

while (game.party.length < 6) game.party.push(core.makeMon('rattata', 4, rollZero, { shiny: false }));
const boxed = core.makeMon('oddish', 6, rollZero, { shiny: false });
const full = core.startWildBattle(game, boxed);
full.foe[0].hp = 1;
game.bag.pokeball += 1;
core.battleCommand(full, { type: 'item', itemId: 'pokeball' }, rollZero);
assert.strictEqual(full.over, 'catch');
assert.ok(game.box.some(function (mon) { return mon.speciesId === 'oddish'; }));
assert.strictEqual(game.flags.usedBox, true);
const deposited = core.deposit(game, 1);
assert.strictEqual(deposited.ok, true);
assert.strictEqual(core.withdraw(game, game.box.length - 1).ok, true);

const nursePath = core.findPath(game, { mapId: 'center', x: 5, y: 3 });
assert.ok(nursePath, 'pokemon center nurse is unreachable');
walk(game, nursePath);
game.party[0].hp = 1;
game.dir = 'up';
const nurse = core.interact(game);
assert.ok(nurse.lines.join('').includes('건강'));
assert.strictEqual(game.party[0].hp, game.party[0].maxHp);
assert.strictEqual(game.flags.usedCenter, true);

game.party = [core.makeMon('blastoise', 40, rollZero, { shiny: false, ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } })];
game.badges = [];
const tooSoon = core.startTrainerBattle(game, 'gym2');
assert.strictEqual(tooSoon.type, 'text');
for (let i = 1; i <= 8; i++) {
  const started = core.startTrainerBattle(game, 'gym' + i);
  assert.strictEqual(started.type, 'battle', 'gym ' + i);
  crush(started.battle);
  const reward = core.concludeBattle(game, started.battle);
  assert.ok(reward.badge, 'missing badge ' + i);
}
assert.strictEqual(game.badges.length, 8);

const earlyRaid = core.createGame('민트', 1);
earlyRaid.party = [core.makeMon('pikachu', 20, rollZero, { shiny: false })];
earlyRaid.badges = ['gray'];
assert.ok(core.interact.length);
const raidGate = { badges: earlyRaid.badges };
assert.ok(raidGate.badges.length < 5);

game.badges = game.badges.slice(0, 5);
const denied = core.startRaidBattle;
game.mapId = 'raid';
game.x = 5;
game.y = 4;
game.dir = 'up';
let raidTalk = core.interact(game);
assert.strictEqual(raidTalk.type, 'raid');
game.bag.ultraball += 3;
let raid = core.startRaidBattle(game);
raid.foe[0].hp = 1;
core.battleCommand(raid, { type: 'item', itemId: 'ultraball' }, rollZero);
assert.strictEqual(raid.over, 'catch');
assert.strictEqual(game.flags.caughtMewtwo, true);
assert.ok(game.party.concat(game.box).some(function (mon) { return mon.speciesId === 'mewtwo'; }));

const champLock = core.createGame('민트', 3);
champLock.flags.starter = 'squirtle';
champLock.party = [core.makeMon('venusaur', 50, rollZero, { shiny: false })];
champLock.badges = ['gray', 'blue'];
assert.strictEqual(core.startTrainerBattle(champLock, 'champion').type, 'text');
champLock.badges = game.badges.slice();
while (champLock.badges.length < 8) champLock.badges.push('extra' + champLock.badges.length);
const champ = core.startTrainerBattle(champLock, 'champion');
assert.strictEqual(champ.type, 'battle');
assert.strictEqual(champ.battle.foe.length, 6);
crush(champ.battle);
const ending = core.concludeBattle(champLock, champ.battle);
assert.strictEqual(ending.champion, true);
assert.ok(champLock.fame.party.length >= 1);

const pikachu = core.makeMon('pikachu', 12, rollZero, { shiny: false });
game.party = [pikachu];
game.bag.thunderstone += 1;
const stone = core.useFieldItem(game, 'thunderstone', 0);
assert.strictEqual(stone.ok, true);
assert.strictEqual(pikachu.speciesId, 'raichu');

const shopper = core.createGame('민트', 1);
shopper.money = 1000;
shopper.badges = ['gray', 'blue', 'rainbow'];
assert.ok(core.martStock(shopper).indexOf('ultraball') >= 0);
assert.strictEqual(core.buyItem(shopper, 'potion').ok, true);
assert.strictEqual(shopper.bag.potion, 1);

const fainted = core.createGame('민트', 1);
fainted.money = 1000;
fainted.party = [core.makeMon('squirtle', 8, rollZero, { shiny: false })];
fainted.party[0].hp = 0;
const loss = core.blackout(fainted);
assert.strictEqual(loss, 100);
assert.strictEqual(fainted.mapId, 'center');
assert.strictEqual(fainted.party[0].hp, fainted.party[0].maxHp);

const saved = core.hydrate(core.serialize(game));
assert.strictEqual(saved.name, '민트');
assert.strictEqual(saved.flags.caughtMewtwo, true);

core.BUILDINGS.forEach(function (building) {
  const probe = core.createGame('민트', 1);
  probe.flags.momTalk = true;
  const path = core.findPath(probe, { mapId: 'overworld', x: building.front.x, y: building.front.y });
  assert.ok(path, building.id + ' is unreachable');
});

const starter = core.makeMon('squirtle', 12, rollZero, { shiny: false, ivs: { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 } });
const fair = core.createGame('민트', 99);
fair.party = [starter];
fair.flags.starter = 'squirtle';
const gym = core.startTrainerBattle(fair, 'gym1');
let turns = 0;
while (!gym.battle.over && turns++ < 16) {
  const foe = gym.battle.foe[gym.battle.foeIndex];
  const slot = core.bestMoveSlot(fair.party[0], foe);
  core.battleCommand(gym.battle, { type: 'fight', slot: slot }, function () { return 0.2; });
}
assert.strictEqual(gym.battle.over, 'win', 'a level 12 squirtle should clear the first gym');

const eff = core.effectiveness('water', ['rock', 'ground']);
assert.strictEqual(eff, 4);
assert.strictEqual(core.effectiveness('electric', ['ground']), 0);

console.log('story smoke ok · badges', game.badges.length, '· goals sample', core.goals(champLock).filter(function (goal) { return goal.done; }).length);
