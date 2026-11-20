import './testa-mapa-foco-partida.mts'
import assert from 'node:assert/strict'
import {PerspectiveCamera,Vector3} from 'three'
const {criarCameraPartidaContinua}=await import('../src/escalacao/presidencia-camera-partida-continua.ts')
const {pedeCameraDoMapa,tiraCameraPedida,assinaGiroFeito,avisaGiroFeito}=await import('../src/escalacao/controle-partida-mapa.ts')
for(const aspect of [390/700,1280/800]){
 const camera=new PerspectiveCamera(38,aspect,.1,4000);camera.position.set(300,900,600)
 const controls={target:new Vector3(),enabled:true}
 const controller=criarCameraPartidaContinua(camera,controls as never,()=>{})
 controller.setMode('tv');controller.abrir(0)
 controller.update({x:0,y:.11,z:0},20000)
 assert(controller.abrindo,'Carregamento lento não pula o giro no primeiro quadro')
 const initial=camera.position.clone()
 for(let now=20016;now<=23500;now+=16)controller.update({x:0,y:.11,z:0},now)
 assert(controller.abrindo);assert(initial.distanceTo(camera.position)>20,'A câmera realmente gira')
 const before=controller.inspect().opening!.elapsed
 controller.update({x:0,y:.11,z:0},100000)
 assert(controller.abrindo,'Voltar de aba oculta não conclui apresentação sem mostrar o restante')
 assert(controller.inspect().opening!.elapsed-before<=100)
 for(let now=100016;now<=105000;now+=16)controller.update({x:0,y:.11,z:0},now)
 assert(!controller.abrindo);assert(!controller.transitioning)
 assert(controller.inspect().framing?.visible,'Termina com o centro do campo enquadrado')
 assert(camera.position.distanceTo(controls.target)<160)
 controller.abrir(106000);controller.setMode('free');assert(!controller.abrindo,'Cancelar e voltar ao mapa encerra o giro')
}
pedeCameraDoMapa('abertura','nova-escolha')
assert.deepEqual(tiraCameraPedida(),{camera:'abertura',giro:'nova-escolha'})
let ready=false
const off=assinaGiroFeito(giro=>{if(giro==='nova-escolha')ready=true})
avisaGiroFeito('escolha-antiga');assert(!ready,'Conclusão antiga não libera uma escolha nova')
avisaGiroFeito('nova-escolha');assert(ready);off()
console.log('PASS abertura antes da partida, carregamento lento, aba oculta, enquadramento e confirmação identificada')
