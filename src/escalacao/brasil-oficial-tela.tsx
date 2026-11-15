// ─── 🇧🇷 BRASIL OFICIAL: as duas telas de entrada (mockup `scripts/mockups/carreira-brasil-oficial.png`, aprovado 15/11) ──────
// 1) "Que carreira você quer?" — ✏️ Meu clube (a de sempre) · 🇧🇷 Brasil Oficial · 🇪🇺 Europa Oficial (em breve)
// 2) "Escolha seu clube" — abas Série A/B, grade de escudos oficiais, caixa do clube escolhido e o botão de começar.
// Só aparece pra quem tem `useBrasilOficial()` (por enquanto a conta do Diego). Todo texto nasce PT + EN.
import { useMemo, useState } from 'react'
import { tr } from './lang'
import { CLUBES_BR, clubesDaDivisao, cartasDoClube, ELENCO_INICIAL, type ClubeOficial } from './brasil-oficial'
import { ESCUDOS_OFICIAIS } from './escudos-oficiais'
import { CATALOG } from './data'
import { CATALOG_OFICIAL_MODO as CATALOG_OFICIAL } from './baralho-oficial'
import type { Sector } from './types'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREME = '#F4ECD6'
const OSW = { fontFamily: 'Oswald, sans-serif' } as const
const caixa = { border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, background: '#fff' } as const

function escudo(nome: string) {
  const e = (ESCUDOS_OFICIAIS as Record<string, { src: string; w: number; h: number }>)[nome]
  return e ? `${import.meta.env.BASE_URL}${e.src}` : null
}
// quantas cartas o clube tem neste modo (baralho de sempre + as cartas do Brasil Oficial)
function totalCartas(c: ClubeOficial): number {
  const juntas = {} as Record<Sector, { name: string; club: string; year: number; fame: number }[]>
  for (const p of Object.keys(CATALOG) as Sector[]) juntas[p] = [...CATALOG[p], ...CATALOG_OFICIAL[p]]
  return cartasDoClube(c, juntas).length
}

export function EscolhaCarreira({ onMeuClube, onOficial }: { onMeuClube: () => void; onOficial: () => void }) {
  const opt = (bg: string, extra?: object) => ({ ...caixa, background: bg, padding: 14, marginBottom: 14, width: '100%', textAlign: 'left' as const, cursor: 'pointer', ...extra })
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 16 }}>
      <h1 style={{ ...OSW, fontWeight: 900, fontSize: 24, textTransform: 'uppercase', margin: '4px 0 12px' }}>{tr('Que carreira você quer?', 'Which career do you want?')}</h1>
      <button onClick={onMeuClube} style={opt('#fff')}>
        <b style={{ ...OSW, fontSize: 19, fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>✏️ {tr('Meu clube', 'My club')}</b>
        <small style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginTop: 4, lineHeight: 1.35 }}>{tr('Crie seu time do zero e suba da Várzea até a Série A. Como sempre foi.', 'Create your team from scratch and climb from the Várzea to Série A. As always.')}</small>
      </button>
      <button onClick={onOficial} style={opt('#FFF6D6')}>
        <b style={{ ...OSW, fontSize: 19, fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>🇧🇷 {tr('Brasil Oficial', 'Official Brazil')} <span style={{ display: 'inline-block', background: GOLD, border: `2px solid ${INK}`, borderRadius: 8, padding: '1px 7px', fontSize: 11, marginLeft: 6 }}>🔒 {tr('PLANO', 'PLAN')}</span></b>
        <small style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginTop: 4, lineHeight: 1.35 }}>{tr('Escolha um clube REAL (Flamengo, Bahia, Remo…), na divisão real dele. Copa do Brasil, Libertadores, Sul-Americana e Mundial pela sua colocação.', 'Pick a REAL club (Flamengo, Bahia, Remo…) in its real division. Copa do Brasil, Libertadores, Sul-Americana and the Club World Cup by your league position.')}</small>
      </button>
      <div style={{ ...opt('#F7F2E6', { cursor: 'default', opacity: 0.5 }) }}>
        <b style={{ ...OSW, fontSize: 19, fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>🇪🇺 {tr('Europa Oficial', 'Official Europe')}</b>
        <small style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>{tr('Em breve.', 'Coming soon.')}</small>
      </div>
    </div>
  )
}

export function EscolhaClubeOficial({ onEscolher, onVoltar }: { onEscolher: (clube: string) => void; onVoltar: () => void }) {
  const [div, setDiv] = useState<'A' | 'B' | 'C'>('A')
  const [sel, setSel] = useState<string>(clubesDaDivisao('A')[0]?.nome ?? '')
  const clube = CLUBES_BR.find(c => c.nome === sel) ?? null
  const n = useMemo(() => (clube ? totalCartas(clube) : 0), [clube])
  const sorteados = Math.min(ELENCO_INICIAL, n)
  const tab = (d: 'A' | 'B' | 'C') => ({ flex: 1, textAlign: 'center' as const, border: `3px solid ${INK}`, borderRadius: 12, padding: 6, ...OSW, fontWeight: 900, fontSize: 14, cursor: 'pointer', background: div === d ? INK : '#fff', color: div === d ? GOLD : INK })
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 16, background: CREME }}>
      <button onClick={onVoltar} style={{ background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer', padding: 0, marginBottom: 6 }}>← {tr('Voltar', 'Back')}</button>
      <h1 style={{ ...OSW, fontWeight: 900, fontSize: 24, textTransform: 'uppercase', margin: '4px 0 12px' }}>{tr('Brasil Oficial', 'Official Brazil')}</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button style={tab('A')} onClick={() => { setDiv('A'); setSel(clubesDaDivisao('A')[0].nome) }}>SÉRIE A</button>
        <button style={tab('B')} onClick={() => { setDiv('B'); setSel(clubesDaDivisao('B')[0].nome) }}>SÉRIE B</button>
        <button style={tab('C')} onClick={() => { setDiv('C'); setSel(clubesDaDivisao('C')[0].nome) }}>SÉRIE C</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {clubesDaDivisao(div).map(c => {
          const src = escudo(c.nome)
          return (
            <button key={c.nome} onClick={() => setSel(c.nome)} style={{ background: sel === c.nome ? GOLD : '#fff', border: `2.5px solid ${INK}`, borderRadius: 12, padding: '6px 2px', textAlign: 'center', fontSize: 10.5, fontWeight: 800, boxShadow: `2px 2px 0 ${INK}`, cursor: 'pointer', ...OSW }}>
              {src ? <img src={src} alt="" style={{ height: 38, display: 'block', margin: '0 auto 3px' }} /> : <div style={{ height: 38 }}>🛡️</div>}
              {c.nome}
            </button>
          )
        })}
      </div>
      {clube && (
        <div style={{ ...caixa, marginTop: 14, padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          {escudo(clube.nome) && <img src={escudo(clube.nome)!} alt="" style={{ height: 70 }} />}
          <div>
            <b style={{ ...OSW, fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>{clube.nome}</b>
            <p style={{ margin: '2px 0', fontSize: 12.5, fontWeight: 700 }}>🏆 {tr('Série', 'Série')} {clube.div} · 🏟️ {clube.estadual}</p>
            <p style={{ margin: '2px 0', fontSize: 12.5, fontWeight: 700 }}>🎲 {n > ELENCO_INICIAL ? tr(`Elenco: ${sorteados} sorteados entre ${n} cartas`, `Squad: ${sorteados} drawn from ${n} cards`) : tr(`Elenco: as ${n} cartas do clube`, `Squad: all ${n} club cards`)}</p>
            {n > ELENCO_INICIAL && <p style={{ margin: '2px 0', fontSize: 12.5, fontWeight: 700 }}>🔨 {tr(`As outras ${n - sorteados} vão pro leilão`, `The other ${n - sorteados} go to the auction`)}</p>}
          </div>
        </div>
      )}
      <button disabled={!clube} onClick={() => clube && onEscolher(clube.nome)} style={{ ...caixa, marginTop: 14, width: '100%', background: GREEN, color: '#fff', padding: 12, ...OSW, fontWeight: 900, fontSize: 17, textTransform: 'uppercase', cursor: 'pointer' }}>
        ⚽ {tr(`Começar com o ${clube?.nome ?? ''}`, `Start with ${clube?.nome ?? ''}`)}
      </button>
    </div>
  )
}
