import type { Nationality, Position } from '../types'

// A targeted boost within one historical event (can have multiple per event)
export interface BoostGroup {
  nationalityBoost?: Nationality
  positionBoost?: Position
  specificIds?: string[]
  valueMultiplier?: number
  happinessBonus?: number
}

export interface HistoricalEvent {
  id: string
  year: number
  week?: number        // if undefined, triggers on year rollover
  title: string
  text: string
  boosts?: BoostGroup[]       // use for events with multiple distinct groups
  nationalityBoost?: Nationality   // shorthand single-group
  positionBoost?: Position
  specificIds?: string[]
  valueMultiplier?: number
  happinessBonus?: number
  reputationBonus?: number
  moneyBonus?: number
  isDeadlineDay?: boolean
}

// Real-world events from 1993–2026 that shape the alternate timeline.
export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  // ── 1993 ──────────────────────────────────────────────────────────────────
  {
    id: 'h93_romario_fifa',
    year: 1993,
    title: 'Romário é eleito o melhor da América do Sul',
    text: '🏆 Romário: o Baixinho voa. Artilheiro do Barça, dono do mundo. Seus atacantes brasileiros ficam mais vistosos.',
    boosts: [{ nationalityBoost: 'BR', positionBoost: 'ATA', valueMultiplier: 1.12, happinessBonus: 5 }],
  },
  {
    id: 'h93_maldini_captain',
    year: 1993,
    title: 'Maldini vira capitão do Milan campeão',
    text: '🛡️ Paolo Maldini, 24 anos, lidera o Milan ao título. A defesa italiana nunca foi tão valorizada.',
    boosts: [{ nationalityBoost: 'IT', positionBoost: 'ZAG', valueMultiplier: 1.10 }],
  },

  // ── 1994 ──────────────────────────────────────────────────────────────────
  {
    id: 'h94_copa_tetra',
    year: 1994,
    title: '🇧🇷 BRASIL CONQUISTA O TETRA!',
    text: '⭐ Romário. Bebeto. Márcio Santos. O Brasil é tetracampeão nos EUA nos pênaltis. Todo brasileiro que você representa vale muito mais.',
    nationalityBoost: 'BR', valueMultiplier: 1.35, happinessBonus: 15, reputationBonus: 3,
  },
  {
    id: 'h94_weah_acl',
    year: 1994,
    title: 'George Weah explode no Paris Saint-Germain',
    text: '🦁 Weah: o rei africano conquista Paris. Atacantes africanos ganham visibilidade global.',
    boosts: [
      { specificIds: ['weah'], valueMultiplier: 1.25, happinessBonus: 10 },
      { nationalityBoost: 'LR', valueMultiplier: 1.10 },
    ],
  },

  // ── 1995 ──────────────────────────────────────────────────────────────────
  {
    id: 'h95_weah_bola_ouro',
    year: 1995,
    title: 'George Weah: Bola de Ouro — primeiro africano!',
    text: '🌍 George Weah faz história: primeiro jogador africano a ganhar o Bola de Ouro. O futebol africano nunca mais será visto da mesma forma.',
    boosts: [
      { specificIds: ['weah'], valueMultiplier: 1.40, happinessBonus: 20 },
      { nationalityBoost: 'LR', valueMultiplier: 1.15 },
    ],
  },
  {
    id: 'h95_ronaldo_psv',
    year: 1995,
    title: 'Ronaldo Fenômeno explode no PSV',
    text: '⚡ 30 gols no PSV com 18 anos. O garoto do Cruzeiro que você talvez já tenha na carteira está na boca do mundo.',
    specificIds: ['r9'], valueMultiplier: 1.35, happinessBonus: 10,
  },

  // ── 1996 ──────────────────────────────────────────────────────────────────
  {
    id: 'h96_ronaldo_barcelona',
    year: 1996,
    title: '47 gols! Ronaldo destroça a Europa pelo Barcelona',
    text: '🔥 Em apenas uma temporada no Barcelona, Ronaldo marca 47 gols e vira o maior do planeta. Qualquer atacante brasileiro da sua carteira passa a ser cobiçado.',
    boosts: [
      { specificIds: ['r9'], valueMultiplier: 1.50, happinessBonus: 15 },
      { nationalityBoost: 'BR', positionBoost: 'ATA', valueMultiplier: 1.15 },
    ],
  },
  {
    id: 'h96_euro_france',
    year: 1996,
    title: 'Euro 1996: Alemanha vence no golden goal',
    text: '🇩🇪 Bierhoff e o golden goal eterno. A Alemanha vence a Inglaterra em casa. Jogadores alemães e ingleses ganham destaque.',
    nationalityBoost: 'DE', valueMultiplier: 1.12, happinessBonus: 8,
  },

  // ── 1997 ──────────────────────────────────────────────────────────────────
  {
    id: 'h97_ronaldo_inter',
    year: 1997,
    title: 'Ronaldo: €19M — recorde mundial. Inter de Milão aposta tudo',
    text: '💰 O Fenômeno vai pro Inter pelo maior valor da história. O mercado enlouquece: atacantes elite valem cada vez mais.',
    specificIds: ['r9'], valueMultiplier: 1.45, happinessBonus: 10,
  },
  {
    id: 'h97_zidane_juventus',
    year: 1997,
    title: 'Zidane lidera a Juventus ao topo da Europa',
    text: '✨ La Juve domina a Champions. Zidane é o maestro. Jogadores franceses começam a chamar atenção de toda a Europa.',
    nationalityBoost: 'FR', valueMultiplier: 1.12, happinessBonus: 5,
  },

  // ── 1998 ──────────────────────────────────────────────────────────────────
  {
    id: 'h98_copa_franca',
    year: 1998,
    title: '🇫🇷 França vence a Copa do Mundo em casa. Zizou faz dois!',
    text: '⭐ Zidane marca dois gols na final. Petit assina o terceiro. Deschamps levanta a taça. A seleção francesa é a melhor do mundo.',
    nationalityBoost: 'FR', valueMultiplier: 1.30, happinessBonus: 15, reputationBonus: 2,
  },
  {
    id: 'h98_ronaldo_misterio',
    year: 1998,
    title: 'Ronaldo: o mistério da final de 1998',
    text: '❓ Ronaldo entra, mas não está bem. O Brasil perde a final. Você conhece a verdade sobre o que aconteceu naquele hotel...',
    specificIds: ['r9'], valueMultiplier: 0.85, happinessBonus: -10,
  },

  // ── 1999 ──────────────────────────────────────────────────────────────────
  {
    id: 'h99_manchester_champions',
    year: 1999,
    title: 'United vence a Champions em Barcelona com 2 gols nos acréscimos!',
    text: '🏆 Sheringham e Solskjær. A virada mais louca da Champions. Jogadores ingleses da carteira explodem de valor.',
    nationalityBoost: 'EN', valueMultiplier: 1.15, happinessBonus: 8,
  },
  {
    id: 'h99_rivaldo_bola_ouro',
    year: 1999,
    title: 'Rivaldo: Bola de Ouro 1999',
    text: '⭐ Rivaldo reina no Barça. Melhor do mundo. Seus meias-atacantes brasileiros ficam na mira de toda a Europa.',
    specificIds: ['rivaldo'], valueMultiplier: 1.40, happinessBonus: 15,
  },

  // ── 2000 ──────────────────────────────────────────────────────────────────
  {
    id: 'h00_figo_real',
    year: 2000,
    title: 'Figo vai do Barça pro Real por €60M — recorde!',
    text: '💸 Luis Figo faz o maior transfer da história. O Real Madrid de Florentino Pérez inicia a era dos galácticos. O mercado vai às alturas.',
    specificIds: ['figo'], valueMultiplier: 1.50, happinessBonus: 5,
    reputationBonus: 2, moneyBonus: 50000,
  },
  {
    id: 'h00_euro_franca',
    year: 2000,
    title: 'França vence o Euro 2000 — a seleção mais completa da história',
    text: '🥇 Zidane, Henry, Trezeguet. A France vence mais um torneio. Jogadores franceses valem ouro.',
    nationalityBoost: 'FR', valueMultiplier: 1.20, happinessBonus: 10,
  },

  // ── 2001 ──────────────────────────────────────────────────────────────────
  {
    id: 'h01_zidane_real',
    year: 2001,
    title: 'Zinedine Zidane vai pro Real Madrid por €75M — novo recorde!',
    text: '✨ Zidane se torna o jogador mais caro do mundo. Os galácticos explodem. Meias e atacantes de elite entram numa outra liga de valor.',
    specificIds: ['zizou'], valueMultiplier: 1.50, happinessBonus: 12,
    reputationBonus: 3, moneyBonus: 80000,
  },

  // ── 2002 ──────────────────────────────────────────────────────────────────
  {
    id: 'h02_copa_penta',
    year: 2002,
    title: '🇧🇷 BRASIL PENTA! Ronaldo marca dois na final!',
    text: '⭐⭐⭐⭐⭐ Ronaldo exorciza 98 com dois gols contra a Alemanha. O Brasil é pentacampeão. Você sabia que isso ia acontecer — e apostou certo.',
    nationalityBoost: 'BR', valueMultiplier: 1.35, happinessBonus: 20,
    reputationBonus: 5, moneyBonus: 100000,
  },
  {
    id: 'h02_ronaldo_ressurreicao',
    year: 2002,
    title: 'Ronaldo Fenômeno: de lesionado a campeão do mundo',
    text: '💪 Em 2000, todos achavam que o Fenômeno tinha terminado. Em 2002, ele é artilheiro da Copa. Quem tinha fé — e você tinha — está rindo.',
    specificIds: ['r9'], valueMultiplier: 1.55, happinessBonus: 25,
  },

  // ── 2003 ──────────────────────────────────────────────────────────────────
  {
    id: 'h03_beckham_real',
    year: 2003,
    title: 'David Beckham troca o United pelo Real Madrid',
    text: '📸 Beckham galáctico. A camisa 23 já estava reservada. O estilo vira lucro: jogadores "marca" valem ainda mais.',
    specificIds: ['beckham'], valueMultiplier: 1.30, happinessBonus: 8,
  },
  {
    id: 'h03_henry_arsenal',
    year: 2003,
    title: 'Henry lidera o Arsenal invicto — os "Invencíveis"',
    text: '🔴 O Arsenal de Wenger termina a temporada sem perder. Thierry Henry é o melhor do mundo. Atacantes franceses nunca foram tão cobiçados.',
    boosts: [
      { specificIds: ['henry'], valueMultiplier: 1.35, happinessBonus: 12 },
      { nationalityBoost: 'FR', positionBoost: 'ATA', valueMultiplier: 1.12 },
    ],
  },

  // ── 2004 ──────────────────────────────────────────────────────────────────
  {
    id: 'h04_grecia_euro',
    year: 2004,
    title: 'Grécia vence o Euro 2004 — o maior azarão da história',
    text: '😱 Otto Rehhagel. A Grécia elimina Portugal, República Checa e França. Ninguém acreditou. Você sim — talvez.',
    reputationBonus: 1,
  },
  {
    id: 'h04_rooney_euro',
    year: 2004,
    title: 'Rooney explode no Euro 2004 com 18 anos',
    text: '⚡ Wayne Rooney chuta e passa — o menino de Croxteth é o maior fenômeno da Europa. Jovens atacantes ingleses entram no radar de todo mundo.',
    boosts: [{ nationalityBoost: 'EN', positionBoost: 'ATA', valueMultiplier: 1.12 }],
  },

  // ── 2005 ──────────────────────────────────────────────────────────────────
  {
    id: 'h05_istanbul',
    year: 2005,
    title: '🔴 LIVERPOOL! 3-0 pro 3-3 — a virada de Istambul',
    text: '🏆 Gerrard, Smicer, Alonso. O Liverpool supera o impossível. Jogadores ingleses da carteira ganham bônus histórico de exposição.',
    boosts: [
      { specificIds: ['gerrard'], valueMultiplier: 1.30, happinessBonus: 15 },
      { nationalityBoost: 'EN', valueMultiplier: 1.12, happinessBonus: 8 },
    ],
  },

  // ── 2006 ──────────────────────────────────────────────────────────────────
  {
    id: 'h06_copa_italia',
    year: 2006,
    title: '🇮🇹 Itália vence a Copa — Zidane termina com a cabeçada',
    text: '😤 Materazzi provoca, Zidane perde a cabeça. Grosso converte. A Azzurra é campeã. E Zidane encerra a carreira mais lembrado pela cabeçada do que pelos gols.',
    boosts: [
      { nationalityBoost: 'IT', valueMultiplier: 1.25, happinessBonus: 12 },
      { specificIds: ['zizou'], valueMultiplier: 0.90, happinessBonus: -5 },
    ],
  },

  // ── 2007 ──────────────────────────────────────────────────────────────────
  {
    id: 'h07_kaka_champions',
    year: 2007,
    title: 'Kaká: Champions, Bola de Ouro — o rei do mundo',
    text: '✝️ "Pertença a Deus." Kaká lidera o Milan à Champions e vence o Bola de Ouro. Jogadores brasileiros de elite entram no pico de valor.',
    boosts: [
      { specificIds: ['kaka'], valueMultiplier: 1.50, happinessBonus: 20 },
      { nationalityBoost: 'BR', valueMultiplier: 1.12, happinessBonus: 5 },
    ],
  },

  // ── 2008 ──────────────────────────────────────────────────────────────────
  {
    id: 'h08_euro_espanha',
    year: 2008,
    title: 'Torres marca! Espanha vence o Euro 2008',
    text: '🇪🇸 La Furia Roja inicia a era de domínio. Torres atravessa Casillas. A Espanha não perde mais. Jogadores espanhóis e meias valem fortunas.',
    nationalityBoost: 'ES', valueMultiplier: 1.20, happinessBonus: 12,
  },
  {
    id: 'h08_cr7_bola_ouro',
    year: 2008,
    title: 'Cristiano Ronaldo: Bola de Ouro. €80M do United pro Madrid',
    text: '👑 CR7 vence o Bola de Ouro e vai pro Real por €80M — novo recorde. O mercado de atacantes está na estratosfera.',
    boosts: [
      { specificIds: ['cr7'], valueMultiplier: 1.50, happinessBonus: 15 },
      { positionBoost: 'ATA', valueMultiplier: 1.15 },
    ],
  },

  // ── 2009 ──────────────────────────────────────────────────────────────────
  {
    id: 'h09_barcelona_sexteto',
    year: 2009,
    title: 'Barcelona de Guardiola: seis títulos em um ano — inédito!',
    text: '💙❤️ Messi, Xavi, Iniesta. O Barça vence tudo em 2009. A escola catalã domina o futebol mundial. Meias e atacantes espanhóis explodem.',
    boosts: [
      { specificIds: ['messi', 'iniesta', 'xavi'], valueMultiplier: 1.40, happinessBonus: 15 },
      { nationalityBoost: 'ES', valueMultiplier: 1.25, happinessBonus: 10 },
    ],
  },

  // ── 2010 ──────────────────────────────────────────────────────────────────
  {
    id: 'h10_copa_espanha',
    year: 2010,
    title: '🇪🇸 Espanha vence a Copa do Mundo! Iniesta decide no extra-time',
    text: '💃 O gol de Iniesta contra a Holanda. Espanha é campeã mundial pela primeira vez. Uma geração dourada que você acompanhou desde o início.',
    boosts: [
      { specificIds: ['iniesta', 'xavi', 'casillas', 'torres'], valueMultiplier: 1.45, happinessBonus: 20 },
      { nationalityBoost: 'ES', valueMultiplier: 1.30, happinessBonus: 15 },
    ],
    reputationBonus: 4, moneyBonus: 80000,
  },

  // ── 2012 ──────────────────────────────────────────────────────────────────
  {
    id: 'h12_euro_espanha',
    year: 2012,
    title: '🇪🇸 Espanha tri no Euro 2012 — domínio total',
    text: '⭐⭐⭐ A Espanha vence o Euro pela segunda vez consecutiva. O tiki-taka reina. Jogadores espanhóis nunca foram tão valiosos.',
    nationalityBoost: 'ES', valueMultiplier: 1.20, happinessBonus: 15,
    reputationBonus: 2,
  },
  {
    id: 'h12_chelsea_champions',
    year: 2012,
    title: 'Chelsea vence a Champions nos pênaltis em casa do Bayern',
    text: '💙 Drogba. Um homem sozinho. O Chelsea bate o Bayern em Munique. Atacantes africanos ganham destaque global.',
    specificIds: ['drogba'], valueMultiplier: 1.35, happinessBonus: 15,
  },

  // ── 2014 ──────────────────────────────────────────────────────────────────
  {
    id: 'h14_7x1',
    year: 2014,
    title: '😱 7x1. A Alemanha humilha o Brasil em Belo Horizonte',
    text: '💔 Mineirazo. Sem Neymar, sem Thiago Silva, o Brasil leva 5 gols em 18 minutos. Um trauma nacional. Jogadores brasileiros têm queda temporária de valor.',
    boosts: [
      { nationalityBoost: 'BR', valueMultiplier: 0.85, happinessBonus: -15 },
      { nationalityBoost: 'DE', valueMultiplier: 1.25 },
    ],
  },
  {
    id: 'h14_copa_alemanha',
    year: 2014,
    title: '🇩🇪 Alemanha é Campeã do Mundo! Götze decide no extra-time',
    text: '⭐ Götze recebe de Schürrle e bate de peito. A Alemanha é Tetracampeã. Uma geração coletiva bate a Argentina de Messi.',
    nationalityBoost: 'DE', valueMultiplier: 1.30, happinessBonus: 15, reputationBonus: 3,
  },

  // ── 2016 ──────────────────────────────────────────────────────────────────
  {
    id: 'h16_euro_portugal',
    year: 2016,
    title: '🇵🇹 Portugal vence o Euro! Ronaldo lesionado grita da beira do campo',
    text: '💪 Eder, improvávelmente, marca no extra-time. Portugal é campeão europeu. Ronaldo chora e dirige o time de fora. Jogadores portugueses explodem.',
    boosts: [
      { nationalityBoost: 'PT', valueMultiplier: 1.25, happinessBonus: 12 },
      { specificIds: ['cr7'], happinessBonus: 15 },
    ],
  },

  // ── 2018 ──────────────────────────────────────────────────────────────────
  {
    id: 'h18_copa_franca',
    year: 2018,
    title: '🇫🇷 França vence a Copa 2018! Mbappé tem 19 anos',
    text: '⭐⭐ Pogba, Griezmann, Mbappé. A France é bi-campeã. Uma nova geração francesa está dominando o mundo — você sabia disso há 25 anos.',
    nationalityBoost: 'FR', valueMultiplier: 1.30, happinessBonus: 18, reputationBonus: 4,
  },

  // ── 2020 ──────────────────────────────────────────────────────────────────
  {
    id: 'h20_covid',
    year: 2020,
    title: '🦠 COVID-19 paralisa o futebol mundial',
    text: '⚠️ Jogos suspensos, ligas paralisadas. O mercado de transferências congela. Todos os jogadores da sua carteira perdem valor temporariamente.',
    // Affects all clients: just use a position-agnostic drop
    valueMultiplier: 0.82, happinessBonus: -8,
  },

  // ── 2021 ──────────────────────────────────────────────────────────────────
  {
    id: 'h21_copa_america_arg',
    year: 2021,
    title: '🇦🇷 Argentina vence a Copa América após 28 anos! Messi chora',
    text: '💙🤍 No Maracanã, Argentina bate o Brasil. Messi tem seu primeiro título com a Seleção. O alívio de uma nação. Jogadores argentinos explodem.',
    boosts: [
      { specificIds: ['messi', 'aguero', 'tevez', 'higuain'], valueMultiplier: 1.35, happinessBonus: 20 },
      { nationalityBoost: 'AR', valueMultiplier: 1.25, happinessBonus: 15 },
    ],
  },

  // ── 2022 ──────────────────────────────────────────────────────────────────
  {
    id: 'h22_copa_argentina',
    year: 2022,
    title: '🇦🇷 ARGENTINA CAMPEÃ! Messi tem sua Copa do Mundo',
    text: '👑 Messi contra Mbappé. A final mais épica da história. Argentinos nos pênaltis. Lionel Messi finalmente tem sua Copa. Quem apostou nele desde 1993 é lenda.',
    boosts: [
      { specificIds: ['messi'], valueMultiplier: 1.50, happinessBonus: 25 },
      { nationalityBoost: 'AR', valueMultiplier: 1.35, happinessBonus: 20 },
    ],
    reputationBonus: 5, moneyBonus: 200000,
  },

  // ── 2026 ──────────────────────────────────────────────────────────────────
  {
    id: 'h26_copa_final',
    year: 2026,
    title: 'Copa do Mundo 2026 — os Estados Unidos sediam',
    text: '🌎 A Copa chega à América do Norte. Três países, 48 seleções. O maior torneio da história está chegando — e seu último capítulo também.',
    reputationBonus: 2,
  },
]

// ── DEADLINE DAY WEEKS ─────────────────────────────────────────────────────
// January window closes week 8, summer window closes week 34
export const DEADLINE_WEEKS = [8, 34]

export function isDeadlineDay(week: number): boolean {
  return DEADLINE_WEEKS.includes(week)
}

export function getHistoricalEvents(year: number, week?: number): HistoricalEvent[] {
  return HISTORICAL_EVENTS.filter(e =>
    e.year === year && (week === undefined ? e.week === undefined : e.week === week)
  )
}
