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

export type DesfechoFinal={vencedor:LadoFinal;usuario:LadoFinal;campeao:boolean;tipo:TipoFinal|DivisaoFesta;penaltis?:boolean}
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
/** A placa do pódio: "CAMPEÃO" e, embaixo, a competição internacional/a série e/ou "NOS PÊNALTIS!". */
export function placaDoPodio(d:Pick<DesfechoFinal,'tipo'|'penaltis'>,english=false){
 const comp=ehDivisaoFesta(d.tipo)?temaDaFesta(d.tipo).nome[english?1:0]:d.tipo==='supercopa'?(english?'SUPER CUP':'SUPERCOPA'):d.tipo==='libertadores'?'LIBERTADORES':d.tipo==='champions'?'CHAMPIONS LEAGUE':d.tipo==='mundial'?(english?'CLUB WORLD CUP':'MUNDIAL'):''
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

/** 🎉 TEMA DE CADA COMPETIÇÃO NA FESTA (04/11, Diego: *"cada nome de competição deve ter sua temática e cores também"*).
 * As cores saem de `COMPS` (competicoes-visual.tsx) — a mesma paleta da festa da aba Jogos. Vale pro pódio, a placa, as faixas
 * de campeão, o painel de fundo, o confete, os fogos e os canhões de luz. As divisões (`carA`…`carV`) entram pela festa de
 * CAMPEÃO DA DIVISÃO (`tituloDaDivisao`, logo abaixo). */
export type DivisaoFesta='carA'|'carB'|'carC'|'carD'|'carV'
export type TemaId=TipoFinal|DivisaoFesta
const DIVISOES_FESTA:readonly DivisaoFesta[]=['carA','carB','carC','carD','carV']
export const ehDivisaoFesta=(x:unknown):x is DivisaoFesta=>typeof x==='string'&&(DIVISOES_FESTA as readonly string[]).includes(x)
export type TemaFesta={id:TemaId;nome:readonly [string,string];frase:readonly [string,string];cara:CaraDaTaca
 /** degrau do pódio · tampo · placa (fundo/letra) · faixa de campeão no peito */
 podio:string;tampo:string;placaBg:string;placaInk:string;faixa:string
 /** painel de fundo: degradê, cor do nome, enfeite */
 fundo:readonly [string,string];titulo:string;enfeite:'estrelas'|'fumaca'|'faixas'|'sol'|'raios'|'globo'|null
 confete:readonly string[];fogos:readonly string[];luz:readonly [string,string]}
const T=(t:Omit<TemaFesta,'cara'>&{cara?:CaraDaTaca}):TemaFesta=>({...t,cara:t.cara??caraDaTaca(t.id as TipoFinal)})
export function temaDaFesta(id:TemaId):TemaFesta{
 switch(id){
  case 'libertadores':return T({id,nome:['LIBERTADORES','LIBERTADORES'],frase:['GLÓRIA ETERNA','ETERNAL GLORY'],podio:'#1a140a',tampo:'#C9A227',placaBg:'#0B0B0B',placaInk:'#C9A227',faixa:'#C9A227',fundo:['#3a2c08','#0B0B0B'],titulo:'#F2E6C8',enfeite:'fumaca',confete:['#C9A227','#B5121B','#F2E6C8','#FFFFFF'],fogos:['#C9A227','#B5121B','#F2E6C8'],luz:['#C9A227','#B5121B']})
  case 'champions':return T({id,nome:['CHAMPIONS LEAGUE','CHAMPIONS LEAGUE'],frase:['A ORELHUDA É SUA','BIG EARS ARE YOURS'],podio:'#0A1640',tampo:'#D5DCE4',placaBg:'#0A1640',placaInk:'#FFFFFF',faixa:'#1F3A93',fundo:['#2c4fb5','#0A1640'],titulo:'#FFFFFF',enfeite:'estrelas',confete:['#D5DCE4','#FFFFFF','#1F3A93','#8E9AA8'],fogos:['#FFFFFF','#6F8FFF','#D5DCE4'],luz:['#6F8FFF','#FFFFFF']})
  case 'mundial':return T({id,nome:['MUNDIAL DE CLUBES','CLUB WORLD CUP'],frase:['DONO DO PLANETA','OWNER OF THE PLANET'],podio:'#111111',tampo:'#FFC400',placaBg:'#111111',placaInk:'#FFC400',faixa:'#FFC400',fundo:['#4a3a08','#111111'],titulo:'#FFC400',enfeite:'globo',confete:['#FFC400','#8C6A00','#F4ECD6','#FFFFFF'],fogos:['#FFC400','#F4ECD6','#8C6A00'],luz:['#FFC400','#F4ECD6']})
  case 'supercopa':return T({id,nome:['SUPERCOPA','SUPER CUP'],frase:['CAMPEÃO CONTRA CAMPEÃO','CHAMPION VS CHAMPION'],cara:caraDaTaca('final'),podio:'#C2452F',tampo:'#FFC400',placaBg:'#2a0805',placaInk:'#FFC400',faixa:'#E8503A',fundo:['#c2452f','#2a0805'],titulo:'#FFFFFF',enfeite:'fumaca',confete:['#E8503A','#FFC400','#FFFFFF','#FFD9D2'],fogos:['#E8503A','#FFC400','#FFFFFF'],luz:['#E8503A','#FFC400']})
  case 'carA':return T({id,nome:['SÉRIE A','SÉRIE A'],frase:['O BRASIL É SEU','BRAZIL IS YOURS'],cara:caraDaTaca('final'),podio:'#0C0C0C',tampo:'#FFC400',placaBg:'#0C0C0C',placaInk:'#FFC400',faixa:'#FFC400',fundo:['#5a4510','#0C0C0C'],titulo:'#FFC400',enfeite:'faixas',confete:['#FFC400','#FFE79A','#1B7A3D','#FFFFFF'],fogos:['#FFC400','#FFE79A','#1B7A3D'],luz:['#FFC400','#FFE79A']})
  case 'carB':return T({id,nome:['SÉRIE B','SÉRIE B'],frase:['A ELITE TE ESPERA','THE ELITE AWAITS'],cara:caraDaTaca('final'),podio:'#1c0a3a',tampo:'#D5DCE4',placaBg:'#1c0a3a',placaInk:'#E3D4FF',faixa:'#7C3AED',fundo:['#7c3aed','#1c0a3a'],titulo:'#FFFFFF',enfeite:'estrelas',confete:['#B794FF','#D5DCE4','#FFC400','#FFFFFF'],fogos:['#B794FF','#FFFFFF','#FFC400'],luz:['#B794FF','#D5DCE4']})
  case 'carC':return T({id,nome:['SÉRIE C','SÉRIE C'],frase:['DEGRAU POR DEGRAU','STEP BY STEP'],cara:caraDaTaca('final'),podio:'#0b1d38',tampo:'#CFE2F7',placaBg:'#0b1d38',placaInk:'#FFFFFF',faixa:'#2f6bae',fundo:['#2f6bae','#0b1d38'],titulo:'#FFFFFF',enfeite:'raios',confete:['#5AA0E8','#FFFFFF','#FFC400','#CFE2F7'],fogos:['#5AA0E8','#FFFFFF','#FFC400'],luz:['#5AA0E8','#FFFFFF']})
  case 'carD':return T({id,nome:['SÉRIE D','SÉRIE D'],frase:['A SUBIDA COMEÇA AQUI','THE CLIMB STARTS HERE'],cara:caraDaTaca('final'),podio:'#06240f',tampo:'#F4ECD6',placaBg:'#06240f',placaInk:'#F4ECD6',faixa:'#2a8a4c',fundo:['#2a8a4c','#06240f'],titulo:'#FFFFFF',enfeite:'raios',confete:['#2FBF5A','#F4ECD6','#FFC400','#FFFFFF'],fogos:['#2FBF5A','#F4ECD6','#FFC400'],luz:['#2FBF5A','#F4ECD6']})
  case 'carV':return T({id,nome:['VÁRZEA','VÁRZEA'],frase:['REI DO TERRÃO','KING OF THE DIRT PITCH'],cara:caraDaTaca('final'),podio:'#2b1608',tampo:'#FFE79A',placaBg:'#2b1608',placaInk:'#FFE79A',faixa:'#C98A3A',fundo:['#9a6631','#2b1608'],titulo:'#FFE79A',enfeite:'sol',confete:['#FFE79A','#C98A3A','#F4ECD6','#FFFFFF'],fogos:['#FFE79A','#C98A3A','#FFFFFF'],luz:['#FFE79A','#C98A3A']})
  default:return T({id:'final',nome:['COPA','CUP'],frase:['MATA-MATA DO PAÍS INTEIRO','THE WHOLE COUNTRY\u2019S KNOCKOUT'],podio:'#0a3d1d',tampo:'#FFC400',placaBg:'#0a3d1d',placaInk:'#FFE79A',faixa:'#1B7A3D',fundo:['#1B7A3D','#0a3d1d'],titulo:'#FFE79A',enfeite:'faixas',confete:['#FFC400','#1B7A3D','#2F6BAE','#FFFFFF'],fogos:['#FFC400','#2FBF5A','#FFFFFF'],luz:['#FFC400','#2FBF5A']})
 }
}

/** 🎉 A FESTA DO ELENCO INTEIRO (04/11, Diego: *"não só os 3 no pódio, quero uma festa deles todos"*): os 11 do campeão,
 * 7 no pódio e 4 no chão em volta, cada um com o seu jeito de comemorar e alguns com óculos de festa, faixa de campeão no
 * peito ou bandeira na mão. Fotógrafos na frente, com flash. Tudo determinístico (a mesma festa em qualquer aparelho). */
export type ComemoracaoFesta='pula'|'bracos'|'danca'|'abraco'|'taca'
export type VagaFesta={x:number;z:number;h:number;podio:boolean;anim:ComemoracaoFesta;oculos:boolean;faixa:boolean;bandeira:boolean;parceiro?:number}
export const ELENCO_FESTA=11
export function coreografiaDaFesta():VagaFesta[]{
 const v=(x:number,z:number,h:number,anim:ComemoracaoFesta,o:Partial<VagaFesta>={}):VagaFesta=>({x,z,h,podio:h>0,anim,oculos:false,faixa:false,bandeira:false,...o})
 return [
  v(0,0,1.25,'taca',{faixa:true}),          // o capitão levanta primeiro
  v(-.95,0,1.25,'bracos',{oculos:true}),
  v(.95,0,1.25,'pula',{faixa:true,oculos:true}),
  v(-3.6,0,.85,'abraco',{parceiro:4}),
  v(-2.6,0,.85,'abraco',{parceiro:3,faixa:true}),
  v(2.6,0,.55,'danca',{oculos:true}),
  v(3.6,0,.55,'pula',{bandeira:true}),
  v(-3.4,3.0,0,'danca',{bandeira:true,oculos:true}),
  v(3.4,3.0,0,'bracos',{faixa:true}),
  v(-5.4,.5,0,'pula',{oculos:true}),
  v(5.4,.5,0,'danca',{bandeira:true}),
 ]
}
/** a taça passa de mão em mão no degrau de cima (capitão → esquerda → direita → capitão…), uma vez a cada `TACA_RODA_S` */
export const TACA_RODA_S=3.2
export function quemLevantaATaca(tf:number,inicio:number){
 const ordem=[0,1,2],t=Math.max(0,tf-inicio),i=Math.floor(t/TACA_RODA_S),u=(t-i*TACA_RODA_S)/TACA_RODA_S
 return {de:ordem[i%3],para:ordem[(i+1)%3],passando:u>.82?(u-.82)/.18:0}
}
/** fotógrafos: 3 no celular, 4 no computador; cada um dispara no seu ritmo (≈ 1 foto a cada 1–2 s) */
export function fotografosDaFesta(mobile:boolean){
 const n=mobile?3:4
 return Array.from({length:n},(_,i)=>({x:(i/(n-1)-.5)*(mobile?6.4:8.4),z:5.6+(i%2)*.7,ritmo:.55+((i*37)%10)/22,fase:(i*.37)%1}))
}
/** aceso por ~0,14 s a cada disparo (curto como flash de verdade, mas sem sumir em celular com pouco quadro) */
export const flashAceso=(t:number,ritmo:number,fase:number)=>((t*ritmo+fase)%1+1)%1<.14*ritmo

/** 🏆📋 CAMPEÃO DA DIVISÃO NA CARREIRA (04/11, aprovado pelo Diego): a mesma festa, com o tema da série, depois da ÚLTIMA rodada.
 * A liga não tem partida-final, então quem prova o título é a TELA da carreira: ela só põe `context.tituloDivisao` quando a
 * temporada já ACABOU NA TELA (a 38ª animou e o fim já foi mostrado — `done` no pyramidseason) e o clube do usuário é o 1º da
 * tabela final. O mapa ainda confere, por conta própria: é a rodada 38 da liga (id `<semente>:38:<casa>:<fora>`), a partida
 * está ENCERRADA com o relógio no fim e o clube do usuário está nela. Faltou qualquer prova = nada de festa (vice/acesso não
 * tem pódio, e nunca antes do apito). O campeão é o usuário mesmo se ele perdeu esse último jogo. */
export const ULTIMA_RODADA_LIGA=38
const RODADA_LIGA_NO_ID=/^-?\d+:(\d+):\d+:\d+$/
export function rodadaDaLiga(id:string|undefined|null):number|null{
 if(typeof id!=='string')return null
 const m=RODADA_LIGA_NO_ID.exec(id)
 return m?Number(m[1]):null
}
export function divisaoDaFesta(div:unknown):DivisaoFesta|null{
 return div==='A'||div==='B'||div==='C'||div==='D'||div==='V'?`car${div}` as DivisaoFesta:null
}
type PartidaTitulo=PartidaFinal&{context:PartidaFinal['context']&{tituloDivisao?:unknown}}
export function tituloDaDivisao(match:PartidaTitulo|undefined|null):DesfechoFinal|null{
 if(!match||match.finished!==true)return null
 const tipo=match.context?.tituloDivisao
 if(!ehDivisaoFesta(tipo))return null
 if(rodadaDaLiga(match.context.id)!==ULTIMA_RODADA_LIGA)return null
 if(!Number.isFinite(match.minute)||match.minute<90)return null
 const usuario=ladoDoUsuario(match)
 if(!usuario)return null
 return {vencedor:usuario,usuario,campeao:true,tipo}
}
