import assert from 'node:assert/strict'
import {Vector3,PerspectiveCamera} from 'three'
import {registerHooks} from 'node:module'
import {existsSync} from 'node:fs'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {usarBonecoLeve} from '../src/escalacao/futebol3d/chibi/qualidade-jogador.mjs'
registerHooks({resolve(specifier,context,next){if(specifier.startsWith('.')&&context.parentURL?.startsWith('file:')){const candidate=fileURLToPath(new URL(specifier,context.parentURL));if(existsSync(candidate+'.ts'))return{url:pathToFileURL(candidate+'.ts').href,shortCircuit:true}}return next(specifier,context)}})
const {manterFocoNaPartida,mesmaSessaoDeMapa}=await import('../src/escalacao/presidencia-partida-foco.ts')
const {criarCameraPartidaContinua}=await import('../src/escalacao/presidencia-camera-partida-continua.ts')
const healthy={session:true,finished:true,level:'padrao' as const,software:false,samples:100,meanGap:24}
assert.equal(manterFocoNaPartida({...healthy,finished:false}),true,'Jogo em andamento mantém foco')
assert.equal(manterFocoNaPartida({...healthy,finished:false,started:false}),false,'A abertura anterior ao apito continua disponível')
assert.equal(manterFocoNaPartida(healthy),false,'Pós-jogo em aparelho estável permite cidade')
assert.equal(manterFocoNaPartida({...healthy,level:'leve'}),true,'Perfil leve preserva o campo após o fim')
assert.equal(manterFocoNaPartida({...healthy,software:true}),true)
assert.equal(manterFocoNaPartida({...healthy,meanGap:65}),true)
assert.equal(manterFocoNaPartida({...healthy,samples:10}),true,'Não supor desempenho bom sem amostras')
assert.equal(manterFocoNaPartida({...healthy,session:false,level:'leve'}),false,'Durante a semana o mapa fica livre')
assert(mesmaSessaoDeMapa({key:'save-1',day:10},'save-1',10))
assert(!mesmaSessaoDeMapa({key:'save-1',day:10},'save-1',11),'Próximo dia não herda trava do jogo antigo')
assert(!mesmaSessaoDeMapa({key:'save-1',day:10},'save-2',10))
assert(usarBonecoLeve({mapLevel:'leve',forced:'0',coarse:false}),'Leve também simplifica os jogadores no PC')
assert(usarBonecoLeve({mapLevel:'alta',forced:null,coarse:true}))
assert(!usarBonecoLeve({mapLevel:'padrao',forced:null,coarse:false}))
const camera=new PerspectiveCamera(38,1,.1,4000);camera.position.set(0,30,50)
const controls={target:new Vector3(),enabled:true}
const controller=criarCameraPartidaContinua(camera,controls as never,()=>{})
controller.setMode('fixed');controller.setPitchOnly(true)
for(let i=0;i<80;i++)controller.zoomFixed(1.25)
controller.update({x:0,y:.11,z:0},1000)
const far=controller.inspect()
for(let i=0;i<80;i++)controller.zoomFixed(.8)
controller.update({x:0,y:.11,z:0},2000)
assert(camera.position.distanceTo(controls.target)<250,'Zoom fica na escala do estádio, sem alcançar a cidade')
assert.equal(far.mode,'fixed')
controller.setMode('tv');assert(controller.zoomFixed(1.25),'Zoom restrito também funciona na TV')
console.log('PASS foco de jogo/semana, pós-jogo adaptativo, qualidade do avatar e limites de zoom')
