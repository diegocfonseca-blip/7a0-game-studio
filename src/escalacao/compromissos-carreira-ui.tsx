import type { Manager } from './types'
import { useEsc, folhaBaseDoClube, renewCost } from './store'
import { projetarCompromissos } from './compromissos-carreira'
import { tr } from './lang'

/** Informação no próprio controle existente, sem etapa ou confirmação adicional. */
export function CompromissoCarreira({custo,salarioNovo=0,salarioSubstituido=0,multa=0,manager,renovacaoReferencia}: {
  custo:number; salarioNovo?:number; salarioSubstituido?:number; multa?:number; manager?:Manager; renovacaoReferencia?:number
}) {
  const {state}=useEsc(),m=manager??state.managers[state.youIdx]
  if(!state.careerOnline||state.sport==='basquete'||!m)return null
  const p=projetarCompromissos({caixa:['auction','monte','cerimonia'].includes(state.screen)?m.money:(state.careerCoins?.[m.id]??m.money),custo,folha:folhaBaseDoClube(state,m),salarioNovo,salarioSubstituido,multa,cobraFolha:state.seasonNo>=4})
  return <div data-career-cost style={{fontFamily:'system-ui',fontSize:11,lineHeight:1.5,color:'#24271F',background:'#F4ECD6',border:'2px solid #0C0C0C',borderRadius:9,padding:'8px 10px',margin:'8px 0',overflowWrap:'anywhere'}}>
    <div><b>{tr('Desembolso agora','Cost now')}:</b> {p.compra+p.multa} 🪙{p.multa>0&&<> · {tr('inclui multa de','includes dismissal fee of')} {p.multa}</>}</div>
    {salarioNovo>0&&<div><b>{tr('Novo salário por temporada','New salary per season')}:</b> {salarioNovo} 🪙</div>}
    <div><b>{tr('Folha do clube por temporada','Club payroll per season')}:</b> {p.folha} 🪙{state.seasonNo<4&&<> · {tr('cobrada a partir da T4','charged from S4')}</>}</div>
    <div style={{fontWeight:800,color:p.aposReserva<0?'#A52B1E':'#175E32'}}>{state.seasonNo>=4?tr('Após compra e reserva da folha','After payment and payroll reserve'):tr('Após esta compra','After this payment')}: {p.aposReserva} 🪙</div>
    {renovacaoReferencia!=null&&renovacaoReferencia>0&&<div>{tr('Referência para renovar por 5 anos','Reference for a 5-year renewal')}: {renewCost(renovacaoReferencia,5)} 🪙 · {tr('se o valor oficial continuar igual','if the official value stays the same')}</div>}
    <small style={{display:'block',color:'#514B3B',marginTop:3}}>{tr('Sem contar receitas futuras, outras compras e renovações.','Excludes future income, other purchases and renewals.')}{state.saf2&&<> {tr('Empréstimos compartilhados da SAF são calculados à parte.','Shared SAF loan costs are calculated separately.')}</>}</small>
  </div>
}
