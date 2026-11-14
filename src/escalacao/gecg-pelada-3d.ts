import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {createCivilian} from './cidade3d/civilians.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {LOTES_PATROCINADORES_CIDADE as LOTS} from './presidencia-patrocinadores-planta'
import {quadroPeladaGecg} from './gecg-pelada'
import type {ContextoBairro} from './presidencia-bairro-tradicoes'

/** Vida do campo alugada é cenário local; não usa o motor nem o resultado oficial. */
export function criarPeladaGecg(parent:T.Object3D,options:{mobile:boolean;light?:boolean;onReady:()=>void}){
 const root=new T.Group();root.name='gecg-pelada';parent.add(root)
 const g=LOTS.gecg,light=!!options.light,geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>()
 let disposed=false,loading=false,error='',near=false,time=0,mode='pelada',actors:any[]=[],kicks=0
 const ballGeo=new T.IcosahedronGeometry(.14,1),ballMat=new T.MeshStandardMaterial({color:'#f4ecd6',roughness:.8})
 geometries.add(ballGeo);materials.add(ballMat);const ball=new T.Mesh(ballGeo,ballMat);root.add(ball);ball.visible=false
 const parts=new Map<string,T.BufferGeometry[]>()
 const box=(c:string,w:number,h:number,d:number,x:number,y:number,z:number)=>{const geo=new T.BoxGeometry(w,h,d);geo.translate(x,y,z);const list=parts.get(c)??[];list.push(geo);parts.set(c,list)}
 box('#1b7a3d',7,.16,.65,g.x+15,.63,g.z+22)
 box('#f4ecd6',7,.6,.1,g.x+15,.98,g.z+22.3)
 for(const x of[-2.5,2.5])box('#464b46',.16,.62,.55,g.x+15+x,.31,g.z+22)
 for(const x of[-1,0,1])box('#dbe8e7',.16,.35,.16,g.x+15+x*.3,.97,g.z+22)
 for(const[c,list]of parts){const geo=mergeGeometries(list)!;list.forEach(p=>p.dispose());geometries.add(geo);const mat=new T.MeshStandardMaterial({color:c,roughness:.9});materials.add(mat);const mesh=new T.Mesh(geo,mat);root.add(mesh)}
 const spectators=Array.from({length:light?1:options.mobile?2:4},(_,i)=>{const body=createCivilian(root,{id:'gecg-banco-'+i,variant:i%2?'adult-woman':'adult-man',outfitColor:i%2?'#ffc400':'#1b7a3d',deferUntilVisible:true,onReady:options.onReady});return{body,x:g.x+13+i*1.5,z:g.z+(i<2?22:20.6),seated:i<2?1:0,semSombra:false}})
 async function load(){if(disposed||loading||actors.length||error)return;loading=true
  try{const[{carregaJogadorNovo,criarJogadorNovo},{completa}]=await Promise.all([import('./futebol3d/jogador-novo.mjs'),import('./futebol3d/uniformes.mjs')]);const asset:any=await carregaJogadorNovo();if(disposed)return
   const clips=new Map([...asset.clips].map(([name,source]:any)=>{const clip=source.clone();for(const t of clip.tracks)if(t.name.endsWith('.position')&&/Hips|Armature|Root/.test(t.name))for(let k=0;k<t.values.length;k+=3){t.values[k]=t.values[0];t.values[k+2]=t.values[2]}return[name,clip]}))
   actors=quadroPeladaGecg(0,light,options.mobile).players.map(p=>{const actor:any=criarJogadorNovo({...asset,clips},completa({corpo:p.keeper?'#ffc400':p.side<0?'#1b7a3d':'#3978ba',detalhe:'#f4ecd6',calcao:'#22282b',meiao:'#f4ecd6'}));root.add(actor.holder);actor.holder.traverse((o:T.Object3D)=>{o.castShadow=false});const name=asset.clips.has('passe_curto')?'passe_curto':'passe',pass=actor.acao(name),idle=actor.acao('idle'),walk=actor.acao('trote');for(const a of[pass,idle,walk]){a.play();a.timeScale=0;a.weight=0}return{actor,pass,idle,walk,contact:asset.meta.clips[name]?.toque??pass.getClip().duration*.6}});options.onReady()
  }catch(e){error=String(e)}finally{loading=false}
 }
 function update(seconds:number,camera:T.Camera,height=720,contexto:ContextoBairro={}){
  time=seconds;const center=new T.Vector3(g.x,.3,g.z),p=center.clone().project(camera)
  near=camera.position.distanceTo(center)<250&&Math.abs(p.x)<1.25&&Math.abs(p.y)<1.3&&p.z>-1&&p.z<1
  root.visible=near;if(!near)return;void load()
  const frame=quadroPeladaGecg(seconds,light,options.mobile,contexto);mode=frame.mode;ball.visible=actors.length>0;ball.position.set(frame.ball.x,frame.ball.y,frame.ball.z);ball.rotation.set(seconds*4,seconds*2,0)
  for(let i=0;i<actors.length;i++){const f=actors[i],p=frame.players[i];f.actor.holder.position.set(p.x,.19,p.z);f.actor.holder.rotation.y=p.heading;f.actor.holder.scale.setScalar(frame.children&&!p.keeper ? .78 : 1);f.actor.holder.visible=true
   const q=seconds%6,weight=p.kicking?Math.min(T.MathUtils.smoothstep(q,.1,.35),1-T.MathUtils.smoothstep(q,2.5,3)):0
   f.pass.weight=weight;f.walk.weight=p.keeper?0:(1-weight)*.6;f.idle.weight=1-f.pass.weight-f.walk.weight
   f.pass.time=Math.min(q*f.contact/1.2,f.pass.getClip().duration);f.walk.time=seconds*.8%f.walk.getClip().duration;f.idle.time=seconds%f.idle.getClip().duration;f.actor.mixer.update(0)
  }
  kicks=Math.floor(seconds/6)
  for(const s of spectators){s.body.root.position.set(s.x,.19,s.z);s.body.root.rotation.y=Math.PI;const lod=residentVisibility(s.body.root.position,1.7,camera,height);s.body.update({seconds,speed:0,distance:0,seated:s.seated,visible:lod.visible,detail:lod.detail});if(!s.semSombra&&s.body.root.children[0]?.children.length){s.body.root.traverse((o:T.Object3D)=>{o.castShadow=false});s.semSombra=true}}
 }
 return{root,update,active:()=>near,inspect:()=>({mode,phase:actors.length?'playing':loading?'loading':'waiting',players:actors.length,goalkeepers:actors.filter((_,i)=>quadroPeladaGecg(0,light,options.mobile).players[i].keeper).length,reserves:spectators.length,light,near,seconds:time,kicks,positions:actors.map(a=>a.actor.holder.position.toArray()),ball:ball.position.toArray(),error,source:'decorative local football; no official result'}),dispose(){disposed=true;actors.forEach(a=>a.actor.dispose());spectators.forEach(s=>s.body.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent()}}
}
