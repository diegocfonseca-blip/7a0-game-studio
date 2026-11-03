// 🏙️ Cidade viva (03/11): obra em canteiro só na rodada da compra · humor do boteco pelo resultado · carreata só até o próximo jogo.
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {registerHooks} from 'node:module'
registerHooks({
 resolve(s,c,n){if(s.startsWith('.')&&c.parentURL?.startsWith('file:')){const p=new URL(s+'.ts',c.parentURL);if(existsSync(p))return{url:p.href,shortCircuit:true}}return n(s,c)},
 load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};return n(u,c)},
})
const V=await import('../../src/escalacao/presidencia-cidade-viva.ts')
const {complexoDoEstadio}=await import('../../src/escalacao/presidencia-complexo-model.ts')
const {estacionamentoDoSave}=await import('../../src/escalacao/presidencia-estacionamento.ts')
const {gerarPlantaTransporte}=await import('../../src/escalacao/presidencia-complexo-transporte-model.ts')
const {contornosDoCanteiro,pecasDoCanteiro,rotaCarreata,poseNaRota}=await import('../../src/escalacao/presidencia-cidade-viva-3d.ts')

// ── 1) obra em canteiro SÓ na rodada da compra ─────────────────────────────────────────────────────
const base={inv:{grama:30,geral:40},ext:['loja']}
const comprado=V.marcaObraNaRodada({...base,ext:[...base.ext,'hotel']},'hotel',7,12)
assert.equal(comprado.obrasRodada.hotel,'7:12','a compra grava temporada:rodada')
assert.deepEqual(comprado.ext,['loja','hotel'],'o carimbo não mexe em posse')
assert.deepEqual(V.marcaObraNaRodada(base,'telao',7,12),base,'obra do estádio (telão) não vira canteiro de rua')
assert.deepEqual(V.obrasEmCanteiro(comprado,7,12),[{obra:'hotel'}],'na rodada da compra: canteiro')
assert.deepEqual(V.obrasEmCanteiro(comprado,7,13),[],'jogou a rodada: prédio pronto')
assert.deepEqual(V.obrasEmCanteiro(comprado,8,12),[],'outra temporada com o mesmo número de rodada: pronto')
assert.deepEqual(V.obrasEmCanteiro(base,7,12),[],'save antigo sem carimbo: nada em obra')
assert.deepEqual(V.obrasEmCanteiro({...base,obrasRodada:{loja:'7:12'},ext:[]},7,12),[],'carimbo sem a obra comprada não desenha canteiro')
const desenho=V.estadioSemCanteiros(comprado,V.obrasEmCanteiro(comprado,7,12))
assert.deepEqual(desenho.ext,['loja'],'a cidade desenha o lote sem o prédio')
assert.deepEqual(comprado.ext,['loja','hotel'],'o save real fica intacto')
assert.equal(complexoDoEstadio(desenho).extras.hotel,false)
// estacionamento por etapas: só o lote novo em obra; o anterior continua pronto
const etapa2={inv:{},ext:['loja'],estacionamentoInvestido:40,obrasRodada:{estac:'3:5'}}
assert.deepEqual(V.obrasEmCanteiro(etapa2,3,5),[{obra:'estac',lotes:[2]}])
const sem2=V.estadioSemCanteiros(etapa2,V.obrasEmCanteiro(etapa2,3,5))
assert.equal(estacionamentoDoSave(sem2).stage,1,'a etapa 1 segue pronta enquanto a 2 está em obra')
const etapa4={inv:{},ext:['loja','estac'],estacionamentoInvestido:70,obrasRodada:{estac:'3:5'}}
const sem4=V.estadioSemCanteiros(etapa4,V.obrasEmCanteiro(etapa4,3,5))
assert.equal(estacionamentoDoSave(sem4).valid,true);assert.equal(estacionamentoDoSave(sem4).stage,3);assert(!sem4.ext.includes('estac'))
const antigo={inv:{},ext:['loja','estac'],obrasRodada:{estac:'3:5'}}
assert.deepEqual(V.obrasEmCanteiro(antigo,3,5),[{obra:'estac',lotes:[1,2,3,4]}],'compra inteira antiga: os 4 lotes em obra')
assert.equal(estacionamentoDoSave(V.estadioSemCanteiros(antigo,V.obrasEmCanteiro(antigo,3,5))).stage,0)
// metrô e loja: o canteiro fica no lote em que o prédio nasce, com tapume e um guindaste
const plano=gerarPlantaTransporte(complexoDoEstadio({inv:{},ext:[]}))
for(const obra of V.OBRAS_DA_CIDADE){
 const contornos=contornosDoCanteiro(obra==='estac'?{obra,lotes:[1]}:{obra},plano)
 assert(contornos.length>=1,obra+': contorno do canteiro')
 const {painel,guindaste}=pecasDoCanteiro(contornos,obra==='hotel')
 assert(painel.length>=4&&painel.length<400,obra+': tapume em volta, poucas peças ('+painel.length+')')
 assert.equal(guindaste.length,8*contornos.length,obra+': um guindaste simples por canteiro')
 assert(guindaste.every(p=>Number.isFinite(p.x+p.y+p.z)),obra+': peças no mapa')
}

// ── 2) humor do boteco pelo último resultado ──────────────────────────────────────────────────────
assert.equal(V.humorDoBoteco({gf:2,ga:0}),'festa')
assert.equal(V.humorDoBoteco({gf:0,ga:1}),'triste')
assert.equal(V.humorDoBoteco({gf:1,ga:1}),'normal')
assert.equal(V.humorDoBoteco(null),'normal','sem apito (ou antes da animação acabar) não tem humor: sem spoiler')
assert.equal(V.humorDoBoteco({gf:NaN,ga:0}),'normal')

// ── 3) carreata só até o próximo jogo ─────────────────────────────────────────────────────────────
const cron={m4:[{t:9,div:'B'},{t:10,div:'B',campeao:1}]}
assert.equal(V.carreataAtiva({seasonNo:11,round:0,careerCronica:cron},4),true,'campeão na virada: carreata antes do 1º jogo')
assert.equal(V.carreataAtiva({seasonNo:11,round:1,careerCronica:cron},4),false,'rolou o próximo jogo: acabou a festa')
assert.equal(V.carreataAtiva({seasonNo:12,round:0,careerCronica:cron},4),false,'título de duas temporadas atrás não faz carreata')
assert.equal(V.carreataAtiva({seasonNo:11,round:0,careerCronica:cron},5),false,'título de outro clube não')
assert.equal(V.carreataAtiva({seasonNo:11,round:0,careerCronica:{m4:[{t:10,div:'A',copa:1}]}},4),true,'Copa também')
assert.equal(V.carreataAtiva({seasonNo:11,round:0,careerCronica:{m4:[{t:10,div:'A'}]}},4),false,'temporada sem título: sem carreata')
const liberta=[{season:44,libertadores:1,champions:0,mundial:0}]
assert.equal(V.carreataAtiva({seasonNo:44,round:38,careerInternationalHistory:liberta},4),true,'ganhou a Liberta no fim da temporada')
assert.equal(V.carreataAtiva({seasonNo:45,round:0,careerInternationalHistory:liberta},4),true,'segue até o 1º jogo da próxima')
assert.equal(V.carreataAtiva({seasonNo:45,round:1,careerInternationalHistory:liberta},4),false)
const cv=V.cidadeVivaDaCarreira({seasonNo:11,round:0,careerCronica:cron},4,undefined,{ultimoJogo:{gf:0,ga:3},cor:'#123456'})
assert.equal(cv.carreata,true);assert.equal(cv.humor,'festa','na semana do título a cidade inteira está em festa');assert.equal(cv.cor,'#123456')
// a volta do ônibus aberto passa pelas ruas que os carros da cidade já usam e é fechada
const rota=rotaCarreata();assert(rota.length>10)
const p0=poseNaRota(rota,0),pv=poseNaRota(rota,p0.total)
assert(Math.hypot(p0.x-pv.x,p0.z-pv.z)<1e-6,'uma volta inteira termina onde começou')
for(let d=0;d<p0.total;d+=7){const p=poseNaRota(rota,d);assert(Number.isFinite(p.x+p.z+p.heading))}
console.log('cidade viva: ok')
