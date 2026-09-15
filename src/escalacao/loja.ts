// ─── 🛍️ LOJA DO CLUBE — dados e contas (módulo PURO, sem React) ──────────
// Aprovado pelo Diego em 15/09 e liberado pra TODO MUNDO no mesmo dia (a trava mora em
// `sport.ts`, `LOJA_GERAL`).
//
// A ideia: a torcida compra camisa, e isso vira moeda por temporada. Tudo sai de
// coisa que o jogo JÁ mede — estádio construído e colocação final —, então não há
// "renda solta" e a tela consegue mostrar a conta inteira.
//
// Proposta e histórico completos: `docs/proposta-loja-clube.md`.

import { STADIUM_SECTORS, sectorPct, hasExtra, type StadiumSave } from './estadiodata'

// ══════════════════════════════════════════════════════════════════════════
// 👟 FORNECEDOR DE MATERIAL ESPORTIVO
// ══════════════════════════════════════════════════════════════════════════
// Palavras do Diego (15/09): *"o fornecedor de material esportivo deve ser
// parecido com o estilo do patrocinador Master, em relação a temporadas que se
// escolhe 1, 2, 3 e 5. Só que moedas menos que o Master. E também tem aumento em
// relação à divisão que vai participar quando começar a temporada e tiver sem
// contrato… igual do Master, e não quebra contrato também mas que tenha subido ou
// caído"*.
//
// Então é a MESMA mecânica do Master (`MASTER_PRAZOS`/`masterPorTemporada` em
// `estadiodata.ts`), trocando só a base:
//   · 4 marcas, prazo FIXO em cada uma (1 · 2 · 3 · 5 temporadas);
//   · o valor POR TEMPORADA sai da divisão em que ASSINOU e CONGELA até o fim —
//     subiu ou caiu, o contrato não quebra;
//   · proposta nova só quando o contrato acaba, aí com a divisão do momento;
//   · no meio do contrato NÃO há nada pra decidir (não atrasa a virada).
//
// Base = ≈62% da do Master (V2 D4 C8 B16 A32). Fica menor de propósito: o
// fornecedor ainda paga a segunda perna, o bônus nas vendas da loja.
// 🔼 15/09, duas ordens dele no mesmo dia:
//   · *"aumente um pouco mais o valor ganho de fornecedor de material esportivo,
//     quase nada a mais"* → toda a régua subiu ~20% (B 10→12 · A 20→24);
//   · *"da Várzea até a Série C também aumente um pouco mais… mas quase nada"* →
//     esses três subiram um degrau a mais (V 1→2 · D 2→3 · C 5→6).
// A regra de sempre continua de pé e está no teste: o fornecedor paga MENOS que o
// Master em TODA divisão e TODO prazo.
export const FORN_BASE: Record<string, number> = { V: 2, D: 3, C: 6, B: 12, A: 24 }

/** quanto o fornecedor paga POR TEMPORADA, num contrato de `anos` fechado na divisão `div`.
 *  Mesma fórmula do Master — se a régua do Master mudar um dia, esta anda junto de propósito. */
export function fornPorTemporada(div: string, anos: number): number {
  return Math.round((FORN_BASE[div] ?? 0) * (1.25 + (anos - 1) / 2))
}

export interface Fornecedor {
  id: string; nome: string; simb: string; anos: number
  /** bônus nas vendas da loja (0.30 = +30%) */
  loja: number
  /** divisão a partir da qual a marca bate na porta */
  desde: string
  cor: string
}
// 🏷️ Nome cômico no estilo das marcas de verdade (pedido dele), mas **símbolo
// NEUTRO**: o jogo não imita o desenho da Nike/Adidas/Puma. Só o nome é paródia.
export const FORNECEDORES: Fornecedor[] = [
  { id: 'penalti', nome: 'Pênalti do Bairro', simb: '⚡', anos: 1, loja: 0.10, desde: 'V', cor: '#8A1E1E' },
  { id: 'adibas', nome: 'Adibas', simb: '◣', anos: 2, loja: 0.20, desde: 'V', cor: '#0E3E86' },
  { id: 'pumba', nome: 'Pumba', simb: '🐆', anos: 3, loja: 0.30, desde: 'D', cor: '#B5651D' },
  { id: 'naique', nome: 'Naique', simb: '✓', anos: 5, loja: 0.45, desde: 'B', cor: '#1B7A3D' },
]
export const ORDEM_DIV = ['V', 'D', 'C', 'B', 'A']
/** a marca já procura clube desta divisão? (o degrau de ambição — marca grande só
 *  bate na porta de quem subiu; a trava na tela explica o porquê e o caminho) */
export function fornLiberado(f: Fornecedor, div: string): boolean {
  return ORDEM_DIV.indexOf(div) >= ORDEM_DIV.indexOf(f.desde)
}
export function fornecedorDe(id?: string): Fornecedor | undefined {
  return FORNECEDORES.find(f => f.id === id)
}

export interface FornContrato { fornId: string; anos: number; div: string; desde: number; porTemporada: number }
/** o contrato cobre a temporada `seasonNo`? (desde … desde+anos−1) */
export function fornAtivo(c: FornContrato | undefined, seasonNo: number): c is FornContrato {
  return !!c && seasonNo >= c.desde && seasonNo < c.desde + c.anos
}
/** temporada corrente DENTRO do contrato (1 = primeira) — só pra tela */
export function fornAnoAtual(c: FornContrato, seasonNo: number): number {
  return Math.min(c.anos, Math.max(1, seasonNo - c.desde + 1))
}
/** o que o contrato paga por temporada HOJE (refaz a conta pela divisão congelada,
 *  como o Master faz — assim um ajuste de régua vale pra quem já assinou) */
export function fornValor(c: FornContrato): number {
  return Math.max(c.porTemporada ?? 0, fornPorTemporada(c.div, c.anos))
}

// ══════════════════════════════════════════════════════════════════════════
// 👥 TORCIDA — vem do ESTÁDIO CONSTRUÍDO
// ══════════════════════════════════════════════════════════════════════════
// Pedido dele: *"o tamanho da torcida deve ser com base no estádio, de coisas que
// é construído"*. Assentos de hoje: Geral 21.500 · Cadeiras 18.500 · Visitante
// 22.838 · Camarote 16.000 = 78.838. Mais um piso: clube nenhum tem torcida zero.
export const TORCIDA_PISO = 12_000
export function torcidaDoEstadio(st: StadiumSave | undefined): number {
  let assentos = 0
  for (const s of STADIUM_SECTORS) assentos += Math.round(s.seats * sectorPct(st, s.k) / 100)
  return TORCIDA_PISO + assentos
}

// 🏬 obras que levam gente pra loja (todas já existem em `STADIUM_EXTRAS`).
// A 🛍️ Loja do Clube NÃO está aqui porque ela é a PORTA: sem ela não há loja.
export const OBRAS_LOJA: Record<string, number> = {
  telao: .04, estac: .06, praca: .10, chopp: .06, estacao: .08, hotel: .10, retratil: .06,
}
export const OBRAS_TETO = 0.50
export function bonusObras(st: StadiumSave | undefined): number {
  let b = 0
  for (const k of Object.keys(OBRAS_LOJA)) if (hasExtra(st, k)) b += OBRAS_LOJA[k]
  return Math.min(OBRAS_TETO, b)
}
/** a loja existe? (a obra 🛍️ Loja do Clube, que já é do estádio desde sempre) */
export function lojaConstruida(st: StadiumSave | undefined): boolean { return hasExtra(st, 'loja') }

// ══════════════════════════════════════════════════════════════════════════
// 💰 O PREÇO É UMA APOSTA — 3 faixas, e quem cai não vende nada
// ══════════════════════════════════════════════════════════════════════════
// Ideia do Diego: *"se escolher o mais caro da camisa e disputar pra não cair, ele
// se ferra. Ele teria ganho mais se escolhesse a moeda menor"*. E logo em seguida
// ele mesmo enxugou: *"muita confusão, acho que tem que ter só: se manteve,
// classificação zona, ou campeão. Caiu não vendeu nada"*.
//
// São as MESMAS 3 metas do Patrocinador Pontual (o jogador já conhece a régua), e
// 🔴 CAIU não é uma 4ª faixa: é o ZERO.
export type FaixaLoja = 'campeao' | 'acesso' | 'manteve' | 'caiu'
export const FAIXA_META: Record<FaixaLoja, { emoji: string; txt: string; sub: string }> = {
  campeao: { emoji: '👑', txt: 'CAMPEÃO', sub: '1º lugar' },
  acesso: { emoji: '📈', txt: 'CLASSIFICAÇÃO', sub: '2º ao 4º' },
  manteve: { emoji: '🛡️', txt: 'SE MANTEVE', sub: '5º ao 16º' },
  caiu: { emoji: '🔴', txt: 'CAIU', sub: '17º ao 20º' },
}
/** em que faixa a temporada terminou, pela colocação final */
export function faixaDaPos(pos: number): FaixaLoja {
  if (pos <= 1) return 'campeao'
  if (pos <= 4) return 'acesso'
  if (pos <= 16) return 'manteve'
  return 'caiu'
}

export type PrecoLoja = 'popular' | 'normal' | 'cara'
export interface PrecoMeta {
  nome: string; moeda: number
  /** de cada 100 torcedores, quantos levam a camisa */
  compram: number
  /** moedas que sobram pro clube a cada 100 camisas */
  margem: number
  /** a curva DESTE preço pelas 3 faixas — é aqui que mora a aposta */
  curva: Record<Exclude<FaixaLoja, 'caiu'>, number>
}
// · Popular quase não sente o resultado: camisa barata o torcedor leva mesmo com o
//   time no meio da tabela. Rende pouco por peça.
// · Cara só vende se o time for bem: ninguém paga caro pra vestir time sem graça,
//   mas campeão vende camisa cara que é uma beleza.
export const PRECOS: Record<PrecoLoja, PrecoMeta> = {
  popular: { nome: 'Popular', moeda: 1, compram: 8.0, margem: 0.5, curva: { manteve: 1.00, acesso: 1.15, campeao: 1.30 } },
  normal: { nome: 'Normal', moeda: 2, compram: 4.5, margem: 1.0, curva: { manteve: 0.80, acesso: 1.25, campeao: 1.55 } },
  cara: { nome: 'Cara', moeda: 3, compram: 2.4, margem: 1.5, curva: { manteve: 0.50, acesso: 1.40, campeao: 2.00 } },
}
export const PRECO_PADRAO: PrecoLoja = 'normal'
// 🌐 BR/EN: o NOME é o que a pessoa lê, então traduz. A chave ('popular'/'normal'/
// 'cara') é o que fica no save e NUNCA muda de idioma.
export const PRECO_EN: Record<PrecoLoja, string> = { popular: 'Cheap', normal: 'Normal', cara: 'Premium' }

export interface VendaResultado {
  torcida: number; faixa: FaixaLoja; camisas: number; moedas: number
  bObras: number; bForn: number; preco: PrecoLoja
}
/** a conta da temporada inteira. `pos` = colocação FINAL. */
export function calculaVendas(opts: {
  st: StadiumSave | undefined; pos: number; preco: PrecoLoja; fornLoja?: number
}): VendaResultado {
  const { st, pos, preco } = opts
  const torcida = torcidaDoEstadio(st)
  const faixa = faixaDaPos(pos)
  const bObras = bonusObras(st)
  const bForn = opts.fornLoja ?? 0
  const p = PRECOS[preco]
  // 🔴 caiu = ZERO. Não é curva baixinha: é não vender nada mesmo (ordem do Diego).
  const mult = faixa === 'caiu' ? 0 : p.curva[faixa]
  const camisas = Math.round(torcida * (p.compram / 100) * mult * (1 + bObras) * (1 + bForn))
  return { torcida, faixa, camisas, moedas: Math.round(camisas / 100 * p.margem), bObras, bForn, preco }
}

// ══════════════════════════════════════════════════════════════════════════
// 💾 o que fica guardado no save, por técnico
// ══════════════════════════════════════════════════════════════════════════
export interface LojaSave {
  /** contrato de material vigente (undefined = sem contrato, chegam propostas) */
  forn?: FornContrato
  /** preço escolhido pra temporada CORRENTE */
  preco?: PrecoLoja
  /** a temporada em que o preço foi escolhido. É o que faz o bloco de decisão
   *  SUMIR da virada depois de decidido — *"depois não fica info na home mais,
   *  ali é só pra tomar as decisões"* (Diego, 15/09). */
  precoSeason?: number
  /** 2 cores do clube — usadas no escudo base e (quem não tem batismo) na camisa */
  cores?: [string, string]
  /** balanço da temporada que FECHOU, mostrado na abertura da nova */
  balanco?: { season: number; camisas: number; moedas: number; pos: number; preco: PrecoLoja; torcida: number; visto?: boolean }
}

/** 🎨 cor padrão do escudo base quando o dono ainda não escolheu: o vermelho e o
 *  dourado da casa. Nunca "sem cor" — o Diego cortou bege lavado em 15/09. */
export const CORES_PADRAO: [string, string] = ['#C2452F', '#7A1E14']
