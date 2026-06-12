import { useState } from 'react'
import { TOTAL_SQUADS, TOTAL_PLAYERS } from '../data/squads'
import clubs from '../data/clubs'
import type { GameCategory } from '../App'

interface Props { onPlay: (category: GameCategory) => void }

const TOTAL_CLUBS = clubs.length
const TOTAL_CLUB_PLAYERS = clubs.reduce((a, c) => a + c.players.length, 0)

export default function Home({ onPlay }: Props) {
  const [picked, setPicked] = useState<GameCategory | null>(null)

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      {/* Top bar */}
      <div className="px-5 pt-5 pb-2">
        <span className="text-[10px] font-black tracking-[0.2em] text-[#aaa] uppercase">0a7legends · 1930–2024</span>
      </div>

      {/* Hero */}
      <div className="px-5 pt-2 pb-6">
        <div className="flex items-end gap-2 mb-1">
          <span className="text-[72px] font-black text-[#1a1a1a] leading-none tracking-tighter">0a7</span>
          <div className="mb-3">
            <div className="w-20 h-2 bg-[#C9A84C] rounded-full mb-1" />
            <div className="w-10 h-2 bg-[#D12E2E] rounded-full" />
          </div>
        </div>
        <div className="text-[52px] font-black text-[#D12E2E] leading-none tracking-tight mb-4">LEGENDS</div>
        <p className="text-sm text-[#666] leading-relaxed max-w-xs">
          Role o dado, monte um time dos sonhos com craques históricos e dispute uma Copa do Mundo.
        </p>
      </div>

      {/* Mode picker */}
      <div className="px-5 flex-1">
        <p className="text-[10px] font-black tracking-[0.2em] text-[#888] uppercase mb-3">Escolha o modo</p>

        <div className="flex flex-col gap-2 mb-5">
          {/* Seleções */}
          <button
            onClick={() => setPicked('national')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
              picked === 'national'
                ? 'border-[#D12E2E] bg-white shadow-md'
                : 'border-transparent bg-white/70 hover:bg-white hover:border-gray-200'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
              picked === 'national' ? 'bg-[#D12E2E]/10' : 'bg-gray-100'
            }`}>🌍</div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm text-[#1a1a1a] mb-0.5">Seleções Históricas</div>
              <div className="text-[11px] text-[#888] truncate">Brasil 70, Argentina 86, Holanda 74...</div>
              <div className="text-[10px] text-[#C9A84C] font-bold mt-1">
                {TOTAL_SQUADS} seleções · {TOTAL_PLAYERS}+ jogadores
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              picked === 'national' ? 'border-[#D12E2E] bg-[#D12E2E]' : 'border-gray-300'
            }`}>
              {picked === 'national' && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </button>

          {/* Clubes */}
          <button
            onClick={() => setPicked('clubs')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
              picked === 'clubs'
                ? 'border-[#1a1a1a] bg-white shadow-md'
                : 'border-transparent bg-white/70 hover:bg-white hover:border-gray-200'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
              picked === 'clubs' ? 'bg-[#1a1a1a]/10' : 'bg-gray-100'
            }`}>🏆</div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm text-[#1a1a1a] mb-0.5">Clubes Históricos</div>
              <div className="text-[11px] text-[#888] truncate">Barça 2015 MSN, Flamengo 82, Milan 89...</div>
              <div className="text-[10px] text-[#C9A84C] font-bold mt-1">
                {TOTAL_CLUBS} clubes · {TOTAL_CLUB_PLAYERS}+ jogadores
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              picked === 'clubs' ? 'border-[#1a1a1a] bg-[#1a1a1a]' : 'border-gray-300'
            }`}>
              {picked === 'clubs' && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={() => picked && onPlay(picked)}
          disabled={!picked}
          className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all ${
            picked
              ? 'bg-[#D12E2E] text-white shadow-lg hover:bg-[#b52626] active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {picked ? 'JOGAR AGORA →' : 'ESCOLHA UM MODO'}
        </button>

        {/* How it works */}
        <div className="flex gap-6 mt-8 pb-8">
          {[
            { n: '01', t: 'ROLE', d: 'Sorteia um time histórico' },
            { n: '02', t: 'MONTE', d: 'Escale um craque' },
            { n: '03', t: 'SIMULE', d: 'Seu time faz 7 a 0?' },
          ].map(s => (
            <div key={s.n} className="flex-1">
              <div className="text-[#D12E2E] font-black text-lg leading-none mb-1">{s.n}</div>
              <div className="text-[#1a1a1a] font-black text-[10px] tracking-widest mb-1">{s.t}</div>
              <div className="text-[#888] text-[10px] leading-tight">{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats footer */}
      <div className="border-t border-[#e0dcd4] mx-5 py-5 flex justify-around text-center">
        {[
          { v: `${TOTAL_SQUADS + TOTAL_CLUBS}`, l: 'times' },
          { v: `${TOTAL_PLAYERS + TOTAL_CLUB_PLAYERS}+`, l: 'jogadores' },
          { v: '1930', l: 'primeira Copa' },
        ].map(s => (
          <div key={s.l}>
            <div className="text-xl font-black text-[#D12E2E]">{s.v}</div>
            <div className="text-[9px] text-[#aaa] uppercase tracking-widest">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
