const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('pixel-editor.js','utf8');
const buttons={},history=[];const c={Uint8Array,doc:{palette:[null,'#112233','#abcdef','#ffcc00'],frames:[Uint8Array.from([1,2,3,2]),Uint8Array.from([3,1,2,0])]},selected:'#abcdef',$:id=>buttons[id]??(buttons[id]={}),selectedColor(){return c.selected},setColor(v){c.selected=v},checkpoint(){history.push(structuredClone(c.doc))},edited(){},draftSave(){},message(){}};
vm.createContext(c);vm.runInContext(source.slice(source.indexOf("$('addColor').onclick="),source.indexOf('function render(){')),c);
buttons.deleteColor.onclick();assert.deepEqual(Array.from(c.doc.frames[0]),[1,0,2,0]);assert.deepEqual(Array.from(c.doc.frames[1]),[2,1,0,0]);assert.equal(c.doc.palette.length,3);assert.equal(history.length,1);
c.selected='#12345680';buttons.addColor.onclick();assert.equal(c.doc.palette.at(-1),'#12345680');buttons.addColor.onclick();assert.equal(c.doc.palette.length,4);
while(c.doc.palette.length>1){c.selected=c.doc.palette[1];buttons.deleteColor.onclick();}assert(c.doc.frames.every(p=>p.every(v=>v===0)));assert.equal(c.doc.palette.length,1);buttons.deleteColor.onclick();assert.equal(c.doc.palette.length,1);
c.selected='#ffffff';buttons.addColor.onclick();assert.equal(c.doc.palette.length,2);
console.log('PASS: multi-frame color deletion, index remapping, add/deduplication, empty palette and recovery');
