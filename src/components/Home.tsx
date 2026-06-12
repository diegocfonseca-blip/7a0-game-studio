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
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0d0d0d 0%, #111 60%, #1a1200 100%)' }}>

      {/* Top bar */}
      <div className="px-5 pt-6 pb-0 flex items-center justify-between">
        <span className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: '#C9A84C', opacity: 0.7 }}>
          0a7 LEGENDS
        </span>
        <span className="text-[9px] font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
          1930 – 2024
        </span>
      </div>

      {/* Hero */}
      <div className="px-5 pt-8 pb-6">
        <div className="mb-2">
          <div className="text-[86px] font-black leading-none tracking-tighter" style={{ color: '#C9A84C', textShadow: '0 0 60px rgba(201,168,76,0.4), 0 0 120px rgba(201,168,76,0.15)' }}>
            0a7
          </div>
          <div className="text-[52px] font-black leading-none tracking-tight" style={{ color: '#fff', letterSpacing: '-0.03em' }}>
            LEGENDS
          </div>
        </div>
        <div className="flex gap-2 mb-5 mt-3">
          <div className="h-1 w-16 rounded-full" style={{ background: '#C9A84C' }} />
          <div className="h-1 w-8 rounded-full" style={{ background: '#D12E2E' }} />
          <div className="h-1 w-4 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 280 }}>
          Monte um time dos sonhos com lendas históricas e dispute uma Copa do Mundo.
        </p>
      </div>

      {/* Stats strip */}
      <div className="mx-5 rounded-2xl px-4 py-3 mb-6 flex justify-around" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {[
          { v: `${TOTAL_SQUADS + TOTAL_CLUBS}`, l: 'TIMES' },
          { v: `${TOTAL_PLAYERS + TOTAL_CLUB_PLAYERS}+`, l: 'JOGADORES' },
          { v: '94', l: 'ANOS DE HIST.' },
        ].map(s => (
          <div key={s.l} className="text-center">
            <div className="text-xl font-black" style={{ color: '#C9A84C' }}>{s.v}</div>
            <div className="text-[8px] font-black tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Mode picker */}
      <div className="px-5 flex-1">
        <p className="text-[10px] font-black tracking-[0.2em] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>ESCOLHA O MODO</p>

        <div className="flex flex-col gap-3 mb-5">
          {/* Seleções */}
          <button
            onClick={() => setPicked('national')}
            className="w-full text-left transition-all active:scale-[0.98]"
            style={{
              borderRadius: 20,
              padding: '16px',
              background: picked === 'national'
                ? 'linear-gradient(135deg, rgba(209,46,46,0.2) 0%, rgba(209,46,46,0.08) 100%)'
                : 'rgba(255,255,255,0.04)',
              border: picked === 'national' ? '1.5px solid rgba(209,46,46,0.6)' : '1.5px solid rgba(255,255,255,0.08)',
              boxShadow: picked === 'national' ? '0 0 24px rgba(209,46,46,0.2), inset 0 1px 0 rgba(255,255,255,0.07)' : 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: picked === 'national' ? 'rgba(209,46,46,0.2)' : 'rgba(255,255,255,0.06)' }}>
                🌍
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm mb-0.5" style={{ color: '#fff' }}>Seleções Históricas</div>
                <div className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>Brasil 70, Argentina 86, Holanda 74...</div>
                <div className="text-[10px] font-black mt-1.5" style={{ color: '#C9A84C' }}>
                  {TOTAL_SQUADS} seleções · {TOTAL_PLAYERS}+ jogadores
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                style={{ borderColor: picked === 'national' ? '#D12E2E' : 'rgba(255,255,255,0.2)', background: picked === 'national' ? '#D12E2E' : 'transparent' }}>
                {picked === 'national' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </div>
          </button>

          {/* Clubes */}
          <button
            onClick={() => setPicked('clubs')}
            className="w-full text-left transition-all active:scale-[0.98]"
            style={{
              borderRadius: 20,
              padding: '16px',
              background: picked === 'clubs'
                ? 'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.06) 100%)'
                : 'rgba(255,255,255,0.04)',
              border: picked === 'clubs' ? '1.5px solid rgba(201,168,76,0.6)' : '1.5px solid rgba(255,255,255,0.08)',
              boxShadow: picked === 'clubs' ? '0 0 24px rgba(201,168,76,0.18), inset 0 1px 0 rgba(255,255,255,0.07)' : 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: picked === 'clubs' ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.06)' }}>
                🏆
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm mb-0.5" style={{ color: '#fff' }}>Clubes Históricos</div>
                <div className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>Barça MSN, Flamengo 82, Milan 89...</div>
                <div className="text-[10px] font-black mt-1.5" style={{ color: '#C9A84C' }}>
                  {TOTAL_CLUBS} clubes · {TOTAL_CLUB_PLAYERS}+ jogadores
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                style={{ borderColor: picked === 'clubs' ? '#C9A84C' : 'rgba(255,255,255,0.2)', background: picked === 'clubs' ? '#C9A84C' : 'transparent' }}>
                {picked === 'clubs' && <div className="w-2 h-2 rounded-full" style={{ background: '#1a1a1a' }} />}
              </div>
            </div>
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={() => picked && onPlay(picked)}
          disabled={!picked}
          className="w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all active:scale-[0.97]"
          style={{
            background: picked
              ? 'linear-gradient(135deg, #D12E2E 0%, #a01f1f 100%)'
              : 'rgba(255,255,255,0.06)',
            color: picked ? '#fff' : 'rgba(255,255,255,0.2)',
            boxShadow: picked ? '0 8px 32px rgba(209,46,46,0.4), 0 2px 8px rgba(0,0,0,0.3)' : 'none',
            cursor: picked ? 'pointer' : 'not-allowed',
          }}
        >
          {picked ? 'JOGAR AGORA →' : 'ESCOLHA UM MODO'}
        </button>

        {/* How it works */}
        <div className="flex gap-4 mt-8 pb-8">
          {[
            { n: '01', t: 'ROLE', d: 'Sorteia um time histórico lendário' },
            { n: '02', t: 'MONTE', d: 'Escale um craque por sorteio' },
            { n: '03', t: 'SIMULE', d: 'Seu time faz o 7 a 0?' },
          ].map(s => (
            <div key={s.n} className="flex-1">
              <div className="font-black text-xl leading-none mb-1" style={{ color: '#D12E2E' }}>{s.n}</div>
              <div className="font-black text-[10px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.t}</div>
              <div className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
