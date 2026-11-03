import {useEffect,useRef,type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {nomeAgenciaClube,type DestinoClubeMapa} from './clube-mapa-destinos'
import './clube-mapa.css'
export function ClubeMapaPainel({enabled,active,club,agency,onSelect,onClose,children}:{enabled:boolean;active:DestinoClubeMapa|null;club:string;agency:boolean;onSelect:(target:DestinoClubeMapa)=>void;onClose:()=>void;children:ReactNode}){
 const panel=useRef<HTMLElement>(null),close=useRef(onClose);close.current=onClose
 const open=enabled&&!!active,title=active==='loja'?'Loja do Clube':active==='financas'?'Finanças do clube':active==='presidencia'?'Sala do presidente':nomeAgenciaClube(club)
 useEffect(()=>{
  if(!open)return
  const el=panel.current;if(!el)return
  const before=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow,gutter=document.documentElement.style.scrollbarGutter,app=document.getElementById('root'),wasInert=app?.inert??false,hadClass=document.body.classList.contains('clube-mapa-gestao-aberta')
  document.documentElement.style.scrollbarGutter='stable';document.body.style.overflow='hidden';if(app)app.inert=true;document.body.classList.add('clube-mapa-gestao-aberta')
  const frame=requestAnimationFrame(()=>el.querySelector<HTMLButtonElement>('[data-map-panel-close]')?.focus({preventScroll:true}))
  // The game already portals purchases, card previews and editor dialogs to
  // body. Stay below those windows; a native top-layer dialog would hide them.
  const nestedWindow=()=>Array.from(document.body.children).some(node=>{
   if(node===el.parentElement||node===app||!(node instanceof HTMLElement))return false
   const style=getComputedStyle(node);return style.position==='fixed'&&Number(style.zIndex)>99990&&node.getClientRects().length>0
  })||Array.from(el.querySelectorAll<HTMLElement>('dialog[open],[style*="fixed"]')).some(node=>node.getClientRects().length>0&&node.getBoundingClientRect().width>innerWidth*.5)
  const keys=(e:KeyboardEvent)=>{
   if(e.defaultPrevented||nestedWindow())return
   if(e.key==='Escape'){e.preventDefault();close.current();return}
   if(e.key!=='Tab')return
   const items=Array.from(el.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')).filter(n=>n.getClientRects().length>0)
   const first=items[0],last=items.at(-1)
   if(!first){e.preventDefault();el.focus();return}
   if(e.shiftKey&&(document.activeElement===first||!el.contains(document.activeElement))){e.preventDefault();last?.focus()}
   else if(!e.shiftKey&&(document.activeElement===last||!el.contains(document.activeElement))){e.preventDefault();first.focus()}
  }
  document.addEventListener('keydown',keys)
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',keys);if(app)app.inert=wasInert;if(!hadClass)document.body.classList.remove('clube-mapa-gestao-aberta');document.body.style.overflow=overflow;document.documentElement.style.scrollbarGutter=gutter;before?.focus?.({preventScroll:true})}
 },[open])
 if(!enabled)return <>{children}</>
 if(!active)return null
 return createPortal(<div className={`clube-mapa-backdrop ll25-career ll29-career ll25-tab-estadio ll25-clube-${active}`} onClick={e=>{if(e.target===e.currentTarget)close.current()}}>
 <section ref={panel} tabIndex={-1} role="dialog" aria-modal="true" className="clube-mapa-painel" aria-label={title}>
  <header><div><small>{club}</small><h2>{title}</h2></div><button type="button" data-map-panel-close onClick={onClose}>← Voltar ao mapa</button></header>
  {['agencia','escritorio','patrocinio'].includes(active)&&<nav aria-label="Áreas da agência"><button aria-pressed={active!=='patrocinio'} onClick={()=>onSelect(agency?'agencia':'escritorio')}>Sua agência e cartas</button><button aria-pressed={active==='patrocinio'} onClick={()=>onSelect('patrocinio')}>Patrocínios e contratos</button></nav>}
  {['presidencia','financas'].includes(active)&&<nav aria-label="Sala do presidente"><button aria-pressed={active==='presidencia'} onClick={()=>onSelect('presidencia')}>Presidência</button><button aria-pressed={active==='financas'} onClick={()=>onSelect('financas')}>Finanças</button></nav>}
  <div className="clube-mapa-conteudo">{children}</div>
 </section></div>,document.body)
}
