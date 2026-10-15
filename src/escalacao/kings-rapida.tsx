// ─── 👑 KINGS LEAGUE NA PARTIDA RÁPIDA (15/10) — só a conta do Diego (`useKingsLiberada`) ───────────────────
//
// Conceito: `docs/conceito-kings-league.md` (regras da Kings League BRASIL). Diego: *"faça tudo e publique apenas
// no partida rápida, com apenas meu usuário podendo ver"*.
// É um jogo À PARTE, por cima da tela (camada fixa), com estado PRÓPRIO: não passa pelo reducer do leilão/temporada,
// então o futebol que está no ar não muda uma vírgula. As regras moram em `kings.ts` (motor puro, trava
// `npm run kings`); aqui é só tela + o fluxo: leilão de 7 → 9 rodadas (vestiário → partida) → mata-mata → campeão.
// Ritmo LENTO de propósito (*"mais demorado que todos, porque é difícil entender"*): ~3 min por partida e um
// BANNER parando o jogo em cada regra (dado, intervalo, carta liberada, bola dourada/vermelha, shootout).
// Guarda o andamento no aparelho (uma chave só, `kings-rapida-v1`) no começo de cada rodada.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Manager, Sector } from './types'
import { FAME_TIER } from './screens'
import { PenaltyArt, type PenaltyArtHandle } from './penalty-art'
import { CampinhoKings } from './kings-campinho'
import {
  KINGS_TIMES, KINGS_FORMACAO, calendarioKings, chaveKings, semisKings, simulaPartidaKings, anotaJogoKings, ordenaKings,
  presidenteBot, dueloKings, rngKings, CARTAS_KINGS, JANELA_CARTA, JANELA_PRESIDENTE, MIN_DADO, MIN_INTERVALO, MIN_BOLA, MIN_FIM,
  KINGS_MS_PARTIDA, KINGS_MS_BANNER, KINGS_MS_INTERVALO, KINGS_MS_VESTIARIO, PONTOS_KINGS,
  type LinhaKings, type PartidaKings, type CartaKings, type LanceExterno, type UsoCarta, type Canto,
} from './kings'

const INK = '#0C0C0C', CREAM = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900 as const, textTransform: 'uppercase' as const }
const box = (bg = '#fff'): React.CSSProperties => ({ background: bg, color: INK, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `3px 3px 0 ${INK}` })
const SETORES: Sector[] = ['GOL', 'ZAG', 'MEI', 'ATA']
const NOME_CARTA: Record<CartaKings, { ic: string; nome: string; txt: string }> = {
  penalti: { ic: '⚽', nome: 'Pênalti', txt: 'uma cobrança a seu favor — você bate' },
  shootout: { ic: '🏃', nome: 'Shootout', txt: 'sai do meio de campo, 5s contra o goleiro — você bate' },
  suspensao: { ic: '🟥', nome: 'Suspensão', txt: 'um rival fica 4 minutos fora (mais gol pra você)' },
  gol_dobro: { ic: '✖️2', nome: 'Gol em dobro', txt: 'seus gols valem 2 por 4 minutos' },
}
const SAVE = 'kings-rapida-v2'
const MS_MIN = KINGS_MS_PARTIDA / MIN_FIM

interface CardK { name: string; club: string; year: number; fame: number; lo: number; hi: number; pos: Sector }
interface TimeK { id: number; nome: string; humano: boolean; elenco: CardK[]; dinheiro: number }
interface Mata { etapa: 'quartas' | 'semi' | 'final'; jogos: [number, number][]; semiDireto?: number; venc: number[]; feitos: PartidaKings[] }
interface Save {
  v: 2; seed: number; fase: 'liga' | 'mata' | 'fim'
  times: TimeK[]
  cal: [number, number][][]; rodada: number; tabela: LinhaKings[]; resultados: PartidaKings[][]
  mata: Mata | null; campeao: number | null
}
const nivel = (c: CardK) => (c.lo + c.hi) / 2
const forcaDe = (t: TimeK) => t.elenco.length ? t.elenco.reduce((a, c) => a + nivel(c), 0) / 7 : 40
const tier = (f: number) => FAME_TIER[f] ?? FAME_TIER[1]

/** 🔨 os 10 times vêm do LEILÃO DE SEMPRE (formação 'kings' = goleiro + 6): pega os 7 de cada um */
function timesDoLeilao(managers: Manager[]): TimeK[] {
  const ord = [...managers].sort((a, b) => Number(b.isHuman) - Number(a.isHuman) || a.id - b.id).slice(0, KINGS_TIMES)
  return ord.map((m, i) => {
    const elenco: CardK[] = []
    for (const pos of SETORES) {
      const daPos = m.squad.filter(c => c.pos === pos).sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi)).slice(0, KINGS_FORMACAO[pos])
      for (const c of daPos) elenco.push({ name: c.name, club: c.club, year: c.year, fame: c.fame, lo: c.lo, hi: c.hi, pos })
    }
    return { id: i, nome: m.teamName, humano: m.isHuman, elenco, dinheiro: m.money }
  })
}
function novoCampeonato(managers: Manager[], seed: number): Save {
  const times = timesDoLeilao(managers)
  return {
    v: 2, seed, fase: 'liga', times,
    cal: calendarioKings(times.map(t => t.id)), rodada: 0,
    tabela: times.map(t => ({ id: t.id, nome: t.nome, pts: 0, j: 0, v: 0, vs: 0, ds: 0, d: 0, gp: 0, gc: 0 })),
    resultados: [], mata: null, campeao: null,
  }
}

// ── botões e peças ───────────────────────────────────────────────────────────────────────────────────────────
function Botao({ children, onClick, bg = GOLD, cor = INK, disabled = false }: { children: ReactNode; onClick: () => void; bg?: string; cor?: string; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} style={{ ...box(disabled ? '#d9d1bb' : bg), color: disabled ? 'rgba(0,0,0,.4)' : cor, ...OSW, fontSize: 17, padding: '12px 10px', width: '100%', cursor: disabled ? 'default' : 'pointer' }}>{children}</button>
}
function Banner({ ic, tag, titulo, texto, ms, aoFim }: { ic: string; tag: string; titulo: string; texto: ReactNode; ms: number; aoFim: () => void }) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const t0 = Date.now()
    const iv = setInterval(() => { const q = (Date.now() - t0) / ms; setP(q); if (q >= 1) { clearInterval(iv); aoFim() } }, 100)
    return () => clearInterval(iv)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ ...box(`linear-gradient(160deg,#FFE79A,${GOLD} 40%,#E8A200 70%,#FFDD70)`), borderWidth: 4, boxShadow: `5px 5px 0 ${INK}`, padding: 16, textAlign: 'center', maxWidth: 400, width: '100%' }}>
        <div style={{ fontSize: 46, lineHeight: 1 }}>{ic}</div>
        <div style={{ ...OSW, fontSize: 12, letterSpacing: '.16em', marginTop: 4 }}>{tag}</div>
        <div style={{ ...OSW, fontSize: 26, lineHeight: 1.05, marginTop: 2 }}>{titulo}</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, margin: '8px 0 10px', lineHeight: 1.45 }}>{texto}</div>
        <div style={{ height: 9, background: 'rgba(0,0,0,.2)', border: `2px solid ${INK}`, borderRadius: 6, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(100, p * 100)}%`, background: INK }} /></div>
        <div style={{ ...OSW, fontSize: 11, marginTop: 5 }}>⏸️ jogo parado · volta sozinho</div>
        <button onClick={aoFim} style={{ marginTop: 8, background: 'transparent', border: 'none', ...OSW, fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }}>entendi, continuar ›</button>
      </div>
    </div>
  )
}

/** 🥅 o duelo de pênalti: você BATE (escolhe o canto) ou DEFENDE (escolhe pra onde pular) contra o bot */
function Duelo({ titulo, modo, extraErro = 0, aoFim }: { titulo: string; modo: 'bate' | 'defende'; extraErro?: number; aoFim: (gol: boolean) => void }) {
  const art = useRef<PenaltyArtHandle>(null)
  const [aim, setAim] = useState<number | null>(null)
  const [fim, setFim] = useState<boolean | null>(null)
  const [seg, setSeg] = useState(6)
  const decidir = (z: Canto) => {
    if (fim !== null) return
    const bot = Math.floor(Math.random() * 6) as Canto
    const chute = modo === 'bate' ? z : bot, pulo = modo === 'bate' ? bot : z
    let gol = dueloKings(chute, pulo, Math.random())
    if (gol && modo === 'bate' && Math.random() < extraErro) gol = false
    art.current?.moveKeeper(pulo)
    art.current?.flyBall(chute, !gol && chute !== pulo)
    setTimeout(() => setFim(gol), 600)
    setTimeout(() => aoFim(gol), 2200)
  }
  useEffect(() => {
    if (fim !== null) return
    if (seg <= 0) { decidir((aim ?? Math.floor(Math.random() * 6)) as Canto); return }
    const t = setTimeout(() => setSeg(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seg, fim]) // eslint-disable-line react-hooks/exhaustive-deps
  const ROT = ['↖', '↑', '↗', '↙', '↓', '↘']
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10003, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div style={{ ...box(INK), color: '#fff', padding: 12, maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ ...OSW, color: GOLD, fontSize: 12, letterSpacing: '.12em' }}>{titulo}</div>
        <div style={{ ...OSW, fontSize: 28 }}>{fim === null ? (modo === 'bate' ? 'VOCÊ BATE!' : '🧤 DEFENDA!') : fim ? (modo === 'bate' ? '⚽ GOOOL!' : '😩 FOI GOL') : (modo === 'bate' ? '🧤 DEFENDEU!' : '🧤 VOCÊ PEGOU!')}</div>
        <div style={{ fontSize: 12, fontWeight: 700, opacity: .85, margin: '2px 0 8px' }}>{modo === 'bate' ? 'Escolha o canto e chute. O goleiro do rival vai pular pra algum lado.' : 'O rival vai bater. Escolha pra onde o seu goleiro pula.'}</div>
        <PenaltyArt ref={art} aim={aim} choosing={false} onAim={() => {}} />
        {fim === null && <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 8 }}>
            {ROT.map((r, z) => <button key={z} onClick={() => { setAim(z); if (modo === 'defende') decidir(z as Canto) }} style={{ ...box(aim === z ? GOLD : '#fff'), ...OSW, fontSize: 20, padding: '8px 0', cursor: 'pointer' }}>{r}</button>)}
          </div>
          {modo === 'bate' && <div style={{ marginTop: 8 }}><Botao disabled={aim === null} onClick={() => decidir(aim as Canto)}>⚽ CHUTAR</Botao></div>}
          <div style={{ ...OSW, fontSize: 13, color: GOLD, marginTop: 6 }}>⏱️ {seg}s</div>
        </>}
      </div>
    </div>
  )
}

// ── a partida ao vivo ───────────────────────────────────────────────────────────────────────────────────────
interface Pendente { min: number; tipo: LanceExterno['tipo'] }
function TelaPartida({ s, idA, idB, cartaMinha, titulo, aoFim }: { s: Save; idA: number; idB: number; cartaMinha: CartaKings | null; titulo: string; aoFim: (p: PartidaKings) => void }) {
  const A = s.times.find(t => t.id === idA)!, B = s.times.find(t => t.id === idB)!
  const euLado: 'A' | 'B' = A.humano ? 'A' : 'B'
  const rival = euLado === 'A' ? B : A
  const seed = useMemo(() => (s.seed ^ (idA * 7919 + idB * 104729 + s.rodada * 1299709 + (s.mata ? 999331 : 0))) >>> 0, []) // eslint-disable-line react-hooks/exhaustive-deps
  const ladoBot: 'A' | 'B' = euLado === 'A' ? 'B' : 'A'
  // o bot: pênalti do presidente num minuto sorteado + uma carta usada no 2º tempo
  const botPlano = useMemo(() => {
    const r = rngKings(seed ^ 0xbeef)
    const pres = presidenteBot(seed, ladoBot)
    const carta = CARTAS_KINGS[Math.floor(r() * 4)]
    const min = JANELA_CARTA[0] + Math.floor(r() * (JANELA_CARTA[1] - JANELA_CARTA[0]))
    return { pres, carta, min }
  }, [seed, ladoBot])
  const [externos, setExternos] = useState<LanceExterno[]>([])
  const [usos, setUsos] = useState<UsoCarta[]>(() => botPlano.carta === 'suspensao' || botPlano.carta === 'gol_dobro' ? [{ min: botPlano.min, lado: ladoBot, carta: botPlano.carta }] : [])
  const [pendentes] = useState<Pendente[]>(() => [{ min: botPlano.pres.min, tipo: 'presidente' }, ...(botPlano.carta === 'penalti' || botPlano.carta === 'shootout' ? [{ min: botPlano.min, tipo: (botPlano.carta === 'penalti' ? 'carta_penalti' : 'carta_shootout') as LanceExterno['tipo'] }] : [])])
  const [feitos, setFeitos] = useState<number[]>([]) // índices dos pendentes já resolvidos
  const [usouPres, setUsouPres] = useState(false)
  const [usouCarta, setUsouCarta] = useState(false)
  const [ms, setMs] = useState(0)
  const [pausa, setPausa] = useState<null | { tipo: string }>({ tipo: 'inicio' })
  const [vistos, setVistos] = useState<string[]>([])
  const [duelo, setDuelo] = useState<null | { titulo: string; modo: 'bate' | 'defende'; erro?: number; fim: (gol: boolean) => void }>(null)
  const [disputa, setDisputa] = useState<null | { a: number; b: number; i: number; vez: 'eu' | 'ele'; seq: boolean[][] }>(null)
  const [acabou, setAcabou] = useState(false)
  const min = Math.min(MIN_FIM, Math.floor(ms / MS_MIN) + 1)
  const p = useMemo(() => simulaPartidaKings({ idA, idB, forcaA: forcaDe(A), forcaB: forcaDe(B), seed, externos, usos, shootoutPronto: { a: 0, b: 0 } }), [externos, usos]) // eslint-disable-line react-hooks/exhaustive-deps
  const fimReal = p.golDeOuro ? (p.eventos.filter(e => e.tipo === 'gol').at(-1)?.min ?? MIN_FIM) : MIN_FIM
  const evAte = p.eventos.filter(e => e.min <= min)
  const placar = (lado: 'A' | 'B') => evAte.reduce((a, e) => a + (e.tipo === 'gol' && e.lado === lado ? e.vale : 0), 0)
  // relógio
  useEffect(() => {
    if (pausa || duelo || disputa || acabou) return
    const iv = setInterval(() => setMs(m => m + 250), 250)
    return () => clearInterval(iv)
  }, [pausa, duelo, disputa, acabou])
  // gatilhos por minuto: banners, lances do bot, fim
  useEffect(() => {
    if (pausa || duelo || disputa || acabou) return
    const mostra = (k: string) => { if (!vistos.includes(k)) { setVistos(v => [...v, k]); setPausa({ tipo: k }); return true } return false }
    if (min >= MIN_DADO && min < MIN_INTERVALO && mostra('dado')) return
    if (min >= MIN_INTERVALO && mostra('intervalo')) return
    if (min >= MIN_BOLA && fimReal >= MIN_BOLA && mostra('bola')) return
    const idx = pendentes.findIndex((q, i) => !feitos.includes(i) && q.min <= min)
    if (idx >= 0) {
      const q = pendentes[idx]
      setFeitos(f => [...f, idx])
      setDuelo({ titulo: q.tipo === 'presidente' ? `🎩 PÊNALTI DO PRESIDENTE · ${rival.nome}` : `🃏 CARTA DO ${rival.nome}: ${q.tipo === 'carta_penalti' ? 'PÊNALTI' : 'SHOOTOUT'}`, modo: 'defende', fim: gol => { setExternos(e => [...e, { min, lado: ladoBot, tipo: q.tipo, gol }]); setDuelo(null) } })
      return
    }
    if (min >= fimReal && ms >= fimReal * MS_MIN) {
      if (p.golsA === p.golsB) { if (mostra('shootout')) return; setDisputa({ a: 0, b: 0, i: 0, vez: 'eu', seq: [[], []] }); return }
      setAcabou(true)
    }
  }, [min, ms, pausa, duelo, disputa, acabou]) // eslint-disable-line react-hooks/exhaustive-deps
  // shootout final: 5 cobranças pra cada, alternando (você bate, depois defende); morte súbita
  useEffect(() => {
    if (!disputa || duelo) return
    const { a, b, i, vez, seq } = disputa
    const meu = euLado === 'A' ? a : b, dele = euLado === 'A' ? b : a
    // só confere nas viradas de rodada (os dois bateram `i` vezes): até a 5ª, decide quando não dá mais pra
    // alcançar; depois, morte súbita = o primeiro par de cobranças com placar diferente
    if (vez === 'eu' && i > 0) {
      const decidido = i >= 5 ? meu !== dele : Math.abs(meu - dele) > 5 - i
      if (decidido) { setAcabou(true); return }
    }
    setDuelo({ titulo: `🏃 SHOOTOUT · cobrança ${i + 1}${i >= 5 ? ' (morte súbita)' : ''}`, modo: vez === 'eu' ? 'bate' : 'defende', erro: 0.15, fim: gol => {
      setDuelo(null)
      const ns = { ...disputa, seq: [seq[0].slice(), seq[1].slice()] }
      const meuLadoIdx = euLado === 'A' ? 0 : 1
      if (vez === 'eu') { ns.seq[meuLadoIdx].push(gol); if (gol) { if (euLado === 'A') ns.a++; else ns.b++ } ns.vez = 'ele' }
      else { ns.seq[1 - meuLadoIdx].push(gol); if (gol) { if (euLado === 'A') ns.b++; else ns.a++ } ns.vez = 'eu'; ns.i = i + 1 }
      setDisputa(ns)
    } })
  }, [disputa, duelo]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!acabou) return
    const final = disputa ? simulaPartidaKings({ idA, idB, forcaA: forcaDe(A), forcaB: forcaDe(B), seed, externos, usos, shootoutPronto: { a: disputa.a, b: disputa.b } }) : p
    const t = setTimeout(() => aoFim(final), 2600)
    return () => clearTimeout(t)
  }, [acabou]) // eslint-disable-line react-hooks/exhaustive-deps

  const presAberto = !usouPres && min >= JANELA_PRESIDENTE[0] && min <= JANELA_PRESIDENTE[1] && !acabou
  const cartaAberta = !!cartaMinha && !usouCarta && min >= JANELA_CARTA[0] && min <= JANELA_CARTA[1] && !acabou
  const usarPres = () => { setUsouPres(true); if (!vistos.includes('dica-pres')) setVistos(v => [...v, 'dica-pres']); setDuelo({ titulo: '🎩 PÊNALTI DO PRESIDENTE · você bate!', modo: 'bate', fim: gol => { setExternos(e => [...e, { min, lado: euLado, tipo: 'presidente', gol }]); setDuelo(null) } }) }
  const usarCarta = () => {
    if (!cartaMinha) return
    setUsouCarta(true)
    if (cartaMinha === 'suspensao' || cartaMinha === 'gol_dobro') { setUsos(u => [...u, { min, lado: euLado, carta: cartaMinha }]); setPausa({ tipo: `carta-${cartaMinha}` }); return }
    setDuelo({ titulo: `🃏 SUA CARTA: ${cartaMinha === 'penalti' ? 'PÊNALTI' : 'SHOOTOUT'}`, modo: 'bate', erro: cartaMinha === 'shootout' ? 0.2 : 0, fim: gol => { setExternos(e => [...e, { min, lado: euLado, tipo: cartaMinha === 'penalti' ? 'carta_penalti' : 'carta_shootout', gol }]); setDuelo(null) } })
  }
  const BANNERS: Record<string, { ic: string; tag: string; titulo: string; texto: ReactNode; ms?: number }> = {
    inicio: { ic: '👑', tag: 'KINGS LEAGUE · ' + titulo, titulo: 'Bola rolando!', texto: <>Futebol 7, dois tempos de 20 min e <b>não tem empate</b>. Do minuto {JANELA_PRESIDENTE[0]} ao {JANELA_PRESIDENTE[1]} você tem o <b>🎩 pênalti do presidente</b> (1 por jogo) — o rival também tem o dele.</> },
    dado: { ic: '🎲', tag: `MINUTO ${MIN_DADO} · O DADO`, titulo: `Saiu ${p.eventos.find(e => e.tipo === 'dado')?.tipo === 'dado' ? (p.eventos.find(e => e.tipo === 'dado') as { jogadores: number }).jogadores : 3}!`, texto: <>Até o fim do 1º tempo, cada time joga com só <b>{(p.eventos.find(e => e.tipo === 'dado') as { jogadores: number } | undefined)?.jogadores ?? 3} jogadores</b>. Menos gente = mais espaço = <b>mais gol</b>!</> },
    intervalo: { ic: '⏸️', tag: 'INTERVALO', titulo: 'Agora vale a carta secreta', texto: cartaMinha ? <>No 2º tempo (até o minuto {JANELA_CARTA[1]}) aperte <b>🃏 USAR CARTA</b>: a sua é <b>{NOME_CARTA[cartaMinha].ic} {NOME_CARTA[cartaMinha].nome}</b> — {NOME_CARTA[cartaMinha].txt}. O rival também tem uma, e você não sabe qual.</> : <>Você não escolheu carta no vestiário, mas o <b>rival tem uma</b> e pode usar a qualquer momento do 2º tempo.</>, ms: KINGS_MS_INTERVALO },
    bola: (p.eventos.find(e => e.tipo === 'bola') as { cor?: string } | undefined)?.cor !== 'vermelha'
      ? { ic: '🟡', tag: `MINUTO ${MIN_BOLA} · TÁ EMPATADO`, titulo: 'BOLA DOURADA!', texto: <>Agora é <b>gol de ouro</b>: quem marcar primeiro <b>vence na hora</b>. Se ninguém marcar, vai pro <b>shootout</b>.</> }
      : { ic: '🔴', tag: `MINUTO ${MIN_BOLA} · TEM TIME NA FRENTE`, titulo: 'BOLA VERMELHA!', texto: <>Até o apito, <b>todo gol vale 2</b>. Dá pra virar!</> },
    shootout: { ic: '🏃', tag: 'FIM DE JOGO · EMPATE', titulo: 'SHOOTOUT!', texto: <>Na Kings League não tem empate. São <b>5 cobranças pra cada</b>: você bate uma e defende a do rival, alternando. Empatou de novo? <b>Morte súbita</b>. Quem vence leva 2 pontos, quem perde leva 1.</> },
    'carta-suspensao': { ic: '🟥', tag: 'CARTA USADA', titulo: 'Suspensão!', texto: <>Um jogador do <b>{rival.nome}</b> fica <b>4 minutos fora</b>. Hora de atacar!</> },
    'carta-gol_dobro': { ic: '✖️2', tag: 'CARTA USADA', titulo: 'Gol em dobro!', texto: <>Por <b>4 minutos</b>, todo gol seu vale <b>2</b>.</> },
  }
  const b = pausa ? BANNERS[pausa.tipo] : null
  const eventos = [...evAte].reverse()
  const ROTULO: Record<string, string> = { jogada: '', presidente: ' (🎩 pênalti do presidente)', carta_penalti: ' (🃏 pênalti da carta)', carta_shootout: ' (🃏 shootout da carta)' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', background: INK, color: '#fff', borderRadius: 14, padding: 10, gap: 6 }}>
        <div style={{ flex: 1, ...OSW, fontSize: 13, textTransform: 'none' }}>{A.nome}{A.humano ? ' 🟢' : ''}</div>
        <div style={{ ...OSW, fontSize: 34, color: GOLD }}>{placar('A')}</div>
        <div style={{ ...OSW, fontSize: 15, background: RED, borderRadius: 8, padding: '3px 8px' }}>{acabou || min >= fimReal ? 'FIM' : `${min}'`}</div>
        <div style={{ ...OSW, fontSize: 34, color: GOLD }}>{placar('B')}</div>
        <div style={{ flex: 1, ...OSW, fontSize: 13, textAlign: 'right', textTransform: 'none' }}>{B.humano ? '🟢 ' : ''}{B.nome}</div>
      </div>
      {disputa && <div style={{ ...box('#FFF3C4'), padding: 8, textAlign: 'center', ...OSW, fontSize: 15 }}>🏃 SHOOTOUT · {disputa.a} × {disputa.b}</div>}
      <div style={{ ...box('#1a8042'), padding: 8, minHeight: 190, display: 'flex', flexDirection: 'column', gap: 5, background: 'repeating-linear-gradient(90deg,#1f8f4a 0 30px,#1a8042 30px 60px)' }}>
        {eventos.length === 0 && <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, textAlign: 'center', marginTop: 70 }}>⚽ bola rolando…</div>}
        {eventos.slice(0, 7).map((e, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,.93)', border: `2px solid ${INK}`, borderRadius: 9, ...OSW, fontSize: 12.5, padding: '4px 8px', textTransform: 'none' }}>
            {e.tipo === 'gol' ? `⚽ ${e.min}' GOL do ${e.lado === 'A' ? A.nome : B.nome}${e.vale === 2 ? ' — VALE 2!' : ''}${ROTULO[e.origem]}`
              : e.tipo === 'dado' ? `🎲 ${e.min}' dado: ${e.jogadores} por time até o intervalo`
              : e.tipo === 'bola' ? `${e.cor === 'dourada' ? '🟡' : '🔴'} ${e.min}' bola ${e.cor}`
              : e.tipo === 'carta' ? `🃏 ${e.min}' ${e.lado === 'A' ? A.nome : B.nome} usou a carta ${NOME_CARTA[e.carta].nome}`
              : `❌ ${e.min}' ${e.lado === 'A' ? A.nome : B.nome} perdeu o ${e.origem === 'presidente' ? 'pênalti do presidente' : 'lance da carta'}`}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button disabled={!cartaAberta} onClick={usarCarta} style={{ ...box(cartaAberta ? PURPLE : '#d9d1bb'), color: cartaAberta ? '#fff' : 'rgba(0,0,0,.45)', ...OSW, fontSize: 14, padding: '10px 6px' }}>
          🃏 USAR CARTA<div style={{ fontFamily: 'Arial', fontWeight: 700, fontSize: 10.5, textTransform: 'none' }}>{!cartaMinha ? 'sem carta nesta rodada' : usouCarta ? 'já usada' : min < JANELA_CARTA[0] ? `libera no 2º tempo · ${NOME_CARTA[cartaMinha].nome}` : `${NOME_CARTA[cartaMinha].nome} · até o min ${JANELA_CARTA[1]}`}</div>
        </button>
        <button disabled={!presAberto} onClick={usarPres} style={{ ...box(presAberto ? RED : '#d9d1bb'), color: presAberto ? '#fff' : 'rgba(0,0,0,.45)', ...OSW, fontSize: 14, padding: '10px 6px' }}>
          🎩 PÊNALTI DO PRESIDENTE<div style={{ fontFamily: 'Arial', fontWeight: 700, fontSize: 10.5, textTransform: 'none' }}>{usouPres ? 'já usado' : min < JANELA_PRESIDENTE[0] ? `libera no min ${JANELA_PRESIDENTE[0]}` : min > JANELA_PRESIDENTE[1] ? 'acabou o prazo' : 'você bate! · 1 por jogo'}</div>
        </button>
      </div>
      {acabou && <div style={{ ...box(GOLD), padding: 10, textAlign: 'center', ...OSW, fontSize: 18 }}>🏁 FIM DE JOGO</div>}
      {b && <Banner key={pausa!.tipo} ic={b.ic} tag={b.tag} titulo={b.titulo} texto={b.texto} ms={b.ms ?? KINGS_MS_BANNER} aoFim={() => setPausa(null)} />}
      {duelo && <Duelo key={`${duelo.titulo}${min}${disputa?.i ?? ''}${disputa?.vez ?? ''}`} titulo={duelo.titulo} modo={duelo.modo} extraErro={duelo.erro} aoFim={duelo.fim} />}
    </div>
  )
}

// ── vestiário ───────────────────────────────────────────────────────────────────────────────────────────────
function Vestiario({ titulo, rival, aoFim }: { titulo: string; rival: string; aoFim: (c: CartaKings | null) => void }) {
  const [sel, setSel] = useState<CartaKings | null>(null)
  const [seg, setSeg] = useState(Math.round(KINGS_MS_VESTIARIO / 1000))
  useEffect(() => { if (seg <= 0) { aoFim(sel); return } const t = setTimeout(() => setSeg(x => x - 1), 1000); return () => clearTimeout(t) }, [seg]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ ...OSW, fontSize: 24 }}>🚪 Vestiário · {titulo}</div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>Seu jogo: contra <b>{rival}</b></div>
      <div style={{ ...box('#FFF3C4'), padding: 8, textAlign: 'center', ...OSW, fontSize: 15 }}>⏱️ {seg}s pra escolher</div>
      <div style={{ ...OSW, fontSize: 13, color: 'rgba(0,0,0,.6)' }}>🃏 Escolha sua carta secreta</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {CARTAS_KINGS.map(c => (
          <button key={c} onClick={() => setSel(c)} style={{ ...box(sel === c ? PURPLE : '#fff'), color: sel === c ? '#fff' : INK, padding: '10px 6px', textAlign: 'center', boxShadow: sel === c ? `0 0 0 3px ${GOLD},3px 3px 0 ${INK}` : `3px 3px 0 ${INK}` }}>
            <div style={{ fontSize: 28 }}>{NOME_CARTA[c].ic}</div>
            <div style={{ ...OSW, fontSize: 15 }}>{NOME_CARTA[c].nome}</div>
            <div style={{ fontSize: 10.5, fontWeight: 700 }}>{NOME_CARTA[c].txt}</div>
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, background: '#fff', border: `2px dashed ${PURPLE}`, borderRadius: 10, padding: '8px 10px', lineHeight: 1.4 }}>🤫 O rival não vê qual você pegou. Você usa no <b>2º tempo</b>, quando quiser, num botão. Não escolheu no tempo = fica sem carta.</div>
      <Botao bg={GREEN} cor="#fff" onClick={() => aoFim(sel)}>{sel ? `✅ PRONTO · ${NOME_CARTA[sel].nome.toUpperCase()}` : '✅ PRONTO (sem carta)'}</Botao>
    </div>
  )
}

function Tabela({ s }: { s: Save }) {
  const ord = ordenaKings(s.tabela)
  return (
    <div style={{ ...box('#fff'), overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', padding: 8, borderBottom: `2px solid ${INK}` }}>
        {([['✅ vitória', PONTOS_KINGS.vitoria], ['🎯 vitória no shootout', PONTOS_KINGS.vitoria_shootout], ['😬 derrota no shootout', PONTOS_KINGS.derrota_shootout], ['❌ derrota', PONTOS_KINGS.derrota]] as const).map(([t, n]) => <span key={t} style={{ fontSize: 10.5, fontWeight: 800, background: CREAM, border: `2px solid ${INK}`, borderRadius: 7, padding: '1px 6px' }}>{t} <b>{n}</b></span>)}
      </div>
      {ord.map((l, i) => (
        <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 9px', borderTop: i ? '1px solid #eee' : 'none', background: i === 0 ? '#FFE79A' : i < 7 ? '#e6f4ea' : '#fff', color: i >= 7 ? '#8a8577' : INK }}>
          <span style={{ ...OSW, fontSize: 13, width: 20 }}>{i + 1}</span>
          <span style={{ flex: 1, ...OSW, fontSize: 14, textTransform: 'none' }}>{l.nome}{l.id === 0 ? ' 🟢' : ''}</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{l.j}J · SG {l.gp - l.gc > 0 ? '+' : ''}{l.gp - l.gc}</span>
          <span style={{ ...OSW, fontSize: 15, width: 26, textAlign: 'right' }}>{l.pts}</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 5, padding: 8, borderTop: `2px solid ${INK}`, flexWrap: 'wrap' }}>
        <span style={{ ...OSW, fontSize: 10.5, background: '#FFE79A', border: `2px solid ${INK}`, borderRadius: 7, padding: '1px 6px' }}>1º direto na SEMI</span>
        <span style={{ ...OSW, fontSize: 10.5, background: '#e6f4ea', border: `2px solid ${INK}`, borderRadius: 7, padding: '1px 6px' }}>2º–7º QUARTAS</span>
        <span style={{ ...OSW, fontSize: 10.5, background: '#eee', border: `2px solid ${INK}`, borderRadius: 7, padding: '1px 6px' }}>8º–10º fora</span>
      </div>
    </div>
  )
}

// ── o jogo inteiro ──────────────────────────────────────────────────────────────────────────────────────────
export default function KingsLeagueRapida({ managers, seed, aoSair, aoNovo }: { managers: Manager[]; seed: number; aoSair: () => void; aoNovo: () => void }) {
  // o campeonato é DESTE leilão (mesma semente): voltou de outro leilão = campeonato novo
  const [s, setSRaw] = useState<Save | null>(() => {
    try { const r = localStorage.getItem(SAVE); const j = r ? JSON.parse(r) as Save : null; if (j?.v === 2 && j.seed === seed) return j } catch { /* sem save */ }
    return novoCampeonato(managers, seed)
  })
  const setS = (n: Save) => { setSRaw(n); try { localStorage.setItem(SAVE, JSON.stringify(n)) } catch { /* sem espaço: segue só na memória */ } }
  const [etapa, setEtapa] = useState<'menu' | 'vestiario' | 'jogo' | 'pos'>('menu')
  const [carta, setCarta] = useState<CartaKings | null>(null)
  const [ultimos, setUltimos] = useState<PartidaKings[]>([])
  const [regras, setRegras] = useState(() => !s || (s.rodada === 0 && s.fase === 'liga'))
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])

  // o meu jogo desta rodada / desta etapa do mata-mata
  const meuJogo = (st: Save): [number, number] | null => {
    if (st.fase === 'liga') return st.cal[st.rodada]?.find(([a, b]) => a === 0 || b === 0) ?? null
    if (st.fase === 'mata' && st.mata) return st.mata.jogos.find(([a, b]) => a === 0 || b === 0) ?? null
    return null
  }
  const simBot = (st: Save, a: number, b: number, salt: number): PartidaKings => {
    const A = st.times.find(t => t.id === a)!, B = st.times.find(t => t.id === b)!
    const seed = (st.seed ^ (a * 7919 + b * 104729 + salt)) >>> 0
    const r = rngKings(seed ^ 0xcafe)
    const usos: UsoCarta[] = [], externos: LanceExterno[] = [presidenteBot(seed, 'A'), presidenteBot(seed, 'B')]
    for (const lado of ['A', 'B'] as const) {
      const c = CARTAS_KINGS[Math.floor(r() * 4)], m = JANELA_CARTA[0] + Math.floor(r() * 15)
      if (c === 'suspensao' || c === 'gol_dobro') usos.push({ min: m, lado, carta: c })
      else externos.push({ min: m, lado, tipo: c === 'penalti' ? 'carta_penalti' : 'carta_shootout', gol: r() < (c === 'penalti' ? 0.75 : 0.55) })
    }
    return simulaPartidaKings({ idA: a, idB: b, forcaA: forcaDe(A), forcaB: forcaDe(B), seed, externos, usos })
  }
  const vencedor = (p: PartidaKings) => (p.resultadoA === 'vitoria' || p.resultadoA === 'vitoria_shootout' ? p.idA : p.idB)

  const fechaRodada = (st: Save, minha: PartidaKings | null) => {
    if (st.fase === 'liga') {
      const jogos = st.cal[st.rodada].map(([a, b]) => (minha && (a === 0 || b === 0) ? minha : simBot(st, a, b, st.rodada * 1299709)))
      const tab = st.tabela.map(l => ({ ...l }))
      jogos.forEach(j => anotaJogoKings(tab, j))
      const prox = st.rodada + 1
      let ns: Save = { ...st, tabela: tab, resultados: [...st.resultados, jogos], rodada: prox }
      if (prox >= st.cal.length) {
        const ord = ordenaKings(tab).map(l => l.id)
        const ch = chaveKings(ord)
        ns = { ...ns, fase: 'mata', mata: { etapa: 'quartas', jogos: ch.quartas, semiDireto: ch.semiDireto, venc: [], feitos: [] } }
      }
      setUltimos(jogos); setS(ns); setEtapa('pos')
      return
    }
    if (st.fase === 'mata' && st.mata) {
      const m = st.mata
      const jogos = m.jogos.map(([a, b], i) => (minha && (a === 0 || b === 0) ? minha : simBot(st, a, b, 999331 + i + (m.etapa === 'semi' ? 77 : m.etapa === 'final' ? 177 : 0))))
      const venc = jogos.map(vencedor)
      let ns: Save
      if (m.etapa === 'quartas') ns = { ...st, mata: { etapa: 'semi', jogos: semisKings(m.semiDireto!, venc as [number, number, number]), venc, feitos: jogos } }
      else if (m.etapa === 'semi') ns = { ...st, mata: { etapa: 'final', jogos: [[venc[0], venc[1]]], venc, feitos: jogos } }
      else ns = { ...st, fase: 'fim', campeao: venc[0], mata: { ...m, venc, feitos: jogos } }
      setUltimos(jogos); setS(ns); setEtapa('pos')
    }
  }
  const avancar = () => {
    if (!s) return
    const mj = meuJogo(s)
    if (mj) { setEtapa('vestiario'); return }
    fechaRodada(s, null) // você não joga (eliminado/fora): a rodada roda sozinha
  }
  const nome = (id: number) => s?.times.find(t => t.id === id)?.nome ?? '?'
  const tituloEtapa = !s ? '' : s.fase === 'liga' ? `rodada ${s.rodada + 1} de ${s.cal.length}` : s.mata ? (s.mata.etapa === 'quartas' ? 'quartas de final' : s.mata.etapa === 'semi' ? 'semifinal' : 'FINAL') : ''

  let corpo: ReactNode = null
  if (!s || regras) corpo = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...box(INK), color: '#fff', padding: 14 }}>
        <div style={{ ...OSW, fontSize: 30, color: GOLD }}>👑 Kings League</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, opacity: .9 }}>Partida rápida · regras da Kings League Brasil · <b>teste: só você vê</b></div>
      </div>
      <div style={{ ...box('#fff'), padding: 12, fontSize: 13, fontWeight: 700, lineHeight: 1.6 }}>
        <div>⚽ <b>Futebol 7</b>: seu time do leilão, com <b>goleiro + 6</b> (2 zagueiros, 2 meias, 2 atacantes)</div>
        <div>🏆 <b>10 times</b>, todos contra todos (9 rodadas). Pontos: vitória <b>3</b> · vitória no shootout <b>2</b> · derrota no shootout <b>1</b> · derrota <b>0</b></div>
        <div>🥇 <b>1º direto na semi</b> · 2º ao 7º jogam as quartas</div>
        <div>🎲 <b>Minuto 18</b>: o dado decide 2 ou 3 por time até o intervalo</div>
        <div>🃏 <b>Carta secreta</b> no 2º tempo · 🎩 <b>pênalti do presidente</b> (você bate!)</div>
        <div>🟡🔴 <b>Minuto 38</b>: bola dourada (gol de ouro) ou vermelha (gol vale 2)</div>
        <div>🚫 <b>Não tem empate</b>: shootout</div>
        <div style={{ color: GREEN, marginTop: 4 }}>Calma: o jogo explica cada regra na hora que ela acontece. 😉</div>
      </div>
      <Botao bg={GREEN} cor="#fff" onClick={() => setRegras(false)}>{s && s.rodada > 0 ? '▶️ CONTINUAR O CAMPEONATO' : '👑 BORA PRA 1ª RODADA'}</Botao>
    </div>
  )
  else if (etapa === 'vestiario') { const mj = meuJogo(s)!; corpo = <Vestiario titulo={tituloEtapa} rival={nome(mj[0] === 0 ? mj[1] : mj[0])} aoFim={c => { setCarta(c); setEtapa('jogo') }} /> }
  else if (etapa === 'jogo') { const mj = meuJogo(s)!; corpo = <TelaPartida key={`${s.rodada}-${s.mata?.etapa ?? ''}`} s={s} idA={mj[0]} idB={mj[1]} cartaMinha={carta} titulo={tituloEtapa} aoFim={p => fechaRodada(s, p)} /> }
  else if (s.fase === 'fim') corpo = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...box(`linear-gradient(160deg,#FFE79A,${GOLD} 40%,#E8A200 70%,#FFDD70)`), padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 50 }}>🏆</div>
        <div style={{ ...OSW, fontSize: 14, letterSpacing: '.14em' }}>CAMPEÃO DA KINGS LEAGUE</div>
        <div style={{ ...OSW, fontSize: 30, textTransform: 'none' }}>{nome(s.campeao!)}{s.campeao === 0 ? ' 🟢' : ''}</div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{s.campeao === 0 ? 'É SEU! Que campanha!' : 'Não foi dessa vez — bora outra?'}</div>
      </div>
      {ultimos.length > 0 && <div style={{ ...box('#fff'), padding: 10, fontSize: 13, fontWeight: 700 }}>Final: {nome(ultimos[0].idA)} {ultimos[0].golsA} × {ultimos[0].golsB} {nome(ultimos[0].idB)}{ultimos[0].shootout ? ` (shootout ${ultimos[0].shootout.a} × ${ultimos[0].shootout.b})` : ''}</div>}
      <Tabela s={s} />
      <Botao bg={GREEN} cor="#fff" onClick={aoNovo}>🔁 JOGAR DE NOVO (novo leilão)</Botao>
    </div>
  )
  else corpo = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {etapa === 'pos' && ultimos.length > 0 && (
        <div style={{ ...box('#fff'), padding: 10 }}>
          <div style={{ ...OSW, fontSize: 15 }}>📺 Resultados</div>
          {ultimos.map((j, i) => (
            <div key={i} style={{ fontSize: 12.5, fontWeight: 700, padding: '4px 0', borderTop: i ? '1px solid #eee' : 'none', background: j.idA === 0 || j.idB === 0 ? '#FFF3C4' : 'transparent' }}>
              {nome(j.idA)} <b>{j.golsA} × {j.golsB}</b> {nome(j.idB)}{j.shootout ? ` · shootout ${j.shootout.a}×${j.shootout.b}` : ''}{j.golDeOuro ? ' · 🟡 gol de ouro' : ''}
            </div>
          ))}
        </div>
      )}
      {s.fase === 'mata' && s.mata && (
        <div style={{ ...box(INK), color: '#fff', padding: 12 }}>
          <div style={{ ...OSW, color: GOLD, fontSize: 13 }}>🏆 MATA-MATA · {tituloEtapa}</div>
          {s.mata.etapa === 'quartas' && <div style={{ fontSize: 12, fontWeight: 700, opacity: .85 }}>🥇 {nome(s.mata.semiDireto!)} já está na semi (1º da liga)</div>}
          {s.mata.jogos.map(([a, b], i) => <div key={i} style={{ ...OSW, fontSize: 15, textTransform: 'none', marginTop: 4 }}>{nome(a)} × {nome(b)}</div>)}
          {!meuJogo(s) && <div style={{ fontSize: 12, fontWeight: 700, color: s.mata.semiDireto === 0 && s.mata.etapa === 'quartas' ? GOLD : '#ff9a8a', marginTop: 6 }}>{s.mata.semiDireto === 0 && s.mata.etapa === 'quartas' ? '🥇 Você já está na SEMI! As quartas rodam sozinhas.' : 'Você não está nesta fase — os jogos rodam sozinhos.'}</div>}
        </div>
      )}
      <Botao bg={GREEN} cor="#fff" onClick={avancar}>{meuJogo(s) ? `▶️ ${s.fase === 'liga' ? `JOGAR A RODADA ${s.rodada + 1}` : `JOGAR A ${tituloEtapa.toUpperCase()}`}` : '⏩ VER OS JOGOS DESTA FASE'}</Botao>
      <Tabela s={s} />
      <div style={{ ...OSW, fontSize: 13, color: 'rgba(0,0,0,.6)' }}>🔨 Seu time</div>
      <CampinhoKings elenco={s.times[0].elenco} tier={tier} />
    </div>
  )

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: CREAM, color: INK, overflowY: 'auto' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <button onClick={aoSair} style={{ ...box('#fff'), ...OSW, fontSize: 13, padding: '5px 10px' }}>‹ SAIR</button>
          <span style={{ ...OSW, fontSize: 14 }}>👑 KINGS LEAGUE{s && !regras ? ` · ${tituloEtapa}` : ''}</span>
          {s && !regras && etapa !== 'jogo' && <button onClick={() => setRegras(true)} style={{ ...box('#fff'), ...OSW, fontSize: 12, padding: '5px 8px' }}>📖 REGRAS</button>}
        </div>
        {corpo}
      </div>
    </div>,
    document.body,
  )
}
