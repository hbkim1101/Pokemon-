// Evaluate the same ArenaFX and ArenaPixelArt renderers used by studio.html.
// Input: current studio assets from the local Arena API; output: RGBA frame cells.
(async () => {
  const response = await fetch('http://127.0.0.1:8000/api/pixel-art', { cache: 'no-store' });
  if (!response.ok) throw new Error('Open the local Arena server before exporting studio effects.');
  const store = await response.json();
  global.window = global;
  global.localStorage = {
    getItem(key) {
      return key === 'pokemon-arena-pixel-art-v1'
        ? JSON.stringify({ version: 1, moves: store.moves }) : null;
    }
  };
  global.addEventListener = () => {};
  global.setInterval = () => 0;
  global.BroadcastChannel = class { addEventListener() {} postMessage() {} close() {} };
  global.fetch = async () => ({ ok: true, json: async () => store });
  require('../thunderbolt-art.js');
  require('../pixel-presets.js');
  require('../rockruff-bite-art.js');
  require('../combat-fx.js');
  require('../pixel-art.js');
  const fx = global.ArenaFX;

  const defs = [
    { id: 'ArenaStudio_Leaf', kind: 'basic', element: 'grass', palette: ['#315a29','#52a539','#94d64a','#d6ef84'], frames: 16, fps: 16 },
    { id: 'ArenaStudio_Ember', kind: 'basic', element: 'fire', palette: ['#9c2921','#e74921','#ff8429','#ffce52'], frames: 16, fps: 16 },
    { id: 'ArenaStudio_WaterGun', kind: 'basic', element: 'water', palette: ['#294a9c','#427be7','#73bdff','#ffffff'], frames: 16, fps: 16 },
    { id: 'ArenaStudio_ThunderShock', kind: 'basic', element: 'electric', palette: ['#b7b02e','#dfe54b','#ffffff','#f1ff86'], frames: 8, fps: 16 },
    { id: 'ArenaStudio_EnergyBall', kind: 'energyball', element: 'grass', palette: ['#315a29','#52a539','#94d64a','#d6ef84','#f7ffce'], frames: 12, fps: 12 },
    { id: 'ArenaStudio_Flamethrower', kind: 'flamethrower', element: 'fire', palette: ['#9c2921','#e74921','#ff8429','#ffce52','#fff7bd'], frames: 18, fps: 12 },
    { id: 'ArenaStudio_Surf', kind: 'surf', element: 'water', palette: ['#294a9c','#427be7','#73bdff','#c6efff','#ffffff'], frames: 15, fps: 12 },
    { id: 'ArenaStudio_Tackle', kind: 'tackle', element: 'normal', palette: ['#70451b','#bb6b1d','#f0a827','#fff2ae'], frames: 12, fps: 15 },
    { id: 'ArenaStudio_QuickAttack', kind: 'dash', element: 'electric', palette: ['#70451b','#bb6b1d','#f0a827','#ffd84c','#fff2ae'], frames: 12, fps: 18 },
    { id: 'ArenaStudio_Thunderbolt', kind: 'thunder', cellScale: 2, element: 'electric', palette: ThunderboltArt.palette, frames: 16, fps: 18 },
    { id: 'ArenaStudio_ThunderboltAura', kind: 'thunderAura', element: 'electric', palette: ThunderboltArt.palette, frames: 16, fps: 18 },
    { id: 'ArenaStudio_RockThrow', kind: 'rock', cellScale: 1, element: 'rock', palette: ['#433b32','#73624d','#a18c68','#c9b58b','#efe0b6'], frames: 8, fps: 12 },
    { id: 'ArenaStudio_Bite', kind: 'bite', cellScale: 4, element: 'dark', palette: ['#241d2d','#603344','#a64d48','#e69b55','#fff0c6'], frames: 12, fps: 12 }
  ];
  const only = process.argv[2];
  if (only && !defs.some(def => def.id === only)) throw new Error('Unknown effect: ' + only);
  const output = [];
  for (const def of defs.filter(def => !only || def.id === only)) {
    const cellScale = def.cellScale || 4; fx.setPixel(cellScale);
    const frames = [];
    const sourceFrames = [];
    for (let i = 0; i < def.frames; i++) {
      const age = i / def.fps;
      const common = { x: 0, y: 0, vx: 1, vy: 0, age, life: 1.4, element: def.element, type: def.kind, variant: 0 };
      let kind, data;
      if (def.kind === 'basic') {
        kind = 'projectile';
        data = { ...common, stream: 64 };
      } else if (def.kind === 'flamethrower') {
        kind = 'flame';
        data = { ...common, stream: Math.min(300, age * 820) * Math.max(0, Math.min(1, (1.4 - age) / 0.25)) };
      } else if (def.kind === 'surf') {
        kind = 'surf';
        data = { ...common, life: 1.2 };
      } else if (def.kind === 'tackle') {
        kind = 'tackle';
        data = { ...common, life: 0.32 };
      } else if (def.kind === 'dash') {
        kind = 'dash';
        data = { ...common, life: 0.52 };
      } else if (def.kind === 'rock') {
        kind = 'rock';
        data = common;
      } else if (def.kind === 'bite') {
        kind = 'bite';
        data = common;
      } else if (def.kind === 'thunder') {
        kind = 'thunder';
        // Leave the first 64px as the sprite origin; the stepped strike now
        // fills most of the frame so it reaches the target at arena scale.
        data = { ...common, path: [{x:0,y:0},{x:210,y:0}] };
      } else if (i < 3) {
        kind = 'charge';
        data = { ...common, windup: 0.18, age: age };
      } else {
        kind = 'orb';
        data = { ...common, age: age - 0.18, type: 'orb' };
      }
      const biteCells = def.kind === 'bite' ? ArenaPixelArt.render('bite', data, 1) : null;
      const cells = (def.kind === 'thunderAura' ? ThunderboltArt.corona(i) : (biteCells || fx.cells(kind, data, cellScale))).map(([x, y, color]) => [x, y, color]);
      sourceFrames.push(cells);
      frames.push(cells.map(([x,y,color])=>[x,y,nearestColor(color,def.palette)]));
    }
    // Keep every sheet at its exact four- or five-color palette. If a renderer
    // naturally omits a shade, place that shade on the closest existing pixel
    // so the palette stays intentional without adding stray start-up sparks.
    const present=new Set(frames.flatMap(frame=>frame.map(cell=>cell[2])));
    const claimed=new Set();
    const pivot=def.kind==='flamethrower'||def.kind==='thunder'?{x:64,y:192}:{x:320,y:192};
    for(const color of def.palette){
      if(present.has(color))continue;
      let best=null;
      for(let fi=0;fi<sourceFrames.length;fi++)for(let ci=0;ci<sourceFrames[fi].length;ci++){
        if(claimed.has(`${fi}:${ci}`))continue;
        const [x,y]=sourceFrames[fi][ci];
        const px=pivot.x+x*cellScale,py=pivot.y+y*cellScale;
        if(px<0||px>=640||py<0||py>=384)continue;
        const original=sourceFrames[fi][ci][2],score=colorDistance(original,color);
        if(!best||score<best.score)best={fi,ci,score};
      }
      if(best){frames[best.fi][best.ci][2]=color;claimed.add(`${best.fi}:${best.ci}`);present.add(color);}
    }
    output.push({ ...def, cellScale, width: 640, height: 384,
      pivot, frames });
  }
  process.stdout.write(JSON.stringify({ format: 'ArenaFX cells v1', assets: output }));
})().catch((error) => {
  console.error(error.stack || String(error));
  process.exitCode = 1;
});

function colorDistance(a,b){
  const x=parseInt(a.slice(1,7),16),y=parseInt(b.slice(1,7),16);
  const dr=(x>>16)-(y>>16),dg=((x>>8)&255)-((y>>8)&255),db=(x&255)-(y&255);
  return dr*dr+dg*dg+db*db;
}
function nearestColor(color,palette){
  return palette.reduce((best,c)=>colorDistance(color,c)<best.distance?{color:c,distance:colorDistance(color,c)}:best,
    {color:palette[0],distance:Infinity}).color;
}
