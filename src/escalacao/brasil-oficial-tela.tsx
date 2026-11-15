// ─── 🇧🇷 BRASIL OFICIAL: as duas telas de entrada (mockup `scripts/mockups/carreira-brasil-oficial.png`, aprovado 15/11) ──────
// 1) "Que carreira você quer?" — ✏️ Meu clube (a de sempre) · 🇧🇷 Brasil Oficial · 🇪🇺 Europa Oficial (em breve)
// 2) "Escolha seu clube" — abas Série A/B, grade de escudos oficiais, caixa do clube escolhido e o botão de começar.
// Só aparece pra quem tem `useBrasilOficial()` (por enquanto a conta do Diego). Todo texto nasce PT + EN.
import { useEffect, useMemo, useState } from 'react'
import { tr } from './lang'
import { CLUBES_BR_TODOS, clubesDaDivisao, cartasDoClube, ELENCO_INICIAL, type ClubeOficial } from './brasil-oficial'
import { ESCUDOS_OFICIAIS } from './escudos-oficiais'
import { CATALOG } from './data'
import { baralhoOficial, carregaBaralhoOficial, type BaralhoOficial } from './baralho-oficial-carga' // baixa só aqui
import type { Sector } from './types'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREME = '#F4ECD6'
const OSW = { fontFamily: 'Oswald, sans-serif' } as const
const caixa = { border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, background: '#fff' } as const

function escudo(nome: string) {
  const e = (ESCUDOS_OFICIAIS as Record<string, { src: string; w: number; h: number }>)[nome]
  return e ? `${import.meta.env.BASE_URL}${e.src}` : null
}
// quantas cartas o clube tem neste modo (baralho de sempre + as cartas do Brasil Oficial)
function totalCartas(c: ClubeOficial, CATALOG_OFICIAL: BaralhoOficial): number {
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
  const [div, setDiv] = useState<'A' | 'B' | 'C' | 'D'>('A')
  // 🟫 Série D (mockup aprovado 15/11, scripts/mockups/brasil-oficial-serie-d.png): 16 grupos de 6, escolhe o grupo e depois o clube
  const [grupo, setGrupo] = useState('A1')
  const doGrupo = (g: string) => clubesDaDivisao('D').filter(c => c.grupoD === g)
  const [sel, setSel] = useState<string>(clubesDaDivisao('A')[0]?.nome ?? '')
  const clube = CLUBES_BR_TODOS.find(c => c.nome === sel) ?? null
  // ⏳ a Série D REAL (grupos + mata-mata) ainda não roda: começar num clube dela fica travado com aviso — nada de cair numa D
  // de mentira (regra do Diego: tudo real). Liga quando o motor da D entrar.
  const SERIE_D_PRONTA = false
  const travadoD = clube?.div === 'D' && !SERIE_D_PRONTA
  // as cartas do modo descem quando esta tela abre; até chegarem, o botão de começar fica travado
  const [baralho, setBaralho] = useState<BaralhoOficial | null>(baralhoOficial())
  const [erro, setErro] = useState(false)
  useEffect(() => { if (!baralho) carregaBaralhoOficial().then(setBaralho).catch(() => setErro(true)) }, [baralho])
  const n = useMemo(() => (clube && baralho ? totalCartas(clube, baralho) : 0), [clube, baralho])
  const sorteados = Math.min(ELENCO_INICIAL, n)
  const tab = (d: 'A' | 'B' | 'C' | 'D') => ({ flex: 1, textAlign: 'center' as const, border: `3px solid ${INK}`, borderRadius: 12, padding: 6, ...OSW, fontWeight: 900, fontSize: 14, cursor: 'pointer', background: div === d ? INK : '#fff', color: div === d ? GOLD : INK })
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 16, background: CREME }}>
      <button onClick={onVoltar} style={{ background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer', padding: 0, marginBottom: 6 }}>← {tr('Voltar', 'Back')}</button>
      <h1 style={{ ...OSW, fontWeight: 900, fontSize: 24, textTransform: 'uppercase', margin: '4px 0 12px' }}>{tr('Brasil Oficial', 'Official Brazil')}</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button style={tab('A')} onClick={() => { setDiv('A'); setSel(clubesDaDivisao('A')[0].nome) }}>SÉRIE A</button>
        <button style={tab('B')} onClick={() => { setDiv('B'); setSel(clubesDaDivisao('B')[0].nome) }}>SÉRIE B</button>
        <button style={tab('C')} onClick={() => { setDiv('C'); setSel(clubesDaDivisao('C')[0].nome) }}>SÉRIE C</button>
        <button style={tab('D')} onClick={() => { setDiv('D'); setSel(doGrupo(grupo)[0]?.nome ?? '') }}>SÉRIE D</button>
      </div>
      {div === 'D' && <>
        <div style={{ ...caixa, boxShadow: 'none', borderRadius: 14, padding: '8px 10px', marginBottom: 10, fontSize: 12, fontWeight: 600 }}>
          🟫 <b>{tr('Série D:', 'Série D:')}</b> {tr('96 clubes em 16 grupos de 6, jogando no campo de terra. Os 4 primeiros de cada grupo vão pro mata-mata e 6 sobem pra Série C.', '96 clubs in 16 groups of 6, playing on the dirt pitch. The top 4 of each group go to the knockouts and 6 are promoted to Série C.')}
        </div>
        <div style={{ ...OSW, fontWeight: 900, fontSize: 13, marginBottom: 4 }}>{tr('GRUPO', 'GROUP')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
          {Array.from({ length: 16 }, (_, i) => `A${i + 1}`).map(g => (
            <button key={g} onClick={() => { setGrupo(g); setSel(doGrupo(g)[0]?.nome ?? '') }} style={{ border: `2.5px solid ${INK}`, borderRadius: 10, padding: '3px 7px', ...OSW, fontWeight: 900, fontSize: 12, cursor: 'pointer', background: grupo === g ? INK : '#fff', color: grupo === g ? GOLD : INK }}>{g}</button>
          ))}
        </div>
      </>}
      <div style={{ display: 'grid', gridTemplateColumns: div === 'D' ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: 8 }}>
        {(div === 'D' ? doGrupo(grupo) : clubesDaDivisao(div)).map(c => {
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
            <p style={{ margin: '2px 0', fontSize: 12.5, fontWeight: 700 }}>🏆 {tr('Série', 'Série')} {clube.div}{clube.grupoD ? ` · ${tr('Grupo', 'Group')} ${clube.grupoD} · 🟫 ${tr('campo de terra', 'dirt pitch')}` : ''}</p>
            {clube.estadual && <p style={{ margin: '2px 0', fontSize: 12.5, fontWeight: 700 }}>🏟️ {clube.estadual}</p>}
            {!baralho ? <p style={{ margin: '2px 0', fontSize: 12.5, fontWeight: 700 }}>🎲 {erro ? tr('Não deu pra baixar as cartas. Confira a internet e abra de novo.', "Couldn't download the cards. Check your connection and reopen.") : tr('Baixando as cartas…', 'Downloading the cards…')}</p> : <>
            <p style={{ margin: '2px 0', fontSize: 12.5, fontWeight: 700 }}>🎲 {n > ELENCO_INICIAL ? tr(`Elenco: ${sorteados} sorteados entre ${n} cartas`, `Squad: ${sorteados} drawn from ${n} cards`) : tr(`Elenco: as ${n} cartas do clube`, `Squad: all ${n} club cards`)}</p>
            {n > ELENCO_INICIAL && <p style={{ margin: '2px 0', fontSize: 12.5, fontWeight: 700 }}>🔨 {tr(`As outras ${n - sorteados} vão pro leilão`, `The other ${n - sorteados} go to the auction`)}</p>}
            </>}
          </div>
        </div>
      )}
      {travadoD && <p style={{ margin: '12px 0 0', fontSize: 12.5, fontWeight: 700, textAlign: 'center' }}>🔒 {tr('A Série D de verdade (grupos + mata-mata) está sendo montada. Logo dá pra começar com este clube.', 'The real Série D (groups + knockouts) is being built. You can start with this club soon.')}</p>}
      <button disabled={!clube || !baralho || travadoD} onClick={() => clube && baralho && !travadoD && onEscolher(clube.nome)} style={{ ...caixa, marginTop: 14, width: '100%', background: GREEN, color: '#fff', padding: 12, ...OSW, fontWeight: 900, fontSize: 17, textTransform: 'uppercase', cursor: baralho && !travadoD ? 'pointer' : 'not-allowed', opacity: baralho && !travadoD ? 1 : 0.6 }}>
        ⚽ {tr(`Começar com o ${clube?.nome ?? ''}`, `Start with ${clube?.nome ?? ''}`)}
      </button>
    </div>
  )
}
