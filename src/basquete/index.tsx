import { motion } from 'framer-motion'
import { POSITIONS, POSITION_LABEL, FULL_ROSTER } from './types'

// ─── BidLegends — home do modo basquete (FASE 1: fundação / em construção) ───
// A Fase 1 entrega a casca: hostname bidlegendsarena.com abre aqui, a home tem
// as abas ⚽/🏀 e este teaser mostra o que vem. O jogo em si (baralho NBA, Street
// League, conferências) chega nas próximas fases. Ver docs/conceito-basquete.md.

const POS_EMOJI: Record<string, string> = {
  PG: '🎯', SG: '🎪', SF: '🪽', PF: '🧱', C: '🗼',
}

export default function BidLegendsGame() {
  return (
    <div
      className="min-h-screen flex flex-col items-center p-5 gap-6"
      style={{ backgroundColor: '#F4ECD6' }}
    >
      <div className="w-full max-w-sm flex flex-col gap-6 pt-2">
        {/* Marca */}
        <div className="text-center">
          <div className="text-5xl mb-2">🏀</div>
          <h1
            className="font-black text-4xl text-black leading-none"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            BID<span style={{ color: '#E8590C' }}>LEGENDS</span>
          </h1>
          <p className="text-black/60 text-sm mt-2 font-medium">
            As lendas da NBA no motor do Leilão Legends. Leilão cego por posição,
            monte seu quinteto e escale a pirâmide até o anel 💍.
          </p>
        </div>

        {/* Chip: em construção */}
        <div
          className="border-[3px] border-black rounded-2xl p-4 text-center"
          style={{ backgroundColor: '#FFC400', boxShadow: '6px 6px 0 0 #0C0C0C' }}
        >
          <p className="font-black text-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>
            🚧 EM CONSTRUÇÃO
          </p>
          <p className="text-black/70 text-sm mt-1 font-medium">
            Fase 1 no ar: o app já reconhece o <b>bidlegendsarena.com</b> e abre no
            basquete. O jogo tá sendo montado — volta já já.
          </p>
        </div>

        {/* Posições (fundação) */}
        <div
          className="border-[3px] border-black rounded-2xl p-5"
          style={{ backgroundColor: '#FFFFFF', boxShadow: '6px 6px 0 0 #0C0C0C' }}
        >
          <p
            className="font-black text-black text-xl mb-3"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            O QUINTETO ({POSITIONS.length} POSIÇÕES)
          </p>
          <div className="space-y-2">
            {POSITIONS.map((pos) => (
              <motion.div
                key={pos}
                whileTap={{ x: 2, y: 2 }}
                className="flex items-center gap-3 border-2 border-black rounded-xl px-3 py-2"
                style={{ backgroundColor: '#F4ECD6' }}
              >
                <span className="text-2xl">{POS_EMOJI[pos]}</span>
                <span
                  className="font-black text-black w-10"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  {pos}
                </span>
                <span className="text-black/70 text-sm font-medium">
                  {POSITION_LABEL[pos]}
                </span>
              </motion.div>
            ))}
          </div>
          <p className="text-black/50 text-xs mt-3 font-medium">
            Elenco completo = {FULL_ROSTER} (3 por posição, banco fundo pros 82 jogos).
          </p>
        </div>

        {/* A pirâmide (teaser) */}
        <div
          className="border-[3px] border-black rounded-2xl p-5"
          style={{ backgroundColor: '#1D4ED8', boxShadow: '6px 6px 0 0 #0C0C0C' }}
        >
          <p
            className="font-black text-white text-xl mb-3"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            A PIRÂMIDE
          </p>
          <div className="space-y-2 text-white/90 text-sm font-medium">
            <p>🛝 <b>Street League</b> — 20 times, sobem 4</p>
            <p>🔷 <b>G League</b> — Leste × Oeste, sobe/desce 4</p>
            <p>💍 <b>NBA</b> — o topo, rumo às Finals</p>
          </div>
        </div>
      </div>
    </div>
  )
}
