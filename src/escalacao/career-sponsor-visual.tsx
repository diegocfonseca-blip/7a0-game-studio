import { useState } from 'react'
import { SPONSOR_BET_META, SPONSOR_BET_PAY, sponsorBrandsOfTier, sponsorBrandOf } from './estadiodata'
import type { SponsorBetTier } from './estadiodata'
import './career-sponsor-visual.css'
import './career-sponsor-paper.css'
import './career-refinements.css'
import { VADICO_LOGO } from './vadico'
import { ERO_LOGO } from './ero'
import { MAXJOIAS_LOGO } from './maxjoias'
import { REIDASTINTAS_LOGO } from './reidastintas'

const sponsorLogos = { vadico: VADICO_LOGO, ero: ERO_LOGO, maxjoias: MAXJOIAS_LOGO, reidastintas: REIDASTINTAS_LOGO }
function ContractLogo({ brandId }: { brandId: string }) {
  const brand = sponsorBrandOf(brandId)
  return brand?.logo ? <img className="ll35-contract-logo" src={sponsorLogos[brand.logo]} alt={`Logo ${brand.name}`}/> : null
}

type Choice = { tier: SponsorBetTier; brandId: string }
export function CareerSponsorOverview({ div, chosen }: { div: string; chosen?: Choice }) {
  const brand = chosen ? sponsorBrandOf(chosen.brandId) : undefined
  const meta = chosen ? SPONSOR_BET_META[chosen.tier] : undefined
  const pay = chosen ? (SPONSOR_BET_PAY[div] ?? [0, 0, 0])[chosen.tier - 1] : 0
  return <section className="ll32-sponsor-overview" aria-label="Contrato de patrocínio">
    <header><small>{div === 'V' ? 'VÁRZEA' : `SÉRIE ${div}`}</small><h2>PATROCÍNIO DO CLUBE</h2></header>
    <div className="ll32-contract-scene"><article>
      <small>{chosen ? 'CONTRATO DA TEMPORADA' : 'PRÓXIMO ACORDO'}</small>
      {chosen && <ContractLogo brandId={chosen.brandId}/>}
      <h3>{brand?.name ?? 'Seu espaço na camisa'}</h3>
      <p>{meta?.label ?? 'Escolha o patrocinador antes de começar a temporada.'}</p>
      {chosen && <strong>+{pay} MOEDAS</strong>}
      <span className="ll35-signature">{chosen ? 'CONTRATO ASSINADO' : 'Assinatura do presidente'}</span>
    </article></div>
    <p className="ll32-contract-note">{meta ? `${meta.desc} O valor acima é o prêmio da meta, não um pagamento já recebido.` : 'As propostas aparecem no início da temporada. Aqui você acompanha seus acordos.'}</p>
    <p className="ll32-contract-note">Abaixo: transmissão dos jogos e valores por divisão.</p>
  </section>
}
export function CareerSponsorVisual({div,chosen,onPick,fielBrandId}:{div:string;chosen?:Choice;onPick:(tier:SponsorBetTier,brandId:string)=>void;fielBrandId?:string}) {
  const [tier,setTier]=useState<SponsorBetTier>(chosen?.tier??1)
  const [draft,setDraft]=useState<Choice|undefined>(chosen)
  const [page,setPage]=useState(0)
  const pay=SPONSOR_BET_PAY[div]??[0,0,0]
  const selected=draft?.tier===tier ? draft : undefined
  const signed=!!chosen && chosen.tier===tier && chosen.brandId===selected?.brandId
  return <section className="ll29-sponsor" aria-label="Propostas de patrocínio">
    <header><small>{div==='V'?'VÁRZEA':`SÉRIE ${div}`}</small><h2>PROPOSTAS DE PATROCÍNIO</h2><p>Escolha a expectativa e compare as três propostas.</p></header>
    <div className="ll29-sponsor-tabs">{([1,2,3] as SponsorBetTier[]).map(t=><button key={t} aria-pressed={t===tier} onClick={()=>{setTier(t);setPage(0)}}>{SPONSOR_BET_META[t].label}</button>)}</div>
    <nav className="ll30-proposals" aria-label="Comparar propostas">{sponsorBrandsOfTier(tier).map((b,i)=><button key={b.id} aria-pressed={page===i} onClick={()=>setPage(i)}>PROPOSTA {i+1}</button>)}</nav>
    <div className="ll29-sponsor-contracts">{sponsorBrandsOfTier(tier).map((b,i)=><button key={b.id} className={page===i?'is-visible':''} aria-pressed={selected?.brandId===b.id} onClick={()=>setDraft({tier,brandId:b.id})}>
      <small className="ll35-contract-heading">CONTRATO DE PATROCÍNIO</small>
      <ContractLogo brandId={b.id}/>
      <h3>{b.name}</h3><p>{SPONSOR_BET_META[tier].label}</p><strong>+{pay[tier-1]} MOEDAS</strong>
      {fielBrandId===b.id && <small>FIDELIDADE · mínimo de {pay[0]} moedas mesmo sem atingir a meta</small>}
      <span className="ll35-signature">Assinatura do presidente</span>
      {signed && chosen?.brandId===b.id && <b className="ll29-sponsor-stamp">ASSINADO</b>}
    </button>)}</div>
    <div className="ll29-sponsor-bottom"><p>{SPONSOR_BET_META[tier].desc} O prêmio depende da meta alcançada.</p>
      {chosen && !signed && <p>Contrato atual: {sponsorBrandOf(chosen.brandId)?.name} · {SPONSOR_BET_META[chosen.tier].label}. Só muda ao assinar.</p>}
      <button disabled={!selected||signed} onClick={()=>selected&&onPick(selected.tier,selected.brandId)}>{signed?'CONTRATO ASSINADO':'ASSINAR CONTRATO'}</button>
      <small>Valores por divisão em Clube › Patrocínio.</small>
    </div>
  </section>
}
