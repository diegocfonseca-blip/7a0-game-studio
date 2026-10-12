import * as THREE from 'three'

/** Desenha partes iguais dos personagens em lotes. Os esqueletos originais
 * continuam definindo pose, contato e cor; não se reduz geometria no zoom. */
export function instanciarPersonagens(scene:THREE.Scene,roots:readonly THREE.Group[]){
 type Source=THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>
 const groups=new Map<string,Source[]>()
 for(const root of roots)root.traverse(node=>{
  if(!(node instanceof THREE.Mesh)||!(node.material instanceof THREE.MeshStandardMaterial))return
  const geometry=node.geometry as THREE.BufferGeometry&{parameters?:unknown},m=node.material
  const key=JSON.stringify([geometry.type,geometry.parameters,m.roughness,m.metalness,m.side,node.castShadow,node.receiveShadow])
  const list=groups.get(key)??[];list.push(node as Source);groups.set(key,list)
 })
 const batches=[...groups.values()].map(sources=>{
  const first=sources[0],material=first.material.clone();material.color.set('#ffffff')
  const mesh=new THREE.InstancedMesh(first.geometry,material,sources.length)
  mesh.name='presidencia-personagens-instanciados';mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow
  // A pose muda durante a partida e durante o recorte da câmera registrada.
  // Não usar a esfera de culling calculada na posição inicial dos atletas.
  mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  sources.forEach(source=>{source.visible=false});scene.add(mesh)
  return {mesh,sources,material}
 })
 const inverse=new THREE.Matrix4(),matrix=new THREE.Matrix4()
 const update=()=>{
  scene.updateMatrixWorld(true);inverse.copy(scene.matrixWorld).invert()
  for(const {mesh,sources} of batches){
   sources.forEach((source,i)=>{mesh.setMatrixAt(i,matrix.multiplyMatrices(inverse,source.matrixWorld));mesh.setColorAt(i,source.material.color)})
   mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true
  }
 }
 update()
 return {update,sourceCount:[...groups.values()].reduce((n,list)=>n+list.length,0),batchCount:batches.length,dispose:()=>{
  for(const {mesh,sources,material} of batches){sources.forEach(source=>{source.visible=true});scene.remove(mesh);mesh.dispose();material.dispose()}
 }}
}
