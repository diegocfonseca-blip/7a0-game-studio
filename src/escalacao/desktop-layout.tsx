import {createContext,useContext,useMemo,useState,type ReactNode,type MouseEventHandler} from 'react'
import {createPortal} from 'react-dom'
import logo from './img/logo-ll.webp'
import {tr,getLang} from './lang'
import {ehBasquete} from './marca'
import './desktop-layout.css'

type DesktopLink={label:string;active?:boolean;free?:boolean;onClick:()=>void}
/** Presentation only. Callers supply their existing navigation and account data. */
export function DesktopHeader({name,club,links=[],balance,onClickCapture}:{name?:string;club?:string;links?:DesktopLink[];balance?:ReactNode;onClickCapture?:MouseEventHandler<HTMLElement>}){
 return <header className="ll-desktop-header" onClickCapture={onClickCapture}>
  <div className="ll-desktop-brand">{ehBasquete()?<span className="ov3-sigla" aria-hidden="true">BL</span>:<img src={logo} alt="" width={34} height={34}/>}<span>{ehBasquete()?<>Bid<b>Legends</b></>:<>Leilão <b>Legends</b></>}</span></div>
  <div className="ll-desktop-account"><strong>{name||club||tr('Visitante','Guest')}</strong><small>{club&&club!==name?club:tr('Minha conta','My account')}</small></div>
  {links.length>0&&<nav aria-label={tr('Navegação do Online','Online navigation')}>{links.map(link=><button key={link.label} type="button" data-livre={link.free===false?undefined:'1'} aria-current={link.active?'page':undefined} onClick={link.onClick}>{link.label}</button>)}</nav>}
  {balance!=null&&<div className="ll-desktop-balance">{balance}</div>}
 </header>
}

/** Describes the selected existing ranking; never changes its calculation. */
export function DesktopRankSummary({scope,onClub}:{scope:'arti'|'garcons'|'ouro'|'clubes'|'global';onClub:()=>void}){
 const global=scope==='global',clubs=scope==='clubes'
 const indicator=scope==='arti'?tr('Gols','Goals'):scope==='garcons'?tr('Assistências','Assists'):scope==='ouro'?tr('Bola de Ouro','Golden Ball'):tr('Conquistas','Achievements')
 return <aside className="ll-rank-summary ll-desktop-panel">
  <h2>{tr('Você está vendo','You are viewing')}</h2><div>
   <dl><div><dt>{tr('Alcance','Scope')}</dt><dd>{global?tr('Global · usuários','Global · users'):tr('Sua carreira','Your career')}</dd></div><div><dt>{tr('Indicador','Indicator')}</dt><dd>{indicator}</dd></div><div><dt>{tr('Período','Period')}</dt><dd>{global?tr('Conforme filtro da tabela','As selected in the table'):clubs||scope==='ouro'?tr('Histórico da carreira','Career history'):tr('Temporada e histórico abaixo','Season and history below')}</dd></div></dl>
   <p>{tr('Jogadores reúne gols, assistências e Bola de Ouro. Clubes compara as conquistas desta carreira. Global compara usuários.','Players lists goals, assists and Golden Ball awards. Clubs compares achievements in this career. Global compares users.')}</p>
   <button type="button" onClick={onClub}>{tr('Meu clube','My club')}</button>
  </div>
 </aside>
}

type Slot='summary'|'team'|'room'|'price'|'timer'|'intro'
type Targets=Partial<Record<Slot,HTMLDivElement|null>>
const AuctionLayoutContext=createContext<{enabled:boolean;targets:Targets}>({enabled:false,targets:{}})
/** One live copy of each control; on mobile it stays in its original position. */
export function AuctionSlot({name,children,desktopOnly=false}:{name:Slot;children:ReactNode;desktopOnly?:boolean}){
 const layout=useContext(AuctionLayoutContext),target=layout.targets[name]
 if(desktopOnly&&!layout.enabled)return null
 return layout.enabled&&target?createPortal(children,target):<>{children}</>
}
export function AuctionDesktopLayout({enabled,children,bar,title,description,budget,slots,playersTitle}:{enabled:boolean;children:ReactNode;bar?:ReactNode;title?:string;description?:string;budget?:{balance:number;committed?:number;masked?:boolean};slots?:{position:string;open:number}[];playersTitle?:string}){
 const [summary,setSummary]=useState<HTMLDivElement|null>(null),[team,setTeam]=useState<HTMLDivElement|null>(null),[room,setRoom]=useState<HTMLDivElement|null>(null),[price,setPrice]=useState<HTMLDivElement|null>(null),[timer,setTimer]=useState<HTMLDivElement|null>(null),[intro,setIntro]=useState<HTMLDivElement|null>(null)
 const value=useMemo(()=>({enabled,targets:{summary,team,room,price,timer,intro}}),[enabled,summary,team,room,price,timer,intro])
 if(!enabled)return <>{children}</>
 return <AuctionLayoutContext.Provider value={value}><div className="ll-auction-stage">
  <div className="ll-auction-heading"><div><h1>{title}</h1><p>{description}</p></div><div className="ll-auction-timer" ref={setTimer}/></div>
  <div className="ll-auction-sectors">{bar}</div>
  <div className="ll-auction-prelude" ref={setIntro}/>
  <div className="ll-auction-price" ref={setPrice}/>
  <div className="ll-auction-desktop">
  <section className="ll-desktop-panel ll-auction-players"><h2>{playersTitle||tr('Jogadores disponíveis','Available players')}</h2><div className="ll-auction-main">{children}</div></section>
  <aside className="ll-auction-sidebar" aria-label={tr('Seu leilão','Your auction')}>
   <section className="ll-desktop-panel"><h2>{tr('Meu envelope','My envelope')}</h2>
    {/* 💰 04/11 (Diego: *"saldo, em lances e disponível está confuso, repetindo"*, mockup `scripts/mockups/envelope-desktop.png`):
        um número só, grande — quanto ainda dá pra gastar. A conta (o que tem e o que já foi pros lances) só quando já tem lance. */}
    {budget&&(()=>{const pos=budget.committed??0,livre=Math.max(0,budget.balance-pos),conta=!budget.masked&&pos>0
     return <div className="ll-auction-budget"><div className="ll-budget-big"><strong>{budget.masked?budget.balance:livre}</strong><span>{budget.masked?tr('🪙 no caixa','🪙 in the bank'):tr('🪙 pra gastar','🪙 to spend')}</span></div>
      {conta&&<p className="ll-budget-sub">{getLang()==='en'?<>You have <b>{budget.balance}</b> and already put <b>{pos}</b> in bids.</>:<>Você tem <b>{budget.balance}</b> e já pôs <b>{pos}</b> nos lances.</>}</p>}</div>})()}
    <div className="ll-auction-summary" ref={setSummary}/>
   </section>
   <section className="ll-desktop-panel ll-auction-team"><h2>{tr('Seu time','Your team')}</h2>
    {slots&&<div className="ll-auction-open-slots"><p>{tr('Vagas por posição','Open positions')}</p>{slots.map(slot=><div key={slot.position}><span>{slot.position}</span><b>{slot.open} {slot.open===1?tr('vaga','slot'):tr('vagas','slots')}</b></div>)}</div>}
    <details className="ll-auction-pitch-details" open={!slots}><summary>{ehBasquete()?tr('Ver quadra e elenco','View court and roster'):tr('Ver campinho e elenco','View pitch and squad')}</summary><div ref={setTeam}/></details>
   </section>
   <section className="ll-desktop-panel ll-auction-room"><h2>{tr('Sala','Room')}</h2><details className="ll-auction-room-details"><summary>{tr('Ver equipes da sala','View room teams')}</summary><div ref={setRoom}/></details></section>
  </aside>
  </div>
 </div></AuctionLayoutContext.Provider>
}
