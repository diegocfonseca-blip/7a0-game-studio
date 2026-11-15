import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'

/** Agrupa somente peças opacas, imóveis e diretamente pertencentes ao cenário.
 * Vidros, modelos com filhos/animação e identidades de materiais são preservados.
 * O dono continua responsável pelos buffers originais; recebe os novos para limpeza. */
export function agruparPecasEstaticas(root:T.Object3D,own:(g:T.BufferGeometry)=>void,cell=64){
 const groups=new Map<string,{material:T.Material;cast:boolean;receive:boolean;layer:number;order:number;parts:T.Mesh[]}>()
 for(const node of root.children){
  if(!(node instanceof T.Mesh)||node instanceof T.InstancedMesh||node instanceof T.SkinnedMesh||node.children.length||!node.visible||!node.matrixAutoUpdate||Array.isArray(node.material)||node.material.transparent||node.material.opacity<1||node.morphTargetInfluences||Object.keys(node.geometry.morphAttributes).length)continue
  node.updateMatrix();if(node.matrix.determinant()<=0)continue
  if(!node.geometry.boundingBox)node.geometry.computeBoundingBox()
  const center=node.geometry.boundingBox!.getCenter(new T.Vector3()).applyMatrix4(node.matrix)
  const geometry=node.geometry as T.BufferGeometry
  const attrs=Object.keys(geometry.attributes).sort().map(k=>{const v=geometry.getAttribute(k);return `${k}:${v.itemSize}:${v.normalized}:${v.array.constructor.name}`}).join('|')
  const key=[node.material.uuid,node.castShadow,node.receiveShadow,node.layers.mask,node.renderOrder,Math.floor(center.x/cell),Math.floor(center.z/cell),attrs].join(':')
  const group=groups.get(key);if(group)group.parts.push(node);else groups.set(key,{material:node.material,cast:node.castShadow,receive:node.receiveShadow,layer:node.layers.mask,order:node.renderOrder,parts:[node]})
 }
 let removed=0,created=0
 for(const g of groups.values()){
  if(g.parts.length<2)continue
  const pieces=g.parts.map(p=>{const geometry=p.geometry.index?p.geometry.toNonIndexed():p.geometry.clone();geometry.applyMatrix4(p.matrix);return geometry})
  const merged=mergeGeometries(pieces,false);pieces.forEach(p=>p.dispose());if(!merged)continue
  merged.computeBoundingBox();merged.computeBoundingSphere();own(merged)
  const mesh=new T.Mesh(merged,g.material);mesh.name='shopping-pecas-agrupadas';mesh.castShadow=g.cast;mesh.receiveShadow=g.receive;mesh.layers.mask=g.layer;mesh.renderOrder=g.order;root.add(mesh)
  for(const part of g.parts)part.removeFromParent()
  removed+=g.parts.length;created++
 }
 return{removed,created,savedDraws:removed-created}
}
