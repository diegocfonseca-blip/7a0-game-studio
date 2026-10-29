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
import dsouzaEscudo from './img/dsouza-escudo.webp' // 🐶💚 dSouza FC (28/10): o mesmo escudo do batismo, 0 KB novo
import dsouzaMascote from './img/dsouza-mascote.webp'
import interValeEscudo from './img/intervale-escudo.webp'
import interValeMascote from './img/intervale-mascote.webp'
import guimaraesEscudo from './img/guimaraes-escudo.webp'
import guimaraesMascote from './img/guimaraes-mascote.webp'
import lulubabaEscudo from './img/lulubaba-escudo.webp' // 🧤🖤 Lulubaba FC (Fundador, 29/10): os mesmos do batismo, 0 KB novo
import lulubabaMascote from './img/lulubaba-mascote.webp'
import piranhaoEscudo from './img/piranhao-escudo.webp' // 🐟🏛️ Piranhão FC (Fundador, 29/10)
import piranhaoMascote from './img/piranhao-mascote.webp'
import neymarfcEscudo from './img/neymarfc-escudo.webp' // 🐐👑 Neymar_FC (Fundador, 29/10)
import neymarfcMascote from './img/neymarfc-mascote.webp'
import tidexLogo from './img/patro-tidex.webp' // 🤖 tema da Tidex (19/10): o mesmo logo do patrocínio, 0 KB novo
import { tr } from './lang'
import './temas-sala.css'

export type TemaClubeId = 'neymarzetti_noite' | 'neymarzetti_branco' | 'k9_gelo' | 'k9_branco'
  | 'arruda' | 'fabulous' | 'gavioes' | 'cuiudos' | 'seven' | 'futpoint' | 'wenmilan' | 'tidex' | 'intervale' | 'guimaraes' | 'dsouza' | 'dsouza_emp' | 'lulubaba' | 'piranhao' | 'neymarfc'
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
    // 🥊⚫⚪ Inter Vale FC (21/10, virou Fundador): preto e branco medidos na camisa dele, o filete branco das cordas do ringue
    intervale: temaFundador('intervale', 'Inter Vale FC', '🥊', interValeEscudo, interValeMascote, '#3a3a3a', 'rgba(228,227,225,.14)', '#E4E3E1', '#0c0c0c'),
    // 🌪️🔴⚪ Guimarães SCI (23/10, virou Fundador): vermelho e branco do manto (os medidos, #C50208/#FEFBFC), o filete branco e o Saci na tela
    guimaraes: temaFundador('guimaraes', 'Guimarães SCI', '🌪️', guimaraesEscudo, guimaraesMascote, '#8a0206', 'rgba(254,251,252,.16)', '#C50208', '#fff'),
    // 🐶💚 dSouza FC (28/10, batismo Fundador): preto e verde-neon medidos na camisa (#0A0A09/#73E541), o filete neon e o Pitbull na tela
    dsouza: { ...temaFundador('dsouza', 'dSouza FC', '🐶', dsouzaEscudo, dsouzaMascote, '#1f5a12', 'rgba(115,229,65,.18)', '#73E541', '#0A0A09'), selo: '🐶 TEMA DO CLUBE · dSouza FC' }, // selo sem caixa-alta: o nome é dSouza, com d minúsculo
    // 🧤🖤 / 🐟🏛️ / 🐐👑 os três Fundadores de 29/10 (Diego: *"eles têm que ter o do mascote"*): o tema de mascote do plano, nas 2 cores
    // MEDIDAS do manto de cada um (as mesmas de `batismos.ts`), o escudo de fundo e a mascote na tela
    lulubaba: temaFundador('lulubaba', 'Lulubaba FC', '🧤', lulubabaEscudo, lulubabaMascote, '#3a3a3a', 'rgba(227,226,226,.14)', '#E3E2E2', '#0c0c0c'),
    piranhao: temaFundador('piranhao', 'Piranhão FC', '🐟', piranhaoEscudo, piranhaoMascote, '#3a3a3a', 'rgba(226,225,225,.14)', '#E2E1E1', '#0c0c0c'),
    neymarfc: { ...temaFundador('neymarfc', 'Neymar_FC', '🐐', neymarfcEscudo, neymarfcMascote, '#6b5534', 'rgba(242,216,184,.18)', '#F2D8B8', '#0c0c0c'), selo: '🐐 TEMA DO CLUBE · Neymar_FC' },
    wenmilan: temaFundador('wenmilan', 'Wen Milan B', '😈', wenMilanEscudo, wenMilanMascote, '#8a0a16', 'rgba(223,18,36,.22)', '#DF1224', '#fff'),
    seven: temaFundador('seven', 'Seven City', '🍀', sevenEscudo, sevenMascote, '#6b4c1c', 'rgba(217,158,68,.2)', '#D99E44', '#0c0c0c'),
  } satisfies Partial<Record<TemaClubeId, Tema>>
}
const GELO = 'linear-gradient(135deg,#ffffff 0%,#bfe6ff 35%,#ffffff 55%,#8fd0ff 80%,#e8f6ff 100%)'
const CROMO = 'linear-gradient(135deg,#f5f5f5 0%,#9a9a9a 22%,#ffffff 45%,#6e6e6e 70%,#e6e6e6 100%)'
export const TEMAS_SALA: Record<TemaClubeId, Tema> = {
  // 🤖 TIDEX (19/10, Diego: "ele é dono da empresa Tidex, que patrocina nosso jogo… faz um tema da Tidex pra ele usar nas salas").
  // Tema de MARCA, não de clube: o azul-marinho e o turquesa do logo deles, a grade de "IA" ao fundo e o logo grande; sem mascote.
  tidex: {
    id: 'tidex', nome: '🤖 Tidex', nomeEn: '🤖 Tidex', selo: '🤖 TEMA · TIDEX', escudo: tidexLogo, mascote: null, claro: false,
    botao: 'linear-gradient(135deg,#7FF3F7 0%,#22CDD5 45%,#0FA3AB 100%)', botaoTxt: '#0B1220', enfeite: 'nenhum', seloBg: '#0B1220', seloBorda: '#22CDD5',
    faixa: ['TIDEX · SUA MARCA DENTRO DAS IAs', 'TIDEX · YOUR BRAND INSIDE AI'],
    pano: 'repeating-linear-gradient(0deg,rgba(34,205,213,.07) 0 1px,transparent 1px 44px),repeating-linear-gradient(90deg,rgba(34,205,213,.07) 0 1px,transparent 1px 44px),radial-gradient(ellipse at 50% 0%,rgba(34,205,213,.35) 0%,transparent 55%),radial-gradient(ellipse at 50% 100%,rgba(34,205,213,.18) 0%,transparent 60%),#0B1220',
  },
  // 🖼️ dSOUZA EMPREENDIMENTOS (28/10, Diego: *"tema da empresa dele… a dSouza empreendimentos q anunciou hj no nosso jogo"*).
  // Tema de MARCA (como o da Tidex), não de clube: parede de galeria com molduras, o verde-neon da marca, o escudo-logo grande e o
  // recado da loja na faixa (o mesmo do Anúncio do dia). Sem mascote — a mascote fica no tema do clube.
  dsouza_emp: {
    id: 'dsouza_emp', nome: '🖼️ dSouza Empreendimentos', nomeEn: '🖼️ dSouza Empreendimentos', selo: '🖼️ TEMA · dSOUZA EMPREENDIMENTOS', escudo: dsouzaEscudo, mascote: null, claro: false,
    botao: 'linear-gradient(135deg,#B8FF8F 0%,#73E541 45%,#3E9E1C 100%)', botaoTxt: '#0A0A09', enfeite: 'nenhum', seloBg: '#0A0A09', seloBorda: '#73E541',
    faixa: ['dSOUZA · QUADROS DO SEU TIME PRA DECORAR A PAREDE · FRETE GRÁTIS', 'dSOUZA · FRAMES OF YOUR CLUB FOR YOUR WALL · FREE SHIPPING'],
    pano: 'linear-gradient(rgba(10,10,9,.55),rgba(10,10,9,.55)),repeating-linear-gradient(90deg,transparent 0 22px,rgba(115,229,65,.12) 22px 26px,transparent 26px 120px),repeating-linear-gradient(0deg,transparent 0 30px,rgba(115,229,65,.12) 30px 34px,transparent 34px 150px),radial-gradient(ellipse at 50% 0%,rgba(115,229,65,.35) 0%,transparent 55%),radial-gradient(ellipse at 50% 100%,#14240f 0%,#0A0A09 70%)',
  },
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
  'marcus.viniciuslopessantos79@gmail.com': ['intervale'], // 🥊 Inter Vale FC (virou Fundador em 21/10)
  'jadriovani@gmail.com': ['guimaraes'],
  'lucasfonseca363@gmail.com': ['lulubaba'], // 🧤🖤 Lulubaba FC (Fundador, 29/10)
  'bruno.cunha2007@gmail.com': ['piranhao'], // 🐟🏛️ Piranhão FC (Fundador, 29/10)
  'sheeryarie772@gmail.com': ['neymarfc'], // 🐐👑 Neymar_FC (Fundador, 29/10)
  'alexandre12cdm@gmail.com': ['dsouza', 'dsouza_emp'], // 🐶 dSouza FC (Fundador, 28/10) + 🖼️ tema da dSouza Empreendimentos, a empresa dele que anuncia no jogo (pedido do Diego, 28/10) // 🌪️ Guimarães SCI (virou Fundador em 23/10)
  'vittor@tidex.com.br': ['wenmilan', 'tidex'], // 😈 Wen Milan B (conta criada em 19/10) + 🤖 tema da Tidex, a empresa dele que patrocina o jogo (19/10, aprovado pelo Diego)
}
// 🛡️ tema do CLUBE batizado comprado na Loja (`esc_temas_conta`, tipo clube) → os temas montados pra esse clube
const TEMAS_POR_CLUBE: Record<string, TemaClubeId[]> = {
  'Neymarzetti': ['neymarzetti_noite', 'neymarzetti_branco'],
  'K9 FC': ['k9_gelo', 'k9_branco'],
  'Tricolor do Arruda FC': ['arruda'], 'Fabulous EC': ['fabulous'], 'Gaviões SCCP': ['gavioes'], 'Cuiudos FC': ['cuiudos'], 'Seven City': ['seven'], 'Futpoint FC': ['futpoint'], 'Wen Milan B': ['wenmilan'], 'Inter Vale FC': ['intervale'], 'dSouza FC': ['dsouza'], 'Guimarães SCI': ['guimaraes'], 'Lulubaba FC': ['lulubaba'], 'Piranhão FC': ['piranhao'], 'Neymar_FC': ['neymarfc'],
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
// 🖼️ MINIATURA do tema (29/10, mockup `scripts/mockups/tema-sala-achar.png`, Diego: *"não está muito claro pra ele o que ele tem de
// tema pra botar"*): o fundo do tema + o escudo + a mascote num cartãozinho, pro dono VER como a sala fica antes de tocar.
export function MiniTemaSala({ tema, ativo, onClick }: { tema: Tema | null; ativo: boolean; onClick: () => void }) {
  const fundo = !tema ? '#2a2a2a' : tema.coracao ? (tema.coracao.listra ?? `repeating-linear-gradient(160deg,${tema.coracao.c1} 0 12px,${tema.coracao.c2} 12px 24px)`) : (tema.pano ?? (tema.claro ? '#f2f2f2' : '#141414'))
  return (
    <button type="button" onClick={onClick} aria-pressed={ativo} style={{ flex: '1 1 0', minWidth: 0, position: 'relative', border: '3px solid #0C0C0C', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '2px 2px 0 #0C0C0C', padding: 0, cursor: 'pointer', outline: ativo ? '4px solid #1B7A3D' : 'none', outlineOffset: -1 }}>
      {ativo && <span style={{ position: 'absolute', left: 4, top: 4, zIndex: 2, background: '#1B7A3D', color: '#fff', font: '700 9px Oswald, sans-serif', borderRadius: 6, padding: '1px 5px', border: '2px solid #000' }}>{tr('✓ NA SALA', '✓ ON')}</span>}
      <span style={{ display: 'flex', height: 66, position: 'relative', alignItems: 'center', justifyContent: 'center', background: fundo }}>
        {tema ? <img src={tema.escudo} alt="" style={{ height: 50, maxWidth: '80%', objectFit: 'contain' }} /> : <span style={{ color: '#fff', font: '700 22px Oswald, sans-serif' }}>—</span>}
        {tema?.mascote && <img src={tema.mascote} alt="" style={{ position: 'absolute', right: 2, bottom: 0, height: 42, maxWidth: '45%', objectFit: 'contain' }} />}
      </span>
      <b style={{ display: 'block', font: '700 10.5px/1.15 Oswald, sans-serif', textAlign: 'center', padding: '4px 3px 5px', textTransform: 'uppercase', color: '#0C0C0C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tema ? nomeTema(tema) : tr('Sem tema', 'No theme')}</b>
    </button>
  )
}

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
