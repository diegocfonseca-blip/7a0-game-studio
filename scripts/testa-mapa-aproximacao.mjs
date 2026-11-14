import assert from 'node:assert/strict'
import {PerspectiveCamera,Vector3} from 'three'
import {criarTransicaoCameraMapa} from '../src/escalacao/presidencia-complexo-transicao.ts'
const camera=new PerspectiveCamera(38,1,.1,4000),target=new Vector3(),motion=criarTransicaoCameraMapa(camera,target)
camera.position.set(10,100,120);camera.lookAt(target)
const start=motion.capture(),direction=camera.position.clone().sub(target).normalize()
const end={position:new Vector3(90,0,170).addScaledVector(direction,45),target:new Vector3(90,0,170),fov:38}
motion.start(end,100);assert.deepEqual(motion.capture(),start,'Início não teleporta')
let last=0
for(let dt=0;dt<=1000;dt++){
 motion.update(100+dt)
 assert(camera.position.clone().sub(target).normalize().distanceTo(direction)<1e-10,'Mantém direção sem virar o mapa')
 const progress=target.distanceTo(start.target)/end.target.distanceTo(start.target)
 assert(progress>=last-1e-12&&progress<=1+1e-12,'Sem ultrapassar ou voltar');last=progress
 if(dt===1)assert(target.distanceTo(start.target)<.00001,'Arranque sem salto')
}
assert(!motion.active);assert(camera.position.distanceTo(end.position)<1e-10)
motion.start(start,2000);motion.update(2400);const middle=motion.capture();motion.cancel();motion.update(4000);assert.deepEqual(motion.capture(),middle,'Gesto interrompe sem puxar a câmera de volta')
motion.start(end,5000);assert.deepEqual(motion.capture(),middle,'Trocar destino não dá salto');motion.update(6000);assert(!motion.active)
motion.start(start,7000,0);assert(!motion.active);assert.deepEqual(motion.capture(),start,'Movimento reduzido dispensa animação')
motion.start(start,8000);assert(!motion.active,'Vista já alcançada não mantém desenho ativo')
console.log('PASS: 1001 quadros suaves, direção preservada, cancelamento, troca de destino e movimento reduzido')
