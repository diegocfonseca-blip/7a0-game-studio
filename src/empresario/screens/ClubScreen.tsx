import { useEmpresario } from '../store'
import { C, money, moneyFull, BrutalCard, BrutalTag, POS_COLOR, FLAG } from '../ui'

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

  const placed = state.clients.filter(c => club.placedClientIds.includes(c.legendId))
  const notPlaced = state.clients.filter(c => !club.placedClientIds.includes(c.legendId))
  const pts = club.seasonWins * 3 + club.seasonDraws

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

        {/* season */}
        <BrutalCard color="white" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>📊 TEMPORADA</h2>
            <BrutalTag color={C.yellow}>{pts} pts</BrutalTag>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="border-2 border-black rounded-lg p-2 text-center" style={{ backgroundColor: C.green }}>
              <p className="text-white font-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{club.seasonWins}</p>
              <p className="text-white/80 text-[10px] font-black">VITÓRIAS</p>
            </div>
            <div className="border-2 border-black rounded-lg p-2 text-center" style={{ backgroundColor: C.yellow }}>
              <p className="text-black font-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{club.seasonDraws}</p>
              <p className="text-black/60 text-[10px] font-black">EMPATES</p>
            </div>
            <div className="border-2 border-black rounded-lg p-2 text-center" style={{ backgroundColor: C.orange }}>
              <p className="text-white font-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{club.seasonLosses}</p>
              <p className="text-white/80 text-[10px] font-black">DERROTAS</p>
            </div>
          </div>
          <p className="text-black/50 text-xs font-bold mt-3 text-center">Último jogo: {club.lastResult}</p>
        </BrutalCard>

        {/* placed players */}
        <div>
          <h2 className="font-black text-black mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>⚽ ESCALADOS NO SEU CLUBE</h2>
          <p className="text-black/50 text-xs font-bold mb-3">
            Coloque seus clientes pra jogar aqui: eles ganham minutos, sobem de moral e o clube fica mais forte.
          </p>
          {placed.length === 0 && (
            <BrutalCard color={C.creamDark} className="p-4 text-center" shadow={3}>
              <p className="text-black/50 text-sm font-bold">Nenhum cliente escalado ainda.</p>
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
                  <button
                    onClick={() => dispatch({ type: 'PLACE_CLIENT_IN_CLUB', legendId: c.legendId })}
                    className="border-2 border-black rounded-lg px-2 py-1 text-[10px] font-black bg-white"
                  >
                    TIRAR
                  </button>
                </div>
              </BrutalCard>
            ))}
          </div>
        </div>

        {/* available to place */}
        {notPlaced.length > 0 && (
          <div>
            <h2 className="font-black text-black mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>📥 DISPONÍVEIS</h2>
            <div className="space-y-2">
              {notPlaced.map(c => (
                <BrutalCard key={c.legendId} color="white" className="p-3" shadow={3}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{FLAG[c.nationality]}</span>
                    <div className="flex-1">
                      <span className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{c.nickname}</span>
                      <BrutalTag color={POS_COLOR[c.position]} textColor="#fff">{c.position}</BrutalTag>
                    </div>
                    <span className="font-black text-black/50 text-sm">{c.currentRating}</span>
                    <button
                      onClick={() => dispatch({ type: 'PLACE_CLIENT_IN_CLUB', legendId: c.legendId })}
                      className="border-2 border-black rounded-lg px-2 py-1 text-[10px] font-black"
                      style={{ backgroundColor: C.green, color: '#fff' }}
                    >
                      ESCALAR
                    </button>
                  </div>
                </BrutalCard>
              ))}
            </div>
          </div>
        )}

        <p className="text-black/40 text-xs font-bold text-center pt-2">
          O clube joga sozinho a cada 2 semanas. Renda de {moneyFull(club.cashPerWeek)}/semana cai direto no seu caixa.
        </p>
      </div>
    </div>
  )
}
