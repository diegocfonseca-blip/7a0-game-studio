import assert from 'node:assert/strict'
import fs from 'node:fs'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {registerHooks} from 'node:module'
import * as THREE from 'three'
registerHooks({resolve(specifier,context,next){if(specifier.startsWith('.')&&context.parentURL?.startsWith('file:')){const candidate=fileURLToPath(new URL(specifier,context.parentURL));if(fs.existsSync(candidate+'.ts'))return{url:pathToFileURL(candidate+'.ts').href,shortCircuit:true}}return next(specifier,context)},load(url,context,next){if(url.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};return next(url,context)}})
const {criarArquiteturaComplexo}=await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
const {criarTorcidaComplexo}=await import('../src/escalacao/presidencia-complexo-torcida.ts')
const {complexoDoEstadio,PLANTA_COMPLEXO}=await import('../src/escalacao/presidencia-complexo-model.ts')
const {STADIUM_SECTORS,STADIUM_EXTRAS}=await import('../src/escalacao/estadiodata.ts')
const fullInv=Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost]))
const samples=[
 {name:'vazio',save:{inv:{},ext:[]}},
 {name:'geral-metade',save:{inv:{grama:fullInv.grama,geral:fullInv.geral/2},ext:[]}},
 {name:'geral',save:{inv:{grama:fullInv.grama,geral:fullInv.geral},ext:[]}},
 {name:'refletores-sem-grama',save:{inv:{geral:fullInv.geral},ext:['refl']}},
 {name:'visitante-parcial',save:{inv:{grama:fullInv.grama,geral:fullInv.geral,cadeiras:fullInv.cadeiras,visitante:fullInv.visitante*.4},ext:[]}},
 {name:'primeiro-anel',save:{inv:{...fullInv,camarote:0},ext:[]}},
 {name:'segundo-anel-parcial',save:{inv:{...fullInv,camarote:fullInv.camarote*.11},ext:[]}},
 {name:'segundo-anel',save:{inv:fullInv,ext:[]}},
 {name:'cobertura',save:{inv:fullInv,ext:STADIUM_EXTRAS.map(s=>s.k)}},
 {name:'retratil',save:{inv:fullInv,ext:STADIUM_EXTRAS.map(s=>s.k),roofClosed:true}},
 {name:'legado-sem-primeiro',save:{inv:{grama:fullInv.grama,camarote:fullInv.camarote},ext:['cober','retratil'],roofClosed:true}},
]
const summaries=[],seatsByStage=new Map()
for(const {name,save} of samples){
 const scene=new THREE.Scene(),unrelated=new THREE.Group();scene.add(unrelated)
 const state=complexoDoEstadio(save),architecture=criarArquiteturaComplexo(scene,state)
 scene.updateMatrixWorld(true)
 let triangles=0,meshes=0;const renderables=[],geometries=new Set(),materials=new Set()
 architecture.root.traverse(object=>{if(!(object instanceof THREE.Mesh))return;meshes++;renderables.push(object);geometries.add(object.geometry);materials.add(object.material)
  triangles+=(object.geometry.index?.count??object.geometry.getAttribute('position').count)/3*(object instanceof THREE.InstancedMesh?object.count:1)
  for(const attribute of Object.values(object.geometry.attributes))for(const value of attribute.array)assert(Number.isFinite(value),`${name}: posição/normal não finita`)
  if(object instanceof THREE.InstancedMesh)for(const value of object.instanceMatrix.array)assert(Number.isFinite(value),`${name}: instância não finita`)
 })
 assert(meshes<=40,`${name}: ${meshes} malhas`)
 assert(triangles<=190800,`${name}: ${triangles} triângulos excede orçamento`)
 // O contrato da torcida é emitido junto às cadeiras reais, sem fórmula paralela.
 assert.equal(architecture.seats.length,architecture.counts.seats,`${name}: contrato de assentos incompleto`)
 const ids=new Set(),poses=new Map(),key=m=>m.elements.map(v=>Math.fround(v)).join(','),pose=new THREE.Matrix4()
 for(const seat of architecture.seats){
  assert(!ids.has(seat.id),`${name}: ID de cadeira repetido ${seat.id}`);ids.add(seat.id)
  assert.equal(seat.id,`${seat.sector}:${seat.tier}:${seat.row}:${seat.column}`)
  assert.equal(seat.seatHeight,.43)
  assert.equal(seat.tier==='upper',seat.sector==='camarote')
  if(seat.tier==='upper'){
   const t=(Math.atan2(seat.position.x/(87.8+seat.row*.85+.56),-(seat.position.z-(4+seat.row*.2))/(64.5+seat.row*.85+.56))/(2*Math.PI)+1)%1
   assert.equal(seat.supporterSide,t>=.125&&t<.5?'away':'home','setor superior preserva separação das torcidas')
  }
  assert(Math.sin(seat.heading)*seat.position.x+Math.cos(seat.heading)*seat.position.z<0,`${name}: cadeira olha para fora do campo`)
  pose.compose(new THREE.Vector3(seat.position.x,seat.position.y,seat.position.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),seat.heading),new THREE.Vector3(1,1,1))
  const k=key(pose);poses.set(k,(poses.get(k)??0)+1)
 }
 for(const mesh of renderables.filter(m=>m instanceof THREE.InstancedMesh)){
  if(!mesh.count)continue
  // A face horizontal registrada continua na altura física usada pela torcida.
  assert.equal(mesh.geometry.getAttribute('position').getY(0),Math.fround(.43))
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,pose);const k=key(pose),count=poses.get(k)
   assert(count>0,`${name}: cadeira desenhada sem posição equivalente no contrato`)
   if(count===1)poses.delete(k);else poses.set(k,count-1)
  }
 }
 assert.equal(poses.size,0,`${name}: contrato contém cadeira que não foi desenhada`)
 seatsByStage.set(name,new Map(architecture.seats.map(s=>[s.id,s])))
 assert.equal(architecture.counts.roof,state.roofBuilt&&state.upperComplete&&state.progress.grama>0)
 assert.equal(architecture.counts.floodlights,state.extras.refl&&state.progress.geral===1?4:0)
 if(!state.lowerComplete)assert.equal(architecture.counts.upperRows,0,`${name}: segundo andar antes do primeiro`)
 if(name==='vazio'){assert.equal(meshes,0);assert.equal(architecture.counts.seats,0)}
 if(name==='primeiro-anel')assert.equal(architecture.counts.upperRows,0)
 // O campo e os bancos norte ficam livres de estruturas no nível do jogo. (🏟️ 26/10, caldeirão: a arquibancada encostou no campo —
 // a faixa livre atrás do banco, que fecha em −37,5, é conferida em −39; antes o anel começava a −55 e a sonda ficava em −42)
 const ray=new THREE.Raycaster();for(const z of [-39,-34,0,34])for(const x of [-40,-20,0,20,40]){
  ray.set(new THREE.Vector3(x,1.7,z),new THREE.Vector3(0,-1,0));ray.far=1.75
  assert.equal(ray.intersectObjects(renderables,false).length,0,`${name}: objeto ocupou campo/bancos em${x},${z}`)
 }
 if(name==='refletores-sem-grama'){
  assert.equal(state.floodlit,false,'a presença física não muda o estado da iluminação')
  for(const x of [-72,72])for(const z of [-52,57]){
   ray.set(new THREE.Vector3(x,31,z),new THREE.Vector3(0,-1,0));ray.far=2
   assert(ray.intersectObjects(renderables,false).length>0,'refletor comprado precisa ter poste/cabeça física mesmo sem gramado')
  }
 }
 if(state.lowerComplete){
  for(const [x,z]of[[0,105],[20,95],[-30,100]]){
   ray.set(new THREE.Vector3(x,.4,z),new THREE.Vector3(0,-1,0));ray.far=.45
   const ground=ray.intersectObjects(renderables,false)[0]
   assert(ground&&Math.abs(ground.point.y-.16)<.0001,`${name}: piso do anexo ausente ou desnivelado`)
  }
  // Portal central é um vão, não uma parede escondida por câmera.
  ray.set(new THREE.Vector3(0,1.65,115),new THREE.Vector3(0,0,-1));ray.far=37
  assert.equal(ray.intersectObjects(renderables,false).length,0,`${name}: entrada frontal bloqueada`)
 }
 for(const side of architecture.counts.gates){
  const gate=PLANTA_COMPLEXO.gates[side]
  for(const offset of [-gate.width/2+.65,0,gate.width/2-.65])for(const height of [.25,1,1.9]){
   const start=new THREE.Vector3(gate.approach.x+Math.cos(gate.heading)*offset,gate.floor+height,gate.approach.z-Math.sin(gate.heading)*offset)
   const end=new THREE.Vector3(gate.inside.x+Math.cos(gate.heading)*offset,start.y,gate.inside.z-Math.sin(gate.heading)*offset)
   const direction=end.clone().sub(start);ray.far=direction.length();ray.set(start,direction.normalize())
   assert.equal(ray.intersectObjects(renderables,false).length,0,`${name}: corpo bloqueado no portão ${side}`)
  }
 }
 if(architecture.counts.presidentBox){
  const start=new THREE.Vector3(...PLANTA_COMPLEXO.presidentBox.camera),end=new THREE.Vector3(...PLANTA_COMPLEXO.presidentBox.target)
  const direction=end.sub(start);ray.far=direction.length();ray.set(start,direction.normalize())
  assert.equal(ray.intersectObjects(renderables.filter(m=>!m.material.transparent),false).length,0,`${name}: acabamento opaco bloqueou a vista do camarote`)
 }
 // Percurso completo sobre a geometria renderizada: volume de corpo, largura
 // útil e apoio das duas solas. O salto vertical explícito é somente degrau.
 if(!state.lowerComplete)assert(!architecture.seatAccess.some(a=>a.side==='home'))
 assert.equal(architecture.seatAccess.filter(a=>a.side==='away'&&a.seat.tier==='lower').length,state.valid&&state.progress.visitante>.34?3:0)
 if(state.lowerComplete)assert.equal(architecture.seatAccess.filter(a=>a.seat.tier==='lower').length,6)
 const upperProgress=state.lowerComplete?state.progress.camarote:0
 assert.equal(architecture.seatAccess.filter(a=>a.side==='home'&&a.seat.tier==='upper').length,upperProgress>=.1?1:0)
 assert.equal(architecture.seatAccess.filter(a=>a.side==='away'&&a.seat.tier==='upper').length,upperProgress>=.75?1:0)
 for(const access of architecture.seatAccess){
  const p=access.standing,h=access.seat.heading,closeCamera=new THREE.PerspectiveCamera(38,1.5,.12,4000)
  closeCamera.position.set(p.x+Math.sin(h)*5+Math.cos(h)*2,p.y+2.7,p.z+Math.cos(h)*5-Math.sin(h)*2);closeCamera.lookAt(p.x,p.y+1,p.z)
  architecture.updateSeats(closeCamera);scene.updateMatrixWorld(true)
  assert(architecture.inspectSeatDetail().selected.includes(access.seatId),'cadeira da chegada deve ter acabamento próximo')
  assert(access.seat.tier==='upper'?access.seat.row===0:[0,5,10].includes(access.seat.row))
  assert(ids.has(access.seatId));assert.equal(access.seat.id,access.seatId)
  if(access.seat.tier==='upper'){assert.equal(access.seat.supporterSide,access.side);assert.equal(access.width,1.6)}
  assert.deepEqual(access.points[0],{...PLANTA_COMPLEXO.gates[access.side].inside,y:.16})
  assert.deepEqual(access.points.at(-1),access.standing)
  const accessGeometry=[],croppedGeometries=[]
  const highest=Math.max(...access.points.map(p=>p.y))+2.1
  const bounds={minX:Math.min(...access.points.map(p=>p.x))-1.5,maxX:Math.max(...access.points.map(p=>p.x))+1.5,minZ:Math.min(...access.points.map(p=>p.z))-1.5,maxZ:Math.max(...access.points.map(p=>p.z))+1.5}
  for(const mesh of renderables.filter(m=>!(m instanceof THREE.InstancedMesh))){
   const p=mesh.geometry.getAttribute('position'),index=mesh.geometry.index,vertices=[]
   for(let i=0;i<(index?.count??p.count);i+=3){
    const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k),v=ids.map(id=>new THREE.Vector3(p.getX(id),p.getY(id),p.getZ(id)).applyMatrix4(mesh.matrixWorld))
    if(Math.max(...v.map(v=>v.x))<bounds.minX||Math.min(...v.map(v=>v.x))>bounds.maxX||Math.max(...v.map(v=>v.z))<bounds.minZ||Math.min(...v.map(v=>v.z))>bounds.maxZ||Math.min(...v.map(v=>v.y))>highest||Math.max(...v.map(v=>v.y))<.1)continue
    vertices.push(...v.flatMap(v=>v.toArray()))
   }
   if(!vertices.length)continue
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();geometry.computeBoundingSphere()
   croppedGeometries.push(geometry);const cropped=new THREE.Mesh(geometry,mesh.material);cropped.updateMatrixWorld(true);accessGeometry.push(cropped)
  }
  const distanceToRoute=(x,z)=>Math.min(...access.points.slice(1).map((b,i)=>{
   const a=access.points[i],dx=b.x-a.x,dz=b.z-a.z,d2=dx*dx+dz*dz,t=d2?Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/d2)):0
   return Math.hypot(x-a.x-dx*t,z-a.z-dz*t)
  }))
  // Mesma geometria/matriz das instâncias, só descarta cadeiras distantes para
  // não repetir milhares de testes de triângulos em cada centímetro da rota.
  for(const mesh of renderables.filter(m=>m instanceof THREE.InstancedMesh))for(let index=0;index<mesh.count;index++){
   const m=new THREE.Matrix4();mesh.getMatrixAt(index,m)
   if(m.elements[13]>highest||distanceToRoute(m.elements[12],m.elements[14])>1.5)continue
   const chair=new THREE.Mesh(mesh.geometry,mesh.material);chair.matrixAutoUpdate=false;chair.matrix.copy(m);chair.updateMatrixWorld(true);accessGeometry.push(chair)
  }
  // Ocupa todas as cadeiras vizinhas com o mesmo modelo sentado da cena,
  // inclusive opções de outras filas que não foram escolhidas nesta visita.
  const neighbors=architecture.seats.filter(seat=>seat.id!==access.seatId&&seat.position.y<highest&&distanceToRoute(seat.position.x,seat.position.z)<1.6)
  const crowd=criarTorcidaComplexo(scene,neighbors,{mode:'qa-sample',homeOccupancy:1,awayOccupancy:1})
  assert.equal(crowd.inspect().total,neighbors.length,'amostra de pior caso ocupa todos os vizinhos')
  scene.updateMatrixWorld(true)
  const bodyGeometry=[...accessGeometry]
  crowd.root.traverse(mesh=>{if(!(mesh instanceof THREE.InstancedMesh))return;for(let index=0;index<mesh.count;index++){
   const m=new THREE.Matrix4();mesh.getMatrixAt(index,m);m.premultiply(mesh.matrixWorld)
   const person=new THREE.Mesh(mesh.geometry,mesh.material);person.matrixAutoUpdate=false;person.matrix.copy(m);person.updateMatrixWorld(true);bodyGeometry.push(person)
  }})
  let stairs=0
  for(let i=1;i<access.points.length;i++){
   const a=access.points[i-1],b=access.points[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz)
   if(length<1e-7){assert(Math.abs(b.y-a.y)<=.240001,'espelho alto demais');stairs++;continue}
   assert(Math.abs(b.y-a.y)<1e-7,'degrau virou rampa')
   const nx=-dz/length,nz=dx/length
   for(let step=0;step<=Math.ceil(length/.19);step++){
    const ratio=step/Math.ceil(length/.19),x=a.x+dx*ratio,z=a.z+dz*ratio
    // Um degrau tem quina: não amostrar a cota anterior exatamente depois da
    // aresta, mas conferir patamar, sola e corpo em ambos os lados dela.
    if(step===0||step===Math.ceil(length/.19))continue
    for(const offset of[-.17,0,.17]){
     const px=x+nx*offset,pz=z+nz*offset
     ray.set(new THREE.Vector3(px,a.y+.025,pz),new THREE.Vector3(0,-1,0));ray.far=.05
     const foot=ray.intersectObjects(accessGeometry,false).find(hit=>Math.abs(hit.face.normal.y)>.5)
     assert(foot&&Math.abs(foot.point.y-a.y)<.026,`${name}/${access.side}: sola sem apoio em ${px},${a.y},${pz}`)
    }
    // Centro e bordas do tronco percorrem o mesmo espaço, incluindo sob o
    // segundo anel. Cadeira final só entra no gesto de sentar do ator.
    for(const offset of[-.18,0,.18])for(const height of[.25,.45,.6,.8,1,1.2,1.4,1.6,1.78]){
     ray.set(new THREE.Vector3(x+nx*offset,a.y+height,z+nz*offset),new THREE.Vector3(dx/length,0,dz/length));ray.far=Math.min(.21,length*(1-ratio))
     assert.equal(ray.intersectObjects(bodyGeometry,false).length,0,`${name}/${access.side}/${access.seat.tier}/fila${access.seat.row}: corpo bloqueado em ${x},${a.y+height},${z}`)
    }
   }
  }
  assert.equal(stairs,access.seat.tier==='upper'?39:2+access.seat.row*2)
  crowd.dispose()
  for(const geometry of croppedGeometries)geometry.dispose()
 }
 const disposed=new Set();for(const g of geometries)g.addEventListener('dispose',()=>disposed.add(g))
 architecture.dispose();assert.equal(architecture.root.parent,null);assert.deepEqual(scene.children,[unrelated]);assert.equal(disposed.size,geometries.size)
 summaries.push({name,meshes,triangles,seats:architecture.counts.seats,lowerRows:architecture.counts.lowerRows,upperRows:architecture.counts.upperRows})
}
const half=summaries.find(s=>s.name==='geral-metade'),complete=summaries.find(s=>s.name==='geral')
assert(half.seats>0&&half.seats<complete.seats*.56&&half.seats>complete.seats*.44,'metade da compra deve construir metade do setor')
for(const[id,seat]of seatsByStage.get('geral-metade'))assert.deepEqual(seatsByStage.get('geral').get(id),seat,'cadeira existente mudou ao ampliar o setor')
console.log('PASS arquitetura: módulos proporcionais, ordem de andares/cobertura, campo+bancos livres, portões e vista do camarote desobstruídos, contrato exato das cadeiras, posições finitas, orçamento e dispose',summaries)
