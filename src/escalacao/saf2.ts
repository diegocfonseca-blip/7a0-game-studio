// 🏢➡️⚽ SAF QUE VIRA 2º CLUBE — as regras PURAS (13/10, Diego: "Ok pode ser assim").
// Mockup aprovado: `scripts/mockups/carreira-saf-completo.png`. Regras completas: `docs/pendencias.md`.
//
// A escada é UMA só: compra a SAF (2.000, bot no comando) → 10 temporadas como dono → "assume o
// comando" (4.000, só pagante, só na virada) e ela vira o 2º clube jogável → vende pela divisão
// (SAF) ou pela coleção de taças (2º clube). Vender é pra dar PREJUÍZO: lucro máximo de +500.
// Palavras dele: *"gosto mais do prejuízo porque ninguém mandou ele comprar"*.
//
// 🔒 REGRA DE OURO CONTRA BOTÃO MUDO: a tela e o reducer chamam AS MESMAS funções daqui. Nada de
// regra copiada nos dois lados. Este arquivo não importa o store (é puro), e a trava
// `npm run saf2` testa tudo isto sem abrir o jogo.
//
// Só vale na carreira SOLO e só com a chave `saf2Liberado()` (sport.ts). Desligada, a SAF e o 2º
// clube antigos seguem exatamente como sempre foram.

export const PRECO_SAF = 2000
export const PRECO_COMANDO = 4000
export const TEMPORADAS_PRA_ASSUMIR = 10
export const LUCRO_MAXIMO = 500
/** reembolso da tela "O jogo mudou" (quem tinha SAF e 2º clube SEPARADOS): ninguém perde dinheiro */
export const REEMBOLSO_SAF = 2000
export const REEMBOLSO_2O_CLUBE = 4000
/** 2º clube ANTIGO (comprado direto por 4.000) vendia por 3.000 — continua sendo o piso dele */
export const VENDA_2O_ANTIGO = 3000
/** empréstimos entre os SEUS dois clubes: 2 de cada lado (mockup ⑤ "1 DE 2") */
export const EMPRESTIMOS_ENTRE_CLUBES = 2

// 💸 SAF vale pela DIVISÃO em que ela está na hora da venda. Só dá lucro se estiver na Série A.
export const VALOR_SAF_DIV: Record<string, number> = { V: 500, D: 1000, C: 1500, B: 2000, A: 2500 }
export function valorVendaSaf(div: string | null | undefined): number {
  return VALOR_SAF_DIV[div ?? 'D'] ?? VALOR_SAF_DIV.D
}

// 🏆 2º clube vale pela COLEÇÃO DE TAÇAS ganhas com ele (cada tipo conta UMA vez).
// Copa do Mundo NÃO conta; Série B/C/D não contam; ganhar a mesma taça de novo não muda nada.
// (Recusados pelo Diego, não repropor: vender por divisão, por "quanto subiu", série baixa somando,
// título repetido somando, lucro acima de 500.)
export type TacaSaf2 = 'A' | 'copa' | 'supercopa' | 'libertadores' | 'champions' | 'mundial'
export const TACAS_SAF2: readonly TacaSaf2[] = ['A', 'copa', 'supercopa', 'libertadores', 'champions', 'mundial']
export const TACA_NOME: Record<TacaSaf2, { pt: string; en: string }> = {
  A: { pt: 'Série A', en: 'Série A' },
  copa: { pt: 'Copa do Brasil', en: 'Brazil Cup' },
  supercopa: { pt: 'Supercopa', en: 'Super Cup' },
  libertadores: { pt: 'Libertadores', en: 'Libertadores' },
  champions: { pt: 'Champions', en: 'Champions' },
  mundial: { pt: 'Mundial', en: 'Club World Cup' },
}
export const VALOR_TACAS_MIN = 3000 // 0 taças = metade dos 6.000 que custou
export const VALOR_TACAS_MAX = 6500 // as 6 = 6.000 + 500 (o lucro máximo)
/** a coleção sem repetição e só com tipos que valem (save torto não infla o valor) */
export function colecao(tacas: readonly string[] | null | undefined): TacaSaf2[] {
  const set = new Set(tacas ?? [])
  return TACAS_SAF2.filter(t => set.has(t))
}
export function addTaca(tacas: readonly string[] | null | undefined, t: TacaSaf2): TacaSaf2[] {
  return colecao([...(tacas ?? []), t])
}
/** 0 = 3.000 · 6 = 6.500 · proporcional no meio, arredondado de 10 em 10 (2 = 4.170 · 3 = 4.750) */
export function valorTacas(n: number): number {
  const k = Math.max(0, Math.min(TACAS_SAF2.length, Math.floor(n)))
  return Math.round((VALOR_TACAS_MIN + (VALOR_TACAS_MAX - VALOR_TACAS_MIN) * k / TACAS_SAF2.length) / 10) * 10
}
/** o valor de venda do 2º clube: as taças (ou o piso antigo, pra quem comprou pela regra velha) + o caixa
 *  dele, que volta junto (dívida desconta). O lucro é medido só na parte das taças. */
export function valorVenda2oClube(p: { tacas: readonly string[] | null | undefined; caixa: number; antigo?: boolean }): { tacas: number; base: number; caixa: number; total: number } {
  const n = colecao(p.tacas).length
  const pelasTacas = valorTacas(n)
  const base = p.antigo ? Math.max(VENDA_2O_ANTIGO, pelasTacas) : pelasTacas
  const caixa = Math.round(p.caixa || 0)
  return { tacas: n, base, caixa, total: base + caixa }
}
/** lucro (+) ou prejuízo (−) de uma venda contra o que foi investido */
export function lucroVenda(valor: number, investido: number): number { return Math.round(valor - investido) }

// ⏳ relógio das 10 temporadas: conta desde a COMPRA da SAF (`careerFilial.since`, que todo save já tem).
export function temporadasComoDono(desde: number | null | undefined, seasonNo: number): number {
  if (desde == null) return 0
  return Math.max(0, Math.floor(seasonNo - desde))
}

/** ⭐ PAGANTE = qualquer plano (Craque, Lenda, Batismo; antigo ou novo, fundador, sócio em dia).
 *  `tier` é o tier efetivo da conta (prata = Craque antigo, ouro = Lenda/Craque completo/batismo);
 *  `d` é o que o banco devolve em `esc_meus_direitos` (pode vir nulo se o banco não respondeu). */
export function ehPagante(tier: string | null | undefined, d?: { pago?: boolean; salasPagas?: boolean; craqueAtivo?: boolean; batismo?: boolean; fundador?: boolean; socioAtivo?: boolean } | null): boolean {
  if (tier === 'prata' || tier === 'ouro') return true
  if (!d) return false
  return !!(d.pago || d.salasPagas || d.craqueAtivo || d.batismo || d.fundador || d.socioAtivo)
}

// 🪟 A JANELA: as decisões de clube (assumir, vender, emprestar, transferir, migrar) só acontecem na
// virada da temporada — na prática, na tela da temporada ANTES da 1ª rodada. Fecha o furo do
// "empresta logo antes de fechar a temporada e não paga salário" (análise 13/10, item 8).
export function janelaAberta(p: { careerOnline?: boolean; online?: boolean; screen?: string; round?: number }): boolean {
  return !!p.careerOnline && !p.online && p.screen === 'season' && (p.round ?? 0) === 0
}

export type MotivoAssumir = 'ok' | 'sem-saf' | 'ja-tem-2o' | 'janela' | 'pagante' | 'temporadas' | 'moedas'
/** pode assumir o comando da SAF? Devolve o PRIMEIRO motivo que trava (a tela mostra o porquê + o caminho). */
export function podeAssumir(p: {
  temSaf: boolean; tem2o: boolean; janela: boolean; pagante: boolean
  seasonNo: number; safDesde: number | null | undefined; semEspera?: boolean; caixa: number
}): { ok: boolean; motivo: MotivoAssumir; temporadas: number; faltamTemporadas: number; faltamMoedas: number } {
  const temporadas = temporadasComoDono(p.safDesde, p.seasonNo)
  const faltamTemporadas = p.semEspera ? 0 : Math.max(0, TEMPORADAS_PRA_ASSUMIR - temporadas)
  const faltamMoedas = Math.max(0, PRECO_COMANDO - Math.floor(p.caixa))
  const r = (motivo: MotivoAssumir) => ({ ok: motivo === 'ok', motivo, temporadas, faltamTemporadas, faltamMoedas })
  if (!p.temSaf) return r('sem-saf')
  if (p.tem2o) return r('ja-tem-2o')
  if (!p.pagante) return r('pagante')
  if (faltamTemporadas > 0) return r('temporadas')
  if (faltamMoedas > 0) return r('moedas')
  if (!p.janela) return r('janela')
  return r('ok')
}

/** quem tem SAF e 2º clube SEPARADOS (regra velha) escolhe UMA vez qual manter */
export function precisaMigrar(p: { temSaf: boolean; tem2o: boolean; migrado?: boolean }): boolean {
  return p.temSaf && p.tem2o && !p.migrado
}
export function reembolsoMigracao(fica: '2o' | 'saf'): number {
  return fica === '2o' ? REEMBOLSO_SAF : REEMBOLSO_2O_CLUBE
}

// 💸 SALÁRIO DO EMPRESTADO: METADE pra cada lado (antes era ZERO dos dois — o furo).
export function salarioCheio(paid: number | null | undefined): number { return Math.round((paid ?? 0) / 10) }
export function metadeSalario(paid: number | null | undefined): number { return Math.round(salarioCheio(paid) / 2) }

/** 🤝 transferência de vez entre os seus dois clubes: 1 por janela, pelo valor oficial, quem compra tem que ter o caixa */
export type MotivoTransf = 'ok' | 'janela' | 'ja-fez' | 'caixa'
export function podeTransferir(p: { janela: boolean; ultimaTransf?: number | null; seasonNo: number; caixaComprador: number; valor: number }): MotivoTransf {
  if (!p.janela) return 'janela'
  if (p.ultimaTransf === p.seasonNo) return 'ja-fez'
  if (p.caixaComprador < p.valor) return 'caixa'
  return 'ok'
}

/** 💰 aporte: só do principal pro 2º clube, nunca volta; não pode deixar o principal no vermelho */
export function podeAportar(p: { valor: number; caixaPrincipal: number }): boolean {
  return Number.isFinite(p.valor) && p.valor > 0 && Math.floor(p.valor) === p.valor && p.caixaPrincipal >= p.valor
}

/** 🔴 caixa no vermelho = sem lance no leilão (destrava vendendo ou com aporte) */
export function semLance(caixa: number): boolean { return caixa <= 0 }

/** o que já foi investido no 2º clube (pra mostrar lucro/prejuízo na venda) */
export function investido2o(p: { origemSaf?: boolean; aportes?: number }): number {
  return (p.origemSaf ? PRECO_SAF + PRECO_COMANDO : PRECO_COMANDO) + Math.max(0, p.aportes ?? 0)
}
