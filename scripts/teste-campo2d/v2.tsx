// 🧪 Bancada do MOTOR 2D v2 (experimental, 20/10): o MESMO desenho do campinho de hoje rodando o motor novo (`motor2/`), em que
// nada é decidido antes — o placar sai do que acontece. ?vel=4 acelera · ?seed=7 troca o jogo · ?de=30 começa no 30'.
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { useEffect, useMemo, useState } from 'react'
import { Campo2D } from '../../src/escalacao/campo2d'
import { DUR_2D_MS } from '../../src/escalacao/campo2d-motor'
import { Motor2 } from '../../src/escalacao/motor2/motor'
import { carimboDoTime } from '../../src/escalacao/mascotes'
import { Escudo } from '../../src/escalacao/escudos'
const q = new URLSearchParams(location.search)
const VEL = Number(q.get('vel') ?? 1), SEED = Number(q.get('seed') ?? 14)
try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ }
const casa = [
  { name: 'Taffarel', club: 'Internacional', year: 1989, pos: 'GOL', fame: 5, lo: 86, hi: 92 }, { name: 'Cafu', club: 'Milan', year: 2004, pos: 'LAT', fame: 5, lo: 89, hi: 94 }, { name: 'Thiago Silva', club: 'Fluminense', year: 2008, pos: 'ZAG', fame: 4, lo: 82, hi: 88 },
  { name: 'Índio', club: 'Internacional', year: 2010, pos: 'ZAG', fame: 2, lo: 66, hi: 73 }, { name: 'Roberto Carlos', club: 'Real Madrid', year: 2002, pos: 'LAT', fame: 5, lo: 90, hi: 95 },
  { name: 'Mineiro', club: 'São Paulo', year: 2005, pos: 'MEI', fame: 3, lo: 74, hi: 80 }, { name: 'Zico', club: 'Flamengo', year: 1981, pos: 'MEI', fame: 5, lo: 93, hi: 97 }, { name: 'Ronaldinho Gaúcho', club: 'Barcelona', year: 2005, pos: 'MEI', fame: 5, lo: 93, hi: 97 },
  { name: 'Dentinho', club: 'Corinthians', year: 2009, pos: 'ATA', fame: 2, lo: 64, hi: 71 }, { name: 'Romário', club: 'Vasco', year: 2000, pos: 'ATA', fame: 5, lo: 94, hi: 98 }, { name: 'Ronaldo Fenômeno', club: 'Inter', year: 1998, pos: 'ATA', fame: 5, lo: 95, hi: 99 },
]
const fora = [
  { name: 'Alex Muralha', club: 'Flamengo', year: 2017, pos: 'GOL', fame: 1, lo: 56, hi: 64 }, { name: 'Cicinho', club: 'São Paulo', year: 2005, pos: 'LAT', fame: 2, lo: 68, hi: 74 }, { name: 'John Terry', club: 'Chelsea', year: 2007, pos: 'ZAG', fame: 5, lo: 88, hi: 93 },
  { name: 'Chicão', club: 'Corinthians', year: 2009, pos: 'ZAG', fame: 2, lo: 66, hi: 72 }, { name: 'Ashley Cole', club: 'Chelsea', year: 2008, pos: 'LAT', fame: 5, lo: 87, hi: 92 },
  { name: 'Frank Lampard', club: 'Chelsea', year: 2010, pos: 'MEI', fame: 5, lo: 89, hi: 94 }, { name: 'Léo Lima', club: 'Vasco', year: 2003, pos: 'MEI', fame: 1, lo: 55, hi: 63 }, { name: 'Steven Gerrard', club: 'Liverpool', year: 2009, pos: 'MEI', fame: 5, lo: 89, hi: 94 },
  { name: 'Thierry Henry', club: 'Arsenal', year: 2004, pos: 'ATA', fame: 5, lo: 92, hi: 97 }, { name: 'Luciano', club: 'São Paulo', year: 2023, pos: 'ATA', fame: 3, lo: 74, hi: 80 }, { name: 'Lionel Messi', club: 'Barcelona', year: 2012, pos: 'ATA', fame: 5, lo: 96, hi: 99 },
]
function Bancada() {
  const [min, setMin] = useState(Number(q.get('de') ?? 0))
  useEffect(() => { const iv = setInterval(() => setMin(m => Math.min(93, m + 1)), (DUR_2D_MS * 0.82) / 93 / VEL); return () => clearInterval(iv) }, [])
  const motor = useMemo(() => (_seed: number, c: never[], f: never[], en: boolean, _fm: unknown, clima: 'sol' | 'nublado' | 'chuva') => { const m = new Motor2(SEED, c, f, en, [], [0, 0], (q.get('clima') as 'sol' | 'nublado' | 'chuva' | null) ?? clima); (window as unknown as { m2: Motor2 }).m2 = m; return m }, [])
  return <>
    <p style={{ textAlign: 'center', fontFamily: 'Oswald', fontWeight: 700, margin: '0 0 6px' }}>🧪 MOTOR v2 · Fabulous EC × Chelsão · {min}'</p>
    <Campo2D climaForcado={(q.get('clima') as 'sol' | 'nublado' | 'chuva' | null) ?? undefined} roundKey={14} minuto={min} roundMs={DUR_2D_MS / VEL} gols={[]} fechado={min >= 93} motorExperimental={motor as never}
      casa={{ nome: 'Fabulous EC', cor: '#FFC400', cartas: casa, mascote: carimboDoTime('Fabulous EC'), escudo: <Escudo nome="Fabulous EC" size={110} />, tecnico: 'Telê Santana' }}
      fora={{ nome: 'Chelsão', cor: '#2B6CFF', cartas: fora, mascote: carimboDoTime('Chelsão'), escudo: <Escudo nome="Chelsão" size={110} />, tecnico: 'Mourinho' }} />
  </>
}
createRoot(document.getElementById('root')!).render(<Bancada />)
