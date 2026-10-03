import {PresidenciaEstadioImagem} from './presidencia-estadio-imagem'
import {duplaDaGaragem,type DuplaGaragem} from './presidencia-garagem'
import {itemPresidencia,type PresidenciaBem} from './presidencia-economia'
import {ARTES_VEICULOS} from './presidencia-veiculos-artes'
import {vistaJanelaDisponivel} from './presidencia-vista-estadio'
import type {StadiumSave} from './estadiodata'
import {useT} from './lang'
import './garagem-vista.css'
import {VeiculoNoSolo} from './veiculo-no-solo'
import {useEffect,useRef,useState} from 'react'
import {Btn} from './ui-primitives'
import {GaragemDuplaSeletores} from './garagem-dupla-seletores'

/** Somente propriedade confirmada. Selecionar não compra, vende ou concede bens. */
export function GaragemVista({owned,display,stadium,onDisplay}:{owned:readonly PresidenciaBem[];display?:DuplaGaragem;stadium?:StadiumSave;onDisplay?:(pair:DuplaGaragem)=>boolean}){
 const [notice,N]=useState('')
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLSpanElement>(null),[expanded,E]=useState(false)
 useEffect(()=>{if(expanded){dialog.current?.querySelector('button')?.focus();if(dialog.current)dialog.current.scrollTop=0}},[expanded])
 const t=useT(),pair=duplaDaGaragem(owned,display),supported=vistaJanelaDisponivel(stadium)
 const scene=(<div className="gv-scene">
   <PresidenciaEstadioImagem stadium={stadium} camera="window"/>
   {pair.map((id,index)=>id?<VeiculoNoSolo key={index} id={id} position={index} camera="garage"/>:null)}
  </div>)
 return <section className="gv-root" aria-label={t('Vista externa da garagem','Exterior garage view')}>
  <h2>{t('SUA DUPLA NA GARAGEM','YOUR GARAGE PAIR')}</h2>
  {supported?scene:<p>{t('A vista das obras deste estádio ainda está em integração. Sua dupla continua salva.','The exterior view of this stadium construction is still being integrated. Your pair remains saved.')}</p>}
  <div className="gv-labels">{pair.map((id,index)=><div key={index}>
   <small>{index===0?t('ESQUERDA','LEFT'):t('DIREITA','RIGHT')}</small>
   <strong>{id?t(itemPresidencia(id)!.pt,itemPresidencia(id)!.en):t('Vaga vazia','Empty space')}</strong>
   {id&&!ARTES_VEICULOS[id]?.scene&&<small>{t('Recorte para a vista externa em preparação.','Exterior cutout in preparation.')}</small>}
  </div>)}</div>
  {supported&&<span ref={trigger} className="gv-expand"><Btn bg="#fff" onClick={()=>{E(true);dialog.current?.showModal()}}>{t('AMPLIAR VISTA','ENLARGE VIEW')}</Btn></span>}
  <dialog ref={dialog} className="gp-dialog gv-dialog" aria-label={t('Garagem ampliada','Enlarged garage')} onClose={()=>{E(false);trigger.current?.querySelector('button')?.focus()}}>
   {expanded&&<><h2>{t('SUA DUPLA NA GARAGEM','YOUR GARAGE PAIR')}</h2>{scene}
    <div className="gv-labels">{pair.map((id,index)=><div key={index}><small>{index===0?t('ESQUERDA','LEFT'):t('DIREITA','RIGHT')}</small><strong>{id?t(itemPresidencia(id)!.pt,itemPresidencia(id)!.en):t('Vaga vazia','Empty space')}</strong>{id&&!ARTES_VEICULOS[id]?.scene&&<small>{t('Recorte para a vista externa em preparação.','Exterior cutout in preparation.')}</small>}</div>)}</div>
    {onDisplay&&<GaragemDuplaSeletores owned={owned} display={display} onDisplay={pair=>{N('');return onDisplay(pair)}} onError={N}/>}
    {notice&&<p role="status">{notice}</p>}
    <Btn bg="#fff" onClick={()=>dialog.current?.close()}>{t('VOLTAR','BACK')}</Btn>
   </>}
  </dialog>
 </section>
}
