// ─── 🎨 TEMA DO CLUBE NA SALA DE ESPERA (18/10) ─────────────────────────────────────────────────────────────────────
// Ideia do Diego: tema de sala pra vender. Ele recusou o tema genérico pro clube dele (*"algo personalizado pra ele"*)
// e aprovou o TEMA DO CLUBE (mockups `scripts/mockups/tema-neymarzetti.png` e `tema-k9.png`): escudo gigante de fundo, a
// mascote na tela, as 2 cores do manto e um enfeite que é a cara do clube. *"Pode fazer pro Neymarzetti já com dois temas"*.
//
// · Muda SÓ o visual da sala de espera (fundo, caixas, botão, selo embaixo). Regras e jogo, nada.
// · Quem escolhe é o DONO da sala, e só entre os temas da CONTA dele (`TEMAS_DA_CONTA`, pelo e-mail do batismo — regra
//   28/09). Fica gravado em `game_state.tema`; os convidados recebem por um aviso único no canal (nada periódico).
// · Arte = os .webp do batismo que já existem (0 KB novo); morcego/lua/neve são CSS.
import { useEffect, useState, type CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { ESCUDOS_OFICIAIS } from './escudos-oficiais'
import { SELOS } from './selos-clubes'
import neymarzettiEscudo from './img/neymarzetti-escudo.webp'
import neymarzettiMascote from './img/neymarzetti-mascote.webp'
import k9Escudo from './img/k9-escudo.webp'
import k9Mascote from './img/k9-mascote.webp'
import { tr } from './lang'
import './temas-sala.css'

export type TemaClubeId = 'neymarzetti_noite' | 'neymarzetti_branco' | 'k9_gelo' | 'k9_branco'
/** tema de clube batizado (id fixo) ou de TIME DE CORAÇÃO (`c:<slug>` — o slug é o nome do arquivo do escudo oficial) */
export type TemaSalaId = TemaClubeId | `c:${string}`
type Tema = {
  id: TemaSalaId; coracao?: { c1: string; c2: string; nome: string; listra?: string; bandeira?: string }; nome: string; nomeEn: string; selo: string
  escudo: string; mascote: string | null; claro: boolean
  botao: string; botaoTxt: string // o "Abrir o pregão"
  enfeite: 'morcegos' | 'neve' | 'nenhum'
  seloBg?: string; seloBorda?: string
}
const GELO = 'linear-gradient(135deg,#ffffff 0%,#bfe6ff 35%,#ffffff 55%,#8fd0ff 80%,#e8f6ff 100%)'
const CROMO = 'linear-gradient(135deg,#f5f5f5 0%,#9a9a9a 22%,#ffffff 45%,#6e6e6e 70%,#e6e6e6 100%)'
export const TEMAS_SALA: Record<TemaClubeId, Tema> = {
  neymarzetti_noite: { id: 'neymarzetti_noite', nome: '🦇 Noite do Morcego', nomeEn: '🦇 Bat Night', selo: '🦇 TEMA DO CLUBE · NEYMARZETTI', escudo: neymarzettiEscudo, mascote: neymarzettiMascote, claro: false, botao: CROMO, botaoTxt: '#0c0c0c', enfeite: 'morcegos' },
  neymarzetti_branco: { id: 'neymarzetti_branco', nome: '⚪ Manto Branco', nomeEn: '⚪ White Kit', selo: '🦇 TEMA DO CLUBE · NEYMARZETTI', escudo: neymarzettiEscudo, mascote: neymarzettiMascote, claro: true, botao: CROMO, botaoTxt: '#0c0c0c', enfeite: 'nenhum' },
  // 👑🧊 K9 FC (18/10, mockup `tema-k9.png`): a coroa com gelo do escudo, o Rei K9 com as taças, branco e azul royal
  k9_gelo: { id: 'k9_gelo', nome: '🧊 Reino de Gelo', nomeEn: '🧊 Ice Kingdom', selo: '👑🧊 TEMA DO CLUBE · K9 FC', escudo: k9Escudo, mascote: k9Mascote, claro: false, botao: GELO, botaoTxt: '#0723B4', enfeite: 'neve', seloBg: '#0723B4', seloBorda: '#FFC400' },
  k9_branco: { id: 'k9_branco', nome: '👑 Rei de Branco', nomeEn: '👑 King in White', selo: '👑🧊 TEMA DO CLUBE · K9 FC', escudo: k9Escudo, mascote: k9Mascote, claro: true, botao: GELO, botaoTxt: '#0723B4', enfeite: 'neve', seloBg: '#0723B4', seloBorda: '#FFC400' },
}
// 📧 de quem é cada tema (o e-mail do batismo manda — regra 28/09)
const TEMAS_DA_CONTA: Record<string, TemaClubeId[]> = {
  'diego.c.fonseca@gmail.com': ['neymarzetti_noite', 'neymarzetti_branco'],
  'kelvinoliveiraandradeenunes@gmail.com': ['k9_gelo', 'k9_branco'], // 👑 K9 FC (pedido do Diego 18/10)
}
// 🛡️ tema do CLUBE batizado comprado na Loja (`esc_temas_conta`, tipo clube) → os temas montados pra esse clube
const TEMAS_POR_CLUBE: Record<string, TemaClubeId[]> = {
  'Neymarzetti': ['neymarzetti_noite', 'neymarzetti_branco'],
  'K9 FC': ['k9_gelo', 'k9_branco'],
}

// ❤️ TIME DE CORAÇÃO (18/10, Diego: *"pode pôr escudo oficial sim"*): todo clube que tem escudo oficial no jogo (os do Leilão
// de Clubes, `escudos-oficiais.ts`) vira tema — as cores vêm do selo dele (`selos-clubes.ts`). Arte: 0 KB novo.
export type ClubeCoracaoTema = { slug: string; nome: string; src: string; c1: string; c2: string; listra?: string; listraMini?: string }
// 🎽 camisa com listra própria. Santa Cruz (18/10, pedido de torcedor via Diego): *"não gosta que a cor vermelha encoste na
// preta… sempre vermelho e preto com listras brancas"* — faixa vermelha e preta largas, filete BRANCO entre elas.
const LISTRA_ESPECIAL: Record<string, { listra: string; listraMini: string; bandeira: string }> = {
  'santa-cruz': {
    listra: 'repeating-linear-gradient(180deg,#C8102E 0 40px,#F2F2F2 40px 46px,#111 46px 86px,#F2F2F2 86px 92px)',
    listraMini: 'repeating-linear-gradient(160deg,#C8102E 0 9px,#F2F2F2 9px 11px,#111 11px 20px,#F2F2F2 20px 22px)',
    bandeira: 'linear-gradient(180deg,#C8102E 0 44%,#F2F2F2 44% 56%,#111 56% 100%)',
  },
}
export const CLUBES_TEMA_CORACAO: ClubeCoracaoTema[] = Object.entries(ESCUDOS_OFICIAIS)
  .map(([nome, e]) => {
    const slug = e.src.replace(/^.*\//, '').replace(/\.webp$/, '')
    const sl = SELOS[nome]
    const esp = LISTRA_ESPECIAL[slug]
    return { slug, nome: sl?.nome ?? nome, src: e.src, c1: sl?.c1 ?? '#0C0C0C', c2: sl?.c2 ?? '#FFFFFF', ...(esp ? { listra: esp.listra, listraMini: esp.listraMini } : {}) }
  })
  .filter(c => /^[a-z0-9-]{2,20}$/.test(c.slug))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
const CORACAO_POR_SLUG = new Map(CLUBES_TEMA_CORACAO.map(c => [c.slug, c]))
// texto do botão legível em cima da cor do clube (clube de camisa branca/clara ganha letra preta)
const claraDemais = (hex: string) => { const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 170 }
function temaCoracao(slug: string): Tema | null {
  const c = CORACAO_POR_SLUG.get(slug); if (!c) return null
  // a cor do botão é a mais VIVA do time (Santa Cruz: o vermelho, não o preto); se nenhuma é viva, a que não é clara demais
  const sat = (hex: string) => { const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx }
  const corForte = sat(c.c2) > sat(c.c1) + .25 ? c.c2 : claraDemais(c.c1) ? c.c2 : c.c1
  return {
    id: `c:${slug}`, coracao: { c1: c.c1, c2: c.c2, nome: c.nome, listra: c.listra, bandeira: LISTRA_ESPECIAL[slug]?.bandeira }, nome: `❤️ ${c.nome}`, nomeEn: `❤️ ${c.nome}`,
    selo: `❤️ TIME DO CORAÇÃO · ${c.nome.toUpperCase()}`, escudo: import.meta.env.BASE_URL + c.src, mascote: null, claro: false,
    botao: corForte, botaoTxt: claraDemais(corForte) ? '#0c0c0c' : '#fff', enfeite: 'nenhum', seloBg: '#0c0c0c', seloBorda: corForte,
  }
}

// 🎟️ os temas que ESTA conta pode usar: os de código (donos de batismo de antes da Loja) + os comprados/dados no banco
let meusTemasCache: { tipo: string; alvo: string; status: string }[] | null = null
let meusTemasEmail = ''
const ouvintesTemas = new Set<() => void>()
export function releMeusTemas(email?: string | null) {
  meusTemasEmail = (email ?? '').toLowerCase()
  supabase.rpc('esc_meus_temas').then(({ data }) => { meusTemasCache = (data ?? []) as typeof meusTemasCache; ouvintesTemas.forEach(f => f()) }, () => {})
}
export function useTemasDaConta(email: string | null | undefined): TemaSalaId[] {
  const [, bump] = useState(0)
  const em = (email ?? '').toLowerCase()
  useEffect(() => {
    const f = () => bump(n => n + 1); ouvintesTemas.add(f)
    if (em && (meusTemasCache === null || meusTemasEmail !== em)) releMeusTemas(em)
    return () => { ouvintesTemas.delete(f) }
  }, [em])
  if (!em) return []
  const ids: TemaSalaId[] = [...(TEMAS_DA_CONTA[em] ?? [])]
  for (const t of (meusTemasEmail === em ? meusTemasCache ?? [] : [])) {
    if (t.status !== 'ativo') continue
    if (t.tipo === 'coracao' && CORACAO_POR_SLUG.has(t.alvo)) ids.push(`c:${t.alvo}`)
    if (t.tipo === 'clube') ids.push(...(TEMAS_POR_CLUBE[t.alvo] ?? []))
  }
  return [...new Set(ids)]
}
/** os temas de clube da conta pelo código (sem banco) — usado onde não dá pra esperar a leitura */
export function temasDaConta(email: string | null | undefined): TemaSalaId[] {
  return email ? TEMAS_DA_CONTA[email.toLowerCase()] ?? [] : []
}
export function temaValido(id: unknown): Tema | null {
  if (typeof id !== 'string') return null
  if (id.startsWith('c:')) return temaCoracao(id.slice(2))
  return id in TEMAS_SALA ? TEMAS_SALA[id as TemaClubeId] : null
}
export const nomeTema = (t: Tema) => tr(t.nome, t.nomeEn)

/** a camada de fundo do tema: escudo gigante, enfeites, mascote e o selo — atrás do conteúdo, sem pegar clique */
export function TemaFundo({ tema }: { tema: Tema }) {
  return (
    <div className={`tema-fundo ${tema.claro ? 'tema-claro' : 'tema-escuro'}`} aria-hidden>
      {tema.coracao && <>
        <span className="tema-listras" style={{ background: tema.coracao.listra ?? `repeating-linear-gradient(180deg,${tema.coracao.c1} 0 46px,${tema.coracao.c2} 46px 92px)` }} />
        <span className="tema-sombra" />
      </>}
      <img src={tema.escudo} className={tema.coracao ? 'tema-marca tema-marca-cor' : 'tema-marca'} alt="" />
      {tema.enfeite === 'morcegos' && <>
        <span className="tema-lua" />
        {[[6, 14, 26, 0], [78, 9, 18, 1.6], [86, 34, 22, 3.1], [4, 46, 16, 2.2], [52, 5, 14, .8], [70, 58, 17, 4]].map(([x, y, s, d], i) =>
          <span key={i} className="tema-morcego" style={{ left: `${x}%`, top: `${y}%`, fontSize: s, animationDelay: `${d}s` } as CSSProperties}>🦇</span>)}
      </>}
      {tema.enfeite === 'neve' && <>
        {Array.from({ length: 22 }, (_, i) => <span key={i} className="tema-floco" style={{ left: `${(i * 37) % 100}%`, fontSize: 9 + (i * 7) % 9, animationDuration: `${7 + (i * 3) % 6}s`, animationDelay: `${-((i * 5) % 9)}s` } as CSSProperties}>❄</span>)}
        <span className="tema-cristais" />
      </>}
      {tema.coracao && <>
        <span className="tema-torcida" />
        {[4, 17, 30, 43, 56, 69, 82, 93].map((x, i) => <span key={i} className="tema-bandeira" style={{ left: `${x}%`, bottom: 70 + (i * 13) % 40, transform: `rotate(${((i * 7) % 24) - 12}deg)`, background: tema.coracao!.bandeira ?? `linear-gradient(180deg,${tema.coracao!.c1} 0 50%,${tema.coracao!.c2} 50% 100%)` }} />)}
      </>}
      {tema.mascote && <img src={tema.mascote} className="tema-mascote" alt="" />}
      <span className="tema-selo" style={tema.seloBg ? { background: tema.seloBg, borderColor: tema.seloBorda } : undefined}>{tema.selo}</span>
    </div>
  )
}
