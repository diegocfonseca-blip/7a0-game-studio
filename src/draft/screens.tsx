import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDraft, availableLegends, teamOf, divTeams } from './store'
import { START_CLUBS, squadStrength } from './data'
import { rarityOf } from '../empresario/data/career'
import { getCurrentRating, LEGENDS } from '../empresario/data/legends'
import type { Legend } from '../empresario/types'
import type { GameMode, DraftPlayer } from './types'
import { C, money, moneyFull, BrutalCard, BrutalButton, BrutalTag, POS_COLOR, FLAG } from '../empresario/ui'

const DIV = (d: number) => ({ 1: '1ª (Elite)', 2: '2ª Divisão', 3: '3ª Divisão', 4: '4ª Divisão' }[d] ?? `${d}ª`)

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

        <p className="text-black/50 text-xs font-bold">Todos começam na 4ª divisão com um elenco de desconhecidos. A diferença vai ser o que você fisgar.</p>
        <div className="grid grid-cols-2 gap-3">
          {START_CLUBS.map(c => (
            <BrutalCard key={c.id} color="white" className="p-3" shadow={4}
              onClick={() => dispatch({ type: 'PICK_CLUB', clubId: c.id, managerName: name.trim(), mode })}>
              <p className="text-2xl mb-1">🛡️</p>
              <p className="font-black text-black text-sm leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>{c.name}</p>
              <p className="text-black/40 text-[10px] font-bold">{c.city}</p>
            </BrutalCard>
          ))}
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
  const squad = [...you.squad].sort((a, b) => b.rating - a.rating)
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

        {/* escalação + tática */}
        {!state.inDraft && (
          <div className="grid grid-cols-2 gap-3">
            <BrutalCard color={C.teal} className="p-3" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'lineup' })}>
              <p className="text-2xl mb-1">👔</p>
              <p className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>ESCALAÇÃO</p>
              <p className="text-black/60 text-[10px] font-bold">Monte seu XI · dê minutos aos jovens</p>
            </BrutalCard>
            <BrutalCard color="white" className="p-3">
              <p className="text-black/50 text-[10px] font-black uppercase mb-1">Tática</p>
              <div className="space-y-1">
                {(['retranca', 'equilibrio', 'ataque'] as const).map(t => (
                  <button key={t} onClick={() => dispatch({ type: 'SET_TACTIC', tactic: t })}
                    className="w-full border-2 border-black rounded px-2 py-1 text-[10px] font-black uppercase text-left"
                    style={{ backgroundColor: you.tactic === t ? C.blue : '#fff', color: you.tactic === t ? '#fff' : '#000' }}>
                    {t === 'retranca' ? '🛡️ Retranca' : t === 'equilibrio' ? '⚖️ Equilíbrio' : '⚔️ Pra cima'}
                  </button>
                ))}
              </div>
            </BrutalCard>
          </div>
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

        {/* your squad */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>👕 SEU ELENCO</h2>
            <BrutalTag color={C.teal}>{you.squad.length}/{state.rosterMax}</BrutalTag>
          </div>
          <div className="space-y-2">
            {squad.map(p => {
              const rar = p.potential ? rarityOf(p.potential) : null
              return (
                <BrutalCard key={p.id} color={p.legendId ? C.cream : 'white'} className="p-2.5" shadow={2}>
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-center">{you.lineupIds.includes(p.id) ? '⭐' : ''}</span>
                    <BrutalTag color={POS_COLOR[p.pos]} textColor="#fff">{p.pos}</BrutalTag>
                    <span className="text-base">{p.nationality ? FLAG[p.nationality] : '⚽'}</span>
                    <span className="flex-1 min-w-0 truncate font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{p.name}</span>
                    {rar && <span className="text-[9px] font-black uppercase" style={{ color: rar.color }}>{rar.emoji}{p.potential}</span>}
                    <span className="font-black text-black text-sm w-7 text-right">{p.rating}</span>
                  </div>
                </BrutalCard>
              )
            })}
          </div>
        </div>

        {/* news feed */}
        {state.narrative.length > 0 && (
          <BrutalCard color={C.creamDark} className="p-4 space-y-1.5 max-h-60 overflow-y-auto">
            {[...state.narrative].reverse().slice(0, 12).map((n, i) => (
              <p key={i} className={`text-xs font-medium leading-relaxed border-l-[3px] pl-2 ${i === 0 ? 'text-black border-black' : 'text-black/60 border-black/30'}`}>{n}</p>
            ))}
          </BrutalCard>
        )}

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
  const xi = you.lineupIds.length
  const order: Record<string, number> = { GOL: 0, ZAG: 1, LAT: 2, MEI: 3, ATA: 4 }
  const squad = [...you.squad].sort((a, b) => (order[a.pos] - order[b.pos]) || b.rating - a.rating)

  const clubColor = START_CLUBS.find(c => c.id === you.teamId)?.color ?? '#1e7e3a'

  const lineupSquad = you.squad.filter(p => you.lineupIds.includes(p.id))
  const gk  = lineupSquad.filter(p => p.pos === 'GOL')
  const def = lineupSquad.filter(p => p.pos === 'ZAG' || p.pos === 'LAT')
  const mid = lineupSquad.filter(p => p.pos === 'MEI')
  const fwd = lineupSquad.filter(p => p.pos === 'ATA')

  const PitchRow = ({ players }: { players: DraftPlayer[] }) => (
    <div className="flex justify-around items-center">
      {players.map(p => {
        const shortName = p.name.match(/"([^"]+)"/) ? p.name.match(/"([^"]+)"/)![1] : p.name.split(' ')[0]
        return (
          <button key={p.id} className="flex flex-col items-center gap-0.5"
            onClick={() => dispatch({ type: 'SET_LINEUP', playerId: p.id })}>
            <div className="w-10 h-10 rounded-full border-[2.5px] border-white flex items-center justify-center shadow-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}>
              <span className="font-black text-[11px] text-black">{p.rating}</span>
            </div>
            <span className="text-white text-[8px] font-bold leading-tight max-w-[44px] truncate text-center drop-shadow">
              {p.legendId ? '⭐' : ''}{shortName}
            </span>
            <span className="text-[7px] font-black rounded px-0.5" style={{ backgroundColor: POS_COLOR[p.pos], color: '#fff' }}>{p.pos}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: clubColor }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'hub' })} className="text-white text-2xl font-black">←</button>
          <h1 className="text-white font-black text-lg flex-1" style={{ fontFamily: 'Oswald, sans-serif' }}>👔 ESCALAÇÃO</h1>
          <BrutalTag color={xi === 11 ? C.green : C.orange} textColor="#fff">{xi}/11</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-3">

        {/* Campo com cor do clube */}
        <div className="relative rounded-xl overflow-hidden border-[3px] border-black shadow-[4px_4px_0_#000]"
          style={{ backgroundColor: clubColor, minHeight: 260 }}>
          {/* linhas do campo */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 260" preserveAspectRatio="none">
            <rect x="4" y="4" width="312" height="252" rx="4" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2"/>
            <line x1="0" y1="130" x2="320" y2="130" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
            <circle cx="160" cy="130" r="32" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
            <rect x="96" y="4" width="128" height="48" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
            <rect x="96" y="208" width="128" height="48" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
            <rect x="128" y="4" width="64" height="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
            <rect x="128" y="236" width="64" height="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
          </svg>
          {/* jogadores — FWD no topo, GK embaixo */}
          <div className="relative z-10 flex flex-col justify-around py-4" style={{ minHeight: 260 }}>
            <PitchRow players={fwd} />
            <PitchRow players={mid} />
            <PitchRow players={def} />
            <PitchRow players={gk} />
          </div>
          <div className="absolute bottom-2 right-3 z-20">
            <span className="text-white/70 text-[9px] font-black">Força {Math.round(squadStrength(you.squad, you.lineupIds))}</span>
          </div>
        </div>

        {/* Formação */}
        <BrutalCard color="white" className="p-3" shadow={4}>
          <p className="text-black/50 text-[10px] font-black uppercase mb-2">Formação</p>
          <div className="flex gap-2 flex-wrap">
            {(['4-4-2', '4-3-3', '4-2-3-1', '4-5-1', '3-5-2'] as const).map(f => (
              <button key={f} onClick={() => dispatch({ type: 'SET_FORMATION', formation: f })}
                className="border-2 border-black rounded px-2 py-1.5 text-[11px] font-black"
                style={{ backgroundColor: you.formation === f ? clubColor : '#fff', color: you.formation === f ? '#fff' : '#000' }}>
                {f}
              </button>
            ))}
          </div>
        </BrutalCard>

        {/* Tática */}
        <BrutalCard color="white" className="p-3" shadow={4}>
          <p className="text-black/50 text-[10px] font-black uppercase mb-2">Tática</p>
          <div className="grid grid-cols-3 gap-2">
            {(['retranca', 'equilibrio', 'ataque'] as const).map(t => (
              <button key={t} onClick={() => dispatch({ type: 'SET_TACTIC', tactic: t })}
                className="border-2 border-black rounded px-1 py-2 text-[10px] font-black uppercase flex flex-col items-center gap-0.5"
                style={{ backgroundColor: you.tactic === t ? clubColor : '#fff', color: you.tactic === t ? '#fff' : '#000' }}>
                <span className="text-base">{t === 'retranca' ? '🛡️' : t === 'equilibrio' ? '⚖️' : '⚔️'}</span>
                {t === 'retranca' ? 'Retranca' : t === 'equilibrio' ? 'Equilíbrio' : 'Pra cima'}
              </button>
            ))}
          </div>
        </BrutalCard>

        <BrutalCard color={C.blue} className="p-3" shadow={4}>
          <p className="text-white text-xs font-bold">
            ✦ Escale 11. Botar um <b>jovem cru</b> (nota baixa, potencial alto ✨) enfraquece o time hoje — mas <b>jogar faz ele crescer</b> mais rápido. Esse é o seu dilema.
          </p>
        </BrutalCard>

        <div className="space-y-2">
          {squad.map(p => {
            const on = you.lineupIds.includes(p.id)
            const rar = p.potential ? rarityOf(p.potential) : null
            const isLegend = !!p.legendId
            return (
              <BrutalCard key={p.id} color={on ? C.teal : 'white'} className="p-2.5" shadow={on ? 4 : 2}
                onClick={() => dispatch({ type: 'SET_LINEUP', playerId: p.id })}>
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center text-lg">{on ? '✅' : '⬜'}</span>
                  <BrutalTag color={POS_COLOR[p.pos]} textColor="#fff">{p.pos}</BrutalTag>
                  <span className="text-base">{p.nationality ? FLAG[p.nationality] : '⚽'}</span>
                  <div className="flex-1 min-w-0">
                    <span className="truncate font-black text-sm block" style={{ fontFamily: 'Oswald, sans-serif', color: isLegend ? '#b8860b' : '#000' }}>
                      {isLegend ? '⭐ ' : ''}{p.name}
                    </span>
                    {p.age && <span className="text-[9px] text-black/40 font-bold">{p.age} anos</span>}
                  </div>
                  {rar && <span className="text-[9px] font-black" style={{ color: rar.color }}>{rar.emoji}{p.potential}</span>}
                  <span className="font-black text-black text-sm w-7 text-right">{p.rating}</span>
                </div>
              </BrutalCard>
            )
          })}
        </div>
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
  // Auto-tick during first and second half
  useEffect(() => {
    if (!live || live.half === 'ht' || live.half === 'ft') return
    const id = setInterval(() => dispatch({ type: 'TICK_MATCH' }), 900)
    return () => clearInterval(id)
  }, [live?.half, dispatch])

  if (!live) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.cream }}><p className="font-black text-black">Carregando...</p></div>

  const barPct = Math.min(100, (live.minute / 90) * 100)
  const isRunning = live.half === 1 || live.half === 2
  const isHT = live.half === 'ht'
  const isFT = live.half === 'ft'
  const result = live.gf > live.ga ? 'V' : live.gf === live.ga ? 'E' : 'D'
  const resultColor = result === 'V' ? C.green : result === 'E' ? C.yellow : C.orange

  const clubColor = START_CLUBS.find(c => c.id === you.teamId)?.color ?? '#1e7e3a'

  // HT sub state
  const [subOut, setSubOut] = useState<string | null>(null)
  const [subIn, setSubIn] = useState<string | null>(null)
  const xi = you.squad.filter(p => you.lineupIds.includes(p.id))
  const bench = you.squad.filter(p => !you.lineupIds.includes(p.id))

  const HTMiniPitch = () => {
    const lineupSquad = you.squad.filter(p => you.lineupIds.includes(p.id))
    const gk  = lineupSquad.filter(p => p.pos === 'GOL')
    const def = lineupSquad.filter(p => p.pos === 'ZAG' || p.pos === 'LAT')
    const mid = lineupSquad.filter(p => p.pos === 'MEI')
    const fwd = lineupSquad.filter(p => p.pos === 'ATA')
    const Row = ({ players }: { players: DraftPlayer[] }) => (
      <div className="flex justify-around items-center">
        {players.map(p => {
          const short = p.name.match(/"([^"]+)"/) ? p.name.match(/"([^"]+)"/)![1] : p.name.split(' ')[0]
          return (
            <div key={p.id} className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow"
                style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}>
                <span className="font-black text-[10px] text-black">{p.rating}</span>
              </div>
              <span className="text-white text-[7px] font-bold max-w-[36px] truncate text-center drop-shadow">
                {p.legendId ? '⭐' : ''}{short}
              </span>
            </div>
          )
        })}
      </div>
    )
    return (
      <div className="relative rounded-lg overflow-hidden border-2 border-white/30" style={{ minHeight: 200 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="none">
          <rect x="3" y="3" width="314" height="194" rx="3" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
          <line x1="0" y1="100" x2="320" y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          <circle cx="160" cy="100" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          <rect x="96" y="3" width="128" height="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
          <rect x="96" y="161" width="128" height="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
        </svg>
        <div className="relative z-10 flex flex-col justify-around py-3" style={{ minHeight: 200 }}>
          <Row players={fwd} />
          <Row players={mid} />
          <Row players={def} />
          <Row players={gk} />
        </div>
      </div>
    )
  }

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

        {/* Halftime controls */}
        {isHT && (
          <BrutalCard color={clubColor} className="p-4 space-y-3" shadow={6}>
            <p className="font-black text-white text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>⏸ INTERVALO — {live.gf}–{live.ga}</p>
            {/* mini pitch */}
            <HTMiniPitch />
            {/* tactic change */}
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase mb-1">Tática para o 2º tempo</p>
              <div className="flex gap-2">
                {(['retranca', 'equilibrio', 'ataque'] as const).map(t => (
                  <button key={t} onClick={() => dispatch({ type: 'CHANGE_TACTIC_MATCH', tactic: t })}
                    className="flex-1 border-2 border-white/40 rounded px-1 py-1.5 text-[10px] font-black uppercase"
                    style={{ backgroundColor: you.tactic === t ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.12)', color: you.tactic === t ? '#000' : '#fff' }}>
                    {t === 'retranca' ? '🛡️' : t === 'equilibrio' ? '⚖️' : '⚔️'} {t}
                  </button>
                ))}
              </div>
            </div>
            {/* substitution */}
            {live.subsUsed < 3 && (
              <div>
                <p className="text-white/60 text-[10px] font-black uppercase mb-1">Substituição (1 disponível)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-white/40 text-[9px] font-black uppercase mb-1">Tirar (XI)</p>
                    {xi.sort((a, b) => a.rating - b.rating).map(p => (
                      <button key={p.id} onClick={() => setSubOut(p.id)}
                        className="w-full text-left border-2 rounded px-2 py-1 mb-1 text-[10px] font-black truncate"
                        style={{ borderColor: subOut === p.id ? C.orange : 'rgba(255,255,255,0.4)', backgroundColor: subOut === p.id ? C.orange : 'rgba(255,255,255,0.12)', color: '#fff' }}>
                        {p.pos} {p.name.split(' ')[0]} ({p.rating})
                      </button>
                    ))}
                  </div>
                  <div>
                    <p className="text-white/40 text-[9px] font-black uppercase mb-1">Colocar (Banco)</p>
                    {bench.sort((a, b) => b.rating - a.rating).map(p => (
                      <button key={p.id} onClick={() => setSubIn(p.id)}
                        className="w-full text-left border-2 rounded px-2 py-1 mb-1 text-[10px] font-black truncate"
                        style={{ borderColor: subIn === p.id ? C.green : 'rgba(255,255,255,0.4)', backgroundColor: subIn === p.id ? C.green : 'rgba(255,255,255,0.12)', color: '#fff' }}>
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
            {live.subsUsed >= 3 && <p className="text-white/60 text-xs font-bold">✅ Substituição feita.</p>}
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

        {/* Todos os Jogos Ao Vivo */}
        {live.otherMatches && live.otherMatches.length > 0 && (() => {
          const DIV_LABEL: Record<number, string> = { 1: '1ª Divisão', 2: '2ª Divisão', 3: '3ª Divisão', 4: '4ª Divisão' }
          const DIV_COLOR: Record<number, string> = { 1: '#FFD700', 2: '#FF6B00', 3: '#16B89A', 4: '#9B6DFF' }
          const DIV_BG: Record<number, string>    = { 1: '#1e1600', 2: '#1e0c00', 3: '#001a13', 4: '#110020' }
          const byDiv = [1, 2, 3, 4]
            .map(d => ({ div: d, matches: live.otherMatches.filter(m => m.division === d) }))
            .filter(g => g.matches.length > 0)
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Ao Vivo — Todos os Jogos</p>
              </div>
              {byDiv.map(({ div, matches }) => {
                const color = DIV_COLOR[div]
                const bg = DIV_BG[div]
                const isMyDiv = div === live.division
                return (
                  <div key={div} className="rounded-lg overflow-hidden border-2"
                    style={{ borderColor: color, boxShadow: isMyDiv ? `0 0 14px ${color}70` : 'none' }}>
                    {/* colored division header bar */}
                    <div className="px-3 py-1.5 flex items-center justify-between"
                      style={{ backgroundColor: color }}>
                      <span className="text-black font-black text-[11px] uppercase tracking-wider">
                        {isMyDiv ? '▶ ' : ''}{DIV_LABEL[div]}
                      </span>
                      <span className="text-black/50 text-[9px] font-black">{matches.length}j</span>
                    </div>
                    {/* match rows */}
                    <div style={{ backgroundColor: bg }}>
                      {matches.map((m, mi) => {
                        const scored = m.goals.filter(g => g.min <= live.minute)
                        return (
                          <div key={m.homeId + m.awayId}
                            className="px-3 py-2 space-y-1"
                            style={{ borderTop: mi > 0 ? `1px solid ${color}25` : 'none' }}>
                            <div className="flex items-center gap-1">
                              <span className="flex-1 text-white font-black text-xs truncate">{m.homeName}</span>
                              <span className="shrink-0 font-black text-lg px-2 tabular-nums"
                                style={{ fontFamily: 'Oswald, sans-serif', color }}>
                                {m.gf}<span className="text-white/25 text-base mx-0.5">–</span>{m.ga}
                              </span>
                              <span className="flex-1 text-white/50 font-black text-xs truncate text-right">{m.awayName}</span>
                            </div>
                            {scored.length > 0 && (
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                {scored.map((g, gi) => (
                                  <motion.span key={gi} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                                    className="text-[9px] font-bold"
                                    style={{ color: g.isHome ? '#4ade80' : '#fb923c' }}>
                                    ⚽ {g.min}' {g.scorer ?? '—'}{g.isHome ? '' : ' (V)'}
                                  </motion.span>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
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
