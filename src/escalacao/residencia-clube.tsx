import {NEGOCIACAO_VEICULOS_LIBERADA} from './presidencia-veiculos-liberacao'
import {COMPRAS_BENS_PRESIDENCIA_LIBERADAS} from './presidencia-bens-liberacao'
import './residencia-interior.css'
import {useT,getLang} from './lang'
import {useState,lazy,Suspense,type ComponentProps} from 'react'
import {PresidenciaClube} from './presidencia-clube'
import {carteiraDaCarreira} from './presidencia-carreira'
import {conquistasDaCarreira} from './presidencia-conquistas'
import {totalTrofeus} from './presidencia-trofeus'
import {itemPresidencia} from './presidencia-economia'
import {BemMiniatura} from './presidencia-bem-miniatura'
import {GaragemDuplaSeletores} from './garagem-dupla-seletores'
import {EVOLUCAO_MORADIA} from './residencia-planta'
import {Btn} from './ui-primitives'
const Interior=lazy(()=>import('./residencia-interior'))
import './career-review.css'
type Props=ComponentProps<typeof PresidenciaClube>&{onVadico:()=>void}
/** Existing possessions get a new address; no ownership migration. */
export function ResidenciaClube(props:Props){
 const t=useT(),en=getLang()==='en'
 const [area,A]=useState('casa'),[notice,N]=useState('')
 const wallet=carteiraDaCarreira(props.state,props.mgrId),owned=wallet?.owned??[]
 const trophies=conquistasDaCarreira(props.state,props.mgrId)
 const vehicles=owned.filter(b=>['carro','duas-rodas'].includes(itemPresidencia(b.id)?.slot??'')),furniture=owned.filter(b=>!vehicles.includes(b))
 if(!wallet)return <p role="alert">{t('Não foi possível conferir seus bens. Sua casa e suas compras não foram alteradas. Reabra para tentar novamente.','Could not check your belongings. Your house and purchases were not changed. Reopen to try again.')}</p>
 const assets=(items:typeof owned,organize=false)=><div className="residencia-bens">{items.map(b=>{
  const item=itemPresidencia(b.id),atHome=wallet.homeFurniture?.includes(b.id)??false
  return <article key={b.id}><BemMiniatura id={b.id} className="residencia-bem-art"/><strong>{(en?item?.en:item?.pt)??b.id}</strong>
   <small>{organize?(atHome?t('Na sua casa','In your house'):t('No camarote','In the box')):t('Já pertence a você','Already yours')}</small>
   {organize&&props.onFurnitureHome&&<button className="residencia-mover" onClick={()=>{
    const ids=atHome?(wallet.homeFurniture??[]).filter(id=>id!==b.id):[...(wallet.homeFurniture??[]),b.id]
    if(props.onFurnitureHome?.(ids))N(atHome?t('Móvel levado ao camarote.','Furniture moved to the box.'):t('Móvel levado para casa.','Furniture moved home.'))
    else N(t('Não foi possível organizar os móveis. Reabra e tente novamente.','Could not arrange furniture. Reopen and try again.'))
   }}>{atHome?t('Mover ao camarote','Move to the box'):t('Mover para casa','Move home')}</button>}
  </article>
 })}</div>
 return <section className="residencia-painel" aria-label={t('Sua residência','Your home')}>
  <nav aria-label={t('Cômodos da casa','Rooms of the house')}>{[['casa',t('Minha casa','My house')],['garagem',t('Garagem','Garage')],['trofeus',t('Sala de troféus','Trophy room')],['moveis',t('Meus móveis','My furniture')],['perfil',t('Meu personagem','My character')]].map(([id,name])=><button key={id} aria-pressed={area===id} onClick={()=>{A(id);N('')}}>{name}</button>)}</nav>
  {!COMPRAS_BENS_PRESIDENCIA_LIBERADAS&&['casa','moveis'].includes(area)&&<p className="gp-rule">{t('Compras de bens da casa e garagem em breve. Seus bens já adquiridos continuam disponíveis.','Home and garage purchases are coming soon. Previously acquired assets remain available.')}</p>}
  {area==='casa'?<><div className="cr3-actions"><Btn bg="#fff" onClick={()=>A('moveis')}>{t('ORGANIZAR MEUS MÓVEIS','ARRANGE MY FURNITURE')}</Btn>{props.onFurnitureHome&&furniture.length>0&&!wallet.homeFurniture?.length&&<Btn onClick={()=>props.onFurnitureHome?.(furniture.map(b=>b.id))}>{t('LEVAR MEUS MÓVEIS PARA CASA','MOVE MY FURNITURE HOME')}</Btn>}</div><Suspense fallback={<p role="status">{t('Preparando sua casa…','Preparing your house…')}</p>}><Interior wallet={wallet}/></Suspense><div className="residencia-home"><div><h2>{t('Seu terreno. Sua casa.','Your land. Your house.')}</h2><p>{t('Você começa com um barraquinho e espaço para a garagem. As casas maiores ocuparão este mesmo terreno.','You start with a little shack and room for a garage. Bigger houses will take this same plot.')}</p><Btn bg="#fff" onClick={()=>A('casas')}>{t('PRÓXIMAS CASAS · EM BREVE','FUTURE HOUSES · COMING SOON')}</Btn><p>{t('Seus móveis, veículos e conquistas já registrados continuam preservados.','Your furniture, vehicles and achievements are kept.')}</p></div>
   <aside className="ll-residencia-summary"><section className="ll-desktop-panel"><h2>{t('Garagem','Garage')}</h2><div><p>{vehicles.length?t(`${vehicles.length} veículo(s) registrados na sua garagem.`,`${vehicles.length} vehicle(s) in your garage.`):t('As vagas estão vazias. Seus veículos aparecerão aqui.','The spots are empty. Your vehicles will appear here.')}</p><Btn onClick={()=>A('garagem')}>{t('VER MINHA GARAGEM','VIEW MY GARAGE')}</Btn><Btn bg="#fff" onClick={props.onVadico}>{NEGOCIACAO_VEICULOS_LIBERADA?t('VISITAR A VADICO','VISIT VADICO'):t('CONHECER VEÍCULOS · EM BREVE','VEHICLES · COMING SOON')}</Btn></div></section><section className="ll-desktop-panel"><h2>{t('Sua coleção','Your collection')}</h2><div><p>{t(`${totalTrofeus(trophies)} troféus · ${furniture.length} móveis registrados`,`${totalTrofeus(trophies)} trophies · ${furniture.length} furniture items`)}</p><Btn bg="#fff" onClick={()=>A('trofeus')}>{t('SALA DE TROFÉUS','TROPHY ROOM')}</Btn><Btn bg="#fff" onClick={()=>A('moveis')}>{t('MEUS MÓVEIS','MY FURNITURE')}</Btn></div></section></aside>
  </div></>:
  area==='casas'?<><h2>{t('Do barraquinho à mansão','From shack to mansion')}</h2><div className="residencia-bens">{EVOLUCAO_MORADIA.map(c=><article key={c.id}><strong>{c.name}</strong><p>{c.description}</p><small>{c.initial?t('Casa inicial','Starting house'):t('Compra pessoal em preparação','Personal purchase coming soon')}</small></article>)}</div><p role="status">{t('As casas maiores serão opcionais, com dinheiro real. Preços e compras ainda não estão habilitados nesta prévia. Nenhuma cobrança é feita aqui.','Bigger houses will be optional, with real money. Prices and purchases are not enabled in this preview yet. Nothing is charged here.')}</p></>:
  area==='garagem'?<><Suspense fallback={<p role="status">{t('Preparando sua garagem…','Preparing your garage…')}</p>}><Interior wallet={wallet} garage display={props.state.careerPresidency?.[props.mgrId]?.display}/></Suspense><h2>{t('Sua garagem','Your garage')}</h2>{!NEGOCIACAO_VEICULOS_LIBERADA&&<p role="status">{t('Negociação de veículos em breve. Seus carros continuam visíveis e preservados.','Vehicle trading is coming soon. Your cars remain visible and preserved.')}</p>}{vehicles.length?assets(vehicles):<p>{t('As vagas estão vazias. Visite a Vadico para conhecer os veículos.','The spots are empty. Visit Vadico to see the vehicles.')}</p>}{props.onDisplay&&<GaragemDuplaSeletores owned={owned} display={props.state.careerPresidency?.[props.mgrId]?.display} onDisplay={props.onDisplay} onError={N}/>}<Btn onClick={props.onVadico}>{NEGOCIACAO_VEICULOS_LIBERADA?t('VISITAR A VADICO VEÍCULOS','VISIT VADICO VEÍCULOS'):t('CONHECER VEÍCULOS · EM BREVE','VEHICLES · COMING SOON')}</Btn>{notice&&<p role="status">{notice}</p>}</>:
  area==='trofeus'?<><h2>{t('Sala de troféus','Trophy room')}</h2><p>{t('As conquistas registradas nesta carreira. O espaço começa dentro de casa; você pode construir o museu pelo mapa.','The titles won in this career. The room starts inside your house; you can build the club museum from the map.')}</p>{trophies.length?<div className="residencia-bens">{trophies.map(t=><article key={t.id}><strong>{t.label}</strong><span>🏆 × {t.count}</span></article>)}</div>:<p>{t('Os troféus aparecerão conforme as conquistas da carreira.','Trophies will show up as you win titles.')}</p>}</>:
  area==='moveis'?<><h2>{t('Seus móveis','Your furniture')}</h2><p>{t('Cada móvel fica na casa ou no camarote. Mover não vende nem compra: ele continua seu.','Each item is displayed at home or in the box. Moving it does not buy or sell it: it remains yours.')}</p>{furniture.length?assets(furniture,true):<p>{t('Você ainda não possui móveis registrados nesta carreira.','You have no furniture in this career yet.')}</p>}{notice&&<p role="status">{notice}</p>}</>:

  <PresidenciaClube {...props} insideMap profileOnly/>}
 </section>
}
