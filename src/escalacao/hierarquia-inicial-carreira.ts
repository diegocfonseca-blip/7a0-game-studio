import dados from './hierarquia-brasil-2026.json'
import {CLUBES_BR_TODOS} from './brasil-oficial'
import {RECEITA_OFICIAL} from './economia-oficial'
import {FORMATIONS,SECTORS,type Sector} from './types'
import type {MarcaCalibracao} from './forca-largada'
export type {MarcaCalibracao} from './forca-largada'

/** Experimento rejeitado em24/11. Referência de pesquisa, sem uso no produto. */
export const HIERARQUIA_INICIAL_CARREIRA = false
export type CalibracaoInicial = {versao:1|2;id:string;clubes:Record<string,{ajuste:number;alvo:number;referencia:number}>}
type Atleta={lo:number;hi:number;club:string;pos?:Sector;fake?:boolean;cria?:boolean;calibracaoCarreira?:MarcaCalibracao}
const normal=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')
const canon=new Map(CLUBES_BR_TODOS.flatMap(c=>[c.nome,...(c.apelidos??[])].map(n=>[normal(n),c.nome] as const)))
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
const decimal=(n:number)=>Math.round(n*10)/10
const BASE:Record<string,number>={A:76,B:62,C:49,D:35,E:23}

/** Referência esportiva ANTERIOR ao sorteio. Nunca consulta cartas ou elencos.
 * RNC pondera cinco temporadas; campanha2025 A/B refina a forma recente.
 * A receita tem peso pequeno e só entra quando há número documentado.
 * Ausência de RNC/receita não é preenchida com um dado supostamente real. */
export function hierarquiaInicialBrasil(){
 return dados.clubes.map(c=>{
  const historico=12*Math.log1p(c.rnc?.pontos??0)/Math.log1p(16314)
  const campanha=c.campanha2025
  const recente=campanha?campanha.serie==='A'?8*clamp((campanha.pontos-17)/62,0,1):4*clamp((campanha.pontos-28)/40,0,1):clamp((c.rnc?.variacao??0)/25,-2,2)
  const receita=RECEITA_OFICIAL[c.clube]
  const estrutura=receita?3*clamp(Math.log1p(receita/10)/Math.log1p(2089/10),0,1):0
  const indice=BASE[c.divisao]+historico+recente+estrutura
  // Conversão explícita de design: índice esportivo -> força do melhor XI.
  const alvo=decimal(indice>=80?75+(indice-80)*.5:indice>=40?56+(indice-40)*.475:48+(indice-20)*.4)
  return {...c,indice,alvo}
 }).sort((a,b)=>b.indice-a.indice||(b.rnc?.pontos??0)-(a.rnc?.pontos??0)||a.clube.localeCompare(b.clube,'pt-BR')).map((c,i)=>({posicao:i+1,...c}))
}
const referencias=new Map(hierarquiaInicialBrasil().map(c=>[c.clube,c]))
const mid=(c:Atleta)=>(c.lo+c.hi)/2
function melhorMedia(squad:readonly Atleta[]){
 let best=-Infinity
 for(const f of ['4-3-3','4-4-2'] as const){
  const xi=SECTORS.flatMap(p=>squad.filter(c=>c.pos===p&&!c.fake&&!c.cria).sort((a,b)=>mid(b)-mid(a)).slice(0,FORMATIONS[f][p]))
  if(xi.length===11)best=Math.max(best,xi.reduce((n,c)=>n+mid(c),0)/11)
 }
 return best
}
function faixa(c:Atleta,ajuste:number){return {lo:decimal(clamp(c.lo+ajuste,25,99)),hi:decimal(clamp(c.hi+ajuste,25,99))}}

/** Referência oculta, uma só vez antes do pregão. As cartas mantêm as notas.
 * Só os atletas do elenco inicial recebem o ajuste; sobras do catálogo não. */
export function criarCalibracaoInicial(clubes:readonly {nome:string;squad:readonly Atleta[]}[],id:string):CalibracaoInicial{
 const out:CalibracaoInicial={versao:2,id,clubes:{}}
 for(const cl of clubes){
  const ref=referencias.get(cl.nome),media=melhorMedia(cl.squad)
  if(!ref||!Number.isFinite(media))continue
  let a=-80,b=80
  for(let n=0;n<24;n++){const m=(a+b)/2,v=melhorMedia(cl.squad.map(c=>({...c,...faixa(c,m)})));if(v<ref.alvo)a=m;else b=m}
  const ajuste=Math.abs(melhorMedia(cl.squad.map(c=>({...c,...faixa(c,a)})))-ref.alvo)<=Math.abs(melhorMedia(cl.squad.map(c=>({...c,...faixa(c,b)})))-ref.alvo)?a:b
  out.clubes[cl.nome]={ajuste,alvo:ref.alvo,referencia:media}
 }
 return out
}
/** Só a distribuição inicial chama esta função. Contratações encerram o ajuste. */
export function calibrarCartaCarreira<T extends Atleta>(c:T,cal?:CalibracaoInicial,clube?:string):T{
 if(!cal||cal.versao!==2||c.fake||c.cria||c.calibracaoCarreira)return c
 const origem=clube??canon.get(normal(c.club)),r=origem?cal.clubes[origem]:undefined
 if(!r||!origem)return c
 return {...c,calibracaoCarreira:{versao:2,ciclo:cal.id,origem,ajuste:r.ajuste}}
}
/** Pregão e reforços usam o catálogo original, igual para humanos e bots. */
export function calibrarCatalogoCarreira<T extends Record<Sector,Atleta[]>>(cat:T,_cal?:CalibracaoInicial):T{return cat}
