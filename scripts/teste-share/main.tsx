// 🧪 Bancada das imagens de COMPARTILHAR (jornal + elenco). Não entra no jogo:
// é uma página solta que roda no vite e desenha as duas artes pra conferir.
import { createRoot } from 'react-dom/client'
import { buildElencoBlob, SeasonJornal } from '../../src/escalacao/jornal'
import type { SimTeam, SeasonScorer, Div } from '../../src/escalacao/pyramidseason'

const put = (b: Blob | null, tag: string) => {
  const el = document.getElementById('saida')!
  if (!b) { el.insertAdjacentHTML('beforeend', `<p style="color:#f66">${tag}: NULL</p>`); return }
  const i = new Image(); i.src = URL.createObjectURL(b); i.alt = tag
  el.appendChild(i); (window as unknown as Record<string, unknown>)[tag] = 'ok'
}

const time = (name: string, you = false, pts = 40): SimTeam => ({
  name, you, human: you, teamId: Math.floor(Math.random() * 1e6), squad: [],
  pts, w: 12, d: 4, l: 6, gf: 40, ga: 30,
} as unknown as SimTeam)
const art = (name: string, teamName: string, div: Div, goals: number): SeasonScorer =>
  ({ name, teamName, teamId: 1, div, goals, you: false, human: false } as SeasonScorer)

const tables = {
  A: [time('Nova Eclipse', true, 71), time('Murriz FC'), time('Tôka10')],
  B: [time('Comercial da Baixada')], C: [time('Barcenite FC')],
  D: [time('Bagres de Wall Street FC')], V: [time('Ressaca United')],
} as unknown as Record<Div, SimTeam[]>
const divTop = {
  A: art('Vinícius Júnior', 'Corporação Capsule FC', 'A', 19),
  B: art('Zagallo', 'White Thigs do GuGu', 'B', 20),
  C: art('Rummenigge', 'Ferroviário da Serra', 'C', 19),
  D: art('Son Heung-min', 'Bagres de Wall Street FC', 'D', 25),
  V: art('Alan Shearer', 'Continental Real', 'V', 23),
} as unknown as Record<Div, SeasonScorer | undefined>

async function elenco() {
  const c = (pos: string, name: string, club: string, year: number, goals = 0) => ({ pos, name, goals, club, year })
  const blob = await buildElencoBlob({
    teamName: 'Nova Eclipse 👑', teamRaw: 'Nova Eclipse', divName: 'Série A', tablePos: 1, seasonNo: 388,
    formation: '4-3-3', titles: 3, squadValue: 412, coins: 168, color: '#1B7A3D',
    manto: ['#0A0A0A', '#E3E2E1'],
    fieldRows: [
      [c('GOL', 'Rogério Ceni', 'São Paulo', 2005, 4)],
      [c('LAT', 'Cafu', 'Milan', 2004, 1), c('ZAG', 'Aldair', 'Roma', 1994, 2), c('ZAG', 'Lúcio', 'Inter', 2010, 3), c('LAT', 'Roberto Carlos', 'Real Madrid', 2002, 6)],
      [c('MEI', 'Falcão', 'Internacional', 1979, 5), c('MEI', 'Sócrates', 'Corinthians', 1983, 7), c('MEI', 'Zico', 'Flamengo', 1981, 14)],
      [c('ATA', 'Romário', 'Vasco', 2000, 19), c('ATA', 'Careca', 'São Paulo', 1986, 11), c('ATA', 'Bebeto', 'Vasco', 1989, 9)],
    ],
    titulares: [], 
    reservas: [
      { pos: 'GOL', name: 'Taffarel', goals: 0, paid: 12, club: 'Internacional', year: 1989 },
      { pos: 'ZAG', name: 'Mozer', goals: 1, paid: 13, club: 'Flamengo', year: 1987 },
      { pos: 'MEI', name: 'Raí', goals: 6, paid: 18, club: 'São Paulo', year: 1992 },
      { pos: 'ATA', name: 'Edmundo', goals: 8, paid: 20, club: 'Vasco', year: 1997 },
    ],
  })
  put(blob, 'ELENCO')
}

function jornal() {
  createRoot(document.getElementById('root')!).render(
    <SeasonJornal privateVisual me={{ div: 'A', pos: 1, team: 'Nova Eclipse' }} tables={tables}
      copa={{ champion: { name: 'Nova Eclipse', you: true }, topScorer: { name: 'Luis Suárez', teamName: 'Leão da Estradinha', goals: 7 } } as never}
      divTop={divTop} seasonNo={388} />)
}
;(async () => { await elenco(); jornal() })()
