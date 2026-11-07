// 🧪 Bancada das ESTATÍSTICAS NO PLACAR CINEMA (07/11): o `LiveScoreCard` de verdade, sem o 2D, no apito final — e embaixo o
// resumo (posse · finalizações · no gol · ⭐ melhor em campo) contado pelo MESMO motor que encenaria o jogo no 2D.
//   ?modo=sala      sala online (teatro v1, preso na semente + gols do placar)
//   ?modo=carreira  carreira (motor novo v2: os gols SAEM do motor, como no jogo)
//   ?min=N          o minuto do relógio (93 = apito) — pra conferir que antes do apito NÃO aparece nada
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import '../../src/escalacao/screens' // (a ordem dos imports: screens antes do placar, como no jogo)
import { LiveScoreCard } from '../../src/escalacao/pyramidseason'
import { EscCtxBancada } from '../../src/escalacao/store'
import { applyStatsPlacarBancada } from '../../src/escalacao/sport'
import { setLang } from '../../src/escalacao/lang'
import { entradaM2, resultadoM2 } from '../../src/escalacao/motor2/carreira'
try { localStorage.setItem('bl_lang', new URLSearchParams(location.search).get('lang') ?? 'pt') } catch { /* ignora */ }
applyStatsPlacarBancada()
setLang(new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'pt')
const q = new URLSearchParams(location.search)
const modo = q.get('modo') ?? 'sala'
const min = Number(q.get('min') ?? 93)
const c = (name: string, club: string, year: number, pos: string, fame: number, lo: number, hi: number) => ({ name, club, year, pos, fame, lo, hi })
const casa = [
  c('Taffarel', 'Internacional', 1989, 'GOL', 5, 88, 94), c('Cafu', 'Milan', 2004, 'LAT', 5, 90, 95), c('Thiago Silva', 'Fluminense', 2008, 'ZAG', 4, 82, 88),
  c('Índio', 'Internacional', 2010, 'ZAG', 2, 70, 77), c('Roberto Carlos', 'Real Madrid', 2002, 'LAT', 5, 91, 96),
  c('Mineiro', 'São Paulo', 2005, 'MEI', 3, 78, 84), c('Zico', 'Flamengo', 1981, 'MEI', 5, 93, 97), c('Kaká', 'Milan', 2007, 'MEI', 5, 92, 97),
  c('Dentinho', 'Corinthians', 2009, 'ATA', 2, 70, 78), c('Romário', 'Vasco', 2000, 'ATA', 5, 92, 97), c('Ronaldo Fenômeno', 'Inter', 1998, 'ATA', 5, 93, 98),
]
const fora = [
  c('Alex Muralha', 'Flamengo', 2017, 'GOL', 1, 58, 65), c('Cicinho', 'São Paulo', 2005, 'LAT', 2, 72, 78), c('John Terry', 'Chelsea', 2007, 'ZAG', 5, 90, 94),
  c('Chicão', 'Corinthians', 2009, 'ZAG', 2, 70, 76), c('Ashley Cole', 'Chelsea', 2008, 'LAT', 5, 89, 93),
  c('Frank Lampard', 'Chelsea', 2010, 'MEI', 5, 91, 95), c('Léo Lima', 'Vasco', 2003, 'MEI', 1, 58, 64), c('Steven Gerrard', 'Liverpool', 2009, 'MEI', 5, 91, 96),
  c('Thierry Henry', 'Arsenal', 2004, 'ATA', 5, 92, 96), c('Luciano', 'São Paulo', 2023, 'ATA', 3, 76, 82), c('Lionel Messi', 'Barcelona', 2012, 'ATA', 5, 95, 99),
]
let gols = [{ name: 'Romário', min: 23, home: true, assist: 'Kaká' }, { name: 'Frank Lampard', min: 54, home: false }, { name: 'Kaká', min: 88, home: true, assist: 'Zico' }]
let m2: ReturnType<typeof entradaM2> | undefined
if (modo === 'carreira') {
  m2 = entradaM2({ seed: Number(q.get('seed') ?? 11), casa, fora, fCasa: '4-3-3', fFora: '4-3-3', tatica: [0, 0], bots: [false, true] })
  gols = resultadoM2(m2).gols.map(g => ({ name: g.nome, min: g.min, home: g.home, assist: g.assist }))
}
const estado = { onlineMode: modo === 'sala' ? 'online' : 'solo', campo2d: false, managers: [], tactics: {}, round: 1 }
createRoot(document.getElementById('root')!).render(
  <EscCtxBancada.Provider value={{ state: estado, dispatch: () => {} } as never}>
    <div style={{ maxWidth: 440, margin: '0 auto' }}>
      <div style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 800, textTransform: 'uppercase', fontSize: 13, margin: '0 0 8px', color: '#0C0C0C' }}>
        {modo === 'sala' ? '🌐 Sala online · placar cinema' : '🏆 Carreira · placar cinema'} · {min >= 93 ? 'apito final' : `${min}'`}
      </div>
      {modo === 'sala'
        ? <LiveScoreCard enhancedOnline homeName="Fabulous EC" awayName="Chelsão" homeColor="#FFC400" awayColor="#2B6CFF" youIsHome goals={gols}
            roundKey={3} roundMs={36_000} displayMinute={min} elencos={{ casa: casa as never, fora: fora as never, fFora: '4-3-3', fCasa: '4-3-3' }} />
        : <LiveScoreCard enhancedCareer homeName="Fabulous EC" awayName="Chelsão" homeColor="#FFC400" awayColor="#2B6CFF" youIsHome goals={gols}
            roundKey={7} roundMs={36_000} displayMinute={min} elencos={{ casa: casa as never, fora: fora as never, fCasa: '4-3-3', fFora: '4-3-3', m2 }} />}
    </div>
  </EscCtxBancada.Provider>
)
