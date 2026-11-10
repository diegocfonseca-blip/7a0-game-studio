import {createContext,useCallback,useContext,useEffect,useId,useMemo,useRef,useState,type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {useOnlineRoomPresentation as useOwnerPresentation} from './presentation-release'
import {tr} from './lang'
import {APOIO_PERKS,myApoioPerk} from './apoio'
import type {Tactic,EscState} from './types'
import logo from './img/logo-ll.webp'
import stadium from './img/online-estadio-v25.webp'
import {legendAvatar} from './legend-avatars'
import './owner-online-visual.css'
import './owner-waiting.css'
import './owner-contrast.css'

/** Local presentation only. Never serialized into EscState or a room payload. */
export function ownerOnlineScope(state:{sport?:string;careerOnline?:boolean;careerIntent?:boolean;co2?:unknown;screen?:string}){
 return state.sport!=='basquete'&&!state.careerOnline&&!state.careerIntent&&!state.co2&&!!state.screen&&['setup','lobby','streamIntro','auction','monte','cerimonia','convocacao','season','liberta','champions','draft','end'].includes(state.screen)
}
export function useOwnerOnlineVisual(state:Parameters<typeof ownerOnlineScope>[0]){const owner=useOwnerPresentation();return owner&&ownerOnlineScope(state)}

type Slot='view'|'tactic'|'controls'|'ad'|'tabs'|'room'|'wait-heading'|'wait-people'|'wait-invite'|'wait-rules'|'wait-themes'|'wait-banter'|'wait-start'
type Targets=Partial<Record<Slot,HTMLDivElement|null>>
type OwnerState=Pick<EscState,'managers'|'youIdx'|'quickCopa'|'onlineMode'>
type Layout={accountName?:string;state?:OwnerState;enabled:boolean;primary:string|null;claim:(id:string)=>void;release:(id:string)=>void;target:(slot:Slot,node:HTMLDivElement|null)=>void;targets:Targets}
const noop=()=>{}
const Context=createContext<Layout>({enabled:false,primary:null,claim:noop,release:noop,target:noop,targets:{}})
export function OwnerOnlineProvider({enabled,state,accountName,children}:{enabled:boolean;state:OwnerState;accountName?:string;children:ReactNode}){
 const [primary,setPrimary]=useState<string|null>(null),[targets,setTargets]=useState<Targets>({})
 const claim=useCallback((id:string)=>setPrimary(old=>old??id),[])
 const release=useCallback((id:string)=>setPrimary(old=>old===id?null:old),[])
 const target=useCallback((slot:Slot,node:HTMLDivElement|null)=>setTargets(old=>old[slot]===node?old:{...old,[slot]:node}),[])
 const value=useMemo(()=>({accountName,state,enabled,primary,claim,release,target,targets}),[accountName,state,enabled,primary,claim,release,target,targets])
 return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useOwnerLayout(){return useContext(Context).enabled}
export function useOwnerState(){return useContext(Context).state}
export function OwnerSlot({name,children}:{name:Slot;children:ReactNode}){
 const ctx=useContext(Context),target=ctx.targets[name]
 return ctx.enabled&&target?createPortal(children,target):<>{children}</>
}

/** Moves the existing waiting-room controls, retaining their handlers and permissions. */
function WaitingTarget({name}:{name:Slot}) {
 const ctx=useContext(Context)
 const ref=useCallback((node:HTMLDivElement|null)=>ctx.target(name,node),[ctx.target,name])
 return <div className={`ow-target ow-${name}`} ref={ref}/>
}
export function OwnerWaitingLayout({children,canTheme,chatEnabled,hasRules}:{children:ReactNode;canTheme:boolean;chatEnabled:boolean;hasRules:boolean}) {
 const theme=useRef<HTMLDetailsElement>(null)
 const showTheme=()=>{if(!theme.current)return;theme.current.open=true;theme.current.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});theme.current.querySelector('summary')?.focus()}
 return <div className="ow-layout">
  <header className="ow-heading"><WaitingTarget name="wait-heading"/><WaitingTarget name="wait-invite"/></header>
  <div className="ow-grid">
   <main className="ow-main">
    <WaitingTarget name="wait-people"/>
    <WaitingTarget name="wait-start"/>
    {(chatEnabled||canTheme)&&<section className="ow-climate"><h2>{tr('O CLIMA DA SALA','THE ROOM ATMOSPHERE')}</h2>
     {chatEnabled&&<details className="ow-banter"><summary>{tr('Provocações e áudios','Banter and audio')}<span aria-hidden="true">＋</span></summary><WaitingTarget name="wait-banter"/></details>}
     {canTheme&&<button type="button" className="ow-theme-shortcut" onClick={showTheme}>{tr('Trocar tema','Change theme')} →</button>}
    </section>}
   </main>
   <aside className="ow-aside">
    {hasRules&&<section className="ow-rules"><h2>{tr('REGRAS COMBINADAS','ROOM RULES')}</h2><WaitingTarget name="wait-rules"/></section>}
    {canTheme&&<details ref={theme} className="ow-themes"><summary>{tr('PERSONALIZE A SALA','PERSONALIZE THE ROOM')}<span aria-hidden="true">＋</span></summary><WaitingTarget name="wait-themes"/></details>}
   </aside>
  </div>
  <div className="ow-extra">{children}</div>
 </div>
}
export function OwnerRoomTarget(){
 const ctx=useContext(Context),ref=useCallback((node:HTMLDivElement|null)=>ctx.target('room',node),[ctx.target])
 return ctx.enabled?<div className="ov3-room-nav-target" ref={ref}/>:null
}
export function OwnerRoomNavigation({children}:{children:ReactNode}){
 const ctx=useContext(Context),[desktop,setDesktop]=useState(()=>typeof window!=='undefined'&&window.innerWidth>=1100)
 useEffect(()=>{const media=matchMedia('(min-width:1100px)'),update=()=>setDesktop(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[])
 return ctx.enabled&&desktop&&ctx.targets.room?createPortal(children,ctx.targets.room):<>{children}</>
}
/** One primary match receives the existing controls; no second simulation is created. */
export function OwnerPrimary({children,label,field=false}:{children:ReactNode;label?:string;field?:boolean}){
 const ctx=useContext(Context),id=useId(),active=ctx.enabled&&ctx.primary===id
 useEffect(()=>{if(ctx.enabled&&!ctx.primary)ctx.claim(id)},[ctx.enabled,ctx.primary,ctx.claim,id])
 useEffect(()=>()=>ctx.release(id),[ctx.release,id])
 const view=useCallback((n:HTMLDivElement|null)=>ctx.target('view',n),[ctx.target])
 const tactic=useCallback((n:HTMLDivElement|null)=>ctx.target('tactic',n),[ctx.target])
 const controls=useCallback((n:HTMLDivElement|null)=>ctx.target('controls',n),[ctx.target])
 const ad=useCallback((n:HTMLDivElement|null)=>ctx.target('ad',n),[ctx.target])
 const tabs=useCallback((n:HTMLDivElement|null)=>ctx.target('tabs',n),[ctx.target])
 if(!ctx.enabled)return <>{children}</>
 return <section className={`ov3-primary ll31-cinema ${active?'ov3-primary-active':''} ${field?'ov3-primary-field':''}`} data-primary={active||undefined}>
  {active&&<div key="tabs" className="ov3-tabs-slot" ref={tabs}/>}
  {active&&<div key="view" className="ov3-viewline"><span>{label??tr('PARTIDA EM DESTAQUE','FEATURED MATCH')}</span><div ref={view}/></div>}
  <div key="native" className="ov3-native">{children}</div>
  {active&&<><div className="ov3-tactic-slot" ref={tactic}/><div className="ov3-controls-slot" ref={controls}/><div className="ov3-ad-slot" ref={ad}/></>}
 </section>
}

export function OwnerModalBrand(){
 const {state,accountName}=useContext(Context),manager=state?.managers[state.youIdx],perk=myApoioPerk()??APOIO_PERKS.bege
 return <header className="ov3-brand"><div className="ov3-logo"><img src={logo} alt="" width={34} height={34}/><span><b>LEILÃO LEGENDS</b><small>{tr('O SEU TIME COMEÇA NO LANCE.','YOUR TEAM STARTS WITH A BID.')}</small></span></div><span className="ov3-account" style={{marginLeft:'auto',background:perk.grad,color:perk.tier==='roxo'||perk.tier==='verde'?'#fff':'#0c0c0c'}}>{accountName||manager?.name||tr('Minha conta','My account')}</span></header>
}

export function OwnerOnlineHeader({name,club,balance,onHome,onRooms,online}:{name:string;club?:string;balance?:ReactNode;onHome:()=>void;onRooms:()=>void;online:boolean}){
 const perk=myApoioPerk()??APOIO_PERKS.bege
 return <><header className="ov3-brand"><button type="button" className="ov3-logo" onClick={onHome}><img src={logo} alt="" width={34} height={34}/><span><b>LEILÃO LEGENDS</b><small>{tr('O SEU TIME COMEÇA NO LANCE.','YOUR TEAM STARTS WITH A BID.')}</small></span></button><nav><button onClick={onHome}>{tr('Menu inicial','Main menu')}</button>{online&&<button onClick={onRooms}>{tr('Salas abertas','Open rooms')}</button>}</nav><span className="ov3-account" style={{background:perk.grad,color:perk.tier==='roxo'||perk.tier==='verde'?'#fff':'#0c0c0c'}}>{name||club||tr('Minha conta','My account')}</span>{balance!=null&&<div className="ov3-coins">{balance}</div>}</header><div className="ov3-roomline"><button onClick={onHome}>‹ {tr('Menu','Menu')}</button><span>{online?tr('Sala online','Online room'):tr('Partida Rápida','Quick Match')}{club?` · ${club}`:''}</span></div></>
}

export function OwnerTactics({value,onChange,disabled=false,note}:{value:Tactic;onChange:(t:Tactic)=>void;disabled?:boolean;note?:string}){
 return <OwnerSlot name="tactic"><section className="ov3-tactics" aria-label={tr('Tática do seu time','Your team tactics')}><span>{tr('TÁTICA DO SEU TIME','YOUR TEAM TACTICS')}</span><div role="group" aria-label={tr('Escolher tática','Choose tactics')}>{(['retranca','equilibrio','ataque'] as const).map(t=><button type="button" key={t} disabled={disabled} aria-pressed={value===t} onClick={()=>onChange(t)}>{t==='retranca'?tr('Retranca','Defensive'):t==='ataque'?tr('Ofensivo','Attacking'):tr('Equilibrado','Balanced')}</button>)}</div>{note&&<small>{note}</small>}</section></OwnerSlot>
}

export function OwnerPlayback({manual,onToggle,speed,onSpeed,opts,canNext,onNext,onSkip,nextLabel,busy=false,speedDisabled=false,allowAutoSpeed=false}:{manual:boolean;onToggle:()=>void;speed:number;onSpeed:(v:number)=>void;opts?:{v:number;pt:string;en:string}[];canNext:boolean;onNext:()=>void;onSkip?:()=>void;nextLabel?:string;busy?:boolean;speedDisabled?:boolean;allowAutoSpeed?:boolean}){
 const [open,setOpen]=useState(false),trigger=useRef<HTMLButtonElement>(null),sheet=useRef<HTMLDivElement>(null),id=useId()
 const close=useCallback(()=>{setOpen(false);requestAnimationFrame(()=>trigger.current?.focus())},[])
 useEffect(()=>{if(!open)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';const before=document.activeElement as HTMLElement|null;sheet.current?.querySelector<HTMLElement>('button,select')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'){const els=Array.from(sheet.current?.querySelectorAll<HTMLElement>('button,select')??[]).filter(e=>!e.hasAttribute('disabled'));const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',key);before?.focus()}},[open,close])
 const choices=opts??[{v:.25,pt:'4× mais lento',en:'4× slower'},{v:.5,pt:'2× mais lento',en:'2× slower'},{v:1,pt:'Normal · 1×',en:'Normal · 1×'},{v:2,pt:'2×',en:'2×'},{v:3,pt:'3×',en:'3×'},{v:4,pt:'4×',en:'4×'}]
 const value=speed>0?speed:opts?.[0]?.v??1
 const label=nextLabel&&!/^(⏳|Deixa|Let the)/i.test(nextLabel)?nextLabel.replace(/^[▶️⚽🌎⭐🏆\s]+/u,''):tr('Próxima rodada','Next round')
 return <OwnerSlot name="controls"><div className="ov3-playback"><div className="ov3-playback-line"><div className="ov3-advance">{manual?<><button type="button" className="ov3-next" disabled={!canNext||busy} onClick={onNext}>{label} →</button>{onSkip&&!canNext&&<button type="button" className="ov3-skip" disabled={busy} onClick={onSkip}>{tr('Pular','Skip')}</button>}</>:<span className="ov3-auto">{tr('Partida seguindo automaticamente','Match advancing automatically')}</span>}</div><div className="ov3-speed-area"><small>{manual?tr('Manual','Manual'):tr('Auto','Auto')} · {value}×</small><button ref={trigger} type="button" className="ov3-speed" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(true)}>⚙ {tr('Velocidade','Speed')}</button></div></div>{manual&&!canNext&&<small className="ov3-wait">{tr('Próxima rodada libera quando a partida terminar.','Next round becomes available when the match finishes.')}</small>}</div>{open&&createPortal(<div className="ov3-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div ref={sheet} id={id} className="ov3-speed-dialog" role="dialog" aria-modal="true" aria-label={tr('Velocidade da partida','Match speed')}><header><div><small>{tr('SEU JEITO DE ACOMPANHAR','YOUR WAY TO WATCH')}</small><h2>{tr('Velocidade da partida','Match speed')}</h2></div><button type="button" aria-label={tr('Fechar','Close')} onClick={close}>×</button></header><label><span>{tr('Andamento','Progression')}<small>{tr('Avance por rodada ou deixe seguir sozinho.','Advance each round or continue automatically.')}</small></span><select aria-label={tr('Andamento','Progression')} disabled={busy} value={manual?'manual':'auto'} onChange={e=>{if((e.target.value==='manual')!==manual)onToggle()}}><option value="manual">{tr('Manual','Manual')}</option><option value="auto">{tr('Auto','Auto')}</option></select></label><label><span>{tr('Velocidade','Speed')}<small>{tr('Ritmo de exibição dos lances.','Playback speed of the action.')}</small></span><select aria-label={tr('Velocidade','Speed')} disabled={busy||speedDisabled||(!manual&&!allowAutoSpeed)} value={value} onChange={e=>onSpeed(Number(e.target.value))}>{choices.map(o=><option key={o.v} value={o.v}>{tr(o.pt,o.en)}</option>)}</select></label><button type="button" className="ov3-dialog-done" onClick={close}>{tr('Concluir','Done')}</button></div></div>,document.body)}</OwnerSlot>
}

export function OwnerChampionBanner({title,name,crest,trophy,mascot,legends=[],line,extra,own=false}:{title:string;name:string;crest?:ReactNode;trophy:ReactNode;mascot?:ReactNode;legends?:{nome:string;club:string;year:number}[];line?:ReactNode;extra?:ReactNode;own?:boolean}){
 const portraits=legends.filter((l,i,a)=>a.findIndex(x=>x.nome===l.nome&&x.club===l.club&&x.year===l.year)===i).map(l=>({l,art:legendAvatar(l.nome,l.club,l.year)})).filter(x=>x.art).slice(0,3)
 return <section className="ov3-champion" aria-label={tr('Campeão da competição','Competition champion')} style={{backgroundImage:`linear-gradient(180deg,#09160ad0,#081009e8),url(${stadium})`,backgroundSize:'cover',backgroundPosition:'center'}}><div className="ov3-champion-confetti" aria-hidden="true">{Array.from({length:38},(_,i)=><i key={i} style={{left:(i*37)%100+'%',top:(i*23)%86+'%',transform:`rotate(${i*49}deg)`,background:['#ffc400','#f4ecd6','#1b7a3d'][i%3]}}/>)}</div><small>{title}</small><h2>{own?tr('É CAMPEÃO!','CHAMPIONS!'):tr('CAMPEÃO DEFINIDO','CHAMPION CROWNED')}</h2><div className="ov3-champion-club">{crest}<h3>{name}</h3></div><div className="ov3-champion-scene"><div className="ov3-champion-legends">{portraits.map(({l,art})=><figure key={`${l.nome}-${l.club}-${l.year}`}><img src={art!.src.startsWith('/')?import.meta.env.BASE_URL+art!.src.slice(1):art!.src} alt={l.nome}/><figcaption>{l.nome}</figcaption></figure>)}</div><div className="ov3-champion-trophy"><div>{trophy}</div><span>{own?tr('A TAÇA É SUA','THE TROPHY IS YOURS'):tr('A TAÇA TEM DONO','THE TROPHY HAS A WINNER')}</span></div><div className="ov3-champion-mascot">{mascot}</div></div>{line&&<p>{line}</p>}{extra&&<div className="ov3-champion-extra">{extra}</div>}</section>
}

export function OwnerMatchNavigation({value,onChange}:{value:'jogos'|'tabela'|'estatisticas'|'elenco';onChange:(value:'jogos'|'tabela'|'estatisticas'|'elenco')=>void}){
 const {state}=useContext(Context),[bracket,setBracket]=useState(false),close=useRef<HTMLButtonElement>(null),dialog=useRef<HTMLDivElement>(null)
 const qc=state?.quickCopa
 useEffect(()=>{if(!bracket)return;const before=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow='hidden';close.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setBracket(false);if(e.key==='Tab'){const buttons=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]),first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);before?.focus()}},[bracket])
 const scroll=(selector:string)=>{onChange('jogos');requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelector(selector)?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})))}
 const rounds=qc?[...qc.bracket.filter(r=>r.phase!==qc.phase),{phase:qc.phase,ties:qc.ties}]:[]
 const roundName=(phase:string)=>phase==='repescao'?tr('Repescagem','Play-offs'):phase==='r32'?tr('Rodada de 32','Round of 32'):phase==='oitavas'?tr('Oitavas de final','Round of 16'):phase==='quartas'?tr('Quartas de final','Quarter-finals'):phase==='semis'?tr('Semifinais','Semi-finals'):phase==='final'?tr('Final','Final'):tr('Fase encerrada','Completed stage')
 return <OwnerSlot name="tabs"><nav className="ll25-tabs" aria-label={tr('Conteúdo da competição','Competition content')}><button className="ll25-button" aria-pressed={value==='jogos'} onClick={()=>onChange('jogos')}>{tr('Partida','Match')}</button><button className="ov3-section-shortcut" onClick={()=>qc?setBracket(true):scroll('.ov3 .ll31-table, .ov3 table')}>{qc?tr('Chave','Bracket'):tr('Tabela','Table')}</button><button className="ll25-button" aria-pressed={value==='estatisticas'} onClick={()=>onChange('estatisticas')}>{tr('Estatísticas','Statistics')}</button><button className="ll25-button" aria-pressed={value==='elenco'} onClick={()=>onChange('elenco')}>{tr('Elenco','Squad')}</button>{state?.onlineMode==='online'&&state.managers.filter(m=>m.isHuman).length>1&&<button className="ov3-section-shortcut" onClick={()=>scroll('.ov3-rivalries')}>{tr('Rivalidades','Rivalries')}</button>}</nav>{bracket&&qc&&createPortal(<div className="ov3-bracket-dialog" role="dialog" aria-modal="true" aria-label={tr('Chave completa','Full bracket')}><div ref={dialog} className="ov3-bracket-content"><header><h2>{tr('Chave completa','Full bracket')}</h2><button ref={close} type="button" onClick={()=>setBracket(false)}>{tr('Voltar à partida','Back to the match')}</button></header><div className="ov3-bracket-rounds">{rounds.filter(r=>r.ties.length).map((r,i)=><section key={`${r.phase}-${i}`}><h3>{roundName(r.phase)}</h3>{r.ties.map((tie,j)=><div key={`${tie.aId}-${tie.bId}-${j}`} className="ov3-bracket-pair"><span>{tie.aName}</span><span>{tie.bName}</span></div>)}</section>)}</div><p>{tr('Os próximos confrontos são definidos após a classificação em cada fase.','The next ties are decided after qualification in each stage.')}</p></div></div>,document.body)}</OwnerSlot>
}
