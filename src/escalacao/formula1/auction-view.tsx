import {useEffect,useRef,useState} from 'react'
import {Box,Btn,HoldButton,Shell} from '../screens'
import {AuctionIdentity,AuctionPositions} from '../shared-game-ui'
import {AuctionDesktopLayout,AuctionSlot} from '../desktop-layout'
import {OwnerOnlineHeader} from '../owner-online-visual'
import {useT} from '../lang'
import {openMinimum,OPEN_TICK_MS} from '../auction-core'
import {CATEGORIES} from './catalog'
import {submitEnvelope,submitRebid,nextReveal,openBid,takeDutch,tickAuction,maxBid,isCar,lotData,needsLot,type Auction} from './auction'
import {AUCTION_MODES} from './setup'
export function Formula1Identity({id,big=false}:{id:string;big?:boolean}){const c=lotData(id);return <AuctionIdentity badge={isCar(id)?'CAR':'PIL'} name={'name'in c?c.name:`${c.team} ${c.model}`} subtitle={`${'country'in c?c.country:c.team} · ${c.year}`} big={big}/>}
export function Formula1Auction({auction:a,onChange,onHome}:{auction:Auction;onChange:(update:(a:Auction)=>Auction)=>void;onHome:()=>void}){
 const t=useT(),[bids,setBids]=useState<Record<string,number>>({}),[rebid,setRebid]=useState(0),[left,setLeft]=useState(a.seconds),[desktop,setDesktop]=useState(()=>innerWidth>=1100)
 const pending=useRef(bids);pending.current=bids
 const change=useRef(onChange);change.current=onChange
 useEffect(()=>{const q=matchMedia('(min-width:1100px)'),update=()=>setDesktop(q.matches);q.addEventListener('change',update);return()=>q.removeEventListener('change',update)},[])
 useEffect(()=>{setBids({});setLeft(a.phase==='tiebreak'?30:a.seconds);setRebid(a.ties[0]?.amount??0)},[a.attempt,a.round,a.phase,a.ties[0]?.lotId,a.seconds])
 useEffect(()=>{
  if(a.phase!=='bidding'&&a.phase!=='tiebreak')return
  const live=a.phase==='bidding'&&['open','dutch'].includes(a.mode)
  let elapsed=0
  const id=setInterval(()=>{if(document.hidden)return
   if(live){change.current(s=>tickAuction(s,a.mode==='dutch'?50:OPEN_TICK_MS));return}
   elapsed+=OPEN_TICK_MS;const seconds=Math.max(0,(a.phase==='tiebreak'?30:a.seconds)-Math.floor(elapsed/1000));setLeft(seconds)
   if(seconds===0){clearInterval(id);change.current(s=>s.phase==='tiebreak'?submitRebid(s,s.ties[0].amount):submitEnvelope(s,Object.entries(pending.current).filter(([,v])=>v>0).map(([cardId,amount])=>({cardId,amount}))))}
  },a.mode==='dutch'?50:OPEN_TICK_MS)
  return()=>clearInterval(id)
 },[a.attempt,a.round,a.phase,a.mode,a.ties[0]?.lotId,a.seconds])
 const team=a.teams[0],spent=Object.values(bids).reduce((s,v)=>s+v,0),selected=Object.entries(bids).filter(([,v])=>v>0).map(([id])=>id),single=a.mode==='single'
 const title=t(...(AUCTION_MODES.find(m=>m[0]===a.mode)!.slice(1,3)as[string,string]))
 const bar=<div className="ll-auction-bar-row flex items-center justify-between max-w-xl mx-auto gap-2"><AuctionPositions labels={single?[t('PILOTOS','DRIVERS'),t('CARRO','CAR')]:[t('PIL 1','DRV 1'),t('PIL 2','DRV 2'),t('CARRO','CAR')]} current={single?0:a.round}/><b className="text-sm whitespace-nowrap">🪙 {team.coins}</b></div>
 const available=(id:string)=>!a.sales.some(s=>s.lotId===id)
 const canSelect=(id:string)=>{
  if(!available(id)||(!single&&!needsLot(team,a.round)))return false
  const count=selected.filter(s=>isCar(s)===isCar(id)).length,slots=isCar(id)?team.car?0:1:single?2-team.drivers.length:1
  return (bids[id]??0)>0||count<slots
 }
 const amount=(id:string,v:number)=>{const max=Math.max(0,maxBid(a)-spent+(bids[id]??0));setBids(b=>({...b,[id]:Math.min(max,Math.max(0,Math.floor(Number(v)||0)))}))}
 const seal=()=>onChange(s=>submitEnvelope(s,Object.entries(bids).filter(([,v])=>v>0).map(([cardId,amount])=>({cardId,amount}))))
 const reveal=a.queue[a.revealIdx],tie=a.ties[0],liveId=a.offers[a.mesa.idx],minimum=openMinimum(a.mesa.lider,a.mesa.preco)
 return <Shell hideExit presentationHeader={<OwnerOnlineHeader name={team.name} brand={{name:'PISTA LEGENDS',monogram:'PL',tagline:t('SUA ESCUDERIA COMEÇA NO LANCE.','YOUR TEAM STARTS WITH A BID.')}} online={false} onHome={onHome}/>} className={`f1-shell${desktop?' ll-auction-shell':''}`} bar={desktop?undefined:bar}>
  <AuctionDesktopLayout enabled={desktop} bar={bar} title={title} description={single?t('Pilotos e carros no mesmo envelope.','Drivers and cars in one envelope.'):t('Dois pilotos e um carro histórico. A força se revela depois da compra.','Two drivers and one historic car. Strength is revealed after purchase.')} budget={{balance:team.coins,committed:spent}} slots={[{position:t('PILOTOS','DRIVERS'),open:2-team.drivers.length},{position:t('CARRO','CAR'),open:team.car?0:1}]} playersTitle={a.phase==='reveal'?t('Revelação','Reveal'):t('Cartas disponíveis','Available cards')} teamTitle={t('Sua escuderia','Your team')} teamSummary={t('Ver garagem','View garage')}>
   <AuctionSlot name="intro"><div className="ll-auction-intro"><h1 className="font-black text-2xl" style={{fontFamily:'Oswald,sans-serif'}}>{single?t('ENVELOPE ÚNICO','SINGLE ENVELOPE'):a.round===2?t('CARRO HISTÓRICO','HISTORIC CAR'):`${t('PILOTO','DRIVER')} ${a.round+1}`}</h1><p className="text-sm">{t('Categoria e notas escondidas até o martelo.','Tier and ratings hidden until the hammer.')}</p></div></AuctionSlot>
   <AuctionSlot name="timer"><p className="font-black text-xl text-center" role="timer">{a.phase==='reveal'?`${a.revealIdx+1}/${a.queue.length}`:a.mode==='open'?`${Math.max(0,Math.ceil((a.mesa.deadline-a.clock)/1000))}s`:a.mode==='dutch'?`🪙 ${a.mesa.preco||100}`:`⏱ ${left}s`}</p></AuctionSlot>
   {a.phase==='bidding'&&(a.mode==='sealed'||single)&&<div className="ll-auction-list space-y-2">{a.offers.filter(available).map(id=><Box key={id} bg={(bids[id]??0)>0?'#FFF4C6':'#fff'} className="p-3"><div className="flex items-center justify-between gap-2"><div className="min-w-0 flex-1"><Formula1Identity id={id}/></div><div className="flex items-center gap-1 shrink-0"><HoldButton disabled={!(bids[id]>0)} onStep={()=>amount(id,(bids[id]??0)-1)} className="w-8 h-10 border-2 border-black rounded-lg bg-white font-black">−</HoldButton><input aria-label={`${t('Lance','Bid')} ${id}`} type="number" inputMode="numeric" min={0} step={1} max={maxBid(a)} disabled={!canSelect(id)} value={bids[id]||''} placeholder="0" onChange={e=>amount(id,Number(e.target.value))} className="w-12 h-10 border-2 border-black rounded-lg text-center bg-white text-black font-black"/><HoldButton disabled={!canSelect(id)||spent>=maxBid(a)} onStep={()=>amount(id,(bids[id]??0)+1)} className="w-8 h-10 border-2 border-black rounded-lg bg-[#FFC400] font-black">+</HoldButton></div></div></Box>)}</div>}
   {a.phase==='bidding'&&a.mode==='open'&&liveId&&<Box bg="#fff" className="p-5 space-y-5"><Formula1Identity id={liveId} big/><p className="text-xs">{t('Uma carta por vez. As notas ainda são segredo.','One card at a time. Ratings remain secret.')}</p><p className="text-center text-3xl font-black">🪙 {a.mesa.preco}</p><p className="font-bold text-center">{a.mesa.lider===null?t('Quem abre o pregão?','Who opens the bidding?'):a.teams[a.mesa.lider].name}</p><Btn className="w-full" disabled={a.mesa.lider===0||minimum>maxBid(a)||!needsLot(team,a.round)} onClick={()=>onChange(s=>openBid(s,minimum))}>{a.mesa.lider===0?t('SEU LANCE ESTÁ NA FRENTE','YOUR BID LEADS'):`${t('COBRIR POR','BID')} ${minimum} 🪙`}</Btn></Box>}
   {a.phase==='bidding'&&a.mode==='dutch'&&<><Box bg="#FFC400" className="p-4 text-center"><p className="font-black text-sm">{t('UM PREÇO PARA TODOS','ONE PRICE FOR ALL')}</p><b className="text-4xl">🪙 {a.mesa.preco||100}</b><p className="text-xs">{t('Quem pega primeiro leva. O preço continua caindo.','First to take wins. The price keeps dropping.')}</p></Box><div className="ll-auction-list space-y-2">{a.offers.filter(available).map(id=><Box bg="#fff" key={id} className="p-3 space-y-3"><Formula1Identity id={id}/><Btn className="w-full" disabled={a.mesa.preco<1||a.mesa.preco>maxBid(a)||!needsLot(team,a.round)} onClick={()=>onChange(s=>takeDutch(s,id))}>{t('PEGAR POR','TAKE FOR')} {a.mesa.preco||100} 🪙</Btn></Box>)}</div></>}
   {a.phase==='tiebreak'&&tie&&<Box bg="#F4ECD6" className="p-5 space-y-4"><h2 className="font-black text-2xl">{t('⚖️ EMPATOU!','⚖️ A TIE!')}</h2><Formula1Identity id={tie.lotId} big/><p>{t('Novo lance às cegas. Se empatar outra vez, vai para sorteio.','Submit another secret bid. Another tie goes to a draw.')}</p><p className="text-sm">{tie.managers.map(id=>a.teams[id].name).join(' × ')}</p><label className="block font-bold">{t('Seu novo lance','Your rebid')}<input type="number" min={tie.amount} max={maxBid(a)} value={rebid} onChange={e=>setRebid(Number(e.target.value))} className="block w-full p-3 mt-2 border-2 border-black rounded-xl bg-white"/></label><Btn className="w-full" onClick={()=>onChange(s=>submitRebid(s,rebid))}>{t('LACRAR DESEMPATE','SEAL REBID')}</Btn></Box>}
   {a.phase==='reveal'&&reveal&&<Box bg="#F4ECD6" className="p-5 space-y-4"><h2 className="font-black text-xl">{reveal.winner===0?t('🔨 É DA SUA ESCUDERIA!','🔨 YOUR TEAM WINS!'):reveal.winner===null?t('NINGUÉM LEVOU','NO SALE'):t('🔨 MARTELO BATIDO','🔨 SOLD')}</h2><Formula1Identity id={reveal.card.id} big/>{reveal.winner!==null&&<><p className="font-black text-2xl" style={{color:CATEGORIES[lotData(reveal.card.id).category].color}}>{CATEGORIES[lotData(reveal.card.id).category].label} · OVR {lotData(reveal.card.id).overall}</p><p className="font-bold">{a.teams[reveal.winner].name} · {reveal.paid} 🪙</p></>}<div className="space-y-1 text-sm">{reveal.bids.map((b,i)=><p key={i} className="flex justify-between gap-2"><span>{a.teams[b.mgr].name}</span><b>{b.amount} 🪙{reveal.voided.includes(b.mgr)?t(' · anulado',' · void'):''}</b></p>)}{!reveal.bids.length&&<p>{t('Sem lances. A carta continua no baralho.','No bids. The card remains in the deck.')}</p>}</div><Btn className="w-full" onClick={()=>onChange(s=>nextReveal(s))}>{a.revealIdx+1<a.queue.length?t('PRÓXIMA CARTA →','NEXT CARD →'):t('CONTINUAR →','CONTINUE →')}</Btn></Box>}
   {a.error&&<p role="alert" className="p-3 bg-red-100 text-red-800 border-2 border-black rounded-lg">{a.error}</p>}
   <AuctionSlot name="summary">{a.phase==='bidding'&&(a.mode==='sealed'||single)&&<Box bg="#F4ECD6" className="p-4 space-y-3"><p className="text-sm">{selected.length} {t('carta(s) no envelope','card(s) in your envelope')} · {spent} 🪙</p><p className="text-xs">{single?t('Até dois pilotos e um carro.','Up to two drivers and one car.'):t('Uma compra nesta etapa. Reserve para as seguintes.','One purchase this stage. Save for the next ones.')}</p><Btn className="w-full" onClick={seal}>{selected.length?t('✉️ LACRAR ENVELOPE','✉️ SEAL ENVELOPE'):t('PASSAR ESTA LEVA →','SKIP THIS BATCH →')}</Btn></Box>}</AuctionSlot>
   <AuctionSlot name="team"><div className="space-y-2">{team.drivers.map(id=><Formula1Identity key={id} id={id}/>)}{team.car&&<Formula1Identity id={team.car}/>}<p className="text-xs">{team.car?t('O mesmo modelo equipa os dois pilotos.','Both drivers use the same model.'):t('A garagem começa no leilão.','Your garage starts at the auction.')}</p></div></AuctionSlot>
   <AuctionSlot name="room"><div className="space-y-2">{a.teams.map(team=><p key={team.id} className="flex justify-between gap-2 text-xs"><b>{team.name}</b><span>🪙 {team.coins}</span></p>)}</div></AuctionSlot>
   <button type="button" onClick={onHome} className="block mx-auto text-sm underline py-4">{t('🏠 Voltar ao início','🏠 Back to start')}</button>
  </AuctionDesktopLayout>
 </Shell>
}
