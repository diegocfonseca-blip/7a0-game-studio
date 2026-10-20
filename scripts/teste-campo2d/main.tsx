// 🧪 Bancada do CAMPO 2D (20/10): o componente DE VERDADE (`Campo2D`) com um jogo de cartas reais do baralho e o relógio
// andando na velocidade do 2D (93' em 90 s). ?vel=4 acelera (como o Modo Manual).
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { Campo2D } from '../../src/escalacao/campo2d'
import { DUR_2D_MS } from '../../src/escalacao/campo2d-motor'
import { carimboDoTime } from '../../src/escalacao/mascotes'
import { Escudo } from '../../src/escalacao/escudos'
const q = new URLSearchParams(location.search)
const VEL = Number(q.get('vel') ?? 1)
try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ }
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
const gols = [{ name: 'Romário', min: 23, home: true, assist: 'Kaká' }, { name: 'Frank Lampard', min: 54, home: false }, { name: 'Ronaldo Fenômeno', min: 71, home: true, assist: 'Cafu' }]
function Bancada() {
  const [min, setMin] = useState(Number(q.get('de') ?? 0))
  useEffect(() => { const iv = setInterval(() => setMin(m => Math.min(93, m + 1)), (DUR_2D_MS * 0.82) / 93 / VEL); return () => clearInterval(iv) }, [])
  return <>
    <p style={{ textAlign: 'center', fontFamily: 'Oswald', fontWeight: 700, margin: '0 0 6px' }}>Fabulous EC × Chelsão · {min}'</p>
    <Campo2D roundKey={14} minuto={min} roundMs={DUR_2D_MS / VEL} gols={gols} fechado={min >= 93}
      casa={{ nome: 'Fabulous EC', cor: '#FFC400', cartas: casa, mascote: carimboDoTime('Fabulous EC'), escudo: <Escudo nome="Fabulous EC" size={110} /> }}
      fora={{ nome: 'Chelsão', cor: '#2B6CFF', cartas: fora, mascote: carimboDoTime('Chelsão'), escudo: <Escudo nome="Chelsão" size={110} /> }} />
  </>
}
createRoot(document.getElementById('root')!).render(<Bancada />)
