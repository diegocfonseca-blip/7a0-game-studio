import {useState} from 'react'
import {useEsc,folhaBaseDoClube,valorOficial,renewOptions,renewCost} from './store'
import {FORMATIONS,SECTORS,type Manager} from './types'
import {useT} from './lang'
import {coachFormationOptions} from './career-live-plan'
import {formacoes15On} from './sport'

export function CareerBudgetPlanner(){
 const {state}=useEsc(),t=useT(),[renewals,setRenewals]=useState<Record<string,number>>({}),[purchase,setPurchase]=useState(0),[wage,setWage]=useState(0)
 const m=state.managers[state.youIdx]
 if(!m||state.onlineMode==='online'||state.sport==='basquete')return null
 const balance=state.careerCoins?.[m.id]??0,charged=(state.seasonNo??1)>=4,payroll=charged?folhaBaseDoClube(state,m):0
 const ending=m.squad.filter(c=>!c.fake&&!c.cria&&c.contratoAte!=null&&c.contratoAte<=(state.seasonNo??1)+1)
 const renew=ending.reduce((n,c)=>n+(renewals[c.id]?renewCost(valorOficial(state,c),renewals[c.id] as 1|2|3|5|10):0),0)
 const reserve=payroll+renew+purchase+(charged?wage:0),free=balance-reserve
 return <section className="ll-central-card" style={{background:'#F4ECD6',color:'#0C0C0C',padding:16,border:'3px solid #0C0C0C',borderRadius:16,marginBottom:16}} data-career-budget>
 <h3 style={{fontFamily:'Oswald',margin:'0 0 8px'}}>{t('QUANTO POSSO GASTAR?','HOW MUCH CAN I SPEND?')}</h3>
 <p>{t('Simule antes de decidir. Nenhuma compra ou renovação é feita aqui.','Plan before deciding. No purchases or renewals are made here.')}</p>
 <dl style={{display:'grid',gridTemplateColumns:'1fr auto',gap:6}}><dt>{t('Caixa atual','Current balance')}</dt><dd>{balance}</dd><dt>{charged?t('Próxima folha anual conhecida','Next known annual payroll'):t('Folha isenta até o fim da T3','Payroll waived through season 3')}</dt><dd>{payroll}</dd><dt>{t('Renovações escolhidas','Selected renewals')}</dt><dd>{renew}</dd></dl>
 {ending.length>0&&<details><summary>{t('Simular renovações próximas','Plan upcoming renewals')}</summary>{ending.map(c=><label key={c.id} style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',margin:'8px 0'}}>{c.name}<select aria-label={`${t('Renovação de','Renewal for')} ${c.name}`} value={renewals[c.id]??0} onChange={e=>setRenewals({...renewals,[c.id]:Number(e.target.value)})}><option value={0}>{t('Não reservar','Do not reserve')}</option>{renewOptions(valorOficial(state,c)).map(y=><option key={y} value={y}>{y} {t('anos','years')} · {renewCost(valorOficial(state,c),y)} {t('moedas','coins')}</option>)}</select></label>)}</details>}
 <div style={{display:'flex',flexWrap:'wrap',gap:12,margin:'12px 0'}}>{[[t('Compra planejada','Planned purchase'),purchase,setPurchase],[t('Novo salário anual','New annual wage'),wage,setWage]].map(([label,value,set])=><label key={String(label)} style={{flex:'1 1 160px'}}>{String(label)}<input type="number" min={0} max={999999} value={Number(value)} onChange={e=>(set as (v:number)=>void)(Math.min(999999,Math.max(0,Math.floor(Number(e.target.value)||0))))} style={{display:'block',width:'100%',boxSizing:'border-box',padding:8,border:'2px solid #0C0C0C',borderRadius:8}}/></label>)}</div>
 <strong style={{display:'block',padding:12,background:free<0?'#f6d9d0':'#d9efdf',borderRadius:10}}>{t('Saldo após reservas','Balance after reserves')}: {free} · {t('Reservado','Reserved')}: {reserve}</strong>
 <p style={{fontSize:12}}>{t('Só despesas conhecidas e sua simulação. Prêmios, vendas e bilheteria futuros não entram. Renovações são estimativas com os valores atuais; não ficam contratadas nem bloqueiam seu caixa.','Only known expenses and your scenario. Future prizes, sales and gate receipts are excluded. Renewals use current prices; they are not signed and do not lock your balance.')}</p>
 </section>
}
export function CareerCoachFit({manager}:{manager:Manager}){
 const {state}=useEsc(),t=useT(),options=coachFormationOptions(state,manager,manager.formation,formacoes15On())
 if(state.sport==='basquete')return null
 return <details style={{marginTop:10}}><summary>{t('Formações e opções do meu elenco','Formations and squad options')}</summary><p style={{fontSize:12}}>{t('O técnico libera esquemas e participa da força da equipe na simulação. Seu elenco precisa preencher cada posição; o OVR das cartas não muda.','Your coach unlocks formations and contributes to team strength in the simulation. Your squad must fill each position; card OVR stays unchanged.')}</p>{options.map(f=>{
 const missing=SECTORS.map(pos=>({pos,n:Math.max(0,FORMATIONS[f.motor][pos]-manager.squad.filter(c=>!c.fake&&!c.emprestado&&c.pos===pos).length)})).filter(x=>x.n)
 return <p key={f.label} style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:12}}><b>{f.label}</b><span>{missing.length?`${t('Faltam','Missing')}: ${missing.map(x=>`${x.n} ${x.pos}`).join(', ')}`:t('✓ Pode montar','✓ Can field')}</span></p>
 })}</details>
}
