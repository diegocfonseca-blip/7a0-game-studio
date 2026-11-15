import * as T from 'three'
import {acelerarRaios} from './presidencia-raio-rapido'
import type {ObstaculoFanZone} from './presidencia-fanzone-3d'

/** Não atravessa fachadas ao colocar a câmera atrás do personagem. */
export function cameraLivrePasseio(origem:T.Vector3,desejada:T.Vector3,obstaculos:readonly ObstaculoFanZone[]){
 const delta=desejada.clone().sub(origem),length=delta.length();if(length<.001)return desejada.clone()
 const ray=new T.Ray(origem,delta.multiplyScalar(1/length)),box=new T.Box3(),hit=new T.Vector3();let distance=length
 for(const o of obstaculos){
  box.min.set(o.minX-.18,o.base-.1,o.minZ-.18);box.max.set(o.maxX+.18,o.top+.15,o.maxZ+.18)
  if(box.containsPoint(origem))continue
  if(ray.intersectBox(box,hit))distance=Math.min(distance,Math.max(.45,origem.distanceTo(hit)-.2))
 }
 return origem.clone().addScaledVector(ray.direction,distance)
}

/** Índice preparado apenas no primeiro passeio; raios curtos recusam saltos para telhados. */
export function criarPisoPasseio(root:T.Object3D){
 let entries:{mesh:T.Mesh;box:T.Box3}[]|null=null
 const ray=new T.Raycaster(),normal=new T.Vector3(),down=new T.Vector3(0,-1,0)
 return(x:number,z:number,previous:number):number|null=>{
  if(!entries){
   entries=[];root.updateMatrixWorld(true)
   root.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.SkinnedMesh||o instanceof T.InstancedMesh)return
    const materials=Array.isArray(o.material)?o.material:[o.material];if(!materials.some(m=>m.visible&&m.opacity>.65))return
    entries!.push({mesh:o,box:new T.Box3().setFromObject(o)})
   });acelerarRaios(entries.map(e=>e.mesh))
  }
  const top=previous+.38,bottom=previous-.66
  const sample=(sx:number,sz:number)=>{
   const candidates=entries!.filter(e=>sx>=e.box.min.x-.01&&sx<=e.box.max.x+.01&&sz>=e.box.min.z-.01&&sz<=e.box.max.z+.01&&e.box.min.y<=top&&e.box.max.y>=bottom).map(e=>e.mesh)
   ray.set(new T.Vector3(sx,top,sz),down);ray.near=0;ray.far=top-bottom
   const hit=ray.intersectObjects(candidates,false).find(h=>{if(!h.face)return false;for(let n:T.Object3D|null=h.object;n;n=n.parent)if(!n.visible)return false;return normal.copy(h.face.normal).transformDirection(h.object.matrixWorld).y>.65})
   return hit?hit.point.y+.015:null
  }
  const center=sample(x,z);if(center!==null)return center
  // A sola cobre pequenas emendas entre degraus, inclusive arredondamento Float32.
  const edge=[sample(x+.03,z),sample(x-.03,z),sample(x,z+.03),sample(x,z-.03)].filter((h):h is number=>h!==null)
  return edge.length?Math.max(...edge):null
 }
}
