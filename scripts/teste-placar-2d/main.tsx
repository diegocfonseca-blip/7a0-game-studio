// 🧪 Bancada do 2D NO LUGAR DO PLACAR (20/10): o `LiveScoreCard` de verdade (o placar de TODA competição) numa SALA ONLINE
// marcada "📺 2D" — prova que o campinho TOMA O LUGAR do placar sozinho, com o telão de propaganda embaixo.
//   ?comp=copa|liga|mundo  (só muda a cor da barra de baixo, pra conferir que é o mesmo placar das copas)
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { GiroDaRodada } from '../../src/escalacao/screens'
import { LiveScoreCard } from '../../src/escalacao/pyramidseason'
import { EscCtxBancada } from '../../src/escalacao/store'
import { DUR_2D_MS } from '../../src/escalacao/campo2d-motor'
try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ }
const q = new URLSearchParams(location.search)
const comp = q.get('comp') ?? 'copa'
const casa = [
  { name: 'Taffarel', club: 'Internacional', year: 1989, pos: 'GOL', fame: 5 }, { name: 'Cafu', club: 'Milan', year: 2004, pos: 'LAT', fame: 5 }, { name: 'Thiago Silva', club: 'Fluminense', year: 2008, pos: 'ZAG', fame: 4 },
  { name: 'Índio', club: 'Internacional', year: 2010, pos: 'ZAG', fame: 2 }, { name: 'Roberto Carlos', club: 'Real Madrid', year: 2002, pos: 'LAT', fame: 5 },
  { name: 'Mineiro', club: 'São Paulo', year: 2005, pos: 'MEI', fame: 3 }, { name: 'Zico', club: 'Flamengo', year: 1981, pos: 'MEI', fame: 5 }, { name: 'Kaká', club: 'Milan', year: 2007, pos: 'MEI', fame: 5 },
  { name: 'Dentinho', club: 'Corinthians', year: 2009, pos: 'ATA', fame: 2 }, { name: 'Romário', club: 'Vasco', year: 2000, pos: 'ATA', fame: 5 }, { name: 'Ronaldo Fenômeno', club: 'Inter', year: 1998, pos: 'ATA', fame: 5 },
]
const fora = [
  { name: 'Alex Muralha', club: 'Flamengo', year: 2017, pos: 'GOL', fame: 1 }, { name: 'Cicinho', club: 'São Paulo', year: 2005, pos: 'LAT', fame: 2 }, { name: 'John Terry', club: 'Chelsea', year: 2007, pos: 'ZAG', fame: 5 },
  { name: 'Chicão', club: 'Corinthians', year: 2009, pos: 'ZAG', fame: 2 }, { name: 'Ashley Cole', club: 'Chelsea', year: 2008, pos: 'LAT', fame: 5 },
  { name: 'Frank Lampard', club: 'Chelsea', year: 2010, pos: 'MEI', fame: 5 }, { name: 'Léo Lima', club: 'Vasco', year: 2003, pos: 'MEI', fame: 1 }, { name: 'Steven Gerrard', club: 'Liverpool', year: 2009, pos: 'MEI', fame: 5 },
  { name: 'Thierry Henry', club: 'Arsenal', year: 2004, pos: 'ATA', fame: 5 }, { name: 'Luciano', club: 'São Paulo', year: 2023, pos: 'ATA', fame: 3 }, { name: 'Lionel Messi', club: 'Barcelona', year: 2012, pos: 'ATA', fame: 5 },
]
const gols = [{ name: 'Romário', min: 23, home: true, assist: 'Kaká' }, { name: 'Frank Lampard', min: 54, home: false }]
const tint = comp === 'mundo' ? { bg: '#FFF3C2', border: '#f0d98a', holo: 0.5 } : comp === 'copa' ? { bg: '#F3EAFE', border: '#d9c3f5', holo: 0.5 } : undefined
const estado = { onlineMode: 'online', campo2d: true, managers: [], tactics: {}, round: 1 }
function Bancada() {
  const [min, setMin] = useState(Number(q.get('de') ?? 0))
  useEffect(() => { const iv = setInterval(() => setMin(m => Math.min(93, m + 1)), (DUR_2D_MS * 0.82) / 93); return () => clearInterval(iv) }, [])
  return (
    <EscCtxBancada.Provider value={{ state: estado, dispatch: () => {} } as never}>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        <LiveScoreCard enhancedOnline homeName="Fabulous EC" awayName="Chelsão" homeColor="#FFC400" awayColor="#2B6CFF" youIsHome goals={gols}
          roundKey={3} roundMs={DUR_2D_MS} displayMinute={min} footTint={tint} elencos={{ casa: casa as never, fora: fora as never }} />
        {/* 📢 o telão de propaganda, embaixo, no lugar de sempre */}
        <GiroDaRodada cinema exemplos={[{ texto: '🚗 Vadico Veículos · Oferta do dia: GWM Haval H6 0 km blindado · Menor valor do Rio', cor: '#FFC400' }]} />
      </div>
    </EscCtxBancada.Provider>
  )
}
createRoot(document.getElementById('root')!).render(<Bancada />)
