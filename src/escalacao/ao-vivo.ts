// 🔁 TROCA COM O JOGO ROLANDO (23/11, Diego): ponte pequena entre o campinho 2D que está na tela e o painel "Substituir".
// O painel precisa saber o INSTANTE exato do motor quando o jogo pausou — é nele que a troca entra, tanto no campinho ao vivo
// quanto na conta que decide o placar (mesma agenda ⇒ o que se vê é o que vale). Sem campinho na tela (3D/placar), o instante
// sai do minuto do relógio, arredondado pro passo do motor.
import { DT, SEG_POR_MIN } from './motor2/fisica'

let vivo: { roundKey: number; motor: { t: number } } | null = null
/** o Campo2D avisa qual motor está rodando (e tira quando sai da tela) */
export function registraMotorAoVivo(roundKey: number, motor: { t: number } | null): void {
  if (motor) vivo = { roundKey, motor }
  else if (vivo && vivo.roundKey === roundKey) vivo = null
}
/** o instante (segundos de jogo do motor) pra gravar a troca. `minuto` = o minuto que o relógio mostra agora. */
export function instanteDaTroca(roundKey: number, minuto: number): number {
  const porMinuto = Math.max(0, Math.round((minuto * SEG_POR_MIN) / DT) * DT)
  if (vivo && vivo.roundKey === roundKey && Math.abs(vivo.motor.t - minuto * SEG_POR_MIN) < 2 * SEG_POR_MIN) return vivo.motor.t
  return porMinuto
}
/** as regras da troca ao vivo (a tela e o reducer leem as MESMAS) */
export const MAX_TROCAS_AO_VIVO = 3
export const assinaturaAoVivo = (x: { t: number; sai?: string; entra?: { name: string } | string; tatica?: number;formacao?:string;lesao?:boolean;goleiroEmergencia?:string }) =>
  `${x.t.toFixed(4)}|${x.sai ?? ''}|${typeof x.entra === 'string' ? x.entra : x.entra?.name ?? ''}|${x.tatica ?? ''}${x.formacao?`|${x.formacao}`:''}${x.lesao?`|lesao|${x.goleiroEmergencia??''}`:''}`
