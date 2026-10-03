import {useEffect,useRef,useState} from 'react'
import {PresidentePerfil} from './presidente-perfil'
import {PresidenteFormulario} from './presidente-formulario'
import {sugestaoPresidente,presidenteCadastrado} from './presidencia-entrada-model'
import {copiarAparencia} from './presidente-aparencia'
import type {PresidenteBaseSave} from './presidencia-carreira'
import type {PresidenciaDados} from './presidencia-model'
import {useT} from './lang'
import {aguardarGravacao} from './presidente-gravacao'

const signature=(v:PresidenteBaseSave)=>JSON.stringify({version:v.version,name:v.name,outfit:v.outfit,appearance:v.appearance?{version:v.appearance.version,hair:v.appearance.hair,beard:v.appearance.beard,accessories:v.appearance.version===22?v.appearance.accessories:undefined,skinTone:v.appearance.version===22?v.appearance.skinTone:undefined}:null})

/** Editor controlado: só confirma a gravação quando o save devolvido pelo pai
 * contém o visual solicitado. Cancelar não grava nem muda a carreira. */
export function PresidentePainel({value,data,onSave,onClose}:{value:PresidenteBaseSave;data:PresidenciaDados;onSave:(next:PresidenteBaseSave)=>boolean|Promise<boolean>;onClose:()=>void}){
 const t=useT(),[editing,E]=useState(false),[draft,D]=useState(()=>sugestaoPresidente(value)),[busy,B]=useState(false),[error,X]=useState(''),[requested,R]=useState<string|null>(null),lock=useRef(false)
 useEffect(()=>{if(requested&&signature(value)===requested){R(null);B(false);lock.current=false;E(false)}},[value,requested])
 useEffect(()=>{
  if(!requested)return
  const timer=setTimeout(()=>{
   R(null);B(false);lock.current=false
   X(t('A confirmação não chegou. Seu rascunho foi mantido; confira o visual salvo ou tente novamente.','Confirmation did not arrive. Your draft was kept; check the saved appearance or try again.'))
  },8000)
  return()=>clearTimeout(timer)
 },[requested,t])
 const save=async()=>{
  if(lock.current||!presidenteCadastrado(draft))return
  lock.current=true;B(true);X('')
  const next={...draft,name:draft.name.trim(),...(draft.appearance?{appearance:copiarAparencia(draft.appearance)}:{})}
  const expected=signature(next)
  const result=await aguardarGravacao(()=>onSave(next))
  if(result==='accepted'){R(expected);return}
  if(result==='timeout'){
   B(false);lock.current=false
   X(t('A gravação está demorando. Seu rascunho foi mantido; confira o visual salvo antes de tentar novamente.','Saving is taking longer than expected. Your draft was kept; check the saved appearance before trying again.'))
   return
  }
  B(false);lock.current=false;X(t('Não foi possível salvar. Seu visual anterior foi mantido; tente novamente.','Could not save. Your previous appearance was kept; try again.'))
 }
 if(editing)return <><PresidenteFormulario editing value={draft} onChange={D} busy={busy} error={error} onConfirm={()=>void save()} onBack={()=>{if(!busy){E(false);X('')}}}/>{requested&&<p role="status">{t('Aguardando confirmação do visual salvo…','Waiting for saved appearance confirmation…')}</p>}</>
 return <PresidentePerfil base={value} data={data} onClose={onClose} onEdit={()=>{D(sugestaoPresidente(value));X('');E(true)}}/>
}
