import {useEffect,useState} from 'react'
import {Box,Btn} from '../screens'
import {useOwnerPresentation} from '../online-preview'
import {closeFormula1} from '../formula1-entry'
import {setSport,getSport,SPORT_BRAND,type Sport} from '../sport'
import {CARS,DRIVERS,CATEGORIES,carById,driverById,type HistoricCar,type Driver} from './catalog'
import {createAuction,submitBid,continueAuction,maxBid,type Auction} from './auction'
import {createRace,advanceRace,command,grid,teamResults,LAPS,PIT_SECONDS,POINTS,TYRES,type Plan,type Race,type Tyre,type Pace,type Command} from './race'
import {FormulaTrack} from './track'
import './game.css'

type Session={auction:Auction|null;race:Race|null;plans:Record<string,Plan>;mixed:boolean}
let retained:Session|null=null // Só memória desta página, sem tocar em fichas, nuvem, moedas ou salas.
const blank=():Session=>({auction:null,race:null,plans:{},mixed:false})
const freshSeed=()=>{const n=new Uint32Array(1);crypto.getRandomValues(n);return n[0]}
const tyreKeys:Tyre[]=['soft','medium','hard','inter']
const paces:[Pace,string,string][]=[['save','Poupar','Menos desgaste, mas perde tempo por volta.'],['balanced','Equilibrado','Equilibra tempo de volta e desgaste.'],['attack','Atacar','Mais rápido; desgasta os pneus e aumenta o risco de erro.']]
const cash=(n:number)=>`${n} 🪙`
function Badge({tyre}:{tyre:Tyre}){return <span className="f1-tyre" style={{borderColor:TYRES[tyre].color}} title={TYRES[tyre].name}>{TYRES[tyre].letter}</span>}
function Machine({car}:{car:HistoricCar}){return <div className="f1-machine" style={{'--f1-car':car.colors[0],'--f1-stripe':car.colors[1]}as React.CSSProperties} aria-label={`Miniatura esquemática do ${car.team} ${car.model}`}><i className="f1-wing-front"/><i className="f1-wing-back"/><i className="f1-wheel fl"/><i className="f1-wheel fr"/><i className="f1-wheel bl"/><i className="f1-wheel br"/><i className="f1-body"/><i className="f1-cockpit"/></div>}
function DriverCard({driver}:{driver:Driver}){return <><div className="f1-helmet" style={{'--helmet':driver.color}as React.CSSProperties} aria-hidden="true"/><small>{driver.country} · {driver.year}</small><h3>{driver.name}</h3></>}
function Profiles({values}:{values:[string,number][]}){return <dl className="f1-profiles">{values.map(([name,value])=><div key={name}><dt>{name}</dt><dd><meter min={0} max={100} value={value}/><b>{value}</b></dd></div>)}</dl>}
function Tyres({value,onChange,disabled=false}:{value:Tyre;onChange:(t:Tyre)=>void;disabled?:boolean}){return <div className="f1-tyres" role="group" aria-label="Escolher pneus">{tyreKeys.map(t=><button key={t} type="button" disabled={disabled} aria-pressed={value===t} onClick={()=>onChange(t)}><Badge tyre={t}/>{TYRES[t].name==='Intermediário'?'Inter':TYRES[t].name}</button>)}</div>}
function Paces({value,onChange,disabled=false}:{value:Pace;onChange:(p:Pace)=>void;disabled?:boolean}){return <><div className="f1-segments" role="group" aria-label="Ritmo na pista">{paces.map(([p,label])=><button type="button" key={p} disabled={disabled} aria-pressed={value===p} onClick={()=>onChange(p)}>{label}</button>)}</div><p className="f1-explain">{paces.find(([p])=>p===value)?.[2]}</p></>}
function Catalogue(){return <details className="f1-catalogue"><summary>Conheça os pilotos e carros do baralho</summary><p>Uma versão histórica por piloto. Notas e categorias são avaliações do jogo, relativas à época.</p><h3>{DRIVERS.length} pilotos</h3><div>{DRIVERS.map(d=><span key={d.id}>{d.name} · {d.year}<small>{CATEGORIES[d.category].label} · OVR {d.overall}</small></span>)}</div><h3>{CARS.length} carros históricos</h3><div>{CARS.map(c=><span key={c.id}>{c.team} {c.model} · {c.year}<small>{c.category==='bom'?'Bom carro':CATEGORIES[c.category].label} · OVR {c.overall}</small></span>)}</div></details>}
function Formula1Core(){
 const [session,setSession]=useState<Session>(()=>retained??blank()),[name,setName]=useState('Minha escuderia'),[chosenLot,setLot]=useState<string|null>(null),[bid,setBid]=useState('20'),[selected,setSelected]=useState(''),[paused,setPaused]=useState(true),[speed,setSpeed]=useState(1),[exit,setExit]=useState<Sport|null>(null),[reset,setReset]=useState(false)
 const auction=session.auction,race=session.race
 const lot=chosenLot&&auction?.offers.includes(chosenLot)?chosenLot:null
 const phase=!auction?'setup':!auction.complete?'auction':!race?'strategy':race.finished?'results':'race'
 useEffect(()=>{retained=session},[session])
 useEffect(()=>{document.title='Pista Legends · Fórmula 1';return()=>{document.title=SPORT_BRAND[getSport()].name}},[])
 useEffect(()=>{window.scrollTo(0,0)},[phase,auction?.round,!!auction?.report])
 useEffect(()=>{setLot(null);setBid(String(Math.min(20,auction?maxBid(auction):20)))},[auction?.round,auction?.attempt])
 useEffect(()=>{
  if(phase!=='race'||paused)return
  let last=performance.now(),carry=0
  const id=window.setInterval(()=>{const now=performance.now(),dt=Math.min(.5,(now-last)/1000);last=now;if(document.hidden)return;carry+=dt*8*speed;const steps=Math.floor(carry);if(steps){carry-=steps;setSession(s=>s.race?{...s,race:advanceRace(s.race,steps)}:s)}},100)
  const hidden=()=>{if(document.hidden)setPaused(true)};document.addEventListener('visibilitychange',hidden)
  return()=>{clearInterval(id);document.removeEventListener('visibilitychange',hidden)}
 },[phase,paused,speed])
 useEffect(()=>{if(import.meta.env.DEV){const w=window as unknown as Record<string,unknown>;w.__formula1={session,phase,paused,selected};return()=>{delete w.__formula1}}},[session,phase,paused,selected])
 const team=auction?.teams[0]
 const order=race?grid(race):[]
 const own=race?.cars.filter(c=>c.teamId===0)??[]
 const current=own.find(c=>c.id===selected)??own[0]
 const send=(order:Command)=>{if(current)setSession(s=>s.race?{...s,race:command(s.race,current.id,order)}:s)}
 const leave=(sport:Sport)=>{if(phase==='race'&&!paused){setPaused(true);setExit(sport)}else{setSport(sport);closeFormula1()}}
 const newGame=()=>{retained=null;setSession(blank());setPaused(true);setReset(false);setSelected('')}
 const stage=phase==='setup'?0:phase==='auction'?(auction?.round===2?1:0):phase==='strategy'?2:3
 return <main className="f1-game">
  <div className="f1-app">
   <header className="f1-brand"><span className="f1-monogram">PL</span><div><strong>PISTA LEGENDS</strong><small>MONTE SUA ESCUDERIA. CONQUISTE A PISTA.</small></div><span className="f1-private">PRÉVIA<br/>PARTIDA RÁPIDA</span></header>
   <nav className="f1-sports" aria-label="Escolher o jogo"><button type="button" onClick={()=>leave('futebol')}>⚽ Futebol</button><button type="button" onClick={()=>leave('basquete')}>🏀 Basquete</button><button type="button" aria-pressed="true">🏁 Fórmula 1</button></nav>
   <ol className="f1-steps" aria-label="Progresso da partida">{['Pilotos','Carro','Estratégia','Corrida'].map((s,i)=><li key={s} aria-current={stage===i?'step':undefined}><span>{i+1}</span>{s}</li>)}</ol>
   {phase==='setup'&&<>
    <div className="f1-title"><small>AS LENDAS SE ENCONTRAM NA PISTA</small><h1>SEU PRIMEIRO GRID</h1><p>Você contra três escuderias. Leilão às cegas, dois pilotos e um carro histórico para a dupla.</p></div>
    <Box bg="#F4ECD6" className="f1-panel"><label className="f1-label" htmlFor="f1-team">NOME DA SUA ESCUDERIA</label><input id="f1-team" value={name} maxLength={24} onChange={e=>setName(e.target.value)}/><div className="f1-budget"><span>CAIXA IGUAL PARA TODOS</span><b>100 🪙</b></div><p>Três compras: <b>piloto 1 → piloto 2 → carro.</b> O modelo e o ano fazem parte da carta. Sua equipe recebe duas unidades da mesma máquina.</p><Btn onClick={()=>{setSession({...blank(),auction:createAuction(freshSeed(),name)});setPaused(true)}}>🔨 Começar o leilão</Btn></Box>
    <div className="f1-setup-cars"><Machine car={CARS[0]}/><Machine car={CARS[1]}/><Machine car={CARS[3]}/></div>
    <p className="f1-explain f1-on-dark">Corrida 2D em Interlagos · 24 voltas · cerca de 4 minutos na velocidade normal. Cada piloto tem seus próprios pneus, ritmo e parada.</p><Catalogue/>
   </>}
   {phase==='auction'&&auction&&team&&<>
    <div className="f1-page-heading"><div><small>COMPRA {auction.round+1} DE 3</small><h1>{auction.round===2?'ESCOLHA A MÁQUINA':`PILOTO ${auction.round+1}`}</h1></div><div className="f1-wallet"><small>SEU CAIXA</small><b>{cash(team.coins)}</b></div></div>
    <div className="f1-budget-note">{auction.round===2?'Um modelo histórico equipa seus dois carros.':`Reserve moedas para ${auction.round===0?'o segundo piloto e o carro':'o carro'}. Você pode gastar até ${maxBid(auction)} agora.`}</div>
    {auction.report?<Box bg="#F4ECD6" className="f1-panel f1-reveal"><h2>{auction.report.won?'🔨 CARTA CONTRATADA!':'OUTRA ESCUDERIA LEVOU'}</h2><p>{auction.report.won?'Sua escolha entrou na garagem. Confira os envelopes abertos.':'Você conserva suas moedas. Escolha outra carta na próxima tentativa.'}</p><div>{auction.report.bids.map((b,i)=>{const winner=auction.report!.sales.some(s=>s.teamId===b.teamId&&s.lotId===b.lotId&&s.amount===b.amount);return <p key={`${b.teamId}:${i}`} className={b.teamId===0?'f1-own-bid':''}><span><b>{auction.teams[b.teamId].name}</b><small>{auction.round===2?`${carById(b.lotId).team} ${carById(b.lotId).model}`:driverById(b.lotId).name}</small></span><strong>{b.amount} 🪙 {winner?'✓':''}</strong></p>})}</div><Btn onClick={()=>setSession(s=>({...s,auction:continueAuction(s.auction!)}))}>{auction.report.won?'Continuar →':'Tentar outra carta →'}</Btn></Box>:<>
    <div className="f1-offers" role="group" aria-label="Cartas disponíveis">{auction.offers.map(id=>{const c=auction.round===2?carById(id):driverById(id),category=CATEGORIES[c.category];return <button type="button" key={id} aria-pressed={lot===id} onClick={()=>setLot(id)} style={{'--tier':category.color}as React.CSSProperties}><span className="f1-card-top"><small>{c.category==='bom'&&auction.round===2?'Bom carro':category.label}</small><b>OVR {c.overall}</b></span>{auction.round===2?<><Machine car={c as HistoricCar}/><h3>{(c as HistoricCar).team}</h3><p>{(c as HistoricCar).model} · {c.year}</p></>:<DriverCard driver={c as Driver}/>}</button>})}</div>
    {lot&&<Box bg="#F4ECD6" className="f1-panel f1-bid-panel"><h2>{auction.round===2?`${carById(lot).team} ${carById(lot).model} · ${carById(lot).year}`:driverById(lot).name}</h2>{auction.round===2?<><p>{carById(lot).note}</p><Profiles values={[["Velocidade",carById(lot).pace],["Curvas",carById(lot).corners],["Pneus",carById(lot).tyres],["Confiabilidade",carById(lot).reliability]]}/></>:<Profiles values={[["Ritmo",driverById(lot).pace],["Chuva",driverById(lot).rain],["Ultrapassagem",driverById(lot).craft],["Preservação",driverById(lot).care]]}/>}
     <label className="f1-label" htmlFor="f1-bid">SEU ENVELOPE · MÁXIMO {maxBid(auction)} MOEDAS</label><div className="f1-bid-controls"><button type="button" aria-label="Diminuir lance" onClick={()=>setBid(String(Math.max(1,(Number(bid)||1)-1)))}>−</button><input id="f1-bid" type="number" min={1} max={maxBid(auction)} step={1} inputMode="numeric" value={bid} onChange={e=>setBid(e.target.value)}/><button type="button" aria-label="Aumentar lance" onClick={()=>setBid(String(Math.min(maxBid(auction),(Number(bid)||0)+1)))}>+</button></div><p className="f1-explain">Se ganhar, sobram {Math.max(0,team.coins-(Number(bid)||0))} moedas. Cada rival escolhe sem conhecer o seu lance. Empates têm desempate por sorteio.</p>
     <Btn disabled={!Number.isSafeInteger(Number(bid))||Number(bid)<1||Number(bid)>maxBid(auction)} onClick={()=>setSession(s=>({...s,auction:submitBid(s.auction!,lot,Number(bid))}))}>Fechar envelope e revelar</Btn>
    </Box>}
    {!lot&&<p className="f1-hint" role="status">Toque em uma carta para ver os atributos e dar seu lance.</p>}
    </>}
    {auction.error&&<p className="f1-error" role="alert">{auction.error}</p>}
    <details className="f1-garage" open><summary>Sua garagem · {cash(team.coins)} disponíveis</summary>{team.drivers.map(id=><p key={id}><b>{driverById(id).name}</b><span>{driverById(id).year} · {CATEGORIES[driverById(id).category].label}</span></p>)}{team.car&&<p><b>{carById(team.car).team} {carById(team.car).model}</b><span>{carById(team.car).year} · duas unidades</span></p>}{!team.drivers.length&&<p>A dupla começa na primeira compra.</p>}</details>
   </>}
   {phase==='strategy'&&auction&&team&&<>
    <div className="f1-title"><small>GP DO BRASIL · INTERLAGOS</small><h1>PREPARE A LARGADA</h1><p>{team.name} · {carById(team.car!).team} {carById(team.car!).model} · {carById(team.car!).year}</p></div>
    <Box bg="#F4ECD6" className="f1-panel"><h2>CLIMA DA CORRIDA</h2><div className="f1-segments"><button type="button" aria-pressed={!session.mixed} onClick={()=>setSession(s=>({...s,mixed:false}))}>☀️ Seco</button><button type="button" aria-pressed={session.mixed} onClick={()=>setSession(s=>({...s,mixed:true}))}>🌦️ Variável</button></div><p className="f1-explain">{session.mixed?'Previsão de chuva no meio da corrida. Prepare os intermediários.':'Na corrida seca, use pelo menos dois compostos diferentes. Faltar um gera +30s na chegada.'}</p></Box>
    <div className="f1-start-plans">{team.drivers.map((id,i)=>{const p=session.plans[id]??{tyre:i===0?'medium':'hard',pace:'balanced'};return <Box bg="#F4ECD6" className="f1-panel" key={id}><h2>{driverById(id).name}</h2><label className="f1-label">PNEU DA LARGADA</label><Tyres value={p.tyre} onChange={tyre=>setSession(s=>({...s,plans:{...s.plans,[id]:{...p,tyre}}}))}/><p className="f1-explain">{TYRES[p.tyre].note}</p><label className="f1-label">RITMO INICIAL</label><Paces value={p.pace} onChange={pace=>setSession(s=>({...s,plans:{...s.plans,[id]:{...p,pace}}}))}/></Box>})}</div>
    <Btn className="f1-wide" onClick={()=>{setSession(s=>({...s,race:createRace(s.auction!.seed,s.auction!.teams,s.plans,s.mixed)}));setPaused(false)}}>🏁 Apagar as luzes e largar</Btn>
    <p className="f1-explain f1-on-dark">Ritmo, pneus e paradas podem ser alterados durante a corrida. Pausar também pausa todos os rivais.</p>
   </>}
   {(phase==='race'||phase==='results')&&race&&auction&&team&&<>
    <div className="f1-page-heading"><div><small>GP DO BRASIL · SÃO PAULO</small><h1>INTERLAGOS</h1></div><div className="f1-lap"><small>{race.finished?'FIM':'VOLTA'}</small><b>{Math.min(LAPS,Math.max(1,Math.floor(order[0].progress)+1))}<em>/{LAPS}</em></b></div></div>
    <div className="f1-race-context"><span>{race.wet?'🌧 Pista molhada':'☀ Pista seca'}</span><span>{race.finished?'BANDEIRADA FINAL':paused?'CORRIDA PAUSADA':'● CORRIDA EM ANDAMENTO'}</span></div>
    <div className="f1-race-layout"><div className="f1-race-main">
     <section className="f1-track-panel"><div className="f1-track-heading"><span>VISTA DE CIMA · CIRCUITO REAL</span><span>4,309 km</span></div><FormulaTrack race={race} selected={current?.id??''} onSelect={setSelected}/><div className="f1-track-legend"><span>● Seus dois carros destacados</span><small>Caixas ilustrativos</small></div>{!race.finished&&<div className="f1-playback"><button type="button" onClick={()=>setPaused(v=>!v)}>{paused?'▶ Retomar corrida':'Ⅱ Pausar corrida'}</button><label>Transmissão<select aria-label="Velocidade da transmissão" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label></div>}</section>
     <div className="f1-radio" aria-live="polite"><span>RÁDIO DOS BOXES</span><p>{race.events[0]?.text}</p></div>
     <section className="f1-timing" aria-label="Posições na pista"><div className="f1-timing-head"><span>POSIÇÕES NA PISTA</span><span>INTERVALO · PNEU</span></div>{order.map((c,i)=>{const d=driverById(c.driverId),t=auction.teams[c.teamId],leader=order[0],gap=race.finished?c.finishTime!+c.penalty-(leader.finishTime!+leader.penalty):Math.max(0,(leader.progress-c.progress)*84);return <button type="button" key={c.id} onClick={()=>c.teamId===0&&setSelected(c.id)} aria-pressed={c.teamId===0?current?.id===c.id:undefined} className={c.teamId===0?'f1-mine':''}><span className="f1-position">{i+1}</span><i style={{background:t.color}}/><span className="f1-driver-name"><b>{d.name}</b><small>{t.name}{c.teamId===0?' · você':''}{c.penalty?' · +30s':''}</small></span><strong>{c.pitRemaining?'BOX':i===0?'LÍDER':race.finished||c.finishTime===null?`+${gap.toFixed(1)}s`:'FIM'}</strong><Badge tyre={c.tyre}/></button>})}</section>
     <details className="f1-garage"><summary>Últimos rádios e garagem</summary>{race.events.map(e=><p key={e.id}>{e.text}</p>)}{auction.teams.map(t=><p key={t.id}><b>{t.name}</b><span>{carById(t.car!).team} {carById(t.car!).model} · {carById(t.car!).year}</span></p>)}</details>
    </div>
    <aside className="f1-race-side">
    {!race.finished&&current&&<Box bg="#F4ECD6" className="f1-panel f1-pit-panel"><small>SEU MURO DOS BOXES</small><h2>DECIDA A PRÓXIMA VOLTA</h2><div className="f1-own-drivers">{own.map(c=><button type="button" key={c.id} aria-pressed={current.id===c.id} onClick={()=>setSelected(c.id)}><span>{driverById(c.driverId).name}</span><strong>P{order.findIndex(a=>a.id===c.id)+1}</strong><small>{TYRES[c.tyre].name} · {Math.round(c.wear)}% · {c.stops} parada{c.stops===1?'':'s'}</small></button>)}</div><label className="f1-label">RITMO NA PISTA</label><Paces value={current.pace} disabled={current.finishTime!==null} onChange={pace=>send({kind:'pace',pace})}/><label className="f1-label">PNEU PARA A PRÓXIMA PARADA</label><Tyres value={current.nextTyre} disabled={current.pitRemaining>0||current.finishTime!==null} onChange={tyre=>send({kind:'tyre',tyre})}/><p className="f1-explain">{TYRES[current.nextTyre].note}</p><div className="f1-pit-cost"><span>PARADA COMPLETA</span><b>{PIT_SECONDS}s</b><small>Inclui entrada, troca e saída. A parada é na próxima passagem.</small></div><Btn disabled={current.pitRemaining>0||current.finishTime!==null||current.progress>=LAPS-1} onClick={()=>send({kind:'pit'})}>{current.pitRemaining?`NOS BOXES · ${Math.ceil(current.pitRemaining)}s`:current.pitQueued?'Cancelar parada agendada':`Chamar ${driverById(current.driverId).short} para os boxes`}</Btn><p className="f1-explain" role="status">{current.pitQueued?`Box confirmado: ${TYRES[current.nextTyre].name.toLowerCase()}.`:current.pitRemaining?'Troca em andamento. O composto fica travado até sair dos boxes.':current.progress>=LAPS-1?'Última volta: a entrada nos boxes está encerrada.':!race.hadWet&&new Set(current.compounds.filter(t=>t!=='inter')).size<2?'Lembrete: use dois compostos diferentes se a corrida permanecer seca.':'Você pode decidir a estratégia de cada piloto separadamente.'}</p></Box>}
    {race.finished&&<Box bg="#F4ECD6" className="f1-panel f1-result"><span className="f1-trophy">🏆</span><small>VENCEDOR EM INTERLAGOS</small><h2>{driverById(order[0].driverId).name}</h2><p>{auction.teams[order[0].teamId].name} · {carById(order[0].carId).team} {carById(order[0].carId).model}</p><h3>ESCUDERIAS · SOMA DOS DOIS PILOTOS</h3>{teamResults(race,auction.teams).map((t,i)=><p key={t.id} className={t.id===0?'f1-own-result':''}><span>{i+1}. {t.name}</span><b>{t.points} pts</b></p>)}<p className="f1-explain">Pontuação: {POINTS.slice(0,8).join(' · ')}. Os tempos finais incluem as penalidades indicadas.</p><Btn onClick={newGame}>🔨 Novo leilão e nova corrida</Btn></Box>}
    </aside></div>
   </>}
   {auction&&<button type="button" className="f1-reset" onClick={()=>{setPaused(true);setReset(true)}}>Recomeçar partida rápida</button>}
   <footer className="f1-footer">2 PILOTOS · 1 MODELO DE CARRO · CADA DECISÃO CONTA<br/><a href="https://github.com/bacinger/f1-circuits" target="_blank" rel="noreferrer">Traçado: Tomislav Bacinger · MIT</a> · <a href={`${import.meta.env.BASE_URL}formula1/LICENSE-track.txt`} target="_blank" rel="noreferrer">Licença</a></footer>
   {(exit||reset)&&<div className="f1-modal-backdrop"><Box bg="#F4ECD6" className="f1-panel f1-modal"><h2>{reset?'Recomeçar a partida?':'Voltar aos outros jogos?'}</h2><p>{reset?'O leilão e a corrida atuais serão descartados.':'Sua corrida ficará pausada e guardada enquanto esta página continuar aberta.'}</p><Btn onClick={()=>{if(reset)newGame();else if(exit){setSport(exit);closeFormula1();setExit(null)}}}>{reset?'Sim, novo leilão':'Voltar aos jogos'}</Btn><button type="button" onClick={()=>{setExit(null);setReset(false)}}>Continuar aqui</button></Box></div>}
  </div>
 </main>
}
export default function Formula1Game(){const allowed=useOwnerPresentation();return allowed?<Formula1Core/>:null}
