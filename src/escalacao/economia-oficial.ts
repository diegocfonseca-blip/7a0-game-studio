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
