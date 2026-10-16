import * as THREE from 'three'
import {carteiraPresidenciaValida,type PresidenciaCarteira} from './presidencia-economia'
import {PLANTA_COMPLEXO,type EstadoComplexo} from './presidencia-complexo-model'
import type {TrofeuPresidencia} from './presidencia-trofeus'
import type {ArtesIdentidadeSala} from './presidencia-sala-identidade-assets'

/** Small physical displays in their purchased furniture. The approved artwork
 * is a decal on a plaque/frame, with depth and occlusion in the same scene. */
export function criarColecaoSala(scene:THREE.Scene,state:EstadoComplexo,onChange:()=>void,interior=false){
 const root=new THREE.Group();root.name='complexo-colecao-presidencia';scene.add(root)
 const available=state.valid&&(interior||(state.lowerComplete&&state.progress.camarote>0)),floor=PLANTA_COMPLEXO.presidentBox.floor
 const textures=new Set<THREE.Texture>(),materials=new Set<THREE.Material>(),geometries=new Set<THREE.BufferGeometry>()
 let key='',version=0,disposed=false,items:{id:string;count:number}[]=[],identity={crest:false,shirt:false,mascot:false},failures:string[]=[]
 const pending=new Set<string>(),loaded=new Set<string>()
 let changeFrame:number|undefined
 const changed=()=>{
  if(disposed||changeFrame!==undefined)return
  // Image downloads can finish together. Request one scene render for that
  // batch instead of re-rendering the whole stadium once per trophy texture.
  if(typeof requestAnimationFrame==='undefined'){onChange();return}
  changeFrame=requestAnimationFrame(()=>{changeFrame=undefined;if(!disposed)onChange()})
 }
 const clear=()=>{version++;root.clear();textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());textures.clear();materials.clear();geometries.clear();items=[];identity={crest:false,shirt:false,mascot:false};failures=[];pending.clear();loaded.clear()}
 const material=(color:string,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness:metalness?.36:.75});materials.add(m);return m}
 const add=(name:string,g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number)=>{geometries.add(g);materials.add(m);const mesh=new THREE.Mesh(g,m);mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh}
 const image=(id:string,src:string,x:number,y:number,z:number,w:number,h:number,angle=0,crop?:ArtesIdentidadeSala['shirtCrop'])=>{
  if(typeof document==='undefined')return
  const revision=version,m=new THREE.MeshStandardMaterial({transparent:true,alphaTest:.08,roughness:.8,side:THREE.DoubleSide})
  let mesh:THREE.Mesh|undefined;pending.add(id)
  const tex=new THREE.TextureLoader().load(src,()=>{
   if(disposed||version!==revision)return
   tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4
   if(crop){tex.repeat.y=crop.front/crop.height;tex.offset.y=1-tex.repeat.y}
   const aspect=(crop?.width??tex.image.width)/(crop?.front??tex.image.height),frameAspect=w/h
   mesh?.scale.set(Math.min(1,aspect/frameAspect),Math.min(1,frameAspect/aspect),1)
   pending.delete(id);loaded.add(id);m.needsUpdate=true;changed()
  },undefined,()=>{if(!disposed&&version===revision){pending.delete(id);failures.push(id);changed()}})
  tex.colorSpace=THREE.SRGBColorSpace;textures.add(tex);m.map=tex
  mesh=add(id,new THREE.PlaneGeometry(w,h),m,x,y,z);mesh.rotation.y=angle
 }
 const label=(text:string,x:number,y:number,z:number)=>{
  if(typeof document==='undefined')return
  const c=document.createElement('canvas');c.width=256;c.height=96;const ctx=c.getContext('2d');if(!ctx)return
  ctx.fillStyle='#24251f';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#f4ecd6';ctx.font='bold 54px sans-serif';ctx.textAlign='center';ctx.fillText(text,128,68)
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;textures.add(tex)
  const m=new THREE.MeshStandardMaterial({map:tex,roughness:.85});materials.add(m)
  add('quantidade-titulos',new THREE.PlaneGeometry(.20,.075),m,x,y,z).rotation.y=Math.PI
 }
 function update(wallet?:PresidenciaCarteira|null,trophies:readonly TrofeuPresidencia[]=[],art?:ArtesIdentidadeSala,page=0){
  if(disposed)return false
  const valid=available&&carteiraPresidenciaValida(wallet),next=JSON.stringify(valid?[wallet!.owned.map(i=>i.id).sort(),trophies,art,page]:null)
  if(next===key)return false
  key=next;clear();if(!valid)return true
  const owned=new Set(wallet!.owned.map(i=>i.id)),wood=material('#493424'),gold=material('#baa063',.65),black=material('#292a25')
  if(owned.has('estante-simples')||owned.has('estante-madeira')){
   const basic=owned.has('estante-simples'),height=basic?1.85:2.35
   const earned=trophies.filter(t=>typeof t.id==='string'&&/^[a-z\d-]+$/i.test(t.id)&&Number.isSafeInteger(t.count)&&t.count!>0)
   const start=Math.min(Math.max(0,Math.trunc(page))*9,Math.max(0,Math.floor((earned.length-1)/9)*9))
   for(const [i,t] of earned.slice(start,start+9).entries()){
    // The wooden cabinet closes the lowest compartment and has a central
    // divider. Cups must sit on its two open shelves, beside that divider.
    const x=-12.5+(basic?(i%3-1)*.52:[-1.20,-.76,-.32,.32,.76,1.20][i%6])
    const y=floor+(basic?[.06,height*.33,height*.66][Math.floor(i/3)]:[height*.33,height*.66][Math.floor(i/6)])+.0325,z=basic?78.19:78.14
    add('trofeu-base-'+t.id,new THREE.BoxGeometry(.28,.07,.22),black,x,y+.035,z)
    add('trofeu-haste-'+t.id,new THREE.CylinderGeometry(.022,.04,.13,12),gold,x,y+.13,z)
    const cup=new THREE.LatheGeometry([[.025,0],[.06,.025],[.10,.09],[.11,.14]].map(([r,h])=>new THREE.Vector2(r,h)),24)
    add('trofeu-copa-'+t.id,cup,gold,x,y+.19,z)
    for(const side of [-1,1]){const handle=add('trofeu-alca',new THREE.TorusGeometry(.063,.012,8,20,Math.PI*1.4),gold,x+side*.10,y+.27,z);handle.rotation.z=side*Math.PI/2}
    image('trofeu-arte-'+t.id,(import.meta.env?.BASE_URL??'/')+'trofeus-v137/'+t.id+'.webp',x,y+.22,z-.12,.16,.23,Math.PI)
    label('×'+t.count,x,y+.035,z-.113);items.push({id:t.id,count:t.count!})
   }
  }
  if(art?.crest){
   add('escudo-suporte',new THREE.BoxGeometry(1.16,1.35,.06),wood,-12.5,floor+3.15,78.80)
   image('escudo-clube',art.crest,-12.5,floor+3.15,78.76,1.05,1.18,Math.PI);identity.crest=true
  }
  if(owned.has('quadro')&&art){
   if(art.shirt)image('camisa-clube',art.shirt,20.76,floor+2.05,71.1,.95,1.12,-Math.PI/2,art.shirtCrop)
   else{
    const shirt=material(art.color),body=add('camisa-lisa',new THREE.BoxGeometry(.025,.65,.48),shirt,20.76,floor+1.95,71.1)
    for(const side of [-1,1]){const sleeve=add('camisa-manga',new THREE.BoxGeometry(.025,.25,.30),shirt,20.76,floor+2.21,71.1+side*.34);sleeve.rotation.x=side*.5}
    body.userData.automatic=true
   }
   identity.shirt=true
  }
  if((owned.has('mesa-simples')||owned.has('mesa-madeira'))&&art?.mascot){
   const rug=owned.has('tapete')?.026:0,deskTop=.78 // both tops; the mascot sits beside the wooden desk's leather mat
   add('mascote-suporte',new THREE.BoxGeometry(.18,.025,.14),wood,-7,floor+deskTop+.0125+rug,70.6)
   image('mascote-clube',art.mascot,-7,floor+deskTop+.155+rug,70.6,.16,.26);identity.mascot=true
  }
  return true
 }
 return {root,update,inspect:()=>({items:items.map(i=>({...i})),identity:{...identity},failures:[...failures],pending:[...pending],loaded:[...loaded]}),dispose:()=>{if(disposed)return;disposed=true;if(changeFrame!==undefined)cancelAnimationFrame(changeFrame);clear();root.removeFromParent()}}
}
