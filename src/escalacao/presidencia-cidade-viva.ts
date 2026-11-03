// 🏙️ CIDADE VIVA (03/11, aprovado pelo Diego): a cidade do mapa da aba Clube reage à carreira.
//  1) "Comprou a loja, o estacionamento ou o metrô: a obra aparece com tapume e guindaste e depois de uma rodada aparece já."
//  2) "Ganhou, o Boteco do Oswaldo fica cheio e em festa; perdeu, só gente cabisbaixa."
//  3) "Título = carreata… a cidade toda em festa no mapa até o próximo jogo, com o ônibus aberto passando pelas ruas."
// Regras PURAS (sem three.js): só leem o save e devolvem o que a cidade mostra. Nada aqui cobra, paga ou grava —
// o único dado novo do save é o carimbo da rodada da compra (`obrasRodada`), escrito pelo reducer na compra.
import {STADIUM_STEP,type StadiumSave} from './estadiodata'
import {ESTACIONAMENTO_CUSTO_TOTAL,estacionamentoDoSave} from './presidencia-estacionamento'

/** Obras que viram PRÉDIO na cidade (as do estádio em si — refletor, telão, cobertura — não têm canteiro na rua). */
export const OBRAS_DA_CIDADE=['loja','estac','praca','chopp','estacao','hotel'] as const
export type ObraCidade=typeof OBRAS_DA_CIDADE[number]
export type CanteiroObra={obra:ObraCidade;/** 🅿️ estacionamento: as etapas (1–4) que estão em obra nesta rodada */lotes?:number[]}
export type HumorBoteco='festa'|'triste'|'normal'
export type CidadeViva={canteiros:readonly CanteiroObra[];humor:HumorBoteco;carreata:boolean;/** cor do clube (ônibus, bandeirinhas, torcida) */cor?:string;cor2?:string}
export const CIDADE_VIVA_NEUTRA:CidadeViva=Object.freeze({canteiros:[],humor:'normal',carreata:false})

/** Carimbo da rodada da compra: temporada + rodadas já jogadas naquela hora. */
export const carimboObra=(seasonNo:number,round:number)=>`${Math.trunc(seasonNo)}:${Math.trunc(round)}`
const ehObraDaCidade=(k:string):k is ObraCidade=>(OBRAS_DA_CIDADE as readonly string[]).includes(k)

/** Usado pelo reducer na compra (STADIUM_BUILD / etapa do estacionamento). Só acrescenta o carimbo; o resto do save fica igual. */
export function marcaObraNaRodada(st:StadiumSave,obra:string,seasonNo:number|undefined,round:number|undefined):StadiumSave{
 if(!ehObraDaCidade(obra)||!Number.isFinite(seasonNo)||!Number.isFinite(round))return st
 return {...st,obrasRodada:{...(st.obrasRodada??{}),[obra]:carimboObra(seasonNo!,round!)}}
}

const LIMIARES_ESTAC=[0,STADIUM_STEP,STADIUM_STEP*2,STADIUM_STEP*3,ESTACIONAMENTO_CUSTO_TOTAL]

/** As obras compradas NESTA rodada (mesma temporada e mesmo número de rodadas jogadas). Rodou o jogo → prédio pronto.
 * Save antigo sem carimbo = tudo pronto (ninguém ganha tapume do nada). */
export function obrasEmCanteiro(st:StadiumSave|undefined,seasonNo:number|undefined,round:number|undefined):CanteiroObra[]{
 const marcas=st?.obrasRodada
 if(!st||!marcas||typeof marcas!=='object'||!Number.isFinite(seasonNo)||!Number.isFinite(round))return []
 const agora=carimboObra(seasonNo!,round!),out:CanteiroObra[]=[]
 for(const obra of OBRAS_DA_CIDADE){
  if(marcas[obra]!==agora)continue
  if(obra==='estac'){
   const p=estacionamentoDoSave(st)
   if(!p.valid||p.stage<1)continue
   // etapas antigas (compra inteira de antes) = os 4 lotes; etapa nova = só o lote que acabou de entrar
   out.push({obra,lotes:p.legacy?[1,2,3,4]:[p.stage]})
  }else if(st.ext.includes(obra))out.push({obra})
 }
 return out
}

/** O save que a CIDADE desenha: sem os prédios em canteiro (no lugar deles entra o tapume). Cópia — o save real não muda. */
export function estadioSemCanteiros(st:StadiumSave,canteiros:readonly CanteiroObra[]):StadiumSave{
 if(!canteiros.length)return st
 const fora=new Set(canteiros.map(c=>c.obra)),copia:StadiumSave={...st,inv:{...st.inv},ext:st.ext.filter(k=>k==='estac'||!fora.has(k as ObraCidade))}
 const estac=canteiros.find(c=>c.obra==='estac')
 if(estac){
  const p=estacionamentoDoSave(st),volta=Math.max(0,Math.min(...(estac.lotes??[p.stage]))-1)
  if(p.legacy){copia.ext=copia.ext.filter(k=>k!=='estac')}
  else{copia.estacionamentoInvestido=LIMIARES_ESTAC[volta];if(volta<4)copia.ext=copia.ext.filter(k=>k!=='estac')}
 }
 return copia
}

/** Humor do boteco pelo último jogo APITADO do seu clube (quem não viu o apito ainda não recebe resultado — sem spoiler). */
export function humorDoBoteco(ultimo?:{gf:number;ga:number}|null):HumorBoteco{
 if(!ultimo||!Number.isFinite(ultimo.gf)||!Number.isFinite(ultimo.ga))return 'normal'
 return ultimo.gf>ultimo.ga?'festa':ultimo.gf<ultimo.ga?'triste':'normal'
}

export type FonteTitulos={
 seasonNo?:number;round?:number
 careerCronica?:Record<string,{t:number;div:string;campeao?:1;copa?:1;sup?:1}[]>
 careerInternationalHistory?:readonly {season:number;libertadores:number;champions:number;mundial:number}[]
}
/** 🏆 Carreata: o clube acabou de ganhar um título e o próximo jogo ainda não rolou.
 *  · liga / Copa / Supercopa: gravados na virada (`careerCronica`, temporada que acabou) → vale enquanto a rodada nova é 0;
 *  · Libertadores / Champions / Mundial: jogados no fim da temporada → vale do fim da liga (rodada 38) até o 1º jogo da próxima. */
export function carreataAtiva(s:FonteTitulos,mgrId:number):boolean{
 const season=s.seasonNo??1,round=s.round??0
 const ultima=s.careerCronica?.[`m${mgrId}`]?.at(-1)
 if(round===0&&ultima&&ultima.t===season-1&&!!(ultima.campeao||ultima.copa||ultima.sup))return true
 const ganhou=(t:number)=>(s.careerInternationalHistory??[]).some(e=>e.season===t&&(e.libertadores>0||e.champions>0||e.mundial>0))
 return round>=38&&ganhou(season)||round===0&&ganhou(season-1)
}

/** Junta as três regras para o mapa. `ultimoJogo` vem da tela da temporada, só depois do apito. */
export function cidadeVivaDaCarreira(s:FonteTitulos,mgrId:number,stadium:StadiumSave|undefined,extra?:{ultimoJogo?:{gf:number;ga:number}|null;cor?:string;cor2?:string}):CidadeViva{
 const carreata=carreataAtiva(s,mgrId)
 return {canteiros:obrasEmCanteiro(stadium,s.seasonNo,s.round),humor:carreata?'festa':humorDoBoteco(extra?.ultimoJogo),carreata,
  ...(extra?.cor?{cor:extra.cor}:{}),...(extra?.cor2?{cor2:extra.cor2}:{})}
}
