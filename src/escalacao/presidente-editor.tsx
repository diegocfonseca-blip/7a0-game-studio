import { useState } from 'react'
import { tr } from './lang'
import { PRESIDENTE_REFERENCIAS } from './presidente-referencias'
import { PRESIDENTE_BASE, PRESIDENTE_DRAFT_KEY, PRESIDENTE_PECAS, PRESIDENTE_PELES, normalizarPresidente } from './presidente-model'
import type { PresidenteVisual } from './presidente-model'
import {PRESIDENTE_ROUPAS,PRESIDENTE_ROUPAS_ARTES,podeVestirRoupa,roupaDisponivel,roupaPronta,type PresidenteRoupaTier} from './presidente-roupas'
import './presidente-editor.css'

const asset=(src:string)=>import.meta.env.BASE_URL+src.replace(/^\//,'')
export function PresidenteRetrato({value}: {value:PresidenteVisual}) {
  const v=normalizarPresidente(value)
  const hair=PRESIDENTE_PECAS.find(p=>p.id===v.hair)
  const beard=PRESIDENTE_PECAS.find(p=>p.id===v.beard)
  const clip=Math.max(0,...PRESIDENTE_PECAS.filter(p=>v.accessories.includes(p.id)).map(p=>p.hairClipFrom??0))
  const hairStyle=clip?{clipPath:`inset(${clip}% 0 0 0)`}:undefined
  return <div className="pv-head" role="img" aria-label={tr('Cabeça padrão do presidente','President’s standard head')}>
    {hair?.back&&<img src={asset(hair.back)} alt="" style={hairStyle}/>}
    <img className="pv-skin" src={asset(PRESIDENTE_PELES.find(s=>s.id===v.skin)?.src??PRESIDENTE_BASE.src)} alt=""/>
    {beard&&<img src={asset(beard.front)} alt=""/>}
    {hair&&<img src={asset(hair.front)} alt="" style={hairStyle}/>}
    {v.accessories.map(id=>{const p=PRESIDENTE_PECAS.find(a=>a.id===id);return p?<img key={id} src={asset(p.front)} alt=""/>:null})}
  </div>
}
export function PresidenteVestido({value,tier=null}:{value:PresidenteVisual;tier?:PresidenteRoupaTier|null}){
 const v=normalizarPresidente(value),allowed=roupaDisponivel(v.outfit,tier),outfit=roupaPronta(allowed)?allowed:'polo-azul'
 return <div className="pv-dressed" data-outfit={outfit} role="img" aria-label={tr('Presidente com a roupa selecionada','President wearing the selected outfit')}><div className="pv-dressed-head"><PresidenteRetrato value={v}/></div><img className="pv-dressed-outfit" src={asset(PRESIDENTE_ROUPAS_ARTES[outfit]!)} alt=""/></div>
}
export default function PresidenteEditor({onSave,tier=null,initialValue}:{onSave?:(value:PresidenteVisual)=>void;tier?:PresidenteRoupaTier|null;initialValue?:PresidenteVisual}={}){
  const [value,setValue]=useState(()=>{if(initialValue)return normalizarPresidente(initialValue);try{return normalizarPresidente(JSON.parse(localStorage.getItem(PRESIDENTE_DRAFT_KEY)??'null'))}catch{return normalizarPresidente(null)}})
  const [tab,setTab]=useState('hair')
  const [message,setMessage]=useState('')
  const [query,setQuery]=useState('')
  const [showSources,setShowSources]=useState(false)
  const choices=PRESIDENTE_PECAS.filter(p=>p.approved&&p.kind===tab)
  const selected=(id:string)=>tab==='hair'?value.hair===id:tab==='beard'?value.beard===id:value.accessories.includes(id)
  const update=(v:Partial<PresidenteVisual>)=>{setValue(old=>normalizarPresidente({...old,...v}));setMessage('')}
  return <main className="pv-editor">
    <header><small>{tr('EM CONSTRUÇÃO · NÃO PUBLICADO','WORK IN PROGRESS · NOT PUBLISHED')}</small><h1>{tr('CRIAR PRESIDENTE','CREATE PRESIDENT')}</h1><p>{tr('Uma cabeça. Suas combinações.','One head. Your combinations.')}</p></header>
    <div className="pv-layout"><section className="pv-preview"><PresidenteVestido value={value} tier={tier}/><strong>{value.name||tr('Meu presidente','My president')}</strong><span>{tr('BASE ÚNICA · VISTA FRONTAL','ONE BASE · FRONT VIEW')}</span></section>
    <section className="pv-panel"><label>{tr('NOME DO PRESIDENTE','PRESIDENT’S NAME')}<input maxLength={40} value={value.name} onChange={e=>update({name:e.target.value})}/></label>
      <nav>{[['hair','CABELO','HAIR'],['beard','BARBA','BEARD'],['skin','PELE','SKIN'],['accessory','ACESSÓRIOS','ACCESSORIES'],['outfit','ROUPAS','OUTFITS']].map(([id,pt,en])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{tr(pt,en)}</button>)}</nav>
      {tab==='outfit'?<section className="pv-wardrobe"><p>{tr('As básicas são grátis. Roupas especiais são cosméticas e não dão vantagem em campo.','Basics are free. Special outfits are cosmetic and provide no advantage on the pitch.')}</p><div className="pv-choice-grid">{PRESIDENTE_ROUPAS.map(r=>{const ready=roupaPronta(r.id),allowed=podeVestirRoupa(r.id,tier);return <button key={r.id} aria-pressed={value.outfit===r.id} disabled={!ready||!allowed} onClick={()=>{if(ready&&allowed)update({outfit:r.id})}}><span>{tr(r.pt,r.en)}</span><small>{r.access==='free'?tr('GRÁTIS','FREE'):r.access==='craque'?'🔒 Craque / Lenda':'🔒 Lenda'}</small>{!ready&&<small>{tr('Arte em preparação','Artwork in preparation')}</small>}</button>})}</div></section>:<>
      <div className="pv-parts"><div className="pv-choice-grid">{tab==='skin'?PRESIDENTE_PELES.map(s=><button key={s.id} aria-pressed={value.skin===s.id} onClick={()=>update({skin:s.id})}>{tr(s.pt,s.en)}</button>):<><button aria-pressed={tab==='accessory'?value.accessories.length===0:selected('none')} onClick={()=>update(tab==='hair'?{hair:'none'}:tab==='beard'?{beard:'none'}:{accessories:[]})}>{tr('SEM','NONE')}</button>{choices.map(p=><button key={p.id} aria-pressed={selected(p.id)} onClick={()=>update(p.kind==='hair'?{hair:p.id}:p.kind==='beard'?{beard:p.id}:{accessories:value.accessories.includes(p.id)?value.accessories.filter(id=>id!==p.id):[...value.accessories,p.id]})}><span className="pv-choice-art" aria-hidden="true">{p.back&&<img src={asset(p.back)} alt="" loading="lazy"/>}<img src={asset(PRESIDENTE_BASE.src)} alt="" loading="lazy"/><img src={asset(p.front)} alt="" loading="lazy"/></span><span>{tr(p.label,p.labelEn??p.label)}</span></button>)}</>}</div>
      <p>{tr('Lote de teste: combine as peças à vontade. Os demais jogadores ainda estão em preparação.','Test batch: mix and match the parts. The remaining players are still being prepared.')}</p></div></>}
      <button className="pv-primary" onClick={()=>{if(!roupaPronta(value.outfit)||!podeVestirRoupa(value.outfit,tier)){setMessage(tr('Escolha uma roupa disponível na aba Roupas para salvar.','Choose an available outfit in the Outfits tab before saving.'));return}try{localStorage.setItem(PRESIDENTE_DRAFT_KEY,JSON.stringify(value));setMessage(tr('Rascunho salvo somente neste navegador.','Draft saved only in this browser.'));onSave?.(value)}catch{setMessage(tr('Não foi possível salvar. Sua prévia continua aqui.','Could not save. Your preview is still here.'))}}}>{tr('SALVAR RASCUNHO','SAVE DRAFT')}</button>
      <p role="status">{message||tr('Sem alterar carreira, cartas ou conta.','Does not change your career, cards or account.')}</p>
    </section></div>
    <section className="pv-sources"><button onClick={()=>setShowSources(!showSources)} aria-expanded={showSources}>{tr('VER AS 62 REFERÊNCIAS ESCOLHIDAS','VIEW THE 62 SELECTED REFERENCES')}</button>
    {showSources&&<><p>{tr('Referências existentes, não peças prontas. Sem jogador adicional.','Existing references, not finished parts. No additional players.')}</p><input aria-label={tr('Buscar jogador','Find player')} value={query} onChange={e=>setQuery(e.target.value)}/><ul>{PRESIDENTE_REFERENCIAS.filter(p=>p.player.toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(p=><li key={p.id}><img loading="lazy" src={asset(p.reference)} alt={p.player}/><strong>{p.player}</strong><small>{p.club} · {p.year}</small></li>)}</ul></>}
    </section>
  </main>
}
