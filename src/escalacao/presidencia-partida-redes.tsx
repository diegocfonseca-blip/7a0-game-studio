import {linhasDaRede,balizasDoCampo,escalaNoGramado,CAMPO_INTERNO,CAMPO_MAPA} from './presidencia-partida-geometria'
/** Malha transparente na frente da bola, específica da câmera interna. */
export function RedesDoCampo({corners=CAMPO_INTERNO}:{corners?:typeof CAMPO_INTERNO|typeof CAMPO_MAPA}){
 return <svg className="pe-live-nets" viewBox="0 0 1536 1024" aria-hidden="true">
  {balizasDoCampo(corners).map((g,i)=><g key={'posts:'+i} strokeWidth={escalaNoGramado(corners,.5).athleteHeight/1.8*.12} strokeLinecap="round" opacity="1"><polyline points={g.posts.map(p=>p.join(',')).join(' ')}/><polyline points={g.backFrame.map(p=>p.join(',')).join(' ')} opacity=".65"/></g>)}
  {linhasDaRede(corners).map(line=><line key={line.id} x1={line.a[0]} y1={line.a[1]} x2={line.b[0]} y2={line.b[1]}/>)}
 </svg>
}
