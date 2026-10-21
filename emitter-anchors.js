'use strict';
/*
 * PMDCollab sprite-local emission anchors (x,y pixels inside ONE animation cell).
 * Facing rows: 0 S, 1 SE, 2 E, 3 NE, 4 N, 5 NW, 6 W, 7 SW.
 * Measured from the source variant Shoot-Anim.png, NOT world-space offsets.
 * Coordinates follow the same scale, direction, and foot-position transform as
 * spriteDraw(). A different PMD variant uses proportional cell scaling.
 * "cast" = attack start/release frame; "hold" = sustained emission pose.
 */
window.PMD_EMISSION_ATLAS={
  '0026':{
    species:'라이츄',variant:'0004/0001',source:'sprite/0026/0004/0001/Shoot-Anim.png',
    cell:[40,56],channels:{basic:['body'],thunderbolt:['body']},
    ports:{body:{
      cast:[[20,21],[20,23],[20,24],[19,23],[20,24],[21,23],[20,24],[19,23]]
    }}
  },
  '0006':{
    species:'리자몽',variant:'0005',source:'sprite/0006/0005/Shoot-Anim.png',
    cell:[64,88],channels:{basic:['mouth'],flamethrower:['mouth']},
    ports:{mouth:{
      cast:[[32,25],[42,24],[46,25],[42,22],[32,16],[22,22],[18,25],[22,24]],
      // 13th zero-based frame: head and jaws oriented toward the target
      hold:[[32,24],[43,24],[47,25],[43,22],[32,17],[21,22],[17,25],[21,24]]
    }}
  },
  '0009':{
    species:'거북왕',variant:'0004',source:'sprite/0009/0004/Shoot-Anim.png',
    cell:[48,56],channels:{basic:['cannonLeft','cannonRight'],surf:['cannonLeft','cannonRight']},
    ports:{
      cannonLeft:{cast:[[15,18],[34,18],[42,22],[36,18],[15,17],[13,17],[8,22],[12,18]]},
      cannonRight:{cast:[[33,18],[15,19],[16,20],[15,17],[33,17],[33,18],[34,20],[34,19]]}
    }
  },
  '0003':{
    species:'이상해꽃',variant:'0003',source:'sprite/0003/0003/Shoot-Anim.png',
    cell:[40,40],channels:{basic:['mouth'],energyball:['mouth']},
    ports:{mouth:{cast:[[20,29],[29,26],[32,22],[29,20],[20,16],[11,20],[8,22],[11,26]]}}
  }
};
// Visible design choices: Raichu discharges from its body; Charizard and
// Venusaur fire from their mouths; Blastoise uses both cannon muzzles.
