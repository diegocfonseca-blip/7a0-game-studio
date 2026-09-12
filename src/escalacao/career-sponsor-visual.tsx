import { useState } from 'react'
import { sponsorBetMeta, SPONSOR_BET_PAY, sponsorBrandsOfTier, sponsorBrandOf } from './estadiodata'
import { tr } from './lang' // 🌐 BR/EN (12/09)
import type { SponsorBetTier } from './estadiodata'
import './career-sponsor-visual.css'
import './career-sponsor-paper.css'
import './career-refinements.css'
import './career-sponsor-office.css'
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
  const meta = chosen ? sponsorBetMeta(chosen.tier) : undefined
  const pay = chosen ? (SPONSOR_BET_PAY[div] ?? [0, 0, 0])[chosen.tier - 1] : 0
  return <section className="ll32-sponsor-overview ll36-sponsor" aria-label={tr('Contrato de patrocínio', 'Sponsorship contract')}>
    <header><small>{div === 'V' ? 'VÁRZEA' : `SÉRIE ${div}`}</small><h2>{tr('PATROCÍNIO DO CLUBE', 'CLUB SPONSORSHIP')}</h2></header>
    <div className="ll32-contract-scene"><article>
      <small>{chosen ? tr('CONTRATO DA TEMPORADA', 'SEASON CONTRACT') : tr('PRÓXIMO ACORDO', 'NEXT DEAL')}</small>
      {chosen && <ContractLogo brandId={chosen.brandId}/>}
      <h3>{brand?.name ?? tr('Seu espaço na camisa', 'Your spot on the shirt')}</h3>
      <p>{meta?.label ?? tr('Escolha o patrocinador antes de começar a temporada.', 'Pick the sponsor before the season starts.')}</p>
      {chosen && <strong>+{pay} {tr('MOEDAS', 'COINS')}</strong>}
      <span className="ll35-signature">{chosen ? tr('CONTRATO ASSINADO', 'CONTRACT SIGNED') : tr('Assinatura do presidente', 'President\'s signature')}</span>
    </article></div>
    <p className="ll32-contract-note">{meta ? `${meta.desc} ${tr('O valor acima é o prêmio da meta, não um pagamento já recebido.', 'The amount above is the target prize, not a payment already received.')}` : tr('As propostas aparecem no início da temporada. Aqui você acompanha seus acordos.', 'Proposals show up at the start of the season. Here you follow your deals.')}</p>
    <p className="ll32-contract-note">{tr('Abaixo: transmissão dos jogos e valores por divisão.', 'Below: match broadcasting and amounts per division.')}</p>
  </section>
}
export function CareerSponsorVisual({div,chosen,onPick,fielBrandId}:{div:string;chosen?:Choice;onPick:(tier:SponsorBetTier,brandId:string)=>void;fielBrandId?:string}) {
  const [tier,setTier]=useState<SponsorBetTier|undefined>(chosen?.tier)
  const [draft,setDraft]=useState<Choice|undefined>(chosen)
  const [page,setPage]=useState(()=>chosen ? Math.max(0,sponsorBrandsOfTier(chosen.tier).findIndex(b=>b.id===chosen.brandId)) : 0)
  const pay=SPONSOR_BET_PAY[div]??[0,0,0]
  const selected=draft?.tier===tier ? draft : undefined
  const signed=!!chosen && chosen.tier===tier && chosen.brandId===selected?.brandId
  const brands=tier ? sponsorBrandsOfTier(tier) : []
  const b=brands[page]
  return <section className="ll29-sponsor ll36-sponsor" aria-label={tr('Propostas de patrocínio', 'Sponsorship proposals')}>
    <header><small>{div==='V'?'VÁRZEA':`SÉRIE ${div}`}</small><h2>{tr('PROPOSTAS DE PATROCÍNIO', 'SPONSORSHIP PROPOSALS')}</h2><p>{tier ? tr('Compare as propostas e assine seu contrato.', 'Compare the proposals and sign your contract.') : tr('Primeiro, escolha o objetivo da temporada.', 'First, pick the season\'s goal.')}</p></header>
    <div className="ll29-sponsor-tabs">{([1,2,3] as SponsorBetTier[]).map(t=><button key={t} aria-pressed={t===tier} onClick={()=>{setTier(t);setPage(0);setDraft({tier:t,brandId:sponsorBrandsOfTier(t)[0].id})}}>{sponsorBetMeta(t).label}</button>)}</div>
    {tier && <nav className="ll30-proposals" aria-label={tr('Comparar propostas', 'Compare proposals')}>{brands.map((brand,i)=><button key={brand.id} aria-pressed={page===i} onClick={()=>{setPage(i);setDraft({tier,brandId:brand.id})}}>{tr('PROPOSTA', 'PROPOSAL')} {i+1}</button>)}</nav>}
    <div className="ll36-office"><article className="ll36-paper" aria-live="polite">
      {tier && b ? <>
      <small className="ll35-contract-heading">{tr('CONTRATO DE PATROCÍNIO', 'SPONSORSHIP CONTRACT')}</small>
      <ContractLogo brandId={b.id}/>
      <h3>{b.name}</h3><p>{sponsorBetMeta(tier).label}</p><strong>+{pay[tier-1]} {tr('MOEDAS', 'COINS')}</strong>
      <span className="ll35-signature">{signed ? <><b className="ll36-signed">{tr('Assinado', 'Signed')}</b>{tr('Contrato confirmado', 'Contract confirmed')}</> : tr('Assinatura do presidente', 'President\'s signature')}</span>
      </> : <><h3>{tr('Seu próximo acordo', 'Your next deal')}</h3><p>{tr('Escolha um objetivo acima para receber as propostas.', 'Pick a goal above to receive the proposals.')}</p></>}
    </article></div>
    {tier && <div className="ll29-sponsor-bottom">
      {fielBrandId===b?.id && <p>{tr('FIDELIDADE · mínimo de', 'LOYALTY · minimum of')} {pay[0]} {tr('moedas mesmo sem atingir a meta', 'coins even without hitting the target')}</p>}
      <p>{sponsorBetMeta(tier).desc} {tr('O prêmio depende da meta alcançada.', 'The prize depends on hitting the target.')}</p>
      {chosen && !signed && <p>{tr('Contrato atual:', 'Current contract:')} {sponsorBrandOf(chosen.brandId)?.name} · {sponsorBetMeta(chosen.tier).label}. {tr('Só muda ao assinar.', 'Only changes when you sign.')}</p>}
      <button disabled={!selected||signed} onClick={()=>selected&&onPick(selected.tier,selected.brandId)}>{signed?tr('CONTRATO ASSINADO', 'CONTRACT SIGNED'):tr('ASSINAR CONTRATO', 'SIGN CONTRACT')}</button>
      <small>{tr('Valores por divisão em Clube › Patrocínio.', 'Amounts per division in Club › Sponsorship.')}</small>
    </div>}
  </section>
}
