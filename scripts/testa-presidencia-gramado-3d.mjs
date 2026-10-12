import assert from 'node:assert/strict'
import {faixasGramado3D} from '../src/escalacao/presidencia-gramado-3d.ts'
for(let investment=0;investment<=300;investment++){
 const progress=investment/300,bands=faixasGramado3D(progress)
 let cursor=-52.5,grass=0
 for(const band of bands){
  assert.ok(Math.abs(band.left-cursor)<1e-8,'No gaps or overlapping surfaces')
  assert.ok(band.width>0)
  cursor+=band.width
  if(band.grass)grass+=band.width
 }
 assert.ok(Math.abs(cursor-52.5)<1e-8,'Pitch remains 105 metres wide')
 assert.ok(Math.abs(grass-105*progress)<1e-8,'Every investment changes the planted area exactly')
}
assert.ok(faixasGramado3D(NaN).every(b=>!b.grass))
assert.ok(faixasGramado3D(-1).every(b=>!b.grass))
assert.ok(faixasGramado3D(2).every(b=>b.grass))
console.log('PASS: 301 planting stages, continuous investment, pitch dimensions, no gaps/overlap and invalid input.')
