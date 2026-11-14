import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {createCivilian} from './cidade3d/civilians.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {batidaPagodeBairro} from './sound'
import {culturaDoBairro,posePipa} from './bairro-cultura'
import type {LugaresBairro,ContextoBairro} from './presidencia-bairro-tradicoes'
import type {SolidoEntorno} from './presidencia-complexo-entorno'
export type VistaCulturaBairro='pipas'|'pagode'|'festa-junina'
type Grupo='pipas'|'pagode'|'junina'
/** Pequenas cenas sazonais. Sem luzes novas, timers, renda ou pedidos externos. */
export function criarCulturaBairro(parent:T.Group,input:{lugares:LugaresBairro;boteco?:T.Vector3;solids:readonly SolidoEntorno[];onReady:()=>void}){
 const root=new T.Group();root.name='cultura-brasileira';parent.add(root)
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),groups={pipas:new T.Group(),pagode:new T.Group(),junina:new T.Group()}
 for(const[id,g]of Object.entries(groups)){g.name='bairro-'+id;g.visible=false;root.add(g)}
 const geo=<G extends T.BufferGeometry>(g:G)=>{geometries.add(g);return g},mat=(color:string,emissive=false)=>{const m=new T.MeshStandardMaterial({color,roughness:.85,side:T.DoubleSide,...(emissive?{emissive:color,emissiveIntensity:.55}:{})});materials.add(m);return m}
 const palette=['#ffc400','#1b7a3d','#c2452f','#3978ba','#f4ecd6'],mats=palette.map(c=>mat(c)),festivalMats=palette.map(c=>mat(c,true)),wood=mat('#8a5735')
 const box=geo(new T.BoxGeometry(1,1,1)),cylinder=geo(new T.CylinderGeometry(1,1,1,10)),sphere=geo(new T.IcosahedronGeometry(1,0)),ring=geo(new T.TorusGeometry(1,.09,4,16))
 const batch=new Map<Grupo,Map<T.Material,T.BufferGeometry[]>>()
 const piece=(group:Grupo,geometry:T.BufferGeometry,material:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,rx=0,rz=0)=>{const transform=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,0,rz)),new T.Vector3(w,h,d)),g=(geometry.index?geometry.toNonIndexed():geometry.clone()).applyMatrix4(transform),map=batch.get(group)??new Map(),list=map.get(material)??[];list.push(g);map.set(material,list);batch.set(group,map)}
 const people:{body:ReturnType<typeof createCivilian>;group:Grupo;x:number;z:number;heading:number;seated:number;child:boolean;semSombra:boolean;stroll?:boolean}[]=[]
 const person=(group:Grupo,id:string,x:number,z:number,heading:number,variant:string,seated=0)=>{const body=createCivilian(groups[group],{id:'cultura-'+id,variant,outfitColor:palette[people.length%palette.length],deferUntilVisible:true,onReady:input.onReady});people.push({body,group,x,z,heading,seated,child:variant.startsWith('child'),semSombra:false})}
 const square=input.lugares.praca?.centro,pub=input.boteco
 // Mesa esquerda do meio: dentro do quintal do boteco, sem ocupar a rua ou o corredor central.
 const pagode=pub?{x:pub.x-2.4,z:pub.z+9.8}:undefined
 const kites:{mesh:T.Mesh;line:T.Line;tail:T.Line;child:{x:number;z:number}}[]=[]
 if(square){
  for(let i=0;i<2;i++){
   const child={x:square.x-3+i*3.6,z:square.z+7};person('pipas','pipa-'+i,child.x,child.z,Math.PI,i?'child-girl':'child-boy')
   const shape=geo(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,1.3,0,-.85,0,0,0,-1.2,0,0,1.3,0,0,-1.2,0,.85,0,0],3)));shape.computeVertexNormals()
   const mesh=new T.Mesh(shape,mats[i?3:0]);groups.pipas.add(mesh)
   const lineMat=new T.LineBasicMaterial({color:'#d8d2b7'});materials.add(lineMat)
   const line=new T.Line(geo(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(new Float32Array(6),3))),lineMat)
   const tail=new T.Line(geo(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(new Float32Array(24),3))),lineMat);groups.pipas.add(line,tail);kites.push({mesh,line,tail,child})
  }
  // Duas barracas pequenas ficam fora da mesa de dominó e dos carrinhos existentes.
  for(const[i,p]of[{x:square.x,z:square.z-8},{x:square.x+8,z:square.z}].entries()){
   for(const dx of[-1.4,1.4])for(const dz of[-.8,.8])piece('junina',box,wood,p.x+dx,1.3,p.z+dz,.09,2.6,.09)
   piece('junina',box,festivalMats[i?2:1],p.x,2.6,p.z,3.4,.18,2.2)
   piece('junina',box,mats[4],p.x,.94,p.z,3,.12,1.7)
   for(let n=0;n<5;n++)piece('junina',sphere,mats[0],p.x-1+n*.5,1.09,p.z,.14,.11,.14)
   person('junina','barraca-'+i,p.x,p.z+.45,Math.PI,'adult-woman')
  }
  for(const x of[-9,9])for(const z of[-8,0,8])piece('junina',box,wood,square.x+x,2.2,square.z+z,.1,4.4,.1)
  const cable:number[]=[]
  for(let row=0;row<3;row++)for(let i=0;i<16;i++){const a=i/16,b=(i+1)/16;for(const u of[a,b])cable.push(square.x-9+18*u,4.4-Math.sin(u*Math.PI)*.45,square.z-8+row*8)}
  const cableMat=new T.LineBasicMaterial({color:'#c1bba4'});materials.add(cableMat);groups.junina.add(new T.LineSegments(geo(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(cable,3))),cableMat))
  for(let i=0;i<2;i++){person('junina','visitante-'+i,square.x-2+i*4,square.z-i*3,0,i?'adult-man':'adult-woman');people[people.length-1].stroll=true}
  for(let row=0;row<3;row++)for(let i=0;i<15;i++){
   const x=square.x-8.5+i*1.2,z=square.z-8+row*8,y=4.3-Math.sin(i/14*Math.PI)*.35
   const flag=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([x-.36,y,z,x+.36,y,z,x,y-.40,z,x+.36,y,z,x+.36,y-.62,z,x,y-.40,z,x-.36,y,z,x,y-.40,z,x-.36,y-.62,z],3));flag.computeVertexNormals();flag.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(18),2));const map=batch.get('junina')??new Map(),material=festivalMats[(i+row)%festivalMats.length],list=map.get(material)??[];list.push(flag);map.set(material,list);batch.set('junina',map)
  }
 }
 if(pagode){
  const seats=[{x:-.85,z:0,h:Math.PI/2},{x:.85,z:0,h:-Math.PI/2},{x:0,z:1.15,h:Math.PI}]
  for(const[i,s]of seats.entries()){
   const x=pagode.x+s.x,z=pagode.z+s.z
   if(i===2){piece('pagode',box,mats[0],x,.44,z,.43,.08,.43);for(const dx of[-.15,.15])piece('pagode',box,wood,x+dx,.22,z,.055,.44,.34)}
   person('pagode','musico-'+i,x,z,s.h,'adult-man',1)
   if(i===0){piece('pagode',cylinder,wood,x+.1,.66,z,.26,.55,.26);piece('pagode',cylinder,mats[4],x+.1,.95,z,.27,.035,.27)}
   else if(i===1){piece('pagode',ring,mats[0],x-.1,.93,z,.22,.22,.22,Math.PI/3);piece('pagode',cylinder,mats[4],x-.1,.93,z,.21,.025,.21,Math.PI/3)}
   else{piece('pagode',sphere,wood,x,.90,z-.1,.25,.07,.3);piece('pagode',box,wood,x+.32,.94,z-.1,.48,.055,.08,0,-.2)}
  }

 }
 for(const[group,map]of batch)for(const[material,list]of map){const merged=geo(mergeGeometries(list)!);list.forEach(g=>g.dispose());groups[group].add(new T.Mesh(merged,material))}
 let context:ContextoBairro={},enabled=false,mobile=false,sound=false,lastBeat=-1,audible=false,visiblePeople=0
 function configure(ctx:ContextoBairro,opts:{enabled:boolean;mobile:boolean;sound?:boolean}){context=ctx;enabled=opts.enabled;mobile=opts.mobile;sound=!!opts.sound;const c=culturaDoBairro(ctx);groups.pipas.visible=enabled&&!!square&&c.pipas;groups.pagode.visible=enabled&&!!pagode&&c.pagode;groups.junina.visible=!!square&&c.junina}
 function update(seconds:number,camera?:T.Camera,height=720){
  if(groups.pipas.visible&&square)for(const[i,k]of kites.entries()){
   const p=posePipa(seconds,i,square);k.mesh.position.set(p.x,p.y,p.z);k.mesh.rotation.set(-.35,.3,Math.sin(seconds*.5+i)*.2)
   const a=k.line.geometry.getAttribute('position') as T.BufferAttribute;a.setXYZ(0,k.child.x,1.1,k.child.z);a.setXYZ(1,p.x,p.y,p.z);a.needsUpdate=true;k.line.geometry.computeBoundingSphere()
   const t=k.tail.geometry.getAttribute('position') as T.BufferAttribute;for(let n=0;n<t.count;n++)t.setXYZ(n,p.x+Math.sin(seconds*2-n*.8)*n*.09,p.y-1.2-n*.30,p.z+Math.sin(seconds-n*.3)*n*.06);t.needsUpdate=true;k.tail.geometry.computeBoundingSphere()
  }
  visiblePeople=0
  for(const[i,p]of people.entries()){let on=enabled&&groups[p.group].visible;if(mobile&&p.group==='pagode'&&p.child)on=false;const phase=seconds*.3+i,pos=new T.Vector3(p.x+(p.stroll?Math.sin(phase)*.8:0),.16,p.z+(p.stroll?Math.cos(phase)*.8:0)),lod=on?residentVisibility(pos,p.child?1.2:1.7,camera,height):{visible:false,detail:'far'};p.body.root.position.copy(pos);p.body.root.rotation.y=p.stroll?Math.atan2(Math.cos(phase),-Math.sin(phase)):p.heading;p.body.update({seconds,speed:p.stroll?.24:0,distance:p.stroll?seconds*.24:0,seated:p.seated,visible:lod.visible,detail:lod.detail});if(lod.visible)visiblePeople++;if(!p.semSombra&&p.body.root.children[0]?.children.length){p.body.root.traverse(o=>{o.castShadow=false});p.semSombra=true}}
  const near=!!pagode&&!!camera&&camera.position.distanceTo(new T.Vector3(pagode.x,1,pagode.z))<45
  audible=enabled&&sound&&groups.pagode.visible&&near;const beat=Math.floor(seconds/.16)
  if(audible&&beat!==lastBeat){batidaPagodeBairro(beat,.12);lastBeat=beat}else if(!audible)lastBeat=-1
 }
 function vista(id:VistaCulturaBairro,aspect:number){const p=id==='pagode'?pagode:square;if(!p)return undefined;const k=aspect<.85?1.4:1;return id==='pipas'?{target:[p.x,6,p.z+2] as [number,number,number],camera:[p.x+14*k,20*k,p.z-24*k] as [number,number,number]}:id==='pagode'?{target:[p.x,1,p.z] as [number,number,number],camera:[p.x-5*k,4*k,p.z+7*k] as [number,number,number]}:{target:[p.x,1.9,p.z] as [number,number,number],camera:[p.x+1*k,23*k,p.z-27*k] as [number,number,number]}}
 return{configure,update,vista,inspect:()=>({schedule:culturaDoBairro(context),places:{pipas:square,pagode,junina:square},visible:Object.fromEntries(Object.entries(groups).map(([id,g])=>[id,g.visible])),visiblePeople,audible,kites:kites.map(k=>k.mesh.position.toArray())}),dispose(){people.forEach(p=>p.body.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent()}}
}
