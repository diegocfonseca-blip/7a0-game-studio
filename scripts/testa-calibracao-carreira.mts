import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {expectativaBotsCarreira,projetarGolsDosSetores} from '../src/escalacao/calibracao-bots-carreira'
import type {EntradaM2} from '../src/escalacao/motor2/carreira'
const fixture=JSON.parse(readFileSync(new URL('./fixtures/calibracao-carreira-v1.json',import.meta.url),'utf8'))
let actual=0,predicted=0
for(const r of fixture.rows){actual+=r.goals[0]+r.goals[1];predicted+=r.x.reduce((sum:number,x:number[])=>sum+projetarGolsDosSetores(x),0)}
assert.equal(fixture.rows.length,120);assert(Math.abs(predicted/actual-1)<.25,'estimativa se afastou do futebol físico na amostra separada')
assert(Math.abs(predicted/120-1.622479464504809)<1e-10,'coeficientes da versão 1 mudaram sem nova versão')
const positions=['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'],team=(level:number)=>positions.map((pos,i)=>({name:'Jogador '+i,pos,club:'Teste',year:2026,fame:3,lo:level,hi:level}))
const e:EntradaM2={seed:123,casa:team(75),fora:team(75),tatica:[0,0],bots:[true,true],clima:'sol'}
const eq=expectativaBotsCarreira(e);assert(Math.abs(eq[0]-eq[1])<1e-12,'times idênticos receberam tratamento diferente')
const strong={...e,casa:team(95)},rates=expectativaBotsCarreira(strong);assert(rates[0]>eq[0]&&rates[1]<eq[1],'qualidade do elenco deixou de pesar')
const inverse=expectativaBotsCarreira({...e,fora:team(95)});assert(Math.abs(rates[0]-inverse[1])<1e-12&&Math.abs(rates[1]-inverse[0])<1e-12,'inverter os lados mudou o critério')
assert.equal(expectativaBotsCarreira(e),eq,'cache de projeção não foi reutilizado')
console.log(`PASS: 120 jogos independentes · físico ${(actual/120).toFixed(3)} gol/jogo · estimado ${(predicted/120).toFixed(3)} · simetria, força e cache preservados`)
