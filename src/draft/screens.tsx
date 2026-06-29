import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useDraft, availableLegends, teamOf, divTeams } from './store'
import { CPU_POOLS, squadStrength } from './data'
import { rarityOf } from '../empresario/data/career'
import { getCurrentRating, LEGENDS } from '../empresario/data/legends'
import type { Legend } from '../empresario/types'
import type { GameMode, Formation } from './types'
import { C, money, moneyFull, BrutalCard, BrutalButton, BrutalTag, POS_COLOR, FLAG } from '../empresario/ui'

const DIV = (d: number) => ({ 1: '1ª (Elite)', 2: '2ª Divisão', 3: '3ª Divisão', 4: '4ª Divisão' }[d] ?? `${d}ª`)

const TEAM_PALETTE = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1','#14b8a6','#e11d48','#0ea5e9','#a855f7','#f43f5e','#22c55e']
function teamColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return TEAM_PALETTE[h % TEAM_PALETTE.length]
}

// ─── INTRO ─────────────────────────────────────────────────────
export function DraftIntro() {
  const { dispatch } = useDraft()
  return (
    <div className="min-h-screen flex flex-col justify-center px-5 py-10" style={{ backgroundColor: C.black }}>
      <div className="max-w-md mx-auto w-full">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-7xl text-center mb-4">⚡</motion.div>
        <motion.h1 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-center font-black text-4xl text-white leading-none" style={{ fontFamily: 'Oswald, sans-serif' }}>
          OS ELEITOS DE 92
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 space-y-3">
          <BrutalCard color={C.cream} className="p-4" shadow={6}>
            <p className="text-black text-sm font-bold leading-relaxed">
              Era a pelada dos casados, domingo de manhã. Aí o céu abriu e um <b>raio</b> caiu no meio do campo.
            </p>
            <p className="text-black text-sm font-bold leading-relaxed mt-2">
              Quando vocês acordaram, era <b>1992</b>. Você e a galera voltaram no tempo — e <b>só vocês lembram</b> quem vai virar lenda do futebol.
            </p>
            <p className="text-black text-sm font-bold leading-relaxed mt-2">
              Agora cada um pega um timeco da <b>4ª divisão</b> e começa a corrida: a cada 5 rodadas, o <b>draft</b> abre e vocês disputam pra fisgar os futuros craques antes uns dos outros. Quem montar a maior dinastia vence.
            </p>
          </BrutalCard>
          <BrutalButton color={C.yellow} textColor="#000" onClick={() => dispatch({ type: 'START' })}>
            ⚡ Voltar a 1992 →
          </BrutalButton>
        </motion.div>
      </div>
    </div>
  )
}

// ─── PICK CLUB ─────────────────────────────────────────────────
export function DraftPickClub() {
  const { dispatch } = useDraft()
  const [name, setName] = useState('')
  const [mode, setMode] = useState<GameMode>('draft')

  const MODES: { value: GameMode; label: string; desc: string }[] = [
    { value: 'draft', label: '🎟️ Draft', desc: 'A cada 5 rodadas, pior escolhe primeiro' },
    { value: 'leilao', label: '💰 Leilão', desc: 'Lance cego — quem pagar mais leva' },
    { value: 'draft_leilao', label: '🔀 Draft + Leilão', desc: 'Alterna entre os dois modos' },
  ]

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <h1 className="text-white font-black text-lg max-w-md mx-auto" style={{ fontFamily: 'Oswald, sans-serif' }}>ESCOLHA SEU CLUBE</h1>
      </div>
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        <BrutalCard color={C.blue} className="p-4" shadow={5}>
          <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Seu nome de manager</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Como te chamam?"
            className="w-full border-[3px] border-black rounded-lg px-3 py-2 font-black text-black" style={{ backgroundColor: '#fff' }} />
        </BrutalCard>

        <div>
          <p className="text-black/50 text-[10px] font-black uppercase tracking-widest mb-2">Modo de jogo</p>
          <div className="space-y-2">
            {MODES.map(m => (
              <BrutalCard key={m.value} color={mode === m.value ? C.yellow : 'white'} className="p-3 cursor-pointer" shadow={mode === m.value ? 5 : 2}
                onClick={() => setMode(m.value)}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mode === m.value ? '✅' : '⬜'}</span>
                  <div>
                    <p className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{m.label}</p>
                    <p className="text-black/50 text-[11px] font-bold">{m.desc}</p>
                  </div>
                </div>
              </BrutalCard>
            ))}
          </div>
        </div>

        <p className="text-black/50 text-xs font-bold">Todos começam na 4ª divisão. Escolha seu time — elenco já montado, você decide quem contratar no draft.</p>
        <div className="grid grid-cols-2 gap-3">
          {CPU_POOLS[3].map((c, i) => {
            const id = `c${30 + i}`
            return (
              <BrutalCard key={id} color="white" className="p-3" shadow={4}
                onClick={() => dispatch({ type: 'PICK_CLUB', clubId: id, managerName: name.trim(), mode })}>
                <p className="text-2xl mb-1">🛡️</p>
                <p className="font-black text-black text-sm leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>{c.name}</p>
                <p className="text-black/40 text-[10px] font-bold">{c.city}</p>
              </BrutalCard>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── HUB ───────────────────────────────────────────────────────
export function DraftHub() {
  const { state, dispatch } = useDraft()
  const you = state.humans[state.youIndex]
  const myTeam = teamOf(state, you)
  const division = myTeam.division
  const divTable = divTeams(state, division)
  const yourPos = divTable.findIndex(t => t.id === myTeam.id) + 1
  const legendsCount = you.squad.filter(p => p.legendId).length

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: C.cream }}>
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <BrutalTag color={C.yellow}>TEMP {state.season} · {state.year}</BrutalTag>
          <span className="text-white/50 font-mono text-xs">rodada {state.round}/{state.roundsPerSeason}</span>
          <BrutalTag color={C.teal}>{DIV(division)}</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* your club hero */}
        <BrutalCard color={C.purple} className="p-5" shadow={6}>
          <p className="text-white/70 font-mono text-xs uppercase tracking-widest">Seu clube</p>
          <p className="text-white font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{myTeam.name}</p>
          <p className="text-white/50 text-xs font-bold">{myTeam.city}</p>
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="bg-white/15 border-2 border-black rounded-lg p-2 text-center">
              <p className="text-white/60 text-[10px] font-black uppercase">Pos</p>
              <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{yourPos}º</p>
            </div>
            <div className="bg-white/15 border-2 border-black rounded-lg p-2 text-center">
              <p className="text-white/60 text-[10px] font-black uppercase">Força</p>
              <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{Math.round(squadStrength(you.squad, you.lineupIds))}</p>
            </div>
            <div className="bg-white/15 border-2 border-black rounded-lg p-2 text-center">
              <p className="text-white/60 text-[10px] font-black uppercase">Lendas</p>
              <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{legendsCount}</p>
            </div>
            <div className="bg-white/15 border-2 border-black rounded-lg p-2 text-center">
              <p className="text-white/60 text-[10px] font-black uppercase">Caixa</p>
              <p className="text-white font-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(you.money)}</p>
            </div>
          </div>
        </BrutalCard>

        {/* news feed — mostrar logo acima de tudo */}
        {state.narrative.length > 0 && (
          <BrutalCard color={C.black} className="p-3 space-y-1.5">
            {[...state.narrative].reverse().slice(0, 5).map((n, i) => (
              <p key={i} className={`text-xs font-medium leading-relaxed border-l-[3px] pl-2 ${i === 0 ? 'text-white border-white' : 'text-white/45 border-white/20'}`}>{n}</p>
            ))}
          </BrutalCard>
        )}

        {/* draft open banner */}
        {state.inDraft && (
          <BrutalCard color={C.orange} className="p-4" shadow={5} onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'draft' })}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎟️</span>
              <div className="flex-1">
                <p className="font-black text-white text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>DRAFT ABERTO — SUA VEZ!</p>
                <p className="text-white/80 text-xs font-bold">Fisgue um craque antes dos outros.</p>
              </div>
              <span className="text-2xl text-white">→</span>
            </div>
          </BrutalCard>
        )}

        {/* escalação */}
        {!state.inDraft && (
          <BrutalCard color={C.teal} className="p-4" shadow={4} onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'lineup' })}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">👔</span>
              <div className="flex-1">
                <p className="font-black text-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>ESCALAÇÃO & TÁTICA</p>
                <p className="text-black/60 text-xs font-bold">
                  {you.formation ?? '4-4-2'} · {you.tactic === 'retranca' ? '🛡️ Retranca' : you.tactic === 'equilibrio' ? '⚖️ Equilíbrio' : '⚔️ Pra cima'}
                </p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </BrutalCard>
        )}

        {/* advance */}
        {!state.inDraft && (
          <BrutalCard color={C.black} className="p-4" onClick={() => dispatch({ type: 'ADVANCE_ROUND' })}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏩</span>
              <div className="flex-1">
                <p className="font-black text-white text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {state.round >= state.roundsPerSeason ? 'JOGAR ÚLTIMA RODADA' : 'JOGAR PRÓXIMA RODADA'}
                </p>
                <p className="text-white/50 text-xs font-bold">Simula a rodada e abre o draft</p>
              </div>
              <span className="text-2xl text-white">→</span>
            </div>
          </BrutalCard>
        )}

        {/* standings — your division only, link to full table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>📊 {DIV(division)}</h2>
            <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'table' })}
              className="border-2 border-black rounded-lg px-2 py-1 text-[10px] font-black bg-white">Tabela completa →</button>
          </div>
          <BrutalCard color="white" className="p-0 overflow-hidden">
            {divTable.map((t, i) => {
              const isYou = t.humanIndex === state.youIndex
              const mgr = t.isHuman ? state.humans[t.humanIndex!] : null
              return (
                <div key={t.id} className="flex items-center gap-2 px-3 py-2 border-b-2 border-black/10"
                     style={{ backgroundColor: isYou ? C.yellow : 'transparent' }}>
                  <span className="w-5 text-center font-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black truncate ${isYou ? 'text-black' : 'text-black/70'}`}>{isYou ? '⭐ ' : ''}{t.name}</p>
                    <p className="text-black/40 text-[10px] font-bold">{mgr ? mgr.name : t.city} · {t.lastResult}</p>
                  </div>
                  <span className="text-black/40 text-[10px] font-bold">{t.played}j</span>
                  <span className="font-black text-black text-sm w-7 text-right" style={{ fontFamily: 'Oswald, sans-serif' }}>{t.points}</span>
                </div>
              )
            })}
          </BrutalCard>
        </div>

        {/* new game */}
        <button onClick={() => dispatch({ type: 'NEW_GAME' })} className="w-full text-center text-[10px] font-black text-black/30 py-2">
          ↺ Novo jogo
        </button>
      </div>
    </div>
  )
}

// ─── FULL TABLE (all 4 divisions) ──────────────────────────────
export function DraftTable() {
  const { state, dispatch } = useDraft()
  const you = state.humans[state.youIndex]
  const myTeam = teamOf(state, you)

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'hub' })} className="text-white text-2xl font-black">←</button>
          <h1 className="text-white font-black text-lg flex-1" style={{ fontFamily: 'Oswald, sans-serif' }}>📊 TABELA GERAL</h1>
          <BrutalTag color={C.yellow}>TEMP {state.season}</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-6">
        {[1, 2, 3, 4].map(d => {
          const table = divTeams(state, d)
          return (
            <div key={d}>
              <h2 className="font-black text-black mb-2 flex items-center gap-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                {DIV(d)}
                {d === 1 && <BrutalTag color={C.yellow}>ELITE</BrutalTag>}
              </h2>
              <BrutalCard color="white" className="p-0 overflow-hidden">
                <div className="flex items-center gap-1 px-3 py-1 border-b-2 border-black bg-black text-white text-[9px] font-black uppercase">
                  <span className="w-5 text-center">#</span>
                  <span className="flex-1">Clube</span>
                  <span className="w-5 text-center">J</span>
                  <span className="w-5 text-center">V</span>
                  <span className="w-5 text-center">E</span>
                  <span className="w-5 text-center">D</span>
                  <span className="w-8 text-center">SG</span>
                  <span className="w-6 text-center">Pts</span>
                </div>
                {table.map((t, i) => {
                  const isYou = t.id === myTeam.id
                  const promoted = d > 1 && i < 2
                  const relegated = d < 4 && i >= table.length - 2
                  return (
                    <div key={t.id} className="flex items-center gap-1 px-3 py-2 border-b border-black/10"
                         style={{ backgroundColor: isYou ? C.yellow : promoted ? '#dcfce7' : relegated ? '#fee2e2' : 'transparent' }}>
                      <span className="w-5 text-center font-black text-xs">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black truncate">{isYou ? '⭐ ' : ''}{t.name}</p>
                        {t.isHuman && <p className="text-[9px] text-black/40 font-bold">{state.humans[t.humanIndex!].name}</p>}
                      </div>
                      <span className="w-5 text-center text-xs font-bold text-black/60">{t.played}</span>
                      <span className="w-5 text-center text-xs font-bold text-black/60">{t.wins}</span>
                      <span className="w-5 text-center text-xs font-bold text-black/60">{t.draws}</span>
                      <span className="w-5 text-center text-xs font-bold text-black/60">{t.losses}</span>
                      <span className="w-8 text-center text-xs font-bold text-black/60">{t.gf - t.ga > 0 ? '+' : ''}{t.gf - t.ga}</span>
                      <span className="w-6 text-center font-black text-sm">{t.points}</span>
                    </div>
                  )
                })}
              </BrutalCard>
              {d < 4 && (
                <div className="flex gap-4 mt-1 px-1">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac' }} /><span className="text-[9px] text-black/40 font-bold">Sobe</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5' }} /><span className="text-[9px] text-black/40 font-bold">Desce</span></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── DRAFT ─────────────────────────────────────────────────────
export function DraftRoom() {
  const { state, dispatch } = useDraft()
  const pool = availableLegends(state).slice(0, 30)
  const you = state.humans[state.youIndex]

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'hub' })} className="text-white text-2xl font-black">←</button>
          <h1 className="text-white font-black text-lg flex-1" style={{ fontFamily: 'Oswald, sans-serif' }}>🎟️ O DRAFT</h1>
          <BrutalTag color={C.yellow}>SUA VEZ</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* pick feed */}
        {state.lastPickText.length > 0 && (
          <BrutalCard color={C.black} className="p-3 space-y-1">
            {state.lastPickText.slice(-4).map((t, i) => (
              <p key={i} className="text-white/80 text-[11px] font-bold">{t}</p>
            ))}
          </BrutalCard>
        )}

        {state.pendingDrop ? (
          <>
            <BrutalCard color={C.orange} className="p-4" shadow={5}>
              <p className="text-white font-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>⚠ ELENCO CHEIO ({you.squad.length}/{state.rosterMax})</p>
              <p className="text-white/80 text-xs font-bold mt-1">Pra fisgar um novo craque, dispense alguém do elenco.</p>
            </BrutalCard>
            <div className="space-y-2">
              {[...you.squad].sort((a, b) => a.rating - b.rating).map(p => (
                <BrutalCard key={p.id} color="white" className="p-2.5" shadow={2}>
                  <div className="flex items-center gap-2">
                    <BrutalTag color={POS_COLOR[p.pos]} textColor="#fff">{p.pos}</BrutalTag>
                    <span className="flex-1 truncate font-black text-black text-sm">{p.name}</span>
                    <span className="font-black text-black text-sm">{p.rating}</span>
                    <BrutalButton color={C.orange} textColor="#fff" full={false} className="!px-3 !py-1.5 !text-[10px]"
                      onClick={() => dispatch({ type: 'DROP_PLAYER', playerId: p.id })}>Dispensar</BrutalButton>
                  </div>
                </BrutalCard>
              ))}
            </div>
          </>
        ) : (
          <>
            <BrutalCard color={C.blue} className="p-3" shadow={4}>
              <p className="text-white text-xs font-bold">
                ✦ Você vê o <b>potencial</b> (✨) que ninguém mais vê. Os adversários só olham a nota de hoje — é sua chance de roubar o futuro craque baratinho.
              </p>
            </BrutalCard>
            <div className="flex items-center justify-between">
              <h2 className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>ESCOLHA UM JOGADOR</h2>
              <button onClick={() => dispatch({ type: 'SKIP_PICK' })} className="border-2 border-black rounded-lg px-2 py-1 text-[10px] font-black bg-white">Passar a vez</button>
            </div>
            <div className="space-y-2">
              {pool.map(l => <DraftPickCard key={l.id} legend={l} rar={rarityOf(l.truePotential)} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── LINEUP ────────────────────────────────────────────────────
export function DraftLineup() {
  const { state, dispatch } = useDraft()
  const you = state.humans[state.youIndex]
  const formation = you.formation ?? '4-4-2'
  const xiIds = new Set(you.lineupIds)
  const xi = you.squad.filter(p => xiIds.has(p.id))
  const bench = you.squad.filter(p => !xiIds.has(p.id)).sort((a, b) => b.rating - a.rating)
  const xiCount = xi.length

  // Build pitch rows: ATA → MEI → DEF (ZAG+LAT) → GOL
  const pitchRows: Array<{ label: string; players: typeof xi }> = [
    { label: 'ATA', players: xi.filter(p => p.pos === 'ATA') },
    { label: 'MEI', players: xi.filter(p => p.pos === 'MEI') },
    { label: 'DEF', players: xi.filter(p => p.pos === 'ZAG' || p.pos === 'LAT') },
    { label: 'GOL', players: xi.filter(p => p.pos === 'GOL') },
  ].filter(r => r.players.length > 0)

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'hub' })} className="text-white text-2xl font-black">←</button>
          <h1 className="text-white font-black text-lg flex-1" style={{ fontFamily: 'Oswald, sans-serif' }}>👔 ESCALAÇÃO</h1>
          <BrutalTag color={xiCount === 11 ? C.green : C.orange} textColor="#fff">{xiCount}/11</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {/* Força + formation selector */}
        <div className="flex items-center justify-between">
          <p className="text-black/50 text-xs font-bold">Força: <b className="text-black">{Math.round(squadStrength(you.squad, you.lineupIds))}</b></p>
          <div className="flex gap-1 flex-wrap justify-end">
            {(['4-4-2', '4-3-3', '4-2-3-1', '4-5-1', '3-5-2'] as Formation[]).map(f => (
              <button key={f} onClick={() => dispatch({ type: 'SET_FORMATION', formation: f })}
                className="border-2 border-black rounded px-2 py-1 text-[10px] font-black"
                style={{ backgroundColor: formation === f ? C.purple : 'white', color: formation === f ? '#fff' : '#000' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tática */}
        <div className="flex items-center gap-2">
          <p className="text-black/50 text-[10px] font-black uppercase shrink-0">Tática</p>
          <div className="flex gap-1.5 flex-1">
            {(['retranca', 'equilibrio', 'ataque'] as const).map(t => (
              <button key={t} onClick={() => dispatch({ type: 'SET_TACTIC', tactic: t })}
                className="flex-1 border-2 border-black rounded-lg py-1.5 text-[10px] font-black"
                style={{ backgroundColor: you.tactic === t ? C.blue : 'white', color: you.tactic === t ? '#fff' : '#000' }}>
                {t === 'retranca' ? '🛡️ Retr.' : t === 'equilibrio' ? '⚖️ Equil.' : '⚔️ Atq.'}
              </button>
            ))}
          </div>
        </div>

        {/* CAMPO VERDE */}
        <div className="rounded-xl border-[3px] border-black overflow-hidden relative"
          style={{ background: 'linear-gradient(180deg, #1e6b1e 0%, #278a27 40%, #278a27 60%, #1e6b1e 100%)', minHeight: 340 }}>

          {/* linhas do campo */}
          <div className="absolute inset-0 pointer-events-none">
            {/* linha do meio */}
            <div className="absolute left-4 right-4" style={{ top: '50%', height: 1, backgroundColor: 'rgba(255,255,255,0.18)' }} />
            {/* círculo central */}
            <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 64, height: 64, borderRadius: 32, border: '1px solid rgba(255,255,255,0.18)' }} />
            {/* área de cima (ataque) */}
            <div className="absolute left-1/4 right-1/4 top-0" style={{ height: 52, border: '1px solid rgba(255,255,255,0.13)', borderTop: 'none' }} />
            {/* área de baixo (defesa) */}
            <div className="absolute left-1/4 right-1/4 bottom-0" style={{ height: 52, border: '1px solid rgba(255,255,255,0.13)', borderBottom: 'none' }} />
          </div>

          {/* fileiras de jogadores */}
          <div className="relative z-10 px-3 py-5 space-y-4">
            {pitchRows.map((row, ri) => (
              <div key={ri} className="flex justify-center gap-2">
                {row.players.map(p => {
                  const rar = p.potential ? rarityOf(p.potential) : null
                  const firstName = p.name.split(' ')[0]
                  return (
                    <button key={p.id} onClick={() => dispatch({ type: 'SET_LINEUP', playerId: p.id })}
                      className="flex flex-col items-center" style={{ width: 60 }}>
                      {/* círculo com posição */}
                      <div className="w-12 h-12 rounded-full border-[3px] border-black flex items-center justify-center mb-0.5 shadow-lg"
                        style={{ backgroundColor: POS_COLOR[p.pos] }}>
                        <span className="text-white font-black text-[10px] leading-none" style={{ fontFamily: 'Oswald, sans-serif' }}>{p.pos}</span>
                      </div>
                      {/* nome */}
                      <p className="text-white text-[9px] font-black text-center leading-tight w-full truncate px-0.5"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                        {firstName}
                      </p>
                      {/* nota */}
                      <p className="font-black text-[10px] leading-none" style={{ fontFamily: 'Oswald, sans-serif', color: rar?.color ?? '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                        {p.rating}{p.legendId ? ' ✨' : ''}
                      </p>
                    </button>
                  )
                })}
              </div>
            ))}
            {xi.length === 0 && (
              <p className="text-white/40 text-center text-sm font-bold py-12">Toque em um reserva para escalar →</p>
            )}
          </div>
        </div>

        <p className="text-black/40 text-[10px] font-bold text-center">Toque no campo para tirar · toque no banco para escalar</p>

        {/* BANCO */}
        <div>
          <p className="text-black/50 text-[10px] font-black uppercase mb-2">🪑 Banco ({bench.length} jogadores)</p>
          <div className="space-y-1.5">
            {bench.map(p => {
              const rar = p.potential ? rarityOf(p.potential) : null
              const canAdd = xiCount < 11
              return (
                <BrutalCard key={p.id} color={p.legendId ? C.cream : 'white'} className="p-2.5" shadow={2}
                  onClick={() => canAdd && dispatch({ type: 'SET_LINEUP', playerId: p.id })}>
                  <div className="flex items-center gap-2">
                    <BrutalTag color={POS_COLOR[p.pos]} textColor="#fff">{p.pos}</BrutalTag>
                    <span className="text-base">{p.nationality ? FLAG[p.nationality] : '⚽'}</span>
                    <span className="flex-1 min-w-0 truncate font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{p.name}</span>
                    {rar && <span className="text-[9px] font-black" style={{ color: rar.color }}>{rar.emoji}{p.potential}</span>}
                    <span className="font-black text-black text-sm w-7 text-right">{p.rating}</span>
                    {canAdd && <span className="text-green-600 font-black text-lg leading-none">+</span>}
                  </div>
                </BrutalCard>
              )
            })}
          </div>
        </div>

        <BrutalCard color={C.blue} className="p-3">
          <p className="text-white text-xs font-bold">✦ Jovem cru (pot alto ✨) enfraquece hoje — mas <b>jogar faz ele crescer</b> mais rápido.</p>
        </BrutalCard>
      </div>
    </div>
  )
}

function DraftPickCard({ legend, rar }: { legend: Legend; rar: ReturnType<typeof rarityOf> }) {
  const { state, dispatch } = useDraft()
  const rating = getCurrentRating(legend, state.year)
  return (
    <BrutalCard color="white" className="p-3" shadow={rar.rank >= 3 ? 5 : 3}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{FLAG[legend.nationality]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{legend.name}</span>
            <BrutalTag color={POS_COLOR[legend.position]} textColor="#fff">{legend.position}</BrutalTag>
          </div>
          <span className="inline-block mt-1 border-2 border-black rounded px-1 text-[9px] font-black uppercase" style={{ backgroundColor: rar.color, color: rar.rank >= 3 ? '#000' : '#fff' }}>
            {rar.emoji} {rar.label}
          </span>
        </div>
        <div className="text-right">
          <p className="text-black/40 text-[9px] font-black uppercase">nota / pot</p>
          <p className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{rating} / <span style={{ color: rar.color }}>{legend.truePotential}</span></p>
        </div>
        <BrutalButton color={C.green} full={false} className="!px-3 !py-2 !text-[10px]"
          onClick={() => dispatch({ type: 'DRAFT_PICK', legendId: legend.id })}>Fisgar</BrutalButton>
      </div>
    </BrutalCard>
  )
}

// ─── LIVE MATCH (Elifoot style) ────────────────────────────────
export function DraftMatch() {
  const { state, dispatch } = useDraft()
  const live = state.live
  const you = state.humans[state.youIndex]
  const myTeam = teamOf(state, you)
  const eventsEndRef = useRef<HTMLDivElement>(null)

  // Auto-tick during first and second half
  useEffect(() => {
    if (!live || live.half === 'ht' || live.half === 'ft') return
    const id = setInterval(() => dispatch({ type: 'TICK_MATCH' }), 900)
    return () => clearInterval(id)
  }, [live?.half, dispatch])

  // Scroll to latest event
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [live?.events.length])

  if (!live) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.cream }}><p className="font-black text-black">Carregando...</p></div>

  const barPct = Math.min(100, (live.minute / 90) * 100)
  const isRunning = live.half === 1 || live.half === 2
  const isHT = live.half === 'ht'
  const isFT = live.half === 'ft'
  const result = live.gf > live.ga ? 'V' : live.gf === live.ga ? 'E' : 'D'
  const resultColor = result === 'V' ? C.green : result === 'E' ? C.yellow : C.orange

  // HT sub state
  const [subOut, setSubOut] = useState<string | null>(null)
  const [subIn, setSubIn] = useState<string | null>(null)
  const xi = you.squad.filter(p => you.lineupIds.includes(p.id))
  const bench = you.squad.filter(p => !you.lineupIds.includes(p.id))

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.black }}>
      {/* Header */}
      <div className="px-4 py-3 border-b-[3px] border-white/20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <BrutalTag color={C.teal}>{({ 1: '1ª Divisão', 2: '2ª Divisão', 3: '3ª Divisão', 4: '4ª Divisão' }[live.division]) ?? `${live.division}ª`}</BrutalTag>
          <span className="text-white/40 font-mono text-xs">Rodada {state.round}</span>
          <BrutalTag color={C.yellow}>TEMP {state.season}</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* scoreboard */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <BrutalCard color={C.purple} className="p-5 text-center" shadow={8}>
            <div className="flex items-center justify-center gap-4">
              <div className="flex-1 text-right">
                <p className="text-white font-black text-base truncate" style={{ fontFamily: 'Oswald, sans-serif' }}>{myTeam.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-5xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{live.gf}</span>
                <span className="text-white/40 font-black text-3xl">–</span>
                <span className="text-white font-black text-5xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{live.ga}</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-white/60 font-black text-base truncate" style={{ fontFamily: 'Oswald, sans-serif' }}>{live.oppName}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              {isRunning && <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
              <span className="text-white/60 font-mono text-sm">
                {isFT ? '⏱ Apito final' : isHT ? '⏸ Intervalo' : `${live.minute}'`}
              </span>
            </div>
          </BrutalCard>
        </motion.div>

        {/* time bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-black text-white/40">
            <span>0'</span>
            <span style={{ color: live.half === 1 || isHT ? C.yellow : 'rgba(255,255,255,0.4)' }}>45'</span>
            <span>90'</span>
          </div>
          <div className="relative h-3 rounded-full border-2 border-white/20 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${barPct}%`, backgroundColor: isHT ? C.yellow : isFT ? resultColor : C.teal }} />
            {/* HT midline */}
            <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '50%' }} />
          </div>
        </div>

        {/* Other matches live — all 4 divisions */}
        {live.otherMatches && live.otherMatches.length > 0 && (
          <div>
            <p className="text-white/30 text-[9px] font-black uppercase mb-1.5">📺 Outros Jogos · {live.minute}'</p>
            {[1, 2, 3, 4].map(d => {
              const dMatches = live.otherMatches.filter(m => m.division === d)
              if (dMatches.length === 0) return null
              return (
                <div key={d} className="mb-2">
                  <p className="text-white/20 text-[9px] font-black uppercase mb-0.5">{d}ª Divisão</p>
                  <div className="space-y-px">
                    {dMatches.map((m, i) => (
                      <div key={i} className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                        <span className="flex-1 truncate text-[10px] font-black text-right" style={{ color: teamColor(m.homeId) }}>{m.homeName}</span>
                        <span className="font-black text-[11px] mx-2 tabular-nums shrink-0" style={{ fontFamily: 'Oswald, sans-serif', color: (m.gf !== m.ga) ? '#facc15' : 'rgba(255,255,255,0.7)' }}>{m.gf}–{m.ga}</span>
                        <span className="flex-1 truncate text-[10px] font-black" style={{ color: teamColor(m.awayId) }}>{m.awayName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Halftime controls */}
        {isHT && (
          <BrutalCard color={C.yellow} className="p-4 space-y-3" shadow={6}>
            <p className="font-black text-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>⏸ INTERVALO — {live.gf}–{live.ga}</p>
            {/* tactic change */}
            <div>
              <p className="text-black/60 text-[10px] font-black uppercase mb-1">Tática para o 2º tempo</p>
              <div className="flex gap-2">
                {(['retranca', 'equilibrio', 'ataque'] as const).map(t => (
                  <button key={t} onClick={() => dispatch({ type: 'CHANGE_TACTIC_MATCH', tactic: t })}
                    className="flex-1 border-2 border-black rounded px-1 py-1.5 text-[10px] font-black uppercase"
                    style={{ backgroundColor: you.tactic === t ? C.black : '#fff', color: you.tactic === t ? '#fff' : '#000' }}>
                    {t === 'retranca' ? '🛡️' : t === 'equilibrio' ? '⚖️' : '⚔️'} {t}
                  </button>
                ))}
              </div>
            </div>
            {/* substitution */}
            {!live.subDone && (
              <div>
                <p className="text-black/60 text-[10px] font-black uppercase mb-1">Substituição (1 disponível)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-black/40 text-[9px] font-black uppercase mb-1">Tirar (XI)</p>
                    {xi.sort((a, b) => a.rating - b.rating).map(p => (
                      <button key={p.id} onClick={() => setSubOut(p.id)}
                        className="w-full text-left border-2 rounded px-2 py-1 mb-1 text-[10px] font-black truncate"
                        style={{ borderColor: subOut === p.id ? C.orange : '#000', backgroundColor: subOut === p.id ? C.orange : '#fff', color: subOut === p.id ? '#fff' : '#000' }}>
                        {p.pos} {p.name.split(' ')[0]} ({p.rating})
                      </button>
                    ))}
                  </div>
                  <div>
                    <p className="text-black/40 text-[9px] font-black uppercase mb-1">Colocar (Banco)</p>
                    {bench.sort((a, b) => b.rating - a.rating).map(p => (
                      <button key={p.id} onClick={() => setSubIn(p.id)}
                        className="w-full text-left border-2 rounded px-2 py-1 mb-1 text-[10px] font-black truncate"
                        style={{ borderColor: subIn === p.id ? C.green : '#000', backgroundColor: subIn === p.id ? C.green : '#fff', color: subIn === p.id ? '#fff' : '#000' }}>
                        {p.pos} {p.name.split(' ')[0]} ({p.rating})
                      </button>
                    ))}
                  </div>
                </div>
                {subOut && subIn && (
                  <BrutalButton color={C.orange} textColor="#fff" onClick={() => { dispatch({ type: 'MAKE_SUB', outId: subOut, inId: subIn }); setSubOut(null); setSubIn(null) }}>
                    ✅ Confirmar sub
                  </BrutalButton>
                )}
              </div>
            )}
            {live.subDone && <p className="text-black/50 text-xs font-bold">✅ Substituição feita.</p>}
            <BrutalButton color={C.black} textColor="#fff" onClick={() => dispatch({ type: 'START_HALF2' })}>
              ▶ 2º TEMPO →
            </BrutalButton>
          </BrutalCard>
        )}

        {/* Full time */}
        {isFT && (
          <BrutalCard color={resultColor} className="p-4 text-center" shadow={6}>
            <p className="font-black text-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>
              {result === 'V' ? '🏆 VITÓRIA!' : result === 'E' ? '🤝 EMPATE' : '😞 DERROTA'}
            </p>
            <p className="text-black/70 text-sm font-bold mt-1">{myTeam.name} {live.gf}–{live.ga} {live.oppName}</p>
            <BrutalButton color={C.black} textColor="#fff" className="mt-3" onClick={() => dispatch({ type: 'END_MATCH' })}>
              Continuar →
            </BrutalButton>
          </BrutalCard>
        )}

        {/* events feed */}
        <div className="space-y-1">
          {live.events.filter(e => e.trim()).map((e, i) => {
            const isGoal = e.includes('⚽')
            const isOppGoal = e.includes('🔴')
            return (
              <motion.div key={i} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                className="border-l-[3px] pl-3 py-0.5"
                style={{ borderColor: isGoal ? C.green : isOppGoal ? C.orange : 'rgba(255,255,255,0.2)' }}>
                <p className={`text-xs font-bold ${isGoal ? 'text-green-400' : isOppGoal ? 'text-orange-400' : 'text-white/50'}`}>{e}</p>
              </motion.div>
            )
          })}
          <div ref={eventsEndRef} />
        </div>
      </div>
    </div>
  )
}

// ─── LEILÃO CEGO ───────────────────────────────────────────────
export function DraftLeilao() {
  const { state, dispatch } = useDraft()
  const you = state.humans[state.youIndex]
  const [bid, setBid] = useState('')

  const legendId = state.leilaoItems[state.leilaoIndex]
  const legend = legendId ? LEGENDS.find(l => l.id === legendId) : null
  const rating = legend ? getCurrentRating(legend, state.year) : 0
  const rar = legend ? rarityOf(legend.truePotential) : null

  if (!legend || !rar) return null

  const isBidding = state.leilaoPhase === 'bid'
  const isReveal = state.leilaoPhase === 'reveal'
  const winnerIdx = isReveal ? state.leilaoBids.indexOf(Math.max(...state.leilaoBids)) : -1
  const winner = winnerIdx >= 0 ? state.humans[winnerIdx] : null
  const yourBid = state.leilaoBids[state.youIndex] ?? 0

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>💰 LEILÃO CEGO</h1>
          <BrutalTag color={C.yellow}>{state.leilaoIndex + 1}/{state.leilaoItems.length}</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        <BrutalCard color={C.blue} className="p-3">
          <p className="text-white text-xs font-bold">💡 Lance cego — você não sabe o que os outros oferecem. Quem pagar mais leva. Defina seu limite!</p>
        </BrutalCard>

        {/* legend card */}
        <BrutalCard color={C.cream} className="p-4" shadow={8}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{FLAG[legend.nationality]}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-black text-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{legend.name}</span>
                <BrutalTag color={POS_COLOR[legend.position]} textColor="#fff">{legend.position}</BrutalTag>
              </div>
              <div className="flex items-center gap-2">
                <span className="border-2 border-black rounded px-1.5 py-0.5 text-[10px] font-black uppercase" style={{ backgroundColor: rar.color, color: rar.rank >= 3 ? '#000' : '#fff' }}>
                  {rar.emoji} {rar.label}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-black/40 text-[9px] font-black uppercase">nota / pot</p>
              <p className="font-black text-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>
                {rating} / <span style={{ color: rar.color }}>{legend.truePotential}</span>
              </p>
            </div>
          </div>
        </BrutalCard>

        {/* your money */}
        <BrutalCard color={C.black} className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-black uppercase">Seu caixa</span>
            <span className="text-white font-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>{moneyFull(you.money)}</span>
          </div>
        </BrutalCard>

        {isBidding && (
          <div className="space-y-3">
            <BrutalCard color="white" className="p-4" shadow={4}>
              <p className="text-black/50 text-[10px] font-black uppercase mb-2">Seu lance (R$)</p>
              <input
                type="number" min={0} max={you.money} value={bid}
                onChange={e => setBid(e.target.value)}
                placeholder="0"
                className="w-full border-[3px] border-black rounded-lg px-3 py-3 font-black text-black text-2xl"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              />
              <div className="flex gap-2 mt-2">
                {[100_000, 250_000, 500_000].map(v => (
                  <button key={v} onClick={() => setBid(String(Math.min(v, you.money)))}
                    className="flex-1 border-2 border-black rounded px-2 py-1.5 text-[10px] font-black bg-white">
                    {money(v)}
                  </button>
                ))}
                <button onClick={() => setBid(String(Math.floor(you.money * 0.5)))}
                  className="flex-1 border-2 border-black rounded px-2 py-1.5 text-[10px] font-black bg-white">
                  50%
                </button>
              </div>
            </BrutalCard>
            <BrutalButton color={C.green} textColor="#fff"
              onClick={() => dispatch({ type: 'BID_LEILAO', amount: Number(bid) || 0 })}>
              💰 Dar lance: {Number(bid) ? moneyFull(Number(bid)) : 'R$ 0 (passar)'}
            </BrutalButton>
          </div>
        )}

        {isReveal && (
          <div className="space-y-3">
            {/* reveal bids */}
            <BrutalCard color="white" className="p-0 overflow-hidden" shadow={4}>
              <div className="bg-black px-3 py-2">
                <p className="text-white font-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>💰 LANCES REVELADOS</p>
              </div>
              {state.leilaoBids.map((b, i) => {
                const mgr = state.humans[i]
                const isWinner = i === winnerIdx && b > 0
                return (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-black/10"
                    style={{ backgroundColor: isWinner ? C.yellow : i === state.youIndex ? '#f0f8ff' : 'transparent' }}>
                    <span className="text-base">{isWinner ? '🏆' : '·'}</span>
                    <span className="flex-1 font-black text-black text-sm">{mgr.name}{i === state.youIndex ? ' (você)' : ''}</span>
                    <span className="font-black text-sm" style={{ color: b > 0 ? '#000' : '#aaa' }}>
                      {b > 0 ? moneyFull(b) : 'Passou'}
                    </span>
                  </div>
                )
              })}
            </BrutalCard>

            {winner && yourBid > 0 && (
              <BrutalCard color={winnerIdx === state.youIndex ? C.green : C.orange} className="p-3" shadow={4}>
                <p className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {winnerIdx === state.youIndex
                    ? `🏆 VOCÊ arrematou ${legend.nickname}!`
                    : `❌ ${winner.name} levou ${legend.nickname} por ${moneyFull(state.leilaoBids[winnerIdx])}`}
                </p>
              </BrutalCard>
            )}
            {Math.max(...state.leilaoBids) === 0 && (
              <BrutalCard color={C.creamDark} className="p-3">
                <p className="font-black text-black text-sm">Ninguém deu lance — {legend.nickname} passa.</p>
              </BrutalCard>
            )}

            <BrutalButton color={state.leilaoIndex + 1 >= state.leilaoItems.length ? C.teal : C.blue} textColor="#fff"
              onClick={() => { setBid(''); dispatch({ type: 'NEXT_LEILAO' }) }}>
              {state.leilaoIndex + 1 >= state.leilaoItems.length ? '✅ Fechar janela →' : 'Próxima disputa →'}
            </BrutalButton>
          </div>
        )}
      </div>
    </div>
  )
}
