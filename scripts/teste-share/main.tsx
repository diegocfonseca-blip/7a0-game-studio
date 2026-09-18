// 🧪 Bancada da ARTE DE COMPARTILHAR O ELENCO — desenha a imagem de verdade
// (`buildElencoBlob`) e põe na tela, pra conferir antes de o Diego postar.
//
// Existe porque isto é CANVAS: o `tsc` não vê erro de desenho nenhum. A arte só
// prova que funciona sendo desenhada. Em 18/09 o banco deixou de ser um segundo
// campinho e virou LISTA (ordem dele: *"apenas os titulares do campo + o time
// reserva listado"*) — sem bancada, eu só ia descobrir se quebrou quando ele
// tentasse postar.
import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { buildElencoBlob } from '../../src/escalacao/jornal'
import LENDAS from '../../src/escalacao/legend-avatars.json'
import type { Sector } from '../../src/escalacao/types'

type Lenda = { name: string; club: string; year: number }
const TODAS = LENDAS as Lenda[]
const linha = (l: Lenda, pos: Sector, goals = 0) => ({ pos, name: l.name, goals, paid: 20, club: l.club, year: l.year })
// ⚠️ nome que NÃO está no catálogo de rostos derruba a bancada inteira — e o
// catálogo muda (157 hoje). Então: acha pelo nome, senão pega qualquer um.
let vez = 0
const acha = (n: string): Lenda => TODAS.find(l => l.name === n) ?? TODAS[vez++ % TODAS.length]

const xi: Record<Sector, string[]> = {
  GOL: ['Rogério Ceni'], LAT: ['Cafu', 'Roberto Carlos'], ZAG: ['Aldair', 'Lúcio'],
  MEI: ['Zico', 'Sócrates', 'Raí', 'Falcão'], ATA: ['Romário', 'Careca'],
}
const of_ = (p: Sector) => xi[p].map((n, i) => linha(acha(n), p, i === 0 ? 7 : 0))
const lats = of_('LAT')
const fieldRows = [of_('GOL'), [lats[0], ...of_('ZAG'), lats[1]], of_('MEI'), of_('ATA')]
  .map(cs => cs.map(c => ({ pos: c.pos, name: c.name, goals: c.goals, club: c.club, year: c.year })))
// 16 reservas: é o banco novo cheio — o pior caso da lista
const usados = new Set(Object.values(xi).flat())
const reservas = TODAS.filter(l => !usados.has(l.name)).slice(0, 16)
  .map((l, i) => linha(l, (['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as Sector[])[i % 5], i % 3 === 0 ? i : 0))

function App() {
  const [url, setUrl] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => {
    buildElencoBlob({
      teamName: 'Nova Eclipse 👑', divName: 'Série A', tablePos: 3, seasonNo: 6, formation: '4-4-2',
      titles: 2, squadValue: 1377, coins: 168, color: '#1B7A3D', tierGrad: undefined, tierHolo: 0,
      fieldRows, reservas, teamRaw: 'Nova Eclipse', manto: null, rostos: true,
    } as never)
      .then(b => setUrl(b ? URL.createObjectURL(b) : null))
      .catch(e => setErro(String(e?.stack || e)))
  }, [])
  if (erro) return <pre style={{ padding: 20, color: '#C2452F', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{erro}</pre>
  if (!url) return <p style={{ padding: 20, fontFamily: 'system-ui' }}>desenhando…</p>
  return <img id="arte" src={url} style={{ width: 540, display: 'block', margin: '0 auto' }} />
}
createRoot(document.getElementById('root')!).render(<App />)
