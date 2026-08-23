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
// (histórico: nasceu como teste fechado por lista de conta. Desde 03/08 está
// geral — a lista abaixo virou só o plano B.)
// A MESMA chave libera a ESCADA (Várzea + régua) e o baralho 'todos'.
// 🔓 LIBERADO GERAL (03/08, ordem do Diego: "pode liberar já pra todos o novo
// carreira") — a carreira nova (Agência 2.0 + Escada/Várzea + baralho todos +
// Estrutura) vale pra TODO MUNDO. Pra voltar ao teste fechado: AGENCIA_GERAL
// = false e a lista de testers reassume.
const AGENCIA_GERAL = true
// ⚠️ LEIA O VALOR, NÃO O COMENTÁRIO. `AGENCIA_GERAL = true` desde 03/08: a
// Agência 2.0 vale pra TODA CONTA. Esta lista é só o fallback caso volte ao
// teste fechado.
// 🚧 O QUE "GERAL" NÃO QUER DIZER (Diego 16/08, e ele tem razão): NÃO liberou
// pra carreira ANTIGA. Só carreira criada DEPOIS de 03/08 nasce com a flag —
// "saves antigos intocados", nas palavras do commit. Carreira sem a flag segue
// 100% como era e NÃO grava nada em ranking (nem no global, nem no da home):
// as travas estão em pyramidseason.tsx (4001, 4419, 4450) e copa-mundo.tsx.
const AGENCIA_TESTERS = new Set([
  'diego.c.fonseca@gmail.com',
  'msb102010@hotmail.com',
  'denilson.stifler10@gmail.com',
])
let agenciaOk = AGENCIA_GERAL
function applyAgenciaUnlock(email?: string | null): void {
  const u = AGENCIA_GERAL || (!!email && AGENCIA_TESTERS.has(email.toLowerCase()))
  if (u === agenciaOk) return
  agenciaOk = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function agenciaLiberada(): boolean { return agenciaOk }
// 🪜 ESCADA DE CATEGORIAS na carreira: anda junto com a Agência (mesma chave).
// ⚠️ o comentário antigo aqui dizia "por enquanto SÓ o Diego testa" e ficou pra
// trás em 03/08 — já enganou sessão (16/08). Hoje: carreira NOVA de qualquer
// conta nasce com a escada; carreira antiga continua sem.
export function escadaLiberada(): boolean { return agenciaOk }
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
// 🔓 LIBERADO GERAL (04/08, ordem do Diego): a Revelação Cinema é PRA TODOS.
// Pra voltar ao teste fechado: REVEAL_CINEMA_GERAL = false e a lista reassume.
const REVEAL_CINEMA_GERAL = true
const REVEAL_CINEMA_TESTERS = new Set(['diego.c.fonseca@gmail.com'])
let revealCinema = REVEAL_CINEMA_GERAL
function applyRevealCinema(email?: string | null): void {
  const u = REVEAL_CINEMA_GERAL || (!!email && REVEAL_CINEMA_TESTERS.has(email.toLowerCase()))
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

// ⚽🧪 MODO TESTE DO PÊNALTI (temporário, Diego 12/08): pro Diego CONFERIR os dois
// modos (Você bate / Bate sozinho) sem esperar a raridade de 0-2/temporada, na conta
// dele o pênalti aparecia em TODO jogo decisivo de última hora. Pra todo mundo continua
// raro (0-2/temporada). ✅ Diego já testou (12/08, ficou "pênalti toda hora, dá nem pra
// jogar direito") — desligado. Sua conta agora segue a raridade normal como todo mundo.
const PEN_TEST_TESTERS = new Set<string>([])
let penTestOk = false
function applyPenTest(email?: string | null): void {
  const u = !!email && PEN_TEST_TESTERS.has(email.toLowerCase())
  if (u === penTestOk) return
  penTestOk = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function usePenaltiTeste(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return penTestOk
}

// 🏆🇧🇷 COPA DO BRASIL LEGENDS: substitui a Copa Legends na pirâmide de
// carreira — 100 clubes, mata-mata puro, + a Supercopa Legends no fim.
// 🔓 LIBERADO GERAL (16/08, ordem do Diego: "atualiza já p td mundo") —
// vale pra TODO MUNDO; a Copa Legends saiu de cena. Pra voltar ao teste
// fechado: COPA_BRASIL_GERAL = false e a lista de testers reassume
// (mesmo padrão da Agência/Revelação Cinema acima).
const COPA_BRASIL_GERAL = true
const COPA_BRASIL_TESTERS = new Set(['diego.c.fonseca@gmail.com'])
let copaBrasilOk = COPA_BRASIL_GERAL
function applyCopaBrasilUnlock(email?: string | null): void {
  const u = COPA_BRASIL_GERAL || (!!email && COPA_BRASIL_TESTERS.has(email.toLowerCase()))
  if (u === copaBrasilOk) return
  copaBrasilOk = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function copaBrasilLiberada(): boolean { return copaBrasilOk }
export function useCopaBrasilLiberada(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return copaBrasilOk
}

// 🃏 BAFO (batizado pelo Diego 17/08) — modo NOVO do rápido online: em vez de leiloar,
// cada um traz o time da PRÓPRIA carreira (os 22 do elenco ou 22 convocados do
// cofre) e joga VALENDO CARTA. Desenho fechado em docs/pendencias.md.
// O nome é o do jogo de figurinha de rua: você joga valendo a carta do outro —
// todo brasileiro entende sem explicação, e não colide com a Carreira Online real
// que o Diego vai lançar (essa é UMA partida com o que você já construiu; a outra
// é construir junto, temporada após temporada).
// 🔒 EM CONSTRUÇÃO: só a conta do Diego enxerga. Pra abrir pra todo mundo depois,
// é o mesmo caminho da Copa do Brasil — vira SALA_ELENCO_GERAL = true.
const SALA_ELENCO_GERAL = false
const SALA_ELENCO_TESTERS = new Set(['diego.c.fonseca@gmail.com'])
let salaElencoOk = SALA_ELENCO_GERAL
function applySalaElencoUnlock(email?: string | null): void {
  const u = SALA_ELENCO_GERAL || (!!email && SALA_ELENCO_TESTERS.has(email.toLowerCase()))
  if (u === salaElencoOk) return
  salaElencoOk = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function salaElencoLiberada(): boolean { return salaElencoOk }
export function useSalaElencoLiberada(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return salaElencoOk
}

// ─── 🏆 LIGA FECHADA — a sala que fica de pé ─────────────────────────────────
// A liga da turma: horário marcado, sempre a MESMA sala (é o que faz o troféu
// acumular), só entra quem é 👑 Lenda ou dono de clube batizado, e o dono manda
// nela (arruma troféu, escreve a regra do ranking).
// 🔒 EM CONSTRUÇÃO (20/08): só a conta do Diego abre — ordem dele, *"quando
// terminar deixe também só pra mim"*. Pra todo mundo a aba aparece APAGADA com
// "em breve", igual a Carreira e o Bafo. Pra liberar geral: LIGA_GERAL = true.
const LIGA_GERAL = false
// 🧪 A 2ª conta do Diego entra aqui pra ele testar a Liga com DOIS usuários ao
// mesmo tempo (22/08): *"vou testar esse usuário c o diego.c.fonseca@gmail.com q
// criou uma sala agora. Aí já quero ver como ele vê tb"*. Repare: ela está SÓ
// aqui, e de propósito NÃO entra na lista de ouro do `apoio.tsx` — assim ela
// ENXERGA a Liga como um jogador comum (sem Lenda) e bate na trava de criar,
// que é exatamente o que ele quer ver.
const LIGA_TESTERS = new Set(['diego.c.fonseca@gmail.com', 'diego.c.fonseca2@gmail.com'])
let ligaOk = LIGA_GERAL
function applyLigaUnlock(email?: string | null): void {
  const u = LIGA_GERAL || (!!email && LIGA_TESTERS.has(email.toLowerCase()))
  if (u === ligaOk) return
  ligaOk = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function ligaLiberada(): boolean { return ligaOk }
export function useLigaLiberada(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return ligaOk
}

// ─── 🏆 TABELA "LIGA FECHADA" na sala RÁPIDA ────────────────────────────────
// Não confundir com o MODO Liga acima (aquele é a sala que fica de pé, com
// horário marcado). Isto aqui é o seletor **Aberta × Liga Fechada** que aparece
// na criação da sala rápida:
//   · 🌍 Aberta       = tabela de 20, os que faltam entram como CPU (como sempre)
//   · 🏆 Liga Fechada = só a galera na tabela, NENHUM bot; a liga tem o tamanho
//                       de vocês (ida e volta) e a Copa destrava com 8+
// Tudo isso já está construído e testado — o que faltava era só APARECER.
// Antes era um `const LIGA_FECHADA_LIBERADA = false` cravado no `lobby.tsx`, que
// escondia o seletor de todo mundo, inclusive do Diego. Agora é trava por CONTA,
// no padrão da casa: ele vê rodando, e abre pra todos quando quiser.
// 🔓 PRA ABRIR PRA TODO MUNDO: LIGA_FECHADA_GERAL = true. É só isso.
// (Criar continua sendo benefício do 👑 Lenda, e a trava de ENTRADA na liga —
// só Lenda ou dono de batismo — já está no `lobby.tsx` e não muda.)
const LIGA_FECHADA_GERAL = false
const LIGA_FECHADA_TESTERS = new Set(['diego.c.fonseca@gmail.com'])
let ligaFechadaOk = LIGA_FECHADA_GERAL
function applyLigaFechadaUnlock(email?: string | null): void {
  const u = LIGA_FECHADA_GERAL || (!!email && LIGA_FECHADA_TESTERS.has(email.toLowerCase()))
  if (u === ligaFechadaOk) return
  ligaFechadaOk = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
// ⚠️ PARADO — NÃO USAR (22/08). Esta trava foi criada por mim pra mostrar o
// seletor "🌍 Aberta × 🏆 Liga Fechada" dentro da sala rápida. Só que esse
// desenho o Diego RECUSOU em 20/08: Liga Fechada é MODO DE JOGO, não detalhe da
// partida (ver o comentarão em `lobby.tsx`). O seletor ficou `false` fixo lá, e
// esta função não é mais chamada por ninguém. Quem for mexer em Liga Fechada
// usa `useLigaLiberada` (o MODO). Deixo aqui, sem uso, só pra ninguém recriar a
// mesma coisa achando que faltava.
export function useLigaFechadaLiberada(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return ligaFechadaOk
}

// ─── 🌎 LIBERTADORES — a terceira opção do "Depois da liga" ──────────────────
// A liga de 20 roda igual; no fim, os 8 primeiros entram numa Libertadores de 32
// (8 grupos de 4 com os clubes do continente, passam 2, mata-mata até a final
// única). Desenho fechado com o Diego em 20/08.
// 🔓 LIBERADO GERAL (20/08): a Libertadores aparece pra TODA CONTA no "Depois
// da liga", online e offline. Ordem do Diego, inclusive DEPOIS do primeiro erro
// que foi pro ar (*"deixa aberto e arruma"*) — o conserto veio no mesmo dia.
// Pra voltar ao teste fechado é LIBERTA_GERAL = false.
const LIBERTA_GERAL = true
const LIBERTA_TESTERS = new Set(['diego.c.fonseca@gmail.com'])
let libertaOk = LIBERTA_GERAL
function applyLibertaUnlock(email?: string | null): void {
  const u = LIBERTA_GERAL || (!!email && LIBERTA_TESTERS.has(email.toLowerCase()))
  if (u === libertaOk) return
  libertaOk = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function libertaLiberada(): boolean { return libertaOk }
export function useLibertaLiberada(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return libertaOk
}

// ─── 🏠 HOME NOVA — a tela de abertura redesenhada ──────────────────────────
// Reclamação do Diego (20/08): *"o visual da home ainda acho que não tá legal,
// ainda acho que tá poluído e desorganizado, e o jogo não está claro as regras"*.
// A home nova é scroll longo com tudo ABERTO e um MENU FIXO no rodapé (ideia
// dele) — assim navegar não depende de rolar de volta, e nada precisa ficar
// escondido atrás de clique.
// 🔓 LIBERADA GERAL (20/08, depois de ele ver rodando na conta dele: *"coloque
// pra todos já verem normal, e não mais só travado pra mim não"*).
// A lista abaixo virou só o plano B: HOME_NOVA_GERAL = false devolve pra teste
// fechado na conta dele, e a home de hoje volta pra todo mundo — num commit.
const HOME_NOVA_GERAL = true
const HOME_NOVA_TESTERS = new Set(['diego.c.fonseca@gmail.com'])
let homeNovaOk = HOME_NOVA_GERAL
function applyHomeNovaUnlock(email?: string | null): void {
  const u = HOME_NOVA_GERAL || (!!email && HOME_NOVA_TESTERS.has(email.toLowerCase()))
  if (u === homeNovaOk) return
  homeNovaOk = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function useHomeNova(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return homeNovaOk
}

// ─── 🪜 BARRA DE BAIXO NA CARREIRA ──────────────────────────────────────────
// Mesma ideia da barra da home, agora na Carreira (mockup
// `scripts/mockup-carreira-barra.mjs`): as 5 abas que já existem — Jogos,
// Tabelas, Elenco, Rank e Clube — saem do meio da página (onde rolam e somem) e
// vão coladas no rodapé; e o cabeçalho preto ganha uma faixa fina que gruda no
// topo quando a pessoa rola, com rodada, posição e caixa.
// ✅ LIBERADA PRA TODOS em 21/08 (o Diego viu rodando na conta dele e aprovou:
// *"acho q ficou bem melhor assim c abas em baixo… publique p todos já"*).
// Pra voltar ao teste fechado é `false` — a Carreira volta com as pílulas no
// meio da página, exatamente como era.
const BARRA_CARR_GERAL = true
const BARRA_CARR_TESTERS = new Set(['diego.c.fonseca@gmail.com'])
let barraCarrOk = BARRA_CARR_GERAL
function applyBarraCarrUnlock(email?: string | null): void {
  const u = BARRA_CARR_GERAL || (!!email && BARRA_CARR_TESTERS.has(email.toLowerCase()))
  if (u === barraCarrOk) return
  barraCarrOk = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function useBarraCarreira(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return barraCarrOk
}

// ─── 🔨 PREGÃO LIMPO (opção 4) ──────────────────────────────────────────────
// O pregão é a ÚNICA tela do jogo com relógio (42s), e hoje ela abre com 4
// quadros de regra antes da primeira carta — cada segundo lendo é um segundo
// sem dar lance. Com isto ligado:
//   · moedas · VAGAS · tempo ficam fixos na barra (não rolam com as cartas);
//   · as regras saem da frente e viram o botão ❓ ao lado do dinheiro;
//   · o quadro do piso some (a carta já mostra "mín 🔒 7") e o do surpresa
//     também (a carta já mostra 🎁 com o nome borrado);
//   · o ensino INTEIRO volta no 1º pregão de CADA CARREIRA (hoje a marca é do
//     aparelho, então quem começa a 2ª carreira não recebe ensino nenhum).
// ⚠️ Mexe na ferida que o Diego apontou ("as pessoas não entendem o leilão"):
// nenhuma regra some, todas ficam a UM toque.
// ✅ LIBERADO PRA TODOS em 21/08 (*"esses daí pode abrir tb p todos"*). Pra
// voltar ao teste fechado é `false` — os 4 quadros de regra voltam pra frente
// das cartas, exatamente como era.
const PREGAO_GERAL = true
const PREGAO_TESTERS = new Set(['diego.c.fonseca@gmail.com'])
let pregaoOk = PREGAO_GERAL
function applyPregaoUnlock(email?: string | null): void {
  const u = PREGAO_GERAL || (!!email && PREGAO_TESTERS.has(email.toLowerCase()))
  if (u === pregaoOk) return
  pregaoOk = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function usePregaoLimpo(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return pregaoOk
}

// ─── 🏆 TELA DE DESFECHO DA TEMPORADA (opção 5) ─────────────────────────────
// Achado que motivou isto: quando a temporada fecha, o CAMPEÃO ganha uma faixa
// dourada de uma linha + a carta; quem SOBE de divisão não ganha NADA e quem
// CAI não ganha NADA — a pessoa descobre olhando a setinha ▲/▼ na tabela. O
// jogo inteiro é uma pirâmide de 5 divisões: subir é a razão de existir do Modo
// Carreira e não tinha momento nenhum.
// Com isto ligado: UMA tela (não uma sequência — a regra do Diego é que nada
// atrasa o ritmo), UM toque, com o desfecho grande, de onde saiu → pra onde vai
// e o que a pessoa levou. Nenhum número/prêmio muda: a tela só CONTA.
// ✅ LIBERADO PRA TODOS em 21/08 (*"esses daí pode abrir tb p todos"*), com o
// aviso dado a ele de que eu NÃO consegui ver a tela rodando numa temporada de
// verdade aqui (o robô não joga 38 rodadas). Pra desligar é `false`.
const FIMTEMP_GERAL = true
const FIMTEMP_TESTERS = new Set(['diego.c.fonseca@gmail.com'])
let fimTempOk = FIMTEMP_GERAL
function applyFimTempUnlock(email?: string | null): void {
  const u = FIMTEMP_GERAL || (!!email && FIMTEMP_TESTERS.has(email.toLowerCase()))
  if (u === fimTempOk) return
  fimTempOk = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function useTelaDesfecho(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return fimTempOk
}

// ─── 📌 SUB-ABAS GRUDADAS (sub-abas · rodada 2, "Ideia 1") ──────────────────
// HISTÓRICO IMPORTANTE PRA NÃO REPETIR ERRO: na 1ª tentativa (21/08) eu troquei
// as pílulas do Clube/Elenco por uma tirinha fina (só texto + sublinhado) e o
// Diego REPROVOU: *"ficou meio apagada… não ficou muito clara onde tá a sub aba.
// Principalmente p quem nunca jogou ainda"*. Ele está certo: pra quem chega
// agora é o PESO (borda grossa, sombra dura, pílula roxa cheia) que diz "isto é
// um botão e você está NESTE".
// Então aqui NADA muda de visual: são as MESMAS pílulas, mesmo tamanho, mesma
// cor, mesma borda, mesma sombra. A única diferença é que elas GRUDAM no topo e
// param de sumir na rolagem — que era o problema real (quem descia até o fim das
// Finanças tinha que rolar tudo de volta pra trocar de sub-aba).
// ✅ Liberado pra todos em 21/08 (*"perfeito pode fazer p todos já tb em relação
// às pílulas"*) e 🔴 DESLIGADO no MESMO dia: o Diego recebeu vídeo de usuário com
// a fileira de pílulas aparecendo NO MEIO da tela do intervalo, por cima da lista
// de jogadores, ao rolar pra cima e pra baixo. Não é o grudar em si que está
// errado — é o `position: sticky` sobrevivendo em cima do BANNER DO INTERVALO,
// que é desenhado ANTES do bloco das abas (linha ~5572 do pyramidseason.tsx) e
// portanto aparece em QUALQUER aba. Com a aba Elenco/Clube aberta, as pílulas
// grudadas ficam boiando sobre o banner.
// Voltar pra `true` só depois de: (1) reproduzir com o banner do intervalo
// aberto, (2) desligar o grudar enquanto banner de intervalo/pênalti/festa está
// na tela. Com `false` fica exatamente como era antes: as pílulas rolam junto
// com o conteúdo e nada boia. Reversível numa linha.
//
// ✅ LIGADO PRA TODOS em 22/08, com o OK do Diego (*"pílula pode fazer sim"*).
// As DUAS condições acima foram cumpridas em 21/08: o bug foi reproduzido num
// navegador de verdade (carreira montada do zero, ficando na aba Elenco até o
// apito dos 45' — só reproduz assim) e o conserto é o `grudaOk = subGrudadas &&
// !sagrado` em `pyramidseason.tsx`: enquanto o banner do intervalo, o do pênalti
// ou a festa de campeão estão na tela, NADA gruda.
// 🩹 De quebra, isto conserta uma promessa furada: a novidade de 21/08 ("Carreira
// com menu embaixo") já dizia à galera que *"dentro do Clube e do Elenco as abas
// de dentro também param de sumir quando você rola"* — e estava desligado pra
// todo mundo. Agora o que está escrito na tela de novidades é verdade. Por isso
// esta entrega NÃO ganha linha nova em `novidades.ts`: ela já tem a dela.
// Pra desligar de novo, se aparecer qualquer coisa estranha: `false` aqui.
const PILULAS_GERAL = true
const PILULAS_TESTERS = new Set(['diego.c.fonseca@gmail.com'])
let pilulasOk = PILULAS_GERAL
function applyPilulasUnlock(email?: string | null): void {
  const u = PILULAS_GERAL || (!!email && PILULAS_TESTERS.has(email.toLowerCase()))
  if (u === pilulasOk) return
  pilulasOk = u
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function useSubAbasGrudadas(): boolean {
  const [, force] = useState(0)
  useEffect(() => onSportChange(() => force(n => n + 1)), [])
  return pilulasOk
}

supabase.auth.getUser().then(({ data }) => { applyUnlock(data?.user?.email); applyTemaUnlock(data?.user?.email); applyAgenciaUnlock(data?.user?.email); applyRevealCinema(data?.user?.email); applyPenTest(data?.user?.email); applyCopaBrasilUnlock(data?.user?.email); applySalaElencoUnlock(data?.user?.email); applyLigaUnlock(data?.user?.email); applyLigaFechadaUnlock(data?.user?.email); applyLibertaUnlock(data?.user?.email); applyHomeNovaUnlock(data?.user?.email); applyBarraCarrUnlock(data?.user?.email); applyPregaoUnlock(data?.user?.email); applyFimTempUnlock(data?.user?.email); applyPilulasUnlock(data?.user?.email) }, () => {})
supabase.auth.onAuthStateChange((_e, s) => { applyUnlock(s?.user?.email); applyTemaUnlock(s?.user?.email); applyAgenciaUnlock(s?.user?.email); applyRevealCinema(s?.user?.email); applyPenTest(s?.user?.email); applyCopaBrasilUnlock(s?.user?.email); applySalaElencoUnlock(s?.user?.email); applyLigaUnlock(s?.user?.email); applyLigaFechadaUnlock(s?.user?.email); applyLibertaUnlock(s?.user?.email); applyHomeNovaUnlock(s?.user?.email); applyBarraCarrUnlock(s?.user?.email); applyPregaoUnlock(s?.user?.email); applyFimTempUnlock(s?.user?.email); applyPilulasUnlock(s?.user?.email) })

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
