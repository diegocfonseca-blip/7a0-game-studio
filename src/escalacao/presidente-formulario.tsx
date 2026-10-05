import {sortearPresidente} from './presidente-sortear'
import {usePresidentOutfitTier,getPresidentOutfitTier} from './presidente-tier-conta'
import {podeVestirModular,seloRoupaModular} from './presidente-vestuario-acesso'
import {VESTUARIO_MODULAR} from './presidente-vestuario-modular'
import {useId,useState} from 'react'
import {Box,Btn} from './ui-primitives'
import {useT} from './lang'
import type {PresidenteBaseSave} from './presidencia-carreira'
import {presidenteCadastrado} from './presidencia-entrada-model'
import {PresidenteCamadas} from './presidente-camadas'
import {aparenciaInicial,aparenciaModular,camadasDoPresidente,escolherPeca,escolherTomPele} from './presidente-aparencia'
import {TONS_PELE} from './presidente-pele'
import {PECAS_PRESIDENTE,type CategoriaPeca} from './presidente-pecas'
import './garagem-preview.css'
import './presidente-base-preview.css'

/** Formulário controlado: não lê rascunho de QA nem grava no localStorage. */
export function PresidenteFormulario({value,onChange,onConfirm,onBack,busy=false,error,existing=false,editing=false}:{
 value:PresidenteBaseSave;onChange:(value:PresidenteBaseSave)=>void;onConfirm:()=>void;onBack:()=>void;busy?:boolean;error?:string;existing?:boolean;editing?:boolean;
}){
 const t=useT(),nameId=useId(),[tab,setTab]=useState<'outfit'|'skin'|CategoriaPeca>('outfit')
 const tier=usePresidentOutfitTier(),canWear=podeVestirModular(value.outfit,tier)
 const [readyKey,setReadyKey]=useState<string|null>(null),layers=camadasDoPresidente(value),visualReady=readyKey===JSON.stringify(layers)
 const appearance=value.appearance??aparenciaInicial()
 const [pieceQuery,setPieceQuery]=useState('')
 const normalizeSearch=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim()
 const visiblePieces=PECAS_PRESIDENTE.filter(p=>p.category===tab&&p.ready&&normalizeSearch(`${p.pt} ${p.en}`).includes(normalizeSearch(pieceQuery)))
 const modular=aparenciaModular(appearance)
 const changePiece=(category:CategoriaPeca,id:string)=>{const next=escolherPeca(appearance,category,id);if(next)onChange({...value,appearance:next})}
 return <section className="gp-root pb-root" aria-label={editing?t('Editar presidente','Edit president'):t('Criar presidente','Create president')}>
  <h1>{editing?t('EDITE SEU PRESIDENTE','EDIT YOUR PRESIDENT'):t('CRIE SEU PRESIDENTE','CREATE YOUR PRESIDENT')}</h1>
  <p>{editing?t('Combine suas peças. A carreira e os bens do clube continuam iguais.','Mix your parts. Your career and club assets stay unchanged.'):existing?t('Seu clube continua de onde parou. Crie o presidente para entrar na sala.','Your club keeps its progress. Create the president to enter the office.'):t('Seu clube já tem nome. Agora escolha quem vai comandá-lo.','Your club has a name. Now choose who will lead it.')}</p>
  <div className="pb-layout"><Box bg="#F4ECD6" className="pb-portrait pb-layered"><PresidenteCamadas ids={layers} onReady={setReadyKey}/></Box>
   <div><div className="gp-filters"><label htmlFor={nameId}>{t('NOME DO PRESIDENTE','PRESIDENT NAME')}<input id={nameId} value={value.name} maxLength={40} disabled={busy} onChange={e=>onChange({...value,name:e.target.value})}/></label></div>
    <h2>{t('SEU VISUAL','YOUR LOOK')}</h2>
    <div className="gp-tabs" aria-label={t('Categorias do visual','Appearance categories')}>{([['outfit','ROUPAS','OUTFITS'],['skin','PELE','SKIN'],['hair','CABELO','HAIR'],['beard','BARBA','BEARD'],['accessory','ACESSÓRIOS','ACCESSORIES']] as const).map(([id,pt,en])=><button type="button" key={id} disabled={busy} aria-pressed={tab===id} onClick={()=>setTab(id)}>{t(pt,en)}</button>)}</div>
    {tab==='skin'?<div className="gp-tabs pb-options" aria-label={t('Cinco tons de pele','Five skin tones')}>{TONS_PELE.map(tone=><button type="button" key={tone.id} disabled={busy} aria-pressed={(modular.skinTone??'medium')===tone.id} onClick={()=>{const next=escolherTomPele(appearance,tone.id);if(next)onChange({...value,appearance:next})}}><span aria-hidden="true" style={{display:'inline-block',width:24,height:24,border:'2px solid #0c0c0c',borderRadius:'50%',background:tone.color,verticalAlign:'middle',marginRight:8}}/>{t(tone.pt,tone.en)}<small>{t('GRÁTIS','FREE')}</small></button>)}</div>:tab==='outfit'?<div className="gp-tabs pb-options pb-outfits">{VESTUARIO_MODULAR.map(({id:outfit,pt,en,src})=><button type="button" key={outfit} disabled={busy||!podeVestirModular(outfit,tier)} aria-pressed={value.outfit===outfit} onClick={()=>{if(podeVestirModular(outfit,getPresidentOutfitTier()))onChange({...value,outfit})}}><img className="pb-outfit-art" src={import.meta.env.BASE_URL+src} alt="" loading="lazy" decoding="async" draggable={false}/>{t(pt,en)}<small>{t(...seloRoupaModular(outfit))}</small></button>)}</div>:<div className="gp-tabs pb-options">
     <label style={{gridColumn:'1 / -1',width:'100%'}}>{t('BUSCAR PEÇA OU JOGADOR','FIND PART OR PLAYER')}<input type="search" value={pieceQuery} disabled={busy} onChange={e=>setPieceQuery(e.target.value)} aria-label={t('Buscar peça ou jogador','Find part or player')} style={{display:'block',width:'100%',boxSizing:'border-box',padding:12,border:'2px solid #0c0c0c',borderRadius:8,font:'inherit'}}/></label>
     {visiblePieces.map(p=><button type="button" key={p.id} disabled={busy} aria-pressed={tab==='accessory'?modular.accessories.includes(p.id):modular[tab]===p.id} onClick={()=>changePiece(tab,p.id)}>{t(p.pt,p.en)}<small>{t('GRÁTIS','FREE')}</small></button>)}
     {!visiblePieces.length&&<p role="status">{t('Nenhuma peça pronta nesta categoria corresponde à busca. Seu visual foi mantido.','No ready parts in this category match your search. Your appearance is unchanged.')}</p>}
     <button type="button" disabled={busy} aria-pressed={tab==='accessory'?modular.accessories.length===0:modular[tab]==='none'} onClick={()=>changePiece(tab,'none')}>{tab==='hair'?t('SEM CABELO','NO HAIR'):tab==='beard'?t('SEM BARBA','NO BEARD'):t('SEM ACESSÓRIOS','NO ACCESSORIES')}</button>
    </div>}
    <p className="gp-rule">{t('Combine as peças: trocar cabelo não muda barba, roupa ou acessórios. As novas artes dos jogadores ainda estão sendo preparadas para encaixar na base.','Mix individual parts: changing hair keeps your beard, outfit and accessories. New player artwork is still being prepared to fit the base.')}</p>
    <p role="alert">{error||(!canWear?t('Esta roupa não está disponível no seu plano. Escolha uma roupa gratuita.','This outfit is unavailable on your plan. Choose a free outfit.'):null)}</p>
    <div style={{marginBottom:12}}><Btn bg="#fff" disabled={busy} onClick={()=>onChange(sortearPresidente(value,Math.random,getPresidentOutfitTier()))}>{t('SORTEAR VISUAL','RANDOMIZE LOOK')}</Btn><p className="gp-rule">{t('Muda cabelo, barba, acessórios e roupa. Mantém seu nome e tom de pele; só grava ao confirmar.','Changes hair, beard, accessories and outfit. Keeps your name and skin tone; only saves when confirmed.')}</p></div>
    <div className="gp-confirm-actions"><Btn disabled={busy||!presidenteCadastrado(value)||!visualReady||!canWear} onClick={()=>{if(visualReady&&podeVestirModular(value.outfit,getPresidentOutfitTier()))onConfirm()}}>{busy?t('SALVANDO…','SAVING…'):editing?t('SALVAR VISUAL','SAVE APPEARANCE'):existing?t('SALVAR E ENTRAR NA SALA','SAVE AND ENTER OFFICE'):t('CONTINUAR','CONTINUE')}</Btn><Btn bg="#fff" disabled={busy} onClick={onBack}>{t('VOLTAR','BACK')}</Btn></div>
   </div>
  </div>
 </section>
}
