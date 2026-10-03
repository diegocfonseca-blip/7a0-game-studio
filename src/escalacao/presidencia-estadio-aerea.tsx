import {useRef} from 'react'
import {Btn} from './ui-primitives'
import {useT} from './lang'
import type {StadiumSave} from './estadiodata'
import {vistaInicialEstadio} from './presidencia-vista-estadio'
import {PresidenciaEstadioImagem} from './presidencia-estadio-imagem'
import {PresidenciaEstadioObrasLista} from './presidencia-estadio-obras-lista'
import {estadioCompletoNaAerea} from './presidencia-estadio-completo'
import {geralNaAerea} from './presidencia-estadio-geral'
import {cadeirasExatasParaArte} from './presidencia-estadio-cadeiras'
import {visitanteExatoParaArte} from './presidencia-estadio-visitante'
import {camaroteExatoParaArte} from './presidencia-estadio-camarote'
import {estadioVisualValido} from './presidencia-estadio-validacao'
/** Ampliação da câmera real disponível; não reaproveita SVG rejeitado. */
export function PresidenciaEstadioAerea({stadium,onRoof}:{stadium?:StadiumSave;onRoof?:(closed:boolean)=>void}){
 const t=useT(),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLSpanElement>(null),view=vistaInicialEstadio(stadium)
 return <>
  <span ref={trigger}><Btn bg="#fff" onClick={()=>{const d=dialog.current;if(d){d.showModal();d.querySelector('h2')?.focus({preventScroll:true});d.scrollTop=0}}}>{t('VISÃO AÉREA','AERIAL VIEW')}</Btn></span>
  <dialog ref={dialog} className="gp-dialog" style={{width:'min(960px,calc(100vw - 24px))'}} aria-label={t('Visão aérea do estádio','Stadium aerial view')} onClose={()=>trigger.current?.querySelector('button')?.focus()}>
   <h2 tabIndex={-1} style={{fontFamily:'Oswald,sans-serif'}}>{t('SEU ESTÁDIO E A REGIÃO','YOUR STADIUM AND ITS AREA')}</h2>
   <PresidenciaEstadioImagem stadium={stadium} camera="aerial"/>
   {estadioVisualValido(stadium)&&stadium.ext.includes('retratil')&&<div style={{margin:'12px 0'}}>
    <p role="status">{stadium.roofClosed?t('Teto fechado','Roof closed'):t('Teto aberto','Roof open')}</p>
   {!estadioCompletoNaAerea(stadium)&&<p data-roof-art-pending="true">{t('Teto retrátil comprado. Você pode abri-lo ou fechá-lo, mas esta prévia parcial ainda não mostra o teto.','Retractable roof purchased. You can open or close it, but this partial preview does not show the roof yet.')}</p>}
    {onRoof&&<Btn onClick={()=>onRoof(stadium.roofClosed!==true)}>{stadium.roofClosed?t('ABRIR TETO','OPEN ROOF'):t('FECHAR TETO','CLOSE ROOF')}</Btn>}
   </div>}
   <PresidenciaEstadioObrasLista stadium={stadium}/>
   {camaroteExatoParaArte(stadium)&&<p>{t('Os camarotes laterais aparecem na vista aérea, preservando a visão do campo pela janela da presidência.','The side boxes appear in the aerial view, keeping the field visible through the president office window.')}</p>}
   {visitanteExatoParaArte(stadium)&&<p>{t('Gramado, Geral, Cadeiras e Visitante concluídos. Esta etapa aparece também na janela e na garagem.','Pitch, general terraces, seats and away stand completed. This stage also appears in the window and garage.')}</p>}
   <div hidden={visitanteExatoParaArte(stadium)||camaroteExatoParaArte(stadium)}>
   <p>{estadioCompletoNaAerea(stadium)?t('Obras completas. O teto acompanha sua escolha. A janela e a garagem acompanham o mesmo teto. Público ilustrativo.','All construction completed. The roof follows your choice. The office window and garage follow the same roof. Illustrative crowd.'):cadeirasExatasParaArte(stadium)?t('Gramado, Geral e Cadeiras concluídos. A sala do presidente cresce junto com esta etapa nas duas vistas.','Pitch, general terraces and seats completed. The president office grows with this stage in both views.'):geralNaAerea(stadium)?t('Gramado e Geral concluídos. A mesma etapa aparece na janela da sala e na garagem.','Pitch and general terraces completed. The same stage appears in the office window and garage.'):view.supported?t('O gramado acompanha as obras da carreira, como na janela da sala e na garagem.','Pitch construction follows your career, just like the office window and garage.'):t('A vista aérea destas arquibancadas e coberturas ainda não está concluída. Nenhuma obra foi alterada.','The aerial view of these stands and roofs is not finished yet. No construction was changed.')}</p>
   </div>
   <Btn bg="#fff" onClick={()=>dialog.current?.close()}>{t('VOLTAR','BACK')}</Btn>
  </dialog>
 </>
}
