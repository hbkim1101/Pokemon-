'use strict';
/* Mint League story rules. Non-commercial fan system. Pokémon is not our trademark. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.StoryCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DIRS = ['down', 'left', 'right', 'up'];
  const DX = { down: 0, left: -1, right: 1, up: 0 };
  const DY = { down: 1, left: 0, right: 0, up: -1 };
  const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  const BOX_LIMIT = 30;
  const PARTY_LIMIT = 6;

  const CHART = {
    normal: { rock: 0.5, ghost: 0 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, rock: 2, bug: 0.5, dragon: 0.5, flying: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, bug: 2, rock: 0.5, dragon: 0.5 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5 },
    rock: { fire: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, rock: 2, bug: 0.5, flying: 0 },
    fighting: { normal: 2, rock: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, ghost: 0, dark: 2 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0 },
    dragon: { dragon: 2 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5 }
  };

  function move(name, type, power, acc, cat, extra) {
    return Object.assign({ name, type, power, acc, cat }, extra || {});
  }
  const MOVES = {
    tackle: move('몸통박치기', 'normal', 40, 100, 'physical'),
    scratch: move('할퀴기', 'normal', 40, 100, 'physical'),
    quickattack: move('전광석화', 'normal', 40, 100, 'physical', { priority: 1 }),
    swift: move('스피드스타', 'normal', 60, 100, 'special', { neverMiss: true }),
    slash: move('베어가르기', 'normal', 70, 100, 'physical'),
    megapunch: move('힘껏펀치', 'normal', 80, 85, 'physical'),
    takedown: move('돌진', 'normal', 90, 85, 'physical', { recoil: 0.25 }),
    vinewhip: move('덩굴채찍', 'grass', 45, 100, 'physical'),
    razorleaf: move('잎날가르기', 'grass', 55, 95, 'physical'),
    seedbomb: move('씨폭탄', 'grass', 80, 100, 'physical'),
    petaldance: move('꽃잎댄스', 'grass', 120, 100, 'special'),
    poisonpowder: move('독가루', 'poison', 0, 75, 'status', { status: 'poison', chance: 1 }),
    ember: move('불꽃세례', 'fire', 40, 100, 'special', { status: 'burn', chance: 0.1 }),
    firefang: move('불꽃엄니', 'fire', 65, 95, 'physical', { status: 'burn', chance: 0.1 }),
    flamethrower: move('화염방사', 'fire', 90, 100, 'special', { status: 'burn', chance: 0.1 }),
    fireblast: move('불대문자', 'fire', 110, 85, 'special', { status: 'burn', chance: 0.1 }),
    watergun: move('물대포', 'water', 40, 100, 'special'),
    waterpulse: move('물의파동', 'water', 60, 100, 'special'),
    aquatail: move('아쿠아테일', 'water', 90, 90, 'physical'),
    surf: move('파도타기', 'water', 90, 100, 'special'),
    hydropump: move('하이드로펌프', 'water', 110, 80, 'special'),
    thundershock: move('전기쇼크', 'electric', 40, 100, 'special', { status: 'paralysis', chance: 0.1 }),
    spark: move('스파크', 'electric', 65, 100, 'physical', { status: 'paralysis', chance: 0.3 }),
    thunderbolt: move('10만볼트', 'electric', 90, 100, 'special', { status: 'paralysis', chance: 0.1 }),
    thunder: move('번개', 'electric', 110, 70, 'special', { status: 'paralysis', chance: 0.3 }),
    rockthrow: move('돌떨구기', 'rock', 50, 90, 'physical'),
    rocktomb: move('암석봉인', 'rock', 60, 95, 'physical'),
    rockblast: move('스톤샤워', 'rock', 75, 90, 'physical'),
    stoneedge: move('스톤에지', 'rock', 100, 80, 'physical'),
    mudslap: move('진흙뿌리기', 'ground', 20, 100, 'special'),
    bulldoze: move('땅고르기', 'ground', 60, 100, 'physical'),
    earthquake: move('지진', 'ground', 100, 100, 'physical'),
    poisonsting: move('독침', 'poison', 15, 100, 'physical', { status: 'poison', chance: 0.3 }),
    sludgebomb: move('오물폭탄', 'poison', 90, 100, 'special', { status: 'poison', chance: 0.3 }),
    bugbite: move('벌레먹음', 'bug', 60, 100, 'physical'),
    silverwind: move('은빛바람', 'bug', 60, 100, 'special'),
    xscissor: move('시저크로스', 'bug', 80, 100, 'physical'),
    gust: move('바람일으키기', 'flying', 40, 100, 'special'),
    wingattack: move('날개치기', 'flying', 60, 100, 'physical'),
    aerialace: move('제비반환', 'flying', 60, 100, 'physical', { neverMiss: true }),
    fly: move('공중날기', 'flying', 90, 95, 'physical'),
    karate: move('태권당수', 'fighting', 50, 100, 'physical'),
    brickbreak: move('깨트리기', 'fighting', 75, 100, 'physical'),
    closecombat: move('인파이트', 'fighting', 120, 100, 'physical'),
    lick: move('핥기', 'ghost', 30, 100, 'physical', { status: 'paralysis', chance: 0.3 }),
    suckerpunch: move('기습', 'dark', 70, 100, 'physical'),
    shadowball: move('섀도볼', 'ghost', 80, 100, 'special'),
    confusion: move('염동력', 'psychic', 50, 100, 'special'),
    psychic: move('사이코키네시스', 'psychic', 90, 100, 'special'),
    dragonbreath: move('용의숨결', 'dragon', 60, 100, 'special'),
    outrage: move('역린', 'dragon', 120, 100, 'physical')
  };

  function learn() {
    return Array.from(arguments).map(function (pair) { return { lv: pair[0], id: pair[1] }; });
  }
  const LINE = {
    bulba: learn([1, 'tackle'], [5, 'vinewhip'], [9, 'poisonpowder'], [13, 'razorleaf'], [20, 'seedbomb'], [28, 'petaldance']),
    char: learn([1, 'scratch'], [5, 'ember'], [13, 'firefang'], [20, 'flamethrower'], [34, 'wingattack'], [40, 'fireblast'], [46, 'outrage']),
    squirt: learn([1, 'tackle'], [5, 'watergun'], [13, 'waterpulse'], [20, 'aquatail'], [28, 'surf'], [40, 'hydropump']),
    cater: learn([1, 'tackle'], [1, 'bugbite'], [10, 'gust'], [12, 'confusion'], [16, 'silverwind'], [22, 'psychic']),
    pidge: learn([1, 'tackle'], [5, 'gust'], [13, 'quickattack'], [21, 'wingattack'], [31, 'aerialace'], [39, 'fly']),
    rat: learn([1, 'tackle'], [4, 'quickattack'], [10, 'bite'], [16, 'takedown'], [24, 'suckerpunch']),
    pika: learn([1, 'thundershock'], [6, 'quickattack'], [13, 'spark'], [20, 'swift'], [26, 'thunderbolt'], [36, 'thunder']),
    sand: learn([1, 'scratch'], [6, 'mudslap'], [12, 'bulldoze'], [20, 'slash'], [30, 'earthquake']),
    odd: learn([1, 'tackle'], [7, 'poisonpowder'], [13, 'razorleaf'], [20, 'sludgebomb'], [28, 'petaldance'], [36, 'seedbomb']),
    psy: learn([1, 'scratch'], [8, 'watergun'], [16, 'confusion'], [24, 'waterpulse'], [32, 'psychic'], [40, 'surf']),
    poli: learn([1, 'watergun'], [9, 'mudslap'], [15, 'waterpulse'], [23, 'bulldoze'], [31, 'surf'], [39, 'hydropump']),
    mach: learn([1, 'tackle'], [7, 'karate'], [16, 'megapunch'], [24, 'brickbreak'], [34, 'closecombat']),
    geo: learn([1, 'tackle'], [4, 'rockthrow'], [10, 'bulldoze'], [16, 'rocktomb'], [24, 'rockblast'], [32, 'earthquake'], [40, 'stoneedge']),
    volt: learn([1, 'tackle'], [7, 'thundershock'], [15, 'spark'], [24, 'swift'], [30, 'thunderbolt'], [40, 'thunder']),
    gas: learn([1, 'lick'], [8, 'suckerpunch'], [15, 'confusion'], [22, 'shadowball'], [32, 'psychic']),
    mew: learn([1, 'swift'], [1, 'psychic'], [8, 'shadowball'], [20, 'thunderbolt'], [30, 'flamethrower'], [40, 'psychic'], [50, 'fireblast'])
  };
  // Rattata's early dark move is registered under a real move id.
  LINE.rat = learn([1, 'tackle'], [4, 'quickattack'], [10, 'suckerpunch'], [16, 'takedown'], [24, 'slash']);

  function spec(id, dex, name, types, base, catchRate, yieldExp, evo, line) {
    return { id, dex, name, types, base: { hp: base[0], atk: base[1], def: base[2], spa: base[3], spd: base[4], spe: base[5] }, catch: catchRate, yield: yieldExp, evo, learn: line };
  }
  const SPECIES_LIST = [
    spec('bulbasaur', 1, '이상해씨', ['grass', 'poison'], [45, 49, 49, 65, 65, 45], 45, 64, { into: 'ivysaur', level: 16 }, LINE.bulba),
    spec('ivysaur', 2, '이상해풀', ['grass', 'poison'], [60, 62, 63, 80, 80, 60], 45, 142, { into: 'venusaur', level: 32 }, LINE.bulba),
    spec('venusaur', 3, '이상해꽃', ['grass', 'poison'], [80, 82, 83, 100, 100, 80], 45, 236, null, LINE.bulba),
    spec('charmander', 4, '파이리', ['fire'], [39, 52, 43, 60, 50, 65], 45, 62, { into: 'charmeleon', level: 16 }, LINE.char),
    spec('charmeleon', 5, '리자드', ['fire'], [58, 64, 58, 80, 65, 80], 45, 142, { into: 'charizard', level: 36 }, LINE.char),
    spec('charizard', 6, '리자몽', ['fire', 'flying'], [78, 84, 78, 109, 85, 100], 45, 240, null, LINE.char),
    spec('squirtle', 7, '꼬부기', ['water'], [44, 48, 65, 50, 64, 43], 45, 63, { into: 'wartortle', level: 16 }, LINE.squirt),
    spec('wartortle', 8, '어니부기', ['water'], [59, 63, 80, 65, 80, 58], 45, 142, { into: 'blastoise', level: 36 }, LINE.squirt),
    spec('blastoise', 9, '거북왕', ['water'], [79, 83, 100, 85, 105, 78], 45, 239, null, LINE.squirt),
    spec('caterpie', 10, '캐터피', ['bug'], [45, 30, 35, 20, 20, 45], 255, 39, { into: 'metapod', level: 7 }, LINE.cater),
    spec('metapod', 11, '단데기', ['bug'], [50, 20, 55, 25, 25, 30], 120, 72, { into: 'butterfree', level: 10 }, LINE.cater),
    spec('butterfree', 12, '버터플', ['bug', 'flying'], [60, 45, 50, 90, 80, 70], 45, 178, null, LINE.cater),
    spec('pidgey', 16, '구구', ['normal', 'flying'], [40, 45, 40, 35, 35, 56], 255, 50, { into: 'pidgeotto', level: 18 }, LINE.pidge),
    spec('pidgeotto', 17, '피죤', ['normal', 'flying'], [63, 60, 55, 50, 50, 71], 120, 122, { into: 'pidgeot', level: 36 }, LINE.pidge),
    spec('pidgeot', 18, '피죤투', ['normal', 'flying'], [83, 80, 75, 70, 70, 101], 45, 216, null, LINE.pidge),
    spec('rattata', 19, '꼬렛', ['normal'], [30, 56, 35, 25, 35, 72], 255, 51, { into: 'raticate', level: 20 }, LINE.rat),
    spec('raticate', 20, '레트라', ['normal'], [55, 81, 60, 50, 70, 97], 127, 145, null, LINE.rat),
    spec('pikachu', 25, '피카츄', ['electric'], [35, 55, 40, 50, 50, 90], 190, 112, { into: 'raichu', stone: 'thunderstone' }, LINE.pika),
    spec('raichu', 26, '라이츄', ['electric'], [60, 90, 55, 90, 80, 110], 75, 218, null, LINE.pika),
    spec('sandshrew', 27, '모래두지', ['ground'], [50, 75, 85, 20, 30, 40], 255, 60, { into: 'sandslash', level: 22 }, LINE.sand),
    spec('sandslash', 28, '고지', ['ground'], [75, 100, 110, 45, 55, 65], 90, 158, null, LINE.sand),
    spec('oddish', 43, '모다피', ['grass', 'poison'], [45, 50, 55, 75, 65, 30], 255, 64, { into: 'gloom', level: 21 }, LINE.odd),
    spec('gloom', 44, '냄새꼬', ['grass', 'poison'], [60, 65, 70, 85, 75, 40], 120, 138, { into: 'vileplume', stone: 'leafstone' }, LINE.odd),
    spec('vileplume', 45, '라플레시아', ['grass', 'poison'], [75, 80, 85, 110, 90, 50], 45, 221, null, LINE.odd),
    spec('psyduck', 54, '고라파덕', ['water'], [50, 52, 48, 65, 50, 55], 190, 64, { into: 'golduck', level: 33 }, LINE.psy),
    spec('golduck', 55, '골덕', ['water'], [80, 82, 78, 95, 80, 85], 75, 175, null, LINE.psy),
    spec('poliwag', 60, '발챙이', ['water'], [40, 50, 40, 40, 40, 90], 255, 60, { into: 'poliwhirl', level: 25 }, LINE.poli),
    spec('poliwhirl', 61, '슈륙챙이', ['water'], [65, 65, 65, 50, 50, 90], 120, 135, null, LINE.poli),
    spec('machop', 66, '알통몬', ['fighting'], [70, 80, 50, 35, 35, 35], 180, 61, { into: 'machoke', level: 28 }, LINE.mach),
    spec('machoke', 67, '근육몬', ['fighting'], [80, 100, 70, 50, 60, 45], 90, 142, null, LINE.mach),
    spec('geodude', 74, '꼬마돌', ['rock', 'ground'], [40, 80, 100, 30, 30, 20], 255, 60, { into: 'graveler', level: 25 }, LINE.geo),
    spec('graveler', 75, '데구리', ['rock', 'ground'], [55, 95, 115, 45, 45, 35], 120, 137, null, LINE.geo),
    spec('voltorb', 100, '찌리리공', ['electric'], [40, 30, 50, 55, 55, 100], 190, 66, { into: 'electrode', level: 30 }, LINE.volt),
    spec('electrode', 101, '붐볼', ['electric'], [60, 50, 70, 80, 80, 150], 60, 172, null, LINE.volt),
    spec('gastly', 92, '고오스', ['ghost', 'poison'], [30, 35, 30, 100, 35, 80], 190, 62, { into: 'haunter', level: 25 }, LINE.gas),
    spec('haunter', 93, '고우스트', ['ghost', 'poison'], [45, 50, 45, 115, 55, 95], 90, 142, null, LINE.gas),
    spec('mewtwo', 150, '뮤츠', ['psychic'], [106, 110, 90, 154, 90, 130], 3, 306, null, LINE.mew)
  ];
  const SPECIES = {};
  SPECIES_LIST.forEach(function (sp) { SPECIES[sp.id] = sp; });

  const ITEMS = {
    potion: { name: '상처약', price: 200, kind: 'heal', amount: 20, desc: 'HP를 20 회복한다.' },
    superpotion: { name: '좋은상처약', price: 700, kind: 'heal', amount: 60, desc: 'HP를 60 회복한다.' },
    hyperpotion: { name: '고급상처약', price: 1500, kind: 'heal', amount: 120, desc: 'HP를 120 회복한다.' },
    revive: { name: '기력의조각', price: 1500, kind: 'revive', desc: '쓰러진 포켓몬을 HP 절반으로 일으킨다.' },
    pokeball: { name: '몬스터볼', price: 200, kind: 'ball', mod: 1, desc: '야생 포켓몬을 잡는다.' },
    greatball: { name: '수퍼볼', price: 600, kind: 'ball', mod: 1.5, desc: '몬스터볼보다 잡기 쉽다.' },
    ultraball: { name: '하이퍼볼', price: 1200, kind: 'ball', mod: 2, desc: '성능이 좋은 볼.' },
    thunderstone: { name: '천둥의돌', price: 3000, kind: 'stone', desc: '피카츄를 진화시킨다.' },
    leafstone: { name: '리프의돌', price: 3000, kind: 'stone', desc: '냄새꼬를 진화시킨다.' }
  };

  function partyOf() {
    return Array.from(arguments).map(function (row) { return { speciesId: row[0], level: row[1] }; });
  }
  const TRAINERS = {
    gym1: { name: '반석', badge: '그레이배지', badgeId: 'gray', need: 0, reward: 700, place: '바위 체육관', intro: '돌은 정직하다. 네 파트너도 그런지 보자.', party: partyOf(['geodude', 8], ['geodude', 10]) },
    gym2: { name: '시내', badge: '블루배지', badgeId: 'blue', need: 1, reward: 1100, place: '물결 체육관', intro: '물은 길을 가리지 않는다. 배틀이다.', party: partyOf(['poliwag', 13], ['psyduck', 14], ['poliwhirl', 16]) },
    gym3: { name: '스파크', badge: '오렌지배지', badgeId: 'orange', need: 2, reward: 1600, place: '번개 체육관', intro: '느린 포켓몬은 여기서 멈춘다.', party: partyOf(['voltorb', 18], ['pikachu', 19], ['voltorb', 21]) },
    gym4: { name: '새싹', badge: '레인보우배지', badgeId: 'rainbow', need: 3, reward: 2000, place: '숲 체육관', intro: '풀숲에서 키운 실력을 보여 줘.', party: partyOf(['oddish', 23], ['gloom', 25], ['gloom', 27]) },
    gym5: { name: '독초', badge: '소울배지', badgeId: 'soul', need: 4, reward: 2600, place: '안개 체육관', intro: '보이지 않는 공격을 견딜 수 있나.', party: partyOf(['gastly', 29], ['gloom', 30], ['haunter', 32]) },
    gym6: { name: '철권', badge: '마쉬배지', badgeId: 'marsh', need: 5, reward: 3200, place: '격투 체육관', intro: '기술은 주먹보다 먼저 나가지 않는다.', party: partyOf(['machop', 33], ['machop', 35], ['machoke', 37]) },
    gym7: { name: '모래', badge: '어스배지', badgeId: 'earth', need: 6, reward: 3800, place: '대지 체육관', intro: '발을 딛는 땅이 네 편이 아닐 수도 있다.', party: partyOf(['sandshrew', 37], ['sandslash', 39], ['graveler', 40]) },
    gym8: { name: '하늘', badge: '페더배지', badgeId: 'feather', need: 7, reward: 4600, place: '창공 체육관', intro: '마지막 배지다. 하늘을 넘겨라.', party: partyOf(['pidgeotto', 41], ['pidgeot', 43], ['butterfree', 42]) },
    champion: {
      name: '정상', badge: null, badgeId: null, need: 8, reward: 8000, place: '민트 리그',
      intro: '배지 여덟 개로 여기까지 왔다. 민트 리그의 정상은 내가 지키고 있다.',
      party: function (state) {
        const starter = state.flags.starter;
        const ace = starter === 'bulbasaur' ? 'charizard' : starter === 'charmander' ? 'blastoise' : 'venusaur';
        return partyOf(['pidgeot', 44], ['raichu', 45], ['golduck', 45], ['graveler', 46], ['machoke', 46], [ace, 48]);
      }
    }
  };

  const WILD_BANDS = [
    { minX: 40, maxX: 57, table: [['pidgey', 2, 4], ['rattata', 2, 4], ['caterpie', 2, 3], ['oddish', 3, 4], ['poliwag', 3, 4]] },
    { minX: 58, maxX: 81, table: [['poliwag', 10, 14], ['sandshrew', 11, 14], ['machop', 12, 15], ['psyduck', 12, 16], ['pidgey', 10, 13]] },
    { minX: 82, maxX: 105, table: [['voltorb', 18, 22], ['pikachu', 17, 21], ['gloom', 20, 24], ['geodude', 18, 22], ['poliwhirl', 20, 23]] },
    { minX: 106, maxX: 121, table: [['gastly', 26, 30], ['machop', 28, 32], ['pidgeotto', 26, 30], ['graveler', 30, 34], ['haunter', 28, 32]] },
    { minX: 122, maxX: 999, table: [['raticate', 34, 38], ['golduck', 36, 40], ['raichu', 36, 39], ['sandslash', 36, 40], ['electrode', 38, 41]] }
  ];

  function validateData() {
    Object.keys(SPECIES).forEach(function (id) {
      const sp = SPECIES[id];
      sp.learn.forEach(function (entry) {
        if (!MOVES[entry.id]) throw new Error('missing move ' + entry.id + ' on ' + id);
      });
      if (sp.evo && !SPECIES[sp.evo.into]) throw new Error('bad evo ' + id);
    });
    Object.keys(TRAINERS).forEach(function (id) {
      const party = typeof TRAINERS[id].party === 'function' ? TRAINERS[id].party({ flags: { starter: 'squirtle' } }) : TRAINERS[id].party;
      party.forEach(function (p) { if (!SPECIES[p.speciesId]) throw new Error('bad trainer mon ' + id); });
    });
  }

  function room(w, h, exit, spawn) {
    const grid = [];
    for (let y = 0; y < h; y++) {
      grid[y] = [];
      for (let x = 0; x < w; x++) {
        const border = x === 0 || y === 0 || x === w - 1 || y === h - 1;
        grid[y][x] = border ? { k: 'wall', solid: true } : { k: 'floor', solid: false };
      }
    }
    grid[exit.y][exit.x] = { k: 'exit', solid: false };
    return { w: w, h: h, grid: grid, exit: exit, spawn: spawn, npcs: [], objects: [] };
  }

  const INTERIORS = {
    house: room(9, 8, { x: 4, y: 6 }, { x: 4, y: 3 }),
    lab: room(13, 9, { x: 6, y: 7 }, { x: 6, y: 5 }),
    center: room(11, 9, { x: 5, y: 7 }, { x: 5, y: 5 }),
    mart: room(11, 9, { x: 5, y: 7 }, { x: 5, y: 5 }),
    raid: room(11, 9, { x: 5, y: 7 }, { x: 5, y: 5 }),
    league: room(13, 10, { x: 6, y: 8 }, { x: 6, y: 6 })
  };
  ['gym1', 'gym2', 'gym3', 'gym4', 'gym5', 'gym6', 'gym7', 'gym8'].forEach(function (id) {
    INTERIORS[id] = room(11, 10, { x: 5, y: 8 }, { x: 5, y: 6 });
  });
  INTERIORS.house.npcs = [{ id: 'mom', name: '엄마', color: '#e07a9a' }];
  INTERIORS.lab.npcs = [{ id: 'prof', name: '민 박사', color: '#f4f1e8', x: 6, y: 2 }];
  INTERIORS.lab.objects = [
    { id: 'ball-bulbasaur', kind: 'starter', species: 'bulbasaur', x: 3, y: 3, solid: true },
    { id: 'ball-charmander', kind: 'starter', species: 'charmander', x: 6, y: 3, solid: true },
    { id: 'ball-squirtle', kind: 'starter', species: 'squirtle', x: 9, y: 3, solid: true }
  ];
  INTERIORS.center.npcs = [{ id: 'nurse', name: '간호사', color: '#ff8fb3', x: 5, y: 2 }];
  INTERIORS.center.objects = [{ id: 'pc', kind: 'pc', x: 2, y: 2, solid: true }];
  INTERIORS.mart.npcs = [{ id: 'clerk', name: '점원', color: '#7dba6a', x: 5, y: 2 }];
  INTERIORS.raid.npcs = [{ id: 'raid', name: '제단', color: '#d7c4ff', x: 5, y: 3 }];
  INTERIORS.league.npcs = [{ id: 'champion', name: '챔피언 정상', color: '#f2d36b', x: 6, y: 2 }];
  Object.keys(TRAINERS).forEach(function (id) {
    if (id === 'champion') return;
    INTERIORS[id].npcs = [{ id: id, name: TRAINERS[id].name, color: '#f0c36a', x: 5, y: 2, trainerId: id }];
  });

  function building(id, name, x, y, w, h, doorSide) {
    const doorX = x + Math.floor(w / 2);
    const doorY = doorSide === 'north' ? y + h - 1 : y;
    const front = doorSide === 'north' ? { x: doorX, y: doorY + 1 } : { x: doorX, y: doorY - 1 };
    return { id: id, name: name, x: x, y: y, w: w, h: h, doorX: doorX, doorY: doorY, front: front, doorSide: doorSide };
  }
  const BUILDINGS = [
    building('house', '우리 집', 4, 10, 8, 5, 'north'),
    building('lab', '민 박사 연구소', 16, 10, 10, 5, 'north'),
    building('center', '포켓몬센터', 30, 10, 8, 5, 'north'),
    building('mart', '프렌들리숍', 16, 18, 8, 5, 'south'),
    building('gym1', '바위 체육관', 46, 10, 8, 5, 'north'),
    building('gym2', '물결 체육관', 58, 18, 8, 5, 'south'),
    building('gym3', '번개 체육관', 72, 10, 8, 5, 'north'),
    building('gym4', '숲 체육관', 84, 18, 8, 5, 'south'),
    building('gym5', '안개 체육관', 98, 10, 8, 5, 'north'),
    building('gym6', '격투 체육관', 110, 18, 8, 5, 'south'),
    building('gym7', '대지 체육관', 124, 10, 8, 5, 'north'),
    building('raid', '레이드 제단', 124, 18, 8, 5, 'south'),
    building('gym8', '창공 체육관', 138, 10, 8, 5, 'north'),
    building('league', '민트 리그', 150, 18, 10, 5, 'south')
  ];
  const BUILD_BY_ID = {};
  BUILDINGS.forEach(function (b) { BUILD_BY_ID[b.id] = b; });

  const WORLD_W = 164;
  const WORLD_H = 30;
  const OVERWORLD = [];
  for (let y = 0; y < WORLD_H; y++) {
    OVERWORLD[y] = [];
    for (let x = 0; x < WORLD_W; x++) OVERWORLD[y][x] = { k: 'tree', solid: true };
  }
  function carvePath(x0, y0, x1, y1) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (OVERWORLD[y] && OVERWORLD[y][x]) OVERWORLD[y][x] = { k: 'path', solid: false };
    }
  }
  carvePath(2, 14, 38, 20);
  carvePath(2, 15, WORLD_W - 3, 17);
  BUILDINGS.forEach(function (b) {
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) {
      OVERWORLD[y][x] = { k: 'roof', solid: true, buildingId: b.id };
    }
    OVERWORLD[b.doorY][b.doorX] = { k: 'door', solid: false, buildingId: b.id };
  });
  for (let x = 40; x < WORLD_W - 2; x++) {
    [13, 14, 18, 19].forEach(function (y) {
      const cell = OVERWORLD[y][x];
      if (cell && cell.k === 'tree') OVERWORLD[y][x] = { k: 'grass', solid: false };
    });
  }
  for (let y = 23; y <= 25; y++) for (let x = 42; x <= 46; x++) OVERWORLD[y][x] = { k: 'water', solid: true };
  const SIGNS = [
    [12, 16, '민트마을. 동쪽 풀숲에 야생 포켓몬이 있다.'],
    [38, 16, '여기서부터 1번 도로. 풀에 들어가면 배틀이 시작된다.'],
    [47, 16, '바위 체육관. 리더는 반석.'],
    [62, 16, '물결 체육관. 리더는 시내. 그레이배지가 필요하다.'],
    [76, 16, '번개 체육관. 리더는 스파크.'],
    [88, 16, '숲 체육관. 리더는 새싹.'],
    [102, 16, '안개 체육관. 리더는 독초.'],
    [114, 16, '격투 체육관. 리더는 철권.'],
    [128, 16, '대지 체육관과 레이드 제단. 배지 5개면 전설이 눈을 뜬다.'],
    [142, 16, '창공 체육관. 리더는 하늘. 마지막 배지.'],
    [154, 16, '민트 리그. 배지 8개면 챔피언에게 도전한다.']
  ];
  SIGNS.forEach(function (s) {
    if (OVERWORLD[s[1]] && OVERWORLD[s[1]][s[0]] && OVERWORLD[s[1]][s[0]].k === 'path') {
      OVERWORLD[s[1]][s[0]] = { k: 'sign', solid: true, text: s[2] };
    }
  });

  function tile(mapId, x, y) {
    const grid = mapId === 'overworld' ? OVERWORLD : INTERIORS[mapId] && INTERIORS[mapId].grid;
    if (!grid || !grid[y] || !grid[y][x]) return null;
    return grid[y][x];
  }
  function momPos(state) {
    return state.flags.momTalk ? { x: 2, y: 2 } : { x: 4, y: 4 };
  }
  function npcsOn(state, mapId) {
    const roomData = INTERIORS[mapId];
    if (!roomData) return [];
    return roomData.npcs.map(function (npc) {
      if (npc.id === 'mom') return Object.assign({}, npc, momPos(state));
      return npc;
    });
  }
  function npcAt(state, mapId, x, y) {
    return npcsOn(state, mapId).find(function (npc) { return npc.x === x && npc.y === y; }) || null;
  }
  function objectAt(mapId, x, y) {
    const roomData = INTERIORS[mapId];
    if (!roomData) return null;
    return roomData.objects.find(function (obj) { return obj.x === x && obj.y === y; }) || null;
  }
  function blocked(state, mapId, x, y) {
    const cell = tile(mapId, x, y);
    if (!cell) return true;
    if (cell.solid) return true;
    if (npcAt(state, mapId, x, y)) return true;
    const obj = objectAt(mapId, x, y);
    if (obj && obj.solid) return true;
    return false;
  }
  function step(state, mapId, x, y, dir) {
    const nx = x + DX[dir];
    const ny = y + DY[dir];
    if (blocked(state, mapId, nx, ny)) return null;
    const dest = tile(mapId, nx, ny);
    if (dest.k === 'door') {
      const inside = INTERIORS[dest.buildingId];
      return { mapId: dest.buildingId, x: inside.spawn.x, y: inside.spawn.y };
    }
    if (dest.k === 'exit') {
      const front = BUILD_BY_ID[mapId].front;
      return { mapId: 'overworld', x: front.x, y: front.y };
    }
    return { mapId: mapId, x: nx, y: ny };
  }
  function rng(state) {
    state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
    return state.seed / 4294967296;
  }
  function hasHealthy(state) { return state.party.some(function (mon) { return mon.hp > 0; }); }
  function expToNext(level) { return 15 * level + 20; }
  function computeStats(mon) {
    const base = SPECIES[mon.speciesId].base;
    const lv = mon.level;
    const out = {};
    STATS.forEach(function (key) {
      out[key] = key === 'hp'
        ? Math.floor(((2 * base.hp + mon.ivs.hp) * lv) / 100) + lv + 10
        : Math.floor(((2 * base[key] + mon.ivs[key]) * lv) / 100) + 5;
    });
    return out;
  }
  function refreshStats(mon) {
    const stats = computeStats(mon);
    mon.maxHp = stats.hp;
    if (mon.hp == null) mon.hp = stats.hp;
    if (mon.hp > mon.maxHp) mon.hp = mon.maxHp;
    return stats;
  }
  function defaultMoves(sp, level) {
    const ids = [];
    sp.learn.forEach(function (entry) {
      if (entry.lv <= level && ids.indexOf(entry.id) < 0) ids.push(entry.id);
    });
    return (ids.length ? ids : ['tackle']).slice(-4);
  }
  let uidCounter = 1;
  function makeMon(speciesId, level, roll, opts) {
    opts = opts || {};
    roll = roll || Math.random;
    const sp = SPECIES[speciesId];
    if (!sp) throw new Error('unknown species ' + speciesId);
    const ivs = {};
    STATS.forEach(function (key) { ivs[key] = opts.ivs && opts.ivs[key] != null ? opts.ivs[key] : Math.floor(roll() * 32); });
    const mon = {
      uid: opts.uid || uidCounter++,
      speciesId: speciesId,
      level: level,
      exp: 0,
      ivs: ivs,
      status: null,
      shiny: opts.shiny != null ? opts.shiny : roll() < 1 / 128,
      moves: defaultMoves(sp, level),
      pendingLearn: [],
      evoLockLevel: null,
      hp: null,
      maxHp: null
    };
    refreshStats(mon);
    mon.hp = mon.maxHp;
    return mon;
  }
function monName(mon) {
  return (mon.shiny ? '빛나는 ' : '') + SPECIES[mon.speciesId].name;
}
function batchim(name) {
  const code = name.charCodeAt(name.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}
function josa(name, withBatchim, withoutBatchim) {
  return name + (batchim(name) ? withBatchim : withoutBatchim);
}
  function effectiveness(moveType, defTypes) {
    return defTypes.reduce(function (acc, type) {
      const row = CHART[moveType] || {};
      return acc * (row[type] == null ? 1 : row[type]);
    }, 1);
  }
  function typesOf(mon) { return SPECIES[mon.speciesId].types; }
  function battleStats(mon) {
    const stats = computeStats(mon);
    if (mon.status === 'burn') stats.atk = Math.max(1, Math.floor(stats.atk / 2));
    if (mon.status === 'paralysis') stats.spe = Math.max(1, Math.floor(stats.spe / 2));
    return stats;
  }
  function evolutionTarget(mon) {
    const evo = SPECIES[mon.speciesId].evo;
    if (!evo || evo.level == null) return null;
    if (mon.evoLockLevel != null && mon.level <= mon.evoLockLevel) return null;
    if (mon.level >= evo.level) return evo.into;
    return null;
  }
  function applyEvolution(mon, into) {
    const from = SPECIES[mon.speciesId].name;
    const ratio = mon.maxHp ? mon.hp / mon.maxHp : 1;
    mon.speciesId = into;
    mon.evoLockLevel = null;
    refreshStats(mon);
    mon.hp = mon.hp <= 0 ? 0 : Math.max(1, Math.min(mon.maxHp, Math.round(mon.maxHp * ratio)));
    return { from: from, to: SPECIES[into].name };
  }
  function commitEvolution(state, mon) {
    const into = evolutionTarget(mon);
    if (!into) return null;
    const result = applyEvolution(mon, into);
    state.flags.firstEvo = true;
    return result;
  }
  function gainExp(mon, amount) {
    mon.exp += amount;
    const learned = [];
    let levels = 0;
    const sp = SPECIES[mon.speciesId];
    while (mon.level < 100 && mon.exp >= expToNext(mon.level)) {
      mon.exp -= expToNext(mon.level);
      mon.level += 1;
      levels += 1;
      const before = mon.maxHp;
      refreshStats(mon);
      if (mon.hp > 0) mon.hp = Math.min(mon.maxHp, mon.hp + (mon.maxHp - before));
      sp.learn.forEach(function (entry) {
        if (entry.lv !== mon.level) return;
        if (mon.moves.indexOf(entry.id) >= 0 || mon.pendingLearn.indexOf(entry.id) >= 0) return;
        if (mon.moves.length + mon.pendingLearn.length < 4) {
          mon.moves.push(entry.id);
          learned.push({ id: entry.id, auto: true });
        } else {
          mon.pendingLearn.push(entry.id);
          learned.push({ id: entry.id, auto: false });
        }
      });
    }
    return { levels: levels, learned: learned, evo: levels > 0 ? evolutionTarget(mon) : null };
  }
  function expGain(foe, victor, trainer) {
    let amount = Math.floor(SPECIES[foe.speciesId].yield * foe.level / 5);
    if (trainer) amount = Math.floor(amount * 1.5);
    if (foe.speciesId === 'mewtwo') amount = Math.min(amount, expToNext(victor.level));
    return Math.max(10, amount);
  }
  function wildBand(x) {
    return WILD_BANDS.filter(function (band) { return x >= band.minX && x <= band.maxX; })[0] || WILD_BANDS[0];
  }
  function rollWild(state) {
    const band = wildBand(state.x);
    const row = band.table[Math.floor(rng(state) * band.table.length)];
    const level = row[1] + Math.floor(rng(state) * (row[2] - row[1] + 1));
    return makeMon(row[0], level, function () { return rng(state); });
  }
  function createGame(name, seed) {
    const safe = String(name || '트레이너').replace(/\s+/g, ' ').trim().slice(0, 8) || '트레이너';
    return {
      v: 1,
      name: safe,
      mapId: 'house',
      x: INTERIORS.house.spawn.x,
      y: INTERIORS.house.spawn.y,
      dir: 'down',
      money: 500,
      bag: { potion: 0, superpotion: 0, hyperpotion: 0, revive: 0, pokeball: 0, greatball: 0, ultraball: 0, thunderstone: 0, leafstone: 0 },
      party: [],
      box: [],
      badges: [],
      flags: {},
      seen: [],
      caught: [],
      playMs: 0,
      seed: (seed == null ? 20260321 : seed) >>> 0,
      fame: null,
      encounterRate: 0.2
    };
  }
  function markSeen(state, speciesId) { if (state.seen.indexOf(speciesId) < 0) state.seen.push(speciesId); }
  function markCaught(state, speciesId) {
    markSeen(state, speciesId);
    if (state.caught.indexOf(speciesId) < 0) state.caught.push(speciesId);
  }
  function tryMove(state, dir) {
    if (DIRS.indexOf(dir) < 0) return { ok: false };
    state.dir = dir;
    const next = step(state, state.mapId, state.x, state.y, dir);
    if (!next) return { ok: false, reason: 'blocked' };
    const previous = state.mapId;
    state.mapId = next.mapId;
    state.x = next.x;
    state.y = next.y;
    if (previous !== state.mapId) return { ok: true, warp: true, mapId: state.mapId };
    const landed = tile(state.mapId, state.x, state.y);
    if (landed && landed.k === 'grass') {
      if (!state.party.length) return { ok: true, warning: '포켓몬이 없어 풀숲의 기척을 그냥 지나쳤다.' };
      if (!hasHealthy(state)) return { ok: true, warning: '쓰러진 포켓몬뿐이라 배틀을 피했다. 포켓몬센터로 가라.' };
      const rate = state.encounterRate == null ? 0.2 : state.encounterRate;
      if (rate > 0 && rng(state) < rate) {
        const wild = rollWild(state);
        markSeen(state, wild.speciesId);
        return { ok: true, encounter: wild };
      }
    }
    return { ok: true };
  }
  function chooseStarter(state, speciesId) {
    if (state.flags.starter) return { ok: false, message: '이미 파트너가 있다.' };
    if (['bulbasaur', 'charmander', 'squirtle'].indexOf(speciesId) < 0) return { ok: false, message: '그 포켓몬은 고를 수 없다.' };
    const mon = makeMon(speciesId, 5, function () { return rng(state); }, { shiny: false, ivs: { hp: 15, atk: 15, def: 15, spa: 15, spd: 15, spe: 15 } });
    state.party.push(mon);
    state.flags.starter = speciesId;
    state.bag.pokeball += 5;
    markCaught(state, speciesId);
    return { ok: true, message: josa(SPECIES[speciesId].name, '을', '를') + ' 받았다. 몬스터볼 5개도 건네받았다.', mon: mon };
  }
  function talkLeader(state, trainerId) {
    const trainer = TRAINERS[trainerId];
    if (!hasHealthy(state)) return { type: 'text', lines: ['포켓몬이 모두 쓰러져 있다. 포켓몬센터로 가라.'] };
    if (state.badges.length < trainer.need) return { type: 'text', lines: [trainer.place + '에 도전하려면 배지 ' + trainer.need + '개가 필요하다. 지금은 ' + state.badges.length + '개다.'] };
    if (trainerId !== 'champion' && state.flags['beat_' + trainerId]) return { type: 'text', lines: [trainer.badge + '는 이미 네 것이다. 다음 체육관은 동쪽이다.'] };
    const again = trainerId === 'champion' && state.flags.beat_champion;
    return { type: 'battle', trainerId: trainerId, lines: [again ? '한 번 더 겨뤄 보자.' : trainer.intro] };
  }
  function interact(state) {
    const x = state.x + DX[state.dir];
    const y = state.y + DY[state.dir];
    const npc = npcAt(state, state.mapId, x, y);
    if (npc) {
      if (npc.id === 'mom') {
        if (!state.flags.momTalk) {
          state.flags.momTalk = true;
          state.bag.potion += 3;
          state.money += 2000;
          return { type: 'text', lines: ['민트마을에 온 걸 환영해, ' + state.name + '.', '민 박사님이 연구실에서 기다리고 계셔. 밖으로 나가 왼쪽이 아니라 길 위의 연구소로 가렴.', '상처약 3개와 용돈 2000원을 줄게.'] };
        }
        return { type: 'text', lines: ['박사님께 인사하고, 풀숲이랑 체육관을 돌아보렴. 쓰러지면 포켓몬센터다.'] };
      }
      if (npc.id === 'prof') {
        if (!state.flags.starter) return { type: 'text', lines: ['어서 오너라, ' + state.name + '. 나는 민트마을의 민이다.', '테이블 위 세 마리 중 여행을 함께할 포켓몬을 고르거라.', '잡은 포켓몬은 동료가 되고, 일정 레벨이 되면 진화한다. 배지 8개면 리그, 배지 5개면 동쪽 제단의 레이드다.'] };
        return { type: 'text', lines: ['파트너는 잘 크고 있느냐. 상점은 집 남쪽, 센터는 연구소 동쪽이다.'] };
      }
      if (npc.id === 'nurse') {
        if (!state.party.length) return { type: 'text', lines: ['치료할 포켓몬이 아직 없구나.'] };
        state.party.forEach(function (mon) { mon.hp = mon.maxHp; mon.status = null; });
        state.flags.usedCenter = true;
        return { type: 'text', lines: ['포켓몬센터에 어서 와.', '모두 건강해졌다. 박스는 왼쪽 컴퓨터다.'] };
      }
      if (npc.id === 'clerk') return { type: 'shop', lines: ['프렌들리숍이다. 배지를 모으면 더 좋은 도구가 들어온다.'] };
      if (npc.id === 'raid') {
        if (state.badges.length < 5) return { type: 'text', lines: ['제단은 봉인되어 있다. 배지 5개가 필요하다.'] };
        if (state.flags.caughtMewtwo) return { type: 'text', lines: ['제단은 조용하다. 뮤츠는 이미 동료다.'] };
        if (!hasHealthy(state)) return { type: 'text', lines: ['포켓몬이 모두 쓰러져 있어 레이드를 시작할 수 없다.'] };
        return { type: 'raid', lines: ['제단이 빛난다. 약해질수록 볼이 잘 먹힌다. 쓰러뜨리기만 하면 다시 부를 수 있다.'] };
      }
      if (npc.trainerId) return talkLeader(state, npc.trainerId);
      if (npc.id === 'champion') return talkLeader(state, 'champion');
    }
    const obj = objectAt(state.mapId, x, y);
    if (obj) {
      if (obj.kind === 'starter') {
        if (state.flags.starter) return { type: 'text', lines: ['볼은 비어 있다. 파트너는 이미 골랐다.'] };
        return { type: 'confirm-starter', species: obj.species, lines: [josa(SPECIES[obj.species].name, '과', '와') + ' 여행을 시작할까?'] };
      }
      if (obj.kind === 'pc') {
        if (!state.party.length) return { type: 'text', lines: ['맡길 포켓몬이 없다.'] };
        return { type: 'pc', lines: ['박스 컴퓨터에 접속했다. 지닐 수 있는 포켓몬은 6마리다.'] };
      }
    }
    const cell = tile(state.mapId, x, y);
    if (cell && cell.k === 'sign') return { type: 'text', lines: [cell.text] };
    return { type: 'none' };
  }
  function healAmount(mon, amount) {
    if (mon.hp <= 0) return { ok: false, message: '쓰러진 포켓몬에게는 쓸 수 없다.' };
    if (mon.hp >= mon.maxHp) return { ok: false, message: josa(monName(mon), '은', '는') + ' 이미 건강하다.' };
    const before = mon.hp;
    mon.hp = Math.min(mon.maxHp, mon.hp + amount);
    return { ok: true, message: monName(mon) + '의 체력이 ' + (mon.hp - before) + ' 회복되었다.' };
  }
  function useFieldItem(state, itemId, partyIndex) {
    const item = ITEMS[itemId];
    const mon = state.party[partyIndex];
    if (!item || !(state.bag[itemId] > 0)) return { ok: false, message: '그 도구는 없다.' };
    if (!mon) return { ok: false, message: '대상이 없다.' };
    if (item.kind === 'ball') return { ok: false, message: '몬스터볼은 배틀에서만 쓴다.' };
    if (item.kind === 'heal') {
      const result = healAmount(mon, item.amount);
      if (!result.ok) return result;
      state.bag[itemId] -= 1;
      state.flags.usedHeal = true;
      return result;
    }
    if (item.kind === 'revive') {
      if (mon.hp > 0) return { ok: false, message: '아직 쓰러지지 않았다.' };
      mon.hp = Math.max(1, Math.floor(mon.maxHp / 2));
      mon.status = null;
      state.bag[itemId] -= 1;
      state.flags.usedHeal = true;
      return { ok: true, message: josa(monName(mon), '이', '가') + ' 다시 일어났다.' };
    }
    if (item.kind === 'stone') {
      const evo = SPECIES[mon.speciesId].evo;
      if (!evo || evo.stone !== itemId) return { ok: false, message: '효과가 없다.' };
      state.bag[itemId] -= 1;
      const names = applyEvolution(mon, evo.into);
      return { ok: true, evolved: true, message: names.from + '가 ' + names.to + '(으)로 진화했다.' };
    }
    return { ok: false, message: '여기서는 쓸 수 없다.' };
  }
  function deposit(state, partyIndex) {
    if (state.party.length <= 1) return { ok: false, message: '마지막 포켓몬은 맡길 수 없다.' };
    if (state.box.length >= BOX_LIMIT) return { ok: false, message: '박스가 가득 찼다.' };
    const mon = state.party.splice(partyIndex, 1)[0];
    if (!mon) return { ok: false, message: '대상이 없다.' };
    state.box.push(mon);
    state.flags.usedBox = true;
    return { ok: true, message: josa(monName(mon), '을', '를') + ' 박스에 맡겼다.' };
  }
  function withdraw(state, boxIndex) {
    if (state.party.length >= PARTY_LIMIT) return { ok: false, message: '지닐 수 있는 포켓몬은 6마리까지다.' };
    const mon = state.box.splice(boxIndex, 1)[0];
    if (!mon) return { ok: false, message: '박스가 비어 있다.' };
    state.party.push(mon);
    return { ok: true, message: josa(monName(mon), '을', '를') + ' 파티로 불러왔다.' };
  }
  function martStock(state) {
    const count = state.badges.length;
    const list = ['potion', 'pokeball'];
    if (count >= 1) list.push('superpotion', 'greatball');
    if (count >= 3) list.push('hyperpotion', 'ultraball', 'revive');
    if (count >= 4) list.push('thunderstone', 'leafstone');
    return list;
  }
  function buyItem(state, itemId) {
    if (martStock(state).indexOf(itemId) < 0) return { ok: false, message: '아직 팔지 않는 도구다.' };
    const item = ITEMS[itemId];
    if (state.money < item.price) return { ok: false, message: '돈이 부족하다.' };
    state.money -= item.price;
    state.bag[itemId] += 1;
    return { ok: true, message: item.name + '을 샀다.' };
  }
  function blackout(state) {
    const loss = Math.max(0, Math.floor(state.money / 10));
    state.money -= loss;
    state.party.forEach(function (mon) { mon.hp = mon.maxHp; mon.status = null; });
    state.mapId = 'center';
    state.x = INTERIORS.center.spawn.x;
    state.y = INTERIORS.center.spawn.y;
    state.dir = 'up';
    state.flags.usedCenter = true;
    return loss;
  }
  function catchChance(mon, itemId, raid) {
    const item = ITEMS[itemId];
    const hurt = 1 - mon.hp / mon.maxHp;
    if (raid) return Math.max(0.04, Math.min(0.9, 0.08 + hurt * 0.42 * item.mod));
    const rate = SPECIES[mon.speciesId].catch / 255;
    const hpFactor = (3 * mon.maxHp - 2 * mon.hp) / (3 * mon.maxHp);
    const statusMod = mon.status ? 1.4 : 1;
    return Math.max(0.03, Math.min(0.95, rate * hpFactor * item.mod * statusMod * 1.35));
  }
  function addCaught(state, mon) {
    markCaught(state, mon.speciesId);
    state.flags.firstCatch = true;
    if (mon.speciesId === 'mewtwo') state.flags.caughtMewtwo = true;
    if (state.party.length < PARTY_LIMIT) {
      state.party.push(mon);
      return 'party';
    }
    if (state.box.length < BOX_LIMIT) {
      state.box.push(mon);
      state.flags.usedBox = true;
      return 'box';
    }
    return 'full';
  }
  function activeMon(battle) { return battle.state.party[battle.playerIndex]; }
  function activeFoe(battle) { return battle.foe[battle.foeIndex]; }
  function say(battle, text, extra) { battle.events.push(Object.assign({ text: text }, extra || {})); }
  function createBattle(state, options) {
    return {
      state: state,
      kind: options.kind,
      trainerId: options.trainerId || null,
      canRun: options.canRun,
      canCatch: options.canCatch,
      foe: options.foe,
      foeIndex: 0,
      playerIndex: state.party.findIndex(function (mon) { return mon.hp > 0; }),
      over: null,
      pending: null,
      afterLearn: null,
      events: [],
      money: 0
    };
  }
  function startTrainerBattle(state, trainerId) {
    const gate = talkLeader(state, trainerId);
    if (gate.type !== 'battle') return gate;
    const party = (typeof TRAINERS[trainerId].party === 'function' ? TRAINERS[trainerId].party(state) : TRAINERS[trainerId].party)
      .map(function (row, index) {
        return makeMon(row.speciesId, row.level, function () { return rng(state); }, { shiny: false, uid: 't' + trainerId + index, ivs: { hp: 12, atk: 12, def: 12, spa: 12, spd: 12, spe: 12 } });
      });
    party.forEach(function (mon) { markSeen(state, mon.speciesId); });
    const battle = createBattle(state, { kind: 'trainer', trainerId: trainerId, canRun: false, canCatch: false, foe: party });
    say(battle, TRAINERS[trainerId].name + '의 ' + josa(monName(party[0]), '이', '가') + ' 나왔다.');
    return { type: 'battle', battle: battle, lines: gate.lines };
  }
  function startWildBattle(state, mon) {
    const battle = createBattle(state, { kind: 'wild', canRun: true, canCatch: true, foe: [mon] });
    say(battle, '야생의 ' + josa(monName(mon), '이', '가') + ' 나타났다.');
    return battle;
  }
  function startRaidBattle(state) {
    const mon = makeMon('mewtwo', 40, function () { return rng(state); }, { shiny: false, ivs: { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 } });
    markSeen(state, 'mewtwo');
    const battle = createBattle(state, { kind: 'raid', canRun: false, canCatch: true, foe: [mon] });
    say(battle, '레이드가 시작됐다. 전설의 포켓몬 뮤츠가 나타났다.');
    return battle;
  }
  function pickAiMove(battle, roll) {
    const foe = activeFoe(battle);
    const player = activeMon(battle);
    let best = -1;
    let pool = [];
    foe.moves.forEach(function (id) {
      const data = MOVES[id];
      const score = (data.power || 0) * effectiveness(data.type, typesOf(player));
      if (score > best) { best = score; pool = [id]; }
      else if (score === best) pool.push(id);
    });
    return pool[Math.floor(roll() * pool.length)] || foe.moves[0];
  }
  function bestMoveSlot(attacker, defender) {
    let best = -1;
    let slot = 0;
    attacker.moves.forEach(function (id, index) {
      const data = MOVES[id];
      const score = (data.power || 0) * effectiveness(data.type, typesOf(defender));
      if (score > best) { best = score; slot = index; }
    });
    return slot;
  }
  function speedOf(mon) { return battleStats(mon).spe; }
  function performMove(battle, actor, target, moveId, roll, actorSide, scale) {
    const data = MOVES[moveId];
    if (actor.status === 'paralysis' && roll() < 0.25) {
      say(battle, josa(monName(actor), '은', '는') + ' 마비되어 움직일 수 없다.');
      return;
    }
    say(battle, monName(actor) + '의 ' + data.name + '.');
    if (!data.neverMiss && roll() * 100 > data.acc) {
      say(battle, '그러나 빗나갔다.');
      return;
    }
    if (!data.power) {
      if (target.status || effectiveness(data.type, typesOf(target)) === 0) say(battle, '효과가 없다.');
      else { target.status = data.status; say(battle, monName(target) + '에게 ' + statusName(data.status) + ' 상태가 걸렸다.'); }
      return;
    }
    const eff = effectiveness(data.type, typesOf(target));
    if (eff === 0) { say(battle, monName(target) + '에게는 효과가 없다.'); return; }
    const atk = battleStats(actor);
    const def = battleStats(target);
    const attack = data.cat === 'physical' ? atk.atk : atk.spa;
    const defense = data.cat === 'physical' ? def.def : def.spd;
    const stab = typesOf(actor).indexOf(data.type) >= 0 ? 1.5 : 1;
    const crit = roll() < 1 / 16 ? 1.5 : 1;
    const vary = 0.85 + roll() * 0.15;
    let damage = Math.floor(((2 * actor.level / 5 + 2) * data.power * attack / Math.max(1, defense)) / 50 + 2);
    damage = Math.max(1, Math.floor(damage * stab * eff * crit * vary * (scale == null ? 1 : scale)));
    target.hp = Math.max(0, target.hp - damage);
    say(battle, monName(target) + '에게 ' + damage + '의 데미지.', { eff: eff, crit: crit > 1, amount: damage, side: actorSide === 'player' ? 'foe' : 'player' });
    if (eff >= 2) say(battle, '효과가 굉장했다.');
    else if (eff <= 0.5) say(battle, '효과가 별로인 듯하다.');
    if (crit > 1) say(battle, '급소에 맞았다.');
    if (data.recoil && target.hp >= 0) {
      const recoil = Math.max(1, Math.floor(damage * data.recoil));
      actor.hp = Math.max(0, actor.hp - recoil);
      say(battle, monName(actor) + '도 반동으로 데미지를 입었다.');
    }
    if (target.hp > 0 && data.status && data.chance && !target.status && roll() < data.chance && canStatus(target, data.status)) {
      target.status = data.status;
      say(battle, monName(target) + '에게 ' + statusName(data.status) + ' 상태가 걸렸다.');
    }
  }
  function canStatus(mon, status) {
    const types = typesOf(mon);
    if (status === 'burn' && types.indexOf('fire') >= 0) return false;
    if (status === 'poison' && (types.indexOf('poison') >= 0)) return false;
    if (status === 'paralysis' && types.indexOf('electric') >= 0) return false;
    return true;
  }
  function statusName(status) { return status === 'burn' ? '화상' : status === 'poison' ? '독' : '마비'; }
  function tickStatus(battle, mon) {
    if (!mon || mon.hp <= 0 || !mon.status || mon.status === 'paralysis') return;
    const loss = Math.max(1, Math.floor(mon.maxHp / 8));
    mon.hp = Math.max(0, mon.hp - loss);
    say(battle, josa(monName(mon), '이', '가') + ' ' + statusName(mon.status) + ' 피해를 입었다.');
  }
  function awardFoe(battle) {
    const foe = activeFoe(battle);
    const player = activeMon(battle);
    say(battle, josa(monName(foe), '이', '가') + ' 쓰러졌다.');
    if (player && player.hp > 0) {
      const amount = expGain(foe, player, !!battle.trainerId);
      const result = gainExp(player, amount);
      say(battle, josa(monName(player), '이', '가') + ' 경험치 ' + amount + '을 얻었다.');
      if (result.levels) say(battle, josa(monName(player), '이', '가') + ' 레벨 ' + player.level + '(으)로 올랐다.');
      result.learned.forEach(function (entry) {
        if (entry.auto) say(battle, josa(monName(player), '이', '가') + ' ' + josa(MOVES[entry.id].name, '을', '를') + ' 배웠다.');
      });
      if (!battle.trainerId) battle.money += foe.level * 18;
      battle.pendingEvo = result.evo ? player.uid : battle.pendingEvo;
    }
    battle.foeIndex += 1;
    if (battle.foeIndex >= battle.foe.length) battle.afterLearn = 'win';
    else battle.afterLearn = 'next';
    if (player && player.pendingLearn.length) {
      battle.pending = { type: 'learn', moveId: player.pendingLearn[0] };
      return;
    }
    continueAfterLearn(battle);
  }
  function continueAfterLearn(battle) {
    const next = battle.afterLearn;
    battle.afterLearn = null;
    if (next === 'win') {
      if (battle.kind === 'raid' && !battle.state.flags.caughtMewtwo) {
        battle.over = 'raid-fled';
        say(battle, '뮤츠는 레이드 너머로 사라졌다. 제단에서 다시 부를 수 있다.');
      } else {
        battle.over = 'win';
        say(battle, battle.trainerId ? TRAINERS[battle.trainerId].name + '와의 승부에서 이겼다.' : '야생 포켓몬을 쓰러뜨렸다.');
      }
      return;
    }
    if (next === 'next') {
      const foe = activeFoe(battle);
      markSeen(battle.state, foe.speciesId);
      say(battle, josa(TRAINERS[battle.trainerId].name, '이', '가') + ' ' + josa(monName(foe), '을', '를') + ' 내보냈다.');
    }
  }
  function playerFainted(battle) {
    const player = activeMon(battle);
    say(battle, josa(monName(player), '이', '가') + ' 쓰러졌다.');
    const next = battle.state.party.findIndex(function (mon) { return mon.hp > 0; });
    if (next < 0) {
      battle.over = 'lose';
      say(battle, battle.state.name + '에게 더 이상 싸울 포켓몬이 없다.');
      return;
    }
    battle.pending = { type: 'switch', forced: true };
  }
  function afterBlows(battle) {
    const foe = activeFoe(battle);
    const player = activeMon(battle);
    if (foe && foe.hp <= 0 && player && player.hp > 0) return awardFoe(battle);
    if (player && player.hp <= 0) return playerFainted(battle);
    if (foe && foe.hp <= 0) return awardFoe(battle);
  }
  function enemyAttacks(battle, roll) {
    const foe = activeFoe(battle);
    const player = activeMon(battle);
    if (!foe || foe.hp <= 0 || !player || player.hp <= 0) return;
    performMove(battle, foe, player, pickAiMove(battle, roll), roll, 'foe');
    tickStatus(battle, player);
    tickStatus(battle, foe);
    afterBlows(battle);
  }
  function fightTurn(battle, slot, roll) {
    const player = activeMon(battle);
    const foe = activeFoe(battle);
    const moveId = player.moves[slot];
    if (!moveId) { say(battle, '그 기술은 없다.'); return; }
    const foeMove = pickAiMove(battle, roll);
    const pPri = MOVES[moveId].priority || 0;
    const fPri = MOVES[foeMove].priority || 0;
    let playerFirst = pPri !== fPri ? pPri > fPri : speedOf(player) !== speedOf(foe) ? speedOf(player) > speedOf(foe) : roll() < 0.5;
    const order = playerFirst ? ['player', 'foe'] : ['foe', 'player'];
    for (let i = 0; i < order.length; i++) {
      if (activeMon(battle).hp <= 0 || activeFoe(battle).hp <= 0) break;
      if (order[i] === 'player') performMove(battle, activeMon(battle), activeFoe(battle), moveId, roll, 'player');
      else performMove(battle, activeFoe(battle), activeMon(battle), foeMove, roll, 'foe');
    }
    if (activeMon(battle).hp > 0) tickStatus(battle, activeMon(battle));
    if (activeFoe(battle) && activeFoe(battle).hp > 0) tickStatus(battle, activeFoe(battle));
    afterBlows(battle);
  }
  function throwBall(battle, itemId, roll) {
    const item = ITEMS[itemId];
    const foe = activeFoe(battle);
    if (!battle.canCatch) { say(battle, '남의 포켓몬에게는 쓸 수 없다.'); return false; }
    if (battle.state.party.length >= PARTY_LIMIT && battle.state.box.length >= BOX_LIMIT) {
      say(battle, '파티와 박스가 가득 차 볼을 던질 수 없다.');
      return false;
    }
    battle.state.bag[itemId] -= 1;
    const chance = catchChance(foe, itemId, battle.kind === 'raid');
    say(battle, item.name + '을 던졌다.');
    if (roll() < chance) {
      const where = addCaught(battle.state, foe);
      battle.over = 'catch';
      say(battle, josa(monName(foe), '을', '를') + ' 잡았다. ' + (where === 'box' ? '박스로 전송되었다.' : where === 'party' ? '동료가 되었다.' : '자리가 없어 놓쳤다.'));
      if (where === 'full') battle.over = null;
      return true;
    }
    say(battle, '아깝다. 볼에서 나왔다.');
    return false;
  }
  function battleCommand(battle, cmd, roll) {
    roll = roll || function () { return rng(battle.state); };
    battle.events = [];
    if (battle.over) return battle;
    if (battle.pending && battle.pending.type === 'learn') {
      const mon = activeMon(battle);
      const moveId = mon.pendingLearn[0];
      if (cmd.type !== 'learn') { say(battle, '새 기술을 어떻게 할지 정해야 한다.'); return battle; }
      if (cmd.replace == null) say(battle, MOVES[moveId].name + '를 배우지 않기로 했다.');
      else {
        mon.moves[cmd.replace] = moveId;
        say(battle, josa(monName(mon), '이', '가') + ' ' + josa(MOVES[moveId].name, '을', '를') + ' 배웠다.');
      }
      mon.pendingLearn.shift();
      if (mon.pendingLearn.length) {
        battle.pending = { type: 'learn', moveId: mon.pendingLearn[0] };
        return battle;
      }
      battle.pending = null;
      continueAfterLearn(battle);
      return battle;
    }
    if (battle.pending && battle.pending.type === 'switch') {
      if (cmd.type !== 'switch') { say(battle, '다음 포켓몬을 내보내야 한다.'); return battle; }
      const mon = battle.state.party[cmd.index];
      if (!mon || mon.hp <= 0) { say(battle, '그 포켓몬은 싸울 수 없다.'); return battle; }
      battle.playerIndex = cmd.index;
      battle.pending = null;
      say(battle, '가랏, ' + monName(mon) + '.');
      if (activeFoe(battle) && activeFoe(battle).hp <= 0) awardFoe(battle);
      return battle;
    }
    if (cmd.type === 'run') {
      if (!battle.canRun) { say(battle, '여기서는 도망칠 수 없다.'); enemyAttacks(battle, roll); return battle; }
      const chance = speedOf(activeMon(battle)) >= speedOf(activeFoe(battle)) ? 0.85 : 0.45;
      if (roll() < chance) { battle.over = 'run'; say(battle, '무사히 도망쳤다.'); return battle; }
      say(battle, '도망치지 못했다.');
      enemyAttacks(battle, roll);
      return battle;
    }
    if (cmd.type === 'switch') {
      const mon = battle.state.party[cmd.index];
      if (!mon || mon.hp <= 0 || cmd.index === battle.playerIndex) { say(battle, '교대할 수 없다.'); return battle; }
      battle.playerIndex = cmd.index;
      say(battle, '돌아와라. 가랏, ' + monName(mon) + '.');
      enemyAttacks(battle, roll);
      return battle;
    }
    if (cmd.type === 'item') {
      const item = ITEMS[cmd.itemId];
      if (!item || !(battle.state.bag[cmd.itemId] > 0)) { say(battle, '도구가 없다.'); return battle; }
      if (item.kind === 'ball') {
        const caught = throwBall(battle, cmd.itemId, roll);
        if (!caught && !battle.over) enemyAttacks(battle, roll);
        return battle;
      }
      const target = battle.state.party[cmd.index == null ? battle.playerIndex : cmd.index];
      if (!target) { say(battle, '대상이 없다.'); return battle; }
      if (item.kind === 'heal' || item.kind === 'revive') {
        const result = item.kind === 'revive'
          ? (target.hp > 0 ? { ok: false, message: '아직 쓰러지지 않았다.' } : (target.hp = Math.max(1, Math.floor(target.maxHp / 2)), target.status = null, { ok: true, message: josa(monName(target), '이', '가') + ' 일어났다.' }))
          : healAmount(target, item.amount);
        if (!result.ok) { say(battle, result.message); return battle; }
        battle.state.bag[cmd.itemId] -= 1;
        battle.state.flags.usedHeal = true;
        say(battle, result.message);
        enemyAttacks(battle, roll);
        return battle;
      }
      say(battle, '배틀 중에는 쓸 수 없다.');
      return battle;
    }
    if (cmd.type === 'fight') { fightTurn(battle, cmd.slot || 0, roll); return battle; }
    say(battle, '그 행동은 할 수 없다.');
    return battle;
  }
  function arenaCheck(battle) {
    if (battle.over || battle.pending) return { over: battle.over, pending: battle.pending, events: battle.events.slice() };
    const foe = activeFoe(battle);
    const player = activeMon(battle);
    if (foe && foe.hp <= 0 && player && player.hp > 0) awardFoe(battle);
    else if (player && player.hp <= 0) playerFainted(battle);
    return { over: battle.over, pending: battle.pending, events: battle.events.slice() };
  }
  function arenaHit(battle, side, moveId, roll, scale) {
    roll = roll || function () { return rng(battle.state); };
    battle.events = [];
    if (battle.over || battle.pending) return { ok: false, events: [] };
    const actor = side === 'player' ? activeMon(battle) : activeFoe(battle);
    const target = side === 'player' ? activeFoe(battle) : activeMon(battle);
    if (!actor || !target || actor.hp <= 0 || target.hp <= 0) return { ok: false, events: [] };
    performMove(battle, actor, target, moveId, roll, side, scale == null ? 1 : scale);
    if (actor.hp <= 0 || target.hp <= 0) arenaCheck(battle);
    return { ok: true, over: battle.over, pending: battle.pending, events: battle.events.slice() };
  }
  function arenaThrow(battle, itemId, roll) {
    roll = roll || function () { return rng(battle.state); };
    battle.events = [];
    if (!battle.canCatch) { say(battle, '여기서는 잡을 수 없다.'); return { ok: false, over: battle.over, events: battle.events.slice() }; }
    const ok = throwBall(battle, itemId, roll);
    return { ok: ok, over: battle.over, events: battle.events.slice() };
  }
  function arenaHeal(battle, itemId, index) {
    battle.events = [];
    const item = ITEMS[itemId];
    const target = battle.state.party[index == null ? battle.playerIndex : index];
    if (!item || !(battle.state.bag[itemId] > 0) || !target) { say(battle, '사용할 도구가 없다.'); return { ok: false, events: battle.events.slice() }; }
    let result;
    if (item.kind === 'revive') {
      if (target.hp > 0) result = { ok: false, message: '아직 쓰러지지 않았다.' };
      else {
        target.hp = Math.max(1, Math.floor(target.maxHp / 2));
        target.status = null;
        result = { ok: true, message: josa(monName(target), '이', '가') + ' 일어났다.' };
      }
    } else if (item.kind === 'heal') result = healAmount(target, item.amount);
    else { say(battle, '배틀 중에는 쓸 수 없다.'); return { ok: false, events: battle.events.slice() }; }
    if (!result.ok) { say(battle, result.message); return { ok: false, events: battle.events.slice() }; }
    battle.state.bag[itemId] -= 1;
    battle.state.flags.usedHeal = true;
    say(battle, result.message);
    return { ok: true, events: battle.events.slice() };
  }
  function arenaRun(battle, roll) {
    roll = roll || function () { return rng(battle.state); };
    battle.events = [];
    if (!battle.canRun) { say(battle, '여기서는 도망칠 수 없다.'); return { ok: false, events: battle.events.slice() }; }
    const chance = speedOf(activeMon(battle)) >= speedOf(activeFoe(battle)) ? 0.85 : 0.45;
    if (roll() < chance) { battle.over = 'run'; say(battle, '무사히 도망쳤다.'); return { ok: true, over: 'run', events: battle.events.slice() }; }
    say(battle, '도망치지 못했다.');
    return { ok: false, events: battle.events.slice() };
  }
  function concludeBattle(state, battle) {
    if (!battle || battle.settled) return {};
    battle.settled = true;
    if (battle.over === 'win' || battle.over === 'raid-fled') state.money += battle.money;
    if (battle.over === 'win' && battle.trainerId) {
      const trainer = TRAINERS[battle.trainerId];
      const first = !state.flags['beat_' + battle.trainerId];
      state.flags['beat_' + battle.trainerId] = true;
      const prize = first ? trainer.reward : Math.floor(trainer.reward / 4);
      state.money += prize;
      let badge = null;
      if (first && trainer.badgeId && state.badges.indexOf(trainer.badgeId) < 0) {
        state.badges.push(trainer.badgeId);
        badge = trainer.badge;
      }
      if (battle.trainerId === 'champion' && first) {
        state.fame = { at: Date.now(), name: state.name, party: state.party.map(function (mon) { return { name: monName(mon), level: mon.level }; }) };
      }
      return { prize: prize, badge: badge, champion: battle.trainerId === 'champion' && first };
    }
    if (battle.over === 'lose') {
      const loss = blackout(state);
      return { blackout: true, loss: loss };
    }
    return { caught: battle.over === 'catch', fled: battle.over === 'raid-fled' };
  }
  function areaName(state) {
    if (state.mapId !== 'overworld') {
      const named = BUILD_BY_ID[state.mapId];
      return named ? named.name : '실내';
    }
    if (state.x < 40) return '민트마을';
    if (state.x < 58) return '1번 도로';
    if (state.x < 84) return '2번 도로';
    if (state.x < 110) return '3번 도로';
    if (state.x < 136) return '4번 도로';
    return '리그 로드';
  }
  function goals(state) {
    return [
      { id: 'starter', name: '박사 연구실에서 첫 포켓몬을 받는다', done: !!state.flags.starter },
      { id: 'catch', name: '몬스터볼로 야생 포켓몬을 동료로 만든다', done: !!state.flags.firstCatch },
      { id: 'evo', name: '레벨이 올라 진화시킨다', done: !!state.flags.firstEvo },
      { id: 'heal', name: '상처약 같은 도구로 치료한다', done: !!state.flags.usedHeal },
      { id: 'box', name: '박스에 포켓몬을 맡긴다', done: !!state.flags.usedBox },
      { id: 'center', name: '포켓몬센터에서 회복한다', done: !!state.flags.usedCenter },
      { id: 'badge', name: '체육관에서 배지 8개를 모은다', done: state.badges.length >= 8, progress: state.badges.length + '/8' },
      { id: 'raid', name: '레이드로 전설의 포켓몬을 잡는다', done: !!state.flags.caughtMewtwo },
      { id: 'champ', name: '챔피언에게 승리한다', done: !!state.flags.beat_champion }
    ];
  }
  function findPath(state, goal) {
    const queue = [{ mapId: state.mapId, x: state.x, y: state.y }];
    const prev = new Map();
    const stamp = function (node) { return node.mapId + ':' + node.x + ':' + node.y; };
    prev.set(stamp(queue[0]), null);
    let guard = 0;
    while (queue.length && guard++ < 30000) {
      const cur = queue.shift();
      if (cur.mapId === goal.mapId && cur.x === goal.x && cur.y === goal.y) {
        const dirs = [];
        let walk = cur;
        while (prev.get(stamp(walk))) {
          dirs.push(prev.get(stamp(walk)).dir);
          walk = prev.get(stamp(walk)).from;
        }
        return dirs.reverse();
      }
      DIRS.forEach(function (dir) {
        const next = step(state, cur.mapId, cur.x, cur.y, dir);
        if (!next || prev.has(stamp(next))) return;
        prev.set(stamp(next), { from: cur, dir: dir });
        queue.push(next);
      });
    }
    return null;
  }
  function summary(mon) {
    const sp = SPECIES[mon.speciesId];
    return {
      name: monName(mon), speciesId: mon.speciesId, dex: sp.dex, level: mon.level, types: sp.types.slice(),
      hp: mon.hp, maxHp: mon.maxHp, exp: mon.exp, expNext: expToNext(mon.level), status: mon.status, shiny: mon.shiny,
      stats: computeStats(mon), moves: mon.moves.map(function (id) { return Object.assign({ id: id }, MOVES[id]); })
    };
  }
  function serialize(state) { return JSON.stringify(state); }
  function hydrate(raw) {
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!state || state.v !== 1 || !Array.isArray(state.party) || !state.bag) throw new Error('bad save');
    state.party.concat(state.box || []).forEach(function (mon) {
      if (!mon.pendingLearn) mon.pendingLearn = [];
      refreshStats(mon);
    });
    if (state.encounterRate == null) state.encounterRate = 0.2;
    return state;
  }
  function adjacentTile(mapId, x, y, predicate) {
    for (let i = 0; i < DIRS.length; i++) {
      const nx = x + DX[DIRS[i]];
      const ny = y + DY[DIRS[i]];
      if (predicate(mapId, nx, ny)) return { mapId: mapId, x: nx, y: ny };
    }
    return null;
  }

  validateData();
  BUILDINGS.forEach(function (b) {
    const door = tile('overworld', b.doorX, b.doorY);
    const front = tile('overworld', b.front.x, b.front.y);
    if (!door || door.k !== 'door') throw new Error('door missing ' + b.id);
    if (!front || front.solid) throw new Error('front blocked ' + b.id);
  });

  return {
    DIRS: DIRS, DX: DX, DY: DY, MOVES: MOVES, SPECIES: SPECIES, ITEMS: ITEMS, TRAINERS: TRAINERS,
    INTERIORS: INTERIORS, BUILDINGS: BUILDINGS, BUILD_BY_ID: BUILD_BY_ID, OVERWORLD: OVERWORLD,
    WORLD_W: WORLD_W, WORLD_H: WORLD_H, BOX_LIMIT: BOX_LIMIT, PARTY_LIMIT: PARTY_LIMIT,
    createGame: createGame, serialize: serialize, hydrate: hydrate, tryMove: tryMove, interact: interact,
    chooseStarter: chooseStarter, useFieldItem: useFieldItem, deposit: deposit, withdraw: withdraw,
    buyItem: buyItem, martStock: martStock, blackout: blackout, makeMon: makeMon, gainExp: gainExp,
    evolutionTarget: evolutionTarget, applyEvolution: applyEvolution, commitEvolution: commitEvolution,
    catchChance: catchChance, battleCommand: battleCommand, concludeBattle: concludeBattle,
    arenaHit: arenaHit, arenaThrow: arenaThrow, arenaHeal: arenaHeal, arenaRun: arenaRun, arenaCheck: arenaCheck,
    startWildBattle: startWildBattle, startTrainerBattle: startTrainerBattle, startRaidBattle: startRaidBattle,
    bestMoveSlot: bestMoveSlot, summary: summary, goals: goals, areaName: areaName, findPath: findPath,
    tile: tile, npcsOn: npcsOn, hasHealthy: hasHealthy, expToNext: expToNext, monName: monName,
    effectiveness: effectiveness, adjacentTile: adjacentTile, wildBand: wildBand
  };
});
