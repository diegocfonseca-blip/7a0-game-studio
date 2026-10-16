import { STADIUM_EXTRAS, STADIUM_STEP, type StadiumSave } from './estadiodata'
import { estadioVisualValido } from './presidencia-estadio-validacao'

export type EtapaEstacionamento = 0 | 1 | 2 | 3 | 4
export type LoteEstacionamento = 'sudeste' | 'sudoeste' | 'leste' | 'noroeste'

// A nova compra continua custando as mesmas 70 moedas do catálogo. Cada
// clique conclui um lote; o último cobra somente as 10 moedas restantes.
export const ESTACIONAMENTO_CUSTO_TOTAL = STADIUM_EXTRAS.find(extra => extra.k === 'estac')!.cost
export const ESTACIONAMENTO_LOTES: readonly LoteEstacionamento[] = ['sudeste', 'sudoeste', 'leste', 'noroeste']
// Contagem das vagas de 5,9 × 2,9 m da planta física, livres dos acessos,
// faixas de manobra e passeios. O teste da planta cruza ambos os contratos.
export const ESTACIONAMENTO_VAGAS_POR_LOTE: Readonly<Record<LoteEstacionamento, number>> = Object.freeze({
 sudeste: 9, sudoeste: 7, leste: 30, noroeste: 33,
})
const thresholds = [0, STADIUM_STEP, STADIUM_STEP * 2, STADIUM_STEP * 3, ESTACIONAMENTO_CUSTO_TOTAL] as const

export type EstadoEstacionamento = {
 valid: boolean
 legacy: boolean
 stage: EtapaEstacionamento
 investment: number
 progress: number
 complete: boolean
 nextCost: number
 capacity: number
 lots: readonly LoteEstacionamento[]
}

/** Somente leitura. Não migra nem cobra automaticamente um save existente.
 * ext.estac sem o campo novo é a compra antiga integral, mesmo se o save
 * legado não obedece aos pré-requisitos atuais. */
export function estacionamentoDoSave(stadium?: StadiumSave): EstadoEstacionamento {
 const base = { valid: true, legacy: false, stage: 0 as EtapaEstacionamento, investment: 0,
  progress: 0, complete: false, nextCost: STADIUM_STEP, capacity: 0, lots: [] as LoteEstacionamento[] }
 if (stadium === undefined) return base
 if (!estadioVisualValido(stadium)) return { ...base, valid: false, nextCost: 0 }
 const owned = stadium.ext.includes('estac')
 const legacy = owned && stadium.estacionamentoInvestido === undefined
 if (stadium.estacionamentoInvestido !== undefined && typeof stadium.estacionamentoInvestido !== 'number') {
  return { ...base, valid: false, nextCost: 0 }
 }
 const investment = legacy ? ESTACIONAMENTO_CUSTO_TOTAL : stadium.estacionamentoInvestido ?? 0
 const index = thresholds.findIndex(value => value === investment)
 // Uma posse nova parcial marcada como integral é inconsistente. Não
 // adivinha progresso nem abre uma compra sobre dados que não conferem.
 if (index < 0 || (!legacy && owned !== (investment === ESTACIONAMENTO_CUSTO_TOTAL))) {
  return { ...base, valid: false, nextCost: 0 }
 }
 const stage = index as EtapaEstacionamento
 const complete = stage === 4
 const lots = ESTACIONAMENTO_LOTES.slice(0, stage)
 return { valid: true, legacy, stage, investment, progress: investment / ESTACIONAMENTO_CUSTO_TOTAL,
  complete, nextCost: complete ? 0 : thresholds[stage + 1] - investment,
  capacity: lots.reduce((total, lot) => total + ESTACIONAMENTO_VAGAS_POR_LOTE[lot], 0), lots }
}

export type ErroEstacionamento = 'invalid-state' | 'invalid-cash' | 'stale-stage' | 'locked' | 'completed' | 'insufficient-funds'
export type PedidoEstacionamento = { stadium: StadiumSave | undefined; cash: number; expectedStage: EtapaEstacionamento }
export type ResultadoEstacionamento =
 | { ok: true; value: { stadium: StadiumSave; cash: number; parking: EstadoEstacionamento }; charged: number }
 | { ok: false; error: ErroEstacionamento }

/** Transação pura: recebe o saldo corrente, devolve ambos os valores juntos.
 * O chamador precisa aplicar o resultado atomicamente ao dono do estádio.
 * A etapa observada é obrigatória: repetir um clique antigo nunca compra
 * silenciosamente o próximo lote. Não há IO, saldo paralelo ou reembolso. */
export function investirEstacionamento(request: PedidoEstacionamento): ResultadoEstacionamento {
 if (!request || typeof request !== 'object') return { ok: false, error: 'invalid-state' }
 const current = estacionamentoDoSave(request.stadium)
 if (!current.valid) return { ok: false, error: 'invalid-state' }
 if (!Number.isSafeInteger(request.cash) || request.cash < 0) return { ok: false, error: 'invalid-cash' }
 if (!Number.isInteger(request.expectedStage) || request.expectedStage !== current.stage) {
  return { ok: false, error: 'stale-stage' }
 }
 if (current.complete) return { ok: false, error: 'completed' }
 if (!request.stadium?.ext.includes('loja')) return { ok: false, error: 'locked' }
 const charged = current.nextCost
 if (request.cash < charged) return { ok: false, error: 'insufficient-funds' }
 const investment = current.investment + charged
 const stadium: StadiumSave = { ...request.stadium, inv: { ...request.stadium.inv }, ext: [...request.stadium.ext],
  estacionamentoInvestido: investment }
 // Só a compra integral recebe a chave antiga. Isto preserva renda e
 // requisitos legados até a integração explícita da nova regra na carreira.
 if (investment === ESTACIONAMENTO_CUSTO_TOTAL) stadium.ext.push('estac')
 return { ok: true, charged, value: { stadium, cash: request.cash - charged, parking: estacionamentoDoSave(stadium) } }
}
