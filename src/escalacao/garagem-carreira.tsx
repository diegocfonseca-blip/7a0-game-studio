import {GaragemVista} from './garagem-vista'
import {GaragemExperimentar} from './garagem-experimentar'
import {ARTES_VEICULOS} from './presidencia-veiculos-artes'
import {arteCatalogoPresidencia,compraPresidenciaDisponivel} from './presidencia-artes-disponiveis'
import type {StadiumSave} from './estadiodata'
import {useRef,useState,type ReactNode} from 'react'
import {Box,Btn} from './ui-primitives'
import {useT} from './lang'
import {PRESIDENCIA_ERROS,itemPresidencia,orcarPresidencia,valorRevenda,type PresidenciaCarteira,type PresidenciaOrcamento,type PresidenciaItemId} from './presidencia-economia'
import type {DuplaGaragem} from './presidencia-garagem'
import {duplaDaGaragem} from './presidencia-garagem'
import {GaragemDuplaSeletores} from './garagem-dupla-seletores'
import {filtrarCatalogoPresidencia,ordemCatalogoValida,type OrdemCatalogo} from './presidencia-catalogo-filtro'
import {getLang} from './lang'
import './garagem-preview.css'

export function GaragemCarreira({wallet,display,onTrade,onDisplay,onBack,stadium,stadiumSave,furniture=false}:{wallet:PresidenciaCarteira|null;display?:DuplaGaragem;onTrade:(quote:PresidenciaOrcamento)=>boolean;onDisplay:(pair:DuplaGaragem)=>boolean;onBack:()=>void;stadium?:ReactNode;stadiumSave?:StadiumSave;furniture?:boolean}){
 const [preview,setPreview]=useState<PresidenciaItemId|null>(null)
 const t=useT(),dialog=useRef<HTMLDialogElement>(null),[quote,Q]=useState<PresidenciaOrcamento|null>(null),[notice,N]=useState(''),[tab,T]=useState<'carro'|'duas-rodas'|'owned'>('carro'),[search,S]=useState(''),[order,O]=useState<OrdemCatalogo>('price-asc'),[replacements,R]=useState<Partial<Record<PresidenciaItemId,PresidenciaItemId>>>({})
 if(!wallet)return <p role="alert">{t('Não foi possível conferir seus bens. Compras bloqueadas.','Could not verify your assets. Purchases blocked.')}</p>
 const request=(kind:'buy'|'sell',id:PresidenciaItemId,replaceId?:PresidenciaItemId)=>{const r=orcarPresidencia(wallet,{kind,id,...(replaceId?{replaceId}:{})});if(!r.ok){N(t(...PRESIDENCIA_ERROS[r.error]));return}Q(r.value);N('');dialog.current?.showModal()}
 const products=filtrarCatalogoPresidencia({furniture,tab,owned:wallet.owned,search,order,english:getLang()==='en'}).filter(p=>compraPresidenciaDisponivel(p.id)||wallet.owned.some(b=>b.id===p.id))
 return <section className="gp-root">
  <header className="gp-header"><h1>{furniture?t('MOBÍLIAS','FURNITURE'):t('GARAGEM','GARAGE')}</h1><span className="gp-coins">{wallet.cash} {t('moedas','coins')}</span></header>
  {stadium}
  {!furniture&&<>
  <GaragemVista owned={wallet.owned} display={display} stadium={stadiumSave} onDisplay={onDisplay}/>
  <p className="gp-rule">{t('Até 2 carros + 2 motos ou bicicletas. Revenda por 70% do valor pago.','Up to 2 cars + 2 motorcycles or bicycles. Resale at 70% of the price paid.')}</p>
  <GaragemDuplaSeletores owned={wallet.owned} display={display} onDisplay={onDisplay} onError={N}/>
  <p className="gp-rule">{t('Troque os lados pelos seletores. Obras avançadas e recortes de outros veículos ainda estão em preparação.','Swap sides using the selectors. Advanced construction and other vehicle cutouts are still in preparation.')}</p>
  <div className="gp-tabs">{(['carro','duas-rodas','owned'] as const).map((id,i)=><button key={id} aria-pressed={tab===id} onClick={()=>T(id)}>{[t('CARROS','CARS'),t('MOTOS E BIKES','MOTORCYCLES & BIKES'),t('MEUS BENS','MY ASSETS')][i]}</button>)}</div>
  </>}
  {furniture&&<p className="gp-rule">{t('Uma peça por categoria. O móvel comprado aparece na sua sala. Você pode dar a peça atual na troca por 70% do valor pago, após conferir e confirmar.','One item per category. Purchased furniture appears in your office. You can trade in the current item for 70% of its purchase price after reviewing and confirming.')}</p>}
  <div className="gp-filters"><label>{t('BUSCAR','SEARCH')}<input value={search} onChange={e=>S(e.target.value)}/></label><label>{t('ORDENAR','SORT')}<select aria-label={t('ORDENAR','SORT')} value={order} onChange={e=>{if(ordemCatalogoValida(e.target.value))O(e.target.value)}}><option value="price-asc">{t('Menor preço','Lowest price')}</option><option value="price-desc">{t('Maior preço','Highest price')}</option><option value="name">{t('Nome A–Z','Name A–Z')}</option></select></label></div>
  <p role="status" className="gp-notice">{notice}</p>
  {products.length===0&&<p role="status">{t('Nenhum item encontrado. Tente outro nome ou categoria.','No items found. Try another name or category.')}</p>}
  <div className="gp-grid">{products.map(p=>{const owned=wallet.owned.find(b=>b.id===p.id),options=wallet.owned.filter(b=>itemPresidencia(b.id)?.slot===p.slot),replacement=options.some(b=>b.id===replacements[p.id])?replacements[p.id]:undefined;return <Box key={p.id} className="gp-product">
   {arteCatalogoPresidencia(p.id)?<img className="gp-product-art" src={import.meta.env.BASE_URL+arteCatalogoPresidencia(p.id)} alt={t(p.pt,p.en)}/>:<p>{t('Arte em preparação','Artwork in preparation')}</p>}
   <h2>{t(p.pt,p.en)}</h2><strong>{p.price} {t('moedas','coins')}</strong>
   {!owned&&ARTES_VEICULOS[p.id]?.scene&&<a className="gp-preview-link" href={'#preview-'+p.id} onClick={e=>{e.preventDefault();setPreview(p.id)}}>{t('VER NA GARAGEM','VIEW IN GARAGE')}</a>}
   {!owned&&options.length>0&&<div className="gp-filters gp-trade-filter"><label>{t('DAR NA TROCA','TRADE IN')}<select aria-label={t('Dar na troca: ','Trade in: ')+t(p.pt,p.en)} value={replacement??''} onChange={e=>{const id=options.find(b=>b.id===e.target.value)?.id;R(prev=>({...prev,[p.id]:id}))}}><option value="">{t('Sem troca','No trade-in')}</option>{options.map(b=><option key={b.id} value={b.id}>{t(itemPresidencia(b.id)!.pt,itemPresidencia(b.id)!.en)} (+{valorRevenda(b.paid)})</option>)}</select></label></div>}
   <Btn bg="#fff" onClick={()=>request(owned?'sell':'buy',p.id,owned?undefined:replacement)}>{owned?`${t('VENDER POR','SELL FOR')} ${valorRevenda(owned.paid)}`:replacement?t('CONFERIR TROCA','REVIEW TRADE'):t('COMPRAR','BUY')}</Btn>
  </Box>})}</div>
  <div className="gp-confirm-actions" style={{marginTop:18}}><Btn bg="#fff" onClick={onBack}>{t('VOLTAR','BACK')}</Btn></div>
  {preview&&<GaragemExperimentar key={preview} id={preview} stadium={stadiumSave} onClose={()=>setPreview(null)} onReview={()=>{const id=preview;setPreview(null);request('buy',id,replacements[id])}}/>}
  <dialog ref={dialog} className="gp-dialog" aria-label={t('Confirmar negociação','Confirm transaction')} onClose={()=>Q(null)}>{quote&&<>
   <h2>{t('CONFIRMAR NEGOCIAÇÃO','CONFIRM TRANSACTION')}</h2><p>{t('Usa as moedas da sua carreira.','Uses your career coins.')}</p>
   <p>{t(itemPresidencia(quote.pedido.id)!.pt,itemPresidencia(quote.pedido.id)!.en)}</p>
   {quote.pedido.kind==='buy'&&['carro','duas-rodas'].includes(itemPresidencia(quote.pedido.id)!.slot)&&!ARTES_VEICULOS[quote.pedido.id]?.scene&&<p className="gp-rule" data-purchase-art-pending>{t('Este modelo ainda não tem arte para a vista externa. A compra entra nos seus bens e no patrimônio, mas o veículo não aparece na garagem nem pela janela até o recorte ficar pronto.','This model does not yet have exterior artwork. The purchase counts toward your inventory and assets, but the vehicle will not appear in the garage or office window until its cutout is ready.')}</p>}
   {quote.sale&&<p>{t('Você vende: ','You sell: ')}<strong>{t(itemPresidencia(quote.sale.id)!.pt,itemPresidencia(quote.sale.id)!.en)}</strong>{t(' por ',' for ')}{quote.credit} {t('moedas.','coins.')}</p>}
   {quote.sale&&duplaDaGaragem(wallet.owned,display).includes(quote.sale.id)&&<p className="gp-rule" data-sale-impact="vehicle">{t('Este veículo está exposto. Ao confirmar, ele sai da vista externa e da janela da presidência. Confira a dupla nos seletores depois da negociação.','This vehicle is on display. Confirming removes it from the exterior view and office window. Review your pair using the selectors after the transaction.')}</p>}
   {quote.sale&&!['carro','duas-rodas'].includes(itemPresidencia(quote.sale.id)!.slot)&&<p className="gp-rule" data-sale-impact="furniture">{t('Ao confirmar, esta mobília sai da sala e do patrimônio. Se for uma troca, a nova peça ocupa seu lugar. Vender a estante não apaga seus títulos.','Confirming removes this furniture from the office and assets. For a trade-in, the new piece replaces it. Selling a trophy cabinet does not erase your titles.')}</p>}
   <dl><dt>{t('Saldo atual','Current balance')}</dt><dd>{wallet.cash}</dd><dt>{t('Compra','Purchase')}</dt><dd>−{quote.price}</dd><dt>{t('Revenda','Resale')}</dt><dd>+{quote.credit}</dd><dt>{t('Saldo final','Final balance')}</dt><dd>{quote.finalCash}</dd></dl>
   <div className="gp-confirm-actions"><Btn onClick={()=>{if(onTrade(quote)){dialog.current?.close();N(t('Negociação concluída.','Transaction complete.'))}else{dialog.current?.close();N(t('Saldo ou bens mudaram. Confira e tente novamente.','Funds or assets changed. Review and try again.'))}}}>{t('CONFIRMAR','CONFIRM')}</Btn><Btn bg="#fff" onClick={()=>dialog.current?.close()}>{t('CANCELAR','CANCEL')}</Btn></div>
  </>}</dialog>
 </section>
}
