import { useEmpresario } from '../store'
import { OBJECTIVES, yourNetWorth, levelInfo, PRESTIGE_UNLOCK } from '../data/career'
import { C, money, moneyFull, BrutalCard, BrutalButton, BrutalTag } from '../ui'

export default function RankingScreen() {
  const { state, dispatch } = useEmpresario()
  const myNet = yourNetWorth(state)

  const board = [
    { name: 'VOCÊ', wealth: myNet, you: true },
    ...state.rivalAgents.map(r => ({ name: r.name, wealth: r.wealth, you: false })),
  ].sort((a, b) => b.wealth - a.wealth)

  const myRank = board.findIndex(b => b.you) + 1
  const doneCount = OBJECTIVES.filter(o => o.done(state, myRank)).length

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })} className="text-white text-2xl font-black">←</button>
          <h1 className="text-white font-black text-lg flex-1" style={{ fontFamily: 'Oswald, sans-serif' }}>CARREIRA</h1>
          <BrutalTag color={C.yellow}>🏆 {state.awards}</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* your standing */}
        <BrutalCard color={myRank === 1 ? C.yellow : C.blue} className="p-5" shadow={6}>
          <p className={`font-mono text-xs uppercase tracking-widest ${myRank === 1 ? 'text-black/60' : 'text-white/70'}`}>Sua posição no ranking</p>
          <p className={`font-black text-4xl ${myRank === 1 ? 'text-black' : 'text-white'}`} style={{ fontFamily: 'Oswald, sans-serif' }}>
            {myRank}º {myRank === 1 ? '👑' : ''}
          </p>
          <p className={`text-sm font-bold mt-1 ${myRank === 1 ? 'text-black/70' : 'text-white/80'}`}>Patrimônio: {moneyFull(myNet)}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <BrutalTag color={C.yellow}>⭐ Nível {levelInfo(state.xp).level}</BrutalTag>
            <BrutalTag color={C.creamDark}>🏆 {state.awards}x do ano</BrutalTag>
            {state.prestige > 0 && <BrutalTag color={C.purple} textColor="#fff">👑 Prestígio {state.prestige}</BrutalTag>}
          </div>
        </BrutalCard>

        {/* ── PRESTÍGIO / NEW GAME+ ── */}
        {(() => {
          const unlocked = state.money >= PRESTIGE_UNLOCK
          const pct = Math.min(100, (state.money / PRESTIGE_UNLOCK) * 100)
          return (
            <BrutalCard color={unlocked ? C.purple : C.black} className="p-4" shadow={6}>
              <p className="text-white font-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>👑 RECOMEÇAR COMO LENDA</p>
              <p className="text-white/70 text-xs font-bold mt-1 leading-relaxed">
                Construiu um império? Volte a 1993 com tudo de novo pela frente — só que mais rico, mais respeitado e ganhando <b className="text-white">+10% em cada negócio</b> a cada prestígio. Para sempre.
              </p>
              {unlocked ? (
                <div className="mt-3">
                  <BrutalButton color={C.yellow} textColor="#000" onClick={() => {
                    if (confirm('Recomeçar em 1993 como uma lenda? Seu progresso atual será reiniciado, mas você ganha bônus permanentes de prestígio.')) {
                      dispatch({ type: 'PRESTIGE', playerName: 'Você' })
                    }
                  }}>
                    👑 Ascender ao Prestígio {state.prestige + 1} →
                  </BrutalButton>
                </div>
              ) : (
                <div className="mt-3">
                  <div className="h-3 bg-black/30 border-2 border-white/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: C.yellow }} />
                  </div>
                  <p className="text-white/60 text-[10px] font-bold mt-1">Desbloqueia ao acumular {moneyFull(PRESTIGE_UNLOCK)} em caixa · você tem {money(state.money)}</p>
                </div>
              )}
            </BrutalCard>
          )
        })()}

        {/* ranking board */}
        <div>
          <h2 className="font-black text-black mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>📊 RANKING DE EMPRESÁRIOS</h2>
          <div className="space-y-2">
            {board.map((b, i) => (
              <BrutalCard key={b.name} color={b.you ? C.teal : b.name.includes('Cambalhota') ? C.black : 'white'} className="p-3" shadow={3}>
                <div className="flex items-center gap-3">
                  <span className={`font-black text-lg w-6 ${b.you || b.name.includes('Cambalhota') ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Oswald, sans-serif' }}>{i + 1}º</span>
                  <span className={`flex-1 font-black text-sm ${b.you ? 'text-white' : b.name.includes('Cambalhota') ? 'text-white' : 'text-black'}`}>
                    {b.name.includes('Cambalhota') ? '😈 ' : ''}{b.name}
                  </span>
                  <span className={`font-black text-sm ${b.you || b.name.includes('Cambalhota') ? 'text-white' : 'text-black/60'}`} style={{ fontFamily: 'Oswald, sans-serif' }}>{money(b.wealth)}</span>
                </div>
              </BrutalCard>
            ))}
          </div>
        </div>

        {/* objectives */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>🎯 OBJETIVOS</h2>
            <BrutalTag color={C.teal}>{doneCount}/{OBJECTIVES.length}</BrutalTag>
          </div>
          <div className="space-y-2">
            {OBJECTIVES.map(o => {
              const done = o.done(state, myRank)
              return (
                <BrutalCard key={o.id} color={done ? C.green : 'white'} className="p-3" shadow={3}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{done ? '✅' : '⬜'}</span>
                    <span className={`text-sm font-bold ${done ? 'text-white line-through' : 'text-black'}`}>{o.label}</span>
                  </div>
                </BrutalCard>
              )
            })}
          </div>
        </div>

        <p className="text-black/40 text-xs font-bold text-center pt-1">
          Cresça mais rápido que o Cambalhota e seja o nº 1 do futebol mundial.
        </p>
      </div>
    </div>
  )
}
