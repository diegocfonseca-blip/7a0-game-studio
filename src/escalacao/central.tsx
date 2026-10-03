// ─── 📺 CENTRAL LEGENDS — a home do modo carreira (03/10) ────────────────────
//
// Pedido do Diego: *"queria alguma central no modo carreira… falta uma área na
// home central, com giro da rodada, notícias, transferências… precisa ter alguma
// central"*. Mockup v4 aprovado (celular e desktop), depois de três rodadas: a 1ª
// ele achou feia (*"quero algo top com as artes cinematográficas de fundo"*), a 3ª
// tinha notícia demais e giro de menos.
//
// O QUE ELA É: uma tela só, com cara de transmissão, que junta o que já existe:
//   🏟️ o PRÓXIMO JOGO visto do camarote (arte `online-estadio-v25`), com o MESMO
//      botão de jogar a rodada — não cria passo, não cria espera (regra de ouro);
//   📣 o GIRO da rodada que passou (só rodada REVELADA — nunca spoiler);
//   📰 O MARTELO do meio da temporada (redação em `central-noticias.ts`);
//   💸 o MERCADO (suas compras do extrato + a carta mais cara da divisão);
//   📊 a TABELA resumida e a 🗓️ AGENDA das copas. Tocar leva pra aba certa.
// Tudo que aparece aqui JÁ apareceu em outra aba — a Central não sabe de nada
// que a tela não saiba. 🔒 Só a conta do Diego vê (`useCentralCarreira`).
import { useState } from 'react'
import { Escudo } from './escudos'
import { getLang, useT } from './lang'
import type { Jornal, Contratacao } from './central-noticias'
import estadioArt from './img/online-estadio-v25.webp'
import tacaArt from './img/jornal-liga-v22.webp'
import leilaoArt from './img/career-auction-room-private.webp'
import copaBrArt from './img/carreira-copa-brasil-v25.webp'
import copaLegArt from './img/online-copa8-v25.webp'
import libertaArt from './img/online-liberta-v25.webp'
import mundoArt from './img/online-mundial-v25.webp'
import './central.css'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', RED = '#E8503A'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 as const, textTransform: 'uppercase' as const }
const G_OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'

export type CentralJogo = { h: string; a: string; hg: number; ag: number; hId: number; aId: number }
export type CentralAgenda = { arte: 'copaBr' | 'copaLeg' | 'liberta' | 'mundo'; titulo: [string, string]; sub: [string, string] }
export type CentralProps = {
  seasonNo: number
  round: number
  divName: string
  youId: number
  euNome: string
  /** 🏟️ o próximo jogo (ou o que está rolando agora, com `rolando`) */
  proximo: { rodada: number; casa: string; fora: string; rolando: boolean } | null
  /** forma recente por clube ('VVEVD', a mais recente por último) — só rodadas reveladas */
  formas: Record<string, string>
  giro: { rodada: number; jogos: CentralJogo[]; total: number } | null
  /** a tabela da sua divisão (nome · pontos · você), já ordenada */
  tabela: { name: string; pts: number; you: boolean }[]
  jornal: Jornal
  /** 💸 todos os negócios do pregão desta temporada (de todo clube), do maior pro menor */
  mercado: { negocios: { name: string; pos: string; paid: number; team: string; you: boolean }[]; maisCaro: Contratacao | null }
  agenda: CentralAgenda[]
  /** o botão grande do camarote: rótulo, o que faz, e se está travado (e por quê) */
  botao: { label: string; sub?: string; disabled?: boolean; onClick: () => void }
  onTab: (t: 'jogos' | 'tabelas' | 'ranking' | 'elenco' | 'estadio') => void
}

const ARTES = { copaBr: copaBrArt, copaLeg: copaLegArt, liberta: libertaArt, mundo: mundoArt }
const ordinal = (n: number) => getLang() === 'en' ? `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}` : `${n}º`

function Chip({ children, bg = GOLD, cor = INK }: { children: React.ReactNode; bg?: string; cor?: string }) {
  return <span style={{ ...OSW, fontSize: 9, letterSpacing: '.08em', background: bg, color: cor, border: `2px solid ${INK}`, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>{children}</span>
}
function Disco({ nome, size }: { nome: string; size: number }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: '#fff', border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Escudo nome={nome} size={Math.round(size * .72)} /></span>
}
/** 🟢🟡🔴 os últimos 5 resultados em bolinhas (sem letra — a cor conta) */
function Forma({ f }: { f?: string }) {
  const s = (f ?? '').slice(-5)
  if (!s) return <span style={{ fontSize: 9, fontWeight: 800, opacity: .55 }}>—</span>
  return <span>{s.split('').map((c, i) => <i key={i} style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', margin: '0 1.5px', border: `1.5px solid ${INK}`, background: c === 'V' ? '#2FBF5A' : c === 'E' ? GOLD : RED }} />)}</span>
}
function Cabecalho({ titulo, sub, link, onClick }: { titulo: string; sub?: string; link?: string; onClick?: () => void }) {
  return <button type="button" className="ll-central-link" onClick={onClick} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 13px', background: INK, color: '#fff', borderBottom: `3px solid ${INK}`, cursor: onClick ? 'pointer' : 'default' }}>
    <b style={{ ...OSW, fontSize: 15, letterSpacing: '.08em' }}>{titulo}</b>
    <small style={{ fontSize: 9.5, fontWeight: 800, opacity: .75 }}>{sub}{link && <span style={{ color: GOLD }}> {link} ›</span>}</small>
  </button>
}

export function CentralCarreira(p: CentralProps) {
  const t = useT()
  const [mercadoTodo, setMercadoTodo] = useState(false) // 💸 mostra os 5 maiores; o resto abre no toque
  const posDe = (nome: string) => { const i = p.tabela.findIndex(x => x.name === nome); return i >= 0 ? i + 1 : null }
  const ptsDe = (nome: string) => p.tabela.find(x => x.name === nome)?.pts ?? 0
  const lider = p.tabela[0]?.name
  const souCasa = p.proximo?.casa === p.euNome
  const adv = p.proximo ? (souCasa ? p.proximo.fora : p.proximo.casa) : null
  const advPos = adv ? posDe(adv) : null
  const minhaPos = posDe(p.euNome)
  // 🔥 a frase do confronto sai só de posição e pontos — nada inventado
  const frase = (() => {
    if (!p.proximo || !adv || minhaPos == null || advPos == null) return null
    const d = ptsDe(adv) - ptsDe(p.euNome)
    if (advPos === 1 && minhaPos !== 1) return t(`🔥 Você pega o líder · ${d > 0 ? `vencer te deixa a ${Math.max(0, d - 3)} ponto${d - 3 === 1 ? '' : 's'}` : 'e pode assumir a ponta'}`, `🔥 You face the leader · ${d > 0 ? `a win leaves you ${Math.max(0, d - 3)} point${d - 3 === 1 ? '' : 's'} behind` : 'and could take the top spot'}`)
    if (minhaPos === 1) return t(`👑 Você é o líder · ${adv} vem em ${ordinal(advPos)}`, `👑 You lead · ${adv} are ${ordinal(advPos)}`)
    if (Math.abs(advPos - minhaPos) <= 1) return t(`⚔️ Confronto direto: ${ordinal(minhaPos)} × ${ordinal(advPos)}`, `⚔️ Six-pointer: ${ordinal(minhaPos)} v ${ordinal(advPos)}`)
    if (advPos >= p.tabela.length - 3) return t(`🎯 ${adv} luta contra a queda — jogo pra não dar mole`, `🎯 ${adv} are fighting the drop — no slip-ups`)
    return t(`${ordinal(minhaPos)} × ${ordinal(advPos)} · ${d > 0 ? `${d} pontos separam vocês` : d < 0 ? `você tem ${-d} a mais` : 'mesmos pontos'}`, `${ordinal(minhaPos)} v ${ordinal(advPos)} · ${d > 0 ? `${d} points between you` : d < 0 ? `you are ${-d} ahead` : 'level on points'}`)
  })()
  const giroTag = (j: CentralJogo) => {
    const meu = j.hId === p.youId || j.aId === p.youId
    if (meu) {
      const meusG = j.hId === p.youId ? j.hg : j.ag, delesG = j.hId === p.youId ? j.ag : j.hg
      return meusG > delesG ? <Chip bg="#2FBF5A">{t('você venceu', 'you won')}</Chip> : meusG === delesG ? <Chip bg="#fff">{t('você empatou', 'you drew')}</Chip> : <Chip bg={RED} cor="#fff">{t('você perdeu', 'you lost')}</Chip>
    }
    if (j.h === lider || j.a === lider) return <Chip>{t('líder', 'leader')}</Chip>
    if (j.hg + j.ag >= 5) return <Chip bg="#fff">{t('jogaço', 'thriller')}</Chip>
    return <Chip bg="#fff">{t('rodada', 'round')} {p.giro?.rodada}</Chip>
  }
  const lado = (nome: string) => (
    <div style={{ textAlign: 'center', minWidth: 0 }}>
      <Disco nome={nome} size={78} />
      <b style={{ ...OSW, display: 'block', fontSize: 17, marginTop: 8, textShadow: '0 2px 4px #000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</b>
      <small style={{ display: 'block', fontSize: 10, fontWeight: 800, opacity: .85, margin: '2px 0 4px' }}>{posDe(nome) != null ? `${ordinal(posDe(nome)!)} · ${ptsDe(nome)} pts` : '—'}</small>
      <Forma f={p.formas[nome]} />
    </div>
  )
  const en = getLang() === 'en'
  // 📊 celular: 5 linhas (4 de cima + você). 🖥️ desktop: 10 (9 de cima + você) — Diego 03/10:
  // *"dá pra aumentar verticalmente a tabela"*. As linhas extras só existem no monitor.
  const corta = (n: number) => (minhaPos != null && minhaPos > n) ? [...p.tabela.slice(0, n - 1), p.tabela[minhaPos - 1]] : p.tabela.slice(0, n)
  const tabelaCurta = corta(10)
  const noCelular = new Set(corta(5).map(x => x.name))

  return (
    <div className="ll-central">
      <div className="ll-central-topo">
        <div style={{ minWidth: 0 }}>
          <p style={{ ...OSW, fontSize: 10, letterSpacing: '.16em', color: GOLD, margin: 0 }}>{t('Temporada', 'Season')} {p.seasonNo} · {p.divName}</p>
          <h2 style={{ ...OSW, fontSize: 29, lineHeight: .95, margin: 0, whiteSpace: 'nowrap', color: '#fff' }}>📺 Central <span style={{ background: G_OURO, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Legends</span></h2>
        </div>
        <b style={{ ...OSW, fontSize: 20, lineHeight: 1, whiteSpace: 'nowrap', color: '#fff' }}>{t('Rod.', 'Rd.')} {p.round}<span style={{ color: '#888', fontSize: 13 }}> / 38</span></b>
      </div>

      {/* 📱 celular: camarote → giro → Martelo → mercado → tabela+agenda (ordem por CSS `order`).
          🖥️ desktop (03/10, ajuste dele): esquerda camarote → giro → tabela+agenda; direita Martelo → mercado,
          com a divisão do meio reta de cima a baixo. */}
      <div className="ll-central-grid">
        <div className="ll-central-esq">
          {/* 🏟️ O CAMAROTE: próximo jogo + o botão de sempre */}
          <div className="ll-central-card ll-c-hero" style={{ background: `#0a1a12 url(${estadioArt}) center 40% / cover`, position: 'relative', color: '#fff', borderColor: '#847657', minHeight: 372 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#0002 0%,#0001 30%,#0C0C0Cc9 66%,#0C0C0Cf5 100%)' }} />
            <div style={{ position: 'relative', padding: '12px 13px 13px', display: 'flex', flexDirection: 'column', minHeight: 372 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Chip>{p.proximo ? (p.proximo.rolando ? t(`⚽ Rodada ${p.proximo.rodada} rolando`, `⚽ Round ${p.proximo.rodada} live`) : t(`⚽ Próximo jogo · rodada ${p.proximo.rodada}`, `⚽ Next match · round ${p.proximo.rodada}`)) : t('🏁 Liga encerrada', '🏁 League over')}</Chip>
                {p.proximo && <Chip bg="#fff">{souCasa ? t('🏟️ em casa', '🏟️ home') : t('🚌 fora', '🚌 away')}</Chip>}
              </div>
              {p.proximo ? (
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginTop: 14 }}>
                  {lado(p.proximo.casa)}
                  <b style={{ ...OSW, fontSize: 30, color: GOLD, textShadow: '0 2px 4px #000', padding: '0 6px' }}>×</b>
                  {lado(p.proximo.fora)}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginTop: 14 }}>
                  <div><Disco nome={p.euNome} size={78} /><b style={{ ...OSW, display: 'block', fontSize: 17, marginTop: 8, textShadow: '0 2px 4px #000' }}>{p.euNome}</b><small style={{ fontSize: 10, fontWeight: 800, opacity: .85 }}>{minhaPos != null ? `${ordinal(minhaPos)} · ${ptsDe(p.euNome)} pts` : ''}</small></div>
                </div>
              )}
              {frase && <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#FFE79A', margin: '10px 0' }}>{frase}</p>}
              <button type="button" onClick={p.botao.onClick} disabled={p.botao.disabled}
                style={{ ...OSW, width: '100%', background: p.botao.disabled ? '#5a5a5a' : G_OURO, color: p.botao.disabled ? '#ddd' : INK, border: `3px solid ${INK}`, borderRadius: 14, padding: 12, textAlign: 'center', boxShadow: '4px 4px 0 #000', fontSize: 19, letterSpacing: '.04em', cursor: p.botao.disabled ? 'default' : 'pointer', marginTop: frase ? 0 : 10 }}>{p.botao.label}</button>
              {p.botao.sub && <small style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 800, opacity: .6, marginTop: 6 }}>{p.botao.sub}</small>}
            </div>
          </div>

          {/* 📣 O GIRO: só a rodada já revelada */}
          {p.giro && p.giro.jogos.length > 0 && (
            <div className="ll-central-card ll-c-giro" style={{ background: 'linear-gradient(135deg,rgba(10,28,22,.98),rgba(7,19,15,.96))', borderColor: CREME, color: CREME }}>
              <button type="button" className="ll-central-link" onClick={() => p.onTab('jogos')} style={{ width: '100%', background: GOLD, color: INK, padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ ...OSW, fontSize: 13, letterSpacing: '.08em' }}>📣 {t('Giro da rodada', 'Around the round')} {p.giro.rodada}</b>
                <small style={{ fontSize: 9.5, fontWeight: 900 }}>{t('ver jogos', 'see matches')} ›</small>
              </button>
              {p.giro.jogos.map((j, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', alignItems: 'center', gap: 6, padding: '6px 12px', borderBottom: '2px solid #ffffff14', fontSize: 11.5, fontWeight: 800 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}><Escudo nome={j.h} size={18} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.h}</span></span>
                  <b style={{ ...OSW, fontSize: 15, background: CREME, color: INK, borderRadius: 7, padding: '0 8px', letterSpacing: '.06em' }}>{j.hg}<span style={{ color: '#999', fontSize: 11 }}> × </span>{j.ag}</b>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.a}</span><Escudo nome={j.a} size={18} /></span>
                  {giroTag(j)}
                </div>
              ))}
              {p.giro.total > p.giro.jogos.length && <button type="button" className="ll-central-link" onClick={() => p.onTab('jogos')} style={{ width: '100%', padding: '5px 12px', fontSize: 9.5, fontWeight: 800, opacity: .7, textAlign: 'center', color: CREME }}>+ {p.giro.total - p.giro.jogos.length} {t('jogos da rodada', 'more matches')} ›</button>}
            </div>
          )}
          <div className="ll-central-base2 ll-c-base">
            {/* 📊 TABELA resumida → abre Tabelas */}
            <div className="ll-central-card" style={{ background: CREME }}>
              <Cabecalho titulo={t('📊 Tabela', '📊 Table')} sub={p.divName.toLowerCase()} link={t('abrir', 'open')} onClick={() => p.onTab('tabelas')} />
              <button type="button" className="ll-central-link" onClick={() => p.onTab('tabelas')} style={{ width: '100%' }}>
                {tabelaCurta.map(x => { const pos = posDe(x.name) ?? 0; return (
                  <div key={x.name} className={`ll-central-row${noCelular.has(x.name) ? '' : ' ll-central-not-desk'}`} style={{ padding: '6px 9px', gap: 6, fontSize: 11.5, background: x.you ? '#FFF3C4' : undefined, outline: x.you ? `2px solid ${GOLD}` : undefined, outlineOffset: -2 }}>
                    <span style={{ width: 17, color: '#777' }}>{pos}º</span><Escudo nome={x.name} size={18} /><span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.name}</span><b>{x.pts}</b>
                  </div>
                ) })}
              </button>
            </div>
            {/* 🗓️ AGENDA das copas → abre Jogos */}
            <div className="ll-central-card" style={{ background: CREME }}>
              <Cabecalho titulo={t('🗓️ Agenda', '🗓️ Calendar')} link={t('jogos', 'matches')} onClick={() => p.onTab('jogos')} />
              {p.agenda.map((a, i) => (
                <div key={i} className="ll-central-row" style={{ padding: '7px 9px', gap: 8 }}>
                  <span style={{ width: 44, height: 34, flex: 'none', border: `2px solid ${INK}`, borderRadius: 7, background: `url(${ARTES[a.arte]}) center / cover` }} />
                  <span style={{ fontSize: 11, lineHeight: 1.2, minWidth: 0 }}><b style={{ ...OSW, fontSize: 12, display: 'block' }}>{en ? a.titulo[1] : a.titulo[0]}</b><small style={{ color: '#555', fontWeight: 700 }}>{en ? a.sub[1] : a.sub[0]}</small></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ll-central-dir">
          {/* 📰 O MARTELO do meio da temporada */}
          <div className="ll-central-card ll-central-martelo ll-c-martelo" style={{ background: '#FBF5E4', borderRadius: 8 }}>
            <div style={{ padding: '10px 13px 6px', textAlign: 'center', borderBottom: `3px double ${INK}` }}>
              <b style={{ ...OSW, fontSize: 26, letterSpacing: 2 }}>O Martelo</b>
              <small style={{ display: 'block', fontSize: 8.5, fontWeight: 800, letterSpacing: 1.4, color: '#6c604a', textTransform: 'uppercase' }}>{p.round > 0 ? t(`Edição da rodada ${p.round}`, `Round ${p.round} edition`) : t('Edição de pré-temporada', 'Pre-season edition')} · {t('Temporada', 'Season')} {p.seasonNo} · {p.divName}</small>
            </div>
            <div style={{ height: 150, background: `url(${tacaArt}) center 30% / cover`, position: 'relative', borderBottom: `3px solid ${INK}` }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#0000 40%,#000c)' }} />
              <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10, color: '#fff' }}>
                <b style={{ ...OSW, fontSize: 22, lineHeight: 1, display: 'block', textShadow: '0 2px 4px #000' }}>{p.jornal.manchete ? (en ? p.jornal.manchete.en : p.jornal.manchete.pt) : t(`A temporada ${p.seasonNo} começa: a bola vai rolar na ${p.divName}`, `Season ${p.seasonNo} kicks off in ${p.divName}`)}</b>
              </div>
            </div>
            {p.jornal.manchete && (p.jornal.manchete.sub[0] || p.jornal.manchete.sub[1]) && <p style={{ padding: '8px 13px 6px', font: 'italic 12px Georgia, serif', color: '#444', borderBottom: '2px solid rgba(0,0,0,.1)', margin: 0 }}>{en ? p.jornal.manchete.sub[1] : p.jornal.manchete.sub[0]} — <i>{t('Redação', 'Newsroom')}</i></p>}
            {p.jornal.noticias.map((n, i) => (
              <div key={i} className={`ll-central-row${i >= 5 ? ' ll-central-not-desk' : ''}`}>
                <span style={{ fontSize: 16 }}>{n.emoji}</span>
                <span style={{ flex: 1, lineHeight: 1.3 }}>{en ? n.en : n.pt}</span>
                <Chip bg="#fff">{en ? n.tag[1] : n.tag[0]}</Chip>
              </div>
            ))}
            {!p.jornal.noticias.length && <p style={{ padding: '10px 13px', font: 'italic 12px Georgia, serif', color: '#555', margin: 0 }}>{t('As notícias começam a sair depois da 1ª rodada.', 'The news starts after round 1.')}</p>}
            <button type="button" className="ll-central-link" onClick={() => p.onTab('ranking')} style={{ width: '100%', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#666', background: '#fff', padding: 7 }}>{t('ver artilharia e rank', 'see top scorers and rank')} ›</button>
          </div>
          {/* 💸 MERCADO: a sala de leilão */}
          <div className="ll-central-card ll-c-mercado" style={{ background: `#1a120a url(${leilaoArt}) 85% center / cover`, color: CREME, borderColor: '#847657' }}>
            <div style={{ background: 'linear-gradient(90deg,#0C0C0Cf2 45%,#0C0C0C8c)' }}>
              <Cabecalho titulo={t('💸 Mercado', '💸 Market')} sub={t('o que rolou nos leilões', 'auction business')} link={t('extrato', 'ledger')} onClick={() => p.onTab('estadio')} />
              {(mercadoTodo ? p.mercado.negocios : p.mercado.negocios.slice(0, 5)).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 13px', borderBottom: '2px solid #ffffff14' }}>
                <Escudo nome={c.team} size={26} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800 }}><b style={{ ...OSW, fontSize: 15 }}>{c.name}</b> <small style={{ opacity: .6, fontSize: 10 }}>{c.pos}</small><br /><span style={{ fontSize: 11, opacity: .85 }}>→ {c.team}</span> {c.you ? <Chip>{t('você', 'you')}</Chip> : i === 0 && !mercadoTodo ? <Chip bg={RED} cor="#fff">{t('maior lance', 'biggest bid')}</Chip> : null}</span>
                <b style={{ ...OSW, fontSize: 18, color: GOLD }}>🪙 {c.paid}</b>
              </div>
            ))}
            {p.mercado.negocios.length > 5 && <button type="button" className="ll-central-link" onClick={() => setMercadoTodo(v => !v)} style={{ width: '100%', padding: '7px 13px', fontSize: 10, fontWeight: 900, color: GOLD, textAlign: 'center' }}>{mercadoTodo ? t('mostrar só os 5 maiores', 'show only the top 5') : t(`ver os ${p.mercado.negocios.length} negócios do pregão`, `see all ${p.mercado.negocios.length} deals`)} ›</button>}
            {!p.mercado.negocios.length && p.mercado.maisCaro && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 13px', borderBottom: '2px solid #ffffff14' }}>
                <Escudo nome={p.mercado.maisCaro.teamName} size={26} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800 }}><b style={{ ...OSW, fontSize: 15 }}>{p.mercado.maisCaro.name}</b><br /><span style={{ fontSize: 11, opacity: .85 }}>{p.mercado.maisCaro.teamName}</span> <Chip bg={RED} cor="#fff">{t('mais caro da divisão', 'priciest in the division')}</Chip></span>
                <b style={{ ...OSW, fontSize: 18, color: GOLD }}>🪙 {p.mercado.maisCaro.paid}</b>
              </div>
            )}
            {!p.mercado.negocios.length && !p.mercado.maisCaro && <p style={{ padding: '10px 13px', fontSize: 11, fontWeight: 700, opacity: .75, margin: 0 }}>{t('Sem negócios registrados nesta temporada.', 'No deals on record this season.')}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
