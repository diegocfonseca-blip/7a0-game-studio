import assert from 'node:assert/strict'
await import('./testa-presidencia-evolucao.mjs')
const {redimensionarVistaMapa}=await import('../src/escalacao/presidencia-estadio-mapa-model.ts')
const dimensions=(width,height)=>{const w=Math.max(width,height*1.5);return {width,height,world:{width:w,height:w/1.5},minZoom:Math.min(width/w,height/(w/1.5))}}
const sizes=[dimensions(364,608),dimensions(818,380),dimensions(1000,720)]
const center=(v,d)=>[.5-v.x/(d.world.width*v.zoom),.5-v.y/(d.world.height*v.zoom)]
for(const before of sizes)for(const after of sizes){
 const v={zoom:3,x:180,y:-130},next=redimensionarVistaMapa(v,before,after,6)
 center(next,after).forEach((value,i)=>assert.ok(Math.abs(value-center(v,before)[i])<1e-10,'The same field/NPC position stays centered'))
 const back=redimensionarVistaMapa(next,after,before,6)
 assert.ok(Math.abs(back.x-v.x)<1e-8&&Math.abs(back.y-v.y)<1e-8,'Rotation round trip does not drift')
 assert.deepEqual(redimensionarVistaMapa({zoom:before.minZoom,x:0,y:0},before,after,6),{zoom:after.minZoom,x:0,y:0},'Overview remains fitted after rotation')
 const bounded=redimensionarVistaMapa({zoom:12,x:1e6,y:-1e6},before,after,4)
 assert.equal(bounded.zoom,4)
 assert.ok(Math.abs(bounded.x)<=(after.world.width*4-after.width)/2)
 assert.ok(Math.abs(bounded.y)<=(after.world.height*4-after.height)/2)
}
console.log('PASS: portrait/landscape/desktop preserve focal position, fitted overview, round trips and camera bounds.')
