import {createContext,useContext,useEffect,useRef,type ReactNode} from 'react'
import {useT} from './lang'
import {useObservacaoCampo} from './presidencia-campo-observacao'
export const VELOCIDADES_ESTADIO=[.5,.25] as const
export const RITMO_ENTRADA_CAMPO=.25
type RitmoCampoValue={speed:number;onSet:(speed:number)=>void}
const ContextoRitmoCampo=createContext<RitmoCampoValue|null>(null)

/** The career owns the simulation clock. Entering a view asks that same clock
 * for its slowest rate once; leaving never speeds it up behind the user. */
export function RitmoCampoProvider({enabled,speed,onSet,children}:{enabled:boolean;children:ReactNode}&RitmoCampoValue){
 const observation=useObservacaoCampo(),lastEntry=useRef(0),authorized=useRef(false),setter=useRef(onSet)
 setter.current=onSet
 useEffect(()=>{
  const permissionArrived=enabled&&!authorized.current
  authorized.current=enabled
  if(!enabled||!observation.active)return
  if(!permissionArrived&&observation.entry===lastEntry.current)return
  lastEntry.current=observation.entry
  setter.current(RITMO_ENTRADA_CAMPO)
 },[enabled,observation])
 return <ContextoRitmoCampo.Provider value={enabled?{speed,onSet}:null}>{children}</ContextoRitmoCampo.Provider>
}
/** Local controls are available in the map, office and expanded score card,
 * including free accounts. Faster paid choices keep their existing controls. */
export function RitmoCampo(){
 const rhythm=useContext(ContextoRitmoCampo)
 return rhythm?<VelocidadeEstadio {...rhythm}/>:null
}
/** Stadium-only controls. Both slow rates are available without a paid tier.
 * Change the simulation source, never a separate animation-only clock.
 */
export function VelocidadeEstadio({speed,onSet}:{speed:number;onSet:(speed:number)=>void}){
 const t=useT(),previous=useRef(speed)
 return <fieldset style={{border:0,padding:0,margin:'0 0 12px'}}>
  <legend style={{fontWeight:800,marginBottom:6}}>{t('Ritmo para acompanhar no estádio','Stadium viewing speed')}</legend>
  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
   {[.25,.5,1].map(value=><button key={value} type="button" aria-pressed={speed===value} onClick={()=>onSet(value)} style={{font:'inherit',padding:'10px 14px',minHeight:44,border:'2px solid #0c0c0c',borderRadius:8,background:speed===value?'#ffc400':'#f4ecd6',color:'#0c0c0c'}}>{value===1?t('1× · Normal','1× · Normal'):value===.5?t('0,5× · Lento','0.5× · Slow'):t('0,25× · Bem lento','0.25× · Very slow')}</button>)}
   {previous.current>1&&<button type="button" disabled={speed===previous.current} onClick={()=>onSet(previous.current)} style={{font:'inherit',padding:'10px 14px',minHeight:44}}>{t('Ritmo anterior','Previous speed')} ({previous.current}×)</button>}
  </div>
 </fieldset>
}
