// ─── A ESCALAÇÃO — leilão cego por setor + temporada de 38 rodadas ───

export type Sector = 'GOL' | 'LAT' | 'ZAG' | 'MEI' | 'ATA'
export const SECTORS: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
export const SECTOR_LABEL: Record<Sector, string> = {
  GOL: 'Goleiros', LAT: 'Laterais', ZAG: 'Zagueiros', MEI: 'Meio-campo', ATA: 'Ataque',
}

// fama é interna: guia a CPU e a curadoria do baralho. Nunca é exibida.
// nível exibido: 5=lenda · 4=craque · 3 e 2=bom jogador · 1=foi profissional (limitado)
// (o selo "folclórico" é à parte, no campo folk — não é nível)
export type Fame = 1 | 2 | 3 | 4 | 5

export interface Card {
  id: string
  name: string
  club: string
  year: number
  pos: Sector
  fame: Fame
  lo: number // faixa de nível — oculta até a Cerimônia da Revelação
  hi: number
  bio?: string // texto de referência (aparece na carta-lembrança do álbum)
  folk?: boolean // "folclórico": vibe irreverente/engraçada, independe do nível
  promessa?: boolean // 5º tier: foi só promessa aqui e virou estrela na Europa (nível abaixo de craque)
}

export type Acquisition = 'leilao' | 'repescagem' | 'monte' | 'bot'

export interface WonCard extends Card {
  paid: number
  via: Acquisition
}

// só duas formações — GOL/LAT/ZAG são sempre 1/2/2 nas duas (nunca variam),
// só MEI/ATA mudam. Isso é o que sustenta o plano de rodadas por vaga.
export type FormationKey = '4-3-3' | '4-4-2'

export const FORMATIONS: Record<FormationKey, Record<Sector, number>> = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 },
}

export type Tactic = 'retranca' | 'equilibrio' | 'ataque'

export interface Manager {
  id: number
  name: string
  teamName: string
  isHuman: boolean
  // participa do leilão (humanos sempre; CPUs rivais no modo solo). Bots de
  // preenchimento (online, quando a sala é menor que 20) já entram com
  // elenco pronto e NUNCA dão lance — mantém o leilão do tamanho exato da
  // demanda real dos humanos, sem diluir com gente que nem está disputando.
  auctionRival: boolean
  // carreira: rival de OUTRA divisão que entra só pra dar lance no leilão (mantém
  // vida própria na pirâmide). Bidder no pregão, mas NÃO entra na sua liga.
  auctionOnly?: boolean
  formation: FormationKey
  money: number
  squad: WonCard[]
  // arquétipo da CPU
  aggression: number // 0..1 — quanto gasta cedo
  starHunger: number // 0..1 — quanto concentra em figurões
}

export interface Bid {
  mgr: number
  amount: number
}

// resultado da disputa de uma carta, pronto pra revelação dramática
export interface ResolvedCard {
  card: Card
  bids: Bid[] // ordenado desc
  winner: number | null // manager id ou null (sem lance → Monte)
  paid: number
  voided: number[] // managers cujo lance foi anulado (setor já cheio)
}

export type AuctionPhase = 'envelope' | 'reveal' | 'resq_envelope' | 'resq_reveal' | 'tiebreak'

// desempate: quando ≥2 técnicos empatam no MAIOR lance de uma carta, eles
// re-lançam às cegas só nela (quem paga mais leva). Empatou de novo → roleta
// (sorteio) entre quem ficou no topo. Os demais só assistem.
export interface TieBreak {
  cardId: string
  card: Card
  amount: number // valor empatado — piso do re-lance
  managers: number[] // ids empatados no topo (elegíveis)
  submitted: number[] // quem já re-lançou nesta disputa
  winner: number | null // decidido
  paid: number
  viaRoulette: boolean // true = empatou de novo e caiu na roleta
  via: Acquisition // 'leilao' | 'repescagem' (pra registrar na carta ganha)
  bids?: Record<number, number> // quanto cada empatado cobriu no re-lance (pra revelação)
}

export interface LeagueTeam {
  id: number // 0..19 — managers usam o mesmo id; clubes clássicos vêm depois
  name: string
  isManager: boolean
  // clubes clássicos têm força fixa por setor; managers calculam por partida
  baseAtk: number
  baseDef: number
  pts: number; w: number; d: number; l: number; gf: number; ga: number
}

export interface MatchHighlight {
  min: number
  text: string
  teamId: number // de quem foi o gol — usado pro placar ao vivo no ticker de minutos
}

export interface MatchResult {
  homeId: number
  awayId: number
  hg: number
  ag: number
  highlights: MatchHighlight[] // só preenchido no jogo do humano
}

export interface ScorerRow {
  name: string
  teamId: number
  teamName: string
  goals: number
}

export type Screen =
  | 'intro'
  | 'lobby'
  | 'setup'
  | 'auction'
  | 'monte'
  | 'cerimonia'
  | 'season'
  | 'end'
  | 'album'
  | 'ranking'

export type OnlineMode = 'cpu' | 'online'

// modo carreira (solo): sobe/desce entre divisões e salva o progresso
export type Division = 'A' | 'B' | 'C' | 'D'

// rival fixo da carreira: escolhido no início, é rival pra vida toda. Tem vida
// própria na pirâmide (sobe/cai sozinho) — só te enfrenta quando está na sua
// divisão. h2h = retrospecto vitalício [suas vitórias, empates, vitórias dele].
export interface CareerRival {
  team: string
  name: string
  division: Division
  h2h: [number, number, number]
  lastPos: number | null // posição na última temporada (pro rastreador)
}

export interface EscState {
  screen: Screen
  seed: number
  // online
  onlineMode: OnlineMode
  roomId: string
  roomCode: string
  roomName?: string // nome que o host deu à sala (ex.: "Sala do Pava") — só pra exibir; some se não foi definido
  isHost: boolean
  humanCount: number
  submitted: number[]          // ids de técnicos que lacraram o envelope nesta fase
  pendingEnvelopes: Record<number, { cardId: string; amount: number }[]> // host-only (não vaza no broadcast)
  presence: number[]           // ids online (presence do canal)
  // sala
  managers: Manager[]
  youIdx: number
  // leilão
  sectorIdx: number // 0..4 dentro de SECTORS
  deck: Record<Sector, Card[]>
  surpriseId?: string // 1 jogador surpresa por leilão: nome escondido no lance, revelado no martelo
  phase: AuctionPhase
  currentCards: Card[] // cartas em disputa nesta fase
  revealQueue: ResolvedCard[] // ordenado por pote crescente
  revealIdx: number
  stock: Record<Sector, number> // estoque restante no baralho (contador vivo)
  sectorCursor: number // até onde já foi dealt do deck[pos] atual (levas)
  sectorUnsoldAccum: Card[] // não vendidos acumulados nas levas do setor até a repescagem
  roundIdx: number // rodada por vaga dentro do setor atual (só modo online)
  // monte final
  monte: Card[]
  monteOrder: number[] // sequência serpente de manager ids
  monteIdx: number
  // temporada
  league: LeagueTeam[]
  fixtures: [number, number][][] // 38 rodadas de pares [home, away]
  round: number // 0-based; 38 = fim
  tactics: Record<number, Tactic> // tática por técnico (cada humano define a sua)
  careerTactics?: Record<number, Record<number, Tactic>> // carreira online: tática POR JOGO (mgrId → rodada 0-based → tática); vale daquela rodada em diante até trocar
  careerCoins?: Record<number, number> // carreira online: caixa de moedas por técnico (mgrId → moedas), pra reforços; +100/temporada + bônus de título/acesso, -queda
  careerHonors?: Record<string, { A: number; B: number; C: number; D: number }> // carreira online: títulos por divisão de CADA time (chave = m<id> humano / nome do CPU), acumulados por temporada; base do Ranking
  locked?: boolean // sala fechada (com senha) — guardado no estado pra sobreviver ao autosave
  pwHash?: string // hash da senha da sala (SHA-256) — idem
  lastResults: MatchResult[] // resultados da última rodada simulada
  news: string[] // manchetes (dias inspirados etc.)
  champion: number | null
  phaseDeadline: number | null // timestamp (ms) do fim do envelope
  monteDeadline: number | null // timestamp (ms) do fim da vez atual no Monte (online)
  cerimoniaDeadline: number | null // timestamp (ms) do fim da cerimônia (auto-começa o campeonato)
  cpuAtkAdj: number // ajuste de força dos CPUs (online): escala os bots à média dos humanos
  cpuDefAdj: number
  streamMode: boolean // sala de stream: esconde os VALORES dos lances na tela (pra live)
  deckLeague: 'br' | 'eu' | 'both' // baralho escolhido: 🇧🇷 Brasileirão, 🌍 Liga Europa ou 🌎 os dois juntos (both = só na carreira online)
  careerDivision: Division | null // modo carreira (solo): divisão atual (null = partida rápida)
  careerOnline?: boolean // sala online no MODO CARREIRA (4 divisões) — diferencia do online "rápido"
  careerPlacements?: Record<string, string> | null // pirâmide: chave do time → divisão ('A'..'D'). Compacto (só a colocação); os elencos são determinísticos. Atualiza a cada temporada.
  dinastia?: boolean // modo Dinastia (teste): usa o leilão real; a economia assume após a cerimônia
  dinastiaBudget?: number // orçamento (moedas do clube) que o pregão do Dinastia usa
  dinastiaPaused?: boolean // Dinastia: temporada pausada na JANELA DO MEIO (metade do calendário)
  dinastiaMidUsed?: boolean // Dinastia: já abriu a janela do meio nesta temporada (não reabre)
  careerIntent: boolean // ao ir pro setup, sinaliza que é carreira (não partida rápida)
  careerTitles: number // títulos acumulados na carreira atual (qualquer divisão)
  careerTitlesA: number // títulos da SÉRIE A (viram estrelas ⭐ no escudo)
  careerRivalCount: number // quantos rivais de leilão (3/5/7/9) na carreira
  careerRivals: CareerRival[] // rivais fixos (vida própria na pirâmide)
  scorers: ScorerRow[] // artilharia acumulada da temporada
  seasonNo: number // conta quantas temporadas essa sala/sessão já jogou (revanche)
  // "Reiniciar com novos times" (re-draft): precisa da galera toda online e
  // pronta antes de refazer o leilão. restartPending liga o painel de espera;
  // restartReady junta os ids que já confirmaram "estou pronto".
  restartPending: boolean
  restartReady: number[]
  // desempate de lances (ver TieBreak). tiebreakPending é host-only (não vaza
  // no broadcast — mantém o re-lance cego, igual pendingEnvelopes).
  tiebreaks: TieBreak[]
  tiebreakIdx: number
  tiebreakPending: Record<number, number> // mgrId -> valor do re-lance
  // rivalidade de clássicos (só entre humanos): chave "aVb" com a<b (ids de
  // técnico) -> [vitórias de a, vitórias de b, empates]. Acumula ao longo das
  // temporadas da mesma sala.
  rivalries: Record<string, [number, number, number]>
}
