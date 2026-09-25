import type { ReactNode, CSSProperties } from 'react'
import { useEffect, useState, useRef } from 'react'
import './online-match-visual.css'
import { tr } from './lang' // 🌐 BR/EN
import { basketClockLabel } from './sportcfg' // ⏱️ 🏀 Q1 12:00 → Q4 0:00
import { type Batedores, batedorDaVez, siglasDoTime, sementePalco, jeitoDoErro, type JeitoDoErro } from './penaltis' // 🎯 o palco dos batedores (24/09)

type Goal = { name: string; min: number; home: boolean }
export function OnlineScorePresentation(p: {
  homeName: string; awayName: string; homeCrest: ReactNode; awayCrest: ReactNode;
  homeColor: string; awayColor: string; youIsHome: boolean;
  homeOwner?: string; awayOwner?: string; clock: string; homeScore: number; awayScore: number;
  goals: Goal[]; goalSide: 'h' | 'a' | null; mascot: ReactNode; stamp: string;
  narration: string; eventKey: number; enhanced?: boolean;
  // 🔒 `big` = placar GRANDE da prévia (19/09: escudo 92, nome 18, número 44, frase 17 em
  // até 2 linhas). `result` = quem ganhou no apito final: o escudo dele brilha e o do
  // outro apaga. Fora da prévia os dois ficam de fora e nada muda.
  big?: boolean; result?: 'h' | 'a' | null;
}) {
  const team = (home: boolean) => {
    const name = home ? p.homeName : p.awayName
    const fim = p.big && p.result ? (p.result === (home ? 'h' : 'a') ? ' ll30-win' : ' ll30-lose') : ''
    return <div className={`ll25-team${fim}`} style={{ borderColor: home ? p.homeColor : p.awayColor }}>
      <div className="ll25-crest-slot">
        {!p.enhanced && p.goalSide === (home ? 'h' : 'a') ? <div className="ll25-mascot">{p.mascot}</div> : home ? p.homeCrest : p.awayCrest}
      </div>
      <strong>{name}</strong>
      <small>{(home ? p.homeOwner : p.awayOwner) ?? ((home === p.youIsHome) ? tr('VOCÊ', 'YOU') : tr('RIVAL', 'RIVAL'))}</small>
    </div>
  }
  return <section className={`ll25-score ${p.enhanced ? 'll26-score' : ''} ${p.enhanced && p.goalSide ? 'll26-scoring' : ''} ${p.big ? 'll30-big' : ''}`} aria-label="Placar da partida">
    <div className={`ll25-narration ${p.goalSide ? 'll25-goal' : ''}`} title={p.goalSide ? p.stamp : p.narration}>
      {p.goalSide ? p.stamp : p.narration}
    </div>
    <div className="ll25-duel">
      {team(true)}
      <div className="ll25-numbers"><small>{p.clock}</small><strong>{p.homeScore} <span>×</span> {p.awayScore}</strong></div>
      {team(false)}
    </div>
    {p.enhanced && p.goalSide && <div key={p.eventKey} className={`ll26-goal-scene ll26-goal-${p.goalSide}`} aria-hidden="true">
      <div className="ll26-goal-rays" />
      <div className="ll26-goal-mascot">{p.mascot}</div>
      <strong>{tr('GOOOL!', 'GOOOAL!')}</strong>
      {Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}
    </div>}
    <div className="ll25-scorers">{[true, false].map(home => <div key={String(home)}>
      {p.goals.filter(g => g.home === home).map((g, i) => <p key={`${g.name}-${g.min}-${i}`}>{p.big ? '⚽ ' : ''}{g.name} <b>{g.min > 90 ? `90+${g.min - 90}` : g.min}′</b></p>)}
      {!p.goals.some(g => g.home === home) && <p>{tr('Sem gols', 'No goals')}</p>}
    </div>)}</div>
  </section>
}

export function OnlineRhythm(p: { manual: boolean; onToggle: () => void; speed: number; onSpeed: (v: number) => void }) {
  return <div className="ll25-rhythm" aria-label="Ritmo da sala">
    <button className="ll25-button" aria-pressed={p.manual} onClick={() => { if (!p.manual) p.onToggle() }}>MANUAL</button>
    <button className="ll25-button" aria-pressed={!p.manual} onClick={() => { if (p.manual) p.onToggle() }}>AUTO</button>
    <label><span className="ll25-sr">{tr('Velocidade da partida', 'Match speed')}</span><select className="ll25-button" disabled={!p.manual} value={p.speed > 0 ? p.speed : 1} onChange={e => p.onSpeed(Number(e.target.value))}>
      <option value={0.25}>{tr('4× mais lento', '4× slower')}</option><option value={0.5}>{tr('2× mais lento', '2× slower')}</option><option value={1}>Normal</option><option value={2}>{tr('2× mais rápido', '2× faster')}</option><option value={4}>{tr('4× mais rápido', '4× faster')}</option>
    </select></label>
  </div>
}
export type OnlineMatchTab = 'jogos' | 'tabela' | 'estatisticas' | 'elenco'
export function OnlineMatchTabs({ value, onChange }: { value: OnlineMatchTab; onChange: (tab: OnlineMatchTab) => void }) {
  return <nav className="ll25-tabs" aria-label="Conteúdo da partida">{([['jogos', tr('JOGOS + TABELA', 'MATCHES + TABLE')], ['estatisticas', tr('ESTATÍSTICAS', 'STATS')], ['elenco', tr('ELENCO', 'SQUAD')]] as const).map(([tab, label]) =>
    <button key={tab} className="ll25-button" aria-pressed={value === tab} onClick={() => onChange(tab)}>{label}</button>)}</nav>
}

export function CompetitionStage({ kind, title, phase, detail, status, children }: {
  kind: 'copa8' | 'liberta' | 'world' | 'league'; title: string; phase: string;
  detail: string; status?: string; children?: ReactNode
}) {
  return <section className={`ll26-competition ll25-${kind === 'league' ? 'league' : kind}-art`}>
    {/* 🧹 `detail` vazio não vira parágrafo em branco (Diego 19/09: a liga não precisa
        da linha "acompanhe sua divisão…"; a Copa continua dizendo o formato da fase) */}
    <div className="ll26-competition-copy"><small>{title}</small><h2>{phase}</h2>{detail ? <p>{detail}</p> : null}</div>
    {status && <div className="ll26-competition-status"><span />{status}</div>}
    {children}
  </section>
}

export function CompetitionMatch({ home, away, homeCrest, awayCrest, homeOwner, awayOwner, homeScore, awayScore, status, detail, mine = false, showOwners=false, goals=[] }: {
  home: string; away: string; homeCrest?: ReactNode; awayCrest?: ReactNode; homeOwner?: string; awayOwner?: string;
  homeScore: number | string; awayScore: number | string; status: string; detail?: ReactNode; mine?: boolean
  showOwners?: boolean; goals?: Goal[]
}) {
  const previous = useRef({home,away,homeScore,awayScore})
  const [goalFlash,setGoalFlash] = useState(false)
  useEffect(() => {
    const old=previous.current
    previous.current={home,away,homeScore,awayScore}
    const scored=old.home===home&&old.away===away&&typeof homeScore==='number'&&typeof awayScore==='number'&&typeof old.homeScore==='number'&&typeof old.awayScore==='number'&&(homeScore>old.homeScore||awayScore>old.awayScore)
    if(!scored){setGoalFlash(false);return}
    setGoalFlash(true)
    const timer=setTimeout(()=>setGoalFlash(false),1000)
    return ()=>clearTimeout(timer)
  },[home,away,homeScore,awayScore])
  return <article className={`ll26-fixture ${mine ? 'll26-fixture-mine' : ''} ${goalFlash?'ll27-fixture-goal':''}`}>
    <header><span>{goalFlash?tr('⚽ GOL!', '⚽ GOAL!'):mine ? tr('SEU JOGO', 'YOUR MATCH') : tr('JOGO DA RODADA', 'MATCH OF THE ROUND')}</span><b>{status}</b></header>
    <div className="ll26-fixture-duel"><div>{homeCrest}<span>{home}{showOwners&&homeOwner&&homeOwner!=='BOT'&&<small>{homeOwner}</small>}</span></div><strong>{homeScore}<i>×</i>{awayScore}</strong><div>{awayCrest}<span>{away}{showOwners&&awayOwner&&awayOwner!=='BOT'&&<small>{awayOwner}</small>}</span></div></div>
    {goals.length>0&&<div className="ll28-scorers">{[true,false].map(side=><div key={String(side)}>{goals.filter(g=>g.home===side).map((g,i)=><p key={i}>{goalPlayer(g.name)} <b>{g.min>90?`90+${g.min-90}`:g.min}′</b></p>)}</div>)}</div>}
    {detail && <footer>{detail}</footer>}
  </article>
}

/** Relógio apenas de apresentação. Não avança a sala nem produz resultados. */
export function useRoundPresentationStart(key: number) {
  const ref = useRef({key,at:Date.now()})
  if(ref.current.key !== key) ref.current = {key,at:Date.now()}
  return ref.current.at
}
export function RoundMatchPresentation({ goals, finished, roundKey, roundMs, score, startedAt, basket, ...p }: Omit<Parameters<typeof CompetitionMatch>[0], 'status' | 'homeScore' | 'awayScore'> & {
  goals: Goal[]; finished: boolean; roundKey: number; roundMs: number; score: [number, number]; startedAt: number
  // 🏀 jogo de BASQUETE: o relógio vira Q1 12:00 → Q4 0:00 e o placar SOBE junto
  // com o relógio. Sem isto, um jogo de basquete aqui mostrava "45′" e um placar
  // de 0 a 3 (ele contava os LANCES narrados, que são meia dúzia) e depois pulava
  // pra 108 × 99 no apito. Agora anda de verdade até o placar final.
  basket?: boolean
}) {
  const [minute, setMinute] = useState(0)
  useEffect(() => {
    const tick = () => setMinute(Math.min(93, Math.round((Date.now() - startedAt) / Math.max(400, roundMs * .82) * 93)))
    tick()
    const timer = setInterval(tick, 250)
    return () => clearInterval(timer)
  }, [roundKey, roundMs, startedAt])
  const known = goals.length > 0 || score.every(n => n === 0)
  const parcial = (final: number) => Math.round(final * Math.min(1, minute / 93))
  const homeScore = finished ? score[0] : basket ? parcial(score[0]) : known ? goals.filter(g => g.home && g.min <= minute).length : '–'
  const awayScore = finished ? score[1] : basket ? parcial(score[1]) : known ? goals.filter(g => !g.home && g.min <= minute).length : '–'
  const relogio = basket ? basketClockLabel(minute, tr('FIM', 'FINAL')) : `${Math.min(90, minute)}′`
  return <CompetitionMatch {...p} goals={goals.filter(g=>finished||g.min<=minute)} homeScore={homeScore} awayScore={awayScore} status={finished ? tr('ENCERRADO', 'FULL TIME') : `${relogio} · ${tr('AO VIVO', 'LIVE')}`} detail={!finished && !known && !basket ? tr('Placar revelado no apito final', 'Score revealed at the final whistle') : p.detail} />
}

export function goalPlayer(text:string){return text.match(/⚽\s+(.+?)\s+marca para/)?.[1] ?? text.replace(/^⚽\s*/, '').replace(/\.$/,'')}

export function CompactPenalties({rows,totalDelay,nSlots,aName,bName,aCrest,bCrest,official,final=false,aTeam,bTeam,passo=.85}:{rows:{ok:boolean;at:number}[][];totalDelay:number;nSlots:number;aName:string;bName:string;aCrest?:ReactNode;bCrest?:ReactNode;official:[number,number];final?:boolean;aTeam?:Batedores;bTeam?:Batedores;passo?:number}){
 const [elapsed,setElapsed]=useState(0)
 const signature=JSON.stringify(rows)
 useEffect(()=>{const start=Date.now();setElapsed(0);const id=setInterval(()=>{const t=(Date.now()-start)/1000;setElapsed(t);if(t>=totalDelay)clearInterval(id)},80);return()=>clearInterval(id)},[signature,aName,bName,totalDelay])
 const done=elapsed>=totalDelay
 const valid=rows.every((r,i)=>r.filter(k=>k.ok).length===official[i])
 if(!valid)return <section className="ll28-pens" aria-label="Resultado dos pênaltis"><header><b>{tr('PÊNALTIS', 'PENALTIES')}</b><strong>{done?`${official[0]} × ${official[1]}`:'– × –'}</strong></header><p>{aName} × {bName}</p><p className="ll28-pen-winner">{done?`${official[0]>official[1]?aName:bName} · ${final?tr('CAMPEÃO', 'CHAMPION'):tr('CLASSIFICADO', 'THROUGH')}`:tr('Decisão em andamento…', 'Shoot-out in progress…')}</p></section>
 const visible=rows.map(r=>r.filter(k=>elapsed>=.7+k.at*passo))
 const scores=visible.map(r=>r.filter(k=>k.ok).length)
 const next=rows.flatMap((r,side)=>r.map((k,i)=>({...k,side,i}))).filter(k=>elapsed<.7+k.at*passo).sort((a,b)=>a.at-b.at)[0]
 // 🎯 COBRANÇA QUE NÃO PRECISOU ACONTECER NÃO GANHA BOLINHA (Diego 09/09, final
 // da Copa do Mundo da sala do Futpoint: *"os pênaltis não terminou todos e já deu
 // campeão"*). A disputa PARA quando está decidida — regra real, e é o que o motor
 // faz. Mas esta tela desenhava um círculo vazio pra cada cobrança que sobrou nas
 // 5 rodadas, e vazio parece "falta cobrar". A disputa antiga (`PensShootout`) já
 // tinha essa lição gravada: só desenha as cobranças que aconteceram. Aqui é a
 // mesma coisa agora — `rows` só tem as cobranças reais, então slot sem cobrança
 // some, e o "CAMPEÃO" só sai quando a ÚLTIMA delas pipocou.
 // 🙈 NADA DO FUTURO NA TELA (24/09). Diego: *"o pênalti tá dando spoiler… mostrar
 // já até aonde vai as bolinhas, já dando spoiler onde vai parar"*. Eram DOIS
 // vazamentos, e os dois contavam o fim da disputa antes da hora:
 //  1. cada cobrança que AINDA IA acontecer ganhava uma bolinha vazia. Bastava
 //     contar as vazias pra saber quantas rodadas faltavam — e, numa morte súbita
 //     longa, que ia até a 14ª (o print dele tinha 14 bolinhas por linha);
 //  2. o título dizia "MORTE SÚBITA" desde a 1ª cobrança, porque vinha do TAMANHO
 //     da disputa (`nSlots > 5`) — ou seja, anunciava o empate nos 5 antes dele.
 // Agora: só aparece bolinha de cobrança que JÁ foi batida, mais a da vez (a que
 // pisca). E o título só vira MORTE SÚBITA quando a 6ª cobrança de fato chega.
 // O `nSlots` continua existindo só pra percorrer a lista — não decide mais nada
 // que o jogador veja.
 const rodadaVisivel=Math.max(...visible.map(r=>r.length),next?Math.floor(next.i)+1:0)
 const naMorteSubita=rodadaVisivel>5
 // 🎯 O PALCO DOS BATEDORES (24/09, mockup aprovado: *"ok pode publicar, só tem que
 // fazer de um jeito que caiba os nomes dos jogadores"*). Quem bate, contra qual
 // goleiro, e o lance por meio segundo (GOL! ou COMO errou). Entra no lugar da linha
 // "Uma cobrança de cada vez…"; no fim volta a linha do classificado.
 // 🙈 Só mostra a cobrança DA VEZ ou a que acabou de sair — o próximo batedor nunca.
 // 📏 Nome longo encolhe e quebra em até 2 linhas (nunca corta no meio da pessoa).
 // Sem elenco (tela que não mandou os times) → fica a linha de sempre.
 const times=[aTeam,bTeam]
 const temPalco=!!(aTeam||bTeam)
 const semente=sementePalco(aName,bName,official)
 const siglas=times.map(t=>t?siglasDoTime(t.goleiro?[...t.batem,t.goleiro]:t.batem):{} as Record<string,string>)
 const quem=(side:number,i:number)=>batedorDaVez(times[side],i)
 const sigla=(side:number,i:number)=>{const n=quem(side,i);return n?siglas[side][n]:undefined}
 const saiu=rows.flatMap((r,side)=>r.map((k,i)=>({...k,side,i}))).filter(k=>elapsed>=.7+k.at*passo).sort((a,b)=>b.at-a.at)[0]
 const lance=saiu&&elapsed<.7+saiu.at*passo+passo*.6?saiu:undefined
 const noPalco=lance??next
 const TXT_ERRO:Record<JeitoDoErro,string>={defendeu:tr('🧤 DEFENDEU!','🧤 SAVED!'),fora:tr('💨 PRA FORA!','💨 WIDE!'),isolou:tr('🚀 ISOLOU!','🚀 SKIED IT!'),trave:tr('🔔 NA TRAVE!','🔔 HIT THE POST!'),travessao:tr('🔔 NO TRAVESSÃO!','🔔 OFF THE BAR!')}
 const tamNome=(n:string)=>n.length<=10?14:n.length<=14?12.5:n.length<=18?11.5:10.5
 const palco=()=>{
  if(!noPalco)return null
  const bate=quem(noPalco.side,noPalco.i),gk=times[1-noPalco.side]?.goleiro
  if(!bate&&!gk)return null
  const veredito=lance?(lance.ok?tr('⚽ GOL!','⚽ GOAL!'):TXT_ERRO[jeitoDoErro(semente,lance.at)]):null
  return <div className={`ll28-palco${lance?(lance.ok?' p-gol':' p-erro'):''}`} aria-live="polite">
   <div className="ll28-palco-lado"><small>{lance?tr('⚽ BATEU','⚽ TOOK IT'):tr('⚽ BATE','⚽ UP NEXT')}</small>{bate&&<b style={{fontSize:tamNome(bate)}}>{bate}</b>}</div>
   {veredito?<div className="ll28-veredito">{veredito}</div>:<div className="ll28-palco-bola">●</div>}
   <div className="ll28-palco-lado dir"><small>{tr('🧤 GOLEIRO','🧤 KEEPER')}</small>{gk&&<b style={{fontSize:tamNome(gk)}}>{gk}</b>}</div>
  </div>
 }
 const palcoAgora=temPalco&&!done?palco():null
 // 📏 AS BOLINHAS COMEÇAM SEMPRE DO MESMO LUGAR, NA ESQUERDA (25/09). Diego: *"a disputa
 // tem que começar certo, com os pontinhos na esquerda"*. Antes o bloco das bolinhas
 // ficava encostado na DIREITA e crescia pra esquerda — a 1ª bolinha ia andando a cada
 // cobrança, e com um time uma à frente as duas linhas desencontravam. Agora a coluna
 // das bolinhas começa num ponto FIXO logo depois do nome (40% da largura), nas duas
 // linhas: cobrança 1 sempre em cima da cobrança 1, e nada se mexe quando nasce a próxima.
 // Morte súbita comprida quebra linha em vez de estourar o cartão.
 return <section className="ll28-pens" aria-label="Disputa de pênaltis">
  <header><b>{naMorteSubita?tr('MORTE SÚBITA', 'SUDDEN DEATH'):tr('PÊNALTIS', 'PENALTIES')}</b><strong>{scores[0]} × {scores[1]}</strong><span>{done?tr('ENCERRADO', 'OVER'):tr('COBRANÇAS', 'KICKS')}</span></header>
  {rows.map((r,side)=><div className="ll28-pens-row" key={side}><div>{side===0?aCrest:bCrest}<span>{side===0?aName:bName}</span></div><div className="ll28-kicks">{Array.from({length:nSlots},(_,i)=>{const k=r[i];if(!k)return null;const shown=elapsed>=.7+k.at*passo;const daVez=!done&&next?.side===side&&next.i===i;if(!shown&&!daVez)return null;const sg=sigla(side,i);return <span key={i} className={`${shown?(k.ok?'made':'missed'):'current'}${sg?' sigla':''}`} title={quem(side,i)} aria-label={shown?(k.ok?tr('Gol', 'Goal'):tr('Errou', 'Missed')):tr('Batendo agora', 'Kicking now')}>{sg??(shown?(k.ok?'✓':'×'):'')}</span>})}</div></div>)}
  {palcoAgora??<p className="ll28-pen-winner">{done?`${scores[0]>scores[1]?aName:bName} · ${final?tr('CAMPEÃO', 'CHAMPION'):tr('CLASSIFICADO', 'THROUGH')}`:tr('Uma cobrança de cada vez…', 'One kick at a time…')}</p>}
 </section>
}
