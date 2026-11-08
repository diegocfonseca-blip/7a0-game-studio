import type { EscState } from './types'
import { VERSAO_CRITERIOS_M2, VERSAO_CRITERIOS_RECEPCAO_M2, temRecepcaoContextual, type VersaoM2 } from './motor2/versao'

/** Desligar impede adesões na próxima virada; leitores e partidas antigas permanecem. */
export const CRITERIOS_CARREIRA_LIBERADOS = true

/** A atualização entra na virada, nunca ao abrir uma temporada em andamento. */
export function criteriosDaTemporada(s: Pick<EscState, 'careerOnline' | 'sport' | 'seasonNo' | 'criteriosCarreiraDesde' | 'criteriosCarreiraAte' | 'onlineMode' | 'co2'>): boolean {
  const sn=s.seasonNo??1
  return !!s.careerOnline && s.sport !== 'basquete' && s.onlineMode !== 'online' && !s.co2 && s.criteriosCarreiraDesde != null && sn >= s.criteriosCarreiraDesde && (s.criteriosCarreiraAte == null || sn <= s.criteriosCarreiraAte)
}

export function iniciarCriteriosDaTemporada(s: EscState, habilitado=CRITERIOS_CARREIRA_LIBERADOS): void {
  if(!s.careerOnline||s.sport==='basquete'||s.onlineMode==='online'||s.co2)return
  if(habilitado){if(s.criteriosCarreiraDesde==null)s.criteriosCarreiraDesde=s.seasonNo??1}
  else if(s.criteriosCarreiraDesde!=null&&s.criteriosCarreiraAte==null)s.criteriosCarreiraAte=(s.seasonNo??1)-1
}

export function versaoComCriterios(versao: VersaoM2 | undefined, criterios: boolean): VersaoM2 | undefined {
  return criterios ? (temRecepcaoContextual(versao) ? VERSAO_CRITERIOS_RECEPCAO_M2 : VERSAO_CRITERIOS_M2) : versao
}
