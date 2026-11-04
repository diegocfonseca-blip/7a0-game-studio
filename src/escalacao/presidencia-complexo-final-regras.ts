import {cityPopulation} from './cidade3d/population.mjs'

/** 🏆 Dia de FINAL no mapa 3D (03/11, aprovado pelo Diego: "ok").
 * Regras PURAS (sem three.js): é final? quem levanta a taça? quanta gente a mais? E a linha do tempo da festa.
 * Nada aqui inventa regra nova: a final é a que a competição JÁ identifica no id da partida
 * (`<semente>:copa:<fase>:Final|Supercopa:leg:…`, montado em pyramidseason → MyCopaMatch, o mesmo que liga `final` no placar).
 * E nada revela resultado antes do apito: o desfecho só existe com a partida ENCERRADA (Diego odeia spoiler). */

/** 'final' = Copa do Brasil/Legends · 'supercopa' · e (04/11) as finais internacionais da carreira. */
export type TipoFinal='final'|'supercopa'|'libertadores'|'champions'|'mundial'
export type LadoFinal='home'|'away'
export type TimeFinal={name?:string;color?:string}
/** 🥅 a disputa de pênaltis que decidiu a final — quem monta o contexto SÓ põe isto depois que a tela já mostrou o resultado
 * dos pênaltis (sem spoiler). O mapa nunca desenha nem narra a cobrança: só faz a festa de quem ganhou. */
export type PenaltisFinal={vencedor:LadoFinal}
type PartidaFinal={context:{id:string;homeClubId?:number;awayClubId?:number;penaltis?:PenaltisFinal};viewerClubId?:number;minute:number;homeScore:number;awayScore:number;finished:boolean}

const FINAL_NO_ID=/:copa:\d+:(Final|Supercopa)(?::|$)/
/** 🌎 final internacional: `<semente>:intl:<temporada>:<libertadores|champions|mundial>:Final:…` (career-international-view → JogoGrande, fase 'final') */
const FINAL_INTL_NO_ID=/:intl:\d+:(libertadores|champions|mundial):Final(?::|$)/
/** O mesmo nome de fase que o placar usa pra virar "é campeão" (`copaFase.name === 'Final' || 'Supercopa'`). */
export function tipoFinalDaPartida(id:string|undefined|null):TipoFinal|null{
 if(typeof id!=='string')return null
 const m=FINAL_NO_ID.exec(id)
 if(m)return m[1]==='Supercopa'?'supercopa':'final'
 const i=FINAL_INTL_NO_ID.exec(id)
 return i?i[1] as TipoFinal:null
}
/** O id da partida internacional (o mesmo de sempre; na final ganha o ":Final" que o mapa reconhece). */
export function idPartidaInternacional(p:{seed:number;season:number;comp:string;roundKey:number;home:string;away:string;final:boolean}){
 return `${p.seed}:intl:${p.season}:${p.comp}:${p.final?'Final:':''}${p.roundKey}:${p.home}:${p.away}`
}

/** Lado do clube do usuário no estádio do jogo (o mandante é sempre `home`). Sem prova, `null`. */
export function ladoDoUsuario(match:Pick<PartidaFinal,'context'|'viewerClubId'>|undefined|null):LadoFinal|null{
 const v=match?.viewerClubId
 if(!match||!Number.isSafeInteger(v))return null
 if(match.context.homeClubId===v)return 'home'
 if(match.context.awayClubId===v)return 'away'
 return null
}

export type DesfechoFinal={vencedor:LadoFinal;usuario:LadoFinal;campeao:boolean;tipo:TipoFinal;penaltis?:boolean}
/** Só depois do APITO FINAL (partida encerrada e relógio no fim). Empate = decidiu nos pênaltis: a festa só existe quando
 * o contexto já traz o vencedor dos pênaltis (`context.penaltis`, posto pela tela DEPOIS de mostrar a disputa). Sem isso,
 * nada — melhor não festejar do que festejar o time errado ou adiantar o pênalti. */
export function desfechoDaFinal(match:PartidaFinal|undefined|null):DesfechoFinal|null{
 if(!match||match.finished!==true)return null
 const tipo=tipoFinalDaPartida(match.context?.id)
 if(!tipo)return null
 // (o placar "encerrado" que o mapa guarda quando o card some no MEIO do jogo não é apito: exige o relógio no fim)
 if(!Number.isFinite(match.minute)||match.minute<90)return null
 const usuario=ladoDoUsuario(match)
 if(!usuario)return null
 const h=match.homeScore,a=match.awayScore
 if(!Number.isFinite(h)||!Number.isFinite(a))return null
 if(h===a){
  const pen=match.context.penaltis?.vencedor
  if(pen!=='home'&&pen!=='away')return null
  return {vencedor:pen,usuario,campeao:pen===usuario,tipo,penaltis:true}
 }
 const vencedor:LadoFinal=h>a?'home':'away'
 return {vencedor,usuario,campeao:vencedor===usuario,tipo}
}

/** Cor do pódio = cor de quem GANHOU (o seu clube, ou o rival se você perdeu). */
export function corDoPodio(d:DesfechoFinal,cores:{home?:string;away?:string},padrao='#FFC400'){
 const c=cores[d.vencedor]
 return typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)?c:padrao
}

/** A faixa do avião: "FINAL · A × B" (igual em PT e EN). Sem os nomes, só "FINAL". */
export function faixaDaFinal(times:readonly TimeFinal[]){
 // ("FINAL" é igual em PT e EN; nome de clube nunca se traduz)
 const nomes=times.map(t=>(t?.name??'').trim()).filter(Boolean)
 return nomes.length===2?`FINAL · ${nomes[0]} × ${nomes[1]}`:'FINAL'
}
/** A faixa da fachada: só "FINAL" (+ o nome da competição em cima quando for Supercopa ou internacional). */
export function faixaDaFachada(tipo:TipoFinal,english=false){
 const topo=tipo==='supercopa'?(english?'SUPER CUP':'SUPERCOPA'):tipo==='libertadores'?'LIBERTADORES':tipo==='champions'?'CHAMPIONS':tipo==='mundial'?(english?'CLUB WORLD CUP':'MUNDIAL DE CLUBES'):(english?'MATCH DAY':'DIA DE')
 return {topo,grande:'FINAL'}
}

/** 🏆 A CARA DE CADA TAÇA no pódio (as mesmas cores de `competicoes-visual.tsx`: COMPS.liberta/champions/mundial).
 * `forma` diz qual taça o 3D monta; `metal` é a cor dela; `base` a do pé; `papel` entra no papel picado junto da cor do campeão. */
export type CaraDaTaca={forma:'copa'|'liberta'|'orelhuda'|'mundial';metal:string;base:string;papel:readonly string[];fogo:string}
export function caraDaTaca(tipo:TipoFinal):CaraDaTaca{
 if(tipo==='libertadores')return {forma:'liberta',metal:'#C9A227',base:'#5a3b1c',papel:['#C9A227','#B5121B','#F2E6C8'],fogo:'#B5121B'}
 if(tipo==='champions')return {forma:'orelhuda',metal:'#D5DCE4',base:'#1a2a5c',papel:['#D5DCE4','#FFFFFF','#1F3A93'],fogo:'#6F8FFF'}
 if(tipo==='mundial')return {forma:'mundial',metal:'#FFC400',base:'#111111',papel:['#FFC400','#8C6A00','#F4ECD6'],fogo:'#FFC400'}
 return {forma:'copa',metal:'#FFC400',base:'#2b2b2b',papel:['#FFC400','#FFFFFF'],fogo:'#E8503A'}
}
/** A placa do pódio: "CAMPEÃO" e, embaixo, a competição internacional e/ou "NOS PÊNALTIS!". */
export function placaDoPodio(d:Pick<DesfechoFinal,'tipo'|'penaltis'>,english=false){
 const comp=d.tipo==='libertadores'?'LIBERTADORES':d.tipo==='champions'?'CHAMPIONS LEAGUE':d.tipo==='mundial'?(english?'CLUB WORLD CUP':'MUNDIAL'):''
 const pen=d.penaltis?(english?'ON PENALTIES!':'NOS PÊNALTIS!'):''
 return {grande:english?'CHAMPIONS':'CAMPEÃO',linha:[comp,pen].filter(Boolean).join(' · ')}
}

/** "O dobro" de gente na rua, sem furar o teto da cidade (`cityPopulation`: 20 no celular, 48 no computador). */
export function publicoExtraDaFinal({base,mobile}:{base:number;mobile:boolean}){
 const teto=cityPopulation({enabled:true,supporters:1e12,built:0,mobile})
 const b=Number.isFinite(base)?Math.max(0,Math.floor(base)):0
 return Math.max(0,Math.min(b,teto-b))
}

/** ⏱️ Linha do tempo DEPOIS do apito (segundos). Tem que caber nos ~45 s em que o mapa ainda desenha
 * (`cumprimentos()` no complexo 3D), senão a festa congela no meio. */
export const FESTA_FINAL={
 trocaBonecos:4, // os marcadores do 2D saem e entram os bonecos (os mesmos jogadores)
 podioSobe:[4,6.5],
 caminhada:[5,14],
 sobem:[14,16],
 taca:[17,19.5],
 fogos:[3,40],
 papel:[16,42],
 fumaca:[16,40],
 fim:44,
} as const
export type QuadroFesta={podio:number;caminhada:number;sobem:number;taca:number;fogos:boolean;papel:number;fumaca:number;trocaBonecos:boolean}
const k=(t:number,[a,b]:readonly [number,number])=>Math.max(0,Math.min(1,(t-a)/(b-a)))
const janela=(t:number,[a,b]:readonly [number,number],fade=2)=>t<a||t>b?0:Math.min(1,(t-a)/fade,(b-t)/fade)
export function quadroDaFesta(t:number,campeao:boolean):QuadroFesta{
 const s=Number.isFinite(t)?Math.max(0,t):0
 return {podio:k(s,FESTA_FINAL.podioSobe),caminhada:k(s,FESTA_FINAL.caminhada),sobem:k(s,FESTA_FINAL.sobem),taca:k(s,FESTA_FINAL.taca),
  // 🎆 fogos SÓ quando o seu clube é campeão (perdeu = sem fogos)
  fogos:campeao&&s>=FESTA_FINAL.fogos[0]&&s<=FESTA_FINAL.fogos[1],
  papel:janela(s,FESTA_FINAL.papel),fumaca:janela(s,FESTA_FINAL.fumaca),trocaBonecos:s>=FESTA_FINAL.trocaBonecos}
}

/** Quantos bonecos sobem no pódio e quantos saem cabisbaixos (celular leva menos). */
export function elencoDaFesta(campeao:boolean,mobile:boolean){
 return {podio:mobile?5:7,saindo:campeao?0:mobile?3:5}
}
