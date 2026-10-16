import * as THREE from 'three'

/** Os corpos têm malhas próprias, embora todas se chamem BufferGeometry.
 * Só o gerador humano pode declarar duas dessas malhas como a mesma forma. */
function geometryKey(geometry:THREE.BufferGeometry&{parameters?:unknown}){
 const identity=typeof geometry.userData.humanoShape==='string'
  ?['human',geometry.userData.humanoShape]
  :geometry.parameters!==undefined?['primitive',geometry.type,geometry.parameters]:['unique',geometry.uuid]
 return [identity,geometry.groups,geometry.drawRange]
}

/** Texturas de tecido idênticas podem compartilhar lote, mas uma textura
 * externa sem identidade declarada continua pertencendo à sua própria malha. */
function textureKey(texture:THREE.Texture|null){
 if(!texture)return null
 return [typeof texture.userData.humanoTexture==='string'?['human',texture.userData.humanoTexture]:['unique',texture.uuid],
  texture.mapping,texture.channel,texture.wrapS,texture.wrapT,texture.magFilter,texture.minFilter,texture.anisotropy,
  texture.format,texture.internalFormat,texture.type,texture.colorSpace,texture.flipY,texture.generateMipmaps,
  texture.premultiplyAlpha,texture.unpackAlignment,texture.offset.toArray(),texture.repeat.toArray(),
  texture.center.toArray(),texture.rotation,texture.matrixAutoUpdate,texture.matrixAutoUpdate?null:texture.matrix.toArray()]
}

function materialKey(m:THREE.MeshStandardMaterial){
 return [m.type,m.userData.humanoKind,m.vertexColors,m.roughness,m.metalness,m.flatShading,
  m.emissive.getHex(),m.emissiveIntensity,m.envMapIntensity,m.envMapRotation.toArray(),
  m.bumpScale,m.normalMapType,m.normalScale.toArray(),m.displacementScale,m.displacementBias,
  m.aoMapIntensity,m.lightMapIntensity,m.wireframe,m.wireframeLinewidth,m.fog,
  m.opacity,m.transparent,m.alphaTest,m.alphaHash,m.alphaToCoverage,m.premultipliedAlpha,
  m.side,m.shadowSide,m.visible,m.toneMapped,m.dithering,m.forceSinglePass,
  m.depthTest,m.depthWrite,m.depthFunc,m.colorWrite,m.polygonOffset,m.polygonOffsetFactor,m.polygonOffsetUnits,
  m.blending,m.blendSrc,m.blendDst,m.blendEquation,m.blendSrcAlpha,m.blendDstAlpha,m.blendEquationAlpha,m.blendColor.toArray(),m.blendAlpha,
  m.stencilWrite,m.stencilWriteMask,m.stencilFunc,m.stencilRef,m.stencilFuncMask,m.stencilFail,m.stencilZFail,m.stencilZPass,
  m.clipIntersection,m.clipShadows,m.clippingPlanes?.map(p=>[p.normal.toArray(),p.constant]),
  [m.map,m.alphaMap,m.aoMap,m.lightMap,m.bumpMap,m.normalMap,m.displacementMap,m.emissiveMap,m.metalnessMap,m.roughnessMap,m.envMap].map(textureKey)]
}

/** Desenha partes iguais dos personagens em lotes. Os esqueletos originais
 * continuam definindo pose, contato e cor; não se reduz geometria no zoom. */
export function instanciarPersonagens(scene:THREE.Scene,roots:readonly THREE.Group[]){
 type Source=THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>
 const groups=new Map<string,Source[]>()
 for(const root of roots)root.traverse(node=>{
  if(!(node instanceof THREE.Mesh)||!(node.material instanceof THREE.MeshStandardMaterial)||node.material.type!=='MeshStandardMaterial')return
  const geometry=node.geometry as THREE.BufferGeometry&{parameters?:unknown},m=node.material
  // Clonar um material não copia callbacks. Essas malhas ficam no render
  // original, assim como esqueletos, morph targets e sombras customizadas.
  if(node instanceof THREE.SkinnedMesh||node instanceof THREE.InstancedMesh||Object.keys(geometry.morphAttributes).length||
   m.onBeforeCompile!==THREE.Material.prototype.onBeforeCompile||m.customProgramCacheKey!==THREE.Material.prototype.customProgramCacheKey||
   node.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender||node.customDepthMaterial||node.customDistanceMaterial)return
  const key=JSON.stringify([geometryKey(geometry),materialKey(m),node.castShadow,node.receiveShadow,node.renderOrder,node.layers.mask])
  const list=groups.get(key)??[];list.push(node as Source);groups.set(key,list)
 })
 const candidates=new Set<THREE.Object3D>([...groups.values()].flat())
 for(const [key,sources] of groups){
  const safe=sources.filter(source=>{
   let keepsVisibleChild=false
   source.traverse(child=>{
    if(child!==source&&(child instanceof THREE.Mesh||child instanceof THREE.Line||child instanceof THREE.Points||child instanceof THREE.Sprite)&&!candidates.has(child))keepsVisibleChild=true
   })
   // Esconder o pai também esconderia o filho que usa um shader próprio.
   return !keepsVisibleChild
  })
  if(safe.length)groups.set(key,safe);else groups.delete(key)
 }
 const originalVisibility=new Map<THREE.Object3D,boolean>()
 for(const sources of groups.values())for(const source of sources)originalVisibility.set(source,source.visible)
 const batches=[...groups.values()].map(sources=>{
  const first=sources[0],material=first.material.clone();material.color.set('#ffffff')
  const mesh=new THREE.InstancedMesh(first.geometry,material,sources.length)
  mesh.name='presidencia-personagens-instanciados';mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow
  mesh.renderOrder=first.renderOrder;mesh.layers.mask=first.layers.mask
  // A pose muda durante a partida e durante o recorte da câmera registrada.
  // Não usar a esfera de culling calculada na posição inicial dos atletas.
  mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  const visibility=sources.map(source=>source.visible)
  sources.forEach(source=>{source.visible=false});scene.add(mesh)
  return {mesh,sources,material,visibility}
 })
 const inverse=new THREE.Matrix4(),matrix=new THREE.Matrix4(),hidden=new THREE.Matrix4().makeScale(0,0,0)
 let disposed=false
 const update=()=>{
  if(disposed)return
  scene.updateMatrixWorld(true);inverse.copy(scene.matrixWorld).invert()
  for(const {mesh,sources,visibility} of batches){
   sources.forEach((source,i)=>{
    let visible=visibility[i]
    // O solado e os cadarços são filhos da chuteira: seu pai invisível só
    // porque já foi agrupado não pode esconder essas peças menores.
    for(let parent=source.parent;visible&&parent;parent=parent.parent)visible=originalVisibility.get(parent)??parent.visible
    mesh.setMatrixAt(i,visible?matrix.multiplyMatrices(inverse,source.matrixWorld):hidden);mesh.setColorAt(i,source.material.color)
   })
   mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true
  }
 }
 update()
 return {update,sourceCount:[...groups.values()].reduce((n,list)=>n+list.length,0),batchCount:batches.length,dispose:()=>{
  if(disposed)return;disposed=true
  // Geometrias e mapas são dos personagens originais. O material clone
  // compartilha essas texturas e nunca deve descartá-las ao desfazer o lote.
  for(const {mesh,sources,material,visibility} of batches){sources.forEach((source,i)=>{source.visible=visibility[i]});scene.remove(mesh);mesh.dispose();material.dispose()}
 }}
}
