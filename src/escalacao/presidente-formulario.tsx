import {sortearPresidente} from './presidente-sortear'
import {usePosseConta,getPosseConta,recarregarMinhasPecas,visualCabeNaPosse} from './presidente-conta'
import {podeSalvarPresidente,seloPeca} from './presidente-plano'
import {seloRoupaModular} from './presidente-vestuario-acesso'
import {ROUPA_GRATIS,compraPossivel,podeVestirComPosse,podeUsarPecaAvulsa,refPeca,refRoupa,temBoneco,type PosseAvulsa} from './presidente-avulsas'
import {PixMP} from './pix-mp'
import {precoTxt} from './planos-regras'
import {createPortal} from 'react-dom'
import {VESTUARIO_MODULAR} from './presidente-vestuario-modular'
import {useCallback,useId,useState} from 'react'
import {Box,Btn} from './ui-primitives'
import {useT} from './lang'
import type {PresidenteBaseSave} from './presidencia-carreira'
import {presidenteCadastrado} from './presidencia-entrada-model'
import {PresidenteCamadas} from './presidente-camadas'
import {aparenciaInicial,aparenciaModular,camadasDoPresidente,escolherPeca,escolherTomPele} from './presidente-aparencia'
import {TONS_PELE} from './presidente-pele'
import {PECAS_PRESIDENTE,type CategoriaPeca} from './presidente-pecas'
import {PRESIDENTE_LAYERS} from './presidente-rig'
import './garagem-preview.css'
import './presidente-base-preview.css'

/** Formulário controlado: não lê rascunho de QA nem grava no localStorage.
 * 💳 15/10 (Diego: "nada é de graça"): quem libera cada coisa é o PLANO da conta (presidente-plano.ts).
 * Grátis monta à vontade pra ver, mas o botão de salvar fica travado com o motivo e o caminho.
 * 🛍️ 19/10 (Diego: "ok pode fazer tudo nisso já pelo pix do mercado pago"): toda peça fora do plano mostra o PREÇO avulso
 * (Craque 1,99 · Lenda 2,99 · Batismo 3,99 · Fundador 4,99) e dá pra provar antes; o Pix sai na hora. Grátis: a 1ª compra é
 * uma ROUPA, que já vem com o boneco careca. Quem confere preço e entrega é o banco (presidente-avulsas.ts). */
export function PresidenteFormulario({value,onChange,onConfirm,onBack,busy=false,error,existing=false,editing=false,intro,guided=false}:{
 value:PresidenteBaseSave;onChange:(value:PresidenteBaseSave)=>void;onConfirm:()=>void;onBack:()=>void;busy?:boolean;error?:string;existing?:boolean;editing?:boolean;intro?:string;guided?:boolean;
}){
 const t=useT(),nameId=useId(),[tab,setTab]=useState<'outfit'|'skin'|CategoriaPeca>('outfit')
 const [customizing,setCustomizing]=useState(false),[showLocked,setShowLocked]=useState(false)
 const posse=usePosseConta(),canWear=podeVestirComPosse(value.outfit,posse),boneco=temBoneco(posse),cabe=visualCabeNaPosse(value,posse)
 const [comprando,setComprando]=useState<string|null>(null)
 const pagou=useCallback(()=>{void recarregarMinhasPecas()},[])
 const [readyKey,setReadyKey]=useState<string|null>(null),layers=camadasDoPresidente(value),visualReady=readyKey===JSON.stringify(layers)
 const appearance=value.appearance??aparenciaInicial(),modular=aparenciaModular(appearance)
 const [pieceQuery,setPieceQuery]=useState(''),[facePreview,setFacePreview]=useState(false)
 const normalizeSearch=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim()
 const visiblePieces=PECAS_PRESIDENTE.filter(p=>p.category===tab&&p.ready&&normalizeSearch(`${p.pt} ${p.en}`).includes(normalizeSearch(pieceQuery))&&(!guided||showLocked||podeUsarPecaAvulsa(p.id,posse)))
 // Básico primeiro em TODA listagem; na entrada guiada, as peças disponíveis vêm antes das extras.
 const outfits=[...VESTUARIO_MODULAR].sort((a,b)=>Number(b.id===ROUPA_GRATIS)-Number(a.id===ROUPA_GRATIS)||Number(podeVestirComPosse(b.id,posse))-Number(podeVestirComPosse(a.id,posse)))
 const visibleOutfits=outfits.filter(r=>!guided||showLocked||podeVestirComPosse(r.id,posse))
 const changePiece=(category:CategoriaPeca,id:string)=>{const next=escolherPeca(appearance,category,id);if(next)onChange({...value,appearance:next})}
 const seloP=t(...seloPeca()),seloPecaDe=(id:string)=>podeUsarPecaAvulsa(id,posse)?seloP:'🔒 '+seloP
 const faltam=pecasQueFaltam(value,posse)
 const restoreAvailable=()=>{
  let next=appearance
  for(const category of ['hair','beard'] as const)if(!podeUsarPecaAvulsa(modular[category],posse))next=escolherPeca(next,category,'none')??next
  for(const id of modular.accessories)if(!podeUsarPecaAvulsa(id,posse))next=escolherPeca(next,'accessory',id)??next
  onChange({...value,outfit:canWear?value.outfit:ROUPA_GRATIS,appearance:next})
 }
 const actions=<div className="gp-confirm-actions"><Btn disabled={busy||!presidenteCadastrado(value)||!visualReady||!cabe} onClick={()=>{if(visualReady&&visualCabeNaPosse(value,getPosseConta()))onConfirm()}}>{busy?t('SALVANDO…','SAVING…'):guided?t('CONTINUAR PARA OS RIVAIS →','CONTINUE TO RIVALS →'):editing?t('SALVAR VISUAL','SAVE APPEARANCE'):existing?t('SALVAR E ENTRAR NA SALA','SAVE AND ENTER OFFICE'):t('CONTINUAR','CONTINUE')}</Btn>{!guided&&<Btn bg="#fff" disabled={busy} onClick={onBack}>{t('VOLTAR','BACK')}</Btn>}</div>
 const skinChoices=TONS_PELE.map(tone=><button type="button" key={tone.id} disabled={busy} aria-label={t(`Tom de pele: ${tone.pt}`,`Skin tone: ${tone.en}`)} aria-pressed={(modular.skinTone??'medium')===tone.id} onClick={()=>{const next=escolherTomPele(appearance,tone.id);if(next)onChange({...value,appearance:next})}}><span aria-hidden="true" style={guided?{background:tone.color}:{display:'inline-block',width:24,height:24,border:'2px solid #0c0c0c',borderRadius:'50%',background:tone.color,verticalAlign:'middle',marginRight:8}}/>{!guided&&<>{t(tone.pt,tone.en)}<small>{t('GRÁTIS PARA TODOS','FREE FOR EVERYONE')}</small></>}</button>)
 return <section className={`gp-root pb-root${guided?' pb-guided':''}`} aria-label={editing?t('Editar presidente','Edit president'):t('Criar presidente','Create president')}>
  <h1>{editing?t('EDITE SEU PRESIDENTE','EDIT YOUR PRESIDENT'):t('CRIE SEU PRESIDENTE','CREATE YOUR PRESIDENT')}</h1><p>{intro??(editing?t('Combine suas peças. A carreira e os bens do clube continuam iguais.','Mix your parts. Your career and club assets stay unchanged.'):existing?t('Seu clube continua de onde parou. Crie o presidente para entrar na sala.','Your club keeps its progress. Create the president to enter the office.'):guided?t('Ele representa você no jogo. Escolha um nome e um tom de pele para continuar.','This is you in the game. Choose a name and skin tone to continue.'):t('Seu clube já tem nome. Agora escolha quem vai comandá-lo.','Your club has a name. Now choose who will lead it.'))}</p>
  <div className="pb-layout"><div className="pb-preview-panel"><Box bg="#F4ECD6" className={'pb-portrait pb-layered'+(facePreview?' pb-face-preview':'')}><PresidenteCamadas ids={layers} onReady={setReadyKey}/></Box><div className="gp-tabs pb-preview-controls" aria-label={t('Enquadramento da prévia','Preview framing')}><button type="button" aria-pressed={!facePreview} onClick={()=>setFacePreview(false)}>{t('CORPO INTEIRO','FULL BODY')}</button><button type="button" aria-pressed={facePreview} onClick={()=>setFacePreview(true)}>{t('VER ROSTO','VIEW FACE')}</button></div></div>
   <div className="pb-details"><div className="gp-filters"><label htmlFor={nameId}>{t('NOME DO PRESIDENTE','PRESIDENT NAME')}<input id={nameId} value={value.name} maxLength={40} disabled={busy} onChange={e=>onChange({...value,name:e.target.value})}/></label></div>
    {guided&&<><h2>{t('Seu tom de pele','Your skin tone')}</h2><div className="pb-skin-quick" role="group" aria-label={t('Tons de pele gratuitos','Free skin tones')}>{skinChoices}</div><p className="pb-available-note">{t('Os cinco tons de pele estão disponíveis para todos, inclusive no plano gratuito.','All five skin tones are available to everyone, including free players.')}</p></>}
    {faltam.length>0&&<CompraPecas faltam={faltam} posse={posse} busy={busy} onBuy={setComprando} onTirar={id=>{if(id.startsWith('r-'))return;const pc=PECAS_PRESIDENTE.find(x=>refPeca(x.id)===id);if(pc){const next=escolherPeca(appearance,pc.category,pc.category==='accessory'?pc.id:'none');if(next)onChange({...value,appearance:next})}}}/>}
    {guided&&!cabe&&<button type="button" className="cse-secondary pb-restore" disabled={busy} onClick={restoreAvailable}>{t('Voltar ao visual disponível na minha conta','Return to my available look')}</button>}
    <p role="alert">{error||(!canWear&&!faltam.length?t('Esta roupa não está disponível. Escolha outra.','This outfit is not available. Pick another.'):null)}</p>
    {guided&&<>{!value.name.trim()&&<p className="gp-rule">{t('Digite o nome do presidente para continuar.','Enter your president’s name to continue.')}</p>}{actions}<button type="button" className="cse-secondary pb-customize-toggle" disabled={busy} aria-expanded={customizing} onClick={()=>setCustomizing(v=>!v)}>{t('Personalizar personagem','Customize character')} {customizing?'−':'+'}</button></>}
    {(!guided||customizing)&&<div className="pb-customization"><h2>{t('SEU VISUAL','YOUR LOOK')}</h2>
     <div className="gp-tabs" aria-label={t('Categorias do visual','Appearance categories')}>{([['outfit','ROUPAS','OUTFITS'],['skin','PELE','SKIN'],['hair','CABELO','HAIR'],['beard','BARBA','BEARD'],['accessory','ACESSÓRIOS','ACCESSORIES']] as const).filter(([id])=>!guided||id!=='skin').map(([id,pt,en])=><button type="button" key={id} disabled={busy} aria-pressed={tab===id} onClick={()=>{setTab(id);setPieceQuery('')}}>{t(pt,en)}</button>)}</div>
     {guided&&<><p className="gp-rule">{showLocked?t('Você também está vendo peças de outros planos e de compra avulsa. Provar não compra nada.','You are also viewing items from other plans and one-off purchases. Trying them on does not buy them.'):t('Mostrando o que já está disponível na sua conta.','Showing what is already available on your account.')}</p><button type="button" className="cse-secondary pb-catalog-toggle" aria-pressed={showLocked} onClick={()=>setShowLocked(v=>!v)}>{showLocked?t('Ver só o que já posso usar','Show only what I can wear'):t('Ver outras opções · planos e avulsos','More options · plans and one-off items')}</button></>}
     {tab==='skin'?<div className="gp-tabs pb-options" aria-label={t('Cinco tons de pele','Five skin tones')}>{skinChoices}</div>:tab==='outfit'?<div className="gp-tabs pb-options pb-outfits">{visibleOutfits.map(({id:outfit,pt,en,src})=><button type="button" key={outfit} disabled={busy} aria-pressed={value.outfit===outfit} onClick={()=>onChange({...value,outfit})}><img className="pb-outfit-art" src={import.meta.env.BASE_URL+src} alt="" loading="lazy" decoding="async" draggable={false}/>{t(pt,en)}<small>{outfit===ROUPA_GRATIS?t('🎁 GRÁTIS','🎁 FREE'):podeVestirComPosse(outfit,posse)?t(...seloRoupaModular(outfit)):'🔒 '+t(...seloRoupaModular(outfit))}</small></button>)}</div>:<div className="gp-tabs pb-options"><label style={{gridColumn:'1 / -1',width:'100%'}}>{t('BUSCAR PEÇA OU JOGADOR','FIND PART OR PLAYER')}<input type="search" value={pieceQuery} disabled={busy} onChange={e=>setPieceQuery(e.target.value)} aria-label={t('Buscar peça ou jogador','Find part or player')} style={{display:'block',width:'100%',boxSizing:'border-box',padding:12,border:'2px solid #0c0c0c',borderRadius:8,font:'inherit'}}/></label>
      {visiblePieces.map(p=><button type="button" key={p.id} disabled={busy} aria-pressed={tab==='accessory'?modular.accessories.includes(p.id):modular[tab]===p.id} onClick={()=>changePiece(tab,p.id)}><span className="pb-piece-art" aria-hidden="true">{p.layers.slice(0,1).map(id=>{const layer=PRESIDENTE_LAYERS.find(part=>part.id===id);return layer?<img key={id} src={import.meta.env.BASE_URL+layer.src} alt="" loading="lazy"/>:null})}</span>{t(p.pt,p.en)}<small>{seloPecaDe(p.id)}</small></button>)}
      {!visiblePieces.length&&<p role="status">{t('Nenhuma peça disponível corresponde à busca. Seu visual foi mantido.','No available parts match your search. Your appearance is unchanged.')}</p>}<button type="button" disabled={busy} aria-pressed={tab==='accessory'?modular.accessories.length===0:modular[tab]==='none'} onClick={()=>changePiece(tab,'none')}>{tab==='hair'?t('SEM CABELO','NO HAIR'):tab==='beard'?t('SEM BARBA','NO BEARD'):t('SEM ACESSÓRIOS','NO ACCESSORIES')}</button></div>}
     <p className="gp-rule">{t('Combine as peças: trocar cabelo não muda barba, roupa ou acessórios. Use VER ROSTO para conferir os detalhes. Suas escolhas só são gravadas ao confirmar.','Mix individual parts: changing hair keeps your beard, outfit and accessories. Use VIEW FACE to check details. Your choices are only saved when you confirm.')}</p>
     <div style={{marginBottom:12}}><Btn bg="#fff" disabled={busy||!boneco} onClick={()=>onChange(sortearPresidente(value,Math.random,getPosseConta()))}>{t('SORTEAR VISUAL','RANDOMIZE LOOK')}</Btn><p className="gp-rule">{t('Muda só as peças disponíveis na sua conta. Mantém seu nome e tom de pele.','Changes only items available on your account. Keeps your name and skin tone.')}</p></div>{!guided&&actions}
    </div>}
   </div>
  </div>{comprando&&<PixPeca ref_={comprando} posse={posse} onPagou={pagou} onClose={()=>setComprando(null)}/>}
 </section>
}

/** as peças do visual de agora que ainda não são da conta (roupa primeiro, depois rosto) */
export function pecasQueFaltam(value:PresidenteBaseSave,posse:PosseAvulsa):string[]{
 if(podeSalvarPresidente(posse.plano)&&podeVestirComPosse(value.outfit,posse))return []
 const out:string[]=[]
 if(!podeVestirComPosse(value.outfit,posse))out.push(refRoupa(value.outfit))
 if(!podeSalvarPresidente(posse.plano)){
  const a=aparenciaModular(value.appearance??aparenciaInicial())
  for(const id of [a.hair,a.beard,...a.accessories])if(id!=='none'&&!podeUsarPecaAvulsa(id,posse))out.push(refPeca(id))
 }
 return out
}
const nomeDaRef=(ref:string,t:(pt:string,en:string)=>string)=>{
 const id=ref.slice(2)
 const r=ref.startsWith('r-')?VESTUARIO_MODULAR.find(x=>x.id===id):PECAS_PRESIDENTE.find(x=>x.id===id)
 return r?t(r.pt,r.en):id
}
/** a caixa "falta comprar": cada peça com o preço e o botão. Peça do rosto sem boneco diz "primeiro a roupa". */
function CompraPecas({faltam,posse,busy,onBuy,onTirar}:{faltam:readonly string[];posse:PosseAvulsa;busy:boolean;onBuy:(ref:string)=>void;onTirar:(ref:string)=>void}){
 const t=useT(),en=t('pt','en')==='en'
 return <div style={{background:'#fff',border:'3px solid #0c0c0c',borderRadius:12,boxShadow:'3px 3px 0 #0c0c0c',padding:10,margin:'10px 0'}}>
  <b style={{fontFamily:'Oswald, sans-serif',fontWeight:800,textTransform:'uppercase',fontSize:15}}>{t('🛒 Ainda não é seu','🛒 Not yours yet')}</b>
  <p className="gp-rule" style={{margin:'2px 0 8px'}}>{t('Pra salvar, compre as peças abaixo (pagamento único, ficam na sua conta pra sempre) ou troque por uma que já é sua.','To save, buy the items below (one-time payment, yours forever) or swap for one you already own.')}</p>
  {faltam.map(ref=>{const c=compraPossivel(ref,posse);return <div key={ref} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderTop:'1px dashed rgba(12,12,12,.25)'}}>
   <span style={{flex:1,minWidth:0,fontWeight:800,fontSize:13}}>{ref.startsWith('r-')?'👔 ':'💇 '}{nomeDaRef(ref,t)}</span>
   {c.ok?<button type="button" disabled={busy} onClick={()=>onBuy(ref)} style={{fontFamily:'Oswald, sans-serif',fontWeight:800,fontSize:14,background:'#1B7A3D',color:'#fff',border:'2px solid #0c0c0c',borderRadius:9,boxShadow:'2px 2px 0 #0c0c0c',padding:'5px 10px',cursor:'pointer',whiteSpace:'nowrap'}}>{t('COMPRAR','BUY')} · {precoTxt(c.preco,en)}</button>
    :c.motivo==='roupa_primeiro'?<small style={{fontWeight:800,fontSize:11,maxWidth:170,textAlign:'right'}}>{t('Escolha primeiro uma roupa: ela já vem com o seu boneco.','Pick an outfit first: it comes with your figure.')}</small>:null}
   {ref.startsWith('p-')&&<button type="button" disabled={busy} onClick={()=>onTirar(ref)} aria-label={t('tirar','remove')} style={{background:'transparent',border:'2px solid #0c0c0c',borderRadius:8,fontWeight:900,padding:'3px 8px',cursor:'pointer'}}>✕</button>}
  </div>})}
 </div>
}
/** o Pix da peça, numa janela por cima do editor */
function PixPeca({ref_,posse,onPagou,onClose}:{ref_:string;posse:PosseAvulsa;onPagou:()=>void;onClose:()=>void}){
 const t=useT(),c=compraPossivel(ref_,posse)
 return createPortal(<div role="dialog" aria-modal="true" onClick={onClose} style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(12,12,12,.6)',display:'grid',placeItems:'center',padding:16,overflowY:'auto'}}>
  <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:380,color:'#0c0c0c',background:'#F4ECD6',border:'3px solid #0c0c0c',borderRadius:16,boxShadow:'4px 4px 0 #0c0c0c',padding:12}}>
   <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><b style={{fontFamily:'Oswald, sans-serif',fontWeight:800,textTransform:'uppercase',fontSize:16,flex:1}}>{nomeDaRef(ref_,t)}</b><button type="button" onClick={onClose} aria-label={t('fechar','close')} style={{background:'#fff',border:'2px solid #0c0c0c',borderRadius:9,fontWeight:900,padding:'3px 10px',cursor:'pointer'}}>✕</button></div>
   <PixMP produto="peca_presidente" refId={ref_} valor={c.ok?c.preco:undefined} aoPagar={onPagou}/>
   <button type="button" onClick={onClose} style={{width:'100%',marginTop:10,fontFamily:'Oswald, sans-serif',fontWeight:800,fontSize:16,textTransform:'uppercase',background:'#FFC400',border:'3px solid #0c0c0c',borderRadius:12,boxShadow:'3px 3px 0 #0c0c0c',padding:'8px 0',cursor:'pointer'}}>{t('👕 Voltar e vestir','👕 Back to dressing')}</button>
  </div>
 </div>,document.body)
}
