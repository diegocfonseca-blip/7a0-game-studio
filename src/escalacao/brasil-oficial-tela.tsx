import {caixaInicialOficial} from './economia-oficial'
import {referenciaAtleta, salarioReferencia} from './carreira-economia'
// ─── 🇧🇷 BRASIL OFICIAL: as duas telas de entrada (mockups aprovados 15/11: `scripts/mockups/carreira-brasil-oficial.png` e
// `brasil-oficial-serie-d.png`) ──────────────────────────────────────────────────────────────────────────────────────────
// 1) "Que carreira você quer?" — ✏️ Meu clube (a de sempre) · 🇧🇷 Brasil Oficial · 🇪🇺 Europa Oficial (em breve)
// 2) "Escolha seu clube" — Séries A/B/C/D (a D por grupo A1…A16), clube escolhido e o botão de começar.
// 📱🖥️ 16/11 (regra do Diego: *"padronizando e repaginado… celular e desktop"*): as duas moram no MESMO quadro da criação de
// carreira repaginada (`CareerSetupFrame` + `.cse-*` de career-setup-guide.css): verde-escuro com etapas no topo, papel creme,
// e no computador duas colunas (escolha à esquerda, o clube à direita); no celular vira uma coluna só.
// Só aparece pra quem tem `useBrasilOficial()` (por enquanto a conta do Diego). Todo texto nasce PT + EN.
import { useEffect, useMemo, useState } from 'react'
import { tr } from './lang'
import { CLUBES_BR_TODOS, clubesDaDivisao, cartasDoClube, ELENCO_INICIAL, type ClubeOficial } from './brasil-oficial'
import { ESCUDOS_OFICIAIS } from './escudos-oficiais'
import { CATALOG } from './data'
import { baralhoOficial, carregaBaralhoOficial, type BaralhoOficial } from './baralho-oficial-carga' // baixa só aqui
import { CareerSetupFrame } from './career-setup-guide'
import type { Sector } from './types'

const INK = '#0C0C0C', GOLD = '#FFC400'
const etapas = () => [tr('Carreira', 'Career'), tr('Clube real', 'Real club'), tr('Presidente', 'President'), tr('Começar', 'Start')]

function escudo(nome: string) {
  const e = (ESCUDOS_OFICIAIS as Record<string, { src: string; w: number; h: number }>)[nome]
  return e ? { src: `${import.meta.env.BASE_URL}${e.src}`, w: e.w, h: e.h } : null
}
function Escudo({ nome, size }: { nome: string; size: number }) {
  const e = escudo(nome)
  return e ? <img src={e.src} alt="" width={Math.round(size * e.w / e.h)} height={size} style={{ flexShrink: 0, objectFit: 'contain' }} /> : <span aria-hidden="true" style={{ fontSize: size * 0.8, lineHeight: 1 }}>🛡️</span>
}
// quantas cartas o clube tem neste modo (baralho de sempre + as cartas do Brasil Oficial)
function totalCartas(c: ClubeOficial, CATALOG_OFICIAL: BaralhoOficial): number {
  const juntas = {} as Record<Sector, { name: string; club: string; year: number; fame: number }[]>
  for (const p of Object.keys(CATALOG) as Sector[]) juntas[p] = [...CATALOG[p], ...CATALOG_OFICIAL[p]]
  return cartasDoClube(c, juntas).length
}

export function EscolhaCarreira({ onMeuClube, onOficial, onVoltar }: { onMeuClube: () => void; onOficial: () => void; onVoltar: () => void }) {
  const opcao = (on: boolean) => ({ display: 'block', width: '100%', textAlign: 'left' as const, background: on ? '#FFF6D6' : '#fff', color: INK, border: `2px solid ${INK}`, borderRadius: 12, boxShadow: on ? `3px 3px 0 ${INK}` : 'none', padding: '14px 16px', marginBottom: 12 })
  const sub = { display: 'block', font: '13px/1.55 Arial, sans-serif', color: '#514c3e', marginTop: 6 } as const
  return (
    <CareerSetupFrame step={1} club="" onBack={onVoltar} etapas={etapas()} topo={tr('NOVA CARREIRA', 'NEW CAREER')}>
      <header className="cse-intro"><small>{tr('ESCOLHA O JEITO DE JOGAR', 'CHOOSE HOW TO PLAY')}</small><h1>{tr('Que carreira você quer?', 'Which career do you want?')}</h1></header>
      <div className="cse-rivals-grid">
        <div className="cse-paper">
          <button type="button" onClick={onMeuClube} style={opcao(false)}>
            <b style={{ font: '700 21px Oswald, sans-serif', textTransform: 'uppercase' }}>✏️ {tr('Meu clube', 'My club')}</b>
            <span style={sub}>{tr('Crie seu time do zero e suba da Várzea até a Série A. Como sempre foi.', 'Create your team from scratch and climb from the Várzea to Série A. As always.')}</span>
          </button>
          <button type="button" onClick={onOficial} style={opcao(true)}>
            <b style={{ font: '700 21px Oswald, sans-serif', textTransform: 'uppercase' }}>🇧🇷 {tr('Brasil Oficial', 'Official Brazil')}</b>{/* 18/11 (Diego): sem selo de plano no cartão */}
            <span style={sub}>{tr('Escolha um clube REAL (Flamengo, Bahia, Remo…), na divisão real dele. Copa do Brasil, Libertadores, Sul-Americana e Mundial pela sua colocação.', 'Pick a REAL club (Flamengo, Bahia, Remo…) in its real division. Copa do Brasil, Libertadores, Sul-Americana and the Club World Cup by your league position.')}</span>
          </button>
          <div style={{ ...opcao(false), opacity: 0.55, marginBottom: 0 }}>
            <b style={{ font: '700 21px Oswald, sans-serif', textTransform: 'uppercase' }}>🇪🇺 {tr('Europa Oficial', 'Official Europe')}</b>
            <span style={sub}>{tr('Em breve.', 'Coming soon.')}</span>
          </div>
        </div>
        <aside className="cse-explainer"><span aria-hidden="true">🇧🇷</span><h2>{tr('Tudo de verdade.', 'All real.')}</h2>
          <p>{tr('No Brasil Oficial os clubes, as séries, o formato de cada campeonato e quem sobe e quem cai seguem o futebol real. Os jogadores são cartas reais de cada clube.', 'In Official Brazil the clubs, the divisions, each competition’s format and who goes up and down follow real football. The players are real cards from each club.')}</p>
        </aside>
      </div>
    </CareerSetupFrame>
  )
}

export function EscolhaClubeOficial({ onEscolher, onVoltar }: { onEscolher: (clube: string) => void; onVoltar: () => void }) {
  const [div, setDiv] = useState<'A' | 'B' | 'C' | 'D'>('A')
  // 🟫 Série D (mockup aprovado 15/11, scripts/mockups/brasil-oficial-serie-d.png): 16 grupos de 6, escolhe o grupo e depois o clube
  const [grupo, setGrupo] = useState('A1')
  const doGrupo = (g: string) => clubesDaDivisao('D').filter(c => c.grupoD === g)
  const [sel, setSel] = useState<string>(clubesDaDivisao('A')[0]?.nome ?? '')
  const clube = CLUBES_BR_TODOS.find(c => c.nome === sel) ?? null
  // ✅ 16/11: B (com playoff), C (fases + final) e D (grupos + mata-mata) jogam na tela no formato real — testadas de ponta a
  // ponta no navegador. A trava continua aqui (um `false` fecha a série de novo, com aviso) caso alguma precise sair do ar.
  const SERIE_D_PRONTA = true, SERIE_C_PRONTA = true
  const travado = (clube?.div === 'D' && !SERIE_D_PRONTA) || (clube?.div === 'C' && !SERIE_C_PRONTA)
  // as cartas do modo descem quando esta tela abre; até chegarem, o botão de começar fica travado
  const [baralho, setBaralho] = useState<BaralhoOficial | null>(baralhoOficial())
  const [erro, setErro] = useState(false)
  useEffect(() => { if (!baralho) carregaBaralhoOficial().then(setBaralho).catch(() => setErro(true)) }, [baralho])
  const n = useMemo(() => (clube && baralho ? totalCartas(clube, baralho) : 0), [clube, baralho])
  const sorteados = Math.min(ELENCO_INICIAL, n)
  const lista = div === 'D' ? doGrupo(grupo) : clubesDaDivisao(div)
  const chip = (on: boolean) => ({ background: on ? GOLD : '#fff', color: INK, border: `2px solid ${INK}`, borderRadius: 10, boxShadow: on ? `2px 2px 0 ${INK}` : 'none', padding: '8px 4px', font: '700 15px Oswald, sans-serif' })
  return (
    <CareerSetupFrame step={2} club={clube?.nome ?? ''} onBack={onVoltar} etapas={etapas()} topo={tr('NOVA CARREIRA · BRASIL OFICIAL', 'NEW CAREER · OFFICIAL BRAZIL')}>
      <header className="cse-intro"><small>{tr('CLUBES E SÉRIES DE 2026', '2026 CLUBS AND DIVISIONS')}</small><h1>{tr('Escolha seu clube.', 'Pick your club.')}</h1>
        <p>{tr('Cada clube começa na série real dele, com as cartas reais do elenco.', 'Each club starts in its real division, with its real squad cards.')}</p></header>
      <div className="cse-rivals-grid">
        <div className="cse-paper">
          <div role="group" aria-label={tr('Série', 'Division')} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
            {(['A', 'B', 'C', 'D'] as const).map(d => <button key={d} type="button" aria-pressed={div === d} style={chip(div === d)} onClick={() => { setDiv(d); setSel((d === 'D' ? doGrupo(grupo) : clubesDaDivisao(d))[0]?.nome ?? '') }}>{tr('SÉRIE', 'SÉRIE')} {d}</button>)}
          </div>
          {div === 'D' && <>
            <p className="cse-note" style={{ marginBottom: 12 }}>🟫 <b>{tr('Série D:', 'Série D:')}</b> {tr('96 clubes em 16 grupos de 6, jogando no campo de terra. Os 4 primeiros de cada grupo vão pro mata-mata e 6 sobem pra Série C.', '96 clubs in 16 groups of 6, playing on the dirt pitch. The top 4 of each group go to the knockouts and 6 are promoted to Série C.')}</p>
            <label>{tr('Grupo', 'Group')}</label>
            <div role="group" aria-label={tr('Grupo', 'Group')} style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 6 }}>
              {Array.from({ length: 16 }, (_, i) => `A${i + 1}`).map(g => <button key={g} type="button" aria-pressed={grupo === g} style={{ ...chip(grupo === g), font: '700 13px Oswald, sans-serif', minHeight: 40 }} onClick={() => { setGrupo(g); setSel(doGrupo(g)[0]?.nome ?? '') }}>{g}</button>)}
            </div>
          </>}
          <div className="cse-clubs" role="group" aria-label={tr('Clubes', 'Clubs')}>
            {lista.map(c => <button key={c.nome} type="button" aria-pressed={sel === c.nome} onClick={() => setSel(c.nome)}><Escudo nome={c.nome} size={32} /><span>{c.nome}</span>{sel === c.nome && <b aria-hidden="true">✓</b>}</button>)}
          </div>
        </div>
        <aside className="cse-explainer" aria-live="polite">
          {clube && <>
            <figure style={{ display: 'flex', justifyContent: 'center', margin: '0 0 6px' }}><Escudo nome={clube.nome} size={96} /></figure>
            <h2 style={{ textAlign: 'center', textTransform: 'uppercase' }}>{clube.nome}</h2>
            <p>🏆 {tr('Série', 'Série')} {clube.div}{clube.grupoD ? ` · ${tr('Grupo', 'Group')} ${clube.grupoD} · 🟫 ${tr('campo de terra', 'dirt pitch')}` : ''}</p>
            {clube.estadual && <p>🏟️ {clube.estadual}</p>}
            <p>🎲 {!baralho ? (erro ? tr('Não deu pra baixar as cartas. Confira a internet e abra de novo.', "Couldn't download the cards. Check your connection and reopen.") : tr('Baixando as cartas…', 'Downloading the cards…')) : n > ELENCO_INICIAL ? tr(`Elenco: ${sorteados} sorteados entre ${n} cartas. As demais podem aparecer no mercado, conforme a categoria permitida.`, `Squad: ${sorteados} drawn from ${n} cards. The others may appear on the market, subject to the category rules.`) : tr(`Elenco: as ${n} cartas do clube.`, `Squad: all ${n} club cards.`)}</p>
            <p>💰 {tr(`Caixa inicial: ${caixaInicialOficial(clube.nome, clube.div)} moedas.`, `Starting budget: ${caixaInicialOficial(clube.nome, clube.div)} coins.`)}</p>
            <p>{tr('O elenco mistura épocas da história do clube. No Flamengo, por exemplo, Zico pode vir no sorteio: é uma versão histórica, não o elenco atual. O sorteio não garante nenhuma lenda.', 'The squad mixes eras from the club’s history. Flamengo may draw Zico: a historical version, not today’s squad. No legend is guaranteed.')}</p>
            <p>{tr('Os atletas iniciais já têm valor de referência e contrato. Recebê-los sem pagar transferência não elimina salário nem renovação. A cobrança da folha começa na 4ª temporada, para você e os bots.', 'Starting players already have a reference value and a contract. A free transfer does not mean free wages or renewals. Wage charges start in season 4 for you and the bots.')}</p>
            {baralho && clube && (() => { const cartas = cartasDoClube(clube, Object.fromEntries((Object.keys(CATALOG) as Sector[]).map(p => [p, [...CATALOG[p], ...baralho[p]]])) as unknown as Record<Sector, import('./types').Card[]>); if (!cartas.length) return null; const niveis = cartas.map(x => (x.carta.lo + x.carta.hi) / 2); const salarios = cartas.map(x => salarioReferencia(referenciaAtleta(x.carta))); return <p>{tr(`Cartas disponíveis do clube: força de ${Math.min(...niveis).toFixed(0)} a ${Math.max(...niveis).toFixed(0)}; salário de referência de ${Math.min(...salarios)} a ${Math.max(...salarios)} moedas por atleta/temporada. Seu elenco será definido no sorteio.`, `Available club cards: rating ${Math.min(...niveis).toFixed(0)}–${Math.max(...niveis).toFixed(0)}; reference wages ${Math.min(...salarios)}–${Math.max(...salarios)} coins per player/season. Your squad is determined by the draw.`)}</p> })()}
            {travado && <p style={{ color: '#ffe6a0' }}>🔒 {clube.div === 'C' ? tr('A Série C de verdade (turno único, 2ª fase e final) está sendo montada na sua tela. Logo dá pra começar com este clube.', 'The real Série C (single round robin, 2nd phase and final) is being built. You can start with this club soon.') : tr('A Série D de verdade (grupos + mata-mata) está sendo montada. Logo dá pra começar com este clube.', 'The real Série D (groups + knockouts) is being built. You can start with this club soon.')}</p>}
            <button type="button" className="csg-primary" style={{ width: '100%', marginTop: 14, opacity: baralho && !travado ? 1 : 0.55, cursor: baralho && !travado ? 'pointer' : 'not-allowed' }} disabled={!baralho || travado} onClick={() => baralho && !travado && onEscolher(clube.nome)}>
              ⚽ {tr(`Começar com o ${clube.nome}`, `Start with ${clube.nome}`)}
            </button>
          </>}
        </aside>
      </div>
    </CareerSetupFrame>
  )
}
