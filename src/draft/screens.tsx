import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDraft, availableLegends } from './store'
import { START_CLUBS, squadStrength } from './data'
import { rarityOf } from '../empresario/data/career'
import { getCurrentRating } from '../empresario/data/legends'
import type { Legend } from '../empresario/types'
import { C, BrutalCard, BrutalButton, BrutalTag, POS_COLOR, FLAG } from '../empresario/ui'

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
              Agora cada um pega um timeco da <b>4ª divisão</b> e começa a corrida: a cada rodada, o <b>draft</b> abre e vocês disputam pra fisgar os futuros craques antes uns dos outros. Quem montar a maior dinastia vence.
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
        <p className="text-black/50 text-xs font-bold">Todos começam na 4ª divisão com um elenco de desconhecidos. A diferença vai ser o que você draftar.</p>
        <div className="grid grid-cols-2 gap-3">
          {START_CLUBS.map(c => (
            <BrutalCard key={c.id} color="white" className="p-3" shadow={4}
              onClick={() => dispatch({ type: 'PICK_CLUB', clubId: c.id, managerName: name.trim() })}>
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
  const you = state.managers[state.youIndex]
  const table = [...state.managers].sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga))
  const yourPos = table.findIndex(m => m.id === you.id) + 1
  const squad = [...you.squad].sort((a, b) => b.rating - a.rating)
  const legendsCount = you.squad.filter(p => p.legendId).length

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: C.cream }}>
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <BrutalTag color={C.yellow}>TEMP {state.season} · {state.year}</BrutalTag>
          <span className="text-white/50 font-mono text-xs">rodada {state.round}/{state.roundsPerSeason}</span>
          <BrutalTag color={C.teal}>{DIV(state.division)}</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* your club hero */}
        <BrutalCard color={C.purple} className="p-5" shadow={6}>
          <p className="text-white/70 font-mono text-xs uppercase tracking-widest">Seu clube</p>
          <p className="text-white font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{you.clubName}</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-white/15 border-2 border-black rounded-lg p-2 text-center">
              <p className="text-white/60 text-[10px] font-black uppercase">Posição</p>
              <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{yourPos}º</p>
            </div>
            <div className="bg-white/15 border-2 border-black rounded-lg p-2 text-center">
              <p className="text-white/60 text-[10px] font-black uppercase">Força XI</p>
              <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{Math.round(squadStrength(you.squad))}</p>
            </div>
            <div className="bg-white/15 border-2 border-black rounded-lg p-2 text-center">
              <p className="text-white/60 text-[10px] font-black uppercase">Lendas</p>
              <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{legendsCount}</p>
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

        {/* standings */}
        <div>
          <h2 className="font-black text-black mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>📊 CLASSIFICAÇÃO</h2>
          <BrutalCard color="white" className="p-0 overflow-hidden">
            {table.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2 px-3 py-2 border-b-2 border-black/10"
                   style={{ backgroundColor: m.isYou ? C.yellow : 'transparent' }}>
                <span className="w-5 text-center font-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black truncate ${m.isYou ? 'text-black' : 'text-black/70'}`}>{m.isYou ? '⭐ ' : ''}{m.clubName}</p>
                  <p className="text-black/40 text-[10px] font-bold">{m.name} · {m.lastResult}</p>
                </div>
                <span className="text-black/40 text-[10px] font-bold">{m.played}j</span>
                <span className="font-black text-black text-sm w-7 text-right" style={{ fontFamily: 'Oswald, sans-serif' }}>{m.points}</span>
              </div>
            ))}
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
      </div>
    </div>
  )
}

// ─── DRAFT ─────────────────────────────────────────────────────
export function DraftRoom() {
  const { state, dispatch } = useDraft()
  const pool = availableLegends(state).slice(0, 30)
  const you = state.managers[state.youIndex]

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
