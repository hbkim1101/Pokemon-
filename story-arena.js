'use strict';
/* Real-time story battles. Same verbs as the arena: move, basic shot, signature shot, dash. */
(function (root, factory) {
  const core = typeof module !== 'undefined' && module.exports ? require('./story-core.js') : root.StoryCore;
  const api = factory(core);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.StoryArena = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  const W = 480;
  const H = 270;
  const BASIC_SCALE = 0.38;
  const SPECIAL_SCALE = 0.82;

  function pickMoves(mon) {
    const list = (mon.moves || []).filter(function (id) { return core.MOVES[id] && core.MOVES[id].power > 0; });
    if (!list.length) return { basic: 'tackle', special: 'tackle' };
    let special = list[0];
    let best = -1;
    list.forEach(function (id) {
      if (core.MOVES[id].power > best) { best = core.MOVES[id].power; special = id; }
    });
    const basic = list.find(function (id) { return id !== special; }) || special;
    return { basic: basic, special: special };
  }
  function makeActor(mon, x, y, face) {
    const moves = pickMoves(mon);
    return {
      mon: mon, x: x, y: y, face: face, r: 13,
      basicCd: 0.15, specialCd: 0.4, dashCd: 0, dashLeft: 0, dashVx: 0, dashVy: 0,
      invuln: 0, stun: 0, paraCd: 0.4, hurt: 0, moves: moves
    };
  }
  function create(battle) {
    const player = battle.state.party[battle.playerIndex];
    const foe = battle.foe[battle.foeIndex];
    return {
      battle: battle, t: 0, statusT: 0, runCd: 0, potionCd: 0, ballCd: 0,
      player: makeActor(player, W / 2, H - 58, 'up'),
      foe: makeActor(foe, W / 2, 52, 'down'),
      shots: [], balls: [], toast: '', toastT: 0, W: W, H: H
    };
  }
  function speedOf(mon) {
    const stats = core.summary(mon).stats;
    const slow = mon.status === 'paralysis' ? 0.55 : 1;
    return (78 + stats.spe * 0.42) * slow;
  }
  function faceFrom(input, actor) {
    if (input.left) return 'left';
    if (input.right) return 'right';
    if (input.up) return 'up';
    if (input.down) return 'down';
    return actor.face;
  }
  function vector(face) {
    if (face === 'left') return { x: -1, y: 0 };
    if (face === 'right') return { x: 1, y: 0 };
    if (face === 'up') return { x: 0, y: -1 };
    return { x: 0, y: 1 };
  }
  function moveActor(actor, input, dt) {
    actor.basicCd = Math.max(0, actor.basicCd - dt);
    actor.specialCd = Math.max(0, actor.specialCd - dt);
    actor.dashCd = Math.max(0, actor.dashCd - dt);
    actor.invuln = Math.max(0, actor.invuln - dt);
    actor.stun = Math.max(0, actor.stun - dt);
    actor.paraCd = Math.max(0, actor.paraCd - dt);
    actor.hurt = Math.max(0, actor.hurt - dt);
    actor.moving = false;
    if (actor.stun > 0) return;
    if (actor.dashLeft > 0) {
      actor.dashLeft -= dt;
      actor.x += actor.dashVx * dt;
      actor.y += actor.dashVy * dt;
      actor.moving = true;
    } else {
      let vx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      let vy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      const mag = Math.hypot(vx, vy) || 1;
      const speed = speedOf(actor.mon);
      actor.x += vx / mag * speed * dt * (vx || vy ? 1 : 0);
      actor.y += vy / mag * speed * dt * (vx || vy ? 1 : 0);
      actor.moving = !!(vx || vy);
      if (vx || vy) actor.face = faceFrom(input, actor);
      if (input.dash && actor.dashCd <= 0) {
        const face = faceFrom(input, actor);
        const dir = vector(face);
        actor.face = face;
        actor.dashLeft = 0.16;
        actor.dashCd = 0.8;
        actor.invuln = 0.16;
      actor.dashVx = dir.x * 280;
      actor.dashVy = dir.y * 280;
      actor.moving = true;
    }
    }
    actor.x = Math.max(18, Math.min(W - 18, actor.x));
    actor.y = Math.max(18, Math.min(H - 18, actor.y));
  }
  function fire(arena, actor, side, moveId, scale) {
    const dir = vector(actor.face);
    arena.shots.push({
      x: actor.x + dir.x * 18, y: actor.y + dir.y * 16,
      vx: dir.x * 250, vy: dir.y * 250, r: 5,
      side: side, moveId: moveId, scale: scale, life: 1.15,
      type: core.MOVES[moveId].type
    });
  }
  function tryFire(arena, actor, input, side) {
    if (actor.stun > 0) return;
    if (input.basic && actor.basicCd <= 0) {
      actor.basicCd = 0.36;
      fire(arena, actor, side, actor.moves.basic, BASIC_SCALE);
    }
    if (input.special && actor.specialCd <= 0) {
      actor.specialCd = 1.25;
      fire(arena, actor, side, actor.moves.special, SPECIAL_SCALE);
    }
  }
  function foeIntent(arena) {
    const foe = arena.foe;
    const player = arena.player;
    const dx = player.x - foe.x;
    const dy = player.y - foe.y;
    const dist = Math.hypot(dx, dy) || 1;
    const input = {};
    if (dist > 78) {
      input.left = dx < -6;
      input.right = dx > 6;
      input.up = dy < -6;
      input.down = dy > 6;
    } else {
      input.left = Math.sin(arena.t * 2.2) < 0;
      input.right = !input.left;
    }
    foe.face = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    if (Math.abs(dx) < 42 || Math.abs(dy) < 28) input.basic = true;
    if (dist < 130) input.special = true;
    if (dist < 46 && foe.dashCd <= 0) input.dash = true;
    return input;
  }
  function separate(a, b) {
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    const min = a.r + b.r;
    if (dist >= min) return;
    const overlap = min - dist;
    dx /= dist;
    dy /= dist;
    const bx = Math.max(18, Math.min(W - 18, b.x + dx * overlap));
    const by = Math.max(18, Math.min(H - 18, b.y + dy * overlap));
    const moved = Math.hypot(bx - b.x, by - b.y);
    b.x = bx;
    b.y = by;
    const left = overlap - moved;
    if (left > 0.05) {
      a.x = Math.max(18, Math.min(W - 18, a.x - dx * left));
      a.y = Math.max(18, Math.min(H - 18, a.y - dy * left));
    }
  }
  function note(arena, text) {
    if (!text) return;
    arena.toast = text;
    arena.toastT = 1.4;
  }
  function syncActors(arena) {
    const battle = arena.battle;
    const player = battle.state.party[battle.playerIndex];
    const foe = battle.foe[battle.foeIndex];
    if (player && arena.player.mon !== player) arena.player = makeActor(player, W / 2, H - 58, 'up');
    if (foe && arena.foe.mon !== foe) arena.foe = makeActor(foe, W / 2, 48, 'down');
  }
  function hitActor(arena, shot, roll) {
    const target = shot.side === 'player' ? arena.foe : arena.player;
    if (target.invuln > 0) return true;
    const result = core.arenaHit(arena.battle, shot.side, shot.moveId, roll, shot.scale);
    if (result && result.events && result.events.length) note(arena, result.events[result.events.length - 1].text);
    target.invuln = 0.18;
    target.hurt = 0.12;
    return true;
  }
  function step(arena, input, dt, roll) {
    const battle = arena.battle;
    dt = Math.max(0, Math.min(0.05, dt || 0));
    roll = roll || function () { return Math.random(); };
    if (battle.over) return arena;
    arena.t += dt;
    arena.toastT = Math.max(0, arena.toastT - dt);
    arena.runCd = Math.max(0, arena.runCd - dt);
    arena.potionCd = Math.max(0, arena.potionCd - dt);
    arena.ballCd = Math.max(0, arena.ballCd - dt);
    if (battle.pending) return arena;
    syncActors(arena);
    const player = arena.player;
    const foe = arena.foe;
    if (player.mon.status === 'paralysis' && player.paraCd <= 0) {
      player.paraCd = 0.85;
      if (roll() < 0.25) player.stun = 0.28;
    }
    moveActor(player, input || {}, dt);
    moveActor(foe, foeIntent(arena), dt);
    separate(player, foe);
    tryFire(arena, player, input || {}, 'player');
    tryFire(arena, foe, foeIntent(arena), 'foe');
    if (input && input.ball && arena.ballCd <= 0 && battle.canCatch && arena.balls.length === 0) {
      const ballId = ['ultraball', 'greatball', 'pokeball'].find(function (id) { return battle.state.bag[id] > 0; });
      if (ballId) {
        const dir = vector(player.face);
        arena.balls.push({ x: player.x + dir.x * 16, y: player.y + dir.y * 14, vx: dir.x * 220, vy: dir.y * 220, itemId: ballId, life: 1.2 });
        arena.ballCd = 0.7;
      } else note(arena, '몬스터볼이 없다.');
    }
    if (input && input.potion && arena.potionCd <= 0) {
      const healId = ['hyperpotion', 'superpotion', 'potion', 'revive'].find(function (id) { return battle.state.bag[id] > 0; });
      if (healId) {
        const result = core.arenaHeal(battle, healId, battle.playerIndex);
        if (result.events && result.events.length) note(arena, result.events[result.events.length - 1].text);
        if (result.ok) arena.potionCd = 1.05;
      }
    }
    if (input && input.down && player.y > H - 30 && battle.canRun && arena.runCd <= 0) {
      const result = core.arenaRun(battle, roll);
      arena.runCd = 0.7;
      if (result.events && result.events.length) note(arena, result.events[0].text);
    }
    arena.shots = arena.shots.filter(function (shot) {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      if (shot.life <= 0 || shot.x < -8 || shot.y < -8 || shot.x > W + 8 || shot.y > H + 8) return false;
      const target = shot.side === 'player' ? foe : player;
      if (Math.hypot(shot.x - target.x, shot.y - target.y) < target.r + shot.r) return !hitActor(arena, shot, roll);
      return !battle.over && !battle.pending;
    });
    arena.balls = arena.balls.filter(function (ball) {
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.life -= dt;
      if (ball.life <= 0) return false;
      if (Math.hypot(ball.x - foe.x, ball.y - foe.y) < foe.r + 6) {
        const result = core.arenaThrow(battle, ball.itemId, roll);
        if (result.events && result.events.length) note(arena, result.events[result.events.length - 1].text);
        if (!battle.over) foe.stun = 0.35;
        return false;
      }
      return true;
    });
    arena.statusT += dt;
    if (arena.statusT >= 2.6) {
      arena.statusT = 0;
      [player, foe].forEach(function (actor) {
        const mon = actor.mon;
        if (!mon || mon.hp <= 0) return;
        if (mon.status === 'burn' || mon.status === 'poison') mon.hp = Math.max(0, mon.hp - Math.max(1, Math.floor(mon.maxHp / 16)));
      });
      core.arenaCheck(battle);
    }
    return arena;
  }

  return { create: create, step: step, W: W, H: H, pickMoves: pickMoves };
});
