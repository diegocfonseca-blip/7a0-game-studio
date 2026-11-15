import {arteCatalogoPresidencia} from './presidencia-artes-disponiveis'
import type {PresidenciaItemId} from './presidencia-economia'

// Recorte somente na vitrine. As artes de mobília continuam alinhadas à cena original.
const ENQUADRAMENTOS:Record<string,[number,number,number,number,number,number]>={
 'cadeira-simples':[900,600,375,205,150,252],
 'mesa-simples':[900,600,179,335,542,206],
 'estante-simples':[900,600,0,55,151,385],
 'cadeira-couro':[1200,800,497,332,221,158],
 'mesa-madeira':[1200,800,254,490,720,206],
 'estante-madeira':[1200,800,0,82,196,506],
 tapete:[1200,800,150,517,891,252],sofa:[1200,800,183,400,111,91],
 luminaria:[1200,800,280,373,38,92],lustre:[1200,800,500,0,215,186],
 quadro:[1200,800,1072,151,85,214],aquario:[1200,800,1004,362,153,177],planta:[1200,800,1133,310,67,246],
}
export function BemMiniatura({id,className}:{id:PresidenciaItemId;className?:string}){
 const src=arteCatalogoPresidencia(id);if(!src)return null
 const frame=ENQUADRAMENTOS[id]
 if(!frame)return <img className={className} src={import.meta.env.BASE_URL+src} alt="" loading="lazy" decoding="async"/>
 const [width,height,x,y,w,h]=frame,pad=Math.max(w,h)*.04
 return <svg className={className} aria-hidden="true" viewBox={`${x-pad} ${y-pad} ${w+pad*2} ${h+pad*2}`} preserveAspectRatio="xMidYMid meet"><image href={import.meta.env.BASE_URL+src} width={width} height={height}/></svg>
}
