const assert=require('node:assert/strict');require('../pixel-transform.js');
const transform=globalThis.ArenaPixelTransform,W=128,H=96,anchor={x:64,y:48};
const pixels=new Uint8Array(W*H);pixels[48*W+64]=1;pixels[49*W+66]=2;pixels[52*W+63]=3;
for(const op of ['horizontal','vertical'])assert.deepEqual(transform(transform(pixels,W,H,anchor,op),W,H,anchor,op),pixels);
let rotated=pixels;for(let i=0;i<4;i++)rotated=transform(rotated,W,H,anchor,'cw');assert.deepEqual(rotated,pixels);
assert.deepEqual(transform(transform(pixels,W,H,anchor,'cw'),W,H,anchor,'ccw'),pixels);
assert.equal(transform(pixels,W,H,anchor,'cw')[50*W+63],2);
const edge=new Uint8Array(W*H);edge[0]=1;assert.throws(()=>transform(edge,W,H,anchor,'cw'));assert.equal(edge[0],1);
console.log('PASS: vertical/horizontal involution, four quarter-turns, inverse rotation, palette and clipping protection');
