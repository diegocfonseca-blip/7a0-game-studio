import * as THREE from 'three'
import {presidenteBaseValido,type PresidenteBaseSave} from './presidencia-carreira'
import {aparenciaInicial,aparenciaModular} from './presidente-aparencia'
import {podeSentarPresidente} from './presidente-pose'
import {PRESIDENTE_RIG} from './presidente-rig'
import {comporPresidenteOriginal,type TexturaPresidenteOriginal} from './presidente-textura-original'
import {carteiraPresidenciaValida,type PresidenciaCarteira} from './presidencia-economia'
import {PLANTA_COMPLEXO,type EstadoComplexo} from './presidencia-complexo-model'

export const POSICAO_PRESIDENTE={desk:{x:-6.4,z:70.6},chair:{x:-6.4,z:69.7},standing:{x:-4.5,z:70}} as const
export type EstadoArtePresidente='empty'|'loading'|'ready'|'error'
type DetalhesPresidente={name:string;outfit:string;hair:string;beard:string;skin:string;accessories:string[];seated:boolean;floor:number;feet:number[]}

/** The approved character is artwork, not a procedural approximation. Keep its
 * exact layers on a world-space surface: the desk/chair really occlude it. The
 * source has a front view only, so do not fabricate a mirrored back or swivel
 * the entire seated person to follow the camera. */
export function criarPresidenteComplexo(scene:THREE.Scene,state:EstadoComplexo,options:{interior?:boolean;onChange?:(status:EstadoArtePresidente)=>void}={}){
 const root=new THREE.Group();root.name='complexo-presidente';root.visible=false;scene.add(root)
 const available=state.valid&&(options.interior===true||(state.lowerComplete&&state.progress.camarote>0))
 let signature='',disposed=false,status:EstadoArtePresidente='empty',revision=0,error:string|null=null
 let details:DetalhesPresidente|null=null,art:TexturaPresidenteOriginal|undefined,texture:THREE.CanvasTexture|undefined
 let surface:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>|undefined,controller:AbortController|undefined
 let pending:Promise<boolean>=Promise.resolve(false),lastPresident:PresidenteBaseSave|undefined,lastWallet:PresidenciaCarteira|null|undefined
 let anchor:{rigFoot:number;metresPerPixel:number;bodyHeight:number}|null=null
 const notify=()=>{if(!disposed)options.onChange?.(status)}
 const clear=()=>{
  surface?.geometry.dispose();surface?.material.dispose();surface?.removeFromParent();surface=undefined
  texture?.dispose();texture=undefined
  if(art){art.canvas.width=0;art.canvas.height=0;art=undefined}
  anchor=null;root.visible=false
 }
 function apply(original:TexturaPresidenteOriginal,p:DetalhesPresidente){
  clear();art=original
  // Measure the actual soles in each outfit, including its seated artwork.
  // Transparent image padding must never become distance above the floor.
  const {baseBounds:b,bounds}=original,bodyHeight=p.seated?1.42:1.8
  const scale=bodyHeight/(b.bottom-b.top),foot=b.bottom
  const left=Math.max(0,bounds.left-2),right=Math.min(PRESIDENTE_RIG.width,bounds.right+2),top=Math.max(0,bounds.top-2),bottom=foot
  const geometry=new THREE.PlaneGeometry((right-left)*scale,(bottom-top)*scale)
  const uv=geometry.attributes.uv
  for(let i=0;i<uv.count;i++)uv.setXY(i,(left+uv.getX(i)*(right-left))/PRESIDENTE_RIG.width,1-(bottom-uv.getY(i)*(bottom-top))/PRESIDENTE_RIG.height)
  uv.needsUpdate=true
  texture=new THREE.CanvasTexture(original.canvas);texture.colorSpace=THREE.SRGBColorSpace
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter
  texture.name='presidente-arte-original'
  const material=new THREE.MeshBasicMaterial({name:'presidente-arte-original',map:texture,transparent:true,alphaTest:.08,depthTest:true,depthWrite:true,side:THREE.FrontSide,shadowSide:THREE.DoubleSide,toneMapped:false})
  surface=new THREE.Mesh(geometry,material);surface.name='presidente-original';surface.castShadow=true
  surface.position.set(((left+right)/2-PRESIDENTE_RIG.width/2)*scale,(foot-(top+bottom)/2)*scale,p.seated?.29:0)
  root.add(surface)
  const position=p.seated?POSICAO_PRESIDENTE.chair:POSICAO_PRESIDENTE.standing
  root.position.set(position.x,p.floor,position.z);root.visible=true;root.updateMatrixWorld(true)
  anchor={rigFoot:foot,metresPerPixel:scale,bodyHeight};p.feet=[p.floor]
 }
 function update(president?:PresidenteBaseSave,wallet?:PresidenciaCarteira|null){
  if(disposed)return false
  lastPresident=president;lastWallet=wallet
  const valid=available&&presidenteBaseValido(president)&&!!president.name.trim()&&carteiraPresidenciaValida(wallet)
  const seated=valid&&podeSentarPresidente(president!.outfit,wallet!.owned)
  const onRug=valid&&wallet!.owned.some(item=>item.id==='tapete')
  const key=JSON.stringify(valid?[president,seated,onRug]:null)
  if(key===signature)return false
  signature=key;const ticket=++revision;controller?.abort();controller=undefined;error=null
  if(!valid){clear();details=null;status='empty';notify();pending=Promise.resolve(false);return true}
  // Snapshot before asynchronous image loads: a caller changing its save in
  // place cannot switch layers halfway through this composition.
  const p:PresidenteBaseSave=JSON.parse(JSON.stringify(president)),appearance=aparenciaModular(p.appearance??aparenciaInicial())
  details={name:p.name,outfit:p.outfit,hair:appearance.hair,beard:appearance.beard,skin:appearance.skinTone??'medium',accessories:[...appearance.accessories],seated,floor:PLANTA_COMPLEXO.presidentBox.floor+(onRug?.026:0),feet:[]}
  const requested=details,loading=new AbortController();controller=loading
  status='loading';root.visible=false;notify()
  pending=comporPresidenteOriginal(p,seated?'seated':'standing',{signal:loading.signal}).then(original=>{
   if(disposed||ticket!==revision){original.canvas.width=0;original.canvas.height=0;return false}
   apply(original,requested);status='ready';notify();return true
  }).catch(cause=>{
   if(disposed||ticket!==revision)return false
   clear();status='error';error=cause instanceof Error?cause.message:'O visual não carregou.';notify();return false
  })
  return true
 }
 return {root,update,whenReady:()=>pending,retry:()=>{if(disposed||status!=='error')return false;signature='';return update(lastPresident,lastWallet)},inspect:()=>({
  available,status,error,source:'original-art' as const,
  president:details?{...details,feet:[...details.feet],accessories:[...details.accessories]}:null,
  layerIds:art?.layers.map(layer=>layer.id)??[],sources:art?.layers.map(layer=>layer.src)??[],
  bounds:art?{...art.bounds}:null,baseBounds:art?{...art.baseBounds}:null,anchor:anchor?{...anchor}:null,
  textureSize:art?[art.canvas.width,art.canvas.height]:null,meshes:surface?1:0,triangles:surface?2:0,facialFeatures:false,
  depthTest:surface?.material.depthTest??true,depthWrite:surface?.material.depthWrite??true,
 }),dispose:()=>{if(disposed)return;disposed=true;++revision;controller?.abort();clear();details=null;status='empty';root.removeFromParent()}}
}
