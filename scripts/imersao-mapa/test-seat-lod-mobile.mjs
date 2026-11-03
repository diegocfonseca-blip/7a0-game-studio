import assert from 'node:assert/strict'
import * as T from 'three'
import {criarLodCadeirasMobile} from '../../src/escalacao/presidencia-cadeiras-lod-mobile.ts'
const root=new T.Group(),original=new T.BoxGeometry(.45,.9,.4),material=new T.MeshStandardMaterial({color:'#ffffff'}),seats=new T.InstancedMesh(original,material,3),detail=new T.InstancedMesh(original,material,1)
seats.userData={chairRole:'far',seatIds:['a','b','c']};detail.userData.chairRole='detail-shell';root.add(seats,detail)
const pose=new T.Matrix4();for(let i=0;i<3;i++)seats.setMatrixAt(i,pose.makeTranslation(i,0,2))
const transforms=[...seats.instanceMatrix.array],ids=[...seats.userData.seatIds],source=[...original.attributes.position.array],lod=criarLodCadeirasMobile(root,true),camera=new T.PerspectiveCamera()
camera.position.y=800;lod.update(camera);assert.notEqual(seats.geometry,original);assert.equal(detail.geometry,original);assert.equal(seats.geometry.index.count,6);assert.equal(lod.inspect().savedTriangles,30)
assert.deepEqual([...seats.instanceMatrix.array],transforms);assert.deepEqual(seats.userData.seatIds,ids);assert.deepEqual([...original.attributes.position.array],source)
camera.position.y=100;lod.update(camera);assert(lod.inspect().active)
camera.position.y=20;lod.update(camera);assert.equal(seats.geometry,original)
camera.position.y=800;lod.update(camera);lod.dispose();assert.equal(seats.geometry,original)
seats.dispose();detail.dispose();original.dispose();material.dispose()
console.log('PASS mobile seat LOD preserves seats, transforms, source geometry and close detail')
