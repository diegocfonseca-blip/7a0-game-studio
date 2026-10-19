// ─── 💼 PATROCINADOR DE VERDADE NO JOGO (16/10) ────────────────────────────────────────────────────────────────────
//
// Diego: *"publique agora da Vadico Veículos pra eu ver como fica… deixe a Champions Legends apresentada por Vadico
// Veículos"*. Primeiro espaço ligado: o NOME DA COMPETIÇÃO ("apresentada por"), no palco da competição (`CompetitionStage`).
// Regra combinada: uma marca por competição; cada competição pode ter a sua. Sem logo oficial ainda → marca escrita.
//
// 🔒 A seção da Loja ("Sua marca no jogo") segue só nas contas do Diego (`PATROCINIO_GERAL`). Os espaços na TELA (nome da
// competição, LED do estádio, anúncio no O MARTELO) foram pro ar pra todos em 16/10 (`ESPACOS_GERAL`, Diego: "pode publicar").
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loggedEmail, stripEmoji } from './apoio'
import { buscaVitrine, podioPassada } from './vitrine-dados' // 🏆 pódio da semana passada no letreiro (19/10)
import VADICO_LOGO_ALFA from './img/patro-vadico-alfa.webp'
import TIDEX_LOGO from './img/patro-tidex.webp' // 🤖 Tidex (19/10): Copa dos 8, placa do campinho e telão no lugar da Max Joias

export type Patrocinio = { nome: string; emoji: string }
type Competicao = 'copa8' | 'liberta' | 'world' | 'club-world' | 'league' | 'champions'

const PATROCINIO_GERAL = true // 16/10: Diego "pode liberar tudo já pro geral, mostrar pra todos, e Pix também"
const ESPACOS_GERAL = true
const PATROCINIO_TESTERS = new Set(['diego.c.fonseca@gmail.com', 'diego.c.fonseca2@gmail.com'])
const POR_COMPETICAO: Partial<Record<Competicao, Patrocinio>> = {
  champions: { nome: 'Vadico Veículos', emoji: '🚗' }, // 🚗 Vadico Veículos (Itaguaí e Barra da Tijuca) — 16/10
  copa8: { nome: 'Tidex', emoji: '🤖' }, // 🤖 Tidex — sua marca dentro das IAs (19/10, Diego: "add a Tidex na copa dos 8 apresentado por")
}

/** a marca que apresenta esta competição (null = sem patrocinador, ou ainda escondido pra esta conta) */
export function patrocinioDe(kind: Competicao): Patrocinio | null {
  const email = (loggedEmail() ?? '').toLowerCase()
  if (!ESPACOS_GERAL && !PATROCINIO_TESTERS.has(email)) return null
  return POR_COMPETICAO[kind] ?? null
}
const espacosOk = () => ESPACOS_GERAL || PATROCINIO_TESTERS.has((loggedEmail() ?? '').toLowerCase())

// 🏟️ LED do estádio (R$ 200/mês): quem está aqui passa no letreiro do palco das partidas online, uma marca atrás da outra.
export type MarcaLed = Patrocinio & { chamada?: string }
const LED_ESTADIO: MarcaLed[] = [
  { nome: 'Vadico Veículos', emoji: '🚗', chamada: 'Itaguaí · Barra da Tijuca · 45 anos' },
]
export function ledDoEstadio(): MarcaLed[] { return espacosOk() ? LED_ESTADIO : [] }

// 📰 Anúncio no O MARTELO (R$ 100/mês): um quadro no fim do jornal. Um anunciante por vez.
export type AnuncioJornal = Patrocinio & { texto: string; contato?: string; logo?: string; logoProp?: number }
// 16/10: desligado/religado no mesmo dia; 17/10 DESLIGADO de vez (*"remova propaganda do martelo"*) — na Loja o item virou as placas atrás dos gols
const ANUNCIO_MARTELO_LIGADO = false
const ANUNCIO_MARTELO: AnuncioJornal | null = {
  nome: 'Vadico Veículos', emoji: '🚗', logo: VADICO_LOGO_ALFA, logoProp: 496 / 140,
  texto: '45 anos de empresa familiar. Garantia e documento no nome da loja, sem carro de leilão. Itaguaí e Barra da Tijuca.',
  contato: 'vadicoveiculos.com.br · @vadicoveiculos',
}
export function anuncioDoMartelo(): AnuncioJornal | null { return espacosOk() && ANUNCIO_MARTELO_LIGADO ? ANUNCIO_MARTELO : null }

/** 💼 a seção "Sua marca no jogo" da Loja (Dia da marca + mensal) — mesma trava: começa só nas contas do Diego */
export function patrocinioLojaOk(): boolean {
  return PATROCINIO_GERAL || PATROCINIO_TESTERS.has((loggedEmail() ?? '').toLowerCase())
}

// ⏱️ ANÚNCIOS AVULSOS PAGOS (16/10, regra do Diego: *"todo anúncio dura 24h desde que colocado no ar… somente anúncios manuais
// como da Vadico ficam direto até eu alterar"*). O Diego põe no ar pelo #admin (`esc_anuncios`: tipo 'marca' = Dia da marca na
// Copa dos 8 · tipo 'giro' = Anúncio do dia no letreiro) e cada um vale 24 h a partir do `inicio`. Os MANUAIS (mensal, como a
// Vadico) moram no código e ficam até ele trocar. Leitura pequena: uma por sessão, refeita no máximo a cada 30 min (tráfego).
type Avulso = { tipo: 'giro' | 'marca' | 'recado'; texto: string; emoji: string; inicio: number; fim: number; autor?: string } // 💬 recado (18/10): o jogador escreve, com o nome do time
let avulsos: Avulso[] = []
let fixos: { texto: string; cor: string; link?: string }[] | null | undefined = undefined // 📌 undefined = lendo (nada) · null = a leitura falhou (reserva do código)
let lidoEm = 0
let pedindo: Promise<void> | null = null
const ouvintes = new Set<() => void>()
function carregaAvulsos(): Promise<void> {
  if (Date.now() - lidoEm < 30 * 60_000) return Promise.resolve()
  if (pedindo) return pedindo
  pedindo = (async () => {
    try {
      const [{ data }, fx] = await Promise.all([
        supabase.from('esc_anuncios').select('tipo, texto, emoji, inicio, fim, autor').gt('fim', new Date().toISOString()).order('inicio').limit(20),
        supabase.from('esc_anuncios_fixos').select('texto, link').eq('ativo', true).order('ordem').order('id').limit(12),
      ])
      // 📌 fixos do banco: lista vazia = o Diego tirou todos (vale vazio); erro de leitura = fica a reserva do código
      if (!fx.error && Array.isArray(fx.data)) fixos = (fx.data as { texto: string; link: string | null }[])
        .map(r => ({ texto: String(r.texto), cor: '#FFC400', ...(r.link && /^https:\/\//.test(r.link) ? { link: String(r.link) } : {}) }))
      else if (fixos === undefined) fixos = null
      avulsos = ((data ?? []) as { tipo: string; texto: string; emoji: string; inicio: string; fim: string; autor?: string | null }[])
        .map(r => ({ tipo: r.tipo === 'marca' ? 'marca' : r.tipo === 'recado' ? 'recado' : 'giro', texto: String(r.texto), emoji: String(r.emoji ?? '⭐'), inicio: Date.parse(r.inicio), fim: Date.parse(r.fim), autor: r.autor ? String(r.autor) : undefined }) as Avulso)
    } catch { avulsos = []; if (fixos === undefined) fixos = null }
    lidoEm = Date.now(); pedindo = null
    ouvintes.forEach(f => { try { f() } catch { /* ignora */ } })
  })()
  return pedindo
}
const noAr = (tipo: Avulso['tipo']) => { const t = Date.now(); return avulsos.filter(a => a.tipo === tipo && a.inicio <= t && t < a.fim) }
function useAvulsos(ligado = true) {
  const [, re] = useState(0)
  useEffect(() => {
    if (!ligado) return
    const f = () => re(n => n + 1)
    ouvintes.add(f); carregaAvulsos()
    return () => { ouvintes.delete(f) }
  }, [ligado])
}

/** hook do palco: a marca do mês (código) ou, na Copa dos 8, o ⚡ Dia da marca que está no ar (banco, 24 h) */
export function usePatrocinio(kind: Competicao): Patrocinio | null {
  useAvulsos(kind === 'copa8')
  const m = kind === 'copa8' ? noAr('marca')[0] : undefined
  if (m) return { nome: m.texto, emoji: m.emoji }
  return patrocinioDe(kind)
}

// 📢 ANÚNCIO DO DIA (o letreiro que era o giro da rodada): o avulso pago (24 h) passa antes do manual.
// 📌 19/10 (Diego: "deveria aparecer no painel as três p eu remover editar ou add nova"): os MANUAIS agora moram no banco
// (`esc_anuncios_fixos`, editados no #admin → "📌 Anúncios fixos"). A lista abaixo virou só RESERVA, usada quando a leitura falha.
const GIRO_ANUNCIO: string | null = '🚗 Vadico Veículos · Oferta do dia: GWM Haval H6 0 km blindado · Menor valor do Rio' // reserva
// 🔗 17/10 (Diego): tocar na Vadico abre a oferta do carro do anúncio no site dela. Só anúncio MANUAL leva link (o pago de 24 h é
// texto escrito pelo comprador e vai pro ar sem ninguém olhar — link ali seria porta pra golpe).
// 📢 MAIS ANÚNCIOS MANUAIS (17/10, Diego), passando depois da Vadico, cada um com o próprio link:
// · canal do K9 no YouTube (link limpo, sem o rastreio do Facebook que veio colado)
// · Tidex (19/10, no lugar da Max Joias) → WhatsApp deles, com a mensagem já escrita
// 🤖 Tidex (19/10): o mesmo texto/link está na linha do banco (`esc_anuncios_fixos`), que é quem manda; isto é a reserva
const TIDEX_GIRO = '🤖 Tidex · Sua empresa aparece no ChatGPT? Clique aqui'
const TIDEX_ZAP = 'https://wa.me/5511981181888?text=' + encodeURIComponent('Olá! Vim pelo Leilão Legends e queria saber como ter minha empresa no ChatGPT.')
const GIRO_MANUAIS: { texto: string; cor: string; link?: string }[] = [
  { texto: '▶️ Kelvin Oliveira · Siga o novo canal do K9 no YouTube', cor: '#FFC400', link: 'https://www.youtube.com/@kelvink9oliveira' },
  { texto: TIDEX_GIRO, cor: '#FFC400', link: TIDEX_ZAP }, // 🤖 19/10: no lugar da Max Joias
]
const GIRO_ANUNCIO_LINK = 'https://vadicoveiculos.com.br/Veiculo/haval-h6-1.5-flex-phev19-e-traction-gasolina-e-eletrico-2027/5425264/detalhes'
// 🎨 cor no letreiro: o manual (Vadico) em dourado; o pago de 24 h em VERDE, pra diferenciar (Diego: "talvez dê outra cor")
export type AnuncioGiro = { texto: string; cor: string; link?: string; recado?: { autor: string }; podio?: true } // 💬 recado de jogador: rosa + nome do time · 🏆 pódio da semana: roxo (19/10)
export const ANUNCIO_MAX = 82 // = tamanho do texto da Vadico (Diego: "número máximo de caracteres… tipo o da Vadico")
function usePodioPassado() {
  const [v, setV] = useState(podioPassada())
  useEffect(() => { let vivo = true; void buscaVitrine().then(() => { if (vivo) setV(podioPassada()) }); return () => { vivo = false } }, [])
  return v
}
export function useAnunciosGiro(): AnuncioGiro[] {
  useAvulsos()
  const out: AnuncioGiro[] = noAr('giro').map(a => ({ texto: '📣 ' + a.texto, cor: '#5CFF8A' }))
  // 💬 RECADO EM DESTAQUE (18/10): gira no mesmo letreiro, em rosa, com o nome do time de quem mandou (mockup `recado-destaque.png`)
  out.push(...noAr('recado').map(a => ({ texto: a.texto, cor: '#FF5FA2', recado: { autor: a.autor ?? '' } })))
  // 🏆 PÓDIO DA SEMANA PASSADA (19/10, Diego: "no telão aparece os 3 primeiros da semana… com emoji de medalha"): roda a semana
  // inteira, em roxo. Vem da vitrine (mesma leitura do ranking, cache de 60 s) — zero mensagem nova no canal.
  const podio = usePodioPassado()
  if (podio.length) out.push({ texto: podio.map(p => `${['', '🥇', '🥈', '🥉'][p.pos] ?? '🏅'} ${stripEmoji(p.nome).trim()}`).join(' · '), cor: '#C9A9FF', podio: true })
  if (espacosOk()) {
    if (fixos) out.push(...fixos)
    else if (fixos === null) {
      if (GIRO_ANUNCIO) out.push({ texto: GIRO_ANUNCIO, cor: '#FFC400', link: GIRO_ANUNCIO_LINK })
      out.push(...GIRO_MANUAIS)
    }
  }
  return out
}
/** depois que alguém põe o anúncio no ar, relê na hora (pra pessoa já se ver no letreiro) */
export function releAnuncios() { lidoEm = 0; carregaAvulsos() }

// 🏟️ PLACAS ATRÁS DOS GOLS (17/10, Diego escolheu a ideia 1 do mockup `scripts/mockups/campinho-outras-ideias.png`: *"perfeito
// pode fazer mas no momento coloque Vadico Veículos e Max Joias"*). Uma placa em cima e outra embaixo de todo campinho, cada uma
// numa marca, trocando juntas a cada 7 s no MESMO relógio do Anúncio do dia. Com 1 marca só, a outra placa mostra Leilão Legends.
export type PlacaCampo = { nome: string; logo?: string; prop?: number; fundo: string }
const PLACAS_CAMPO: PlacaCampo[] = [
  { nome: 'Vadico Veículos', logo: VADICO_LOGO_ALFA, prop: 496 / 140, fundo: '#ffffff' },
  { nome: 'Tidex', logo: TIDEX_LOGO, prop: 837 / 120, fundo: '#0B1220' }, // 🤖 19/10: no lugar da Max Joias (fundo escuro, como o site deles)
]
export const PLACA_CASA: PlacaCampo = { nome: 'Leilão Legends', fundo: 'linear-gradient(180deg,#FFD84A,#E8A900)' }
export function placasDoCampo(): PlacaCampo[] {
  if (!espacosOk()) return []
  return PLACAS_CAMPO.length === 1 ? [PLACAS_CAMPO[0], PLACA_CASA] : PLACAS_CAMPO
}
