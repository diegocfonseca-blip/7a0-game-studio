import { useState } from 'react'
import { TOTAL_SQUADS, TOTAL_PLAYERS } from '../data/squads'
import clubs from '../data/clubs'
import type { GameCategory } from '../App'

interface Props { onPlay: (category: GameCategory) => void }

const TOTAL_CLUBS = clubs.length
const TOTAL_CLUB_PLAYERS = clubs.reduce((a, c) => a + c.players.length, 0)

const EXAMPLE_PLAYERS = [
  { name: 'Yashin',        pos: { x: 50, y: 88 } },
  { name: 'Carlos Alberto',pos: { x: 82, y: 72 } },
  { name: 'Beckenbauer',   pos: { x: 62, y: 72 } },
  { name: 'Moore',         pos: { x: 38, y: 72 } },
  { name: 'R. Carlos',     pos: { x: 18, y: 72 } },
  { name: 'Neeskens',      pos: { x: 65, y: 52 } },
  { name: 'Pelé',          pos: { x: 50, y: 52 } },
  { name: 'Zidane',        pos: { x: 35, y: 52 } },
  { name: 'C. Ronaldo',    pos: { x: 75, y: 28 } },
  { name: 'Maradona',      pos: { x: 50, y: 18 } },
  { name: 'Messi',         pos: { x: 25, y: 28 } },
]

export default function Home({ onPlay }: Props) {
  const [picked, setPicked] = useState<GameCategory | null>(null)

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 max-w-5xl mx-auto">
        <span className="text-xs font-bold tracking-widest text-[#888] uppercase">Lendas da Copa · 1930 — 2024</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center gap-8 py-8">
          {/* Left */}
          <div className="flex-1 text-left">
            <div className="leading-none mb-6">
              <div className="text-[80px] md:text-[120px] font-black text-[#1a1a1a] leading-none tracking-tighter">
                LENDAS
              </div>
              <div className="flex items-center gap-4">
                <div className="h-3 w-28 bg-[#C9A84C] rounded-full" />
                <div className="text-[80px] md:text-[120px] font-black text-[#1a1a1a] leading-none tracking-tighter">
                  DA
                </div>
              </div>
              <div className="text-[80px] md:text-[120px] font-black text-[#1a1a1a] leading-none tracking-tighter">
                COPA
              </div>
            </div>

            <p className="text-lg font-bold text-[#666] mb-8 max-w-sm leading-relaxed">
              Role o dado, monte seu time dos sonhos com craques históricos e simule uma Copa do Mundo.
            </p>

            {/* MODE PICKER */}
            <div className="mb-8">
              <div className="text-[10px] font-black text-[#888] tracking-[0.25em] mb-3">ESCOLHA O MODO</div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Seleções */}
                <button
                  onClick={() => setPicked('national')}
                  className={`flex-1 border-2 rounded-xl p-4 text-left transition-all ${
                    picked === 'national'
                      ? 'border-[#D12E2E] bg-[#D12E2E]/5'
                      : 'border-gray-200 bg-white hover:border-[#D12E2E]/50'
                  }`}
                >
                  <div className="text-2xl mb-1">🌍</div>
                  <div className="font-black text-sm text-[#1a1a1a] mb-0.5">SELEÇÕES HISTÓRICAS</div>
                  <div className="text-[11px] text-[#888] leading-tight">
                    Brasil 70, Argentina 86, Holanda 74...
                  </div>
                  <div className="text-[10px] text-[#C9A84C] font-bold mt-1.5">
                    {TOTAL_SQUADS} seleções · {TOTAL_PLAYERS}+ jogadores
                  </div>
                </button>

                {/* Clubes */}
                <button
                  onClick={() => setPicked('clubs')}
                  className={`flex-1 border-2 rounded-xl p-4 text-left transition-all ${
                    picked === 'clubs'
                      ? 'border-[#1a1a1a] bg-[#1a1a1a]/5'
                      : 'border-gray-200 bg-white hover:border-[#1a1a1a]/40'
                  }`}
                >
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="font-black text-sm text-[#1a1a1a] mb-0.5">CLUBES HISTÓRICOS</div>
                  <div className="text-[11px] text-[#888] leading-tight">
                    Barça 2015 MSN, Flamengo 82, Milan 89...
                  </div>
                  <div className="text-[10px] text-[#C9A84C] font-bold mt-1.5">
                    {TOTAL_CLUBS} clubes · {TOTAL_CLUB_PLAYERS}+ jogadores
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={() => picked && onPlay(picked)}
              disabled={!picked}
              className={`font-black text-sm px-10 py-4 rounded-sm tracking-widest uppercase transition-all ${
                picked
                  ? 'bg-[#D12E2E] text-white hover:bg-[#b52626] animate-pulse-ring cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {picked ? 'JOGAR AGORA →' : 'ESCOLHA UM MODO'}
            </button>

            {/* Steps */}
            <div className="flex gap-6 text-sm mt-10">
              {[
                { n: '01', title: 'ROLE', desc: 'Sorteia um time histórico' },
                { n: '02', title: 'MONTE', desc: 'Escale um craque desse time' },
                { n: '03', title: 'SIMULE', desc: 'Seu time faz 7 a 0?' },
              ].map(s => (
                <div key={s.n} className="flex flex-col gap-1">
                  <span className="text-[#D12E2E] font-black text-lg">{s.n}</span>
                  <span className="font-black text-[#1a1a1a] text-xs tracking-widest">{s.title}</span>
                  <span className="text-[#888] text-xs">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Field preview */}
          <div className="flex-shrink-0 w-full md:w-72">
            <div className="relative w-full aspect-[3/4] bg-[#2d7a2d] rounded-lg overflow-hidden border-2 border-[#1a5c1a]">
              <div className="absolute inset-0">
                <div className="absolute top-[8%] left-[15%] right-[15%] h-[14%] border border-white/30 rounded-sm" />
                <div className="absolute top-[8%] left-[30%] right-[30%] h-[7%] border border-white/30" />
                <div className="absolute top-1/2 left-0 right-0 border-t border-white/30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/30" />
                <div className="absolute bottom-[8%] left-[15%] right-[15%] h-[14%] border border-white/30 rounded-sm" />
                <div className="absolute bottom-[8%] left-[30%] right-[30%] h-[7%] border border-white/30" />
              </div>
              {EXAMPLE_PLAYERS.map((p) => (
                <div
                  key={p.name}
                  className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${p.pos.x}%`, top: `${p.pos.y}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-[#1a1a1a] flex items-center justify-center text-xs font-black text-[#1a1a1a] shadow-md">
                    {p.name.charAt(0)}
                  </div>
                  <span className="text-[9px] text-white font-bold mt-0.5 drop-shadow text-center leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                    {p.name.split(' ').pop()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-[#ddd] py-6 flex justify-center gap-8 text-center">
          {[
            { value: String(TOTAL_SQUADS + TOTAL_CLUBS), label: 'times históricos' },
            { value: `${TOTAL_PLAYERS + TOTAL_CLUB_PLAYERS}+`, label: 'jogadores lendários' },
            { value: '1930', label: 'primeira Copa' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-black text-[#D12E2E]">{s.value}</div>
              <div className="text-xs text-[#888] uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
