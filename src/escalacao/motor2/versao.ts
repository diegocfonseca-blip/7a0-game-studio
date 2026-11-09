/** A versão pertence à partida, nunca à câmera, à velocidade ou ao aparelho. */
export const VERSAO_RECEPCAO_M2 = 'recepcao-contextual-1' as const
export const VERSAO_CRITERIOS_M2 = 'criterios-carreira-1' as const
export const VERSAO_CRITERIOS_RECEPCAO_M2 = 'criterios-carreira-recepcao-1' as const
export type VersaoM2 = typeof VERSAO_RECEPCAO_M2 | typeof VERSAO_CRITERIOS_M2 | typeof VERSAO_CRITERIOS_RECEPCAO_M2
export const temRecepcaoContextual = (v?: VersaoM2) => v === VERSAO_RECEPCAO_M2 || v === VERSAO_CRITERIOS_RECEPCAO_M2
export const temCriteriosCarreira = (v?: VersaoM2) => v === VERSAO_CRITERIOS_M2 || v === VERSAO_CRITERIOS_RECEPCAO_M2
