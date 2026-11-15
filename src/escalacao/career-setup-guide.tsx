import {useEffect,useId,useRef,useState,type ReactNode} from 'react'
import {useT} from './lang'
import {APOIO_PERKS,myApoioPerk} from './apoio'
import {Escudo} from './escudos'
import logo from './img/logo-ll.webp'
import './career-start-guide.css'
import './career-setup-guide.css'

// 🏀 10/11: o basquete usa a MESMA moldura (marca, etapas e topo próprios); sem essas props, o futebol fica igual.
export function CareerSetupFrame({step,club,onBack,children,etapas,topo,marca}:{step:number;club:string;onBack:()=>void;children:ReactNode;etapas?:string[];topo?:string;marca?:{nome:string;frase:string;sigla?:string}}){
 const t=useT(),perk=myApoioPerk()??APOIO_PERKS.bege,frame=useRef<HTMLElement>(null)
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});const heading=frame.current?.querySelector('h1');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true})},[step])
 const labels=etapas??[t('Seu clube','Your club'),t('Presidente','President'),t('Rivais','Rivals'),t('Aprender','Learn')]
 return <main className="cse-frame" ref={frame}>
  <header className="csg-brand"><div>{marca?.sigla?<span className="ov3-sigla" aria-hidden="true">{marca.sigla}</span>:<img src={logo} alt=""/>}<span><b>{marca?.nome??'LEILÃO LEGENDS'}</b><small>{marca?.frase??t('O SEU TIME COMEÇA NO LANCE.','YOUR TEAM STARTS WITH A BID.')}</small></span></div><span style={{background:perk.grad,color:['verde','roxo'].includes(perk.tier)?'#fff':'#0c0c0c'}}>{club||t('Nova carreira','New career')}</span></header>
  <div className="csg-topline"><button type="button" onClick={onBack}>← {step===1?t('Menu inicial','Main menu'):t('Voltar','Back')}</button><span>{topo??t('NOVA CARREIRA · VÁRZEA','NEW CAREER · VÁRZEA')}</span></div>
  <ol className="csg-steps" aria-label={t('Etapas da nova carreira','New career steps')}>{labels.map((label,i)=><li key={label} className={i+1===step?'on':i+1<step?'done':''} aria-current={i+1===step?'step':undefined}><span>{i+1<step?'✓':i+1}</span><b>{label}</b></li>)}</ol>
  {children}
 </main>
}

export function CareerRivalsSetup({rivals,picks,options,onCount,onToggle,onDefaults,onStart,error,notice}:{rivals:number;picks:string[];options:{team:string}[];onCount:(n:number)=>void;onToggle:(team:string)=>void;onDefaults:()=>void;onStart:()=>void;error?:string;notice?:string}){
 const t=useT(),searchId=useId(),[choosing,setChoosing]=useState(false),[query,setQuery]=useState(''),[limit,setLimit]=useState(12),picker=useRef<HTMLElement>(null)
 useEffect(()=>{if(choosing){picker.current?.scrollIntoView({block:'start',behavior:'instant'});const heading=picker.current?.querySelector('h2');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true})}},[choosing])
 const closePicker=()=>{setChoosing(false);window.scrollTo({top:0,behavior:'instant'})}
 const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim()
 const filtered=options.filter(o=>normalize(o.team).includes(normalize(query)))
 return <section className="cse-rivals" aria-labelledby="cse-rivals-title">
  <header className="cse-intro"><small>{t('QUEM DISPUTA OS JOGADORES COM VOCÊ','WHO BIDS AGAINST YOU')}</small><h1 id="cse-rivals-title">{t('Escolha seus rivais.','Pick your rivals.')}</h1><p>{t('Eles são controlados pelo jogo. Você escolhe quantos entram no mesmo leilão que você.','They are controlled by the game. Choose how many join your auction.')}</p></header>
  <div className="cse-rivals-grid"><div className="cse-paper">
   <h2>{t('Quantos rivais no leilão?','How many auction rivals?')}</h2><div className="cse-count" role="group" aria-label={t('Quantidade de rivais','Number of rivals')}>{[3,5,7,9].map(n=><button type="button" key={n} aria-pressed={rivals===n} onClick={()=>onCount(n)}><strong>{n}</strong><small>{n===3?t('Menos disputa','Less competition'):n===5?t('Padrão','Default'):n===7?t('Mais disputa','More competition'):t('Disputa máxima','Most competition')}</small></button>)}</div>
   <p className="cse-note">{t('Mais rivais significam mais disputa pelos jogadores. A liga continua com 20 clubes, incluindo você.','More rivals mean more competition for players. The league still has 20 clubs, including you.')}</p>
   <div className="cse-selection"><small>{t('CLUBES DO SEU LEILÃO','YOUR AUCTION CLUBS')}</small><h2>{picks.length?t(`${picks.length} de ${rivals} escolhidos`,`${picks.length} of ${rivals} selected`):t('Pode deixar com o jogo.','Let the game pick.')}</h2><p>{picks.length?t(`Faltam ${rivals-picks.length}. O jogo completa com rivais padrão.`,`The game fills the remaining ${rivals-picks.length} with default rivals.`):t('Os rivais padrão já estão prontos. Escolher os nomes é opcional.','The default rivals are ready. Choosing their names is optional.')}</p>
   {picks.length>0&&<div className="cse-picked">{picks.map(team=><button type="button" key={team} onClick={()=>onToggle(team)} aria-label={t(`Remover ${team}`,`Remove ${team}`)}>{team} <span aria-hidden="true">×</span></button>)}</div>}
   <button type="button" className="cse-secondary" aria-expanded={choosing} onClick={()=>setChoosing(v=>!v)}>{choosing?t('Fechar escolha de clubes','Close club selection'):t('Escolher clubes','Choose clubs')} {choosing?'−':'+'}</button>
   {picks.length>0&&<button type="button" className="csg-text-button" onClick={()=>{onDefaults();setQuery('');setChoosing(false)}}>{t('Usar todos os rivais padrão','Use all default rivals')}</button>}</div>
   {notice&&!choosing&&<p className="cse-status" role="status">{notice}</p>}{error&&<p className="cse-error" role="alert">{error}</p>}
   <button type="button" className="csg-primary" onClick={onStart}>{t('Continuar para o tutorial →','Continue to the tutorial →')}</button><p className="cse-footnote">{t('O leilão só começa depois das explicações e do treino.','The auction starts after the explanations and practice.')}</p>
  </div><aside className="cse-explainer"><span aria-hidden="true">20</span><h2>{t('Uma liga inteira.','A full league.')}</h2><p>{t('A quantidade escolhida aqui muda quem disputa os jogadores no pregão. Ela não diminui o campeonato.','This choice changes how many rivals bid for players. It does not make the championship smaller.')}</p><div><b>{t('No leilão: 100 moedas por técnico.','At auction: 100 coins per manager.')}</b><p>{t('Você aprende a distribuir esse orçamento na próxima etapa.','Learn how to spend that budget in the next step.')}</p></div></aside></div>
  {choosing&&<section ref={picker} className="cse-picker cse-paper" aria-label={t('Escolher clubes rivais','Choose rival clubs')}><div className="cse-picker-head"><div><small>{t('ESCOLHA OPCIONAL','OPTIONAL CHOICE')}</small><h2>{t('Quem você quer enfrentar?','Who do you want to face?')}</h2></div><b>{picks.length}/{rivals}</b></div><p>{t('Estes são os clubes criados por jogadores com Batismo ou Fundador. Os escolhidos começam na Várzea com você.','These clubs were created by Naming or Founder players. Your picks start in Várzea with you.')}</p><label htmlFor={searchId}>{t('Buscar clube','Find club')}</label><input id={searchId} type="search" value={query} onChange={e=>{setQuery(e.target.value);setLimit(12)}} placeholder={t('Digite o nome do clube…','Type a club name…')}/>{notice&&<p className="cse-status" role="status">{notice}</p>}<div className="cse-clubs">{filtered.slice(0,limit).map(({team})=><button type="button" key={team} aria-pressed={picks.includes(team)} onClick={()=>onToggle(team)}><Escudo nome={team} size={30}/><span>{team}</span><b aria-hidden="true">{picks.includes(team)?'✓':'+'}</b></button>)}</div>{filtered.length>limit&&<button type="button" className="cse-secondary cse-more" onClick={()=>setLimit(n=>n+12)}>{t(`Mostrar mais clubes · ${Math.min(limit,filtered.length)} de ${filtered.length}`,`Show more clubs · ${Math.min(limit,filtered.length)} of ${filtered.length}`)}</button>}{!filtered.length&&<p role="status">{t('Nenhum clube encontrado. Tente outro nome.','No clubs found. Try another name.')}</p>}<button type="button" className="cse-secondary" onClick={closePicker}>{t('Pronto, voltar ao resumo ↑','Done, back to summary ↑')}</button></section>}
 </section>
}
