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

// ⚡ DIA DA MARCA (16/10, Diego: "dia da marca… terá nome apresentado por na Copa dos 8 também, naming rights"): o Diego marca
// no #admin a DATA e a marca (`esc_dia_marca`); naquele dia (horário de Brasília) a Copa dos 8 sai "apresentada por…" pra
// TODO MUNDO — é patrocínio pago, não teste. Uma leitura pequena por sessão (sem canal, sem repetição: regra do tráfego).
let diaMarca: { dia: string; marca: Patrocinio | null } | null = null
let pedindo: Promise<void> | null = null
const ouvintes = new Set<() => void>()
const hojeBrasilia = () => new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10)
function carregaDiaMarca(): Promise<void> {
  const hoje = hojeBrasilia()
  if (diaMarca?.dia === hoje) return Promise.resolve()
  if (pedindo) return pedindo
  pedindo = (async () => {
    try {
      const { data } = await supabase.from('esc_dia_marca').select('nome, emoji').eq('dia', hoje).maybeSingle()
      diaMarca = { dia: hoje, marca: data?.nome ? { nome: String(data.nome), emoji: String(data.emoji ?? '⭐') } : null }
    } catch { diaMarca = { dia: hoje, marca: null } }
    pedindo = null
    ouvintes.forEach(f => { try { f() } catch { /* ignora */ } })
  })()
  return pedindo
}
/** hook do palco: a marca do mês (código) ou, na Copa dos 8, a marca do DIA (banco) */
export function usePatrocinio(kind: Competicao): Patrocinio | null {
  const [, re] = useState(0)
  useEffect(() => {
    if (kind !== 'copa8') return
    const f = () => re(n => n + 1)
    ouvintes.add(f); carregaDiaMarca()
    return () => { ouvintes.delete(f) }
  }, [kind])
  if (kind === 'copa8' && diaMarca?.dia === hojeBrasilia() && diaMarca.marca) return diaMarca.marca
  return patrocinioDe(kind)
}

// 📣 Anúncio no GIRO DA RODADA (16/10, Diego: *"o giro da rodada pode servir mais de propaganda do que qualquer coisa… deixar
// o texto completo passar devagar"*). Entra como UMA manchete a mais no letreiro, depois das notícias da rodada, em branco
// (as notícias são âmbar) pra ninguém confundir anúncio com resultado. O texto é o que a marca manda.
const GIRO_ANUNCIO: string | null = '🚗 Vadico Veículos · Oferta do dia: GWM Haval H6 0 km blindado · Menor valor do Rio'
// 📣 E o anúncio AVULSO de 1 dia (R$ 25 na Loja): o Diego marca no #admin a data e o texto (`esc_giro_anuncio`); naquele dia
// (Brasília) ele passa no giro de todo mundo, antes do mensal. Uma leitura pequena por dia (regra do tráfego).
let giroDia: { dia: string; texto: string | null } | null = null
let pedindoGiro: Promise<void> | null = null
const ouvintesGiro = new Set<() => void>()
function carregaGiroDia(): Promise<void> {
  const hoje = hojeBrasilia()
  if (giroDia?.dia === hoje) return Promise.resolve()
  if (pedindoGiro) return pedindoGiro
  pedindoGiro = (async () => {
    try {
      const { data } = await supabase.from('esc_giro_anuncio').select('texto').eq('dia', hoje).maybeSingle()
      giroDia = { dia: hoje, texto: data?.texto ? String(data.texto) : null }
    } catch { giroDia = { dia: hoje, texto: null } }
    pedindoGiro = null
    ouvintesGiro.forEach(f => { try { f() } catch { /* ignora */ } })
  })()
  return pedindoGiro
}
/** os anúncios que passam no giro hoje: o avulso do dia (banco, pra todos) + o mensal (código) */
export function useAnunciosGiro(): string[] {
  const [, re] = useState(0)
  useEffect(() => {
    const f = () => re(n => n + 1)
    ouvintesGiro.add(f); carregaGiroDia()
    return () => { ouvintesGiro.delete(f) }
  }, [])
  const out: string[] = []
  if (giroDia?.dia === hojeBrasilia() && giroDia.texto) out.push('📣 ' + giroDia.texto)
  if (espacosOk() && GIRO_ANUNCIO) out.push(GIRO_ANUNCIO)
  return out
}
