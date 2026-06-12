import { TOTAL_SQUADS, TOTAL_PLAYERS } from '../data/squads'

interface Props { onPlay: () => void }

const EXAMPLE_PLAYERS = [
  { name: 'Yashin', pos: { x: 50, y: 88 } },
  { name: 'Carlos Alberto', pos: { x: 82, y: 72 } },
  { name: 'Beckenbauer', pos: { x: 62, y: 72 } },
  { name: 'Moore', pos: { x: 38, y: 72 } },
  { name: 'R. Carlos', pos: { x: 18, y: 72 } },
  { name: 'Neeskens', pos: { x: 65, y: 52 } },
  { name: 'Pelé', pos: { x: 50, y: 52 } },
  { name: 'Zidane', pos: { x: 35, y: 52 } },
  { name: 'C. Ronaldo', pos: { x: 75, y: 28 } },
  { name: 'Maradona', pos: { x: 50, y: 18 } },
  { name: 'Messi', pos: { x: 25, y: 28 } },
]

export default function Home({ onPlay }: Props) {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 max-w-5xl mx-auto">
        <span className="text-xs font-bold tracking-widest text-[#888] uppercase">Copa dos Sonhos · 1930 — 2022</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center gap-8 py-8">
          {/* Left */}
          <div className="flex-1 text-left">
            {/* Big title */}
            <div className="leading-none mb-6">
              <div className="text-[100px] md:text-[140px] font-black text-[#1a1a1a] leading-none tracking-tighter">
                LENDAS
              </div>
              <div className="flex items-center gap-4">
                <div className="h-3 w-32 bg-[#C9A84C] rounded-full" />
                <div className="text-[100px] md:text-[140px] font-black text-[#1a1a1a] leading-none tracking-tighter">
                  DA
                </div>
              </div>
              <div className="text-[100px] md:text-[140px] font-black text-[#1a1a1a] leading-none tracking-tighter">
                COPA
              </div>
            </div>

            <p className="text-xl md:text-2xl font-bold text-[#1a1a1a] mb-2">Role o dado.</p>
            <p className="text-xl md:text-2xl font-bold text-[#1a1a1a] mb-2">Monte sua seleção</p>
            <p className="text-xl md:text-2xl font-bold text-[#1a1a1a] mb-6">dos sonhos.</p>

            <p className="text-[#666] text-base mb-8 max-w-sm">
              Role o dado: sai uma seleção histórica e uma Copa. Escale um craque que esteve lá, complete os 11 e simule — seu time faz 7 a 0?
            </p>

            <div className="flex gap-3 mb-10">
              <button
                onClick={onPlay}
                className="bg-[#D12E2E] text-white font-black text-sm px-8 py-4 rounded-sm tracking-widest uppercase hover:bg-[#b52626] transition-colors animate-pulse-ring"
              >
                JOGAR AGORA →
              </button>
            </div>

            {/* Steps */}
            <div className="flex gap-6 text-sm">
              {[
                { n: '01', title: 'ROLE', desc: 'Sorteia uma seleção histórica e uma Copa' },
                { n: '02', title: 'MONTE', desc: 'Escale um craque que jogou ali' },
                { n: '03', title: 'SIMULE', desc: 'Veja se seu time é campeão' },
              ].map(s => (
                <div key={s.n} className="flex flex-col gap-1">
                  <span className="text-[#D12E2E] font-black text-lg">{s.n}</span>
                  <span className="font-black text-[#1a1a1a] text-xs tracking-widest">{s.title}</span>
                  <span className="text-[#888] text-xs">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Field */}
          <div className="flex-shrink-0 w-full md:w-72">
            <div className="relative w-full aspect-[3/4] bg-[#2d7a2d] rounded-lg overflow-hidden border-2 border-[#1a5c1a]">
              {/* Field markings */}
              <div className="absolute inset-0">
                <div className="absolute top-[8%] left-[15%] right-[15%] h-[14%] border border-white/30 rounded-sm" />
                <div className="absolute top-[8%] left-[30%] right-[30%] h-[7%] border border-white/30" />
                <div className="absolute top-1/2 left-0 right-0 border-t border-white/30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/30" />
                <div className="absolute bottom-[8%] left-[15%] right-[15%] h-[14%] border border-white/30 rounded-sm" />
                <div className="absolute bottom-[8%] left-[30%] right-[30%] h-[7%] border border-white/30" />
              </div>
              {/* Players */}
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
            { value: String(TOTAL_SQUADS), label: 'seleções históricas' },
            { value: `${TOTAL_PLAYERS}+`, label: 'jogadores lendários' },
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
