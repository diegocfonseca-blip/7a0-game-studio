// ─── 🃏 BAFO NOVO · as TELAS ────────────────────────────────────────────────────────────────────────────────────────
//
// Diego (21/11) — mockups `scripts/mockups/bafo-novo.png` e `bafo-campeao-escolhe.png`:
//   · sala de espera com as REGRAS em cima;
//   · convocação: 120 s, 22 cartas da própria coleção, busca + posição, SEM over (só nome · clube · ano);
//   · durante a liga: aba Elencos pra espiar os 22 de cada rival;
//   · fim: SÓ o campeão toma 1 carta — os 22 de cada um abertos por posição + busca por nome, 60 s; senão o jogo sorteia.
// As regras puras moram em `bafo2.ts`; tudo que troca carta de dono é o BANCO que faz (`docs/sql/bafo2.sql`).
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { tr, getLang } from './lang'
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from './data'
import { FORMATIONS, SECTORS, type Sector, type Manager } from './types'
import { cartasExtras, carregaCartasExtras } from './baralho-inteiro'
import { categoriaDa, decadaDe } from './liga-draft'
import { seloDoClube } from './selo-clube'
import { playTick } from './sound'
import { CollectibleCard } from './screens'
import pacoteCampeaoArt from './img/online-pacote-v20.webp'
import { resolveColecao, podeJogarBafo, formatoBafo, BAFO2_ELENCO, BAFO2_CONVOCA_SEG, BAFO2_ESCOLHA_SEG, type CartaBafo, type LinhaColecao, type AchaNoBaralho, type Necessidades } from './bafo2'

const INK = '#0C0C0C', CREME = '#F4ECD6', OURO = '#FFC400', VERDE = '#1B7A3D', VERM = '#E8503A'
const OSW = { fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' as const }
export const NEED_BAFO = FORMATIONS as unknown as Necessidades

// ── o baralho (os 3 catálogos): nome+clube+ano primeiro; se a carta mudou de clube/ano no baralho, vale o nome ──
type C = { name: string; club: string; year: number; fame: number; lo: number; hi: number }
let indice: { exato: Map<string, ReturnType<AchaNoBaralho>>; nome: Map<string, ReturnType<AchaNoBaralho>> } | null = null
function montaIndice() {
  const exato = new Map<string, ReturnType<AchaNoBaralho>>(), nome = new Map<string, ReturnType<AchaNoBaralho>>()
  for (const cat of [CATALOG, CATALOG_EU, CATALOG_WORLD] as unknown as Record<Sector, C[]>[]) for (const pos of SECTORS) for (const c of cat[pos] ?? []) {
    const v = { pos, fame: c.fame, lo: c.lo, hi: c.hi, club: c.club, year: c.year }
    const k = `${c.name}|${c.club}|${c.year}`
    if (!exato.has(k)) exato.set(k, v)
    if (!nome.has(c.name)) nome.set(c.name, v)
  }
  // 🃏 21/11: o pacote do campeão passou a dar carta do baralho INTEIRO (regionais + Brasil Oficial) — aqui elas ganham força.
  // Só pela carta EXATA (nome+clube+ano): pelo nome sozinho, um xará do Oficial pegaria a força da carta famosa.
  for (const c of cartasExtras()) { const k = `${c.name}|${c.club}|${c.year}`; if (!exato.has(k)) exato.set(k, { pos: c.pos, fame: c.fame, lo: c.lo, hi: c.hi, club: c.club, year: c.year }) }
  return { exato, nome }
}
export const achaNoBaralho: AchaNoBaralho = (n, c, a) => { indice ??= montaIndice(); return indice.exato.get(`${n}|${c}|${a}`) ?? indice.nome.get(n) ?? null }

/** 📥 a coleção de uma conta (a leitura de `user_cards` é pública — é o álbum). Pagina de 1000 em 1000. */
export async function carregaColecao(uid: string): Promise<CartaBafo[]> {
  const linhas: LinhaColecao[] = []
  for (let de = 0; de < 5000; de += 1000) {
    const { data, error } = await supabase.from('user_cards').select('id, card_name, card_club, card_year, card_pos, card_fame').eq('user_id', uid).order('obtained_at', { ascending: true }).range(de, de + 999)
    if (error) throw error
    linhas.push(...((data ?? []) as LinhaColecao[]))
    if ((data ?? []).length < 1000) break
  }
  // carta que os 3 baralhos não conhecem pelo nome+clube+ano → pode ser do Brasil Oficial: baixa o baralho dele (uma vez) e refaz o índice
  indice ??= montaIndice()
  if (linhas.some(l => !indice!.exato.has(`${l.card_name}|${l.card_club}|${l.card_year}`))) { await carregaCartasExtras(8000); indice = montaIndice() }
  return resolveColecao(linhas, achaNoBaralho)
}
export function useColecaoBafo(uid: string | null | undefined): { cartas: CartaBafo[] | null; erro: boolean; pode: boolean } {
  const [cartas, setCartas] = useState<CartaBafo[] | null>(null)
  const [erro, setErro] = useState(false)
  useEffect(() => {
    if (!uid) return
    let vivo = true
    setCartas(null); setErro(false)
    carregaColecao(uid).then(c => { if (vivo) setCartas(c) }, () => { if (vivo) setErro(true) })
    return () => { vivo = false }
  }, [uid])
  return { cartas, erro, pode: !!cartas && podeJogarBafo(cartas, NEED_BAFO) }
}

// ── peças pequenas ──
const caixa = (bg = '#fff'): React.CSSProperties => ({ background: bg, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}` })
function Relogio({ seg, total, rotulo }: { seg: number; total: number; rotulo: string }) {
  const pct = Math.max(0, Math.min(100, (seg / total) * 100))
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', ...OSW, fontWeight: 800, fontSize: 15, color: INK }}>
        <span>⏱️ {rotulo}</span><span style={{ fontSize: 22, color: seg <= 10 ? VERM : INK }}>{seg}s</span>
      </div>
      <div style={{ height: 14, border: `2px solid ${INK}`, borderRadius: 8, background: '#fff', overflow: 'hidden', margin: '5px 0 10px' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: VERM, transition: 'width 1s linear' }} />
      </div>
    </div>
  )
}
function LinhaCarta({ c, direita, fundo, onClick }: { c: { name: string; club: string; year: number; pos: string }; direita?: React.ReactNode; fundo?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} role={onClick ? 'button' : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderBottom: '1px solid rgba(0,0,0,.12)', background: fundo, cursor: onClick ? 'pointer' : undefined }}>
      <span style={{ ...OSW, fontWeight: 800, fontSize: 11, border: `2px solid ${INK}`, borderRadius: 6, padding: '0 5px', background: CREME, color: INK, flex: 'none' }}>{c.pos}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <b style={{ ...OSW, fontWeight: 800, fontSize: 14, display: 'block', lineHeight: 1.1, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</b>
        <small style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)' }}>{c.club} · {c.year}</small>
      </span>
      {direita}
    </div>
  )
}
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ─── 1) 📜 AS REGRAS (em cima, na sala de espera) ────────────────────────────────────────────────────────────────────
export function RegrasBafo({ valendo, nPessoas }: { valendo: boolean; nPessoas: number }) {
  const en = getLang() === 'en'
  const f = formatoBafo(Math.max(2, nPessoas))
  const p: React.CSSProperties = { margin: '4px 0', fontSize: 12.5, lineHeight: 1.3 }
  return (
    <div style={{ background: INK, color: CREME, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${OURO}`, padding: '10px 12px' }}>
      <h3 style={{ ...OSW, margin: '0 0 6px', fontWeight: 900, fontSize: 17, color: OURO }}>🃏 {tr('Regras do Bafo', 'Bafo rules')}</h3>
      <p style={p}>• {en ? <>Everyone plays with <b style={{ color: '#fff' }}>{BAFO2_ELENCO} cards they already won</b> as champion (career or rooms).</> : <>Cada um joga com <b style={{ color: '#fff' }}>{BAFO2_ELENCO} cartas que já ganhou</b> sendo campeão (na carreira ou nas salas).</>}</p>
      <p style={p}>• {en ? <>It's {BAFO2_ELENCO} because <b style={{ color: '#fff' }}>you can substitute during the league</b>: 11 start, 11 on the bench (Squad tab).</> : <>São {BAFO2_ELENCO} porque <b style={{ color: '#fff' }}>dá pra substituir durante a liga</b>: 11 titulares e 11 no banco (aba Elenco).</>}</p>
      <p style={p}>• {en ? <>People only, no bots. League only. <b style={{ color: '#fff' }}>Doesn't count for the ranking.</b></> : <>Só gente, sem bots. Só liga. <b style={{ color: '#fff' }}>Não conta pro ranking.</b></>}</p>
      <p style={p}>• {en ? <>Once it starts: <b style={{ color: '#fff' }}>{BAFO2_CONVOCA_SEG}s</b> to call up your {BAFO2_ELENCO}. Didn't mark them all? The game fills in with your worst cards.</> : <>Começou: <b style={{ color: '#fff' }}>{BAFO2_CONVOCA_SEG} s</b> pra convocar os {BAFO2_ELENCO}. Não marcou todos? O jogo completa com as suas piores cartas.</>}</p>
      {valendo ? <>
        <p style={p}>• {en ? <><b style={{ color: '#fff' }}>The champion takes 1 card</b> from anyone's {BAFO2_ELENCO} ({BAFO2_ESCOLHA_SEG}s to choose; otherwise the game draws one). Left early? Your {BAFO2_ELENCO} are still at stake.</> : <><b style={{ color: '#fff' }}>O campeão toma 1 carta</b> das {BAFO2_ELENCO} de quem ele quiser ({BAFO2_ESCOLHA_SEG} s pra escolher; senão o jogo sorteia). Saiu antes? As suas {BAFO2_ELENCO} continuam valendo.</>}</p>
        <p style={{ ...p, color: '#ff9c8a' }}>• {en ? <>Room owner who ends it before the league is over (or vanishes for 10 min) <b style={{ color: '#fff' }}>loses 2 cards</b>: one to 1st place and one to 2nd. Before any game is played, the 2 cards are simply lost.</> : <>Dono que encerra antes do fim da liga (ou some por 10 min) <b style={{ color: '#fff' }}>perde 2 cartas</b>: uma pro 1º e outra pro 2º. Antes de qualquer jogo, as 2 somem e ninguém ganha.</>}</p>
      </> : <p style={p}>• {en ? <><b style={{ color: '#fff' }}>🤝 Friendly room:</b> nobody wins or loses cards.</> : <><b style={{ color: '#fff' }}>🤝 Sala amistosa:</b> ninguém ganha nem perde carta.</>}</p>}
      <p style={p}>• {tr('Depois que começa, ninguém é expulso.', 'Once it starts, nobody gets kicked.')}</p>
      <p style={{ ...p, color: OURO, fontWeight: 700 }}>📅 {tr('Formato desta sala', 'This room\'s format')}: {en ? f.en : f.pt}.</p>
    </div>
  )
}

// ─── 2) ✋ A CONVOCAÇÃO (120 s, sem over) ────────────────────────────────────────────────────────────────────────────
export function ConvocacaoBafo({ colecao, marcadas, onMarcar, seg, pronto, onPronto, telaCheia }: {
  colecao: CartaBafo[]; marcadas: string[]; onMarcar: (ids: string[]) => void; seg: number; pronto: boolean; onPronto: () => void
  /** 📄 21/11: a convocação é uma PÁGINA própria (a lista ocupa a altura da tela) */
  telaCheia?: boolean
}) {
  const [busca, setBusca] = useState('')
  const [pos, setPos] = useState<Sector | null>(null)
  const [soMarcadas, setSoMarcadas] = useState(false)
  const sel = useMemo(() => new Set(marcadas), [marcadas])
  const q = semAcento(busca.trim())
  const lista = useMemo(() => colecao
    .filter(c => (!pos || c.pos === pos) && (!soMarcadas || sel.has(c.id)) && (!q || semAcento(c.name).includes(q) || semAcento(c.club).includes(q)))
    .sort((a, b) => SECTORS.indexOf(a.pos) - SECTORS.indexOf(b.pos) || a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' })), [colecao, pos, q, soMarcadas, sel])
  const cheio = marcadas.length >= BAFO2_ELENCO
  const toca = (id: string) => {
    if (pronto) return
    if (sel.has(id)) onMarcar(marcadas.filter(x => x !== id))
    else if (!cheio) onMarcar([...marcadas, id])
  }
  const porPos = SECTORS.map(p => `${p} ${colecao.filter(c => c.pos === p && sel.has(c.id)).length}`).join(' · ')
  return (
    <div style={{ ...caixa(CREME), padding: 14, color: INK }}>
      <Relogio seg={seg} total={BAFO2_CONVOCA_SEG} rotulo={tr(`Convoque até ${BAFO2_ELENCO} jogadores`, `Call up to ${BAFO2_ELENCO} players`)} />
      <p style={{ margin: '-4px 0 8px', fontSize: 12.5, fontWeight: 700, lineHeight: 1.3 }}>{getLang() === 'en' ? <>You take <b>{BAFO2_ELENCO}</b>: <b>11 starters + 11 on the bench</b> (you can substitute during the league). The first you mark in each position starts.</> : <>Você leva <b>{BAFO2_ELENCO}</b>: <b>11 titulares + 11 reservas</b> (dá pra substituir durante a liga). O 1º que você marcar em cada posição começa de titular.</>}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', ...OSW, fontWeight: 800, fontSize: 14, marginBottom: 2 }}>
        <span style={{ color: VERDE }}>✔ {marcadas.length} {tr('de', 'of')} {BAFO2_ELENCO} {tr('marcadas', 'marked')}</span>
        <span>{colecao.length} {tr('cartas suas', 'cards of yours')}</span>
      </div>
      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.55)' }}>{porPos}</p>
      <input value={busca} onChange={e => setBusca(e.target.value)} placeholder={tr('🔎 buscar jogador ou clube…', '🔎 search player or club…')}
        style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 10, padding: '7px 10px', background: '#fff', fontWeight: 700, fontSize: 14, color: INK, marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
        {SECTORS.map(p => (
          <button key={p} onClick={() => setPos(pos === p ? null : p)} style={{ flex: 1, border: `2px solid ${INK}`, borderRadius: 8, padding: '5px 0', ...OSW, fontWeight: 700, fontSize: 13, background: pos === p ? OURO : '#fff', color: INK }}>{p}</button>
        ))}
        <button onClick={() => setSoMarcadas(v => !v)} title={tr('Só as marcadas', 'Marked only')} style={{ flex: 'none', border: `2px solid ${INK}`, borderRadius: 8, padding: '5px 8px', ...OSW, fontWeight: 700, fontSize: 13, background: soMarcadas ? VERDE : '#fff', color: soMarcadas ? '#fff' : INK }}>✔</button>
      </div>
      <div style={{ ...caixa(), overflow: 'hidden', maxHeight: telaCheia ? 'max(240px, calc(100dvh - 430px))' : 420, overflowY: 'auto' }}>
        {lista.map(c => {
          const on = sel.has(c.id)
          return <LinhaCarta key={c.id} c={c} fundo={on ? '#e7f6ec' : undefined} onClick={() => toca(c.id)}
            direita={<span style={{ flex: 'none', width: 28, height: 28, border: `3px solid ${INK}`, borderRadius: 8, background: on ? VERDE : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, opacity: !on && cheio ? .3 : 1 }}>{on ? '✓' : ''}</span>} />
        })}
        {lista.length === 0 && <p style={{ padding: 12, fontSize: 12.5, fontWeight: 700, color: 'rgba(0,0,0,.5)' }}>{tr('Nenhuma carta com esse filtro.', 'No cards with this filter.')}</p>}
      </div>
      <button onClick={onPronto} disabled={pronto}
        style={{ display: 'block', width: '100%', marginTop: 10, background: pronto ? '#9bb5a3' : VERDE, color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: 9, ...OSW, fontWeight: 900, fontSize: 17 }}>
        {pronto ? tr('✔ Pronto — esperando os outros', '✔ Ready — waiting for the others') : marcadas.length >= BAFO2_ELENCO ? tr('✔ Pronto', '✔ Ready') : tr(`✔ Pronto com ${marcadas.length} (o jogo completa os ${BAFO2_ELENCO})`, `✔ Ready with ${marcadas.length} (the game fills up to ${BAFO2_ELENCO})`)}
      </button>
      <p style={{ fontSize: 11.5, color: 'rgba(0,0,0,.6)', margin: '8px 2px 0', fontWeight: 600 }}>
        {tr(`Apertou Pronto (ou o tempo acabou) sem marcar os ${BAFO2_ELENCO}? As marcadas entram e o jogo completa os reservas que faltam com as suas piores cartas. Dá pra trocar titular e reserva depois, na aba Elenco.`, `Pressed Ready (or time ran out) without marking all ${BAFO2_ELENCO}? The marked ones go in and the game fills the missing bench spots with your worst cards. You can swap starters and bench later, in the Squad tab.`)}
      </p>
    </div>
  )
}

// ─── 2a) 🎁 A ABERTURA da convocação (21/11, pedidos do Diego depois do 1º teste) ────────────────────────────────────
// *"essa tela nova deveria começar com o envelope fechado verde sendo aberto"* e *"uma foto de exemplo da cartinha, sei lá,
// do Ronaldo Fenômeno dourada real brilhando, explicando que são cartas que ele ganha quando é campeão de qualquer campeonato
// do modo carreira ou das salas online"* → *"bota só Ronaldo então, já que é exemplo. Mas quero brilhando igual ao normal"*.
// A carta é a `CollectibleCard` de sempre (o brilho de lenda é o dela). Dois tempos: o pacote treme e rasga, sai a carta de
// exemplo com a explicação. Toque pula. O relógio da convocação só conta depois (quem cuida disso é a sala).
// 🔁 Mesmo dia, depois de ver: *"o exemplo do Ronaldo é já na área da convocação, em cima de onde convoca. Antes aparece só o
// pacotinho verde que vai se abrir, e aí entra essa tela já com o exemplo e a convocação na mesma tela"*.
// Então: `AberturaBafo` = SÓ o pacote (2,5 s, toque pula) · `ExemploBafo` = a faixa fixa em cima da lista.
export const BAFO2_ABRE_PACOTE_MS = 2500
export function AberturaBafo({ decorrido, onPular }: { decorrido: number; onPular: () => void }) {
  return (
    <div onClick={onPular} role="button" style={{ border: `4px solid ${INK}`, borderRadius: 22, background: 'radial-gradient(circle at 50% 35%,#12301f,#0c0c0c 75%)', boxShadow: '4px 4px 0 #000', padding: '16px 14px', minHeight: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', overflow: 'hidden' }}>
      <style>{'@keyframes bf-treme{0%,100%{transform:rotate(-3deg)}25%{transform:rotate(4deg) scale(1.03)}50%{transform:rotate(-5deg) scale(1.06)}75%{transform:rotate(5deg) scale(1.09)}}@keyframes bf-rasga{0%{transform:scale(1.1);opacity:1;filter:brightness(1.4)}100%{transform:scale(1.9);opacity:0;filter:brightness(3)}}'}</style>
      <img src={pacoteCampeaoArt} alt="" width={170} height={255} style={{ animation: decorrido >= BAFO2_ABRE_PACOTE_MS - 600 ? 'bf-rasga .6s ease-in forwards' : 'bf-treme .5s ease-in-out infinite', filter: 'drop-shadow(0 0 22px rgba(80,230,130,.6))' }} />
      <p style={{ ...OSW, fontWeight: 900, fontSize: 22, color: '#fff', margin: '6px 0 0', textAlign: 'center' }}>{tr('Abrindo as suas cartas de campeão…', 'Opening your champion cards…')}</p>
    </div>
  )
}
/** 🃏 a carta de EXEMPLO + de onde vêm as cartas — fica em cima da lista da convocação (a `CollectibleCard` de sempre, com o brilho de lenda) */
export function ExemploBafo() {
  const en = getLang() === 'en'
  const largo = typeof window !== 'undefined' && window.innerWidth >= 760
  return (
    <div style={{ border: `3px solid ${INK}`, borderRadius: 16, background: 'radial-gradient(circle at 18% 40%,#17402a,#0c0c0c 78%)', boxShadow: `3px 3px 0 ${INK}`, padding: largo ? '14px 18px' : '10px 12px', display: 'flex', alignItems: 'center', gap: largo ? 18 : 12, marginBottom: 10, overflow: 'hidden' }}>
      <style>{'@keyframes bf-sai{0%{transform:translateY(30px) scale(.6) rotate(-8deg);opacity:0}100%{transform:translateY(0) scale(1) rotate(-3deg);opacity:1}}'}</style>
      {/* ⚠️ o encaixe é o MESMO da revelação do leilão (`ll-lote1-reveal-card`, carta pequena): numa caixa qualquer a carta espreme
          o boneco e sobra só a cabeça (o Diego pegou no 1º print: "não tá aparecendo o corpo dele padrão") */}
      <div className="ll-lote1-reveal-card" style={{ flex: 'none', width: largo ? 150 : 124, margin: 0, animation: 'bf-sai .5s ease-out both', filter: `drop-shadow(0 0 16px ${OURO})` }}>
        <CollectibleCard name="Ronaldo Fenômeno" nomeNaCarta="Ronaldo" club="Inter" year={1998} pos="ATA" fame={5} />
      </div>
      <div style={{ color: CREME, minWidth: 0 }}>
        <p style={{ ...OSW, fontWeight: 900, fontSize: largo ? 21 : 16, color: '#fff', margin: 0, lineHeight: 1.1 }}>{tr('Estas são as suas cartinhas de campeão', 'These are your champion cards')}</p>
        <p style={{ fontSize: largo ? 13.5 : 12, fontWeight: 600, lineHeight: 1.35, margin: '5px 0 0' }}>{en ? <>Every time you are <b style={{ color: OURO }}>champion</b> of any competition, in <b style={{ color: '#fff' }}>Career</b> or in the <b style={{ color: '#fff' }}>online rooms</b>, you open a pack and win one.</> : <>Toda vez que você é <b style={{ color: OURO }}>campeão</b> de qualquer campeonato, na <b style={{ color: '#fff' }}>Carreira</b> ou nas <b style={{ color: '#fff' }}>salas online</b>, você abre um pacote e ganha uma.</>}</p>
        <p style={{ fontSize: largo ? 13.5 : 12, fontWeight: 600, lineHeight: 1.35, margin: '4px 0 0' }}>{en ? <>Here you put <b style={{ color: '#fff' }}>22 of them at stake</b>. The champion takes 1 from someone.</> : <>Aqui você põe <b style={{ color: '#fff' }}>22 delas em jogo</b>. O campeão toma 1 de alguém.</>}</p>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: '#9fb5a6', margin: '5px 0 0' }}>{tr('(o Ronaldo é só um exemplo · as suas estão na lista abaixo)', '(Ronaldo is just an example · yours are in the list below)')}</p>
      </div>
    </div>
  )
}

// ─── os 22 de um time, abertos por posição (usado na aba Elencos e na escolha do campeão) ───────────────────────────
type CartaVista = { id: string; name: string; club: string; year: number; pos: string }
function TimeAberto({ nome, cartas, selId, onToca, apagadas }: { nome: string; cartas: CartaVista[]; selId?: string | null; onToca?: (c: CartaVista) => void; apagadas?: Set<string> }) {
  return (
    <div style={{ ...caixa(), padding: 8, color: INK }}>
      <div style={{ ...OSW, fontWeight: 900, fontSize: 16, borderBottom: `3px solid ${INK}`, paddingBottom: 4, marginBottom: 6 }}>{nome} <small style={{ fontWeight: 700, fontSize: 11, color: '#666', marginLeft: 6 }}>{cartas.length} {tr('cartas', 'cards')}</small></div>
      {SECTORS.map(p => {
        const l = cartas.filter(c => c.pos === p)
        if (!l.length) return null
        return (
          <div key={p} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '4px 0', borderBottom: '1px dashed rgba(0,0,0,.2)' }}>
            <span style={{ ...OSW, fontWeight: 800, fontSize: 11, border: `2px solid ${INK}`, borderRadius: 6, padding: '1px 5px', background: CREME, minWidth: 38, textAlign: 'center', marginTop: 2 }}>{p}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
              {l.map(c => {
                const on = selId === c.id, off = apagadas?.has(c.id)
                return (
                  <button key={c.id} disabled={!onToca || off} onClick={() => onToca?.(c)}
                    style={{ border: `2px solid ${INK}`, borderRadius: 8, padding: '2px 6px', background: on ? VERM : CREME, color: on ? '#fff' : INK, lineHeight: 1.1, textAlign: 'left', boxShadow: on ? `2px 2px 0 ${INK}` : undefined, opacity: off ? .35 : 1, cursor: onToca && !off ? 'pointer' : 'default' }}>
                    <b style={{ ...OSW, fontWeight: 800, fontSize: 12.5, display: 'block' }}>{c.name}</b>
                    <i style={{ fontStyle: 'normal', fontSize: 9.5, fontWeight: 700, color: on ? '#ffe' : '#555' }}>{c.club} · {c.year}</i>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── 3) 👀 ELENCOS (durante a liga: espiar os 22 de cada rival) ──────────────────────────────────────────────────────
export function ElencosBafo({ managers, youId }: { managers: Manager[]; youId: number }) {
  const rivais = managers.filter(m => m.isHuman && m.id !== youId && m.squad.length > 0)
  const [aba, setAba] = useState(0)
  if (!rivais.length) return null
  const m = rivais[Math.min(aba, rivais.length - 1)]
  return (
    <div style={{ ...caixa(CREME), padding: 12 }}>
      <p style={{ ...OSW, fontWeight: 900, fontSize: 16, margin: '0 0 2px', color: INK }}>👀 {tr('Elencos dos rivais', 'Rival squads')}</p>
      <p style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(0,0,0,.6)', margin: '0 0 8px' }}>{tr('As 22 cartas que cada um pôs em jogo. Se você for campeão, toma uma delas — já vai escolhendo.', 'The 22 cards each one put at stake. If you win the title you take one — start picking.')}</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto' }}>
        {rivais.map((r, i) => (
          <button key={r.id} onClick={() => setAba(i)} style={{ flex: 'none', border: `3px solid ${INK}`, borderRadius: 10, padding: '4px 10px', ...OSW, fontWeight: 800, fontSize: 13, background: i === aba ? INK : '#fff', color: i === aba ? OURO : INK, whiteSpace: 'nowrap' }}>{r.teamName}</button>
        ))}
      </div>
      <TimeAberto nome={m.teamName} cartas={m.squad} />
    </div>
  )
}

// ─── 3a) 📏 A FAIXA em cima do campo: a regra de ganhar e quem está na frente ────────────────────────────────────────
// Diego (21/11, 1º teste): *"tem que ter claro em cima do campo qual a regra de ganhar: tipo 1x1 é melhor de 5… e mostrar quem
// tá ganhando… quando tiver 2 uma coisa, 3 outra, e até 20"*. Uma faixa só, texto pelo tamanho da sala (`formatoBafo`).
// 🚫 spoiler: quem chama manda a tabela de ANTES do apito enquanto o jogo da tela ainda rola.
export function FaixaBafo({ liga, youId, rodada, total }: { liga: { id: number; name: string; pts: number }[]; youId: number; rodada: number; total: number }) {
  const en = getLang() === 'en'
  const n = liga.length
  if (n < 2) return null
  const f = formatoBafo(n)
  const lider = liga[0], eu = liga.findIndex(t => t.id === youId)
  const verde = { color: '#7CFFA5' } as const
  const linha2 = n === 2
    ? (liga[0].pts === liga[1].pts
      ? <>{en ? `Game ${rodada} of ${total}` : `Jogo ${rodada} de ${total}`} · <b style={verde}>{en ? 'all square' : 'tudo igual'}</b>: {liga[0].name} {liga[0].pts} × {liga[1].pts} {liga[1].name}</>
      : <>{en ? `Game ${rodada} of ${total}` : `Jogo ${rodada} de ${total}`} · <b style={verde}>{liga[0].name} {liga[0].pts} {liga[0].pts === 1 ? 'pt' : 'pts'}</b> × {liga[1].pts} {liga[1].pts === 1 ? 'pt' : 'pts'} {liga[1].name}</>)
    : <>{en ? `Round ${rodada} of ${total}` : `Rodada ${rodada} de ${total}`} · {eu === 0
      ? <b style={verde}>{en ? `you lead with ${lider.pts} pts` : `você lidera com ${lider.pts} pts`}{liga[1] ? (en ? ` (${lider.pts - liga[1].pts} clear)` : ` (${lider.pts - liga[1].pts} de folga)`) : ''}</b>
      : <>{en ? 'leader' : 'líder'} <b style={verde}>{lider.name} {lider.pts} pts</b>{eu > 0 ? (en ? ` · you are ${eu + 1}${eu === 1 ? 'nd' : eu === 2 ? 'rd' : 'th'}, ${lider.pts - liga[eu].pts} behind` : ` · você é o ${eu + 1}º, a ${lider.pts - liga[eu].pts} ${lider.pts - liga[eu].pts === 1 ? 'pt' : 'pts'}`) : ''}</>}</>
  return (
    <div style={{ background: INK, border: `3px solid ${OURO}`, borderRadius: 14, padding: '7px 12px', boxShadow: '3px 3px 0 #000', marginBottom: 8 }}>
      <p style={{ ...OSW, fontWeight: 800, fontSize: 14, color: OURO, margin: 0, lineHeight: 1.15 }}>🃏 {en ? f.en : f.pt}{n > 2 ? (en ? ' · champion takes 1 card' : ' · o campeão toma 1 carta') : ''}</p>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', margin: '3px 0 0', lineHeight: 1.25 }}>{rodada > 0 ? linha2 : tr('Ainda não rolou nenhum jogo.', 'No game played yet.')}</p>
    </div>
  )
}

// ─── 3b) 🥁 O SUSPENSE da carta tomada ───────────────────────────────────────────────────────────────────────────────
// Diego (21/11): *"no fim poderia aparecer um suspense de qual carta foi escolhida pelo campeão, igual o suspense que já funciona
// do Liga Draft, porém iniciando com o pacote verde fechado… e a carta em tamanho real… e mais alguma zoação do campeão pro
// usuário que perdeu"*. Mesmas pistas do draft (posição → categoria → clube/década), de 2 em 2 s; depois a carta vira.
const REV_PACOTE_MS = 2000, REV_PISTA_MS = 2000, REV_VIRA_MS = REV_PACOTE_MS + 3 * REV_PISTA_MS
/** 😈 a zoeira do campeão (PT e EN na MESMA posição). {c} = campeão · {p} = quem perdeu · {j} = o jogador */
const ZOEIRA_BAFO: [string, string][] = [
  ['Obrigado pelo presente, {p}. Vou cuidar bem do {j}… no banco.', 'Thanks for the gift, {p}. I will take good care of {j}… on the bench.'],
  ['{p}, o {j} mandou um abraço. Disse que aqui tem título.', '{p}, {j} sends his regards. Says there are trophies over here.'],
  ['Era o seu xodó, né, {p}? Agora é o meu.', 'He was your favourite, right, {p}? He is mine now.'],
  ['{p}, pode chorar. O {j} já até trocou de armário.', '{p}, go ahead and cry. {j} already has a new locker.'],
  ['Bafo bem batido. O {j} virou de lado e caiu no meu monte.', 'Clean slap. {j} flipped and landed on my pile.'],
  ['{p}, devolvo o {j} quando você ganhar de mim. Ou seja: nunca.', '{p}, you get {j} back when you beat me. So: never.'],
  ['Quem mandou convocar o {j}, {p}? Agora ele joga pro {c}.', 'Who told you to call up {j}, {p}? Now he plays for {c}.'],
  ['{p}, relaxa: no álbum do {c} ele vai ficar mais bonito.', "{p}, relax: he will look better in {c}'s album."],
  ['Escolhi com carinho, {p}. Era a que mais ia doer.', 'I picked with love, {p}. The one that would hurt the most.'],
  ['{p}, sua coleção ficou mais leve. De nada.', '{p}, your collection just got lighter. You are welcome.'],
  ['O {j} nem olhou pra trás, {p}. Frio.', '{j} did not even look back, {p}. Cold.'],
  ['Campeão escolhe, perdedor entrega. Passa o {j} pra cá, {p}.', 'Champion picks, loser hands over. Pass {j} here, {p}.'],
]
function RevelaBafo({ b, decorrido }: { b: Bafo2Linha; decorrido: number }) {
  const r = b.resultado!, c = r.carta!
  const en = getLang() === 'en'
  const carta = { name: c.name, club: c.club, year: c.year, fame: c.fame ?? 1 }
  const cat = categoriaDa(carta), dec = decadaDe(c.year), selo = seloDoClube(c.club)
  const noPacote = decorrido < REV_PACOTE_MS
  const etapa = noPacote ? 0 : Math.min(3, 1 + Math.floor((decorrido - REV_PACOTE_MS) / REV_PISTA_MS))
  const virou = decorrido >= REV_VIRA_MS
  const ult = useRef(-1)
  useEffect(() => { const m = virou ? 9 : etapa; if (m !== ult.current) { ult.current = m; try { playTick() } catch { /* sem som */ } } }, [etapa, virou])
  const z = ZOEIRA_BAFO[b.id % ZOEIRA_BAFO.length][en ? 1 : 0].replace(/\{c\}/g, (r.paraNome ?? '').trim()).replace(/\{p\}/g, (r.deNome ?? '').trim()).replace(/\{j\}/g, c.name)
  const titulo = virou ? `${c.name.toUpperCase()}!`
    : noPacote ? tr('🥁 Carta tomada!', '🥁 Card taken!')
    : etapa === 1 ? `${tr('É um…', "It's a…")} ${c.pos}`
    : etapa === 2 ? `…${tr('e é', "and it's")} ${cat.emoji} ${en ? cat.en : cat.pt}!`
    : en ? `It was ${(r.deNome ?? '').trim()}'s… ${c.club}, ${dec.en}` : `Era do ${(r.deNome ?? '').trim()}… ${c.club}, ${dec.pt}`
  const pistas = [c.pos, `${cat.emoji} ${en ? cat.en : cat.pt}`, en ? dec.en : dec.pt]
  const listra = etapa >= 3 && selo ? `repeating-linear-gradient(135deg,${selo.c1} 0 18px,${selo.c2} 18px 26px,${selo.c1} 26px 44px)` : 'repeating-linear-gradient(45deg,#1a1a1a 0 12px,#242424 12px 24px)'
  const brilho = etapa >= 2 ? cat.brilho : null
  return (
    <div style={{ border: `4px solid ${INK}`, borderRadius: 22, background: 'radial-gradient(circle at 50% 40%,#2a2140,#0c0c0c 70%)', boxShadow: `4px 4px 0 ${INK}`, padding: 12, textAlign: 'center' }}>
      <style>{'@keyframes bf-treme{0%,100%{transform:rotate(-3deg)}25%{transform:rotate(4deg) scale(1.03)}50%{transform:rotate(-5deg) scale(1.06)}75%{transform:rotate(5deg) scale(1.09)}}@keyframes bf-vira{0%{transform:rotateY(90deg) scale(.9);opacity:.3}100%{transform:rotateY(0) scale(1);opacity:1}}'}</style>
      <p style={{ ...OSW, fontWeight: 700, fontSize: 11, letterSpacing: '.14em', color: OURO, margin: 0 }}>🏆 {(r.paraNome ?? '').trim()} {virou ? (r.sorteio ? tr('levou no sorteio do', 'got it in the draw from') : tr('tomou do', 'took it from')) + ' ' + (r.deNome ?? '').trim() : r.sorteio ? tr('· o jogo sorteou', '· the game drew') : tr('escolheu', 'has chosen')}</p>
      <div style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6 }}>
        {virou ? (
          <div style={{ position: 'relative', animation: 'bf-vira .6s ease-out', filter: `drop-shadow(0 0 26px ${cat.brilho})` }}>
            <div className="ll-lote1-reveal-card" style={{ width: 200, margin: 0 }}><CollectibleCard name={c.name} club={c.club} year={c.year} pos={c.pos} fame={c.fame ?? 1} /></div>
            <span style={{ ...OSW, position: 'absolute', right: -14, top: 86, transform: 'rotate(-10deg)', fontSize: 18, fontWeight: 900, color: '#fff', background: VERM, border: `3px solid ${INK}`, borderRadius: 10, padding: '1px 10px' }}>{tr('Tomada!', 'Taken!')}</span>
          </div>
        ) : noPacote ? <img src={pacoteCampeaoArt} alt="" width={150} height={225} style={{ animation: 'bf-treme .5s ease-in-out infinite', filter: 'drop-shadow(0 0 18px rgba(60,220,120,.55))' }} />
          : (
            <div style={{ width: 170, height: 228, borderRadius: 16, display: 'grid', placeItems: 'center', background: listra, border: `4px solid ${brilho ?? '#555'}`, boxShadow: brilho ? `0 0 34px ${brilho}, 0 0 80px ${brilho}66` : 'none', transition: 'all .5s' }}>
              <div style={{ width: 104, height: 140, borderRadius: 12, background: INK, border: `3px solid ${OURO}`, color: OURO, ...OSW, fontWeight: 900, fontSize: 46, display: 'grid', placeItems: 'center' }}>{c.pos}</div>
            </div>
          )}
        {!virou && <div>{pistas.map((p, i) => <span key={i} style={{ display: 'inline-block', ...OSW, fontWeight: 700, fontSize: 13, border: `2px solid ${i < etapa ? INK : '#555'}`, borderRadius: 8, padding: '1px 8px', margin: 2, background: i < etapa ? OURO : '#151515', color: i < etapa ? INK : '#777' }}>{i < etapa ? p : '?'}</span>)}</div>}
      </div>
      <p style={{ ...OSW, fontWeight: 900, fontSize: 21, color: '#fff', margin: '8px 0 0', lineHeight: 1.15 }}>{titulo}</p>
      {virou && !r.sorteio && <div style={{ marginTop: 10, background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: '3px 3px 0 #000', padding: '7px 10px', fontSize: 13, fontWeight: 700, textAlign: 'left' }}>😈 <b>{(r.paraNome ?? '').trim()}:</b> "{z}"</div>}
    </div>
  )
}

// ─── o estado do Bafo no banco ──
export interface Bafo2Linha {
  id: number; dono: string; valendo: boolean; fase: 'jogando' | 'escolha' | 'fim' | 'encerrada'
  squads: Record<string, string[]>; nomes: Record<string, string>; campeao: string | null; escolha_ate: string | null; batida_em: string
  resultado: { de?: string; para?: string; deNome?: string; paraNome?: string; carta?: CartaVista & { fame?: number }; sorteio?: boolean; semCarta?: boolean; amistoso?: boolean } | null
  punicao: { motivo?: string; donoNome?: string; amistoso?: boolean; cartas?: { para: string | null; paraNome?: string; carta: CartaVista }[] } | null
}
const COLS = 'id, dono, valendo, fase, squads, nomes, campeao, escolha_ate, batida_em, resultado, punicao'
async function leBafo(roomId: string): Promise<Bafo2Linha | null> {
  const { data } = await supabase.from('esc_bafo2').select(COLS).eq('room_id', roomId).order('id', { ascending: false }).limit(1).maybeSingle()
  return (data ?? null) as Bafo2Linha | null
}
/** relógio do SERVIDOR pra contar a escolha igual em todo aparelho: o desvio sai do cabeçalho Date da própria leitura */
function useAgora(ms = 1000): number { const [t, setT] = useState(Date.now()); useEffect(() => { const i = window.setInterval(() => setT(Date.now()), ms); return () => window.clearInterval(i) }, [ms]); return t }

// ─── 4) 🏆 O FIM: só o campeão escolhe (60 s) ────────────────────────────────────────────────────────────────────────
export function Bafo2Fim({ roomId, souDono, meuUid, campeaoUid, managers, assentos, aoVoltar }: {
  roomId: string; souDono: boolean; meuUid: string | undefined; campeaoUid: string | null; managers: Manager[]
  /** 🪑 quem senta em cada time (índice = id do time humano) — a mesma lista da sala */
  assentos: string[]
  /** 📣 (só o dono) Bafo fechado → leva a sala de volta pra espera pra um novo Bafo */
  aoVoltar?: () => void
}) {
  const [b, setB] = useState<Bafo2Linha | null>(null)
  const [erro, setErro] = useState('')
  const [selId, setSelId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [aba, setAba] = useState(0)
  const [indo, setIndo] = useState(false)
  const abriu = useRef(false)
  const vistoEm = useRef<number | null>(null) // quando ESTE aparelho viu a escolha aberta (o relógio local conta daqui)
  const revEm = useRef<number | null>(null) // 🥁 quando ESTE aparelho começou a ver o suspense da carta tomada
  const agora = useAgora(500)
  const en = getLang() === 'en'

  // lê o banco de 2 em 2 s enquanto a escolha não fecha (janela curta, linha pequena)
  useEffect(() => {
    let vivo = true, t: ReturnType<typeof setTimeout> | undefined
    const gira = async () => {
      try { const l = await leBafo(roomId); if (vivo) setB(l) } catch { /* tenta de novo */ }
      if (vivo) t = setTimeout(gira, 2000)
    }
    void gira()
    return () => { vivo = false; if (t) clearTimeout(t) }
  }, [roomId])
  // o DONO abre a escolha quando chega nesta tela (uma vez)
  useEffect(() => {
    if (!souDono || !campeaoUid || abriu.current || !b || b.fase !== 'jogando') return
    abriu.current = true
    supabase.rpc('bafo2_abre_escolha', { p_room: roomId, p_campeao: campeaoUid }).then(({ error }) => { if (error) { abriu.current = false; setErro(tr('Não deu pra abrir a escolha agora. Vou tentar de novo.', 'Could not open the pick now. Trying again.')) } else setErro('') }, () => { abriu.current = false })
  }, [souDono, campeaoUid, b, roomId])

  // os 22 de cada um, pelo que o JOGO tem na tela (nome/clube/ano/posição) casado com o id da carta no banco
  const times = useMemo(() => {
    if (!b) return []
    return Object.entries(b.squads).filter(([uid]) => uid !== b.campeao).map(([uid, ids]) => {
      const m = managers.find(x => x.isHuman && assentos[x.id] === uid)
      const nome = m?.teamName ?? b.nomes[uid] ?? '—'
      // cada carta do jogo carrega o id dela no banco (`bafoId`, carimbado na largada) — a ordem do elenco muda quando o
      // técnico troca titular e reserva, então NUNCA se casa por posição na lista
      const cartas: CartaVista[] = ids.flatMap(id => {
        const c = m?.squad.find(x => (x as { bafoId?: string }).bafoId === id)
        return c ? [{ id, name: c.name, club: c.club, year: c.year, pos: c.pos }] : []
      })
      return { uid, nome, cartas }
    }).filter(t => t.cartas.length > 0)
  }, [b, managers, assentos])

  const restam = (() => {
    if (!b || b.fase !== 'escolha') return 0
    if (vistoEm.current == null) vistoEm.current = Date.now()
    return Math.max(0, BAFO2_ESCOLHA_SEG - Math.floor((agora - vistoEm.current) / 1000))
  })()
  // passou o tempo → qualquer um da sala pede o sorteio (o banco confere o relógio DELE; cedo demais ele só devolve nada)
  const pediuSorteio = useRef(0)
  useEffect(() => {
    if (!b || b.fase !== 'escolha' || restam > 0 || !meuUid || !(meuUid in b.squads)) return
    if (Date.now() - pediuSorteio.current < 4000) return
    pediuSorteio.current = Date.now()
    void supabase.rpc('bafo2_sorteia', { p_room: roomId }).then(() => {}, () => {})
  }, [b, restam, meuUid, roomId, agora])

  if (!b) return <div style={{ ...caixa(CREME), padding: 12, color: INK, fontWeight: 700, fontSize: 13 }}>🃏 {tr('Conferindo o Bafo…', 'Checking the Bafo…')}</div>
  const souCampeao = !!meuUid && b.campeao === meuUid
  const nomeCampeao = managers.find(x => x.isHuman && assentos[x.id] === b.campeao)?.teamName ?? ((b.campeao && b.nomes[b.campeao]) || '—')

  const voltar = aoVoltar ? <button onClick={aoVoltar} style={{ display: 'block', width: '100%', marginTop: 10, background: OURO, color: INK, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: 9, ...OSW, fontWeight: 900, fontSize: 16 }}>📣 {tr('Voltar pra sala de espera · novo Bafo', 'Back to the waiting room · new Bafo')}</button>
    : <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '8px 0 0', textAlign: 'center' }}>{tr('O dono da sala leva todo mundo de volta pra espera pra um novo Bafo.', 'The room owner takes everyone back to the waiting room for a new Bafo.')}</p>
  if (b.fase === 'encerrada') return <div><PunicaoBafo b={b} />{voltar}</div>
  if (b.fase === 'jogando') return (
    <div style={{ ...caixa('#FFF6D6'), padding: 12, color: INK }}>
      <p style={{ ...OSW, fontWeight: 900, fontSize: 16, margin: 0 }}>🃏 {tr('Bafo · a hora da verdade', 'Bafo · the moment of truth')}</p>
      <p style={{ fontSize: 12.5, fontWeight: 600, margin: '4px 0 0' }}>{souDono ? tr('Abrindo a escolha do campeão…', 'Opening the champion\'s pick…') : tr('⏳ Esperando o dono da sala chegar nesta tela pra abrir a escolha do campeão.', '⏳ Waiting for the room owner to reach this screen and open the champion\'s pick.')}</p>
      {erro && <p style={{ fontSize: 12, fontWeight: 700, color: '#8E2A1B', margin: '4px 0 0' }}>{erro}</p>}
    </div>
  )
  if (b.fase === 'fim') {
    const r = b.resultado
    // 🥁 o suspense da carta tomada: uma vez por aparelho e por Bafo (recarregou a página depois = já vê o resultado direto)
    if (r?.carta && !r.amistoso && !r.semCarta) {
      if (revEm.current == null) {
        const k = `bafo2-rev-${b.id}`
        let em = Date.now()
        try { const g = Number(sessionStorage.getItem(k)); if (g > 0) em = g; else sessionStorage.setItem(k, String(em)) } catch { /* sem armazenamento: conta daqui */ }
        revEm.current = em
      }
      const dec = agora - revEm.current
      if (dec < REV_VIRA_MS + 7000) return <RevelaBafo b={b} decorrido={dec} />
    }
    return (
      <div style={{ ...caixa('linear-gradient(135deg,#FFC400,#ffe27a)'), padding: 12, color: INK, textAlign: 'center' }}>
        <p style={{ ...OSW, fontWeight: 900, fontSize: 18, margin: 0 }}>🃏 {tr('Bafo fechado', 'Bafo settled')}</p>
        {r?.amistoso ? <p style={{ fontSize: 13, fontWeight: 700, margin: '6px 0 0' }}>{tr('🤝 Sala amistosa: ninguém ganhou nem perdeu carta.', '🤝 Friendly room: nobody won or lost a card.')}</p>
          : r?.semCarta || !r?.carta ? <p style={{ fontSize: 13, fontWeight: 700, margin: '6px 0 0' }}>{tr('Não sobrou carta em jogo pra tomar.', 'There was no card left at stake to take.')}</p>
          : <>
            <p style={{ ...OSW, fontWeight: 900, fontSize: 24, margin: '6px 0 0' }}>{r.carta.name}</p>
            <p style={{ fontSize: 12.5, fontWeight: 700, margin: 0 }}>{r.carta.pos} · {r.carta.club} · {r.carta.year}</p>
            <p style={{ fontSize: 13.5, fontWeight: 700, margin: '8px 0 0' }}>
              {r.sorteio ? '🎲 ' : '🖐️ '}{en ? <><b>{r.paraNome}</b> {r.sorteio ? 'got it in the draw from' : 'took it from'} <b>{r.deNome}</b>.</> : <><b>{r.paraNome}</b> {r.sorteio ? 'levou no sorteio do' : 'tomou do'} <b>{r.deNome}</b>.</>}
            </p>
            {meuUid && r.de === meuUid && <p style={{ fontSize: 12.5, fontWeight: 800, color: '#8E2A1B', margin: '4px 0 0' }}>{tr('💔 Essa era sua. Saiu da sua coleção — ganha o próximo Bafo e toma de volta.', '💔 That one was yours. It left your collection — win the next Bafo and take it back.')}</p>}
            {meuUid && r.para === meuUid && <p style={{ fontSize: 12.5, fontWeight: 800, color: VERDE, margin: '4px 0 0' }}>{tr('🎉 Agora é sua: já está na sua coleção.', '🎉 It\'s yours now: already in your collection.')}</p>}
          </>}
        {voltar}
      </div>
    )
  }
  // fase 'escolha'
  const q = semAcento(busca.trim())
  const achados = q.length >= 2 ? times.flatMap(t => t.cartas.filter(c => semAcento(c.name).includes(q)).map(c => ({ ...c, dono: t.nome }))) : []
  const selCarta = selId ? times.flatMap(t => t.cartas.map(c => ({ ...c, dono: t.nome }))).find(c => c.id === selId) : null
  const toma = async () => {
    if (!selId || indo) return
    setIndo(true); setErro('')
    const { error } = await supabase.rpc('bafo2_tomar', { p_room: roomId, p_card: selId })
    if (error) setErro(/tempo/.test(error.message) ? tr('O tempo acabou — o jogo vai sortear.', 'Time is up — the game will draw.') : tr('Não deu pra tomar essa carta. Escolha de novo.', 'Could not take that card. Pick again.'))
    else { try { setB(await leBafo(roomId)) } catch { /* a leitura de 2 s pega */ } }
    setIndo(false)
  }
  const largo = typeof window !== 'undefined' && window.innerWidth >= 900
  return (
    <div style={{ ...caixa(CREME), padding: 12, color: INK }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', marginBottom: 8 }}>
        <div style={{ flex: 1, ...caixa('linear-gradient(135deg,#FFC400,#ffe27a)'), padding: '8px 12px' }}>
          <small style={{ ...OSW, fontWeight: 700, fontSize: 11, letterSpacing: '.1em', display: 'block' }}>🏆 {tr('Campeão do Bafo · toma 1 carta', 'Bafo champion · takes 1 card')}</small>
          <b style={{ ...OSW, fontWeight: 900, fontSize: 21 }}>{nomeCampeao}</b>
        </div>
        <div style={{ width: 96, textAlign: 'center', background: INK, color: restam <= 10 ? VERM : OURO, border: `3px solid ${INK}`, borderRadius: 14, padding: 6, ...OSW, fontWeight: 900, fontSize: 32, lineHeight: 1 }}>{restam}<small style={{ display: 'block', fontWeight: 700, fontSize: 9.5, letterSpacing: '.12em', color: CREME }}>{tr('segundos', 'seconds')}</small></div>
      </div>
      {!souCampeao && <p style={{ fontSize: 12.5, fontWeight: 700, margin: '0 0 8px' }}>{en ? <>👀 <b>{nomeCampeao}</b> is choosing. Time up (or champion gone)? The game draws a card.</> : <>👀 <b>{nomeCampeao}</b> está escolhendo. Acabou o tempo (ou o campeão saiu)? O jogo sorteia uma carta.</>}</p>}
      {souCampeao && <>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder={tr('🔎 já sabe qual quer? digite o nome…', '🔎 know which one? type the name…')}
          style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 10, padding: '7px 10px', background: '#fff', fontWeight: 700, fontSize: 14, color: INK, marginBottom: 8 }} />
        {q.length >= 2 && (
          <div style={{ ...caixa(), overflow: 'hidden', marginBottom: 8, maxHeight: 220, overflowY: 'auto' }}>
            {achados.length === 0 ? <p style={{ padding: 10, fontSize: 12.5, fontWeight: 700, color: 'rgba(0,0,0,.5)' }}>{tr('Ninguém convocou esse.', 'Nobody called that one up.')}</p>
              : achados.map(c => <LinhaCarta key={c.id} c={c} fundo={selId === c.id ? '#ffe1da' : undefined} onClick={() => setSelId(c.id)} direita={<small style={{ flex: 'none', fontSize: 11, fontWeight: 800 }}>{c.dono}</small>} />)}
          </div>
        )}
      </>}
      {largo ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, times.length))}, 1fr)`, gap: 10 }}>
          {times.map(t => <TimeAberto key={t.uid} nome={t.nome} cartas={t.cartas} selId={selId} onToca={souCampeao ? c => setSelId(c.id) : undefined} />)}
        </div>
      ) : <>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto' }}>
          {times.map((t, i) => <button key={t.uid} onClick={() => setAba(i)} style={{ flex: 'none', border: `3px solid ${INK}`, borderRadius: 10, padding: '4px 10px', ...OSW, fontWeight: 800, fontSize: 13, background: i === aba ? INK : '#fff', color: i === aba ? OURO : INK, whiteSpace: 'nowrap' }}>{t.nome}</button>)}
        </div>
        {times[Math.min(aba, times.length - 1)] && <TimeAberto nome={times[Math.min(aba, times.length - 1)].nome} cartas={times[Math.min(aba, times.length - 1)].cartas} selId={selId} onToca={souCampeao ? c => setSelId(c.id) : undefined} />}
      </>}
      {souCampeao && (
        <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', background: INK, color: '#fff', border: `3px solid ${INK}`, borderRadius: 14, padding: '8px 12px', boxShadow: `3px 3px 0 ${VERM}` }}>
          <b style={{ ...OSW, fontWeight: 900, fontSize: 15, flex: 1 }}>{selCarta ? `${selCarta.name} · ${selCarta.club} ${selCarta.year} · ${selCarta.dono}` : tr('Toque numa carta pra marcar', 'Tap a card to mark it')}</b>
          <button disabled={!selCarta || indo} onClick={() => { void toma() }} style={{ flex: 'none', background: VERM, color: '#fff', border: '3px solid #fff', borderRadius: 10, padding: '5px 14px', ...OSW, fontWeight: 900, fontSize: 15, opacity: selCarta && !indo ? 1 : .4 }}>{indo ? '…' : tr('Tomar esta', 'Take this one')}</button>
        </div>
      )}
      {erro && <p style={{ fontSize: 12.5, fontWeight: 800, color: '#8E2A1B', margin: '8px 0 0' }}>{erro}</p>}
    </div>
  )
}

function PunicaoBafo({ b }: { b: Bafo2Linha }) {
  const p = b.punicao
  const en = getLang() === 'en'
  return (
    <div style={{ ...caixa('#FFE3DC'), padding: 12, color: INK }}>
      <p style={{ ...OSW, fontWeight: 900, fontSize: 17, margin: 0, color: '#8E2A1B' }}>🚪 {tr('O dono encerrou o Bafo antes do fim', 'The owner ended the Bafo early')}</p>
      {p?.amistoso || !p?.cartas?.length
        ? <p style={{ fontSize: 12.5, fontWeight: 700, margin: '4px 0 0' }}>{tr('Era amistoso (ou não havia carta em jogo): ninguém perdeu nada.', 'It was a friendly (or no card was at stake): nobody lost anything.')}</p>
        : <>
          <p style={{ fontSize: 12.5, fontWeight: 700, margin: '4px 0 6px' }}>{en ? <><b>{p.donoNome}</b> {p.motivo === 'sumiu' ? 'vanished for 10 minutes' : 'left'} and lost {p.cartas.length} card(s):</> : <><b>{p.donoNome}</b> {p.motivo === 'sumiu' ? 'sumiu por 10 minutos' : 'saiu'} e perdeu {p.cartas.length} carta(s):</>}</p>
          {p.cartas.map((c, i) => (
            <p key={i} style={{ fontSize: 13, fontWeight: 700, margin: '2px 0' }}>• <b>{c.carta?.name}</b> ({c.carta?.club} · {c.carta?.year}) → {c.para ? <b>{c.paraNome}</b> : tr('sumiu (ninguém ganha: não tinha jogo jogado)', 'gone (nobody wins it: no game had been played)')}</p>
          ))}
        </>}
    </div>
  )
}

// ─── 5) 💓 O VIGIA durante a liga: o dono bate; os outros conferem; encerrou → aviso pra sala inteira ────────────────
export function BafoVigia({ roomId, souDono, meuUid, ligaRolando }: { roomId: string; souDono: boolean; meuUid: string | undefined; ligaRolando: boolean }) {
  const [b, setB] = useState<Bafo2Linha | null>(null)
  useEffect(() => {
    if (!ligaRolando) return
    let vivo = true
    const gira = async () => {
      try {
        if (souDono) await supabase.rpc('bafo2_bate', { p_room: roomId })
        const l = await leBafo(roomId)
        if (!vivo) return
        setB(l)
        // dono calado há 10 min (hora do servidor, comparada com a hora em que a linha foi lida — folga de 30 s pro relógio do aparelho)
        if (!souDono && l && l.fase === 'jogando' && meuUid && meuUid in l.squads && Date.now() - new Date(l.batida_em).getTime() > 10.5 * 60_000) {
          await supabase.rpc('bafo2_sumiu', { p_room: roomId })
          const d = await leBafo(roomId); if (vivo) setB(d)
        }
      } catch { /* sem rede: tenta na próxima */ }
    }
    void gira()
    const iv = window.setInterval(() => { if (!document.hidden) void gira() }, 60_000)
    return () => { vivo = false; window.clearInterval(iv) }
  }, [roomId, souDono, meuUid, ligaRolando])
  if (!b || b.fase !== 'encerrada') return null
  return <PunicaoBafo b={b} />
}
