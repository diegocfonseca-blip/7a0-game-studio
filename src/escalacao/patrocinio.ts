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
import { loggedEmail } from './apoio'
import VADICO_LOGO_ALFA from './img/patro-vadico-alfa.webp'

export type Patrocinio = { nome: string; emoji: string }
type Competicao = 'copa8' | 'liberta' | 'world' | 'club-world' | 'league' | 'champions'

const PATROCINIO_GERAL = false
const ESPACOS_GERAL = true
const PATROCINIO_TESTERS = new Set(['diego.c.fonseca@gmail.com', 'diego.c.fonseca2@gmail.com'])
const POR_COMPETICAO: Partial<Record<Competicao, Patrocinio>> = {
  champions: { nome: 'Vadico Veículos', emoji: '🚗' }, // 🚗 Vadico Veículos (Itaguaí e Barra da Tijuca) — 16/10
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
// 16/10: desligado quando ele disse "até agora gostei só do apresentado por"; religado no mesmo dia (*"coloque o anúncio no Martelo no final sim"*)
const ANUNCIO_MARTELO_LIGADO = true
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
type Avulso = { tipo: 'giro' | 'marca'; texto: string; emoji: string; inicio: number; fim: number }
let avulsos: Avulso[] = []
let lidoEm = 0
let pedindo: Promise<void> | null = null
const ouvintes = new Set<() => void>()
function carregaAvulsos(): Promise<void> {
  if (Date.now() - lidoEm < 30 * 60_000) return Promise.resolve()
  if (pedindo) return pedindo
  pedindo = (async () => {
    try {
      const { data } = await supabase.from('esc_anuncios').select('tipo, texto, emoji, inicio, fim').gt('fim', new Date().toISOString()).order('inicio').limit(20)
      avulsos = ((data ?? []) as { tipo: string; texto: string; emoji: string; inicio: string; fim: string }[])
        .map(r => ({ tipo: r.tipo === 'marca' ? 'marca' : 'giro', texto: String(r.texto), emoji: String(r.emoji ?? '⭐'), inicio: Date.parse(r.inicio), fim: Date.parse(r.fim) }) as Avulso)
    } catch { avulsos = [] }
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
const GIRO_ANUNCIO: string | null = '🚗 Vadico Veículos · Oferta do dia: GWM Haval H6 0 km blindado · Menor valor do Rio' // manual: fica até o Diego trocar
export function useAnunciosGiro(): string[] {
  useAvulsos()
  const out = noAr('giro').map(a => '📣 ' + a.texto)
  if (espacosOk() && GIRO_ANUNCIO) out.push(GIRO_ANUNCIO)
  return out
}
