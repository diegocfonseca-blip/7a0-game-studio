import { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  EscState, Manager, Card, WonCard, Sector, FormationKey, Tactic, Bid, Division, CareerRival,
  ResolvedCard, LeagueTeam, MatchResult, MatchHighlight, ScorerRow, TieBreak,
  QuickCopaState, QuickCopaTie, LedgerEntry, EmpCard, AgCard, AgEvento,
  EventoAtivo, EventoManchete,
} from './types'
import { SECTORS, FORMATIONS } from './types'
import { mancheteDecisao } from './eventos'
import { CATALOG, CATALOG_EU, CATALOG_BOTH, CATALOG_WORLD, makeIncognita, CLASSIC_CLUBS, DIVISION_TEAMS, VARZEA_TEAMS, EXTRA_D_TEAMS, CRIA_NOMES, newestTeamName } from './data'
import { stripEmoji } from './apoio'
import { buildNbaCatalog, NBA_CLUBS } from './basquete-deck'
import { NBA_SLOTS_PER_POS } from './sportcfg'

// baralho ativo da partida atual (só solo troca): 🇧🇷 Brasileirão ou 🌍 Liga
// Europa. buildDeck e makeBotSquad leem daqui. É setado no início de cada
// partida (START / RESTORE_CAREER / CAREER_ADVANCE) e forçado pra BR no
// online e no Manager, que sempre usam o baralho brasileiro.
let ACTIVE_CATALOG = CATALOG
// 🏀 ESPORTE ATIVO DO MOTOR — mesmo padrão do ACTIVE_CATALOG: 'futebol' por
// padrão; só vira 'basquete' quando um jogo de basquete começa. Guarda a única
// diferença de mecânica (QUANTIDADE de vagas por posição) sem tocar no futebol.
let ACTIVE_SPORT: 'futebol' | 'basquete' = 'futebol'
let NBA_BASE_SLOTS = 1 // vagas por posição no basquete: 1 (rápido) ou 2 (carreira)
// 'world' = baralho "Resto do Mundo" (dormente — ainda sem seletor na UI).
// TODO caminho de FUTEBOL passa por aqui → reancora o esporte pra futebol.
// 🥅 VÁRZEA ("Sem craques" — categoria do rápido online no baralho BR): tira
// lenda (fame 5), craque (fame 4) e promessa do baralho. Sobra só BOM JOGADOR
// (fame 2/3) + FOI PROFISSIONAL (fame 1) — todo mundo no mesmo nível, peladão.
function filterVarzea(cat: typeof CATALOG): typeof CATALOG {
  const out = {} as typeof CATALOG
  for (const pos of SECTORS) out[pos] = (cat[pos] || []).filter(c => c.fame <= 3 && !c.promessa)
  return out
}
// 🌍 baralho TODOS (carreira, teste do Diego): Brasileirão + Europa + Mundo juntos
// (~850 auges). Dedup por auge (nome+clube+ano) — os do Mundo que já existem no
// both não entram duas vezes.
let CATALOG_TODOS_CACHE: typeof CATALOG | null = null
export function catalogTodos(): typeof CATALOG {
  if (!CATALOG_TODOS_CACHE) {
    const out = {} as typeof CATALOG
    for (const pos of SECTORS) {
      const seen = new Set<string>()
      out[pos] = [...(CATALOG_BOTH[pos] ?? []), ...(CATALOG_WORLD[pos] ?? [])].filter(c => {
        const k = `${c.name}|${c.club}|${c.year}`
        if (seen.has(k)) return false
        seen.add(k); return true
      })
    }
    CATALOG_TODOS_CACHE = out
  }
  return CATALOG_TODOS_CACHE
}
function setActiveCatalog(league: 'br' | 'eu' | 'both' | 'todos' | 'world' | 'todos' | undefined, varzea = false) {
  ACTIVE_SPORT = 'futebol'
  const base = league === 'eu' ? CATALOG_EU : league === 'both' ? CATALOG_BOTH : league === 'world' ? CATALOG_WORLD : league === 'todos' ? catalogTodos() : CATALOG
  ACTIVE_CATALOG = varzea ? filterVarzea(base) : base
}
// liga o motor no basquete: baralho NBA + vagas por posição do modo (rápido/carreira).
function setActiveSport(sport: 'futebol' | 'basquete', mode: 'quick' | 'career' = 'quick') {
  ACTIVE_SPORT = sport
  if (sport === 'basquete') {
    ACTIVE_CATALOG = buildNbaCatalog() as unknown as typeof CATALOG
    NBA_BASE_SLOTS = NBA_SLOTS_PER_POS[mode]
  }
}
// vagas-base por posição: no futebol vem da FORMAÇÃO; no basquete é o padrão do
// modo (toda posição igual). É o único ponto onde a QUANTIDADE muda por esporte.
function baseSlots(formation: FormationKey, pos: Sector): number {
  return ACTIVE_SPORT === 'basquete' ? NBA_BASE_SLOTS : FORMATIONS[formation][pos]
}

// 🏀 franquias da NBA usadas como rivais CPU do basquete (o motor lê {team,name}
// igual aos times do futebol; aqui o nome do "técnico" é a própria franquia).
const NBA_TEAMS: { team: string; name: string }[] = [
  'Lakers', 'Celtics', 'Bulls', 'Warriors', 'Heat', 'Spurs', 'Knicks', 'Nets',
  'Bucks', 'Suns', 'Nuggets', 'Mavericks', 'Clippers', 'Sixers', 'Raptors', 'Grizzlies',
].map(t => ({ team: t, name: t }))
// 💰 orçamento do RÁPIDO do basquete: 50 moedas (5 jogadores = ~10/jogador, o
// mesmo equilíbrio do futebol, que dá 100 pra 11). Na carreira (10 jogadores)
// será ~100, como o futebol.
const NBA_QUICK_BUDGET = 50
// 💰 orçamento inicial da CARREIRA do basquete (Street League): 50 moedas p/ o
// QUINTETO (5, 1 por posição) — ~10/jogador, MESMO equilíbrio do futebol. Nas
// temporadas seguintes o leilão de reservas dá mais caixa pra encher rotação/elenco.
const NBA_CAREER_BUDGET = 50
// 💰 orçamento do leilão de RESERVAS (T2+): 50 moedas pra encher as 5 vagas novas
// do banco (a rotação). Você mantém o quinteto e só compra os reservas.
const NBA_RESERVE_BUDGET = 50
// 🛝 times da STREET LEAGUE (a base amadora = streetball): 20 CREWS DE QUADRA DE
// RUA — NÃO franquias da NBA (essas ficam pro topo da pirâmide, a NBA de verdade).
// É o espelho da Série D do futebol (times de várzea, não Flamengo/Palmeiras).
const NBA_STREET_TEAMS: { team: string; name: string }[] = [
  'Rucker Kings', 'Dyckman Ballers', 'Blacktop Kings', 'Concrete Jungle', 'Asphalt Assassins',
  'Ankle Breakers', 'Rim Rockers', 'Crossover Kingz', 'Downtown Ballers', 'Cage Fighters',
  'Uptown Hustlers', 'Halfcourt Heroes', 'Sidewalk Slammers', 'Backboard Bullies', 'And-One Army',
  'Streetball Souljahs', 'Playground Legends', 'Chain Gang', 'Buckets Crew', 'Venice Ballers',
].map(t => ({ team: t, name: t }))
// 🔷 G LEAGUE — afiliados REAIS da liga de desenvolvimento da NBA (o meio da
// pirâmide). 24 times. É o degrau entre a várzea (Street) e a elite (NBA).
const NBA_GLEAGUE_TEAMS: { team: string; name: string }[] = [
  'Ignite', 'Blue Coats', 'Vipers', 'Skyforce', 'Maine Celtics', 'Mad Ants', 'Herd', 'Swarm',
  'Texas Legends', 'SLC Stars', 'Windy City Bulls', 'Skyhawks', 'Grand Rapids Gold', 'Iowa Wolves',
  'Long Island Nets', 'Memphis Hustle', 'OKC Blue', 'Osceola Magic', 'Raptors 905', 'Santa Cruz Warriors',
  'South Bay Lakers', 'Stockton Kings', 'Westchester Knicks', 'Cleveland Charge',
].map(t => ({ team: t, name: t }))
// 💍 NBA — as 30 franquias REAIS (o topo da pirâmide, onde mora a elite).
const NBA_PRO_TEAMS: { team: string; name: string }[] = [
  'Lakers', 'Celtics', 'Bulls', 'Warriors', 'Heat', 'Spurs', 'Knicks', 'Nets', 'Bucks', 'Suns',
  'Nuggets', 'Mavericks', 'Clippers', 'Sixers', 'Raptors', 'Grizzlies', 'Kings', 'Magic', 'Pistons',
  'Hornets', 'Hawks', 'Cavaliers', 'Pacers', 'Thunder', 'Trail Blazers', 'Jazz', 'Pelicans', 'Wizards',
  'Rockets', 'Timberwolves',
].map(t => ({ team: t, name: t }))
// 🪜 os 3 andares da pirâmide do basquete: times + rótulo. Subir de andar = novos
// adversários (crews → afiliados → franquias) e um passo mais perto do anel.
type NbaTier = 'street' | 'gleague' | 'nba'
const NBA_TIERS: Record<NbaTier, { teams: { team: string; name: string }[]; labelPt: string; labelEn: string; next: NbaTier | null }> = {
  street: { teams: NBA_STREET_TEAMS, labelPt: '🛝 Street League', labelEn: '🛝 Street League', next: 'gleague' },
  gleague: { teams: NBA_GLEAGUE_TEAMS, labelPt: '🔷 G League', labelEn: '🔷 G League', next: 'nba' },
  nba: { teams: NBA_PRO_TEAMS, labelPt: '💍 NBA', labelEn: '💍 NBA', next: null },
}
// soma as moedas da temporada (base+título/acesso/queda) na caixa de cada técnico
function applyRewards(coins: Record<number, number> | undefined, rewards?: Record<number, number>): Record<number, number> {
  const out = { ...(coins ?? {}) }
  for (const id in (rewards ?? {})) out[+id] = (out[+id] ?? 0) + (rewards as Record<number, number>)[+id]
  return out
}
// clube-sentinela dos fillers "perna-de-pau" (tampa-buraco, não colecionável, sem
// salário): 'Várzea' no futebol, 'Pickup' no basquete (Street League). Mesmo papel.
export const isFillerClub = (club: string): boolean => club === 'Várzea' || club === 'Pickup'
// 💸 SALÁRIO de um jogador = piso (paid) ÷ 10, arredondado. Incógnita (fake/Várzea)
// não tem salário. É o MESMO número mostrado no elenco (💰 paid), pra bater certinho.
export function salaryOfCard(c: WonCard): number {
  // 🏢 EMPRÉSTIMO da SAF (nos dois sentidos) NÃO paga salário: o que você pegou
  // emprestado não é seu, e o que você emprestou já saiu do seu elenco. Incógnita
  // (fake/Várzea) também não tem salário.
  if (c.fake || isFillerClub(c.club) || c.emprestado) return 0
  return Math.round((c.paid ?? 0) / 10)
}
export function squadPayroll(squad: WonCard[]): number {
  let f = 0; for (const c of squad) f += salaryOfCard(c); return f
}
// 💸 FOLHA no VIRA-TEMPORADA: cada técnico HUMANO paga a folha do elenco que JOGOU
// a temporada. Roda ANTES do leilão/venda — então quem for contratado agora só entra
// na folha no ano que vem (nunca cobra salário de quem você acabou de contratar).
// Cobra SEMPRE a folha REAL do elenco (nunca capa o valor): se a caixa não cobrir,
// ela fica NEGATIVA (dívida). Assim o número da folha no Extrato bate certinho com o
// elenco — só muda quando o time muda. Gastar (contratar/investir) fica bloqueado
// enquanto a caixa estiver no vermelho. Só humanos pagam da careerCoins.
function chargeSalaries(s: EscState) {
  // 🔓 só a partir da 4ª temporada (fôlego: T1 monta o time, T2 reservas, T3 vender).
  // Roda ANTES do seasonNo++, então s.seasonNo aqui = a temporada que ACABOU de rolar.
  if (!s.careerOnline || (s.seasonNo ?? 1) < 4) return
  const cc = { ...(s.careerCoins ?? {}) }
  for (const m of s.managers) {
    if (!m.isHuman) continue
    const folha = squadPayroll(m.squad as WonCard[])
    if (folha > 0) cc[m.id] = (cc[m.id] ?? 0) - folha // folha REAL, pode negativar (dívida)
  }
  s.careerCoins = cc
}
// 🧾 LIVRO-CAIXA (carreira SOLO): registra um lançamento no extrato. É SÓ pra
// exibição — NUNCA realimenta o caixa de verdade. Ignora o online (lá não tem a
// aba Finanças) e valor 0. Guarda as últimas ~250 entradas.
function logFin(s: EscState, kind: LedgerEntry['kind'], label: string, amount: number, extra?: Partial<LedgerEntry>, mgrId?: number, force?: boolean) {
  // por padrão não registra linha de valor 0 (evita lixo no extrato de venda/monte
  // etc.). `force` = registra mesmo em 0 — usado no RESUMO DE FIM DE TEMPORADA, pra
  // o quadro completo (prêmios do time, prêmios da SAF, bilheteria, patrocínio,
  // folha, empresário) aparecer SEMPRE na tela quando a temporada acaba.
  if (!amount && !force) return
  const e: LedgerEntry = { id: Math.random().toString(36).slice(2), season: s.seasonNo ?? 1, kind, label, amount, ...extra }
  if (s.onlineMode === 'online') {
    // 🧾 ONLINE: livro-caixa POR TÉCNICO (careerLedgers[mgrId]). Sem mgrId, cai no local.
    const id = mgrId ?? s.managers[s.youIdx]?.id ?? s.youIdx
    const ls = (s.careerLedgers = s.careerLedgers ?? {})
    const arr = (ls[id] = ls[id] ?? [])
    arr.push(e)
    if (arr.length > 250) ls[id] = arr.slice(-250)
    return
  }
  // 🏛️ MULTICLUBES: lançamento do clube que está DORMINDO vai pro extrato DELE
  // (guardado no stash) — quando o dono trocar de clube, o Extrato mostra tudo o
  // que aconteceu enquanto ele dormia (prêmios, bilheteria, folha…), sem misturar.
  if (s.multiClube && mgrId != null && mgrId === s.multiClube.id) {
    const led = (s.multiClube.ledger = s.multiClube.ledger ?? [])
    led.push(e)
    if (led.length > 250) s.multiClube.ledger = led.slice(-250)
    return
  }
  const arr = (s.careerLedger = s.careerLedger ?? [])
  arr.push(e)
  if (arr.length > 250) s.careerLedger = arr.slice(-250)
}
// 🕴️ AGÊNCIA 2.0 · chave estável de uma carta do álbum (auge = nome+clube+ano)
const agKey = (c: { name: string; club?: string; year?: number }) => `${c.name}|${c.club ?? ''}|${c.year ?? ''}`
// 🕴️ AGÊNCIA 2.0 · TRANSAÇÃO de agenciado no leilão/monte: o agente (você) fatura
// +1 na hora, direto no caixa do 1º CLUBE (decisão do Diego). Se o 1º clube é o
// ATIVO, entra no dinheiro do leilão (m.money — o write-back da Cerimônia leva);
// se está DORMINDO, cai na caixa dele (extrato roteado pro stash pelo logFin).
// O evento entra na fatura pra aparecer na Cerimônia. Só carreira solo NOVA.
function agenciaTransacao(s: EscState, card: { name: string; club?: string; year?: number }) {
  if (!s.agenciaOn || !agenciaLiberada()) return // 🔒 por enquanto só a conta do Diego
  const ag = (s.agenciados ?? []).find(a => a.name === card.name)
  if (!ag) return
  const active = s.managers[s.youIdx]?.id
  // 🤝 no modo DIVIDIR, a comissão de negociação (1 🪙) não tem como rachar:
  // fica com o clube NO COMANDO (mesma regra da moeda ímpar da virada)
  const dest = (s.agenciaDividir && s.multiClube) ? (active ?? 0) : (s.agenciaClubeId ?? active ?? 0)
  if (dest === active) { const m = s.managers[s.youIdx]; if (m) m.money += 1 }
  else s.careerCoins = { ...(s.careerCoins ?? {}), [dest]: (s.careerCoins?.[dest] ?? 0) + 1 }
  logFin(s, 'empresario', `🕴️ Comissão de agente: ${card.name} negociado`, 1, { player: card.name }, dest)
  const fat = (s.agenciaFatura && s.agenciaFatura.season === (s.seasonNo ?? 1))
    ? s.agenciaFatura
    : (s.agenciaFatura = { season: s.seasonNo ?? 1, mensal: 0, rows: [], total: 0 })
  fat.rows.push({ emoji: '💸', texto: `${card.name} foi negociado no leilão`, coins: 1, nome: ag.name })
  fat.total += 1
  s.agenciaHist = { ...(s.agenciaHist ?? {}), [agKey(ag)]: (s.agenciaHist?.[agKey(ag)] ?? 0) + 1 }
}
// 🕴️ qual estádio a agência usa pros destraves/renda: o do clube escolhido no
// toggle — e no modo 🤝 DIVIDIR, o que RENDE MAIS dos dois (você construiu, vale).
export function agenciaEstadio(s: EscState): NonNullable<EscState['stadiums']>[number] | undefined {
  const y = s.managers[s.youIdx]?.id ?? 0
  const dorm = s.multiClube?.id
  if (s.agenciaDividir && dorm != null) {
    const a = s.stadiums?.[y], b = s.stadiums?.[dorm]
    const ra = agenciaRenda(s.agenciados ?? [], a, !!s.careerFilial).total
    const rb = agenciaRenda(s.agenciados ?? [], b, !!s.careerFilial).total
    return rb > ra ? b : a
  }
  return s.stadiums?.[s.agenciaClubeId ?? y]
}
// 🪜 ESCADA · marco da carreira: subiu da divisão de estreia (Várzea) → virou
// profissional (persiste mesmo caindo depois); chamado logo após aplicar as
// colocações novas da temporada. Solo apenas (escadaOn não existe no online).
function escadaAfterPlacements(s: EscState) {
  if (!s.escadaOn || s.escadaSubiu) return
  const y = s.managers[s.youIdx]?.id ?? 0
  const d = s.careerPlacements?.[`m${y}`]
  if (d && d !== 'V') {
    s.escadaSubiu = true
    ;(s.marketLog = s.marketLog ?? []).push('🪜 SUBIU pra Série D! Agora é profissional — o mercado sobe junto: categoria melhor entra no pregão. 🔓')
  }
}
// 💰 VIRA-TEMPORADA: aplica prêmios + bilheteria + folha na caixa do técnico e
// REGISTRA cada um no extrato pela VARIAÇÃO REAL da caixa do humano. Mantém a
// mesma ordem/efeito de antes (prêmios → bilheteria → folha) — só soma o registro.
function applySeasonMoney(s: EscState, rewards?: Record<number, number>) {
  // 🔒 UMA VEZ POR TEMPORADA: o fechamento acontece assim que a temporada (liga +
  // copas) termina. Se já foi lançado, qualquer chamada depois (abrir o leilão,
  // refazer o leilão) NÃO repete nada — o caixa nunca é creditado duas vezes.
  if (s.booksSeason === (s.seasonNo ?? 1)) return
  s.booksSeason = s.seasonNo ?? 1
  const online = s.onlineMode === 'online'
  const humans = s.managers.filter(m => m.isHuman)
  // snapshot da caixa de cada humano — pra registrar o extrato pela VARIAÇÃO REAL
  const snap = (): Record<number, number> => { const o: Record<number, number> = {}; for (const h of humans) o[h.id] = s.careerCoins?.[h.id] ?? 0; return o }
  const y = s.managers[s.youIdx]?.id ?? s.youIdx
  // 🪜 ESCADA: conta temporadas COMPLETAS jogadas na Série A — com 2, o mercado
  // LIBERA geral pra sempre (vira o jogo normal). Placements aqui ainda são os
  // da temporada que acabou de ser jogada.
  if (!online && s.escadaOn && !s.escadaLivre) {
    const played = s.careerPlacements?.[`m${y}`]
    if (played === 'A') {
      s.escadaTempA = (s.escadaTempA ?? 0) + 1
      if ((s.escadaTempA ?? 0) >= 2) {
        s.escadaLivre = true
        ;(s.marketLog = s.marketLog ?? []).push('🔓 MERCADO LIBERADO! Duas temporadas na elite — o leilão agora mistura TODAS as categorias, como sempre foi. Bem-vindo ao mercado grande. 🍾')
      } else {
        ;(s.marketLog = s.marketLog ?? []).push('🪜 Primeira temporada na Série A concluída — mais UMA e o mercado libera todas as categorias! 👀')
      }
    }
  }
  const s0 = snap()
  s.careerCoins = applyRewards(s.careerCoins, rewards)
  const s1 = snap()
  s.careerCoins = applyStadiumIncome(s.careerCoins, s.stadiums, s.managers)
  const s2 = snap()
  chargeSalaries(s)
  const s3 = snap()
  // 🏛️ MULTICLUBES (solo): o clube DORMINDO também é independente — recebe o
  // patrocínio e a renda do empresário DELE (dados guardados no stash) na caixa
  // DELE, como se estivesse ativo. Sem isso, dormir = deixar de faturar.
  const dorm = (!online && s.multiClube && s.multiClube.id !== y) ? s.multiClube.id : null
  // 👕 PATROCÍNIO: renda por divisão da temporada (Série D = 0). Por técnico.
  if (!online) {
    const div = s.careerPlacements?.[`m${y}`]
    const spay = div ? (SPONSOR_PAY[div] ?? 0) : 0
    if (spay > 0) s.careerCoins = { ...s.careerCoins, [y]: (s.careerCoins[y] ?? 0) + spay }
    if (dorm != null) {
      const divD = s.careerPlacements?.[`m${dorm}`]
      const spayD = divD ? (SPONSOR_PAY[divD] ?? 0) : 0
      if (spayD > 0) s.careerCoins = { ...s.careerCoins, [dorm]: (s.careerCoins[dorm] ?? 0) + spayD }
    }
  } else {
    for (const h of humans) {
      const div = s.careerPlacements?.[`m${h.id}`]
      const spay = div ? (SPONSOR_PAY[div] ?? 0) : 0
      if (spay > 0) s.careerCoins = { ...(s.careerCoins ?? {}), [h.id]: (s.careerCoins?.[h.id] ?? 0) + spay }
    }
  }
  const s4 = snap()
  // 💼 EMPRESÁRIO: renda das cartas ganhas (categorias destravam com estádio/SAF).
  // Offline: careerFilial + empresarioCards. Online: por técnico (Passo 2c).
  // 🕴️ AGÊNCIA 2.0 (carreira solo NOVA): troca o empresário clássico pelos 22
  // "na ativa" — mensalidades por categoria (lenda 5 + folclórico +1) e comissões
  // de eventos (artilheiro/campeão, acumulados em agenciaEventos). Tudo cai no
  // caixa do 1º CLUBE (agenciaClubeId), mesmo que ele esteja dormindo.
  if (!online && s.agenciaOn && agenciaLiberada()) { // 🔒 por enquanto só a conta do Diego
    // 🧹 saneia a ativa: só carta do cofre DESTA carreira rende (remove convocação
    // antiga feita quando a tela puxava o álbum global — bug corrigido 04/08)
    const cofreA = new Set([...(s.empresarioCards ?? []), ...(s.multiClube?.empresario ?? [])].map(c => `${c.name}|${c.club}|${c.year}`))
    if ((s.agenciados ?? []).some(a => !cofreA.has(`${a.name}|${a.club}|${a.year}`))) s.agenciados = (s.agenciados ?? []).filter(a => cofreA.has(`${a.name}|${a.club}|${a.year}`))
    const dest = s.agenciaClubeId ?? y
    // 🤝 DIVIDIR (toggle, Diego 04/08): renda meio a meio entre os 2 clubes —
    // moeda ímpar fica com o clube NO COMANDO. A agência usa o estádio que
    // rende mais dos dois (agenciaEstadio). Cada metade cai no extrato certo
    // sozinha (as linhas da virada são calculadas por variação de caixa por id).
    const dividir = !!s.agenciaDividir && dorm != null
    const paga = (valor: number) => {
      if (valor <= 0) return
      if (dividir && dorm != null) {
        const meuLado = Math.ceil(valor / 2)
        s.careerCoins = { ...(s.careerCoins ?? {}), [y]: (s.careerCoins?.[y] ?? 0) + meuLado, [dorm]: (s.careerCoins?.[dorm] ?? 0) + (valor - meuLado) }
      } else s.careerCoins = { ...(s.careerCoins ?? {}), [dest]: (s.careerCoins?.[dest] ?? 0) + valor }
    }
    const renda = agenciaRenda(s.agenciados, dividir ? agenciaEstadio(s) : s.stadiums?.[dest], !!s.careerFilial)
    paga(renda.total)
    // histórico por carta ("já te rendeu X"): mensalidade de quem rendeu de fato
    if (renda.total > 0) {
      const hist = { ...(s.agenciaHist ?? {}) }
      for (const c of s.agenciados ?? []) {
        const cat = empCat(c)
        if (!renda.by[cat]?.unlocked) continue
        hist[agKey(c)] = (hist[agKey(c)] ?? 0) + renda.by[cat].value + (c.folk ? AG_FOLK_BONUS : 0)
      }
      s.agenciaHist = hist
    }
    const s45 = snap()
    // comissões pendentes da temporada que acabou (artilheiro/campeão)
    const evs = (s.agenciaEventos && s.agenciaEventos.season === (s.seasonNo ?? 1)) ? s.agenciaEventos.rows : []
    const com = evs.reduce((n, e) => n + e.coins, 0)
    if (com > 0) {
      paga(com) // 🤝 comissões também dividem (ou vão inteiras pro clube do toggle)
      const hist = { ...(s.agenciaHist ?? {}) }
      for (const e of evs) { const ag = (s.agenciados ?? []).find(a => a.name === e.nome); if (ag) hist[agKey(ag)] = (hist[agKey(ag)] ?? 0) + e.coins }
      s.agenciaHist = hist
    }
    // fatura NOVA da virada — as transações do leilão que vem aí somam nela depois.
    // ⚠️ o leilão roda já com o seasonNo INCREMENTADO (a virada acontece antes),
    // então a fatura é carimbada com a temporada NOVA — senão a transação criava
    // uma fatura vazia por cima e a Cerimônia perdia mensalidades/eventos.
    s.agenciaFatura = { season: (s.seasonNo ?? 1) + 1, mensal: renda.total, rows: evs, total: renda.total + com }
    s.agenciaEventos = undefined
    const s5 = snap()
    const rows: [LedgerEntry['kind'], string][] = [['reward', '🏆 Prêmios da temporada'], ['gate', '🎟️ Bilheteria'], ['salary', '💸 Folha salarial'], ['sponsor', '👕 Patrocínio'], ['empresario', '🕴️ Agência — mensalidades (na ativa)'], ['empresario', '🕴️ Agência — comissões (artilheiro/campeão)']]
    const steps = [s0, s1, s2, s3, s4, s45, s5]
    const ids = dorm != null ? [y, dorm] : [y]
    for (const id of ids) for (let i = 0; i < rows.length; i++) logFin(s, rows[i][0], rows[i][1], (steps[i + 1][id] ?? 0) - (steps[i][id] ?? 0), undefined, id, true)
    return
  }
  if (!online) {
    const maduras = (s.empresarioCards ?? []).filter(c => (c.season ?? 0) < (s.seasonNo ?? 1))
    const inc = empresarioIncome(maduras, s.stadiums?.[y], !!s.careerFilial).total
    if (inc > 0) s.careerCoins = { ...s.careerCoins, [y]: (s.careerCoins[y] ?? 0) + inc }
    if (dorm != null) {
      // agência do clube dormindo mora no stash; estádio é o DELE; SAF é compartilhada
      const madurasD = (s.multiClube?.empresario ?? []).filter(c => (c.season ?? 0) < (s.seasonNo ?? 1))
      const incD = empresarioIncome(madurasD, s.stadiums?.[dorm], !!s.careerFilial).total
      if (incD > 0) s.careerCoins = { ...s.careerCoins, [dorm]: (s.careerCoins[dorm] ?? 0) + incD }
    }
  } else {
    for (const h of humans) {
      const maduras = (s.careerEmpresario?.[h.id] ?? []).filter(c => (c.season ?? 0) < (s.seasonNo ?? 1))
      const inc = empresarioIncome(maduras, s.stadiums?.[h.id], !!s.careerFilials?.[h.id]).total
      if (inc > 0) s.careerCoins = { ...(s.careerCoins ?? {}), [h.id]: (s.careerCoins?.[h.id] ?? 0) + inc }
    }
  }
  const s5 = snap()
  // 🧾 extrato pela variação real. Offline: só o humano (y). Online: cada um no seu.
  const rows: [LedgerEntry['kind'], string][] = [['reward', '🏆 Prêmios da temporada'], ['gate', '🎟️ Bilheteria'], ['salary', '💸 Folha salarial'], ['sponsor', '👕 Patrocínio'], ['empresario', '💼 Renda do Empresário']]
  const steps = [s0, s1, s2, s3, s4, s5]
  // 🏛️ solo com 2º clube: o DORMINDO também ganha o resumo — o logFin roteia as
  // linhas dele pro extrato guardado no stash (aparecem quando ele voltar ao comando)
  const ids = online ? humans.map(h => h.id) : (dorm != null ? [y, dorm] : [y])
  // `force` = todas as 5 linhas do fim de temporada aparecem SEMPRE (mesmo 0), pra o
  // técnico ver o quadro financeiro completo assim que a temporada acaba.
  for (const id of ids) for (let i = 0; i < rows.length; i++) logFin(s, rows[i][0], rows[i][1], (steps[i + 1][id] ?? 0) - (steps[i][id] ?? 0), undefined, id, true)
}
// caixa dos OUTROS times (por teamKey string), nunca negativo — soma título/acesso, tira queda
function applyClubRewards(cash: Record<string, number> | undefined, rewards?: Record<string, number>): Record<string, number> {
  const out = { ...(cash ?? {}) }
  for (const k in (rewards ?? {})) out[k] = Math.max(0, (out[k] ?? 0) + (rewards as Record<string, number>)[k])
  return out
}
// caixa-base por divisão (clubes de cima mais ricos) + os LUCROS das vendas do
// mercado (persistidos no fim de cada leilão) + prêmios de título/acesso. Assim o
// caixa é a base da divisão MAIS a história real de transações.
const DIV_BASE_CASH: Record<string, number> = { A: 230, B: 190, C: 150, D: 100 }
// monta o clubCash a partir da colocação (teamKey → divisão): todo time ganha a
// base da divisão dele. Só cria quem ainda não tem (não zera quem já acumulou).
function seedClubCash(cash: Record<string, number>, placements: Record<string, string> | null | undefined): Record<string, number> {
  const out = { ...cash }
  for (const [k, d] of Object.entries(placements ?? {})) if (out[k] == null) out[k] = DIV_BASE_CASH[d] ?? 100
  return out
}
type Honors = { A: number; B: number; C: number; D: number; V?: number }
// credita +1 título na divisão que cada time foi campeão nesta temporada
function applyHonors(honors: Record<string, Honors> | undefined, champions?: Record<string, 'A' | 'B' | 'C' | 'D' | 'V'>): Record<string, Honors> {
  const out: Record<string, Honors> = { ...(honors ?? {}) }
  for (const key in (champions ?? {})) {
    const div = (champions as Record<string, 'A' | 'B' | 'C' | 'D' | 'V'>)[key]
    const cur = out[key] ?? { A: 0, B: 0, C: 0, D: 0 }
    out[key] = { ...cur, [div]: (cur[div] ?? 0) + 1 }
  }
  return out
}
// 🏛️ MULTICLUBES · guarda a carta do clube que DORMIA quando ele foi campeão nesta
// temporada (título de divisão e/ou Copa Legends). Chamado no fim de temporada, ANTES
// do seasonNo++. Keyed pelo id do clube (já separado do ativo). Ao passar o comando pra
// ele, o pacote aparece pra você abrir. NÃO faz nada fora do solo com 2º clube.
function recordDormantCards(s: EscState, champions?: Record<string, 'A' | 'B' | 'C' | 'D' | 'V'>, copaChampion?: string | null) {
  if (!s.multiClube) return
  // 🛡️ fantasma: se o "dormindo" é o próprio clube ATIVO (contaminação de carreira
  // anterior), não fabrica pacote nenhum — o título ativo já dá a carta normal.
  if (s.multiClube.id === (s.managers[s.youIdx]?.id ?? -1)) return
  const dk = `m${s.multiClube.id}` // teamKey do clube que dorme (managed → m{id})
  const wonDiv = !!(champions && champions[dk])
  const wonCopa = copaChampion === dk
  if (!wonDiv && !wonCopa) return
  const pend = { ...(s.multiClubePendingCards ?? {}) }
  const arr = [...(pend[s.multiClube.id] ?? [])]
  if (wonDiv) arr.push({ season: s.seasonNo }) // carta do título de divisão
  if (wonCopa) arr.push({ season: s.seasonNo, copa: true }) // carta da Copa Legends (à parte)
  pend[s.multiClube.id] = arr
  s.multiClubePendingCards = pend
}
// 🏟️ bilheteria: soma a renda do estádio de cada técnico HUMANO no caixa (fim de
// temporada). Inclui a BILHETERIA-BASE (stadiumIncome vale mesmo sem estádio), então
// dá pra render pra quem nunca abriu a tela do estádio também. Bots não têm estádio
// (usam clubCash), então só os humanos ganham aqui.
function applyStadiumIncome(coins: Record<number, number> | undefined, stads: EscState['stadiums'], managers: Manager[]): Record<number, number> {
  const out = { ...(coins ?? {}) }
  for (const m of managers) {
    if (!m.isHuman) continue
    const inc = stadiumIncome(stads?.[m.id]) // base + construído
    if (inc > 0) out[m.id] = (out[m.id] ?? 0) + inc
  }
  return out
}
import type { CareerTeam } from './data'
import { STADIUM_STEP, STADIUM_SECTORS, STADIUM_EXTRAS, extraUnlocked, stadiumIncome, emptyStadium, sectorPct, hasExtra, SPONSOR_PAY, empresarioIncome, agenciaRenda, AG_FOLK_BONUS, empCat } from './estadiodata'
import { supabase } from '../lib/supabase'
import { agenciaLiberada, escadaLiberada } from './sport'
import { logPlay, logVisit, heartbeat } from './analytics'
import { pack, unpack } from './netpack'

export const START_MONEY = 100
// 🎮 "geração" da carreira solo: carreiras iniciadas a partir da cobrança do
// Modo Manual recebem este selo. Save SEM o selo = carreira antiga → manual
// liberado pra sempre (nunca cobramos de quem já estava jogando).
export const MANUAL_ERA = 1
const LEAGUE_SIZE = 20
const TOTAL_ROUNDS = 38

// ─── RNG com seed (reprodutível dentro da partida) ───────────────────
function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h >>> 0
}
// embaralhador JUSTO (Fisher-Yates). O antigo `sort(() => rng()-0.5)` é
// viciado — deixava as cartas do começo da lista (ex.: Pelé) aparecerem
// bem mais que as outras. Com isso todas as lendas têm chance igual.
// IDENTIDADE de um jogador = nome+CLUBE (ignora o ano). Um jogador é ÚNICO por time
// no jogo: nunca pode aparecer duas cartas do mesmo jogador no mesmo clube na mesma
// partida. Vini Jr Flamengo e Vini Jr Real Madrid seguem sendo DIFERENTES (clubes
// distintos). O ano ficava na chave e deixava um save antigo (ex.: Yamal/Barcelona
// 2024 guardado num elenco) conviver com a versão nova do catálogo (2025) como se
// fossem cartas diferentes — bug dos dois Yamal. Tirar o ano resolve de vez.
const ident = (c: { name: string; club: string }) => `${c.name}|${c.club}`
// 🔄 RODÍZIO DO LEILÃO: memória das cartas que caíram na leva ANTERIOR (só idents).
// A montagem do baralho joga essas pro fim do catálogo, então elas têm menos chance
// de voltar já na próxima temporada — dá mais variedade. NÃO mexe nas % de raridade
// (só muda QUAIS cartas preenchem cada cota). Quando as "não-recentes" acabam, elas
// voltam a entrar (repetir de vez tá ok). Vive no módulo (o host monta o baralho no
// online e transmite pronto; o guest não remonta, então não desincroniza).
let RECENT_DECK = new Set<string>()
// 🧹 PENEIRA FINAL anti-duplicata do baralho do leilão: por mais que cada fonte
// (mercado, listados, sobras, fichas de fundo) já tente não repetir, uma cópia do
// MESMO jogador real (nome+clube) pode escapar por uma brecha — ou vir de um save
// antigo que já carregava a duplicata. Isto varre o baralho na hora de abrir o
// leilão e tira o repetido (mantém o 1º). Incógnitos (fake/várzea) NÃO são
// mexidos (cada um é um jogador distinto). Foi assim que o "dois Van der Sar" no
// mesmo leilão (um num time, outro solto na sobra) sumia de vez.
function dedupeDeck(deck: Record<Sector, Card[]>) {
  for (const pos of SECTORS) {
    if (!deck[pos]) continue
    const seen = new Set<string>()
    deck[pos] = deck[pos].filter(c => {
      if (c.fake) return true // incógnito: não tem identidade real, cada um é único
      const k = ident(c)
      if (seen.has(k)) return false // já apareceu esse jogador → tira a cópia
      seen.add(k); return true
    })
  }
}
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
// filler de várzea (perna-de-pau): tampa vaga quando não há jogador real. Nível
// baixo. Usado pra manter os times de fundo em 11 quando perdem e não repõem.
const FIL_NAMES = ['Perna-de-pau', 'Ferro Velho', 'Pé de Anjo', 'Canela Seca', 'Zé Ninguém', 'Trapalhão', 'Bola Murcha', 'Meia-Boca']
// 🏀 pernas-de-pau do basquete (só o basquete usa): tijolo puro de quadra de
// rua. Espelha a várzea do futebol; nunca aparece no futebol (guarda por esporte).
const FIL_NAMES_NBA = ['Brick', 'Air Ball', 'Turnstile', 'Benchwarmer', 'Water Boy', 'Ball Hog', 'Bricklayer', 'Practice Squad']
let fillCounter = 0
function fillerCard(pos: Sector, rng: () => number): WonCard {
  const lo = 30 + Math.floor(rng() * 6)
  const nba = ACTIVE_SPORT === 'basquete'
  const names = nba ? FIL_NAMES_NBA : FIL_NAMES
  return { id: `fil-s-${fillCounter++}`, name: names[Math.floor(rng() * names.length)], club: nba ? 'Pickup' : 'Várzea', year: 2000, pos, fame: 1, lo, hi: lo + 6 + Math.floor(rng() * 4), paid: 0, via: 'bot' }
}
// completa um elenco de time de fundo até o mínimo da formação (11) com filler,
// por posição — a rede de segurança pra nunca ficar com menos de 11.
function fillToEleven(squad: WonCard[], formation: FormationKey, rng: () => number): WonCard[] {
  const out = [...squad]
  for (const pos of SECTORS) {
    let have = out.filter(c => c.pos === pos).length
    while (have < FORMATIONS[formation][pos]) { out.push(fillerCard(pos, rng)); have++ }
  }
  return out
}

// CARREIRA: junta os auges (nome|clube|ano) de TODOS os jogadores REAIS que já
// existem no mundo — elencos da sala + fichas dos 60 times de fundo. Serve pra
// SEMENTE de exclusão do baralho: o leilão nunca INVENTA uma carta nova de quem já
// existe em campo (o mesmo Kaká do Milan não é criado do nada em outro time). NÃO
// mexe em quem já está repetido num save antigo — só impede criar NOVA duplicata.
// Auges diferentes do mesmo nome (Kaká Milan x Kaká SP) são jogadores distintos.
function ownedRealIdents(s: EscState): Set<string> {
  const seen = new Set<string>()
  const isReal = (c: WonCard) => !c.fake && !isFillerClub(c.club)
  for (const m of s.managers) for (const c of m.squad as WonCard[]) if (isReal(c)) seen.add(ident(c))
  if (s.cpuSquads) for (const name of Object.keys(s.cpuSquads)) for (const c of s.cpuSquads[name] as WonCard[]) if (isReal(c)) seen.add(ident(c))
  return seen
}
// 🔒 UNICIDADE das fichas de fundo: nenhum jogador REAL pode estar em dois lugares.
// Tira das fichas dos 60 times de fundo (cpuSquads) qualquer jogador que um técnico
// (humano/rival/bot da sala) JÁ tem no elenco, e remove cópias repetidas ENTRE as
// próprias fichas de fundo (a 1ª mantém). Assim, se uma ficha de fundo foi semeada
// com o elenco de alguém desatualizado (o amigo ainda não tinha "recebido" o Messi
// que arrematou quando a ficha foi montada), a duplicata some — e o Mercado nunca
// solta a cópia do Messi no leilão enquanto o dono ainda o tem. Incógnitos (fake /
// Várzea) não têm identidade real, então ficam. NÃO cria nem repõe nada: só remove.
function healCpuSquads(s: EscState) {
  if (!s.cpuSquads) return
  const isReal = (c: WonCard) => !c.fake && !isFillerClub(c.club)
  const owned = new Set<string>()
  for (const m of s.managers) for (const c of m.squad as WonCard[]) if (isReal(c)) owned.add(ident(c))
  const out: Record<string, Card[]> = {}
  let changed = false
  for (const name of Object.keys(s.cpuSquads)) {
    const kept: Card[] = []
    for (const c of s.cpuSquads[name] as WonCard[]) {
      if (!isReal(c)) { kept.push(c); continue }
      const id = ident(c)
      if (owned.has(id)) { changed = true; continue } // já é de outro time → tira a cópia daqui
      owned.add(id) // a 1ª ficha de fundo a ter esse jogador fica com ele; as próximas perdem a cópia
      kept.push(c)
    }
    out[name] = kept
  }
  if (changed) s.cpuSquads = out
}

// ─── helpers de elenco ───────────────────────────────────────────────
export function slotsOf(m: Manager, pos: Sector): number {
  // 🏀 basquete: o alvo é POR TÉCNICO (nbaSlots) — quinteto 1 → rotação 2 →
  // elenco 3, crescendo a cada temporada só p/ você; bots sem nbaSlots = quinteto.
  if (ACTIVE_SPORT === 'basquete') return m.nbaSlots ?? NBA_BASE_SLOTS
  // elenco fundo (leilão de reservas): mira 22 = 2× a formação por posição.
  return baseSlots(m.formation, pos) * (m.deepSquad ? 2 : 1)
}
export function filled(m: Manager, pos: Sector): number {
  return m.squad.filter(c => c.pos === pos).length
}
export function openSlots(m: Manager, pos: Sector): number {
  return Math.max(0, slotsOf(m, pos) - filled(m, pos))
}
export function totalHoles(m: Manager): number {
  return SECTORS.reduce((s, pos) => s + openSlots(m, pos), 0)
}
// buracos no TIME TITULAR (XI): vagas da formação sem jogador REAL na posição.
// Diferente de totalHoles (que conta até o elenco cheio de 22).
export function xiHoles(m: Manager): number {
  const need = FORMATIONS[m.formation]
  return SECTORS.reduce((s, pos) => s + Math.max(0, need[pos] - m.squad.filter(c => c.pos === pos && !c.fake).length), 0)
}
// (carreira) pra CPU, um zé (fake) NÃO segura vaga: conta como buraco. É o que
// deixa o rival "completo" com zé brigar por reforço no monte — o zé cai fora
// depois (cerimônia) quando o reforço real chega.
function cpuFakes(m: Manager, pos: Sector): number {
  return m.isHuman ? 0 : m.squad.filter(c => c.pos === pos && c.fake).length
}
function careerOpenSlots(m: Manager, pos: Sector): number {
  return Math.min(slotsOf(m, pos), openSlots(m, pos) + cpuFakes(m, pos))
}
function careerHoles(m: Manager): number {
  return SECTORS.reduce((s, pos) => s + careerOpenSlots(m, pos), 0)
}
// melhor XI por NÍVEL (ids) — usado só pra FIXAR o time no começo da temporada.
function bestXIids(squad: WonCard[], formation: FormationKey): string[] {
  const out: string[] = []
  for (const pos of SECTORS) {
    const cands = squad.filter(c => c.pos === pos).sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi))
    for (let i = 0; i < FORMATIONS[formation][pos] && i < cands.length; i++) out.push(cands[i].id)
  }
  return out
}
// FIXA o XI dos HUMANOS pro começo da temporada: quem já era titular continua, e o
// REFORÇO NOVO vai pro BANCO — só o usuário promove (manual). CPU/rivais seguem no
// bestXI automático (tudo bem). Vale offline e online. Chamado ANTES do leilão
// mexer no elenco (na virada de temporada), pra capturar o time atual.
function pinHumanLineups(s: EscState) {
  if (!s.careerOnline) return
  const cl = { ...(s.careerLineup ?? {}) }
  for (const m of s.managers) {
    if (!m.isHuman) continue
    const byRound = cl[m.id]
    let ids: string[] | null = null
    if (byRound) { let bestK = -1; for (const k in byRound) { const kn = +k; if (kn > bestK) { bestK = kn; ids = byRound[k] } } }
    const valid = !!ids && ids.length === 11 && ids.every(id => m.squad.some(c => c.id === id))
    cl[m.id] = { 0: valid ? ids! : bestXIids(m.squad, m.formation) }
  }
  s.careerLineup = cl
}

// ─── montagem do baralho ───────────────────────────────────────────────
// `managers` aqui é só quem DISPUTA o leilão (humanos + rivais CPU no modo
// solo — nunca bots de preenchimento). Solo e online usam a MESMA regra:
// `margin` 1.0 + `extra` 1 = demanda + 1 carta por posição. Ex.: 4 times
// (você + 3 CPU, ou 4 online) = 5 goleiros, 9 laterais, etc.
// token único por CHAMADA de buildDeck: sem isso, o id `cat-<pos>-<i>` se repete
// a cada leilão (o de reservas gera cat-MEI-3 de novo, colidindo com a carta que
// o técnico já tinha do 1º leilão). O contador garante ids disjuntos entre builds
// na mesma sessão; o Date.now cobre reload (o módulo zera o contador).
let __deckBuildSeq = 0
function nextBuildTok(): string { return `${Date.now().toString(36)}${(__deckBuildSeq++).toString(36)}` }

// cura ids DUPLICADOS entre os elencos (herança do bug antigo: cartas do 1º
// leilão e do de reservas compartilhavam `cat-<pos>-<i>`). Re-chaveia a 2ª
// ocorrência em diante. Idempotente: sem duplicata, não mexe em nada. Retorna
// true se corrigiu algo (pra invalidar escalações manuais que apontavam pro id
// duplicado — caem no XI automático, que é o certo).
function healSquadIds(managers: Manager[]): boolean {
  const seen = new Set<string>()
  let changed = false
  for (const m of managers) for (const c of m.squad) {
    if (seen.has(c.id)) { c.id = `${c.id}~${(__deckBuildSeq++).toString(36)}`; changed = true }
    seen.add(c.id)
  }
  return changed
}

// LIVRO DE PREÇOS (carreira online): registra o último preço de um jogador pelo
// NOME. É a memória de valor do jogo inteiro — piso do jogador em qualquer leilão
// futuro. Só grava preço > 0 (leilão de graça não cria piso).
function recordPrice(state: EscState, name: string, price: number) {
  if (!state.careerOnline || price <= 0) return
  state.marketValues = { ...(state.marketValues ?? {}), [name]: price }
}
// ── 📝 CONTRATOS (carreira) ──────────────────────────────────────────────────
// VALOR OFICIAL do jogador: o maior entre o piso de mercado (livro/paid) e a
// TABELA por categoria. A tabela existe porque o piso de leilão nasce baixo
// (orçamento 100 pra 11 → jogador comprado por 1-2): sem ela, renovação e teto
// de venda ficariam "de graça" pra metade do elenco.
const CONTRATO_TABELA = (c: Card): number => c.fame >= 5 ? 30 : c.promessa ? 12 : c.fame === 4 ? 20 : c.fame >= 2 ? 8 : 3
// 🌱 CRIA DA BASE: nasce quando o técnico ESCOLHE deixar um contrato vencido ir
// e a saída quebraria o XI. Ruim de doer (derruba o nível do time), SEM
// contrato, invendável (valor 0, ninguém compra), e some sozinho quando chega
// reforço de verdade. Cada cria usa um nome NOVO da listinha (nunca repete).
function spawnCria(s: EscState, m: Manager, pos: Sector, saiu: string, rng: () => number): void {
  const usados = new Set(s.criaNames ?? [])
  const livres = CRIA_NOMES.filter(n => !usados.has(n))
  const nome = livres.length ? livres[Math.floor(rng() * livres.length)] : `${CRIA_NOMES[Math.floor(rng() * CRIA_NOMES.length)]} ${((s.criaNames?.length ?? 0) + 1)}º`
  s.criaNames = [...(s.criaNames ?? []), nome]
  const cria = { id: `cria-${pos}-${nextBuildTok()}`, name: nome, club: 'Sub-20', year: new Date().getFullYear(), pos, fame: 1, lo: 48, hi: 58, cria: true } as Card
  m.squad.push({ ...cria, paid: 0, buyPrice: 0, via: 'monte' } as WonCard)
  const historias = [
    `Sem renovar com o ${saiu}, a diretoria desceu no Sub-20 e gritou: "sobe, ${nome}!". O menino é RUIM de doer — trava a bola, tropeça no vento — mas dá pra tapar o buraco, e ele dormiu abraçado com a camisa do clube. 🥹`,
    `O ${saiu} foi embora e não tinha ninguém: a solução foi o ${nome}, cria da base. Perna torta, chute pra fora... mas coração GIGANTE. Tapa o buraco até chegar reforço — e a vó dele já tá na arquibancada. 🥹`,
    `Adeus, ${saiu}. Quem assume é o ${nome}, do Sub-20: o guri é fraquinho mesmo, todo mundo sabe — mas ninguém corre mais que ele. Quebra o galho até o clube conseguir gente grande. 💚`,
  ]
  const texto = historias[Math.floor(rng() * historias.length)]
  ;(s.criaNews = s.criaNews ?? []).push({ texto, nome, pos })
  ;(s.marketLog = s.marketLog ?? []).push(`🌱 ${m.teamName}: ${nome} subiu da base pra tapar o buraco do ${saiu} (de graça, sem contrato)`)
}
export function valorOficial(state: EscState, c: Card): number {
  return Math.max(state.marketValues?.[c.name] ?? 0, (c as { paid?: number }).paid ?? 0, CONTRATO_TABELA(c))
}
// prazo da renovação com "tempero": 5 vira 4-6 e 10 vira 9-11 (preço não muda).
// Sem isso, todo mundo renovando por 5 EXATOS re-alinhava os vencimentos e, anos
// depois, meia dúzia de contratos venciam JUNTOS (medido em simulação: até 13!).
function contratoDur(anos: 5 | 10, rng: () => number): number {
  const r = rng()
  return anos + (r < 1 / 3 ? -1 : r < 2 / 3 ? 0 : 1)
}
// paga o VENDEDOR da carta (quem listou/soltou no mercado) quando ela é vendida —
// no leilão ou no monte. A grana entra na caixa (money) dele, pra reinvestir na
// hora. Não paga a si mesmo (se recomprou o próprio jogador).
// 📝 SEM CONTRATO: se a carta chegou ao mercado por CONTRATO ENCERRADO, o vendedor
// recebe NO MÁXIMO o valor oficial do jogador — o que passar disso "fica com a
// família/empresário do jogador" (decisão do Diego: vender ANTES de vencer pega
// o preço cheio; deixar vencer perde o excedente).
function creditSeller(state: EscState, card: Card, amount: number, buyerId?: number) {
  const sellerId = (card as { seller?: number }).seller
  if (sellerId == null || amount <= 0 || sellerId === buyerId) return
  const seller = state.managers.find(m => m.id === sellerId)
  let credit = amount
  if (card.semContrato) {
    const teto = valorOficial(state, card)
    if (credit > teto) {
      const familia = credit - teto
      credit = teto
      ;(state.marketLog = state.marketLog ?? []).push(`💼 ${card.name} saiu SEM CONTRATO: a família gananciosa abocanhou ${familia} 🪙 — ${seller?.teamName ?? 'o clube'} levou só ${teto}`)
    }
  }
  // 🏛️ vendedor DORMINDO não joga o leilão: o money dele nunca é reconciliado
  // na cerimônia — credita direto na caixa oficial (senão a venda evaporava)
  if (seller?.dormindo) state.careerCoins = { ...(state.careerCoins ?? {}), [seller.id]: (state.careerCoins?.[seller.id] ?? 0) + credit }
  else if (seller) seller.money += credit
  // 🧾 se quem VENDEU foi o humano (carreira solo), registra a venda + o que
  // tinha pago, pra a aba Transferências mostrar o lucro/prejuízo real.
  if (seller?.isHuman) {
    const boughtFor = (card as WonCard).buyPrice ?? (card as { paid?: number }).paid ?? 0
    logFin(state, 'sell', card.semContrato ? `💼 ${card.name} (sem contrato)` : `💰 ${card.name}`, credit, { player: card.name, pos: card.pos, buyPrice: boughtFor }, sellerId)
  }
  mirrorWallets(state) // 💰 venda entra na caixa NA HORA
}
// 💰 CAIXA EM TEMPO REAL (carreira): durante o leilão o `money` do técnico É a
// caixa do clube (foi semeado dela). Toda compra/venda espelha na careerCoins na
// mesma hora — antes o número só era reconciliado na cerimônia, então quem
// vendia via "não aconteceu nada" e quem comprava via o caixa velho.
// O clube DORMINDO nunca entra aqui (o money dele é um número antigo).
function mirrorWallets(s: EscState) {
  if (!s.careerOnline) return
  const cc = { ...(s.careerCoins ?? {}) }
  for (const m of s.managers) if (m.isHuman && !m.dormindo) cc[m.id] = Math.round(m.money)
  s.careerCoins = cc
}
// ARTILHEIRO DA TEMPORADA: o goleador de cada divisão faz o valor de piso do
// jogador subir (D+4, C+8, B+12, A+16) — o mesmo número que o time ganhou de
// prêmio. Sobe o livro de preços (piso em qualquer leilão futuro) E o "paid"
// (piso de venda) de toda carta com esse nome em qualquer elenco.
// 💰 TETO DE MERCADO por categoria (TODA carreira, solo e online — 03/08, Diego:
// "Pelé por 409 depois de muitas temporadas, continua sem teto"): o quanto o
// mercado aceita pagar num jogador daquele nível. Medido em simulação (25 temp.):
// médias saudáveis eram 🪵12 · 🎯15 · 💎29 · ⭐40, mas as CAUDAS estouravam
// (🎯 a 42 = preço de ⭐, livro de artilheiro chegando a 100) — era isso que o
// tester viu ("perna-de-pau pelo preço de craque"). O teto deixa folga pro
// mercado respirar sem deixar categoria de baixo alcançar a de cima.
function catPriceCap(c: { fame?: number; promessa?: boolean }): number {
  if (c.promessa) return 42
  const f = c.fame ?? 1
  return f >= 5 ? 90 : f === 4 ? 65 : f >= 2 ? 26 : 16
}
// 📈 FATOR ECONÔMICO da sala (escada): o teto é RELATIVO ao mercado — sala rica
// (Série A, prêmios altos) paga mais caro em TODAS as categorias, como na vida
// real; o que nunca muda é a PROPORÇÃO (🪵 não alcança ⭐ da mesma época).
// Caixa média ~100 = mercado base (fator 1); cresce até 4× em sala muito rica.
function escadaEconFactor(s: EscState): number {
  const vals: number[] = []
  for (const m of s.managers) {
    if (m.isHuman && !m.dormindo) vals.push(s.careerCoins?.[m.id] ?? 0)
    else if (m.rival || m.backstop) vals.push(s.clubCash?.['m' + m.id] ?? 100)
  }
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 100
  return Math.min(4, Math.max(1, 0.5 + avg / 150))
}
function applyScorerValues(state: EscState, values?: Record<string, number>) {
  if (!values) return
  const mv = { ...(state.marketValues ?? {}) }
  // 🪜 escada: bônus de artilheiro NÃO infla o piso além do teto da categoria ×
  // economia da sala (antes somava toda temporada sem limite — um 🎯 artilheiro
  // eterno chegava a piso 100 e era vendido a preço de estrela). O teto cresce
  // junto com o mercado; nunca REDUZ um valor já gravado.
  const econ = state.careerOnline ? escadaEconFactor(state) : 0
  const capOf = (name: string): number | null => {
    if (!state.careerOnline) return null
    for (const m of state.managers) for (const c of m.squad) if (c.name === name && !c.fake) return Math.round(catPriceCap(c) * econ)
    for (const t in (state.cpuSquads ?? {})) for (const c of state.cpuSquads![t]) if (c.name === name && !c.fake) return Math.round(catPriceCap(c) * econ)
    return Math.round(42 * econ) // não achou a carta (raro): teto médio, só pra não inflar sem freio
  }
  for (const name in values) {
    const b = values[name]
    if (!b) continue
    const cap = capOf(name)
    const lift = (cur: number) => cap == null ? cur + b : Math.min(cur + b, Math.max(cap, cur))
    mv[name] = lift(mv[name] ?? 0)
    for (const m of state.managers) for (const c of m.squad) {
      if (c.name === name) { const w = c as { paid?: number }; w.paid = lift(w.paid ?? 0) }
    }
  }
  state.marketValues = mv
}
// manda cartas pro monte JÁ pela metade e registra esse valor no livro (é o preço
// que o jogador vale dali em diante — se ninguém pega, o "bot fica" com ele por
// esse valor, e é com ele que a carta volta um dia ao mercado).
function montePush(state: EscState, cards: Card[]) {
  const halved = halveListed(cards)
  for (const c of halved) { const p = (c as { paid?: number }).paid ?? 0; if (p > 0) recordPrice(state, c.name, p) }
  state.monte.push(...halved)
}

// 🪜 ESCADA DE CATEGORIAS (carreira solo NOVA — teste na conta do Diego): cada
// divisão só negocia certas categorias no leilão, até o mercado liberar geral
// (2 temporadas jogadas na Série A). Fase 1 (sem a divisão Várzea real ainda):
// D (estreia) = foi-prof + bom · C = bom + promessa · B = promessa + craque ·
// A = craque + lenda. Quando a Várzea entrar (Fase 2), a régua desce um degrau.
// Fase 2 (VÁRZEA real): V = foi-prof + bom · D = bom + promessa · C e B =
// promessa + craque · A = craque + lenda (spec original do Diego, completa).
type EscadaDiv = 'A' | 'B' | 'C' | 'D' | 'V'
export function escadaAllows(div: EscadaDiv, c: { fame?: number; promessa?: boolean }): boolean {
  const f = c.fame ?? 1
  switch (div) {
    case 'V': return !c.promessa && f <= 3
    case 'D': return !!c.promessa || (f >= 2 && f <= 3)
    case 'C': return !!c.promessa || (!c.promessa && f === 4)
    case 'B': return !!c.promessa || (!c.promessa && f === 4)
    case 'A': return !c.promessa && f >= 4
  }
}
// divisão que manda no baralho AGORA (a SUA divisão) — null = mercado normal
function escadaDivOf(s: EscState): EscadaDiv | null {
  if (!s.escadaOn || s.escadaLivre) return null
  const y = s.managers[s.youIdx]?.id ?? 0
  const d = s.careerPlacements?.[`m${y}`]
  return (d === 'A' || d === 'B' || d === 'C' || d === 'D' || d === 'V') ? d : 'V'
}
// cotas de raridade por degrau (o "resto" do setor vira a categoria comum do degrau)
const ESCADA_RARITY: Record<EscadaDiv, { legend: number; star: number; promessa: number; low: number }> = {
  V: { legend: 0, star: 0, promessa: 0, low: 0.40 },    // peladão: ~40% foi-prof, resto bom
  D: { legend: 0, star: 0, promessa: 0.30, low: 0 },    // ~30% promessa, resto bom
  C: { legend: 0, star: 0.55, promessa: 0.45, low: 0 }, // promessa + craque
  B: { legend: 0, star: 0.60, promessa: 0.40, low: 0 }, // promessa + craque
  A: { legend: 0.30, star: 0.70, promessa: 0, low: 0 }, // elite: craque + lenda
}
function buildDeck(managers: Manager[], rng: () => number, margin: number, used: Set<string> = new Set(), extra = 0, values?: Record<string, number>, noFake = false, varzea = false, escada: EscadaDiv | null = null): Record<Sector, Card[]> {
  const deck = {} as Record<Sector, Card[]>
  const bt = nextBuildTok()
  const takenNow = new Set<string>() // 🔄 rodízio: idents pegos nesta leva (vira a memória do próximo baralho)
  // ── passo 1: define o tamanho de cada setor e embaralha o catálogo ──
  const plan = {} as Record<Sector, { count: number; catalog: (typeof CATALOG)[Sector] }>
  for (const pos of SECTORS) {
    const demand = managers.reduce((s, m) => s + slotsOf(m, pos), 0)
    // 🪜 escada: o catálogo do setor é FILTRADO pras categorias da divisão —
    // trava dura (nem o "completa com qualquer real" fura a régua).
    const shuffled = shuffle(escada ? ACTIVE_CATALOG[pos].filter(c => escadaAllows(escada, c)) : ACTIVE_CATALOG[pos], rng)
    // 🔄 RODÍZIO: joga quem caiu na leva passada pro FIM (empate mantém a ordem
    // embaralhada, então continua aleatório). As cotas pegam do começo → preferem
    // cartas que NÃO acabaram de aparecer. Só reordena; não muda nenhuma %.
    const catalog = RECENT_DECK.size ? shuffled.slice().sort((a, b) => (RECENT_DECK.has(ident(a)) ? 1 : 0) - (RECENT_DECK.has(ident(b)) ? 1 : 0)) : shuffled
    const realFree = catalog.filter(c => !used.has(ident(c))).length
    // margem adaptativa: queremos "sempre dobrado" (demand × margin), mas nunca
    // pedir mais jogadores REAIS do que existem na posição — senão vira fake.
    // Então: pede o dobro se couber; se não couber, pega todos os reais que dá
    // (mantendo pelo menos `demand`, pra todo mundo conseguir fechar as vagas).
    // Só quando nem `demand` cabe em reais (sala gigante) é que sobra fake.
    // `extra` = cartas a mais por posição além da demanda (online: +1, pra dar
    // opção/disputa — 2 jogadores viram 3 goleiros, 5 laterais, etc.).
    const target = Math.max(1, Math.ceil(demand * margin), demand + extra)
    const count = Math.max(demand, Math.min(target, realFree))
    plan[pos] = { count, catalog }
  }
  // ── passo 2: cotas de raridade POR POSIÇÃO (não global) ──────────────────
  // Cada setor (GOL/LAT/ZAG/MEI/ATA) recebe a MESMA % de cada nível. Assim o
  // total do leilão bate esse mesmo % de forma natural, e nenhuma posição — em
  // especial o MEI, que é a maior — vira "festival de lenda".
  // SORTEIO PONDERADO: a fração vira CHANCE (não arredondamento fixo). Ex.: GOL
  // com 3 cartas → lenda = 3×0,08 = 0,24 → 24% de chance de vir 1 lenda, 76% de
  // vir 0. Assim posição pequena VARIA a cada save (às vezes sai um goleiro lenda)
  // em vez de dar sempre o mesmo resultado, e a média longa continua nos 8%.
  // Se o setor tem poucas cartas no catálogo, pega só o que existe (pode ficar 0
  // lenda). O que sobrar do setor vira bom jogador. Folk não é cota (é só selo).
  // 🥅 VÁRZEA: não existe lenda/craque/promessa no baralho (a cota alta some
  // sozinha = 0). EQUILÍBRIO (02/08): antes o leilão vinha 70% foi profissional
  // mas os bots só ~17% → o time do usuário nascia MUITO mais fraco (bots
  // imbatíveis). Agora o leilão fica ~40% foi profissional pra bater com o nível
  // dos bots (mesma pegada do modo padrão, onde o seu leilão fica no mesmo nível
  // ou acima dos bots). Como o usuário ESCOLHE no leilão, ele monta um time acima
  // da média e briga de igual. Sem cartas novas obrigatórias e sem fake. Fora da
  // várzea, tudo igual.
  const RARITY = escada
    ? ESCADA_RARITY[escada] // 🪜 cotas do degrau da escada (catálogo já filtrado acima)
    : varzea
    ? { legend: 0, star: 0, promessa: 0, low: 0.40 }
    : { legend: 0.16, star: 0.26, promessa: 0.17, low: 0.29 } // % por posição (o resto = bom jogador ~12%)
  const stoch = (x: number) => { const f = Math.floor(x); return f + (rng() < x - f ? 1 : 0) } // arredonda por sorteio (mantém a média)
  const alloc = {} as Record<Sector, { legend: number; star: number; promessa: number; low: number }>
  const availOf = (pos: Sector, pred: (c: (typeof CATALOG)[Sector][number]) => boolean) =>
    plan[pos].catalog.filter(c => pred(c) && !used.has(ident(c))).length
  for (const pos of SECTORS) {
    const cnt = plan[pos].count
    // pede a fração (por sorteio) de cada nível, nunca mais do que existe no setor
    let legend = Math.min(availOf(pos, c => c.fame === 5), stoch(cnt * RARITY.legend))
    let star = Math.min(availOf(pos, c => c.fame === 4 && !c.promessa), stoch(cnt * RARITY.star)) // craque
    let promessa = Math.min(availOf(pos, c => !!c.promessa), stoch(cnt * RARITY.promessa))
    let low = Math.min(availOf(pos, c => c.fame === 1), stoch(cnt * RARITY.low))                  // foi profissional
    // se a soma passar do tamanho do setor, corta primeiro dos mais comuns
    // (foi profissional → promessa → craque → lenda), pra a raridade se manter.
    let over = legend + star + promessa + low - cnt
    if (over > 0) { const d = Math.min(low, over); low -= d; over -= d }
    if (over > 0) { const d = Math.min(promessa, over); promessa -= d; over -= d }
    if (over > 0) { const d = Math.min(star, over); star -= d; over -= d }
    if (over > 0) { const d = Math.min(legend, over); legend -= d; over -= d }
    alloc[pos] = { legend, star, promessa, low }
  }
  // ── passo 3: monta cada setor — cotas garantidas, resto = bom jogador ──
  for (const pos of SECTORS) {
    const { count, catalog } = plan[pos]
    const cards: Card[] = []
    const take = (c: (typeof CATALOG)[Sector][number]) => { used.add(ident(c)); takenNow.add(ident(c)); const fl = values?.[c.name] ?? 0; cards.push({ ...c, id: `cat-${pos}-${cards.length}-${bt}`, pos, ...(fl > 0 ? { paid: fl } : {}) } as Card) }
    // 1) LENDA
    let needL = alloc[pos].legend
    for (const c of catalog) { if (needL <= 0) break; if (c.fame !== 5 || used.has(ident(c))) continue; take(c); needL-- }
    // 2) CRAQUE (fame 4 — folk entra normal, é só selo)
    let needS = alloc[pos].star
    for (const c of catalog) { if (needS <= 0) break; if (c.fame !== 4 || c.promessa || used.has(ident(c))) continue; take(c); needS-- }
    // 3) PROMESSAS (5º tier)
    let needP = alloc[pos].promessa
    for (const c of catalog) { if (needP <= 0) break; if (!c.promessa || used.has(ident(c))) continue; take(c); needP-- }
    // 4) FOI PROFISSIONAL (fame 1)
    let needLo = alloc[pos].low
    for (const c of catalog) { if (needLo <= 0) break; if (c.fame !== 1 || used.has(ident(c))) continue; take(c); needLo-- }
    // 5) resto = BOM JOGADOR natural (fame 2/3, não-promessa — folk entra aqui normal)
    for (const c of catalog) { if (cards.length >= count) break; if (used.has(ident(c)) || c.fame === 5 || c.fame === 4 || c.fame === 1 || c.promessa) continue; take(c) }
    // 6) se ainda faltar (setor pequeno de catálogo), aceita qualquer real restante
    for (const c of catalog) { if (cards.length >= count) break; if (used.has(ident(c))) continue; take(c) }
    // 5) só cai pra incógnita se o catálogo real acabar (sala gigante). No leilão
    // de RESERVAS (noFake) NÃO completa com incógnito: reserva é opcional, então o
    // baralho fica só com os reais que existem (menos cartas, mas sem "fake").
    const gems = Math.max(1, Math.ceil(managers.length / 3))
    let gi = 0
    while (!noFake && cards.length < count) { cards.push(makeIncognita(pos, cards.length, gi < gems, rng, bt, ACTIVE_SPORT === 'basquete')); gi++ }
    // embaralha a ordem final: as cotas montam o baralho com lenda/craque
    // primeiro, então sem isto os melhores ficariam sempre no topo da tela e
    // dava pra "ler" o nível pela posição — furando o leilão às cegas.
    deck[pos] = shuffle(cards, rng)
  }
  // 🔄 guarda esta leva como memória do rodízio pra próxima — só nas levas PRINCIPAIS
  // (a de reservas, noFake, não sobrescreve: senão a próxima principal deixaria de
  // rodiziar de verdade). Substitui (não acumula): "recente" = só a leva anterior.
  if (!noFake && takenNow.size) RECENT_DECK = takenNow
  return deck
}

// escolhe UM jogador surpresa no leilão inteiro: o nome dele fica escondido no
// lance (só posição/clube/ano aparecem) e é revelado no martelo. Um por leilão.
function pickSurprise(deck: Record<Sector, Card[]>, rng: () => number): string | undefined {
  const all: string[] = []
  for (const p of SECTORS) for (const c of deck[p]) all.push(c.id)
  return all.length ? all[Math.floor(rng() * all.length)] : undefined
}

// managers que efetivamente brigam no leilão (exclui bots de preenchimento e o
// 🏛️ MULTICLUBES que está DORMINDO — o 2º clube não-selecionado não dá lance).
function auctioningManagers(managers: Manager[]): Manager[] {
  return managers.filter(m => (m.isHuman || m.auctionRival) && !m.dormindo)
}

// ─── CPU: envelopes de lance ─────────────────────────────────────────
function perceived(card: Card, rng: () => number): number {
  const mid = (card.lo + card.hi) / 2
  const noise = card.fame === 1 ? 14 : card.fame === 2 ? 7 : 3
  const swing = rng() * 2 - 1 // -1..1
  // 🦶 PERNA-DE-PAU (fame 1): o "chute" do CPU vai muito mais pra BAIXO (pechincha)
  // do que pra cima. Antes o ±14 simétrico às vezes fazia o CPU ENXERGAR um craque
  // num perna-de-pau e pagar caro por ele. Agora ele ainda pode ver como zica
  // (barato), mas quase nunca superavalia — perna-de-pau não fica caro no leilão.
  const up = card.fame === 1 ? 0.3 : 1 // teto do erro PRA CIMA menor só no fame 1
  return mid + (swing >= 0 ? swing * noise * up : swing * noise)
}

const SECTOR_WEIGHT: Record<Sector, number> = { GOL: 0.12, LAT: 0.15, ZAG: 0.19, MEI: 0.25, ATA: 0.29 }

// quanto um jogador VALE pro bot, pelo nível percebido: perna-de-pau vale
// centavos, craque vale esticar. É o TETO do lance — bot rico não despeja mais
// 150 num mediano só porque tem caixa (curva calibrada pra economia de 100-230).
function fairPrice(v: number): number {
  return Math.max(1, Math.round(Math.pow(Math.max(0, v - 40) / 10, 1.55) * 3.2))
}

// `catCapEcon` (🪜 escada/carreira nova): teto da CATEGORIA × fator econômico da
// sala — bot rico e agressivo não paga preço de ⭐ num 🪵/🎯 da MESMA época (as
// caudas que o tester flagrou), mas sala rica paga mais em tudo (mercado real).
// 0 = desligado (fora da escada nada muda — jogo ao vivo intocado).
function cpuEnvelope(m: Manager, cards: Card[], sectorIdx: number, rng: () => number, rescue: boolean, catCapEcon = 0): (Bid & { cardId: string })[] {
  const pos = SECTORS[sectorIdx]
  // FAKE NÃO SEGURA VAGA (só CPU): incógnito no elenco conta como vaga aberta —
  // o bot briga por jogador REAL e, se estourar o teto, o fake é dispensado no
  // fim (FINISH_CEREMONY). Humano decide sozinho, então segue só com openSlots.
  const fakeSlots = m.isHuman ? 0 : m.squad.filter(c => c.pos === pos && c.fake).length
  const need = Math.min(slotsOf(m, pos), openSlots(m, pos) + fakeSlots)
  if (need === 0 || m.money <= 0) return []
  const remaining = SECTORS.slice(sectorIdx).reduce((s, p) => s + SECTOR_WEIGHT[p], 0)
  const shape = 0.65 + m.aggression * 0.8
  // 👑 REPESCAGEM com LENDA na mesa: o bot fica mais esperto — orçamento normal
  // (4-9) quase nunca cobre o piso de uma lenda, e ela sumia de graça no monte
  // sem ninguém notar. Com lenda na leva, o bolso da repescagem cresce bastante
  // (ainda helper, nunca chega no preço do leilão principal).
  const rescueHasLegend = rescue && cards.some(c => c.fame === 5)
  let budget = rescue
    ? Math.min(m.money, (rescueHasLegend ? 14 : 4) + Math.floor(rng() * (rescueHasLegend ? 22 : 6)))
    : Math.max(1, Math.floor(m.money * (SECTOR_WEIGHT[pos] / remaining) * shape * (0.85 + rng() * 0.4)))
  budget = Math.min(budget, m.money)

  const ranked = cards.map(c => ({ c, v: perceived(c, rng) })).sort((a, b) => b.v - a.v)
  // bida SÓ nas vagas que tem (need). Percorre o ranking e PULA quem não vale/não
  // cabe (antes, um piso caro "gastava" a vaga de alvo e o bot nem ofertava no resto).
  const result: (Bid & { cardId: string })[] = []
  let left = budget
  let wallet = m.money // pode ESTICAR além da fatia do setor pra pechincha de craque
  for (const t of ranked) {
    if (result.length >= need || wallet <= 0) break
    // quem LISTOU o jogador por livre vontade (rival) não o recompra — vendeu
    // porque quis. Recomprar o próprio é só do bot do MERCADO (perda sorteada).
    if ((t.c as Card).seller === m.id && !m.marketCpu && !m.backstop) continue
    // 📝 contrato vencido: NEM bot recompra o próprio (mesma regra do humano)
    if ((t.c as Card).semContrato && (t.c as Card).seller === m.id) continue
    const i = result.length
    const share = m.starHunger > 0.5 ? (i === 0 ? 0.7 : 0.3 / Math.max(1, need - 1)) : 1 / need
    let amt = Math.max(1, Math.round(budget * share * (0.75 + rng() * 0.5)))
    amt = Math.min(amt, Math.max(1, left))
    // TETO DE VALOR: o lance nunca passa muito do que o jogador vale pro bot.
    // 🪜 escada: os DOIS tetos escalam com a economia da sala (mercado rico paga
    // mais em tudo), mas o teto da categoria garante a proporção — 🪵/🎯 nunca
    // alcançam ⭐ da mesma época, por mais rico que o bot seja.
    let cap = Math.max(2, Math.round(fairPrice(t.v) * (0.85 + m.aggression * 0.5 + rng() * 0.3) * (catCapEcon > 0 ? catCapEcon : 1)))
    if (catCapEcon > 0) cap = Math.min(cap, Math.max(2, Math.round(catPriceCap(t.c) * catCapEcon * (0.8 + rng() * 0.25))))
    amt = Math.min(amt, cap)
    // PISO (valor fixo): compara com o BOLSO INTEIRO, não com a fatia do setor —
    // craque com piso justo é pechincha e o bot estica pra cobrir. Se o jogador
    // não vale o piso (listado caro demais), pula e tenta o próximo do ranking.
    const floor = (t.c as { paid?: number }).paid ?? 0
    if (floor > 0) {
      if (wallet < floor || cap + 3 < floor) continue
      amt = Math.max(amt, floor)
    }
    amt = Math.min(amt, wallet)
    if (amt > 0) { result.push({ mgr: m.id, amount: amt, cardId: t.c.id }); left -= amt; wallet -= amt }
  }
  return result
}

type BidMap = Map<string, Bid[]>

function pushBid(map: BidMap, cardId: string, bid: Bid) {
  const list = map.get(cardId) ?? []
  list.push(bid)
  map.set(cardId, list)
}
// 🏛️ MULTICLUBES × ANTI-MALANDRAGEM ("😤 magoado com você", Diego 04/08): o
// jogador que VOCÊ deixou sem renovar se recusa a jogar em QUALQUER clube seu —
// ativo ou dormindo. Mesmo dono = os dois assentos são seus. 2º clube só existe
// no SOLO, então isto NUNCA bloqueia outro humano de sala online.
export function mesmoDono(state: EscState, buyerId: number, sellerId: number | undefined | null): boolean {
  if (sellerId == null) return false
  if (buyerId === sellerId) return true
  const mc = state.multiClube
  if (!mc || state.onlineMode === 'online') return false
  const youId = state.managers[state.youIdx]?.id
  const meu = (id: number) => id === youId || id === mc.id
  return meu(buyerId) && meu(sellerId)
}

// ─── resolução: pote crescente, maior lance leva, anulação por setor cheio ──
// Empate no MAIOR lance elegível (≥2 técnicos) não decide na hora: a carta
// entra na fila de desempate (ties) com vencedor pendente — quem resolve é o
// re-lance cego (ver resolveOneTiebreak). Sem empate, decide aqui mesmo.
function resolve(cards: Card[], bidMap: BidMap, managers: Manager[], via: 'leilao' | 'repescagem', reforco = false, sameOwner: (buyerId: number, sellerId: number) => boolean = (b, sl) => b === sl): { queue: ResolvedCard[]; unsold: Card[]; ties: TieBreak[] } {
  const byPot = [...cards].sort((a, b) => {
    const pa = (bidMap.get(a.id) ?? []).reduce((s, x) => s + x.amount, 0)
    const pb = (bidMap.get(b.id) ?? []).reduce((s, x) => s + x.amount, 0)
    return pa - pb
  })
  const queue: ResolvedCard[] = []
  const unsold: Card[] = []
  const ties: TieBreak[] = []
  for (const card of byPot) {
    // PISO: jogador listado no mercado (carreira online) vale no mínimo o que foi
    // pago por ele (card.paid). Carta nova do baralho não tem piso (paid = 0).
    const floor = (card as { paid?: number }).paid ?? 0
    const sorted = (bidMap.get(card.id) ?? []).slice().sort((a, b) => b.amount - a.amount)
    if (sorted.length === 0) {
      unsold.push(card)
      queue.push({ card, bids: [], winner: null, paid: 0, voided: [] })
      continue
    }
    // pula do topo pra baixo os inelegíveis (setor cheio / sem dinheiro / abaixo
    // do piso / ex-dono de contrato vencido): anulados
    // 📝 ANTI-MALANDRAGEM (Diego 03/08): quem DEIXOU O CONTRATO VENCER não pode
    // recomprar o próprio jogador neste leilão (senão "renovava" barato pelo
    // pregão). Só volta a poder se OUTRO clube levar e ele reaparecer um dia.
    const exDono = (card as { semContrato?: boolean }).semContrato ? (card as { seller?: number }).seller : undefined
    const voided: number[] = []
    let i = 0
    for (; i < sorted.length; i++) {
      const m = managers.find(x => x.id === sorted[i].mgr)!
      if (openSlots(m, card.pos) <= 0 || m.money < sorted[i].amount || sorted[i].amount < floor || (exDono != null && sameOwner(m.id, exDono))) { voided.push(sorted[i].mgr); continue }
      break
    }
    if (i >= sorted.length) { // ninguém elegível
      unsold.push(card)
      queue.push({ card, bids: sorted, winner: null, paid: 0, voided })
      continue
    }
    const top = sorted[i].amount
    // entre os elegíveis, quem também está no valor do topo?
    const tiedTop: number[] = []
    for (let j = i; j < sorted.length && sorted[j].amount === top; j++) {
      const m = managers.find(x => x.id === sorted[j].mgr)!
      if (openSlots(m, card.pos) > 0 && m.money >= top && !(exDono != null && sameOwner(m.id, exDono))) tiedTop.push(sorted[j].mgr)
    }
    if (tiedTop.length >= 2) {
      // empate no topo → desempate (vencedor decidido depois). Sem dedução aqui.
      ties.push({ cardId: card.id, card, amount: top, managers: tiedTop, submitted: [], winner: null, paid: 0, viaRoulette: false, via })
      queue.push({ card, bids: sorted, winner: null, paid: 0, voided })
      continue
    }
    // vencedor único: fecha na hora
    const wid = tiedTop[0]
    const m = managers.find(x => x.id === wid)!
    m.money -= top
    // 📝 clube novo = contrato novo: limpa selo/prazo — a próxima cerimônia sorteia 5-10
    m.squad.push({ ...card, paid: top, buyPrice: top, via, semContrato: undefined, contratoAte: undefined, ...(reforco && m.isHuman ? { reforco: true } : {}) } as WonCard)
    queue.push({ card, bids: sorted, winner: wid, paid: top, voided })
  }
  return { queue, unsold, ties }
}

// resolve UMA disputa de desempate: junta os re-lances (humanos já enviados +
// CPUs auto), o maior leva. Empatou de novo no topo → roleta (sorteio) entre
// eles. Atualiza dinheiro/elenco do vencedor e a carta na fila de revelação.
function resolveOneTiebreak(state: EscState, tb: TieBreak, rng: () => number) {
  const amounts: Record<number, number> = {}
  for (const id of tb.managers) {
    const m = state.managers.find(x => x.id === id)!
    let v = m.isHuman ? (state.tiebreakPending[id] ?? tb.amount) : cpuTiebreakBid(m, tb, rng)
    // 🪜 escada: a CPU não cobre o empate além do teto da categoria × economia
    // (a escalada do re-lance era a última rota de "🎯 a preço de ⭐"). O teto
    // acompanha a riqueza da sala; humano decide sozinho.
    if (state.careerOnline && !m.isHuman) v = Math.min(v, Math.max(tb.amount, Math.round(catPriceCap(tb.card) * escadaEconFactor(state))))
    v = Math.min(m.money, Math.max(tb.amount, Math.round(v))) // trava: ≥ piso e ≤ dinheiro
    amounts[id] = v
  }
  const max = Math.max(...tb.managers.map(id => amounts[id]))
  const top = tb.managers.filter(id => amounts[id] === max)
  let winner: number
  if (top.length === 1) { winner = top[0]; tb.viaRoulette = false }
  else { winner = top[Math.floor(rng() * top.length)]; tb.viaRoulette = true } // empatou de novo → roleta
  const m = state.managers.find(x => x.id === winner)!
  m.money -= max
  m.squad.push({ ...tb.card, paid: max, buyPrice: max, via: tb.via, semContrato: undefined, contratoAte: undefined, ...(state.reserveAuction && m.isHuman ? { reforco: true } : {}) } as WonCard)
  if (m.isHuman) logFin(state, 'buy', `🛒 ${tb.card.name}`, -max, { player: tb.card.name, pos: tb.card.pos }, m.id) // 🧾 compra no desempate
  recordPrice(state, tb.card.name, max) // livro de preços
  creditSeller(state, tb.card, max, winner) // o vendedor recebe a grana da venda
  agenciaTransacao(state, tb.card) // 🕴️ agenciado negociado → comissão de agente
  tb.winner = winner
  tb.paid = max
  tb.bids = amounts // registra quanto cada um cobriu (transparência na revelação)
  const rc = state.revealQueue.find(q => q.card.id === tb.cardId)
  if (rc) { rc.winner = winner; rc.paid = max }
  mirrorWallets(state) // 💰 compra no desempate sai da caixa NA HORA
}

// CPU no desempate: cobre um pouco acima do valor empatado conforme o
// arquétipo (mais agressivo/faminto por craque sobe mais), limitado ao caixa.
function cpuTiebreakBid(m: Manager, tb: TieBreak, rng: () => number): number {
  const hunger = tb.card.fame >= 4 ? m.starHunger : 0.3
  const bump = Math.round((2 + tb.amount * 0.25) * (0.4 + m.aggression + hunger) * (0.6 + rng() * 0.8))
  return tb.amount + Math.max(1, bump)
}

// avança pela fila de desempates: para na próxima que precisa de humano (liga o
// prazo), resolve sozinha as que só têm CPU, e ao fim manda pra revelação.
function advanceTiebreaks(state: EscState) {
  while (state.tiebreakIdx < state.tiebreaks.length) {
    const tb = state.tiebreaks[state.tiebreakIdx]
    const humans = tb.managers.filter(id => state.managers.find(x => x.id === id)!.isHuman)
    if (humans.length > 0) { state.phaseDeadline = Date.now() + TIEBREAK_MS; return }
    resolveOneTiebreak(state, tb, rngOf(state))
    state.tiebreakIdx++
    state.tiebreakPending = {}
  }
  // acabaram os desempates: segue a cerimônia normal
  const rescue = state.tiebreaks.length > 0 && state.tiebreaks[0].via === 'repescagem'
  state.phase = rescue ? 'resq_reveal' : 'reveal'
  state.revealIdx = 0
  state.phaseDeadline = null
}

// chamado quando um humano re-lança: se todos os humanos da disputa atual já
// enviaram, resolve e avança.
function maybeResolveTiebreak(state: EscState) {
  const tb = state.tiebreaks[state.tiebreakIdx]
  if (!tb || tb.winner !== null) return
  const humans = tb.managers.filter(id => state.managers.find(x => x.id === id)!.isHuman)
  if (!humans.every(id => tb.submitted.includes(id))) return
  resolveOneTiebreak(state, tb, rngOf(state))
  state.tiebreakIdx++
  state.tiebreakPending = {}
  advanceTiebreaks(state)
}

// ─── temporada ───────────────────────────────────────────────────────
function buildLeague(managers: Manager[], fillBots = true): LeagueTeam[] {
  // bidders "auction-only" (rivais de outra divisão na carreira) NÃO entram na
  // tabela — só brigaram no leilão; jogam a própria divisão (vida na pirâmide).
  const teams: LeagueTeam[] = managers.filter(m => !m.auctionOnly).map(m => ({
    id: m.id, name: m.teamName, isManager: true, baseAtk: 0, baseDef: 0,
    pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0,
  }))
  // 🏆 LIGA FECHADA: tabela só com os humanos (sem completar com clubes CPU).
  // Nos demais modos, completa até 20 como sempre.
  if (fillBots) {
    const fill = LEAGUE_SIZE - teams.length
    // 🏀 basquete: completa a liga com FRANQUIAS DA NBA (não clubes de futebol),
    // pulando as que já são time de algum técnico (evita repetir Lakers/Bulls…).
    const used = new Set(teams.map(t => t.name.toLowerCase()))
    const pool = ACTIVE_SPORT === 'basquete' ? NBA_CLUBS.filter(c => !used.has(c.name.toLowerCase())) : CLASSIC_CLUBS
    for (let i = 0; i < fill; i++) {
      const c = pool[i % pool.length]
      teams.push({
        id: 100 + i, name: c.name, isManager: false, baseAtk: c.atk, baseDef: c.def,
        pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0,
      })
    }
  }
  return teams
}

// método do círculo (returno duplo). Times PAR: igual sempre. Times ÍMPAR: entra
// um "fantasma" (id -1) e quem calha de pegar ele FOLGA naquela rodada — padrão de
// liga de verdade. Com número par nada muda (nenhum -1 é criado).
// gera UM turno-returno (todos contra todos ida e volta) a partir de uma ordem de ids
function oneDoubleRR(order: number[]): [number, number][][] {
  const ids = order.slice()
  if (ids.length % 2 === 1) ids.push(-1) // fantasma da folga
  const n = ids.length
  const rounds: [number, number][][] = []
  const rot = ids.slice(1)
  for (let r = 0; r < n - 1; r++) {
    const round: [number, number][] = []
    const left = [ids[0], ...rot.slice(0, n / 2 - 1)]
    const right = rot.slice(n / 2 - 1).reverse()
    for (let i = 0; i < n / 2; i++) {
      const h = r % 2 === 0 ? left[i] : right[i]
      const a = r % 2 === 0 ? right[i] : left[i]
      if (h === -1 || a === -1) continue // quem pega o fantasma folga nesta rodada
      round.push([h, a])
    }
    rounds.push(round)
    rot.unshift(rot.pop()!)
  }
  const volta: [number, number][][] = rounds.map(r => r.map(([h, a]) => [a, h] as [number, number]))
  return [...rounds, ...volta]
}
// 🏀 temporada da NBA tem 82 jogos (o futebol segue com 38 = todos contra todos
// ida e volta). Pra chegar aos 82 no basquete, concatena turnos-returno extras
// (reembaralhando a ordem a cada ciclo) e corta em 82. Só o basquete faz isso.
const NBA_SEASON_GAMES = 82
function buildFixtures(teams: LeagueTeam[], rng?: () => number): [number, number][][] {
  // 🎲 com rng: EMBARALHA a ordem dos times antes do round-robin — sem isso o
  // calendário era IDÊNTICO toda temporada (mesma ordem de ids), e no "jogar de
  // novo (mesmo time)" você SEMPRE estreava contra o mesmo adversário da vez
  // anterior (bug relatado: "depois da 38ª pega o primeiro time de novo").
  const baseIds = teams.map(t => t.id)
  let fixtures = oneDoubleRR(rng ? shuffle(baseIds, rng) : baseIds)
  if (ACTIVE_SPORT === 'basquete') {
    while (fixtures.length < NBA_SEASON_GAMES) {
      fixtures = fixtures.concat(oneDoubleRR(rng ? shuffle(baseIds, rng) : baseIds))
    }
    fixtures = fixtures.slice(0, NBA_SEASON_GAMES)
  }
  return fixtures
}

interface TeamForm { atk: number; def: number; inspired: string | null }

function rollManagerForm(m: Manager, tactic: Tactic, oppTactic: Tactic, rng: () => number): TeamForm {
  const rolls = m.squad.map(c => ({ c, lvl: c.lo + rng() * (c.hi - c.lo) }))
  let inspired: string | null = null
  for (const r of rolls) {
    if (r.c.hi - r.c.lo >= 14 && r.lvl >= r.c.hi - 2.5) inspired = r.c.name
  }
  const sector = (pos: Sector): number => {
    const s = rolls.filter(r => r.c.pos === pos)
    if (s.length === 0) return 40
    const avg = s.reduce((x, r) => x + r.lvl, 0) / s.length
    const min = Math.min(...s.map(r => r.lvl))
    return avg - (avg - min) * 0.35
  }
  const gol = sector('GOL'), lat = sector('LAT'), zag = sector('ZAG'), mei = sector('MEI'), ata = sector('ATA')
  let atk = ata * 0.45 + mei * 0.35 + lat * 0.20
  let def = gol * 0.30 + zag * 0.40 + lat * 0.15 + mei * 0.15
  if (tactic === 'retranca') { def += 4; atk -= 3 }
  if (tactic === 'ataque') { atk += 4; def -= 3 }
  if (tactic === 'equilibrio') { atk += 1; def += 1 }
  if (tactic === 'retranca' && oppTactic === 'ataque') def += 2.5
  if (tactic === 'ataque' && oppTactic === 'equilibrio') atk += 2.5
  if (tactic === 'equilibrio' && oppTactic === 'retranca') atk += 2.5
  if (inspired) atk += 2
  return { atk, def, inspired }
}

// força "de base" de um time (sem sorte/tática): usa o nível MÉDIO de cada
// carta. Serve pra comparar humanos x bots e calibrar a dificuldade do CPU.
function midPower(m: Manager): { atk: number; def: number } {
  const rolls = m.squad.map(c => ({ pos: c.pos, lvl: (c.lo + c.hi) / 2 }))
  const sector = (pos: Sector): number => {
    const s = rolls.filter(r => r.pos === pos)
    if (s.length === 0) return 40
    const avg = s.reduce((x, r) => x + r.lvl, 0) / s.length
    const min = Math.min(...s.map(r => r.lvl))
    return avg - (avg - min) * 0.35
  }
  const gol = sector('GOL'), lat = sector('LAT'), zag = sector('ZAG'), mei = sector('MEI'), ata = sector('ATA')
  return { atk: ata * 0.45 + mei * 0.35 + lat * 0.20, def: gol * 0.30 + zag * 0.40 + lat * 0.15 + mei * 0.15 }
}

// ─── modo carreira: divisões, dificuldade e progressão ───────────────
const DIVISIONS: Division[] = ['D', 'C', 'B', 'A'] // de baixo pra cima
// DIFICULDADE = NÍVEL-BASE FIXO POR DIVISÃO, morando nos BOTS DE FUNDO.
// Cada divisão tem um "nível" próprio (D fraca → A elite). Os rivais de leilão
// NÃO levam ajuste nenhum: jogam a força que montaram no pregão (dividindo o
// baralho com você). Assim o SEU elenco decide subir/cair, e time bom é premiado.
// Rápido = Série D (fillers fracos + rivais do leilão). Online (sem rivais) usa
// um nível-base próprio, senão o campo fica fraco demais. Números validados em
// simulação (2500 temporadas/divisão).
const DIVISION_BASE: Record<Division, number> = { V: 58, D: 64, C: 70, B: 75, A: 82 } // V = várzea (nível peladão)
const ONLINE_BASE = 74
// 🥅 VÁRZEA: o leilão é 70% foi profissional, então o time do humano nasce mais
// FRACO (~71) que no normal (~76). A balança (fillerAdj) puxa os bots pra um alvo
// fixo — se ficasse em 74 (como o normal), os bots ficariam fortes demais e o humano
// terminava ~14-16º (medido). Alvo 69 deixa o humano ~2 acima da média dos bots →
// briga pelo título (top 5-6 em sala de 2, medido), sem ser de graça. Só na várzea.
const VARZEA_BASE = 69
// desloca os BOTS DE FUNDO (não-rivais) pra bater no nível-base alvo. Devolve um
// offset escalar (aplicado só aos fillers no simMatch); os rivais ficam com 0.
function fillerAdj(managers: Manager[], target: number): { atk: number; def: number } {
  const fillers = managers.filter(m => !m.isHuman && !m.auctionRival && m.squad.length > 0)
  if (fillers.length === 0) return { atk: 0, def: 0 }
  const nat = fillers.reduce((s, m) => { const p = midPower(m); return s + (p.atk + p.def) / 2 }, 0) / fillers.length
  const off = target - nat
  return { atk: off, def: off }
}
// alvo de nível conforme o modo: carreira usa a divisão; rápido = D; online = base própria.
function cpuAdjFor(s: EscState): { atk: number; def: number } {
  // 🏀 dificuldade cresce por andar da pirâmide do basquete: Street 0 · G League
  // +3 · NBA +6. Os times de cima são mais fortes — a NBA não é mole.
  if (s.sport === 'basquete' && s.nbaCareer) {
    const b = s.nbaTier === 'nba' ? 6 : s.nbaTier === 'gleague' ? 3 : 0
    return { atk: b, def: b }
  }
  const target = s.onlineMode === 'online' ? (s.varzea ? VARZEA_BASE : ONLINE_BASE) : DIVISION_BASE[s.careerDivision ?? 'D']
  return fillerAdj(s.managers, target)
}
// sobe (top 3), cai (Z4: 17º+) ou fica — limitado por A (topo) e D (base).
export function nextDivision(div: Division, youPos: number): { div: Division; result: 'up' | 'down' | 'stay' } {
  const i = DIVISIONS.indexOf(div)
  if (youPos <= 4 && i < DIVISIONS.length - 1) return { div: DIVISIONS[i + 1], result: 'up' }   // G4 sobe
  if (youPos >= 17 && i > 0) return { div: DIVISIONS[i - 1], result: 'down' }                    // Z4 cai
  return { div, result: 'stay' }
}
export const DIVISION_LABEL: Record<Division, string> = { A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D', V: 'Várzea' }
// o que é salvo na conta (Supabase) pra retomar a carreira depois.
// `division`/`seasonNo` já são os da PRÓXIMA temporada (subiu/caiu/ficou já
// resolvido no fim da temporada); `pendingDecision` marca que a pessoa salvou
// no fim da temporada SEM ter escolhido manter o time ou trocar tudo — então
// ao continuar a gente traz essa decisão de volta (não escolhe por ela).
export interface CareerSave {
  division: Division; seasonNo: number; teamName: string; formation: FormationKey; squad: WonCard[]; titles: number
  titlesA?: number                // títulos da Série A (estrelas). opcional p/ saves antigos
  pendingDecision?: boolean
  result?: 'up' | 'down' | 'stay' // pro banner subiu/caiu/ficou ao continuar
  prevDivision?: Division         // divisão da temporada que acabou (pro banner)
  rivals?: CareerRival[]          // rivais fixos (com divisão/retrospecto próprios)
  rivalCount?: number             // quantos rivais de leilão (3/5/7/9)
  deckLeague?: 'br' | 'eu' | 'both' | 'todos'  // baralho da carreira (opcional p/ saves antigos = br; 'todos' = BR+Europa+Mundo)
}

// rivais fixos da carreira: começam TODOS na Série D (com você). Depois cada um
// tem vida própria na pirâmide. `chosen` = times escolhidos pela pessoa (por
// nome do time); o que faltar completa com os primeiros da Série D.
function initCareerRivals(count: number, chosen?: string[]): CareerRival[] {
  const pool = DIVISION_TEAMS['D']
  const pickNames = (chosen && chosen.length > 0)
    ? [...chosen, ...pool.map(t => t.team).filter(t => !chosen.includes(t))].slice(0, count)
    : pool.slice(0, count).map(t => t.team)
  return pickNames.map(team => {
    const def = pool.find(t => t.team === team) ?? { name: team, team }
    return { team: def.team, name: def.name, division: 'D' as Division, h2h: [0, 0, 0] as [number, number, number], lastPos: null }
  })
}
// os rivais que estão AGORA na sua divisão (esses jogam contra você e brigam no leilão)
function coDivRivalDefs(rivals: CareerRival[], div: Division): CareerTeam[] {
  return rivals.filter(r => r.division === div).map(r => ({ name: r.name, team: r.team }))
}
// rivais que estão em OUTRA divisão: entram só como bidders no seu leilão
// (não jogam sua liga). É o que mantém a rivalidade viva no pregão mesmo quando
// eles subiram/caíram pra longe.
function otherDivRivalDefs(rivals: CareerRival[], div: Division): CareerTeam[] {
  return rivals.filter(r => r.division !== div).map(r => ({ name: r.name, team: r.team }))
}

// monta a liga da carreira: você + rivais QUE ESTÃO NA SUA DIVISÃO (dão lance no
// leilão e jogam contra você) + o resto da divisão como preenchimento nomeado.

// ─── MIGRAÇÃO de nomes de times renomeados, na CARGA do save ─────────────
// A carreira da pirâmide cria os 20 técnicos UMA vez e eles vivem no save —
// um time renomeado (ex.: Sinhô Futebol → White Thigs do GuGu) ficava com o
// nome da época pra sempre. Aqui, ao restaurar, todo nome velho vira o atual
// carregando junto colocação, elenco, caixa e títulos. Nome de HUMANO não muda.

// 🏢 vagas de empréstimo da SAF por divisão: quanto mais alto você joga, mais o
// clube-satélite te abastece. Vale pros DOIS lados (emprestar E pegar). Como os
// empréstimos voltam na virada, cada temporada pega o número da divisão NOVA.
export const FILIAL_SLOTS: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 }
export const filialSlots = (div?: string | null): number => FILIAL_SLOTS[div ?? 'D'] ?? 1
// 🏢 divisão ATUAL do humano: na pirâmide a fonte de verdade é a colocação
// (careerPlacements['m<id>']), que muda a cada acesso/queda. s.careerDivision só é
// atualizado no fluxo clássico — na pirâmide ficava travado em 'D', então as vagas de
// empréstimo nunca cresciam. Aqui pega o placement e cai pra careerDivision se faltar.
function myCareerDiv(s: EscState): string {
  const youId = s.managers[s.youIdx]?.id ?? s.youIdx
  return s.careerPlacements?.[`m${youId}`] ?? 'D' // ⚠️ NUNCA cair em careerDivision: é da DINASTIA (bug: 4 vagas na série D)
}
// normaliza empréstimo pra lista (saves antigos gravavam 1 jogador só, não array)
const loanList = (x: unknown): WonCard[] => Array.isArray(x) ? x as WonCard[] : x ? [x as WonCard] : []
// 🎽 quantos jogadores REALMENTE SÃO DELE: elenco real (sem fake e sem os que ele
// só pegou emprestado DA SAF) + os DELE que estão emprestados NA SAF (saíram do
// squad mas continuam sendo dele). Usado no destrave da troca de formação — sem
// contar o loanOut, quem tinha 22 e emprestou 1 ficava "com 21" e nunca destravava.
export function ownedRealCount(s: EscState, m: Manager): number {
  const own = m.squad.filter(c => !c.fake && c.emprestado !== 'saf').length
  const f = s.onlineMode === 'online' ? s.careerFilials?.[m.id] : s.careerFilial
  return own + loanList(f?.loanOut).length
}

// ── 🏢 GRUPO EMPRESARIAL (teste): comissão do DONO sobre a campanha da filial —
// 50% dos prêmios de título/acesso (e 50% do prejuízo na queda). NÃO inclui
// lucros de compra/venda do bot no mercado — só campanha. O acumulado fica em
// careerFilial.earned pro painel.
// 🏢 devolve os empréstimos de UM técnico (online: por-técnico na virada e na venda).
// Efeitos: mexe no elenco do técnico e no cpuSquads; devolve a SAF com as listas zeradas.
function returnFilialLoansFor(s: EscState, you: Manager, f: NonNullable<EscState['careerFilial']>): NonNullable<EscState['careerFilial']> {
  const outs = loanList(f.loanOut), ins = loanList(f.loanIn)
  if (outs.length === 0 && ins.length === 0) return f
  const cpuSq = { ...(s.cpuSquads ?? {}) }
  const safSquad = [...(cpuSq[f.team] ?? [])]
  for (const lo of outs) { const i = safSquad.findIndex(c => c.id === lo.id); if (i >= 0) safSquad.splice(i, 1); you.squad = [...you.squad, { ...lo, emprestado: undefined } as WonCard] }
  if (ins.length) { const inIds = new Set(ins.map(c => c.id)); you.squad = you.squad.filter(c => !inIds.has(c.id)); for (const li of ins) safSquad.push({ ...li, emprestado: undefined } as WonCard) }
  cpuSq[f.team] = safSquad; s.cpuSquads = cpuSq
  return { ...f, loanOut: [], loanIn: [] }
}
function applyFilialCommission(s: EscState, clubRewards: Record<string, number>) {
  if (s.onlineMode === 'online') {
    // 🏢 ONLINE: cada humano com SAF recebe 50% da campanha DELA no caixa dele.
    for (const you of s.managers.filter(m => m.isHuman)) {
      const f = s.careerFilials?.[you.id]; if (!f) continue
      const mgr = s.managers.find(m => !m.isHuman && m.teamName === f.team)
      const key = mgr ? `m${mgr.id}` : f.team
      const cut = Math.round((clubRewards[key] ?? 0) * 0.5)
      if (cut) {
        s.careerCoins = { ...(s.careerCoins ?? {}), [you.id]: (s.careerCoins?.[you.id] ?? 0) + cut }
        s.careerFilials = { ...(s.careerFilials ?? {}), [you.id]: { ...f, earned: (f.earned ?? 0) + cut } }
      }
      logFin(s, 'saf', '🏢 Prêmios da SAF', cut, undefined, you.id, true) // 🧾 extrato do dono da SAF (sempre, mesmo 0 — resumo de fim de temporada)
    }
    return
  }
  const f = s.careerFilial
  if (!f) return
  const mgr = s.managers.find(m => !m.isHuman && m.teamName === f.team)
  const key = mgr ? `m${mgr.id}` : f.team
  const delta = clubRewards[key] ?? 0
  const cut = Math.round(delta * 0.5)
  // 🏛️ MULTICLUBES: a comissão vai pro clube ATIVO (a SAF anda grudada nele) —
  // antes era "o primeiro humano da lista", que podia ser o clube DORMINDO
  // (dinheiro num clube, extrato no outro). Extrato agora leva o id certo.
  const you = s.managers[s.youIdx] ?? s.managers.find(m => m.isHuman && !m.dormindo)
  if (!you) return
  const before = s.careerCoins?.[you.id] ?? 0
  const after = before + cut // 50% de título/acesso rende; 50% da queda desconta (pode negativar) — pra o extrato bater
  if (cut) {
    s.careerCoins = { ...(s.careerCoins ?? {}), [you.id]: after }
    s.careerFilial = { ...f, earned: (f.earned ?? 0) + cut }
  }
  // 🧾 registra no extrato pela VARIAÇÃO REAL da caixa (título/acesso da SAF rende;
  // queda dela desconta) — SEMPRE (mesmo 0), pra o resumo de fim de temporada ficar
  // completo assim que a temporada acaba.
  logFin(s, 'saf', '🏢 Prêmios da SAF', after - before, undefined, you.id, true)
}

// 🏢 VALOR DE VENDA DA SAF (carreira solo): a SAF valoriza conforme você a
// desenvolve. Base 1.000 + bônus da DIVISÃO atual dela (D 0 · C +250 · B +500 ·
// A +750) + 250 por TÍTULO que ela ganhou (qualquer série). Teto 2.500. Você pagou
// 2.000 — então só uma SAF campeã na elite dá lucro de verdade (quem fica na D perde
// metade). Comissão já recebida NÃO conta (já caiu no seu bolso). Lê a divisão de
// careerPlacements e os títulos de careerHonors (chave = nome do clube, que é CPU).
const FILIAL_DIV_BONUS: Record<string, number> = { D: 0, C: 250, B: 500, A: 750 }
export const FILIAL_SALE_CAP = 2500
export function filialSaleValue(s: EscState, filial?: EscState['careerFilial']): { value: number; div: string; titles: number; divBonus: number; titleBonus: number; paid: number } {
  const f = filial ?? s.careerFilial
  const team = f?.team
  const div = (team && s.careerPlacements?.[team]) || 'D'
  const h = (team && s.careerHonors?.[team]) || { A: 0, B: 0, C: 0, D: 0 }
  const totalTitles = (h.A ?? 0) + (h.B ?? 0) + (h.C ?? 0) + (h.D ?? 0)
  // 🏢 só contam os títulos ganhos DEPOIS da compra — os que o clube já tinha na
  // vida dele (titlesAtBuy) não entram no seu lucro. Saves antigos sem o snapshot
  // caem em 0 (não conta nenhum histórico antigo, que é o comportamento correto).
  const titles = Math.max(0, totalTitles - (f?.titlesAtBuy ?? totalTitles))
  const divBonus = FILIAL_DIV_BONUS[div] ?? 0
  const titleBonus = titles * 250
  const value = Math.min(FILIAL_SALE_CAP, 1000 + divBonus + titleBonus)
  return { value, div, titles, divBonus, titleBonus, paid: 2000 }
}
// devolve os DOIS empréstimos ativos (se houver) na virada de temporada — a
// janela reabre do zero pra próxima: renovar o mesmo, escolher outro ou nenhum.
function revertFilialLoans(s: EscState) {
  if (s.onlineMode === 'online') {
    // 🏢 ONLINE: devolve os empréstimos de CADA técnico com SAF; janela reabre.
    for (const you of s.managers.filter(m => m.isHuman)) {
      const f = s.careerFilials?.[you.id]; if (!f) continue
      s.careerFilials = { ...(s.careerFilials ?? {}), [you.id]: returnFilialLoansFor(s, you, f) }
    }
    return
  }
  const f = s.careerFilial
  const outs = loanList(f?.loanOut)
  const ins = loanList(f?.loanIn)
  if (!f || (outs.length === 0 && ins.length === 0)) return
  const humans = s.managers.filter(m => m.isHuman)
  if (!humans.length) return
  // 🏛️ MULTICLUBES: a SAF é UMA só, compartilhada pelos 2 clubes. Cada empréstimo
  // sabe (byClub) qual clube fez — então devolvo pro dono CERTO. Sem 2º clube só
  // existe 1 humano → tudo cai nele, idêntico ao de antes.
  const ownerOf = (card: WonCard): Manager =>
    humans.find(m => m.id === card.byClub) ?? humans.find(m => m.id === s.managers[s.youIdx]?.id) ?? humans[0]
  const cpuSq = { ...(s.cpuSquads ?? {}) }
  const safSquad = [...(cpuSq[f.team] ?? [])]
  for (const lo of outs) {
    // seu jogador estava jogando na SAF: tira de lá (por id) e devolve pro clube DONO
    const i = safSquad.findIndex(c => c.id === lo.id)
    if (i >= 0) safSquad.splice(i, 1)
    const o = ownerOf(lo)
    o.squad = [...o.squad, { ...lo, emprestado: undefined, byClub: undefined } as WonCard]
  }
  if (ins.length) {
    // jogador da SAF estava jogando num dos seus clubes: tira de QUALQUER elenco seu
    // (por id) e devolve pra SAF — assim nunca duplica se estava no clube que dormia.
    const inIds = new Set(ins.map(c => c.id))
    for (const m of humans) m.squad = m.squad.filter(c => !inIds.has(c.id))
    for (const li of ins) safSquad.push({ ...li, emprestado: undefined, byClub: undefined } as WonCard)
  }
  cpuSq[f.team] = safSquad
  s.cpuSquads = cpuSq
  s.careerFilial = { ...f, loanOut: [], loanIn: [] }
}

// 🏢 na VIRADA de temporada o empréstimo NÃO volta mais sozinho — ele PERSISTE
// (o Diego pediu: quem quer mexer mexe, quem não quer mantém o que tinha). A ÚNICA
// devolução automática é o EXCEDENTE quando você é REBAIXADO e a divisão nova tem
// MENOS vagas: o que não cabe volta pro dono (loanOut) ou pra SAF (loanIn), sempre
// os últimos que entraram. Retorna quantos foram devolvidos (pra avisar na tela).
function trimFilialLoansToDivision(s: EscState): number {
  // devolve o excedente de UMA carteira: mantém os primeiros `cap` de cada direção.
  const trim = (owner: Manager, outs: WonCard[], ins: WonCard[], cap: number, safSquad: WonCard[]): { keptOut: WonCard[]; keptIn: WonCard[]; returned: number } => {
    let returned = 0
    const keptOut = outs.slice(0, cap), keptIn = ins.slice(0, cap)
    for (const lo of outs.slice(cap)) {
      const i = safSquad.findIndex(c => c.id === lo.id); if (i >= 0) safSquad.splice(i, 1)
      owner.squad = [...owner.squad, { ...lo, emprestado: undefined, byClub: undefined } as WonCard]; returned++
    }
    const excessIn = ins.slice(cap)
    if (excessIn.length) {
      const inIds = new Set(excessIn.map(c => c.id))
      for (const m of s.managers) if (m.isHuman) m.squad = m.squad.filter(c => !inIds.has(c.id))
      for (const li of excessIn) safSquad.push({ ...li, emprestado: undefined, byClub: undefined } as WonCard)
      returned += excessIn.length
    }
    return { keptOut, keptIn, returned }
  }
  if (s.onlineMode === 'online') {
    let returned = 0
    for (const you of s.managers.filter(m => m.isHuman)) {
      const f = s.careerFilials?.[you.id]; if (!f) continue
      const outs = loanList(f.loanOut), ins = loanList(f.loanIn)
      const cap = filialSlots(s.careerPlacements?.[`m${you.id}`] ?? 'D')
      if (outs.length <= cap && ins.length <= cap) continue
      const cpuSq = { ...(s.cpuSquads ?? {}) }
      const safSquad = [...(cpuSq[f.team] ?? [])] as WonCard[]
      const r = trim(you, outs, ins, cap, safSquad)
      cpuSq[f.team] = safSquad; s.cpuSquads = cpuSq
      s.careerFilials = { ...(s.careerFilials ?? {}), [you.id]: { ...f, loanOut: r.keptOut, loanIn: r.keptIn } }
      returned += r.returned
    }
    return returned
  }
  const f = s.careerFilial
  const outs = loanList(f?.loanOut), ins = loanList(f?.loanIn)
  if (!f || (outs.length === 0 && ins.length === 0)) return 0
  const humans = s.managers.filter(m => m.isHuman)
  if (!humans.length) return 0
  const cpuSq = { ...(s.cpuSquads ?? {}) }
  const safSquad = [...(cpuSq[f.team] ?? [])] as WonCard[]
  let returned = 0
  let keptOut: WonCard[] = [], keptIn: WonCard[] = []
  if (s.multiClube) {
    // 🏛️ MULTICLUBES: SAF compartilhada, cada clube tem sua divisão e sua vaga (byClub).
    // Trima por clube — o rebaixamento de UM não devolve o empréstimo do outro.
    for (const club of humans) {
      const cap = filialSlots(s.careerPlacements?.[`m${club.id}`] ?? 'D')
      const myOut = outs.filter(c => c.byClub === club.id)
      const myIn = ins.filter(c => c.byClub === club.id)
      const r = trim(club, myOut, myIn, cap, safSquad)
      keptOut.push(...r.keptOut); keptIn.push(...r.keptIn); returned += r.returned
    }
    // saves antigos sem byClub: mantém como estavam (não sei de qual clube são)
    keptOut.push(...outs.filter(c => c.byClub == null))
    keptIn.push(...ins.filter(c => c.byClub == null))
  } else {
    const cap = filialSlots(myCareerDiv(s))
    const r = trim(humans[0], outs, ins, cap, safSquad)
    keptOut = r.keptOut; keptIn = r.keptIn; returned = r.returned
  }
  cpuSq[f.team] = safSquad; s.cpuSquads = cpuSq
  s.careerFilial = { ...f, loanOut: keptOut, loanIn: keptIn }
  return returned
}

function migrateTeamNames(st: EscState): EscState {
  const mapKeys = <V,>(rec: Record<string, V> | null | undefined): typeof rec => {
    if (!rec) return rec
    const out: Record<string, V> = {}
    for (const k in rec) { const nk = newestTeamName(k); if (!(nk in out) || nk === k) out[nk] = rec[k] }
    return out
  }
  if (Array.isArray(st.managers)) st.managers = st.managers.map(m => m.isHuman ? m : { ...m, teamName: newestTeamName(m.teamName) })
  if (st.careerRivals) st.careerRivals = st.careerRivals.map(r => ({ ...r, team: newestTeamName(r.team) }))
  st.careerPlacements = mapKeys(st.careerPlacements) ?? st.careerPlacements
  st.cpuSquads = mapKeys(st.cpuSquads) ?? st.cpuSquads
  st.clubCash = mapKeys(st.clubCash) ?? st.clubCash
  st.careerHonors = mapKeys(st.careerHonors) ?? st.careerHonors
  st.careerCopaHonors = mapKeys(st.careerCopaHonors) ?? st.careerCopaHonors
  // 🏆 CURA (04/08, print do leodiniz85): carreiras novas herdavam as COPAS das
  // carreiras anteriores do aparelho (o START zerava careerHonors mas esquecia
  // careerCopaHonors) — dava "Copa21" na temporada 8. Só existe 1 Copa por
  // temporada: soma acima do nº de temporadas = histórico contaminado.
  // ⚖️ REGRA DO DIEGO ("cada carreira é independente; título ganho NÃO some"):
  // as SUAS Copas são RECONSTRUÍDAS pelos recibos de carta DESTA carreira (todo
  // título de Copa gerou um pacote — empresarioClaimKeys guarda ':copa' por
  // temporada, e o stash do 2º clube idem). Só os BOTS recomeçam do zero (não
  // existe registro por temporada deles). Cartas e ranking da home nunca
  // usaram este contador — sempre estiveram certos.
  {
    const somaCopas = Object.values(st.careerCopaHonors ?? {}).reduce((a, b) => a + (b || 0), 0)
    if (somaCopas > (st.seasonNo ?? 1)) {
      const rebuilt: Record<string, number> = {}
      const conta = (keys: string[] | undefined, donoId: number) => {
        const n = (keys ?? []).filter(k => k.endsWith(':copa')).length
        if (n > 0) rebuilt['m' + donoId] = (rebuilt['m' + donoId] ?? 0) + n
      }
      conta(st.empresarioClaimKeys, st.managers?.[st.youIdx]?.id ?? 0)
      if (st.multiClube) conta(st.multiClube.empresarioClaims, st.multiClube.id)
      st.careerCopaHonors = rebuilt
    }
  }
  // 🏢 saves antigos gravavam UM empréstimo (objeto); agora são LISTAS por divisão
  if (st.careerFilial) st.careerFilial = { ...st.careerFilial, loanOut: loanList(st.careerFilial.loanOut), loanIn: loanList(st.careerFilial.loanIn) }
  return st
}

function makeCareerManagers(teamName: string, formation: FormationKey, div: Division, rivalDefs: CareerTeam[], otherRivalDefs: CareerTeam[], rng: () => number): { managers: Manager[]; botPlans: BotPlan[] } {
  const forms: FormationKey[] = ['4-3-3', '4-4-2']
  const human: Manager = { id: 0, name: teamName, teamName, isHuman: true, auctionRival: true, formation, money: START_MONEY, squad: [], aggression: 0.5, starHunger: 0.5 }
  const usedTeams = new Set(rivalDefs.map(r => r.team))
  const fillerNeeded = LEAGUE_SIZE - 1 - rivalDefs.length
  const fillerDefs = DIVISION_TEAMS[div === 'V' ? 'D' : div].filter(t => !usedTeams.has(t.team)).slice(0, fillerNeeded)
  const cpus: Manager[] = []
  const botPlans: BotPlan[] = []
  let id = 1
  for (const r of rivalDefs) {
    cpus.push({ id, name: r.name, teamName: r.team, isHuman: false, auctionRival: true, formation: forms[Math.floor(rng() * forms.length)], money: START_MONEY, squad: [], aggression: 0.25 + rng() * 0.7, starHunger: rng() })
    id++
  }
  // rivais de OUTRA divisão: bidders "auction-only" — brigam no pregão mas não
  // entram na sua liga (buildLeague os ignora; saem dos managers na cerimônia).
  for (const r of otherRivalDefs) {
    cpus.push({ id, name: r.name, teamName: r.team, isHuman: false, auctionRival: true, auctionOnly: true, formation: forms[Math.floor(rng() * forms.length)], money: START_MONEY, squad: [], aggression: 0.25 + rng() * 0.7, starHunger: rng() })
    id++
  }
  // preenchimento: 10% fortes · 75% médios · 15% fracos (igual online rápido)
  const strongN = Math.max(1, Math.round(fillerDefs.length * 0.10))
  const weakN = Math.max(1, Math.round(fillerDefs.length * 0.15))
  // sorteia QUAIS times são fortes/fracos (não a ordem fixa) — senão são sempre os mesmos
  const fillerTiers = shuffle(
    Array.from({ length: fillerDefs.length }, (_, i): Tier => i < strongN ? 'strong' : i >= fillerDefs.length - weakN ? 'weak' : 'mid'),
    rng,
  )
  fillerDefs.forEach((f, i) => {
    const cpuFormation = forms[Math.floor(rng() * forms.length)]
    const tier: Tier = fillerTiers[i]
    botPlans.push({ id, tier, formation: cpuFormation })
    cpus.push({ id, name: f.name, teamName: f.team, isHuman: false, auctionRival: false, formation: cpuFormation, money: 0, squad: [], aggression: 0.5, starHunger: 0.5 })
    id++
  })
  return { managers: [human, ...cpus], botPlans }
}

// dá elenco aos CPUs que ainda estão vazios (usado no "continuar mesmo time",
// onde não há leilão): rivais novos e preenchimento ganham time; os rivais que
// vieram junto mantêm o elenco que já tinham.
function dealRemainingCpuSquads(managers: Manager[], rng: () => number, used: Set<string>) {
  const empties = managers.filter(m => !m.isHuman && m.squad.length === 0)
  // 10% fortes · 75% médios · 15% fracos (igual online rápido)
  const strongN = Math.max(1, Math.round(empties.length * 0.10))
  const weakN = Math.max(1, Math.round(empties.length * 0.15))
  // sorteia QUAIS times são fortes/fracos (não a ordem fixa) — senão são sempre os mesmos
  const tiers = shuffle(
    Array.from({ length: empties.length }, (_, i): Tier => i < strongN ? 'strong' : i >= empties.length - weakN ? 'weak' : 'mid'),
    rng,
  )
  empties.forEach((b, i) => {
    b.squad = makeBotSquad(b.formation, tiers[i], rng, used)
  })
}

// resolve o fim da temporada da carreira: SUA próxima divisão + a pirâmide dos
// rivais avançada. Cada rival tem vida própria: quem estava na sua divisão usa
// a posição real da tabela; os demais têm a temporada simulada (não renderizada).
// Todos sobem/caem sozinhos. O retrospecto (h2h) é somado durante os jogos.
interface CareerEnd { nextDiv: Division; result: 'up' | 'down' | 'stay'; wonTitle: boolean; rivals: CareerRival[] }
function resolveCareerEnd(s: EscState): CareerEnd {
  const div = s.careerDivision as Division
  const you = s.managers[s.youIdx]
  const table = sortedTable(s.league)
  const youPos = table.findIndex(t => t.id === you.id) + 1
  const wonTitle = table[0]?.id === you.id
  const nd = nextDivision(div, youPos)
  const rng = mulberry((s.seed ^ 0x5f3759df) >>> 0) // determinístico (save = advance)
  const rivals: CareerRival[] = s.careerRivals.map(rv => {
    let pos: number
    if (rv.division === div) {
      const m = s.managers.find(x => !x.isHuman && x.teamName === rv.team)
      pos = m ? table.findIndex(t => t.id === m.id) + 1 : 1 + Math.floor(rng() * LEAGUE_SIZE)
    } else {
      pos = 1 + Math.floor(rng() * LEAGUE_SIZE) // temporada dele simulada
    }
    return { ...rv, division: nextDivision(rv.division, pos).div, lastPos: pos }
  })
  return { nextDiv: nd.div, result: nd.result, wonTitle, rivals }
}

export function buildCareerSave(s: EscState): CareerSave | null {
  if (!s.careerDivision) return null
  const you = s.managers[s.youIdx]
  if (!you) return null
  // resolve o fim da temporada AQUI (título, subida/queda, +1 temporada, e a
  // pirâmide dos rivais) pra que continuar depois retome no ponto certo.
  const res = resolveCareerEnd(s)
  return {
    division: res.nextDiv, seasonNo: s.seasonNo + 1,
    teamName: you.teamName, formation: you.formation, squad: you.squad,
    titles: s.careerTitles + (res.wonTitle ? 1 : 0),
    titlesA: s.careerTitlesA + (res.wonTitle && s.careerDivision === 'A' ? 1 : 0),
    pendingDecision: true, result: res.result, prevDivision: s.careerDivision,
    rivals: res.rivals, rivalCount: s.careerRivalCount, deckLeague: s.deckLeague,
  }
}

function poisson(lambda: number, rng: () => number): number {
  const L = Math.exp(-lambda)
  let k = 0, p = 1
  do { k++; p *= rng() } while (p > L && k < 12)
  return Math.min(k - 1, 7) // teto de 7 gols: jogo muito desigual não vira goleada irreal (8×0, 9×0)
}

const CPU_TACTICS: Tactic[] = ['retranca', 'equilibrio', 'ataque']

function simMatch(state: EscState, homeId: number, awayId: number, rng: () => number, scorersList: ScorerRow[] = state.scorers, neutral = false): MatchResult {
  const isHuman = (id: number) => state.managers.some(m => m.id === id && m.isHuman)
  const involveHuman = isHuman(homeId) || isHuman(awayId)
  const tacticOf = (id: number): Tactic => {
    const m = state.managers.find(x => x.id === id)
    if (!m) return 'equilibrio'
    if (m.isHuman) return state.tactics[id] ?? 'equilibrio'
    return CPU_TACTICS[Math.floor(rng() * 3)]
  }
  const homeTactic = tacticOf(homeId)
  const awayTactic = tacticOf(awayId)
  const form = (id: number, opp: Tactic, own: Tactic): TeamForm => {
    const team = state.league.find(t => t.id === id)!
    if (!team.isManager) return { atk: team.baseAtk + state.cpuAtkAdj + (rng() * 6 - 3), def: team.baseDef + state.cpuDefAdj + (rng() * 6 - 3), inspired: null }
    const m = state.managers.find(x => x.id === id)!
    const f = rollManagerForm(m, own, opp, rng)
    // só os BOTS DE FUNDO (não-rivais) levam o ajuste, pra bater no nível-base da
    // divisão. Os rivais de leilão e os humanos jogam a própria força, sem ajuste.
    if (!m.isHuman && !m.auctionRival) { f.atk += state.cpuAtkAdj; f.def += state.cpuDefAdj }
    return f
  }
  const fh = form(homeId, awayTactic, homeTactic)
  const fa = form(awayId, homeTactic, awayTactic)
  // +0.25 = vantagem de jogar EM CASA. Campo NEUTRO (ex.: final da Copa, jogo único)
  // zera essa vantagem — aí os dois têm exatamente a mesma chance.
  const lh = Math.max(0.08, 1.35 + (fh.atk - fa.def) * 0.055 + (neutral ? 0 : 0.25))
  const la = Math.max(0.08, 1.35 + (fa.atk - fh.def) * 0.055)
  const hg = poisson(lh, rng), ag = poisson(la, rng)

  const highlights: MatchHighlight[] = []

  // 🏀 BASQUETE: placar de PONTOS (~100), sem empate (prorrogação). A "cestinha"
  // soma os pontos por jogador (todas as 5 posições pontuam; nível manda). Usa a
  // mesma força (fh/fa/táticas) do futebol — só o placar e a distribuição mudam.
  if (state.sport === 'basquete') {
    const scoreOf = (atkF: TeamForm, defF: TeamForm, home: boolean) =>
      Math.max(72, Math.round(100 + (atkF.atk - defF.def) * 0.85 + (home && !neutral ? 2.5 : 0) + (rng() * 26 - 13)))
    let hp = scoreOf(fh, fa, true)
    let ap = scoreOf(fa, fh, false)
    while (hp === ap) { if (rng() < 0.5) hp += 2; else ap += 2 } // prorrogação: nunca empata
    const hNameB = state.league.find(t => t.id === homeId)!.name
    const aNameB = state.league.find(t => t.id === awayId)!.name
    const POS_W: Record<string, number> = { GOL: 3, LAT: 4, ZAG: 3.5, MEI: 3, ATA: 3 } // PG/SG/SF/PF/C
    const creditPts = (id: number, pts: number, prefix: string) => {
      const m = state.managers.find(x => x.id === id)
      if (!m || m.squad.length === 0) return
      // peso define a ORDEM (quem é o astro): nível + posição + "dia" (variação por
      // jogo). O nível manda na média; o dia deixa um coadjuvante brilhar às vezes.
      const pool = m.squad.map(c => {
        const n = Math.max(0, ((c.lo + c.hi) / 2 - 40) / 42)
        return { name: c.name, w: (POS_W[c.pos] ?? 3) * (0.3 + Math.pow(n, 1.3) * 1.1) * (0.5 + rng() * 1.5) }
      })
      pool.sort((a, b) => b.w - a.w)
      // 🏀 só a ROTAÇÃO pontua (topo ~9); banco fundo quase não marca, igual à NBA.
      // Os pontos caem por DECAIMENTO de posto (astro ~28% do time, 2º ~21%…) —
      // assim o cestinha da liga fecha numa média REALISTA (~30/jogo) em vez de
      // um número inflado, e varia de temporada pra temporada (às vezes 37, às
      // vezes 28). Independe do tamanho do elenco (5 no quinteto ou 15 no cheio).
      const rotation = pool.slice(0, Math.min(9, pool.length))
      const DECAY = 0.76
      const shareW = rotation.map((_, i) => Math.pow(DECAY, i))
      const shareTot = shareW.reduce((s, x) => s + x, 0) || 1
      let left = pts
      rotation.forEach((p, i) => {
        const share = i === rotation.length - 1 ? left : Math.max(0, Math.min(left, Math.round(pts * shareW[i] / shareTot)))
        left -= share
        if (share <= 0) return
        const row = scorersList.find(s => s.name === p.name && s.teamId === id)
        if (row) row.goals += share
        else scorersList.push({ name: p.name, teamId: id, teamName: prefix, goals: share })
      })
      if (involveHuman) {
        const top = pool.slice(0, 3)
        for (let k = 0; k < Math.min(6, top.length * 2); k++) {
          const p = top[k % top.length]
          highlights.push({ min: 1 + Math.floor(rng() * 47), text: `🏀 ${p.name} anota para ${prefix}!`, teamId: id })
        }
      }
    }
    creditPts(homeId, hp, hNameB)
    creditPts(awayId, ap, aNameB)
    if (involveHuman) {
      highlights.sort((a, b) => a.min - b.min)
      for (const [id, f] of [[homeId, fh], [awayId, fa]] as [number, TeamForm][]) {
        if (f.inspired && isHuman(id)) {
          const tn = state.league.find(t => t.id === id)!.name
          state.news.unshift(`🔥 NOITE INSPIRADA: ${f.inspired} (${tn}) acordou astro na rodada ${state.round + 1}!`)
        }
      }
    }
    return { homeId, awayId, hg: hp, ag: ap, highlights }
  }

  // atribui os gols a um jogador real e credita na artilharia da temporada
  const creditGoals = (id: number, goals: number, prefix: string) => {
    const m = state.managers.find(x => x.id === id)
    // "DIA" do jogador (por PARTIDA): sorte de 0,4× a 2,6× no peso do gol — o Obina
    // iluminado pode roubar a cena do craque HOJE; na média o nível manda.
    const day = new Map<string, number>()
    if (m) for (const c of m.squad) day.set(c.id, 0.4 + rng() * 2.2)
    for (let g = 0; g < goals; g++) {
      // ~8% de chance de cair nos acréscimos (90+1 a 90+3) — NÃO passa de 93,
      // que é onde o relógio do card para (senão o gol some da tela e o placar
      // exibido diverge da tabela: vitória vira empate etc.).
      const min = rng() < 0.08 ? 90 + 1 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 90)
      let scorerName: string | null = null
      if (m && m.squad.length > 0) {
        const pool: { name: string; w: number }[] = []
        for (const c of m.squad) {
          // posição × NÍVEL² (igual à carreira): craque leva a maioria dos gols,
          // perna-de-pau quase nunca marca — antes era só por posição e o filler
          // de várzea brigava na artilharia com o Pelé.
          const posW = c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.4 : (/chilavert|ceni/i.test(c.name) ? 0.05 : 0)
          const n = Math.max(0, ((c.lo + c.hi) / 2 - 40) / 42)
          pool.push({ name: c.name, w: posW * (0.12 + n * n * 1.8) * (day.get(c.id) ?? 1) })
        }
        const total = pool.reduce((s, p) => s + p.w, 0)
        // 🧤 elenco degenerado (só goleiros/zagueiros sem peso = total 0): NÃO credita
        // ninguém — vira "Gol de {time}" genérico. Sem isto, o rng*0 caía no pool[0] e
        // um GOLEIRO podia ser cravado artilheiro (fere a regra do "sem perna-de-pau").
        if (total > 0) {
          let r = rng() * total
          for (const p of pool) { r -= p.w; if (r <= 0) { scorerName = p.name; break } }
          if (!scorerName) scorerName = pool[0].name
        }
      }
      if (scorerName) {
        // credita no ranking (liga = state.scorers; Copa = qc.scorers, passado à parte)
        const row = scorersList.find(s => s.name === scorerName && s.teamId === id)
        if (row) row.goals++
        else scorersList.push({ name: scorerName, teamId: id, teamName: prefix, goals: 1 })
        if (involveHuman) highlights.push({ min, text: `⚽ ${scorerName} marca para ${prefix}!`, teamId: id })
      } else if (involveHuman) {
        highlights.push({ min, text: `⚽ Gol de ${prefix}.`, teamId: id })
      }
    }
  }
  const hName = state.league.find(t => t.id === homeId)!.name
  const aName = state.league.find(t => t.id === awayId)!.name
  creditGoals(homeId, hg, hName)
  creditGoals(awayId, ag, aName)
  if (involveHuman) {
    highlights.sort((a, b) => a.min - b.min)
    for (const [id, f] of [[homeId, fh], [awayId, fa]] as [number, TeamForm][]) {
      if (f.inspired && isHuman(id)) {
        const tn = state.league.find(t => t.id === id)!.name
        state.news.unshift(`🔥 DIA INSPIRADO: ${f.inspired} (${tn}) acordou craque na rodada ${state.round + 1}!`)
      }
    }
  }
  return { homeId, awayId, hg, ag, highlights }
}

export function topScorers(state: EscState, limit = 10): ScorerRow[] {
  return [...state.scorers].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name)).slice(0, limit)
}

// ── 🏆 COPA DOS 8 (modo rápido) ──────────────────────────────────────────
// seed: top 8 da tabela final, pareado 1×8 · 2×7 · 3×6 · 4×5 — na ordem
// [1v8, 4v5, 2v7, 3v6] pra que os vencedores ADJACENTES (0-1 e 2-3) se
// cruzem nas semis, igual chaveamento de copa de verdade.
// 🏁 encerra a temporada (rápido): coroa o campeão da liga, semeia a Copa dos 8 se
// for o modo liga+copa, e vai pra tela de fim. Separado do PLAY_ROUND pra a ÚLTIMA
// partida poder ANIMAR na tela antes — a tela dispara FINISH_SEASON quando acaba.
function finishSeason(s: EscState) {
  s.champion = sortedTable(s.league)[0].id
  if (s.copaMode === 'liga_copa' && !s.quickCopa) {
    const bbCopa = s.sport === 'basquete'
    s.quickCopa = seedQuickCopa(s.league, bbCopa)
    // 📣 zera o giro da liga: durante a Copa o giro fala DA COPA, não das rodadas
    s.news = [bbCopa
      ? '🏆 Fim da temporada regular — chegaram os PLAYOFFS! Leste × Oeste, top 4 de cada conferência.'
      : '🏆 A liga acabou — chegou a COPA DOS 8! Os 8 melhores brigam pelo título.']
  }
  s.screen = 'end'
}
function seedQuickCopa(league: LeagueTeam[], nba = false): QuickCopaState {
  const sorted = sortedTable(league)
  const mk = (a: LeagueTeam, b: LeagueTeam): QuickCopaTie => ({ aId: a.id, bId: b.id, aName: a.name, bName: b.name, legs: [], winner: null })
  // 🏀 PLAYOFFS POR CONFERÊNCIA (Leste × Oeste): top 4 de CADA lado. Uma conferência
  // é cada METADE da chave (ties[0,1] = Leste, ties[2,3] = Oeste) — os campeões de
  // conferência (vencedores das semis) só se cruzam nas FINAIS. Conferência estável
  // por id (par = Leste, ímpar = Oeste). Se um lado não fecha 4, cai no top-8 único.
  if (nba) {
    const east = sorted.filter(t => t.id % 2 === 0).slice(0, 4)
    const west = sorted.filter(t => t.id % 2 !== 0).slice(0, 4)
    if (east.length === 4 && west.length === 4) {
      const ties = [mk(east[0], east[3]), mk(east[1], east[2]), mk(west[0], west[3]), mk(west[1], west[2])]
      return { phase: 'quartas', ties, legIdx: 0, bracket: [], scorers: [] }
    }
  }
  const top8 = sorted.slice(0, 8)
  const ties = [mk(top8[0], top8[7]), mk(top8[3], top8[4]), mk(top8[1], top8[6]), mk(top8[2], top8[5])]
  return { phase: 'quartas', ties, legIdx: 0, bracket: [], scorers: [] }
}
// resolve uma tie depois do(s) leg(s) jogado(s): soma o agregado; empate vira
// pênaltis (mesma fórmula da Copa da carreira — 3 a 5 cobranças, sem empatar 2x).
function resolveQuickCopaTie(tie: QuickCopaTie, rng: () => number) {
  const aggA = tie.legs.reduce((s2, l) => s2 + l[0], 0)
  const aggB = tie.legs.reduce((s2, l) => s2 + l[1], 0)
  if (aggA === aggB) {
    let x = 2 + Math.floor(rng() * 4), y = 2 + Math.floor(rng() * 4)
    if (x === y) (rng() < 0.5 ? x++ : y++)
    tie.pens = [x, y]
    tie.winner = x > y ? tie.aId : tie.bId
  } else {
    tie.winner = aggA > aggB ? tie.aId : tie.bId
  }
}

function applyResult(league: LeagueTeam[], r: MatchResult) {
  const h = league.find(t => t.id === r.homeId)!, a = league.find(t => t.id === r.awayId)!
  h.gf += r.hg; h.ga += r.ag; a.gf += r.ag; a.ga += r.hg
  if (r.hg > r.ag) { h.pts += 3; h.w++; a.l++ }
  else if (r.hg < r.ag) { a.pts += 3; a.w++; h.l++ }
  else { h.pts++; a.pts++; h.d++; a.d++ }
}

export function sortedTable(league: LeagueTeam[]): LeagueTeam[] {
  return [...league].sort((a, b) =>
    b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name))
}

// ─── rivalidade de clássicos (só entre humanos) ──────────────────────
export function rivKey(a: number, b: number): string { return a < b ? `${a}v${b}` : `${b}v${a}` }
// retrospecto de um humano contra um adversário, do ponto de vista de "youId"
export function rivalryOf(rivalries: Record<string, [number, number, number]>, youId: number, oppId: number): { w: number; l: number; d: number } {
  const rec = rivalries[rivKey(youId, oppId)]
  if (!rec) return { w: 0, l: 0, d: 0 }
  const youLow = youId < oppId
  return { w: youLow ? rec[0] : rec[1], l: youLow ? rec[1] : rec[0], d: rec[2] }
}
function bumpRivalry(s: EscState, aId: number, bId: number, aGoals: number, bGoals: number) {
  const key = rivKey(aId, bId)
  const cur: [number, number, number] = s.rivalries[key] ? [...s.rivalries[key]] : [0, 0, 0]
  const lowId = Math.min(aId, bId)
  if (aGoals === bGoals) cur[2]++
  else {
    const winnerId = aGoals > bGoals ? aId : bId
    if (winnerId === lowId) cur[0]++; else cur[1]++
  }
  s.rivalries[key] = cur
}

// carreira: soma o retrospecto (h2h) contra um rival fixo quando VOCÊ o enfrenta
// (só vale quando ele está na sua divisão). h2h = [suas vitórias, empates, dele].
function bumpCareerH2H(s: EscState, r: MatchResult) {
  const you = s.managers[s.youIdx]
  if (!you) return
  let oppId: number, myGoals: number, oppGoals: number
  if (r.homeId === you.id) { oppId = r.awayId; myGoals = r.hg; oppGoals = r.ag }
  else if (r.awayId === you.id) { oppId = r.homeId; myGoals = r.ag; oppGoals = r.hg }
  else return
  const opp = s.managers.find(m => m.id === oppId)
  if (!opp) return
  const rv = s.careerRivals.find(x => x.team === opp.teamName)
  if (!rv) return
  if (myGoals > oppGoals) rv.h2h[0]++
  else if (myGoals === oppGoals) rv.h2h[1]++
  else rv.h2h[2]++
}

// ─── narração viva da rodada: manchetes NEUTRAS (iguais pra sala toda) ───
// A parte pessoal ("Você colou no G4") é feita no cliente, por quem vê.
function narrateRound(s: EscState, results: MatchResult[], prevRank: Map<number, number>,
  prevGoals: Map<string, number>, roundNum: number): string[] {
  const nameOf = (id: number) => s.league.find(t => t.id === id)?.name ?? '?'
  const nowSorted = sortedTable(s.league)
  const heads: string[] = []

  // 1) novo líder?
  const leader = nowSorted[0]
  const prevLeaderId = [...prevRank.entries()].find(([, r]) => r === 1)?.[0]
  if (leader && prevLeaderId != null && prevLeaderId !== leader.id) {
    heads.push(`👑 ${leader.name} assumiu a liderança do campeonato!`)
  }

  // 2) cestinha/artilheiro pegando fogo (cruzou uma marca nesta rodada)
  const bbNews = s.sport === 'basquete'
  const fireStep = bbNews ? 25 : 5 // basquete conta em PONTOS (marca a cada 25); futebol a cada 5 gols
  let milestone: { name: string; team: string; g: number } | null = null
  for (const sc of s.scorers) {
    const before = prevGoals.get(sc.name + ':' + sc.teamId) ?? 0
    if (sc.goals >= fireStep && Math.floor(sc.goals / fireStep) > Math.floor(before / fireStep)) {
      if (!milestone || sc.goals > milestone.g) milestone = { name: sc.name, team: sc.teamName, g: sc.goals }
    }
  }
  if (milestone) heads.push(`🎯 ${milestone.name} (${milestone.team}) tá pegando fogo: ${milestone.g} ${bbNews ? 'pontos' : 'gols'} na temporada!`)

  // 3) zebra da rodada (vencedor bem pior colocado que o perdedor)
  let zebra: { winId: number; loseId: number; wr: number; lr: number; wg: number; lg: number; gap: number } | null = null
  for (const r of results) {
    if (r.hg === r.ag) continue
    const winId = r.hg > r.ag ? r.homeId : r.awayId
    const loseId = r.hg > r.ag ? r.awayId : r.homeId
    const wr = prevRank.get(winId) ?? 20, lr = prevRank.get(loseId) ?? 20
    const gap = wr - lr
    if (gap >= 8 && (!zebra || gap > zebra.gap)) {
      zebra = { winId, loseId, wr, lr, wg: Math.max(r.hg, r.ag), lg: Math.min(r.hg, r.ag), gap }
    }
  }
  if (zebra) heads.push(`😱 ZEBRA! ${nameOf(zebra.winId)} (${zebra.wr}º) derrubou o ${nameOf(zebra.loseId)} (${zebra.lr}º): ${zebra.wg}×${zebra.lg}.`)

  // 4) goleada/atropelo da rodada (fora a zebra, se sobrar espaço). No basquete a
  // margem de "atropelo" é bem maior (basta ver: 4 pontos não é goleada).
  let big: { r: MatchResult; d: number } | null = null
  const blowout = bbNews ? 18 : 4
  for (const r of results) {
    const d = Math.abs(r.hg - r.ag)
    if (d >= blowout && (!big || d > big.d)) big = { r, d }
  }
  if (big && (!zebra || (big.r.homeId !== zebra.winId && big.r.homeId !== zebra.loseId))) {
    const winId = big.r.hg > big.r.ag ? big.r.homeId : big.r.awayId
    const loseId = big.r.hg > big.r.ag ? big.r.awayId : big.r.homeId
    heads.push(`💥 ${nameOf(winId)} ${bbNews ? 'atropelou' : 'goleou'} o ${nameOf(loseId)}: ${Math.max(big.r.hg, big.r.ag)}×${Math.min(big.r.hg, big.r.ag)}.`)
  }

  return heads.slice(0, 3).map(h => `R${roundNum} · ${h}`)
}

// ─── monte final: ordem serpente por buracos ─────────────────────────
// jogador LISTADO (carreira online) que encalhou no leilão vai pro monte valendo
// METADE do valor (arredonda pra baixo; 1 → 0). Carta nova do baralho não tem
// valor, então não muda. É o que faz o Kaká (piso 30) cair pra 15 no monte.
function halveListed(cards: Card[]): Card[] {
  return cards.map(c => { const p = (c as { paid?: number }).paid; return p && p > 0 ? { ...c, paid: Math.floor(p / 2) } : c })
}
function buildMonteOrder(managers: Manager[], rng: () => number, careerOnline: boolean, soloYouId?: number): number[] {
  // bots fiadores e times de fundo do mercado NÃO entram no monte (com elenco
  // fundo de 22 vagas teriam buracos demais e pegariam as sobras antes dos
  // humanos). Eles só levam o que ganham no pregão pago.
  const holes = (m: Manager) => careerOnline ? careerHoles(m) : totalHoles(m)
  // 🏛️ MULTICLUBES: o clube DORMINDO (isHuman, assento meu) não pesca no monte —
  // sem excluí-lo, o monte parava na "vez" dele esperando uma escolha que nunca
  // vem e o leilão não fechava. No-op em jogo normal (ninguém dormindo).
  let withHoles = managers.filter(m => holes(m) > 0 && !m.backstop && !m.marketCpu && !m.dormindo)
  // 🏛️ SOLO (robusto): só o assento ATIVO (youIdx) pesca no monte pela tela. Qualquer
  // OUTRO assento humano (2º clube — dormindo OU com flag inconsistente por uma troca
  // no meio do leilão) travaria a pilha esperando uma escolha que nunca vem. Bots/rivais
  // (não-humanos) seguem pescando sozinhos. No online todos pescam no próprio aparelho.
  if (soloYouId != null) withHoles = withHoles.filter(m => !m.isHuman || m.id === soloYouId)
  if (withHoles.length === 0) return []
  const base = [...withHoles].sort((a, b) => holes(b) - holes(a) || rng() - 0.5).map(m => m.id)
  const maxHoles = Math.max(...withHoles.map(holes))
  const order: number[] = []
  for (let pass = 0; pass < maxHoles; pass++) {
    const seq = pass % 2 === 0 ? base : [...base].reverse()
    order.push(...seq)
  }
  return order
}

// carreira: carta COM piso (paid) no monte é "compra sem leilão" — só dá pra
// pegar se tem caixa pra pagar. Sobra sem piso (0) é de graça, e a SUA própria
// carta listada também (não paga a si mesmo).
function monteAfford(m: Manager, c: Card, careerOnline: boolean): boolean {
  const p = (c as { paid?: number }).paid ?? 0
  if (!careerOnline || p <= 0) return true
  if ((c as { seller?: number }).seller === m.id) return true // sua própria carta listada: de graça
  return m.money >= p
}
// PREFERÊNCIA (carreira): quem listou um jogador tem a PRIMEIRA CHANCE de pegá-lo
// de volta no monte. Não é reserva — a carta fica travada pros outros só até o
// dono TER A VEZ dele (primeira aparição na ordem do monte). Depois que ele teve a
// chance (pegou outra, deixou passar ou estourou o tempo), abre pros outros pela
// metade. Carta de bot do mercado não tem preferência.
export function monteLocked(state: EscState, m: Manager, c: Card): boolean {
  if (!state.careerOnline) return false
  const sellerId = (c as { seller?: number }).seller
  if (sellerId == null || sellerId === m.id) return false
  const seller = state.managers.find(x => x.id === sellerId)
  if (!seller || seller.backstop || seller.marketCpu || careerHoles(seller) === 0) return false
  const ownerHadTurn = state.monteOrder.slice(0, state.monteIdx).includes(sellerId)
  return !ownerHadTurn // trava só ENQUANTO o dono ainda não teve a vez dele
}
// pode o técnico m pegar a carta c AGORA? vaga na posição + consegue pagar + não
// está reservada pro dono.
export function montePickable(state: EscState, m: Manager, c: Card): boolean {
  const open = state.careerOnline ? careerOpenSlots(m, c.pos) : openSlots(m, c.pos)
  // 📝 ANTI-MALANDRAGEM: contrato vencido não volta de graça pro ex-dono pelo
  // monte (senão "deixar vencer" saía mais barato que renovar). Vale pros DOIS
  // clubes do dono (😤 magoado). Só com outro clube comprando e voltando um dia.
  if ((c as { semContrato?: boolean }).semContrato && mesmoDono(state, m.id, (c as { seller?: number }).seller)) return false
  return open > 0 && monteAfford(m, c, !!state.careerOnline) && !monteLocked(state, m, c)
}
function monteAutoPick(state: EscState, m: Manager, monte: Card[], rng: () => number): Card | null {
  const valid = monte.filter(c => montePickable(state, m, c))
  if (valid.length === 0) return null
  // preferência de verdade: se o PRÓPRIO listado do rival encalhou no monte e
  // ainda cabe no elenco, ele pega de volta (de graça) antes de olhar o resto —
  // exatamente como o humano faria na vez dele.
  const own = valid.find(c => (c as { seller?: number }).seller === m.id)
  if (own) return own
  const ranked = valid.map(c => ({ c, v: perceived(c, rng) })).sort((a, b) => b.v - a.v)
  return ranked[0].c
}

// pior sobra válida — usada só nos modos CLÁSSICOS quando um humano deixa o tempo
// do Monte estourar (AFK): lá o Monte é pra FECHAR o XI, então preenche na marra.
function monteWorstPick(state: EscState, m: Manager, monte: Card[], rng: () => number): Card | null {
  const valid = monte.filter(c => montePickable(state, m, c))
  if (valid.length === 0) return null
  const ranked = valid.map(c => ({ c, v: perceived(c, rng) })).sort((a, b) => a.v - b.v)
  return ranked[0].c
}

const MONTE_MS = 45_000
export const MONTE_SECONDS = MONTE_MS / 1000
const MONTE_AFK_PENALTY = 5

// define/limpa o prazo da vez atual do Monte (só vale no online, pra técnico humano)
function refreshMonteDeadline(state: EscState) {
  const cur = state.monteOrder[state.monteIdx]
  const m = state.managers.find(x => x.id === cur)
  state.monteDeadline =
    state.onlineMode === 'online' && state.screen === 'monte' && !!m && m.isHuman && state.monte.some(c => openSlots(m, c.pos) > 0)
      ? Date.now() + MONTE_MS
      : null
}

function takeFromMonte(state: EscState, cardId: string) {
  const idx = state.monte.findIndex(c => c.id === cardId)
  if (idx < 0) return
  const card = state.monte[idx]
  const mgrId = state.monteOrder[state.monteIdx]
  const m = state.managers.find(x => x.id === mgrId)!
  state.monte.splice(idx, 1)
  // preserva o valor (jogador listado já veio pela metade); carta nova = 0
  const paid = (card as { paid?: number }).paid ?? 0
  // carreira: jogador COM piso é COMPRA SEM LEILÃO — paga o valor (deduz da caixa).
  // Sobra sem piso (0) é de graça, e a SUA própria carta listada também (não paga a
  // si mesmo). O vendedor (outro) recebe como sempre.
  const isOwn = (card as { seller?: number }).seller === mgrId
  if (state.careerOnline && paid > 0 && !isOwn) {
    m.money = m.money - paid // deduz o valor cheio (pode negativar) — bate com o lançamento do extrato
    if (m.isHuman) logFin(state, 'buy', `🛒 ${card.name}`, -paid, { player: card.name, pos: card.pos }, m.id) // 🧾 compra no monte
  }
  creditSeller(state, card, paid, mgrId) // vendedor recebe o valor mesmo indo pelo monte
  agenciaTransacao(state, card) // 🕴️ agenciado mudou de clube pelo monte → comissão
  m.squad.push({ ...card, paid, buyPrice: paid, via: 'monte', semContrato: undefined, contratoAte: undefined })
  mirrorWallets(state) // 💰 compra no monte sai da caixa NA HORA
}

// avança o ponteiro do monte, deixando CPUs escolherem sozinhas.
// Para em técnico humano (aguarda a escolha dele).
function advanceMonte(state: EscState, rng: () => number) {
  while (state.monteIdx < state.monteOrder.length) {
    // Monte vazio: não tem NADA pra pegar — encerra (pula pro fim, o chamador
    // manda pra cerimônia). Antes travava mostrando um Monte vazio com contagem.
    if (state.monte.length === 0) { state.monteIdx = state.monteOrder.length; break }
    const mgrId = state.monteOrder[state.monteIdx]
    const m = state.managers.find(x => x.id === mgrId)!
    // pula quem NÃO tem pesca válida: sem buraco OU o Monte não tem carta pras
    // posições que faltam pra ele. Antes travava um humano com buraco mas sem
    // carta que servisse, com o cronômetro rodando à toa.
    if (!state.monte.some(c => montePickable(state, m, c))) { state.monteIdx++; continue }
    if (m.isHuman) { refreshMonteDeadline(state); return }
    const pick = monteAutoPick(state, m, state.monte, rng)
    if (pick) takeFromMonte(state, pick.id)
    state.monteIdx++
  }
  state.monteDeadline = null
}

// ─── bots de preenchimento (online): elenco pronto, nunca dão lance ────
// tier controla a força — cria variedade real na tabela (uns fortes, a
// maioria mediana, uns fracos) sem depender do leilão pra existir.
type Tier = 'strong' | 'mid' | 'weak'
function makeBotSquad(formation: FormationKey, tier: Tier, rng: () => number, used: Set<string>, varzea = false): WonCard[] {
  const squad: WonCard[] = []
  for (const pos of SECTORS) {
    const need = baseSlots(formation, pos)
    const shuffled = shuffle(ACTIVE_CATALOG[pos], rng).filter(c => !used.has(ident(c)))
    let picks: (typeof CATALOG)[Sector][number][]
    if (varzea) {
      // 🥅 VÁRZEA (decisão do Diego 02/08): "coloque só bom jogador e foi
      // profissional; se não tem de um, bota o outro", ESPALHANDO — todo time tem
      // mistura, o FRACO leva mais foi profissional e o FORTE mais bom jogador. Como
      // o baralho BR tem pouco foi profissional (~74 pra 20 times), os times fracos
      // são montados PRIMEIRO (ver dealBotSquads) pra o foi profissional cair no time
      // certo — assim o tier de força vale de verdade, em vez de o perna-curta cair
      // por sorteio. Se a posição ficar sem um tipo, completa com o outro (nunca fake).
      const foiRate = tier === 'strong' ? 0.22 : tier === 'weak' ? 0.55 : 0.40
      const nFoi = Math.round(need * foiRate)
      const foi = shuffled.filter(c => c.fame === 1 && !c.promessa)
      const bom = shuffled.filter(c => (c.fame === 2 || c.fame === 3) && !c.promessa) // 💎 promessa NÃO joga várzea (régua do Diego)
      picks = [...foi.slice(0, nFoi), ...bom.slice(0, need - nFoi)]
      // se faltou de um lado (posição com poucos de um tipo), completa do outro
      if (picks.length < need) for (const c of [...bom.slice(need - nFoi), ...foi.slice(nFoi)]) { if (picks.length >= need) break; picks.push(c) }
    } else {
      const pool = tier === 'strong' ? shuffled.filter(c => c.fame >= 3)
        : tier === 'weak' ? shuffled.filter(c => c.fame <= 2)
        : shuffled.filter(c => c.fame === 2 || c.fame === 3)
      picks = pool.slice(0, need)
    }
    for (const c of picks) used.add(ident(c))
    let gi = 0
    while (picks.length < need) {
      picks.push(makeIncognita(pos, squad.length + picks.length, tier === 'strong' && gi < 1, rng, '', ACTIVE_SPORT === 'basquete'))
      gi++
    }
    for (const c of picks) squad.push({ ...c, id: `bot-${pos}-${squad.length}-${Math.floor(rng() * 1e6)}`, pos, paid: 0, via: 'bot' })
  }
  return squad
}

// ─── setup de técnicos ───────────────────────────────────────────────
// A tabela SEMPRE tem `leagueSize` times com elenco nomeado. Os CPUs se
// dividem em dois papéis:
//   • `auctionCpus` RIVAIS de leilão — dão lance junto com você, montam o time
//     NO pregão (solo/carreira: os 3/5/7/9 que você escolhe; online: 0).
//   • o RESTO é PREENCHIMENTO — já entra com elenco pronto (via botPlans),
//     nunca dá lance, só completa a tabela. Como todos têm jogadores com nome,
//     a artilharia mostra o campeonato inteiro (igual solo e online).
// Devolve os "planos" dos bots de preenchimento pra montar o baralho do leilão
// PRIMEIRO (reservando os reais pros que disputam) e só depois escalar o resto.
type BotPlan = { id: number; tier: Tier; formation: FormationKey }
function makeManagers(humanNames: string[], formation: FormationKey, auctionCpus: number, leagueSize: number, rng: () => number, cpuNameOrder?: { team: string; name: string }[]): { managers: Manager[]; botPlans: BotPlan[] } {
  const forms: FormationKey[] = ['4-3-3', '4-4-2']
  const humans: Manager[] = humanNames.map((name, i) => ({
    id: i, name, teamName: name, isHuman: true, auctionRival: true,
    formation, money: START_MONEY, squad: [], aggression: 0.5, starHunger: 0.5,
  }))
  const totalCpus = Math.max(0, leagueSize - humans.length)
  const nAuction = Math.min(Math.max(0, auctionCpus), totalCpus)
  const nFiller = totalCpus - nAuction
  // distribuição de força dos bots de preenchimento: 9% fortes · 76% médios · 15%
  // fracos. Forte arredonda PRA BAIXO (floor): senão, numa liga de 20 (~18 bots),
  // 9% e 10% davam os mesmos 2 fortes e o corte não valia — com floor vira 1.
  const strongN = Math.max(1, Math.floor(nFiller * 0.09))
  const weakN = Math.max(1, Math.round(nFiller * 0.15))
  // times dos CPUs = os mesmos da Série D da carreira (online e revanche usam a
  // divisão de base, pra não aparecer nome velho tipo "Nininho EC").
  // ordem dos nomes de CPU: padrão = Série D; solo pode passar os rivais escolhidos
  // PRIMEIRO (viram os auction-rivals nomeados), depois o resto da D (sem repetir).
  const names = (cpuNameOrder ?? DIVISION_TEAMS['D']).slice(0, totalCpus)
  // QUAIS times são fortes/fracos é SORTEADO (não a ordem fixa da lista) — senão
  // são sempre os mesmos nomes brigando (ex.: Paixandu Magrão, Biriba United). A
  // quantidade de cada nível não muda; só varia quem calha de ser forte/fraco.
  const fillerTiers = shuffle(
    Array.from({ length: nFiller }, (_, i): Tier => i < strongN ? 'strong' : i >= nFiller - weakN ? 'weak' : 'mid'),
    rng,
  )
  const botPlans: BotPlan[] = []
  const cpus: Manager[] = names.map((c, i) => {
    const cpuFormation = forms[Math.floor(rng() * forms.length)]
    const id = humans.length + i
    if (i < nAuction) {
      // rival de leilão: monta o time NO pregão (dá lance)
      return {
        id, name: c.name, teamName: c.team, isHuman: false, auctionRival: true,
        formation: cpuFormation, money: START_MONEY, squad: [], aggression: 0.25 + rng() * 0.7, starHunger: rng(),
      }
    }
    // preenchimento: elenco pronto, nunca dá lance
    const fi = i - nAuction
    const tier: Tier = fillerTiers[fi]
    botPlans.push({ id, tier, formation: cpuFormation })
    return {
      id, name: c.name, teamName: c.team, isHuman: false, auctionRival: false,
      formation: cpuFormation, money: 0, squad: [], aggression: 0.5, starHunger: 0.5,
    }
  })
  return { managers: [...humans, ...cpus], botPlans }
}

// escala os bots DEPOIS do baralho do leilão já ter reservado os reais que
// os humanos vão disputar. `used` chega com os nomes do baralho dentro.
function dealBotSquads(managers: Manager[], botPlans: BotPlan[], rng: () => number, used: Set<string>, varzea = false) {
  // 🥅 VÁRZEA: monta os times FRACOS primeiro. O baralho BR tem pouco foi
  // profissional (~74 pra 20 times); dando pros fracos ANTES, eles ficam de fato
  // mais fracos (mais perna-curta) e os fortes, montados por último, pegam mais bom
  // jogador — o tier de força vale de verdade. Fora da várzea a ordem não importa.
  const rank: Record<Tier, number> = { weak: 0, mid: 1, strong: 2 }
  const order = varzea ? [...botPlans].sort((a, b) => rank[a.tier] - rank[b.tier]) : botPlans
  for (const plan of order) {
    const bot = managers.find(m => m.id === plan.id)
    if (bot) bot.squad = makeBotSquad(plan.formation, plan.tier, rng, used, varzea)
  }
}

// ─── estado inicial ──────────────────────────────────────────────────
// exportado (além do uso interno) pra permitir simulações headless da carreira
// em testes — só leitura do estado-semente, nenhum efeito no jogo.
export const INITIAL: EscState = {
  screen: 'intro', seed: 1,
  onlineMode: 'cpu', roomId: '', roomCode: '', isHost: true,
  humanCount: 1, submitted: [], pendingEnvelopes: {}, presence: [],
  managers: [], youIdx: 0,
  sectorIdx: 0, deck: { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] },
  phase: 'envelope', currentCards: [], revealQueue: [], revealIdx: 0,
  stock: { GOL: 0, LAT: 0, ZAG: 0, MEI: 0, ATA: 0 },
  monte: [], monteOrder: [], monteIdx: 0,
  league: [], fixtures: [], round: 0, tactics: {}, careerTactics: {}, careerCoins: {}, clubCash: {}, careerHonors: {}, marketValues: {}, marketLog: [],
  lastResults: [], news: [], champion: null,
  deckLeague: 'br', careerDivision: null, careerOnline: false, careerPlacements: null, careerIntent: false, careerTitles: 0, careerTitlesA: 0, careerRivalCount: 5, careerRivals: [],
  phaseDeadline: null, scorers: [],
  monteDeadline: null, cerimoniaDeadline: null,
  cpuAtkAdj: 0, cpuDefAdj: 0, streamMode: false, manualRoom: false,
  sectorCursor: 0, sectorUnsoldAccum: [], roundIdx: 0,
  seasonNo: 1,
  restartPending: false, restartReady: [],
  tiebreaks: [], tiebreakIdx: 0, tiebreakPending: {},
  rivalries: {},
}

// ─── ações ───────────────────────────────────────────────────────────
type Action =
  | { type: 'GO_LOBBY' }
  | { type: 'GO_LOBBY_ONLINE' }
  | { type: 'KICKED_OUT' }
  | { type: 'GO_SETUP' }
  | { type: 'GO_SETUP_CAREER' }
  | { type: 'GO_ALBUM' }
  | { type: 'GO_RANKING' }
  | { type: 'START'; teamName: string; formation: FormationKey; rivals: number; career?: boolean; rivalTeams?: string[]; dinastia?: boolean; budget?: number; league?: 'br' | 'eu' | 'both' | 'todos'; copaMode?: 'liga' | 'liga_copa'; intro?: boolean }
  | { type: 'START_NBA'; teamName: string; rivals: number } // 🏀 jogo rápido do basquete (mesmo motor)
  | { type: 'START_NBA_CAREER'; teamName: string } // 🏀 carreira: Street League (liga cheia, rotação de 10). Em teste.
  | { type: 'NEXT_NBA_SEASON' } // 🏀 carreira: avança a temporada e abre o leilão de reservas (mantém o quinteto)
  | { type: 'RESUME_NBA_CAREER'; saved: EscState } // 🏀 retoma a carreira do basquete salva (bl-nba-career)
  | { type: 'TOGGLE_NBA_RELEASE'; cardId: string } // 🏀 carreira: marca/desmarca uma reserva pra DISPENSAR (T3+); repõe no leilão
  | { type: 'START_CAREER_SOLO'; teamName: string; formation: FormationKey; rivals: number; rivalTeams?: string[]; league?: 'br' | 'eu' | 'both' | 'todos'; intro?: boolean } // carreira OFFLINE na pirâmide (mesmas regras do online, sozinho vs CPU). Em teste.
  | { type: 'RESUME_CAREER_SOLO'; saved: EscState } // retoma a carreira offline salva no localStorage
  | { type: 'CAREER_ADVANCE'; keep: boolean }
  | { type: 'CHANGE_FORMATION'; formation: FormationKey; mgrId?: number } // 🎽 carreira: troca 4-3-3↔4-4-2. Só libera com 22 no elenco E jogadores reais suficientes por posição (nunca entra fake). Aplica da rodada atual em diante.
  | { type: 'FORMATION_UNLOCK'; mgrId?: number } // 🎽 marca o destravamento permanente da troca de formação (1ª vez que chega a 22 reais)
  | { type: 'RESTORE_CAREER'; save: CareerSave; redraft?: boolean }
  | { type: 'START_DINASTIA_SEASON'; teamName: string; formation: FormationKey; division: Division; seasonNo: number; squad: WonCard[]; others: { name: string; squad: Card[] }[]; rivals?: { team: string; name: string; division: Division }[] }
  | { type: 'RESUME_DINASTIA' }
  | { type: 'START_ONLINE'; roomId: string; roomCode: string; roomName?: string; isHost: boolean; playerIndex: number; playerNames: string[]; formation: FormationKey; stream?: boolean; manual?: boolean; chatOff?: boolean; auctionSecs?: number; deck?: 'br' | 'eu' | 'both' | 'todos'; varzea?: boolean; career?: boolean; ligaFechada?: boolean; locked?: boolean; pwHash?: string; rematch?: number; copaMode?: 'liga' | 'liga_copa'; rivals?: number; rivalTeams?: string[] }
  | { type: 'REAUCTION_ONLINE'; placements: Record<string, string>; rewards?: Record<number, number>; clubRewards?: Record<string, number>; champions?: Record<string, 'A' | 'B' | 'C' | 'D' | 'V'>; scorerValues?: Record<string, number>; copaChampion?: string | null } // carreira online: aplica acessos/quedas e refaz o LEILÃO (novo time), orçamento parelho
  | { type: 'OPEN_RESERVE_LIST'; placements: Record<string, string>; rewards?: Record<number, number>; clubRewards?: Record<string, number>; champions?: Record<string, 'A' | 'B' | 'C' | 'D' | 'V'>; scorerValues?: Record<string, number>; copaChampion?: string | null; mesmo?: boolean } // carreira online: abre a tela de VENDA (listar pra leilão) já na temporada nova, antes da compra. mesmo=true → votou "mesmo time": mesma tela, SÓ decide contrato, sem mercado/leilão depois (vai pro CONFIRM_MESMO_TIME)
  | { type: 'TOGGLE_RESERVE_LIST'; mgrId: number; cardId: string } // carreira online: lista/tira uma carta da lista de leilão (respeita o XI completo)
  | { type: 'RELEASE_CONTRACT'; mgrId: number; cardId: string } // 🌱 marca/desmarca "deixar ir" na janela de renovação (se quebrar o XI, um Cria da Base assume)
  | { type: 'RENEW_CONTRACT'; mgrId: number; cardId: string; anos: 5 | 10 } // 📝 CONTRATOS: renova um jogador com contrato ENCERRADO — 10 anos = valor oficial cheio, 5 = metade. Prazo real sai com tempero (±1) pra nunca re-alinhar vencimentos. Na tela de venda (reserveList); quem não renovar vai pro leilão com teto de venda
  | { type: 'CONFIRM_MESMO_TIME' } // 🔒 fecha a janela de contratos do voto "mesmo time" (sem leilão): processa Deixar ir/Renovar decididos e volta pra temporada
  | { type: 'CAST_SEASON_VOTE'; mgrId: number; vote: 'leilao' | 'mesmo' } // carreira online: voto de fim de temporada (leilão de transferências x mesmo time)
  | { type: 'RECORD_SEASON_STATS'; scorers: { name: string; teamName: string; teamId: number; div: 'A' | 'B' | 'C' | 'D' | 'V'; goals: number; you: boolean; human: boolean }[] } // carreira online: soma os artilheiros da temporada no acumulado de todos os tempos
  | { type: 'BANCO_CREDIT'; coins: number; code: string } // 🏦 Banco Legends: ficha resgatada (RPC já validou/queimou no Supabase) — credita no caixa do clube ATIVO e registra no extrato. Só carreira solo
  | { type: 'SET_AGENCIA'; cards: AgCard[] } // 🕴️ AGÊNCIA 2.0: grava a convocação dos até 22 "na ativa" (escolhidos do álbum). Só carreira solo nova (agenciaOn)
  | { type: 'SET_AGENCIA_CLUBE'; mgrId: number; dividir?: boolean } // 🕴️×🏛️ com 2 clubes: escolhe pra qual caixa vai a renda da agência (ou dividir meio a meio) — toggle na tela dos Agenciados
  | { type: 'AGENCIA_SEASON_EVENTS'; season: number; rows: AgEvento[] } // 🕴️ AGÊNCIA 2.0: eventos da temporada (artilheiro/campeão dos agenciados) — computados na tela quando a Copa termina; pagos na virada. Idempotente por temporada
  | { type: 'SEED_CPU_SQUADS'; squads: Record<string, Card[]> } // pirâmide: materializa a ficha dos 60 times de fundo (1x)
  | { type: 'RESERVE_AUCTION_ONLINE' } // carreira online: fecha a venda e ABRE o leilão de reservas (compra) — consome a lista, mira 22, orçamento = caixa
  | { type: 'RESTORE_ONLINE'; state: EscState; roomId: string; roomCode: string; isHost: boolean; playerIndex: number }
  | { type: 'SYNC_STATE'; newState: EscState }
  | { type: 'SET_PRESENCE'; indices: number[] }
  | { type: 'MARK_COPA_DONE' }
  | { type: 'CLOSE_SEASON_BOOKS'; rewards?: Record<number, number> } // 💰 fecha as contas da temporada (prêmios + bilheteria + patrocínio + empresário − folha) assim que liga+copas acabam
  | { type: 'SET_CHAT'; off: boolean } // 💬 host liga/desliga o chat da sala
  | { type: 'SET_SIM_SPEED'; speed: number } // ⏩ velocidade da simulação (host/solo)
  | { type: 'SET_STREAM_CHAMP_CARD'; slot: 'liga' | 'copa'; card: WonCard } // 🎥 stream: guarda a carta do campeão pra sala inteira ver/abrir
  | { type: 'STADIUM_INVEST'; mgrId: number; sector: string } // 🏟️ carreira: investe +20 no setor
  | { type: 'STADIUM_BUILD'; mgrId: number; ext: string } // 🏟️ carreira: compra melhoria destravada
  | { type: 'BECOME_HOST' }
  | { type: 'FIX_YOU_IDX'; idx: number } // 🛟 auto-cura local: reancora "quem sou eu" no assento com o MEU nome (índice deslizou em rematch/reconexão). NUNCA roteado pro host.
  | { type: 'COPA_MUNDO_PRIZE'; mgrId: number } // 🌍 prêmio do campeão da Copa do Mundo Legends: +100 moedas (só carreira SOLO — no online cada um joga local, não sincroniza caixa)
  | { type: 'KICK_PLAYER'; playerIndex: number }
  | { type: 'SUBMIT_ENVELOPE'; mgrId: number; bids: { cardId: string; amount: number }[] }
  | { type: 'ADVANCE_REVEAL' }
  | { type: 'FORCE_SEAL' }
  | { type: 'SET_MANUAL_ROOM'; on: boolean } // 🎮 host troca o ritmo (auto/manual) no meio da carreira online — sincroniza pra todos
  | { type: 'SUBMIT_TIEBREAK'; mgrId: number; amount: number }
  | { type: 'FORCE_TIEBREAK' }
  | { type: 'MONTE_PICK'; mgrId: number; cardId: string }
  | { type: 'MONTE_TIMEOUT' }
  | { type: 'SET_SPONSOR'; id: string; mgrId?: number } // 👕 escolhe a marca do patrocínio (solo: careerSponsor · online: careerSponsors[mgrId])
  | { type: 'BUY_FILIAL'; team: string; mgrId?: number } // 🏢 compra o clube-filial (solo: careerFilial · online: careerFilials[mgrId])
  | { type: 'BUY_MULTICLUBE'; team: string } // 🏛️ MULTICLUBES (solo): compra um 2º clube da Série D por 4.000 moedas (só Lenda; trava de tier fica na UI)
  | { type: 'SWITCH_MULTICLUBE' } // 🏛️ MULTICLUBES (solo): passa o comando pro outro clube (só entre temporadas). O que sai dorme.
  | { type: 'CLEAR_MULTICLUBE_PENDING'; mgrId: number; season: number; copa?: boolean } // 🏛️ MULTICLUBES: risca a carta guardada depois que você abriu o pacote
  | { type: 'SELL_FILIAL'; mgrId?: number } // 🏢 vende a SAF (valor progressivo por divisão + títulos, teto 2.500)
  | { type: 'ADD_EMPRESARIO_CARD'; card: EmpCard; key?: string; mgrId?: number } // 💼 registra uma carta ganha (pacote de campeão) na agência do Empresário. `key` = seasonKey do pacote (dedup por temporada — aceita repetida entre temporadas). `mgrId` = técnico dono (online: por-técnico)
  | { type: 'LOAN_TO_FILIAL'; cardId: string; mgrId?: number } // 🏢 empresta um jogador SEU pra SAF (propriedade não muda; agora PERSISTE entre temporadas)
  | { type: 'LOAN_FROM_FILIAL'; cardId: string; mgrId?: number } // 🏢 pega um jogador emprestado DA SAF (idem)
  | { type: 'RETURN_FILIAL_LOAN'; cardId: string; mgrId?: number } // 🏢 traz UM empréstimo de volta na hora (seu volta pro elenco / o da SAF volta pra SAF)
  | { type: 'CLEAR_FILIAL_TRIM_NOTICE' } // 🏢 dispensa o aviso de "empréstimos voltaram por rebaixamento"
  | { type: 'MONTE_PASS'; mgrId: number } // carreira: recusa as sobras e passa a vez (o time já tem os 11)
  | { type: 'SET_TACTIC'; mgrId: number; tactic: Tactic }
  | { type: 'SET_LINEUP'; mgrId: number; ids: string[] } // carreira online: define os 11 titulares (escalação), vale do PRÓXIMO jogo
  | { type: 'EVENTO_SET'; evento: EventoAtivo; manchete?: EventoManchete } // 🎭 carreira SOLO: registra o evento sorteado na tela (pendente = banner trava a rodada; manchete = sem reserva, só zoeira)
  | { type: 'EVENTO_DECIDE'; escolha: 'troca' | 'campo'; subId?: string; xi: string[] } // 🎭 decisão do banner: troca (reserva assume até a volta) ou "escalar assim mesmo" (só noitada)
  | { type: 'PLAY_ROUND' }
  | { type: 'SIM_MANY'; count: number }
  | { type: 'FINISH_SEASON' } // 🏁 rápido: encerra a liga DEPOIS da última partida animar
  | { type: 'PLAY_COPA_LEG' } // 🏆 Copa dos 8 (rápido): joga a perna atual de todas as ties da fase
  | { type: 'START_COPA' } // 🏆 Copa dos 8: sai da tela de fim de liga e entra na Copa (botão ou tempo de leitura)
  | { type: 'FINISH_CEREMONY' }
  | { type: 'NEW_GAME' }
  | { type: 'NEW_SEASON' }
  | { type: 'REPLAY_SEASON' }
  | { type: 'START_STREAM_AUCTION' } // 🎥 stream: host começa o leilão a partir da tela explicativa
  | { type: 'REQUEST_NEW_TEAMS' }
  | { type: 'CONFIRM_RESTART'; mgrId: number }
  | { type: 'CANCEL_RESTART' }
  | { type: 'REMATCH' }

function rngOf(state: EscState): () => number {
  return mulberry(state.seed + state.sectorIdx * 977 + state.round * 131 + state.revealIdx * 7 + state.monteIdx * 13 + state.submitted.length * 101)
}

const ENVELOPE_MS = 45_000
const RESERVE_LIST_MS = 60_000 // tela "Listar pra leilão" (venda) antes do leilão de reservas — 1min (só conta pra valer no ONLINE; offline não mostra o relógio)
const CEREMONY_MS = 45_000 // tempo pra olhar os times antes do campeonato começar sozinho

// entra na cerimônia da revelação e liga o cronômetro de 45s (auto-começa)
// BOT FIADOR: depois que os HUMANOS já escolheram no monte, o que sobrou (ninguém
// pegou) é varrido pelos bots fiadores — de graça ou com valor de mercado. É a
// reposição que mantém o jogo girando e tira a malandragem de "não dou lance e
// pego de graça no monte". Respeita a vaga por posição; registra o valor no livro.
function sweepMonteToBackstops(st: EscState) {
  if (!st.careerOnline) return
  const bots = st.managers.filter(m => m.backstop)
  let bi = 0
  const takeInto = (bot: Manager, card: Card) => {
    const paid = (card as { paid?: number }).paid ?? 0
    const listed = (card as { seller?: number }).seller != null
    creditSeller(st, card, paid, bot.id) // o vendedor recebe (também na varredura do bot)
    agenciaTransacao(st, card) // 🕴️ agenciado indo pra bot também é negócio → comissão
    bot.squad.push({ ...card, paid, via: 'monte', semContrato: undefined, contratoAte: undefined })
    if (paid > 0) recordPrice(st, card.name, paid)
    // resumo dos bots (visibilidade na cerimônia)
    const msg = listed
      ? `⚽ ${bot.teamName} ficou com ${card.name} (listado) por ${paid} 🪙`
      : `⚽ ${bot.teamName} pegou ${card.name} no monte (grátis)`
    ;(st.marketLog = st.marketLog ?? []).push(msg)
  }
  // fase 1: os bots fiadores pegam o que cabe na vaga deles
  if (bots.length > 0) for (let guard = 0; st.monte.length > 0 && guard < 1000; guard++) {
    let placed = false
    for (let k = 0; k < bots.length; k++) {
      const bot = bots[(bi + k) % bots.length]
      const idx = st.monte.findIndex(c => openSlots(bot, c.pos) > 0)
      if (idx < 0) continue
      takeInto(bot, st.monte.splice(idx, 1)[0])
      bi = (bi + k + 1) % bots.length
      placed = true
      break
    }
    if (!placed) break // nenhum bot tem vaga pra nada que sobrou
  }
  // fase 2: COMPRADOR DE ÚLTIMA HORA — todo jogador LISTADO que ninguém quis
  // (nem no leilão, nem no monte, nem na varredura) é OBRIGATORIAMENTE comprado
  // por um bot pelo valor atual, pra o vendedor recuperar essa grana (ele já
  // perdeu vendo o valor cair). Carta nova sem dono (sem seller) some, como antes.
  const anyBots = st.managers.filter(m => !m.isHuman)
  const leftover = st.monte
  st.monte = []
  let ai = 0
  for (const card of leftover) {
    if ((card as { seller?: number }).seller == null || anyBots.length === 0) continue
    // 📝 contrato vencido: o comprador forçado NUNCA é o ex-dono (senão a carta
    // "voltava pra casa" de graça pela porta dos fundos)
    let buyer = anyBots[ai++ % anyBots.length]
    if ((card as { semContrato?: boolean }).semContrato && buyer.id === (card as { seller?: number }).seller && anyBots.length > 1) buyer = anyBots[ai++ % anyBots.length]
    takeInto(buyer, card)
  }
}
function enterCerimonia(st: EscState) {
  sweepMonteToBackstops(st)
  st.screen = 'cerimonia'
  // 🎥 modo stream: SEM cronômetro — o host dá o comando pra começar (controla o
  // ritmo da revelação ao vivo, mostra time por time). Sem stream: 45s e começa sozinho.
  st.cerimoniaDeadline = (st.streamMode || st.manualRoom) ? null : Date.now() + CEREMONY_MS // stream/manual: host dá o start (sem cronômetro)
}
const TIEBREAK_MS = 30_000

// cartas por leva: sala pequena cabe tudo numa tela só; sala grande (até 20
// jogadores, 40 laterais) precisa dividir, senão a tela não tem fim.
export const BATCH_SIZE = 12

// nº de levas de um setor evitando uma leva final com 1 jogador só: quando
// sobraria exatamente 1, ele entra na leva anterior (12 vira 13). Fonte única
// usada pelo pregão (store) e pelo indicador de levas (tela).
export function batchCount(total: number): number {
  if (total <= 0) return 0
  const n = Math.ceil(total / BATCH_SIZE)
  return n > 1 && total % BATCH_SIZE === 1 ? n - 1 : n
}

function startAuctionPhase(state: EscState, rescue: boolean) {
  // 🧹 no ARRANQUE do leilão (1ª posição, nada distribuído ainda): tira qualquer
  // jogador repetido do baralho — fecha o "dois Van der Sar". Roda 1x por leilão
  // (nas levas/próximos setores sectorCursor>0 ou sectorIdx>0, então não repete).
  if (!rescue && state.sectorIdx === 0 && state.sectorCursor === 0) {
    dedupeDeck(state.deck)
    if (state.stock) for (const p of SECTORS) state.stock[p] = state.deck[p].length
  }
  const pos = SECTORS[state.sectorIdx]
  state.phase = rescue ? 'resq_envelope' : 'envelope'
  if (!rescue) {
    // levas SÓ por espaço de tela: pega a próxima fatia de até BATCH_SIZE
    // cartas do setor. Você dá lance em todas as suas vagas de uma vez.
    const full = state.deck[pos]
    const start = state.sectorCursor
    let end = Math.min(full.length, start + BATCH_SIZE)
    if (full.length - end === 1) end = full.length // absorve o jogador solitário na leva
    state.currentCards = full.slice(start, end)
    state.sectorCursor = end
  }
  // se rescue=true, currentCards já foi preparado pelo chamador (sobras acumuladas)
  state.revealQueue = []
  state.revealIdx = 0
  state.submitted = []
  state.pendingEnvelopes = {}
  // ⏱️ tempo do leilão escolhido pelo host: 0 = SEM cronômetro (o host avança no
  // botão), N = N segundos, undefined = padrão (45s). Só o online usa 0; no solo
  // auctionSecs é sempre undefined → 45s como sempre.
  state.phaseDeadline = state.auctionSecs === 0 ? null : Date.now() + ((state.auctionSecs && state.auctionSecs > 0 ? state.auctionSecs * 1000 : ENVELOPE_MS))
  // 🛟 LEVA/SETOR VAZIO: não tem NENHUMA carta pra leiloar (ex.: leilão de reservas
  // onde TODOS os laterais do catálogo já têm dono). Sem isto, aparecia um envelope
  // VAZIO ("laterais sem lateral nenhum") e, ao lacrar, dava a tela de erro. Agora
  // resolve na hora e segue pro próximo setor. (sealAndResolve com fila vazia cai
  // na guarda de "revelação vazia" e chama afterReveal, que avança.)
  if (state.currentCards.length === 0) { sealAndResolve(state); return }
  // SOLO (carreira offline/rápido/dinastia): rodada em que NENHUM humano pode
  // dar lance (posição cheia ou sem dinheiro — só CPUs disputando) lacra NA
  // HORA. Sem isto, ninguém enviava envelope, o setor nunca era lacrado e o
  // jogo congelava com o jogador de espectador ("esperando a contratação").
  // No online não muda nada: lá o vigia de prazo já cuida disso.
  if (state.onlineMode !== 'online' && humansToSubmit(state, SECTORS[state.sectorIdx]).length === 0) {
    sealAndResolve(state)
  }
}

// resolve o setor a partir dos envelopes coletados (humanos) + CPUs
function sealAndResolve(state: EscState) {
  const rng = rngOf(state)
  const rescue = state.phase === 'resq_envelope'
  const bidMap: BidMap = new Map()
  const econ = state.careerOnline ? escadaEconFactor(state) : 0 // 💰 teto por categoria × riqueza da sala (TODA carreira — pedido do Diego: 'Pelé por 409' na carreira longa)
  // CPUs (só quem disputa o leilão — bots de preenchimento nunca dão lance)
  for (const m of state.managers) {
    if (m.isHuman || !m.auctionRival) continue
    for (const b of cpuEnvelope(m, state.currentCards, state.sectorIdx, rng, rescue, econ)) {
      pushBid(bidMap, b.cardId, { mgr: b.mgr, amount: b.amount })
    }
  }
  // humanos (envelopes coletados)
  for (const [mgrIdStr, env] of Object.entries(state.pendingEnvelopes)) {
    const mgrId = Number(mgrIdStr)
    for (const hb of env) {
      if (hb.amount > 0) pushBid(bidMap, hb.cardId, { mgr: mgrId, amount: hb.amount })
    }
  }
  // BOT (carreira online): os bots do MERCADO (que perderam jogador sorteado ou
  // entraram como fiadores) agora disputam o leilão INTEIRO — repõem a perda E
  // podem pegar reservas em qualquer posição, como um técnico de verdade. Cada
  // um decide sozinho (cpuEnvelope) se compra e por quanto; pagam com a caixa.
  if (state.careerOnline) {
    {
      for (const m of state.managers) {
        if (m.isHuman || !(m.backstop || m.marketCpu)) continue
        // MONEY-SMART: o bot reserva grana pra CADA vaga que ainda precisa preencher.
        // Nunca estoura num jogador só (ex.: 80 de caixa, 8 vagas → ~10 por vaga,
        // teto ~16 num jogador que quer). Com poucas vagas, pode pagar mais.
        const perSlot = Math.max(1, Math.floor(m.money / Math.max(1, totalHoles(m))))
        const capPerCard = Math.max(1, Math.round(perSlot * 1.6))
        for (const b of cpuEnvelope(m, state.currentCards, state.sectorIdx, rng, rescue, econ)) {
          pushBid(bidMap, b.cardId, { mgr: b.mgr, amount: Math.min(b.amount, capPerCard) })
        }
      }
    }
  }
  const { queue, unsold, ties } = resolve(state.currentCards, bidMap, state.managers, rescue ? 'repescagem' : 'leilao', !!state.reserveAuction, (b, sl) => mesmoDono(state, b, sl))
  for (const q of queue) if (q.winner !== null && q.paid > 0) {
    recordPrice(state, q.card.name, q.paid) // livro de preços
    creditSeller(state, q.card, q.paid, q.winner) // o vendedor recebe a grana da venda
    agenciaTransacao(state, q.card) // 🕴️ agenciado negociado → comissão de agente
    const w = state.managers.find(m => m.id === q.winner) // resumo dos bots (visibilidade)
    if (w?.isHuman) logFin(state, 'buy', `🛒 ${q.card.name}`, -q.paid, { player: q.card.name, pos: q.card.pos }, w.id) // 🧾 compra no leilão
    if (w?.backstop) (state.marketLog = state.marketLog ?? []).push(`⚽ ${w.teamName} arrematou ${q.card.name} por ${q.paid} 🪙`)
    // bot arrematou famoso e tá com o banco cheio? tira um FAKE (incógnito) pra dar
    // lugar ao famoso — não deixa o elenco do bot inchar de carta de brincadeira.
    if (w && !w.isHuman && w.squad.length > 20) { const fi = w.squad.findIndex(c => c.fake); if (fi >= 0) w.squad.splice(fi, 1) }
  }
  mirrorWallets(state) // 💰 arremates e vendas do pregão entram na caixa NA HORA
  state.revealQueue = queue
  state.revealIdx = 0
  state.currentCards = unsold
  state.submitted = []
  state.pendingEnvelopes = {}
  state.tiebreaks = ties
  state.tiebreakIdx = 0
  state.tiebreakPending = {}
  if (ties.length > 0) {
    // tem empate no topo: entra na fase de desempate antes da revelação
    state.phase = 'tiebreak'
    advanceTiebreaks(state) // para no 1º que precisa de humano, ou já vai pra revelação
  } else {
    state.phase = rescue ? 'resq_reveal' : 'reveal'
    state.phaseDeadline = null
    // CAUSA-RAIZ da "tela preta": se a leva veio VAZIA (currentCards vazio →
    // revelação sem nenhuma carta), a tela de Revelação não tinha o que mostrar e
    // renderizava em branco (o fundo escuro do estúdio aparecia). Aqui a gente
    // NUNCA entra numa revelação vazia: segue direto pro próximo passo (próxima
    // leva / repescagem / monte). afterReveal usa o phase que acabamos de setar.
    if (state.revealQueue.length === 0) afterReveal(state)
  }
}

// todo humano com vaga aberta e dinheiro precisa enviar (não filtra por presença:
// presença é um sinal instável de rede e causava avanço prematuro/dessincronizado
// entre jogadores — um "piscar" de conexão fazia o jogo achar que só faltava um).
function humansToSubmit(state: EscState, pos: Sector): number[] {
  const eligible = state.managers.filter(m => m.isHuman && !m.dormindo && openSlots(m, pos) > 0 && m.money > 0)
  // 🏛️ MULTICLUBES / SOLO: no solo SÓ o assento ATIVO (youIdx) consegue lacrar
  // pela tela. Qualquer OUTRO assento humano (o 2º clube do Multiclubes — dormindo,
  // OU com o flag `dormindo` inconsistente por uma troca no meio do leilão) nunca
  // lacra e travaria o leilão pra sempre no "TEMPO 0s". Então, no solo, só espero o
  // meu assento. No ONLINE cada humano lacra no próprio aparelho (mantém todos).
  // No-op no jogo solo normal (só existe 1 humano = o youIdx).
  if (state.onlineMode !== 'online') {
    const meId = state.managers[state.youIdx]?.id
    return eligible.filter(m => m.id === meId).map(m => m.id)
  }
  return eligible.map(m => m.id)
}

function advanceSectorOrFinish(state: EscState, rng: () => number) {
  if (state.sectorIdx < SECTORS.length - 1) {
    state.sectorIdx++
    state.sectorCursor = 0
    state.sectorUnsoldAccum = []
    startAuctionPhase(state, false)
  } else {
    state.monteOrder = buildMonteOrder(state.managers, rng, !!state.careerOnline, state.onlineMode !== 'online' ? state.managers[state.youIdx]?.id : undefined)
    state.monteIdx = 0
    state.screen = 'monte'
    advanceMonte(state, rng)
    if (state.monteIdx >= state.monteOrder.length) enterCerimonia(state)
  }
}

function afterReveal(state: EscState) {
  const rng = rngOf(state)
  const pos = SECTORS[state.sectorIdx]
  const unsold = state.currentCards
  if (state.phase === 'reveal') {
    // terminou uma leva do pregão principal — acumula os não vendidos
    state.sectorUnsoldAccum.push(...unsold)
    state.currentCards = []
    if (state.sectorCursor < state.deck[pos].length) {
      startAuctionPhase(state, false) // ainda tem leva pra vir nesse setor
      return
    }
    // fechou todas as levas do setor: repescagem ÚNICA com tudo que sobrou (só
    // dispara se um HUMANO ainda tem buraco — bot fiador não força repescagem)
    const anyHole = state.managers.some(m => !m.backstop && openSlots(m, pos) > 0)
    if (state.sectorUnsoldAccum.length > 0 && anyHole) {
      state.currentCards = state.sectorUnsoldAccum
      state.sectorUnsoldAccum = []
      startAuctionPhase(state, true)
      return
    }
    montePush(state, state.sectorUnsoldAccum)
    state.sectorUnsoldAccum = []
    advanceSectorOrFinish(state, rng)
    return
  }
  // terminou a repescagem
  montePush(state, unsold)
  state.currentCards = []
  advanceSectorOrFinish(state, rng)
}

// revanche com times novos: mesma sala/galera e formação, temporada do zero —
// baralho e escalação dos bots sorteados de novo. Igual qualquer outra ação
// online, o resultado já computado vai por SYNC_STATE pros convidados, então
// não precisa de seed determinístico aqui.
function redraftSeason(s: EscState): EscState {
  const humanNames = s.managers.filter(m => m.isHuman).map(m => m.name)
  const formation = s.managers.find(m => m.isHuman)?.formation ?? '4-3-3'
  s.seed = Math.floor(Math.random() * 1e9)
  const rng = mulberry(s.seed)
  const used = new Set<string>()
  // liga de 20 times sempre. online: nenhum CPU no leilão (só humanos). solo/
  // carreira: mantém a mesma quantidade de rivais de leilão que a sala tinha.
  const auctionCpus = s.onlineMode === 'online' ? 0 : s.managers.filter(m => !m.isHuman && m.auctionRival).length
  const { managers, botPlans } = makeManagers(humanNames, formation, auctionCpus, LEAGUE_SIZE, rng)
  s.managers = managers
  s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, used, 1)
  s.surpriseId = pickSurprise(s.deck, rng)
  dealBotSquads(s.managers, botPlans, rng, used)
  for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
  s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.roundIdx = 0
  s.monte = []; s.monteOrder = []; s.monteIdx = 0
  s.news = []; s.round = 0; s.champion = null
  s.league = []; s.fixtures = []; s.scorers = []; s.lastResults = []
  s.tactics = {}
  s.quickCopa = null // 🏆 Copa dos 8 é POR TEMPORADA — senão a próxima liga nunca semeia de novo
  s.streamChampCard = null // 🎥 stream: carta do campeão é por temporada — não herda a anterior
  s.submitted = []; s.pendingEnvelopes = {}
  s.tiebreaks = []; s.tiebreakIdx = 0; s.tiebreakPending = {}
  s.seasonNo++
  s.restartPending = false
  s.restartReady = []
  s.screen = 'auction'
  startAuctionPhase(s, false)
  return s
}

// Refaz o leilão só quando TODOS os participantes humanos clicaram "estou
// pronto". Não usamos `presence` aqui: ela é instável (às vezes o host enxerga
// só a si mesmo) e isso liberava o reinício sem o OK dos outros. Se alguém caiu
// e não confirma, o host tem o botão Cancelar.
function humanManagerIds(s: EscState): number[] {
  // 🏛️ MULTICLUBES: clube dormindo não conta como "técnico pronto" — senão o
  // reinício ficava esperando um assento que nunca confirma. No-op em jogo normal.
  return s.managers.filter(m => m.isHuman && !m.dormindo).map(m => m.id)
}
function maybeStartRedraft(s: EscState): EscState {
  if (!s.restartPending) return s
  const humans = humanManagerIds(s)
  if (humans.length > 0 && humans.every(id => s.restartReady.includes(id))) {
    return redraftSeason(s)
  }
  return s
}

export function reducer(state: EscState, action: Action): EscState {
  if (action.type === 'SYNC_STATE') {
    setActiveCatalog(action.newState.deckLeague) // o ponteiro do baralho segue o estado do host (reload zera pra BR)
    // O host manda o estado do JOGO (managers, deck, leilão, temporada...),
    // mas identidade é local a cada cliente: "quem sou eu" (youIdx), "sou
    // host?", sala. Sem isso, um convidado que recebe o broadcast do host
    // passa a se enxergar como o PRÓPRIO host — via o mesmo técnico, o
    // mesmo elenco — exatamente o "pegamos o mesmo jogador" relatado.
    return {
      ...action.newState,
      rivalries: action.newState.rivalries ?? {}, // saves/broadcasts antigos
      cpuAtkAdj: action.newState.cpuAtkAdj ?? 0,
      cpuDefAdj: action.newState.cpuDefAdj ?? 0,
      // 🎥 lê streamMode OU o flag de criação da sala `stream` (idem manual). Sem
      // isso, um estado que só tinha `stream` (registro da sala) perdia o modo
      // stream e os lances apareciam na tela. `??` não dispara em `false`, então
      // sala sem stream continua sem stream — zero regressão.
      streamMode: action.newState.streamMode ?? !!(action.newState as { stream?: boolean }).stream,
      manualRoom: action.newState.manualRoom ?? !!(action.newState as { manual?: boolean }).manual,
      youIdx: state.youIdx,
      isHost: state.isHost,
      roomId: state.roomId,
      roomCode: state.roomCode,
      onlineMode: state.onlineMode,
    }
  }
  if (action.type === 'RESTORE_ONLINE') {
    setActiveCatalog(action.state.deckLeague) // reancora o baralho da sala (reload zera o ponteiro pra BR)
    // reconexão/host-caiu: adota o estado salvo no banco em vez de recomeçar
    // do zero. A identidade ("quem sou eu", host?) é sempre local a este
    // cliente; efêmeros host-only voltam limpos (já vêm sanitizados).
    // 🪑 ÂNCORA POR CRACHÁ (id estável), não pela cadeira: o player_index do banco é o
    // id inicial do técnico. Na carreira online os times REORDENAM entre temporadas,
    // então esse número pode não ser mais a POSIÇÃO no array — e reancorar cru punha a
    // pessoa no time de OUTRO ("virei outro / F5 trocou de nome"). Acha a posição ATUAL
    // do MEU manager pelo id; só cai no valor cru se não achar (save muito antigo).
    const byId = action.state.managers?.findIndex(m => m.id === action.playerIndex) ?? -1
    const myIdx = byId >= 0 ? byId : action.playerIndex
    return migrateTeamNames({
      ...action.state,
      rivalries: action.state.rivalries ?? {}, // saves antigos sem o campo
      cpuAtkAdj: action.state.cpuAtkAdj ?? 0,
      cpuDefAdj: action.state.cpuDefAdj ?? 0,
      // 🎥 restaura o modo stream lendo streamMode OU o flag `stream` da sala (idem
      // manual). Antes, restaurar de um estado que só tinha `stream` (reconexão /
      // host caiu / registro da sala) desligava o stream e os lances apareciam.
      streamMode: action.state.streamMode ?? !!(action.state as { stream?: boolean }).stream,
      manualRoom: action.state.manualRoom ?? !!(action.state as { manual?: boolean }).manual,
      onlineMode: 'online',
      roomId: action.roomId,
      roomCode: action.roomCode,
      isHost: action.isHost,
      youIdx: myIdx,
      pendingEnvelopes: {},
      tiebreakPending: {},
      presence: [],
    })
  }
  if (action.type === 'NEW_GAME') return { ...INITIAL }
  // Fui REMOVIDO pela host no meio da partida: saio de vez. Zera tudo e cai no
  // MENU ONLINE (não no meio do jogo). A vaga no banco a host já apagou; o canal
  // é derrubado pelo próprio reset (onlineMode volta a 'cpu', sem roomId).
  if (action.type === 'KICKED_OUT') return { ...INITIAL, screen: 'lobby' }
  const s: EscState = JSON.parse(JSON.stringify(state))
  switch (action.type) {
    case 'GO_LOBBY': { s.screen = 'intro'; s.onlineMode = 'cpu'; s.dinastia = false; s.dinastiaBudget = undefined; s.dinastiaPaused = false; s.dinastiaMidUsed = false; return s }
    case 'GO_LOBBY_ONLINE': { s.screen = 'lobby'; return s }
    case 'GO_SETUP': { s.screen = 'setup'; s.careerIntent = false; return s }
    case 'GO_SETUP_CAREER': { s.screen = 'setup'; s.careerIntent = true; return s }
    case 'GO_ALBUM': { s.screen = 'album'; return s }
    case 'GO_RANKING': { s.screen = 'ranking'; return s }
    case 'SET_PRESENCE': { s.presence = action.indices; return s }
    // pirâmide: a Copa da temporada atual terminou de animar → marca, pra o save
    // não re-animar a Copa do zero ao retomar (mostra direto os campeões/decisão).
    case 'MARK_COPA_DONE': { s.copaDoneSeason = s.seasonNo; return s }
    // 💰 FECHAMENTO DA TEMPORADA (solo): acabou a liga E as copas → contabiliza
    // TUDO de uma vez (prêmios, bilheteria, patrocínio, renda do empresário,
    // menos a folha salarial). Antes isso só caía quando você abria o leilão —
    // por isso a caixa "aumentava do nada" no meio do pregão. Idempotente
    // (applySeasonMoney trava por temporada): abrir o leilão depois não repete.
    case 'CLOSE_SEASON_BOOKS': {
      if (!s.careerOnline) return s
      applySeasonMoney(s, action.rewards)
      return s
    }
    case 'SET_CHAT': { s.chatOff = action.off; return s } // 💬 host ligou/desligou o chat
    case 'SET_SIM_SPEED': { s.simSpeed = action.speed > 0 ? action.speed : 1; return s } // ⏩ ritmo da simulação
    // 🎥 STREAM: o campeão abriu o pacote (ou o host abriu no lugar de quem saiu).
    // A carta fica no estado e o host retransmite pra sala TODA ver a mesma carta.
    // Não sobrescreve se já tiver uma daquele slot (evita corrida host×campeão).
    case 'SET_STREAM_CHAMP_CARD': {
      const cur = s.streamChampCard ?? {}
      if (cur[action.slot]) return state // já revelada — mantém a primeira
      s.streamChampCard = { ...cur, [action.slot]: action.card }
      return s
    }
    // 🏟️ ESTÁDIO da carreira: investe aos poucos num setor (custa do caixa de moedas)
    case 'STADIUM_INVEST': {
      if (!s.careerOnline) return s
      const sec = STADIUM_SECTORS.find(x => x.k === action.sector); if (!sec) return s
      const st = s.stadiums?.[action.mgrId] ?? emptyStadium()
      const invested = st.inv[action.sector] ?? 0
      const wallet = s.careerCoins?.[action.mgrId] ?? 0
      const pay = Math.min(STADIUM_STEP, sec.cost - invested, wallet)
      if (pay <= 0) return s
      s.stadiums = { ...(s.stadiums ?? {}), [action.mgrId]: { inv: { ...st.inv, [action.sector]: invested + pay }, ext: st.ext } }
      s.careerCoins = { ...(s.careerCoins ?? {}), [action.mgrId]: wallet - pay }
      logFin(s, 'stadium', `🏟️ Obra: ${sec.n}`, -pay, undefined, action.mgrId) // 🧾 investimento no estádio entra no extrato (pra a conta fechar)
      return s
    }
    // 🏟️ compra uma melhoria DESTRAVADA (árvore de requisitos em estadiodata)
    case 'STADIUM_BUILD': {
      if (!s.careerOnline) return s
      const ext = STADIUM_EXTRAS.find(x => x.k === action.ext); if (!ext) return s
      if (action.ext === 'medico' && !s.agenciaOn) return s // 🏥 só carreiras com eventos de jogador
      const st = s.stadiums?.[action.mgrId] ?? emptyStadium()
      const wallet = s.careerCoins?.[action.mgrId] ?? 0
      if (st.ext.includes(action.ext) || !extraUnlocked(st, action.ext) || wallet < ext.cost) return s
      s.stadiums = { ...(s.stadiums ?? {}), [action.mgrId]: { inv: st.inv, ext: [...st.ext, action.ext] } }
      s.careerCoins = { ...(s.careerCoins ?? {}), [action.mgrId]: wallet - ext.cost }
      logFin(s, 'stadium', `🏟️ Melhoria: ${ext.n}`, -ext.cost, undefined, action.mgrId) // 🧾 melhoria do estádio entra no extrato
      return s
    }
    // o host anterior saiu de vez e me passou a batuta: viro autoritativo. O
    // canal realtime re-inscreve como host (reage a s.isHost) e passo a emitir
    // e persistir o estado da sala.
    case 'BECOME_HOST': { s.isHost = true; return s }
    case 'FIX_YOU_IDX': { s.youIdx = action.idx; return s } // identidade é local (não sincroniza)
    case 'COPA_MUNDO_PRIZE': {
      // 🌍 +100 por clube SEU classificado (Diego 04/08: dormindo recebe igual —
      // independência total). logFin roteia o extrato do dormindo pro stash.
      s.careerCoins = { ...(s.careerCoins ?? {}), [action.mgrId]: (s.careerCoins?.[action.mgrId] ?? 0) + 100 }
      logFin(s, 'reward', '🌍 Prêmio da Copa do Mundo Legends', 100, undefined, action.mgrId)
      return s
    }
    case 'KICK_PLAYER': {
      // Host removeu um técnico da partida: a CPU assume o time dele e o jogo
      // segue sem travar. O cliente removido é ejetado pelo evento 'kick' à
      // parte (no provider); aqui só cuidamos de não deixar a fase esperando
      // por ele — mesma lógica do auto-preenchimento por AFK.
      const m = s.managers.find(x => x.id === action.playerIndex)
      if (!m) return s
      if (!m.isHuman) {
        // já é RIVAL CPU (ex-humano que saiu): o host está EXCLUINDO — para de dar
        // lance e vira só preenchimento na tabela.
        m.auctionRival = false
        return s
      }
      // humano saiu/foi removido → deixa de ser humano (ninguém espera ele lacrar).
      // O que sobra do time depende de quanta gente resta na partida:
      //  · sobrou só a host (eram 2 no total) → vira RIVAL CPU dando lance com o
      //    time e o dinheiro dele, pra host não ficar sem adversário no leilão;
      //  · ainda há 2+ humanos → EXCLUI de verdade: para de dar lance, só preenche
      //    a tabela (não fica um "bot fantasma" no meio de uma partida com gente).
      m.isHuman = false
      const humansLeft = s.managers.filter(x => x.isHuman).length
      m.auctionRival = humansLeft <= 1
      if (s.phase === 'envelope' || s.phase === 'resq_envelope') {
        const pos = SECTORS[s.sectorIdx]
        if (humansToSubmit(s, pos).every(id => s.submitted.includes(id))) sealAndResolve(s)
      } else if (s.phase === 'tiebreak') {
        const tb = s.tiebreaks[s.tiebreakIdx]
        if (tb) tb.submitted = tb.submitted.filter(id => id !== action.playerIndex)
        maybeResolveTiebreak(s)
      } else if (s.screen === 'monte' && s.monteOrder[s.monteIdx] === action.playerIndex) {
        const rng = rngOf(s)
        advanceMonte(s, rng)
        if (s.monteIdx >= s.monteOrder.length || s.managers.every(mm => totalHoles(mm) === 0)) enterCerimonia(s)
      }
      return s
    }
    case 'START': {
      s.seed = Math.floor(Math.random() * 1e9)
      const rng = mulberry(s.seed)
      s.onlineMode = 'cpu'
      s.isHost = true
      s.humanCount = 1
      // 🧹 RÁPIDO/DINASTIA/CLÁSSICO NÃO é carreira-pirâmide: zera o careerOnline
      // (e o livro-caixa). O reducer clona o estado ANTERIOR, então sem isto uma
      // partida rápida iniciada logo depois de uma CARREIRA herdava careerOnline=true
      // — e aí a partida rápida jogava com a economia da carreira E era salva como
      // "Continuar carreira" (bug relatado: rápido virando carreira).
      s.careerOnline = false
      s.careerLedger = []
      // ⚽ START é sempre FUTEBOL (o basquete tem START_NBA próprio). Sem isto, um
      // rápido de futebol aberto DEPOIS de um jogo de basquete herdava
      // sport='basquete' — placar de pontos e playoffs por conferência no futebol.
      s.sport = 'futebol'; s.nbaCareer = false
      // baralho escolhido (só solo): Brasileirão ou Liga Europa. Manager (que
      // também dispara START) sempre usa BR — não manda league.
      s.deckLeague = action.dinastia ? 'br' : (action.league ?? 'br')
      setActiveCatalog(s.deckLeague)
      // carreira: começa na Série D. Partida rápida: sem divisão.
      s.careerDivision = action.career ? 'D' : null
      s.careerIntent = false
      s.careerTitles = 0
      s.careerTitlesA = 0
      s.copaMode = action.copaMode ?? 'liga_copa' // 🏆 padrão: liga + copa dos 8 (rápido)
      s.careerRivalCount = action.rivals
      s.careerRivals = action.career ? initCareerRivals(action.rivals, action.rivalTeams) : []
      s.cpuAtkAdj = 0; s.cpuDefAdj = 0 // recalculado na cerimônia (quando os elencos existem)
      // carreira E partida rápida usam o MESMO elenco da Série D (lista única).
      // A diferença é só a pirâmide/save da carreira — a rápida é uma temporada
      // avulsa. Rivais = os escolhidos (carreira) ou os primeiros da D (rápida).
      const soloRivalDefs = action.career ? coDivRivalDefs(s.careerRivals, 'D') : DIVISION_TEAMS['D'].slice(0, action.rivals)
      // na Série D todos os rivais começam com você — sem "auction-only".
      const { managers: soloManagers, botPlans: soloPlans } = makeCareerManagers(action.teamName || 'Meu Time', action.formation, 'D', soloRivalDefs, [], rng)
      s.managers = soloManagers
      s.youIdx = 0
      // modo Dinastia: mesmo leilão real da carreira, só que o orçamento é o do
      // clube (moedas do Dinastia). A economia assume depois da cerimônia.
      s.dinastia = !!action.dinastia
      s.dinastiaBudget = action.dinastia ? (action.budget ?? 50) : undefined
      if (action.dinastia) { const b = action.budget ?? 50; for (const m of s.managers) m.money = b }
      const soloUsed = new Set<string>()
      s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, soloUsed, 1)
      s.surpriseId = pickSurprise(s.deck, rng)
      dealBotSquads(s.managers, soloPlans, rng, soloUsed)
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.roundIdx = 0; s.monte = []; s.news = []; s.round = 0; s.champion = null
      s.tactics = {}
      s.seasonNo = 1
      // 🔨 tela de regras antes do pregão (rápido): explica moedas/auge; o jogador
      // toca "Começar o leilão" (START_STREAM_AUCTION) quando quiser. Sem intro
      // (dinastia/manager) cai direto no leilão, como sempre.
      if (action.intro) { s.screen = 'streamIntro'; return s }
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    // 🏀 JOGO RÁPIDO DO BASQUETE — MESMO motor/telas/fluxo do futebol. Só troca o
    // conteúdo: baralho NBA, franquias como rivais e 1 vaga por posição (=5, o
    // quinteto). O futebol não passa por aqui.
    case 'START_NBA': {
      s.seed = Math.floor(Math.random() * 1e9)
      const rng = mulberry(s.seed)
      s.onlineMode = 'cpu'; s.isHost = true; s.humanCount = 1
      s.careerOnline = false; s.careerLedger = []
      s.reserveAuction = false; s.reserveListed = {} // não herda "modo reservas" de um jogo anterior (mesmo fix do rápido)
      s.sport = 'basquete'; s.nbaCareer = false // jogo rápido (não é carreira)
      setActiveSport('basquete', 'quick') // baralho NBA + 1 vaga por posição
      s.deckLeague = 'br' // não usado no basquete (o baralho é o NBA), mas mantém o campo válido
      s.careerDivision = null; s.careerIntent = false; s.careerTitles = 0; s.careerTitlesA = 0
      s.copaMode = action.rivals >= 7 ? 'liga_copa' : 'liga'
      s.careerRivalCount = action.rivals; s.careerRivals = []
      s.cpuAtkAdj = 0; s.cpuDefAdj = 0
      const rivals = Math.max(1, action.rivals)
      const { managers, botPlans } = makeManagers([action.teamName || 'Meu Time'], '4-3-3', rivals, rivals + 1, rng, NBA_TEAMS)
      s.managers = managers; s.youIdx = 0
      // 💰 orçamento do rápido do basquete = 50 (não 100). São só 5 jogadores (o
      // quinteto); 50 dá ~10/jogador, o MESMO equilíbrio do futebol (100 pra 11).
      // Com 100 dava 20/jogador e dava pra pagar caro em todo mundo — inflava.
      for (const m of s.managers) m.money = NBA_QUICK_BUDGET
      s.dinastia = false; s.dinastiaBudget = undefined
      const used = new Set<string>()
      s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, used, 1)
      s.surpriseId = pickSurprise(s.deck, rng)
      dealBotSquads(s.managers, botPlans, rng, used)
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.roundIdx = 0; s.monte = []; s.news = []; s.round = 0; s.champion = null
      s.tactics = {}; s.seasonNo = 1
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    // 🛝 STREET LEAGUE — a BASE da carreira do basquete. MESMO motor/telas do
    // futebol e do rápido do basquete. Modelo aprovado: TODO time começa com o
    // QUINTETO (5, 1 por posição) — igual o futebol começa com o XI (11). Liga
    // cheia de 20 times, pontos corridos. O leilão de reservas (crescer pra
    // rotação 10 → elenco 15), os desbloqueios por temporada e salvar/continuar
    // são o próximo passo. O futebol não passa por aqui.
    case 'START_NBA_CAREER': {
      s.seed = Math.floor(Math.random() * 1e9)
      const rng = mulberry(s.seed)
      s.onlineMode = 'cpu'; s.isHost = true; s.humanCount = 1
      s.careerOnline = false; s.careerLedger = []
      s.reserveAuction = false; s.reserveListed = {}
      s.sport = 'basquete'; s.nbaCareer = true // é CARREIRA (salva, avança temporada, reservas)
      s.nbaTier = 'street' // começa na base da pirâmide (Street League)
      setActiveSport('basquete', 'career') // baralho NBA + 1 vaga por posição (quinteto = 5)
      s.deckLeague = 'br'
      s.careerDivision = null; s.careerIntent = false; s.careerTitles = 0; s.careerTitlesA = 0
      s.copaMode = 'liga' // Street League: só pontos corridos (sem copa por enquanto)
      const rivals = NBA_STREET_TEAMS.length - 1 // liga cheia: você + 19 rivais = 20 times
      s.careerRivalCount = rivals; s.careerRivals = []
      s.cpuAtkAdj = 0; s.cpuDefAdj = 0
      const { managers, botPlans } = makeManagers([action.teamName || 'Meu Time'], '4-3-3', rivals, rivals + 1, rng, NBA_STREET_TEAMS)
      s.managers = managers; s.youIdx = 0
      for (const m of s.managers) m.money = NBA_CAREER_BUDGET
      s.dinastia = false; s.dinastiaBudget = undefined
      const used = new Set<string>()
      s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, used, 1)
      s.surpriseId = pickSurprise(s.deck, rng)
      dealBotSquads(s.managers, botPlans, rng, used)
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.roundIdx = 0; s.monte = []; s.news = []; s.round = 0; s.champion = null
      s.tactics = {}; s.seasonNo = 1
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    // 🏀 PRÓXIMA TEMPORADA da carreira do basquete: avança e abre o LEILÃO DE
    // RESERVAS. Você MANTÉM o quinteto e leiloa só as vagas novas (T2: 5→10). Os
    // outros times ficam no quinteto (5), como a Série D do futebol fica no XI.
    // Autocontido no basquete (guardado por nbaCareer) — o futebol não passa aqui.
    case 'NEXT_NBA_SEASON': {
      if (s.sport !== 'basquete' || !s.nbaCareer) return s
      s.seasonNo++
      s.seed = Math.floor(Math.random() * 1e9)
      const rng = mulberry(s.seed)
      setActiveSport('basquete', 'career') // base = 1/posição (quinteto)
      const you = s.managers[s.youIdx]
      // só VOCÊ cresce: T2 → rotação (2/posição = 10), T3+ → elenco cheio (3/pos
      // = 15). Os outros times ficam no quinteto (nbaSlots undefined). Elencos de
      // todos preservados da temporada passada.
      you.nbaSlots = s.seasonNo >= 3 ? 3 : 2
      for (const m of s.managers) m.deepSquad = false
      // 🪜 SUBIR DE LIGA: terminou no TOP 4 da temporada que acabou? sobe um andar
      // (Street → G League → NBA). Você LEVA seu elenco; os adversários viram os do
      // andar de cima (crews → afiliados → franquias). Ninguém cai (base amadora).
      const lastTable = sortedTable(s.league)
      const youPos = lastTable.findIndex(t => t.id === you.id) + 1
      const tier: NbaTier = s.nbaTier ?? 'street'
      const promoted = youPos >= 1 && youPos <= 4 && NBA_TIERS[tier].next != null
      if (promoted) {
        const newTier = NBA_TIERS[tier].next as NbaTier
        s.nbaTier = newTier
        s.quickCopa = null // zera o chaveamento da temporada passada
        const tierTeams = NBA_TIERS[newTier].teams
        // novos adversários do andar (CPUs recebem elenco, não dão lance); VOCÊ fica.
        const { managers, botPlans } = makeManagers([you.teamName], '4-3-3', 0, tierTeams.length, rng, tierTeams)
        managers[0] = you // mantém você (elenco, nbaSlots, money, id 0)
        s.managers = managers; s.youIdx = 0
        s.careerRivalCount = tierTeams.length - 1
        const usedP = new Set<string>()
        for (const c of you.squad) usedP.add(ident(c))
        dealBotSquads(s.managers, botPlans, rng, usedP)
      }
      // 🏆 PLAYOFFS: só nos andares de cima (G League/NBA) — top 8 disputa o
      // mata-mata depois da temporada regular (mesma máquina da Copa dos 8: relógio
      // ao vivo, tudo simula, zero spoiler). A Street League é só pontos corridos.
      s.copaMode = (s.nbaTier ?? 'street') === 'street' ? 'liga' : 'liga_copa'
      s.quickCopa = null // reseeda o chaveamento a cada temporada
      // 🏀 VENDER: tira do elenco as reservas que você DISPENSOU (marcadas na tela
      // de fim) — as vagas voltam a abrir e o leilão de reservas repõe.
      const released = new Set(s.reserveListed?.[you.id] ?? [])
      if (released.size) you.squad = you.squad.filter(c => !released.has(c.id))
      s.round = 0; s.champion = null; s.news = []; s.scorers = []; s.lastResults = []
      // ainda tem vaga de reserva pra encher (T2 5→10, T3 10→15)? ABRE o leilão
      // (mantém o quinteto, leiloa só as vagas novas). Já cheio? começa a temporada
      // com o mesmo time (o "elenco 15" e vender vêm no próximo passo).
      const wantReserve = SECTORS.some(pos => openSlots(you, pos) > 0)
      if (wantReserve) {
        s.reserveAuction = true; s.reserveListed = {}
        you.money = NBA_RESERVE_BUDGET
        const used = new Set<string>()
        for (const m of s.managers) for (const c of m.squad) used.add(ident(c))
        s.deck = buildDeck([you], rng, 2.0, used, 1) // baralho só pras suas vagas novas
        s.surpriseId = pickSurprise(s.deck, rng)
        for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
        s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.roundIdx = 0; s.monte = []
        s.tactics = {}
        s.screen = 'auction'
        startAuctionPhase(s, false)
      } else {
        // mesmo time: nova temporada direto (sem leilão). Dificuldade do andar
        // aplicada agora (no leilão, o FINISH_CEREMONY já chama cpuAdjFor).
        s.reserveAuction = false; s.reserveListed = {}
        for (const m of s.managers) m.deepSquad = false
        const adj = cpuAdjFor(s); s.cpuAtkAdj = adj.atk; s.cpuDefAdj = adj.def
        s.league = buildLeague(s.managers, !s.ligaFechada)
        s.fixtures = buildFixtures(s.league, mulberry((s.seed ^ 0xCA1E0) >>> 0))
        s.tactics = {}
        s.screen = 'season'
      }
      return s
    }
    case 'RESUME_NBA_CAREER': {
      // retoma a carreira do basquete salva (restaura o estado inteiro). Reancora
      // o esporte/baralho/vagas — um reload zera os ponteiros do motor pra futebol.
      const sv = action.saved
      setActiveSport('basquete', 'career')
      return sv
    }
    case 'TOGGLE_NBA_RELEASE': {
      // 🏀 VENDER (T3+): marca/desmarca uma reserva pra dispensar. Trava do quinteto:
      // nunca deixa uma posição sem o titular (mín. 1 real por posição). Os marcados
      // saem do elenco na próxima temporada e o leilão de reservas repõe as vagas.
      if (s.sport !== 'basquete' || !s.nbaCareer || s.seasonNo < 3) return s
      const you = s.managers[s.youIdx]
      const listed = { ...(s.reserveListed ?? {}) }
      const arr = [...(listed[you.id] ?? [])]
      const i = arr.indexOf(action.cardId)
      if (i >= 0) arr.splice(i, 1) // desmarca
      else {
        const card = you.squad.find(c => c.id === action.cardId)
        if (!card || card.fake) return s
        // piso do quinteto: só dispensa se sobrar pelo menos 1 real na posição
        const realLeft = you.squad.filter(c => c.pos === card.pos && !c.fake && !arr.includes(c.id)).length
        if (realLeft <= 1) return s
        arr.push(action.cardId)
      }
      listed[you.id] = arr
      s.reserveListed = listed
      return s
    }
    case 'START_CAREER_SOLO': {
      // CARREIRA OFFLINE na pirâmide: mesmas regras do online (4 divisões, leilão
      // de reservas/transferências, economia, votação-solo), mas sozinho contra a
      // CPU. Os rivais escolhidos entram na Série D como CPUs que DÃO LANCE.
      s.onlineMode = 'cpu'
      s.isHost = true
      s.careerOnline = true
      s.simV = 4 // carreira nova já nasce na fórmula nova (gol realista + menos goleada)
      s.contratosOn = true // 📝 contratos de jogador: SÓ carreira NOVA (save antigo segue sem)
      // 🕴️ AGÊNCIA 2.0: SÓ carreira NOVA — convoca até 22 do álbum; renda SEMPRE no
      // 1º clube (o da fundação). Save antigo segue no empresário clássico.
      // 🔒 Por enquanto SÓ a conta do Diego (AGENCIA_TESTERS) — carreira de conta
      // comum nasce SEM a flag e fica 100% igual ao jogo de sempre.
      s.agenciaOn = agenciaLiberada() || undefined
      s.agenciados = []; s.agenciaEventos = undefined; s.agenciaFatura = undefined; s.agenciaHist = {}
      // 🪜 ESCADA DE CATEGORIAS: SÓ carreira NOVA de conta liberada (teste do Diego).
      // Começa presa ao degrau da divisão; libera geral após 2 temporadas na Série A.
      s.escadaOn = escadaLiberada() || undefined
      s.escadaLivre = undefined; s.escadaTempA = 0; s.escadaSubiu = undefined
      s.careerEra = MANUAL_ERA // 🎮 carreira NOVA: o Modo Manual pede apoio. Saves ANTIGOS não têm esse campo → seguem com o manual liberado (grandfather).
      s.roomId = ''; s.roomCode = ''; s.roomName = undefined
      s.locked = undefined; s.pwHash = undefined; s.streamMode = false; s.manualRoom = false
      // 🌍 conta liberada (teste do Diego): carreira nova usa BR+Europa+MUNDO juntos
      s.deckLeague = escadaLiberada() ? 'todos' : (action.league ?? 'br'); setActiveCatalog(s.deckLeague)
      s.seed = Math.floor(Math.random() * 1e9)
      const rng = mulberry(s.seed)
      s.humanCount = 1
      s.youIdx = 0
      const rivalCount = Math.max(0, Math.min(action.rivals, LEAGUE_SIZE - 1))
      // ordem dos nomes: rivais escolhidos primeiro (viram os auction-rivals), depois
      // o resto da Série D sem repetir.
      const chosen = (action.rivalTeams ?? []).map(tn => DIVISION_TEAMS['D'].find(t => t.team === tn)).filter((t): t is { team: string; name: string } => !!t)
      const rest = DIVISION_TEAMS['D'].filter(t => !chosen.some(c => c.team === t.team))
      // 🌱 escada: os bots de preenchimento da sala usam os times de VÁRZEA (a sala
      // é a divisão V) — os nomes da Série D ficam livres pro fundo profissional.
      const nameOrder = escadaLiberada() ? [...chosen, ...VARZEA_TEAMS] : [...chosen, ...rest]
      const { managers, botPlans } = makeManagers([action.teamName || 'Meu Time'], action.formation, rivalCount, LEAGUE_SIZE, rng, nameOrder)
      // marca os rivais escolhidos (os auction-rivals, ids 1..rivalCount) como
      // RIVAIS coloridos no display — são CPU, mas aparecem como rivais de verdade.
      for (let i = 0; i < rivalCount; i++) { const m = managers[1 + i]; if (m && !m.isHuman) m.rival = true }
      s.managers = managers
      s.agenciaClubeId = managers[0]?.id ?? 0 // 🕴️ nasce apontando pro 1º clube (fundação); com 2º clube o dono pode trocar no toggle (SET_AGENCIA_CLUBE)
      // colocação inicial: você e os rivais na Série D; A/B/C com os times fixos.
      // 🌱 ESCADA (Fase 2): a sala inteira nasce na VÁRZEA (V) e a Série D vira
      // divisão de fundo (times fixos da D − rivais escolhidos + extras, até 20).
      const pl: Record<string, string> = {}
      const divIni = s.escadaOn ? 'V' : 'D'
      for (const m of s.managers) pl[`m${m.id}`] = divIni
      for (const d of ['A', 'B', 'C'] as const) for (const t of DIVISION_TEAMS[d].slice(0, 20)) pl[t.team] = d
      if (s.escadaOn) {
        const mgrNames = new Set(s.managers.map(m => m.teamName))
        const dNames = [...DIVISION_TEAMS.D.map(t => t.team), ...EXTRA_D_TEAMS.map(t => t.team)].filter(nm => !mgrNames.has(nm)).slice(0, 20)
        for (const nm of dNames) pl[nm] = 'D'
      }
      s.careerPlacements = pl
      s.careerHonors = {}; s.careerCopaHonors = {}; s.marketValues = {}; s.marketLog = []
      s.careerScorersAll = {}; s.statsSeason = 0
      s.careerLedger = [] // 🧾 livro-caixa novo: extrato/transferências começam vazios
      s.empresarioCards = []; s.empresarioClaimKeys = [] // 💼 agência do Empresário começa vazia (renda das cartas ganhas nesta carreira)
      s.careerSponsor = undefined // 👕 patrocínio começa sem marca escolhida
      // 🧹 FAXINA ANTI-HERANÇA (04/08, família do bug "Copa21 em 8 temporadas"):
      // TUDO que é por-carreira zera aqui — senão vaza do save anterior.
      s.cpuSquads = undefined // fichas dos times de fundo: re-semeia do zero (antes REUSAVA os elencos da carreira velha!)
      s.copaDoneSeason = undefined // senão a Copa da temporada de mesmo nº era PULADA na carreira nova
      s.varzea = false // modo várzea do rápido não pode pintar o campo da carreira
      s.criaNames = []; s.criaNews = undefined; s.contratoRelease = undefined // 🌱 crias/janela zerados
      s.eventoTemporada = undefined; s.eventoManchetes = undefined // 🎭 eventos de jogador: carreira nova nasce sem causo pendente
      s.agenciaDividir = false // toggle da agência volta ao padrão (1º clube)
      // 🧹 carreira NOVA começa do ZERO: nada de estádio, SAF, títulos ou divisão
      // vazando de uma carreira anterior (bug reportado: o estádio vinha completo).
      s.stadiums = {}; s.careerFilial = undefined
      // 🏛️ BUG AO VIVO (04/08, print do Murriz): carreira NOVA nascia com o
      // MULTICLUBES fantasma da carreira anterior (seletor "M10 × M10") — o stash
      // nunca era limpo no START. Carreira nova = UM clube, sempre.
      s.multiClube = undefined; s.multiClubePendingCards = undefined
      s.careerTitles = 0; s.careerTitlesA = 0; s.careerDivision = s.escadaOn ? 'V' : 'D'
      s.clubCash = seedClubCash({}, pl)
      const used = new Set<string>()
      // 🪜 escada ligada: leilão de estreia = degrau D (foi-prof + bom) e bots
      // montados no modo várzea (fracos primeiro) — mesmo nível do usuário.
      s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, used, 1, s.marketValues, false, false, escadaDivOf(s))
      s.surpriseId = pickSurprise(s.deck, rng)
      dealBotSquads(s.managers, botPlans, rng, used, !!s.escadaOn)
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.roundIdx = 0; s.monte = []; s.news = []; s.round = 0; s.champion = null
      // 🛟 flag do leilão de RESERVAS (carreira) não pode vazar pro jogo novo: quem
      // saía de uma carreira NO MEIO do leilão de reservas e abria um jogo novo via
      // o pregão nascer com BANCO e mirando 22 (bug "tá com reservas no rápido?!").
      s.reserveAuction = false; s.reserveListed = {}
      s.quickCopa = null // 🏆 Copa dos 8 é POR TEMPORADA — jogo novo não herda a Copa de uma sessão anterior
      s.streamChampCard = null // 🎥 stream: carta do campeão é por temporada — não herda a anterior
      s.tactics = {}; s.careerTactics = {}; s.careerLineup = {}; s.seasonVotes = {}
      const cc: Record<number, number> = {}
      for (const m of s.managers) if (m.isHuman) { cc[m.id] = 100; m.money = 100 }
      s.careerCoins = cc
      s.seasonNo = 1
      // 🧾 carreira nova: zera o livro-caixa e registra o SALDO INICIAL de 100, pra
      // somar o Extrato dar exatamente a Caixa (era o único dinheiro fora do extrato).
      s.careerLedger = []
      logFin(s, 'opening', '🏁 Saldo inicial', 100)
      // 🔨 tela de regras antes do 1º pregão da carreira (mantém o modal de rivais
      // no setup; isto é só a página nova ao avançar).
      if (action.intro) { s.screen = 'streamIntro'; return s }
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    case 'RESUME_CAREER_SOLO': {
      // retoma a carreira offline salva: restaura o jogo inteiro e reancora o
      // baralho. Identidade sempre local (você é o host, sem sala).
      setActiveCatalog(action.saved.deckLeague)
      // nunca retoma numa tela lateral (álbum/ranking) — cai sempre no jogo.
      const scr = (action.saved.screen === 'album' || action.saved.screen === 'ranking') ? 'season' : action.saved.screen
      // 🏛️ MULTICLUBES: na carreira NORMAL o técnico é sempre o assento 0. Mas com
      // 2º clube, o comando pode estar em OUTRO assento (você trocou de clube) e o
      // save pode vir torto. `normalizeMultiSeats` crava 1 humano ativo + dormindo
      // certo e reancora o youIdx — assim o solo nunca cai em votação nem mostra os
      // dois clubes com o mesmo nome. No-op sem 2º clube.
      const restored = migrateTeamNames({ ...action.saved, screen: scr, onlineMode: 'cpu', isHost: true, roomId: '', roomCode: '', roomName: undefined, youIdx: 0, humanCount: 1, careerOnline: true })
      normalizeMultiSeats(restored)
      // 🧾 RECONCILIAÇÃO 1x de saves ANTIGOS (feitos antes do extrato registrar
      // saldo inicial, estádio e SAF): se o extrato não tem o 'saldo inicial', lança
      // um ajuste único = Caixa − soma dos lançamentos, pra somar o Extrato dar a
      // Caixa também nas carreiras que já estavam rolando. Guardado pelo kind 'opening'
      // (uma vez só; carreiras novas já nascem com o saldo inicial e caem fora daqui).
      const rLed = restored.careerLedger ?? []
      if (!rLed.some(e => e.kind === 'opening')) {
        const youId = restored.managers[restored.youIdx]?.id ?? restored.youIdx
        const caixa = restored.careerCoins?.[youId] ?? 0
        const soma = rLed.reduce((a, e) => a + e.amount, 0)
        const ajuste = caixa - soma
        const seasonMin = rLed.length ? Math.min(...rLed.map(e => e.season)) : (restored.seasonNo ?? 1)
        const entry: LedgerEntry = { id: Math.random().toString(36).slice(2), season: seasonMin, kind: 'opening', label: '🏁 Saldo inicial', amount: ajuste }
        restored.careerLedger = [entry, ...rLed]
      }
      return restored
    }
    case 'START_ONLINE': {
      s.simV = 4 // fórmula nova (v3: gol realista + menos goleada) só a partir desta temporada
      s.onlineMode = 'online'
      // baralho da sala: Rápido sempre BR; Carreira online pode ser BR, Europa
      // ou os dois juntos (escolha do host). O leilão e a temporada são o motor
      // real de sempre — só muda o catálogo de craques.
      s.deckLeague = action.deck ?? 'br'
      // 🥅 VÁRZEA ("Sem craques"): SÓ no rápido online + baralho BR (carreira e
      // Europa/Todos não têm essa categoria). Filtra o baralho pro leilão E os bots
      // saírem sem craque/lenda de uma vez. Restaura o baralho cheio logo após montar.
      const onlineVarzea = !action.career && (action.deck ?? 'br') === 'br' && !!action.varzea
      s.varzea = onlineVarzea
      setActiveCatalog(s.deckLeague, onlineVarzea)
      s.sport = 'futebol'; s.nbaCareer = false // ⚽ online é sempre futebol (não herda basquete de um jogo anterior)
      s.simSpeed = 1 // ⏩ todo jogo online COMEÇA no ritmo Normal — não herda a velocidade de um jogo anterior (era o "sim ultra rápida" numa sala auto, sem ninguém ter tocado no manual). Manual/stream re-escolhe a marcha dentro do jogo.
      s.locked = action.locked; s.pwHash = action.pwHash // guarda a senha no estado (sobrevive ao autosave)
      s.careerOnline = !!action.career // sala no modo Carreira (4 divisões) vs online rápido
      s.contratosOn = !!action.career // 📝 contratos: SÓ carreira NOVA nasce com eles (save antigo segue sem)
      s.ligaFechada = !!action.ligaFechada // 🏆 liga só com humanos (sem bots na tabela)
      // 🏆 Copa só destrava com 8+ jogadores. Na Liga Fechada com menos de 8, força
      // 'liga' (sem copa). Fora dela, mantém a escolha da sala (bots completam os 8).
      s.copaMode = (action.ligaFechada && action.playerNames.length < 8) ? 'liga' : (action.copaMode ?? 'liga_copa')
      if (action.career) {
        // colocação da temporada 1: todos os técnicos na Série D; A/B/C com os
        // times de CPU fixos. Compacto (só a divisão) — os elencos são derivados.
        const pl: Record<string, string> = {}
        for (const m of s.managers) pl[`m${m.id}`] = 'D'
        for (const d of ['A', 'B', 'C'] as const) for (const t of DIVISION_TEAMS[d].slice(0, 20)) pl[t.team] = d
        s.careerPlacements = pl
        s.careerHonors = {}; s.careerCopaHonors = {} // títulos (liga E Copa) começam do zero
        s.marketValues = {} // livro de preços começa vazio (leilão inicial sem piso)
        s.marketLog = []
        s.careerScorersAll = {}; s.statsSeason = 0 // artilharia de todos os tempos começa do zero
        s.clubCash = seedClubCash({}, pl) // todo time da pirâmide começa com caixa (base por divisão)
        s.careerFilials = {}; s.careerSponsors = {} // 🏢👕 Clube online por técnico começa zerado
      }
      s.roomId = action.roomId
      s.roomCode = action.roomCode
      s.roomName = action.roomName
      s.isHost = action.isHost
      s.youIdx = action.playerIndex
      s.humanCount = action.playerNames.length
      s.streamMode = !!action.stream
      s.manualRoom = !!action.manual // 🎮 sala manual: host controla o ritmo (botão manual/auto no jogo)
      s.auctionSecs = action.auctionSecs // ⏱️ tempo do leilão: undefined=45s · N=N segundos · 0=host avança no botão
      s.chatOff = !!action.chatOff // 💬 chat da sala ligado/desligado (escolha do host na criação)
      // seed do leilão: código da sala. No "novo leilão" (rematch) recebe um
      // salt → sorteia jogadores NOVOS. Como só o HOST monta e transmite (o
      // convidado copia via SYNC_STATE), o salt não precisa ser determinístico.
      s.seed = hashCode(action.roomCode + (action.rematch ? '#' + action.rematch : ''))
      const rng = mulberry(s.seed)
      // a tabela sempre tem 20 times: os que faltam viram bots com elenco
      // pronto (não brigam no leilão — só os humanos disputam as cartas).
      // RÁPIDO: os times da SÉRIE D são o elenco fixo do jogo (é neles que moram
      // os clubes batizados pelos apoiadores — têm que aparecer sempre). A ordem
      // embaralha a cada sala, e só se faltar nome (não falta: são 20) completa
      // com as outras séries. Carreira online mantém a estrutura das divisões.
      // 🏆 LIGA FECHADA: a tabela é só a galera (leagueSize = nº de humanos) → sem
      // bots. Nos outros modos, completa até 20 como sempre.
      const onlineLeagueSize = action.ligaFechada ? action.playerNames.length : LEAGUE_SIZE
      // 🌐 CARREIRA ONLINE: igual ao offline — os rivais ESCOLHIDOS pelo host entram
      // como CPUs que DÃO LANCE no leilão (auctionRival) e disputam a temporada. A
      // ordem de nomes coloca os escolhidos primeiro (viram os auction-rivals),
      // depois o resto da Série D. Rápido: pool embaralhado, sem rivais de leilão.
      const careerChosen = (action.rivalTeams ?? []).map(tn => DIVISION_TEAMS['D'].find(t => t.team === tn)).filter((t): t is { team: string; name: string } => !!t)
      const careerRest = DIVISION_TEAMS['D'].filter(t => !careerChosen.some(c => c.team === t.team))
      const namePool = action.career
        ? [...careerChosen, ...careerRest]
        : [...shuffle([...DIVISION_TEAMS.D], rng), ...shuffle([...DIVISION_TEAMS.A, ...DIVISION_TEAMS.B, ...DIVISION_TEAMS.C], rng)]
      const onlineRivalCount = action.career ? Math.max(0, Math.min(action.rivals ?? 0, onlineLeagueSize - action.playerNames.length)) : 0
      const { managers: onlineManagers, botPlans: onlinePlans } = makeManagers(action.playerNames, action.formation, onlineRivalCount, onlineLeagueSize, rng, namePool)
      // ⚠️ NÃO marca os rivais como `rival` (diferente do offline): na tabela online
      // só ficam marcados os HUMANOS (👤/🔥) e as SAFs (💼). Os rivais CPU brigam no
      // leilão mas aparecem como time comum, sem selo ⚔️.
      s.managers = onlineManagers
      // rápido (e T1 de carreira) começam SEM piso. O livro de preços
      // (marketValues) é memória da carreira ENTRE temporadas — não pode vazar do
      // jogo anterior nem do "novo leilão" do rápido, senão aparece "valor mínimo".
      s.marketValues = {}; s.marketLog = []
      // demanda + 1 carta por posição (online): 2 pessoas = 3 goleiros, 5
      // laterais, etc. — dá opção/disputa sem inflar. O baralho é montado
      // ANTES dos bots pra ficar 100% com reais.
      const onlineUsed = new Set<string>()
      s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, onlineUsed, 1, s.marketValues, false, onlineVarzea)
      s.surpriseId = pickSurprise(s.deck, rng)
      dealBotSquads(s.managers, onlinePlans, rng, onlineUsed, onlineVarzea)
      if (onlineVarzea) setActiveCatalog(s.deckLeague) // baralho várzea já foi montado → restaura o cheio pro resto
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.roundIdx = 0; s.monte = []; s.news = []; s.round = 0; s.champion = null
      // 🛟 flag do leilão de RESERVAS (carreira) não pode vazar pro jogo novo: quem
      // saía de uma carreira NO MEIO do leilão de reservas e abria um jogo novo via
      // o pregão nascer com BANCO e mirando 22 (bug "tá com reservas no rápido?!").
      s.reserveAuction = false; s.reserveListed = {}
      s.quickCopa = null // 🏆 Copa dos 8 é POR TEMPORADA — jogo novo não herda a Copa de uma sessão anterior
      s.streamChampCard = null // 🎥 stream: carta do campeão é por temporada — não herda a anterior
      s.tactics = {}; s.careerTactics = {}
      // carreira: cada técnico COMEÇA com 100 moedas (uma vez). Depois só ganha por
      // desempenho (título por série, acesso) e perde na queda — sem base recorrente.
      if (s.careerOnline) {
        // cada HUMANO começa com 100 de caixa (uma vez). Os bots que entram no
        // leilão são SORTEADOS a cada temporada (RESERVE_AUCTION_ONLINE) e usam o
        // caixa deles (clubCash) — no T1 inicial ninguém de bot dá lance.
        const cc: Record<number, number> = {}
        for (const m of s.managers) if (m.isHuman) { cc[m.id] = 100; m.money = 100 }
        s.careerCoins = cc
        // 🧾 livro-caixa online por técnico: zera e registra o saldo inicial de cada um
        s.careerLedgers = {}; s.careerEmpresario = {}; s.careerEmpresarioClaims = {}
        // 🧹 FAXINA ANTI-HERANÇA (04/08): mesmos campos do START solo
        s.cpuSquads = undefined; s.copaDoneSeason = undefined
        s.criaNames = []; s.criaNews = undefined; s.contratoRelease = undefined
        s.eventoTemporada = undefined; s.eventoManchetes = undefined // 🎭 eventos de jogador zerados
        for (const m of s.managers) if (m.isHuman) logFin(s, 'opening', '🏁 Saldo inicial', 100, undefined, m.id)
      }
      s.seasonNo = 1
      s.seasonVotes = {} // novo leilão: zera a votação de fim de jogo (senão volta marcada)
      s.restartPending = false; s.restartReady = [] // e a prontidão do restart
      // 🎥 STREAM / 🌐 CARREIRA: antes do pregão, uma tela explicativa (regras da
      // carreira, moedas, o auge, quem tá jogando) — os dois se veem online e o
      // HOST decide quando começar o leilão (START_STREAM_AUCTION). No rápido
      // normal/manual cai direto no leilão, como sempre.
      if (s.streamMode || s.careerOnline) { s.screen = 'streamIntro'; return s }
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    case 'START_STREAM_AUCTION': {
      // 🎥 host do stream tocou "Começar o leilão" na tela explicativa
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    case 'SUBMIT_ENVELOPE': {
      if (s.phase !== 'envelope' && s.phase !== 'resq_envelope') return s
      if (s.submitted.includes(action.mgrId)) return s
      s.pendingEnvelopes[action.mgrId] = action.bids
      s.submitted.push(action.mgrId)
      const pos = SECTORS[s.sectorIdx]
      const need = humansToSubmit(s, pos)
      const allIn = need.every(id => s.submitted.includes(id))
      // ⏱️ host-manual (auctionSecs=0): NÃO fecha sozinho nem quando todos lacram —
      // o host controla cada avanço no botão (FORCE_SEAL). Com cronômetro, fecha
      // na hora que todos lacram, como sempre.
      if (allIn && s.auctionSecs !== 0) sealAndResolve(s)
      return s
    }
    case 'ADVANCE_REVEAL': {
      if (s.phase !== 'reveal' && s.phase !== 'resq_reveal') return s
      if (s.revealIdx < s.revealQueue.length - 1) s.revealIdx++
      else afterReveal(s)
      return s
    }
    case 'SUBMIT_TIEBREAK': {
      if (s.phase !== 'tiebreak') return s
      const tb = s.tiebreaks[s.tiebreakIdx]
      if (!tb || tb.winner !== null) return s
      if (!tb.managers.includes(action.mgrId) || tb.submitted.includes(action.mgrId)) return s
      s.tiebreakPending[action.mgrId] = action.amount
      tb.submitted = [...tb.submitted, action.mgrId]
      maybeResolveTiebreak(s)
      return s
    }
    case 'FORCE_TIEBREAK': {
      if (s.phase !== 'tiebreak') return s
      // reconfirma o prazo: rejeita disparo atrasado/duplicado
      if (!s.phaseDeadline || Date.now() < s.phaseDeadline) return s
      const tb = s.tiebreaks[s.tiebreakIdx]
      if (!tb) return s
      // quem não re-lançou mantém o valor empatado (não cobre)
      for (const id of tb.managers) {
        const m = s.managers.find(x => x.id === id)
        if (m?.isHuman && !tb.submitted.includes(id)) {
          s.tiebreakPending[id] = tb.amount
          tb.submitted = [...tb.submitted, id]
        }
      }
      maybeResolveTiebreak(s)
      return s
    }
    case 'SET_MANUAL_ROOM': {
      // 🎮 só faz sentido na sala online: o host liga/desliga o ritmo manual e o
      // estado sincroniza (SYNC_STATE) — todos passam a ver o mesmo ritmo.
      if (s.onlineMode !== 'online') return s
      s.manualRoom = action.on
      return s
    }
    case 'FORCE_SEAL': {
      if (s.phase !== 'envelope' && s.phase !== 'resq_envelope') return s
      // COM cronômetro: só sela quando o prazo estourou (rejeita disparo atrasado/
      // duplicado de um cliente que ficou pra trás). SEM cronômetro (host-manual,
      // auctionSecs=0 → phaseDeadline null): é o BOTÃO do host que sela — sempre vale.
      if (s.phaseDeadline && Date.now() < s.phaseDeadline) return s
      const pos = SECTORS[s.sectorIdx]
      const need = humansToSubmit(s, pos)
      for (const id of need) {
        if (!s.submitted.includes(id)) {
          s.pendingEnvelopes[id] = s.pendingEnvelopes[id] ?? []
          s.submitted.push(id)
        }
      }
      sealAndResolve(s)
      return s
    }
    case 'MONTE_PICK': {
      if (s.screen !== 'monte') return s
      if (s.monteOrder[s.monteIdx] !== action.mgrId) return s
      // carreira: carta com piso é compra sem leilão — bloqueia se não tem caixa
      const picker = s.managers.find(m => m.id === action.mgrId)
      const pickCard = s.monte.find(c => c.id === action.cardId)
      if (picker && pickCard && !montePickable(s, picker, pickCard)) return s
      const rng = rngOf(s)
      takeFromMonte(s, action.cardId)
      s.monteIdx++
      advanceMonte(s, rng)
      if (s.monteIdx >= s.monteOrder.length || s.managers.every(m => totalHoles(m) === 0)) {
        enterCerimonia(s)
      }
      return s
    }
    case 'SET_SPONSOR': {
      // 👕 escolhe a marca do patrocínio (cosmético — o valor é por divisão).
      // Online: por técnico (careerSponsors[mgrId]). Offline: careerSponsor (igual).
      if (!s.careerOnline) return s
      if (s.onlineMode === 'online') {
        const id = action.mgrId ?? s.managers[s.youIdx]?.id ?? s.youIdx
        s.careerSponsors = { ...(s.careerSponsors ?? {}), [id]: action.id }
      } else {
        s.careerSponsor = action.id
      }
      return s
    }
    case 'BUY_FILIAL': {
      // 🏢 compra do clube-filial: só carreira OFFLINE, estádio 100% completo,
      // 2.000 de caixa, um por carreira, nunca um rival (nem o próprio time).
      if (s.onlineMode === 'online') {
        // 🏢 ONLINE: SAF por técnico (careerFilials[mgrId]); mesmas regras do solo.
        const you = s.managers.find(m => m.id === action.mgrId)
        if (!s.careerOnline || !you?.isHuman || s.careerFilials?.[you.id]) return s
        const coins = s.careerCoins?.[you.id] ?? 0
        if (coins < 2000) return s
        const stO = s.stadiums?.[you.id]
        // 🏥 o Dep. Médico só conta pra SAF nas carreiras com eventos (agenciaOn) —
        // save antigo compra a SAF com a régua de sempre (nada muda no meio).
        const readyO = STADIUM_SECTORS.every(x => sectorPct(stO, x.k) >= 100) && STADIUM_EXTRAS.every(e => (e.k === 'medico' && !s.agenciaOn) || hasExtra(stO, e.k))
        if (!readyO) return s
        if (s.careerRivals.some(r => r.team === action.team) || you.teamName === action.team) return s
        // e nunca um clube que OUTRO humano já tem de SAF
        if (Object.values(s.careerFilials ?? {}).some(f => f?.team === action.team)) return s
        s.careerCoins = { ...(s.careerCoins ?? {}), [you.id]: coins - 2000 }
        const h0O = s.careerHonors?.[action.team]
        s.careerFilials = { ...(s.careerFilials ?? {}), [you.id]: { team: action.team, since: s.seasonNo, earned: 0, titlesAtBuy: h0O ? (h0O.A + h0O.B + h0O.C + h0O.D) : 0 } }
        logFin(s, 'safbuy', `🏢 Compra da SAF · ${action.team}`, -2000, undefined, you.id)
        return s
      }
      if (!s.careerOnline || s.careerFilial) return s
      const you = s.managers[s.youIdx]
      if (!you?.isHuman) return s
      const coins = s.careerCoins?.[you.id] ?? 0
      if (coins < 2000) return s
      const st = s.stadiums?.[you.id]
      const ready = STADIUM_SECTORS.every(x => sectorPct(st, x.k) >= 100) && STADIUM_EXTRAS.every(e => (e.k === 'medico' && !s.agenciaOn) || hasExtra(st, e.k))
      if (!ready) return s
      if (s.careerRivals.some(r => r.team === action.team) || you.teamName === action.team) return s
      s.careerCoins = { ...s.careerCoins, [you.id]: coins - 2000 }
      // 🏢 congela os títulos que o clube JÁ tinha (da vida dele antes de você):
      // esses NÃO contam pro valor de venda — só o que ele ganhar sob seu comando.
      const h0 = s.careerHonors?.[action.team]
      const titlesAtBuy = h0 ? (h0.A + h0.B + h0.C + h0.D) : 0
      s.careerFilial = { team: action.team, since: s.seasonNo, earned: 0, titlesAtBuy }
      logFin(s, 'safbuy', `🏢 Compra da SAF · ${action.team}`, -2000) // 🧾 compra da SAF entra no extrato
      return s
    }
    case 'BUY_MULTICLUBE': {
      // 🏛️ MULTICLUBES · a compra: transforma um clube EXISTENTE da Série D (um bot da
      // sua liga) no SEU 2º clube. Vira um assento independente (id próprio → caixa,
      // títulos, estádio, divisão JÁ separados por construção). Começa DORMINDO.
      const PRECO = 4000
      if (s.onlineMode === 'online' || !s.careerOnline || s.multiClube) return s
      const you = s.managers[s.youIdx]
      if (!you?.isHuman) return s
      const coins = s.careerCoins?.[you.id] ?? 0
      if (coins < PRECO) return s
      // CASO 1 — estou NA Série D: o alvo já é um bot da minha liga → só transforma.
      let club = s.managers.find(m => m.teamName === action.team && !m.rival && !m.auctionRival && m.id !== you.id && !m.mine && (s.careerPlacements?.[`m${m.id}`] ?? 'D') === 'D')
      if (club) {
        club.mine = true; club.dormindo = true; club.isHuman = true; club.auctionRival = false
      } else {
        // CASO 2 — comprei de OUTRA divisão: o clube da Série D é um time que JÁ EXISTE
        // (com elenco próprio, como time de FUNDO). É como TROCAR O TÉCNICO dele: ele vira
        // seu 2º clube dormindo, com o MESMO elenco que já tinha — NENHUM outro time é
        // excluído. O resultado é um assento `mine+dormindo` idêntico ao do Caso 1.
        // Travas defensivas: nunca você/rival/SAF, e o alvo TEM que estar hoje na Série D.
        if (you.teamName === action.team) return s
        if (s.careerRivals.some(r => r.team === action.team)) return s
        if (s.careerFilial?.team === action.team) return s
        const divNow = s.careerPlacements?.[action.team] ?? (DIVISION_TEAMS['D'].some(t => t.team === action.team) ? 'D' : undefined)
        if (divNow !== 'D') return s
        const newId = Math.max(0, ...s.managers.map(m => m.id)) + 1
        const squad = ((s.cpuSquads?.[action.team] ?? []) as WonCard[]).map(c => ({ ...c })) // leva o elenco que o clube já tinha
        club = { id: newId, name: action.team, teamName: action.team, isHuman: true, auctionRival: false, mine: true, dormindo: true, formation: '4-3-3', money: 0, squad, aggression: 0.5, starHunger: 0.5 }
        // ADICIONA o clube (não exclui ninguém). O buildPyramid inclui o assento `mine`
        // mesmo além dos 20 da liga; o clube deixa de ser "de fundo" (vira manager, 1:1
        // na Série D — o total de 80 times por divisão fica intacto).
        s.managers = [...s.managers, club]
        const pl = { ...(s.careerPlacements ?? {}) }
        pl[`m${newId}`] = 'D'   // o 2º clube joga a Série D (mesmo lugar que o time de fundo ocupava)
        delete pl[action.team]  // o mesmo time deixa de contar como "de fundo" (agora é manager) — troca 1:1
        s.careerPlacements = pl
        s.clubCash = { ...(s.clubCash ?? {}), [`m${newId}`]: Math.round(s.clubCash?.[action.team] ?? 100) }
      }
      const cc = { ...(s.careerCoins ?? {}) }
      cc[you.id] = coins - PRECO // paga do TEU caixa (do clube ativo)
      cc[club.id] = cc[club.id] ?? Math.round(s.clubCash?.[`m${club.id}`] ?? 100) // caixa PRÓPRIA do 2º clube
      s.careerCoins = cc
      s.multiClube = { team: action.team, since: s.seasonNo, id: club.id }
      s.multiClubeAtivo = false // você segue no comando do principal; o 2º dorme
      logFin(s, 'safbuy', `🏛️ Compra do 2º clube (Multiclubes) · ${action.team}`, -PRECO)
      return s
    }
    case 'SWITCH_MULTICLUBE': {
      // 🏛️ MULTICLUBES · troca de comando LIVRE (Opção B): a UI (aba Clube) só libera
      // o botão em momento SEGURO — fora do leilão (outra tela) e sem rodada/Copa
      // animando. Passa o comando pro outro clube; o que sai DORME (congelado, "mesmo
      // time"). Nada mistura: caixa/títulos/estádio já são por id; os campos ÚNICOS do
      // solo (extrato/patrocínio/agência) fazem swap com o stash.
      // 🏢 A SAF é UMA só, COMPARTILHADA pelos 2 clubes (decisão do Diego): fica
      // grudada no clube ativo pra novos empréstimos, e o que um clube já pegou sai
      // do bolo (o outro só usa o que sobrou). Por isso a SAF NÃO faz swap — segue
      // igual. (Saves antigos guardavam uma SAF no clube que dormia: se a atual
      // estiver vazia, adoto a que estava guardada pra não perder.)
      if (s.onlineMode === 'online' || !s.careerOnline || !s.multiClube) return s
      const active = s.managers[s.youIdx]
      const sleepIdx = s.managers.findIndex(m => m.id === s.multiClube!.id)
      if (!active || sleepIdx < 0) return s
      const sleeping = s.managers[sleepIdx]
      active.dormindo = true; sleeping.dormindo = false
      s.youIdx = sleepIdx
      if (!s.careerFilial && s.multiClube.filial) s.careerFilial = s.multiClube.filial // migra SAF de save antigo
      // swap dos campos ÚNICOS (o que estava ativo vai pro stash; o que dormia volta) —
      // SEM a SAF, que é compartilhada.
      const stash = { ledger: s.careerLedger ?? [], sponsor: s.careerSponsor, empresario: s.empresarioCards ?? [], empresarioClaims: s.empresarioClaimKeys ?? [] }
      s.careerLedger = s.multiClube.ledger ?? []
      s.careerSponsor = s.multiClube.sponsor
      s.empresarioCards = s.multiClube.empresario ?? []
      s.empresarioClaimKeys = s.multiClube.empresarioClaims ?? []
      s.multiClube = { team: active.teamName, id: active.id, since: s.multiClube.since, ...stash }
      s.multiClubeAtivo = !s.multiClubeAtivo
      return s
    }
    case 'CLEAR_MULTICLUBE_PENDING': {
      // 🏛️ MULTICLUBES: você abriu o pacote guardado — risca essa carta pendente do clube.
      const cur = s.multiClubePendingCards?.[action.mgrId]
      if (!cur) return s
      const idx = cur.findIndex(p => p.season === action.season && !!p.copa === !!action.copa)
      if (idx < 0) return s
      const arr = cur.slice(); arr.splice(idx, 1)
      const pend = { ...(s.multiClubePendingCards ?? {}) }
      if (arr.length) pend[action.mgrId] = arr; else delete pend[action.mgrId]
      s.multiClubePendingCards = pend
      return s
    }
    case 'SELL_FILIAL': {
      // 🏢 vende a SAF: valor progressivo (divisão + títulos, teto 2.500). Devolve os
      // empréstimos ativos, credita o valor na caixa e libera comprar outra depois.
      if (s.onlineMode === 'online') {
        const you = s.managers.find(m => m.id === action.mgrId)
        const f = you ? s.careerFilials?.[you.id] : undefined
        if (!s.careerOnline || !you?.isHuman || !f) return s
        const { value } = filialSaleValue(s, f)
        returnFilialLoansFor(s, you, f) // empréstimos ativos voltam antes de vender
        s.careerCoins = { ...(s.careerCoins ?? {}), [you.id]: (s.careerCoins?.[you.id] ?? 0) + value }
        logFin(s, 'safsell', `🏢 Venda da SAF · ${f.team}`, value, undefined, you.id)
        const rest = { ...(s.careerFilials ?? {}) }; delete rest[you.id]; s.careerFilials = rest
        return s
      }
      if (!s.careerOnline || !s.careerFilial) return s
      const you = s.managers[s.youIdx]
      if (!you?.isHuman) return s
      const team = s.careerFilial.team
      const { value } = filialSaleValue(s)
      revertFilialLoans(s) // empréstimos ativos voltam antes de vender
      s.careerCoins = { ...(s.careerCoins ?? {}), [you.id]: (s.careerCoins?.[you.id] ?? 0) + value }
      logFin(s, 'safsell', `🏢 Venda da SAF · ${team}`, value) // 🧾 venda da SAF entra no extrato
      s.careerFilial = null
      return s
    }
    case 'ADD_EMPRESARIO_CARD': {
      // 💼 carta ganha no pacote de campeão entra na agência do Empresário (só
      // carreira SOLO). Dedup por TEMPORADA (o pacote reoferece a carta no reload):
      // cada pacote conta uma vez, mas cartas REPETIDAS entre temporadas EMPILHAM
      // (renda cresce). O álbum geral ignora repetidas sozinho (dedup por carta lá).
      if (s.onlineMode === 'online') {
        // online: agência POR-TÉCNICO (careerEmpresario/careerEmpresarioClaims
        // keyados por mgrId). Mesma regra de dedup por temporada do offline.
        const mid = action.mgrId
        if (mid == null) return s
        const claims = s.careerEmpresarioClaims?.[mid] ?? []
        if (action.key && claims.includes(action.key)) return s
        s.careerEmpresario = { ...(s.careerEmpresario ?? {}), [mid]: [...(s.careerEmpresario?.[mid] ?? []), { ...action.card, season: s.seasonNo ?? 1 }] }
        if (action.key) s.careerEmpresarioClaims = { ...(s.careerEmpresarioClaims ?? {}), [mid]: [...claims, action.key] }
        return s
      }
      if (!s.careerOnline) return s
      const keys = s.empresarioClaimKeys ?? []
      if (action.key && keys.includes(action.key)) return s // este pacote já foi registrado
      // carimba a temporada em que a carta foi ganha — ela só começa a render na
      // temporada SEGUINTE (não na virada da temporada em que foi tirada no fim).
      s.empresarioCards = [...(s.empresarioCards ?? []), { ...action.card, season: s.seasonNo ?? 1 }]
      if (action.key) s.empresarioClaimKeys = [...keys, action.key]
      return s
    }
    case 'LOAN_TO_FILIAL': {
      // empresta um jogador SEU pra SAF: some do seu time, joga lá — mas
      // continua SEU (não é venda). Vagas crescem com a divisão (D1·C2·B3·A4).
      if (s.onlineMode === 'online') {
        const you = s.managers.find(m => m.id === action.mgrId)
        const f = you ? s.careerFilials?.[you.id] : undefined
        if (!s.careerOnline || !you?.isHuman || !f) return s
        const outs = loanList(f.loanOut)
        if (outs.length >= filialSlots(s.careerPlacements?.[`m${you.id}`] ?? 'D')) return s
        const card = you.squad.find(c => c.id === action.cardId)
        if (!card || card.emprestado) return s
        const need = FORMATIONS[you.formation]
        if (you.squad.filter(c => c.pos === card.pos && !c.fake).length - 1 < need[card.pos]) return s
        you.squad = you.squad.filter(c => c.id !== action.cardId)
        const loaned = { ...card, emprestado: 'dono' } as WonCard
        const cpuSq = { ...(s.cpuSquads ?? {}) }
        cpuSq[f.team] = [...(cpuSq[f.team] ?? []), loaned]
        s.cpuSquads = cpuSq
        s.careerFilials = { ...(s.careerFilials ?? {}), [you.id]: { ...f, loanOut: [...outs, loaned] } }
        return s
      }
      if (!s.careerOnline || !s.careerFilial) return s
      const you = s.managers[s.youIdx]
      if (!you?.isHuman) return s
      const outs = loanList(s.careerFilial.loanOut)
      // 🏛️ com 2º clube a SAF é compartilhada: o limite por divisão conta só o que
      // ESTE clube emprestou (o do outro clube não gasta a sua vaga). Sem 2º clube =
      // conta tudo, idêntico ao de antes.
      const myOuts = s.multiClube ? outs.filter(c => c.byClub === you.id) : outs
      if (myOuts.length >= filialSlots(myCareerDiv(s))) return s
      const card = you.squad.find(c => c.id === action.cardId)
      if (!card || card.emprestado) return s
      // não pode abrir buraco no SEU titular emprestando
      const need = FORMATIONS[you.formation]
      const filled = you.squad.filter(c => c.pos === card.pos && !c.fake).length
      if (filled - 1 < need[card.pos]) return s
      you.squad = you.squad.filter(c => c.id !== action.cardId)
      const loaned = { ...card, emprestado: 'dono', byClub: you.id } as WonCard // 🏛️ carimba o clube que emprestou (multiclube)
      const cpuSq = { ...(s.cpuSquads ?? {}) }
      cpuSq[s.careerFilial.team] = [...(cpuSq[s.careerFilial.team] ?? []), loaned]
      s.cpuSquads = cpuSq
      s.careerFilial = { ...s.careerFilial, loanOut: [...outs, loaned] }
      return s
    }
    case 'LOAN_FROM_FILIAL': {
      // pega um jogador emprestado DA SAF: joga com você, mas continua sendo
      // dela — volta sozinho na virada. Vagas crescem com a divisão (D1·C2·B3·A4).
      if (s.onlineMode === 'online') {
        const you = s.managers.find(m => m.id === action.mgrId)
        const f = you ? s.careerFilials?.[you.id] : undefined
        if (!s.careerOnline || !you?.isHuman || !f) return s
        const ins = loanList(f.loanIn)
        if (ins.length >= filialSlots(s.careerPlacements?.[`m${you.id}`] ?? 'D')) return s
        const safSquad = (s.cpuSquads?.[f.team] ?? []) as WonCard[]
        const card = safSquad.find(c => c.id === action.cardId)
        if (!card || card.emprestado) return s
        const need = FORMATIONS['4-3-3']
        if (safSquad.filter(c => c.pos === card.pos && !c.fake).length - 1 < need[card.pos]) return s
        const cpuSq = { ...(s.cpuSquads ?? {}) }
        cpuSq[f.team] = safSquad.filter(c => c.id !== action.cardId)
        s.cpuSquads = cpuSq
        const loaned = { ...card, emprestado: 'saf' } as WonCard
        you.squad = [...you.squad, loaned]
        s.careerFilials = { ...(s.careerFilials ?? {}), [you.id]: { ...f, loanIn: [...ins, loaned] } }
        return s
      }
      if (!s.careerOnline || !s.careerFilial) return s
      const you = s.managers[s.youIdx]
      if (!you?.isHuman) return s
      const ins = loanList(s.careerFilial.loanIn)
      // 🏛️ com 2º clube a SAF é compartilhada: o limite por divisão conta só o que
      // ESTE clube pegou (o do outro clube não gasta a sua vaga). Sem 2º clube =
      // conta tudo, idêntico ao de antes.
      const myIns = s.multiClube ? ins.filter(c => c.byClub === you.id) : ins
      if (myIns.length >= filialSlots(myCareerDiv(s))) return s
      const safSquad = (s.cpuSquads?.[s.careerFilial.team] ?? []) as WonCard[]
      const card = safSquad.find(c => c.id === action.cardId)
      if (!card || card.emprestado) return s
      // não pode desfalcar a SAF abaixo do time titular dela (elenco de fundo é 4-3-3)
      const need = FORMATIONS['4-3-3']
      const filled = safSquad.filter(c => c.pos === card.pos && !c.fake).length
      if (filled - 1 < need[card.pos]) return s
      const cpuSq = { ...(s.cpuSquads ?? {}) }
      cpuSq[s.careerFilial.team] = safSquad.filter(c => c.id !== action.cardId)
      s.cpuSquads = cpuSq
      const loaned = { ...card, emprestado: 'saf', byClub: you.id } as WonCard // 🏛️ carimba o clube que pegou (multiclube)
      you.squad = [...you.squad, loaned]
      s.careerFilial = { ...s.careerFilial, loanIn: [...ins, loaned] }
      return s
    }
    case 'RETURN_FILIAL_LOAN': {
      // 🏢 traz UM empréstimo de volta na HORA (agora que o empréstimo persiste, é
      // assim que se desfaz — inclusive pra poder vender/listar quem estava emprestado).
      // Funciona nos 2 sentidos: seu jogador que estava na SAF volta pro seu elenco;
      // jogador da SAF que estava com você volta pra SAF.
      const online = s.onlineMode === 'online'
      const you = online ? s.managers.find(m => m.id === action.mgrId) : s.managers[s.youIdx]
      const f = online ? (you ? s.careerFilials?.[you.id] : undefined) : s.careerFilial
      if (!s.careerOnline || !you?.isHuman || !f) return s
      const outs = loanList(f.loanOut), ins = loanList(f.loanIn)
      const outCard = outs.find(c => c.id === action.cardId)
      const inCard = ins.find(c => c.id === action.cardId)
      if (!outCard && !inCard) return s
      const cpuSq = { ...(s.cpuSquads ?? {}) }
      const safSquad = [...(cpuSq[f.team] ?? [])]
      if (outCard) {
        // seu jogador estava jogando na SAF → tira de lá e devolve pro clube DONO
        const i = safSquad.findIndex(c => c.id === outCard.id); if (i >= 0) safSquad.splice(i, 1)
        const owner = (!online && s.multiClube) ? (s.managers.find(m => m.isHuman && m.id === outCard.byClub) ?? you) : you
        owner.squad = [...owner.squad, { ...outCard, emprestado: undefined, byClub: undefined } as WonCard]
      } else if (inCard) {
        // jogador da SAF estava no seu time → tira do elenco (qualquer humano) e volta pra SAF
        for (const m of s.managers) if (m.isHuman) m.squad = m.squad.filter(c => c.id !== inCard.id)
        safSquad.push({ ...inCard, emprestado: undefined, byClub: undefined } as WonCard)
      }
      cpuSq[f.team] = safSquad; s.cpuSquads = cpuSq
      const newF = { ...f, loanOut: outs.filter(c => c.id !== action.cardId), loanIn: ins.filter(c => c.id !== action.cardId) }
      if (online) s.careerFilials = { ...(s.careerFilials ?? {}), [you.id]: newF }
      else s.careerFilial = newF
      return s
    }
    case 'CLEAR_FILIAL_TRIM_NOTICE': {
      s.filialTrimNotice = null
      return s
    }
    case 'MONTE_PASS': {
      // CARREIRA: ninguém é obrigado a levar sobra (muito menos a PAGAR piso) —
      // o time já tem os 11. Fora da carreira não existe passar: o Monte fecha o XI.
      if (s.screen !== 'monte' || !s.careerOnline) return s
      if (s.monteOrder[s.monteIdx] !== action.mgrId) return s
      const m = s.managers.find(x => x.id === action.mgrId)
      if (!m || !m.isHuman) return s
      if (xiHoles(m) > 0) {
        // buraco no TITULAR: só deixa passar se NÃO houver nenhuma carta que ele
        // consiga pegar (todas pagas e sem caixa) — aí o buraco espera o próximo
        // leilão (a demanda conta o buraco e traz cartas da posição), sem travar.
        const alcancavel = s.monte.some(c => montePickable(s, m, c))
        if (alcancavel) return s
      }
      const rng = rngOf(s)
      s.monteIdx++
      advanceMonte(s, rng)
      if (s.monteIdx >= s.monteOrder.length || s.managers.every(mm => totalHoles(mm) === 0)) {
        enterCerimonia(s)
      }
      return s
    }
    case 'MONTE_TIMEOUT': {
      // estourou o tempo da vez de um humano (AFK). CARREIRA: NÃO pega ninguém e
      // NÃO cobra multa — o time já tem no mínimo 11, só pula a vez. CLÁSSICO: lá
      // o Monte é pra fechar o XI, então pega a pior sobra e -5 (segurança).
      if (s.screen !== 'monte') return s
      // reconfirma o prazo: rejeita disparo atrasado/duplicado de outra vez já passada
      if (!s.monteDeadline || Date.now() < s.monteDeadline) return s
      const mgrId = s.monteOrder[s.monteIdx]
      const m = s.managers.find(x => x.id === mgrId)
      if (!m || !m.isHuman) return s
      const rng = rngOf(s)
      if (!s.careerOnline) {
        const pick = monteWorstPick(s, m, s.monte, rng)
        if (pick) { takeFromMonte(s, pick.id); m.money = Math.max(0, m.money - MONTE_AFK_PENALTY) }
      }
      s.monteIdx++
      advanceMonte(s, rng)
      if (s.monteIdx >= s.monteOrder.length || s.managers.every(mm => totalHoles(mm) === 0)) {
        enterCerimonia(s)
      }
      return s
    }
    case 'FINISH_CEREMONY': {
      if (s.screen !== 'cerimonia') return s
      s.cerimoniaDeadline = null
      // FAKE DÁ LUGAR: bot que contratou jogador REAL e estourou o teto da posição
      // dispensa o incógnito mais fraco (nunca um real) até caber no elenco.
      if (s.careerOnline) for (const m of s.managers) {
        if (m.isHuman) continue
        for (const pos of SECTORS) {
          while (filled(m, pos) > slotsOf(m, pos) && m.squad.some(c => c.pos === pos && c.fake)) {
            const fakes = m.squad.filter(c => c.pos === pos && c.fake).sort((a, b) => (a.lo + a.hi) - (b.lo + b.hi))
            const worst = fakes[0]
            m.squad = m.squad.filter(c => c.id !== worst.id)
          }
        }
      }
      // 🧑‍🔧 REPOSIÇÃO DE ELENCO DOS BOTS (Diego 04/08: "bot não pode ficar com XI
      // furado — tem carta sobrando no baralho"): técnico de CPU da liga com
      // buraco na formação puxa carta REAL que não está em elenco nenhum,
      // respeitando a régua da divisão DELE (escada). Com o real dentro, o
      // incógnito mais fraco da posição sai. Roda ANTES do sorteio de contratos,
      // então carta nova de rival já nasce com contrato normal.
      if (s.careerOnline && s.onlineMode !== 'online') {
        const idR = (c: { name: string; club?: string; year?: number }) => `${c.name}|${c.club ?? ''}|${c.year ?? ''}`
        const usados = new Set<string>()
        for (const m of s.managers) for (const c of m.squad) if (!c.fake) usados.add(idR(c))
        for (const cards of Object.values(s.cpuSquads ?? {})) for (const c of cards) if (!(c as Card).fake) usados.add(idR(c as Card))
        const rngR = rngOf(s)
        for (const m of s.managers) {
          if (m.isHuman || m.marketCpu || m.backstop) continue
          const dv = s.careerPlacements?.[`m${m.id}`] ?? 'D'
          const escDv: EscadaDiv | null = (!s.escadaOn || s.escadaLivre) ? null : ((dv === 'A' || dv === 'B' || dv === 'C' || dv === 'D' || dv === 'V') ? dv : 'V')
          for (const pos of SECTORS) {
            const need = FORMATIONS[m.formation][pos]
            let reais = m.squad.filter(c => c.pos === pos && !c.fake).length
            let guard = 0
            while (reais < need && guard++ < 6) {
              // cascata (Diego 04/08: "bot não pode ficar com XI furado"): 1) baralho
              // livre na régua da divisão · 2) baralho livre fama ≤3 · 3) SÓ RIVAL:
              // baralho livre de QUALQUER fama (o mais fraco) · 4) puxa do FUNDO
              // (cpuSquads; o fundo tampa com zé — lá é cosmético) · 5) SÓ RIVAL:
              // fundo de qualquer fama (o mais fraco) · 6) incógnito (nunca em rival
              // com o mundo inteiro varrido — só se ele não existir mesmo).
              const fraco = (arr: { lo: number; hi: number }[]) => [...arr].sort((a, b) => (a.lo + a.hi) - (b.lo + b.hi))[0]
              const livres = ACTIVE_CATALOG[pos].filter(c => !usados.has(idR(c)))
              let pick = shuffle(livres.filter(c => !escDv || escadaAllows(escDv, c)), rngR)[0]
                ?? shuffle(livres.filter(c => (c.fame ?? 1) <= 3 && !c.promessa), rngR)[0]
                ?? (m.rival ? fraco(livres) : undefined)
              let doFundo: WonCard | null = null
              if (!pick) {
                const sq2 = { ...(s.cpuSquads ?? {}) }
                const elegivel = (c: WonCard, qualquer: boolean) => c.pos === pos && !c.fake && !isFillerClub(c.club) && (qualquer || (escDv ? escadaAllows(escDv, c) : (c.fame ?? 1) <= 3 && !c.promessa))
                for (const rodada of (m.rival ? [false, true] : [false])) {
                  if (doFundo) break
                  for (const cardsF of Object.values(sq2)) {
                    const cand = fraco((cardsF as WonCard[]).filter(c => elegivel(c, rodada)))
                    if (cand && (!doFundo || (cand.lo + cand.hi) < (doFundo.lo + doFundo.hi))) doFundo = cand as WonCard
                  }
                }
                if (doFundo) {
                  for (const [teamF, cardsF] of Object.entries(sq2)) {
                    const i2 = (cardsF as WonCard[]).findIndex(c => c.id === doFundo!.id)
                    if (i2 >= 0) { const arr2 = [...(cardsF as WonCard[])]; arr2.splice(i2, 1, fillerCard(pos, rngR)); sq2[teamF] = arr2; s.cpuSquads = sq2; break }
                  }
                }
              }
              const ganho = pick ?? doFundo
              if (ganho) {
                usados.add(idR(ganho))
                // ⚠️ carta do CATÁLOGO não carrega `pos` (a posição vem da chave do
                // setor) — injetar aqui é OBRIGATÓRIO, senão nasce carta sem posição
                m.squad.push({ ...ganho, pos, id: `repo-${m.id}-${pos}-${Math.floor(rngR() * 1e9)}`, paid: 0, via: 'monte', emprestado: undefined, seller: undefined, semContrato: undefined, contratoAte: undefined } as WonCard)
              } else {
                m.squad.push(fillerCard(pos, rngR))
              }
              reais++ // (na pior das hipóteses o incógnito preenche a vaga POSICIONAL)
              const fakes = m.squad.filter(c => c.pos === pos && c.fake).sort((a, b) => (a.lo + a.hi) - (b.lo + b.hi))
              if (m.squad.filter(c => c.pos === pos).length > need && fakes[0]) m.squad = m.squad.filter(c => c.id !== fakes[0].id)
            }
          }
        }
      }
      // 📝 CONTRATOS (carreira): todo jogador de HUMANO ou RIVAL que ainda não tem
      // contrato ganha um de 5-10 temporadas (contando a atual). SÓ em carreira que
      // NASCEU com contratos (contratosOn) — save antigo fica como sempre foi.
      // Sorteio determinístico (semente + temporada) → host e convidados iguais.
      if (s.careerOnline && s.contratosOn) {
        const crng = mulberry((s.seed ^ ((s.seasonNo ?? 1) * 92821) ^ 0xC027A) >>> 0)
        for (const m of s.managers) {
          if (!m.isHuman && !m.rival) continue
          for (const c of m.squad) {
            if (c.fake || c.cria || c.contratoAte != null) continue // 🌱 cria NUNCA assina contrato
            c.contratoAte = (s.seasonNo ?? 1) + 5 + Math.floor(crng() * 6) - 1 // 5..10 anos, vence no fim de contratoAte
          }
        }
      }
      // MERCADO DOS 80: fecha a ficha dos times de fundo que entraram como
      // participantes TEMPORÁRIOS — completa em 11 com filler (se não repôs) e guarda
      // caixa + elenco. A troca "cola" pra próxima temporada. Depois eles saem.
      if (s.careerOnline && s.managers.some(m => m.marketCpu)) {
        const frng = rngOf(s)
        const sq = { ...(s.cpuSquads ?? {}) }
        const cash = { ...(s.clubCash ?? {}) }
        for (const m of s.managers) if (m.marketCpu && m.marketTeam) {
          sq[m.marketTeam] = fillToEleven(m.squad, m.formation, frng)
          cash[m.marketTeam] = Math.max(0, Math.round(m.money))
        }
        s.cpuSquads = sq
        s.clubCash = cash
      }
      // rivais "auction-only" e times de fundo temporários já cumpriram o papel no
      // leilão — saem antes da temporada (voltam a ser time de fundo na simulação).
      s.managers = s.managers.filter(m => !m.auctionOnly && !m.marketCpu)
      const adj = cpuAdjFor(s) // nível-base fixo por divisão nos bots de fundo; rivais sem ajuste
      s.cpuAtkAdj = adj.atk; s.cpuDefAdj = adj.def
      s.league = buildLeague(s.managers, !s.ligaFechada)
      s.fixtures = buildFixtures(s.league, mulberry((s.seed ^ 0xCA1E0) >>> 0))
      s.round = 0
      s.scorers = []
      if (s.careerOnline) {
        // carreira online: a caixa é UMA carteira só que carrega o TROCO entre os
        // leilões. No fim de QUALQUER leilão (o inicial da T1 ou o de reservas), a
        // caixa vira o que sobrou do orçamento — o próximo leilão parte desse saldo
        // (mais bônus de título/acesso, menos queda), nunca zera pra 100 de novo.
        const cc = { ...(s.careerCoins ?? {}) }
        // 🏛️ MULTICLUBES: o clube DORMINDO é humano mas NÃO participa do leilão — o
        // `money` dele é um número VELHO. Gravar ele aqui APAGAVA os prêmios que o
        // clube ganhou dormindo (bug relatado: "premiação some/caixa se mistura").
        // Só quem jogou o leilão (não-dormindo) tem o troco reconciliado.
        for (const m of s.managers) if (m.isHuman && !m.dormindo) cc[m.id] = Math.round(m.money) // pode ser negativo (dívida) — não zera o vermelho
        s.careerCoins = cc
        // PERSISTE as transações dos bots no caixa (clubCash): quem VENDEU pro
        // mercado ganhou grana, quem COMPROU gastou. Assim o caixa vira história
        // real de mercado — não só prêmios. Vale pros que participaram do leilão
        // (rivais escolhidos + bots sorteados), que tiveram money vindo do clubCash.
        const cash = { ...(s.clubCash ?? {}) }
        for (const m of s.managers) if (!m.isHuman && (m.rival || m.backstop)) cash['m' + m.id] = Math.max(0, Math.round(m.money))
        s.clubCash = cash
      }
      if (s.reserveAuction) {
        // fim do leilão: tira o elenco fundo dos humanos (volta a mirar 11) e
        // desmarca os bots que entraram neste leilão (serão sorteados de novo no
        // próximo). O caixa dos bots (clubCash) muda só por prêmios de temporada.
        for (const m of s.managers) { if (m.isHuman) m.deepSquad = false; if (m.backstop) { m.backstop = false; m.deepSquad = false } }
        s.marketSellers = {} as Record<Sector, number[]>
        s.reserveAuction = false
      }
      s.screen = 'season'
      return s
    }
    case 'SET_TACTIC': {
      if (s.careerOnline) {
        // carreira online: tática é POR JOGO e vale do PRÓXIMO jogo em diante. O
        // jogo que está rolando (índice round-1) e os já passados NÃO re-simulam:
        // grava no próximo (índice round), então o placar na tela nunca muda.
        const r = Math.min(37, s.round)
        const bt = { ...(s.careerTactics ?? {}) }
        bt[action.mgrId] = { ...(bt[action.mgrId] ?? {}), [r]: action.tactic }
        s.careerTactics = bt
        return s
      }
      s.tactics[action.mgrId] = action.tactic
      return s
    }
    case 'SET_LINEUP': {
      // escalação POR JOGO (carreira online): grava os 11 titulares na rodada
      // ATUAL (round = próximo jogo), como a tática. Libera a partir da 2ª
      // temporada (quando há reservas). Sem re-simular o que já passou.
      if (!s.careerOnline || s.seasonNo < 2) return s
      // durante a temporada grava na rodada atual (próximo jogo). NO FIM (done,
      // round = 38) grava ALÉM das 38 já jogadas — assim NÃO re-simula o
      // campeonato que acabou, mas o pinHumanLineups pega essa última escalação e
      // carrega pra próxima temporada (você começa com o time já montado).
      // 🎭 EVENTOS: jogador SUSPENSO (banco/gancho/lesão) não entra na escalação
      // enquanto não chega a rodada da volta — a tela já bloqueia, aqui é a trava.
      const evLine = s.eventoTemporada
      if (evLine && evLine.season === s.seasonNo && evLine.status === 'banco' && (evLine.volta ?? 0) > s.round && evLine.mgrId === action.mgrId && action.ids.includes(evLine.cardId)) return s
      const r = s.round
      const bl = { ...(s.careerLineup ?? {}) }
      bl[action.mgrId] = { ...(bl[action.mgrId] ?? {}), [r]: action.ids }
      s.careerLineup = bl
      return s
    }
    case 'EVENTO_SET': {
      // 🎭 EVENTOS (carreira SOLO): registra o causo sorteado na tela. A trava de
      // "1 por temporada" mora AQUI (dispatch repetido/reload vira no-op).
      // 🔒 SÓ carreira com o novo modo empresário (agenciaOn) — ordem do Diego:
      // carreira antiga NUNCA vê banner (nada de regra nova em save velho).
      if (!s.careerOnline || s.onlineMode === 'online' || !s.agenciaOn) return s
      if (s.eventoTemporada && s.eventoTemporada.season === s.seasonNo) return s
      if (action.evento.season !== s.seasonNo) return s
      s.eventoTemporada = action.evento
      if (action.manchete) s.eventoManchetes = [...(s.eventoManchetes ?? []), action.manchete].slice(-24)
      return s
    }
    case 'EVENTO_DECIDE': {
      // 🎭 decisão do banner. 'troca': o reserva entra NA MESMA VAGA (posição igual —
      // formação nunca quebra) e o titular volta sozinho na rodada `volta` (as duas
      // escalações são gravadas JÁ AQUI no careerLineup; a volta vale até virando a
      // temporada, via pinHumanLineups). 'campo' (só noitada): joga hoje com queda
      // pequena SÓ neste jogo (a simulação aplica -2 via mods POR RODADA — nunca
      // mexe na carta, senão re-simularia o passado).
      const ev = s.eventoTemporada
      if (!ev || ev.status !== 'pendente' || ev.season !== s.seasonNo) return s
      const you = s.managers.find(m => m.id === ev.mgrId)
      if (!you) return s
      if (action.escolha === 'campo') {
        ev.status = 'campo'
      } else {
        const sub = you.squad.find(c => c.id === action.subId && c.pos === ev.pos)
        const idx = action.xi.indexOf(ev.cardId)
        if (!sub || idx < 0) { ev.status = 'campo' } // 🛟 estado torto (reserva sumiu?) → não trava o jogo: segue em campo
        else {
          const ids = action.xi.slice(); ids[idx] = sub.id
          const volta = ev.round + ev.rodadas
          const bl = { ...(s.careerLineup ?? {}) }
          bl[you.id] = { ...(bl[you.id] ?? {}), [ev.round]: ids, [volta]: action.xi.slice() }
          s.careerLineup = bl
          ev.status = 'banco'; ev.volta = volta; ev.subId = sub.id; ev.subNome = sub.name
        }
      }
      s.eventoTemporada = { ...ev }
      const m = mancheteDecisao(ev)
      s.eventoManchetes = [...(s.eventoManchetes ?? []), { season: ev.season, round: ev.round, ...m }].slice(-24)
      return s
    }
    case 'PLAY_ROUND':
    case 'SIM_MANY': {
      // CARREIRA ONLINE: a temporada é SIMULADA e determinística (a pirâmide das
      // 4 divisões vem dos elencos reais + semente + rodada). Aqui só avançamos a
      // rodada (o host conduz, e isso já sincroniza) — nada de simular a liga viva.
      if (s.careerOnline) {
        // 🎭 EVENTOS (solo): banner PENDENTE trava o avanço da rodada — o técnico
        // decide primeiro (a tela nem dispara, isto é o cinto de segurança).
        // 🩹 CURA: carreira SEM agenciaOn não pode ter evento (vazou no lançamento
        // de 04/08 pra saves antigos) — limpa e segue, ninguém fica preso na rodada.
        if (!s.agenciaOn && s.eventoTemporada) s.eventoTemporada = undefined
        if (s.onlineMode !== 'online' && s.agenciaOn && s.eventoTemporada?.status === 'pendente' && s.eventoTemporada.season === s.seasonNo) return s
        // cura ids duplicados de elencos antigos (bug do leilão de reservas) — uma
        // vez só; depois vira no-op. Se corrigiu, zera escalações manuais que
        // apontavam pro id duplicado (voltam ao XI automático, correto).
        if (healSquadIds(s.managers)) s.careerLineup = {}
        // cura salas antigas: garante caixa (base por divisão) pra TODO time da
        // pirâmide, pra os bots não aparecerem zerados no ranking. Idempotente.
        if (!s.clubCash || Object.keys(s.clubCash).length === 0) s.clubCash = seedClubCash({}, s.careerPlacements)
        const times = action.type === 'PLAY_ROUND' ? 1 : action.count
        s.round = Math.min(TOTAL_ROUNDS, s.round + times)
        // o fim de temporada é tratado na própria tela da pirâmide (não vai pro
        // EscEnd, que usa a liga viva). A rodada capada em 38 encerra a sim.
        return s
      }
      const times = action.type === 'PLAY_ROUND' ? 1 : action.count
      // 🏆 total de rodadas = tamanho REAL do calendário (20 times = 38, como
      // sempre; Liga Fechada = 2×(nº de times − 1), ou menos com folga). Fallback
      // pro clássico 38 só se as fixtures ainda não existirem.
      const roundsTotal = s.fixtures.length || TOTAL_ROUNDS
      const isHumanId = (id: number) => !!s.managers.find(m => m.id === id && m.isHuman)
      // 🙈 ANTI-SPOILER (liga offline): foto da artilharia ANTES desta rodada. A tela
      // mostra ESTA foto enquanto o SEU jogo anima e só troca pela nova no apito —
      // senão o total do artilheiro subia (ex.: "Romário 12→13") e entregava que ele
      // te fez gol antes da partida animar. A tabela já segurava; a artilharia não.
      s.scorersPrev = s.scorers.map(sc => ({ ...sc }))
      for (let i = 0; i < times && s.round < roundsTotal; i++) {
        const rng = mulberry(s.seed + 5000 + s.round * 37)
        // fotografa posições e gols ANTES pra narrar as viradas
        const prevRank = new Map(sortedTable(s.league).map((t, idx) => [t.id, idx + 1]))
        const prevGoals = new Map(s.scorers.map(sc => [sc.name + ':' + sc.teamId, sc.goals]))
        const results = s.fixtures[s.round].map(([h, a]) => simMatch(s, h, a, rng))
        results.forEach(r => applyResult(s.league, r))
        // rivalidade: só confrontos entre dois humanos contam
        results.forEach(r => { if (isHumanId(r.homeId) && isHumanId(r.awayId)) bumpRivalry(s, r.homeId, r.awayId, r.hg, r.ag) })
        // carreira: retrospecto contra seus rivais fixos que estão na sua divisão
        if (s.careerDivision && s.careerRivals.length > 0) results.forEach(r => bumpCareerH2H(s, r))
        s.lastResults = results
        const heads = narrateRound(s, results, prevRank, prevGoals, s.round + 1)
        s.news = [...heads, ...s.news]
        s.round++
      }
      s.news = s.news.slice(0, 12)
      // Dinastia: pausa UMA vez na metade do calendário → janela do meio (economia).
      // O overlay assume, e RESUME_DINASTIA solta o returno.
      if (s.dinastia && !s.dinastiaMidUsed && s.round >= Math.floor(roundsTotal / 2) && s.round < roundsTotal) {
        s.dinastiaPaused = true; s.dinastiaMidUsed = true
      }
      if (s.round >= roundsTotal && action.type === 'SIM_MANY') {
        // pulo em MASSA (sem assistir): encerra na hora. Rodada a rodada (PLAY_ROUND)
        // NÃO encerra aqui — deixa a última partida ANIMAR; a tela chama FINISH_SEASON.
        finishSeason(s)
      }
      return s
    }
    case 'FINISH_SEASON': {
      // 🏁 chamado pela tela quando a ANIMAÇÃO da última rodada acaba: coroa o campeão
      // e vai pro fim (ou semeia a Copa). Idempotente (champion/screen já setados).
      if (s.careerOnline || s.round < (s.fixtures.length || TOTAL_ROUNDS) || s.screen === 'end') return s
      finishSeason(s)
      return s
    }
    case 'START_COPA': {
      // sai do fim de liga e volta pra tela da temporada — que, com quickCopa
      // já semeado e round=38, passa a tocar a Copa (ver EscSeason).
      if (s.quickCopa && s.quickCopa.phase !== 'done') s.screen = 'season'
      return s
    }
    case 'PLAY_COPA_LEG': {
      const qc = s.quickCopa
      if (!qc || qc.phase === 'done') return s
      if (!qc.scorers) qc.scorers = [] // saves antigos sem o campo
      const isFinal = qc.phase === 'final'
      const legsNeeded = isFinal ? 1 : 2 // ida+volta (fases) ou jogo único (final)
      const legsPlayed = qc.ties[0]?.legs.length ?? 0
      // ── AVANÇO de fase: passo À PARTE de jogar a perna. Só roda DEPOIS que a
      // última perna já teve tempo de animar na tela (o dispatch anterior tocou a
      // perna; este só fecha o chaveamento e monta a próxima fase). Sem isso, a
      // volta era jogada e a fase virava no MESMO passo — a volta nunca aparecia.
      if (legsPlayed >= legsNeeded) {
        qc.bracket = [...qc.bracket, { phase: qc.phase, ties: qc.ties }]
        if (isFinal) {
          const champ = qc.ties[0]
          const champId = champ.winner!
          const champName = champId === champ.aId ? champ.aName : champ.bName
          const you = s.managers.find(m => m.id === champId && m.isHuman)
          qc.champion = { id: champId, name: champName, you: !!you }
          s.news = [`👑 ${champName} É CAMPEÃO DA COPA DOS 8!`, ...s.news].slice(0, 12)
          qc.phase = 'done'
          qc.ties = []
          s.screen = 'end'
        } else {
          const winnerName = (t: QuickCopaTie) => t.winner === t.aId ? t.aName : t.bName
          const nextTies: QuickCopaTie[] = qc.phase === 'quartas'
            ? [
                { aId: qc.ties[0].winner!, bId: qc.ties[1].winner!, aName: winnerName(qc.ties[0]), bName: winnerName(qc.ties[1]), legs: [], winner: null },
                { aId: qc.ties[2].winner!, bId: qc.ties[3].winner!, aName: winnerName(qc.ties[2]), bName: winnerName(qc.ties[3]), legs: [], winner: null },
              ]
            : [
                { aId: qc.ties[0].winner!, bId: qc.ties[1].winner!, aName: winnerName(qc.ties[0]), bName: winnerName(qc.ties[1]), legs: [], winner: null },
              ]
          qc.phase = qc.phase === 'quartas' ? 'semis' : 'final'
          qc.ties = nextTies
          qc.legIdx = 0
        }
        return s
      }
      // ── JOGA a próxima perna. legIdx = a perna que está sendo jogada/MOSTRADA
      // agora (0 = ida, 1 = volta) — o rótulo na tela lê daqui, então fica certo.
      qc.legIdx = legsPlayed as 0 | 1
      const isLastLeg = legsPlayed + 1 >= legsNeeded // volta (fases) ou o jogo único (final)
      const rng = mulberry(s.seed + 90000 + s.seasonNo * 733 + qc.ties.length * 31 + qc.bracket.length * 97 + qc.legIdx * 13)
      for (const tie of qc.ties) {
        if (tie.winner !== null) continue
        // ida: A em casa; volta: B em casa (mandante troca). Final: jogo único, A em casa.
        const homeId = qc.legIdx === 0 ? tie.aId : tie.bId
        const awayId = qc.legIdx === 0 ? tie.bId : tie.aId
        // 🏆 gols da Copa contam numa artilharia À PARTE (qc.scorers) — não mexe na da liga.
        // Final = jogo ÚNICO em campo NEUTRO (isFinal): sem vantagem de casa, mesma chance
        // pros dois. Ida/volta mantêm a casa (que se alterna, então também é justo).
        const r = simMatch(s, homeId, awayId, rng, qc.scorers, isFinal)
        const leg: [number, number] = qc.legIdx === 0 ? [r.hg, r.ag] : [r.ag, r.hg] // sempre [gols de A, gols de B]
        tie.legs.push(leg)
        tie.lastHighlights = r.highlights
        if (isLastLeg) resolveQuickCopaTie(tie, rng) // só resolve no fim (agregado/pênaltis)
      }
      // 📣 GIRO DA COPA: manchetes do que acabou de rolar (placar, quem passou,
      // pênaltis) — o giro fala DA COPA agora, não das rodadas da liga.
      const phaseWord = isFinal ? 'FINAL' : qc.phase === 'semis' ? 'SEMI' : 'QUARTAS'
      const legWord = isFinal ? '' : qc.legIdx === 0 ? ' · ida' : ' · volta'
      const copaHeads: string[] = []
      for (const tie of qc.ties) {
        const leg = tie.legs[tie.legs.length - 1]
        if (!leg) continue
        // na VOLTA o mandante inverte (B joga em casa): mostra o mandante primeiro
        // no placar, pra manchete refletir a troca de lado (ida A×B, volta B×A).
        const swap = qc.legIdx === 1 // volta
        const mand = swap ? tie.bName : tie.aName, vis = swap ? tie.aName : tie.bName
        const mandG = swap ? leg[1] : leg[0], visG = swap ? leg[0] : leg[1]
        copaHeads.push(`⚽ Copa ${phaseWord}${legWord}: ${mand} ${mandG} × ${visG} ${vis}`)
        if (tie.winner !== null) {
          const w = tie.winner === tie.aId ? tie.aName : tie.bName
          const l = tie.winner === tie.aId ? tie.bName : tie.aName
          copaHeads.push(tie.pens ? `🎯 ${w} passou nos PÊNALTIS e eliminou ${l}!` : `🏆 ${w} avançou na Copa — adeus, ${l}!`)
        }
      }
      s.news = [...copaHeads, ...s.news].slice(0, 12)
      return s
    }
    case 'CHANGE_FORMATION': {
      // 🎽 troca de formação (carreira). REGRA (aprovada pelo Diego): troca pra
      // QUALQUER formação que você consiga PREENCHER por posição com jogadores REAIS
      // e SEUS. O emprestado NÃO conta (é extra temporário: volta na virada — assim
      // nunca fica sem jogador em campo depois), e NUNCA entra perna-de-pau/fake.
      // Sem exigir 22 e sem teto: o excedente vira banco. Aplica da rodada atual em
      // diante (não mexe no passado).
      if (!s.careerOnline) return s
      const mid = action.mgrId ?? s.managers[s.youIdx]?.id
      const m = s.managers.find(x => x.id === mid && x.isHuman)
      if (!m || m.formation === action.formation) return s
      const real = m.squad.filter(c => !c.fake)
      const need = FORMATIONS[action.formation]
      if (!need) return s // formação desconhecida (save/rota estranha) — nunca quebra
      for (const pos of SECTORS) if (real.filter(c => c.pos === pos && !c.emprestado).length < need[pos]) return s // falta jogador real na posição
      m.formation = action.formation
      const cl = { ...(s.careerLineup ?? {}) }
      cl[m.id] = { ...(cl[m.id] ?? {}), [s.round]: bestXIids(m.squad, action.formation) }
      s.careerLineup = cl
      return s
    }
    case 'FORMATION_UNLOCK': {
      // destrava permanente ao chegar a 22 reais (mesmo que o jogador nem troque a
      // formação na hora). Só marca — a trava por-posição segue valendo na troca.
      if (!s.careerOnline) return s
      const mid = action.mgrId ?? s.managers[s.youIdx]?.id
      const m = s.managers.find(x => x.id === mid && x.isHuman)
      if (!m || m.formUnlocked) return s
      if (ownedRealCount(s, m) < 22) return s // conta também os DELE emprestados na SAF
      m.formUnlocked = true
      return s
    }
    case 'CAST_SEASON_VOTE': {
      // fim de temporada/jogo: cada humano vota entre leilão e seguir com o mesmo
      // time. Guarda o voto (guest rota pro host, host aplica e sincroniza).
      // Vale no carreira online E no online rápido (fim de jogo).
      if (s.onlineMode !== 'online' && !s.careerOnline) return s
      s.seasonVotes = { ...(s.seasonVotes ?? {}), [action.mgrId]: action.vote }
      return s
    }
    case 'RECORD_SEASON_STATS': {
      // fim de temporada: soma os gols dos artilheiros de TODOS os times (usuário,
      // bot e rival, todas as 4 divisões) no acumulado de TODOS OS TEMPOS (por
      // nome). Idempotente: só grava uma vez por temporada.
      if (!s.careerOnline) return s
      if ((s.statsSeason ?? 0) >= s.seasonNo) return s
      const all = { ...(s.careerScorersAll ?? {}) }
      for (const sc of action.scorers) {
        const prev = all[sc.name]
        all[sc.name] = { ...sc, goals: (prev?.goals ?? 0) + sc.goals } // teamName/div = os da última temporada (display)
      }
      // guarda os 300 MELHORES de todos os tempos: o ranking mostra só 20, então
      // 300 é folga de sobra (cobre quem está perto de entrar) e evita o save
      // crescer sem fim. Ninguém relevante pro ranking é cortado.
      const top = Object.values(all).sort((a, b) => b.goals - a.goals).slice(0, 300)
      s.careerScorersAll = Object.fromEntries(top.map(x => [x.name, x]))
      s.statsSeason = s.seasonNo
      return s
    }
    case 'BANCO_CREDIT': {
      // 🏦 BANCO LEGENDS: a validação/queima da ficha é do Supabase (RPC atômica);
      // aqui só entra o crédito. Solo apenas; valores fixos dos pacotes.
      if (s.onlineMode === 'online' || !s.careerOnline) return s
      if (![10, 50, 100, 500, 1000].includes(action.coins)) return s
      const yb = s.managers[s.youIdx]?.id ?? 0
      s.careerCoins = { ...(s.careerCoins ?? {}), [yb]: (s.careerCoins?.[yb] ?? 0) + action.coins }
      logFin(s, 'banco', `🏦 Empréstimo do Banco Legends (ficha ${action.code})`, action.coins, undefined, yb)
      return s
    }
    case 'SET_AGENCIA_CLUBE': {
      // 🕴️×🏛️ (Diego 04/08): com 2 clubes, VOCÊ escolhe pra qual caixa vai a
      // renda INTEIRA da agência (mensalidades + comissões) — nada de dividir.
      // Só solo, e só pra um clube SEU (ativo ou dormindo). Os destraves passam
      // a olhar o estádio do clube escolhido (mesma regra de sempre).
      if (s.onlineMode === 'online' || !s.careerOnline) return s
      // 🤝 dividir: metade pra cada clube (só existe com 2 clubes)
      if (action.dividir) { if (!s.multiClube) return s; s.agenciaDividir = true; return s }
      const alvo = s.managers.find(m => m.id === action.mgrId)
      if (!alvo?.isHuman) return s
      const ativo = s.managers[s.youIdx]?.id
      if (alvo.id !== ativo && alvo.id !== s.multiClube?.id) return s
      s.agenciaClubeId = alvo.id
      s.agenciaDividir = false
      return s
    }
    case 'SET_AGENCIA': {
      // 🕴️ AGÊNCIA 2.0: grava a convocação (até 22, nomes únicos — a tela já valida,
      // aqui é a trava de motor). Só carreira solo nova.
      if (!s.agenciaOn || !agenciaLiberada()) return s
      // 🔒 trava de motor: só carta ganha NESTA carreira (títulos daqui — ativo +
      // stash do 2º clube) pode ser convocada. Nada de carta de fora entrar.
      const cofre = new Set([...(s.empresarioCards ?? []), ...(s.multiClube?.empresario ?? [])].map(c => `${c.name}|${c.club}|${c.year}`))
      const seen = new Set<string>()
      const list: AgCard[] = []
      for (const c of action.cards) {
        if (!cofre.has(`${c.name}|${c.club}|${c.year}`)) continue
        if (list.length >= 22) break
        if (seen.has(c.name)) continue // mesma pessoa 2x não vale (dois auges = 1 escolha)
        seen.add(c.name)
        list.push({ name: c.name, club: c.club, year: c.year, pos: c.pos, fame: c.fame, promessa: c.promessa || undefined, folk: c.folk || undefined })
      }
      s.agenciados = list
      return s
    }
    case 'AGENCIA_SEASON_EVENTS': {
      // 🕴️ AGÊNCIA 2.0: eventos da temporada (artilheiro/campeão) — computados na
      // tela quando a Copa termina; ficam PENDENTES e são pagos na virada
      // (applySeasonMoney). Idempotente: só grava uma vez por temporada.
      if (!s.agenciaOn || !agenciaLiberada()) return s
      if (action.season !== (s.seasonNo ?? 1)) return s
      if (s.agenciaEventos?.season === action.season && s.agenciaEventos.eventosDone) return s
      const prev = (s.agenciaEventos && s.agenciaEventos.season === action.season) ? s.agenciaEventos.rows : []
      s.agenciaEventos = { season: action.season, rows: [...prev, ...action.rows], eventosDone: true }
      return s
    }
    case 'SEED_CPU_SQUADS': {
      // materializa a ficha dos 60 times de fundo (1x). Idempotente: se já existe,
      // não sobrescreve (o mercado já pode ter mexido).
      if (!s.careerOnline || s.cpuSquads) return s
      s.cpuSquads = action.squads
      healCpuSquads(s) // 🔒 a ficha veio pré-calculada pelo cliente — se ela pegou o elenco de
      // alguém desatualizado (arremate ainda não aplicado), tira o jogador que já tem dono
      return s
    }
    case 'REAUCTION_ONLINE': {
      s.simV = 4 // fórmula nova (v3: gol realista + menos goleada) só a partir desta temporada
      // carreira online (novo leilão): aplica a nova colocação e REFAZ o leilão
      // — mesmos técnicos (ids/times preservados), elencos zerados, orçamento
      // parelho pra todos. A divisão só importa na hora de jogar a temporada.
      if (!s.careerOnline) return s
      s.seasonVotes = {} // temporada nova: zera a votação
      setActiveCatalog(s.deckLeague) // reancora o baralho ANTES de montar o deck (reload zera o ponteiro pra BR)
      applySeasonMoney(s, action.rewards) // 💰 prêmios + 🏟️ bilheteria + 💸 folha (e registra no extrato) — ANTES de zerar/refazer o leilão
      s.clubCash = applyClubRewards(seedClubCash(s.clubCash ?? {}, action.placements), action.clubRewards) // caixa dos outros times (base + premios)
      applyFilialCommission(s, action.clubRewards ?? {}) // 🏢 50% da campanha da filial pro dono (teste)
      revertFilialLoans(s) // 🏢 empréstimos voltam sozinhos; janela reabre pra próxima temporada
      s.careerHonors = applyHonors(s.careerHonors, action.champions) // títulos da temporada
      if (action.copaChampion) s.careerCopaHonors = { ...(s.careerCopaHonors ?? {}), [action.copaChampion]: (s.careerCopaHonors?.[action.copaChampion] ?? 0) + 1 } // 🏆 Copa no histórico
      applyScorerValues(s, action.scorerValues) // artilheiros: sobem piso no livro (o novo leilão já sai com o valor atualizado)
      s.seasonNo++
      s.careerPlacements = action.placements
      escadaAfterPlacements(s) // 🪜 subiu da estreia? destrava o banco
      s.round = 0; s.champion = null
      const humanNames = s.managers.filter(m => m.isHuman).map(m => m.name)
      const formation = s.managers.find(m => m.isHuman)?.formation ?? '4-3-3'
      const rng = mulberry((s.seed ^ (s.seasonNo * 2246822519)) >>> 0)
      const { managers, botPlans } = makeManagers(humanNames, formation, 0, LEAGUE_SIZE, rng)
      s.managers = managers
      const used = new Set<string>()
      s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, used, 1, s.marketValues, false, false, escadaDivOf(s))
      s.surpriseId = pickSurprise(s.deck, rng)
      dealBotSquads(s.managers, botPlans, rng, used)
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.roundIdx = 0; s.monte = []; s.news = []
      s.tactics = {}; s.careerTactics = {}; s.submitted = []; s.pendingEnvelopes = {}; s.tiebreaks = []; s.tiebreakIdx = 0; s.tiebreakPending = {}
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    case 'OPEN_RESERVE_LIST': {
      // carreira online: já ENTRA na temporada nova (aplica acessos/quedas, moedas,
      // títulos) e abre a tela de VENDA — "Listar pra leilão" (45s). A compra vem
      // depois (RESERVE_AUCTION_ONLINE), quando o host começa o leilão.
      if (!s.careerOnline) return s
      pinHumanLineups(s) // fixa o SEU XI ANTES do leilão — reforço novo vai pro banco
      s.seasonVotes = {} // temporada nova: zera a votação
      applySeasonMoney(s, action.rewards) // 💰 prêmios + 🏟️ bilheteria + 💸 folha (e registra no extrato) — ANTES da venda/leilão de reservas
      s.clubCash = applyClubRewards(seedClubCash(s.clubCash ?? {}, action.placements), action.clubRewards) // caixa dos outros times (base + premios)
      applyFilialCommission(s, action.clubRewards ?? {}) // 🏢 50% da campanha da filial pro dono (teste)
      s.careerPlacements = action.placements // ⚠️ ANTES do trim: a devolução do excedente usa a divisão NOVA
      escadaAfterPlacements(s) // 🪜 subiu da estreia? destrava o banco
      s.filialTrimNotice = trimFilialLoansToDivision(s) || null // 🏢 empréstimo PERSISTE; só devolve o excedente se rebaixou (com aviso)
      s.careerHonors = applyHonors(s.careerHonors, action.champions)
      if (action.copaChampion) s.careerCopaHonors = { ...(s.careerCopaHonors ?? {}), [action.copaChampion]: (s.careerCopaHonors?.[action.copaChampion] ?? 0) + 1 } // 🏆 Copa no histórico
      recordDormantCards(s, action.champions, action.copaChampion) // 🏛️ guarda a carta se o 2º clube (dormindo) foi campeão
      applyScorerValues(s, action.scorerValues) // artilheiros: sobem piso (livro + paid) antes da venda/leilão de reservas
      // 🌱 cria que não é mais necessário SOME do jogo ("volta pra base"): se a
      // posição fecha a formação sem ele (chegou reforço de verdade), ele sai de
      // graça, com carinho no resumo. Nunca sai se a saída quebrar o XI.
      for (const m of s.managers) {
        if (!m.isHuman || m.dormindo) continue
        for (const c of [...(m.squad as WonCard[])]) {
          if (!c.cria) continue
          const need = FORMATIONS[m.formation][c.pos]
          const semEle = m.squad.filter(x => x.pos === c.pos && !x.emprestado && !x.fake && x.id !== c.id).length
          if (semEle >= need) {
            m.squad = m.squad.filter(x => x.id !== c.id)
            ;(s.marketLog = s.marketLog ?? []).push(`🌱 ${c.name} voltou pra base de cabeça erguida — missão cumprida, chegou reforço. Valeu, guri! 💚`)
          }
        }
      }
      s.seasonNo++
      s.round = 0; s.champion = null
      s.careerTactics = {}
      s.reserveListed = {}
      s.screen = 'reserveList'
      // 🔒 "mesmo time": mesma tela de contratos, mas SEM leilão depois — o relógio
      // (que só faz sentido esperando todo mundo listar pro pregão) fica de fora.
      s.reserveListMesmo = !!action.mesmo
      s.phaseDeadline = action.mesmo ? null : Date.now() + RESERVE_LIST_MS
      return s
    }
    case 'CONFIRM_MESMO_TIME': {
      // 🔒 fecha a janela de contratos votada como "mesmo time" (sem leilão pra
      // soltar jogador pra dentro): quem marcou "Deixar ir" sai de graça (sem venda,
      // já que não tem comprador) — se quebrar o XI, um Cria da Base assume. Quem
      // não decidiu renova automático (5 anos, metade), igual sempre foi na janela
      // do leilão. Antes esta votação pulava a janela INTEIRA — dava pra manter
      // jogador de contrato vencido de graça pra sempre só votando "mesmo time"
      // (relato de jogador). Agora SEMPRE passa pela decisão, com ou sem leilão.
      if (!s.careerOnline || s.screen !== 'reserveList' || !s.reserveListMesmo) return s
      if (s.contratosOn) {
        const ctrRng = mulberry((s.seed ^ ((s.seasonNo ?? 1) * 65537) ^ 0x5EED) >>> 0)
        const released = new Set(s.contratoRelease ?? [])
        for (const m of s.managers) {
          if (!m.isHuman) continue // dormindo (2º clube) também é isHuman — decide junto, igual na janela do leilão
          const expirados = (m.squad as WonCard[]).filter(c => !c.fake && !c.cria && c.contratoAte != null && c.contratoAte < s.seasonNo)
          const removidosPorPos: Record<string, number> = {}
          for (const c of expirados) {
            const querSoltar = released.has(c.id) && !c.emprestado
            if (querSoltar) {
              const need = FORMATIONS[m.formation][c.pos]
              const filledPos = m.squad.filter(x => x.pos === c.pos && !x.emprestado && !x.fake).length
              const quebraXI = filledPos - (removidosPorPos[c.pos] ?? 0) - 1 < need
              m.squad = m.squad.filter(x => x.id !== c.id)
              ;(s.marketLog = s.marketLog ?? []).push(`😢 ${m.teamName}: ${c.name} foi liberado — mesmo time, sem leilão pra vender`)
              if (quebraXI) spawnCria(s, m, c.pos, c.name, ctrRng)
              else removidosPorPos[c.pos] = (removidosPorPos[c.pos] ?? 0) + 1
            } else {
              const custo = Math.max(1, Math.ceil(valorOficial(s, c) / 2))
              s.careerCoins = { ...(s.careerCoins ?? {}), [m.id]: (s.careerCoins?.[m.id] ?? 0) - custo }
              c.contratoAte = s.seasonNo + contratoDur(5, ctrRng) - 1
              ;(s.marketLog = s.marketLog ?? []).push(`📝 ${m.teamName}: ${c.name} renovou AUTOMÁTICO por ${custo} 🪙 (5 anos) — ninguém decidiu na janela`)
              logFin(s, 'buy', `📝 Renovação automática: ${c.name}`, -custo, { player: c.name, pos: c.pos }, m.id)
            }
          }
        }
        s.contratoRelease = undefined
        // rivais (CPU): sem leilão pra repor, então sempre renovam (paga do clubCash do time)
        const cashR = { ...(s.clubCash ?? {}) }
        for (const m of s.managers) {
          if (m.isHuman || !m.rival) continue
          const expirados = (m.squad as WonCard[]).filter(c => !c.fake && !c.emprestado && c.contratoAte != null && c.contratoAte < s.seasonNo)
          for (const c of expirados) {
            const custo = Math.max(1, Math.ceil(valorOficial(s, c) / 2))
            cashR['m' + m.id] = Math.max(0, (cashR['m' + m.id] ?? 0) - custo)
            ;(c as WonCard).contratoAte = s.seasonNo + contratoDur(5, ctrRng) - 1
          }
        }
        s.clubCash = cashR
      }
      s.reserveListMesmo = undefined
      s.reserveListed = {}
      s.phaseDeadline = null
      s.screen = 'season'
      return s
    }
    case 'TOGGLE_RESERVE_LIST': {
      // lista/tira uma carta da lista de leilão. NUNCA deixa a posição abaixo do XI
      // (formação) — se listar deixaria incompleto, ignora. E a VENDA/negociação
      // só está desbloqueada a partir da 3ª temporada (na 2ª só dá pra comprar).
      if (!s.careerOnline || s.seasonNo < 3) return s
      const mgr = s.managers.find(m => m.id === action.mgrId)
      if (!mgr) return s
      const listed = { ...(s.reserveListed ?? {}) }
      const arr = [...(listed[action.mgrId] ?? [])]
      const i = arr.indexOf(action.cardId)
      if (i >= 0) arr.splice(i, 1)
      else {
        const card = mgr.squad.find(c => c.id === action.cardId)
        if (!card) return s
        if ((card as WonCard).cria) return s // 🌱 cria é invendável — ninguém paga nada por ele
        // 🏢 emprestado NÃO pode ir pra lista/venda: ou é um jogador da SAF (não é seu
        // pra vender), ou é seu que está na SAF. Traga de volta primeiro (botão na SAF).
        if (card.emprestado) return s
        // 🔒 contrato JÁ vencido: só sai pela janela de "Deixar ir" (RELEASE_CONTRACT),
        // nunca pelo mercado comum — trava do lado autoritativo (espelha canList na tela),
        // senão dava pra vender e "fugir" da decisão de contrato como reserva qualquer.
        if (s.contratosOn && card.contratoAte != null && card.contratoAte < s.seasonNo) return s
        const pos = card.pos
        const listedInPos = arr.filter(id => mgr.squad.find(c => c.id === id)?.pos === pos).length
        // 🏢 conta SÓ os jogadores SEUS (não emprestados): o emprestado volta na virada,
        // então não pode servir de "muleta" pra você vender abaixo do que a formação
        // precisa — senão, quando ele volta, você ficaria sem montar a formação.
        const filledPos = mgr.squad.filter(c => c.pos === pos && !c.emprestado).length
        if (filledPos - listedInPos - 1 < FORMATIONS[mgr.formation][pos]) return s // deixaria a posição incompleta
        arr.push(action.cardId)
      }
      listed[action.mgrId] = arr
      s.reserveListed = listed
      return s
    }
    case 'RELEASE_CONTRACT': {
      // 🌱 marca "deixar ir": o jogador de contrato VENCIDO sai no leilão mesmo
      // que quebre o XI — nesse caso um Cria da Base assume a vaga (de graça).
      // Toggle: clicar de novo desmarca. Só na janela de venda.
      if (!s.careerOnline || !s.contratosOn || s.screen !== 'reserveList') return s
      const mgr = s.managers.find(m => m.id === action.mgrId)
      if (!mgr?.isHuman) return s
      const card = mgr.squad.find(c => c.id === action.cardId) as WonCard | undefined
      if (!card || card.fake || card.emprestado || card.cria) return s
      if (card.contratoAte == null || card.contratoAte >= s.seasonNo) return s // só contrato JÁ vencido
      const cur = s.contratoRelease ?? []
      s.contratoRelease = cur.includes(action.cardId) ? cur.filter(id => id !== action.cardId) : [...cur, action.cardId]
      return s
    }
    case 'RENEW_CONTRACT': {
      // 📝 renova um contrato ENCERRADO na janela de venda (tela reserveList).
      // 10 anos = valor oficial cheio · 5 anos = metade. Precisa ter a grana
      // (sem fiado aqui — sem grana, o caminho é deixar ir pro leilão).
      if (!s.careerOnline || !s.contratosOn || s.screen !== 'reserveList') return s
      const mgr = s.managers.find(m => m.id === action.mgrId)
      if (!mgr?.isHuman) return s
      const card = mgr.squad.find(c => c.id === action.cardId) as WonCard | undefined
      if (!card || card.fake || card.emprestado) return s
      if (card.contratoAte == null || card.contratoAte >= s.seasonNo) return s // só contrato JÁ encerrado
      const oficial = valorOficial(s, card)
      // 💰 10 anos = 90% (decisão do Diego 03/08): desconto de fidelidade — por
      // temporada sai 9% vs 10% dos 5 anos, mas o desembolso à vista é maior.
      // 🐛 05/08 (relato do Diego): Math.ceil no desconto de 10% ARREDONDAVA PRA
      // CIMA — pra vários valores (ex.: piso 8) o "desconto" virava o preço CHEIO
      // (ceil(8×0.9)=ceil(7.2)=8, igual sem desconto nenhum!). Math.floor garante
      // desconto de verdade sempre (piso 8 → 7, nunca mais o preço cheio).
      // 💳 SEM trava de saldo (Diego 03/08): renovar por ESCOLHA pode negativar —
      // a dívida é do jogo (transfer ban no vermelho cuida da consequência).
      const custo = action.anos === 10 ? Math.max(1, Math.floor(oficial * 0.9)) : Math.max(1, Math.ceil(oficial / 2))
      const saldo = s.careerCoins?.[mgr.id] ?? 0
      s.careerCoins = { ...(s.careerCoins ?? {}), [mgr.id]: saldo - custo }
      card.contratoAte = s.seasonNo + contratoDur(action.anos, rngOf(s)) - 1
      logFin(s, 'buy', `📝 Renovação: ${card.name} (${action.anos} anos)`, -custo, { player: card.name, pos: card.pos }, mgr.id)
      return s
    }
    case 'RESERVE_AUCTION_ONLINE': {
      s.simV = 4 // fórmula nova (v3: gol realista + menos goleada) só a partir desta temporada
      // fecha a VENDA e abre a COMPRA (leilão de reservas). MANTÉM os elencos,
      // consome a lista (tira os listados dos times e joga no baralho — o dono
      // pode dar lance de volta), marca "elenco fundo" (mira 22) e o orçamento é a
      // CAIXA. No fim (FINISH_CEREMONY), a caixa vira o que sobrou e tira o fundo.
      if (!s.careerOnline) return s
      setActiveCatalog(s.deckLeague)
      healCpuSquads(s) // 🔒 conserta save antigo: se uma ficha de fundo ficou com um jogador que
      // um técnico já tem, tira daqui ANTES do Mercado — senão o Mercado soltava a cópia no leilão
      s.marketLog = [] // zera o resumo dos bots pra este leilão
      s.criaNews = [] // 🌱 historinhas de cria: só as DESTA virada aparecem na cerimônia
      // 0) limpa as marcas do leilão anterior. marketSellers[pos] = ids dos bots que
      // perderam jogador NAQUELA posição — são eles que podem dar lance nela.
      for (const m of s.managers) if (!m.isHuman) { m.backstop = false; m.deepSquad = false }
      const marketSellers = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] } as Record<Sector, number[]>
      // MAPEAMENTO: você + amigos online OU você + rivais escolhidos (offline) = os
      // "humanos" que sempre disputam. Os OUTROS times (não-escolhidos) = os bots do
      // mercado, que perdem jogador real pro leilão e recompram pela regra 0/1.
      const isMktBot = (m: Manager) => !m.isHuman && !m.rival
      const nMain = s.managers.filter(m => m.isHuman || m.rival).length
      // #4 — CPU RIVAIS listam sozinhos (a partir da 3ª temporada, quando a venda
      // abre), pra levantar grana e reforçar. NÃO são idênticos: cada um sorteia
      // quantos quer listar nesta temporada (uns 0, uns 1, uns 2-3), sempre as
      // reservas mais FRACAS que sobram (mais que o XI). Determinístico por seed.
      if (s.seasonNo >= 3) {
        const rate = (c: WonCard) => (c.lo + c.hi) / 2
        const rl = { ...(s.reserveListed ?? {}) }
        // 🔒 BLINDAGEM (bug 28/07: atacantes de HUMANO vendidos sozinhos na carreira
        // offline): a listagem automática é SÓ de CPU — humano NUNCA entra aqui,
        // mesmo que a marcação rival escorregue pro assento dele.
        for (const m of s.managers.filter(x => x.rival && !x.isHuman)) {
          const rrng = mulberry((s.seed ^ (s.seasonNo * 7919) ^ (m.id * 104729)) >>> 0)
          const choices = [0, 0, 1, 1, 1, 2, 2, 3] // uns não listam, a maioria 1, alguns 2-3
          const nList = choices[Math.floor(rrng() * choices.length)]
          if (nList === 0) continue
          const spares: WonCard[] = []
          for (const pos of SECTORS) {
            const real = m.squad.filter(c => c.pos === pos && !c.fake).sort((a, b) => rate(a) - rate(b))
            spares.push(...real.slice(0, Math.max(0, real.length - FORMATIONS[m.formation][pos]))) // as que passam do XI (mais fracas)
          }
          spares.sort((a, b) => rate(a) - rate(b))
          const toList = spares.slice(0, Math.min(nList, spares.length))
          if (toList.length) rl[m.id] = [...(rl[m.id] ?? []), ...toList.map(c => c.id)]
        }
        s.reserveListed = rl
      }
      // 1) consome a lista: tira os listados dos elencos
      const listedMap = s.reserveListed ?? {}
      const listedCards: Card[] = []
      for (const m of s.managers) {
        const ids = new Set(listedMap[m.id] ?? [])
        if (ids.size === 0) continue
        const keep: WonCard[] = [], out: WonCard[] = []
        for (const c of m.squad) (ids.has(c.id) ? out : keep).push(c)
        m.squad = keep
        // 📝 se a carta listada JÁ está com contrato encerrado, leva o selo mesmo
        // assim (senão listar manualmente o vencido furava o teto da venda)
        for (const c of out) listedCards.push({ ...c, seller: m.id, ...(c.contratoAte != null && c.contratoAte < s.seasonNo ? { semContrato: true } : {}) })
      }
      // 1b) 📝 CONTRATOS ENCERRADOS que NÃO foram renovados na janela de venda:
      // • HUMANO: o jogador vai pro leilão com selo SEM CONTRATO (venda com teto no
      //   valor oficial — o excedente "fica com a família"). TRAVA DE SEGURANÇA: se a
      //   saída deixasse a formação incompleta (ou o cara está emprestado na SAF),
      //   renova "no aperto" por 5 anos pagando metade — pode ficar no vermelho
      //   (dívida já existe no jogo), com aviso claro no resumo do mercado.
      // • RIVAL: decide como técnico de verdade — renova quem é bom SE tiver caixa
      //   (craque 85% · bom 60% · resto 35%), pagando do clubCash (sobra menos pro
      //   leilão). Dos que soltou, o MELHOR de cada posição entra no leilão com selo;
      //   o resto volta pro mundo em silêncio (pode reaparecer nas sobras).
      // (SÓ carreira nascida com contratos — save antigo nem passa por aqui.)
      if (s.contratosOn) {
        const ctrRng = mulberry((s.seed ^ ((s.seasonNo ?? 1) * 65537) ^ 0x5EED) >>> 0)
        const released = new Set(s.contratoRelease ?? [])
        // 🏛️ MULTICLUBES (Diego 04/08): o clube DORMINDO decide JUNTO na janela —
        // os vencidos dele aparecem no banner (seção 💤) com os mesmos botões.
        // Daqui pra baixo ele segue o fluxo normal de humano: quem você soltou
        // vai pro leilão (😤 magoado — nenhum clube seu recompra), quem ficou
        // sem decisão renova automático 5 anos pela metade, pagando da caixa DELE.
        for (const m of s.managers) {
          if (!m.isHuman) continue
          const expirados = (m.squad as WonCard[]).filter(c => !c.fake && !c.cria && c.contratoAte != null && c.contratoAte < s.seasonNo)
          const removidosPorPos: Record<string, number> = {}
          for (const c of expirados) {
            // 🌱 o técnico ESCOLHEU deixar ir (botão na janela): sai mesmo quebrando
            // o XI — um Cria da Base assume a vaga (de graça, sem contrato). Só o
            // emprestado na SAF não tem como soltar (a carta nem está aqui).
            const querSoltar = released.has(c.id) && !c.emprestado
            if (querSoltar) {
              const need = FORMATIONS[m.formation][c.pos]
              const filledPos = m.squad.filter(x => x.pos === c.pos && !x.emprestado && !x.fake).length
              const quebraXI = filledPos - (removidosPorPos[c.pos] ?? 0) - 1 < need
              m.squad = m.squad.filter(x => x.id !== c.id)
              listedCards.push({ ...c, seller: m.id, semContrato: true })
              if (quebraXI) spawnCria(s, m, c.pos, c.name, ctrRng) // cria tapa o buraco → posição segue preenchida
              else removidosPorPos[c.pos] = (removidosPorPos[c.pos] ?? 0) + 1
            } else {
              // ⏳ NÃO DECIDIU na janela (regra do Diego 03/08): renova AUTOMÁTICO
              // por 5 anos pela metade, tenha caixa ou não (pode negativar — valor
              // REAL no extrato, caixa nunca fura). Perder jogador, só por escolha.
              const custo = Math.max(1, Math.ceil(valorOficial(s, c) / 2))
              s.careerCoins = { ...(s.careerCoins ?? {}), [m.id]: (s.careerCoins?.[m.id] ?? 0) - custo }
              c.contratoAte = s.seasonNo + contratoDur(5, ctrRng) - 1
              ;(s.marketLog = s.marketLog ?? []).push(`📝 ${m.teamName}: ${c.name} renovou AUTOMÁTICO por ${custo} 🪙 (5 anos) — ninguém decidiu na janela`)
              if (m.isHuman) logFin(s, 'buy', `📝 Renovação automática: ${c.name}`, -custo, { player: c.name, pos: c.pos }, m.id)
            }
          }
        }
        s.contratoRelease = undefined // janela consumida
        // rivais (CPU escolhidos): renovam com o caixa do clube; melhor solto por posição vai pro leilão
        const cashR = { ...(s.clubCash ?? {}) }
        const soltos: WonCard[] = []
        for (const m of s.managers) {
          if (m.isHuman || !m.rival) continue
          const expirados = (m.squad as WonCard[]).filter(c => !c.fake && !c.emprestado && c.contratoAte != null && c.contratoAte < s.seasonNo)
          for (const c of expirados) {
            const oficial = valorOficial(s, c)
            const custo = Math.max(1, Math.ceil(oficial / 2))
            const quer = c.fame >= 4 ? 0.85 : c.fame >= 2 ? 0.6 : 0.35
            const need = FORMATIONS[m.formation][c.pos]
            const filledPos = m.squad.filter(x => x.pos === c.pos && !x.fake).length
            const podeSoltar = filledPos - 1 >= need
            if (!podeSoltar || (ctrRng() < quer && (cashR['m' + m.id] ?? 0) >= custo)) {
              cashR['m' + m.id] = Math.max(0, (cashR['m' + m.id] ?? 0) - custo)
              ;(c as WonCard).contratoAte = s.seasonNo + contratoDur(5, ctrRng) - 1
            } else {
              m.squad = m.squad.filter(x => x.id !== c.id)
              soltos.push({ ...c, seller: m.id, semContrato: true })
            }
          }
        }
        s.clubCash = cashR
        for (const pos of SECTORS) {
          const best = soltos.filter(c => c.pos === pos).sort((a, b) => valorOficial(s, b) - valorOficial(s, a))[0]
          if (best) {
            listedCards.push(best)
            ;(s.marketLog = s.marketLog ?? []).push(`⏳ ${s.managers.find(m => m.id === best.seller)?.teamName ?? 'Rival'} NÃO renovou ${best.name} — tá no mercado sem contrato! 🍿`)
          }
        }
        // os soltos que não couberam voltam pro mundo em silêncio (sobras futuras)
      }
      // 2) baralho ANTES de marcar elenco fundo — assim a demanda usa a formação
      // NORMAL (não dobrada) e a quantidade por posição fica IGUAL ao leilão online
      // comum (2 usuários disputam 3 goleiros, etc.).
      const rng = mulberry((s.seed ^ (s.seasonNo * 811073)) >>> 0)
      const used = new Set<string>()
      for (const m of s.managers) for (const c of m.squad) used.add(ident(c))
      // os LISTADOS também: eles voltam pro baralho com vendedor — sem isto o
      // catálogo fresco podia sortear uma CÓPIA idêntica (dois Roberto Carlos!)
      for (const c of listedCards) used.add(ident(c))
      // 🔒 E TODO jogador REAL que já existe no mundo (elencos da sala + fichas dos 60
      // times de fundo): assim o baralho NUNCA inventa uma cópia nova de quem já está
      // em campo. Vale pra reserva (T2) e mercado (T3+). Não mexe em quem já está
      // repetido num save antigo — só impede CRIAR nova duplicata daqui pra frente.
      for (const id of ownedRealIdents(s)) used.add(id)
      if (s.seasonNo >= 3) {
        // MERCADO DOS 80 (3ª temporada+): UM FAMOSO (fame ≥ 4) por posição, sorteado
        // entre TODOS os times — os bots da sua liga E os 60 de fundo (via ficha
        // cpuSquads). O dono fica com buraco e vai à luta: se for time de fundo, ele é
        // materializado como PARTICIPANTE TEMPORÁRIO (marketCpu) que briga no leilão da
        // posição e no monte, com preferência no próprio (igual amigo/rival). No fim,
        // FINISH_CEREMONY atualiza a ficha dele (completa em 11 com filler se não
        // repôs) e o remove. Determinístico por seed.
        const bt = nextBuildTok()
        const deck = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] } as Record<Sector, Card[]>
        const cpuSq = s.cpuSquads ?? {}
        // todo jogador de fundo já tem dono: exclui do catálogo fresco (evita duplicata)
        for (const name in cpuSq) for (const c of cpuSq[name]) used.add(ident(c))
        const tempById = new Map<string, Manager>()
        let tmpId = -1000
        const materialize = (name: string): Manager => {
          let m = tempById.get(name)
          if (!m) {
            const div = (s.careerPlacements?.[name] as 'A' | 'B' | 'C' | 'D') ?? 'C'
            // 4-3-3: é a formação em que as fichas de fundo são montadas (1/2/2/3/3),
            // então o "completar em 11" bate exato — nada de sobrar jogador.
            m = { id: tmpId--, name, teamName: name, isHuman: false, auctionRival: false, marketCpu: true, marketTeam: name, deepSquad: true,
              formation: '4-3-3', money: s.clubCash?.[name] ?? DIV_BASE_CASH[div] ?? 100,
              squad: (cpuSq[name] ?? []).map(c => ({ ...c, paid: (c as WonCard).paid ?? 0, via: (c as WonCard).via ?? 'bot' })) as WonCard[],
              aggression: 0.25 + rng() * 0.6, starHunger: rng() }
            tempById.set(name, m)
          }
          return m
        }
        // 🪜 escada: o "famoso" que o mercado lista respeita a régua da SUA divisão
        // (na D lista bom jogador, não craque). Fora da escada segue fame ≥ 4.
        const escM = escadaDivOf(s)
        const famosoOk = (c: Card) => escM ? escadaAllows(escM, c) && (c.fame ?? 1) >= 2 : c.fame >= 4
        for (const pos of SECTORS) {
          // junta TODOS os famosos da posição (bots da liga + 60 de fundo) e pega UM ao acaso
          const cands: { card: Card; ownerBot?: Manager; ownerName?: string }[] = []
          for (const bot of s.managers.filter(isMktBot)) for (const c of bot.squad) if (c.pos === pos && !c.fake && famosoOk(c)) cands.push({ card: c, ownerBot: bot })
          // 🏢 jogador de EMPRÉSTIMO na SAF nunca entra no sorteio — não é dela, é do dono
          for (const name in cpuSq) for (const c of cpuSq[name]) if (c.pos === pos && !c.fake && famosoOk(c) && !(c as WonCard).emprestado) cands.push({ card: c, ownerName: name })
          if (cands.length) {
            const pick = cands[Math.floor(rng() * cands.length)]
            const owner = pick.ownerBot ?? materialize(pick.ownerName!)
            owner.squad = owner.squad.filter(c => c.id !== pick.card.id) // tira do dono → buraco
            const fl = s.marketValues?.[pick.card.name] ?? (pick.card as WonCard).paid ?? 0 // piso do jogador (economia igual pra todos)
            deck[pos].push({ ...pick.card, seller: owner.id, ...(fl > 0 ? { paid: fl } : {}) })
            marketSellers[pos].push(owner.id)
            if (pick.ownerBot) pick.ownerBot.backstop = true // bot da liga: caixa via clubCash; fica em 11 (só repõe o que perdeu)
          } else {
            const fam = shuffle(ACTIVE_CATALOG[pos].filter(c => !used.has(ident(c)) && famosoOk(c as Card)), rng)[0]
              ?? shuffle(ACTIVE_CATALOG[pos].filter(c => !used.has(ident(c)) && (!escM || escadaAllows(escM, c))), rng)[0]
            if (fam) { used.add(ident(fam)); const fl = s.marketValues?.[fam.name] ?? 0; deck[pos].push({ ...fam, id: `mkt-${pos}-${bt}`, pos, ...(fl > 0 ? { paid: fl } : {}) } as Card) }
          }
        }
        // os times de fundo sorteados entram na sala pra brigar (leilão + monte)
        for (const m of tempById.values()) s.managers.push(m)
        s.deck = deck
      } else {
        // RESERVAS (2ª temporada): baralho SÓ COM REAIS (noFake) — reserva é opcional,
        // então nada de incógnito enchendo o leilão. Os bots do mercado (não-escolhidos)
        // também soltam suas reservas REAIS pro baralho, e são eles que disputam (0/1).
        s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, used, 1, s.marketValues, true, false, escadaDivOf(s))
        const nBots = Math.max(1, Math.floor(nMain / 2))
        const chosen = shuffle(s.managers.filter(isMktBot), rng).slice(0, nBots)
        for (const bot of chosen) {
          bot.backstop = true // bot fica em 11 (sem elenco fundo) — só repõe o que perder
          // solta as reservas REAIS do bot (o que passa do XI) pro baralho
          for (const pos of SECTORS) {
            const realInPos = bot.squad.filter(c => c.pos === pos && !c.fake)
            const spare = realInPos.slice(FORMATIONS[bot.formation][pos])
            for (const c of spare) { bot.squad = bot.squad.filter(x => x.id !== c.id); s.deck[pos].push({ ...c, seller: bot.id }) }
          }
        }
        for (const pos of SECTORS) marketSellers[pos] = chosen.map(b => b.id)
      }
      s.marketSellers = marketSellers
      for (const c of listedCards) s.deck[c.pos].push(c)
      // SOBRAS DO BARALHO: jogadores reais que não couberam em time nenhum (posição
      // com mais reais que vagas — hoje o ataque sobra ~31) entram no leilão, UMA
      // carta por posição por temporada, até acabarem. Assim nenhum craque de fora
      // fica esquecido — vale pra QUALQUER posição que estiver sobrando.
      {
        const bt2 = nextBuildTok()
        const placed = new Set<string>()
        for (const m of s.managers) for (const c of m.squad) placed.add(ident(c))
        for (const name in (s.cpuSquads ?? {})) for (const c of s.cpuSquads![name]) placed.add(ident(c))
        for (const pos of SECTORS) for (const c of s.deck[pos]) placed.add(ident(c))
        // 🪜 escada: a sobra do mundo também respeita a régua da SUA divisão
        const escL = escadaDivOf(s)
        for (const pos of SECTORS) {
          const spare = shuffle(ACTIVE_CATALOG[pos].filter(c => !placed.has(ident(c)) && (!escL || escadaAllows(escL, c))), rng)[0]
          if (spare) { const fl = s.marketValues?.[spare.name] ?? 0; s.deck[pos].push({ ...spare, id: `left-${pos}-${bt2}`, pos, ...(fl > 0 ? { paid: fl } : {}) } as Card) }
        }
      }
      // 🛟 GARANTIA "SEMPRE PELO MENOS 1 POR POSIÇÃO": se depois de TUDO (mercado /
      // reservas dos bots + listados + sobras) alguma posição ficou SEM NENHUMA carta
      // (ex.: na 2ª temporada, todos os laterais do catálogo já têm dono), um BOT
      // solta um jogador daquela posição pro leilão — pra nunca aparecer "laterais
      // sem lateral". O bot vira vendedor/backstop e pode dar lance de volta (e nas
      // outras posições). Rivais NÃO são obrigados (listar é opcional deles); a
      // garantia sai sempre de um BOT do mercado.
      {
        const rate = (c: WonCard) => (c.lo + c.hi) / 2
        const placedG = new Set<string>()
        for (const m of s.managers) for (const c of m.squad) placedG.add(ident(c))
        for (const name in (s.cpuSquads ?? {})) for (const c of s.cpuSquads![name]) placedG.add(ident(c))
        for (const pos of SECTORS) {
          if (s.deck[pos].length > 0) continue
          let done = false
          for (const bot of shuffle(s.managers.filter(m => !m.isHuman && !m.rival), rng)) {
            const spare = (bot.squad as WonCard[]).filter(c => c.pos === pos && !c.fake).sort((a, b) => rate(a) - rate(b))[0]
            if (!spare) continue
            bot.squad = bot.squad.filter(c => c.id !== spare.id)
            bot.backstop = true // agora repõe o que soltou E pode brigar em todas as posições
            const fl = s.marketValues?.[spare.name] ?? spare.paid ?? 0
            s.deck[pos].push({ ...spare, seller: bot.id, ...(fl > 0 ? { paid: fl } : {}) })
            if (!marketSellers[pos].includes(bot.id)) marketSellers[pos].push(bot.id)
            done = true; break
          }
          // último recurso (raríssimo: nenhum bot tem a posição) — pega do catálogo
          if (!done) {
            const any = shuffle(ACTIVE_CATALOG[pos].filter(c => !placedG.has(ident(c))), rng)[0]
            if (any) { placedG.add(ident(any)); s.deck[pos].push({ ...any, id: `grt-${pos}-${nextBuildTok()}`, pos } as Card) }
          }
        }
      }
      // 3) elenco fundo (mira 22) + orçamento. DEPOIS do baralho, senão a demanda
      // dobraria. Humano gasta do careerCoins; bot sorteado gasta do clubCash dele.
      const cash = s.clubCash ?? {}
      for (const m of s.managers) {
        // 🏛️ MULTICLUBES: o clube DORMINDO NÃO entra no leilão de reservas — segue
        // "mesmo time" congelado. Sem isto ele virava deepSquad (mirava 22) e entrava
        // no leilão junto do clube ativo, fazendo o pregão pular entre os dois times e
        // travar (o dormindo nunca lacra). Agora só o clube ATIVO enche o banco.
        // 🪜 escada: o leilão de reservas FUNCIONA desde a 2ª temporada, igual à
        // carreira normal (todo mundo mira 22). O que muda na escada é a RÉGUA:
        // o baralho só traz as categorias da SUA divisão. (A trava antiga de
        // "banco só depois do acesso" deixava a sala inteira 11/11 sem poder dar
        // lance — o leilão virava um desfile de "não vendido" em levas de 12,
        // parecendo um loop infinito. Regra do Diego: compra desde a 2ª, venda
        // libera na 3ª.)
        if (m.isHuman && !m.dormindo) { m.deepSquad = true; m.money = s.careerCoins?.[m.id] ?? 0 }
        else if (m.rival) { m.deepSquad = true; m.money = cash['m' + m.id] ?? 100 } // rival = "humano": enche banco, gasta clubCash
        else if (m.backstop) { m.deepSquad = true; m.money = cash['m' + m.id] ?? 100 } // LIBERADO: além de repor, pode pegar reserva (mira 22 como todo mundo)
      }
      s.surpriseId = pickSurprise(s.deck, rng)
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.roundIdx = 0; s.monte = []; s.news = []
      s.careerTactics = {}; s.submitted = []; s.pendingEnvelopes = {}; s.tiebreaks = []; s.tiebreakIdx = 0; s.tiebreakPending = {}
      s.reserveListed = {}
      s.reserveAuction = true
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    case 'RESUME_DINASTIA': { s.dinastiaPaused = false; return s }
    case 'NEW_SEASON':
      // full re-draft direto (usado no modo solo/CPU, onde não há espera).
      return redraftSeason(s)
    case 'CAREER_ADVANCE': {
      // fim de temporada na carreira: sobe/cai/fica e começa a próxima, já na
      // divisão de destino com o novo elenco de rivais (quem subiu/caiu junto
      // continua; quem se separou sai e entra time da divisão nova).
      if (!s.careerDivision) return s
      setActiveCatalog(s.deckLeague) // mantém o baralho da carreira (reload zera o ponteiro do módulo)
      const res = resolveCareerEnd(s)
      if (res.wonTitle) s.careerTitles++
      if (res.wonTitle && s.careerDivision === 'A') s.careerTitlesA++ // estrela ⭐
      const you = s.managers[s.youIdx]
      const teamName = you.teamName, formation = you.formation, mySquad = you.squad
      // guarda os elencos dos CPUs por identidade de time (pros rivais que ficam)
      const oldSquads = new Map<string, WonCard[]>()
      for (const m of s.managers) if (!m.isHuman && m.squad.length > 0) oldSquads.set(m.teamName, m.squad)
      s.careerRivals = res.rivals // pirâmide dos rivais avançada (vida própria)
      s.careerDivision = res.nextDiv
      s.seed = Math.floor(Math.random() * 1e9)
      const rng = mulberry(s.seed)
      const { managers, botPlans } = makeCareerManagers(teamName, formation, res.nextDiv, coDivRivalDefs(s.careerRivals, res.nextDiv), action.keep ? [] : otherDivRivalDefs(s.careerRivals, res.nextDiv), rng)
      s.managers = managers
      s.youIdx = 0
      s.monte = []; s.monteOrder = []; s.monteIdx = 0; s.tactics = {}
      s.sectorUnsoldAccum = []; s.currentCards = []
      s.round = 0; s.scorers = []; s.lastResults = []; s.news = []; s.champion = null
      if (action.keep) {
        // MESMO TIME: você mantém o elenco; rivais que vieram junto mantêm o
        // deles; rivais novos + preenchimento ganham elenco (sem leilão).
        managers[0].squad = mySquad
        const used = new Set<string>(mySquad.map(c => ident(c)))
        for (const m of managers) {
          if (m.isHuman) continue
          const kept = oldSquads.get(m.teamName)
          if (kept && kept.length > 0) { m.squad = kept; kept.forEach(c => used.add(ident(c))) }
        }
        dealRemainingCpuSquads(s.managers, rng, used)
        const adj = fillerAdj(s.managers, DIVISION_BASE[res.nextDiv]); s.cpuAtkAdj = adj.atk; s.cpuDefAdj = adj.def
        s.deck = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
        s.sectorIdx = 0; s.sectorCursor = 0
        s.league = buildLeague(s.managers, !s.ligaFechada)
        s.fixtures = buildFixtures(s.league, mulberry((s.seed ^ 0xCA1E0) >>> 0))
        s.seasonNo++
        s.screen = 'season'
        return s
      }
      // TROCAR TUDO: novo leilão na divisão de destino
      const used = new Set<string>()
      s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, used, 1)
      s.surpriseId = pickSurprise(s.deck, rng)
      dealBotSquads(s.managers, botPlans, rng, used)
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.cpuAtkAdj = 0; s.cpuDefAdj = 0
      s.sectorIdx = 0; s.sectorCursor = 0; s.roundIdx = 0
      s.submitted = []; s.pendingEnvelopes = {}
      s.tiebreaks = []; s.tiebreakIdx = 0; s.tiebreakPending = {}
      s.seasonNo++
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    case 'RESTORE_CAREER': {
      // retoma uma carreira salva, na divisão/temporada/rivais guardados.
      // keep (padrão): vai direto pro campeonato com o elenco salvo (pula o
      // leilão). redraft ("trocar tudo"): abre um novo leilão nesta divisão.
      const sv = action.save
      s.onlineMode = 'cpu'; s.isHost = true; s.humanCount = 1
      s.roomId = ''; s.roomCode = ''; s.streamMode = false; s.manualRoom = false
      s.deckLeague = sv.deckLeague ?? 'br'; setActiveCatalog(s.deckLeague) // baralho da carreira salva
      s.careerDivision = sv.division; s.careerIntent = false; s.careerTitles = sv.titles; s.careerTitlesA = sv.titlesA ?? 0
      s.seasonNo = sv.seasonNo
      s.careerRivalCount = sv.rivalCount ?? 5
      // rivais salvos (saves antigos: recria na própria divisão como fallback)
      s.careerRivals = (sv.rivals && sv.rivals.length > 0)
        ? sv.rivals
        : DIVISION_TEAMS[sv.division === 'V' ? 'D' : sv.division].slice(0, s.careerRivalCount).map(t => ({ team: t.team, name: t.name, division: sv.division, h2h: [0, 0, 0] as [number, number, number], lastPos: null }))
      s.seed = Math.floor(Math.random() * 1e9)
      const rng = mulberry(s.seed)
      s.careerRivals = s.careerRivals.map(r => ({ ...r, team: newestTeamName(r.team) }))
      const { managers, botPlans } = makeCareerManagers(sv.teamName, sv.formation, sv.division, coDivRivalDefs(s.careerRivals, sv.division), action.redraft ? otherDivRivalDefs(s.careerRivals, sv.division) : [], rng)
      s.managers = managers
      s.youIdx = 0
      s.monte = []; s.monteOrder = []; s.monteIdx = 0; s.tactics = {}
      s.sectorUnsoldAccum = []; s.currentCards = []
      s.round = 0; s.scorers = []; s.lastResults = []; s.news = []; s.champion = null
      if (action.redraft) {
        const used = new Set<string>()
        s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, used, 1)
        s.surpriseId = pickSurprise(s.deck, rng)
        dealBotSquads(s.managers, botPlans, rng, used)
        for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
        s.cpuAtkAdj = 0; s.cpuDefAdj = 0
        s.sectorIdx = 0; s.sectorCursor = 0; s.roundIdx = 0
        s.submitted = []; s.pendingEnvelopes = {}
        s.tiebreaks = []; s.tiebreakIdx = 0; s.tiebreakPending = {}
        s.screen = 'auction'
        startAuctionPhase(s, false)
        return s
      }
      // MESMO TIME: carrega o elenco salvo e vai direto pro campeonato
      managers[0].squad = sv.squad
      managers[0].formation = sv.formation
      const used = new Set<string>(sv.squad.map(c => ident(c)))
      dealRemainingCpuSquads(s.managers, rng, used)
      const adj = fillerAdj(s.managers, DIVISION_BASE[sv.division]); s.cpuAtkAdj = adj.atk; s.cpuDefAdj = adj.def
      s.deck = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
      s.sectorIdx = 0; s.sectorCursor = 0
      s.league = buildLeague(s.managers, !s.ligaFechada)
      s.fixtures = buildFixtures(s.league, mulberry((s.seed ^ 0xCA1E0) >>> 0))
      s.screen = 'season'
      return s
    }
    case 'START_DINASTIA_SEASON': {
      // modo Dinastia (2ª temporada em diante): joga a TEMPORADA REAL (campinho,
      // narração, tabela, artilheiros) contra os times do mundo fixo — sem leilão.
      // Os elencos vêm prontos do mundo; a economia já rolou na janela.
      s.onlineMode = 'cpu'; s.isHost = true; s.humanCount = 1
      s.roomId = ''; s.roomCode = ''; s.streamMode = false; s.manualRoom = false
      s.dinastia = true
      s.dinastiaPaused = false; s.dinastiaMidUsed = false // janela do meio zerada pra esta temporada
      s.careerDivision = action.division
      s.seasonNo = action.seasonNo
      s.seed = Math.floor(Math.random() * 1e9)
      const human: Manager = { id: 0, name: action.teamName, teamName: action.teamName, isHuman: true, auctionRival: true, formation: action.formation, money: 0, squad: action.squad, aggression: 0.5, starHunger: 0.5 }
      const forms: FormationKey[] = ['4-3-3', '4-4-2']
      const others: Manager[] = action.others.map((o, i) => ({ id: i + 1, name: o.name, teamName: o.name, isHuman: false, auctionRival: false, formation: forms[i % 2], money: 0, squad: o.squad.map(c => ({ ...c, paid: 0, via: 'bot' as const })), aggression: 0.5, starHunger: 0.5 }))
      s.managers = [human, ...others]
      s.youIdx = 0
      s.cpuAtkAdj = 0; s.cpuDefAdj = 0 // o mundo fixo já é a dificuldade (pirâmide de força)
      s.deck = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
      s.monte = []; s.monteOrder = []; s.monteIdx = 0
      s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.currentCards = []
      s.round = 0; s.scorers = []; s.lastResults = []; s.news = []; s.champion = null
      s.tactics = {} // tática o humano escolhe DURANTE a partida (campinho), como nos outros modos
      // rivais do Dinastia → aparecem com 🔥 na tabela e no painel embaixo do campinho (igual carreira)
      s.careerRivals = (action.rivals ?? []).map(r => ({ team: r.team, name: r.name, division: r.division, h2h: [0, 0, 0] as [number, number, number], lastPos: null }))
      s.careerTitles = 0; s.careerTitlesA = 0
      s.league = buildLeague(s.managers, !s.ligaFechada)
      s.fixtures = buildFixtures(s.league, mulberry((s.seed ^ 0xCA1E0) >>> 0))
      s.screen = 'season'
      return s
    }
    case 'REPLAY_SEASON': {
      // "Nova temporada" (mesmo time): mantém TODOS os elencos como estão e
      // só recomeça o campeonato — tabela, calendário e artilharia zerados.
      // Nada de leilão. Disparado pelo host; o resultado já computado vai
      // pros convidados por SYNC_STATE.
      { const adj = cpuAdjFor(s); s.cpuAtkAdj = adj.atk; s.cpuDefAdj = adj.def } // nível-base fixo por divisão; rivais sem ajuste
      // 🎲 SEMENTE NOVA: sem isto, "Nova temporada (mesmo time)" repetia a MESMA
      // semente → a liga inteira dava EXATAMENTE o mesmo resultado toda vez (dava
      // pra prever/farmar título). Cada recomeço agora é uma temporada diferente.
      // (host dispara e sincroniza por SYNC_STATE, então online também fica ok.)
      s.seed = Math.floor(Math.random() * 1e9)
      s.league = buildLeague(s.managers, !s.ligaFechada)
      s.fixtures = buildFixtures(s.league, mulberry((s.seed ^ 0xCA1E0) >>> 0))
      s.round = 0
      s.scorers = []
      s.lastResults = []
      s.news = []
      s.champion = null
      s.tactics = {}
      s.quickCopa = null // 🏆 Copa dos 8 é POR TEMPORADA — senão a próxima liga nunca semeia de novo
  s.streamChampCard = null // 🎥 stream: carta do campeão é por temporada — não herda a anterior
      s.seasonNo++
      s.restartPending = false
      s.restartReady = []
      s.seasonVotes = {} // zera a votação de fim de jogo
      s.screen = 'season'
      return s
    }
    case 'REQUEST_NEW_TEAMS': {
      // host abre o "check de prontidão": todo mundo online precisa confirmar
      // antes de refazer o leilão. O host já entra confirmado.
      s.restartPending = true
      s.restartReady = s.isHost ? [s.youIdx] : []
      return maybeStartRedraft(s)
    }
    case 'CONFIRM_RESTART': {
      if (!s.restartPending) return s
      if (!s.restartReady.includes(action.mgrId)) s.restartReady = [...s.restartReady, action.mgrId]
      return maybeStartRedraft(s)
    }
    case 'CANCEL_RESTART': {
      s.restartPending = false
      s.restartReady = []
      return s
    }
    case 'REMATCH': {
      // "Jogar de novo" (online, host): volta todo mundo pra sala de espera
      // (o game_rooms.status já foi virado pra 'waiting' antes deste dispatch
      // — ver botão em EscEnd). De lá, o host chama "Abrir o Pregão" de novo,
      // que já monta uma partida 100% nova (START_ONLINE).
      s.screen = 'lobby'
      return s
    }
    default:
      return s
  }
}

// ─── reações efêmeras (zoeira/blefe) — NÃO fazem parte do estado do jogo ──
// vão por um evento de broadcast à parte ('emote'); não passam pelo reducer
// nem pelo host, então não têm risco nenhum de afetar o resultado do leilão.
export type EmoteEvent = { id: string; from: number; kind: string; cardId?: string; ts: number; text?: string }
// 💬 mensagem de chat da sala — efêmera (broadcast, fora do reducer, igual aos emotes).
// Não passa pelo host nem afeta o jogo. Cada cliente conta as suas "não lidas".
export type ChatMsg = { id: string; from: number; name: string; text: string; ts: number }

// ─── contexto + provider (host-autoritativo, espelha o modo Draft) ───
const Ctx = createContext<{
  state: EscState
  dispatch: (a: Action) => void
  emote: (kind: string, cardId?: string, text?: string) => void
  emotes: EmoteEvent[]
  chat: ChatMsg[]              // 💬 mensagens da sala (efêmeras)
  chatUnread: number           // 💬 quantas ESTE usuário ainda não viu
  sendChat: (text: string) => void
  chatOpen: boolean            // 💬 gaveta aberta?
  setChatOpen: (open: boolean) => void
  hostStale: boolean // convidado sem notícias do host há muito tempo (host caiu?)
  kickPlayer: (playerIndex: number) => void // host remove um técnico da partida
  leaveRoom: () => void // "sair da sala" de vez: se for host, passa o host pra outro (ou apaga a sala se estava sozinho) e sai
  becameHost: boolean // acabei de virar host (o anterior saiu) — mostra o aviso grande
} | null>(null)

// libera a vaga do técnico na sala (apaga a linha de room_players) e limpa a
// sala salva no aparelho. Chamado quando ele sai de propósito de uma partida
// online — evita virar "fantasma" que trava um restart pros que ficaram.
async function leaveOnlineRoom(roomId: string, keepSlot = false) {
  try { localStorage.removeItem('escalacao-room') } catch { /* ignora */ }
  // carreira online (save): a vaga é a MEMBRESIA do save — não some ao sair, pra
  // o técnico continuar podendo voltar depois. Só o "excluir" tira de vez.
  if (keepSlot) return
  try {
    const { data } = await supabase.auth.getUser()
    if (data?.user && roomId) {
      await supabase.from('room_players').delete().eq('room_id', roomId).eq('user_id', data.user.id)
    }
  } catch { /* silencioso */ }
}

// ─── retomar partida SOLO em andamento (carreira/rápida) ─────────────
// o estado do jogo vive só na memória; se a aba recarrega (ou o navegador
// descarta a página em segundo plano), voltava pro zero (home) e perdia a
// temporada. Salvamos a partida solo em andamento no aparelho e retomamos de
// onde parou. (O online tem seu próprio resume via sala — aqui é só cpu.)
// ─── 🔒 LACRE (carimbo) contra edição do save na mão ────────────────────────
// A carreira SOLO roda no navegador, então dá pra editar o localStorage (moedas,
// títulos, etc.). O lacre é um "código secreto" gravado junto do save, feito dos
// campos-chave + um segredo que só o jogo conhece. Ao SALVAR, carimba; ao ABRIR,
// refaz o carimbo e compara: se não bate, o save foi MEXIDO na mão (a pessoa
// trocou o número mas não soube refazer o carimbo). NUNCA trava o jogo — só
// registra uma marca no painel do criador (esc_cheat_flags) pra o Diego OLHAR e
// decidir. Grandfather: save sem lacre (antigo) NÃO é acusado. Pega o casual
// (99%); quem lê o bundle e refaz o carimbo passa — limitação assumida.
const LACRE_SEGREDO = 'll7a0·v1·9f2kx'
function lacreDe(s: EscState): string {
  const youId = s.managers?.[s.youIdx]?.id ?? s.youIdx ?? 0
  const coins = Math.round(s.careerCoins?.[youId] ?? 0)
  const hon = s.careerHonors?.['m' + youId]
  const titles = hon ? (hon.A + hon.B + hon.C + hon.D) : (s.careerTitles ?? 0)
  const div = s.careerPlacements?.['m' + youId] ?? s.careerDivision ?? ''
  const base = `${LACRE_SEGREDO}|${coins}|${titles}|${div}|${s.seasonNo ?? 1}`
  let h = 0
  for (let i = 0; i < base.length; i++) h = (Math.imul(31, h) + base.charCodeAt(i)) >>> 0
  return h.toString(36)
}
// serializa o estado JÁ carimbado (sem alterar o state em memória)
function comLacre(s: EscState): string { return JSON.stringify({ ...s, _ll: lacreDe(s) }) }
// true = MEXIDO na mão. Sem _ll (save antigo) ou não-carreira = não acusa.
function saveMexido(save: unknown): boolean {
  if (!save || typeof save !== 'object') return false
  const s = save as EscState & { _ll?: string }
  if (typeof s._ll !== 'string') return false // save antigo — perdoado
  if (!s.careerDivision && !s.careerOnline) return false // não é carreira solo
  return lacreDe(s) !== s._ll
}
// registra a marca no painel do criador (só quando o save do PRÓPRIO usuário
// aparece mexido). Fire-and-forget: nunca trava nem atrapalha o jogo.
function marcaMexido(save: EscState) {
  try {
    void supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) return
      const youId = save.managers?.[save.youIdx]?.id ?? 0
      const coins = Math.round(save.careerCoins?.[youId] ?? 0)
      const hon = save.careerHonors?.['m' + youId]
      const titles = hon ? (hon.A + hon.B + hon.C + hon.D) : (save.careerTitles ?? 0)
      supabase.from('esc_cheat_flags').upsert({
        user_id: data.user.id,
        display_name: save.managers?.[save.youIdx]?.teamName ?? null,
        detail: `caixa ${coins} · ${titles} tít. · T${save.seasonNo ?? 1}`,
        last_at: new Date().toISOString(),
      }, { onConflict: 'user_id' }).then(() => {}, () => {})
    }, () => {})
  } catch { /* silencioso — nunca atrapalha o jogo */ }
}

const SOLO_RESUME_KEY = 'esc-solo-inprogress-v1'
const SOLO_GAME_SCREENS = ['auction', 'monte', 'cerimonia', 'season', 'end'] as const
function isSoloGameScreen(screen: string): boolean {
  return (SOLO_GAME_SCREENS as readonly string[]).includes(screen)
}
// 🏛️ MULTICLUBES: qual assento está NO COMANDO num save de carreira. Sem 2º clube
// (ou save comum) = 0. Com multiclube, `multiClube.id` é SEMPRE o clube que DORME
// → o ativo é o humano cujo id é DIFERENTE dele. É o sinal mais confiável (mais
// que a flag `dormindo`, que poderia dessincronizar). Assim o reload nunca mostra
// os dois clubes com o mesmo nome nem cria "humano fantasma" no leilão solo.
function activeSeatIdx(s: EscState): number {
  if (!s?.multiClube || !Array.isArray(s.managers)) return 0
  const i = s.managers.findIndex(m => m.isHuman && m.id !== s.multiClube!.id)
  return i >= 0 ? i : 0
}
// 🏛️ MULTICLUBES: deixa os assentos COERENTES num save de carreira. `multiClube.id`
// é SEMPRE o clube que DORME → crava exatamente 1 humano ATIVO (o outro) e o
// dormindo certo, e reancora o youIdx. Sem isto, um save antigo/torto podia ter os
// DOIS clubes como humanos ativos — aí o SOLO caía na VOTAÇÃO online (sem sentido
// numa carreira offline) e o clube que dorme corria risco de entrar no leilão.
// Repara o que já foi gravado torto. No-op sem 2º clube.
function normalizeMultiSeats(s: EscState): EscState {
  // 🎁 pacote ÓRFÃO: sem 2º clube não existe "carta guardada de quem dormia" —
  // limpa sobras de fantasmas curados antes deste fix (cartinha "do nada")
  if (s && !s.multiClube && s.multiClubePendingCards && Object.keys(s.multiClubePendingCards).length > 0) s.multiClubePendingCards = undefined
  if (!s?.multiClube || !Array.isArray(s.managers)) return s
  const dormId = s.multiClube.id
  // 🏛️ FANTASMA (bug 04/08, print do Murriz): save contaminado por multiClube de
  // OUTRA carreira (o START não limpava). Se o "2º clube" não existe de verdade
  // entre os managers — ou só existe UM humano — o stash é lixo: PURGA e o save
  // volta a ser carreira de clube único. Save legítimo (2 humanos, dormant real)
  // passa direto.
  const humanos = s.managers.filter(m => m.isHuman)
  const dormReal = humanos.some(m => m.id === dormId)
  if (!dormReal || humanos.length < 2) {
    s.multiClube = undefined
    // 🎁 os "pacotes guardados" fabricados pelo fantasma também morrem — eram eles
    // que faziam a cartinha aparecer "do nada" sem título (relato 04/08)
    s.multiClubePendingCards = undefined
    for (const m of s.managers) if (m.isHuman) m.dormindo = false
    s.youIdx = Math.max(0, s.managers.findIndex(m => m.isHuman))
    return s
  }
  for (const m of s.managers) if (m.isHuman) m.dormindo = (m.id === dormId)
  s.youIdx = activeSeatIdx(s)
  return s
}
function loadSoloInProgress(): EscState | null {
  try {
    const raw = localStorage.getItem(SOLO_RESUME_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as EscState
    if (s && s.onlineMode === 'cpu' && isSoloGameScreen(s.screen) && Array.isArray(s.managers) && s.managers.length > 0) {
      if (saveMexido(s)) marcaMexido(s) // 🔒 lacre não bateu = editado na mão → marca no painel (não trava)
      normalizeMultiSeats(s) // 🏛️ multiclube: 1 humano ativo + dormindo certo (reancora youIdx; no-op sem 2º clube)
      return s
    }
  } catch { /* estado inválido/versão antiga — começa do zero */ }
  return null
}

// ─── carreira pirâmide OFFLINE na NUVEM (segue a conta em qualquer aparelho) ──
// ─── 🪜 VÁRIOS SAVES DE CARREIRA (slots) ────────────────────────────────
// A carreira ATIVA vive em `esc-solo-career` (hot path INTOCADO — autosave e
// "continuar" seguem iguais). As OUTRAS ficam num ARQUIVO à parte
// (`esc-career-archive`), pra começar uma nova NUNCA apagar as anteriores. Como o
// hot path não muda, quem está jogando não corre risco nenhum. Cada carreira é
// única pela `seed`. Limite de slots pra não encher o armazenamento.
export type CareerSlot = { save: EscState; at: number }
const CAREER_ARCHIVE_KEY = 'esc-career-archive'
export const MAX_CAREER_SLOTS = 6
const isCareerSave = (s: unknown): s is EscState => !!s && typeof s === 'object' && !!(s as EscState).careerOnline && Array.isArray((s as EscState).managers) && (s as EscState).managers.length > 0
export function readCareerArchive(): CareerSlot[] {
  try { const r = localStorage.getItem(CAREER_ARCHIVE_KEY); if (r) { const arr = JSON.parse(r); if (Array.isArray(arr)) return arr.filter((x: CareerSlot) => isCareerSave(x?.save)) } } catch { /* ignora */ }
  return []
}
function writeCareerArchive(slots: CareerSlot[]) {
  try { localStorage.setItem(CAREER_ARCHIVE_KEY, JSON.stringify(slots.slice(0, MAX_CAREER_SLOTS))) } catch { /* cota cheia — ignora */ }
}
// 🔐 DONO do armazenamento LOCAL de carreiras. Na NUVEM cada carreira já é por
// CONTA (user_id). Mas os saves LOCAIS do aparelho (esc-solo-career + arquivo)
// eram COMPARTILHADOS — se outra conta logava no MESMO celular, as carreiras se
// misturavam (a conta A subia pra nuvem da conta B). Agora o aparelho pertence a
// UMA conta por vez: ao TROCAR de conta, guardo as carreiras da conta anterior num
// COFRE local (não perde NADA) e começo limpo pra conta que entrou (que puxa os
// saves DELA da nuvem). Quando a conta volta, restauro o cofre dela. O que manda é
// o LOGIN, nunca o aparelho.
const CAREER_OWNER_KEY = 'esc-career-owner'
const CAREER_VAULT_PREFIX = 'esc-career-vault::'
const LOCAL_CAREER_KEYS = ['esc-solo-career', 'esc-solo-career-at', CAREER_ARCHIVE_KEY, SOLO_RESUME_KEY]
type CareerVault = Record<string, string | null>
function stashLocalCareers(): CareerVault {
  const v: CareerVault = {}
  for (const k of LOCAL_CAREER_KEYS) { try { v[k] = localStorage.getItem(k) } catch { v[k] = null } }
  return v
}
function clearLocalCareers() { for (const k of LOCAL_CAREER_KEYS) { try { localStorage.removeItem(k) } catch { /* ignora */ } } }
function restoreLocalCareers(v: CareerVault) {
  for (const k of LOCAL_CAREER_KEYS) { try { const val = v[k]; if (val == null) localStorage.removeItem(k); else localStorage.setItem(k, val) } catch { /* ignora */ } }
}
// carimba o aparelho com a conta atual. Mesma conta = no-op (caminho quente, roda
// a cada autosave). 1ª vez (saves antigos, sem dono) = a conta atual assume o que
// já está no aparelho (não mexe em quem já jogava). Conta DIFERENTE = guarda a
// anterior no cofre, limpa o compartilhado e restaura o cofre da conta que entrou.
function ensureCareerOwner(uid: string) {
  let owner: string | null = null
  try { owner = localStorage.getItem(CAREER_OWNER_KEY) } catch { /* ignora */ }
  if (owner === uid) return
  if (owner == null) { try { localStorage.setItem(CAREER_OWNER_KEY, uid) } catch { /* ignora */ } return }
  try { localStorage.setItem(CAREER_VAULT_PREFIX + owner, JSON.stringify(stashLocalCareers())) } catch { /* ignora */ }
  clearLocalCareers()
  try { const raw = localStorage.getItem(CAREER_VAULT_PREFIX + uid); if (raw) restoreLocalCareers(JSON.parse(raw) as CareerVault) } catch { /* ignora */ }
  try { localStorage.setItem(CAREER_OWNER_KEY, uid) } catch { /* ignora */ }
}
export function readActiveCareer(): CareerSlot | null {
  try { const r = localStorage.getItem('esc-solo-career'); if (r) { const save = JSON.parse(r); if (isCareerSave(save)) { if (saveMexido(save)) marcaMexido(save); return { save, at: +(localStorage.getItem('esc-solo-career-at') || Date.now()) } } } } catch { /* ignora */ }
  return null
}
// guarda a carreira ATIVA no arquivo (dedup por seed). Não apaga a ativa.
function archiveActiveCareer() {
  const act = readActiveCareer(); if (!act) return
  const rest = readCareerArchive().filter(s => s.save.seed !== act.save.seed)
  writeCareerArchive([{ save: act.save, at: act.at }, ...rest])
}
// TODAS as carreiras pra listar (ativa primeiro, depois o arquivo), por recência.
export function listAllCareers(): { slot: CareerSlot; active: boolean }[] {
  const act = readActiveCareer()
  const arch = readCareerArchive().filter(s => !act || s.save.seed !== act.save.seed)
  const out: { slot: CareerSlot; active: boolean }[] = []
  if (act) out.push({ slot: act, active: true })
  for (const s of arch) out.push({ slot: s, active: false })
  return out.sort((a, b) => b.slot.at - a.slot.at)
}
// vai começar uma carreira NOVA: arquiva a atual (não perde) antes do START zerar.
export function stashActiveBeforeNew() { archiveActiveCareer() }
// troca a carreira ATIVA por uma do arquivo (a atual vai pro arquivo). Devolve o save.
export function activateCareerSlot(seed: number): EscState | null {
  archiveActiveCareer()
  const slots = readCareerArchive()
  const idx = slots.findIndex(s => s.save.seed === seed)
  if (idx < 0) return null
  const chosen = slots[idx]
  writeCareerArchive(slots.filter((_, i) => i !== idx))
  try { localStorage.setItem('esc-solo-career', JSON.stringify(chosen.save)); localStorage.setItem('esc-solo-career-at', String(Date.now())) } catch { /* ignora */ }
  savePyramidCloud(chosen.save, true) // a nuvem segue a ativa
  return chosen.save
}
// apaga uma carreira (do arquivo OU a ativa). Não mexe nas outras. Se apagar a
// ATIVA, promove a mais recente do arquivo pra ativa (pra o "Continuar" não sumir
// da home enquanto ainda houver carreiras).
export function deleteCareerSlot(seed: number) {
  const act = readActiveCareer()
  if (act && act.save.seed === seed) {
    const arch = readCareerArchive()
    if (arch.length) {
      const next = [...arch].sort((a, b) => b.at - a.at)[0]
      writeCareerArchive(arch.filter(s => s.save.seed !== next.save.seed))
      try { localStorage.setItem('esc-solo-career', JSON.stringify(next.save)); localStorage.setItem('esc-solo-career-at', String(next.at)) } catch { /* ignora */ }
    } else {
      try { localStorage.removeItem('esc-solo-career'); localStorage.removeItem('esc-solo-career-at') } catch { /* ignora */ }
    }
    removeCareerFromCloud(seed) // tira SÓ essa carreira da nuvem, com precisão
    return
  }
  writeCareerArchive(readCareerArchive().filter(s => s.save.seed !== seed))
  removeCareerFromCloud(seed) // tira SÓ essa carreira da nuvem, com precisão
}

// além do save local (esc-solo-career), quem está logado espelha o save inteiro
// na tabela esc_pyramid_saves. Ao continuar, pega o MAIS RECENTE (local x nuvem).
let lastPyrCloud = 0
// ── junção segura de carreiras (nunca perde nem volta no tempo) ──────────────
// extrai as carreiras de um valor cru da nuvem (formato novo multi OU o antigo,
// que era um EscState cru = carreira única).
function careersFromCloudRaw(raw: unknown, fallbackAt: number): CareerSlot[] {
  if (!raw || typeof raw !== 'object') return []
  const multi = raw as { __multi?: number; careers?: CareerSlot[] }
  if (multi.__multi && Array.isArray(multi.careers)) return multi.careers.filter(c => isCareerSave(c?.save))
  if (isCareerSave(raw)) return [{ save: raw as EscState, at: fallbackAt }]
  return []
}
// quão avançada está a carreira (nº de temporadas). Progresso SÓ anda pra frente
// — não dá pra "desjogar" — então a de temporada MAIOR é a de verdade mais nova.
function careerProgress(s: CareerSlot): number { return (s?.save as EscState)?.seasonNo ?? 0 }
// junta várias listas de carreiras por seed, mantendo pra cada uma a MAIS
// AVANÇADA (temporada maior; empate = a jogada por último). Nunca joga fora uma
// carreira nem troca por uma mais atrasada. É o coração da blindagem do save.
function mergeCareers(...lists: CareerSlot[][]): CareerSlot[] {
  const bySeed = new Map<number, CareerSlot>()
  for (const list of lists) for (const s of list) {
    if (!isCareerSave(s?.save)) continue
    const seed = (s.save as EscState).seed
    const cur = bySeed.get(seed)
    const better = !cur || careerProgress(s) > careerProgress(cur)
      || (careerProgress(s) === careerProgress(cur) && (s.at ?? 0) >= (cur.at ?? 0))
    if (better) bySeed.set(seed, s)
  }
  return [...bySeed.values()].sort((a, b) => (b.at ?? 0) - (a.at ?? 0)).slice(0, MAX_CAREER_SLOTS)
}

// grava na nuvem TODAS as carreiras da conta, JUNTANDO com o que já está lá —
// nunca sobrescreve o cheio com o vazio, nunca volta no tempo. Assim, mesmo que
// o aparelho tenha limpado os dados, o backup da nuvem fica intacto. Formato:
// { __multi:1, careers:[{save,at}, ...] }. Rows antigas (EscState cru) são lidas
// como carreira única (compatível).
export async function savePyramidCloud(state: EscState, force = false) {
  try {
    // throttle: no máx. 1 escrita/60s — o save LOCAL é o guarda-vidas instantâneo;
    // a nuvem é backup pra trocar de aparelho. A 6s, cada jogador de carreira
    // BAIXAVA+SUBIA o save inteiro (MBs) toda hora — era o nº 1 de egress/CPU do
    // Supabase (medido 03/08: upsert de 1s de banco, 651× em horas). Momentos-
    // chave (sair pro lobby, trocar carreira) seguem com force=true, na hora.
    if (!force && Date.now() - lastPyrCloud < 60000) return
    const { data } = await supabase.auth.getUser()
    if (!data?.user) return
    ensureCareerOwner(data.user.id) // 🔐 este aparelho é DESTA conta — nunca sobe/mistura carreira de outra
    lastPyrCloud = Date.now()
    let payload: unknown = state
    if (isCareerSave(state)) {
      // lê o que JÁ tem na nuvem e JUNTA (a nuvem nunca é jogada fora nem rebaixada):
      const { data: cur } = await supabase.from('esc_pyramid_saves').select('save, updated_at').eq('user_id', data.user.id).maybeSingle()
      const cloudAt = cur?.updated_at ? new Date(cur.updated_at as string).getTime() : Date.now()
      // 🔒 carimba a ativa com o lacre antes de subir (as do arquivo já vêm carimbadas).
      const active: CareerSlot = { save: { ...state, _ll: lacreDe(state) } as EscState, at: Date.now() }
      payload = { __multi: 1, careers: mergeCareers([active], careersFromCloudRaw(cur?.save, cloudAt), readCareerArchive()) }
    }
    const nowIso = new Date().toISOString()
    await supabase.from('esc_pyramid_saves').upsert({ user_id: data.user.id, save: payload, updated_at: nowIso })
  } catch { /* best effort — o local sempre garante */ }
}
type CloudCareers = { save: EscState; at: number; careers: CareerSlot[]; iso: string | null }
export async function loadPyramidCloud(): Promise<CloudCareers | null> {
  try {
    const { data } = await supabase.auth.getUser()
    if (!data?.user) return null
    const { data: row } = await supabase.from('esc_pyramid_saves').select('save, updated_at').eq('user_id', data.user.id).maybeSingle()
    const raw = row?.save as unknown
    const at0 = row?.updated_at ? new Date(row.updated_at as string).getTime() : Date.now()
    if (!raw || typeof raw !== 'object') return null
    // formato NOVO (várias carreiras)
    const multi = raw as { __multi?: number; careers?: CareerSlot[] }
    if (multi.__multi && Array.isArray(multi.careers)) {
      const careers = multi.careers.filter(c => isCareerSave(c?.save))
      if (!careers.length) return null
      const active = [...careers].sort((a, b) => b.at - a.at)[0]
      if (saveMexido(active.save)) marcaMexido(active.save) // 🔒 confere o lacre da nuvem também
      return { save: active.save, at: active.at, careers, iso: (row?.updated_at as string | undefined) ?? null }
    }
    // formato ANTIGO (EscState cru) — carreira única
    if (isCareerSave(raw)) return { save: raw as EscState, at: at0, careers: [{ save: raw as EscState, at: at0 }], iso: (row?.updated_at as string | undefined) ?? null }
  } catch { /* ignora */ }
  return null
}
// une nuvem ↔ local por seed, mantendo pra cada uma a MAIS AVANÇADA (temporada
// maior; nunca volta no tempo, nunca perde nenhuma) e reescreve os dois lados com
// o conjunto unido. A ativa passa a ser a mais recente. Roda na HOME (nunca no jogo).
export async function syncCareersWithCloud(): Promise<boolean> {
  try {
    const { data: u } = await supabase.auth.getUser()
    if (!u?.user) return false
    ensureCareerOwner(u.user.id) // 🔐 rebaseia o aparelho pra ESTA conta ANTES de juntar local↔nuvem
    const cloud = await loadPyramidCloud()
    if (!cloud) return false
    const localCareers = listAllCareers().map(({ slot }) => slot)
    const all = mergeCareers(localCareers, cloud.careers)
    if (!all.length) return false
    const [active, ...rest] = all
    try {
      localStorage.setItem('esc-solo-career', JSON.stringify(active.save))
      localStorage.setItem('esc-solo-career-at', String(active.at ?? Date.now()))
      writeCareerArchive(rest)
    } catch { /* ignora */ }
    savePyramidCloud(active.save, true) // reescreve a nuvem com o conjunto unido
    return true
  } catch { return false }
}
export async function deletePyramidCloud() {
  try { const { data } = await supabase.auth.getUser(); if (data?.user) await supabase.from('esc_pyramid_saves').delete().eq('user_id', data.user.id) } catch { /* ignora */ }
}
// remove UMA carreira da nuvem pelo seed (apagar carreira). Não depende de
// espelhar o local — tira só ela, mantendo as outras. Se ficar vazio, apaga a linha.
export async function removeCareerFromCloud(seed: number) {
  try {
    const { data } = await supabase.auth.getUser()
    if (!data?.user) return
    const { data: cur } = await supabase.from('esc_pyramid_saves').select('save, updated_at').eq('user_id', data.user.id).maybeSingle()
    const cloudAt = cur?.updated_at ? new Date(cur.updated_at as string).getTime() : Date.now()
    const kept = careersFromCloudRaw(cur?.save, cloudAt).filter(c => (c.save as EscState).seed !== seed)
    if (!kept.length) await supabase.from('esc_pyramid_saves').delete().eq('user_id', data.user.id)
    else await supabase.from('esc_pyramid_saves').upsert({ user_id: data.user.id, save: { __multi: 1, careers: kept }, updated_at: new Date().toISOString() })
  } catch { /* ignora */ }
}

export function EscProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, INITIAL, init => loadSoloInProgress() ?? init)
  // salva a partida solo em andamento (e limpa quando volta pra home)
  useEffect(() => {
    try {
      if (state.onlineMode === 'cpu' && isSoloGameScreen(state.screen)) localStorage.setItem(SOLO_RESUME_KEY, comLacre(state))
      else if (state.screen === 'intro') localStorage.removeItem(SOLO_RESUME_KEY)
    } catch { /* quota cheia etc. — não trava o jogo */ }
  }, [state])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const isHostRef = useRef(state.isHost)
  const onlineRef = useRef(state.onlineMode)
  const stateRef = useRef(state)
  useEffect(() => { isHostRef.current = state.isHost }, [state.isHost])
  useEffect(() => { onlineRef.current = state.onlineMode }, [state.onlineMode])
  useEffect(() => { stateRef.current = state }, [state])

  // "host caiu?": convidado marca quando recebeu a última atualização do host.
  // Sem heartbeat por ~10s, mostra aviso (o host reemite estado a cada 3s).
  const lastHostMsgRef = useRef(Date.now())
  const [hostStale, setHostStale] = useState(false)

  // reações efêmeras: lista viva que some sozinha (~2,6s cada). Fora do reducer.
  const [emotes, setEmotes] = useState<EmoteEvent[]>([])
  const addEmote = useCallback((e: EmoteEvent) => {
    setEmotes(prev => prev.some(x => x.id === e.id) ? prev : [...prev.slice(-24), e])
    setTimeout(() => setEmotes(prev => prev.filter(x => x.id !== e.id)), 2600)
  }, [])
  const emote = useCallback((kind: string, cardId?: string, text?: string) => {
    const e: EmoteEvent = { id: Math.random().toString(36).slice(2), from: stateRef.current.youIdx, kind, cardId, text, ts: Date.now() }
    addEmote(e) // mostra o seu na hora (o canal usa self:false e não devolve o próprio)
    channelRef.current?.send({ type: 'broadcast', event: 'emote', payload: e })
  }, [addEmote])

  // 💬 CHAT: mesma via dos emotes (broadcast, fora do reducer). Cada cliente
  // guarda as mensagens localmente e conta as SUAS não-lidas (some ao abrir).
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [chatUnread, setChatUnread] = useState(0)
  const [chatOpen, setChatOpenRaw] = useState(false)
  const chatOpenRef = useRef(false)
  const addChat = useCallback((m: ChatMsg, mine: boolean) => {
    setChat(prev => prev.some(x => x.id === m.id) ? prev : [...prev.slice(-60), m])
    if (!mine && !chatOpenRef.current) setChatUnread(u => Math.min(99, u + 1)) // não vi ainda → +1 (só as dos outros)
  }, [])
  const sendChat = useCallback((text: string) => {
    const t = text.trim().slice(0, 160)
    if (!t) return
    const me = stateRef.current.managers[stateRef.current.youIdx]
    const m: ChatMsg = { id: Math.random().toString(36).slice(2), from: stateRef.current.youIdx, name: (me?.teamName || me?.name || 'Você'), text: t, ts: Date.now() }
    addChat(m, true) // aparece pra mim na hora (canal usa self:false)
    channelRef.current?.send({ type: 'broadcast', event: 'chat', payload: m })
  }, [addChat])
  const setChatOpen = useCallback((open: boolean) => {
    chatOpenRef.current = open; setChatOpenRaw(open)
    if (open) setChatUnread(0) // abriu → zera as minhas não-lidas
  }, [])
  // 💾 HISTÓRICO DO CHAT SOBREVIVE a recarregar a página / trocar de app: o
  // broadcast é só AO VIVO — sem guardar, quando o celular descarta a aba (você
  // vai no zap e volta) o jogo volta pelo banco mas o chat vinha VAZIO. Agora
  // guardamos as mensagens por sala NESTE aparelho e recarregamos ao voltar.
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.roomId) return
    try {
      const raw = localStorage.getItem(`esc-chat-${state.roomId}`)
      if (raw) { const arr = JSON.parse(raw) as ChatMsg[]; if (Array.isArray(arr) && arr.length) setChat(prev => prev.length ? prev : arr) }
    } catch { /* ignora */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.roomId, state.onlineMode])
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.roomId || chat.length === 0) return // não sobrescreve o salvo com o vazio inicial
    try { localStorage.setItem(`esc-chat-${state.roomId}`, JSON.stringify(chat.slice(-60))) } catch { /* ignora */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat, state.roomId, state.onlineMode])

  // host remove um técnico da partida: avisa o cliente dele (evento 'kick', que
  // o ejeta pra fora), a CPU assume o time (KICK_PLAYER) e libera a vaga no
  // banco pra ele não reconectar sozinho na mesma partida.
  // ⚠️ `playerIndex` aqui é o CRACHÁ (id) do técnico — a UI chama kickPlayer(m.id).
  // O reducer, o room_players.player_index (= id inicial do humano) e o handler do
  // cliente abaixo TÊM que usar o mesmo id. Comparar com youIdx (a cadeira) só
  // coincidia em sala pequena/temporada 1; na carreira/sala grande expulsava/avisava
  // a pessoa ERRADA. Agora compara com o MEU próprio id.
  const kickPlayer = useCallback((mgrId: number) => {
    const meId = stateRef.current.managers[stateRef.current.youIdx]?.id
    if (!isHostRef.current || mgrId === meId) return
    channelRef.current?.send({ type: 'broadcast', event: 'kick', payload: { playerIndex: mgrId } })
    rawDispatch({ type: 'KICK_PLAYER', playerIndex: mgrId })
    const rid = stateRef.current.roomId
    if (rid) { supabase.from('room_players').delete().eq('room_id', rid).eq('player_index', mgrId).then(() => {}) }
  }, [])

  // "acabei de virar host": aviso grande e passageiro (o anterior saiu da sala)
  const [becameHost, setBecameHost] = useState(false)
  // "fui expulso pelo host": banner vermelho na tela (troca o alert() antigo, que o
  // celular às vezes engolia e a pessoa continuava vendo a partida). A saída da sala
  // já aconteceu (KICKED_OUT resetou pro menu) — o banner só explica o porquê.
  const [kickedOut, setKickedOut] = useState(false)

  // "sair da sala" DE VEZ. Se eu for o host de uma partida rápida:
  //  · com gente ainda na sala → sorteia um dos presentes pra virar host novo
  //    (avisa por broadcast 'host_change' e passa a posse no banco), e eu saio;
  //  · sozinho → apago a sala (game_rooms + room_players) e volto pro menu.
  // Convidado (ou carreira online) só libera a própria vaga via GO_LOBBY.
  const leaveRoom = useCallback(async () => {
    const st = stateRef.current
    const rid = st.roomId
    if (onlineRef.current === 'online' && isHostRef.current && rid && !st.careerOnline) {
      const others = (st.presence || []).filter(i => i !== st.youIdx)
      if (others.length > 0) {
        const newHostIndex = others[Math.floor(Math.random() * others.length)]
        // avisa TODO MUNDO agora, com o canal ainda vivo (antes do GO_LOBBY derrubar)
        channelRef.current?.send({ type: 'broadcast', event: 'host_change', payload: { newHostIndex } })
        // passa a posse no banco (host_id) pra reconexão funcionar — best effort
        try {
          const { data: rows } = await supabase.from('room_players').select('user_id, player_index').eq('room_id', rid)
          const nh = (rows ?? []).find((r: { player_index: number; user_id: string }) => r.player_index === newHostIndex)
          if (nh?.user_id) await supabase.from('game_rooms').update({ host_id: nh.user_id }).eq('id', rid)
        } catch { /* silencioso */ }
      } else {
        // host sozinho: exclui a sala de vez
        try { await supabase.from('room_players').delete().eq('room_id', rid) } catch { /* ignora */ }
        try { await supabase.from('game_rooms').delete().eq('id', rid) } catch { /* ignora */ }
      }
    }
    // convidado saindo NO MEIO do jogo (leilão/monte/temporada): avisa o host pra
    // virar o time dele em RIVAL CPU na hora — ninguém fica esperando ele lacrar. O
    // rival continua dando lance com o time e o dinheiro dele (KICK_PLAYER só tira o
    // isHuman); o host pode excluir esse rival depois no "gerenciar técnicos".
    const inGame = ['auction', 'monte', 'cerimonia', 'season'].includes(st.screen)
    if (onlineRef.current === 'online' && !isHostRef.current && rid && inGame) {
      channelRef.current?.send({ type: 'broadcast', event: 'action', payload: { type: 'KICK_PLAYER', playerIndex: st.youIdx } })
      await new Promise(r => setTimeout(r, 150)) // deixa o aviso sair antes do canal cair
    }
    // trava local: saí de propósito → não deixa o banner "voltar pra sala"
    // reaparecer neste aparelho, mesmo se a passagem de host falhar por rede.
    // (carreira online mantém o banner — a pessoa pode voltar pro save depois.)
    if (onlineRef.current === 'online' && rid && !st.careerOnline) {
      try {
        const K = 'esc-dismissed-rooms'
        const arr = JSON.parse(localStorage.getItem(K) || '[]') as string[]
        if (!arr.includes(rid)) localStorage.setItem(K, JSON.stringify([...arr, rid].slice(-40)))
      } catch { /* ignora */ }
    }
    dispatch({ type: 'GO_LOBBY' }) // libera minha vaga (leaveOnlineRoom) + volta pro menu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // convidado roteia ações pro host; host aplica local
  const dispatch = useCallback((action: Action) => {
    // Sair de uma partida online (NOVO PREGÃO / voltar pra home) deve LIBERAR
    // sua vaga na sala. Sem isso você fica "fantasma": um restart puxa você como
    // jogador e a galera que ficou espera você lacrar pra sempre.
    if ((action.type === 'NEW_GAME' || action.type === 'GO_LOBBY') && onlineRef.current === 'online' && stateRef.current.roomId) {
      leaveOnlineRoom(stateRef.current.roomId, !!stateRef.current.careerOnline)
    }
    if (onlineRef.current === 'online' && !isHostRef.current && action.type !== 'GO_LOBBY' && action.type !== 'NEW_GAME' && action.type !== 'GO_ALBUM' && action.type !== 'GO_RANKING') {
      channelRef.current?.send({ type: 'broadcast', event: 'action', payload: action })
    } else {
      rawDispatch(action)
    }
  }, [])

  // canal realtime quando online
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.roomId) return
    const ch = supabase.channel(`escalacao:${state.roomId}`, { config: { broadcast: { self: false, ack: false } } })

    if (state.isHost) {
      ch.on('broadcast', { event: 'action' }, ({ payload }: { payload: Action }) => rawDispatch(payload))
      ch.on('broadcast', { event: 'request_state' }, () => {
        channelRef.current?.send({ type: 'broadcast', event: 'state', payload: packState(stateRef.current) })
      })
    } else {
      ch.on('broadcast', { event: 'state' }, ({ payload }: { payload: unknown }) => {
        // pacote corrompido/parcial não pode derrubar o canal: ignora essa
        // mensagem (o heartbeat do host reenvia um estado bom em ~3s).
        let next: EscState
        try { next = readState(payload) } catch { return }
        if (!next || typeof next !== 'object') return
        lastHostMsgRef.current = Date.now() // notícia fresca do host
        rawDispatch({ type: 'SYNC_STATE', newState: next })
      })
    }
    // reações chegam pra todos (host e convidados), fora do fluxo de ações
    ch.on('broadcast', { event: 'emote' }, ({ payload }: { payload: EmoteEvent }) => addEmote(payload))
    ch.on('broadcast', { event: 'chat' }, ({ payload }: { payload: ChatMsg }) => addChat(payload, false))
    // host removeu alguém: se for EU, saio da partida DE VEZ e caio no menu online.
    ch.on('broadcast', { event: 'kick' }, ({ payload }: { payload: { playerIndex: number } }) => {
      // payload.playerIndex é o CRACHÁ (id) do expulso — comparo com o MEU id, não com
      // a cadeira (youIdx), senão o banner ia pra pessoa errada e o certo continuava.
      if (payload.playerIndex !== stateRef.current.managers[stateRef.current.youIdx]?.id) return
      // trava esta sala: nunca reaparece o "voltar pra sala" neste aparelho.
      const rid = stateRef.current.roomId
      if (rid) {
        try {
          const K = 'esc-dismissed-rooms'
          const arr = JSON.parse(localStorage.getItem(K) || '[]') as string[]
          if (!arr.includes(rid)) localStorage.setItem(K, JSON.stringify([...arr, rid].slice(-40)))
        } catch { /* ignora */ }
      }
      // PARA de ouvir a host AGORA, antes do alert() bloquear a thread — senão os
      // estados que chegam durante o aviso ficam na fila e, ao dar OK, puxam a
      // pessoa de volta pro jogo (o bug: "dei ok mas continuo vendo a partida").
      try { channelRef.current?.unsubscribe() } catch { /* ignora */ }
      channelRef.current = null
      rawDispatch({ type: 'KICKED_OUT' }) // zera e volta pro menu online, sem reconectar — a pessoa SAI da partida na hora
      setKickedOut(true)                  // e vê o banner vermelho explicando (não fica assistindo)
    })
    // o host saiu da sala e me escolheu como novo host: viro autoritativo e mostro
    // o aviso grande. (chega pra todos; só age quem foi escolhido e ainda não é host)
    ch.on('broadcast', { event: 'host_change' }, ({ payload }: { payload: { newHostIndex: number } }) => {
      if (payload.newHostIndex !== stateRef.current.youIdx || isHostRef.current) return
      rawDispatch({ type: 'BECOME_HOST' })
      // fica na tela até a pessoa dar OK (antes sumia em 6s e dava pra virar host
      // "sem saber" — aí a decisão de host assustava, tipo o voto que vira início).
      setBecameHost(true)
    })
    ch.on('presence', { event: 'sync' }, () => {
      const pState = ch.presenceState()
      const indices = Object.values(pState).flat().map((p: unknown) => (p as { playerIndex: number }).playerIndex)
      rawDispatch({ type: 'SET_PRESENCE', indices })
    })
    ch.subscribe(async () => {
      await ch.track({ playerIndex: state.youIdx })
      if (!state.isHost) channelRef.current?.send({ type: 'broadcast', event: 'request_state', payload: {} })
    })
    channelRef.current = ch
    // 📱 TROCAR DE APP NÃO DERRUBA NINGUÉM (bug 28/07: sala travava quando alguém
    // dava uma volta em outro app e voltava): o celular mata a conexão em 2º plano
    // EM SILÊNCIO. Ao voltar pra tela: se o canal morreu, RECONECTA na hora; host
    // volta "falando" (re-manda o estado pra sala ressincronizar) e convidado
    // volta "ouvindo" (pede o estado). Ninguém sai da sala sem apertar sair.
    const onVis = () => {
      if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
      const alive = (ch as unknown as { state?: string }).state === 'joined'
      const resync = () => {
        if (isHostRef.current) channelRef.current?.send({ type: 'broadcast', event: 'state', payload: packState(stateRef.current) })
        else channelRef.current?.send({ type: 'broadcast', event: 'request_state', payload: {} })
      }
      if (alive) { resync(); return }
      try { ch.subscribe(async () => { await ch.track({ playerIndex: stateRef.current.youIdx }); resync() }) } catch { /* tenta de novo na próxima volta */ }
    }
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis)
    return () => { if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis); ch.unsubscribe(); channelRef.current = null }
  }, [state.roomId, state.onlineMode, state.isHost]) // eslint-disable-line react-hooks/exhaustive-deps

  // host retransmite estado (sanitizado: envelopes pendentes não vazam)
  const prevRef = useRef<EscState | null>(null)
  // 🕒 último instante em que o host mandou o estado (por qualquer via). O heartbeat
  // usa isto pra NÃO reemitir à toa durante o jogo ativo — cada jogada já reenvia o
  // estado inteiro. Isto derruba MUITO o tráfego do Realtime/Egress do Supabase (a
  // conta estourou por causa deste reenvio a cada 3s sem parar).
  const lastStateSendRef = useRef(0)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.isHost || !state.roomId) return
    if (prevRef.current === state) return
    prevRef.current = state
    channelRef.current?.send({ type: 'broadcast', event: 'state', payload: packState(state) })
    lastStateSendRef.current = Date.now()
  }, [state])

  // HEARTBEAT do host: rede de segurança contra travas. Se UMA mensagem do host se
  // perde num MOMENTO PARADO (sem novas jogadas), o convidado ficaria preso no
  // "Enviando…" — o heartbeat reemite o estado e cura. ANTES: reemitia o estado
  // INTEIRO a cada 3s SEM PARAR (jogo ativo e parado) → maior fonte do estouro de
  // Realtime/Egress. AGORA: só reemite quando está QUIETO (nenhum estado enviado nos
  // últimos ~12s). No jogo ativo, cada jogada já reenvia o estado, então o heartbeat
  // nem dispara; parado, ele ressincroniza em ~12-18s (e o convidado ainda tem o vigia
  // de 10s como reforço). Mesma proteção, uma fração do tráfego.
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.isHost || !state.roomId) return
    const iv = setInterval(() => {
      if (stateRef.current.screen === 'intro' || stateRef.current.screen === 'lobby') return
      if (Date.now() - lastStateSendRef.current < 12000) return // teve jogada recente → já sincronizado
      channelRef.current?.send({ type: 'broadcast', event: 'state', payload: packState(stateRef.current) })
      lastStateSendRef.current = Date.now()
    }, 6000)
    return () => clearInterval(iv)
  }, [state.onlineMode, state.isHost, state.roomId])

  // 🔌 VIGIA DA CONEXÃO (host E convidado): o `visibilitychange` só reconecta
  // quando a pessoa VOLTA pro app. Mas se o canal realtime cai — ou nem conecta —
  // com a TELA ABERTA (WiFi que oscila, aperto de rede), ninguém reconectava e
  // ficava preso no "Enviando…" (o resend do lance e o heartbeat do host dependem
  // do canal vivo). Este vigia checa a cada 5s: se o canal NÃO está 'joined' nem
  // 'joining', re-inscreve e ressincroniza — a MESMA reconexão que o onVis já faz,
  // só que sem depender de trocar de app. No-op quando o canal está saudável.
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.roomId) return
    const iv = setInterval(() => {
      const ch = channelRef.current
      if (!ch) return
      const st = (ch as unknown as { state?: string }).state
      if (st === 'joined' || st === 'joining') return // saudável ou conectando — não mexe
      const resync = () => {
        if (isHostRef.current) channelRef.current?.send({ type: 'broadcast', event: 'state', payload: packState(stateRef.current) })
        else channelRef.current?.send({ type: 'broadcast', event: 'request_state', payload: {} })
      }
      try { ch.subscribe(async () => { await ch.track({ playerIndex: stateRef.current.youIdx }); resync() }) } catch { /* tenta de novo no próximo tique */ }
    }, 5000)
    return () => clearInterval(iv)
  }, [state.onlineMode, state.roomId])

  // AUTOSAVE da carreira OFFLINE (solo): sem sala, o jogo inteiro vai pro
  // localStorage a cada transição importante — dá pra fechar e voltar depois.
  const soloSigRef = useRef('')
  useEffect(() => {
    if (state.onlineMode === 'online' || !state.careerOnline) return
    // não salva quando está numa tela LATERAL (álbum/ranking): senão o
    // "Continuar carreira" restaurava no álbum em vez do jogo.
    if (state.screen === 'intro' || state.screen === 'lobby' || state.screen === 'setup' || state.screen === 'album' || state.screen === 'ranking') return
    const sig = `${state.screen}|${state.round}|${state.seasonNo}|${state.sectorIdx}|${state.phase}|${state.monteIdx}|${state.managers.reduce((a, m) => a + m.squad.length, 0)}|${state.copaDoneSeason ?? ''}|${JSON.stringify(state.stadiums ?? {})}`
    if (sig === soloSigRef.current) return
    soloSigRef.current = sig
    try { localStorage.setItem('esc-solo-career', comLacre(state)); localStorage.setItem('esc-solo-career-at', String(Date.now())) } catch { /* cota cheia — ignora */ }
    savePyramidCloud(state) // logado: espelha na nuvem (throttled) pra seguir a conta
  }, [state])

  // 🏀 autosave da CARREIRA do basquete — ISOLADO do futebol (chave própria
  // `bl-nba-career`, não mexe no `esc-solo-career`). Salva o progresso pra você
  // continuar de onde parou; não salva em tela lateral (álbum/ranking). Só local.
  const nbaSigRef = useRef('')
  useEffect(() => {
    if (state.onlineMode === 'online' || state.sport !== 'basquete' || !state.nbaCareer) return
    if (state.screen === 'intro' || state.screen === 'lobby' || state.screen === 'setup' || state.screen === 'album' || state.screen === 'ranking') return
    const sig = `${state.screen}|${state.round}|${state.seasonNo}|${state.sectorIdx}|${state.phase}|${state.monteIdx}|${state.managers.reduce((a, m) => a + m.squad.length, 0)}`
    if (sig === nbaSigRef.current) return
    nbaSigRef.current = sig
    try { localStorage.setItem('bl-nba-career', JSON.stringify(state)); localStorage.setItem('bl-nba-career-at', String(Date.now())) } catch { /* cota cheia — ignora */ }
  }, [state])

  // Vigia do Monte: se a vez de um humano estoura o tempo (AFK), força o
  // auto-preenchimento. Roda em TODOS os clientes conectados (não só o host) —
  // se dependesse só do host, o celular dele apagar a tela travava a sala
  // inteira pra sempre. O reducer reconfirma o prazo antes de aplicar, então
  // disparos duplicados de vários clientes são inofensivos.
  useEffect(() => {
    if (state.onlineMode !== 'online') return
    if (state.screen !== 'monte' || !state.monteDeadline) return
    const cur = state.monteOrder[state.monteIdx]
    const m = state.managers.find(x => x.id === cur)
    if (!m || !m.isHuman) return
    const t = setTimeout(() => dispatch({ type: 'MONTE_TIMEOUT' }), Math.max(0, state.monteDeadline - Date.now()) + 300)
    return () => clearTimeout(t)
  }, [state.monteDeadline, state.screen, state.monteIdx, state.onlineMode, state.managers, state.monteOrder, dispatch])

  // Cronômetro da cerimônia: quando os 45s pra olhar os times acabam, começa
  // o campeonato sozinho. Vale solo e online; no online qualquer cliente pode
  // disparar (o guest roteia pro host) e o reducer reconfirma a tela.
  useEffect(() => {
    if (state.screen !== 'cerimonia' || !state.cerimoniaDeadline) return
    const t = setTimeout(() => dispatch({ type: 'FINISH_CEREMONY' }), Math.max(0, state.cerimoniaDeadline - Date.now()) + 200)
    return () => clearTimeout(t)
  }, [state.screen, state.cerimoniaDeadline, dispatch])

  // Vigia do leilão: mesmo princípio — qualquer cliente conectado pode forçar
  // o selamento quando o prazo do envelope estoura, não só o host.
  useEffect(() => {
    if (state.onlineMode !== 'online') return
    if (state.phase !== 'envelope' && state.phase !== 'resq_envelope') return
    if (!state.phaseDeadline) return
    const t = setTimeout(() => dispatch({ type: 'FORCE_SEAL' }), Math.max(0, state.phaseDeadline - Date.now()) + 800)
    return () => clearTimeout(t)
  }, [state.phaseDeadline, state.phase, state.onlineMode, dispatch])

  // Vigia do desempate: se um dos empatados sumir (AFK), o prazo estoura e
  // qualquer cliente força a resolução — quem não re-lançou não cobre.
  useEffect(() => {
    if (state.onlineMode !== 'online') return
    if (state.phase !== 'tiebreak' || !state.phaseDeadline) return
    const t = setTimeout(() => dispatch({ type: 'FORCE_TIEBREAK' }), Math.max(0, state.phaseDeadline - Date.now()) + 800)
    return () => clearTimeout(t)
  }, [state.phaseDeadline, state.phase, state.tiebreakIdx, state.onlineMode, dispatch])

  // 🛟 AUTO-CURA DE IDENTIDADE (online): depois de um "jogar de novo"/reconexão o
  // índice local ("quem sou eu") pode DESLIZAR — você passa a controlar o assento
  // de OUTRO técnico e o assento com o SEU nome fica órfão ("pensando" eterno,
  // "tô dando lance por alguém que não sou eu"). Cura: se o manager no meu índice
  // é humano mas NÃO tem o meu nome, e existe EXATAMENTE UM manager humano com o
  // meu nome, reancora youIdx nele (local; nome repetido na sala = não mexe).
  const myDisplayNameRef = useRef<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      // MESMA fonte do nome do técnico no lobby (nameOf): display_name; se vazio,
      // o começo do e-mail. Assim a auto-cura acha o assento certo mesmo pra quem
      // não pôs nome — senão o índice deslizado nunca se conserta.
      const dn = stripEmoji((data?.user?.user_metadata?.display_name as string | undefined) ?? '').trim()
      const em = stripEmoji(data?.user?.email?.split('@')[0] ?? '').trim()
      myDisplayNameRef.current = dn || em || null
    }, () => {})
  }, [])
  // guarda o CRACHÁ (id) do meu técnico nesta sala. Uma vez descoberto, a cura passa a
  // ser por id (robusta), não mais por nome. Zera ao trocar de sala (ids se repetem).
  const myMgrIdRef = useRef<number | null>(null)
  const lastRoomRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.roomId) return
    if (state.screen === 'intro' || state.screen === 'lobby') return
    if (state.roomId !== lastRoomRef.current) { lastRoomRef.current = state.roomId; myMgrIdRef.current = null } // sala nova → esquece o crachá antigo
    const clean = (x?: string) => stripEmoji(x ?? '').trim()
    // 1) JÁ SEI MEU CRACHÁ: reancora pela POSIÇÃO ATUAL dele. Imune a nome repetido/
    //    trocado (fantasma com meu nome) e à reordenação de times entre temporadas —
    //    é o que faltava pra parar o "virei outro / F5 trocou de nome".
    const myId = myMgrIdRef.current
    if (myId != null) {
      const idx = state.managers.findIndex(m => m.isHuman && m.id === myId)
      if (idx >= 0) { if (idx !== state.youIdx) rawDispatch({ type: 'FIX_YOU_IDX', idx }); return }
      myMgrIdRef.current = null // meu crachá sumiu (fui removido / rematch remontou): re-descobre abaixo
    }
    // 2) BOOTSTRAP pelo nome — SÓ quando há EXATAMENTE UM humano com o meu nome (sem
    //    ambiguidade). Guarda o crachá; daí em diante o passo 1 (por id) assume.
    const dn = myDisplayNameRef.current
    if (!dn) return
    const cands = state.managers.filter(m => m.isHuman && clean(m.name) === dn)
    if (cands.length !== 1) return
    myMgrIdRef.current = cands[0].id
    const idx = state.managers.findIndex(m => m.id === cands[0].id)
    if (idx >= 0 && idx !== state.youIdx) rawDispatch({ type: 'FIX_YOU_IDX', idx })
  }, [state.managers, state.youIdx, state.onlineMode, state.roomId, state.screen])

  // convidado vigia o host: sem estado recebido há >10s durante o jogo, acende
  // o aviso "host caiu" e segue pedindo o estado — se o host voltar, ressincroniza.
  // 🛟 AUTO-CURA DO HOST (bug do Diego/Rocha 02/08): na largada da partida, a
  // leitura "sou host?" pode piscar errada (corrida na criação/handoff) — aí o
  // DONO da sala se acha convidado, NINGUÉM é host e todo mundo trava no
  // "ENVIANDO…" até dar F5. Agora o aparelho preso confere no BANCO (fonte da
  // verdade: game_rooms.host_id) se o host é ELE — se for, reassume o comando
  // sozinho (BECOME_HOST) e a sala destrava sem ninguém atualizar a página.
  const lastOwnerCheckRef = useRef(0)
  useEffect(() => {
    if (state.onlineMode !== 'online' || state.isHost || !state.roomId) { setHostStale(false); return }
    if (state.screen === 'intro' || state.screen === 'lobby') { setHostStale(false); return }
    lastHostMsgRef.current = Date.now() // zera ao (re)entrar nessa vigília
    const iv = setInterval(() => {
      const stale = Date.now() - lastHostMsgRef.current > 10_000
      setHostStale(stale)
      if (stale) channelRef.current?.send({ type: 'broadcast', event: 'request_state', payload: {} })
      if (stale && Date.now() - lastOwnerCheckRef.current > 10_000) {
        lastOwnerCheckRef.current = Date.now()
        ;(async () => {
          try {
            const { data: u } = await supabase.auth.getUser()
            const uid = u?.user?.id
            if (!uid) return
            const st = stateRef.current
            if (!st.roomId || st.isHost) return
            const { data: r } = await supabase.from('game_rooms').select('host_id').eq('id', st.roomId).maybeSingle()
            if (r?.host_id === uid && !stateRef.current.isHost) rawDispatch({ type: 'BECOME_HOST' })
          } catch { /* segue pedindo estado; a próxima volta tenta de novo */ }
        })()
      }
    }, 2500)
    return () => clearInterval(iv)
  }, [state.onlineMode, state.isHost, state.roomId, state.screen])

  // 🔒 o aparelho lembra de qual sala ele é DONO (host). Serve SÓ pra não mostrar o
  // aviso "host caiu" pra ele mesmo — se a rede piscar no reconectar e o "sou host?"
  // ler errado por um instante, o dono não leva susto. NÃO muda quem é autoritativo
  // (não reassume host — isso é a parte arriscada que fica de fora de propósito).
  useEffect(() => {
    if (state.onlineMode === 'online' && state.isHost && state.roomId) {
      try { localStorage.setItem('esc-room-owner', state.roomId) } catch { /* cota cheia — ignora */ }
    }
  }, [state.onlineMode, state.isHost, state.roomId])

  // host persiste no banco a cada 3s — em INTERVALO FIXO (não debounce). Antes
  // era um setTimeout que zerava a cada mudança de estado; durante a simulação
  // rápida da temporada (uma rodada a cada ~1s) o timer nunca disparava e o
  // estado NUNCA era salvo. Resultado: reconectar não achava a partida e
  // recomeçava o jogo do zero, quebrando a sala. Com intervalo fixo lendo o
  // stateRef, sempre há um snapshot recente pra retomar.
  const lastUpRef = useRef('') // assinatura do último game_state que subiu (economia de egress)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.isHost || !state.roomId) return
    const save = () => {
      const st = stateRef.current
      if (st.screen === 'intro' || st.screen === 'lobby' || !st.roomId) return
      // sanitize devolve só o EscState — precisamos REPOR o marcador __game
      // (senão as checagens de "é sala da Escalação?" quebram no reconnect) e
      // a formação (usada como fallback). IMPORTANTE: .then() aqui não é
      // enredo — sem ele o supabase-js NÃO dispara a requisição (query é
      // preguiçosa), e era por isso que o estado nunca era salvo de verdade.
      const payload = { ...sanitize(st), __game: 'escalacao', formation: st.managers.find(m => m.isHuman)?.formation ?? '4-3-3', ...(st.streamMode ? { stream: true } : {}), ...(st.manualRoom ? { manual: true } : {}), ...(st.roomName ? { roomName: st.roomName } : {}), ...(st.careerOnline ? { mode: 'carreira' } : {}) }
      // updated_at aqui é o "batimento cardíaco" da sala: é como a lista de
      // Salas Abertas distingue jogo REALMENTE rolando de sala abandonada (o
      // host fechou a aba e ninguém mais salva nada). Sem escrever isso a
      // cada save, updated_at fica congelado na criação da sala pra sempre.
      // 💸 ECONOMIA (03/08): estado IDÊNTICO ao último upload (ex.: os 45s do
      // envelope = nada muda) NÃO re-sobe os ~100-180 KB — só bate o coração
      // (updated_at, minúsculo). Mudou qualquer coisa → sobe na hora, igual
      // sempre. Reconexão continua achando o snapshot mais recente.
      const body = JSON.stringify(payload)
      if (body === lastUpRef.current) {
        supabase.from('game_rooms').update({ updated_at: new Date().toISOString() }).eq('id', st.roomId).then(() => {}, () => {})
      } else {
        lastUpRef.current = body
        supabase.from('game_rooms').update({ game_state: payload, updated_at: new Date().toISOString() }).eq('id', st.roomId).then(() => {}, () => {})
      }
    }
    lastUpRef.current = '' // sala nova/reconexão: primeiro save sempre sobe inteiro
    save() // salva JÁ ao entrar no jogo (fecha a janela dos 3s do 1º save)
    const iv = setInterval(save, 3000)
    return () => { save(); clearInterval(iv) }
  }, [state.onlineMode, state.isHost, state.roomId])

  // ─── analytics: registra cada partida e mantém o "ao vivo" ───
  // uma partida = entrar no leilão (vale solo e online; cada humano registra a
  // sua, então online conta N pessoas). Jogadores anônimos também entram.
  const prevScreenRef = useRef(state.screen)
  useEffect(() => {
    const prev = prevScreenRef.current
    prevScreenRef.current = state.screen
    if (state.screen === 'auction' && prev !== 'auction') {
      const st = stateRef.current
      logPlay(st.onlineMode, st.managers[st.youIdx]?.teamName)
    }
  }, [state.screen])

  // registra 1 visita ao abrir o site (jogando ou não)
  useEffect(() => { logVisit() }, [])

  // heartbeat "estou no site agora" a cada 30s — em QUALQUER tela (a home
  // conta como "ao vivo no site"; as telas de jogo contam como "jogando").
  useEffect(() => {
    const beat = () => {
      // aba escondida (minimizada/em segundo plano): não gasta gravação — a
      // pessoa nem tá olhando. Volta a marcar presença assim que ela reabre.
      if (typeof document !== 'undefined' && document.hidden) return
      const st = stateRef.current
      // modo pro "ao vivo": distingue carreira da partida rápida (ambas são cpu
      // por baixo). A carreira NOVA (pirâmide) usa careerOnline + a colocação do
      // técnico (careerPlacements); a ANTIGA usa careerDivision. Ambas viram
      // 'career' no painel, com divisão e temporada — senão a pirâmide aparecia
      // como "partida rápida" e sumia da aba "Carreiras (onde cada um está)".
      const youId = st.managers[st.youIdx]?.id ?? st.youIdx
      const pyramid = st.careerOnline && st.onlineMode !== 'online'
      const division: string | null = st.careerDivision ?? (pyramid ? (st.careerPlacements?.['m' + youId] ?? 'D') : null)
      const liveMode = st.onlineMode === 'online' ? 'online' : division ? 'career' : 'cpu'
      // caixa + títulos da carreira (pro painel ao vivo): pirâmide usa
      // careerCoins/careerHonors (títulos de QUALQUER série); antiga usa cash/careerTitles.
      const hon = st.careerHonors?.['m' + youId]
      const titles = division ? (pyramid ? (hon ? hon.A + hon.B + hon.C + hon.D : 0) : st.careerTitles) : undefined
      const coins = division ? Math.round(pyramid ? (st.careerCoins?.[youId] ?? 0) : (st.managers[st.youIdx]?.money ?? 0)) : undefined
      const career = division ? { season: st.seasonNo, division, coins, titles } : undefined
      // online é sempre baralho brasileiro; solo (rápida/carreira) manda o escolhido
      const deck = liveMode === 'online' ? undefined : st.deckLeague
      heartbeat(liveMode, st.managers[st.youIdx]?.teamName, st.screen, career, deck)
    }
    beat()
    // a cada 60s (era 30s) — metade da gravação, e o painel "ao vivo" segue
    // mostrando todo mundo (a janela do online é 90s). Como o `beat` lê o estado
    // atual via ref, NÃO precisa reiniciar a cada troca de tela: antes isso
    // gravava um "tô aqui" extra em cada mudança de tela/temporada.
    const iv = setInterval(beat, 60_000)
    const onVis = () => { if (typeof document !== 'undefined' && !document.hidden) beat() }
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(iv)
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // não mostra o "host caiu" pro DONO da sala (mesmo que o "sou host?" pisque errado
  // no reconectar) — é só cosmético; guest de verdade segue vendo normal.
  const iOwnThisRoom = (() => { try { return !!state.roomId && localStorage.getItem('esc-room-owner') === state.roomId } catch { return false } })()
  const showHostBanner = state.onlineMode === 'online' && !state.isHost && hostStale && !iOwnThisRoom
    && state.screen !== 'intro' && state.screen !== 'lobby'
  return (
    <Ctx.Provider value={{ state, dispatch, emote, emotes, chat, chatUnread, sendChat, chatOpen, setChatOpen, hostStale, kickPlayer, leaveRoom, becameHost }}>
      {children}
      {becameHost && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,.55)', padding: 24, fontFamily: 'Oswald, sans-serif',
        }}>
          <div style={{
            background: 'linear-gradient(150deg,#FFE79A,#FFC400 45%,#E8A200 75%,#FFDD70)',
            border: '4px solid #0C0C0C', borderRadius: 22, boxShadow: '6px 7px 0 #0C0C0C',
            padding: '26px 22px', textAlign: 'center', maxWidth: 340,
          }}>
            <div style={{ fontSize: 52, lineHeight: 1 }}>🎖️</div>
            <p style={{ fontWeight: 900, fontSize: 26, color: '#0C0C0C', margin: '10px 0 4px', letterSpacing: .5 }}>VOCÊ VIROU O HOST!</p>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'rgba(0,0,0,.72)' }}>O host anterior saiu da sala e passou o comando pra você. Agora é <b>você</b> quem toca a partida: avançar fases, começar o leilão e decidir depois da votação. 🎮</p>
            <button onClick={() => setBecameHost(false)}
              style={{ marginTop: 16, width: '100%', background: '#0C0C0C', color: '#fff', border: '3px solid #0C0C0C', borderRadius: 12, padding: '12px 0', fontWeight: 900, fontSize: 16, fontFamily: 'Oswald, sans-serif', cursor: 'pointer', boxShadow: '3px 3px 0 rgba(0,0,0,.35)' }}>
              👑 OK, ENTENDI — SOU O HOST
            </button>
          </div>
        </div>
      )}
      {kickedOut && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,.62)', padding: 24, fontFamily: 'Oswald, sans-serif',
        }}>
          <div style={{
            background: 'linear-gradient(150deg,#E8503A,#C2452F 70%)',
            border: '4px solid #0C0C0C', borderRadius: 22, boxShadow: '6px 7px 0 #0C0C0C',
            padding: '26px 22px', textAlign: 'center', maxWidth: 340, color: '#fff',
          }}>
            <div style={{ fontSize: 52, lineHeight: 1 }}>🟥</div>
            <p style={{ fontWeight: 900, fontSize: 26, margin: '10px 0 4px', letterSpacing: .5 }}>VOCÊ FOI EXPULSO</p>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,.9)' }}>O host removeu você desta partida. Você <b>saiu da sala</b> — pode entrar em outra sala ou criar a sua. 👋</p>
            <button onClick={() => setKickedOut(false)}
              style={{ marginTop: 16, width: '100%', background: '#0C0C0C', color: '#fff', border: '3px solid #0C0C0C', borderRadius: 12, padding: '12px 0', fontWeight: 900, fontSize: 16, fontFamily: 'Oswald, sans-serif', cursor: 'pointer', boxShadow: '3px 3px 0 rgba(0,0,0,.35)' }}>
              OK, ENTENDI
            </button>
          </div>
        </div>
      )}
      {showHostBanner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
          background: '#E8503A', color: '#fff', textAlign: 'center',
          padding: '8px 12px', fontWeight: 800, fontSize: 13,
          fontFamily: 'Oswald, sans-serif', borderBottom: '3px solid #0C0C0C',
        }}>
          ⏳ Segura a onda! O host trocou de tela ou caiu — já tá voltando. Enquanto isso, reclama com ele! 😤
          <button onClick={() => { try { window.location.reload() } catch { /* nada */ } }}
            style={{ display: 'block', margin: '6px auto 0', border: '2.5px solid #0C0C0C', borderRadius: 10, background: '#fff', color: '#0C0C0C', fontWeight: 800, fontSize: 12, fontFamily: 'Oswald, sans-serif', padding: '4px 14px', cursor: 'pointer', boxShadow: '2px 2px 0 0 #0C0C0C' }}>
            🔄 Travou? Atualiza a página — a partida continua de onde parou
          </button>
        </div>
      )}
    </Ctx.Provider>
  )
}

// mantém o leilão cego: convidados nunca recebem os envelopes pendentes,
// só quem já lacrou (contador) — os valores só aparecem na revelação.
function sanitize(state: EscState): EscState {
  return { ...state, pendingEnvelopes: {}, tiebreakPending: {} }
}

// 📦 o estado que o host manda pros convidados chega a ~80 KB e ESTOURAVA o limite
// de tamanho de mensagem do Supabase Realtime → a mensagem era DESCARTADA e o
// convidado travava no "Enviando…"/"host caiu". Agora vai COMPRIMIDO (~15-35 KB),
// com folga. Empacota como { z: <base64 comprimido> }; nada é cortado.
// cache por IDENTIDADE do estado: o efeito de retransmissão, o heartbeat (3s) e os
// resyncs podem pedir o pacote do MESMO objeto de estado várias vezes por segundo.
// Como cada dispatch cria um objeto novo (imutável), comparar por referência basta
// pra comprimir só uma vez por estado — evita gastar CPU do celular do host à toa.
let _packSrc: EscState | null = null
let _packOut: { z: string } = { z: '' }
function packState(state: EscState): { z: string } {
  if (state === _packSrc) return _packOut
  _packSrc = state
  _packOut = { z: pack(sanitize(state)) }
  return _packOut
}
// lê o payload do evento 'state': aceita o novo formato comprimido { z } e também
// o antigo (estado cru) — pra não quebrar na janela de deploy, quando host e
// convidado podem estar em versões diferentes por uns minutos.
function readState(payload: unknown): EscState {
  const p = payload as { z?: string } | EscState
  if (p && typeof (p as { z?: string }).z === 'string') return unpack<EscState>((p as { z: string }).z)
  return p as EscState
}

export function useEsc() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEsc fora do EscProvider')
  return ctx
}

export type { Action as EscAction }
