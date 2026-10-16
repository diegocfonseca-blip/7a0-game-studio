import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {PLANTA_COMPLEXO,deslocarCaminhoComplexo,type PontoComplexo} from './presidencia-complexo-model'
import type {SolidoEntorno} from './presidencia-complexo-entorno'

type Point = PontoComplexo & {y:number}
type Bounds = {minX:number;maxX:number;minZ:number;maxZ:number}
const GROUND=.16
const rectangle=({minX,maxX,minZ,maxZ}:Bounds)=>[
 {x:minX,z:minZ},{x:maxX,z:minZ},{x:maxX,z:maxZ},{x:minX,z:maxZ},
]
const ribbon=(points:readonly PontoComplexo[],width:number)=>[
 ...deslocarCaminhoComplexo(points,width/2),...deslocarCaminhoComplexo(points,-width/2).reverse(),
]
// Connect to the public street, present even when the club has no asphalt.
const out=PLANTA_COMPLEXO.routes.roadOut.points,back=[...PLANTA_COMPLEXO.routes.roadBack.points].reverse()
const streetA={x:(out[2].x+back[2].x)/2,z:(out[2].z+back[2].z)/2}
const streetB={x:(out[3].x+back[3].x)/2,z:(out[3].z+back[3].z)/2}
const streetLength=Math.hypot(streetB.x-streetA.x,streetB.z-streetA.z)
const driveway:Point[]=[
 {x:streetA.x+(streetB.x-streetA.x)*.42+(streetB.z-streetA.z)/streetLength*5,
  z:streetA.z+(streetB.z-streetA.z)*.42-(streetB.x-streetA.x)/streetLength*5,y:0},
 {x:-181,z:45,y:GROUND},{x:-173.5,z:44,y:GROUND},
]
// Begin on the asphalt with a level metre before the slope. The beginning
// must not coincide with the existing raised curb's edge after Float32 upload.
const drivewayStart=driveway[0],drivewayNext=driveway[1]
const drivewayLength=Math.hypot(drivewayNext.x-drivewayStart.x,drivewayNext.z-drivewayStart.z)
driveway.unshift({x:drivewayStart.x-(drivewayNext.x-drivewayStart.x)/drivewayLength,
 z:drivewayStart.z-(drivewayNext.z-drivewayStart.z)/drivewayLength,y:0})
const cutPath=driveway.map(p=>({...p}))
for(const [index,neighbor] of [[0,1],[cutPath.length-1,cutPath.length-2]]){
 const p=cutPath[index],q=cutPath[neighbor],length=Math.hypot(p.x-q.x,p.z-q.z)
 p.x+=(p.x-q.x)/length*.08;p.z+=(p.z-q.z)/length*.08
}
const pedestrian:Point[]=[
 {...PLANTA_COMPLEXO.routes.sidewalk.points[0],y:GROUND},
 {x:-174,z:55,y:GROUND},{x:-154.5,z:48,y:GROUND},{x:-154.5,z:29,y:GROUND},{x:-154.5,z:26,y:GROUND},
]
const bounds={minX:-176,maxX:-133,minZ:8,maxZ:51}
const building={minX:-173,maxX:-136,minZ:10,maxZ:29}
const door={id:'vadico',outside:{x:-154.5,y:GROUND,z:31},threshold:{x:-154.5,y:GROUND,z:29},inside:{x:-154.5,y:GROUND,z:26},width:3.2,height:3.4,heading:0}
const carPositions=[-169,-164.3,-159.6,-149.4,-144.7,-140].map((x,index)=>({id:`vadico-estoque-${index+1}`,x,z:39,y:GROUND,heading:0}))

/** Permanent sponsor scenery; independent of purchases, contracts or savings.
 * Reservations include the entire public access, not just the building. */
export const PLANTA_VADICO={
 label:'Vadico Veículos',bounds,footprint:rectangle(bounds),center:{x:-154.5,z:29.5},
 front:{x:-154.5,z:29,heading:0},building,door,floor:GROUND,
 access:{pedestrian,driveway,pedestrianWidth:2.8,drivewayWidth:5.6},
 drivewayPolygon:ribbon(driveway,5.6),
 // Cut existing elevated pavements slightly beyond the rendered ramp so a
 // numerical boundary cannot leave a thin, impassable curb across the entry.
 drivewayCutPolygon:ribbon(cutPath,5.76),
 reservationPolygons:[rectangle(bounds),ribbon(driveway,7.6),ribbon(pedestrian,4.8)],
 cars:carPositions,
} as const

export type RodaConcessionaria={id:string;carId:string;position:Point;radius:number;contact:Point}

/** Real shop, open doorway and six stationary stock cars. Static geometry is
 * merged by material. The sign is text rendered at 4096px, not an enlarged photo. */
export function criarConcessionariaComplexo(parent:THREE.Object3D){
 const root=new THREE.Group();root.name='complexo-concessionaria-vadico';parent.add(root)
 const solids:SolidoEntorno[]=[],wheels:RodaConcessionaria[]=[]
 const materials:THREE.Material[]=[],textures:THREE.Texture[]=[],geometries:THREE.BufferGeometry[]=[]
 const batches=new Map<THREE.Material,THREE.BufferGeometry[]>()
 const mat=(name:string,color:string,roughness=.75,metalness=0)=>{
  const material=new THREE.MeshStandardMaterial({name,color,roughness,metalness})
  materials.push(material);return material
 }
 const concrete=mat('vadico-concreto','#bdb8a9',.9)
 const cream=mat('vadico-fachada','#eee6d3',.78)
 const paving=mat('vadico-patio','#9e9e94',.93)
 const frame=mat('vadico-metal-grafite','#303b40',.45,.4)
 const glass=mat('vadico-vidros','#6f929a',.19,.25)
 glass.transparent=true;glass.opacity=.38;glass.depthWrite=true
 const carGlass=mat('vadico-vidros-carros','#425d67',.18,.32)
 const tyres=mat('vadico-borracha','#242728',.96)
 const chrome=mat('vadico-rodas-acabamento','#b6bbbd',.32,.7)
 const paint=mat('vadico-pinturas','#ffffff',.32,.24);paint.vertexColors=true
 const lights=mat('vadico-farois','#f2edcf',.25)
 const ceilingLights=mat('vadico-luminarias','#f2edcf',.25)
 ceilingLights.userData.complexoNightEmission={color:'#ffe9b9',intensity:2}
 glass.userData.complexoNightEmission={color:'#dfc795',intensity:.15}
 root.userData.complexoLights=[-169,-140].map(x=>({id:`vadico-teto-${x}`,kind:'entrance',position:[x,GROUND+6.44,20],target:[x,GROUND,20],color:'#ffe9b9',intensity:180,distance:12,angle:.85}))
 const red=mat('vadico-lanternas','#c2232b',.35)
 const white=new THREE.Color('#ffffff')
 const add=(geometry:THREE.BufferGeometry,material:THREE.Material,color?:THREE.Color)=>{
  const source=geometry.index?geometry.toNonIndexed():geometry
  if(source!==geometry)geometry.dispose()
  if(!source.getAttribute('uv'))source.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(source.getAttribute('position').count*2),2))
  if((material as THREE.MeshStandardMaterial).vertexColors){
   const c=color??white,values=new Float32Array(source.getAttribute('position').count*3)
   for(let i=0;i<values.length;i+=3){values[i]=c.r;values[i+1]=c.g;values[i+2]=c.b}
   source.setAttribute('color',new THREE.BufferAttribute(values,3))
  }
  const batch=batches.get(material)??[];batch.push(source);batches.set(material,batch)
 }
 const solid=(id:string,footprint:readonly PontoComplexo[],base:number,top:number)=>{
  solids.push({id,footprint,minX:Math.min(...footprint.map(p=>p.x)),maxX:Math.max(...footprint.map(p=>p.x)),minZ:Math.min(...footprint.map(p=>p.z)),maxZ:Math.max(...footprint.map(p=>p.z)),base,top})
 }
 const box=(id:string,material:THREE.Material,w:number,h:number,d:number,x:number,y:number,z:number,collider=false,color?:THREE.Color)=>{
  const geometry=new THREE.BoxGeometry(w,h,d);geometry.translate(x,y,z);add(geometry,material,color)
  if(collider)solid(id,rectangle({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2}),y-h/2,y+h/2)
 }
 const polygon=(points:readonly PontoComplexo[],y:number,material:THREE.Material)=>{
  const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(p.x,-p.z)))
  const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);geometry.translate(0,y,0);add(geometry,material)
 }
 const walk=(points:readonly Point[],width:number,material:THREE.Material)=>{
  const left=deslocarCaminhoComplexo(points,width/2),right=deslocarCaminhoComplexo(points,-width/2),vertices:number[]=[]
  for(let i=1;i<points.length;i++){
   const a={...left[i-1],y:points[i-1].y},b={...right[i-1],y:points[i-1].y},c={...left[i],y:points[i].y},d={...right[i],y:points[i].y}
   for(const p of [a,c,b,b,c,d])vertices.push(p.x,p.y,p.z)
  }
  const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3))
  geometry.computeVertexNormals();add(geometry,material)
 }
 // The property is already developed city scenery at every stadium stage.
 box('vadico-fundacao',concrete,43,.35,43,-154.5,GROUND-.185,29.5)
 polygon(PLANTA_VADICO.footprint,GROUND,paving)
 walk(pedestrian,PLANTA_VADICO.access.pedestrianWidth,paving)
 walk(driveway,PLANTA_VADICO.access.drivewayWidth,paving)
 // Individual walls leave a genuine opening, also in the physical collider list.
 box('vadico-parede-fundo',cream,37,6.6,.3,-154.5,GROUND+3.3,10.15,true)
 for(const x of [-172.85,-136.15])box('vadico-parede-lateral',cream,.3,6.6,19,x,GROUND+3.3,19.5,true)
 const frontParts=[{left:-173,right:door.threshold.x-door.width/2},{left:door.threshold.x+door.width/2,right:-136}]
 for(const part of frontParts){
  const x=(part.left+part.right)/2,w=part.right-part.left
  box('vadico-base-vitrine',concrete,w,.38,.26,x,GROUND+.19,28.96,true)
  box('vadico-vitrine',glass,w-.14,3.45,.07,x,GROUND+2.12,29.015,true)
  box('vadico-verga-vitrine',frame,w,.13,.17,x,GROUND+3.91,29.025,true)
  const panels=Math.ceil(w/3.2)
  for(let i=0;i<=panels;i++)box('vadico-caixilho',frame,.09,3.85,.16,part.left+w*i/panels,GROUND+1.925,29.02,true)
 }
 box('vadico-faixa-letreiro',cream,37,2.8,.38,-154.5,GROUND+5.25,29.07,true)
 box('vadico-cobertura',concrete,37.8,.24,19.8,-154.5,GROUND+6.78,19.5,true)
 box('vadico-platibanda',frame,38,.32,.22,-154.5,GROUND+7,29.3,true)
 box('vadico-marquise-entrada',frame,5,.14,2.2,-154.5,GROUND+3.65,29.9,true)
 // Interior remains visible through real glazing and the open entrance.
 box('vadico-recepcao',cream,4.5,1.0,1.2,-146,GROUND+.5,17,true)
 box('vadico-recepcao-tampo',frame,4.7,.08,1.4,-146,GROUND+1.04,17,true)
 for(const x of [-169,-165]){
  box('vadico-banco-espera',frame,2.8,.12,.55,x,GROUND+.46,15,true)
  box('vadico-encosto-espera',frame,2.8,.68,.12,x,GROUND+.77,14.75,true)
  for(const side of [-1,1])box('vadico-banco-pe',frame,.13,.40,.50,x+side*1.1,GROUND+.2,15)
 }
 for(const x of [-169,-140])box('vadico-luz-interior',ceilingLights,3.2,.06,.5,x,GROUND+6.5,20)

 // Stationary stock has coherent car dimensions, rubber tyres and wheel contact.
 const carColors=['#d9dbd9','#8e2830','#a6adb2','#254d70','#e4e1d7','#343b3d'].map(c=>new THREE.Color(c))
 const hull=(sections:{z:number;bottom:number;top:number;width:number}[],x:number,y:number,z:number,color:THREE.Color)=>{
  const vertices:number[]=[],triangle=(a:number[],b:number[],c:number[])=>vertices.push(...a,...c,...b)
  const rings=sections.map(s=>[[-s.width,s.bottom,s.z],[s.width,s.bottom,s.z],[s.width,s.top,s.z],[-s.width,s.top,s.z]].map(p=>[p[0]+x,p[1]+y,p[2]+z]))
  for(let i=1;i<rings.length;i++)for(let j=0;j<4;j++){const a=rings[i-1][j],b=rings[i-1][(j+1)%4],c=rings[i][j],d=rings[i][(j+1)%4];triangle(a,c,b);triangle(b,c,d)}
  const first=rings[0],last=rings.at(-1)!;triangle(first[0],first[1],first[2]);triangle(first[0],first[2],first[3]);triangle(last[0],last[2],last[1]);triangle(last[0],last[3],last[2])
  const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();add(geometry,paint,color)
 }
 for(const [index,car] of carPositions.entries()){
  const {x,y,z,id}=car,color=carColors[index]
  hull([{z:-2.18,bottom:.43,top:.64,width:.70},{z:-1.88,bottom:.40,top:.84,width:.90},{z:-1.15,bottom:.40,top:.91,width:.91},{z:1.25,bottom:.40,top:.88,width:.91},{z:1.94,bottom:.43,top:.73,width:.83},{z:2.18,bottom:.46,top:.56,width:.66}],x,y,z,color)
  // Tapered cabin with sloping windscreens, rather than a rectangular block.
  const cabin=new THREE.BufferGeometry(),positions=new Float32Array([
   -.78,.87,-1.32,.78,.87,-1.32,.68,1.48,-.83,-.68,1.48,-.83,
   -.78,.87,1.03,.78,.87,1.03,.67,1.48,.43,-.67,1.48,.43,
  ])
  cabin.setAttribute('position',new THREE.BufferAttribute(positions,3));cabin.setIndex([0,2,1,0,3,2,4,6,7,4,5,6,0,7,3,0,4,7,1,6,5,1,2,6,3,6,2,3,7,6]);cabin.computeVertexNormals();cabin.translate(x,y,z);add(cabin,carGlass)
  box('vadico-carro-teto',paint,1.42,.065,1.3,x,y+1.50,z-.2,false,color)
  for(const side of [-1,1]){
   box('vadico-carro-coluna',paint,.09,.64,.12,x+side*.74,y+1.16,z-.13,false,color)
   box('vadico-carro-espelho',paint,.20,.14,.29,x+side*.98,y+1.03,z+.55,false,color)
   box('vadico-carro-macaneta',chrome,.025,.045,.22,x+side*.924,y+.80,z-.34)
   box('vadico-carro-farol',lights,.43,.15,.07,x+side*.48,y+.67,z+2.055)
   box('vadico-carro-lanterna',red,.36,.16,.065,x+side*.48,y+.68,z-2.02)
   for(const end of [-1,1]){
    const wx=x+side*.90,wz=z+end*1.35,cy=y+.31,radius=.31
    const tyre=new THREE.CylinderGeometry(radius,radius,.22,16);tyre.rotateZ(Math.PI/2);tyre.translate(wx,cy,wz);add(tyre,tyres)
    const rim=new THREE.CylinderGeometry(.205,.205,.235,10);rim.rotateZ(Math.PI/2);rim.translate(wx,cy,wz);add(rim,chrome)
    const wheelId=`${id}-roda-${side}-${end}`
    wheels.push({id:wheelId,carId:id,position:{x:wx,y:cy,z:wz},radius,contact:{x:wx,y,z:wz}})
   }
  }
  box('vadico-carro-grade',frame,.76,.16,.06,x,y+.49,z+2.145)
  solid(id,rectangle({minX:x-1.08,maxX:x+1.08,minZ:z-2.2,maxZ:z+2.2}),y,y+1.55)
 }
 // Pedestrian strip stays free between the two rows of three stock cars.
 for(const x of [-154.5-1.45,-154.5+1.45])box('vadico-faixa-pedestre',cream,.08,.006,18,x,GROUND+.006,39)
 for(const car of carPositions)for(const side of [-1,1])box('vadico-vaga-estoque',cream,.075,.006,5.4,car.x+side*1.55,GROUND+.006,car.z)

 let signSource:'canvas-text'|'node-placeholder'='node-placeholder'
 let signTexture:THREE.Texture
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=4096;canvas.height=300
  const context=canvas.getContext('2d')
  if(context){
   context.fillStyle='#eee6d3';context.fillRect(0,0,canvas.width,canvas.height)
   context.fillStyle='#c31e2b';context.textAlign='center';context.textBaseline='middle'
   let fontSize=canvas.height*.82;context.font=`700 ${fontSize}px Arial, sans-serif`
   fontSize=Math.min(fontSize,fontSize*(canvas.width-240)/context.measureText(PLANTA_VADICO.label).width)
   context.font=`700 ${fontSize}px Arial, sans-serif`;context.fillText(PLANTA_VADICO.label,canvas.width/2,canvas.height*.52)
   signTexture=new THREE.CanvasTexture(canvas);signSource='canvas-text'
  }else signTexture=new THREE.DataTexture(new Uint8Array([238,230,211,255]),1,1)
 }else signTexture=new THREE.DataTexture(new Uint8Array([238,230,211,255]),1,1)
 signTexture.colorSpace=THREE.SRGBColorSpace;signTexture.minFilter=THREE.LinearMipmapLinearFilter;signTexture.magFilter=THREE.LinearFilter
 signTexture.generateMipmaps=true;signTexture.anisotropy=8;signTexture.needsUpdate=true;textures.push(signTexture)
 const signMaterial=new THREE.MeshBasicMaterial({name:'vadico-letreiro-vermelho',map:signTexture,toneMapped:false});materials.push(signMaterial)
 const signGeometry=new THREE.PlaneGeometry(35,35*300/4096);signGeometry.translate(-154.5,GROUND+5.25,29.274);add(signGeometry,signMaterial)
 for(const [material,parts] of batches){
  const geometry=mergeGeometries(parts,false)!
  parts.forEach(part=>part.dispose());geometries.push(geometry)
  geometry.computeBoundingBox();geometry.computeBoundingSphere()
  const mesh=new THREE.Mesh(geometry,material);mesh.name=material.name;mesh.castShadow=material!==signMaterial;mesh.receiveShadow=true;root.add(mesh)
 }
 root.updateMatrixWorld(true)
 const metadata={label:PLANTA_VADICO.label,stockCount:carPositions.length,permanent:true,purchasable:false,
  floor:GROUND,bounds:{...bounds},door,cars:carPositions.map(car=>({...car,length:4.4,width:2.16,height:1.55})),
  wheels:wheels.map(w=>({...w,position:{...w.position},contact:{...w.contact}})),
  sign:{text:PLANTA_VADICO.label,color:'#c31e2b',source:signSource,resolution:[4096,300],position:{x:-154.5,y:GROUND+5.25,z:29.274}},
  meshes:root.children.length,triangles:geometries.reduce((sum,g)=>sum+(g.index?.count??g.getAttribute('position').count)/3,0),
 }
 root.userData.dealership=metadata
 let disposed=false
 return{root,solids,metadata,wheels,dispose(){
  if(disposed)return;disposed=true;root.removeFromParent();root.clear()
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())
 }}
}
