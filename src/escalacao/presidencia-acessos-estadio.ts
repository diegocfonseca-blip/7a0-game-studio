import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {STADIUM_ENTRANCES,entrancesForViewer} from './cidade3d/stadium-entrances.mjs'
import type {EstadoComplexo} from './presidencia-complexo-model'
import {acelerarRaios} from './presidencia-raio-rapido'

/** Basic gate equipment, not a purchased new building, surface or stand.
 * Registered concrete portals stay intact; the metal frames identify the
 * three passages even in an incomplete dirt-ground stadium. */
export function criarAcessosEstadio(scene:THREE.Scene,state:EstadoComplexo){
 const root=new THREE.Group();root.name='stadium-three-entrances';root.visible=state.valid;scene.add(root)
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>()
 const floors:THREE.Mesh[]=[];for(const name of ['complexo-entorno','estadio-arquitetura-volumetrica','complexo-campo'])scene.getObjectByName(name)?.traverse(n=>{if(n instanceof THREE.Mesh&&!(n instanceof THREE.SkinnedMesh)&&!(n instanceof THREE.InstancedMesh))floors.push(n)});scene.updateMatrixWorld(true);acelerarRaios(floors)
 const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),normal=new THREE.Vector3()
 const ground=(x:number,z:number)=>{ray.set(new THREE.Vector3(x,.6,z),down);ray.far=1;return ray.intersectObjects(floors,false).find(h=>h.point.y<.27&&h.face&&normal.copy(h.face.normal).transformDirection(h.object.matrixWorld).y>.5)?.point.y??-.02}
 const steel=new THREE.MeshStandardMaterial({color:'#344740',roughness:.78,metalness:.25});materials.add(steel)
 const prototypes=[new THREE.CylinderGeometry(.065,.065,1,8),new THREE.CylinderGeometry(.09,.09,.08,8)];prototypes.forEach(g=>geometries.add(g))
 const gates=STADIUM_ENTRANCES.map((entry,index)=>{
  const gate=entry.gate,group=new THREE.Group();group.name='entrance-'+entry.id;group.position.set(gate.threshold.x,ground(gate.threshold.x,gate.threshold.z),gate.threshold.z);group.rotation.y=gate.heading;group.userData={id:entry.id,role:entry.role,allowed:[...entry.allowed]};root.add(group)
  const width=index===0?gate.width:gate.width-1.4,height=index===0?gate.height:2.65,parts:THREE.BufferGeometry[]=[]
  for(const x of [-width/2,width/2]){const pole=prototypes[0].clone();pole.scale(1,height,1);pole.translate(x,height/2,0);parts.push(pole);const foot=prototypes[1].clone();foot.translate(x,.04,0);parts.push(foot)}
  // Two open gate leaves remain alongside the passage, never across it.
  for(const side of [-1,1]){const length=Math.min(1.5,width/2),x=side*(width/2+.05);for(const y of [.27,1.32]){const bar=new THREE.BoxGeometry(.055,.055,length);bar.translate(x,y,length/2);parts.push(bar)}for(let i=0;i<=4;i++){const bar=new THREE.BoxGeometry(.035,1.05,.035);bar.translate(x,.795,i*length/4);parts.push(bar)}}
  const top=new THREE.BoxGeometry(width+.13,.09,.10);top.translate(0,height,0);parts.push(top)
  const frameGeometry=mergeGeometries(parts,false)!;parts.forEach(g=>g.dispose());geometries.add(frameGeometry);const frame=new THREE.Mesh(frameGeometry,steel);frame.name='gate-frame-'+entry.id;frame.castShadow=frame.receiveShadow=true;group.add(frame)
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.add(texture)
  const signMaterial=new THREE.MeshStandardMaterial({map:texture,roughness:.86,side:THREE.DoubleSide});materials.add(signMaterial)
  const signWidth=Math.min(width,6),signHeight=signWidth*192/1024
  const signGeometry=new THREE.BoxGeometry(signWidth,signHeight,.065);geometries.add(signGeometry);const sign=new THREE.Mesh(signGeometry,signMaterial);sign.name='gate-sign-'+entry.id;sign.position.set(0,height+signHeight/2+.02,.075);group.add(sign)
  let current=entry,identity='';const paint=(detail:string)=>{const key=current.label+'|'+detail;if(key===identity)return;identity=key;const c=canvas.getContext('2d')!;c.fillStyle=current.id==='service'?'#253d35':current.id==='owner-supporters'?'#f4ecd6':'#703d35';c.fillRect(0,0,1024,192);c.strokeStyle=current.id==='owner-supporters'?'#253d35':'#f4ecd6';c.lineWidth=6;c.strokeRect(5,5,1014,182);c.fillStyle=current.id==='owner-supporters'?'#15231c':'#f4ecd6';c.textAlign='center';c.textBaseline='middle';c.font='bold 66px sans-serif';c.fillText(current.label,512,65,970);c.font='bold 37px sans-serif';c.fillText(detail,512,143,970);texture.needsUpdate=true}
  paint(index===0?'JOGADORES DOS DOIS TIMES · TÉCNICOS · APOIO':index===1?'TORCEDORES DO DONO DO SAVE':'TORCEDORES DO CLUBE RIVAL')
  return{entry,group,width,height,descriptor:()=>current,setIdentity(value:typeof entry,detail:string){current=value;group.userData={id:value.id,role:value.role,allowed:[...value.allowed]};paint(detail)}}
 })
 let teamKey='';return{root,configure(teams:readonly {name:string}[],viewerSide:'home'|'away'='home'){const key=viewerSide+'|'+teams.map(t=>t.name).join('|');if(key===teamKey)return;teamKey=key;const entries=entrancesForViewer(viewerSide);for(const g of gates){const entry=entries.find(e=>e.gate.id===g.entry.gate.id)!;const detail=entry.id==='service'?'JOGADORES DOS DOIS TIMES · TÉCNICOS · APOIO':teams[g.entry.gate.id==='mandantes'?0:1]?.name??(entry.id==='owner-supporters'?'TORCEDORES DO DONO DO SAVE':'TORCEDORES DO CLUBE RIVAL');g.setIdentity(entry,detail)}},inspect:()=>({count:gates.length,physical:true,terrainChanged:false,entrances:gates.map(g=>{const e=g.descriptor();return{id:e.id,physicalGate:e.gate.id,role:e.role,allowed:[...e.allowed],position:g.group.position.toArray(),heading:g.group.rotation.y,width:g.width,height:g.height}})}),dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());root.removeFromParent()}}
}
