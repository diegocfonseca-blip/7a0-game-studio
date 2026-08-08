// ─── A ESCALAÇÃO — leilão cego por setor + temporada de 38 rodadas ───

export type Sector = 'GOL' | 'LAT' | 'ZAG' | 'MEI' | 'ATA'
export const SECTORS: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
export const SECTOR_LABEL: Record<Sector, string> = {
  GOL: 'Goleiros', LAT: 'Laterais', ZAG: 'Zagueiros', MEI: 'Meio-campo', ATA: 'Ataque',
}

// ─── 🤝 DUPLA: 2 pessoas dividindo o comando de UM time ───
// As 6 categorias que a dupla divide (3 pra cada). O MONTE é categoria própria,
// não gruda em posição nenhuma — quem pega as sobras é quem ficou com ele.
export type DuplaCat = Sector | 'MONTE'
export const DUPLA_CATS: DuplaCat[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA', 'MONTE']
export const DUPLA_CAT_LABEL: Record<DuplaCat, string> = {
  GOL: 'Goleiro', LAT: 'Lateral', ZAG: 'Zagueiro', MEI: 'Meia', ATA: 'Atacante', MONTE: 'Monte (sobras)',
}
export const DUPLA_CAT_ICON: Record<DuplaCat, string> = {
  GOL: '🧤', LAT: '🏃', ZAG: '🛡️', MEI: '🎩', ATA: '⚽', MONTE: '📦',
}
// Uma vaga de time comandada por 2 pessoas. Fica em `EscState.duplas[mgrId]`.
export interface DuplaSeat {
  ownerUid: string      // dono do assento (quem tem o player_index de verdade)
  ownerName: string
  partnerUid?: string   // vazio = ainda procurando parceiro (vaga 1/2)
  partnerName?: string
  seek?: 'aberta' | 'privada' // como a vaga aparece pra sala enquanto procura
  // categoria → user_id de quem MANDA nela. Vazio = ainda não dividiram.
  cats?: Partial<Record<DuplaCat, string>>
  // um dos dois SAIU de verdade da sala → quem ficou assume TUDO (sem trava).
  // Guarda o uid de quem ficou. Só trocar de tela/perder o foco NÃO seta isto.
  soloUid?: string
}

// ✋ Tocar numa categoria na tela de dividir. Mesma regra usada na SALA DE
// ESPERA (que grava direto no banco) e dentro do JOGO (reducer) — de novo uma
// função só, pra não existirem duas versões da regra que possam discordar.
// Devolve a divisão nova, ou `null` quando o toque não vale (categoria já é do
// parceiro, ou você já está com as suas 3).
export function duplaToggleCat(
  cats: Partial<Record<DuplaCat, string>> | undefined,
  cat: DuplaCat, uid: string, outroUid: string,
): Partial<Record<DuplaCat, string>> | null {
  const n = { ...(cats ?? {}) }
  const dono = n[cat]
  if (dono === uid) delete n[cat]        // soltei a minha (dá pra mudar de ideia)
  else if (dono) return null             // já é do parceiro: quem tocou primeiro levou
  else {
    if (DUPLA_CATS.filter(c => n[c] === uid).length >= 3) return null // teto de 3
    n[cat] = uid
  }
  // fechou as 3? as outras 3 caem AUTOMÁTICO pro parceiro (ninguém confirma nada)
  if (DUPLA_CATS.filter(c => n[c] === uid).length === 3) {
    for (const c of DUPLA_CATS) if (!n[c]) n[c] = outroUid
  }
  return n
}

// ⚖️ A REGRA ÚNICA da dupla — usada pela TELA (pra mostrar 🔒) e pelo HOST (pra
// recusar de verdade). Ter UMA função só é de propósito: se tela e host usassem
// regras separadas, elas poderiam discordar — e é exatamente aí que nascem os
// bugs de assento ("dei lance por outro"). Devolve `true` se PODE agir.
export function duplaPodeAgir(
  duplas: Record<number, DuplaSeat> | undefined,
  mgrId: number, cat: DuplaCat, uid?: string,
): boolean {
  const d = duplas?.[mgrId]
  if (!d || !d.partnerUid) return true // vaga normal (ou dupla ainda não formada): tudo como sempre
  if (d.soloUid) return d.soloUid === uid // o parceiro saiu de verdade: quem ficou manda em tudo
  const dono = d.cats?.[cat]
  if (!dono) return true // ainda não dividiram → não trava ninguém (nunca atrasa o jogo)
  return dono === uid
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
  fake?: boolean // jogador INCÓGNITO (nome gerado, não é do catálogo real) — usado só pra completar elenco quando o baralho real acaba; nunca entra no mercado de venda dos bots
  seller?: number // carreira online: id do técnico/bot que LISTOU esta carta pro mercado — quando ela é vendida (leilão ou monte), ele recebe a grana na caixa
  semContrato?: boolean
  cria?: boolean // 🌱 Cria da Base: tapa-buraco sem contrato, ruim de doer, invendável — some quando chega reforço // 📝 CONTRATOS (carreira): esta carta chegou ao leilão porque o CONTRATO ENCERROU (não foi venda planejada) — a grana do vendedor tem TETO no valor oficial do jogador (o que passar "fica com a família/empresário")
}

export type Acquisition = 'leilao' | 'repescagem' | 'monte' | 'bot'

// 🕴️ AGÊNCIA 2.0 (carreira solo nova): carta do ÁLBUM convocada pra "ativa".
// Guarda só o essencial pra identificar o auge (nome+clube+ano) e calcular a renda.
export interface AgCard { name: string; club: string; year: number; pos: string; fame: number; promessa?: boolean; folk?: boolean }
// um acontecimento que rendeu comissão (aparece na fatura da Cerimônia)
export interface AgEvento { emoji: string; texto: string; coins: number; nome?: string }

export interface WonCard extends Card {
  paid: number
  via: Acquisition
  contratoAte?: number // 📝 CONTRATOS (carreira): temporada em que o contrato ENCERRA (vence no FIM dela). Sorteado 5-10 na chegada; renovação = 10 anos (valor cheio) ou 5 (metade). Ausente = save antigo (ganha na próxima cerimônia)
  reforco?: boolean // carreira online: comprado no leilão de reservas/mercado (não é do elenco original) — usado pras frases de "como vão as contratações"
  emprestado?: 'saf' | 'dono' // 🏢 SAF: jogador de EMPRÉSTIMO (propriedade não mudou) — 'saf' = veio da SAF pro dono; 'dono' = veio do dono pra SAF. Nunca pode ser vendido/listado; volta sozinho na virada de temporada.
  byClub?: number // 🏛️ MULTICLUBES: qual dos SEUS clubes fez este empréstimo (id do manager). Só usado quando há 2º clube — pra devolver o empréstimo pro clube certo na virada. Ausente = carreira normal (1 clube).
  buyPrice?: number // 💰 quanto se PAGOU de fato ao comprar (imutável). Diferente de `paid`, que é o piso e pode subir com bônus de artilheiro. Usado no Extrato/Transferências pra mostrar o valor pago e a valorização sem distorção.
}

// 🧾 livro-caixa da carreira SOLO: cada entrada/saída de dinheiro vira um
// lançamento (só pra exibição — NUNCA volta a mexer no caixa de verdade).
export interface LedgerEntry {
  id: string
  season: number // temporada do lançamento
  kind: 'reward' | 'gate' | 'salary' | 'buy' | 'sell' | 'sponsor' | 'saf' | 'stadium' | 'safbuy' | 'safsell' | 'opening' | 'empresario' | 'banco' // prêmios · bilheteria · folha · compra · venda · patrocínio · comissão da SAF · obra no estádio · compra da SAF · venda da SAF · saldo inicial · renda do empresário
  label: string
  amount: number // sinal: + entrada, − saída
  player?: string // compra/venda: nome do jogador
  pos?: Sector // compra/venda: posição
  buyPrice?: number // venda: quanto tinha sido pago (pra calcular o lucro)
}

// 💼 carta na "agência" do Empresário (por carreira): as cartas ganhas no pacote
// de campeão desta carreira. Guarda só o essencial pra mostrar e ranquear a renda.
export interface EmpCard {
  name: string
  club: string
  year: number
  pos: Sector
  fame: number
  folk?: boolean
  promessa?: boolean
  season?: number // 💼 temporada em que a carta foi ganha — só começa a render na temporada SEGUINTE (não na que ela foi tirada no fim)
}

// 🎭 EVENTOS DE JOGADOR (carreira SOLO): o "causo" da temporada — noitada,
// expulsão ou lesão de um jogador do SEU time titular. O banner trava o avanço
// da rodada até o técnico decidir (regras completas no comentário do EscState).
export type EventoTipo = 'noitada' | 'expulsao' | 'lesao'
export interface EventoAtivo {
  season: number   // temporada do evento (marca o "1 por temporada")
  round: number    // rodada (0-based) em que apareceu — o jogo que AINDA vai rolar
  mgrId: number    // clube do evento (o ativo na hora — multiclube não mistura)
  tipo: EventoTipo
  cardId: string
  nome: string
  pos: Sector
  rodadas: number  // jogos fora (noitada 1 · expulsão 1-3 · lesão 1-5)
  historia: string // o texto do banner (sorteado uma vez, não muda no reload)
  // pendente = banner na tela (trava o avanço) · banco = trocou (volta na rodada `volta`)
  // campo = "escalar assim mesmo" (queda pequena SÓ naquele jogo) · manchete = sem reserva, só zoeira
  status: 'pendente' | 'banco' | 'campo' | 'manchete'
  volta?: number   // rodada em que o titular VOLTA (round + rodadas) — só status 'banco'
  subId?: string   // quem assumiu a vaga
  subNome?: string
}
export interface EventoManchete { season: number; round: number; emoji: string; titulo: string; sub: string }

// só duas formações — GOL/LAT/ZAG são sempre 1/2/2 nas duas (nunca variam),
// só MEI/ATA mudam. Isso é o que sustenta o plano de rodadas por vaga.
// 4-3-3 e 4-4-2 são as formações INICIAIS (base do leilão). 4-5-1 é uma troca
// TÁTICA que o técnico faz na carreira quando tiver 5 meias (nunca no início).
export type FormationKey = '4-3-3' | '4-4-2' | '4-5-1'

export const FORMATIONS: Record<FormationKey, Record<Sector, number>> = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 },
  '4-5-1': { GOL: 1, LAT: 2, ZAG: 2, MEI: 5, ATA: 1 },
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
  // 🎽 carreira: destrava a troca de formação (4-3-3↔4-4-2) na aba Elenco.
  // Vira true na PRIMEIRA vez que o elenco chega a 22 jogadores reais e FICA true
  // pra sempre (não tranca mais se depois cair de 22). A trava por-posição segue
  // valendo em cada troca, então nunca entra perna-de-pau.
  formUnlocked?: boolean
  money: number
  squad: WonCard[]
  // carreira online: BOT FIADOR do leilão — rival de CPU que só entra pra dar lance
  // quando uma posição fica sem disputa (0 ou 1 humano ofertando), pra não deixar
  // ninguém pegar de graça / campar o monte. É time real (caixa própria, joga a
  // liga, sobe/desce de divisão). Quantidade = floor(humanos/2).
  backstop?: boolean
  // carreira online, leilão de RESERVAS: elenco fundo — o time passa a mirar 22
  // (XI + banco = 2× a formação por posição). Fora do leilão de reservas fica
  // undefined, então o leilão normal (T1/solo/dinastia/rápido) segue mirando 11.
  deepSquad?: boolean
  // 🏀 carreira do basquete: alvo de vagas POR POSIÇÃO deste técnico (1 quinteto →
  // 2 rotação → 3 elenco cheio). Cresce a cada temporada só p/ você (+ rivais);
  // bots ficam sem = quinteto. undefined fora do basquete.
  nbaSlots?: number
  // carreira OFFLINE (pirâmide solo): rival ESCOLHIDO pelo jogador (nome próprio).
  // É CPU (usa clubCash), mas aparece COLORIDO e marcado como rival no display,
  // igual à carreira antiga. Não afeta economia — só o visual.
  rival?: boolean
  // pirâmide, mercado dos 80: time de FUNDO (dos 60) materializado como participante
  // TEMPORÁRIO só neste leilão, porque um jogador dele foi sorteado pro mercado. Ele
  // briga na posição da perda (leilão + monte, com preferência no próprio) e no fim
  // a ficha dele (cpuSquads) é atualizada e ele SAI da lista. Fica sempre em 11.
  marketCpu?: boolean
  marketTeam?: string // nome do time de fundo que este participante temporário representa (chave da ficha/clubCash)
  // 🏛️ MULTICLUBES: `mine` = 2º clube do PRÓPRIO jogador (assento independente, id
  // próprio → caixa/títulos/estádio separados). `dormindo` = não está no comando
  // agora (fica congelado, "mesmo time", não vai ao leilão, não dá lance). Só solo.
  mine?: boolean
  dormindo?: boolean
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

// 🏆 COPA DOS 8 — modo rápido (online e offline). Top-8 da liga, seedado
// 1×8 · 2×7 · 3×6 · 4×5 (ida e volta); semis e final seguem do cruzamento
// clássico do chaveamento; final é jogo único. Mesmo motor de partida do
// campeonato (simMatch), só que fora do calendário de pontos corridos.
export interface QuickCopaTie {
  aId: number; bId: number; aName: string; bName: string
  legs: [number, number][] // placares [gols de A, gols de B] de cada perna já jogada
  pens?: [number, number]  // disputa de pênaltis, se empatou no agregado
  winner: number | null    // id de quem passou (null = ainda rolando)
  lastHighlights?: MatchHighlight[] // gols do ÚLTIMO leg jogado — pro placar ao vivo
}
export interface QuickCopaState {
  phase: 'quartas' | 'semis' | 'final' | 'done'
  ties: QuickCopaTie[]  // confrontos da fase ATUAL
  legIdx: 0 | 1          // perna sendo jogada agora (final usa só a 0 — jogo único)
  bracket: { phase: 'quartas' | 'semis' | 'final'; ties: QuickCopaTie[] }[] // fases já fechadas
  champion?: { id: number; name: string; you: boolean } | null
  scorers?: ScorerRow[] // 🏆 artilharia SÓ da Copa (não mistura com a da liga)
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
  | 'streamIntro'
  | 'auction'
  | 'monte'
  | 'cerimonia'
  | 'reserveList'
  | 'season'
  | 'end'
  | 'album'
  | 'ranking'

export type OnlineMode = 'cpu' | 'online'

// modo carreira (solo): sobe/desce entre divisões e salva o progresso
export type Division = 'A' | 'B' | 'C' | 'D' | 'V' // 'V' = Várzea (só carreira nova com escada — teste do Diego)

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
  // 🏀 esporte da partida atual: ausente/'futebol' = futebol (padrão, tudo como
  // hoje); 'basquete' = BidLegends. Só metadado — o motor usa o mesmo fluxo.
  sport?: 'futebol' | 'basquete'
  // 🏀 carreira do basquete (Street League): true = é carreira (salva, avança
  // temporada, leilão de reservas cresce 5→10→15); ausente/false = jogo rápido.
  nbaCareer?: boolean
  // 🏀 andar da pirâmide do basquete: 'street' (base) → 'gleague' → 'nba' (topo).
  // Sobe quando você termina no top 4. Muda os adversários (crews→afiliados→franquias).
  nbaTier?: 'street' | 'gleague' | 'nba'
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
  restartReadyUids?: string[]   // 🤝 crachás de quem já disse 'estou pronto' no novo pregão — numa dupla os DOIS precisam
  presenceUids?: string[]      // 🤝 crachás online — numa dupla os dois dividem o mesmo assento, então só o id do técnico não diz QUEM está aí
  // sala
  managers: Manager[]
  youIdx: number
  // 🤝 DUPLAS — tudo opcional: sala que não é de duplas nunca vê nada disso.
  duplasMode?: boolean            // a SALA foi criada no modo "Duplas (beta)"
  duplas?: Record<number, DuplaSeat> // mgrId → a dupla daquele assento
  // ⚠️ IDENTIDADE — LOCAL a cada aparelho, igual ao youIdx: NUNCA sincroniza.
  // É o meu user_id; é ele que diz se EU mando na categoria da vez.
  youUid?: string
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
  clubCash?: Record<string, number> // carreira online: caixa dos OUTROS times (CPUs + reservas de fundo, tudo que não é humano/fiador), por teamKey. Base por divisão + título/acesso/queda. Aparece no ranking pra todo time ter grana real.
  careerHonors?: Record<string, { A: number; B: number; C: number; D: number; V?: number }> // carreira online: títulos por divisão de CADA time (chave = m<id> humano / nome do CPU), acumulados por temporada; base do Ranking
  locked?: boolean // sala fechada (com senha) — guardado no estado pra sobreviver ao autosave
  pwHash?: string // hash da senha da sala (SHA-256) — idem
  reserveAuction?: boolean // carreira online: o leilão em curso é o de RESERVAS (mantém elenco, mira 22, orçamento = caixa). No fim, sincroniza a caixa e tira o elenco fundo.
  reserveListed?: Record<number, string[]> // carreira online: cartas que cada técnico LISTOU pro leilão (mgrId → ids), escolhidas na tela de venda (45s)
  reserveListMesmo?: boolean // 🔒 a tela de venda (reserveList) atual veio do voto "mesmo time" — só decide contrato, sem mercado/leilão depois (CONFIRM_MESMO_TIME fecha)
  careerLineup?: Record<number, Record<number, string[]>> // carreira online: escalação (XI) POR JOGO (mgrId → rodada → ids dos 11 titulares); vale da rodada em diante, como a tática
  marketValues?: Record<string, number> // carreira online: LIVRO DE PREÇOS global (nome do jogador → último preço). Toda venda/lance vencedor e ida ao monte atualiza; todo baralho novo consulta pra carimbar o piso. Assim o valor de cada jogador é memória do jogo inteiro (ex.: Kaká vendido 30 → monte 15 → volta valendo 15).
  marketLog?: string[] // carreira online: resumo do que os BOTS fizeram no leilão/monte (arrematou X, pegou Y de graça, comprou o listado Z por W) — mostrado na cerimônia pra dar visibilidade. Zera a cada leilão.
  booksSeason?: number // 💰 temporada cujo FECHAMENTO financeiro (prêmios, bilheteria, patrocínio, empresário, folha) já foi lançado no caixa. Trava anti-duplicidade: a contabilidade roda UMA vez, assim que a temporada+copas acabam.
  careerLedger?: LedgerEntry[] // 🧾 carreira SOLO: livro-caixa (extrato + transferências) — só exibição, nunca realimenta o caixa. Cresce ao longo da carreira; limitado às últimas ~250 entradas.
  careerLedgers?: Record<number, LedgerEntry[]> // 🧾 carreira ONLINE: livro-caixa por técnico (mgrId → extrato). Offline usa careerLedger (single).
  // 🤝 PATROCÍNIO POR APOSTA (05/08, substitui o antigo "marca fixa por divisão"):
  // toda temporada o técnico aposta num nível de meta (não cair · top 4 · campeão).
  // Bate a meta escolhida → ganha o valor dela; fica AQUÉM → zero; supera → só o
  // valor apostado mesmo assim (vale pra solo E online — chave é sempre o mgrId).
  careerSponsorBet?: Record<number, { tier: 1 | 2 | 3; brandId: string; season: number }> // aposta da temporada ATUAL (pro banner de início não mostrar de novo se já escolheu)
  careerSponsorResult?: Record<number, { season: number; tier: 1 | 2 | 3; brandId: string; hit: boolean; amount: number }> // resultado da temporada PASSADA (bateu?/quanto rendeu) — pro banner de resultado
  empresarioCards?: EmpCard[] // 💼 carreira SOLO: agência do Empresário — cartas ganhas no pacote de campeão desta carreira (começa vazia). Rende por temporada por raridade (categorias destravam com estádio/SAF). Aceita REPETIDAS (o álbum geral ignora; a agência do save conta).
  empresarioClaimKeys?: string[] // 💼 idempotência: seasonKeys dos pacotes já registrados na agência (o pacote reoferece a carta no reload, então dedup por temporada, não por carta).
  careerEmpresario?: Record<number, EmpCard[]> // 💼 carreira ONLINE: agência do Empresário por técnico (mgrId → cartas). Offline usa empresarioCards.
  careerEmpresarioClaims?: Record<number, string[]> // 💼 idempotência da agência online, por técnico.
  careerEra?: number // 🎮 carreira SOLO: "geração" da carreira. Ausente = carreira ANTIGA (começou antes da cobrança do Modo Manual) → manual liberado pra sempre (grandfather). Preenchido = carreira NOVA, o manual pede o apoio. Nunca mexe em save antigo.
  marketSellers?: Record<Sector, number[]> // carreira online: por posição, os ids dos BOTS que perderam um jogador pro mercado neste leilão — são justamente eles que podem dar lance NAQUELA posição (rebuscar o que perderam), quando 0 ou 1 humano oferta.
  seasonVotes?: Record<number, 'leilao' | 'mesmo'> // carreira online: no fim da temporada cada humano vota entre abrir o leilão de transferências ou seguir com o mesmo time. O host só inicia quando todos votam; empate → o voto do host decide. Zera ao iniciar a próxima temporada.
  careerScorersAll?: Record<string, { name: string; teamName: string; teamId: number; div: 'A' | 'B' | 'C' | 'D' | 'V'; goals: number; you: boolean; human: boolean }> // carreira online: artilharia de TODOS OS TEMPOS (gols somados de cada jogador entre as temporadas), por nome. Alimenta a aba Rank › Artilheiros.
  statsSeason?: number // carreira online: última temporada cujos artilheiros já foram somados no acumulado (evita contar 2x)
  lastResults: MatchResult[] // resultados da última rodada simulada
  news: string[] // manchetes (dias inspirados etc.)
  champion: number | null
  // 🏆 COPA DOS 8 (modo rápido — online e offline): escolhida na criação da
  // sala/jogo. 'liga_copa' (padrão) roda a Copa logo que a liga termina, antes
  // da votação; 'liga' pula direto pro fim, como sempre foi.
  copaMode?: 'liga' | 'liga_copa'
  ligaFechada?: boolean // 🏆 LIGA FECHADA: sala online só com os humanos, SEM bots na tabela. A liga tem o tamanho da galera (returno duplo); ímpar folga. Copa só destrava com 8+.
  quickCopa?: QuickCopaState | null
  phaseDeadline: number | null // timestamp (ms) do fim do envelope
  monteDeadline: number | null // timestamp (ms) do fim da vez atual no Monte (online)
  cerimoniaDeadline: number | null // timestamp (ms) do fim da cerimônia (auto-começa o campeonato)
  cpuAtkAdj: number // ajuste de força dos CPUs (online): escala os bots à média dos humanos
  cpuDefAdj: number
  streamMode: boolean // sala de stream: esconde os VALORES dos lances na tela (pra live)
  // 🎮 sala em MODO MANUAL: o host ganha o botão manual/auto DENTRO do jogo (igual
  // stream), pra decidir avançar cada rodada/etapa ou deixar no automático. NÃO
  // esconde valores (isso é só do stream). Escolhido na criação; 'auto' (padrão) = online normal.
  manualRoom?: boolean
  // 💬 chat da sala: o HOST decide ligar/desligar. Padrão = ligado (undefined/false).
  // true = o host desligou o chat pra sala toda. Sincroniza via estado.
  chatOff?: boolean
  // ⏱️ TEMPO DO LEILÃO (pregão) por envelope, escolhido pelo host na criação da sala.
  // undefined = padrão (45s). N>0 = N segundos. 0 = SEM cronômetro: o host avança
  // cada envelope no botão e todo mundo segue sincronizado (só online).
  auctionSecs?: number
  // ⏩ velocidade da simulação (só quando o passo é do host/você — modo manual/stream
  // ou solo). Multiplicador do ritmo: 1 = normal (padrão), <1 = mais devagar (0.5=2×
  // devagar, 0.25=4×), >1 = mais rápido (2=2×, 4=4×). Sincroniza via estado pra os
  // relógios das partidas baterem igual pra todo mundo na sala.
  simSpeed?: number
  // 🎥 modo stream: a carta que o campeão tirou (liga/copa) fica AQUI e vai pra
  // sala inteira via broadcast — todo mundo vê e pode abrir o pacote do campeão.
  // Quem não é campeão só assiste (não grava no álbum). null/vazio = ainda não abriu.
  streamChampCard?: { liga?: WonCard | null; copa?: WonCard | null } | null
  deckLeague: 'br' | 'eu' | 'both' | 'todos' // baralho escolhido ('todos' = BR+Europa+Mundo — carreira, teste do Diego): 🇧🇷 Brasileirão, 🌍 Liga Europa ou 🌎 os dois juntos (both = só na carreira online)
  varzea?: boolean // 🥅 rápido online + baralho BR, categoria "Sem craques": leilão só com bom jogador + foi profissional
  contratosOn?: boolean // 📝 CONTRATOS de jogador ligados NESTA carreira. Só carreira NOVA nasce com true (decisão do Diego) — save antigo fica sem contratos pra sempre (nada muda no meio da carreira de ninguém)
  // 🕴️ AGÊNCIA 2.0 (carreira solo NOVA): o técnico convoca até 22 cartas do
  // ÁLBUM dele pra "ativa" — só elas rendem (mensalidade por categoria + bônus
  // folclórico) e pagam comissão por acontecimento (artilheiro/campeão/transação).
  // A renda cai SEMPRE no caixa do 1º clube (decisão do Diego), mesmo dormindo.
  agenciaOn?: boolean // ligada SÓ em carreira solo NOVA (save antigo segue com o empresário clássico)
  agenciaClubeId?: number // clube que recebe a renda da agência (nasce = 1º clube; com 2º clube o dono troca no toggle)
  agenciaDividir?: boolean // 🤝 com 2 clubes: renda da agência meio a meio (moeda ímpar → clube no comando)
  agenciados?: AgCard[] // os até 22 convocados "na ativa" (escolhidos do álbum)
  agenciaEventos?: { season: number; rows: AgEvento[]; eventosDone?: boolean } // eventos PENDENTES da temporada (artilheiro/campeão) — pagos na virada
  agenciaFatura?: { season: number; mensal: number; rows: AgEvento[]; total: number } // fatura JÁ PAGA (mensalidades + comissões) — vira o quadro da Cerimônia/aba
  agenciaHist?: Record<string, number> // acumulado por carta (chave name|club|year) — "já te rendeu X nesta carreira"
  // 🪜 ESCADA DE CATEGORIAS (carreira solo NOVA, teste na conta do Diego): cada
  // divisão só negocia certas categorias no leilão — V(estreia)=foi-prof+bom ·
  // D=bom+promessa · C/B=promessa+craque · A=craque+lenda — ATÉ liberar geral
  // (2 temporadas jogadas na Série A). O leilão de reservas funciona desde a 2ª
  // temporada como na carreira normal (compra; venda na 3ª) — só a régua muda.
  escadaOn?: boolean // ligada só em carreira nova de conta liberada (ESCADA)
  escadaLivre?: boolean // true = mercado liberou geral (2 temporadas na A) — vira o jogo normal pra sempre
  escadaTempA?: number // temporadas COMPLETAS jogadas na Série A (conta até 2)
  escadaSubiu?: boolean // já subiu da divisão de estreia (virou profissional)? não tranca de novo se cair
  // 🌱 CRIA DA BASE (contratos): "deixar ir" marcado na janela de renovação;
  // se a saída quebrar o XI, um cria tapa o buraco (sem contrato, invendável).
  contratoRelease?: string[] // ids marcados "deixar ir" na janela atual (consumido no leilão)
  criaNames?: string[] // nomes de cria já usados NESTA carreira (nunca repete)
  criaNews?: { texto: string; nome: string; pos: Sector }[] // historinhas da virada (banner na cerimônia)
  // 🎭 EVENTOS DE JOGADOR (carreira SOLO): no MÁXIMO 1 por temporada — noitada
  // (🍾 baladeiro escolhe: banco 1 jogo ou "escalar assim mesmo" com queda
  // pequena SÓ naquele jogo), expulsão (🟥 pavio-curto, 1-3 rodadas) e lesão
  // (🩹 qualquer um, 1-5 rodadas — MORRE pra sempre com o Departamento Médico).
  // Só dispara se EXISTE reserva na posição (senão vira só manchete de zoeira,
  // nada trava). A suspensão vive em careerLineup (troca na rodada + volta na
  // rodada certa) — a formação NUNCA quebra. Morre na virada da temporada.
  eventoTemporada?: EventoAtivo | null
  eventoManchetes?: EventoManchete[] // manchetes pro jornal (página "Aconteceu na temporada") — últimas ~24
  careerDivision: Division | null // modo carreira (solo): divisão atual (null = partida rápida)
  careerOnline?: boolean // sala online no MODO CARREIRA (4 divisões) — diferencia do online "rápido"
  careerFilial?: {
    team: string; since: number; earned?: number
    titlesAtBuy?: number // 🏢 nº de títulos que o clube JÁ tinha na hora da compra — só o que ele ganhar DEPOIS conta pro valor de venda (não os títulos da vida dele antes de você)
    loanOut?: WonCard[] // jogadores SEUS emprestados PRA SAF (somem do seu elenco, jogam lá) — nº de vagas cresce com a divisão (D=1, C=2, B=3, A=4)
    loanIn?: WonCard[]  // jogadores DA SAF emprestados pra VOCÊ (jogam no seu time)
  } | null // 🏢 SAF (carreira OFFLINE, em teste): clube da Série D comprado — 50% dos prêmios de campanha dele (± em queda) caem no seu caixa
  careerFilials?: Record<number, { team: string; since: number; earned?: number; titlesAtBuy?: number; loanOut?: WonCard[]; loanIn?: WonCard[] }> // 🏢 SAF na carreira ONLINE, por técnico (mgrId → SAF). Offline usa careerFilial (single).
  filialTrimNotice?: number | null // 🏢 aviso: quantos empréstimos voltaram sozinhos na última virada por REBAIXAMENTO (SAF perdeu vaga). Some ao dispensar. null/0 = nada a avisar
  // 🏛️ MULTICLUBES (carreira SOLO, em construção — invisível pro público): 2º clube
  // comprado por 4.000 moedas (só Lenda). Igual à SAF: escolhe um clube EXISTENTE da
  // Série D, que passa a ser seu (herda nome/história, vira sua cor). O não-selecionado
  // DORME (não lista/compra/dá lance). Fase 1 = só a compra.
  // `id` = id do assento do 2º clube (manager independente). Caixa/títulos/estádio/
  // divisão são keyed por id → JÁ separados. Os campos "únicos" do solo (extrato, SAF,
  // patrocínio, agência) NÃO são keyed por id, então guardamos aqui a versão do clube
  // que está DORMINDO — troca no seletor (nada mistura entre os dois).
  multiClube?: {
    team: string; since: number; id: number
    ledger?: LedgerEntry[]; filial?: EscState['careerFilial']
    empresario?: EmpCard[]; empresarioClaims?: string[]
  } | null
  multiClubeAtivo?: boolean // true = o 2º clube está no comando (youIdx aponta pra ele); false/undefined = principal ativo
  // 🏛️ MULTICLUBES · cartas GUARDADAS: quando o clube que DORMIA foi campeão (título de
  // divisão e/ou Copa Legends), a carta fica pendente aqui, keyed pelo id do clube (já
  // separado). Ao passar o comando pra ele, o pacote aparece pra você abrir. `copa`
  // distingue a carta da Copa Legends da carta do título (podem cair as duas na mesma
  // temporada = duas entradas).
  multiClubePendingCards?: Record<number, { season: number; copa?: boolean }[]>
  simV?: number // versão da fórmula da simulação: 2+ = teto de elite 1.28 (só vale de temporada NOVA em diante — a que está rolando termina na fórmula em que começou)
  careerPlacements?: Record<string, string> | null // pirâmide: chave do time → divisão ('A'..'D'). Compacto (só a colocação). Atualiza a cada temporada.
  copaDoneSeason?: number // pirâmide: nº da temporada cuja Copa Legends JÁ foi assistida até o fim — ao retomar o save, não re-anima a Copa do zero (mostra direto os campeões/decisão).
  stadiums?: Record<number, { inv: Record<string, number>; ext: string[] }> // 🏟️ estádio da carreira por técnico (mgrId): moedas investidas por setor + melhorias prontas. Rende no fim de cada temporada.
  careerCopaHonors?: Record<string, number> // 🏆 títulos da COPA LEGENDS por time (teamKey → nº de Copas) — o campeão agora fica registrado, não só embolsa as moedas
  cpuSquads?: Record<string, Card[]> // pirâmide: a "ficha" (elenco guardado) dos 60 times de fundo, por NOME. Antes eram recalculados na hora (receita fixa); agora têm MEMÓRIA — 11 fixos que só o mercado mexe (troca), pra negociarem de verdade. Reserva de bot só quando houver mais cartas. Semeado 1x pela receita determinística.
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
  scorersPrev?: ScorerRow[] // 🙈 anti-spoiler (liga offline): foto da artilharia ANTES da rodada que está animando — a tela mostra esta até o apito

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
