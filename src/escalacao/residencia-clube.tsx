import {useT,getLang} from './lang'
import {useState,type ComponentProps} from 'react'
import {PresidenciaClube} from './presidencia-clube'
import {carteiraDaCarreira} from './presidencia-carreira'
import {conquistasDaCarreira} from './presidencia-conquistas'
import {itemPresidencia} from './presidencia-economia'
import {arteCatalogoPresidencia} from './presidencia-artes-disponiveis'
import {GaragemDuplaSeletores} from './garagem-dupla-seletores'
import {EVOLUCAO_MORADIA} from './residencia-planta'
import {Btn} from './ui-primitives'
type Props=ComponentProps<typeof PresidenciaClube>&{onVadico:()=>void}
/** Existing possessions get a new address; no ownership migration. */
export function ResidenciaClube(props:Props){
 const t=useT(),en=getLang()==='en'
 const [area,A]=useState('casa'),[notice,N]=useState('')
 const wallet=carteiraDaCarreira(props.state,props.mgrId),owned=wallet?.owned??[]
 const trophies=conquistasDaCarreira(props.state,props.mgrId)
 const vehicles=owned.filter(b=>['carro','duas-rodas'].includes(itemPresidencia(b.id)?.slot??'')),furniture=owned.filter(b=>!vehicles.includes(b))
 if(!wallet)return <p role="alert">{t('Não foi possível conferir seus bens. Sua casa e suas compras não foram alteradas. Reabra para tentar novamente.','Could not check your belongings. Your house and purchases were not changed. Reopen to try again.')}</p>
 const assets=(items:typeof owned)=><div className="residencia-bens">{items.map(b=>{const item=itemPresidencia(b.id),art=arteCatalogoPresidencia(b.id);return <article key={b.id}>{art&&<img loading="lazy" src={import.meta.env.BASE_URL+art} alt=""/>}<strong>{(en?item?.en:item?.pt)??b.id}</strong><small>{t('Já pertence a você','Already yours')}</small></article>})}</div>
 return <section className="residencia-painel" aria-label={t('Sua residência','Your home')}>
  <nav aria-label={t('Cômodos da casa','Rooms of the house')}>{[['casa',t('Minha casa','My house')],['garagem',t('Garagem','Garage')],['trofeus',t('Sala de troféus','Trophy room')],['moveis',t('Meus móveis','My furniture')],['perfil',t('Meu personagem','My character')]].map(([id,name])=><button key={id} aria-pressed={area===id} onClick={()=>{A(id);N('')}}>{name}</button>)}</nav>
  {area==='casa'?<><h2>{t('Seu terreno. Sua casa.','Your land. Your house.')}</h2><p>{t('Você começa com um barraquinho e espaço para a garagem. As casas maiores ocuparão este mesmo terreno.','You start with a little shack and room for a garage. Bigger houses will take this same plot.')}</p><Btn onClick={()=>A('casas')}>{t('VER EVOLUÇÃO DA CASA','SEE HOUSE UPGRADES')}</Btn><p>{t('Seus móveis, veículos e conquistas já registrados continuam preservados.','Your furniture, vehicles and achievements are kept.')}</p><Btn bg="#fff" onClick={()=>props.onFinances?.()}>{t('FINANÇAS DO CLUBE','CLUB FINANCES')}</Btn></>:
  area==='casas'?<><h2>{t('Do barraquinho à mansão','From shack to mansion')}</h2><div className="residencia-bens">{EVOLUCAO_MORADIA.map(c=><article key={c.id}><strong>{c.name}</strong><p>{c.description}</p><small>{c.initial?t('Casa inicial','Starting house'):t('Compra pessoal em preparação','Personal purchase coming soon')}</small></article>)}</div><p role="status">{t('As casas maiores serão opcionais, com dinheiro real. Preços e compras ainda não estão habilitados nesta prévia. Nenhuma cobrança é feita aqui.','Bigger houses will be optional, with real money. Prices and purchases are not enabled in this preview yet. Nothing is charged here.')}</p></>:
  area==='garagem'?<><h2>{t('Sua garagem','Your garage')}</h2>{vehicles.length?assets(vehicles):<p>{t('As vagas estão vazias. Visite a Vadico para conhecer os veículos.','The spots are empty. Visit Vadico to see the vehicles.')}</p>}{props.onDisplay&&<GaragemDuplaSeletores owned={owned} display={props.state.careerPresidency?.[props.mgrId]?.display} onDisplay={props.onDisplay} onError={N}/>}<Btn onClick={props.onVadico}>{t('VISITAR A VADICO VEÍCULOS','VISIT VADICO VEÍCULOS')}</Btn>{notice&&<p role="status">{notice}</p>}</>:
  area==='trofeus'?<><h2>{t('Sala de troféus','Trophy room')}</h2><p>{t('As conquistas registradas nesta carreira. O espaço começa dentro de casa; um museu do clube pode vir depois.','The titles won in this career. The room starts inside your house; a club museum may come later.')}</p>{trophies.length?<div className="residencia-bens">{trophies.map(t=><article key={t.id}><strong>{t.label}</strong><span>🏆 × {t.count}</span></article>)}</div>:<p>{t('Os troféus aparecerão conforme as conquistas da carreira.','Trophies will show up as you win titles.')}</p>}</>:
  area==='moveis'?<><h2>{t('Seus móveis','Your furniture')}</h2>{furniture.length?assets(furniture):<p>{t('Você ainda não possui móveis registrados nesta carreira.','You have no furniture in this career yet.')}</p>}<p>{t('Os bens antigos continuam seus. A decoração dos cômodos está em preparação.','Your old items are still yours. Room decoration is coming soon.')}</p></>:
  <PresidenciaClube {...props} insideMap profileOnly/>}
 </section>
}
