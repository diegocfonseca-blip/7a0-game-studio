import {useEffect,useRef,useState} from 'react'
import {ARTES_VEICULOS} from './presidencia-veiculos-artes'
import {itemPresidencia,PRESIDENCIA_CATALOGO,type PresidenciaItemId} from './presidencia-economia'
import {PresidenciaEstadioImagem} from './presidencia-estadio-imagem'
import {vistaJanelaDisponivel} from './presidencia-vista-estadio'
import {VeiculoNoSolo} from './veiculo-no-solo'
import type {StadiumSave} from './estadiodata'
import {useT} from './lang'
import {Btn} from './ui-primitives'

/** Preview never purchases: optional action only requests a separate quote. */
export function GaragemExperimentar({id,stadium,onClose,onReview}:{id:PresidenciaItemId;stadium?:StadiumSave;onClose:()=>void;onReview?:()=>void}){
 const ref=useRef<HTMLDialogElement>(null),[other,setOther]=useState<PresidenciaItemId|null>(null),t=useT()
 useEffect(()=>{ref.current?.showModal()},[])
 const options=PRESIDENCIA_CATALOGO.filter(p=>p.id!==id&&ARTES_VEICULOS[p.id]?.scene)
 const item=itemPresidencia(id)!
 return <dialog ref={ref} className="gp-dialog gv-dialog" aria-label={t('Prévia antes da compra','Preview before purchase')} onClose={onClose}>
  <h2>{t('PRÉVIA · NÃO COMPRADO','PREVIEW · NOT PURCHASED')}</h2>
  <p>{t('Simulação visual. Não compra, não equipa e não altera sua dupla salva.','Visual simulation. Does not purchase, equip or change your saved pair.')}</p>
  <h3>{t(item.pt,item.en)}</h3>
  {vistaJanelaDisponivel(stadium)?<div className="gv-scene" data-catalog-preview>
   <PresidenciaEstadioImagem stadium={stadium} camera="window"/>
   <VeiculoNoSolo id={id} position={0} camera="garage"/>
   {other&&<VeiculoNoSolo id={other} position={1} camera="garage"/>}
  </div>:<p>{t('A vista deste estágio do seu estádio ainda está em preparação.','The view of this stage of your stadium is still in preparation.')}</p>}
  <div className="gp-filters"><label>{t('COMPARAR EM DUPLA','COMPARE AS A PAIR')}<select value={other??''} onChange={e=>setOther(options.find(p=>p.id===e.target.value)?.id??null)}>
   <option value="">{t('Sem segundo veículo','No second vehicle')}</option>
   {options.map(p=><option key={p.id} value={p.id}>{t(p.pt,p.en)}</option>)}
  </select></label></div>
  <div className="gp-confirm-actions">
   {onReview&&<Btn onClick={()=>{ref.current?.close();onReview()}}>{t('CONFERIR COMPRA','REVIEW PURCHASE')}</Btn>}
   <Btn bg="#fff" onClick={()=>ref.current?.close()}>{t('VOLTAR AO CATÁLOGO','BACK TO CATALOG')}</Btn>
  </div>
 </dialog>
}
