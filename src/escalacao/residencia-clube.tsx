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
 const [area,A]=useState('casa'),[notice,N]=useState('')
 const wallet=carteiraDaCarreira(props.state,props.mgrId),owned=wallet?.owned??[]
 const trophies=conquistasDaCarreira(props.state,props.mgrId)
 const vehicles=owned.filter(b=>['carro','duas-rodas'].includes(itemPresidencia(b.id)?.slot??'')),furniture=owned.filter(b=>!vehicles.includes(b))
 if(!wallet)return <p role="alert">Não foi possível conferir seus bens. Sua casa e suas compras não foram alteradas. Reabra para tentar novamente.</p>
 const assets=(items:typeof owned)=><div className="residencia-bens">{items.map(b=>{const item=itemPresidencia(b.id),art=arteCatalogoPresidencia(b.id);return <article key={b.id}>{art&&<img loading="lazy" src={import.meta.env.BASE_URL+art} alt=""/>}<strong>{item?.pt??b.id}</strong><small>Já pertence a você</small></article>})}</div>
 return <section className="residencia-painel" aria-label="Sua residência">
  <nav aria-label="Cômodos da casa">{[['casa','Minha casa'],['garagem','Garagem'],['trofeus','Sala de troféus'],['moveis','Meus móveis'],['perfil','Meu personagem']].map(([id,name])=><button key={id} aria-pressed={area===id} onClick={()=>{A(id);N('')}}>{name}</button>)}</nav>
  {area==='casa'?<><h2>Seu terreno. Sua casa.</h2><p>Você começa com um barraquinho e espaço para a garagem. As casas maiores ocuparão este mesmo terreno.</p><Btn onClick={()=>A('casas')}>VER EVOLUÇÃO DA CASA</Btn><p>Seus móveis, veículos e conquistas já registrados continuam preservados.</p><Btn bg="#fff" onClick={()=>props.onFinances?.()}>FINANÇAS DO CLUBE</Btn></>:
  area==='casas'?<><h2>Do barraquinho à mansão</h2><div className="residencia-bens">{EVOLUCAO_MORADIA.map(c=><article key={c.id}><strong>{c.name}</strong><p>{c.description}</p><small>{c.initial?'Casa inicial':'Compra pessoal em preparação'}</small></article>)}</div><p role="status">As casas maiores serão opcionais, com dinheiro real. Preços e compras ainda não estão habilitados nesta prévia. Nenhuma cobrança é feita aqui.</p></>:
  area==='garagem'?<><h2>Sua garagem</h2>{vehicles.length?assets(vehicles):<p>As vagas estão vazias. Visite a Vadico para conhecer os veículos.</p>}{props.onDisplay&&<GaragemDuplaSeletores owned={owned} display={props.state.careerPresidency?.[props.mgrId]?.display} onDisplay={props.onDisplay} onError={N}/>}<Btn onClick={props.onVadico}>VISITAR A VADICO VEÍCULOS</Btn>{notice&&<p role="status">{notice}</p>}</>:
  area==='trofeus'?<><h2>Sala de troféus</h2><p>As conquistas registradas nesta carreira. O espaço começa dentro de casa; um museu do clube pode vir depois.</p>{trophies.length?<div className="residencia-bens">{trophies.map(t=><article key={t.id}><strong>{t.label}</strong><span>🏆 × {t.count}</span></article>)}</div>:<p>Os troféus aparecerão conforme as conquistas da carreira.</p>}</>:
  area==='moveis'?<><h2>Seus móveis</h2>{furniture.length?assets(furniture):<p>Você ainda não possui móveis registrados nesta carreira.</p>}<p>Os bens antigos continuam seus. A decoração dos cômodos está em preparação.</p></>:
  <PresidenciaClube {...props} insideMap profileOnly/>}
 </section>
}
