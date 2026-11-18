// 💰 ECONOMIA DO BRASIL OFICIAL (18/11, aprovada pelo Diego: *"Ok"*). Pedido dele: *"TV pela divisão e pelo tamanho do clube.
// Prêmio de subir e de cair pelo formato real de cada série… não top 4: se sobem 6 da Série D, ganham os 6… rever prêmios de
// campeão da Série D (não tem várzea mais), C, B… todas as competições: vai sendo eliminado mas ganha alguma coisa, mesmo que
// seja merreca… sempre deixando claro pro usuário"*. A carreira de sempre NÃO usa nada daqui (segue `TV_COTA`/`seasonRewards`).
// Toda régua mora AQUI — a tela (aviso da TV, cartão da Rede Martelo, linhas do extrato) e o caixa leem as mesmas constantes.

/** 🏟️ PORTE DO CLUBE (a TV da Série A paga pelo tamanho, como no Brasileirão de verdade):
 *  · grande = os "doze grandes" do futebol brasileiro (pt.wikipedia: "Clubes grandes do futebol brasileiro");
 *  · médio = quem já foi campeão brasileiro ou da Copa do Brasil (listas de campeões na pt.wikipedia) e não é dos 12;
 *  · pequeno = o resto. */
export const GRANDES_OFICIAL = new Set(['Flamengo', 'Corinthians', 'Palmeiras', 'São Paulo', 'Santos', 'Vasco', 'Fluminense', 'Botafogo', 'Grêmio', 'Internacional', 'Atlético-MG', 'Cruzeiro'])
export const MEDIOS_OFICIAL = new Set(['Bahia', 'Sport', 'Athletico-PR', 'Coritiba', 'Guarani', 'Criciúma', 'Juventude', 'Paulista', 'Santo André'])
export type Porte = 'grande' | 'medio' | 'pequeno'
export const porteOficial = (nome: string): Porte => GRANDES_OFICIAL.has(nome) ? 'grande' : MEDIOS_OFICIAL.has(nome) ? 'medio' : 'pequeno'
export const NOME_PORTE: Record<Porte, [string, string]> = { grande: ['clube grande', 'big club'], medio: ['clube médio', 'mid-sized club'], pequeno: ['clube pequeno', 'small club'] }

/** 📺 cota de TV por temporada: D 20 · C 30 · B 40 (os 12 grandes 45) · A grande 70 · médio 55 · pequeno 45. Fora das séries = 0. */
export function tvOficial(div: string, nome: string): number {
  const p = porteOficial(nome)
  if (div === 'A') return p === 'grande' ? 70 : p === 'medio' ? 55 : 45
  if (div === 'B') return p === 'grande' ? 45 : 40
  if (div === 'C') return 30
  if (div === 'D') return 20
  return 0
}

/** 🏆 liga: campeão da série · cada clube que SOBE (pela série de onde subiu) · cada clube que CAI (desconta, pela série de onde caiu) */
export const CAMPEAO_OFICIAL: Record<string, number> = { A: 80, B: 50, C: 35, D: 25 }
export const ACESSO_OFICIAL: Record<string, number> = { B: 30, C: 20, D: 15 }
export const QUEDA_OFICIAL: Record<string, number> = { A: 20, B: 15, C: 10 }

/** as copas: quanto vale cair em cada fase (quem cai cedo ganha a merreca, ninguém sai de mão vazia) */
export const ESTADUAL_OFICIAL = { participou: 2, semi: 4, vice: 6, campeao: 10 }
export const SUPERCOPA_REI_OFICIAL = { vice: 10, campeao: 20 }
export const LIBERTA_OFICIAL = { pre: 4, grupos: 8, oitavas: 12, quartas: 18, semi: 25, vice: 40, campeao: 80 }
export const SULA_OFICIAL = { pre: 3, grupos: 5, playoffs: 6, oitavas: 7, quartas: 10, semi: 15, vice: 25, campeao: 45 }
export const INTER_OFICIAL = { participou: 10, vice: 20, campeao: 40 }
/** 🇧🇷 Copa do Brasil, contando do FIM (0 = perdeu a final): vice 35 · semi 20 · quartas 12 · oitavas 8 · e antes disso 6, 5, 4, 3, 2…
 *  Campeão 60. */
export const CDB_OFICIAL = { campeao: 60, vice: 35, semi: 20, quartas: 12, oitavas: 8 }
export function cdbOficialPorFim(doFim: number): number {
  if (doFim <= 0) return CDB_OFICIAL.vice
  if (doFim === 1) return CDB_OFICIAL.semi
  if (doFim === 2) return CDB_OFICIAL.quartas
  if (doFim === 3) return CDB_OFICIAL.oitavas
  return Math.max(2, 10 - doFim)
}

/** 💰 CAIXA INICIAL (18/11, *"topei"*): pela RECEITA REAL do clube, comprimida pra caber no jogo — ~40 🪙 o mais pobre da Série D até
 *  ~400 🪙 Flamengo/Palmeiras (10× de diferença, a ordem é a da vida real). `RECEITA_OFICIAL` (R$ milhões, com fonte em
 *  `docs/brasil-oficial/receitas-clubes.md`) manda quando o clube tem número; sem número, vale a régua por série e porte. */
export const RECEITA_OFICIAL: Record<string, number> = {
  // Série A (R$ milhões, receita 2025 — 2024 onde indicado no doc). Chapecoense: INCERTO (sem balanço achado).
  Flamengo: 2089, Palmeiras: 1783, Botafogo: 1400, 'São Paulo': 1070, Fluminense: 1020, Corinthians: 971, Internacional: 776,
  'Grêmio': 737, 'Atlético-MG': 727, Santos: 678.5, Cruzeiro: 677, Vasco: 628, Bahia: 557.1, 'Athletico-PR': 512.7, Bragantino: 425.2,
  'Vitória': 253, Mirassol: 179.9, Coritiba: 138.9, Remo: 82.9,
  // Série B (8 INCERTOS ficam na régua; Vila Nova fora até confirmar a fonte)
  Fortaleza: 231.5, 'Ceará': 221.5, 'Cuiabá': 218.8, Sport: 174.1, Juventude: 143, 'Atlético-GO': 77.1, CRB: 47.4, 'Goiás': 45.4,
  'Avaí': 41.5, 'Operário-PR': 39.5, 'Náutico': 30.8,
  // Série C e D (quase não há balanço público)
  Paysandu: 65.9, Guarani: 64.8, 'Santa Cruz': 30.3, Portuguesa: 13.9,
}
const CAIXA_SEM_RECEITA: Record<string, number> = { A: 160, B: 100, C: 65, D: 40 }
export function caixaInicialOficial(nome: string, div: string): number {
  const r = RECEITA_OFICIAL[nome]
  if (r && r > 0) {
    // escala de log: R$ 10 mi → 40 · Flamengo (R$ 2,09 bi) → 400 (cada vez que a receita dobra, ~+47 🪙)
    const v = 40 + (Math.log2(Math.max(10, r) / 10) / Math.log2(2089 / 10)) * 360
    return Math.round(Math.max(40, Math.min(400, v)) / 5) * 5
  }
  const p = porteOficial(nome)
  if (div === 'A') return p === 'grande' ? 300 : p === 'medio' ? 190 : CAIXA_SEM_RECEITA.A
  return CAIXA_SEM_RECEITA[div] ?? 40
}
