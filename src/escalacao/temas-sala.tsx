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
import arrudaEscudo from './img/arruda-escudo.webp'
import arrudaMascote from './img/arruda-mascote.webp'
import fabulousEscudo from './img/fabulous-escudo.webp'
import fabulousMascote from './img/fabulous-mascote.webp'
import gavioesEscudo from './img/gavioes-escudo.webp'
import gavioesMascote from './img/gavioes-mascote.webp'
import cuiudosEscudo from './img/cuiudos-escudo.webp'
import cuiudosMascote from './img/cuiudos-mascote.webp'
import sevenEscudo from './img/sevencity-escudo-v2.webp'
import sevenMascote from './img/sevencity-mascote-v2.webp'
import futpointEscudo from './img/futpoint-escudo.webp'
import futpointMascote from './img/futpoint-mascote.webp'
import wenMilanEscudo from './img/wenmilan-escudo.webp'
import wenMilanMascote from './img/wenmilan-mascote.webp'
import { tr } from './lang'
import './temas-sala.css'

export type TemaClubeId = 'neymarzetti_noite' | 'neymarzetti_branco' | 'k9_gelo' | 'k9_branco'
  | 'arruda' | 'fabulous' | 'gavioes' | 'cuiudos' | 'seven' | 'futpoint' | 'wenmilan'
/** tema de clube batizado (id fixo) ou de TIME DE CORAÇÃO (`c:<slug>` — o slug é o nome do arquivo do escudo oficial) */
export type TemaSalaId = TemaClubeId | `c:${string}`
type Tema = {
  id: TemaSalaId; coracao?: { c1: string; c2: string; nome: string; listra?: string; bandeira?: string }; nome: string; nomeEn: string; selo: string
  escudo: string; mascote: string | null; claro: boolean
  botao: string; botaoTxt: string // o "Abrir o pregão"
  enfeite: 'morcegos' | 'neve' | 'nenhum'
  seloBg?: string; seloBorda?: string
  faixa?: [string, string] // 🔴 [pt, en] — recado fixo do dono na sala (Futpoint: o horário das lives)
  pano?: string // 🎨 fundo pintado pelo próprio tema (tema de Fundador: as cores do manto), por cima do fundo da sala
}
// 🖋 TEMA DO FUNDADOR (18/10, Diego: *"o fundador ganha apenas o de mascote… e ganha apenas um… eles ganham apenas um tema
// com uma cor"*). UMA versão por clube, montada com o que o batismo já tem: as 2 cores do manto (as MEDIDAS, as mesmas de
// `batismos.ts`), o escudo de fundo e a mascote na tela. O botão leva a cor mais viva do clube. Arte: 0 KB novo.
function temaFundador(id: TemaClubeId, clube: string, emoji: string, escudo: string, mascote: string, brilho: string, listra: string, botao: string, botaoTxt: string): Tema {
  return {
    id, nome: `${emoji} ${clube}`, nomeEn: `${emoji} ${clube}`, selo: `${emoji} TEMA DO CLUBE · ${clube.toUpperCase()}`, escudo, mascote, claro: false,
    botao, botaoTxt, enfeite: 'nenhum', seloBg: '#0c0c0c', seloBorda: botao.startsWith('#') ? botao : '#bdbdbd',
    pano: `repeating-linear-gradient(135deg,${listra} 0 2px,transparent 2px 64px),radial-gradient(ellipse at 50% 10%,${brilho} 0%,#0a0a0a 72%)`,
  }
}
function TEMAS_FUNDADOR_PRONTOS() {
  return {
    // 🐍 o Arruda é casa do Santa Cruz: preto, branco e o vermelho — o filete branco separa o vermelho do preto
    arruda: temaFundador('arruda', 'Tricolor do Arruda FC', '🐍', arrudaEscudo, arrudaMascote, '#7a1420', 'rgba(245,242,239,.16)', '#C8102E', '#fff'),
    fabulous: temaFundador('fabulous', 'Fabulous EC', '🦅', fabulousEscudo, fabulousMascote, '#7d0a10', 'rgba(206,14,23,.22)', '#CE0E17', '#fff'),
    gavioes: temaFundador('gavioes', 'Gaviões SCCP', '🦅', gavioesEscudo, gavioesMascote, '#4a4a4a', 'rgba(249,248,248,.12)', CROMO, '#0c0c0c'),
    cuiudos: temaFundador('cuiudos', 'Cuiudos FC', '🤠', cuiudosEscudo, cuiudosMascote, '#0b46c4', 'rgba(231,172,11,.2)', '#E7AC0B', '#0c0c0c'),
    // 📍 Futpoint FC (18/10): preto e dourado do manto, o Pontinho na tela e o horário das lives dele (é streamer do jogo)
    futpoint: { ...temaFundador('futpoint', 'Futpoint FC', '📍', futpointEscudo, futpointMascote, '#5a4318', 'rgba(184,144,64,.2)', '#B89040', '#0c0c0c'), faixa: ['LIVES TODO DIA · 18H E 21H', 'LIVE EVERY DAY · 6PM & 9PM (BRT)'] },
    wenmilan: temaFundador('wenmilan', 'Wen Milan B', '😈', wenMilanEscudo, wenMilanMascote, '#8a0a16', 'rgba(223,18,36,.22)', '#DF1224', '#fff'),
    seven: temaFundador('seven', 'Seven City', '🍀', sevenEscudo, sevenMascote, '#6b4c1c', 'rgba(217,158,68,.2)', '#D99E44', '#0c0c0c'),
  } satisfies Partial<Record<TemaClubeId, Tema>>
}
const GELO = 'linear-gradient(135deg,#ffffff 0%,#bfe6ff 35%,#ffffff 55%,#8fd0ff 80%,#e8f6ff 100%)'
const CROMO = 'linear-gradient(135deg,#f5f5f5 0%,#9a9a9a 22%,#ffffff 45%,#6e6e6e 70%,#e6e6e6 100%)'
export const TEMAS_SALA: Record<TemaClubeId, Tema> = {
  neymarzetti_noite: { id: 'neymarzetti_noite', nome: '🦇 Noite do Morcego', nomeEn: '🦇 Bat Night', selo: '🦇 TEMA DO CLUBE · NEYMARZETTI', escudo: neymarzettiEscudo, mascote: neymarzettiMascote, claro: false, botao: CROMO, botaoTxt: '#0c0c0c', enfeite: 'morcegos' },
  neymarzetti_branco: { id: 'neymarzetti_branco', nome: '⚪ Manto Branco', nomeEn: '⚪ White Kit', selo: '🦇 TEMA DO CLUBE · NEYMARZETTI', escudo: neymarzettiEscudo, mascote: neymarzettiMascote, claro: true, botao: CROMO, botaoTxt: '#0c0c0c', enfeite: 'nenhum' },
  // 👑🧊 K9 FC (18/10, mockup `tema-k9.png`): a coroa com gelo do escudo, o Rei K9 com as taças, branco e azul royal
  k9_gelo: { id: 'k9_gelo', nome: '🧊 Reino de Gelo', nomeEn: '🧊 Ice Kingdom', selo: '👑🧊 TEMA DO CLUBE · K9 FC', escudo: k9Escudo, mascote: k9Mascote, claro: false, botao: GELO, botaoTxt: '#0723B4', enfeite: 'neve', seloBg: '#0723B4', seloBorda: '#FFC400' },
  ...TEMAS_FUNDADOR_PRONTOS(),
  k9_branco: { id: 'k9_branco', nome: '👑 Rei de Branco', nomeEn: '👑 King in White', selo: '👑🧊 TEMA DO CLUBE · K9 FC', escudo: k9Escudo, mascote: k9Mascote, claro: true, botao: GELO, botaoTxt: '#0723B4', enfeite: 'neve', seloBg: '#0723B4', seloBorda: '#FFC400' },
}
// 📧 de quem é cada tema (o e-mail do batismo manda — regra 28/09)
const TEMAS_DA_CONTA: Record<string, TemaClubeId[]> = {
  'diego.c.fonseca@gmail.com': ['neymarzetti_noite', 'neymarzetti_branco'],
  'kelvinoliveiraandradeenunes@gmail.com': ['k9_gelo', 'k9_branco'], // 👑 K9 FC (pedido do Diego 18/10)
  // 🖋 Fundadores (18/10): o tema do clube já vem no plano, UM só
  'souzact12@gmail.com': ['arruda'],
  'koeppfabio@gmail.com': ['fabulous'],
  'kauealves584@gmail.com': ['gavioes'],
  'matheussoaresg2018@gmail.com': ['cuiudos'],
  'glaucomiranda@outlook.com': ['seven'],
  'gfpicolo13@gmail.com': ['futpoint'], // 📍 virou Fundador em 18/10
  'vittor@tidex.com.br': ['wenmilan'], // 😈 Wen Milan B (conta criada em 19/10)
}
// 🛡️ tema do CLUBE batizado comprado na Loja (`esc_temas_conta`, tipo clube) → os temas montados pra esse clube
const TEMAS_POR_CLUBE: Record<string, TemaClubeId[]> = {
  'Neymarzetti': ['neymarzetti_noite', 'neymarzetti_branco'],
  'K9 FC': ['k9_gelo', 'k9_branco'],
  'Tricolor do Arruda FC': ['arruda'], 'Fabulous EC': ['fabulous'], 'Gaviões SCCP': ['gavioes'], 'Cuiudos FC': ['cuiudos'], 'Seven City': ['seven'], 'Futpoint FC': ['futpoint'], 'Wen Milan B': ['wenmilan'],
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
      {tema.pano && <span className="tema-pano" style={{ background: tema.pano }} />}
      {tema.coracao && <>
        <span className="tema-listras" style={{ background: tema.coracao.listra ?? `repeating-linear-gradient(180deg,${tema.coracao.c1} 0 46px,${tema.coracao.c2} 46px 92px)` }} />
        <span className="tema-sombra" />
      </>}
      <img src={tema.escudo} className={tema.coracao ? 'tema-marca tema-marca-cor' : tema.pano ? 'tema-marca tema-marca-clube' : 'tema-marca'} alt="" />
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
      {tema.faixa && <span className="tema-faixa"><i />{tr(...tema.faixa)}</span>}
      <span className="tema-selo" style={tema.seloBg ? { background: tema.seloBg, borderColor: tema.seloBorda } : undefined}>{tema.selo}</span>
    </div>
  )
}
