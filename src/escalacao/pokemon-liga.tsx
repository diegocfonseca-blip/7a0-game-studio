// ⚡ MODO POKÉMON — a LIGA DE BATALHAS depois da cerimônia (25/10, partida rápida, só a conta do Diego, em teste).
// Regras fechadas com ele (`docs/conceito-pokemon.md`):
//  · antes de CADA batalha: escolhe 3 dos 6, a ORDEM em que entram e a tática — 12 segundos (quem não escolhe entra com
//    a escalação anterior; ninguém espera);
//  · do rival BOT aparecem só os TIPOS dos 6 (de gente, nada — tem que lembrar da cerimônia);
//  · a batalha roda sozinha, golpe a golpe ("quem ganha fica"); a tabela só mexe DEPOIS que ela acaba (anti-spoiler);
//  · 10 treinadores, liga só de ida (9 rodadas), semifinal 1×4 / 2×3 e final, tudo jogo único.
// O motor é puro (`pokemon-batalha.ts`); esta tela só escolhe, anima e grava (`POKE_SET`, que vai no save).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useEsc } from './store'
import { tr, getLang } from './lang'
import { Box, Btn } from './ui-primitives'
import { POKEMONS, COR_TIPO, type TipoPoke } from './pokemon-dados'
import { ArtePoke, ChipsTipo, TipoIcone, nomeTipo } from './pokemon-arte'
import { batalha, escolhaBot, rngPoke, ordenaPoke, anotaBatalha, type LutadorPoke, type TaticaPoke, type PokeLigaEstado, type BatalhaFeita, type EscalaPoke, type EventoPoke } from './pokemon-batalha'
import { calendarioKings } from './kings'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#E8503A', CREME = '#F4ECD6'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900 } as const
const ESCOLHA_S = 12
const POR_NOME = new Map(POKEMONS.map(p => [p.nome, p]))
const TATICAS: [TaticaPoke, string, string][] = [['agressivo', '🔥 Agressivo', '🔥 Aggressive'], ['equilibrio', '⚖️ Equilíbrio', '⚖️ Balanced'], ['defensivo', '🛡️ Defensivo', '🛡️ Defensive']]
const NOME_GOLPE: Record<TipoPoke, [string, string]> = {
  Normal: ['Investida', 'Tackle'], Fogo: ['Lança-Chamas', 'Flamethrower'], Água: ['Hidro Bomba', 'Hydro Pump'], Planta: ['Folha Navalha', 'Razor Leaf'],
  Elétrico: ['Choque do Trovão', 'Thunderbolt'], Gelo: ['Raio de Gelo', 'Ice Beam'], Lutador: ['Golpe de Karatê', 'Karate Chop'], Veneno: ['Bomba de Lodo', 'Sludge Bomb'],
  Terra: ['Terremoto', 'Earthquake'], Voador: ['Ataque de Asa', 'Wing Attack'], Psíquico: ['Psíquico', 'Psychic'], Inseto: ['Tesoura X', 'X-Scissor'],
  Pedra: ['Deslize de Pedras', 'Rock Slide'], Fantasma: ['Bola Sombria', 'Shadow Ball'], Dragão: ['Garra de Dragão', 'Dragon Claw'], Sombrio: ['Mordida', 'Bite'],
  Aço: ['Cauda de Ferro', 'Iron Tail'], Fada: ['Brilho Mágico', 'Dazzling Gleam'],
}

type Fase = 'escolha' | 'batalha' | 'resultado'

export default function PokemonLiga() {
  const { state, dispatch } = useEsc()
  const en = getLang() === 'en'
  const you = state.managers[state.youIdx]
  const liga = state.pokeLiga

  // 🆕 a liga nasce na 1ª vez que a tela abre (depois da cerimônia)
  useEffect(() => {
    if (liga) return
    const ids = state.managers.map(m => m.id)
    const nova: PokeLigaEstado = {
      ids, cal: calendarioKings(ids), rodada: 0, feitas: [],
      tabela: state.managers.map(m => ({ id: m.id, nome: m.teamName, j: 0, v: 0, d: 0, pts: 0, nocP: 0, nocC: 0 })),
    }
    dispatch({ type: 'POKE_SET', liga: nova })
  }, [liga, state.managers, dispatch])

  const lutadoresDe = (mgrId: number): LutadorPoke[] => {
    const m = state.managers.find(x => x.id === mgrId)
    return (m?.squad ?? []).filter(c => !c.fake && POR_NOME.has(c.name)).map(c => ({ id: c.id, nome: c.name, tipos: POR_NOME.get(c.name)!.tipos, lo: c.lo, hi: c.hi }))
  }
  const nomeDe = (id: number) => state.managers.find(m => m.id === id)?.teamName ?? '?'

  // os confrontos da rodada atual (liga 0..8 · semis 9 · final 10)
  const confrontos = useMemo((): [number, number][] => {
    if (!liga) return []
    if (liga.rodada <= 8) return liga.cal[liga.rodada]
    if (liga.rodada === 9) { const o = ordenaPoke(liga.tabela); return [[o[0].id, o[3].id], [o[1].id, o[2].id]] }
    if (liga.rodada === 10) { const s = liga.feitas[9] ?? []; const w = s.map(b => b.vencedor === 'a' ? b.a : b.b); return w.length === 2 ? [[w[0], w[1]]] : [] }
    return []
  }, [liga])
  const meuJogo = confrontos.find(([a, b]) => a === you.id || b === you.id)
  const rivalId = meuJogo ? (meuJogo[0] === you.id ? meuJogo[1] : meuJogo[0]) : null

  const [fase, setFase] = useState<Fase>('escolha')
  const [sel, setSel] = useState<string[]>([])
  const [tat, setTat] = useState<TaticaPoke>(liga?.minha?.tatica ?? 'equilibrio')
  const [falta, setFalta] = useState(ESCOLHA_S)
  const [rodadaFeita, setRodadaFeita] = useState<BatalhaFeita[] | null>(null)
  const meus = lutadoresDe(you.id)

  // ⏱️ 12 segundos pra escolher; se acabar, entra com a última escalação (ou os 3 melhores)
  useEffect(() => {
    if (!liga || fase !== 'escolha' || liga.rodada > 10) return
    setFalta(ESCOLHA_S)
    const t0 = Date.now()
    const iv = setInterval(() => setFalta(Math.max(0, ESCOLHA_S - Math.floor((Date.now() - t0) / 1000))), 250)
    return () => clearInterval(iv)
  }, [liga?.rodada, fase]) // eslint-disable-line react-hooks/exhaustive-deps
  const confirmarRef = useRef<() => void>(() => {})
  useEffect(() => { if (fase === 'escolha' && falta === 0) confirmarRef.current() }, [falta, fase])

  if (!liga) return <div style={{ padding: 40, textAlign: 'center', fontSize: 48 }}>⚡</div>
  const acabou = liga.rodada > 10 || (liga.rodada === 10 && confrontos.length === 0)

  const escalaPadrao = (): EscalaPoke => {
    const valida = liga.minha?.ids.filter(id => meus.some(m => m.id === id)) ?? []
    const ids = valida.length === 3 ? valida : [...meus].sort((x, y) => (y.lo + y.hi) - (x.lo + x.hi)).slice(0, 3).map(m => m.id)
    return { ids, tatica: tat }
  }
  // 🎲 joga a rodada INTEIRA (todas as batalhas) — a tabela só é gravada no fim da animação
  const jogarRodada = (minha: EscalaPoke) => {
    const r = liga.rodada
    const feitas: BatalhaFeita[] = confrontos.map(([a, b], k) => {
      const seed = (state.seed ?? 1) + r * 1000 + k * 37
      const la = lutadoresDe(a), lb = lutadoresDe(b)
      const ea = a === you.id ? minha : escolhaBot(la, lb, rngPoke(seed + 1))
      const eb = b === you.id ? minha : escolhaBot(lb, la, rngPoke(seed + 2))
      const pick = (t: LutadorPoke[], ids: string[]) => ids.map(id => t.find(x => x.id === id)).filter((x): x is LutadorPoke => !!x)
      const ta = pick(la, ea.ids), tb = pick(lb, eb.ids)
      if (!ta.length || !tb.length) return { a, b, vencedor: ta.length ? 'a' : 'b', nocA: ta.length ? 3 : 0, nocB: ta.length ? 0 : 3, seed, escA: ea, escB: eb }
      const res = batalha({ nome: nomeDe(a), time: ta, tatica: ea.tatica }, { nome: nomeDe(b), time: tb, tatica: eb.tatica }, seed)
      return { a, b, vencedor: res.vencedor, nocA: res.nocA, nocB: res.nocB, seed, escA: ea, escB: eb }
    })
    setRodadaFeita(feitas)
    setFase(meuJogo ? 'batalha' : 'resultado')
  }
  confirmarRef.current = () => {
    if (fase !== 'escolha') return
    const minha: EscalaPoke = sel.length === 3 ? { ids: sel, tatica: tat } : escalaPadrao()
    jogarRodada(minha)
  }
  // 📋 grava a rodada (tabela, quem passou) e segue
  const fecharRodada = () => {
    if (!rodadaFeita) return
    const r = liga.rodada
    const tabela = liga.tabela.map(l => ({ ...l }))
    if (r <= 8) for (const b of rodadaFeita) anotaBatalha(tabela, b.a, b.b, b)
    const feitas = [...liga.feitas]; feitas[r] = rodadaFeita
    const minhaB = rodadaFeita.find(b => b.a === you.id || b.b === you.id)
    const minha = minhaB ? (minhaB.a === you.id ? minhaB.escA : minhaB.escB) : liga.minha
    const prox = r + 1
    const campeao = r === 10 ? (rodadaFeita[0].vencedor === 'a' ? rodadaFeita[0].a : rodadaFeita[0].b) : liga.campeao
    dispatch({ type: 'POKE_SET', liga: { ...liga, tabela, feitas, rodada: prox, minha, campeao } })
    setRodadaFeita(null); setSel(minha?.ids.filter(id => meus.some(m => m.id === id)) ?? []); setFase('escolha')
  }

  const titulo = liga.rodada <= 8 ? `${tr('RODADA', 'ROUND')} ${liga.rodada + 1}/9` : liga.rodada === 9 ? tr('SEMIFINAL', 'SEMIFINAL') : liga.rodada === 10 ? tr('FINAL', 'FINAL') : tr('FIM', 'END')

  return (
    <div style={{ minHeight: '100vh', background: CREME, color: INK, padding: '16px 14px 60px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: RED, letterSpacing: '.06em' }}>⚡ {tr('LIGA POKÉMON', 'POKÉMON LEAGUE')} · {titulo}</p>
          <h1 style={{ ...OSW, margin: 0, fontSize: 34, lineHeight: 1, textTransform: 'uppercase' }}>{acabou ? tr('🏆 Campeão', '🏆 Champion') : fase === 'escolha' ? tr('Sua escalação', 'Your line-up') : fase === 'batalha' ? tr('Batalha', 'Battle') : tr('Resultado', 'Result')}</h1>
        </div>

        {acabou && <Campeao nome={nomeDe(liga.campeao ?? liga.tabela[0].id)} voce={liga.campeao === you.id} onSair={() => dispatch({ type: 'GO_LOBBY' })} />}

        {!acabou && fase === 'escolha' && (meuJogo && rivalId != null ? (
          <Escolha meus={meus} sel={sel} setSel={setSel} tat={tat} setTat={setTat} falta={falta}
            rival={nomeDe(rivalId)} rivalTipos={state.managers.find(m => m.id === rivalId)?.isHuman ? null : lutadoresDe(rivalId).map(l => l.tipos)}
            onPronto={() => confirmarRef.current()} />
        ) : (
          <Box className="p-4"><p style={{ ...OSW, fontSize: 18, margin: 0 }}>{tr('Você ficou de fora desta fase.', 'You are out of this round.')}</p>
            <p style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 10px' }}>{tr('Os outros treinadores batalham — dá pra assistir o resultado.', 'The other trainers battle — you can see the result.')}</p>
            <Btn onClick={() => jogarRodada(escalaPadrao())}>{tr('▶ Ver a rodada', '▶ See the round')}</Btn></Box>
        ))}

        {!acabou && fase === 'batalha' && rodadaFeita && meuJogo && (() => {
          const b = rodadaFeita.find(x => x.a === you.id || x.b === you.id)!
          const pick = (mgr: number, e: EscalaPoke) => e.ids.map(id => lutadoresDe(mgr).find(x => x.id === id)).filter((x): x is LutadorPoke => !!x)
          const ta = pick(b.a, b.escA), tb = pick(b.b, b.escB)
          const res = batalha({ nome: nomeDe(b.a), time: ta, tatica: b.escA.tatica }, { nome: nomeDe(b.b), time: tb, tatica: b.escB.tatica }, b.seed)
          return <BatalhaAoVivo key={`${liga.rodada}`} nomeA={nomeDe(b.a)} nomeB={nomeDe(b.b)} timeA={ta} timeB={tb} eventos={res.eventos} euA={b.a === you.id} onFim={() => setFase('resultado')} />
        })()}

        {!acabou && fase === 'resultado' && rodadaFeita && (
          <>
            <Box className="p-3">
              <p style={{ ...OSW, fontSize: 15, margin: '0 0 6px' }}>⚔️ {tr('AS BATALHAS DA RODADA', 'THIS ROUND’S BATTLES')}</p>
              {rodadaFeita.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: '5px 0', borderBottom: '1px solid #eee', fontWeight: b.a === you.id || b.b === you.id ? 800 : 500 }}>
                  <span style={{ flex: 1, textAlign: 'left', color: b.vencedor === 'a' ? GREEN : INK }}>{nomeDe(b.a)}</span>
                  <b style={{ ...OSW, background: INK, color: '#fff', borderRadius: 6, padding: '0 8px' }}>{b.nocA} × {b.nocB}</b>
                  <span style={{ flex: 1, textAlign: 'right', color: b.vencedor === 'b' ? GREEN : INK }}>{nomeDe(b.b)}</span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: '#777', margin: '6px 0 0' }}>{tr('placar = nocautes', 'score = knockouts')}</p>
            </Box>
            <Btn onClick={fecharRodada} bg={GREEN}>{liga.rodada >= 10 ? tr('🏆 Ver o campeão', '🏆 See the champion') : tr('▶ Próxima batalha', '▶ Next battle')}</Btn>
          </>
        )}

        {/* 📋 a tabela fica sempre à vista (e só mexe quando a rodada é gravada) */}
        <Tabela liga={liga} youId={you.id} />
        {!acabou && <p style={{ fontSize: 12, color: '#5a5647', fontWeight: 600, textAlign: 'center' }}>{en ? 'Win = 3 pts · tiebreak: knockout difference · top 4 go to the semifinal' : 'Vitória = 3 pts · desempate: saldo de nocautes · os 4 primeiros vão pra semifinal'}</p>}
      </div>
    </div>
  )
}

function Escolha({ meus, sel, setSel, tat, setTat, falta, rival, rivalTipos, onPronto }: {
  meus: LutadorPoke[]; sel: string[]; setSel: (v: string[]) => void; tat: TaticaPoke; setTat: (t: TaticaPoke) => void; falta: number
  rival: string; rivalTipos: TipoPoke[][] | null; onPronto: () => void
}) {
  const toca = (id: string) => setSel(sel.includes(id) ? sel.filter(x => x !== id) : sel.length >= 3 ? sel : [...sel, id])
  return (
    <>
      <div style={{ background: '#1d1d1d', color: '#fff', borderRadius: 14, border: `3px solid ${INK}`, padding: '9px 12px' }}>
        <p style={{ margin: 0, ...OSW, fontSize: 17 }}>{tr('Rival', 'Rival')}: {rival}</p>
        {rivalTipos
          ? <><p style={{ margin: '3px 0 5px', fontSize: 12, opacity: .8 }}>{tr('Os tipos do time dele:', 'His team’s types:')}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>{rivalTipos.map((ts, i) => <span key={i} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 8, padding: '3px 4px', textAlign: 'center' }}><ChipsTipo tipos={ts} small /></span>)}</div></>
          : <p style={{ margin: '3px 0 0', fontSize: 12, opacity: .8 }}>{tr('Treinador de verdade: o time dele você viu na cerimônia.', 'A real trainer: you saw his team at the ceremony.')}</p>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#5a5647' }}>{tr('TOQUE EM 3 — A ORDEM QUE VOCÊ TOCA É A ORDEM QUE ENTRAM', 'TAP 3 — THE ORDER YOU TAP IS THE ORDER THEY GO IN')}</p>
        <b style={{ ...OSW, fontSize: 18, color: falta <= 4 ? RED : INK }}>⏱️ {falta}s</b>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {meus.map(m => {
          const p = POR_NOME.get(m.nome)!
          const o = sel.indexOf(m.id)
          return (
            <button key={m.id} onClick={() => toca(m.id)} style={{ position: 'relative', background: o >= 0 ? '#FFF3C4' : '#fff', border: `3px solid ${INK}`, outline: o >= 0 ? `4px solid ${GOLD}` : 'none', borderRadius: 14, padding: '8px 4px 6px', boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              {o >= 0 && <b style={{ position: 'absolute', top: -10, left: -8, background: INK, color: GOLD, borderRadius: 999, width: 28, height: 28, lineHeight: '28px', ...OSW, fontSize: 15 }}>{o + 1}º</b>}
              <ArtePoke p={p} size={58} />
              <span style={{ ...OSW, fontSize: 14, lineHeight: 1.1 }}>{m.nome}</span>
              <ChipsTipo tipos={p.tipos} small />
            </button>
          )
        })}
      </div>
      <p style={{ margin: '2px 0 -4px', fontSize: 12, fontWeight: 800, color: '#5a5647' }}>{tr('TÁTICA', 'TACTICS')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {TATICAS.map(([t, pt, eng]) => (
          <button key={t} onClick={() => setTat(t)} style={{ border: `3px solid ${INK}`, borderRadius: 11, padding: '8px 0', ...OSW, fontSize: 13, background: tat === t ? '#2F6BAE' : '#fff', color: tat === t ? '#fff' : INK, boxShadow: `2px 2px 0 ${INK}`, cursor: 'pointer' }}>{getLang() === 'en' ? eng : pt}</button>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#5a5647' }}>{tr('🔥 bate mais e apanha mais · 🛡️ segura mais · se o tempo acabar, entra a sua escalação anterior.', '🔥 hits harder and takes more · 🛡️ holds more · if time runs out, your previous line-up goes in.')}</p>
      <Btn onClick={onPronto} bg={GREEN} disabled={sel.length !== 3}>{sel.length === 3 ? tr('✅ PRONTO — LUTAR', '✅ READY — FIGHT') : tr(`Escolha mais ${3 - sel.length}`, `Pick ${3 - sel.length} more`)}</Btn>
    </>
  )
}

function BatalhaAoVivo({ nomeA, nomeB, timeA, timeB, eventos, euA, onFim }: { nomeA: string; nomeB: string; timeA: LutadorPoke[]; timeB: LutadorPoke[]; eventos: EventoPoke[]; euA: boolean; onFim: () => void }) {
  const [i, setI] = useState(0)
  // ~1 minuto de batalha, sem nunca correr demais nem arrastar
  const passo = Math.max(450, Math.min(1300, Math.round(60000 / Math.max(1, eventos.length))))
  useEffect(() => {
    if (i >= eventos.length) return
    const t = setTimeout(() => setI(n => n + 1), passo)
    return () => clearTimeout(t)
  }, [i, eventos.length, passo])
  const vistos = eventos.slice(0, i)
  const hp = new Map<string, number>()
  for (const l of [...timeA, ...timeB]) hp.set(l.nome, 100)
  let ativoA = timeA[0]?.nome, ativoB = timeB[0]?.nome, nocA = 0, nocB = 0
  for (const e of vistos) {
    if (e.t === 'golpe') hp.set(e.alvo, e.hpAlvo)
    if (e.t === 'entra') { if (e.lado === 'a') ativoA = e.quem; else ativoB = e.quem }
    if (e.t === 'ko') { hp.set(e.quem, 0); if (e.lado === 'a') nocB++; else nocA++ }
  }
  const fim = vistos.find(e => e.t === 'fim') as Extract<EventoPoke, { t: 'fim' }> | undefined
  const ult = [...vistos].reverse().find(e => e.t === 'golpe' || e.t === 'ko') as EventoPoke | undefined
  const ant = [...vistos].reverse().filter(e => e.t === 'golpe' || e.t === 'ko')[1] as EventoPoke | undefined
  const fala = (e?: EventoPoke) => {
    if (!e) return tr('As pokébolas se abrem… começa a batalha!', 'The Poké Balls open… the battle begins!')
    const en = getLang() === 'en'
    if (e.t === 'ko') return en ? `💥 ${e.quem} is knocked out!` : `💥 ${e.quem} caiu! Nocaute!`
    if (e.t !== 'golpe') return ''
    const g = NOME_GOLPE[e.tipo][en ? 1 : 0]
    const ef = e.mult === 0 ? (en ? ' It has no effect…' : ' Não fez efeito…') : e.mult >= 2 ? (en ? ' SUPER EFFECTIVE!' : ' SUPER EFETIVO!') : e.mult < 1 ? (en ? ' Not very effective.' : ' Não foi muito efetivo.') : ''
    return `${e.quem} ${en ? 'uses' : 'usa'} ${g}!${e.crit ? (en ? ' Critical hit!' : ' Golpe crítico!') : ''}${ef}`
  }
  const lado = (time: LutadorPoke[], ativo: string | undefined) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {time.map(l => {
        const p = POR_NOME.get(l.nome)!; const v = hp.get(l.nome) ?? 100
        return (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.93)', border: `2.5px solid ${INK}`, borderRadius: 12, padding: 5, opacity: v <= 0 ? .4 : 1, outline: l.nome === ativo && v > 0 ? `3px solid ${GOLD}` : 'none' }}>
            <ArtePoke p={p} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...OSW, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.nome}{v <= 0 ? ' 💀' : ''}</div>
              <div style={{ height: 9, background: '#ddd', border: `1.5px solid ${INK}`, borderRadius: 5, overflow: 'hidden' }}><i style={{ display: 'block', height: '100%', width: `${v}%`, background: v > 50 ? GREEN : v > 20 ? GOLD : RED, transition: 'width .35s' }} /></div>
            </div>
          </div>
        )
      })}
    </div>
  )
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: '#1d1d1d', color: '#fff', border: `3px solid ${INK}`, borderRadius: 16, padding: '10px 8px' }}>
        <b style={{ ...OSW, fontSize: 16, flex: 1, textAlign: 'center', color: euA ? GOLD : '#fff' }}>{nomeA}</b>
        <div style={{ background: '#fff', color: INK, borderRadius: 12, padding: '2px 14px', textAlign: 'center' }}><small style={{ display: 'block', fontSize: 10, color: '#777', fontWeight: 700 }}>{tr('NOCAUTES', 'KNOCKOUTS')}</small><span style={{ ...OSW, fontSize: 34, lineHeight: 1 }}>{nocA} × {nocB}</span></div>
        <b style={{ ...OSW, fontSize: 16, flex: 1, textAlign: 'center', color: !euA ? GOLD : '#fff' }}>{nomeB}</b>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'linear-gradient(#2e8b47,#257a3c)', border: `3px solid ${INK}`, borderRadius: 16, padding: '10px 8px' }}>
        {lado(timeA, ativoA)}
        <span style={{ fontSize: 24 }}>⚡</span>
        {lado(timeB, ativoB)}
      </div>
      <div style={{ background: '#1d1d1d', color: '#fff', border: `3px solid ${INK}`, borderRadius: 14, padding: '9px 11px', minHeight: 74 }}>
        <span style={{ background: GOLD, color: INK, fontSize: 11, fontWeight: 800, borderRadius: 6, padding: '1px 6px' }}>🎙️ {tr('NARRAÇÃO', 'COMMENTARY')}</span>
        <p style={{ margin: '6px 0 3px', fontSize: 16, fontWeight: 600 }}>{fim ? (fim.vencedor === (euA ? 'a' : 'b') ? tr('🏆 VITÓRIA! Você derrubou os 3!', '🏆 VICTORY! You knocked out all 3!') : tr('😵 Derrota… o rival derrubou os seus 3.', '😵 Defeat… the rival knocked out your 3.')) : fala(ult)}</p>
        {!fim && ant && <p style={{ margin: 0, fontSize: 13, opacity: .5, fontWeight: 500 }}>{fala(ant)}</p>}
      </div>
      {fim ? <Btn onClick={onFim} bg={GREEN}>{tr('▶ Ver a rodada', '▶ See the round')}</Btn>
        : <button onClick={() => setI(eventos.length)} style={{ border: `3px solid ${INK}`, borderRadius: 12, padding: 9, background: '#fff', ...OSW, fontSize: 14, cursor: 'pointer', boxShadow: `2px 2px 0 ${INK}` }}>⏩ {tr('Pular pro fim', 'Skip to the end')}</button>}
    </>
  )
}

function Tabela({ liga, youId }: { liga: PokeLigaEstado; youId: number }) {
  const o = ordenaPoke(liga.tabela)
  return (
    <Box className="p-3">
      <p style={{ ...OSW, fontSize: 15, margin: '0 0 4px' }}>🏆 {tr('TABELA', 'TABLE')} <span style={{ fontSize: 11, fontWeight: 600, color: '#777' }}>· {tr('os 4 primeiros vão pra semifinal', 'top 4 go to the semifinal')}</span></p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead><tr style={{ fontSize: 11, color: '#777' }}><td>#</td><td>{tr('TREINADOR', 'TRAINER')}</td><td style={{ textAlign: 'center' }}>J</td><td style={{ textAlign: 'center' }}>V</td><td style={{ textAlign: 'center' }}>PTS</td><td style={{ textAlign: 'center' }}>NOC</td></tr></thead>
        <tbody>{o.map((l, i) => (
          <tr key={l.id} style={{ background: l.id === youId ? '#FFF3C4' : undefined, fontWeight: l.id === youId ? 800 : 500, borderTop: '1px solid #eee' }}>
            <td style={{ color: i < 4 ? GREEN : INK, fontWeight: 800, padding: '4px 2px' }}>{i + 1}</td><td>{l.nome}</td>
            <td style={{ textAlign: 'center' }}>{l.j}</td><td style={{ textAlign: 'center' }}>{l.v}</td><td style={{ textAlign: 'center' }}><b>{l.pts}</b></td><td style={{ textAlign: 'center' }}>{l.nocP - l.nocC > 0 ? '+' : ''}{l.nocP - l.nocC}</td>
          </tr>
        ))}</tbody>
      </table>
    </Box>
  )
}

function Campeao({ nome, voce, onSair }: { nome: string; voce: boolean; onSair: () => void }) {
  return (
    <Box className="p-5" bg={voce ? GOLD : '#fff'}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🏆</div>
        <p style={{ ...OSW, fontSize: 30, margin: 0, lineHeight: 1 }}>{nome}</p>
        <p style={{ fontSize: 15, fontWeight: 700, margin: '6px 0 14px' }}>{voce ? tr('Você é o campeão da Liga Pokémon!', 'You are the Pokémon League champion!') : tr('é o campeão da Liga Pokémon.', 'is the Pokémon League champion.')}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>{(['Elétrico', 'Fogo', 'Água', 'Planta'] as TipoPoke[]).map(t => <span key={t} style={{ background: COR_TIPO[t], border: `2.5px solid ${INK}`, borderRadius: 12, padding: 4, display: 'inline-flex' }} title={nomeTipo(t)}><TipoIcone tipo={t} size={30} /></span>)}</div>
        <Btn onClick={onSair}>{tr('🏠 Voltar ao início', '🏠 Back to home')}</Btn>
      </div>
    </Box>
  )
}
