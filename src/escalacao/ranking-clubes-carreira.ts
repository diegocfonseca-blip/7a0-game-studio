import type {Card,EscState} from './types'
import {FORMATIONS,SECTORS} from './types'
import {CLUBES_BR_TODOS} from './brasil-oficial'
const nivelDeJogo=(c:Card)=>(c.lo+c.hi)/2

/** Qualidade disponível no elenco, não classificação do campeonato nem saldo.
 * Uma única lista nacional, incluindo os clubes sem série. Sem bônus por nome,
 * posição de referência ou por ser bot; pode ser recalculada após cada mercado.
 * Elenco legado incompleto é explicitado, nunca recebe jogador/nota inventados. */
export function rankingGeralCarreira(s: Pick<EscState,'oficial'|'sport'|'onlineMode'|'managers'|'cpuSquads'|'careerPlacements'>) {
  if(!s.oficial||s.sport==='basquete'||s.onlineMode==='online')return []
  const rows=CLUBES_BR_TODOS.map(cl=>{
    const m=s.managers.find(m=>m.teamName===cl.nome)
    const squad=m?.squad??s.cpuSquads?.[cl.nome]??[]
    const need=FORMATIONS[m?.formation??'4-3-3']
    const xi:Card[]=[]
    for(const pos of SECTORS)xi.push(...squad.filter(c=>c.pos===pos&&!c.fake&&!c.cria&&!(c as {emprestado?:unknown}).emprestado).sort((a,b)=>nivelDeJogo(b)-nivelDeJogo(a)||a.id.localeCompare(b.id)).slice(0,need[pos]))
    return {clube:cl.nome,divisao:s.careerPlacements?.[m?'m'+m.id:cl.nome]??cl.div,uf:cl.uf,forca:xi.length===11?xi.reduce((n,c)=>n+nivelDeJogo(c),0)/11:null,elenco:squad.length}
  }).sort((a,b)=>(b.forca??-1)-(a.forca??-1)||a.clube.localeCompare(b.clube,'pt-BR'))
  return rows.map((c,i)=>({posicao:c.forca==null?null:i+1,...c}))
}
