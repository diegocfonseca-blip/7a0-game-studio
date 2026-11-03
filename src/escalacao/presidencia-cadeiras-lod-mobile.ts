import * as T from 'three'

/** At city/pitch height each empty chair is subpixel. Reuse its exact instance
 * transforms and colours with a two-triangle seat, restoring native geometry
 * on approach. Detailed near-seat meshes, seat IDs and paths are untouched. */
export function criarLodCadeirasMobile(root:T.Object3D,enabled:boolean){
 const entries:{mesh:T.InstancedMesh;original:T.BufferGeometry;simple:T.BufferGeometry}[]=[],cache=new Map<T.BufferGeometry,T.BufferGeometry>()
 let active=false,disposed=false
 if(enabled)root.traverse(node=>{
  if(!(node instanceof T.InstancedMesh)||node.userData.chairRole!=='far')return
  const original=node.geometry;let simple=cache.get(original)
  if(!simple){
   if(!original.boundingBox)original.computeBoundingBox()
   const box=original.boundingBox!,size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3())
   simple=new T.PlaneGeometry(size.x,size.z);simple.rotateX(-Math.PI/2);simple.translate(center.x,box.min.y+size.y*.5,center.z)
   simple.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(12).fill(1),3));simple.computeBoundingSphere();cache.set(original,simple)
  }
  entries.push({mesh:node,original,simple})
 })
 function update(camera:T.PerspectiveCamera){
  if(disposed||!enabled)return
  const next=active?camera.position.y>95:camera.position.y>110
  if(active===next)return
  active=next;for(const e of entries)e.mesh.geometry=next?e.simple:e.original
 }
 return{update,inspect:()=>({enabled,active,batches:entries.length,instances:entries.reduce((n,e)=>n+e.mesh.count,0),savedTriangles:active?entries.reduce((n,e)=>n+e.mesh.count*((e.original.index?.count??e.original.getAttribute('position').count)/3-2),0):0}),dispose(){if(disposed)return;disposed=true;for(const e of entries)e.mesh.geometry=e.original;for(const g of cache.values())g.dispose();cache.clear()}}
}
