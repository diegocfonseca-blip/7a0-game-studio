// 🌐🧑‍🤝‍🧑 27/11 (Diego 26/11, mockups `scripts/mockups/carreira-online-central-turma.png` e `carreira-online-tuiter.png`):
// na Central da carreira ONLINE, (1) "A TURMA NA CARREIRA" — um cartão por amigo (divisão, posição, último jogo, se está jogando
// ou fora há quanto tempo, etiquetas) + "O QUE ROLOU"; (2) o 🐤 TUITER — a rede da turma (posts de 80 letras, @ responder,
// reações; O Martelo, as copas e os bots postam sozinhos). Tudo que é automático sai do mundo da carreira, igual em todo aparelho,
// e só da rodada JÁ REVELADA (nada de spoiler). Só existe com `state.co2`; nada aqui encosta na carreira solo.
import { useEffect, useMemo, useRef, useState } from 'react'
import { tr } from './lang'
import { useEsc } from './store'
import { useCo2, co2Tuites, co2Tuitar, co2TuiteReagir, type Co2Tuite } from './co2'
import { Escudo } from './escudos'
import type { SimTeam, SimMatch, SeasonScorer } from './pyramidseason'

type Div = 'A' | 'B' | 'C' | 'D' | 'V'
const DIVS: Div[] = ['A', 'B', 'C', 'D', 'V']
const DIV_NOME: Record<Div, string> = { A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D', V: 'Várzea' }
const DIV_COR: Record<Div, string> = { A: '#B8892B', B: '#3E8E4E', C: '#9A7B33', D: '#7A7460', V: '#6B5B3E' }
const INK = '#0C0C0C', GOLD = '#FFC400', AZUL = '#1D9BF0', NAVY = '#14213D'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

export type Etiqueta = { txt: string; cor: 'ouro' | 'verde' | 'vermelho' | 'creme' }
export type CartaoTurma = { mgrId: number; nome: string; div: Div; pos: number; total: number; ultimo: string | null; etiquetas: Etiqueta[] }
export type AutoPost = { id: string; autor: 'martelo' | 'copa' | 'bot'; nome: string; texto: string }

/** @ do clube: minúsculo, sem acento, sem espaço (só pra exibir e marcar) */
export const arroba = (nome: string) => '@' + nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\b(fc|ec|sc)\b/g, '').replace(/[^a-z0-9]/g, '').slice(0, 22)

const ultimasDivs = (tables: Partial<Record<Div, SimTeam[]>>) => DIVS.filter(d => (tables[d]?.length ?? 0) > 0)

function ondeEsta(tables: Partial<Record<Div, SimTeam[]>>, id: number): { div: Div; pos: number; total: number } | null {
  for (const d of DIVS) {
    const t = tables[d] ?? []
    const i = t.findIndex(x => x.teamId === id)
    if (i >= 0) return { div: d, pos: i + 1, total: t.length }
  }
  return null
}

function resultado(m: SimMatch, id: number): string {
  const casa = m.hId === id
  const gp = casa ? m.hg : m.ag, gc = casa ? m.ag : m.hg
  const rival = casa ? m.a : m.h
  return gp > gc ? tr(`venceu ${gp}×${gc} o ${rival}`, `beat ${rival} ${gp}–${gc}`)
    : gp < gc ? tr(`perdeu ${gp}×${gc} pro ${rival}`, `lost ${gp}–${gc} to ${rival}`)
      : tr(`empatou ${gp}×${gc} com o ${rival}`, `drew ${gp}–${gc} with ${rival}`)
}

/** os cartões da turma (pura: mesma entrada → mesma saída). Zona: os 4 de cima sobem, os 4 de baixo caem (computePromotions). */
export function resumoDaTurma(p: {
  tables: Partial<Record<Div, SimTeam[]>>; matches: Partial<Record<Div, SimMatch[]>>; scorers: SeasonScorer[]
  amigos: { id: number; nome: string }[]; intl?: Record<number, string | undefined>; copa?: Record<number, string | undefined>; round: number
}): CartaoTurma[] {
  const divs = ultimasDivs(p.tables)
  const baixo = divs[divs.length - 1]
  const out: CartaoTurma[] = []
  for (const a of p.amigos) {
    const o = ondeEsta(p.tables, a.id)
    if (!o) continue
    const m = (p.matches[o.div] ?? []).find(x => x.hId === a.id || x.aId === a.id)
    const et: Etiqueta[] = []
    if (p.intl?.[a.id]) et.push({ txt: `🌎 ${tr('Libertadores com o', 'Libertadores with')} ${p.intl[a.id]}`, cor: 'ouro' })
    if (p.copa?.[a.id]) et.push({ txt: `🌍 ${tr('Copa com', 'World Cup with')} ${p.copa[a.id]}`, cor: 'ouro' })
    if (p.round >= 1) {
      if (o.pos === 1) et.push({ txt: o.div === 'A' ? tr('🥇 líder da Série A', '🥇 Série A leader') : tr(`🥇 líder da ${DIV_NOME[o.div]}`, `🥇 ${DIV_NOME[o.div]} leader`), cor: 'verde' })
      else if (o.pos <= 4) et.push({ txt: o.div === 'A' ? tr('🔼 briga pelo título', '🔼 title race') : tr(`🔼 subindo pra ${DIV_NOME[DIVS[DIVS.indexOf(o.div) - 1]]}`, `🔼 going up to ${DIV_NOME[DIVS[DIVS.indexOf(o.div) - 1]]}`), cor: 'verde' })
      else if (o.div !== baixo && o.pos > o.total - 4) et.push({ txt: tr('🔽 zona de queda', '🔽 relegation zone'), cor: 'vermelho' })
    }
    const art = p.scorers.filter(s => s.teamId === a.id && s.goals > 0).sort((x, y) => y.goals - x.goals)[0]
    if (art) et.push({ txt: `⚽ ${art.name} ${art.goals} ${art.goals === 1 ? tr('gol', 'goal') : tr('gols', 'goals')}`, cor: 'creme' })
    out.push({ mgrId: a.id, nome: a.nome, div: o.div, pos: o.pos, total: o.total, ultimo: m ? resultado(m, a.id) : null, etiquetas: et })
  }
  return out.sort((x, y) => DIVS.indexOf(x.div) - DIVS.indexOf(y.div) || x.pos - y.pos)
}

/** os posts automáticos da rodada revelada (O Martelo, copas e bots). Iguais em todo aparelho: saem só do mundo da carreira. */
export function postsAutomaticos(p: {
  season: number; round: number; tables: Partial<Record<Div, SimTeam[]>>; matches: Partial<Record<Div, SimMatch[]>>
  humanos: Set<number>; nomeDe: (id: number) => string; noticias?: string[]
}): AutoPost[] {
  const out: AutoPost[] = []
  const id = (k: string) => `a:${p.season}:${p.round}:${k}`
  if (p.round < 1) {
    out.push({ id: id('abre'), autor: 'martelo', nome: 'O Martelo', texto: tr(`Começou a temporada ${p.season}! Que vença o melhor da turma 🔨`, `Season ${p.season} is on! May the best of the crew win 🔨`) })
  }
  for (const d of DIVS) {
    for (const m of p.matches[d] ?? []) {
      const hh = p.humanos.has(m.hId), ah = p.humanos.has(m.aId)
      if (hh && ah) {
        const txt = m.hg === m.ag ? tr(`⚔️ Clássico da turma: ${m.h} ${m.hg}×${m.ag} ${m.a}. Ninguém leva a zoeira pra casa.`, `⚔️ Crew derby: ${m.h} ${m.hg}–${m.ag} ${m.a}. Nobody gets bragging rights.`)
          : tr(`⚔️ Clássico da turma: ${m.h} ${m.hg}×${m.ag} ${m.a}. ${arroba(m.hg > m.ag ? m.h : m.a)} pode zoar à vontade.`, `⚔️ Crew derby: ${m.h} ${m.hg}–${m.ag} ${m.a}. ${arroba(m.hg > m.ag ? m.h : m.a)} has bragging rights.`)
        out.push({ id: id(`cl${m.hId}`), autor: 'martelo', nome: 'O Martelo', texto: txt })
      } else if (hh || ah) {
        const gente = hh ? m.hId : m.aId
        const gp = hh ? m.hg : m.ag, gc = hh ? m.ag : m.hg
        if (Math.abs(gp - gc) >= 3) out.push({ id: id(`gl${gente}`), autor: 'martelo', nome: 'O Martelo', texto: gp > gc ? tr(`🔥 ${arroba(p.nomeDe(gente))} atropelou: ${resultado(m, gente)}.`, `🔥 ${arroba(p.nomeDe(gente))} ran riot: ${resultado(m, gente)}.`) : tr(`😬 Dia de esquecer pro ${arroba(p.nomeDe(gente))}: ${resultado(m, gente)}.`, `😬 A day to forget for ${arroba(p.nomeDe(gente))}: ${resultado(m, gente)}.`) })
      }
    }
    const t = p.tables[d] ?? []
    if (p.round >= 1 && t.length && [...p.humanos].some(h => t.some(x => x.teamId === h))) {
      const lider = t[0]
      if (lider && !p.humanos.has(lider.teamId)) {
        const m = (p.matches[d] ?? []).find(x => x.hId === lider.teamId || x.aId === lider.teamId)
        const venceu = m && (m.hId === lider.teamId ? m.hg > m.ag : m.ag > m.hg)
        out.push({ id: id(`bot${d}`), autor: 'bot', nome: lider.name, texto: venceu ? tr(`Mais 3 pontos e a liderança da ${DIV_NOME[d]} é nossa. Seguimos! 💪`, `Three more points and we lead ${DIV_NOME[d]}. Onwards! 💪`) : tr(`Ainda na ponta da ${DIV_NOME[d]}. Quem vem atrás que corra. 😎`, `Still top of ${DIV_NOME[d]}. Catch us if you can. 😎`) })
      }
      const ult = ultimasDivs(p.tables)
      for (const h of p.humanos) {
        const i = t.findIndex(x => x.teamId === h)
        if (i < 0) continue
        if (i === 0) out.push({ id: id(`lid${h}`), autor: 'martelo', nome: 'O Martelo', texto: tr(`🥇 ${arroba(p.nomeDe(h))} na ponta da ${DIV_NOME[d]} depois da rodada ${p.round}.`, `🥇 ${arroba(p.nomeDe(h))} tops ${DIV_NOME[d]} after round ${p.round}.`) })
        else if (d !== ult[ult.length - 1] && i >= t.length - 4 && p.round >= 5) out.push({ id: id(`qd${h}`), autor: 'martelo', nome: 'O Martelo', texto: tr(`🔽 ${arroba(p.nomeDe(h))} está na zona de queda da ${DIV_NOME[d]}. Acende o alerta!`, `🔽 ${arroba(p.nomeDe(h))} sits in the ${DIV_NOME[d]} drop zone. Alarm bells!`) })
      }
    }
  }
  ;(p.noticias ?? []).filter(n => /^[🙋🚪]/u.test(n)).forEach((n, i) => out.push({ id: id(`nt${i}`), autor: 'martelo', nome: 'O Martelo', texto: n }))
  return out
}

// ═══ 🌐 A TURMA NA CARREIRA (Central) ════════════════════════════════════════════════════════════════════════════════
const ETQ: Record<Etiqueta['cor'], string> = { ouro: '#FFE7A3', verde: '#D8F0DC', vermelho: '#FFD9D2', creme: '#F4ECD6' }
function quandoFora(iso: string | null): string {
  if (!iso) return tr('○ ainda não veio', '○ not here yet')
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (h < 1) return tr('○ saiu agora há pouco', '○ just left')
  if (h < 24) return tr(`○ fora há ${h} h`, `○ away for ${h} h`)
  const d = Math.floor(h / 24)
  return tr(`○ fora há ${d} dia${d > 1 ? 's' : ''}`, `○ away for ${d} day${d > 1 ? 's' : ''}`)
}

type Props = { tables: Partial<Record<Div, SimTeam[]>>; matches: Partial<Record<Div, SimMatch[]>>; scorers: SeasonScorer[]; round: number }

export function Co2Turma({ tables, matches, scorers, round }: Props) {
  const { state } = useEsc()
  const sn = useCo2()
  const youId = state.managers[state.youIdx]?.id
  const amigos = state.managers.filter(m => m.isHuman && m.id !== youId).map(m => ({ id: m.id, nome: m.teamName }))
  const sTemp = state.seasonNo ?? 1
  const intl: Record<number, string | undefined> = {}, copa: Record<number, string | undefined> = {}
  for (const g of state.co2?.gavetas ?? []) {
    if (g.intl?.season === sTemp && g.intl.club && g.intl.xi?.length) intl[g.mgrId] = g.intl.club
    if (g.copaMundo?.season === sTemp && g.copaMundo.pais && !g.copaMundo.reserva) copa[g.mgrId] = g.copaMundo.pais
  }
  const cartoes = resumoDaTurma({ tables, matches, scorers, amigos, intl, copa, round })
  const humanos = new Set(state.managers.filter(m => m.isHuman).map(m => m.id))
  const rolou = postsAutomaticos({ season: sTemp, round, tables, matches, humanos, nomeDe: id => state.managers.find(m => m.id === id)?.teamName ?? '', noticias: state.marketLog })
    .filter(p => p.autor === 'martelo').slice(0, 5)
  if (!cartoes.length) return null
  const uidDe = (id: number) => sn.mundo?.ordem?.[id]
  return (
    <div style={{ background: NAVY, border: `3px solid ${INK}`, borderRadius: 20, boxShadow: `4px 4px 0 ${INK}`, padding: '14px 12px', margin: '12px 0' }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 21, margin: 0, color: '#fff', textTransform: 'uppercase' }}>🌐 {tr('A', 'The')} <span style={{ color: GOLD }}>{tr('turma', 'crew')}</span> {tr('na carreira', 'in the career')}</p>
      <p style={{ fontWeight: 700, fontSize: 12, margin: '2px 0 10px', color: 'rgba(255,255,255,.7)' }}>{tr('o que os outros técnicos estão fazendo', 'what the other managers are up to')}</p>
      <div style={{ display: 'grid', gap: 9, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))' }}>
        {cartoes.map(c => {
          const uid = uidDe(c.mgrId)
          const aqui = !!uid && sn.aqui.includes(uid)
          const visto = sn.clubes.find(x => x.user_id === uid)?.na_sala_em ?? null
          return (
            <div key={c.mgrId} style={{ background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 16, padding: '10px 11px', display: 'flex', gap: 10 }}>
              <div style={{ flex: 'none', width: 44, height: 44, borderRadius: '50%', border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', background: '#F7F7F7' }}><Escudo nome={c.nome} size={30} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ ...OSWALD, fontWeight: 900, fontSize: 16.5, textTransform: 'uppercase', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</span>
                  <span style={{ flex: 'none', fontWeight: 900, fontSize: 11.5, color: aqui ? '#1B7A3D' : 'rgba(0,0,0,.45)' }}>{aqui ? tr('● jogando', '● playing') : quandoFora(visto)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ ...OSWALD, fontWeight: 900, fontSize: 12, color: '#fff', background: DIV_COR[c.div], border: `2px solid ${INK}`, borderRadius: 7, padding: '0 6px' }}>{c.div}</span>
                  <span style={{ fontWeight: 800, fontSize: 12.5, color: 'rgba(0,0,0,.7)' }}>{round >= 1 ? `${c.pos}º` : tr('pré-temporada', 'pre-season')}{c.ultimo ? ` · ${c.ultimo}` : ''}</span>
                </div>
                {c.etiquetas.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                    {c.etiquetas.map(e => <span key={e.txt} style={{ fontWeight: 800, fontSize: 11, background: ETQ[e.cor], border: `2px solid ${INK}`, borderRadius: 9, padding: '2px 7px' }}>{e.txt}</span>)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {rolou.length > 0 && <>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 17, margin: '14px 0 6px', color: '#fff', textTransform: 'uppercase' }}>📣 {tr('O que rolou', 'What happened')}</p>
        <div style={{ background: INK, borderRadius: 14, padding: '4px 12px' }}>
          {rolou.map((p, i) => <p key={p.id} style={{ margin: 0, padding: '8px 0', borderTop: i ? '1px solid rgba(255,255,255,.15)' : 'none', color: '#fff', fontWeight: 700, fontSize: 13 }}><ComArroba txt={p.texto} cor={GOLD} /></p>)}
        </div>
      </>}
    </div>
  )
}

function ComArroba({ txt, cor = AZUL }: { txt: string; cor?: string }) {
  const partes = txt.split(/(@[a-z0-9]+)/g)
  return <>{partes.map((x, i) => x.startsWith('@') ? <span key={i} style={{ color: cor, fontWeight: 800 }}>{x}</span> : <span key={i}>{x}</span>)}</>
}

// ═══ 🐤 TUITER ═══════════════════════════════════════════════════════════════════════════════════════════════════════
const REACOES = ['🔁', '❤️', '🤡'] as const
type Item = { k: string; gente?: Co2Tuite; auto?: AutoPost; t: number }

function haQuanto(ms: number): string {
  const m = Math.max(0, Math.floor((Date.now() - ms) / 60000))
  if (m < 1) return tr('agora', 'now')
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`
}

export function Co2Tuiter({ tables, matches, round }: Omit<Props, 'scorers'>) {
  const { state } = useEsc()
  const sn = useCo2()
  const [aba, setAba] = useState<'todos' | 'turma' | 'meus'>('todos')
  const [lista, setLista] = useState<Co2Tuite[] | null>(null)
  const [texto, setTexto] = useState('')
  const [resp, setResp] = useState<Co2Tuite | null>(null)
  const [erro, setErro] = useState('')
  const [mais, setMais] = useState(false)
  const [, setTick] = useState(0)
  const le = () => { void co2Tuites().then(r => { if (r) setLista(r) }) }
  useEffect(() => { if (!sn.sala?.id) return; le(); const t = setInterval(le, 60000); return () => clearInterval(t) }, [sn.sala?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 60000); return () => clearInterval(t) }, [])
  // a hora dos automáticos = quando ESTE aparelho viu a rodada (eles não moram no banco)
  const vistoEm = useRef<Record<string, number>>({})
  const sTemp = state.seasonNo ?? 1
  const humanos = useMemo(() => new Set(state.managers.filter(m => m.isHuman).map(m => m.id)), [state.managers])
  const autos = useMemo(() => postsAutomaticos({ season: sTemp, round, tables, matches, humanos, nomeDe: id => state.managers.find(m => m.id === id)?.teamName ?? '', noticias: state.marketLog }), [sTemp, round, tables, matches, humanos, state.managers, state.marketLog])
  for (const a of autos) vistoEm.current[a.id] ??= Date.now()
  const meuUid = sn.uid
  const meuNome = state.managers[state.youIdx]?.teamName ?? ''
  const minhaArroba = arroba(meuNome)
  const todos: Item[] = [
    ...(lista ?? []).map(g => ({ k: `g${g.id}`, gente: g, t: new Date(g.em).getTime() })),
    ...autos.map(a => ({ k: a.id, auto: a, t: vistoEm.current[a.id] - 5 * 60000 })),
  ]
  const itens = todos.filter(i => aba === 'todos' ? true : aba === 'turma' ? !!i.gente : !!i.gente && (i.gente.user_id === meuUid || i.gente.texto.includes(minhaArroba)))
    .sort((a, b) => b.t - a.t)
  const vis = mais ? itens : itens.slice(0, 6)
  const postar = async () => {
    const t = texto.trim()
    if (!t) return
    setErro('')
    const r = await co2Tuitar(t, resp?.id ?? null)
    if (r.erro) { setErro(r.erro === 'link' ? tr('Sem link no TUITER.', 'No links on TUITER.') : r.erro === 'palavrao' ? tr('Opa, sem palavrão. 😅', 'Whoa, keep it clean. 😅') : r.erro === 'calma' ? tr('Calma! Espera uns segundos pra postar de novo.', 'Easy! Wait a few seconds to post again.') : r.erro === 'tamanho' ? tr('No máximo 80 letras.', '80 characters max.') : tr('Não deu pra postar agora.', 'Could not post right now.')); return }
    setTexto(''); setResp(null); le()
  }
  const reage = async (g: Co2Tuite, e: string) => {
    const tem = g.minhas.includes(e)
    setLista(l => l?.map(x => x.id !== g.id ? x : { ...x, minhas: tem ? x.minhas.filter(m => m !== e) : [...x.minhas, e], reacoes: { ...x.reacoes, [e]: Math.max(0, (x.reacoes[e] ?? 0) + (tem ? -1 : 1)) } }) ?? l)
    await co2TuiteReagir(g.id, e)
  }
  const avatar = (it: Item) => it.auto ? (it.auto.autor === 'bot' ? '🤖' : it.auto.autor === 'copa' ? '🏆' : '🔨') : null
  return (
    <div style={{ background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 20, boxShadow: `4px 4px 0 ${INK}`, margin: '12px 0', overflow: 'hidden', fontFamily: 'Nunito, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 8px' }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: AZUL, display: 'grid', placeItems: 'center', fontSize: 25, position: 'relative' }}>🐤<span style={{ position: 'absolute', right: -2, bottom: -2, fontSize: 16 }}>🔨</span></div>
        <div>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 25, margin: 0, color: GOLD, letterSpacing: .5, WebkitTextStroke: `0.6px ${INK}` }}>TUITER</p>
          <p style={{ fontWeight: 700, fontSize: 12, margin: 0, color: '#536471' }}>{tr('a rede da turma', 'the crew\'s network')} · T{sTemp} · {tr('rodada', 'round')} {round}</p>
        </div>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid #EFF3F4' }}>
        {([['todos', tr('Para você', 'For you')], ['turma', tr('Só a turma', 'Just the crew')], ['meus', tr('Meus', 'Mine')]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setAba(k)} style={{ flex: 1, background: 'none', border: 'none', borderBottom: `3px solid ${aba === k ? AZUL : 'transparent'}`, padding: '10px 4px', fontWeight: aba === k ? 900 : 700, fontSize: 13.5, color: aba === k ? INK : '#536471', cursor: 'pointer' }}>{l}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', borderBottom: '1px solid #EFF3F4' }}>
        <div style={{ flex: 'none', width: 38, height: 38, borderRadius: '50%', background: '#E8F5FD', display: 'grid', placeItems: 'center' }}><Escudo nome={meuNome} size={24} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {resp && <p style={{ margin: '0 0 4px', fontSize: 11.5, fontWeight: 700, color: '#536471' }}>{tr('Respondendo', 'Replying to')} <span style={{ color: AZUL }}>{arroba(resp.nome)}</span> <button onClick={() => { setResp(null); setTexto(t => t.replace(arroba(resp.nome) + ' ', '')) }} style={{ background: 'none', border: 'none', color: '#536471', cursor: 'pointer', fontWeight: 900 }}>✕</button></p>}
          <textarea value={texto} onChange={e => setTexto(e.target.value.slice(0, 80))} rows={2} placeholder={tr('O que está acontecendo no seu clube?', 'What\'s happening at your club?')}
            style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, color: INK, background: 'transparent', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: texto.length >= 75 ? '#C2452F' : '#8B98A5' }}>{texto.length}/80</span>
            <button disabled={!texto.trim()} onClick={() => void postar()} style={{ background: AZUL, color: '#fff', border: 'none', borderRadius: 999, padding: '7px 18px', fontWeight: 900, fontSize: 14, cursor: 'pointer', opacity: texto.trim() ? 1 : .5 }}>{tr('Postar', 'Post')}</button>
          </div>
          {erro && <p style={{ margin: '4px 0 0', fontSize: 11.5, fontWeight: 800, color: '#C2452F' }}>{erro}</p>}
        </div>
      </div>
      {vis.length === 0 && <p style={{ margin: 0, padding: '18px 14px', textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#536471' }}>{lista === null ? tr('Carregando…', 'Loading…') : tr('Ninguém postou ainda. Começa a zoeira! 😄', 'No posts yet. Start the banter! 😄')}</p>}
      {vis.map(it => {
        const g = it.gente, a = it.auto
        const nome = g?.nome ?? a!.nome
        const resposta = g?.resp ? (lista ?? []).find(x => x.id === g.resp) : undefined
        return (
          <div key={it.k} style={{ display: 'flex', gap: 10, padding: '11px 14px', borderBottom: '1px solid #EFF3F4', background: a && a.autor !== 'bot' ? '#F7F9F9' : '#fff' }}>
            <div style={{ flex: 'none', width: 38, height: 38, borderRadius: '50%', background: '#E8F5FD', display: 'grid', placeItems: 'center', fontSize: 20 }}>{avatar(it) ?? <Escudo nome={nome} size={24} />}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#536471', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <b style={{ color: INK, fontSize: 14 }}>{nome}</b>{' '}
                {a?.autor === 'bot' ? <span style={{ fontSize: 10, fontWeight: 900, background: '#EFF3F4', borderRadius: 5, padding: '1px 5px', color: '#536471' }}>BOT</span> : <span style={{ color: AZUL }}>✔</span>}{' '}
                {g ? `${arroba(nome)} · ${haQuanto(it.t)}` : a?.autor === 'bot' ? arroba(nome) : `@omartelo · ${tr('rodada', 'round')} ${round}`}
              </p>
              {resposta && <p style={{ margin: '1px 0 0', fontSize: 12, color: '#536471' }}>{tr('Respondendo', 'Replying to')} <span style={{ color: AZUL }}>{arroba(resposta.nome)}</span></p>}
              <p style={{ margin: '2px 0 0', fontSize: 14.5, fontWeight: 600, lineHeight: 1.35, overflowWrap: 'anywhere' }}><ComArroba txt={g?.texto ?? a!.texto} /></p>
              {g && (
                <div style={{ display: 'flex', gap: 18, marginTop: 6 }}>
                  <button onClick={() => { setResp(g); setTexto(t => t.startsWith(arroba(g.nome)) ? t : `${arroba(g.nome)} ${t}`.slice(0, 80)) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#536471', fontWeight: 700, padding: 0 }}>💬 {g.respostas || ''}</button>
                  {REACOES.map(e => (
                    <button key={e} onClick={() => void reage(g, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: g.minhas.includes(e) ? (e === '❤️' ? '#F91880' : AZUL) : '#536471', fontWeight: g.minhas.includes(e) ? 900 : 700, padding: 0, filter: g.minhas.includes(e) ? 'none' : 'grayscale(.4)' }}>{e} {g.reacoes[e] || ''}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
      {itens.length > 6 && <button onClick={() => setMais(m => !m)} style={{ width: '100%', background: 'none', border: 'none', padding: '11px', color: AZUL, fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>{mais ? tr('Mostrar menos', 'Show less') : tr(`Ver mais (${itens.length - 6})`, `Show more (${itens.length - 6})`)}</button>}
    </div>
  )
}
