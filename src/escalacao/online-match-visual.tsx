import type { ReactNode, CSSProperties } from 'react'
import { useEffect, useState, useRef, useMemo } from 'react'
import './online-match-visual.css'
import { tr } from './lang' // 🌐 BR/EN
import { usePatrocinio } from './patrocinio' // 💼 'apresentada por' (16/10)
import { LedEstadio } from './patrocinio-visual' // 🏟️ LED do estádio (16/10)
import { basketClockLabel } from './sportcfg' // ⏱️ 🏀 Q1 12:00 → Q4 0:00
import { placarParaK } from './kings-liga' // 👑 relógio de 40 min da Kings no giro
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
  // ⚽🥅 O GOLZINHO (26/09, mockup aprovado: *"adorei"*). A faixa preta do palco dos
  // pênaltis embaixo do placar: 🥅 de cada lado, pista com a cor de cada time, a bola
  // parada no meio. `palco` = o lance que está NA TELA agora: de qual lado veio
  // (`side` = quem atacou; a casa ataca o gol da direita) e como terminou —
  // 🧤 defendeu · 🥅 trave · 💨 fora · 🚀 isolou · ⚽ gol (entra e a rede balança).
  // `palcoOn` liga a faixa (sem ela, o placar é byte a byte o de antes).
  // 🎭 A mascote do carimbo NÃO muda: ela continua na cena do gol, como sempre.
  palcoOn?: boolean; palco?: { speed?:number; side: 'h' | 'a'; fim: 'defendeu' | 'trave' | 'fora' | 'isolou' | 'gol'; key: number; veredito: string } | null;
  // 📻 RÁDIO LEGENDS (13/10): UMA linha entre a faixa do golzinho e os autores dos gols. Sempre ocupa o mesmo
  // espaço (antes da 1ª frase diz "rádio ligada") pra o placar não pular de tamanho.
  radio?: { min: string; txt: string; tag?: string; tom?: 'retro' | 'craque' } | null;
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
    {p.palcoOn && (
      // ⚽🥅 a faixa do golzinho: `key` reinicia a animação a cada lance novo. Lado
      // `h` = a casa atacou → a bola vai pra DIREITA (rede do visitante); `a` → esquerda.
      <div key={p.palco?.key ?? 'quieto'} style={{'--ll32-speed':p.palco?.speed??1} as CSSProperties} className={`ll32-palco${p.palco ? ` ll32-${p.palco.side === 'h' ? 'dir' : 'esq'} ll32-${p.palco.fim}` : ''}`} aria-hidden="true">
        <span className="ll32-meta ll32-m-esq">🥅</span><span className="ll32-luva ll32-l-esq">🧤</span>
        <div className="ll32-pista">
          <i className="ll32-metade ll32-mt-esq" style={{ borderColor: p.homeColor }} /><i className="ll32-metade ll32-mt-dir" style={{ borderColor: p.awayColor }} />
          <span className="ll32-sombra" /><span className="ll32-bola">⚽</span>
        </div>
        <span className="ll32-luva ll32-l-dir">🧤</span><span className="ll32-meta ll32-m-dir">🥅</span>
        {p.palco && <b className={`ll32-veredito ll32-v-${p.palco.fim}`}>{p.palco.veredito}</b>}
      </div>
    )}
    {p.enhanced && p.goalSide && <div key={p.eventKey} className={`ll26-goal-scene ll26-goal-${p.goalSide}`} aria-hidden="true">
      <div className="ll26-goal-rays" />
      <div className="ll26-goal-mascot">{p.mascot}</div>
      <strong>{tr('GOOOL!', 'GOOOAL!')}</strong>
      {Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}
    </div>}
    {p.radio && <div className={`ll42-radio${p.radio.tom ? ` ll42-${p.radio.tom}` : ''}`} aria-live="off"><span className="ll42-radio-tag">{p.radio.tag ?? `📻 ${tr('RÁDIO', 'RADIO')}`}</span>{p.radio.min && <b>{p.radio.min}′</b>}<span key={p.radio.txt} className="ll42-radio-txt">{p.radio.txt}</span></div>}
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
  kind: 'copa8' | 'liberta' | 'world' | 'club-world' | 'league' | 'champions'; title: string; phase: string;
  detail: string; status?: string; children?: ReactNode
}) {
  const patro = usePatrocinio(kind)
  return <section className={`ll26-competition ll25-${kind === 'league' ? 'league' : kind}-art`}>
    <LedEstadio />
    {/* 🧹 `detail` vazio não vira parágrafo em branco (Diego 19/09: a liga não precisa
        da linha "acompanhe sua divisão…"; a Copa continua dizendo o formato da fase) */}
    <div className="ll26-competition-copy"><small>{title}</small><h2>{phase}</h2>{detail ? <p>{detail}</p> : null}
      {/* 💼 "apresentada por" (16/10): o patrocinador da competição, embaixo do nome */}
      {patro && <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
        {tr('apresentada por', 'presented by')}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#0C0C0C', color: '#FFC400', border: '2px solid #FFC400', borderRadius: 8, padding: '1px 8px', fontFamily: 'Oswald, sans-serif', fontWeight: 900, fontSize: 13, letterSpacing: '.04em' }}>{patro.emoji} {patro.nome.toUpperCase()}</span>
      </div>}
    </div>
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
  /** 👑 Kings (15/10): o giro anda no MESMO relógio do jogo da pessoa (que para nas cenas) e mostra os 40 min da Kings.
   *  Antes cada jogo do giro tinha relógio próprio e os gols do 1×1 passavam por baixo da cena do pontapé — o Diego
   *  achava que não saía gol no começo. */
  minutoFixo?: number; relogioKings?: boolean
}) {
  const [minuteLocal, setMinute] = useState(0)
  const minute = p.minutoFixo ?? minuteLocal
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
  const relogio = basket ? basketClockLabel(minute, tr('FIM', 'FINAL')) : p.relogioKings ? `${placarParaK(minute)}′` : `${Math.min(90, minute)}′`
  const { minutoFixo: _mf, relogioKings: _rk, ...resto } = p
  void _mf; void _rk
  return <CompetitionMatch {...resto} goals={goals.filter(g=>finished||g.min<=minute)} homeScore={homeScore} awayScore={awayScore} status={finished ? tr('ENCERRADO', 'FULL TIME') : `${relogio} · ${tr('AO VIVO', 'LIVE')}`} detail={!finished && !known && !basket ? tr('Placar revelado no apito final', 'Score revealed at the final whistle') : p.detail} />
}

export function goalPlayer(text:string){return text.match(/⚽\s+(.+?)\s+marca para/)?.[1] ?? text.replace(/^⚽\s*/, '').replace(/\.$/,'')}

export function CompactPenalties({rows,totalDelay,nSlots,aName,bName,aCrest,bCrest,official,final=false,aTeam,bTeam,passo=.85,shootout=false}:{shootout?:boolean;rows:{ok:boolean;at:number}[][];totalDelay:number;nSlots:number;aName:string;bName:string;aCrest?:ReactNode;bCrest?:ReactNode;official:[number,number];final?:boolean;aTeam?:Batedores;bTeam?:Batedores;passo?:number}){
 const [elapsed,setElapsed]=useState(0)
 const signature=JSON.stringify(rows)
 useEffect(()=>{const start=Date.now();setElapsed(0);const id=setInterval(()=>{const t=(Date.now()-start)/1000;setElapsed(t);if(t>=totalDelay)clearInterval(id)},80);return()=>clearInterval(id)},[signature,aName,bName,totalDelay])
 const done=elapsed>=totalDelay
 const valid=rows.every((r,i)=>r.filter(k=>k.ok).length===official[i])
 if(!valid)return <section className="ll28-pens" aria-label="Resultado dos pênaltis"><header><b>{shootout?'SHOOTOUT':tr('PÊNALTIS', 'PENALTIES')}</b><strong>{done?`${official[0]} × ${official[1]}`:'– × –'}</strong></header><p>{aName} × {bName}</p><p className="ll28-pen-winner">{done?`${official[0]>official[1]?aName:bName} · ${final?tr('CAMPEÃO', 'CHAMPION'):tr('CLASSIFICADO', 'THROUGH')}`:tr('Decisão em andamento…', 'Shoot-out in progress…')}</p></section>
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
 // ⚽ A BOLA VIAJA (25/09, mockup aprovado: *"pode fazer, já pode funcionar já"*).
 // Antes a bolinha só PISCAVA no meio do palco e o veredito caía do nada. Agora ela
 // nasce no pé de quem bate, atravessa a pista e SÓ quando chega no gol sai o final:
 // gol (a rede balança) · defendeu (a luva fecha) · pra fora (passa do lado e some) ·
 // trave/travessão (bate e volta) · isolou (sobe e sai por cima).
 // 🙈 SEM SPOILER, e o motivo é de construção: a viagem é a MESMA pra todo resultado
 // (mesma saída, mesma velocidade, mesmo caminho) e o `ok` só é lido quando a cobrança
 // já "chegou" (`shown`) — o mesmo instante em que a bolinha nasce na linha de cima.
 // ⏱️ Tudo cabe DENTRO do passo que já existe (nenhum segundo a mais): o veredito fica
 // 35% do passo, a viagem dura 55% dele e sobra um tiquinho com a bola parada no pé.
 // Bot × bot (0,85 s) corre rápido; com gente (1,6 s) dá pra acompanhar.
 // 🎞️ A viagem é animação de CSS com o atraso CONGELADO por cobrança (`useMemo` por
 // `at`): o relógio de 80 ms desta tela só liga/desliga a bola, nunca a reposiciona —
 // senão ela andaria aos trancos. Quem abre a tela no meio do voo pega o atraso certo.
 const T=(at:number)=>.7+at*passo
 // a ÚLTIMA cobrança fica no palco até a linha do classificado entrar (senão sobrava
 // 1 s de "uma cobrança de cada vez…" entre o lance que decidiu e o veredito da disputa)
 const lance=saiu&&(elapsed<T(saiu.at)+passo*.35||!next)?saiu:undefined
 const noPalco=lance??next
 const parteEm=next?Math.max(0,T(next.at)-passo*.55):0
 const voando=!lance&&!!next&&elapsed>=parteEm
 const elapsedRef=useRef(0);elapsedRef.current=elapsed
 const voo=useMemo(()=>{
  if(!next)return null
  const d=Math.max(0,T(next.at)-passo*.55)
  return {duracao:T(next.at)-d,atraso:-Math.max(0,elapsedRef.current-d)}
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[next?.at,passo])
 const TXT_ERRO:Record<JeitoDoErro,string>={defendeu:tr('🧤 DEFENDEU!','🧤 SAVED!'),fora:tr('💨 PRA FORA!','💨 WIDE!'),isolou:tr('🚀 ISOLOU!','🚀 SKIED IT!'),trave:tr('🔔 NA TRAVE!','🔔 HIT THE POST!'),travessao:tr('🔔 NO TRAVESSÃO!','🔔 OFF THE BAR!')}
 const tamNome=(n:string)=>n.length<=10?14:n.length<=14?12.5:n.length<=18?11.5:10.5
 const palco=()=>{
  if(!noPalco)return null
  const bate=quem(noPalco.side,noPalco.i),gk=times[1-noPalco.side]?.goleiro
  if(!bate&&!gk)return null
  const erro=lance&&!lance.ok?jeitoDoErro(semente,lance.at):null
  const veredito=lance?(lance.ok?tr('⚽ GOL!','⚽ GOAL!'):TXT_ERRO[erro!]):null
  // o final no gol: a classe diz COMO acabou; a bola que sobra faz o movimento
  const fim=lance?(lance.ok?'gol':erro==='defendeu'?'luva':erro==='fora'?'fora':erro==='isolou'?'ceu':'trave'):null
  return <div className={`ll28-palco${lance?(lance.ok?' p-gol':' p-erro'):''}`} aria-live="polite">
   <div className="ll28-palco-lado"><small>{lance?tr('⚽ BATEU','⚽ TOOK IT'):tr('⚽ BATE','⚽ UP NEXT')}</small>{bate&&<b style={{fontSize:tamNome(bate)}}>{bate}</b>}</div>
   <div className="ll28-pista">
    <span className="ll28-trilho"/>
    <span className={`ll28-meta${fim==='gol'?' balanca':''}`}>{fim==='luva'?'🧤':'🥅'}</span>
    {lance&&fim!=='luva'&&<span key={`fim-${lance.at}`} className={`ll28-bola fim-${fim}`}>⚽</span>}
    {!lance&&next&&(voando&&voo
      ?<span key={`voa-${next.at}`} className="ll28-bola voa" style={{animationDuration:`${voo.duracao.toFixed(2)}s`,animationDelay:`${voo.atraso.toFixed(2)}s`}}>⚽</span>
      :<span className="ll28-bola no-pe">⚽</span>)}
    {veredito&&<div className="ll28-veredito">{veredito}</div>}
   </div>
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
  <header><b>{naMorteSubita?tr('MORTE SÚBITA', 'SUDDEN DEATH'):shootout?'SHOOTOUT':tr('PÊNALTIS', 'PENALTIES')}</b><strong>{scores[0]} × {scores[1]}</strong><span>{done?tr('ENCERRADO', 'OVER'):shootout?tr('TENTATIVAS', 'ATTEMPTS'):tr('COBRANÇAS', 'KICKS')}</span></header>
  {rows.map((r,side)=><div className="ll28-pens-row" key={side}><div>{side===0?aCrest:bCrest}<span>{side===0?aName:bName}</span></div><div className="ll28-kicks">{Array.from({length:nSlots},(_,i)=>{const k=r[i];if(!k)return null;const shown=elapsed>=.7+k.at*passo;const daVez=!done&&next?.side===side&&next.i===i;if(!shown&&!daVez)return null;const sg=sigla(side,i);return <span key={i} className={`${shown?(k.ok?'made':'missed'):'current'}${sg?' sigla':''}`} title={quem(side,i)} aria-label={shown?(k.ok?tr('Gol', 'Goal'):tr('Errou', 'Missed')):tr('Batendo agora', 'Kicking now')}>{sg??(shown?(k.ok?'✓':'×'):'')}</span>})}</div></div>)}
  {palcoAgora??<p className="ll28-pen-winner">{done?`${scores[0]>scores[1]?aName:bName} · ${final?tr('CAMPEÃO', 'CHAMPION'):tr('CLASSIFICADO', 'THROUGH')}`:tr('Uma cobrança de cada vez…', 'One kick at a time…')}</p>}
 </section>
}

// ─── 🎬 ABERTURA DA RODADA DA COPA (Diego 13/10, mockup `scripts/mockups/abertura-copas-antes-depois.png`) ───
// Antes de a bola rolar numa fase da copa das salas online: o CAMINHO da copa (fases, a de agora acesa,
// o seu time marcado até onde chegou) + os CONFRONTOS da rodada escudo×escudo (o seu em destaque) + a
// contagem. Some quando a bola rola e volta na fase seguinte. Só apresentação: não decide nada.
export type AberturaFase = { label: string; estado: 'ok' | 'on' | ''; meu: boolean }
export type AberturaConfronto = { home: string; away: string; mine: boolean; homeCrest?: ReactNode; awayCrest?: ReactNode }
export function AberturaCopa({ fases, confrontos, seg, total, cor, espera, mais = 0 }: {
  fases: AberturaFase[]; confrontos: AberturaConfronto[]
  /** segundos até a bola rolar (null = sem contagem: manual, esperando o host) */
  seg: number | null; total: number; cor: string
  /** texto do lugar da contagem quando não há contagem (manual) */
  espera?: string
  /** confrontos que ficaram de fora da lista (rodada grande) */
  mais?: number
}) {
  const pct = seg == null || total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round(100 - (seg / total) * 100)))
  return <div className="ll40-abertura">
    <div className="ll40-caminho">{fases.map((f, i) => <span key={f.label} className={`${f.estado}${f.meu ? ' meu' : ''}`}>{f.estado === 'ok' ? '✔ ' : ''}{f.label}{i < fases.length - 1 ? <i>›</i> : null}</span>)}</div>
    <p className="ll40-tit">{tr('CONFRONTOS DA RODADA', 'ROUND FIXTURES')}</p>
    {confrontos.map((c, i) => <div key={i} className={`ll40-jogo${c.mine ? ' eu' : ''}`}>
      {c.mine && <span className="ll40-tag">⭐ {tr('SEU JOGO', 'YOUR MATCH')}</span>}
      <div className="ll40-time">{c.homeCrest}<b>{c.home}</b></div><span className="ll40-x">×</span><div className="ll40-time r"><b>{c.away}</b>{c.awayCrest}</div>
    </div>)}
    {mais > 0 && <p className="ll40-mais">+ {mais} {tr(mais === 1 ? 'confronto' : 'confrontos', mais === 1 ? 'tie' : 'ties')} ↓</p>}
    <div className="ll40-bar"><i style={{ width: `${pct}%`, background: cor }} /></div>
    <p className="ll40-bola">{seg == null ? (espera ?? '') : <>⚽ {tr('A BOLA ROLA EM', 'KICK-OFF IN')} <b>{seg}s</b></>}</p>
  </div>
}

// ─── 🌳 CHAVEAMENTO DESENHADO (Diego 13/10, mockup `scripts/mockups/copas-proximos.png` nº 1) ───
// ⛔ DESLIGADO NO MESMO DIA, por ordem dele: *"deixa só o resumo mesmo, sem chaveamento"* (a chave e o resumo da
// fase contavam a mesma coisa). Ninguém importa `ChaveCopa` hoje — o bundle tira sozinho. Fica aqui pronto, com a foto
// em `scripts/foto-copas-fluxo.mjs`, caso ele queira de volta. Não religar sem ele pedir.
// A árvore inteira do mata-mata: cada fase numa coluna, quem passou em verde, quem caiu apagado, o seu
// caminho com borda dourada e o que ainda vem pontilhado com "?". Toque num jogo já jogado abre o detalhe
// (placar + pênaltis) que quem chama desenha (`detalhe`). Só apresentação: não decide nada, não revela
// resultado — quem chama só manda gols de fase FECHADA (anti-spoiler é responsabilidade de quem monta).
export type ChaveLado = { nome: string; crest?: ReactNode; gols?: number | string | null; venceu?: boolean; meu?: boolean }
export type ChaveJogo = { key: string; a: ChaveLado | null; b: ChaveLado | null; jogado: boolean; pens?: string }
export type ChaveFase = { label: string; jogos: ChaveJogo[]; estado: 'ok' | 'on' | '' }
export function ChaveCopa({ fases, detalhe, titulo }: { fases: ChaveFase[]; detalhe?: (fase: number, jogo: number) => ReactNode; titulo?: string }) {
  const [sel, setSel] = useState<string | null>(null)
  const [fi, ji] = sel ? sel.split(':').map(Number) : [-1, -1]
  const aberto = sel && detalhe && fases[fi]?.jogos[ji] ? detalhe(fi, ji) : null
  return <section className="ll41-chave">
    <p className="ll41-tit">🌳 {titulo ?? tr('CHAVEAMENTO', 'BRACKET')}<span>{tr('toque num jogo encerrado pra ver o placar · deslize pro lado', 'tap a finished tie to see the score · swipe sideways')}</span></p>
    <div className="ll41-scroll"><div className="ll41-cols">
      {fases.map((f, i) => <div key={i} className={`ll41-col ${f.estado}`}>
        <small>{f.estado === 'ok' ? '✔ ' : ''}{f.label}</small>
        <div className="ll41-jogos">{f.jogos.map((j, k) => {
          const meu = !!(j.a?.meu || j.b?.meu)
          const chave = `${i}:${k}`, clic = j.jogado && !!detalhe
          return <div key={j.key} className="ll41-slot"><button type="button" disabled={!clic} onClick={() => setSel(sel === chave ? null : chave)}
            className={`ll41-jogo${meu ? ' meu' : ''}${j.jogado ? ' jogado' : ''}${sel === chave ? ' sel' : ''}${!j.a && !j.b ? ' vazio' : ''}`}>
            {[j.a, j.b].map((l, li) => <span key={li} className={`ll41-lado${l?.venceu ? ' venceu' : ''}${j.jogado && l && !l.venceu ? ' caiu' : ''}`}>
              {l ? <>{l.crest}<b>{l.nome}</b>{l.gols != null && <i>{l.gols}</i>}</> : <em>?</em>}
            </span>)}
            {j.pens && <small>{j.pens}</small>}
          </button></div>
        })}</div>
      </div>)}
    </div></div>
    {aberto && <div className="ll41-detalhe">{aberto}</div>}
  </section>
}

// ─── ✅❌ RESUMO DA FASE (mockup nº 2) ───
// Quando uma fase fecha: 5s com quem PASSOU e quem CAIU, e a contagem pra próxima fase. Entra ANTES da
// abertura da fase seguinte (`AberturaCopa`). Lista grande de quem caiu (grupos da Copa do Mundo) vira
// uma linha corrida, senão não cabe nos 5s.
export type ResumoTime = { nome: string; crest?: ReactNode; meu?: boolean }
export function ResumoFase({ titulo, passaram, cairam, proxima, seg, total, cor, espera }: {
  titulo: string; passaram: ResumoTime[]; cairam: ResumoTime[]; proxima: string
  seg: number | null; total: number; cor: string; espera?: string
}) {
  const pct = seg == null || total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round(100 - (seg / total) * 100)))
  const corrida = cairam.length > 8
  return <div className="ll40-abertura ll41-resumo">
    <p className="ll41-resumo-tit">{titulo}</p>
    <p className="ll41-resumo-sub ok">✅ {tr('PASSARAM', 'THROUGH')} · {proxima}</p>
    <div className="ll41-chips">{passaram.map((t, i) => <span key={i} className={`ok${t.meu ? ' meu' : ''}`}>{t.crest}<b>{t.nome}</b>{t.meu && <i>⭐</i>}</span>)}</div>
    {cairam.length > 0 && <>
      <p className="ll41-resumo-sub caiu">❌ {tr('CAÍRAM', 'OUT')}</p>
      {corrida ? <p className="ll41-corrida">{cairam.map(t => t.nome).join(' · ')}</p>
        : <div className="ll41-chips">{cairam.map((t, i) => <span key={i} className={`caiu${t.meu ? ' meu' : ''}`}>{t.crest}<b>{t.nome}</b>{t.meu && <i>⭐</i>}</span>)}</div>}
    </>}
    <div className="ll40-bar"><i style={{ width: `${pct}%`, background: cor }} /></div>
    <p className="ll40-bola">{seg == null ? (espera ?? '') : <>⏭ {proxima} {tr('EM', 'IN')} <b>{seg}s</b></>}</p>
  </div>
}

// ─── 🏆 CAMPEÃO + 🥇 ARTILHEIRO NO FIM DA COPA (mockup nº 3) ───
// Dourado só pra QUEM GANHOU (regra de tier: nunca dourado fixo pra todos); pros outros, branco.
export function CampeaoCopaCard({ titulo, nome, crest, sub, final, meu }: { titulo: string; nome: string; crest?: ReactNode; sub?: ReactNode; final?: ReactNode; meu: boolean }) {
  return <div className={`ll41-campeao${meu ? ' meu' : ''}`}>
    <small>🏆 {titulo}</small>
    <div className="ll41-campeao-escudo">{crest}</div>
    <h3>{nome}</h3>
    {sub && <p>{sub}</p>}
    {final && <p className="ll41-campeao-final">{final}</p>}
  </div>
}
export type ArtilheiroLinha = { nome: string; clube: string; carta?: string; gols: number; crest?: ReactNode; meu?: boolean }
export function ArtilheiroCopaCard({ titulo, linhas, rotulo }: { titulo: string; linhas: ArtilheiroLinha[]; rotulo?: [string, string] }) {
  const [um, varios] = rotulo ?? [tr('gol', 'goal'), tr('gols', 'goals')]
  const top = linhas[0]
  if (!top) return null
  return <div className="ll41-artilheiro">
    <small>🥇 {titulo}</small>
    <div className={`ll41-art-top${top.meu ? ' meu' : ''}`}>
      <div className="ll41-art-escudo">{top.crest}</div>
      <div className="ll41-art-nome"><b>{top.nome}</b><span>{top.clube}{top.carta ? ` · ${top.carta}` : ''}</span></div>
      <div className="ll41-art-gols"><b>{top.gols}</b><span>{top.gols === 1 ? um : varios}</span></div>
    </div>
    {linhas.length > 1 && <div className="ll41-art-resto">{linhas.slice(1, 3).map((l, i) => <p key={i} className={l.meu ? 'meu' : ''}><span>{i === 0 ? '2º' : '3º'}</span>{l.crest}<b>{l.nome}</b><em>{l.clube}</em><strong>{l.gols}</strong></p>)}</div>}
  </div>
}
