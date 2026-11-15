await import('./testa-passeio-personagem.mjs')
import assert from 'node:assert/strict'
import * as T from 'three'
const {criarFanZone}=await import('../src/escalacao/presidencia-fanzone-3d.ts')
const {criarPisoPasseio,cameraLivrePasseio}=await import('../src/escalacao/presidencia-passeio-geometria.ts')
const {destinosDoPasseio,painelDoPasseio}=await import('../src/escalacao/presidencia-passeio-destinos.ts')
const {complexoDoEstadio}=await import('../src/escalacao/presidencia-complexo-model.ts')
const {gerarPlantaTransporte}=await import('../src/escalacao/presidencia-complexo-transporte-model.ts')
const scene=new T.Scene(),camera=new T.PerspectiveCamera(),target=new T.Vector3(),actions=[]
const options={seats:()=>[],ocupadas:()=>new Set(),onFase:()=>{},destinos:()=>[{id:'portao',nome:['Portão','Gate'],x:0,z:88},{id:'casa',nome:['Casa','Home'],x:4,z:137,acao:['Entrar','Enter']}],onInteragir:id=>actions.push(id)}
const fan=criarFanZone(scene,options);fan.ligar();fan.escolherDestino('casa');assert.equal(fan.inspect().destino,'casa');assert(fan.rumo().metros<2);fan.girar(80,20);assert.notEqual(fan.inspect().camYaw,fan.inspect().heading);fan.centralizar();assert.equal(fan.inspect().camYaw,fan.inspect().heading);assert(fan.interagir());assert.deepEqual(actions,['casa']);assert.equal(fan.inspect().input.y,0)
fan.input.correr=true;const state=fan.snapshot();fan.dispose();const restored=criarFanZone(scene,options);assert(restored.restaurar(state));assert.deepEqual(restored.inspect().pos,state.pos);assert.equal(restored.inspect().destino,'casa');assert.equal(restored.input.correr,true);restored.dispose()
const blocked=criarFanZone(scene,{...options,obstaculos:()=>[{minX:3,maxX:5,minZ:136,maxZ:139,base:0,top:5}]});assert.equal(blocked.restaurar(state),false);assert.equal(blocked.fase(),'fora');blocked.dispose()
const wall={minX:-2,maxX:2,minZ:4,maxZ:5,base:0,top:10},safe=cameraLivrePasseio(new T.Vector3(0,1.5,0),new T.Vector3(0,4,9),[wall]);assert(safe.z<4&&safe.z>2,'Câmera para antes da parede');const clear=cameraLivrePasseio(new T.Vector3(0,1.5,0),new T.Vector3(0,4,9),[{...wall,base:8,top:9}]);assert.equal(clear.z,9,'Cobertura acima não aproxima câmera indevidamente')
const ground=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.MeshStandardMaterial());ground.rotation.x=-Math.PI/2;ground.position.y=.145;scene.add(ground)
const step=new T.Mesh(new T.BoxGeometry(3,.2,3),new T.MeshStandardMaterial());step.position.set(15,.245,15);scene.add(step);const roof=new T.Mesh(new T.BoxGeometry(3,.2,3),new T.MeshStandardMaterial());roof.position.set(25,5,25);scene.add(roof)
const floor=criarPisoPasseio(scene);assert(Math.abs(floor(0,0,.16)-.16)<.001);assert(floor(15,15,.16)>.34);assert(floor(25,25,.16)<.2,'Não sobe para telhado distante');assert.equal(floor(1200,1200,.16),null,'Não inventa piso fora da cena')
const plan=gerarPlantaTransporte(complexoDoEstadio({inv:{},ext:['estacao']})),access=plan.station.accesses[0];assert(access,'Escada real registrada')
const solids=[]
for(const s of access.surfaces.filter(s=>s.kind==='stair'||s.kind==='platform')){
 const xs=s.polygon.map(p=>p.x),zs=s.polygon.map(p=>p.z),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs),base=s.base??-.02
 const mesh=new T.Mesh(new T.BoxGeometry(maxX-minX,Math.max(.02,s.y-base),maxZ-minZ),new T.MeshStandardMaterial());mesh.position.set((minX+maxX)/2,(base+s.y)/2,(minZ+maxZ)/2);scene.add(mesh)
 solids.push({minX,maxX,minZ,maxZ,base,top:s.y,footprint:s.polygon,piso:true})
}
const stairFloor=criarPisoPasseio(scene),walker=criarFanZone(scene,{...options,piso:stairFloor,obstaculos:()=>solids}),foot=access.stair.points.at(-1);walker.ligar();walker.posicao().set(foot.x,.16,foot.z+1);walker.input.y=1
let peak=0;for(let i=0;i<1800;i++){walker.update(1/60,camera,target);peak=Math.max(peak,walker.posicao().y)}assert(peak>7.5,'Sobe os degraus reais sem teleporte: '+peak);walker.girar(Math.PI/.008,0);for(let i=0;i<1800;i++)walker.update(1/60,camera,target);assert(walker.posicao().y<.3,'Desce a escada e volta ao chão');walker.dispose()
const rampGeo=new T.BufferGeometry();rampGeo.setAttribute('position',new T.Float32BufferAttribute([199,.145,200,201,.145,200,199,1.645,194,201,1.645,194],3));rampGeo.setIndex([0,1,2,2,1,3]);rampGeo.computeVertexNormals();scene.add(new T.Mesh(rampGeo,new T.MeshStandardMaterial()));const rampFloor=criarPisoPasseio(scene);assert(Math.abs(rampFloor(200,197,.91)-.91)<.02,'Piso mede a rampa real');const rampWalker=criarFanZone(scene,{...options,piso:rampFloor});rampWalker.ligar();rampWalker.posicao().set(200,.21,199.8);rampWalker.input.y=1;for(let i=0;i<180;i++)rampWalker.update(1/60,camera,target);assert(rampWalker.posicao().y>1.5,'Sobe a rampa acompanhando a altura');rampWalker.dispose()
const destinations=destinosDoPasseio({gestao:true,agencia:true,museu:true,loja:false});assert(destinations.some(d=>d.id==='casa'));assert(destinations.some(d=>d.id==='agencia'));assert.equal(painelDoPasseio('loja',false),'estrutura');assert.equal(painelDoPasseio('loja',true),'loja');assert.equal(destinosDoPasseio({gestao:false,agencia:true,museu:true,loja:true}).length,1,'Sem gestão não abre painéis do clube')
console.log(JSON.stringify({status:'PASS',destino:true,centralizar:true,interacao:true,retomada:true,posicaoInvalidaRecusada:true,cameraParede:true,piso:true,telhadoRecusado:true,escadaRealAltura:peak,permissoesDeDestino:true}))
