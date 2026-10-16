import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as THREE from 'three'
import {criarBolaFutebol3D,RAIO_BOLA_FUTEBOL_3D} from '../src/escalacao/presidencia-bola-3d.ts'

const ball=criarBolaFutebol3D(),geometry=ball.geometry,position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal'),color=geometry.getAttribute('color'),index=geometry.index
assert.equal(RAIO_BOLA_FUTEBOL_3D,.11);assert.equal(ball.name,'match-ball')
assert.equal(ball.children.length,0,'the panels are the actual outer surface, not an overlay')
assert.ok(ball.material instanceof THREE.MeshStandardMaterial&&ball.material.vertexColors)
assert.equal(ball.material.map,null,'no image, canvas or external texture is needed')
assert.equal(geometry.groups.length,0,'one material needs only one draw call')
assert.ok(index.count/3<=1500,'a single small ball remains inexpensive')
const point=i=>new THREE.Vector3().fromBufferAttribute(position,i)
const key=i=>point(i).toArray().map(n=>n.toFixed(7)).join(',')
const shade=i=>color.getX(i)<.02?'black':color.getX(i)>.8?'white':'seam'
let maximumRadiusError=0,area=0
const edges=new Map(),triangles={black:[],white:[],seam:[]},areas={black:0,white:0,seam:0}
for(let i=0;i<position.count;i++){
 const p=point(i),n=new THREE.Vector3().fromBufferAttribute(normal,i)
 maximumRadiusError=Math.max(maximumRadiusError,Math.abs(p.length()-.11))
 assert.ok(Math.abs(p.length()-.11)<1e-8,'every panel and seam lies on the contact sphere')
 assert.ok(Math.abs(n.length()-1)<1e-7&&p.clone().normalize().dot(n)>1-1e-7,'normals shade one smooth sphere')
}
for(let i=0;i<index.count;i+=3){
 const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)],a=point(ids[0]),b=point(ids[1]),c=point(ids[2]),cross=b.clone().sub(a).cross(c.clone().sub(a)),kind=shade(ids[0])
 assert.ok(cross.dot(a)>1e-12,'triangles face outward and have positive area')
 assert.ok(ids.every(id=>shade(id)===kind),'black panels are not faded into white by vertex interpolation')
 const triArea=cross.length()/2;area+=triArea;areas[kind]+=triArea;triangles[kind].push(ids)
 for(let e=0;e<3;e++){const edge=[key(ids[e]),key(ids[(e+1)%3])].sort().join('|');edges.set(edge,(edges.get(edge)??0)+1)}
}
assert.ok([...edges.values()].every(n=>n===2),'all geometric edges have two neighbours: no holes, overlapping overlays or T-junctions')
const components=kind=>{
 const adjacency=new Map()
 for(const ids of triangles[kind])for(const i of ids){if(!adjacency.has(i))adjacency.set(i,new Set());for(const j of ids)adjacency.get(i).add(j)}
 const unseen=new Set(adjacency.keys());let result=0
 while(unseen.size){result++;const queue=[unseen.values().next().value];while(queue.length){const i=queue.pop();if(!unseen.delete(i))continue;for(const next of adjacency.get(i))if(unseen.has(next))queue.push(next)}}
 return result
}
assert.equal(components('black'),12,'twelve complete black pentagonal patches are visible')
assert.equal(components('white'),20,'twenty white hexagonal patches are separated by seams')
assert.ok(areas.black/area>.20&&areas.black/area<.30,'black panels cover enough surface to read as a football at zoom')
assert.ok(areas.seam/area<.06,'seams stay narrow rather than turning the ball grey')
assert.ok(area/(4*Math.PI*.11*.11)>.99,'the sphere is sufficiently smooth at close range')
const another=criarBolaFutebol3D()
assert.notEqual(ball.geometry,another.geometry);assert.notEqual(ball.material,another.material)
let geometryDisposals=0,materialDisposals=0,otherDisposals=0
geometry.addEventListener('dispose',()=>geometryDisposals++);ball.material.addEventListener('dispose',()=>materialDisposals++)
another.geometry.addEventListener('dispose',()=>otherDisposals++);another.material.addEventListener('dispose',()=>otherDisposals++)
ball.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();const mats=Array.isArray(object.material)?object.material:[object.material];mats.forEach(mat=>mat.dispose())}})
assert.equal(geometryDisposals,1);assert.equal(materialDisposals,1);assert.equal(otherDisposals,0,'disposing one camera cannot dispose another camera ball')
another.geometry.dispose();another.material.dispose()
const report={radius:.11,maximumRadiusError,vertices:position.count,triangles:index.count/3,drawCalls:1,panels:{black:components('black'),white:components('white')},areaFractions:Object.fromEntries(Object.entries(areas).map(([key,value])=>[key,value/area])),geometryDisposals,materialDisposals}
fs.mkdirSync('test-results/futebol-3d',{recursive:true});fs.writeFileSync('test-results/futebol-3d/bola-paineis-20261016.json',JSON.stringify(report,null,2))
console.log(`PASS: ${report.panels.black} pentágonos pretos + ${report.panels.white} hexágonos brancos; esfera fechada de raio .11 m; ${report.triangles} triângulos / 1 draw call; descarte independente.`)
