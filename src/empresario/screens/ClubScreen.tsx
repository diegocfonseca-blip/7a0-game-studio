import { useEmpresario } from '../store'
import { C, money, moneyFull, BrutalCard, BrutalButton, BrutalTag, POS_COLOR, FLAG } from '../ui'

const DIV_LABEL: Record<number, string> = { 1: '1ª (Elite)', 2: '2ª Divisão', 3: '3ª Divisão', 4: '4ª Divisão' }

export default function ClubScreen() {
  const { state, dispatch } = useEmpresario()
  const club = state.ownedClub
  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.cream }}>
        <p className="text-black font-bold">Nenhum clube.</p>
      </div>
    )
  }

  // placement rules: a client can play here only if he's AT your club or clubless
  const atClubOrFree = (c: typeof state.clients[number]) => !c.contractClub || c.contractClub === club.name
  const placed = state.clients.filter(c => club.placedClientIds.includes(c.legendId))
  const placeable = state.clients.filter(c => !club.placedClientIds.includes(c.legendId) && atClubOrFree(c))
  const elsewhere = state.clients.filter(c => c.contractClub && c.contractClub !== club.name && !club.placedClientIds.includes(c.legendId))

  const table = [...(club.table ?? [])].sort((a, b) => b.points - a.points || b.played - a.played)

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })} className="text-white text-2xl font-black">←</button>
          <h1 className="text-white font-black text-lg truncate" style={{ fontFamily: 'Oswald, sans-serif' }}>{club.name}</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* club hero */}
        <BrutalCard color={C.purple} className="p-5" shadow={6}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 font-mono text-xs uppercase tracking-widest">Sua agremiação</p>
              <p className="text-white font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{club.name}</p>
            </div>
            <span className="text-4xl">🏟️</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/15 border-2 border-black rounded-lg p-2 text-center">
              <p className="text-white/60 text-[10px] font-black uppercase">Divisão</p>
              <p className="text-white font-black text-sm mt-0.5" style={{ fontFamily: 'Oswald, sans-serif' }}>{DIV_LABEL[club.division]}</p>
            </div>
            <div className="bg-white/15 border-2 border-black rounded-lg p-2 text-center">
              <p className="text-white/60 text-[10px] font-black uppercase">Torcida</p>
              <p className="text-white font-black text-sm mt-0.5" style={{ fontFamily: 'Oswald, sans-serif' }}>{club.fans.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white/15 border-2 border-black rounded-lg p-2 text-center">
              <p className="text-white/60 text-[10px] font-black uppercase">Renda/sem</p>
              <p className="text-white font-black text-sm mt-0.5" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(club.cashPerWeek)}</p>
            </div>
          </div>
        </BrutalCard>

        {/* LEAGUE TABLE */}
        {table.length > 0 && (
          <div>
            <h2 className="font-black text-black mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>📊 CLASSIFICAÇÃO — {DIV_LABEL[club.division]}</h2>
            <BrutalCard color="white" className="p-0 overflow-hidden">
              {table.map((t, i) => {
                const promo = i < 2
                const releg = i >= table.length - 2 && club.division < 4
                return (
                  <div key={t.name} className="flex items-center gap-2 px-3 py-2 border-b-2 border-black/10"
                       style={{ backgroundColor: t.isYou ? C.yellow : 'transparent' }}>
                    <span className="w-5 text-center font-black text-sm" style={{ fontFamily: 'Oswald, sans-serif', color: promo ? C.tealDark : releg ? C.orange : '#000' }}>{i + 1}</span>
                    <span className="text-xs">{promo ? '🔼' : releg ? '🔽' : '·'}</span>
                    <span className={`flex-1 text-sm font-bold ${t.isYou ? 'text-black' : 'text-black/70'}`}>{t.isYou ? '⭐ ' : ''}{t.name}</span>
                    <span className="text-xs text-black/40 font-bold w-6 text-right">{t.played}j</span>
                    <span className="font-black text-black text-sm w-8 text-right" style={{ fontFamily: 'Oswald, sans-serif' }}>{t.points}</span>
                  </div>
                )
              })}
            </BrutalCard>
            <p className="text-black/40 text-[10px] font-bold mt-1">🔼 sobem · 🔽 caem · último jogo: {club.lastResult}</p>
          </div>
        )}

        {/* placed players */}
        <div>
          <h2 className="font-black text-black mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>⚽ ESCALADOS NO SEU CLUBE</h2>
          {placed.length === 0 && (
            <BrutalCard color={C.creamDark} className="p-4 text-center" shadow={3}>
              <p className="text-black/50 text-sm font-bold">Ninguém escalado. Coloque clientes que estão no seu clube (ou sem clube) pra jogar.</p>
            </BrutalCard>
          )}
          <div className="space-y-2">
            {placed.map(c => (
              <BrutalCard key={c.legendId} color={C.teal} className="p-3" shadow={3}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{FLAG[c.nationality]}</span>
                  <div className="flex-1">
                    <span className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{c.nickname}</span>
                    <BrutalTag color={POS_COLOR[c.position]} textColor="#fff">{c.position}</BrutalTag>
                  </div>
                  <span className="font-black text-black text-sm">{c.currentRating}</span>
                  <button onClick={() => dispatch({ type: 'PLACE_CLIENT_IN_CLUB', legendId: c.legendId })}
                    className="border-2 border-black rounded-lg px-2 py-1 text-[10px] font-black bg-white">TIRAR</button>
                </div>
              </BrutalCard>
            ))}
          </div>
        </div>

        {/* available to place (at your club / free) */}
        {placeable.length > 0 && (
          <div>
            <h2 className="font-black text-black mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>📥 PRONTOS PRA ESCALAR</h2>
            <div className="space-y-2">
              {placeable.map(c => (
                <BrutalCard key={c.legendId} color="white" className="p-3" shadow={3}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{FLAG[c.nationality]}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{c.nickname}</span>
                      <BrutalTag color={POS_COLOR[c.position]} textColor="#fff">{c.position}</BrutalTag>
                      <p className="text-black/40 text-[10px] font-bold">{c.contractClub ? `no ${c.contractClub}` : 'sem clube — livre'}</p>
                    </div>
                    <span className="font-black text-black/50 text-sm">{c.currentRating}</span>
                    <button onClick={() => dispatch({ type: 'PLACE_CLIENT_IN_CLUB', legendId: c.legendId })}
                      className="border-2 border-black rounded-lg px-2 py-1 text-[10px] font-black" style={{ backgroundColor: C.green, color: '#fff' }}>ESCALAR</button>
                  </div>
                </BrutalCard>
              ))}
            </div>
          </div>
        )}

        {/* clients at OTHER clubs — must be bought to play here */}
        {elsewhere.length > 0 && (
          <div>
            <h2 className="font-black text-black mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>🔁 TRAZER PRO CLUBE</h2>
            <p className="text-black/50 text-xs font-bold mb-2">Estes clientes seus jogam em OUTROS times. Pra escalá-los aqui, você precisa comprá-los do clube atual.</p>
            <div className="space-y-2">
              {elsewhere.map(c => {
                const cost = Math.round(c.currentValue)
                const canAfford = state.money >= cost
                return (
                  <BrutalCard key={c.legendId} color={C.creamDark} className="p-3" shadow={3}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{FLAG[c.nationality]}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{c.nickname}</span>
                        <BrutalTag color={POS_COLOR[c.position]} textColor="#fff">{c.position}</BrutalTag>
                        <p className="text-black/40 text-[10px] font-bold truncate">joga no {c.contractClub}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-black text-xs mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(cost)}</p>
                        <BrutalButton color={canAfford ? C.green : '#C9C2AC'} disabled={!canAfford} full={false}
                          className="!px-2 !py-1.5 !text-[10px]"
                          onClick={() => dispatch({ type: 'BUY_TO_CLUB', legendId: c.legendId })}>
                          {canAfford ? 'Comprar' : 'Sem $'}
                        </BrutalButton>
                      </div>
                    </div>
                  </BrutalCard>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-black/40 text-xs font-bold text-center pt-2">
          O clube joga a cada 2 semanas. Renda de {moneyFull(club.cashPerWeek)}/semana cai no seu caixa.
        </p>
      </div>
    </div>
  )
}
