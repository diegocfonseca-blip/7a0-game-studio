import {useRef,useState,type ReactNode} from 'react'
import {useT} from './lang'
import type {PresidenteBaseSave} from './presidencia-carreira'
import {presidenteCadastrado,sugestaoPresidente} from './presidencia-entrada-model'
import {PresidenteFormulario} from './presidente-formulario'
import {aguardarGravacao} from './presidente-gravacao'

export function PresidenciaEntrada({saved,legacy,onSave,onBack,children}:{
 saved?:PresidenteBaseSave;legacy?:{name?:string;outfit?:string};
 onSave:(value:PresidenteBaseSave)=>boolean|Promise<boolean>;onBack:()=>void;
 children:(president:PresidenteBaseSave)=>ReactNode;
}){
 const t=useT(),[draft,setDraft]=useState(()=>sugestaoPresidente(saved,legacy)),[busy,setBusy]=useState(false),[error,setError]=useState(''),lock=useRef(false)
 if(presidenteCadastrado(saved))return <>{children(saved)}</>
 const confirm=async()=>{
  if(lock.current||!presidenteCadastrado(draft))return
  lock.current=true;setBusy(true);setError('')
  try{
   // Só a mudança no save controlado abre a sala. Falha nunca conclui cadastro.
   const result=await aguardarGravacao(()=>onSave({...draft,name:draft.name.trim()}))
   if(result==='timeout')setError(t('A gravação está demorando. Suas escolhas continuam aqui; confira o cadastro antes de tentar novamente.','Saving is taking longer than expected. Your choices remain here; check registration before trying again.'))
   if(result==='failed')setError(t('Não foi possível salvar. Suas escolhas continuam aqui; tente novamente.','Could not save. Your choices remain here; try again.'))
  }catch{setError(t('Não foi possível salvar. Suas escolhas continuam aqui; tente novamente.','Could not save. Your choices remain here; try again.'))}
  finally{lock.current=false;setBusy(false)}
 }
 return <PresidenteFormulario existing value={draft} onChange={v=>{setDraft(v);setError('')}} onConfirm={()=>void confirm()} onBack={onBack} busy={busy} error={error}/>
}
