import type { WonCard } from './types'
import { useEsc, ehFake } from './store'
import { myApoioPerk } from './apoio'
import { CRITERIOS_CARREIRA_LIBERADOS, criteriosDaTemporada } from './criterios-carreira'
import { condicaoAtiva, modGas, pctBarra } from './condicao'
import { tr } from './lang'

const frame={border:'2px solid #0C0C0C',borderRadius:10,padding:'9px 11px',margin:'9px 0',background:'#F4ECD6',color:'#24271F',fontSize:11,lineHeight:1.5} as const
export function RegrasDaTemporada() {
  const {state}=useEsc()
  if(!state.careerOnline||state.onlineMode==='online'||state.co2||state.sport==='basquete')return null
  const active=criteriosDaTemporada(state)
  return <details style={frame}><summary style={{fontFamily:'Oswald, sans-serif',fontWeight:800,cursor:'pointer'}}>{tr('Regras desta temporada','This season’s rules')}</summary>
    {active?<p style={{margin:'6px 0 0'}}>{tr('O cansaço da carreira reduz o nível uma vez. O preparador melhora a recuperação no banco. O nível do dia varia dentro da faixa de cada carta, e a qualidade dos dois times conta nas jogadas.','Career fatigue reduces the level once. The fitness coach improves recovery on the bench. Daily level varies within each card’s range, and both teams’ quality matters during play.')}</p>:<p style={{margin:'6px 0 0'}}>{CRITERIOS_CARREIRA_LIBERADOS?tr('Esta temporada mantém o cálculo com que começou. Os ajustes da simulação entram na próxima temporada; os resultados disputados continuam valendo.','This season keeps the rules it started with. Simulation updates begin next season; played results remain valid.'):tr('Esta temporada mantém seus critérios e os resultados já disputados.','This season keeps its rules and played results.')}</p>}
    <p style={{margin:'5px 0 0'}}>{tr('Os quatro primeiros sobem, exceto na Série A. Os quatro últimos caem, exceto na Várzea.','The top four go up, except in the top division. The bottom four go down, except in the lowest division.')}</p>
  </details>
}

export function LeituraDoTime({squad,ids,gas}: {squad:WonCard[];ids?:Set<string>;gas?:Record<string,number>}) {
  const {state}=useEsc()
  if(!state.careerOnline||state.onlineMode==='online'||state.co2||state.sport==='basquete'||!ids)return null
  const xi=squad.filter(c=>ids.has(c.id)),tier=myApoioPerk()?.tier
  const numeros=tier==='ouro'||(tier==='prata'&&xi.every(c=>(c.fame??0)<5))
  const active=condicaoAtiva(state),groups=[['GOL',tr('Gol','Goal')],['LAT',tr('Laterais','Full-backs')],['ZAG',tr('Zaga','Defence')],['MEI',tr('Meio','Midfield')],['ATA',tr('Ataque','Attack')]]
  return <details data-team-readiness style={frame}><summary style={{fontFamily:'Oswald, sans-serif',fontWeight:800,cursor:'pointer'}}>{tr('Como meu time entra?','How is my team lining up?')}</summary>
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,marginTop:7}}><thead><tr><th style={{textAlign:'left'}}>{tr('Setor','Unit')}</th><th>{tr('Titulares','Starters')}</th>{numeros&&<th>{tr('Faixa nominal','Nominal range')}</th>}<th>{tr('Atenção','Check')}</th></tr></thead><tbody>
      {groups.map(([pos,label])=>{const cs=xi.filter(c=>c.pos===pos),weak=cs.filter(ehFake).length,tired=active?cs.filter(c=>modGas(gas?.[c.id]??100)<0).length:0;return <tr key={pos}><td style={{borderTop:'1px solid #CFC6B0',padding:'5px 0'}}>{label}</td><td style={{textAlign:'center'}}>{cs.length}</td>{numeros&&<td style={{textAlign:'center'}}>{cs.length?`${Math.round(cs.reduce((n,c)=>n+c.lo,0)/cs.length)}–${Math.round(cs.reduce((n,c)=>n+c.hi,0)/cs.length)}`:'—'}</td>}<td style={{textAlign:'center',color:weak||tired?'#A52B1E':'#175E32'}}>{weak?tr(`${weak} vaga fraca`,`${weak} weak slot`):tired?tr(`${tired} cansado(s)`,`${tired} tired`):active?tr('Em condições','Fit'):'—'}</td></tr>})}
    </tbody></table>
    {active&&gas&&<p style={{margin:'5px 0'}}>{tr('Energia média dos titulares','Average starting XI energy')}: {Math.round(xi.reduce((n,c)=>n+pctBarra(gas[c.id]??100),0)/Math.max(1,xi.length))}%</p>}
    {!criteriosDaTemporada(state)&&CRITERIOS_CARREIRA_LIBERADOS&&<p style={{margin:'5px 0'}}>{tr('Os ajustes da simulação começam na próxima temporada. Os resultados já disputados continuam valendo.','Simulation updates begin next season. Played results remain valid.')}</p>}
    <p style={{margin:'5px 0 0'}}>{active?tr('Confira o banco para rodiziar. O nível varia a cada partida; formação, técnico, condição e adversário pesam no rendimento.','Check the bench to rotate. Level varies each match; formation, coach, fitness and opposition affect performance.'):tr('A condição física é desbloqueada ao chegar à Série C. Antes disso, não há desgaste acumulado na carreira.','Fitness unlocks upon reaching the third division. Career fatigue does not accumulate before then.')}</p>
  </details>
}
