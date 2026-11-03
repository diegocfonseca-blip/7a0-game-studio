import assert from 'node:assert/strict'
import * as T from 'three'
import {criarTorcidaComplexo} from '../../src/escalacao/presidencia-complexo-torcida.ts'
const seats=Array.from({length:100},(_,i)=>({id:'seat-'+i,sector:'cadeiras',tier:'lower',position:{x:(i%20)*.5,y:0,z:44+Math.floor(i/20)*.6},heading:0,seatHeight:.43,row:Math.floor(i/20),column:i%20,supporterSide:'home'}))
const original=JSON.stringify(seats),scene=new T.Scene(),crowd=criarTorcidaComplexo(scene,seats,{mode:'qa-sample',homeOccupancy:1,awayOccupancy:0},{detailedDistance:80})
const rendered=()=>{const ids=new Set();let detailed=0;crowd.root.traverse(n=>{if(n instanceof T.InstancedMesh&&n.visible){for(const id of n.userData.seatIds??[])ids.add(id);if(n.name.includes('-perto-'))detailed+=n.count}});return{ids:[...ids].sort(),detailed}}
const before=rendered();assert.equal(before.ids.length,100)
crowd.perto({x:0,y:1000,z:0});const far=rendered();assert.equal(far.detailed,0);assert.deepEqual(far.ids,before.ids,'Distance cannot remove supporters or change seats')
crowd.perto({x:5,y:3,z:45});const near=rendered();assert(near.detailed>0);assert.deepEqual(near.ids,before.ids);assert.equal(JSON.stringify(seats),original);assert.equal(crowd.inspect().total,100)
crowd.dispose();assert.equal(scene.children.length,0)
console.log('PASS mobile crowd distance preserves seats, population and restores close detail')
