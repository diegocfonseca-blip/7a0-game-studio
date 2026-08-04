// 🏀/⚽ QUAL ESPORTE — fundação do BidLegends (basquete) morando no MESMO app.
// leilaolegends.com → futebol · bidlegendsarena.com → basquete.
//
// SEGURANÇA (regra #1 do Diego — nunca quebrar o futebol): o padrão é SEMPRE
// futebol. Só vira basquete no hostname EXATO do BidLegends ou por escolha
// explícita do usuário. Nenhuma tela de futebol muda por causa disto.
//
// TESTÁVEL ANTES DO DNS: como o domínio bidlegendsarena.com ainda não aponta
// pro site, dá pra ver o modo basquete por ?sport=basquete na URL (ou #basquete).
// A escolha fica gravada no aparelho, então sobrevive à navegação sem o ?sport.

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Sport = 'futebol' | 'basquete'

const LS_KEY = 'll_sport' // escolha do usuário neste aparelho

// hostname do basquete. SÓ isto (ou a escolha explícita) vira basquete sozinho.
function sportFromHost(): Sport | null {
  try {
    const h = (window.location.hostname || '').toLowerCase()
    if (h.includes('bidlegends')) return 'basquete'
    if (h.includes('leilaolegends')) return 'futebol'
  } catch { /* sem window */ }
  return null
}

// override de teste pela URL: ?sport=basquete|futebol  ou  #basquete|#futebol
function sportFromUrl(): Sport | null {
  try {
    const q = new URLSearchParams(window.location.search).get('sport')
    const raw = (q || window.location.hash.replace(/^#/, '')).trim().toLowerCase()
    if (raw === 'basquete' || raw === 'basket' || raw === 'nba') return 'basquete'
    if (raw === 'futebol' || raw === 'futbol' || raw === 'soccer') return 'futebol'
  } catch { /* ignora */ }
  return null
}

function readStored(): Sport | null {
  try {
    const v = localStorage.getItem(LS_KEY)
    if (v === 'futebol' || v === 'basquete') return v
  } catch { /* ignora */ }
  return null
}

// prioridade: URL (teste) > escolha salva > hostname > futebol (padrão seguro)
function resolveSport(): Sport {
  return sportFromUrl() ?? readStored() ?? sportFromHost() ?? 'futebol'
}

let current: Sport = resolveSport()
// se veio pela URL, grava a escolha (pra colar mesmo depois de trocar de tela)
if (sportFromUrl()) { try { localStorage.setItem(LS_KEY, current) } catch { /* ignora */ } }

const listeners = new Set<() => void>()

export function getSport(): Sport { return current }

export function setSport(s: Sport): void {
  if (s === current) return
  current = s
  try { localStorage.setItem(LS_KEY, s) } catch { /* ignora */ }
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}

export function onSportChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

// hook React: [esporte, trocar]
export function useSport(): [Sport, (s: Sport) => void] {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return [current, setSport]
}

// 🔒 ACESSO ANTECIPADO AO BASQUETE — regra do Diego (26/07): enquanto o
// BidLegends está em construção, NADA de basquete pode aparecer pra ninguém.
// SÓ estas contas veem o seletor ⚽/🏀; pra todo o resto o app é 100% futebol,
// sem UMA vírgula a mais na tela. Trava é por CONTA logada (não por domínio):
// vale mesmo no leilaolegends.com quando o Diego entra na conta dele.
const BASQUETE_TESTERS = new Set(['diego.c.fonseca@gmail.com'])

let unlocked = false
function applyUnlock(email?: string | null): void {
  const u = !!email && BASQUETE_TESTERS.has(email.toLowerCase())
  if (u === unlocked) return
  unlocked = u
  // deslogou / trocou pra conta comum: volta pro futebol NA HORA (nada de
  // basquete sobra na tela de quem não é tester).
  if (!u && current === 'basquete') current = 'futebol'
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
// 🌙 TEMA NOTURNO — decisão do Diego (03/08): por enquanto SÓ a conta dele vê o
// botão e consegue ligar (vai virar REGALIA DE PLANO PAGO depois — aí a trava
// troca de "lista de e-mails" pra "tier de apoio" num lugar só). Conta sem
// direito: se o noturno estiver ligado por qualquer caminho (localStorage/URL),
// é DESLIGADO na hora que o login resolve — o claro é o padrão de todos.
const TEMA_TESTERS = new Set(['diego.c.fonseca@gmail.com'])
let temaLiberado = false
function applyTemaUnlock(email?: string | null): void {
  const u = !!email && TEMA_TESTERS.has(email.toLowerCase())
  if (u === temaLiberado) return
  temaLiberado = u
  if (!u) {
    try {
      if (document.documentElement.classList.contains('noturno')) {
        document.documentElement.classList.remove('noturno')
        localStorage.setItem('esc-tema', 'claro')
      }
    } catch { /* segue no claro */ }
  }
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function useTemaLiberado(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return temaLiberado
}

// 🕴️ AGÊNCIA 2.0 — decisão do Diego (03/08): por enquanto SÓ contas de teste.
// Carreira nova só nasce com a agência se a conta logada estiver na lista; e
// mesmo um save que tenha a flag (criado na janela em que ficou público) não
// MOSTRA nada pra conta comum — o jogo fica 100% igual ao de sempre pros outros.
// Quando o Diego liberar geral, é só esvaziar a checagem (um lugar só).
// A MESMA lista libera a ESCADA (Várzea + régua) e o baralho 'todos' — o pacote
// completo da carreira nova de teste.
// 🔓 LIBERADO GERAL (03/08, ordem do Diego: "pode liberar já pra todos o novo
// carreira") — a carreira nova (Agência 2.0 + Escada/Várzea + baralho todos +
// Estrutura) vale pra TODO MUNDO. Pra voltar ao teste fechado: AGENCIA_GERAL
// = false e a lista de testers reassume.
const AGENCIA_GERAL = true
const AGENCIA_TESTERS = new Set([
  'diego.c.fonseca@gmail.com',
  'msb102010@hotmail.com', // testador convidado pelo Diego (03/08)
  'denilson.stifler10@gmail.com', // testador convidado pelo Diego (03/08)
])
let agenciaOk = AGENCIA_GERAL
function applyAgenciaUnlock(email?: string | null): void {
  const u = AGENCIA_GERAL || (!!email && AGENCIA_TESTERS.has(email.toLowerCase()))
  if (u === agenciaOk) return
  agenciaOk = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function agenciaLiberada(): boolean { return agenciaOk }
// 🪜 ESCADA DE CATEGORIAS na carreira (03/08): mesma trava — por enquanto SÓ o
// Diego testa. Carreira nova de conta comum nasce sem a escada (jogo de sempre).
export function escadaLiberada(): boolean { return agenciaOk } // mesma lista/conta da agência (AGENCIA_TESTERS)
export function useEscadaLiberada(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return agenciaOk
}
// hook React: re-renderiza quando o login resolve/troca de conta
export function useAgenciaLiberada(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return agenciaOk
}

// 🔨🎬 REVELAÇÃO CINEMA (em teste, 03/08): a revelação do martelo ganha tremida
// de tela, brilho/confete na Lenda e o selo "QUASE!". SÓ a conta do Diego vê,
// pra ele sentir ao vivo (com os SONS reais do jogo) antes de liberar pra todos.
// Não muda NADA da lógica do leilão — é só a cara do momento. Liberar geral: é
// só trocar a lista por AGENCIA_GERAL-style ou esvaziar a checagem.
const REVEAL_CINEMA_TESTERS = new Set(['diego.c.fonseca@gmail.com'])
let revealCinema = false
function applyRevealCinema(email?: string | null): void {
  const u = !!email && REVEAL_CINEMA_TESTERS.has(email.toLowerCase())
  if (u === revealCinema) return
  revealCinema = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function revealCinemaOn(): boolean { return revealCinema }
export function useRevealCinema(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return revealCinema
}

supabase.auth.getUser().then(({ data }) => { applyUnlock(data?.user?.email); applyTemaUnlock(data?.user?.email); applyAgenciaUnlock(data?.user?.email); applyRevealCinema(data?.user?.email) }, () => {})
supabase.auth.onAuthStateChange((_e, s) => { applyUnlock(s?.user?.email); applyTemaUnlock(s?.user?.email); applyAgenciaUnlock(s?.user?.email); applyRevealCinema(s?.user?.email) })

export function isSportUnlocked(): boolean { return unlocked }

// hook React: true só pra conta liberada (Diego). Re-renderiza quando o login
// resolve ou troca de conta.
export function useSportUnlocked(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return unlocked
}

// marca visível de cada esporte (o "arena" mora só no endereço do domínio)
export const SPORT_BRAND: Record<Sport, { name: string; emoji: string; tab: string }> = {
  futebol: { name: 'Leilão Legends', emoji: '⚽', tab: 'Futebol' },
  basquete: { name: 'BidLegends', emoji: '🏀', tab: 'Basquete' },
}
