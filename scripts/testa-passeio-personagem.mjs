import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
import {existsSync} from 'node:fs'
import * as T from 'three'
registerHooks({resolve(s,c,n){if(s.startsWith('.')){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return{url:u.href,shortCircuit:true}}return n(s,c)},load(u,c,n){if(u.endsWith('/cidade3d/civilians.mjs'))return{format:'module',source:`import * as T from 'three';export function createCivilian(parent){const root=new T.Group();parent.add(root);return{root,ready:Promise.resolve(true),update:frame=>{root.userData.frame=frame},dispose:()=>root.removeFromParent()}}`,shortCircuit:true};return n(u,c)}})
globalThis.window=new EventTarget();globalThis.document=new EventTarget();document.hidden=false
globalThis.HTMLElement=class extends EventTarget {closest(){return true}}
const {criarFanZone,criarColisaoFanZone,passoFanZone,limitesFanZone,RITMO_PASSEIO}=await import('../src/escalacao/presidencia-fanzone-3d.ts')
const {TERRENO_USUARIO,RESERVA_BAIRRO_USUARIO}=await import('../src/escalacao/residencia-planta.ts')
const {RESERVA_CAMPUS}=await import('../src/escalacao/presidencia-implantacao-urbana.ts')
const {LOTE_AGENCIA_CLUBE}=await import('../src/escalacao/clube-mapa-destinos.ts')
const box={minX:10,maxX:10.1,minZ:110,maxZ:120,base:0,top:5},hit=criarColisaoFanZone([box])
const crossed=passoFanZone(8,115,6,0,hit);assert(crossed.x<10&&crossed.x>9,'Corrida não atravessa parede fina, mesmo com um passo grande')
let slide={x:9.6,z:111};for(let i=0;i<20;i++)slide=passoFanZone(slide.x,slide.z,.2,.2,hit);assert(slide.x<10&&slide.z>114,'Continua deslizando pela parede')
const bounds=limitesFanZone([...RESERVA_CAMPUS,...RESERVA_BAIRRO_USUARIO,...LOTE_AGENCIA_CLUBE.footprint]);for(const p of [TERRENO_USUARIO,LOTE_AGENCIA_CLUBE])assert(p.x>bounds.minX&&p.x<bounds.maxX&&p.z>bounds.minZ&&p.z<bounds.maxZ,'Casa e agência dentro dos limites reais')
assert.deepEqual(passoFanZone(0,300,0,400,()=>false,bounds),{x:0,z:bounds.maxZ},'Borda do mundo continua respeitada')
const camera=new T.PerspectiveCamera(),target=new T.Vector3()
function create(extra={}){const scene=new T.Scene(),phases=[];return{scene,phases,fan:criarFanZone(scene,{seats:()=>[],ocupadas:()=>new Set(),onFase:f=>phases.push(f),...extra})}}
function measure(run,fps){const{fan}=create();fan.ligar();fan.input.y=1;fan.input.correr=run;for(let i=0;i<fps;i++)fan.update(1/fps,camera,target);const s=fan.inspect();fan.dispose();return s}
for(const fps of [15,30,60]){assert(Math.abs(measure(false,fps).distancia-RITMO_PASSEIO.andar)<1e-6);assert(Math.abs(measure(true,fps).distancia-RITMO_PASSEIO.correr)<1e-6)}
const{fan,scene}=create();fan.ligar();const key=(type,key,target)=>{const e=new Event(type,{cancelable:true});e.key=key;if(target)Object.defineProperty(e,'target',{value:target});window.dispatchEvent(e)}
key('keydown','w');fan.update(.1,camera,target);assert(fan.inspect().teclas.includes('w'));window.dispatchEvent(new Event('blur'));const pos=fan.inspect().pos;fan.update(.1,camera,target);assert.deepEqual(fan.inspect().pos,pos);assert.deepEqual(fan.inspect().teclas,[])
fan.input.y=1;document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));assert.equal(fan.input.y,0);document.hidden=false
key('keydown','w',new HTMLElement());assert.deepEqual(fan.inspect().teclas,[],'Digitar em um campo não movimenta o personagem')
fan.input.correr=true;fan.desligar();fan.ligar();assert(!fan.input.correr,'Corrida e rótulo podem reiniciar sincronizados');assert.equal(fan.entrar(),false,'Arquibancada sem vaga não cria cadeira falsa');fan.dispose();assert.equal(scene.children.length,0,'Saída limpa o personagem')
const wall=create({obstaculos:()=>[box]});wall.fan.ligar();wall.fan.posicao().set(9.6,.16,115);wall.fan.girar((Math.PI-Math.PI/2)/.008,0);wall.fan.input.y=1;wall.fan.input.correr=true;for(let i=0;i<100;i++)wall.fan.update(.05,camera,target);assert(wall.fan.inspect().velocidade<.001,'Parede não mantém animação de corrida sem deslocamento');wall.fan.dispose()
const occupied=new Set(),seats=[0,1].map(i=>({id:'vaga-'+i,tier:'lower',sector:'geral',supporterSide:'home',row:1,column:i,position:new T.Vector3(i,2,0),heading:0,seatHeight:.45}))
const seating=create({seats:()=>seats,ocupadas:()=>occupied});seating.fan.ligar();assert(seating.fan.entrar());occupied.add(seating.fan.inspect().escolhida);assert.equal(seating.fan.sentar(),false,'Reconfere a cadeira ocupada durante a escolha');assert.equal(seating.fan.fase(),'escolhendo');assert(!occupied.has(seating.fan.inspect().escolhida));assert(seating.fan.sentar());seating.fan.levantar();assert(seating.fan.entrar());seats.forEach(s=>occupied.add(s.id));assert.equal(seating.fan.sentar(),false);assert.equal(seating.fan.inspect().opcoes.length,0);seating.fan.levantar();assert.equal(seating.fan.fase(),'andando','Arquibancada lotada mantém saída para a rua');seating.fan.dispose()
console.log(JSON.stringify({status:'PASS',andar:RITMO_PASSEIO.andar,correr:RITMO_PASSEIO.correr,aumentoCorrida:Math.round((RITMO_PASSEIO.correr/4.8-1)*100)+'%',cadencias:[15,30,60],paredes:true,borda:true,casaAgencia:true,blur:true,abaOculta:true,campoTexto:true,saida:true}))
await import('./testa-fanzone-colisao.mts')
