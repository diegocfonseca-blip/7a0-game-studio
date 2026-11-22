import './testa-mapa-foco-partida.mts'
import assert from 'node:assert/strict'
const {assinaturaSimulacaoM2}=await import('../src/escalacao/motor2/carreira.ts')
const carta={name:'Jogador de teste',club:'Clube de teste',year:2026,pos:'MEI',lo:70,hi:80,fame:2,gasMod:0}
const entrada={seed:10,casa:[carta],fora:[carta],tatica:[0,0],bots:[false,true],clima:'seco',fCasa:'4-3-3',fFora:'4-3-3',versao:undefined} as any
const assinatura=(e:any)=>assinaturaSimulacaoM2(e)
const salvo={...entrada,preservarGuardado:true,atualizarIntervalo:undefined,casa:[{...carta,id:'id-do-leilao',paid:15,bio:'biografia'}]}
assert.equal(assinatura(entrada),assinatura(salvo),'Guardar a mesma partida não recarrega os bonecos nem o relógio')
for(const mudanca of [
 {seed:11}, {tatica:[1,0]}, {fCasa:'4-4-2'}, {bots:[false,false]},
 {casa:[{...carta,lo:71}]}, {casa:[{...carta,gasMod:-2}]},
 {casa:[{...carta,year:2025}]}, {casa2:[{...carta,name:'Reserva'}]}, {tatica2:[-1,0]},
])assert.notEqual(assinatura(entrada),assinatura({...entrada,...mudanca}),'Mudança no futebol continua reconstruindo a apresentação')
console.log('PASS identidade da partida: dados salvos preservam os 22; escalação, força, gás e tática continuam distinguíveis')
