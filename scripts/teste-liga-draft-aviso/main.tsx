// 🧪 Foto do aviso "📋 Uma Liga Draft por vez" (05/11) — cópia FIEL do JSX do lobby.tsx (trocaDraft), só pra foto/conferência.
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
const INK = '#0C0C0C', GREEN = '#1B7A3D', GOLD = '#FFC400', OSWALD = { fontFamily: 'Oswald, sans-serif' }
const nome = 'Liga dos Amigos'
createRoot(document.getElementById('root')!).render(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.55)' }}>
    <div className="w-full max-w-[420px] rounded-2xl border-[3px] border-black p-4 space-y-3" style={{ background: '#F4ECD6', boxShadow: `4px 4px 0 ${INK}` }}>
      <p className="font-black text-[19px] uppercase leading-tight" style={{ ...OSWALD, color: INK }}>📋 Uma Liga Draft por vez</p>
      <p className="text-[13.5px] font-bold leading-snug text-black/80">{`No plano grátis você joga em 1 Liga Draft por vez. Você já joga em “${nome}”. Pra entrar nesta, precisa sair dela.`}</p>
      <p className="text-[12.5px] font-black" style={{ color: '#C2452F' }}>{`Quer sair de “${nome}” e entrar nesta?`}</p>
      <div className="grid grid-cols-2 gap-2">
        <button className="border-2 border-black rounded-xl px-3 py-2.5 font-black text-sm uppercase" style={{ ...OSWALD, background: GREEN, color: '#fff', boxShadow: `2px 2px 0 ${INK}` }}>✅ Sim, sair e entrar</button>
        <button className="border-2 border-black rounded-xl px-3 py-2.5 font-black text-sm uppercase bg-white" style={{ ...OSWALD, color: INK, boxShadow: `2px 2px 0 ${INK}` }}>✋ Não, ficar</button>
      </div>
      <button className="w-full border-2 border-black rounded-xl px-3 py-2 font-black text-[13px] uppercase" style={{ ...OSWALD, background: GOLD, color: INK }}>⭐ Com qualquer plano: joga nas duas e cria as suas ligas</button>
    </div>
  </div>)
