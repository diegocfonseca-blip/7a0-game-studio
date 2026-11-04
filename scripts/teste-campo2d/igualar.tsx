// 🧪 Bancada "aba Jogos × mapa" (04/11): o MESMO jogo nos dois campos, pra conferir o que um tem e o outro não.
// ?modo=jogos → o campinho da aba Jogos (Campo2D) · ?modo=mapa → o campo no gramado do estádio do mapa 3D, com o HUD do mapa
// (o Campo2D roda escondido, como na carreira, e é a fonte do mapa). ?vel=4 acelera · ?de=20 começa no minuto 20.
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Campo2D } from '../../src/escalacao/campo2d'
import { DUR_2D_MS } from '../../src/escalacao/campo2d-motor'
import { carimboDoTime } from '../../src/escalacao/mascotes'
import { Escudo } from '../../src/escalacao/escudos'
import { applyCampo2DBancada } from '../../src/escalacao/sport'
import { MapaHud } from '../../src/escalacao/presidencia-mapa-hud'
import type { EstadoPartidaEstadio } from '../../src/escalacao/presidencia-partida-model'
import { STADIUM_SECTORS, STADIUM_EXTRAS } from '../../src/escalacao/estadiodata'
const Complexo = lazy(() => import('../../src/escalacao/presidencia-complexo-3d'))
applyCampo2DBancada(); setInterval(() => applyCampo2DBancada(), 400) // (a conferência de conta sem login desliga; a bancada religa)
// 📸 só a bancada: conta quantas bolinhas do rastro o quadro desenhou (pra foto pegar o momento do passe longo/chute)
{ const W = window as unknown as { __rastro: number; __rastroT: number }, orig = CanvasRenderingContext2D.prototype.drawImage
  CanvasRenderingContext2D.prototype.drawImage = function (this: CanvasRenderingContext2D, ...a: unknown[]) {
    const src = a[0] as HTMLCanvasElement
    if (src instanceof HTMLCanvasElement && src.dataset.rastro === "1") { const n = performance.now(); if (n - W.__rastroT > 8) W.__rastro = 0; W.__rastro++; W.__rastroT = n }
    return (orig as (...x: unknown[]) => void).apply(this, a)
  } as typeof orig; W.__rastro = 0; W.__rastroT = 0
  // ?parar=N congela o desenho no 1º quadro com N+ bolinhas (a foto sai exatamente com o rastro)
  const parar = Number(new URLSearchParams(location.search).get('parar') ?? 0), raf = window.requestAnimationFrame.bind(window)
  if (parar) window.requestAnimationFrame = (cb => { if (W.__rastro >= parar && performance.now() - W.__rastroT < 20) { (W as unknown as { __congelado: boolean }).__congelado = true; return 0 } return raf(cb) }) as typeof window.requestAnimationFrame
  // ?pararFesta=1 congela tudo 0,7 s depois que a festa do gol aparece no mapa (a foto sai com ela na tela)
  if (new URLSearchParams(location.search).has('pararFesta')) { let viu = 0; window.requestAnimationFrame = (cb => { if (document.querySelector('.pc3-match-festa')) { viu ||= performance.now(); if (performance.now() - viu > 700) { (W as unknown as { __congelado: boolean }).__congelado = true; return 0 } } return raf(cb) }) as typeof window.requestAnimationFrame } }
// ?pararQuase=1 congela tudo 0,35 s depois que o QUASE aparece na faixa (a foto sai com o anel e o grito) — 04/11
if (new URLSearchParams(location.search).has('pararQuase')) { const raf0 = window.requestAnimationFrame.bind(window); let viu = 0; window.requestAnimationFrame = (cb => { if (document.querySelector(new URLSearchParams(location.search).get('modo') === 'mapa' ? '.pc3-match-score [data-quase-campo2d]' : '[data-quase-campo2d]')) { viu ||= performance.now(); if (performance.now() - viu > Number(new URLSearchParams(location.search).get('pararQuase') || 350)) { (window as unknown as { __congelado: boolean }).__congelado = true; return 0 } } return raf0(cb) }) as typeof window.requestAnimationFrame }
const q = new URLSearchParams(location.search)
const VEL = Number(q.get('vel') ?? 1), MAPA = q.get('modo') === 'mapa'
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
const gols = [{ name: 'Romário', min: 6, home: true, assist: 'Kaká' }, { name: 'Frank Lampard', min: 54, home: false }, { name: 'Ronaldo Fenômeno', min: 71, home: true, assist: 'Cafu' }]
const ID = 'qa-igualar-1'
const full = { inv: Object.fromEntries(STADIUM_SECTORS.map(s => [s.k, s.cost])), ext: STADIUM_EXTRAS.map(e => e.k) }
function Bancada() {
  const [min, setMin] = useState(Number(q.get('de') ?? 0))
  // ?pausarQuase=1 PAUSA o jogo (relógio do campinho parado, mapa seguindo) assim que o QUASE aparece na faixa — pra foto (04/11)
  const [pausa, setPausa] = useState(false)
  useEffect(() => { if (!q.has('pausarQuase')) return; const iv = setInterval(() => { if (document.querySelector(MAPA ? '.pc3-match-score [data-quase-campo2d]' : '[data-quase-campo2d]')) setPausa(true) }, 30); return () => clearInterval(iv) }, [])
  useEffect(() => { if (pausa) return; const iv = setInterval(() => setMin(m => Math.min(93, m + 1)), (DUR_2D_MS * 0.82) / 93 / VEL); return () => clearInterval(iv) }, [pausa])
  const placar: [number, number] = [gols.filter(g => g.home && g.min <= min).length, gols.filter(g => !g.home && g.min <= min).length]
  const campo = <Campo2D mapOnly={MAPA} mapMatchId={MAPA ? ID : undefined} climaForcado={(q.get('clima') as 'sol' | null) ?? 'sol'} noiteForcada={false} roundKey={Number(q.get('rk') ?? 14)} minuto={min} roundMs={DUR_2D_MS / VEL} gols={gols} fechado={min >= 93} replay pausado={pausa}
    casa={{ nome: 'Fabulous EC', cor: '#FFC400', cartas: casa as never, mascote: carimboDoTime('Fabulous EC'), escudo: <Escudo nome="Fabulous EC" size={110} />, tecnico: 'Telê Santana' }}
    fora={{ nome: 'Chelsão', cor: '#2B6CFF', cartas: fora as never, mascote: carimboDoTime('Chelsão'), escudo: <Escudo nome="Chelsão" size={110} />, tecnico: 'Mourinho' }} />
  if (!MAPA) return <div style={{ maxWidth: 1140, margin: '0 auto', padding: 10 }}>{campo}</div>
  const match = { context: { id: ID, homeClubId: 0, awayClubId: 1, home: [], away: [] }, viewerClubId: 0, officialTeams: ['Fabulous EC', 'Chelsão'], minute: min, homeScore: placar[0], awayScore: placar[1], paused: pausa, finished: min >= 93, homeColor: '#FFC400', awayColor: '#2B6CFF', officialNarration: 'Kaká lança, Romário domina na entrada da área…' } as unknown as EstadoPartidaEstadio
  return <>
    <div hidden aria-hidden="true">{campo}</div>
    <Suspense fallback={<p>carregando…</p>}><Complexo matchPresentation="2d" stadium={full as never} match={match} hud={<MapaHud match={match} torcedores={42000} />} /></Suspense>
  </>
}
{ const el = document.getElementById('bancada-igualar') as HTMLElement & { __raiz?: ReturnType<typeof createRoot> }; (el.__raiz ??= createRoot(el)).render(<Bancada />) }
