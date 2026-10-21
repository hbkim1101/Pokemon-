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

// FRAME_ANCHORS_V2 — explicit direction × source-frame pixel landmarks.
// Source frames are numbered from zero, each pair [x,y] is relative to that
// EXACT source PNG cell, NOT to the actor center. Retains old cast fallback
// for optional art variants. Source PMDCollab versions are in atlas entries.
const storedSourceFrameAnchors={
 '0006':{mouth:[[[32,25],[32,25],[32,25],[32,25],[32,27],[32,29],[32,20],[32,19],[32,17],[32,27],[32,29],[32,31],[32,33],[32,34],[32,34],[32,34],[32,33],[32,33]],[[42,24],[42,25],[41,25],[41,26],[40,26],[39,26],[35,13],[36,15],[36,16],[43,30],[44,32],[45,33],[46,36],[47,38],[47,38],[47,37],[46,37],[46,36]],[[46,25],[45,26],[44,26],[43,27],[43,28],[43,28],[38,14],[39,16],[39,18],[45,33],[46,34],[47,35],[48,37],[49,39],[49,39],[48,38],[48,38],[47,37]],[[42,22],[42,23],[42,23],[42,24],[42,23],[41,22],[38,13],[38,13],[38,13],[44,22],[44,23],[43,24],[45,26],[46,28],[46,28],[46,28],[45,27],[45,27]],[[32,16],[32,17],[32,18],[32,19],[32,20],[32,21],[32,13],[32,13],[32,13],[32,19],[32,18],[32,17],[32,19],[32,20],[32,20],[32,20],[32,20],[32,20]],[[22,22],[22,23],[22,23],[22,24],[23,23],[23,22],[26,13],[26,13],[26,13],[20,22],[21,23],[21,24],[20,26],[18,28],[18,28],[19,28],[19,27],[19,27]],[[18,25],[19,26],[20,26],[21,27],[21,28],[21,28],[26,14],[26,16],[25,18],[19,33],[18,34],[17,35],[16,37],[15,39],[16,39],[16,38],[17,38],[17,37]],[[22,24],[22,25],[23,25],[23,26],[24,26],[25,26],[29,13],[29,15],[28,16],[21,30],[20,32],[19,33],[18,36],[17,38],[17,38],[18,37],[18,37],[18,36]]]},
 '0026':{body:[[[20,21],[20,19],[20,17],[20,18],[20,19],[20,21],[20,22],[20,21],[20,20],[20,21],[20,21]],[[20,23],[20,21],[20,19],[20,20],[20,21],[20,23],[20,24],[20,23],[20,22],[20,23],[20,23]],[[20,24],[20,22],[20,20],[21,21],[22,22],[21,24],[20,25],[20,24],[20,23],[20,24],[20,24]],[[19,23],[19,21],[19,19],[19,20],[19,21],[19,23],[19,24],[19,23],[19,22],[19,23],[19,23]],[[20,24],[20,22],[20,20],[20,21],[20,22],[20,24],[20,25],[20,24],[20,23],[20,24],[20,24]],[[21,23],[21,21],[21,19],[21,20],[21,21],[21,23],[21,24],[21,23],[21,22],[21,23],[21,23]],[[20,24],[20,22],[20,20],[19,21],[18,22],[19,24],[20,25],[20,24],[20,23],[20,24],[20,24]],[[19,23],[19,21],[19,19],[19,20],[19,21],[19,23],[19,24],[19,23],[19,22],[19,23],[19,23]]]},
 '0009':{cannonLeft:[[[15,18],[16,16],[17,14],[17,17],[15,18],[15,18]],[[34,18],[35,16],[37,15],[35,18],[34,19],[34,18]],[[42,22],[43,20],[44,18],[43,21],[42,22],[42,22]],[[36,18],[37,16],[39,15],[37,17],[36,18],[36,18]],[[15,17],[16,15],[18,14],[16,17],[15,18],[15,17]],[[13,17],[12,15],[10,14],[12,17],[13,18],[13,17]],[[8,22],[7,20],[6,18],[7,21],[8,22],[8,22]],[[12,18],[11,16],[9,15],[11,18],[12,19],[12,18]]],cannonRight:[[[33,18],[32,16],[31,14],[32,17],[33,18],[33,18]],[[15,19],[14,17],[13,15],[14,18],[15,19],[15,19]],[[16,20],[15,18],[14,17],[15,20],[16,21],[16,20]],[[15,17],[14,15],[12,14],[14,17],[15,18],[15,17]],[[33,17],[32,15],[30,14],[32,17],[33,18],[33,17]],[[33,18],[34,16],[36,14],[34,18],[33,19],[33,18]],[[34,20],[35,18],[36,17],[35,20],[34,21],[34,20]],[[34,19],[35,17],[37,15],[35,18],[34,19],[34,19]]]},
 '0003':{mouth:[[[20,29],[20,28],[20,26],[20,25],[20,29],[20,29]],[[29,26],[30,25],[31,24],[31,24],[29,26],[29,26]],[[32,22],[33,21],[34,21],[34,20],[32,22],[32,22]],[[29,20],[30,19],[31,18],[31,18],[29,20],[29,20]],[[20,16],[20,16],[20,14],[20,14],[20,16],[20,16]],[[11,20],[10,19],[9,18],[9,18],[11,20],[11,20]],[[8,22],[7,21],[6,21],[6,20],[8,22],[8,22]],[[11,26],[10,25],[9,24],[9,24],[11,26],[11,26]]]}
};
for(const [id,ports] of Object.entries(storedSourceFrameAnchors)){
 for(const [name,dirs] of Object.entries(ports)){
  window.PMD_EMISSION_ATLAS[id].ports[name].frames=dirs;
 }
}

const spritePixelStoreKey='pokemonArena.pmdEmitterFrameOverrides.v27';
window.setPMDEmitterFramePoint=function(id,port,dir,frame,x,y){
 const item=window.PMD_EMISSION_ATLAS[id],p=item?.ports?.[port];
 if(!p?.frames?.[dir]?.[frame])return null;
 const xy=[Math.max(0,Math.min(item.cell[0],Math.round(x))),Math.max(0,Math.min(item.cell[1],Math.round(y)))];
 p.frames[dir][frame]=xy;
 try{
  const old=JSON.parse(localStorage.getItem(spritePixelStoreKey)||'{}');
  ((old[id]??={})[port]??={})[dir]??={};
  old[id][port][dir][frame]=xy;
  localStorage.setItem(spritePixelStoreKey,JSON.stringify(old));
 }catch(err){/* storage blocked in private or preview contexts */}
 return xy;
};
window.exportPMDEmitterFramePoints=function(){
 const result={};
 for(const [id,item] of Object.entries(window.PMD_EMISSION_ATLAS)){
  result[id]={variant:item.variant,ports:{}};
  for(const [key,port] of Object.entries(item.ports))result[id].ports[key]=port.frames;
 }
 return JSON.stringify(result,null,2);
};
try{
 const saved=JSON.parse(localStorage.getItem(spritePixelStoreKey)||'{}');
 for(const [id,ports] of Object.entries(saved)){
  const atlas=window.PMD_EMISSION_ATLAS[id];if(!atlas)continue;
  for(const [name,dirs] of Object.entries(ports)){
   if(!atlas.ports[name]?.frames)continue;
   for(const [d,frames] of Object.entries(dirs)){
    for(const [f,xy] of Object.entries(frames)){
     if(!Array.isArray(xy)||xy.length!==2||!xy.every(Number.isFinite))continue;
     const cells=atlas.ports[name].frames[Number(d)];
     if(cells?.[Number(f)])cells[Number(f)]=[Math.max(0,Math.min(atlas.cell[0],xy[0])),Math.max(0,Math.min(atlas.cell[1],xy[1]))];
    }
   }
  }
 }
}catch(err){/* no localStorage available in CI mocks or restrictive browsers */}
