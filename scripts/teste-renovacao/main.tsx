// 🧪 Bancada da MESA DE RENOVAÇÃO e da CENTRAL NA COPA (22/10): monta os componentes DE VERDADE com um estado de
// mentira, pra conferir antes de publicar.  ?tela=mesa (padrão) · ?tela=copa
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { EscCtxBancada } from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import { MesaRenovacao } from '../../src/escalacao/renovacao-mesa'
import { CentralCarreira } from '../../src/escalacao/central'
try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ }
const q = new URLSearchParams(location.search)

const squad = [
  { id: 'c1', name: 'Romário', club: 'Vasco', year: 1993, pos: 'ATA', fame: 4, lo: 85, hi: 93, paid: 48, contratoAte: 5 },
  { id: 'c2', name: 'Zé Elias', club: 'Corinthians', year: 1996, pos: 'MEI', fame: 3, lo: 70, hi: 80, paid: 12, contratoAte: 5 },
  { id: 'c3', name: 'Dida', club: 'Cruzeiro', year: 1997, pos: 'GOL', fame: 4, lo: 80, hi: 88, paid: 22, contratoAte: 5 },
  { id: 'c4', name: 'Cafu', club: 'São Paulo', year: 1993, pos: 'LAT', fame: 5, lo: 88, hi: 95, paid: 60, contratoAte: 9 },
]
const base = {
  seasonNo: 6, youIdx: 0, careerOnline: true, contratosOn: true, screen: 'reserveList', onlineMode: 'offline',
  managers: [{ id: 0, name: 'Diego', teamName: 'Nova Eclipse', isHuman: true, squad }],
  careerCoins: { 0: 193 }, careerPlacements: { m0: 'B' },
  careerTecnicos: { 'Nova Eclipse': 'Parreira' }, careerTecnicoContrato: { 'Nova Eclipse': 5 }, careerTecnicoPago: { Parreira: 40 },
  careerPreparador: {}, contratoRelease: [] as string[],
  condicaoCarry: { 'Romário|Vasco|1993': { g: 92, j: 112, gl: 87, as: 21 }, 'Zé Elias|Corinthians|1996': { g: 80, j: 64, gl: 4, as: 9 }, 'Dida|Cruzeiro|1997': { g: 100, j: 98, gl: 0, as: 1 } },
}
function Mesa() {
  const [st, setSt] = useState(base as Record<string, unknown>)
  const dispatch = (a: { type: string; cardId?: string; anos?: number }) => setSt(s => {
    const n = structuredClone(s) as typeof base
    if (a.type === 'RELEASE_CONTRACT') n.contratoRelease = n.contratoRelease.includes(a.cardId!) ? n.contratoRelease.filter(x => x !== a.cardId) : [...n.contratoRelease, a.cardId!]
    if (a.type === 'RENEW_CONTRACT') { const c = n.managers[0].squad.find(x => x.id === a.cardId)!; c.contratoAte = 6 + (a.anos ?? 5) }
    if (a.type === 'RENOVAR_TECNICO') n.careerTecnicoContrato['Nova Eclipse'] = 11
    return n
  })
  ;(window as unknown as { _d: typeof dispatch })._d = dispatch
  return <EscCtxBancada.Provider value={{ state: st, dispatch } as never}><MesaRenovacao tecnicoOn /></EscCtxBancada.Provider>
}
function Copa() {
  const T = ['Nova Eclipse', 'Stocco FC', 'Milhaça FC', 'Rossini Money', 'Fabulous EC', 'K9 FC', 'Chelsão', 'Inter Vale']
  const j = (a: number, b: number, ga?: number, gb?: number) => ({ a: T[a], b: T[b], ga, gb, venceA: ga == null ? undefined : ga > gb!, youA: a === 0, youB: b === 0 })
  return <CentralCarreira seasonNo={6} round={38} divName="Série B" youId={0} euNome="Nova Eclipse"
    proximo={{ rodada: 2, casa: 'Nova Eclipse', fora: 'Rossini Money', rolando: false, rotulo: '🏆 Copa do Brasil · Semifinal', arte: 'copaBr' }}
    formas={{}} giro={null} tabela={[]} jornal={{ manchete: null, noticias: [] }} mercado={{ negocios: [], maisCaro: null }} agenda={[]}
    botao={{ label: '▶️ Jogar', onClick: () => {} }} onTab={() => {}}
    copaChave={{ titulo: '🏆 Copa do Brasil · chave', colunas: [
      { nome: 'Quartas', jogos: [j(0, 1, 2, 1), j(2, 3, 0, 3), j(4, 5, 1, 0), j(6, 7, 2, 2)] },
      { nome: 'Semi', jogos: [j(0, 3), j(4, 6)] },
      { nome: 'Final', jogos: [null] }] }}
    copaArtilheiros={[{ nome: 'Romário', time: 'Rossini Money', gols: 5, you: false }, { nome: 'Ronaldo', time: 'Nova Eclipse', gols: 4, you: true }, { nome: 'Adriano', time: 'Milhaça FC', gols: 3, you: false }]} />
}
createRoot(document.getElementById('root')!).render(q.get('tela') === 'copa' ? <Copa /> : <Mesa />)
