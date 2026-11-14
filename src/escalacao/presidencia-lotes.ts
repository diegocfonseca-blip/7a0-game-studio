// Independent of account access: these switches never grant account permissions.
// Core onboarding/profile/office still requires PRESIDENT_INTEGRATION_RELEASED.
export const PRESIDENCY_ECONOMY_RELEASED: boolean = true
export const PRESIDENCY_ROOF_RELEASED: boolean = true
// 09/11: Diego pediu manter o mapa oculto para TODAS as contas, inclusive a dele.
export const PRESIDENCY_STADIUM_RELEASED: boolean = false
// 14/11: Diego autorizou publicar a nova cidade SOMENTE na conta dele.
// A identidade continua vindo de usePresidentPreview(), confirmada pelo servidor.
export const PRESIDENCY_STADIUM_PREVIEW_RELEASED: boolean = true
export function mapaEstadioDisponivel(contaVerificada: boolean): boolean {
  return contaVerificada && (PRESIDENCY_STADIUM_RELEASED || PRESIDENCY_STADIUM_PREVIEW_RELEASED)
}
// Publicação autorizada em 15/10 junto ao mapa que representa cada etapa.
// A conta verificada de Diego e as permissões da carreira continuam obrigatórias.
export const PRESIDENCY_PARKING_STAGES_RELEASED: boolean = true
