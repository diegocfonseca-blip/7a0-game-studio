import {createContext,useContext,type ReactNode} from 'react'
import {useT} from './lang'
export const VELOCIDADES_ESTADIO=[.25,.5,1,2,4] as const
export const rotuloVelocidadeCampo=(value:number)=>String(value).replace('.',',')+'×'
type RitmoCampoValue={speed:number;onSet:(speed:number)=>void}
const ContextoRitmoCampo=createContext<RitmoCampoValue|null>(null)

/** One career clock for every view. Entering/leaving the map preserves the
 * user's selected rate and never dispatches a hidden speed change. */
export function RitmoCampoProvider({enabled,speed,onSet,children}:{enabled:boolean;children:ReactNode}&RitmoCampoValue){
 return <ContextoRitmoCampo.Provider value={enabled?{speed,onSet}:null}>{children}</ContextoRitmoCampo.Provider>
}
/** Local controls are available in the map, office and expanded score card,
 * including free accounts. Faster paid choices keep their existing controls. */
/** o ritmo de olhar o estádio (o mesmo do `RitmoCampo`), pra quem desenha os botões dentro do mapa */
export function useRitmoCampo(){return useContext(ContextoRitmoCampo)}
export function RitmoCampo(){
 const rhythm=useContext(ContextoRitmoCampo)
 return rhythm?<VelocidadeEstadio {...rhythm}/>:null
}
/** Stadium-only controls. Both slow rates are available without a paid tier.
 * Change the simulation source, never a separate animation-only clock.
 */
export function VelocidadeEstadio({speed,onSet}:{speed:number;onSet:(speed:number)=>void}){
 const t=useT()
 return <fieldset style={{border:0,padding:0,margin:'0 0 12px'}}>
  <legend style={{fontWeight:800,marginBottom:6}}>{t('Ritmo para acompanhar no estádio','Stadium viewing speed')}</legend>
  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
   {VELOCIDADES_ESTADIO.map(value=><button key={value} type="button" aria-pressed={speed===value} onClick={()=>onSet(value)} style={{font:'inherit',padding:'10px 14px',minHeight:44,border:'2px solid #0c0c0c',borderRadius:8,background:speed===value?'#ffc400':'#f4ecd6',color:'#0c0c0c'}}>{value===1?t('1× · Normal','1× · Normal'):value===.5?t('0,5× · Lento','0.5× · Slow'):value===.25?t('0,25× · Bem lento','0.25× · Very slow'):value===2?t('2× · Rápido','2× · Fast'):t('4× · Muito rápido','4× · Very fast')}</button>)}
  </div>
 </fieldset>
}
