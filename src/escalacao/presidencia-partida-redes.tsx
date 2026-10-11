import {linhasDaRede} from './presidencia-partida-geometria'
/** Malha transparente na frente da bola, específica da câmera interna. */
export function RedesDoCampo(){
 return <svg className="pe-live-nets" viewBox="0 0 1536 1024" aria-hidden="true">
  {linhasDaRede().map(line=><line key={line.id} x1={line.a[0]} y1={line.a[1]} x2={line.b[0]} y2={line.b[1]}/>)}
 </svg>
}
